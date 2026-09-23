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
const preload=(await readFile(join(here,'organization-center-preload.cjs'),'utf8'))
 .replace('const testChatSnapshotValue =', `automation.active_executions.push({execution_id:'EXEC-B',task_id:'W-12',project_id:'12',task_title:'Other project work',phase:'running'});platform.projects[0].local_project_id='local-11';platform.projects[1].local_project_id='local-12';chatSessions.push({id:'CHAT-C',project_id:'local-12',title:'Product B conversation',status:'completed'});const layoutDrafts=new Map();let layoutDraftProject='local-11';const testChatSnapshotValue =`)
 .replace('contextBridge.exposeInMainWorld("arckitDesktop", {', `contextBridge.exposeInMainWorld("arckitDesktop", {
 projectWorkbenchSnapshot:async()=>({account_scope:'fixture',projects:platform.projects,tasks:platform.tasks,runtime:automation,global_runtime:automation,source_status:'healthy'}),
 projectWorkbenchDetail:async id=>({task:platform.tasks.find(t=>t.id===id),scene:{task_id:id,revision:0,criteria:[],agreements:[],plan:[],context:[],reports:[],events:[],receipts:{}},executions:[],history:[],attention:[],recovery:[],children:[],feedback:[],attachments:[],messages:[],runs:[]}),
 projectWorkbenchCommand:async()=>({}),onProjectWorkbenchEvent:()=>{},`)
 .replace('projects: chatFixtureEnabled ? [{ id: "local-11", name: "ArcOrbit Local" }] : [],','projects: [{id:"local-11",name:"ArcOrbit Local"},{id:"local-12",name:"Workshop Local"}],')
 .replace('draft: { project_id: "local-11", text: "" }','draft: { project_id: chatSessions.find(s=>s.id===requested)?.project_id || layoutDraftProject, text:layoutDrafts.get(requested)||"" }')
 .replace('calls.push(["createChat", input]);','calls.push(["createChat", input]);layoutDrafts.set(input.session_id||"",input.text);if(!input.session_id){layoutDraftProject=input.project_id;selectedChatSessionId="";}')
 .replace('return codexSettingsFixture ? testChatSnapshotValue("") : {};','return testChatSnapshotValue(input.session_id||"");');
await writeFile(join(base,'preload.cjs'),preload);
const win=new BrowserWindow({show:false,width:1440,height:960,webPreferences:{preload:join(base,'preload.cjs'),contextIsolation:true,sandbox:false}});
const errors=[],checks=[],sizes=[];
let exitStatus=0;
win.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
const js=code=>win.webContents.executeJavaScript(code);
const scope=async id=>{await js(`document.getElementById('productScopeSelect').value=${JSON.stringify(id)};document.getElementById('productScopeSelect').dispatchEvent(new Event('change',{bubbles:true}))`);await pause();await pause();};
const pause=()=>new Promise(r=>setTimeout(r,250));
const assertTopbarVisible=async()=>{
 const controls=await js(`['worksetSelect','productScopeSelect','accountSync','globalRuntimeSummary','syncButton','settingsButton'].map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return {id,visible:e.checkVisibility({checkVisibilityCSS:true,checkOpacity:true}),width:r.width,height:r.height,ancestors:[...document.querySelectorAll('details')].filter(d=>d.contains(e)).map(d=>({id:d.id,open:d.open}))};})`);
 assert.ok(controls.every(c=>c.visible&&c.width>0&&c.height>0),'Topbar controls must be visible: '+JSON.stringify(controls));
};

try {
 if(process.argv.includes("--force-failure")) assert.fail("Forced assertion verifies the Electron runner exit status.");
 await mkdir(out,{recursive:true});await win.loadFile(join(here,'../../desktop/renderer/index.html'));await pause();
 await assertTopbarVisible();
 await js(`document.body.click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);await pause();await assertTopbarVisible();
 for(const theme of ['light','dark'])for(const id of ['globalSyncMenu','globalRuntimeMenu']){
  await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.querySelector('#${id}>summary').click()`);await pause();
  const style=await js(`(()=>{const menu=document.getElementById('${id}'),button=menu.querySelector('summary'),panel=menu.querySelector('.global-popover'),b=getComputedStyle(button),p=getComputedStyle(panel),r=panel.getBoundingClientRect();return {open:menu.open,bg:p.backgroundColor,opacity:p.opacity,buttonBg:b.backgroundColor,border:b.borderTopStyle,borderWidth:b.borderTopWidth,cursor:b.cursor,chevron:getComputedStyle(button,'::after').content,left:r.left,right:r.right,width:innerWidth};})()`);
  assert.equal(style.open,true);assert.notEqual(style.bg,'rgba(0, 0, 0, 0)');assert.ok(!style.bg.startsWith('rgba(')||style.bg.endsWith(', 1)'));assert.equal(style.opacity,'1');assert.equal(style.border,'solid');assert.notEqual(style.borderWidth,'0px');assert.equal(style.cursor,'pointer');assert.notEqual(style.chevron,'none');assert.ok(style.left>=0&&style.right<=style.width);
  await writeFile(join(out,`${id}-${theme}.png`),(await win.webContents.capturePage()).toPNG());
  await js(`document.querySelector('#${id}>summary').click()`);await pause();
 }
 await js(`document.documentElement.dataset.theme='light'`);
 checks.push('Sync and runtime entries have visible button boundaries and disclosure arrows; both popovers have opaque light/dark surfaces.');
 await js(`document.querySelector('[data-page=chat]').click()`);await pause();
 const identity=await js(`(()=>{window.__topbar=document.querySelector('.commandbar');return true;})()`);assert.equal(identity,true);
 await scope('11');assert.equal(await js(`document.querySelector('[data-chat-session-id="CHAT-C"]')===null`),true);
 await js(`document.querySelector('#chatInput').value='Product A draft';document.querySelector('#chatInput').dispatchEvent(new Event('input',{bubbles:true}))`);
 await scope('12');assert.equal(await js(`document.querySelector('[data-chat-session-id="CHAT-A"]')===null`),true);
 await js(`document.querySelector('[data-chat-session-id="CHAT-C"]').click()`);await pause();
 await js(`document.querySelector('#chatInput').value='Product B draft';document.querySelector('#chatInput').dispatchEvent(new Event('input',{bubbles:true}))`);
 await scope('11');assert.equal(await js(`document.querySelector('#chatInput').value`),'Product A draft');
 await scope('12');assert.equal(await js(`document.querySelector('#chatInput').value`),'Product B draft');
 await scope('all');
 await js(`document.querySelector('[data-chat-session-id="CHAT-A"]').click()`);await pause();
 for(const page of ['work','feedback','command','today','chat','operations','organization','engineering']) {await js(`document.querySelector('[data-page="${page}"]').click()`);await pause();assert.equal(await js(`document.querySelector('.commandbar')===window.__topbar && getComputedStyle(window.__topbar).display!=='none' && document.querySelector('.commandbar').contains(document.querySelector('#accountSync'))`),true);await assertTopbarVisible();}
 await assertTopbarVisible();await js(`document.querySelector('[data-page=chat]').click()`);await pause();
 checks.push('Shared topbar identity and capabilities persist across Chat, Work, Feedback, Automation and Today; A/B sessions and drafts follow product scope.');
 await scope('11');await js(`document.getElementById('globalRuntimeMenu').open=true;document.querySelector('[data-global-task="W-12"]').click()`);await pause();await pause();
 assert.equal(await js(`document.getElementById('productScopeSelect').value`),'12');
 assert.match(await js(`document.querySelector('.pw-heading').textContent`),/#W-12/);
 assert.equal(await js(`document.querySelector('.commandbar')===window.__topbar`),true);
 await js(`document.querySelector('[data-page="operations"]').click()`);await pause();
 assert.match(await js(`document.getElementById('operationsScope').textContent`),/Workshop Todo/);
 await scope('11');assert.doesNotMatch(await js(`document.getElementById('operationsScope').textContent`),/Workshop Todo/);
 checks.push('Global runtime target changes scope and opens the correct Thing; Operations reports the current scope without fabricated counts.');
 await js(`document.querySelector('[data-page="chat"]').click()`);await pause();await scope('all');
 for(const width of [1440,1000,760,390]){
  win.setSize(width,960);await pause();
  const result=await js(`(()=>{const q=s=>document.querySelector(s),r=s=>q(s).getBoundingClientRect();return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,main:r('.chat-main').toJSON(),sidebar:r('.chat-sidebar').toJSON(),composer:r('#chatView .chat-composer').toJSON(),drawer:getComputedStyle(q('.chat-sidebar')).display==='none'};})()`);
  assert.ok(result.main.width>300 && result.main.height>300);assert.equal(result.overflow,false);assert.ok(result.main.right<=result.width+1);assert.ok(Math.abs(result.composer.x+result.composer.width/2-result.main.x-result.main.width/2)<2);
  if(width>760)assert.ok(result.sidebar.x>=result.main.right-1);else assert.equal(result.drawer,true);
  if(width>760){await assertTopbarVisible();await js(`document.getElementById('globalRuntimeSummary').click()`);await pause();await assertTopbarVisible();await js(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));document.body.click()`);await pause();await assertTopbarVisible();}
  sizes.push(result);await writeFile(join(out,`chat-${width}.png`),(await win.webContents.capturePage()).toPNG());
 }
 checks.push('Right sessions and centered composer at 1440/1000; no overflow at 760/390.');
 await js(`document.getElementById('globalControlsSummary').click()`);
 assert.equal(await js(`document.getElementById('globalControlsMenu').open && document.getElementById('settingsButton').getBoundingClientRect().width>0`),true);
 await js(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
 assert.equal(await js(`document.activeElement.id==='globalControlsSummary'`),true);
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
 await js(`document.getElementById('settingsOverlay').classList.add('hidden')`);win.setSize(1440,960);await pause();await assertTopbarVisible();await js(`document.body.click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);await pause();await assertTopbarVisible();
 checks.push('Actual control visibility on every visited page, desktop popover dismissal, outside click, Escape and compact-to-desktop restoration.');
 assert.deepEqual(errors,[]);
 await writeFile(join(out,'chat-electron.json'),JSON.stringify({status:'passed',checks,sizes,renderer_errors:errors},null,2)+'\n');
 console.log(JSON.stringify({status:'passed',checks,output:out}));
}catch(error){console.error(error, JSON.stringify(errors));exitStatus=1;}finally{win.destroy();await rm(base,{recursive:true,force:true,maxRetries:5,retryDelay:100}).catch(()=>{});app.exit(exitStatus);}

});
