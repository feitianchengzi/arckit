const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jobs=new Map();
let notice='';
for(const s of state.sessions){if(s.busy){s.busy=false;s.messages.push({role:'agent',text:'上次模拟已中断，未完成的动作不会自动重放。请重新说明需要完成的操作。'})}}
function capture(){current().draft=$('#draft').value;current().scroll=$('#messages').scrollTop;persist()}
function taskCard(id){const t=findTask(id),same=t.thread===current().thread;return `<button class="card" data-task="${id}"><span><strong>${esc(t.title)}</strong><small>${esc(t.project)} · ${t.id} · ${esc(t.status)}</small><small>${same?'对应当前会话':t.thread?'从本会话创建 · 已有独立对话':'从本会话创建 · 尚未开始独立对话'}</small></span><span>${same?'当前会话':t.thread?'打开对话 →':'开始对话 →'}</span></button>`}
function renderMessages(){const s=current();$('#messages').innerHTML=s.messages.map((m,i)=>`<article class="message ${m.role}"><small>${m.role==='user'?'你':'Agent'}</small>${m.envelope?`<div class="message-context">${[...(m.envelope.capability?[m.envelope.capability]:[]),...(m.envelope.refs||[])].map(x=>`<span>${esc(x.kind)} · ${esc(x.label)}</span>`).join('')}</div>`:''}${m.text?`<p>${esc(m.text)}</p>`:''}${(m.tools||[]).map(t=>`<details class="tool"><summary>${esc(t.label)}</summary><p>${esc(t.detail)}</p></details>`).join('')}${m.card?taskCard(m.card):''}${m.receipt?`<span class="receipt">${esc(m.receipt)}</span>`:''}${m.retry?`<span class="receipt">可回复“重试刚才的操作”。</span>`:''}</article>`).join('')}
function renderList(){
 const tab=state.tab,q=$('#search').value.trim().toLowerCase();
 for(const name of ['sessions','tasks']){$('#'+name+'-tab').setAttribute('aria-selected',String(tab===name));$('#'+name+'-tab').tabIndex=tab===name?0:-1}
 $('#list').setAttribute('aria-labelledby',tab+'-tab');$('#search').placeholder=tab==='tasks'?'搜索当前项目待办':'搜索会话';
 $('#new-chat').setAttribute('aria-label',tab==='tasks'?'选择创建待办能力':'新建对话');$('#new-chat').title=tab==='tasks'?'选择创建待办能力':'新建对话';
 const rows=tab==='tasks'?state.tasks.filter(t=>t.project===current().workspace):state.sessions;
 const matching=rows.filter(r=>(r.title+(r.project||r.workspace)+(r.id||'')).toLowerCase().includes(q));
 const groups=[...new Set(matching.map(r=>r.project||r.workspace))];
 $('#list').innerHTML=groups.map(project=>`<small>${esc(project)}</small>`+matching.filter(r=>(r.project||r.workspace)===project).map(r=>tab==='tasks'?`<button class="row ${current().mainTask===r.id?'selected':''}" data-task="${r.id}">${esc(r.title)}<small>${r.id} · ${esc(r.status)}${r.thread?(r.thread===current().thread?' · 当前会话':' · 继续已有会话'):' · 尚未开始对话'}</small></button>`:`<button class="row ${state.selected===r.id?'selected':''}" data-session="${r.id}">${esc(r.title)}<small>${r.mainTask?'对应待办 '+r.mainTask:'自由对话'}${r.busy?' · Agent 处理中':''}</small></button>`).join('')).join('')||'<p class="empty">没有匹配结果。调整搜索词即可继续。</p>';
}
function render(){
 const s=current(),t=findTask(s.mainTask);
 $('#title').textContent=s.title;
 $('#context').innerHTML=t?`<span>本会话对应待办 </span><button data-read="${t.id}">${esc(t.project)} / ${t.id} · ${esc(t.status)} · 查看最新内容</button>`:'自由对话';
 const source=t?.sourceThread&&t.sourceThread!==s.thread?state.sessions.find(x=>x.thread===t.sourceThread):null;
 if(source)$('#context').innerHTML+=` · <button data-session="${source.id}">创建于：${esc(source.title)}</button>`;
 $('#convert').disabled=!!s.mainTask||!!s.busy;$('#convert').textContent=s.mainTask?'已关联待办':'整理为待办';
 window.Composer?.render();
 $('#draft').value=s.draft;$('#send').textContent=s.busy?'停止':'发送';
 $('#workspace-label').textContent='工作区 · '+s.workspace;
 $('#notice').textContent=notice;
 $('#trace').textContent=`验证信息：${s.thread} · 当前待办 ${s.mainTask||'无'} · 待办数 ${state.tasks.length} · 会话数 ${state.sessions.length}`;
 renderMessages();renderList();$('#messages').scrollTop=s.scroll||0;persist();
}
function refreshSession(s){persist();if(s.id===state.selected){s.draft=$('#draft').value;const el=$('#messages'),follow=el.scrollHeight-el.scrollTop-el.clientHeight<90;s.scroll=el.scrollTop;render();if(follow)el.scrollTop=el.scrollHeight}else renderList()}
function addMessage(s,m){s.messages.push(m);refreshSession(s)}
async function run(s,steps,finish,retry){
 if(s.busy)return;
 s.busy=true;const token={};jobs.set(s.id,token);
 const activity={role:'agent',tools:[]};s.messages.push(activity);refreshSession(s);
 for(const step of steps){
  await new Promise(r=>setTimeout(r,240));
  if(jobs.get(s.id)!==token)return false;
  activity.tools.push(step);refreshSession(s);
 }
 if(retry&&$('#fail-next').checked){
  $('#fail-next').checked=false;activity.text='原生能力写入失败，尚未保存。请求内容已保留，可以重试。';activity.retry=retry;
 }else finish(activity);
 s.busy=false;jobs.delete(s.id);refreshSession(s);return true;
}
function stop(){const s=current();jobs.delete(s.id);s.busy=false;addMessage(s,{role:'agent',text:'已停止本次模拟。尚未完成的写入没有提交，对话和输入保留。'})}
const step=(label,detail)=>({label,detail});
function createFromIntent(s,kind,requestedText=''){
 const project=s.workspace;
 const whole=kind==='whole';
 const title=requestedText?requestedText.slice(0,120):whole?'完善 Chat 阅读位置恢复':kind==='suggestion'?'补充滚动恢复的边界测试':'给 Chat 增加会话搜索';
 const content=requestedText|| (whole?'按会话恢复原阅读位置；阅读历史时新消息不抢位置，并提供回到最新入口。':kind==='suggestion'?'覆盖长消息、切换会话以及新消息到达时的阅读位置。':'在 Chat 中搜索会话标题和内容，快速回到相关讨论。');
 run(s,[step('已读取当前上下文与可用能力',`当前项目：${project}。创建的是独立待办，不自动建立父子层级。`),step(`准备创建待办 · ${project}`,`标题：${title}\n描述：${content}`)],m=>{
  const t=createTask(project,title,content,s,whole);
  if(whole){s.title=t.title;s.pending=null}
  m.tools.push(step(`已创建待办 · ${project} / ${t.id}`,'本地模拟业务回执；生产必须以原生能力真实回执为准。'));
  m.text=whole?'已把这段讨论整理成待办。历史和当前对话都保留，我们可以直接在这里继续推进。':'已记为当前项目的另一条待办。我们继续聊滚动恢复，需要时再从待办列表进入它。';
  m.card=t.id;m.receipt=whole?'当前对话已关联此待办':'从当前对话创建 · 当前讨论保持不变';
 },{kind,requestedText});
}
function readTask(s,id,extra=''){
 const t=findTask(id);
 run(s,[step(`已读取待办 · ${t.project} / ${t.id}`,`版本 ${t.revision}\n${t.content}`)],m=>{m.text=`${t.title}\n${t.content}\n\n${extra||'已载入待办上下文。你可以直接让我分析、补充内容，或者继续执行。'}`});
}
function updateTask(s){
 const t=findTask(s.mainTask);if(!t){addMessage(s,{role:'agent',text:'你要修改哪个待办？可以从右侧待办列表选择，或在消息里指出它。'});return}
 run(s,[step(`已读取最新待办 · ${t.id}`,`版本 ${t.revision}\n${t.content}`),step('准备更新完成标准','追加：切换会话后恢复原阅读位置。')],m=>{
  t.content+='\n完成标准：切换会话后恢复原阅读位置。';t.revision++;
  m.tools.push(step(`已写回待办 · ${t.id}`,`版本 ${t.revision}`));m.text='已将这条完成标准写入待办。你可以继续补充，也可以让我按最新目标执行。';m.card=t.id;
 },{kind:'update'});
}
function executeTask(s){
 const t=findTask(s.mainTask);if(!t){addMessage(s,{role:'agent',text:'请说明执行目标，或先从右侧选择待办。'});return}
 run(s,[step(`已读取执行目标 · ${t.id}`,t.content),step('模拟：检查工作区实现',`工作区 ${s.workspace}；没有运行文件或终端工具。`)],m=>{
  m.text='这里将沿当前对话推进待办：检查代码、修改、验证，再通过原生能力记录结果。\n本次为交互模拟，没有执行代码，也没有把待办标为完成。';
 });
}
async function sendIntent(text,explicit='',envelope={}){
 const s=current();if(s.busy)return;
 addMessage(s,{role:'user',text,envelope});
 if(envelope.refs?.length){
  const ok=await run(s,envelope.refs.map(ref=>step(`已读取引用 · ${ref.label}`,ref.kind==='待办'?findTask(ref.id)?.content:'本地文件样本：Chat 按会话保存草稿和阅读位置；引用已加入本条上下文。')),()=>{});
  if(!ok)return;
 }
 if(envelope.capability?.id==='diagnose'){
  await run(s,[step('已载入 Skill · 问题诊断','原型样本；生产需发现和读取真实 skill 指令。')],m=>{m.text='将按问题诊断方法，结合你提供的引用检查复现条件与证据。本次只演示能力与引用一起发送的过程。'});return;
 }
 if(explicit==='whole'||envelope.capability?.id==='summarize'||text==='把这段对话整理成待办。'){
  if(s.mainTask){addMessage(s,{role:'agent',text:'这段对话已经对应一个待办，可以继续补充或执行。',card:s.mainTask});return}
  createFromIntent(s,'whole');return;
 }
 if(envelope.capability?.id==='create'){
  if(!text.trim()){s.pending='create';addMessage(s,{role:'agent',text:'想在当前项目记下什么？直接告诉我这件事的内容。'});return}
  createFromIntent(s,'other',text);return;
 }
 if(s.pending==='create'){s.pending=null;createFromIntent(s,'other',text);return}
 if(text==='重试刚才的操作'){
  const previous=[...s.messages].reverse().find(m=>m.retry);
  if(previous){const r=previous.retry;delete previous.retry;if(r.kind==='update')updateTask(s);else createFromIntent(s,r.kind,r.requestedText);return}
 }
 if(text===SAMPLE.other||text==='给 Chat 增加会话搜索'){createFromIntent(s,'other');return}
 if(text===SAMPLE.update||text==='补充完成标准'){updateTask(s);return}
 if(text===SAMPLE.execute||text==='继续执行'){executeTask(s);return}
 if(text===SAMPLE.suggest){s.pending='suggestion';addMessage(s,{role:'agent',text:'还可以单独补充滚动恢复的边界测试。需要我记成另一个待办时，直接告诉我即可。'});return}
 if(s.pending==='suggestion'&&text==='记成另一个待办'){s.pending=null;createFromIntent(s,'suggestion');return}
 if(text==='先不记，继续当前讨论'){s.pending=null;addMessage(s,{role:'agent',text:'好，继续当前讨论，没有创建其他待办。'});return}
 addMessage(s,{role:'agent',text:envelope.refs?.length?'已读取本条引用。引用不会切换当前会话或自动修改待办；后续按你的消息继续分析。本条为模拟反馈。':'这条自由输入已留在当前对话。本原型不连接真实 Agent；可使用能力入口或探索工具体验预设路径。'});
}
function selectSession(id){capture();state.selected=id;notice='';$('#sidebar').classList.remove('open');$('#list-toggle').setAttribute('aria-expanded','false');render();$('#draft').focus()}
function openTask(id){
 const t=findTask(id);let s=state.sessions.find(s=>s.thread===t.thread);
 if(s){selectSession(s.id);return}
 capture();
 const n=state.sessions.length+1;
 s={id:'c'+n,thread:'chat-thread-'+String(n).padStart(2,'0'),workspace:t.project,title:t.title,mainTask:t.id,draft:'',scroll:0,pending:null,messages:[]};
 t.thread=s.thread;state.sessions.push(s);state.selected=s.id;notice='';
 $('#sidebar').classList.remove('open');$('#list-toggle').setAttribute('aria-expanded','false');render();readTask(s,id);$('#draft').focus();
}
function tab(name){state.tab=name;$('#search').value='';renderList();persist()}
$('#sessions-tab').onclick=()=>tab('sessions');$('#tasks-tab').onclick=()=>tab('tasks');
$('.tabs').onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();tab(state.tab==='sessions'?'tasks':'sessions');$('#'+state.tab+'-tab').focus()}};
$('#search').oninput=renderList;
$('#draft').oninput=e=>{current().draft=$('#draft').value;persist();if(!e.isComposing)window.Composer?.trigger()};
$('#messages').onscroll=()=>{current().scroll=$('#messages').scrollTop;persist()};
$('#composer').onsubmit=e=>{
 e.preventDefault();if(current().busy){stop();return}
 const value=$('#draft').value.trim(),envelope=window.Composer.take();if(!value&&!envelope.capability&&!envelope.refs.length)return;
 current().draft='';$('#draft').value='';sendIntent(value,'',envelope);$('#draft').focus();
};
$('#draft').onkeydown=e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&!e.isComposing){e.preventDefault();if(!current().busy)$('#composer').requestSubmit()}};
$('#convert').onclick=()=>{capture();sendIntent('把这段对话整理成当前项目的待办，并在这个对话里继续推进。','whole')};
$('#new-chat').onclick=()=>{
 if(state.tab==='tasks'){$('#close-list').click();window.Composer.choose('create');return}
 capture();const n=state.sessions.length+1;
 state.sessions.push({id:'c'+n,thread:'chat-thread-'+String(n).padStart(2,'0'),workspace:'ArcOrbit',title:'新对话',mainTask:null,draft:'',scroll:0,pending:null,messages:[]});
 state.selected='c'+n;tab('sessions');render();$('#draft').focus();
};
$('#close-list').onclick=()=>{$('#sidebar').classList.remove('open');$('#list-toggle').setAttribute('aria-expanded','false');$('#list-toggle').focus()};
$('#list-toggle').onclick=()=>{const open=$('#sidebar').classList.toggle('open');$('#list-toggle').setAttribute('aria-expanded',String(open))};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#sidebar').classList.contains('open')){$('#sidebar').classList.remove('open');$('#list-toggle').setAttribute('aria-expanded','false');$('#list-toggle').focus()}});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.task)openTask(b.dataset.task);
 if(b.dataset.session)selectSession(b.dataset.session);
 if(b.dataset.read&&!current().busy)readTask(current(),b.dataset.read);
 if(b.dataset.example){const v=SAMPLE[b.dataset.example];$('#draft').value=v;current().draft=v;persist();$('#draft').focus()}

});
$('#reset').onclick=()=>{jobs.clear();state=seed();notice='';$('#search').value='';$('#fail-next').checked=false;render()};
render();
