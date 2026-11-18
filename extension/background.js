// Atempause background worker.
// Every listed site gets a redirect rule to breathe.html (original URL after '#').
// "Weiter" adds a short-lived allow rule for that site, removed again by an alarm.

const DEFAULTS = {
  sites: ['facebook.com', 'youtube.com'],
  graceMinutes: 10,
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
  await chrome.alarms.clearAll();
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
  await chrome.alarms.create('expire:' + id, { when: Date.now() + Math.max(1, minutes) * 60000 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('expire:')) return;
  const id = Number(alarm.name.slice(7));
  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [id] });
});

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
