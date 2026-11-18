// Renders the orb icon at 16/48/128 px with the preinstalled Playwright.
const { chromium } = require(process.env.PW || 'playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage();
  for (const s of [16, 48, 128]) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent(`<body style="margin:0;background:transparent"><div style="width:${s}px;height:${s}px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#8cc6e2,#2f6f96)"></div></body>`);
    await p.screenshot({ path: path.join(__dirname, '..', 'extension', 'icons', `${s}.png`), omitBackground: true });
  }
  await b.close();
})();
