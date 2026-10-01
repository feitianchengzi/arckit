const $ = s => document.querySelector(s);
const states = {
  dirty: ['4 个文件未提交 · ↑2', '4 个文件未提交；缓存中有 2 个待推送提交', 2, 0],
  clean: ['Git · 本地干净', '工作区与暂存区没有修改；不代表实时远端已同步', 0, 0],
  ahead: ['↑2 待推送', '本地干净，缓存中有 2 个待推送提交', 2, 0],
  behind: ['↓3 待拉取', '本地干净，缓存中有 3 个待拉取提交', 0, 3],
  diverged: ['↑2 · ↓3 分歧', '本地与远端跟踪分支各有新增提交', 2, 3],
  conflict: ['1 个冲突 · 4 个文件未提交', '存在未解决冲突', 0, 0],
  unknown: ['Git · 读取中', '本地状态尚未读取成功', 0, 0],
  stale: ['Git · 状态过期', '上次结果：4 个文件未提交；当前结果尚未确认', 2, 0],
  error: ['Git · 读取失败', '读取失败；保留上次结果：4 个文件未提交', 2, 0],
  fetcherror: ['Git · 远端获取失败', '本地干净；上次获取失败，远端状态未确认', 0, 0],
  norepo: ['无 Git 仓库', '绑定目录不是 Git 仓库', 0, 0],
  unbound: ['未绑定工作区', '项目没有绑定本地工作区', 0, 0],
};
let scenario = 'dirty', current = null, checked = null, collapsed = new Set(), origin = null, detailView = 'overview';
const projects = ['ArcOrbit 研发平台与协作协议', '另一个项目'];
$('#scenario').innerHTML = Object.entries(states).map(([key,s])=>`<option value="${key}">${s[0]}</option>`).join('');
function renderList() {
  $('#list').innerHTML = '<h2>会话列表</h2>' + projects.map((name,i)=>`<div class="group"><header><button class="project" data-collapse="${i}" aria-expanded="${!collapsed.has(i)}">${name}</button><button class="summary ${scenario==='clean'?'muted':''}" data-git="${i}" title="${states[scenario][1]}" aria-label="${name} Git：${states[scenario][1]}">${states[scenario][0]}</button></header><div class="sessions" ${collapsed.has(i)?'hidden':''}><p>${i===0?'当前会话 · 检查这次修改':'历史会话'}</p><p>另一个会话</p></div></div>`).join('');
}
function renderDetail() {
  if(current===null) return;
  const [summary,meaning,ahead,behind] = states[scenario];
  const unavailable=['norepo','unbound','unknown'].includes(scenario);
  let content;
  if(detailView==='overview') {
    content=`<p class="${['conflict','stale','error','fetcherror'].includes(scenario)?'warning':''}">${meaning}</p>`;
    if(!unavailable) content+=`<section><h3>当前分支 · main</h3><p>${ahead&&behind?'双方分歧 · ':''}↑ ${ahead} 个待推送 · ↓ ${behind} 个待拉取</p><small>提交数量基于本地远端跟踪缓存</small><small>${checked?'本次预览获取时间：'+checked:'本次观察尚未获取远端更新'}</small>${scenario==='fetcherror'?'<p class="warning">获取失败 · 网络不可用；没有新的成功时间</p>':''}<div class="actions"><button data-action="refresh">刷新本地状态</button><button data-action="fetch">获取远端更新</button></div></section>
    <section><h3>修改文件</h3>${['dirty','conflict','stale','error'].includes(scenario)?'<button class="row" data-action="worktree">src/app.js · 未暂存</button><button class="row" data-action="staged">README.md · 已暂存</button><button class="row" data-action="untracked">notes.txt · 未跟踪</button><button class="row" data-action="conflict">src/state.js · '+(scenario==='conflict'?'冲突':'暂存后又修改')+'</button>':'<p>没有未提交修改</p>'}</section>
    <section><h3>相关提交</h3>${ahead?'<button class="row" data-action="commit">待推送 · a1b2c3d 改善状态读取</button>':''}${behind?'<button class="row" data-action="commit">待拉取 · d4e5f6a 更新文档</button>':''}${!ahead&&!behind?'<p>缓存中没有待推送或待拉取提交</p>':''}</section>`;
    else content+='<button data-action="refresh">重新读取</button>';
  } else if(detailView==='commit') {
    content='<button data-action="overview">返回概览</button><h3>a1b2c3d · 改善状态读取</h3><p>示例作者 · 示例时间</p><p>提交内容按需读取</p><button class="row" data-action="commitdiff">src/app.js · 查看提交差异</button>';
  } else {
    content=`<button data-action="${detailView==='commitdiff'?'commit':'overview'}">返回${detailView==='commitdiff'?'提交':'概览'}</button><h3>${({worktree:'未暂存差异',staged:'已暂存差异',untracked:'未跟踪文件内容',conflict:'工作区差异（含冲突标记）',commitdiff:'提交相对父提交的差异'})[detailView]}</h3><small>只读 · 本地模拟内容</small><pre tabindex="0">${detailView==='untracked'?'待整理的说明':detailView==='conflict'?'&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD\n本地内容\n=======\n另一侧内容\n&gt;&gt;&gt;&gt;&gt;&gt;&gt; incoming':'- const status = cached;\n+ const status = await readGit();'}</pre>`;
  }
  const markup=`<section class="details"><header><h2 id="modal-heading">${projects[current]} · Git</h2><button data-action="close">${$('#mode').value==='side'?'返回会话列表':'关闭'}</button></header><small>项目工作区共享状态 · 不归属于某个会话</small>${content}</section>`;
  const target=$('#mode').value==='side'?$('#side-detail'):$('#modal');
  target.innerHTML=markup;
}
function open(i) {
  current=i; origin=document.activeElement; detailView='overview'; renderDetail();
  if($('#mode').value==='side') { $('#list').hidden=true; $('#side-detail').hidden=false; $('#side-detail button').focus(); }
  else $('#modal').showModal();
}
function close() {
  const id=current; current=null; $('#modal').close(); $('#side-detail').hidden=true; $('#list').hidden=false;
  (origin?.isConnected?origin:$(`[data-git="${id}"]`))?.focus();
}
document.addEventListener('click', e=>{
  const button=e.target.closest('button'); if(!button)return;
  if(button.dataset.collapse!==undefined) { const i=+button.dataset.collapse; collapsed.has(i)?collapsed.delete(i):collapsed.add(i); renderList(); $(`[data-collapse="${i}"]`).focus(); }
  if(button.dataset.git!==undefined) open(+button.dataset.git);
  const action=button.dataset.action;
  if(action==='close') close();
  else if(action==='refresh') { scenario='dirty'; $('#scenario').value=scenario; renderList(); renderDetail(); }
  else if(action==='fetch') { checked=new Date().toLocaleTimeString(); if(scenario==='fetcherror')scenario='clean'; renderList(); renderDetail(); }
  else if(action) { detailView=action; renderDetail(); const target=$('#mode').value==='side'?$('#side-detail'):$('#modal'); target.querySelector('[data-action="'+(action==='commitdiff'?'commit':'overview')+'"]')?.focus(); }
});
$('#modal').addEventListener('cancel',e=>{e.preventDefault();close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape' && current!==null && !$('#modal').open){e.preventDefault();close();}});
$('#scenario').onchange=e=>{scenario=e.target.value;checked=null;detailView='overview';renderList();renderDetail();};
$('#mode').onchange=()=>{if(current!==null)close();};
$('#theme').onchange=e=>document.documentElement.dataset.theme=e.target.value;
$('#width').oninput=e=>document.documentElement.style.setProperty('--side-width',e.target.value+'px');
$('#list-toggle').onclick=()=>$('#sidebar').classList.toggle('closed');
renderList();
