import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-chat-stream-performance-${process.pid}`);
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
    await new Promise((resolveWait) => setTimeout(resolveWait, 300));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
      document.querySelector('[data-page="chat"]').click();
      await wait(80);
      const transcript = document.querySelector('#chatTranscript');
      const streamSelector = '[data-conversation-message-id="STREAM-MESSAGE"]';

      document.querySelector('[data-chat-session-id="CHAT-B"]').click();
      while (!document.querySelector('[data-chat-session-id="CHAT-B"]').classList.contains('is-active')) await wait(1);
      await wait(30);
      transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'instant' });
      transcript.dispatchEvent(new Event('scroll'));
      transcript.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));
      const targetReadingTop = Math.max(0, transcript.scrollHeight - transcript.clientHeight - 500);
      transcript.scrollTop = targetReadingTop;
      transcript.dispatchEvent(new Event('scroll'));

      document.querySelector('[data-chat-session-id="CHAT-A"]').click();
      while (!document.querySelector('[data-chat-session-id="CHAT-A"]').classList.contains('is-active')) await wait(1);
      await wait(30);
      const initialStreamNode = transcript.querySelector(streamSelector);
      const initialSessionNode = document.querySelector('[data-chat-session-id="CHAT-A"]');
      transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'instant' });
      transcript.dispatchEvent(new Event('scroll'));
      await window.arckitDesktop.setTestChatSnapshotDelay(180);
      const callsBefore = (await window.arckitDesktop.getTestCalls()).length;
      await window.arckitDesktop.emitTestChatStream({ count: 300, interval_ms: 1 });
      while ((await window.arckitDesktop.getTestChatStreamState()).emitted < 30) await wait(2);

      const sessionNodeStable = document.querySelector('[data-chat-session-id="CHAT-A"]') === initialSessionNode;
      transcript.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));
      const readingTop = Math.max(0, transcript.scrollHeight - transcript.clientHeight - 500);
      transcript.scrollTop = readingTop;
      transcript.dispatchEvent(new Event('scroll'));
      const scrollSamples = [];
      for (let index = 0; index < 10; index += 1) {
        await wait(10);
        scrollSamples.push(transcript.scrollTop);
      }
      const streamNodeStable = transcript.querySelector(streamSelector) === initialStreamNode;
      const jumpVisible = !document.querySelector('#chatJumpLatestButton').classList.contains('hidden');

      const switchStarted = performance.now();
      document.querySelector('[data-chat-session-id="CHAT-B"]').click();
      while (!document.querySelector('[data-chat-session-id="CHAT-B"]').classList.contains('is-active') && performance.now() - switchStarted < 500) await wait(1);
      const switchElapsed = Number((performance.now() - switchStarted).toFixed(2));
      await wait(40);
      const targetNode = transcript.querySelector('[data-conversation-message-id="TARGET-MESSAGE"]');
      const targetScrollSamples = [];
      for (let index = 0; index < 10; index += 1) {
        await wait(10);
        targetScrollSamples.push(transcript.scrollTop);
      }
      const callsBeforeStructural = (await window.arckitDesktop.getTestCalls()).slice(callsBefore);
      await window.arckitDesktop.emitTestChatEvent({ type: 'chat.turn.completed', session_id: 'CHAT-A' });
      await wait(240);
      targetScrollSamples.push(transcript.scrollTop);
      const callsAfterStructural = (await window.arckitDesktop.getTestCalls()).slice(callsBefore);
      const state = await window.arckitDesktop.getTestChatStreamState();
      return {
        stream: {
          emitted_before_switch: state.emitted,
          session_node_stable: sessionNodeStable,
          message_node_stable: streamNodeStable,
          jump_visible: jumpVisible,
          scroll_min: Math.min(...scrollSamples),
          scroll_max: Math.max(...scrollSamples),
          reading_top: readingTop
        },
        switching: {
          elapsed_ms: switchElapsed,
          target_active: document.querySelector('[data-chat-session-id="CHAT-B"]').classList.contains('is-active'),
          target_visible: transcript.textContent.includes('Target transcript'),
          target_node_stable: transcript.querySelector('[data-conversation-message-id="TARGET-MESSAGE"]') === targetNode,
          restored_scroll_top: targetScrollSamples[0],
          expected_scroll_top: targetReadingTop,
          scroll_min: Math.min(...targetScrollSamples),
          scroll_max: Math.max(...targetScrollSamples)
        },
        chat_snapshot_calls_during_stream: callsBeforeStructural.filter(([name]) => name === 'chatSnapshot').length,
        chat_snapshot_calls_after_structural_event: callsAfterStructural.filter(([name]) => name === 'chatSnapshot').length
      };
    })()`);
    await new Promise((resolveWrite) => process.stdout.write(`${JSON.stringify(result)}\n`, resolveWrite));
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch(async (error) => {
  await new Promise((resolveWrite) => process.stderr.write(`${error.stack || error.message}\n`, resolveWrite));
  app.exit(1);
});
