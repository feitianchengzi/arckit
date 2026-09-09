import { createConversationSurface } from './conversation-surface.mjs';
import { createConversationComposer } from './conversation-composer.mjs';
import { createChatStateCoordinator } from './chat-state-coordinator.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses={'':'尚未设置',exploring:'探索中',active:'推进中',paused:'暂停',archived:'归档'};
const syncLabels={local:'待共享',shared:'已共享',conflict:'共享冲突',unknown:'共享状态未核对'};
const active=s=>['starting','running','waiting_approval','interrupting'].includes(s);
const button=(action,label,extra='')=>`<button type="button" class="secondary-button" data-product-action="${action}" ${extra}>${label}</button>`;
const field=(label,name,value,type='text')=>`<label class="product-field"><span>${label}</span>${type==='textarea'?`<textarea data-field="${name}" rows="3">${esc(value)}</textarea>`:`<input data-field="${name}" value="${esc(value)}">`}</label>`;
const select=(label,name,value,options)=>`<label class="product-field"><span>${label}</span><select data-field="${name}">${options.map(([id,title])=>`<option value="${esc(id)}" ${String(value)===String(id)?'selected':''}>${esc(title)}</option>`).join('')}</select></label>`;
export function createProductSurface({api,normalizeChatSnapshot,formatTime,performAction,navigate,getPlatform}) {
  const el=id=>document.getElementById(id);let snapshot={ideas:[],records:[],projects:[],organizations:[],errors:[]};let current=null;let page='';let search='';let filter='all';let tab='overview';let error='';let loading=false;let loaded=false;let chat=null;let epoch=0;let eventTimer;let listPromise;
  const chats=new Map();const drafts=new Map();
  const draftKey=id=>`arcorbit:product-editor:${id}`;
  function draft(p) {
    if(drafts.has(p.id))return drafts.get(p.id);
    let value;try{value=JSON.parse(localStorage.getItem(draftKey(p.id))||'null');}catch{}
    value ||= {revision:p.record.revision,name:p.name,patch:{...p.record},plan:p.plan || {mode:p.remote_project_id?'existing':'create',project_id:p.remote_project_id,name:p.name,organization_id:'',repository:p.remote_project_id?'none':'existing',git_url:p.sync.url || '',github_owner:'',github_name:'',directory:p.material_path?'material':'managed'},dirty:false};
    delete value.patch.product_id;delete value.patch.schema_version;delete value.patch.revision;delete value.patch.idea;
    drafts.set(p.id,value);return value;
  }
  function remember(p,d){drafts.set(p.id,d);localStorage.setItem(draftKey(p.id),JSON.stringify(d));}
  function clearDraft(id){drafts.delete(id);localStorage.removeItem(draftKey(id));}
  async function action(fn) {
    return performAction(async()=>{try{error='';await fn();}catch(e){error=e.message;renderCurrent();throw e;}});
  }
  async function load(refresh=false) {
    if(listPromise)return listPromise;
    listPromise=(async()=>{snapshot=await api.productSnapshot({refresh});loaded=true;renderToday();})();
    try{await listPromise;}finally{listPromise=null;}
  }
  function projectFor(p){return snapshot.projects.find(r=>String(r.id)===p?.remote_project_id);}
  function label(p){return p.kind==='formal'?`${p.record.idea?'已录入':'产品资料'} · ${syncLabels[p.sync.status]||'待共享'}`:p.kind==='product'?'产品资料草稿 · 仅本机':'录入未完成 · 仅本机';}
  async function open(id,where='idea-add') {
    const token=++epoch;const p=await api.productDetail(id);if(token!==epoch)return;
    current=p;page=where;await navigate(where);if(where==='idea-add')await loadChat();
  }
  async function loadChat() {
    if(!current)return;const id=current.id;
    if(!chats.has(id)) {
      const call=(method,input={})=>api.productChat({id,action:method,...input});
      chats.set(id,createChatStateCoordinator({api:{createChat:i=>call('draft',i),selectChat:i=>call('snapshot',i),deleteChat:()=>Promise.reject(new Error('场景会话保留')),renameChat:()=>Promise.reject(new Error('场景使用产品名')),interruptChat:i=>call('stop',i),decideChatApproval:i=>call('approval',i),sendChatMessage:i=>call('send',i),chatSnapshot:i=>call('snapshot',i)},normalizeSnapshot:normalizeChatSnapshot,createRequestId:()=>crypto.randomUUID()}));
      await chats.get(id).initialize(await api.productChat({id,action:'snapshot'}));
    }
    if(current?.id!==id)return;chat=chats.get(id);await chat.refresh();renderChat();
  }
  const conversation=createConversationSurface({element:el('ideaTranscript'),jumpButton:el('ideaJump'),formatTime,performAction,
    onApproval:(message,decision)=>action(async()=>{await chat.decideApproval(message.approval_request_id,decision);renderChat();}),onExternalLink:url=>action(()=>api.openWorkExternalLink(url))});
  const composer=createConversationComposer({input:el('ideaChatInput'),sendButton:el('ideaChatSend'),stopButton:el('ideaChatStop'),hint:el('ideaChatHint'),performAction:fn=>action(fn),
    onInput:value=>{chat?.setDraft(value);renderChat();},onSend:async()=>{try{await chat.send();}finally{renderChat();}},onStop:async()=>{await chat.interruptCurrentSession();renderChat();}});
  function renderChat() {
    const state=chat?.getState();const session=state?.snapshot.sessions.find(s=>s.id===state.owner.session_id);
    el('ideaChatStatus').textContent=session?({starting:'正在连接 Agent',running:'Agent 正在整理',waiting_approval:'等待你的审批',failed:'执行失败，可继续对话',interrupted:'已停止，可继续',completed:'本轮已结束'}[session.status]||session.status):'Agent 的建议可以在左侧修改和采纳。';
    el('ideaChatError').textContent=state?.error||session?.error||'';
    conversation.render({contextId:session?.id||current?.id||'idea',messages:state?.snapshot.messages||[],emptyHtml:'<div class="chat-empty"><strong>从你的想法开始</strong><p>可以让 Agent 阅读材料、整理产品理念，或准备接入方案。</p></div>'});
    composer.render({draft:state?.draft||'',available:Boolean(chat),active:active(session?.status),sending:state?.sending,stopping:session?.status==='interrupting',waiting:session?.status==='waiting_approval'});
  }
  el('ideaChatRetry').onclick=()=>action(loadChat);
  el('ideaBack').onclick=()=>action(()=>navigate('idea'));
  el('ideaBlank').onclick=()=>action(async()=>{const p=await api.productCommand('create',{});await load();await open(p.id);});
  el('ideaFolder').onclick=()=>action(async()=>{const p=await api.pickProductMaterial({});if(p){await load();await open(p.id);}});
  function header(title,subtitle){return `<header class="product-heading"><div><p class="eyebrow">PRODUCT</p><h1>${title}</h1><p>${subtitle}</p></div><div>${button('refresh','刷新')}${button('new','添加 Idea')}</div></header>`;}
  function renderList(ideasOnly=false) {
    const host=el(ideasOnly?'ideaListHost':'productListHost');
    const rows=ideasOnly?snapshot.ideas:[...snapshot.projects.map(r=>({remote:r,p:snapshot.records.find(p=>p.remote_project_id===String(r.id))})),...snapshot.records.filter(p=>!p.remote_project_id).map(p=>({p}))];
    const normalized=ideasOnly?rows.map(p=>({p})):rows;
    const visible=normalized.filter(({p,remote})=>String(remote?.name||p?.name).toLowerCase().includes(search.toLowerCase()) && (filter==='all'||(p?.record.status||'')===filter));
    host.innerHTML=header(ideasOnly?'Idea':'你的产品',ideasOnly?'本机未完成录入，以及当前产品集本地目录中的正式 Idea。':'围绕产品保存长期上下文，进入已有的工作页面。')+`<div class="product-toolbar"><input data-search type="search" placeholder="搜索产品" value="${esc(search)}">${select('状态','filter',filter,[['all','全部状态'],...Object.entries(statuses)])}</div>`+errorHtml()+sourceErrors()+`<div class="product-grid">${visible.map(({p,remote})=>`<button class="product-card" data-open="${esc(p?.id||'')}" data-remote="${esc(remote?.id||'')}" type="button"><span class="product-status">${esc(statuses[p?.record.status||''])}</span><h2>${esc(remote?.name||p.name)}</h2><p>${esc(p?.record.description||'尚未整理产品说明')}</p><small>${p?esc(label(p)):'Workshop 项目 · 产品资料尚未设置'}</small>${p?.material_path?`<small class="product-path">${esc(p.material_path)}</small>`:''}</button>`).join('')||'<div class="product-empty"><h2>这里还没有记录</h2><p>添加一个 Idea，或关联产品集的本地项目目录。</p></div>'}</div>`;
    host.querySelector('[data-search]').oninput=e=>{search=e.target.value;renderList(ideasOnly);const input=host.querySelector('[data-search]');input.focus();input.setSelectionRange(search.length,search.length);};
    host.querySelector('[data-field="filter"]').onchange=e=>{filter=e.target.value;renderList(ideasOnly);};
    host.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>action(async()=>{let id=b.dataset.open;if(!id){const p=await api.productCommand('attach',{project_id:b.dataset.remote});id=p.id;await load();}await open(id,ideasOnly?'idea-add':'product-detail');}));
    bind(host);
  }
  function errorHtml(){return error?`<div class="product-error" role="alert">${esc(error)}</div>`:'';}
  function sourceErrors(){return snapshot.errors.length?`<details class="product-notice"><summary>部分资料尚无法确认 · ${snapshot.errors.length}</summary>${snapshot.errors.map(e=>`<p>${esc(e.name||e.section||'来源')}：${esc(e.message||e.error?.message||'读取失败')}</p>`).join('')}</details>`:'';}
  function editor(p,{intake=false}={}) {
    const d=draft(p);const stale=d.revision!==p.record.revision;const q=p.proposal;
    return `${errorHtml()}${stale?'<div class="product-error">资料已由其他操作更新，你的输入仍保留。请比较最新记录后重新整理。</div>':''}<section class="product-section"><div class="product-section-heading"><h2>产品资料</h2><small>${d.dirty?'有本机编辑草稿':`修订 ${p.record.revision}`}</small></div>${p.remote_project_id?'':field('Idea 名称','name',d.name)}${field('产品说明','description',d.patch.description,'textarea')}${select('产品状态','status',d.patch.status||'',Object.entries(statuses))}${field('目标用户','audience',d.patch.audience,'textarea')}${field('产品理念','vision',d.patch.vision,'textarea')}${field('产品原则','principles',d.patch.principles,'textarea')}<div class="product-actions">${button('save','保存资料',stale?'disabled':'')}${button('reload','采用最新资料')}</div></section>
      <section class="product-section"><h2>核心资产</h2><p>引用本地仓库内已有文档，正文由原页面和维护能力管理。</p><div class="product-assets">${d.patch.assets.map((a,i)=>`<div class="product-asset"><input data-asset="${i}" data-key="title" aria-label="资产标题" value="${esc(a.title)}"><select data-asset="${i}" data-key="kind" aria-label="资产类型">${['spec','interaction','visual','tech','material','other'].map(k=>`<option ${k===a.kind?'selected':''}>${k}</option>`).join('')}</select><input data-asset="${i}" data-key="path" aria-label="仓库相对路径" value="${esc(a.path)}">${button('open-asset','打开',`data-index="${i}"`)}${button('remove-asset','移除',`data-index="${i}"`)}</div>`).join('')}</div>${button('add-asset','添加引用')}</section>
      ${q?`<section class="product-section product-proposal"><h2>Agent 建议 · 待采纳</h2><p>${esc(q.reason)}</p><pre>${esc(JSON.stringify({patch:q.patch,plan:q.plan},null,2))}</pre>${button('accept','采纳建议',d.dirty||stale?'disabled':'')}<small>${d.dirty?'先保存或放弃当前编辑；过期建议需 Agent 重新整理。':''}</small></section>`:''}
      ${intake?intakePlan(p,d):''}`;
  }
  function intakePlan(p,d) {
    if(p.kind==='formal')return `<section class="product-section"><h2>已完成正式录入</h2><p>${esc(p.material_path)}</p><p>${esc(p.sync.url)}</p><p>${esc(syncLabels[p.sync.status]||'待共享')} · 正式资料在 arckit/product/record.json</p>${button('detail','查看产品')}${button('publish','审阅并共享')}</section>`;
    const plan=d.plan;
    return `<section class="product-section"><h2>接入产品管理</h2><p>GitHub 仓库、本地工作目录及正式资料齐备后才完成录入。</p>${select('项目','plan.mode',plan.mode,[['create','新建项目'],['existing','关联已有项目']])}${plan.mode==='existing'?select('选择项目','plan.project_id',plan.project_id,[['','请选择'],...snapshot.projects.map(r=>[r.id,r.name])]):field('项目名称','plan.name',plan.name)+select('组织','plan.organization_id',plan.organization_id,[['','个人项目'],...snapshot.organizations.map(o=>[o.id,o.name])])}${plan.mode==='create'?select('GitHub 仓库','plan.repository',plan.repository,[['existing','已有 GitHub 仓库'],['create','新建私有 GitHub 仓库']])+(plan.repository==='create'?field('GitHub 主体 / 组织','plan.github_owner',plan.github_owner)+field('仓库名','plan.github_name',plan.github_name):field('GitHub 仓库地址','plan.git_url',plan.git_url)):'<p>沿用所选项目的 GitHub 仓库；没有仓库的项目不能完成录入。</p>'}${select('正式工作目录','plan.directory',plan.directory,[['managed','由 ArcOrbit 克隆并管理目录'],['material','使用选定材料目录（必要时初始化 Git）']])}<p class="product-path">材料：${esc(p.material_path||'未选择，空白 Idea')}</p><div class="product-actions">${button('folder','选择 / 更换材料目录')}${p.material_path?button('copy','复制材料到其他位置'):''}</div><p>选择应用管理目录时仅克隆仓库；原材料仍保留在原处，不自动上传。需要复制材料可先使用上方复制入口，再选择该目录。</p><p>成员：${esc(plan.mode==='existing'?(snapshot.members||[]).filter(m=>String(m.project_id)===plan.project_id).map(m=>m.name||m.username||m.user_id).join('、')||'读取现有项目成员；权限以服务器为准':snapshot.user?.name||snapshot.user?.username||'当前用户（项目创建者）')}。录入后可进入 Organization 管理和邀请。</p><div class="product-actions">${button('plan','保存接入方案')}${button('approve-agent','确认并交给 Agent',!p.plan||d.dirty?'disabled':'')}${button('approve','直接确认接入',!p.plan||d.dirty?'disabled':'')}</div><div class="product-receipts">${Object.entries(p.receipts||{}).map(([k,r])=>`<p><strong>${esc(k)}</strong> · ${esc({completed:'已完成',started:'执行中',uncertain:'结果待核对'}[r.status]||r.status)} ${esc(r.error||'')}</p>`).join('')}</div>${Object.values(p.receipts||{}).some(r=>r.status==='uncertain')?'<p>请在 GitHub / 项目目录核对已有结果，并选择“关联已有项目”继续，避免重复创建。</p>':''}</section>`;
  }
  function renderIntake() {
    el('ideaStart').classList.toggle('hidden',Boolean(current));el('ideaBody').classList.toggle('hidden',!current);
    el('ideaTitle').textContent=current?.name||'添加 Idea';el('ideaStatus').textContent=current?label(current):'选择文件夹，或从空白开始。';
    if(!current)return;el('ideaEditor').innerHTML=editor(current,{intake:true});bind(el('ideaEditor'));bindEditor(el('ideaEditor'));renderChat();
  }
  function renderDetail() {
    const host=el('productDetailHost');if(!current){host.innerHTML=header('产品详情','请从目录选择产品。');bind(host);return;}
    const p=current;const remote=projectFor(p);const platform=getPlatform();const workspace=platform.product_workspaces?.find(w=>String(w.project_id||w.id)===p.remote_project_id);
    host.innerHTML=header(esc(p.name),`${esc(statuses[p.record.status||''])} · ${esc(p.kind==='formal'?(syncLabels[p.sync.status]||'待共享'):'资料仅本机')}`)+`<nav class="product-tabs">${[['overview','总览'],['vision','理念'],['assets','核心资产'],['relations','项目关系']].map(([id,title])=>`<button class="${tab===id?'is-active':''}" data-tab="${id}" type="button">${title}</button>`).join('')}</nav>${errorHtml()}`+
    (tab==='overview'?`<section class="product-section"><h2>这个产品要做什么</h2><p>${esc(p.record.description||'尚未整理产品说明')}</p><p>${esc(p.record.vision||'可以和 Agent 一起整理理念，也可以直接编辑。')}</p><div class="product-actions">${button('collaborate','与 Agent 整理')}${button('edit','编辑资料')}</div></section><section class="product-section"><h2>继续推进产品</h2><div class="product-grid">${[['work','Work','待办管理'],['command','Automation','执行与人工介入'],['feedback','Feedback','用户反馈']].map(([key,name,desc])=>`<button class="product-card" data-go="${key}" type="button" ${!p.remote_project_id?'disabled':''}><h3>${name}</h3><p>${desc}</p><small>${workspace?'来自现有业务页面':'进入来源页面读取当前结果'}</small></button>`).join('')}</div></section>${syncPanel(p)}`:
      tab==='relations'?`<section class="product-section"><h2>项目关系</h2><dl><dt>Workshop 项目</dt><dd>${esc(remote?.name||p.remote_project_id||'尚未关联')}</dd><dt>组织</dt><dd>${esc(snapshot.organizations.find(o=>String(o.id)===String(remote?.organization_id))?.name||remote?.organization_id||'个人项目')}</dd><dt>GitHub 仓库</dt><dd>${esc(remote?.git_url||p.sync.url||'尚未关联')}</dd><dt>本地目录</dt><dd>${esc(remote?.local_project_path||p.material_path||'尚未关联')}</dd></dl><p>组织、成员和邀请结果由 Workshop 管理，仓库权限由 GitHub 管理。</p>${button('organization','管理项目与成员',p.remote_project_id?'':'disabled')}${button('collaborate','继续接入 / 整理')}</section>`:editor(p));
    host.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;renderDetail();});
    host.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>action(()=>navigate(b.dataset.go,p.remote_project_id)));
    bind(host);bindEditor(host);
  }
  function syncPanel(p){return `<section class="product-section"><h2>产品资料共享</h2><p>${p.kind==='formal'?'正式记录保存在关联工作目录。':'当前资料只保存在本机。'} ${esc(syncLabels[p.sync.status]||'待共享')}</p><p>仅共享产品管理记录；引用的文档正文通过原仓库流程同步。</p><div class="product-actions">${button('read','读取 GitHub 资料',p.sync.url?'':'disabled')}${button('publish','审阅并共享',p.kind==='formal'&&p.sync.url?'':'disabled')}</div>${p.sync.remote?`<div class="product-conflict"><h3>本机与远端均有修改</h3><div><section><h4>本机</h4><pre>${esc(JSON.stringify(p.record,null,2))}</pre></section><section><h4>远端</h4><pre>${esc(JSON.stringify(p.sync.remote.record,null,2))}</pre></section></div>${button('remote','采用已显示的远端资料')}${button('local','保留本机并重新共享')}</div>`:''}</section>`;}
  function bindEditor(host) {
    host.querySelectorAll('[data-field],[data-asset]').forEach(input=>input.addEventListener('input',()=>{
      if(!current)return;const d=draft(current);
      if(input.dataset.asset!==undefined)d.patch.assets[Number(input.dataset.asset)][input.dataset.key]=input.value;
      else {const key=input.dataset.field;if(key.startsWith('plan.'))d.plan[key.slice(5)]=input.value;else if(key==='name')d.name=input.value;else d.patch[key]=key==='status'?(input.value||null):input.value;}
      if(d.plan.mode==='existing')d.plan.repository='none';else if(d.plan.repository==='none')d.plan.repository='existing';
      d.dirty=true;remember(current,d);
      host.querySelectorAll('[data-product-action=approve],[data-product-action=approve-agent],[data-product-action=accept]').forEach(b=>b.disabled=true);
      if(input.tagName==='SELECT')renderCurrent();
    }));
  }
  async function reloadCurrent(){if(current)current=await api.productDetail(current.id);await load();renderCurrent();}
  async function save() {
    const d=draft(current);current=await api.productCommand('save',{id:current.id,revision:d.revision,patch:d.patch,name:d.name});
    const plan=d.plan;clearDraft(current.id);const fresh=draft(current);fresh.plan=plan;remember(current,fresh);await reloadCurrent();
  }
  function bind(host) {
    host.querySelectorAll('[data-product-action]').forEach(b=>b.onclick=()=>action(async()=>{
      const a=b.dataset.productAction;
      if(a==='new'){current=null;chat=null;return navigate('idea-add');}
      if(a==='refresh'){await load(true);if(current)current=await api.productDetail(current.id);return renderCurrent();}
      if(a==='detail')return open(current.id,'product-detail');
      if(a==='collaborate')return open(current.id,'idea-add');
      if(a==='organization')return navigate('organization',current.remote_project_id);
      if(a==='edit'){tab='vision';return renderDetail();}
      if(a==='save')return save();
      if(a==='reload'){if(draft(current).dirty&&!window.confirm('放弃本机尚未保存的编辑，采用最新资料？'))return;clearDraft(current.id);return reloadCurrent();}
      if(a==='add-asset'){const d=draft(current);d.patch.assets.push({title:'',kind:'other',path:''});d.dirty=true;remember(current,d);return renderCurrent();}
      if(a==='open-asset'){const asset=draft(current).patch.assets[Number(b.dataset.index)];return api.openProductAsset({id:current.id,path:asset.path});}
      if(a==='remove-asset'){const d=draft(current);d.patch.assets.splice(Number(b.dataset.index),1);d.dirty=true;remember(current,d);return renderCurrent();}
      if(a==='accept'){const oldId=current.id;current=await api.productCommand('accept',{id:current.id,proposal_id:current.proposal.id});clearDraft(oldId);return reloadCurrent();}
      if(a==='folder'||a==='copy'){if(a==='copy'&&!window.confirm('复制所选材料到新目录；原目录保留。继续选择目标父目录？'))return;const p=await api.pickProductMaterial({id:current.id,copy:a==='copy'});if(p)current=p;return reloadCurrent();}
      if(a==='plan'){await save();const d=draft(current);current=await api.productCommand('plan',{id:current.id,revision:current.record.revision,plan:d.plan});clearDraft(current.id);return reloadCurrent();}
      if(a==='approve'||a==='approve-agent') {
        current=await api.productDetail(current.id);
        if(!window.confirm(`确认以下接入方案？\n${JSON.stringify(current.plan,null,2)}\n材料目录：${current.material_path||'无'}\n将创建/关联项目、准备 Git 仓库与工作目录并保存正式 Idea。`))return;
        const approved=await api.productCommand('approve',{id:current.id,revision:current.record.revision,plan_digest:current.plan_digest});
        // Both Agent and direct UI execute the same approved command.
        if(a==='approve-agent') {
          await loadChat();chat.setDraft('我已在界面确认当前接入方案。请使用 product_context 读取确认摘要，再通过 product_execute 完成接入并核对正式记录；若有问题请保留进度并说明。');
          await chat.send();renderChat();return;
        }
        await api.productCommand('execute',{id:current.id,approved_digest:approved.approved_digest});clearDraft(current.id);return reloadCurrent();
      }
      if(['read','publish','remote','local'].includes(a)) {
        current=await api.productDetail(current.id);
        if(a!=='read'&&!window.confirm(`${a==='remote'?'采用远端资料，将替换当前已保存资料。':'仅共享当前产品管理记录到 GitHub，保留开发分支和其他文件。'}\n${JSON.stringify(a==='remote'?current.sync.remote?.record:current.record,null,2)}`))return;
        current=await api.productCommand('sync',{id:current.id,action:a==='read'?'read':'publish',revision:current.record.revision,digest:current.record_digest,...(['remote','local'].includes(a)?{resolution:a,remote_sha:current.sync.remote?.sha}:{})});clearDraft(current.id);return reloadCurrent();
      }
    }));
  }
  function renderCurrent(){if(page==='product')renderList();else if(page==='idea')renderList(true);else if(page==='idea-add')renderIntake();else if(page==='product-detail')renderDetail();}
  function renderToday() {
    const host=el('todayProductContinuity');if(!host)return;
    const platform=getPlatform();const unread=(platform.product_workspaces||[]).filter(w=>Number(w.feedback_management?.unread_count)>0);
    const pending=(snapshot.records||[]).filter(p=>p.kind==='temporary'||p.kind==='product'&&p.record.revision>0||p.kind==='formal'&&p.sync.status==='local');
    host.innerHTML=`<div>${button('new','＋ 添加 Idea')}</div><div><strong>继续整理</strong>${pending.slice(0,5).map(p=>`<button type="button" data-resume="${esc(p.id)}">${esc(p.name)} · ${esc(label(p))}</button>`).join('')||'<span>没有未完成录入</span>'}</div><div><strong>反馈新消息</strong>${unread.map(w=>`<button type="button" data-feedback-project="${esc(w.project_id||w.id)}">${esc(w.name||w.project_name||'项目')} · ${Number(w.feedback_management.unread_count)} 条未读</button>`).join('')||'<span>查看 Feedback 来源消息</span>'}</div>`;
    bind(host);host.querySelectorAll('[data-resume]').forEach(b=>b.onclick=()=>action(()=>open(b.dataset.resume)));
    host.querySelectorAll('[data-feedback-project]').forEach(b=>b.onclick=()=>action(()=>navigate('feedback',b.dataset.feedbackProject)));
    if(!loaded&&!loading&&api.productSnapshot){loading=true;load(true).catch(()=>{}).finally(()=>{loading=false;});}
  }
  api.onProductEvent?.(event=>{
    if(event.product_id===current?.id && chat && event.messages && chat.applyStreamEvent(event)){renderChat();return;}
    clearTimeout(eventTimer);eventTimer=setTimeout(()=>{
      load().then(async()=>{if(current?.id===event.product_id){current=await api.productDetail(current.id);if(chat)await chat.refresh();renderCurrent();}else if(['product','idea'].includes(page))renderCurrent();}).catch(()=>{});
    },100);
  });
  return {reset(){epoch++;current=null;chat=null;loaded=false;snapshot={ideas:[],records:[],projects:[],organizations:[],errors:[]};for(const id of ['productListHost','productDetailHost','ideaListHost','ideaEditor','ideaTranscript','todayProductContinuity'])el(id).innerHTML='';},async show(next){page=next;if(!api.productSnapshot)return;await load(!loaded||['product','idea'].includes(next));if(current && !snapshot.records.some(p=>p.id===current.id)){current=null;chat=null;}renderCurrent();if(next==='idea-add'&&current)await loadChat();},renderToday};
}
