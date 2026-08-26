import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureUserData = path.join(tmpdir(), `arcorbit-today-guidance-concepts-${process.pid}`);
const screenshotPaths = {
  focus: path.join(tmpdir(), "arcorbit-today-guidance-focus.png"),
  journey: path.join(tmpdir(), "arcorbit-today-guidance-journey.png"),
  portfolio: path.join(tmpdir(), "arcorbit-today-guidance-portfolio.png"),
  module: path.join(tmpdir(), "arcorbit-today-guidance-module.png")
};

app.setName("ArcOrbit Today Guidance Concepts");
app.setPath("userData", fixtureUserData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width: 1500,
    height: 1100,
    show: false,
    webPreferences: { sandbox: true }
  });
  const errors = [];
  window.webContents.on("console-message", (_event, level, message) => {
    if (level >= 2) errors.push(message);
  });
  try {
    await window.loadFile(path.join(here, "index.html"));
    await new Promise((resolve) => setTimeout(resolve, 150));
    await writeFile(screenshotPaths.focus, (await window.webContents.capturePage()).toPNG());
    const result = await window.webContents.executeJavaScript(`(() => {
      const concepts = [...document.querySelectorAll('[data-concept]')];
      const modules = [...document.querySelectorAll('[data-module]')];
      const initialAction = document.querySelector('[data-complete="workspace"]')?.textContent.trim();
      concepts.find((item) => item.dataset.concept === 'journey').click();
      const journeySteps = document.querySelectorAll('.journey-step').length;
      concepts.find((item) => item.dataset.concept === 'portfolio').click();
      const readinessCells = document.querySelectorAll('.readiness-grid > div').length;
      modules.find((item) => item.dataset.module === 'work').click();
      const workGuidance = document.querySelector('#moduleCanvas')?.textContent.includes('绑定本地目录');
      concepts.find((item) => item.dataset.concept === 'focus').click();
      document.querySelector('[data-complete="workspace"]')?.click();
      const nextAction = document.querySelector('[data-complete="authorization"]')?.textContent.trim();
      return { conceptCount: concepts.length, moduleCount: modules.length, initialAction, journeySteps, readinessCells, workGuidance, nextAction };
    })()`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await window.webContents.executeJavaScript(`document.querySelector('[data-concept="journey"]').click()`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await writeFile(screenshotPaths.journey, (await window.webContents.capturePage()).toPNG());
    await window.webContents.executeJavaScript(`document.querySelector('[data-concept="portfolio"]').click()`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await writeFile(screenshotPaths.portfolio, (await window.webContents.capturePage()).toPNG());
    await window.webContents.executeJavaScript(`(() => { document.querySelector('[data-concept="focus"]').click(); document.querySelector('[data-module="work"]').click(); window.scrollTo(0, document.body.scrollHeight); })()`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await writeFile(screenshotPaths.module, (await window.webContents.capturePage()).toPNG());
    const completion = await window.webContents.executeJavaScript(`(() => {
      document.querySelector('#resetButton').click();
      let actionCount = 0;
      while (document.querySelector('[data-complete]') && actionCount < 6) {
        document.querySelector('[data-complete]').click();
        actionCount += 1;
      }
      return { actionCount, ready: document.querySelector('#todayCanvas')?.textContent.includes('ArcOrbit 可以开始领取工作') };
    })()`);
    process.stdout.write(`${JSON.stringify({ ...result, completion, screenshotPaths, errors })}\n`);
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
