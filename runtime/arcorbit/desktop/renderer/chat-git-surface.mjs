const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const stamp = value => value ? new Date(value).toLocaleString() : '尚未成功读取';
export function gitSummary(state) {
  if (!state) return { label:'Git · 读取中', muted:true, meaning:'尚未取得本地 Git 状态' };
  if (state.unavailable) return { label:'Git · 不可用', meaning:state.error || '工作区未绑定或不可访问' };
  if (state.error) return { label:'Git · 读取失败', meaning:`${state.error}；上次结果不能代表当前状态` };
  if (state.stale) return { label:'Git · 状态过期', meaning:'正在校验工作区；详情保留上次结果' };
  const v=state.value;
  if (!v) return { label:'Git · 读取中', muted:true, meaning:'尚未取得本地 Git 状态' };
  if (v.kind==='not_repository') return { label:'无 Git 仓库', muted:true, meaning:'绑定目录不是 Git 仓库' };
  const comparable=v.tracking && v.comparison_available!==false;
  const count=new Set((v.files||[]).map(f=>f.path)).size, parts=[];
  if(v.conflicted?.length)parts.push(`${v.conflicted.length} 个冲突`);
  if(count)parts.push(`${count} 个文件未提交`);
  if(comparable && v.ahead)parts.push(`↑${v.ahead}`);
  if(comparable && v.behind)parts.push(`↓${v.behind}`);
  if(comparable && v.ahead && v.behind)parts.push('分歧');
  if(!parts.length)parts.push('Git · 本地干净');
  if(state.remote?.error)parts.push('远端获取失败');
  return { label:parts.join(' · '), muted:!count&&!v.ahead&&!v.behind&&!state.remote?.error,
    meaning:`${count} 个文件未提交；${comparable?`缓存中 ${v.ahead} 个待推送、${v.behind} 个待拉取`:v.upstream_kind==='local'?'上游为本地分支，无法比较远端':'未设置可比较的上游'}；${state.remote?.checked_at?'远端最近获取 '+stamp(state.remote.checked_at):'本次观察尚未获取远端更新'}。不是实时远端状态。` };
}
export function gitSummaryButton(id,name,state) {
  const s=gitSummary(state);
  return `<button type="button" class="chat-git-summary text-button ${s.muted?'is-muted':''}" data-chat-git-project="${esc(id)}" title="${esc(s.meaning)}" aria-label="${esc(name)} Git：${esc(s.meaning)}">${esc(s.label)}</button>`;
}

export function createChatGitSurface({api,states,host,getProjects,getPanel,setPanel}) {
  let projectId='',workspace='',view={kind:'overview'},request=0,markup='',busy=false,error='',data=null,readAt=null;
  const button=(action,label,attrs='')=>`<button type="button" class="text-button" data-git-action="${action}" ${attrs}>${esc(label)}</button>`;
  function overview(state) {
    const v=state?.value;
    const summary=gitSummary(state);
    let result=`<p role="status">${esc(summary.meaning)}</p>`;
    if(!v || v.kind!=='repository')return result+button('refresh','重新读取');
    const old=state.stale||state.error, comparable=v.tracking && v.comparison_available!==false;
    result+=`<section><h3>${old?'上次结果 · ':''}分支 ${esc(v.branch||'尚无提交')}</h3><small>本地读取：${esc(stamp(state.read_at))}</small>
      ${comparable?`<p>${v.ahead&&v.behind?'双方分歧 · ':''}↑ ${v.ahead} 个待推送 · ↓ ${v.behind} 个待拉取</p><small>上游 ${esc(v.tracking)} · 本地缓存</small>`:v.upstream_kind==='local'?'<p>上游为本地分支，无法比较远端</p>':'<p>未设置可比较的上游</p>'}
      <small>${v.remote?'远端 '+esc(v.remote):'未配置可获取的远端'}</small><small>${state.remote?.checked_at?'远端最近获取：'+esc(stamp(state.remote.checked_at)):'本次观察尚未获取远端更新'}</small>
      ${state.remote?.error?`<p role="status">远端获取失败，缓存和上次成功时间已保留。</p><details><summary>错误详情</summary><pre>${esc(state.remote.error)}</pre></details>`:''}
      ${state.watch_error?`<p role="status">文件监听不可用，使用低频校验：${esc(state.watch_error)}</p>`:''}
      <div class="chat-git-actions">${button('refresh','刷新本地状态',busy?'disabled':'')}${button('fetch',state.remote?.fetching?'正在获取…':'获取远端更新',!v.remote||busy||state.remote?.fetching?'disabled':'')}</div></section>`;
    result+='<section><h3>修改文件</h3>';
    for(const f of v.files||[]) {
      const conflict=(v.conflicted||[]).includes(f.path), untracked=f.index==='?'&&f.working_dir==='?';
      result+=`<div class="chat-git-file"><strong>${esc(f.path)}</strong>${conflict?'<small>存在冲突</small>':''}<div class="chat-git-actions">`;
      if(untracked)result+=button('file','未跟踪 · 查看内容',`data-path="${esc(f.path)}" data-mode="untracked"`);
      else {
        if(f.index && f.index!==' ' && f.index!=='?') result+=button('file','已暂存差异',`data-path="${esc(f.path)}" data-mode="staged"`);
        if(conflict || f.working_dir && f.working_dir!==' ')result+=button('file',conflict?'冲突／工作区差异':'未暂存差异',`data-path="${esc(f.path)}" data-mode="worktree"`);
      }
      result+='</div></div>';
    }
    if(!v.files?.length)result+='<p>没有未提交修改</p>';
    result+='</section><section><h3>相关提交</h3>';
    if(comparable){for(const [direction,label] of [['ahead','待推送'],['behind','待拉取']])result+=button('commits',`${label} · ${v[direction]} 个`,`data-direction="${direction}" ${!v[direction]?'disabled':''}`);}
    else result+='<p>配置远端上游后可比较提交</p>';
    return result+'</section>';
  }
  function render() {
    const active=getPanel()==='git';host.hidden=!active;if(!active)return;
    const project=getProjects().find(p=>p.id===projectId),state=states.get(projectId);
    if(project && !workspace && state?.workspace)workspace=state.workspace;
    const invalid=!project || workspace && state?.workspace!==workspace;
    let body=button('close','返回会话列表')+`<h2>${esc(project?.name||'项目')} · Git</h2><small>实际工作区共享状态 · 不归属于某个会话</small>`;
    if(invalid) {request++;body+='<p>账号、项目或工作区已变化，请返回列表重新进入。</p>';}
    else if(view.kind==='overview')body+=overview(state);
    else {
      body+=button('back','返回上一级');
      if(data)body+=`<small>内容读取于 ${esc(stamp(readAt))} · 后续变化不会自动替换正在阅读的内容</small>`+button('retry','重新读取',busy?'disabled':'');
      if(state?.stale||state?.error)body+='<p role="status">工作区状态待确认；当前内容是上次读取结果。</p>';
      if(busy)body+='<p role="status">正在读取…</p>';
      if(data && view.kind==='commits') {
        body+=`<h3>${view.direction==='ahead'?'待推送':'待拉取'}提交 · 本地缓存</h3>`;
        for(const c of data.commits)body+=button('commit',`${c.id.slice(0,8)} ${c.subject}`,`data-commit="${esc(c.id)}" title="${esc(c.author+' · '+c.date)}"`);
        if(!data.commits.length)body+='<p>没有相关提交</p>';
        if(data.next_offset!==null)body+=button('more','加载更多',busy?'disabled':'');
      } else if(data && view.kind==='commit') {
        body+=`<pre>${esc(data.description)}</pre>`;
        for(const name of data.files)body+=button('file',name,`data-path="${esc(name)}" data-mode="commit" data-commit="${esc(data.id)}"`);
        if(!data.files.length)body+='<p>此提交没有文件差异</p>';
      } else if(data && view.kind==='diff')body+=`<h3>${esc(view.path)}</h3><small>${esc(data.label)} · 只读</small><pre tabindex="0">${esc(data.content||'当前没有可显示的差异；文件状态可能已变化。')}</pre>`;
      if(error)body+=`<p role="alert">${esc(error)}</p>${button('retry','重试')}`;
    }
    if(error && view.kind==='overview')body+=`<p role="alert">${esc(error)}</p>`;
    if(body===markup)return;
    const scroll=host.scrollTop, focused=host.contains(document.activeElement)?document.activeElement:null;
    const focus=focused?{...focused.dataset}:null;
    host.innerHTML=body;markup=body;host.scrollTop=scroll;
    if(focus)[...host.querySelectorAll('button')].find(b=>Object.keys(focus).every(k=>b.dataset[k]===focus[k]))?.focus({preventScroll:true});
  }
  async function load(next, append=false) {
    view=next;error='';busy=true;if(!append)data=null;const seq=++request,token=workspace,id=projectId;
    render();
    try {
      const result=await api.chatGit(next.kind,{...next,project_id:id,expected_workspace:token});
      if(seq!==request||projectId!==id||states.get(id)?.workspace!==token||result.workspace!==token)return;
      readAt=Date.now();
      data=append?{...result.data,commits:[...data.commits,...result.data.commits]}:result.data;
    }catch(e){if(seq===request)error=e.message;}
    finally{if(seq===request){busy=false;render();}}
  }
  function close() {request++;setPanel('sessions');queueMicrotask(()=>document.querySelector(`[data-chat-git-project="${CSS.escape(projectId)}"]`)?.focus({preventScroll:true}));}
  host.addEventListener('click',async e=>{
    const b=e.target.closest('[data-git-action]');if(!b)return;
    const action=b.dataset.gitAction;
    if(action==='close'){close();return;}
    if(action==='refresh'||action==='fetch'){
      busy=true;error='';render();const seq=++request;
      try {if(!states.get(projectId)?.workspace)await states.retry();else await states[action](projectId);}
      catch(e){if(seq===request)error=e.message;}
      finally{if(seq===request){busy=false;if(!workspace)workspace=states.get(projectId)?.workspace||'';render();}}return;
    }
    if(action==='back'){
      if(view.parent){void load(view.parent);}
      else{view={kind:'overview'};request++;busy=false;error='';data=null;render();}
    }else if(action==='commits')void load({kind:'commits',direction:b.dataset.direction,offset:0});
    else if(action==='commit')void load({kind:'commit',commit:b.dataset.commit,parent:{kind:'commits',direction:view.direction,offset:0}});
    else if(action==='file')void load({kind:'diff',path:b.dataset.path,mode:b.dataset.mode,commit:b.dataset.commit,parent:view.kind==='commit'?view:null});
    else if(action==='more')void load({...view,offset:data.next_offset,range:data.range},true);
    else if(action==='retry')void load(view.kind==='commits'?{kind:'commits',direction:view.direction,offset:0}:view);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&getPanel()==='git'&&!document.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation();close();}},true);
  return {render,open(id){projectId=id;workspace=states.get(id)?.workspace||'';view={kind:'overview'};data=null;error='';busy=false;request++;setPanel('git');render();host.querySelector('button')?.focus({preventScroll:true});},reset(){request++;projectId='';workspace='';data=null;markup='';host.replaceChildren();}};
}
