/* Page projections for global-context interaction paths; all writes are local simulations. */
(() => {
 const C=GlobalContext,{esc}=C,page=document.body.dataset.page;
 let selected='',lastScope='',search='';const productPage=['Product','Product 详情'].includes(page);
 const stored=C.state;stored.today??={project:'all',configs:{},fail:false};stored.pageObjects??={};stored.account??={tasks:[],offline:false};
 window.AccountHost={get state(){return C.state.account;},save:C.save};
 const titles={Today:'需要你处理',Work:'待办',Feedback:'反馈',Automation:'自动化任务',Release:'工作区',Operations:'运营事项',Organization:'组织产品',Idea:'Idea'};
 function records(){
  if(productPage)return C.projects.filter(p=>C.includes(p.id));
  if(page==='Idea')return C.projects.filter(p=>C.includes(p.id)).map(p=>({id:'idea-'+p.id,project:p.id,name:p.name+' 产品想法'})).concat(C.state.project==='all'?[{id:'idea-local',project:'',name:'新创意 · 仅本机'}]:[]);
  if(['Release','Organization'].includes(page))return C.projects.filter(p=>C.includes(p.id)).map(p=>({...p,project:p.id}));
  const names={Today:['确认数据迁移方案','检查本机执行准备'],Work:['保留编辑草稿与阅读位置','检查消息同步恢复'],Feedback:['窄窗口内容遮挡','同步失败后需要明确重试入口'],Automation:['检查交互原型与实现一致性','验证恢复路径'],Operations:['整理发布说明','安排用户反馈回访']};
  const items=C.state.pageObjects[page]??=C.projects.flatMap(p=>[1,2].map(n=>({id:page+'-'+p.id+'-'+n,project:p.id,name:p.name+' · '+(names[page]?.[n-1]||titles[page]||page)})));
  return items.filter(p=>page==='Today'?todayMembers().some(m=>m.id===p.project)&&(C.state.today.project==='all'||C.state.today.project===p.project):C.includes(p.project));
 }
 function todayMembers(){return C.projects.filter(p=>C.sets.find(s=>s.id===C.state.set).ids.includes(p.id));}
 function chooseToday(id){
  const t=C.state.today;t.project=id;selected='';
  if(id!=='all'&&!['ready','loading'].includes(t.configs[id])){
   t.configs[id]='loading';const owner=t;
   setTimeout(()=>{owner.configs[id]=owner.fail?'error':'ready';C.save();if(C.state.today===owner&&owner.project===id)render();},150);
  }
  C.save();render();root.querySelector(`[data-today-project="${id}"]`)?.focus();
 }
 const isGlobal=['Engineering','产品反馈','添加 Idea'].includes(page);
 document.body.innerHTML=`<div class="gc-layout"><aside class="gc-sidebar"><strong>ArcOrbit</strong><nav>${C.pages.map(([p])=>`<a href="${C.href(p)}" ${p===page?'aria-current="page"':''}>${p}</a>`).join('')}</nav><button class="gc-account" data-account-open>Glare · 已登录</button></aside><main class="gc-stage"><div class="gc-content" id="gc-page"></div></main></div><dialog id="gc-create" class="gc-dialog"></dialog>`;
 const root=document.getElementById('gc-page'),dialog=document.getElementById('gc-create');
 function render(){
  const active=document.activeElement,focus=page==='Today'?{draft:active?.dataset.draft,project:active?.dataset.todayProject,start:active?.selectionStart,end:active?.selectionEnd,scroll:root.scrollTop}:null;
  const changed=lastScope!==C.scopeKey();
  if(page==='Today'){
   if(C.state.today.scope!==C.scopeKey()){C.state.today.project=C.state.project;C.state.today.scope=C.scopeKey();}
   if(!todayMembers().some(p=>p.id===C.state.today.project))C.state.today.project='all';
  }
  const items=records();
  if(changed){search='';lastScope=C.scopeKey();}
  selected=C.select(page,items,selected);if(selected)C.remember(page,selected);
  if(productPage&&C.state.project!=='all')selected=C.state.project;
  const item=items.find(x=>x.id===selected),detailProduct=productPage&&C.state.project!=='all';
  const heading=productPage?(detailProduct?item?.name||'产品详情':'Product'):page;
  let content='';
  if(page==='Operations'){
   content=`<p>当前范围：${C.projects.filter(p=>C.includes(p.id)).map(p=>p.name).join('、')||'没有产品'}</p><h2>运营记录</h2><p>当前范围尚无已接入的运营记录。运营能力处于规划阶段。</p><p>发布、渠道连接与效果回流尚未接入，不调用外部平台。</p>`;
  }else if(isGlobal){
   const key='global:'+page;content=`<h2>${page==='Engineering'?'本机 Skills 与配置':page==='产品反馈'?'向 ArcOrbit 提交产品反馈':'整理新的 Idea'}</h2><p>${page==='Engineering'?'本机配置独立于产品观察范围。':page==='产品反馈'?'此反馈属于 ArcOrbit 产品，与当前产品筛选无关。':'未接入的 Idea 仅在全部范围中展示。'}</p><label>${page==='Engineering'?'本机配置备注':'内容'}<textarea data-draft="${key}">${esc(C.state.drafts[key]||'')}</textarea></label><button data-save>保存本机草稿</button><p role="status" id="gc-result"></p>`;
  }else if(productPage&&!detailProduct){
   content=`<section class="gc-object-list">${items.map(p=>`<button data-product="${p.id}">${p.name}<small>打开产品详情</small></button>`).join('')||'<p>当前范围没有产品。</p>'}</section><a href="../idea-add/default.html" data-new-idea>添加 Idea</a>`;
  }else{
   const filtered=items.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
   content=`<div class="gc-objects"><section class="gc-object-list" aria-label="对象列表"><label>搜索<input id="gc-search" value="${esc(search)}"></label>${filtered.map(x=>`<button data-object="${x.id}" aria-current="${x.id===selected}">${esc(x.name)}<small>${esc(C.projects.find(p=>p.id===x.project)?.name||'')}</small></button>`).join('')||'<p>当前范围没有匹配内容。</p>'}</section><section class="gc-object-detail" data-selected="${selected}">${item?`<h2>${esc(item.name)}</h2><p>${detailProduct?'资料先保存到本机，Git 共享状态单独确认。':'对象归属：'+esc(C.projects.find(p=>p.id===item.project)?.name||'仅本机')}</p><label>${detailProduct?'产品理念':'当前对象的草稿'}<textarea data-draft="${page+':'+item.id}">${esc(C.state.drafts[page+':'+item.id]||'')}</textarea></label><button data-save>保存本机草稿</button><p id="gc-result" role="status"></p>${detailProduct?'<a href="../task-browser/default.html">进入 Work</a> · <a href="../chat-workspace/default.html">进入 Chat</a>':page==='Today'?'<a href="../project-workbench/default.html">进入 Thing 处理</a>':''}`:'<p>当前范围没有可打开的对象。</p>'}</section></div>`;
  }
  const t=C.state.today;
  const todayBar=page==='Today'?`<section aria-label="Today 项目列表"><button data-today-project="all" aria-current="${t.project==='all'}">全部项目</button>${todayMembers().map(p=>`<button data-today-project="${p.id}" aria-current="${t.project===p.id}">${esc(p.name)}</button>`).join('')}${!todayMembers().length?'<p>产品集为空，请在顶部管理产品集。</p>':''}<p role="status" id="today-config">${t.project==='all'?'':({loading:'正在初始化项目配置…',error:'初始化失败，请重试。',ready:'项目配置已就绪（本地模拟）'})[t.configs[t.project]]||'点击项目时初始化必要配置。'}</p>${t.configs[t.project]==='error'?`<button data-today-project="${t.project}">重试初始化</button>`:''}</section>`:'';
  root.innerHTML=`${todayBar}<div class="gc-page-toolbar"><h1>${esc(heading)}</h1>${page==='Work'?`<button id="gc-new" ${!C.ids().length?'disabled':''}>新建${titles[page]||'事项'}</button>`:''}</div>${content}<p class="gc-note">本地交互原型 · 所有保存与运行状态为模拟，不连接业务服务。</p><a class="gc-note" href="${page==='Organization'?'governance-states.html':'page-states.html'}">查看页面专项状态说明</a>`;
  if(focus){const target=focus.draft?root.querySelector(`[data-draft="${focus.draft}"]`):focus.project?root.querySelector(`[data-today-project="${focus.project}"]`):null;target?.focus({preventScroll:true});if(focus.draft&&target)target.setSelectionRange(focus.start,focus.end);root.scrollTop=focus.scroll;}
  C.save();
 }
 root.addEventListener('input',e=>{if(e.target.dataset.draft){C.state.drafts[e.target.dataset.draft]=e.target.value;C.save();}if(e.target.id==='gc-search'){const at=e.target.selectionStart;search=e.target.value;render();const input=root.querySelector('#gc-search');input.focus();input.setSelectionRange(at,at);}});
 root.addEventListener('click',e=>{
  const today=e.target.closest('[data-today-project]');if(today){chooseToday(today.dataset.todayProject);return;}
  const object=e.target.closest('[data-object]');if(object){selected=object.dataset.object;C.remember(page,selected);render();}
  const product=e.target.closest('[data-product]');if(product){C.change(product.dataset.product);if(page==='Product')location.href='../product-detail/default.html';}
  if(e.target.closest('[data-new-idea]'))C.change('all');
  if(e.target.closest('[data-save]')){C.save();root.querySelector('#gc-result').textContent='已保存到此浏览器；未提交远端。';}
  if(e.target.id==='gc-new'){
   dialog.innerHTML=`<form><h2>新建${titles[page]}</h2><label>所属产品<select name="project" required>${C.projects.filter(p=>C.includes(p.id)).map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></label><label>内容<textarea name="title" required></textarea></label><button type="button" data-close>取消</button><button>创建</button></form>`;
   dialog.querySelector('form').onsubmit=event=>{event.preventDefault();const form=new FormData(event.target),project=form.get('project');if(!C.includes(project))return;const item={id:crypto.randomUUID(),project,name:form.get('title')};C.state.pageObjects[page].push(item);selected=item.id;C.remember(page,selected);dialog.close();render();};dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.showModal();
  }
 });
 C.before(()=>{if(selected)C.remember(page,selected);});C.on(()=>{if(page==='Today'||lastScope!==C.scopeKey())render();});render();
})();
