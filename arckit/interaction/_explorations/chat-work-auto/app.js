(() => {
const app=document.querySelector('#app'),dialog=document.querySelector('#dialog'),{e,b}=V;let composing=false,returnFocus=null,toastTimer;
const memberNames=()=>M.s.projects?.find(p=>p.id===M.s.project)?.members.map(m=>m.name)||['我','林悦','陈昊'];
const sample='只保留导出进度和失败重试，不增加历史记录页面。';
function paint({bottom=false}={}){const scroll=document.querySelector('#transcript')?.scrollTop||0,active=document.activeElement,mark=active?.getAttribute('aria-label'),sel=typeof active?.selectionStart==='number'?[active.selectionStart,active.selectionEnd]:null;M.save();app.innerHTML=V.render();const box=document.querySelector('#transcript');if(box)box.scrollTop=bottom?box.scrollHeight:(M.current()?.scroll??scroll);if(mark){const el=[...app.querySelectorAll('[aria-label]')].find(n=>n.getAttribute('aria-label')===mark);el?.focus({preventScroll:true});if(sel&&el?.setSelectionRange)el.setSelectionRange(...sel);}}
function notify(t){clearTimeout(toastTimer);const n=document.querySelector('#toast');n.textContent=t;n.hidden=false;toastTimer=setTimeout(()=>n.hidden=true,3200);}
function modal(title,html){if(!dialog.open){returnFocus={act:document.activeElement?.dataset.act,label:document.activeElement?.getAttribute('aria-label')};}dialog.innerHTML=`<div class="row between"><h2 id="dialog-title">${title}</h2>${b('close',V.icon('close'),'quiet','aria-label="关闭弹窗"')}</div>${html}`;if(!dialog.open)dialog.showModal();}
function restoreFocus(){const el=[...app.querySelectorAll('button,input,textarea')].find(n=>returnFocus?.label?n.getAttribute('aria-label')===returnFocus.label:returnFocus?.act&&n.dataset.act===returnFocus.act);el?.focus({preventScroll:true});}
function close(){dialog.close();paint();restoreFocus();}
function field(label,name,value,type='input'){return `<label>${label}${type==='textarea'?`<textarea name="${name}" ${["constraints","criteria"].includes(name)?"":"required"}>${e(value)}</textarea>`:`<input name="${name}" value="${e(value)}" required>`}</label>`;}
function tick(){const t=M.current();if(!t)return notify('先选择一件工作。');if(M.s.offline)return notify('离线，现场已保留。');if(t.mode==='pausing'){t.mode='paused';t.events.push('收到停止回执，人工可以接管。');M.msg(t,'assistant','已经停下。可以调整工作内容，明确继续后我再推进。');}else if(t.mode==='auto'){M.settle(t);t.progress++;if(t.progress===1&&t.questions.length){t.mode='decision';M.msg(t,'assistant','发现一个产品取舍：失败后是否保留已选内容？请确认后继续。');}else if(t.progress>=3){t.mode='done';t.state='待验收';t.artifacts=['导出体验'];M.msg(t,'assistant','本轮候选成果已准备好：导出进度、失败提示与重试。可以打开成果检查。');}else M.msg(t,'assistant','已按当前目标形成候选方案，正在检查进度展示和失败重试路径。');}else return notify('当前没有正在推进的样本。');paint();}
function inspect(){const t=M.current();if(!t.artifacts.length)return notify('还没有形成成果。');t.viewed=true;M.save();modal('导出体验 · 检查成果',`<small>工作 #${t.id} · 候选版本 ${t.revision}</small><div class="preview"><div class="row between"><strong>拾光 / 导出阅读记录</strong><span>已选择 12 条</span></div><p id="preview-status">准备导出你的阅读记录。</p><div class="progress" hidden><span></span></div><div class="row">${b('preview-start','开始导出','primary')}${b('preview-fail','失败状态','quiet')}${b('preview-success','完成状态','quiet')}</div></div><p>检查范围：导出进度、失败提示与重试。</p><label class="checks"><input type="checkbox" data-check ${t.checked?'checked':''} ${t.mode==='accepted'?'disabled':''}>符合当前目标与完成标准</label><div class="row">${b('accept',t.mode==='accepted'?'已验收':'确认验收','primary',!t.checked||t.mode!=='done'?'disabled':'')}${t.mode==='done'?b('repair','提出调整'):''}</div>`);}
app.addEventListener('scroll',ev=>{if(ev.target.id==='transcript'&&M.current()){M.current().scroll=ev.target.scrollTop;M.save();}},true);
app.addEventListener('compositionstart',()=>composing=true);app.addEventListener('compositionend',()=>composing=false);
app.addEventListener('input',ev=>{if(ev.target.name==='message'){const t=M.current();if(t)t.draft=ev.target.value;else M.s.newDraft=ev.target.value;M.save();}if(ev.target.classList.contains('search')){M.s.search=ev.target.value;paint();}});
app.addEventListener('keydown',ev=>{if(ev.target.name==='message'&&ev.key==='Enter'&&!ev.shiftKey&&!ev.isComposing&&!composing){ev.preventDefault();ev.target.form.requestSubmit();}if(ev.key==='Escape'&&M.s.drawer){M.s.drawer=false;paint();document.querySelector('[data-act=details]')?.focus();}});
dialog.addEventListener('cancel',()=>setTimeout(()=>{paint();restoreFocus()},0));
document.addEventListener('change',ev=>{if(ev.target.matches('[data-check]')){M.current().checked=ev.target.checked;M.save();dialog.querySelector('[data-act=accept]').disabled=!ev.target.checked||M.current().mode!=='done';}});
document.addEventListener('click',ev=>{const el=ev.target.closest('[data-act]');if(!el||el.disabled)return;const a=el.dataset.act,t=M.current(),s=M.s;
if(a==='close')return close();if(a==='tick')return tick();
if(a==='new'){s.selected=null;s.drawer=false;s.nav=false;s.error='';}
else if(a==='select'){s.selected=el.dataset.id;s.drawer=false;s.nav=false;s.error='';}
else if(a==='filter')s.filter=el.dataset.filter;
else if(a==='nav')s.nav=!s.nav;
else if(a==='theme')s.theme=s.theme==='light'?'dark':'light';
else if(a==='details'){s.drawer=true;}
else if(a==='close-details'){s.drawer=false;}
else if(a==='sample'||a==='fill'){const text=t?sample:'用户说导出阅读记录时没有反应，先帮我分析一下。';if(t)t.draft=text;else s.newDraft=text;paint();document.querySelector('[name=message]')?.focus();return;}
else if(a==='create')return modal('直接创建待办',`<p class="muted">创建后可开始讨论、分配负责人或交给 Auto。</p><form data-form="create">${field('工作内容','title','补充导出失败的提示文案','textarea')}<label>负责人<select name="owner">${memberNames().map(name=>`<option>${e(name)}</option>`).join('')}</select></label><button class="primary">创建待办</button><p data-error class="error"></p></form>`);
else if(a==='edit'){if(['auto','pausing'].includes(t.mode))return notify('先暂停并收到停止回执，再直接修改。');return modal('编辑当前有效信息',`<form data-form="edit">${field('标题','title',t.title)}${field('当前目标','goal',t.goal,'textarea')}${field('约束（每行一条）','constraints',t.constraints.map(c=>c.text).join('\n'),'textarea')}${field('完成标准（每行一条）','criteria',t.criteria.join('\n'),'textarea')}<small>人工修改保留来源，后续协作采用此版本。</small><p><button class="primary">保存到同一待办</button></p><p data-error class="error"></p></form>`);}
else if(a==='assign')return modal('分配工作',`<p>工作 #${t.id}。分配负责人不会自动开始执行。</p><form data-form="assign"><label>负责人<select name="owner">${memberNames().map(x=>`<option ${t.owner===x?'selected':''}>${x}</option>`).join('')}</select></label><button class="primary">保存负责人</button><p data-error class="error"></p></form>`);
else if(a==='auto')return modal('让 Auto 持续推进',`<p><strong>${e(t.title)}</strong></p><p>${e(t.goal)}</p><p>本轮准备可检查的改进方案。遇到产品取舍交还给你，保留当前对话和工作信息。</p>${t.constraints.some(c=>c.text.includes('暂不')||c.text.includes('不要改'))?'<div class="note">之前要求先分析。本次启动仅授权推进改进方案与交互样本，不授权修改真实代码。</div>':''}${b('start-auto','开始本轮 Auto','primary')}`);
else if(a==='start-auto'){if(s.offline)return notify('离线，恢复后再启动。');t.mode='auto';t.state='进行中';t.events.push('用户明确启动 Auto');M.msg(t,'assistant','这轮交给我。我会沿用已有目标和约束，遇到需要你决定的地方再停下。');dialog.close();}
else if(a==='pause'){t.mode='pausing';t.events.push('已请求暂停，等待停止回执');}
else if(a==='decide')return modal('确认一个产品取舍',`<p>失败后保留已选内容，允许在原位置重试；不新增历史记录页面。</p><form data-form="decide"><label>你的选择<select name="choice"><option value="keep">保留选择，并提供重试（建议）</option><option value="again">失败后重新选择，再次导出</option></select></label><button class="primary">确认，继续本轮</button><p data-error class="error"></p></form>`);
else if(a==='inspect')return inspect();
else if(a==='preview-start'){dialog.querySelector('#preview-status').textContent='正在导出 · 65%';dialog.querySelector('.progress').hidden=false;return;}
else if(a==='preview-fail'){dialog.querySelector('#preview-status').textContent=t.choice==='again'?'导出失败 · 请重新选择内容后重试':'导出失败 · 已保留 12 条选择，可再次点击“开始导出”重试';dialog.querySelector('.progress').hidden=true;return;}
else if(a==='preview-success'){dialog.querySelector('#preview-status').textContent='已完成 · 12 条阅读记录';dialog.querySelector('.progress').hidden=true;return;}
else if(a==='accept'){if(t.mode!=='done'||!t.checked||!t.viewed)return;t.mode='accepted';t.state='已验收';t.events.push('用户检查后验收');M.msg(t,'assistant','本轮工作已验收。成果与有效约定保留在同一个待办中。');dialog.close();}
else if(a==='repair')return modal('提出调整',`<form data-form="repair">${field('还需要改什么','issue','失败提示需要说明可以重试。','textarea')}<button class="primary">保存问题，回到人工协作</button><p data-error class="error"></p></form>`);
else if(a==='source'){if(el.dataset.source==='manual')return notify('来自你对工作信息的直接编辑。');s.drawer=false;paint();const n=document.getElementById(el.dataset.source);if(n){n.scrollIntoView({block:'center'});n.classList.add('flash');setTimeout(()=>n.classList.remove('flash'),2000);}else notify('来源为本轮明确选择，已记录在工作活动中。');return;}
else if(a==='runs')return modal('当前运行',s.tasks.filter(x=>['auto','pausing','decision','paused','done'].includes(x.mode)).map(x=>`<button class="artifact" data-act="locate" data-id="${x.id}"><span class="grow"><strong>${e(x.title)}</strong><br><small>#${x.id} · ${M.status(x)}</small></span>打开</button>`).join('')||'<p class="muted">当前没有运行。进入一件工作后，可明确交给 Auto。</p>');
else if(a==='locate'){s.selected=el.dataset.id;s.filter='all';s.search='';s.nav=false;dialog.close();}
else if(a==='lab')return modal('预览场景',`<p>三版数据独立。本地预置回应用于比较交互，不具备真实语义理解。</p><div class="row wrap">${b('offline',s.offline?'恢复在线':'模拟离线')}${b('fail','下次提交失败')}${b('reset','重置本版本')}</div><p>刷新可验证草稿恢复，以及 Auto 中断后暂停。顶部“推进样本”用于停止回执、决策和成果生成。</p>`);
else if(a==='offline'){s.offline=!s.offline;dialog.close();}
else if(a==='fail'){s.fail=true;dialog.close();notify('下次表单提交失败，输入会保留。');}
else if(a==='reset'){M.reset();location.reload();return;}
else return;
paint();});
document.addEventListener('submit',ev=>{const form=ev.target,kind=form.dataset.form;if(!kind)return;ev.preventDefault();const s=M.s,data=new FormData(form);let t=M.current();const error=text=>{if(kind==='message'){s.error=text;paint();}else form.querySelector('[data-error]').textContent=text;};if(s.offline||s.fail){s.fail=false;M.save();return error('提交失败，输入已保留。请恢复后重试。');}s.error='';
if(kind==='message'){const text=String(data.get('message')||'').trim();if(!text)return;if(t&&['pausing','accepted'].includes(t.mode))return;if(!t){t=M.add(text.length>28?text.slice(0,28)+'…':text,true);s.newDraft='';}const m=M.msg(t,'user',text,{pending:t.mode==='auto'});t.draft='';if(t.mode!=='auto'){if(text===sample){t.goal='为阅读记录导出补充进度反馈和失败重试，保持体验轻量。';t.constraints.push({text:'不增加历史记录页面',source:m.id,kind:'已明确'});t.criteria=['导出时显示进度','失败后可按确认方案重试'];}else t.notes.push({text,source:m.id});t.summaryVersion++;M.msg(t,'assistant',text===sample?'已更新这件事的目标与约束。当前范围是进度反馈和失败重试，不增加历史页面。可以继续讨论，也可以把这一轮交给 Auto。':'已保存你的补充。',{receipt:text===sample?'目标与约束已更新 · 可查看和纠正':'工作 #'+t.id+' · 输入已保留'});}paint({bottom:true});return;}
if(kind==='create'){const title=data.get('title').trim();if(!title)return error('请填写工作内容');t=M.add(title);t.owner=data.get('owner');s.nav=false;}
if(kind==='edit'){if(['auto','pausing'].includes(t.mode))return error('执行中，请先暂停。');t.title=data.get('title').trim();t.goal=data.get('goal').trim();t.constraints=data.get('constraints').split('\n').filter(Boolean).map(text=>({text,source:'manual',kind:'人工编辑'}));t.criteria=data.get('criteria').split('\n').filter(Boolean);t.summaryVersion++;t.revision++;t.checked=false;t.viewed=false;t.events.push('人工修改有效信息；旧验收勾选已失效');if(t.mode==='accepted'||t.mode==='done'){t.mode='paused';t.state='进行中';t.progress=1;} }
if(kind==='assign'){if(['auto','pausing'].includes(t.mode))return error('先暂停当前执行，再变更负责人。');t.owner=data.get('owner');t.events.push('负责人改为 '+t.owner);}
if(kind==='decide'){t.choice=data.get('choice');const text=t.choice==='keep'?'失败后保留选择并可重试':'失败后重新选择，再次导出';t.constraints.push({text,source:'decision',kind:'用户已决定'});t.criteria=['导出时显示进度',text];t.questions=[];t.mode='auto';t.summaryVersion++;M.msg(t,'user',text);M.msg(t,'assistant','已记入工作约定，继续本轮。');}
if(kind==='repair'){M.msg(t,'user',data.get('issue'));t.state='进行中';t.mode='paused';t.progress=1;t.checked=false;t.viewed=false;t.events.push('新增验收调整，等待明确继续');}
dialog.close();paint();restoreFocus();});
document.addEventListener('dock:refresh',()=>paint());
document.addEventListener('dock:tick',()=>tick());
paint();
})();
