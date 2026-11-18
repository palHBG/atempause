const DEFAULTS = {
  sites: ['facebook.com', 'youtube.com'],
  graceMinutes: 10,
  breaths: 1,
};

function clean(line) {
  return line.trim().toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[/?#:].*$/, '')
    .replace(/^www\./, '');
}

async function load() {
  const { settings } = await chrome.storage.sync.get('settings');
  const s = { ...DEFAULTS, ...(settings || {}) };
  document.getElementById('sites').value = s.sites.join('\n');
  document.getElementById('grace').value = s.graceMinutes;
  document.getElementById('breaths').value = s.breaths;
  renderStats(document.getElementById('stats'), 7);
}

document.getElementById('save').onclick = async () => {
  const sites = [...new Set(document.getElementById('sites').value.split('\n').map(clean).filter((d) => d.includes('.')))];
  const graceMinutes = Math.min(240, Math.max(1, Number(document.getElementById('grace').value) || 10));
  const breaths = Math.min(5, Math.max(1, Number(document.getElementById('breaths').value) || 1));
  await chrome.storage.sync.set({ settings: { sites, graceMinutes, breaths } });
  document.getElementById('sites').value = sites.join('\n');
  const el = document.getElementById('saved');
  el.textContent = 'Saved.';
  setTimeout(() => (el.textContent = ''), 2000);
};

load();
