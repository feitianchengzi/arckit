/* Formal Chat prototype: isolated Git samples, no repository or network operations. */
(() => {
const M=ChatModel,V=ChatViews,P=ChatPrototype;
const $=s=>document.querySelector(s);
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
let scenario='dirty',current=null,checked=null,detailView='overview';
function detail() {
 const [summary,meaning,ahead,behind]=states[scenario];
 const b=(action,label)=>`<button data-git-action="${action}">${label}</button>`;
 let content=`<p>${meaning}</p>`;
 if(detailView==='overview') {
  if(['norepo','unbound','unknown'].includes(scenario)) content+=b('refresh','重新读取');
  else {
   content+=`<section><h3>当前分支 · main</h3><p>${ahead&&behind?'双方分歧 · ':''}↑ ${ahead} 个待推送 · ↓ ${behind} 个待拉取</p><small>数量基于本地远端跟踪缓存</small><small>${checked?'最近获取：'+checked:'本次观察尚未获取远端更新'}</small>${scenario==='fetcherror'?'<p>远端获取失败 · 网络不可用；未产生新的成功时间</p>':''}<div class="git-actions">${b('refresh','刷新本地状态')}${b('fetch','获取远端更新')}</div></section>`;
   content+='<section><h3>修改文件</h3>'+(['dirty','conflict','stale','error'].includes(scenario)?b('worktree','src/app.js · 未暂存')+b('staged','README.md · 已暂存')+b('untracked','notes.txt · 未跟踪')+b('conflict','src/state.js · '+(scenario==='conflict'?'冲突':'暂存后又修改')):'<p>没有未提交修改</p>')+'</section>';
   content+='<section><h3>相关提交</h3>'+(ahead?b('commit','待推送 · a1b2c3d 改善状态读取'):'')+(behind?b('commit','待拉取 · d4e5f6a 更新文档'):'')+(!ahead&&!behind?'<p>缓存中没有待推送或待拉取提交</p>':'')+'</section>';
  }
 } else if(detailView==='commit') content=b('overview','返回概览')+'<h3>提交内容</h3><p>示例作者 · 示例时间</p>'+b('commitdiff','src/app.js · 查看提交差异');
 else content=b(detailView==='commitdiff'?'commit':'overview','返回上一级')+`<h3>${({worktree:'未暂存差异',staged:'已暂存差异',untracked:'未跟踪内容',conflict:'工作区差异／冲突标记',commitdiff:'相对父提交的差异'})[detailView]}</h3><small>只读</small><pre tabindex="0">${detailView==='untracked'?'待整理说明':'- const status = cached;\n+ const status = await readGit();'}</pre>`;
 return `<header><h2>${V.esc(M.project(current)?.name||'项目')} · Git</h2>${b('close','返回会话列表')}</header><small>实际工作区共享状态 · 不归属于某个会话</small>${content}`;
}
function paint() {
 document.querySelectorAll('.session-project').forEach(title=>{
  if(title.parentElement.classList.contains('git-group-head'))return;
  const wrap=document.createElement('div');wrap.className='git-group-head';title.before(wrap);wrap.append(title);
  const summary=document.createElement('button');summary.dataset.gitProject=title.dataset.project;summary.className='git-summary'+(scenario==='clean'?' muted':'');summary.textContent=states[scenario][0];summary.title=states[scenario][1];summary.setAttribute('aria-label',`${M.project(title.dataset.project)?.name} Git：${states[scenario][1]}`);wrap.append(summary);
 });
 const side=$('.chat-sessions');
 if(M.state.detailPanel==='git'&&current) {
  side.querySelectorAll('.session-groups,.native-search,footer,.sample-task-detail,.chat-files').forEach(n=>n.hidden=true);
  let pane=side.querySelector('.chat-git-detail');if(!pane){pane=document.createElement('section');pane.className='chat-git-detail';pane.tabIndex=-1;side.append(pane);}pane.innerHTML=detail();
 }
}
const base=V.render;V.render=function(){base();paint();};
function render(){P.render();}
function close(){M.state.detailPanel='sessions';render();document.querySelector(`[data-git-project="${current}"]`)?.focus({preventScroll:true});}
document.addEventListener('click',e=>{
 const entry=e.target.closest('[data-git-project]');
 if(entry){current=entry.dataset.gitProject;detailView='overview';M.state.detailPanel='git';render();$('.chat-git-detail button')?.focus({preventScroll:true});return;}
 const b=e.target.closest('[data-git-action]');if(!b)return;
 const action=b.dataset.gitAction;
 if(action==='close'){close();return;}
 if(action==='refresh'){scenario='dirty';}
 else if(action==='fetch'){checked=new Date().toLocaleTimeString();if(scenario==='fetcherror')scenario='clean';}
 else detailView=action;
 render();$('.chat-git-detail')?.focus({preventScroll:true});
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&M.state.detailPanel==='git'&&!document.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation();close();}},true);
window.ChatGitPrototype={scenario(name){if(!states[name])throw Error('unknown Git scenario');scenario=name;checked=null;detailView='overview';render();},states};
render();
})();
