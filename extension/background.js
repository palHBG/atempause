// Atempause background worker.
// Every listed site gets a redirect rule to breathe.html (original URL after '#').
// "Continue" adds a short-lived allow rule for that site. When it runs out, the alarm removes
// the rule and sends every open tab of that site back to the breathing page.
// Unpacked install kept current by a git pull on the laptop: a periodic check reloads the
// extension as soon as the manifest version on disk differs from the running one.

const DEFAULTS = {
  sites: ['facebook.com', 'youtube.com'],
  graceMinutes: 1,
  breaths: 1,
};
const ALLOW_BASE = 10000;

async function getSettings() {
  const { settings } = await chrome.storage.sync.get('settings');
  return { ...DEFAULTS, ...(settings || {}) };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function syncRules() {
  const { sites } = await getSettings();
  const page = chrome.runtime.getURL('breathe.html');
  const addRules = sites.map((domain, i) => ({
    id: i + 1,
    priority: 1,
    action: { type: 'redirect', redirect: { regexSubstitution: page + '#\\0' } },
    condition: {
      regexFilter: `^https?://([^/]*\\.)?${escapeRe(domain)}([/:?#].*)?$`,
      resourceTypes: ['main_frame'],
    },
  }));
  const old = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: old.map((r) => r.id),
    addRules,
  });
  // site list changed: drop all running free passes, their ids may no longer match
  const session = await chrome.declarativeNetRequest.getSessionRules();
  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: session.map((r) => r.id) });
  for (const a of await chrome.alarms.getAll()) {
    if (a.name.startsWith('expire:')) await chrome.alarms.clear(a.name);
  }
}

async function allow(host, minutes) {
  const { sites } = await getSettings();
  const idx = sites.findIndex((d) => host === d || host.endsWith('.' + d));
  if (idx < 0) return;
  const id = ALLOW_BASE + idx;
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [id],
    addRules: [{
      id,
      priority: 2,
      action: { type: 'allow' },
      condition: { requestDomains: [sites[idx]], resourceTypes: ['main_frame'] },
    }],
  });
  await chrome.alarms.create('expire:' + sites[idx], { when: Date.now() + Math.max(1, minutes) * 60000 });
}

async function expire(site) {
  const { sites } = await getSettings();
  const idx = sites.indexOf(site);
  if (idx >= 0) {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ALLOW_BASE + idx] });
  }
  const page = chrome.runtime.getURL('breathe.html');
  for (const tab of await chrome.tabs.query({})) {
    let host = '';
    try { host = new URL(tab.url).hostname; } catch (e) { continue; }
    if (host === site || host.endsWith('.' + site)) {
      chrome.tabs.update(tab.id, { url: page + '#' + tab.url });
    }
  }
}

async function checkForUpdate() {
  try {
    const res = await fetch(chrome.runtime.getURL('manifest.json'), { cache: 'no-store' });
    const onDisk = (await res.json()).version;
    if (onDisk && onDisk !== chrome.runtime.getManifest().version) chrome.runtime.reload();
  } catch (e) { /* manifest mid-write during a pull: try again next time */ }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('expire:')) await expire(alarm.name.slice(7));
  if (alarm.name === 'update-check') await checkForUpdate();
});
chrome.alarms.create('update-check', { periodInMinutes: 1 });

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg && msg.type === 'allow') {
    allow(msg.host, msg.minutes).then(() => reply({ ok: true }));
    return true;
  }
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await syncRules();
  if (reason === 'install') chrome.runtime.openOptionsPage();
});
chrome.runtime.onStartup.addListener(syncRules);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings) syncRules();
});
