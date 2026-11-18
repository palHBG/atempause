// Renders the per-site counters kept by breathe.js into a table.
async function renderStats(table, days) {
  const stats = (await chrome.storage.local.get('stats')).stats || {};
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const from = cutoff.toLocaleDateString('sv-SE');
  const sum = {};
  for (const [day, sites] of Object.entries(stats)) {
    if (day < from) continue;
    for (const [site, v] of Object.entries(sites)) {
      sum[site] = sum[site] || { tries: 0, backs: 0 };
      sum[site].tries += v.tries;
      sum[site].backs += v.backs;
    }
  }
  const rows = Object.entries(sum).sort((a, b) => b[1].tries - a[1].tries);
  table.innerHTML = '';
  if (!rows.length) {
    table.innerHTML = '<tr><td class="muted">Noch nichts. Gutes Zeichen.</td></tr>';
    return;
  }
  const head = table.insertRow();
  head.innerHTML = '<th>Website</th><th>Versuche</th><th>Nicht geöffnet</th>';
  for (const [site, v] of rows) {
    const r = table.insertRow();
    r.insertCell().textContent = site;
    r.insertCell().textContent = v.tries;
    r.insertCell().textContent = v.backs;
  }
}
