const initialState = {
  currentView: 'today',
  selectedProductId: 'prism',
  selectedTaskId: 248,
  selectedFeedbackId: 'f-1042',
  workFilter: 'open',
  feedbackFilter: 'all',
  autoClaim: true,
  runPaused: false,
  nextTaskId: 520,
  products: [
    { id: 'prism', name: '折光', avatar: '折', platform: 'iOS', description: '离线音乐播放器', goal: '让弱网与离线播放值得信赖', repo: 'prism-ios', path: '~/Projects/prism-ios', branch: 'main', remote: '折光移动端 · #17', state: 'running', stateLabel: '执行中', workset: true, role: 'Owner', members: ['glare','mina','lin','qiao'], cases: 1, gaps: 2 },
    { id: 'daylight', name: '白昼', avatar: '昼', platform: 'Web', description: 'AI 日记与回顾工具', goal: '把零散记录变成可持续的自我观察', repo: 'daylight-web', path: '~/Projects/daylight-web', branch: 'feat/weekly-review', remote: '白昼 Web · #26', state: 'attention', stateLabel: '需要判断', workset: true, role: 'Admin', members: ['glare','qiao','chen'], cases: 1, gaps: 1 },
    { id: 'polaris', name: '北辰', avatar: '辰', platform: 'Service', description: 'API 可观测与告警服务', goal: '让小团队无需运维专家也能定位线上异常', repo: 'polaris-service', path: '~/Projects/polaris-service', branch: 'main', remote: '北辰服务端 · #31', state: 'ready', stateLabel: '可推进', workset: true, role: 'Member', members: ['glare','mina','zhou','wanyi'], cases: 0, gaps: 3 }
  ],
  members: [
    { id: 'glare', name: 'Glare', email: 'glare@feitian.dev', role: 'owner', duty: '产品与开发', load: 5, active: true },
    { id: 'mina', name: 'Mina', email: 'mina@feitian.dev', role: 'admin', duty: '客户端开发', load: 3, active: true },
    { id: 'qiao', name: '乔木', email: 'qiao@feitian.dev', role: 'member', duty: '产品设计', load: 2, active: true },
    { id: 'chen', name: '陈一', email: 'chen@feitian.dev', role: 'member', duty: 'Web 开发', load: 2, active: true },
    { id: 'lin', name: '林然', email: 'lin@feitian.dev', role: 'member', duty: '用户研究', load: 1, active: true },
    { id: 'zhou', name: '周屿', email: 'zhou@feitian.dev', role: 'member', duty: '后端开发', load: 4, active: true },
    { id: 'wanyi', name: '万一', email: 'wanyi@feitian.dev', role: 'member', duty: '质量保障', load: 2, active: true },
    { id: 'external', name: '路遥', email: 'luyao@partner.co', role: 'member', duty: '外部顾问', load: 0, active: false, external: true }
  ],
  tasks: [
    { id: 248, productId: 'prism', title: '首次启动时恢复播放队列', description: '冷启动和离线启动时恢复用户最近一次播放队列。', state: 'in_progress', assignee: 'Glare', priority: 'P1', source: '产品计划', tags: ['playback','offline'], caseId: 'CASE-20260818-004', created: '今天 08:51' },
    { id: 252, productId: 'prism', title: '确认旧版数据库迁移范围', description: '需要产品判断：2.1 之前的下载记录是否继续迁移。', state: 'pending_review', assignee: 'Glare', priority: 'P1', source: '产品计划', tags: ['migration'], created: '昨天 17:32' },
    { id: 247, productId: 'prism', title: '弱网下下载按钮缺少即时反馈', description: '网络响应超过 800ms 时展示明确的已受理状态。', state: 'pending', assignee: 'Glare', priority: 'P2', source: '用户反馈', feedbackId: 'f-1037', tags: ['download','ux'], created: '昨天 11:08' },
    { id: 318, productId: 'daylight', title: '确定周回顾的隐私默认值', description: '需要决定生成回顾时是否默认包含私密条目。', state: 'pending_review', assignee: 'Glare', priority: 'P1', source: '产品计划', tags: ['privacy'], created: '今天 09:22' },
    { id: 315, productId: 'daylight', title: '修复 Safari 长文本输入丢字', description: '组合输入法下快速输入长文本时偶现末尾字符丢失。', state: 'pending', assignee: '陈一', priority: 'P1', source: '用户反馈', feedbackId: 'f-2048', tags: ['editor','safari'], created: '昨天 18:06' },
    { id: 411, productId: 'polaris', title: '补充告警静默窗口', description: '部署期间允许按服务配置短时静默，保留完整事件记录。', state: 'pending', assignee: 'Glare', priority: 'P2', source: '产品计划', tags: ['alerts'], created: '周一 14:20' },
    { id: 414, productId: 'polaris', title: '追踪 webhook 重试证据', description: '为失败重试补充 trace id 和最终投递状态。', state: 'pending', assignee: '周屿', priority: 'P2', source: '子待办', tags: ['webhook'], created: '今天 08:40' },
    { id: 231, productId: 'prism', title: '适配播放器横屏布局', description: '横屏播放页已完成第一轮修复，收到新的验收反馈。', state: 'completed', assignee: 'Glare', priority: 'P2', source: '产品计划', tags: ['layout'], created: '8 月 15 日' },
    { id: 302, productId: 'daylight', title: '日记导出 Markdown', description: '导出内容与附件索引。', state: 'accepted', assignee: '陈一', priority: 'P2', source: '用户反馈', tags: ['export'], created: '8 月 12 日' }
  ],
  feedback: [
    { id: 'f-1042', productId: 'prism', shortId: '1042', title: '飞行模式后最近播放列表会清空', body: '今天早上坐地铁，打开飞行模式后重新进入 App，最近播放列表变空了。退出飞行模式也没有恢复。', state: 'pending', priority: 'P1', user: '林野', userId: 'user_8821', version: 'iOS 2.4.0 (310)', time: '今天 09:03', unread: true, attachments: ['screen-recording.mov','diagnostics.json'] },
    { id: 'f-2048', productId: 'daylight', shortId: '2048', title: 'Safari 写长日记时最后几个字会消失', body: '使用中文输入法连续输入，保存后发现最后几个字没有了。', state: 'converted', priority: 'P1', user: '青禾', userId: 'user_5512', version: 'Web · Safari 18', time: '今天 08:37', unread: true, taskId: 315, taskState: 'pending', attachments: ['console.txt'] },
    { id: 'f-3041', productId: 'polaris', shortId: '3041', title: '希望维护窗口不要触发电话告警', body: '凌晨部署期间会连续触发电话，最好可以提前设置维护时间。', state: 'accepted', priority: 'P2', user: 'Ops Team', userId: 'org_782', version: 'API v1', time: '昨天 21:10', unread: false, attachments: [] },
    { id: 'f-1037', productId: 'prism', shortId: '1037', title: '弱网时点下载没有任何反应', body: '在高铁上点击下载，按钮好像没反应，过一会才突然开始。', state: 'converted', priority: 'P2', user: '陈一', userId: 'user_4910', version: 'iOS 2.4.0 (310)', time: '昨天 15:44', unread: false, taskId: 247, taskState: 'pending', attachments: ['weak-network.png'] },
    { id: 'f-1029', productId: 'prism', shortId: '1029', title: '希望支持整张专辑一键下载', body: '每首歌分别点下载太慢，希望专辑页能一次下载全部。', state: 'accepted', priority: 'P2', user: '木子', userId: 'user_2301', version: 'iOS 2.3.8 (302)', time: '8 月 16 日', unread: false, attachments: [] },
    { id: 'f-2018', productId: 'daylight', shortId: '2018', title: '希望周回顾能隐藏私人条目', body: '有些内容只想记录，不希望出现在 AI 周回顾中。', state: 'pending', priority: 'P1', user: '白术', userId: 'user_991', version: 'Web', time: '8 月 16 日', unread: false, attachments: [] },
    { id: 'f-1018', productId: 'prism', shortId: '1018', title: '耳机型号咨询', body: '请问你们推荐什么耳机？', state: 'ignored', priority: 'P3', user: '匿名用户', userId: 'anonymous', version: 'iOS 2.3.8 (302)', time: '8 月 13 日', unread: false, attachments: [] }
  ]
};

const state = JSON.parse(JSON.stringify(initialState));
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const overlay = $('#modalOverlay');
const modal = $('#modal');
const toast = $('#toast');

const viewNames = { today: 'Today', work: 'Work', automation: 'Automation', feedback: 'Feedback', product: 'Products', team: 'Team', delivery: 'Delivery', capability: 'Capability' };
const stateMeta = { pending_review: ['待评审','pending_review'], pending: ['待处理','pending'], in_progress: ['进行中','in_progress'], completed: ['已完成','completed'], accepted: ['已验收','accepted'], cancelled: ['已取消','cancelled'], blocked: ['已阻塞','blocked'] };
const feedbackMeta = { pending: '待判断', accepted: '已受理', converted: '已流转', ignored: '已忽略' };
const roleMeta = { owner: '所有者', admin: '管理员', member: '成员' };

function scopedProducts() { return state.products.filter(product => product.workset); }
function productById(id) { return state.products.find(product => product.id === id); }
function isInScope(item) { return scopedProducts().some(product => product.id === item.productId); }
function scopedTasks() { return state.tasks.filter(isInScope); }
function scopedFeedback() { return state.feedback.filter(isInScope); }
function productBadge(productId) { const product = productById(productId); return `<span class="product-tag product-${productId}"><i>${product.avatar}</i>${product.name}</span>`; }
function showToast(message) { toast.textContent = message; toast.classList.remove('hidden'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2200); }
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }
function taskState(task) { const [label, cls] = stateMeta[task.state] || [task.state,'']; return `<span class="state-text ${cls}"><i></i>${label}</span>`; }
function priority(item) { return `<span class="priority ${item.priority.toLowerCase()}">${item.priority}</span>`; }

function navigate(view) {
  if (!viewNames[view]) return;
  state.currentView = view;
  $$('.view').forEach(panel => panel.classList.toggle('active', panel.dataset.viewPanel === view));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  $('#crumbTitle').textContent = viewNames[view];
  if (view === 'work') renderWork();
  if (view === 'automation') renderAutomationQueue();
  if (view === 'feedback') renderFeedback();
  if (view === 'product') renderProducts();
  if (view === 'team') renderTeam();
}

function renderScope() {
  const products = scopedProducts();
  const count = products.length;
  $('#worksetTitle').textContent = count === 1 ? products[0].name : `${count} 个产品`;
  $('#scopeCrumb').textContent = count === 1 ? products[0].name : `${count} 个产品`;
  $('#todayHeading').textContent = count === 1 ? `继续推进「${products[0].name}」` : `同时推进 ${count} 个产品`;
  $('#localScopeTitle').textContent = count === 1 ? products[0].repo : `${count} 个本地项目`;
  $('#localScopePath').textContent = count === 1 ? `${products[0].path} · ${products[0].branch}` : '均已绑定 · 当前工作集';
  $('#workspaceChip').innerHTML = `<i></i>${count === 1 ? `${products[0].branch} · ready` : `${count} workspaces ready`}`;
  $('#productBadge').textContent = count;
  $('#portfolioStrip').innerHTML = products.map(product => {
    const tasks = state.tasks.filter(task => task.productId === product.id && !['accepted','completed','cancelled'].includes(task.state));
    const feedback = state.feedback.filter(item => item.productId === product.id && item.state === 'pending');
    return `<button class="portfolio-product product-${product.id}" data-product-id="${product.id}" type="button"><span class="portfolio-avatar">${product.avatar}</span><span><strong>${product.name}</strong><small>${product.platform} · ${product.repo}</small></span><em class="portfolio-state ${product.state}">${product.stateLabel}</em><span class="portfolio-counts"><b>${tasks.length}</b> Work · <b>${feedback.length}</b> 待判断</span></button>`;
  }).join('');
  $$('.portfolio-product').forEach(button => button.addEventListener('click', () => { state.selectedProductId = button.dataset.productId; navigate('product'); }));
  $('#worksetHealthList').innerHTML = products.map(product => `<button data-product-id="${product.id}" type="button"><span class="product-mini-avatar product-${product.id}">${product.avatar}</span><span><strong>${product.name}</strong><small>${product.repo} · ${product.branch}</small></span><em class="health-${product.state}">${product.stateLabel}</em></button>`).join('');
  $$('#worksetHealthList button').forEach(button => button.addEventListener('click', () => { state.selectedProductId = button.dataset.productId; navigate('product'); }));
  renderTodayTasks(); renderCurrentCase(); renderTodaySignal(); renderWork(); renderAutomationQueue(); renderFeedback(); renderProducts(); renderTeam();
}

function renderCurrentCase() {
  const panel = $('#currentCasePanel');
  const active = scopedTasks().find(task => task.state === 'in_progress');
  const attention = scopedTasks().find(task => task.state === 'pending_review');
  const task = active || attention;
  if (!task) {
    panel.innerHTML = `<header class="panel-header"><div><span class="section-kicker">CURRENT CASE</span><h2>当前工作集没有运行中的 Case</h2></div><span class="status-chip healthy">队列就绪</span></header><div class="case-body"><div class="case-progress"><p>你仍可以在 Work 中完成产品判断，或让 eligible 待办进入自动队列。</p></div><button class="secondary-button" data-view="work" type="button">查看跨产品待办</button></div>`;
    bindDynamicNavigation(panel);
    return;
  }
  const product = productById(task.productId);
  const running = task.state === 'in_progress';
  panel.innerHTML = `<header class="panel-header"><div><span class="section-kicker">${running ? 'CURRENT CASE' : 'HUMAN DECISION'} · ${product.name}</span><h2>${task.title}</h2></div><span class="status-chip ${running ? 'running' : 'pending'}">${running ? '<i></i> Codex 执行中' : '等待人工判断'}</span></header><div class="case-body"><div class="case-progress"><div class="case-meta"><span>${task.caseId || '尚未创建 Case'}</span><span>Work #${task.id}</span><span>${product.repo}</span></div><p>${task.description}</p><div class="loop-track"><span class="done">产品事实</span><i></i><span class="${running ? 'done' : 'current'}">人工边界</span><i></i><span class="${running ? 'current' : ''}">${running ? '实现与验证' : '等待决定'}</span><i></i><span>证据收束</span></div></div><div class="case-actions"><button class="secondary-button" data-task-id="${task.id}" type="button">${running ? '查看执行现场' : '完成产品判断'}</button><button class="ghost-button" data-action="pause-run" type="button">暂停领取新任务</button></div></div>`;
  $('[data-task-id]', panel).addEventListener('click', () => running ? navigate('automation') : openTask(task.id));
  $('[data-action="pause-run"]', panel).addEventListener('click', pauseNewClaims);
}

function renderTodayTasks() {
  const tasks = scopedTasks().filter(task => !['accepted','cancelled','completed'].includes(task.state)).sort((a,b) => a.priority.localeCompare(b.priority)).slice(0,5);
  $('#todayTaskList').innerHTML = tasks.map(task => `<button class="focus-item" data-task-id="${task.id}" type="button"><span class="status-square ${task.state === 'in_progress' ? 'in-progress' : ''}">${task.state === 'in_progress' ? '▶' : ''}</span><span class="focus-copy"><strong>${task.title}</strong><small>#${task.id} · ${productById(task.productId).repo}</small></span>${taskState(task)}${priority(task)}${productBadge(task.productId)}</button>`).join('');
  $$('.focus-item').forEach(button => button.addEventListener('click', () => openTask(Number(button.dataset.taskId))));
}

function renderTodaySignal() {
  const panel = $('#todaySignalPanel');
  const item = scopedFeedback().find(feedback => feedback.state === 'pending') || scopedFeedback()[0];
  if (!item) { panel.innerHTML = '<div class="detail-empty"><div><span>◇</span><p>当前工作集没有反馈</p></div></div>'; return; }
  const product = productById(item.productId);
  panel.innerHTML = `<header class="panel-header"><div><span class="section-kicker">USER SIGNAL · ${product.name}</span><h2>反馈正在进入产品闭环</h2></div><button class="text-button" data-view="feedback" type="button">反馈工作台 →</button></header><div class="signal-row"><span class="signal-avatar">${item.user.slice(0,1)}</span><div class="signal-copy"><div><strong>${item.title}</strong>${priority(item)}${productBadge(item.productId)}</div><p>来自 Feedback SDK · ${item.version} · ${item.attachments.length} 个附件</p></div><span class="status-chip pending">${feedbackMeta[item.state]}</span><button class="secondary-button" data-feedback-id="${item.id}" type="button">处理</button></div>`;
  bindDynamicNavigation(panel);
  $('[data-feedback-id]', panel).addEventListener('click', () => { state.selectedFeedbackId = item.id; navigate('feedback'); });
}

function taskMatchesFilter(task) {
  if (!isInScope(task)) return false;
  if (state.workFilter === 'mine') return task.assignee === 'Glare';
  if (state.workFilter === 'review') return task.state === 'pending_review';
  if (state.workFilter === 'done') return ['completed','accepted'].includes(task.state);
  return !['completed','accepted','cancelled'].includes(task.state);
}

function renderWork() {
  const tasks = state.tasks.filter(taskMatchesFilter);
  $('#workTable').innerHTML = tasks.length ? tasks.map(task => `<button class="work-row ${state.selectedTaskId === task.id ? 'selected' : ''}" data-task-id="${task.id}" type="button"><span class="work-title"><i class="status-square ${task.state === 'in_progress' ? 'in-progress' : ''}">${task.state === 'in_progress' ? '▶' : ''}</i><span><strong>${task.title}</strong><small>#${task.id}${task.parentId ? ` · 子待办 of #${task.parentId}` : ''} · ${task.source}</small></span></span>${taskState(task)}<span class="assignee"><i class="tiny-avatar">${task.assignee.slice(0,1)}</i>${task.assignee}</span>${priority(task)}${productBadge(task.productId)}<span class="row-arrow">›</span></button>`).join('') : '<div class="detail-empty"><div><span>☷</span><p>当前工作集与筛选下没有待办</p></div></div>';
  $$('.work-row').forEach(button => button.addEventListener('click', () => { state.selectedTaskId = Number(button.dataset.taskId); renderWork(); }));
  renderTaskDetail();
  $('#workBadge').textContent = scopedTasks().filter(task => !['completed','accepted','cancelled'].includes(task.state)).length;
}

function renderTaskDetail() {
  const pane = $('#taskDetailPane');
  const task = state.tasks.find(item => item.id === state.selectedTaskId);
  if (!task || !taskMatchesFilter(task)) { pane.innerHTML = '<div class="detail-empty"><div><span>☷</span><p>选择一个待办查看详情</p></div></div>'; return; }
  const product = productById(task.productId);
  const canAutomate = task.state === 'pending' && task.assignee === 'Glare';
  pane.innerHTML = `<div class="detail-header"><div class="detail-header-top"><span>WORK #${task.id} · ${product.name}</span><button class="close-detail" type="button">×</button></div><h2>${task.title}</h2><p>${task.description}</p></div><div class="detail-section"><span>PROPERTIES</span><div class="detail-properties"><div class="property"><span>产品</span><strong>${productBadge(task.productId)}</strong></div><div class="property"><span>状态</span><strong>${taskState(task)}</strong></div><div class="property"><span>执行人</span><strong>${task.assignee}</strong></div><div class="property"><span>优先级</span><strong>${priority(task)}</strong></div><div class="property"><span>来源</span><strong>${task.source}${task.feedbackId ? ` · Feedback #${task.feedbackId.split('-')[1]}` : ''}</strong></div><div class="property"><span>本地项目</span><strong>${product.repo}</strong></div></div></div><div class="detail-section"><span>TEAM & ACTIVITY</span><div class="activity-note"><i></i><div><strong>${task.state === 'in_progress' ? 'ArcOrbit 已在该产品的持续 thread 中执行' : task.state === 'pending_review' ? '等待有产品责任的人完成判断' : `${task.assignee} 负责此事项`}</strong><small>${task.caseId || task.created} · ${product.members.length} 位产品成员</small></div></div></div><div class="detail-actions">${task.state === 'in_progress' ? '<button class="primary-button" data-task-action="open-run" type="button">查看持续执行现场</button>' : ''}${canAutomate ? '<button class="primary-button" data-task-action="automate" type="button">进入 ArcOrbit 自动队列</button>' : ''}${task.state === 'pending_review' ? '<button class="primary-button" data-task-action="approve" type="button">完成判断，转为待处理</button>' : ''}${task.feedbackId ? '<button class="secondary-button" data-task-action="source-feedback" type="button">查看来源反馈</button>' : ''}<button class="secondary-button" data-task-action="edit" type="button">编辑待办</button></div>`;
  $('.close-detail', pane).addEventListener('click', () => { state.selectedTaskId = null; renderWork(); });
  $$('[data-task-action]', pane).forEach(button => button.addEventListener('click', () => handleTaskAction(button.dataset.taskAction, task)));
}

function handleTaskAction(action, task) {
  if (action === 'open-run') navigate('automation');
  if (action === 'automate') { showToast(`${productById(task.productId).name} · Work #${task.id} 已进入跨产品自动队列`); navigate('automation'); }
  if (action === 'approve') { task.state = 'pending'; renderScope(); showToast('产品判断已记录，待办现在可被自动领取'); }
  if (action === 'source-feedback') { state.selectedFeedbackId = task.feedbackId; navigate('feedback'); }
  if (action === 'edit') openEditTaskModal(task);
}

function renderAutomationQueue() {
  const tasks = scopedTasks().filter(task => task.state === 'pending' && task.assignee === 'Glare');
  $('#automationQueueCount').textContent = tasks.length;
  $('#automationQueue').innerHTML = tasks.map((task,index) => `<button class="queue-item" data-task-id="${task.id}" type="button"><span class="status-square"></span><span><strong>${task.title}</strong><small>${productById(task.productId).name} · #${task.id} · ${task.priority} · ${productById(task.productId).repo}</small></span><b>${index + 1}</b></button>`).join('') || '<div class="detail-empty"><div><p>当前工作集队列为空</p></div></div>';
  $$('.queue-item').forEach(button => button.addEventListener('click', () => openTask(Number(button.dataset.taskId))));
  const prismVisible = productById('prism').workset;
  const runHeader = $('.run-header .section-kicker');
  if (runHeader) runHeader.textContent = prismVisible ? 'ACTIVE RUN · LOOP 3 · 折光' : 'PINNED ACTIVE RUN · 工作集之外 · 折光';
  $('.run-panel')?.classList.toggle('outside-workset', !prismVisible);
}

function renderFeedback() {
  const query = ($('#feedbackSearch')?.value || '').trim().toLowerCase();
  const items = scopedFeedback().filter(item => (state.feedbackFilter === 'all' || item.state === state.feedbackFilter) && (!query || `${item.title} ${item.body} ${item.shortId} ${productById(item.productId).name}`.toLowerCase().includes(query)));
  $('#feedbackList').innerHTML = items.map(item => `<button class="feedback-item ${item.id === state.selectedFeedbackId ? 'selected' : ''}" data-feedback-id="${item.id}" type="button"><i class="unread-dot ${item.unread ? '' : 'read'}"></i><span class="feedback-copy"><header><span>#${item.shortId}</span>${productBadge(item.productId)}${priority(item)}<time>${item.time}</time></header><strong>${item.title}</strong><p>${item.body}</p></span><span class="feedback-state ${item.state}">${feedbackMeta[item.state]}</span></button>`).join('') || '<div class="detail-empty"><div><span>◇</span><p>当前工作集与筛选下没有反馈</p></div></div>';
  $$('.feedback-item').forEach(button => button.addEventListener('click', () => { state.selectedFeedbackId = button.dataset.feedbackId; const item = state.feedback.find(feedback => feedback.id === state.selectedFeedbackId); if (item) item.unread = false; renderFeedback(); }));
  renderFeedbackDetail();
  $('#feedbackBadge').textContent = scopedFeedback().filter(item => item.state !== 'ignored').length;
}

function renderFeedbackDetail() {
  const item = state.feedback.find(feedback => feedback.id === state.selectedFeedbackId && isInScope(feedback));
  const pane = $('#feedbackDetail');
  if (!item) { pane.innerHTML = '<div class="detail-empty"><div><span>◇</span><p>选择一条反馈查看详情</p></div></div>'; return; }
  const product = productById(item.productId);
  const linkedTask = item.taskId ? state.tasks.find(task => task.id === item.taskId) : null;
  const actions = item.state === 'pending' ? '<button class="primary-button" data-feedback-action="accept" type="button">受理</button><button class="secondary-button" data-feedback-action="ignore" type="button">忽略</button>' : item.state === 'accepted' ? '<button class="primary-button" data-feedback-action="convert" type="button">流转待办</button><button class="secondary-button" data-feedback-action="ignore" type="button">忽略</button>' : item.state === 'converted' ? '<button class="primary-button" data-feedback-action="open-task" type="button">查看关联待办</button>' : '<button class="secondary-button" data-feedback-action="restore" type="button">恢复到待判断</button>';
  pane.innerHTML = `<div class="feedback-detail-header"><div>${productBadge(item.productId)}<span>#${item.shortId}</span>${priority(item)}<span class="feedback-state ${item.state}">${feedbackMeta[item.state]}</span></div><h2>${item.title}</h2><p>${item.user} · ${item.version} · ${item.time}</p><div class="feedback-actions">${actions}</div></div><div class="feedback-content"><div class="conversation-entry"><span class="signal-avatar">${item.user.slice(0,1)}</span><div><header><strong>${item.user}</strong><time>${item.time}</time></header><p>${item.body}</p>${item.attachments.length ? `<div class="attachment-row">${item.attachments.map(file => `<span class="attachment">▧ ${file}</span>`).join('')}</div>` : ''}</div></div>${['accepted','converted'].includes(item.state) ? '<div class="conversation-entry"><span class="agent-avatar">G</span><div><header><strong>产品处理记录</strong><time>刚刚</time></header><p>反馈已人工确认具有产品价值。优先级和是否流转待办由人决定。</p></div></div>' : ''}</div><div class="feedback-properties"><div><small>产品</small><strong>${product.name}</strong></div><div><small>产品团队</small><strong>${product.members.length} 位成员</strong></div><div><small>用户标识</small><strong>${item.userId}</strong></div><div><small>AI 分析</small><strong>未配置</strong></div></div>${linkedTask ? `<button class="linked-work" data-feedback-action="open-task" type="button"><span>LINKED WORK · ${stateMeta[linkedTask.state][0]}</span><strong>#${linkedTask.id} ${linkedTask.title}</strong><small>任务状态同步回 ${product.name} 的反馈，但不等同于反馈受理状态。</small></button>` : ''}`;
  $$('[data-feedback-action]', pane).forEach(button => button.addEventListener('click', () => handleFeedbackAction(button.dataset.feedbackAction, item)));
}

function handleFeedbackAction(action,item) {
  if (action === 'accept') { item.state = 'accepted'; renderFeedback(); showToast('反馈已受理，可以继续流转为待办'); }
  if (action === 'ignore') { item.state = 'ignored'; renderFeedback(); showToast('反馈已忽略'); }
  if (action === 'restore') { item.state = 'pending'; renderFeedback(); showToast('反馈已恢复到待判断'); }
  if (action === 'convert') openConvertFeedbackModal(item);
  if (action === 'open-task' && item.taskId) openTask(item.taskId);
}

function renderProducts() {
  $('#productCatalog').innerHTML = state.products.map(product => `<button class="product-catalog-card ${product.id === state.selectedProductId ? 'selected' : ''}" data-product-id="${product.id}" type="button"><span class="catalog-avatar product-${product.id}">${product.avatar}</span><span><strong>${product.name}</strong><small>${product.description}</small></span><em class="workset-flag ${product.workset ? 'on' : ''}">${product.workset ? '工作集中' : '未显示'}</em><span class="catalog-meta"><b>${product.members.length}</b> 成员 · <b>${state.tasks.filter(task => task.productId === product.id && !['completed','accepted'].includes(task.state)).length}</b> 未完成 Work</span></button>`).join('');
  $$('.product-catalog-card').forEach(button => button.addEventListener('click', () => { state.selectedProductId = button.dataset.productId; renderProducts(); }));
  renderProductDetail();
}

function renderProductDetail() {
  const product = productById(state.selectedProductId) || state.products[0];
  const members = product.members.map(id => state.members.find(member => member.id === id)).filter(Boolean);
  $('#productDetail').innerHTML = `<div class="portfolio-detail-header"><div class="product-identity"><span class="large-product-avatar product-${product.id}">${product.avatar}</span><div><span class="section-kicker">${product.platform} · ${product.role}</span><h2>${product.name} · ${product.description}</h2><p>${product.goal}</p></div></div><button class="secondary-button" data-product-action="toggle-scope" type="button">${product.workset ? '从工作集隐藏' : '加入工作集'}</button></div><div class="product-axis"><div class="axis-item"><small>Workshop 产品项目</small><strong>${product.remote}</strong><p>${members.length} 位成员 · 角色和邀请可管理</p></div><div class="axis-arrow">⇄</div><div class="axis-item accent"><small>本地项目 · 工作锚点</small><strong>${product.repo}</strong><p>${product.path} · ${product.branch}</p></div></div><div class="product-detail-section"><header><span>产品成员</span><button data-product-action="manage-members" type="button">管理成员</button></header><div class="product-member-list">${members.map(member => `<button data-member-id="${member.id}" type="button"><i class="tiny-avatar">${member.name.slice(0,1)}</i><span><strong>${member.name}</strong><small>${member.duty}</small></span><em>${member.id === 'glare' ? product.role : 'Member'}</em></button>`).join('')}</div></div><div class="product-detail-section"><header><span>本地执行边界</span><button data-product-action="change-binding" type="button">更换绑定</button></header><dl class="product-facts"><div><dt>Project State</dt><dd>fresh</dd></div><div><dt>Active Case</dt><dd>${product.cases || '—'}</dd></div><div><dt>Known gaps</dt><dd>${product.gaps}</dd></div><div><dt>自动参与</dt><dd><span class="toggle-on">ON</span></dd></div></dl></div>`;
  $$('[data-product-action]', $('#productDetail')).forEach(button => button.addEventListener('click', () => handleProductAction(button.dataset.productAction, product)));
  $$('[data-member-id]', $('#productDetail')).forEach(button => button.addEventListener('click', () => openMemberModal(state.members.find(member => member.id === button.dataset.memberId))));
}

function handleProductAction(action,product) {
  if (action === 'toggle-scope') {
    if (product.workset && scopedProducts().length === 1) return showToast('工作集至少保留一个产品');
    product.workset = !product.workset; renderScope(); showToast(product.workset ? `${product.name} 已加入当前工作集` : `${product.name} 已从当前工作集隐藏`);
  }
  if (action === 'manage-members') { navigate('team'); setTimeout(() => showToast(`正在查看 ${product.name} 的产品成员`), 50); }
  if (action === 'change-binding') showToast(`原型：为 ${product.name} 选择新的本地目录`);
}

function renderTeam() {
  $('#organizationMembers').innerHTML = state.members.map(member => {
    const products = state.products.filter(product => product.members.includes(member.id));
    return `<button class="member-row" data-member-id="${member.id}" type="button"><span class="member-identity"><i class="member-avatar">${member.name.slice(0,1)}</i><span><strong>${member.name}${member.external ? '<em>外部</em>' : ''}</strong><small>${member.email} · ${member.duty}</small></span></span><span class="role-chip role-${member.role}">${roleMeta[member.role]}</span><span class="member-products">${products.map(product => `<i class="product-${product.id}">${product.avatar}</i>`).join('')}<small>${products.length} 个</small></span><span class="load-bar"><i style="width:${Math.min(member.load * 18,90)}%"></i><small>${member.load} 项</small></span><span class="row-arrow">›</span></button>`;
  }).join('');
  $$('.member-row').forEach(button => button.addEventListener('click', () => openMemberModal(state.members.find(member => member.id === button.dataset.memberId))));
  $('#teamProductList').innerHTML = state.products.map(product => `<button class="team-product-row" data-product-id="${product.id}" type="button"><span class="product-mini-avatar product-${product.id}">${product.avatar}</span><span><strong>${product.name}</strong><small>${product.members.length} 位成员 · 你是 ${product.role}</small></span><span class="member-avatar-cluster">${product.members.slice(0,3).map(id => `<i>${state.members.find(member => member.id === id)?.name.slice(0,1)}</i>`).join('')}</span><b>›</b></button>`).join('');
  $$('.team-product-row').forEach(button => button.addEventListener('click', () => { state.selectedProductId = button.dataset.productId; navigate('product'); }));
  $('#teamBadge').textContent = state.members.length;
}

function openTask(id) {
  const task = state.tasks.find(item => item.id === id); if (!task) return;
  if (!productById(task.productId).workset) productById(task.productId).workset = true;
  state.selectedTaskId = id; state.workFilter = ['completed','accepted'].includes(task.state) ? 'done' : 'open';
  $$('#workFilters button').forEach(button => button.classList.toggle('active', button.dataset.filter === state.workFilter));
  renderScope(); navigate('work');
}

function openModal(content) { modal.innerHTML = content; overlay.classList.remove('hidden'); const close = () => overlay.classList.add('hidden'); $$('[data-modal-close]',modal).forEach(button => button.addEventListener('click',close)); return close; }

function openWorksetModal() {
  const close = openModal(`<header class="modal-header"><div><h2>配置当前工作集</h2><p>工作集决定 Today、Work、Automation 与 Feedback 同时聚合哪些产品，不会改变产品成员和服务端数据。</p></div><button class="modal-close" data-modal-close type="button">×</button></header><form id="worksetForm"><div class="modal-body"><div class="workset-options">${state.products.map(product => `<label><input name="products" value="${product.id}" type="checkbox" ${product.workset ? 'checked' : ''}><span class="catalog-avatar product-${product.id}">${product.avatar}</span><span><strong>${product.name}</strong><small>${product.repo} · ${product.description}</small></span><em>${state.tasks.filter(task => task.productId === product.id && !['completed','accepted'].includes(task.state)).length} Work</em></label>`).join('')}</div><p class="form-note">可以只看一个产品，也可以建立跨产品工作集。切换的是视图范围，不是退出或重新进入产品；正在运行的任务即使不在工作集内也会作为安全状态固定显示。</p></div><footer class="modal-footer"><button class="secondary-button" data-modal-close type="button">取消</button><button class="primary-button" type="submit">应用工作集</button></footer></form>`);
  $('#worksetForm').addEventListener('submit',event => { event.preventDefault(); const selected = new FormData(event.currentTarget).getAll('products'); if (!selected.length) return showToast('请至少选择一个产品'); state.products.forEach(product => { product.workset = selected.includes(product.id); }); close(); renderScope(); showToast(`当前工作集已更新：${scopedProducts().map(product => product.name).join('、')}`); });
}

function openNewTaskModal(prefill = {}) {
  const selectedProduct = prefill.productId || scopedProducts()[0].id;
  const close = openModal(`<header class="modal-header"><div><h2>新建协作待办</h2><p>先选择产品，再使用对应成员、标签和本地执行边界。</p></div><button class="modal-close" data-modal-close type="button">×</button></header><form id="taskForm"><div class="modal-body"><label class="field"><span>所属产品</span><select name="productId">${scopedProducts().map(product => `<option value="${product.id}" ${product.id === selectedProduct ? 'selected' : ''}>${product.name} · ${product.repo}</option>`).join('')}</select></label><label class="field"><span>待办内容</span><textarea name="title" required placeholder="描述一个可以被完成和验证的事项">${prefill.title || ''}</textarea></label><div class="field-grid"><label class="field"><span>执行人</span><select name="assignee"><option>Glare</option><option>Mina</option><option>陈一</option><option>周屿</option><option>未分配</option></select></label><label class="field"><span>优先级</span><select name="priority"><option ${prefill.priority === 'P1' ? 'selected' : ''}>P1</option><option ${!prefill.priority || prefill.priority === 'P2' ? 'selected' : ''}>P2</option><option>P3</option></select></label></div><label class="field"><span>标签</span><input name="tags" value="${prefill.tags || ''}" placeholder="feedback, playback"></label><label class="modal-choice"><input name="automation" type="checkbox"><span><strong>创建后进入 ArcOrbit 自动候选队列</strong><small>仍需对应产品已绑定本地项目、参与授权、当前用户为执行人且自动领取开启。</small></span></label></div><footer class="modal-footer"><button class="secondary-button" data-modal-close type="button">取消</button><button class="primary-button" type="submit">创建待办</button></footer></form>`);
  $('#taskForm').addEventListener('submit',event => { event.preventDefault(); const data = new FormData(event.currentTarget); const task = { id: state.nextTaskId++, productId: String(data.get('productId')), title: String(data.get('title')).trim().split('\n')[0], description: String(data.get('title')).trim(), state: 'pending', assignee: String(data.get('assignee')), priority: String(data.get('priority')), source: prefill.source || '手动创建', tags: String(data.get('tags') || '').split(',').map(value => value.trim()).filter(Boolean), created: '刚刚' }; state.tasks.unshift(task); close(); renderScope(); showToast(`${productById(task.productId).name} · Work #${task.id} 已创建`); openTask(task.id); });
}

function openEditTaskModal(task) {
  const close = openModal(`<header class="modal-header"><div><h2>编辑 ${productById(task.productId).name} · Work #${task.id}</h2><p>修改会同步到对应 Workshop 产品项目。</p></div><button class="modal-close" data-modal-close type="button">×</button></header><form id="editTaskForm"><div class="modal-body"><label class="field"><span>待办内容</span><textarea name="title" required>${task.title}</textarea></label><div class="field-grid"><label class="field"><span>执行人</span><select name="assignee"><option ${task.assignee === 'Glare' ? 'selected' : ''}>Glare</option><option ${task.assignee === 'Mina' ? 'selected' : ''}>Mina</option><option ${task.assignee === '陈一' ? 'selected' : ''}>陈一</option><option ${task.assignee === '周屿' ? 'selected' : ''}>周屿</option></select></label><label class="field"><span>优先级</span><select name="priority"><option ${task.priority === 'P1' ? 'selected' : ''}>P1</option><option ${task.priority === 'P2' ? 'selected' : ''}>P2</option><option ${task.priority === 'P3' ? 'selected' : ''}>P3</option></select></label></div></div><footer class="modal-footer"><button class="secondary-button" data-modal-close type="button">取消</button><button class="primary-button" type="submit">保存</button></footer></form>`);
  $('#editTaskForm').addEventListener('submit',event => { event.preventDefault(); const data = new FormData(event.currentTarget); task.title = String(data.get('title')).trim(); task.assignee = String(data.get('assignee')); task.priority = String(data.get('priority')); close(); renderScope(); showToast('待办已更新'); });
}

function openConvertFeedbackModal(item) {
  const product = productById(item.productId);
  const memberOptions = product.members.map(id => state.members.find(member => member.id === id)).filter(Boolean).map(member => `<option>${member.name}</option>`).join('');
  const close = openModal(`<header class="modal-header"><div><h2>${product.name} · 将反馈流转为待办</h2><p>保留 Feedback #${item.shortId} 的产品和来源关系。</p></div><button class="modal-close" data-modal-close type="button">×</button></header><form id="convertForm"><div class="modal-body"><label class="field"><span>待办内容</span><textarea name="title" required>[反馈] ${item.title}</textarea></label><div class="field-grid"><label class="field"><span>产品成员</span><select name="assignee">${memberOptions}</select></label><label class="field"><span>优先级</span><select name="priority"><option ${item.priority === 'P1' ? 'selected' : ''}>P1</option><option ${item.priority === 'P2' ? 'selected' : ''}>P2</option><option ${item.priority === 'P3' ? 'selected' : ''}>P3</option></select></label></div><label class="field"><span>标签</span><input name="tags" value="feedback"></label><div class="modal-warning">流转由人确认。反馈受理状态和任务执行状态保持为两个字段。</div></div><footer class="modal-footer"><button class="secondary-button" data-modal-close type="button">取消</button><button class="primary-button" type="submit">创建并关联待办</button></footer></form>`);
  $('#convertForm').addEventListener('submit',event => { event.preventDefault(); const data = new FormData(event.currentTarget); const task = { id: state.nextTaskId++, productId: item.productId, title: String(data.get('title')).trim(), description: item.body, state: 'pending', assignee: String(data.get('assignee')), priority: String(data.get('priority')), source: '用户反馈', feedbackId: item.id, tags: String(data.get('tags')).split(',').map(value => value.trim()).filter(Boolean), created: '刚刚' }; state.tasks.unshift(task); item.state = 'converted'; item.taskId = task.id; item.taskState = task.state; close(); renderScope(); showToast(`${product.name} · Feedback #${item.shortId} 已流转为 Work #${task.id}`); });
}

function openInviteModal(product = null) {
  const close = openModal(`<header class="modal-header"><div><h2>${product ? `邀请加入「${product.name}」` : '邀请组织成员'}</h2><p>${product ? '可邀请组织成员或外部协作者加入产品。' : '生成带角色、有效期和使用次数限制的邀请。'}</p></div><button class="modal-close" data-modal-close type="button">×</button></header><form id="inviteForm"><div class="modal-body"><div class="field-grid"><label class="field"><span>角色</span><select name="role"><option value="member">成员</option><option value="admin">管理员</option></select></label><label class="field"><span>有效期</span><select name="expires"><option>7 天</option><option>30 天</option><option>永不过期</option></select></label></div><label class="field"><span>最大使用次数</span><input name="uses" type="number" min="1" value="1"></label>${product ? '<label class="field"><span>产品职责（可选）</span><input name="duty" placeholder="例如：iOS 开发、用户研究"></label>' : ''}<p class="form-note">对应待办平台现有的组织/项目邀请模型：owner、admin、member，邀请码可设置过期时间和最大使用次数。</p></div><footer class="modal-footer"><button class="secondary-button" data-modal-close type="button">取消</button><button class="primary-button" type="submit">生成邀请</button></footer></form>`);
  $('#inviteForm').addEventListener('submit',event => { event.preventDefault(); close(); openSimpleModal('邀请已生成', `<div class="invite-result"><span>邀请码</span><strong>ARC-${Math.random().toString(36).slice(2,8).toUpperCase()}</strong><small>${product ? product.name : '飞天工作室'} · ${new FormData(event.currentTarget).get('role')} · ${new FormData(event.currentTarget).get('expires')}</small></div>`); });
}

function openMemberModal(member) {
  const products = state.products.filter(product => product.members.includes(member.id));
  openModal(`<header class="modal-header"><div><h2>${member.name}</h2><p>${member.email} · ${member.duty}</p></div><button class="modal-close" data-modal-close type="button">×</button></header><div class="modal-body"><div class="member-profile"><span class="member-avatar large">${member.name.slice(0,1)}</span><div><strong>${roleMeta[member.role]}${member.external ? ' · 外部协作者' : ''}</strong><small>当前负责 ${member.load} 项工作</small></div></div><div class="member-product-access"><span>产品参与</span>${state.products.map(product => `<label><input type="checkbox" data-member-product="${product.id}" ${product.members.includes(member.id) ? 'checked' : ''} ${member.role === 'owner' ? 'disabled' : ''}><i class="product-${product.id}">${product.avatar}</i><span><strong>${product.name}</strong><small>${product.members.includes(member.id) ? member.duty : '未加入'}</small></span></label>`).join('')}</div></div><footer class="modal-footer"><button class="secondary-button" data-modal-close type="button">关闭</button><button class="primary-button" id="saveMemberAccess" type="button">保存产品权限</button></footer>`);
  $('#saveMemberAccess').addEventListener('click',() => { $$('[data-member-product]',modal).forEach(input => { const product = productById(input.dataset.memberProduct); const has = product.members.includes(member.id); if (input.checked && !has) product.members.push(member.id); if (!input.checked && has) product.members = product.members.filter(id => id !== member.id); }); overlay.classList.add('hidden'); renderProducts(); renderTeam(); showToast(`${member.name} 的产品成员关系已更新`); });
}

function openCreateProductModal() {
  const close = openModal(`<header class="modal-header"><div><h2>创建产品项目</h2><p>创建 Workshop 项目，并准备本地项目绑定。</p></div><button class="modal-close" data-modal-close type="button">×</button></header><form id="productForm"><div class="modal-body"><label class="field"><span>产品名称</span><input name="name" required placeholder="例如：回声"></label><label class="field"><span>所属组织</span><select><option>飞天工作室</option><option>个人项目</option></select></label><label class="field"><span>产品描述</span><textarea name="description" placeholder="一句话说明产品服务谁、解决什么问题"></textarea></label><label class="field"><span>本地目录（可稍后绑定）</span><input name="repo" placeholder="~/Projects/echo"></label><p class="form-note">创建者自动成为产品 owner；随后可从组织成员池添加成员或生成项目邀请码。</p></div><footer class="modal-footer"><button class="secondary-button" data-modal-close type="button">取消</button><button class="primary-button" type="submit">创建产品</button></footer></form>`);
  $('#productForm').addEventListener('submit',event => { event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get('name')).trim(); const id = `product-${Date.now()}`; state.products.push({ id, name, avatar: name.slice(0,1), platform: 'Unbound', description: String(data.get('description') || '新产品'), goal: '尚待定义产品目标', repo: String(data.get('repo') || '尚未绑定').split('/').pop(), path: String(data.get('repo') || '尚未绑定'), branch: '—', remote: `${name} · new`, state: 'ready', stateLabel: '待配置', workset: true, role: 'Owner', members: ['glare'], cases: 0, gaps: 0 }); state.selectedProductId = id; close(); renderScope(); navigate('product'); showToast(`${name} 已创建并加入当前工作集`); });
}

function openInterventionModal(kind = 'run') {
  const acceptance = kind === 'acceptance';
  const close = openModal(`<header class="modal-header"><div><h2>${acceptance ? '处理验收反馈' : '人工介入当前 Run'}</h2><p>${acceptance ? '验收反馈会成为独立后续执行，不修改旧 Run。' : '消息会进入折光 Work #248 的同一个持久 thread。'}</p></div><button class="modal-close" data-modal-close type="button">×</button></header><form id="interventionForm"><div class="modal-body">${acceptance ? '<div class="modal-warning">用户反馈：“横屏后底部控制条仍被 Home Indicator 裁切。”</div>' : ''}<label class="field"><span>补充事实、授权或决策</span><textarea name="message" required placeholder="只提供需要由人承担的产品判断或授权。"></textarea></label></div><footer class="modal-footer"><button class="secondary-button" data-modal-close type="button">取消</button><button class="primary-button" type="submit">提交并继续</button></footer></form>`);
  $('#interventionForm').addEventListener('submit',event => { event.preventDefault(); const message = String(new FormData(event.currentTarget).get('message')).trim(); close(); if (acceptance) return showToast('验收反馈已进入独立后续队列'); $('#transcript').insertAdjacentHTML('beforeend', `<div class="transcript-item human"><span class="agent-avatar">G</span><div><header><strong>Glare · 人工介入</strong><time>刚刚</time></header><p>${escapeHtml(message)}</p></div></div>`); $('#transcript').scrollTop = $('#transcript').scrollHeight; showToast('已提交到当前持续 thread'); });
}

function openSimpleModal(title,body) { openModal(`<header class="modal-header"><div><h2>${title}</h2></div><button class="modal-close" data-modal-close type="button">×</button></header><div class="modal-body">${body}</div><footer class="modal-footer"><button class="primary-button" data-modal-close type="button">知道了</button></footer>`); }
function pauseNewClaims() { state.autoClaim = false; $('#autoClaimToggle').checked = false; showToast('已暂停领取新任务，当前 Run 不受影响'); }
function bindDynamicNavigation(root) { $$('[data-view]',root).forEach(button => button.addEventListener('click',() => navigate(button.dataset.view))); }

function openCommandPalette() { $('#commandPalette').classList.remove('hidden'); $('#commandInput').value = ''; renderCommandResults(''); setTimeout(() => $('#commandInput').focus(),20); }
function renderCommandResults(query) {
  const q = query.trim().toLowerCase();
  const results = [...Object.entries(viewNames).map(([view,label]) => ({ kind:'view',id:view,title:label,sub:'平台页面',icon:'↗' })), ...state.products.map(product => ({ kind:'product',id:product.id,title:product.name,sub:`产品 · ${product.repo}`,icon:product.avatar })), ...state.tasks.map(task => ({ kind:'task',id:task.id,title:task.title,sub:`${productById(task.productId).name} · Work #${task.id}`,icon:'☷' })), ...state.feedback.map(item => ({ kind:'feedback',id:item.id,title:item.title,sub:`${productById(item.productId).name} · Feedback #${item.shortId}`,icon:'◇' }))].filter(item => !q || `${item.title} ${item.sub}`.toLowerCase().includes(q)).slice(0,12);
  $('#commandResults').innerHTML = results.map(item => `<button class="command-result" data-kind="${item.kind}" data-id="${item.id}" type="button"><span>${item.icon}</span><span><strong>${item.title}</strong><small>${item.sub}</small></span><em>打开 ↵</em></button>`).join('') || '<div class="detail-empty"><div><p>没有匹配结果</p></div></div>';
  $$('.command-result').forEach(button => button.addEventListener('click',() => { $('#commandPalette').classList.add('hidden'); if (button.dataset.kind === 'view') navigate(button.dataset.id); if (button.dataset.kind === 'product') { state.selectedProductId = button.dataset.id; navigate('product'); } if (button.dataset.kind === 'task') openTask(Number(button.dataset.id)); if (button.dataset.kind === 'feedback') { const item = state.feedback.find(feedback => feedback.id === button.dataset.id); productById(item.productId).workset = true; state.selectedFeedbackId = item.id; renderScope(); navigate('feedback'); } }));
}

function bindEvents() {
  $$('[data-view]').forEach(button => button.addEventListener('click',() => { navigate(button.dataset.view); if (button.dataset.automationTab) $(`[data-run-tab="${button.dataset.automationTab}"]`)?.click(); }));
  $$('[data-action="new-task"]').forEach(button => button.addEventListener('click',() => openNewTaskModal()));
  $$('[data-action="open-feedback"]').forEach(button => button.addEventListener('click',() => { state.selectedFeedbackId = button.dataset.feedbackId; navigate('feedback'); }));
  $$('[data-action="pause-run"]').forEach(button => button.addEventListener('click',pauseNewClaims));
  $$('#workFilters button').forEach(button => button.addEventListener('click',() => { state.workFilter = button.dataset.filter; $$('#workFilters button').forEach(item => item.classList.toggle('active',item === button)); renderWork(); }));
  $$('#feedbackFilters button').forEach(button => button.addEventListener('click',() => { state.feedbackFilter = button.dataset.feedbackFilter; $$('#feedbackFilters button').forEach(item => item.classList.toggle('active',item === button)); renderFeedback(); }));
  $('#feedbackSearch').addEventListener('input',renderFeedback);
  $$('#runTabs button').forEach(button => button.addEventListener('click',() => { $$('#runTabs button').forEach(item => item.classList.toggle('active',item === button)); $$('.run-tab').forEach(panel => panel.classList.toggle('active',panel.dataset.runPanel === button.dataset.runTab)); }));
  $('#openInterventionButton').addEventListener('click',() => openInterventionModal()); $('#acceptanceItem').addEventListener('click',() => openInterventionModal('acceptance'));
  $('#pauseRunButton').addEventListener('click',() => { state.runPaused = !state.runPaused; $('#pauseRunButton').textContent = state.runPaused ? '继续' : '暂停'; $('#runStateLabel').textContent = state.runPaused ? '已暂停' : '执行中'; showToast(state.runPaused ? '当前 Run 已暂停' : '当前 Run 已继续'); });
  $('#autoClaimToggle').addEventListener('change',event => { state.autoClaim = event.target.checked; showToast(state.autoClaim ? '已允许领取当前工作集中的 eligible 待办' : '已暂停领取新待办；当前 Run 继续'); });
  $('#searchButton').addEventListener('click',openCommandPalette); $('#commandInput').addEventListener('input',event => renderCommandResults(event.target.value)); $('#commandPalette').addEventListener('click',event => { if (event.target === $('#commandPalette')) $('#commandPalette').classList.add('hidden'); }); overlay.addEventListener('click',event => { if (event.target === overlay) overlay.classList.add('hidden'); });
  $('#resetButton').addEventListener('click',() => location.reload()); $('#settingsButton').addEventListener('click',() => openSimpleModal('ArcOrbit 设置','<p class="form-note">一次 Workshop 登录同步组织、产品项目、成员、待办与反馈；每个产品分别绑定本地工作区。</p>')); $('#accountButton').addEventListener('click',() => $('#settingsButton').click());
  $('#productSwitcher').addEventListener('click',openWorksetModal); $('#configureWorksetButton').addEventListener('click',openWorksetModal); $('#createProductButton').addEventListener('click',openCreateProductModal); $('#inviteMemberButton').addEventListener('click',() => openInviteModal());
  $('#editOrganizationButton').addEventListener('click',() => openSimpleModal('组织设置','<label class="field"><span>组织名称</span><input value="飞天工作室"></label><label class="field"><span>组织描述</span><textarea>面向 AI 原生产品开发的小型多产品团队。</textarea></label>'));
  $('#memberFilterButton').addEventListener('click',() => showToast('原型：按 owner / admin / member / 外部成员筛选')); $('#memberSearchButton').addEventListener('click',() => { navigate('team'); openCommandPalette(); $('#commandInput').value = '成员'; });
  $('#refreshFeedbackButton').addEventListener('click',() => showToast('当前工作集的反馈与沟通记录已刷新'));
  document.addEventListener('keydown',event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommandPalette(); } if (event.key === 'Escape') { overlay.classList.add('hidden'); $('#commandPalette').classList.add('hidden'); } });
}

renderScope();
bindEvents();
const requestedView = new URLSearchParams(window.location.search).get('view');
if (requestedView && viewNames[requestedView]) navigate(requestedView);
