import { app, BrowserWindow } from "electron";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-experience-audit-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

const wait = (duration = 140) => new Promise((resolve) => setTimeout(resolve, duration));

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1440,
    height: 900,
    webPreferences: {
      preload: join(fixtureDir, "organization-center-preload.cjs"),
      contextIsolation: true,
      sandbox: false
    }
  });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await wait(300);
    const pages = ["today", "work", "feedback", "command", "chat", "idea", "organization", "release", "operations", "engineering"];
    const metrics = [];
    for (const page of pages) {
      await window.webContents.executeJavaScript(`document.querySelector('[data-page="${page}"]').click()`);
      await wait();
      metrics.push(await window.webContents.executeJavaScript(`(() => {
        const root = document.querySelector('[data-page-view="${page}"]');
        const visible = (node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const textNodes = [...root.querySelectorAll('*')].filter((node) => {
          if (!visible(node)) return false;
          const ownText = [...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
          return ownText || node.matches('input, select, textarea');
        });
        const sizes = textNodes.map((node) => Number.parseFloat(getComputedStyle(node).fontSize));
        const actions = [...root.querySelectorAll('button, input, select, textarea, summary, [role="button"]')]
          .filter(visible)
          .map((node) => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }));
        const bucket = (value) => sizes.filter((size) => size === value).length;
        return {
          page: '${page}',
          text_elements: sizes.length,
          font_px: { le_8: sizes.filter((size) => size <= 8).length, px_9: bucket(9), px_10: bucket(10), px_11: bucket(11), px_12_13: sizes.filter((size) => size >= 12 && size <= 13).length, ge_14: sizes.filter((size) => size >= 14).length },
          actionable_elements: actions.length,
          action_height_lt_32: actions.filter(({ height }) => height < 32).length,
          action_height_lt_36: actions.filter(({ height }) => height < 36).length
        };
      })()`));
      const image = await window.webContents.capturePage();
      await writeFile(join(tmpdir(), `arcorbit-experience-audit-${page}.png`), image.toPNG());
    }
    process.stdout.write(`${JSON.stringify({ pages, metrics })}\n`);
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  app.exit(1);
});
