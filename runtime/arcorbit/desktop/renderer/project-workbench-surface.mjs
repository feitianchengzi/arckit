import { createWorkbenchActivitySync } from './workbench-activity-sync.mjs';
import { renderRestrictedMarkdown as markdown } from './restricted-markdown.mjs';
import { parseTaskAttachmentContent } from '../../src/work-task-attachment-content.mjs';
import { stateLabels, tabs, title, escape as e, visibleTasks, runtimeGroups, taskMode, sceneMessages } from './project-workbench-model.mjs';
const button=(action,label,extra='',style='')=>`<button type="button" class="pw-button ${style}" data-pw-action="${action}" ${extra}>${label}</button>`;
const icon=name=>`<svg class="pw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${{grid:'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',list:'M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1',settings:'M4 7h16M4 17h16M8 4v6M16 14v6',search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',chevron:'m9 5 7 7-7 7',close:'m6 6 12 12M18 6 6 18'}[name]||''}"></path></svg>`;
const time=value=>value?new Date(value).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'时间未记录';
const lines=items=>Array.isArray(items)&&items.length?`<ul>${items.map(item=>`<li>${e(item)}</li>`).join('')}</ul>`:'<p class="pw-note">尚无记录</p>';
const section=(name,body,action='')=>`<section class="pw-section"><h2><span>${name}</span>${action}</h2>${body}</section>`;
const options=(items,value)=>items.map(([id,label])=>`<option value="${e(id)}" ${String(id)===String(value)?'selected':''}>${e(label)}</option>`).join('');

export function createProjectWorkbenchSurface({root,api,navigate,openSettings}) {
  const state={active:false,project:'all',task:'',tab:'overview',filter:'',search:'',executor:'',priority:'',activityFilter:'all',chat:false,list:false,runtime:false,snapshot:null,detail:null,error:'',loading:false,drafts:{},scroll:{},pending:{},scope:'',newDraft:null};
  let refreshPromise=null,refreshAgain=false,selectionEpoch=0,timer=0,dialog=null,returnFocus=null,configTask='',persistTimer=0,activityPaintTimer=0,activityDetailChanged=false;
  // Compare generated markup, not browser-normalized innerHTML or user-expanded details.
  const paintedHTML=new WeakMap();
  const q=selector=>root.querySelector(selector);
  root.innerHTML=`<div class="pw-shell"><header class="pw-top"><div class="pw-breadcrumb"><strong>Thing</strong></div><div class="pw-top-actions">${button('list',icon('list')+'事情列表','aria-label="打开或收起事情列表"','pw-list-toggle')}${button('runtime','运行状态','aria-haspopup="dialog" aria-expanded="false" aria-controls="pw-runtime" title="查看所有项目的本机运行状态"','pw-runtime-trigger')}</div></header>
    <main class="pw-center"><div class="pw-detail"><div class="pw-heading"></div><nav class="pw-tabs" role="tablist" aria-label="事情详情类别"></nav><div class="pw-body"></div></div><div class="pw-scrim" hidden></div><section class="pw-chat" hidden role="dialog" aria-label="事情协作消息"><header><strong>与 Agent 协作</strong><small data-chat-status></small>${button('chat.close','×','aria-label="关闭协作消息"')}</header><div class="pw-messages"></div></section>
    <div class="pw-error" role="status"></div><footer class="pw-composer"><div class="pw-composer-head"><span data-compose-hint>表达目标，或调整这件事情的方向</span>${button('chat.open','协作消息','','quiet small')}</div><textarea aria-label="与 Agent 协作" placeholder="输入目标、问题或补充说明…"></textarea><div class="pw-compose-foot">${button('voice','◉','disabled title="语音输入尚未开放"','quiet pw-voice')}<label>Model<input data-config="model" maxlength="200" list="pw-models"></label><datalist id="pw-models"></datalist><label>Level<input data-config="level" maxlength="200" list="pw-levels"></label><datalist id="pw-levels"><option value="low"><option value="medium"><option value="high"><option value="xhigh"></datalist>${button('chat.stop','停止回复','hidden','small')}${button('send','发送','title="⌘ / Ctrl + Enter 发送"','primary pw-send')}</div></footer></main>
    <aside class="pw-list" aria-label="事情列表"><header class="pw-list-head"><div class="pw-list-title"><strong>事情 <small data-pw-count>0</small></strong><div class="pw-list-controls"><select data-filter="state" aria-label="事情状态">${options([['','全部状态'],['attention','需要我关注'],...Object.entries(stateLabels)],'')}</select>${button('filters',icon('settings'),'aria-label="更多筛选" title="更多筛选" aria-expanded="false" aria-controls="pw-extra-filters"','quiet pw-filter-toggle')}${button('list.close',icon('close'),'aria-label="关闭事情列表"','quiet pw-list-close')}</div></div><label class="pw-search-field">${icon('search')}<input class="pw-search" placeholder="搜索事情…" aria-label="搜索事情或编号"></label><div id="pw-extra-filters" class="pw-extra" hidden><label>执行人<select data-filter="executor" aria-label="执行人"></select></label><label>优先级<select data-filter="priority" aria-label="优先级">${options([['','全部优先级'],['0','无优先级'],['1','P1'],['2','P2'],['3','P3']],'')}</select></label>${button('clear','清除筛选','','quiet small')}</div></header><div class="pw-rows"></div><footer class="pw-list-foot">${button('create','＋ 发起事情','','primary')}</footer></aside>
    <aside id="pw-runtime" class="pw-runtime" hidden role="dialog" tabindex="-1" aria-labelledby="pw-runtime-title"></aside></div>`;
  function persist(){clearTimeout(persistTimer);persistTimer=0;if(state.scope)try{localStorage.setItem(`arcorbit-workbench:${state.scope}`,JSON.stringify({project:state.project,task:state.task,tab:state.tab,filter:state.filter,search:state.search,executor:state.executor,priority:state.priority,drafts:state.drafts,scroll:state.scroll}));}catch{}}
  // Keep synchronous storage off the scrolling path; navigation and pagehide flush immediately.
  function schedulePersist(){clearTimeout(persistTimer);persistTimer=setTimeout(persist,250);}
  function restore(scope){if(state.scope===scope)return;state.scope=scope;Object.assign(state,{task:'',project:'all',tab:'overview',drafts:{},scroll:{},chat:false,detail:null});try{const saved=JSON.parse(localStorage.getItem(`arcorbit-workbench:${scope}`)||'{}');for(const key of ['task','tab','filter','search','executor','priority','drafts','scroll'])if(saved[key]!==undefined)state[key]=saved[key];}catch{}q('.pw-search').value=state.search;q('[data-filter=state]').value=state.filter;q('[data-filter=priority]').value=state.priority;}
  function paint(node,html){if(!node||paintedHTML.get(node)===html)return;const top=node.scrollTop;const focused=node.contains(document.activeElement)?document.activeElement:null;const identity=focused?JSON.stringify(focused.dataset):'';node.innerHTML=html;paintedHTML.set(node,html);node.scrollTop=top;if(identity) [...node.querySelectorAll('button,input,select')].find(n=>JSON.stringify(n.dataset)===identity)?.focus({preventScroll:true});}
  function saveScroll(){if(state.task){state.scroll[`${state.task}:${state.tab}`]=q('.pw-body').scrollTop;state.scroll[`${state.task}:messages`]=q('.pw-messages').scrollTop;}state.scroll.list=q('.pw-rows').scrollTop;}
  function restoreScroll(){q('.pw-body').scrollTop=state.scroll[`${state.task}:${state.tab}`]||0;q('.pw-messages').scrollTop=state.scroll[`${state.task}:messages`]||0;q('.pw-rows').scrollTop=state.scroll.list||0;}
  async function refresh(){
    if(!state.active)return;
    if(refreshPromise){refreshAgain=true;return refreshPromise;}
    refreshPromise=(async()=>{do{refreshAgain=false;const epoch=selectionEpoch;try{
      state.loading=!state.snapshot;render();const snapshot=await api.projectWorkbenchSnapshot();if(!state.active)return;restore(snapshot.account_scope);state.snapshot=snapshot;
      if(!state.task){const task=visibleTasks(snapshot,state)[0];if(task)state.task=String(task.id);}
      if(state.task && epoch===selectionEpoch){const id=state.task;try{const detail=await api.projectWorkbenchDetail(id);if(id===state.task && epoch===selectionEpoch)state.detail=detail;}catch(error){if(id===state.task)state.error=error.message;}}
      if(!q('[data-config=model]').value){q('[data-config=model]').value=snapshot.settings?.codex?.chat?.model||'';q('[data-config=level]').value=snapshot.settings?.codex?.chat?.reasoning_effort||'medium';}
      render();persist();
    }catch(error){state.error=error.message;render();}finally{state.loading=false;}}while(refreshAgain&&state.active);})().finally(()=>{refreshPromise=null;});return refreshPromise;
  }
  const activitySync=createWorkbenchActivitySync({
    getDetail:()=>state.active?state.detail:null,
    readActivity:id=>api.runActivitySnapshot(id),
    shouldPause:()=>Boolean(refreshPromise),
    onUpdate:(_detail,{detailChanged})=>{
      activityDetailChanged ||= detailChanged;
      if(activityPaintTimer)return;
      activityPaintTimer=setTimeout(()=>{
        activityPaintTimer=0;
        const detailChanged=activityDetailChanged;activityDetailChanged=false;
        if(!state.active||!state.detail)return;
        if(detailChanged)renderDetail(state.detail);
        if(state.chat)renderMessages(state.detail);
      },80);
    },
    onError:error=>{state.error=error.message;q('.pw-error').textContent=state.error;}
  });
  function schedule(){if(timer)return;timer=setTimeout(()=>{timer=0;void refresh();},180);}
  function render(){
    q('.pw-error').textContent=state.error;
    if(!state.snapshot){paint(q('.pw-heading'),'<h1>Thing</h1>');paint(q('.pw-body'),`<div class="pw-empty">${state.error?'无法载入事情，请重试。':'正在同步项目与事情…'}${button('refresh','重新加载')}</div>`);return;}
    const s=state.snapshot,t=state.detail?.task,projects=s.projects||[];
    const groups=runtimeGroups(s),modes=new Map(groups.flatMap(g=>g.items.map(i=>[i.id,g.group])));
    const tasks=visibleTasks(s,state);q('[data-pw-count]').textContent=tasks.length;
    paint(q('.pw-rows'),tasks.length?tasks.map(task=>`<button type="button" class="pw-task-row" data-state="${e(task.state)}" data-pw-action="select" data-id="${e(task.id)}" aria-selected="${String(task.id)===state.task}" title="${e(String(task.content||'').split(/\r?\n/)[0])} · #${e(task.id)}"><span>${task.state==='accepted'?'◆':task.state==='completed'?'✓':'○'}</span><span class="pw-row-title">${e(title(task))}</span><small>${e(taskMode(task,s,state.detail,modes))}</small></button>`).join(''):`<div class="pw-empty">没有匹配的事情${button('clear','清除筛选')}</div>`);
    const executors=new Map((s.tasks||[]).filter(t=>t.executor_id).map(t=>[String(t.executor_id),t.executor_name||`成员 ${t.executor_id}`]));paint(q('[data-filter=executor]'),options([['','全部执行人'],...executors],state.executor));
    const counts=Object.fromEntries(groups.map(g=>[g.group,g.items.length])),offline=['offline','error','degraded','logged_out','unauthenticated'].includes(s.source_status);
    const runButton=q('[data-pw-action=runtime]'),labels=[counts.running?`${counts.running} 执行中`:'',counts.queued?`${counts.queued} 排队`:'',counts.attention?`${counts.attention} 待处理`:''].filter(Boolean);
    paint(runButton,`<i class="pw-runtime-dot ${counts.attention?'attention':counts.running?'running':''}"></i><span>${offline?'运行状态 · 连接中断':labels.join(' · ')||'运行状态 · 空闲'}</span>${icon('chevron')}`);runButton.setAttribute('aria-expanded',String(state.runtime));
    paint(q('.pw-runtime'),`<header><div><h2 id="pw-runtime-title">运行状态</h2><p>所有项目 · 此设备</p></div>${button('runtime.close',icon('close'),'aria-label="关闭运行状态"','quiet small')}</header><div class="pw-runtime-body">${offline?'<p class="pw-runtime-empty">连接已中断，以下为此设备保留的状态。</p>':''}${groups.filter(g=>g.items.length).map(g=>`<section class="pw-runtime-group"><h3>${{attention:'需要处理',running:'正在执行',queued:'等待执行'}[g.group]} <span>${g.items.length}</span></h3>${g.items.map(i=>`<button type="button" class="pw-runtime-item" data-pw-action="runtime.select" data-id="${e(i.id)}"><div><strong>${e(title(i.task))}</strong><small>${e(projects.find(p=>p.id===String(i.task.project_id))?.name||'')} · ${e({attention:'待介入',running:'Auto 进行中',queued:'等待执行'}[g.group])}</small><p>${e(i.reason||'查看事情进展')}</p></div>${icon('chevron')}</button>`).join('')}</section>`).join('')||'<div class="pw-runtime-empty"><strong>当前没有自动执行中的事情</strong><p>可以从事情详情开始 Auto，或在执行设置中管理自动领取。</p></div>'}</div><footer><span>点选事情，查看进展或介入</span>${button('settings','执行设置','','quiet small')}</footer>`);
    q('.pw-runtime').hidden=!state.runtime;q('.pw-shell').classList.toggle('list-open',state.list);
    if(!t || String(t.id)!==state.task){paint(q('.pw-heading'),'<h1>从一件事情开始</h1>');paint(q('.pw-tabs'),'');paint(q('.pw-body'),`<div class="pw-empty">选择右侧事情查看目标和成果。<br>也可以在下方直接说出想法，创建自己的事情并开始讨论。</div>`);}
    else {renderDetail(state.detail);if(state.chat)renderMessages(state.detail);}
    const draft=state.drafts[state.task || 'new']||{};if(configTask!==state.task && (!state.task || t)){q('[data-config=model]').value=draft.model || state.detail?.session?.model || s.settings?.codex?.chat?.model || '';q('[data-config=level]').value=draft.level || state.detail?.session?.reasoning_effort || s.settings?.codex?.chat?.reasoning_effort || 'medium';configTask=state.task;}const input=q('.pw-composer textarea');if(document.activeElement!==input&&input.value!==String(draft.text||''))input.value=draft.text||'';
    q('[data-pw-action="chat.stop"]').hidden=!activeDiscussion();
    q('[data-pw-action=send]').disabled=Boolean(state.pending.send)||state.detail?.task.state==='accepted';
    q('[data-compose-hint]').textContent=state.detail?.current_turn_owner?.startsWith('auto:')?'补充消息会交给当前执行；需要改变方向可先暂停讨论':state.detail?.scene.pause_requested?'已请求暂停 · 讨论结束后由你决定继续 Auto':'表达目标，或调整这件事情的方向';
    updateChat();
  }
  function activeDiscussion(){return ['starting','running','waiting_approval','interrupting'].includes(state.detail?.session?.status);}
  function renderDetail(d){
    const t=d.task,readonly=t.state==='accepted',active=d.executions[0],mode=taskMode(t,state.snapshot,d);
    let actions=button('chat.open','先分析');
    if(['pending_review','pending','blocked'].includes(t.state))actions+=button('auto.start','Auto 执行','','primary');
    if(t.state==='pending'&&runtimeGroups(state.snapshot)[2].items.some(i=>i.id===String(t.id)))actions+=button('auto.unqueue','移出队列');
    if(active)actions+=active.active_run?.status==='running'?button('auto.pause','暂停讨论')+button('auto.stop','停止','','danger'):button('auto.resume','继续 Auto','','primary')+button('auto.stop','停止','','danger');
    else if(d.history.length&&t.state!=='accepted'&&t.state!=='pending')actions+=button('auto.resume','继续 Auto','','primary');
    if(d.attention.some(a=>a.kind==='external_dependency')||active?.phase==='waiting_external')actions+=button('auto.external','重新检查外部结果');
    if(t.state==='completed')actions+=button('acceptance.accept','确认验收','','primary')+button('feedback','提出验收问题');
    if(readonly)actions=button('chat.open','查看协作消息');
    paint(q('.pw-heading'),`<div class="pw-meta"><span>${e(state.snapshot.projects.find(p=>p.id===String(t.project_id))?.name||'项目')} · #${e(t.id)} · ${e(t.executor_name||`执行人 ${t.executor_id||'未分配'}`)} · ${t.priority?`P${e(t.priority)}`:'无优先级'}</span>${button('properties','属性','','quiet small')}</div><div class="pw-title-row"><h1>${e(title(t))}</h1><span class="pw-badge">${e(mode)}</span><div class="pw-actions">${actions}</div></div>`);
    paint(q('.pw-tabs'),Object.entries(tabs).map(([id,name])=>`<button type="button" role="tab" data-pw-action="tab" data-id="${id}" aria-selected="${state.tab===id}">${name}</button>`).join(''));
    const html=state.tab==='overview'?overview(d):state.tab==='context'?context(d):state.tab==='results'?results(d):activity(d);
    paint(q('.pw-body'),html);
  }
  function criteria(d){return `<div class="pw-note">本机协作标准 · ${d.scene.goal_version?'按当前目标核对；目标变化后需要重新检查。':'由你定义完成标准。'}</div>${d.scene.criteria.map(c=>`<label class="pw-check"><input type="checkbox" data-criterion="${e(c.id)}" ${c.checked?'checked':''} ${d.task.state==='accepted'?'disabled':''}><span>${e(c.text)} ${c.status==='proposed'?'<small class="pw-badge">Agent 建议 · 勾选采纳</small>':''}</span></label>`).join('')||'<p class="pw-note">尚未定义完成标准</p>'}`;}
  function overview(d){
    const report=d.scene.reports.at(-1),result=d.result;
    const current=report?.current || report?.summary || result?.summary || d.executions[0]?.intervention_reason;
    const advances=report?.advances || result?.task_progress?.evidence || [];
    const remaining=report?.remaining || result?.task_progress?.remaining || [];
    return (d.recovery.length||d.attention.length?section('需要处理',d.attention.map(a=>`<div class="pw-card source"><strong>${e(a.question||a.reason||'需要人工判断')}</strong><p>${e(a.intervention_resume_condition||a.resume_condition||'先讨论，再明确继续执行。')}</p>${button('chat.open','与 Agent 讨论','','small')}${button('auto.resume','按新方向继续','','primary small')}</div>`).join('')+d.recovery.map(r=>`<div class="pw-card"><p>${e(r.message||r.reason)}</p>${(r.actions||[]).map(action=>button('recovery',e({retry_sync:'重新同步',retry_start:'恢复执行',feedback_continue:'补充说明并继续',mark_blocked:'标记阻塞',retry_complete:'重试完成写回',accept_server_state:'采用服务端状态',retry_case_reuse:'复用已有 Case',retry_as_new_case:'作为新事情继续'}[action]||action),`data-id="${e(r.id)}" data-operation="${e(action)}"`,'small')).join('')}</div>`).join('')):'')+section('目标',`<div class="pw-markdown">${markdown(d.task.content)}</div>`,d.task.state==='accepted'?'':button('goal.edit','编辑','','quiet small'))+
      section('当前工作',`<div class="pw-card source"><div class="pw-note">${report?(report.source==='user_selected_message'?'用户整理的消息 · ':'Agent 工作判断 · ')+time(report.at):result?'最近运行结果 · Agent 声明':'执行状态与已有记录'}</div><p>${e(current||'尚未开始分析或执行')}</p><div class="pw-split"><div><h3>最近推进</h3>${lines(advances)}</div><div><h3>仍需解决</h3>${lines(remaining)}</div></div>${report?.next?`<p><strong>下一步意图</strong> ${e(report.next)}</p>`:''}</div><details><summary>当前安排 ${d.scene.plan.length?`· ${d.scene.plan.length} 项`:''} <span class="pw-note">${{pending:'待当前执行读取',read:'Agent 已读取',available:'已保存',agent_proposed:'Agent 建议'}[d.scene.plan_status]||'按需制定'}</span></summary>${lines(d.scene.plan)}<p class="pw-note">安排可以调整、清空；完成由目标、证据和验收判断。</p>${d.task.state==='accepted'?'':button('plan.edit','调整安排','','small')}</details>`)+
      section('完成标准',criteria(d),d.task.state==='accepted'?'':button('criteria.edit','设置','','quiet small'))+
      section('已采纳约定',d.scene.agreements.filter(a=>a.status==='accepted').map(a=>`<p>${e(a.text)}</p>`).join('')||'<p class="pw-note">尚无约定</p>')+
      section('最近阶段成果',report?`<div class="pw-card"><p>${e(report.summary||report.current)}</p>${button('tab','查看成果','data-id="results"','quiet small')}</div>`:'<p class="pw-note">讨论与执行产生的成果会显示在这里。</p>')+
      section('关联事情',(d.task.father_id?`<div class="pw-line"><span>父事情 #${e(d.task.father_id)}</span>${button('select','查看',`data-id="${e(d.task.father_id)}"`,'quiet small')}</div>`:'')+d.children.map(t=>`<div class="pw-line"><span>${e(title(t))}</span>${button('select',stateLabels[t.state]||'查看',`data-id="${e(t.id)}"`,'quiet small')}</div>`).join('')||'<p class="pw-note">暂无子事情</p>',d.task.state==='accepted'?'':button('child.create','＋ 子事情','','quiet small'));
  }
  function attachmentBody(a){try{const p=parseTaskAttachmentContent(a);return p.text||p.external_url||p.files.join('\n');}catch{return String(a.content||'');}}
  function context(d){
    const classified=a=>d.scene.context.find(c=>String(c.id)===String(a.id));
    const materials=d.attachments.filter(a=>classified(a)?.kind!=='comment');
    const comments=d.attachments.filter(a=>classified(a)?.kind==='comment');
    const row=a=>`<article class="pw-card"><div class="pw-line"><span>${e(a.type==='url'?'链接':a.type==='file'?'文件':'文本')} · ${e(attachmentBody(a).slice(0,95))}</span>${button('material.preview','查看',`data-id="${e(a.id)}"`,'quiet small')}</div><div class="pw-note">${e(a.creator_name||'事情协作资料')} · ${time(a.created_at)}${d.task.state==='accepted'?'':` · <label><input type="checkbox" data-context="${e(a.id)}" ${classified(a)?.included?'checked':''}> 交给 Agent 作为上下文</label>`}</div>${d.task.state==='accepted'?'':button('material.remove','移除',`data-id="${e(a.id)}"`,'quiet small danger')}</article>`;
    return section('事情资料',`<p class="pw-note">资料保存在共享事情中。勾选表示允许本次协作引用，不代表 Agent 已经读取文件。旧资料保留原始内容与来源。</p>${d.attachment_error?`<p class="pw-error">${e(d.attachment_error)}</p>`:''}${materials.map(row).join('')||'<p class="pw-note">暂无资料</p>'}`,d.task.state==='accepted'?'':button('material.add','＋ 添加资料','','quiet small'))+
      section('协作约定','<p class="pw-note">约定保存在此账号的本机协作状态，Agent 与详情共同使用。</p>'+d.scene.agreements.map(a=>`<article class="pw-card"><p>${e(a.text)}</p><div class="pw-note">${a.status==='accepted'?'已采纳':'待采纳'} · ${e(a.source)} · ${time(a.at)}</div>${a.message_id?button('message.locate','查看来源',`data-id="${e(a.message_id)}"`,'quiet small'):''}${d.task.state==='accepted'?'':`${a.status!=='accepted'?button('agreement.adopt','采纳',`data-id="${e(a.id)}"`,'small'):''}${button('agreement.edit','编辑',`data-id="${e(a.id)}"`,'quiet small')}`}</article>`).join('')||'<p class="pw-note">暂无协作约定</p>',d.task.state==='accepted'?'':button('agreement.add','＋ 约定','','quiet small'))+
      section('事情留言',`<p class="pw-note">留言对事情协作者可见；Agent 对话保留在此设备的主协作会话。</p>${comments.map(a=>`<article class="pw-card"><div class="pw-markdown">${markdown(attachmentBody(a))}</div><small>${time(a.created_at)}</small>${d.task.state==='accepted'?'':button('comment.to-agent','交给 Agent',`data-id="${e(a.id)}"`,'quiet small')}</article>`).join('')||'<p class="pw-note">尚无本界面标记的协作留言；旧附件式留言保留在上方资料中。</p>'}`,d.task.state==='accepted'?'':button('comment.add','写留言','','quiet small'));
  }
  function results(d){
    const reports=[...d.scene.reports].reverse();if(!reports.length&&d.result?.summary)reports.push({summary:d.result.summary,current:'',artifacts:[],at:d.runs[0]?.finished_at||d.runs[0]?.started_at});
    const artifacts=reports.flatMap(r=>r.artifacts.map(a=>({...a,at:r.at,source:'Agent 声明'})));
    for(const a of d.result?.artifact_impacts||[])artifacts.push({...a,source:'运行结果声明'});
    return section('阶段成果',reports.map(r=>`<article class="pw-card"><div class="pw-note">${r.source==='user_selected_message'?'用户整理的消息':'Agent 声明'} · ${time(r.at)}</div><div class="pw-markdown">${markdown(r.summary||r.current)}</div></article>`).join('')||'<p class="pw-note">尚无结构化成果。协作消息中的内容可保存为阶段成果。</p>')+
      section('成果文件',artifacts.map(a=>`<article class="pw-card"><strong>${e(a.path)}</strong><p>${e(a.summary)}</p><small>${e(a.source)} · ${e(a.version||'未声明版本')}</small>${button('asset.preview','预览当前文件',`data-path="${e(a.path)}"`,'quiet small')}</article>`).join('')||'<p class="pw-note">暂无文件成果声明</p>')+
      section('验证与交付证据',`<p class="pw-note">下方来自真实运行结果；Agent 自述与实际验证记录分别保留，未记录不能视为通过。</p>${d.activity?.ledger_write_result?`<div class="pw-card"><strong>账本回写回执</strong><pre>${e(JSON.stringify(d.activity.ledger_write_result,null,2))}</pre></div>`:''}${d.activity?.closeout_result?`<div class="pw-card"><strong>Git 交付结果</strong><pre>${e(JSON.stringify(d.activity.closeout_result,null,2))}</pre></div>`:''}${d.runs.map(r=>`<div class="pw-line"><span>${e(r.id)}<small class="pw-note"> · ${time(r.finished_at||r.started_at)}</small></span>${button('run.messages',e(r.status),`data-id="${e(r.id)}"`,'quiet small')}</div>`).join('')||'<p class="pw-note">尚无运行证据</p>'}`)+
      section('验收检查',criteria(d),d.task.state==='accepted'?'':button('criteria.edit','调整标准','','quiet small'))+
      section('验收问题',d.feedback.map(f=>`<article class="pw-card"><p>${e(f.original_feedback)}</p><div class="pw-note">${e(f.status)} · ${e(f.progress||f.blocking_reason)}</div></article>`).join('')||'<p class="pw-note">暂无验收问题。修复作为独立执行保留，原事情保持已完成。</p>',d.task.state==='completed'?button('feedback','提出问题','','quiet small'):'');
  }
  function activity(d){const items=[...d.scene.events.map(i=>({...i,category:i.action.startsWith('auto.')?'execution':i.action.startsWith('task.')?'task':'collaboration'})),...d.runs.map(r=>({id:r.id,at:r.started_at,actor:'Runtime',category:'execution',summary:`${r.id} · ${r.status}`,run_id:r.id}))].sort((a,b)=>String(b.at).localeCompare(String(a.at)));return section('活动',`<div class="pw-actions">${[['all','全部'],['task','事情'],['execution','执行'],['collaboration','协作']].map(([id,name])=>button('activity.filter',name,`data-id="${id}"`,state.activityFilter===id?'primary small':'small')).join('')}</div><p class="pw-note">仅展示有来源的真实事件。旧事情缺少的历史不会根据更新时间补造。</p>${items.filter(i=>state.activityFilter==='all'||i.category===state.activityFilter).map(i=>`<div class="pw-line"><span>${e(i.summary)}<br><small class="pw-note">${e(i.actor)} · ${time(i.at)}</small></span>${i.message_id?button('message.locate','消息',`data-id="${e(i.message_id)}"`,'quiet small'):''}${i.run_id?button('run.messages','记录',`data-id="${e(i.run_id)}"`,'quiet small'):''}</div>`).join('')||'<p class="pw-note">暂无可展示的事件</p>'}`);}
  function renderMessages(d){const box=q('.pw-messages'),atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<60;paint(box,sceneMessages(d).map(m=>`<article class="pw-message ${e(m.role)}" data-message-id="${e(m.id)}"><header><strong>${{user:'你',assistant:'Agent',tool:'工具',system:'系统'}[m.role]||'Agent'}</strong><span>${e(m.kind==='approval'?'等待审批':m.status||'')}</span><time>${time(m.created_at||m.at)}</time></header>${m.kind==='tool'?`<details><summary>${e(m.tool_name||'工具调用')}</summary><pre>${e(m.content)}</pre></details>`:`<div class="pw-markdown">${markdown(m.content)}</div>`}${m.kind==='approval'&&m.status==='pending'?button('approval.accept','允许一次',`data-id="${e(m.approval_request_id)}"`,'primary small')+button('approval.decline','拒绝',`data-id="${e(m.approval_request_id)}"`,'small'):''}${m.role==='assistant'&&d.task.state!=='accepted'?button('message.agreement','保存为约定',`data-id="${e(m.id)}"`,'quiet small')+button('message.result','保存为阶段成果',`data-id="${e(m.id)}"`,'quiet small'):''}</article>`).join('')||'<div class="pw-empty">从表达目标或提出问题开始。<br>这里始终围绕当前事情协作。</div>');if(atBottom)box.scrollTop=box.scrollHeight;q('[data-chat-status]').textContent=activeDiscussion()?'Agent 正在回复':d.current_turn_owner?.startsWith('auto:')?'Auto 正在执行':d.conversation_unavailable||d.session?.error||'主协作会话';}
  function updateChat(){q('.pw-chat').hidden=!state.chat;q('.pw-scrim').hidden=!state.chat;q('.pw-detail').inert=state.chat;q('.pw-detail').setAttribute('aria-hidden',String(state.chat));}
  function openChat(messageId){returnFocus=document.activeElement;state.chat=true;if(state.detail)renderMessages(state.detail);updateChat();if(messageId){const node=[...q('.pw-messages').querySelectorAll('[data-message-id]')].find(n=>n.dataset.messageId===messageId);node?.scrollIntoView({block:'center'});node?.classList.add('flash');}else q('.pw-composer textarea').focus();}
  function closeChat(){state.chat=false;updateChat();if(returnFocus?.isConnected)returnFocus.focus();}
  async function select(id){saveScroll();persist();selectionEpoch++;state.task=String(id);q('.pw-composer textarea').value=state.drafts[state.task]?.text||'';state.detail=null;state.chat=false;state.list=false;state.error='';render();restoreScroll();await refresh();restoreScroll();}

  async function invoke(action,payload={}){const input={task_id:state.task,expected_revision:state.detail?.scene.revision,request_id:crypto.randomUUID(),input:payload};const value=await api.projectWorkbenchCommand(action,input);state.error='';await refresh();return value;}
  async function act(fn){try{await fn();}catch(error){state.error=error.message;q('.pw-error').textContent=state.error;}}
  function showDialog(name,fields,onSubmit,submit='保存'){
    if(dialog)return;const opener=document.activeElement;dialog=document.createElement('dialog');dialog.className='pw-dialog';dialog.innerHTML=`<form><h2>${e(name)}</h2>${fields}<p class="pw-error" data-dialog-error role="status"></p><footer>${button('dialog.cancel','取消')}<button class="pw-button primary" type="submit">${e(submit)}</button></footer></form>`;document.body.append(dialog);const current=dialog;
    function close(){current.close();current.remove();dialog=null;opener?.isConnected&&opener.focus();}
    current.querySelector('[data-pw-action="dialog.cancel"]').onclick=close;current.addEventListener('cancel',event=>{event.preventDefault();if(!current.dataset.busy)close();});current.addEventListener('click',event=>{if(event.target===current&&!current.dataset.busy)close();});
    current.querySelector('form').onsubmit=async event=>{event.preventDefault();if(current.dataset.busy)return;current.dataset.busy='true';const controls=[...current.querySelectorAll('button')];controls.forEach(b=>b.disabled=true);try{const form=Object.fromEntries(new FormData(event.target));await onSubmit(form);close();}catch(error){current.querySelector('[data-dialog-error]').textContent=error.message;}finally{delete current.dataset.busy;controls.forEach(b=>b.disabled=false);}};current.showModal();return current;
  }
  const field=(label,name,value='',type='text')=>`<label>${e(label)}${type==='textarea'?`<textarea name="${name}">${e(value)}</textarea>`:`<input name="${name}" type="${type}" value="${e(value)}">`}</label>`;
  function editText(label,value,action,key='text'){showDialog(label,field(label,'value',value,'textarea'),form=>invoke(action,{[key]:form.value}));}
  function createTask(asChat=false,parent=''){
    const s=state.snapshot,projectId=state.project!=='all'&&state.project!=='attention'?state.project:s.projects[0]?.id;
    const requestId=state.newDraft?.request_id || crypto.randomUUID();
    showDialog(parent?'创建子事情':asChat?'发起事情并讨论':'发起事情',`<label>所属项目<select name="project_id">${options(s.projects.map(p=>[p.id,p.name]),projectId)}</select></label>${field('目标或问题','content',asChat?q('.pw-composer textarea').value:state.newDraft?.content||'','textarea')}<p class="pw-note">创建为待评审，执行人是你；Auto 由你单独发起。</p><label><input name="chat" type="checkbox" ${asChat?'checked':''}> 创建后与 Agent 讨论</label>`,async form=>{
      if(!form.content.trim())throw new Error('请输入事情内容。');state.newDraft={...form,request_id:requestId};
      const created=await api.projectWorkbenchCommand('task.create',{...form,father_id:parent,request_id:requestId});
      state.project='all';await select(created.task_id);state.newDraft=null;
      if(form.chat){state.drafts[state.task]={...state.drafts[state.task],text:form.content};q('.pw-composer textarea').value=form.content;persist();await send();}
    },'创建');
  }
  async function send(){
    if(!state.task){createTask(true);return;}
    const taskId=state.task;const message=q('.pw-composer textarea').value.trim();if(!message)return;
    const draft=state.drafts[state.task] ||= {};draft.request_id ||= crypto.randomUUID();state.pending.send=true;render();openChat();
    try{await api.projectWorkbenchCommand('chat.send',{task_id:taskId,text:message,request_id:draft.request_id,model:q('[data-config=model]').value,reasoning_effort:q('[data-config=level]').value});state.drafts[taskId]={...draft,text:'',request_id:''};if(state.task===taskId)q('.pw-composer textarea').value='';persist();await refresh();}finally{state.pending.send=false;render();}
  }
  async function handle(action,target){const id=target.dataset.id,d=state.detail;
    if(action==='refresh')return refresh();if(action==='sync'){await api.projectWorkbenchCommand('sync',{project_id:['all','attention'].includes(state.project)?'':state.project});state.error='';return refresh();}
    if(action==='select')return select(id);
    if(action==='clear'){state.filter=state.search=state.executor=state.priority='';q('.pw-search').value='';q('[data-filter=state]').value='';q('[data-filter=priority]').value='';render();persist();return;}
    if(action==='filters'){q('.pw-extra').hidden=!q('.pw-extra').hidden;target.setAttribute('aria-expanded',String(!q('.pw-extra').hidden));return;}
    if(action==='list'||action==='list.close'){state.list=action==='list'?!state.list:false;render();return;}
    if(action==='runtime'||action==='runtime.close'){state.runtime=action==='runtime'?!state.runtime:false;render();if(state.runtime)q('.pw-runtime').focus();else q('[data-pw-action=runtime]').focus();return;}
    if(action==='runtime.select'){const t=state.snapshot.tasks.find(t=>String(t.id)===id);state.runtime=false;state.project='all';state.filter=state.search=state.executor=state.priority='';q('.pw-search').value='';q('[data-filter=state]').value='';await select(id);return;}
    if(action==='settings'){state.runtime=false;render();openSettings();return;}
    if(action==='chat.open'){openChat();return;}if(action==='chat.close'){closeChat();return;}
    if(action==='send')return send();if(action==='create')return createTask();if(action==='child.create')return createTask(false,state.task);
    if(action==='tab'){saveScroll();state.tab=id;render();restoreScroll();persist();return;}
    if(action==='activity.filter'){state.activityFilter=id;render();return;}
    if(action==='message.locate'){openChat(id);return;}
    if(action==='run.messages'){const snapshot=await api.runActivitySnapshot(id);if(snapshot?.run?.activity){state.detail.activity=snapshot.run.activity;renderMessages(state.detail);openChat();}return;}
    if(action==='properties'){
      const project=state.snapshot.projects.find(p=>p.id===String(d.task.project_id));
      if(d.task.state==='accepted'){showDialog('事情属性',`<pre>${e(JSON.stringify({state:stateLabels[d.task.state],executor:d.task.executor_name||d.task.executor_id,priority:d.task.priority,tags:d.task.tags||d.task.raw?.tags,creator:d.task.creator_name||d.task.raw?.creator_id,created_at:d.task.created_at||d.task.raw?.created_at,updated_at:d.task.updated_at,completion_at:d.task.completion_at,father_id:d.task.father_id,project:project?.name},null,2))}</pre>`,async()=>{},'关闭');return;}
      showDialog('事情属性',`<p class="pw-note">${e(project?.name)} · #${e(d.task.id)} · ${e(taskMode(d.task,state.snapshot,d))}</p>${field('执行人 ID','executor_id',d.task.executor_id)}${field('优先级（0–3）','priority',d.task.priority,'number')}${field('标签（逗号分隔）','tags',d.task.tags||d.task.raw?.tags||'')}<p class="pw-note">创建人：${e(d.task.creator_name||d.task.raw?.creator?.name||d.task.creator_id||d.task.raw?.creator_id||'未记录')} · 创建于 ${time(d.task.created_at||d.task.raw?.created_at)}<br>最近更新：${time(d.task.updated_at)}${d.task.father_id?` · 父事情 #${e(d.task.father_id)}`:''}${d.task.completion_at?` · 完成于 ${time(d.task.completion_at)}`:''}</p><label>事情状态<select name="state">${options(Object.entries(stateLabels).filter(([id])=>id!=='accepted'),d.task.state)}</select></label><p class="pw-note">本地工作区：${e(d.local_project?.name||'尚未绑定')}</p>${!d.local_project?`<label>绑定工作区<select name="local_project_id">${options([['','暂不绑定'],...state.snapshot.local_projects.map(p=>[p.id,p.name])],'')}</select></label>`:''}`,async form=>{const {local_project_id,...changes}=form;if(local_project_id)await api.projectWorkbenchCommand('project.bind',{project_id:d.task.project_id,local_project_id});await invoke('task.update',{...changes,priority:Number(changes.priority)});});return;
    }
    if(action==='goal.edit')return editText('事情目标',d.task.content,'task.update','content');
    if(action==='plan.edit')return showDialog('当前安排',field('每行一项，可随时清空','items',d.scene.plan.join('\n'),'textarea')+'<p class="pw-note">运行中提交后等待 Agent 读取；暂停状态保持暂停。</p>',form=>invoke('plan.set',{items:form.items.split('\n').filter(Boolean)}));
    if(action==='criteria.edit')return showDialog('完成标准',field('每行一项，修改后重新验收','items',d.scene.criteria.map(c=>c.text).join('\n'),'textarea'),form=>invoke('criteria.set',{items:form.items.split('\n').filter(Boolean)}));
    if(action==='agreement.add')return editText('添加约定','','agreement.add');
    if(action==='agreement.edit'){const a=d.scene.agreements.find(a=>a.id===id);return showDialog('编辑约定',field('约定','text',a.text,'textarea'),form=>invoke('agreement.update',{id,text:form.text}));}
    if(action==='agreement.adopt')return invoke('agreement.update',{id,status:'accepted'});
    if(action==='message.agreement'||action==='message.result'){const m=sceneMessages(d).find(m=>m.id===id);return showDialog(action==='message.agreement'?'保存为约定':'保存阶段成果',field('内容','text',m.content,'textarea'),form=>invoke(action==='message.agreement'?'agreement.add':'report',action==='message.agreement'?{text:form.text,message_id:id}:{summary:form.text,current:'',message_id:id}));}
    if(action==='comment.to-agent'){const a=d.attachments.find(a=>String(a.id)===id);const draft=`请分析这条事情留言：\n${attachmentBody(a)}`;state.drafts[state.task]={text:draft};q('.pw-composer textarea').value=draft;persist();openChat();return;}
    if(action==='material.add')return showDialog('添加资料',`<label>类型<select name="type">${options([['text','文本'],['url','链接'],['file','文件']],'text')}</select></label>${field('内容（文件请直接点击保存选择上传）','content','','textarea')}`,async form=>{if(form.type==='file'){const resource=await api.pickWorkTaskAttachment({project_id:d.task.project_id,task_id:d.task.id,kind:'file'});if(!resource)return;form.content=resource.object_key || resource.key;if(!form.content)throw new Error('文件未返回可引用的对象标识。');}await invoke('material.add',form);});
    if(action==='comment.add')return editText('事情留言','','comment.add','content');
    if(action==='material.preview'){const a=d.attachments.find(a=>String(a.id)===id);if(a.type==='file')return api.openWorkTaskAttachment({project_id:d.task.project_id,task_id:d.task.id,attachment_id:a.id,object_key:a.content});if(a.type==='url')return api.openWorkExternalLink(a.content);const parsed=parseTaskAttachmentContent(a);const modal=showDialog('资料内容',`<div class="pw-markdown">${markdown(attachmentBody(a))}</div>${[...parsed.images.map(key=>({key,kind:'image'})),...parsed.files.map(key=>({key,kind:'file'}))].map(r=>`<button type="button" class="pw-button" data-resource-key="${e(r.key)}" data-resource-kind="${r.kind}">${e(r.key.split('/').pop())}</button>`).join('')}`,async()=>{},'关闭');modal?.querySelectorAll('[data-resource-key]').forEach(b=>b.onclick=()=>act(()=>api[b.dataset.resourceKind==='image'?'openImageViewer':'openWorkTaskAttachment']({project_id:d.task.project_id,task_id:d.task.id,attachment_id:a.id,object_key:b.dataset.resourceKey})));return;}
    if(action==='material.remove')return showDialog('移除共享资料','<p>这会从事情中移除此资料，协作者也将无法继续引用。</p>',()=>invoke('material.remove',{id}),'移除');
    if(action==='asset.preview'){const asset=await api.projectWorkbenchCommand('asset.preview',{task_id:state.task,input:{path:target.dataset.path}});return showDialog(asset.name,`<p class="pw-note">当前文件 SHA-256：${e(asset.version)}${asset.truncated?' · 预览已截断':''}</p><pre>${e(asset.content)}</pre>`,async()=>{},'关闭');}
    if(action==='recovery'){if(target.dataset.operation==='feedback_continue')return showDialog('补充恢复说明',field('说明','text','','textarea'),form=>invoke('auto.recover',{recovery_id:id,action:target.dataset.operation,message:form.text}));return invoke('auto.recover',{recovery_id:id,action:target.dataset.operation});}
    if(action==='feedback')return editText('提出验收问题','','acceptance.feedback');
    if(action.startsWith('approval.')){await api.projectWorkbenchCommand('chat.approval',{task_id:state.task,request_id:id,decision:action==='approval.accept'?'accept':'decline'});return refresh();}
    if(action==='auto.start'&&!d.local_project){await handle('properties',target);throw new Error('绑定本地工作区后即可启动 Auto。');}
    if(action==='auto.pause'){await invoke(action);openChat();return;}
    if(action==='auto.stop')return showDialog('停止 Auto','<p>停止当前执行并保留事情、成果和主会话，可从执行记录恢复。</p>',()=>invoke(action),'停止');
    if(action==='chat.stop'){await api.projectWorkbenchCommand(action,{task_id:state.task});return refresh();}
    return invoke(action);
  }
  root.addEventListener('click',event=>{const target=event.target.closest('[data-pw-action]');if(target&&!target.disabled)void act(()=>handle(target.dataset.pwAction,target));const link=event.target.closest('[data-task-markdown-external-link]');if(link)void act(()=>api.openWorkExternalLink(link.dataset.taskMarkdownExternalLink));});
  root.addEventListener('change',event=>{const n=event.target;if(n.dataset.filter){state[{state:'filter',executor:'executor',priority:'priority'}[n.dataset.filter]]=n.value;render();persist();}if(n.dataset.criterion)void act(()=>invoke('criteria.check',{id:n.dataset.criterion,checked:n.checked}));if(n.dataset.context)void act(()=>invoke('context.include',{id:n.dataset.context,included:n.checked}));});
  for(const node of root.querySelectorAll('[data-config]'))node.addEventListener('input',()=>{state.drafts[state.task||'new']={...state.drafts[state.task||'new'],model:q('[data-config=model]').value,level:q('[data-config=level]').value};persist();});
  q('.pw-search').addEventListener('input',event=>{state.search=event.target.value;render();persist();});
  q('.pw-composer textarea').addEventListener('input',event=>{state.drafts[state.task||'new']={...state.drafts[state.task||'new'],text:event.target.value,request_id:''};persist();});
  q('.pw-composer textarea').addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.metaKey||event.ctrlKey)&&!event.isComposing){event.preventDefault();void act(send);}});

  q('.pw-scrim').addEventListener('click',closeChat);
  document.addEventListener('keydown',event=>{if(event.key!=='Escape'||dialog||!state.active)return;if(state.runtime){state.runtime=false;render();q('[data-pw-action=runtime]').focus();}else if(state.list){state.list=false;render();}else closeChat();});
  document.addEventListener('click',event=>{if(state.runtime&&!event.target.closest('.pw-runtime,[data-pw-action="runtime"]')){state.runtime=false;render();}});
  for(const node of [q('.pw-body'),q('.pw-messages'),q('.pw-rows')])node.addEventListener('scroll',()=>{saveScroll();schedulePersist();},{passive:true});
  window.addEventListener('pagehide',persist);
  api.onProjectWorkbenchEvent?.(event=>{if(event.type==='workbench.chat.message.changed'&&event.session_id===state.detail?.session?.id&&event.messages){const messages=state.detail.messages;for(const message of event.messages){const index=messages.findIndex(m=>m.id===message.id);if(index>=0)messages[index]=message;else messages.push(message);}if(state.active&&state.chat)renderMessages(state.detail);return;}schedule();});api.onAutomationEvent?.(schedule);api.onWorkSyncEvent?.(schedule);api.onEvent?.(event=>{if(event.type==='run.activity_changed'){activitySync.enqueue(event,120);return;}if(['run.finished','run.started','message.added'].includes(event.type))schedule();});
  return {show(active){if(state.active===active)return;state.active=active;if(active){void act(async()=>{await refresh();if(!state.active)return;await api.projectWorkbenchCommand('sync',{});await refresh();});if(api.listCodexModels)void api.listCodexModels().then(result=>{paint(q('#pw-models'),(result.models||[]).map(m=>`<option value="${e(m.model||m.id)}">`).join(''));}).catch(()=>{});}else{saveScroll();persist();state.chat=false;state.runtime=false;updateChat();}},refresh,state};
}
