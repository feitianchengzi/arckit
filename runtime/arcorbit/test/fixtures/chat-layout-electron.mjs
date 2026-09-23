import {app,BrowserWindow} from 'electron';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),base=await mkdtemp(join(tmpdir(),'chat-layout-'));
const out=process.argv.includes('--evidence')?process.argv[process.argv.indexOf('--evidence')+1]:join(base,'evidence');
process.env.ARCORBIT_CHAT_STREAM_PERFORMANCE_FIXTURE='1';
app.setPath('userData',join(base,'user'));app.disableHardwareAcceleration();
// Cleanup must finish before explicit success/failure exit, including after the last window closes.
app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{
let preload=(await readFile(join(here,'organization-center-preload.cjs'),'utf8')).replace('const testChatSnapshotValue =', 'const layoutDrafts = new Map(); const testChatSnapshotValue =').replace('text: "" }\n});','text: layoutDrafts.get(requested) || "" }\n});').replace('calls.push(["createChat", input]);', 'calls.push(["createChat", input]); layoutDrafts.set(input.session_id || "", input.text);');
await writeFile(join(base,'preload.cjs'),preload.replace('const testChatSnapshotValue =', `chatSessions.push(...Array.from({length:10},(_,i)=>({id:'HISTORY-'+i,project_id:'local-11',title:'历史会话 '+i,status:'completed',created_at:'2026-09-'+String(i+1).padStart(2,'0'),updated_at:'2026-09-01'}))); const testChatSnapshotValue =`));
const win=new BrowserWindow({show:false,width:1440,height:960,webPreferences:{preload:join(base,'preload.cjs'),contextIsolation:true,sandbox:false}});
const errors=[],checks=[],sizes=[];
let exitStatus=0;
win.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
const js=code=>win.webContents.executeJavaScript(code);
const pause=()=>new Promise(r=>setTimeout(r,250));
try {
 if(process.argv.includes("--force-failure")) assert.fail("Forced assertion verifies the Electron runner exit status.");
 await mkdir(out,{recursive:true});await win.loadFile(join(here,'../../desktop/renderer/index.html'));await pause();
 await js(`document.querySelector('[data-page=chat]').click()`);await pause();
 for(const width of [1440,1000,760,390]){
  win.setSize(width,960);await pause();
  const result=await js(`(()=>{const q=s=>document.querySelector(s),r=s=>q(s).getBoundingClientRect();return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,main:r('.chat-main').toJSON(),sidebar:r('.chat-sidebar').toJSON(),composer:r('#chatView .chat-composer').toJSON(),drawer:getComputedStyle(q('.chat-sidebar')).display==='none'};})()`);
  assert.ok(result.main.width>300 && result.main.height>300);assert.equal(result.overflow,false);assert.ok(Math.abs(result.composer.x+result.composer.width/2-result.main.x-result.main.width/2)<2);
  if(width>760)assert.ok(result.sidebar.x>=result.main.right-1);else assert.equal(result.drawer,true);
  sizes.push(result);await writeFile(join(out,`chat-${width}.png`),(await win.webContents.capturePage()).toPNG());
 }
 // Exercise native menus against the real renderer DOM at desktop and compact widths.
 for(const width of [1440,760,390]){
  win.setSize(width,960);await pause();await js(`document.querySelector('#chatNativeInvoke').click()`);await pause();
  const menu=await js(`(()=>{const p=document.querySelector('.chat-capability-menu').getBoundingClientRect(),b=document.querySelector('#chatNativeInvoke').getBoundingClientRect(),l=document.querySelector('.chat-native-options'),f=document.querySelector('.chat-capability-menu footer').getBoundingClientRect();return {height:p.height,top:p.top,bottom:p.bottom,anchor:b.top,list:l.clientHeight,footer:f.bottom,count:l.querySelectorAll('[data-pick]').length}})()`);
  assert.ok(menu.height>500&&menu.list>300&&menu.top>=11&&Math.abs(menu.anchor-menu.bottom-8)<2&&menu.footer<=menu.bottom,JSON.stringify(menu));assert.equal(menu.count,5);
  await writeFile(join(out,`native-menu-${width}.png`),(await win.webContents.capturePage()).toPNG());
  await js(`document.querySelector('[data-pick="native:create"]').click()`);assert.equal(await js(`document.querySelector('.chat-native-chips').textContent.includes('创建待办')`),true);
  await js(`document.querySelector('[data-remove]').click()`);await js(`document.querySelector('#chatModelSettings').click()`);await pause();
  assert.ok(await js(`(()=>{const p=document.querySelector('.chat-model-menu').getBoundingClientRect(),a=document.querySelector('#chatModelSettings').getBoundingClientRect();return Math.abs(a.top-p.bottom-8)<2&&p.right<=innerWidth})()`));
  await js(`document.querySelector('.chat-model-menu').close()`);
 }
 checks.push('Capability and model menus anchor above own trigger; candidates/footer visible; removable capability chips at 1440/760/390.');
 checks.push('Right sessions and centered composer at 1440/1000; no overflow at 760/390.');
 win.setSize(1440,960);await pause();
 assert.equal(await js(`document.querySelectorAll('[data-chat-session-id]').length`),5);
 await js(`document.querySelector('[data-chat-history-project-id]').click()`);
 assert.equal(await js(`document.querySelectorAll('[data-chat-session-id]').length`),10);
 await js(`document.querySelector('[data-chat-history-project-id]').click()`);
 assert.equal(await js(`document.querySelectorAll('[data-chat-session-id]').length`),12);
 assert.equal(await js(`!!document.querySelector('[data-chat-history-project-id]')`),false);
 await js(`document.querySelector('[data-chat-project-toggle]').focus();document.querySelector('[data-chat-project-toggle]').click()`);
 assert.equal(await js(`document.querySelectorAll('[data-chat-session-id]').length`),0);
 assert.equal(await js(`document.activeElement.hasAttribute('data-chat-project-toggle')`),true);
 await js(`document.querySelector('[data-chat-project-toggle]').click()`);
 assert.equal(await js(`document.querySelectorAll('[data-chat-session-id]').length`),5);
 assert.deepEqual(await js(`[...document.querySelectorAll('[data-chat-session-id]')].map(e=>e.dataset.chatSessionId)`),['HISTORY-9','HISTORY-8','HISTORY-7','HISTORY-6','HISTORY-5']);
 assert.equal(await js(`document.querySelectorAll('.chat-native-tabs,.chat-native-task-list,.chat-task-filter-dialog').length`),0);
 assert.equal(await js(`document.querySelector('.chat-sidebar-head h2').textContent`),'会话');
 assert.ok(await js(`document.querySelector('#chatNativeInvoke') && document.querySelector('.chat-native-identity button')`));
 assert.equal(await js(`document.querySelectorAll('.chat-session-relation').length`),0);
 assert.ok(await js(`[...document.querySelectorAll('.chat-session')].every(e=>e.querySelector('.chat-session-status'))`));
 await js(`document.querySelector('[data-chat-history-project-id]').click();document.querySelector('[data-chat-history-project-id]').click()`);
 checks.push('Session-only sidebar, no task tab/list/filter; native capability and association controls retained; sessions newest first.');
 const order=await js(`[...document.querySelectorAll('[data-chat-session-id]')].map(e=>e.dataset.chatSessionId)`);
 await js(`document.querySelector('[data-chat-session-id="CHAT-B"]').click()`);await pause();
 assert.deepEqual(await js(`[...document.querySelectorAll('[data-chat-session-id]')].map(e=>e.dataset.chatSessionId)`),order);
 assert.equal(await js(`[...document.querySelectorAll('.chat-session')].every(e=>e.clientHeight<=40 && !e.querySelector('small'))`),true);
 checks.push('Single-line rows; 5 → 10 → 12; collapse resets to 5 and preserves keyboard focus/selection order.');
 async function drag(selector,dx,dy) {
   const r=await js(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`);
   const x=Math.round(r.x+r.width/2),y=Math.round(r.y+r.height/2);
   if (!win.webContents.debugger.isAttached()) win.webContents.debugger.attach('1.3');
   const dispatch = params => win.webContents.debugger.sendCommand('Input.dispatchMouseEvent',params);
   await dispatch({type:'mouseMoved',x,y});
   await dispatch({type:'mousePressed',button:'left',buttons:1,x,y,clickCount:1});
   await dispatch({type:'mouseMoved',button:'left',buttons:1,x:x+dx,y:y+dy});
   await dispatch({type:'mouseReleased',button:'left',buttons:0,x:x+dx,y:y+dy,clickCount:1});
   await pause();
 }
 const beforeWidth=await js(`document.querySelector('.chat-sidebar').getBoundingClientRect().width`);
 await drag('#chatSidebarResize',-80,0);
 assert.ok(await js(`document.querySelector('.chat-sidebar').getBoundingClientRect().width`)>=beforeWidth+75, JSON.stringify(await js(`({before:${beforeWidth},after:document.querySelector('.chat-sidebar').getBoundingClientRect().width,handle:document.querySelector('#chatSidebarResize').getBoundingClientRect().toJSON()})`)));
 const beforeHeight=await js(`document.querySelector('#chatInput').getBoundingClientRect().height`);
 await js(`document.querySelector('#chatInput').value='拖拽保持草稿';document.querySelector('#chatInput').dispatchEvent(new Event('input',{bubbles:true}))`);
 await drag('#chatComposerResize',0,-100);
 assert.ok(await js(`document.querySelector('#chatInput').getBoundingClientRect().height`)>=beforeHeight+95);
 assert.equal(await js(`document.querySelector('#chatInput').value`),'拖拽保持草稿');
 await js(`document.querySelector('#chatComposerResize').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}))`);
 assert.ok(await js(`document.querySelector('#chatInput').getBoundingClientRect().height`)>=beforeHeight+75);
 assert.equal(await js(`getComputedStyle(document.querySelector('#chatTranscript')).paddingLeft`),'24px');
 assert.equal(await js(`getComputedStyle(document.querySelector('#chatView .chat-composer')).maxWidth`),'none');
 await js(`document.querySelector('#chatModelSettings').click();document.querySelector('#chatCodexModel').focus()`);await pause();
 assert.equal(await js(`document.querySelector('#chatCodexModel').tagName`),'SELECT');
 assert.equal(await js(`document.querySelector('#chatCodexEffort').tagName`),'SELECT');
 await js(`document.querySelector('#chatCodexModel').value='test-model';document.querySelector('#chatCodexModel').dispatchEvent(new Event('change',{bubbles:true}))`);
 assert.deepEqual(await js(`[...document.querySelector('#chatCodexEffort').options].map(o=>o.value)`),['low','max']);
 assert.equal(await js(`document.querySelector('#chatCodexEffort').value`),'low');
 await writeFile(join(out,'chat-adjusted.png'),(await win.webContents.capturePage()).toPNG());
 await js(`document.querySelector('.chat-model-menu').close()`);
 checks.push('Real mouse drag changes sidebar +80px and input +100px; keyboard resize and draft preservation; model selection updates valid Level choices.');
 win.setSize(390,960);await pause();

 await js(`document.querySelector('#chatSessionsToggle').click()`);
 assert.equal(await js(`document.querySelector('.chat-main').inert && document.activeElement.id==='chatSessionsClose'`),true);
 await js(`document.querySelector('[data-chat-session-id="CHAT-B"]').click()`);await pause();
 assert.equal(await js(`!document.querySelector('.chat-main').inert && !document.body.classList.contains('chat-sessions-open')`),true);
 await js(`document.querySelector('#chatInput').value='保留这个草稿';document.querySelector('#chatInput').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#chatSessionsToggle').click();document.querySelector('[data-chat-session-id="CHAT-A"]').click()`);await pause();
 await js(`document.querySelector('#chatSessionsToggle').click();document.querySelector('[data-chat-session-id="CHAT-B"]').click()`);await pause();
 assert.equal(await js(`document.querySelector('#chatInput').value`),'保留这个草稿');
 checks.push('Drawer selection closes and restores input; per-session draft survives switching.');
 await js(`document.querySelector('#chatSessionsToggle').click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
 assert.equal(await js(`document.activeElement.id==='chatSessionsToggle' && !document.querySelector('.chat-main').inert`),true);
 await js(`document.querySelector('#legacyPagesButton').click()`);
 assert.equal(await js(`getComputedStyle(document.querySelector('.sidebar')).display`),'flex');
 await js(`document.querySelector('#accountButton').click()`);await pause();
 assert.equal(await js(`!document.querySelector('#settingsOverlay').classList.contains('hidden')`),true);
 checks.push('Escape restores focus; compact main navigation and full account settings are reachable.');
 assert.deepEqual(errors,[]);
 await writeFile(join(out,'chat-electron.json'),JSON.stringify({status:'passed',checks,sizes,renderer_errors:errors},null,2)+'\n');
 console.log(JSON.stringify({status:'passed',checks,output:out}));
}catch(error){console.error(error);exitStatus=1;}finally{win.destroy();try { await rm(base,{recursive:true,force:true,maxRetries:5,retryDelay:100}); } finally { app.exit(exitStatus); }}

});
