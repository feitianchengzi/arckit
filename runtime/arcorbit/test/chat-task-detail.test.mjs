import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
const source=readFileSync(new URL('../desktop/renderer/renderer.js',import.meta.url),'utf8');
export const detailSource=source.slice(source.indexOf('async function openWorkTaskChat(task)'),source.indexOf('\nfunction taskCreatorName'));
const tick=()=>new Promise(r=>setTimeout(r,0));
function fixture(){
 const {document}=parseHTML(readFileSync(new URL('../desktop/renderer/index.html',import.meta.url),'utf8'));
 const task={id:'1',project_id:'107',content:'# Original\nBody',state:'pending',priority:3};
 const state={page:'chat',platform:{tasks:[task],product_workspaces:[{id:'107',local_project_id:'local'}],errors:[]},snapshot:{tasks:[]},platformTaskAttachments:{'1':{status:'loaded',items:[]}}};
 let session={id:'s1',project_id:'local',remote_project_id:'107',task_id:'1'},deferred=null;
 const calls=[];
 const context={document,state,els:{chatSessionList:document.getElementById('chatSessionList'),newChatButton:document.getElementById('newChatButton'),platformWorkInspector:document.getElementById('platformWorkInspector')},
  taskInspectorRenders:new WeakMap(),chatTaskPanelMode:'detail',chatTaskDetailOwner:'',chatTaskDetailStatus:'idle',chatTaskDetailError:'',
  selectedChatSession:()=>session,refreshSnapshot:()=>deferred?new Promise((resolve,reject)=>{deferred.resolve=resolve;deferred.reject=reject}):Promise.resolve(),
  chatStateCoordinator:{flushDraft:async()=>calls.push('flush'),selectSession:async id=>calls.push(['select',id])},api:{chatNativeOpen:async input=>{calls.push(input);return {session_id:'s1'}}},
  showPage:page=>{state.page=page},setChatSessionsOpen:value=>calls.push(['drawer',value]),
  escapeHtml:v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
  projectName:()=> 'Project',canManagePlatformTask:()=>true,deriveWorkEligibilityGuidance:()=>({title:'Ready',reason:'Ready',tone:'info'}),projectCurrentUserExecutorId:()=>1,workInspectorActions:()=>[],workInspectorRuntimeSummary:()=> 'None',
  renderRestrictedMarkdown:content=>'<p>'+content+'</p>',STATE_LABELS:{pending:'待处理'},
  taskCreatorName:()=> 'Creator',taskExecutorName:()=> 'Executor',formatPriority:String,taskTagNames:()=> 'Tags',formatDateTime:String,
  factRows:rows=>rows.map(([label,value])=>`<div>${label}:${value}</div>`).join(''),taskAttachmentPanel:()=>'<textarea data-task-comment-input></textarea>',
  loadTaskAttachments:()=>{},loadMissingTaskAttachmentPreviews:()=>{},runAction:fn=>fn(),copyWorkTaskReference:()=>calls.push('copy'),createTaskComment:(id,host)=>calls.push(['comment',id,host.id])};
 vm.createContext(context);vm.runInContext(detailSource,context);
 return {context,document,state,task,calls,setSession:s=>{session=s},defer:()=>{deferred={};return deferred},run:s=>vm.runInContext(s,context)};
}
test('Work opens the bound task in Chat using its own workspace; missing binding keeps the current page',async()=>{
 const h=fixture();h.state.page='work';await h.context.openWorkTaskChat(h.task);
 assert.deepEqual(h.calls.map(x=>JSON.parse(JSON.stringify(x))),['flush',{project_id:'local',task_id:'1'},['select','s1'],['drawer',true]]);
 assert.equal(h.state.page,'chat');assert.equal(h.context.chatTaskPanelMode,'detail');
 h.state.page='work';h.state.platform.product_workspaces=[];
 await assert.rejects(h.context.openWorkTaskChat(h.task),/绑定本地工作区/);assert.equal(h.state.page,'work');
});
test('both hosts render identical complete details and preserve their own editors across updates and tab switches',async()=>{
 const h=fixture();h.context.renderPlatformWorkInspector(h.task);h.context.renderChatTaskPanel();await tick();
 const chat=h.document.getElementById('chatTaskInspector'),work=h.document.getElementById('platformWorkInspector');
 assert.equal(chat.innerHTML,work.innerHTML);
 const editor=chat.querySelector('textarea');editor.value='unsent comment';chat.scrollTop=120;
 h.context.setChatTaskPanel('sessions');assert.equal(chat.hidden,true);h.context.setChatTaskPanel('detail');
 assert.equal(chat.querySelector('textarea'),editor);assert.equal(editor.value,'unsent comment');
 h.task.content='Agent changed content';h.context.renderChatTaskPanel();h.context.renderPlatformWorkInspector(h.task);
 assert.match(chat.textContent,/Agent changed content/);assert.match(work.textContent,/Agent changed content/);
 assert.equal(chat.querySelector('textarea'),editor);assert.equal(chat.scrollTop,120);
 assert.notEqual(chat.querySelector('textarea'),work.querySelector('textarea'));
});
test('late detail refresh cannot resurrect a previous task; errors and deleted tasks remain retryable',async()=>{
 const h=fixture(),pending=h.defer();h.context.renderChatTaskPanel();
 h.setSession({id:'free',project_id:'local'});h.context.renderChatTaskPanel();pending.resolve();await tick();
 const host=h.document.getElementById('chatTaskInspector');assert.match(host.textContent,/尚未关联/);assert.doesNotMatch(host.textContent,/Original/);
 h.setSession({id:'s2',project_id:'local',remote_project_id:'107',task_id:'2'});h.context.renderChatTaskPanel();pending.reject(Error('offline'));await tick();
 assert.match(host.textContent,/offline/);assert.ok(host.querySelector('[data-chat-task-retry]'));
 const retry=h.context.refreshChatTaskDetail();pending.resolve();await retry;
 assert.match(host.textContent,/不存在或已无权访问/);assert.doesNotMatch(host.textContent,/Original/);
});
test('task identity checks the remote project and refuses cross-project detail reuse',async()=>{
 const h=fixture();h.setSession({id:'s2',project_id:'another',remote_project_id:'999',task_id:'1'});h.context.renderChatTaskPanel();await tick();
 assert.match(h.document.getElementById('chatTaskInspector').textContent,/不存在或已无权访问/);
});
