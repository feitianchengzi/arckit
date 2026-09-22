import {app,BrowserWindow} from 'electron';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=mkdtempSync(join(tmpdir(),'chat-task-detail-'));
const output=process.env.ARCORBIT_TEST_OUTPUT||root;
mkdirSync(output,{recursive:true});app.setPath('userData',join(root,'user'));app.disableHardwareAcceleration();app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1440,height:960,webPreferences:{backgroundThrottling:false}});
let status=0;
win.webContents.on("console-message",(_event,level,message)=>{if(level>=2)console.error("renderer:",message)});
try {
 const renderer=fileURLToPath(new URL('../../desktop/renderer/',import.meta.url));
 const html=(await readFile(join(renderer,'index.html'),'utf8')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace('<head>',`<head><base href="file://${renderer}">`);
 await writeFile(join(root,'view.html'),html);await win.loadFile(join(root,'view.html'));
 const source=await readFile(join(renderer,'renderer.js'),'utf8');
 const functions=source.slice(source.indexOf('async function openWorkTaskChat(task)'),source.indexOf('\nfunction taskCreatorName'));
 await win.webContents.executeJavaScript(`
 var task={id:'401',project_id:'107',content:'# Work 与 Chat 共享详情\\n\\n完整内容、属性、附件与协作保持一致。\\n'+('长内容 '.repeat(100)),state:'pending',priority:2};
 var state={page:'chat',platform:{tasks:[task],product_workspaces:[{id:'107',local_project_id:'local'}],errors:[]},snapshot:{tasks:[]},platformTaskAttachments:{'401':{status:'loaded',items:[]}}};
 var session={id:'session',project_id:'local',remote_project_id:'107',task_id:'401'};
 var els={chatSessionList:document.getElementById('chatSessionList'),newChatButton:document.getElementById('newChatButton'),platformWorkInspector:document.getElementById('platformWorkInspector')};
 var taskInspectorRenders=new WeakMap(),chatTaskPanelMode='detail',chatTaskDetailOwner='',chatTaskDetailStatus='idle',chatTaskDetailError='';
 var selectedChatSession=()=>session,refreshSnapshot=async()=>{};
 var escapeHtml=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 var projectName=()=> 'Arc 研发平台',canManagePlatformTask=()=>true,deriveWorkEligibilityGuidance=()=>({title:'可以继续讨论',reason:'待办内容与 Work 保持同步',tone:'info'}),projectCurrentUserExecutorId=()=>1,workInspectorActions=()=>[],workInspectorRuntimeSummary=()=> '未关联';
 var renderRestrictedMarkdown=content=>'<p style="white-space:pre-wrap">'+escapeHtml(content)+'</p>',STATE_LABELS={pending:'待处理'},taskCreatorName=()=> 'Glare',taskExecutorName=()=> 'Glare',formatPriority=String,taskTagNames=()=> 'ArcOrbit',formatDateTime=()=> '2026-09-22';
 var factRows=rows=>rows.map(([label,value])=>'<div><strong>'+label+'</strong><span>'+escapeHtml(value)+'</span></div>').join('');
 var taskAttachmentPanel=()=>'<div><h3>评论</h3><textarea data-task-comment-input></textarea></div>',loadTaskAttachments=()=>{},loadMissingTaskAttachmentPreviews=()=>{},runAction=fn=>fn();
 ${functions}
 document.querySelectorAll('#authBootScreen,#setupReadiness').forEach(e=>e.remove());
 document.querySelectorAll('[data-page-view]').forEach(e=>e.classList.toggle('is-active',e.id==='chatView'));
 document.querySelectorAll('details[open]').forEach(e=>e.open=false);
 document.body.className='chat-active';document.getElementById('chatTitle').textContent='Work 与 Chat 共享详情';
 document.getElementById('chatInput').value='未发送对话草稿';
 document.getElementById('chatSidebarSessions').onclick=()=>setChatTaskPanel('sessions');
 document.getElementById('chatSidebarTask').onclick=()=>setChatTaskPanel('detail');
 renderChatTaskPanel();
 `);
 await new Promise(r=>setTimeout(r,100));
 const result=[];
 for(const width of [1440,760,390]){
  win.setSize(width,960);await new Promise(r=>setTimeout(r,100));
  for(const theme of ['light','dark']){
   const measurement=await win.webContents.executeJavaScript(`(()=>{
    document.documentElement.dataset.theme='${theme}';document.body.classList.toggle('chat-sessions-open',innerWidth<=760);
    const host=document.getElementById('chatTaskInspector'),input=host.querySelector('textarea');input.value='未发送评论';host.scrollTop=120;
    document.getElementById('chatSidebarSessions').click();if(!host.hidden)throw Error('detail not hidden');
    document.getElementById('chatSidebarTask').focus();document.getElementById('chatSidebarTask').click();
    if(host.querySelector('textarea')!==input||input.value!=='未发送评论')throw Error('draft replaced');
    if(document.getElementById('chatInput').value!=='未发送对话草稿')throw Error('composer lost');
    const panel=document.getElementById('chatSessionsPanel').getBoundingClientRect(),r=host.getBoundingClientRect();
    return {width:innerWidth,theme:'${theme}',panelWidth:panel.width,detailHeight:r.height,detailBottom:r.bottom,panelBottom:panel.bottom,scrollWidth:host.scrollWidth,clientWidth:host.clientWidth,documentWidth:document.documentElement.scrollWidth};
   })()`);
   assert.ok(measurement.detailHeight>150);assert.ok(measurement.detailBottom<=measurement.panelBottom+1);
   assert.ok(measurement.scrollWidth<=measurement.clientWidth+1,JSON.stringify(measurement));
   assert.ok(measurement.documentWidth<=measurement.width+1,JSON.stringify(measurement));result.push(measurement);
   await win.webContents.executeJavaScript("document.getElementById('chatTaskInspector').scrollTop=0");
   if(width===1440||width===390)await writeFile(join(output,`chat-task-${width}-${theme}.png`),(await win.webContents.capturePage()).toPNG());
  }
 }
 const prototype=fileURLToPath(new URL('../../../../arckit/interaction/task-browser/default.html',import.meta.url));
 await win.loadFile(prototype);await new Promise(r=>setTimeout(r,100));
 const link=await win.webContents.executeJavaScript(`document.querySelector('[data-work-chat]').href`);assert.ok(link.includes('workTask='));
 await win.loadURL(link);await new Promise(r=>setTimeout(r,100));
 assert.equal(await win.webContents.executeJavaScript(`ChatModel.state.detailPanel`),'detail');
 assert.ok(await win.webContents.executeJavaScript(`document.querySelector('.sample-task-detail').textContent.includes(ChatModel.current().mainTask)`));
 await win.webContents.executeJavaScript(`document.querySelector('[data-detail-mode="sessions"]').click();document.querySelector('[data-detail-mode="detail"]').click()`);
 await writeFile(join(output,'browser.json'),JSON.stringify({passed:true,production:result,prototype:'Work link opens bound Chat detail; tabs operable',boundary:'Production DOM/styles and actual detail renderer; fixture IPC/data, no real account mutation.'},null,2));
 console.log(JSON.stringify({passed:true,output}));
}catch(e){console.error(e);status=1}finally{win.destroy();await rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:100}).catch(()=>{});app.exit(status)}

});
