import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-chat-content-overflow-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1440,
    height: 900,
    webPreferences: { preload: join(fixtureDir, "organization-center-preload.cjs"), contextIsolation: true, sandbox: false }
  });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await new Promise((resolve) => setTimeout(resolve, 300));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
      document.querySelector('[data-page="chat"]').click();
      for (let attempt = 0; attempt < 50 && !document.querySelector('.chat-code-block pre'); attempt += 1) await wait(20);
      const pre = document.querySelector('.chat-code-block pre');
      if (!pre) throw new Error('Chat overflow fixture did not render a code viewer.');
      const measure = (selector) => {
        const element = document.querySelector(selector);
        return { client_width: element.clientWidth, scroll_width: element.scrollWidth };
      };
      const message = document.querySelector('[data-conversation-message-id="OVERFLOW-MESSAGE"]');
      const content = message.querySelector('.chat-message-content');
      const block = message.querySelector('.chat-code-block');
      const transcript = document.querySelector('#chatTranscript');
      const before = { left: pre.scrollLeft, top: pre.scrollTop };
      pre.scrollLeft = 240;
      pre.scrollTop = 240;
      const style = getComputedStyle(pre);
      return {
        viewport: measure('html'),
        view_host: measure('.view-host'),
        chat_view: measure('#chatView'),
        workspace: measure('.chat-workspace'),
        main: measure('.chat-main'),
        transcript: measure('#chatTranscript'),
        message_within_transcript: message.getBoundingClientRect().right <= transcript.getBoundingClientRect().right + 1,
        content_within_message: content.getBoundingClientRect().right <= message.getBoundingClientRect().right + 1,
        block_within_content: block.getBoundingClientRect().right <= content.getBoundingClientRect().right + 1,
        viewer: {
          client_width: pre.clientWidth,
          scroll_width: pre.scrollWidth,
          client_height: pre.clientHeight,
          scroll_height: pre.scrollHeight,
          overflow_x: style.overflowX,
          overflow_y: style.overflowY,
          initial_left: before.left,
          initial_top: before.top,
          scrolled_left: pre.scrollLeft,
          scrolled_top: pre.scrollTop
        }
      };
    })()`);
    await new Promise((resolve) => process.stdout.write(`${JSON.stringify(result)}\n`, resolve));
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch(async (error) => {
  await new Promise((resolve) => process.stderr.write(`${error.stack || error.message}\n`, resolve));
  app.exit(1);
});
