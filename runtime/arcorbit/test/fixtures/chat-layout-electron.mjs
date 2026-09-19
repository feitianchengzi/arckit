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
const preload=(await readFile(join(here,'organization-center-preload.cjs'),'utf8')).replace('const testChatSnapshotValue =', 'const layoutDrafts = new Map(); const testChatSnapshotValue =').replace('text: "" }\n});','text: layoutDrafts.get(requested) || "" }\n});').replace('calls.push(["createChat", input]);', 'calls.push(["createChat", input]); layoutDrafts.set(input.session_id || "", input.text);');
await writeFile(join(base,'preload.cjs'),preload);
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
 checks.push('Right sessions and centered composer at 1440/1000; no overflow at 760/390.');
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
}catch(error){console.error(error);exitStatus=1;}finally{win.destroy();await rm(base,{recursive:true,force:true});app.exit(exitStatus);}

});
