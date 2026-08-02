import { app, BrowserWindow } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));

await app.whenReady();

const window = new BrowserWindow({
  show: false,
  width: 1280,
  height: 820,
  webPreferences: {
    sandbox: true
  }
});

try {
  await window.loadFile(join(fixtureDir, "sidebar-layout.html"));
  const measurements = await window.webContents.executeJavaScript(`
    (() => {
      const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
      const views = Array.from(document.querySelectorAll('[data-page-view]'));
      return {
        sidebarWidth: rect('.sidebar').width,
        titlebarHeight: rect('.titlebar').height,
        commandbarHeight: rect('.commandbar').height,
        viewCount: views.length,
        activeViewDisplay: getComputedStyle(document.querySelector('[data-page-view="command"]')).display,
        hiddenViewDisplays: views.filter((view) => view.dataset.pageView !== 'command').map((view) => getComputedStyle(view).display),
        metricColumns: getComputedStyle(document.querySelector('.metric-grid')).gridTemplateColumns.split(' ').length,
        commandColumns: getComputedStyle(document.querySelector('.command-grid')).gridTemplateColumns.split(' ').length,
        minBodyWidth: getComputedStyle(document.documentElement).minWidth
      };
    })()
  `);
  process.stdout.write(`${JSON.stringify(measurements)}\n`);
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
} finally {
  window.destroy();
  app.exit(process.exitCode || 0);
}
