// Atempause: one breathing page for two platforms.
// Chrome extension: opened by a redirect rule, the original URL follows the '#'.
// iPhone (GitHub Pages): opened by a Shortcuts automation as ?app=instagram.

const INHALE = 4000;
const EXHALE = 5000;
const DEFAULT_GRACE = 1;
const DEFAULT_BREATHS = 1;

// Known iPhone apps: display name, URL scheme, and web link that iOS opens straight in the app.
const APPS = {
  instagram: ['Instagram', 'instagram://', 'https://www.instagram.com/'],
  tiktok: ['TikTok', 'tiktok://', 'https://www.tiktok.com/'],
  youtube: ['YouTube', 'youtube://', 'https://www.youtube.com/'],
  x: ['X', 'twitter://', 'https://x.com/'],
  twitter: ['X', 'twitter://', 'https://x.com/'],
  facebook: ['Facebook', 'fb://', 'https://www.facebook.com/'],
  reddit: ['Reddit', 'reddit://', 'https://www.reddit.com/'],
  linkedin: ['LinkedIn', 'linkedin://', 'https://www.linkedin.com/'],
  whatsapp: ['WhatsApp', 'whatsapp://'],
  snapchat: ['Snapchat', 'snapchat://'],
  netflix: ['Netflix', 'nflx://'],
  spiegel: ['Spiegel', 'spiegelonline://'],
};

const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
const today = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD, local time

// ---------- platform adapters ----------

function extensionAdapter() {
  const href = location.href;
  const target = href.slice(href.indexOf("#") + 1);
  let host = '';
  try { host = new URL(target).hostname.replace(/^www\./, ''); } catch (e) {}
  return {
    key: host,
    name: host,
    async settings() {
      const { settings } = await chrome.storage.sync.get('settings');
      return { graceMinutes: DEFAULT_GRACE, breaths: DEFAULT_BREATHS, ...(settings || {}) };
    },
    async loadStats() { return (await chrome.storage.local.get('stats')).stats || {}; },
    async saveStats(stats) { await chrome.storage.local.set({ stats }); },
    async go(minutes) {
      await chrome.runtime.sendMessage({ type: 'allow', host, minutes });
      location.replace(target);
    },
    async back() {
      if (history.length > 1) { history.back(); return true; }
      const tab = await chrome.tabs.getCurrent();
      if (tab) { chrome.tabs.remove(tab.id); return true; }
      return false;
    },
  };
}

function webAdapter() {
  const p = new URLSearchParams(location.search);
  const key = (p.get('app') || '').toLowerCase();
  const known = APPS[key] || [];
  const name = p.get('name') || known[0] || key || 'the app';
  const scheme = p.get('scheme') || known[1] || '';
  const link = p.get('link') || known[2] || scheme;
  // direct=1: the automation already stamped the time, so jump straight into the app
  // (no Shortcuts round trip, no Shortcuts app flashing up).
  const direct = p.get('direct') === '1';
  const store = 'atempause-stats';
  return {
    key: key || 'app',
    name,
    async settings() {
      return {
        graceMinutes: Number(p.get('grace')) || DEFAULT_GRACE,
        breaths: Number(p.get('breaths')) || DEFAULT_BREATHS,
      };
    },
    async loadStats() { try { return JSON.parse(localStorage.getItem(store)) || {}; } catch (e) { return {}; } },
    async saveStats(stats) { try { localStorage.setItem(store, JSON.stringify(stats)); } catch (e) {} },
    async go() {
      if (direct && link) { location.href = link; return; }
      // The "Atempause Continue" shortcut stamps the time, then iOS opens the app via x-success.
      const url = 'shortcuts://x-callback-url/run-shortcut'
        + '?name=' + encodeURIComponent('Atempause Continue')
        + '&input=text&text=' + encodeURIComponent(key)
        + (scheme ? '&x-success=' + encodeURIComponent(scheme) : '');
      location.href = url;
    },
    async back() { return false; },
  };
}

const P = isExtension ? extensionAdapter() : webAdapter();

// ---------- stats ----------

async function bump(field) {
  const stats = await P.loadStats();
  const d = today();
  // keep 60 days
  for (const k of Object.keys(stats)) {
    if ((Date.parse(d) - Date.parse(k)) / 864e5 > 60) delete stats[k];
  }
  stats[d] = stats[d] || {};
  const s = (stats[d][P.key] = stats[d][P.key] || { tries: 0, backs: 0 });
  s[field] += 1;
  await P.saveStats(stats);
  return s;
}

// ---------- flow ----------

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

async function say(text) {
  const el = $('prompt');
  el.classList.add('fade');
  await wait(350);
  el.textContent = text;
  el.classList.remove('fade');
}

async function breathe(n) {
  const wrap = $('breath');
  document.documentElement.style.setProperty('--inhale', INHALE / 1000 + 's');
  document.documentElement.style.setProperty('--exhale', EXHALE / 1000 + 's');
  await wait(600);
  for (let i = 0; i < n; i++) {
    wrap.classList.remove('exhale');
    wrap.classList.add('inhale');
    say(i === 0 ? 'Breathe in deeply' : 'And in once more');
    await wait(INHALE);
    wrap.classList.remove('inhale');
    wrap.classList.add('exhale');
    say('And slowly breathe out');
    await wait(EXHALE);
  }
}

function times(n) { return n === 1 ? 'once' : n === 2 ? 'twice' : n + ' times'; }

async function main() {
  const settings = await P.settings();
  const s = await bump('tries');

  await breathe(Math.max(1, Math.min(5, settings.breaths)));

  $('headline').textContent = s.tries === 1
    ? `Do you really want to open ${P.name}?`
    : `${P.name}, ${times(s.tries)} today.`;
  $('subline').textContent = s.backs > 0
    ? `You decided against it ${times(s.backs)} today.`
    : 'Take a moment to notice whether you really want this right now.';
  $('btn-go').textContent = `Continue to ${P.name}`;
  $('hint').textContent = `Then ${settings.graceMinutes} min without a pause.`;
  show('choice');

  $('btn-back').onclick = async () => {
    const after = await bump('backs');
    const handled = await P.back();
    if (!handled) {
      $('done-sub').textContent = after.backs === 1
        ? 'Consciously not opened once today.'
        : `Consciously not opened ${times(after.backs)} today.`;
      show('done');
    }
  };
  $('btn-go').onclick = () => P.go(settings.graceMinutes);
}

main();
