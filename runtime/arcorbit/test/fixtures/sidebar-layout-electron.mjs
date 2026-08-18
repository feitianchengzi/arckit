import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const fixtureUserData = join(tmpdir(), `arckit-layout-${process.pid}`);

app.setName("Arckit Layout Fixture");
app.setPath("userData", fixtureUserData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
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
        const todayView = document.querySelector('[data-page-view="today"]');
        const commandView = document.querySelector('[data-page-view="command"]');
        const commandGrid = commandView.querySelector('.command-grid');
        todayView.classList.remove('is-active');
        commandView.classList.add('is-active');
        void commandGrid.offsetWidth;
        const commandColumns = getComputedStyle(commandGrid).gridTemplateColumns.split(' ').length;
        commandView.classList.remove('is-active');
        todayView.classList.add('is-active');
        return {
          sidebarWidth: rect('.sidebar').width,
          titlebarHeight: rect('.titlebar').height,
          commandbarHeight: rect('.commandbar').height,
          viewCount: views.length,
          activeViewDisplay: getComputedStyle(document.querySelector('[data-page-view="today"]')).display,
          hiddenViewDisplays: views.filter((view) => view.dataset.pageView !== 'today').map((view) => getComputedStyle(view).display),
          metricColumns: getComputedStyle(document.querySelector('.metric-grid')).gridTemplateColumns.split(' ').length,
          productColumns: getComputedStyle(document.querySelector('.product-grid')).gridTemplateColumns.split(' ').length,
          platformColumns: getComputedStyle(document.querySelector('.platform-two-column')).gridTemplateColumns.split(' ').length,
          commandColumns,
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
    await rm(fixtureUserData, { recursive: true, force: true });
    app.exit(process.exitCode || 0);
  }
}).catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  app.exit(1);
});
