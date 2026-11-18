import { app, BrowserWindow } from 'electron';
import { mkdir, writeFile, rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const here = dirname(fileURLToPath(import.meta.url));
const userData = await mkdtemp(join(tmpdir(), 'arcorbit-window-test-'));
const output = process.env.ARCORBIT_TEST_OUTPUT || await mkdtemp(join(tmpdir(), 'arcorbit-window-evidence-'));
app.setPath('userData', userData); app.disableHardwareAcceleration();
app.whenReady().then(async () => {
const w = new BrowserWindow({ show: false, width: 1200, height: 900, webPreferences: { backgroundThrottling: false } });
try {
  await w.loadFile(join(here, '../../desktop/renderer/index.html'));
  const result = await w.webContents.executeJavaScript(`(async () => {
    const { createConversationSurface } = await import('./conversation-surface.mjs');
    const wait = () => new Promise(r => setTimeout(r, 70));
    document.body.innerHTML = '<div id="messages" style="height:500px;width:800px;overflow:auto;overflow-anchor:none"></div><button id="latest">latest</button>';
    const element = document.querySelector('#messages');
    const surface = createConversationSurface({ element, jumpButton: document.querySelector('#latest'), initialMessageCount: 80, deferOffscreenLayout: true });
    const messages = Array.from({length:2000}, (_,i) => ({id:'m'+i,role:'assistant',kind:'text',status:'completed',content:'Message '+i+'\\n\\n'+('Long history **markdown** with text. '.repeat(20))}));
    const start = performance.now();surface.render({contextId:'long',messages});const renderMs = performance.now()-start;
    const initialNodes = element.children.length; await wait(); await wait();
    const latestVisible = element.scrollHeight-element.scrollTop-element.clientHeight < 80;
    element.dispatchEvent(new WheelEvent('wheel',{deltaY:-100}));element.scrollTop=0;
    const anchor=element.firstElementChild.dataset.conversationMessageId;
    element.dispatchEvent(new Event('scroll'));await wait();await wait();
    const expandedNodes=element.children.length;
    const node=[...element.children].find(n=>n.dataset.conversationMessageId===anchor);
    const anchorOffset=node.getBoundingClientRect().top-element.getBoundingClientRect().top;
    surface.render({contextId:'other',messages:[messages[0]]});await wait();
    surface.render({contextId:'long',messages});await wait();await wait();
    const restored=!!element.querySelector('[data-conversation-message-id="'+anchor+'"]');
    // New messages while reading must not remove the earliest loaded message.
    const first=element.firstElementChild.dataset.conversationMessageId;
    messages.push({...messages.at(-1),id:'new',content:'new arrival'});surface.render({contextId:'long',messages});await wait();
    const retained=element.firstElementChild.dataset.conversationMessageId===first;
    // Reach the beginning; no message is silently discarded.
    for(let i=0;i<30 && !element.querySelector('[data-conversation-message-id="m0"]');i++){
      element.dispatchEvent(new WheelEvent('wheel',{deltaY:-100}));element.scrollTop=0;element.dispatchEvent(new Event('scroll'));await wait();
    }
    const oldestReachable=!!element.querySelector('[data-conversation-message-id="m0"]');
    document.querySelector('#latest').click();await new Promise(r=>setTimeout(r,700));await wait();
    return {renderMs,initialNodes,expandedNodes,latestVisible,anchorOffset,restored,retained,oldestReachable,finalNodes:element.children.length};
  })()`);
  await mkdir(output, { recursive: true });
  await writeFile(join(output, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  assert.equal(result.initialNodes, 80); assert.equal(result.expandedNodes, 160);
  assert.ok(result.latestVisible); assert.ok(Math.abs(result.anchorOffset) < 8, JSON.stringify(result));
  assert.ok(result.restored && result.retained && result.oldestReachable);
  assert.ok(result.renderMs < 250, JSON.stringify(result));
} catch (e) { console.error(e); process.exitCode = 1; }
finally { w.destroy(); await rm(userData, { recursive: true, force: true }); app.quit(); }

}).catch(e => { console.error(e); app.exit(1); });
