import { app, BrowserWindow } from "electron";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-feedback-v2-images-${process.pid}`);
const resultFile = process.env.ARCORBIT_ELECTRON_RESULT_FILE;
app.setPath("userData", userData);
app.disableHardwareAcceleration();

async function emitResult(value) {
  const output = `${JSON.stringify(value)}\n`;
  if (resultFile) await writeFile(resultFile, output, "utf8");
  else process.stdout.write(output);
}

app.whenReady().then(async () => {
  const errors = [];
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
  window.webContents.on("console-message", (_event, level, message, lineNumber, sourceId) => {
    if (level >= 2) errors.push(`${message} @ ${sourceId}:${lineNumber}`);
  });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const wait = () => new Promise((resolve) => setTimeout(resolve, 60));
      const waitFor = async (selector, attempts = 50) => {
        for (let attempt = 0; attempt < attempts; attempt += 1) {
          const element = document.querySelector(selector);
          if (element) return element;
          await wait();
        }
        throw new Error('Timed out waiting for ' + selector);
      };
      const productScope = await waitFor('#productScopeSelect');
      productScope.value = '11';
      productScope.dispatchEvent(new Event('change', { bubbles: true }));
      (await waitFor('[data-page="feedback"]')).click();
      const retry = await waitFor('[data-feedback-image-retry*="feedback-v2"]');
      const conversationVisibleAfterFailure = Boolean(document.querySelector('.feedback-message-list'));
      retry.click();
      const image = await waitFor('[data-feedback-image*="feedback-v2"] img[src^="data:image/png"]');
      image.closest('[data-feedback-image]').click();
      await wait();
      return {
        selectedFeedbackId: document.querySelector('#ordinaryFeedbackTable [data-feedback-select].is-active')?.dataset.feedbackSelect || '',
        conversationVisibleAfterFailure,
        retryVisible: true,
        imageLoadedAfterRetry: Boolean(document.querySelector('[data-feedback-image*="feedback-v2"] img[src^="data:image/png"]')),
        calls: await window.arckitDesktop.getTestCalls()
      };
    })()`);
    await emitResult({ ...result, errors });
  } catch (error) {
    await emitResult({ fixture_error: error?.stack || error?.message || String(error), errors });
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch(async (error) => {
  await emitResult({ fixture_error: error?.stack || error?.message || String(error), errors: [] });
  app.exit(1);
});
