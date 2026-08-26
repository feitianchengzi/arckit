const concepts = {
  focus: {
    title: "A · 下一步聚焦型",
    note: "Today 只突出一个当前动作；模块内使用紧邻对象的行动条。认知负担最低，但完整依赖需要按需展开。"
  },
  journey: {
    title: "B · 准备路径型",
    note: "Today 完整展示准备路径；模块内保留步骤侧栏。关系最透明，但成熟用户可能感到引导过重。"
  },
  portfolio: {
    title: "C · 产品就绪型",
    note: "Today 以 Product Workspace 就绪度组织；模块内使用状态标记和按需动作。最适合多产品扩展，但首次主路径较隐性。"
  }
};

const steps = [
  { id: "project", label: "选择项目", detail: "ArcOrbit 已在默认产品集", action: "" },
  { id: "workspace", label: "绑定本地目录", detail: "确定 Agent 工作与 Chat 会话的本地边界", action: "选择本地目录" },
  { id: "authorization", label: "允许项目自动领取", detail: "明确 ArcOrbit 可以领取该项目的工作", action: "允许此项目" },
  { id: "task", label: "确认可执行待办", detail: "将当前用户的待评审任务确认进入待处理", action: "确认并交给 ArcOrbit" },
  { id: "automation", label: "开始自动执行", detail: "开启全局自动领取总闸", action: "开始自动执行" }
];

const state = {
  concept: "focus",
  module: "organization",
  completed: new Set(["project"])
};

const todayCanvas = document.querySelector("#todayCanvas");
const moduleCanvas = document.querySelector("#moduleCanvas");
const comparisonNote = document.querySelector("#comparisonNote");
const automationToggle = document.querySelector("#automationToggle");

function currentStep() {
  return steps.find((step) => !state.completed.has(step.id)) || null;
}

function stepStatus(step) {
  if (state.completed.has(step.id)) return "done";
  return currentStep()?.id === step.id ? "current" : "later";
}

function actionButton(step, className = "primary-button") {
  if (!step?.action) return "";
  return `<button class="${className}" type="button" data-complete="${step.id}">${step.action}</button>`;
}

function progressSegments() {
  return steps.map((step) => `<span class="${stepStatus(step)}" title="${step.label}"></span>`).join("");
}

function focusToday() {
  const next = currentStep();
  if (!next) return readyToday("准备完成", "ArcOrbit 已具备自动推进当前项目的全部条件。", "查看 Automation");
  return `
    <div class="page-intro"><div><span class="eyebrow">TODAY · NEXT BEST ACTION</span><h1>让 ArcOrbit 开始推进第一个项目</h1><p>系统已经根据当前事实找到唯一下一步。完成后会留在这里并继续显示新的阻断。</p></div><span class="state-pill">还差 ${steps.length - state.completed.size} 步</span></div>
    <div class="focus-layout">
      <section class="panel focus-card">
        <small>现在最值得完成</small><h2>${next.label}</h2><p>${next.detail}。这一操作完成前，系统不会把后续内部条件同时推给用户。</p>
        <div class="focus-context"><div><span>当前产品</span><strong>ArcOrbit</strong></div><div><span>当前影响</span><strong>${impactLabel(next.id)}</strong></div><div><span>完成后</span><strong>${nextOutcome(next.id)}</strong></div></div>
        <div class="focus-actions">${actionButton(next)}<button class="text-button" type="button">查看全部准备关系</button></div>
        <div class="compact-progress" aria-label="准备进度">${progressSegments()}</div>
      </section>
      <aside class="panel overview-panel"><h3>当前准备关系</h3>${steps.map((step) => `<div class="overview-row"><i>${state.completed.has(step.id) ? "✓" : stepStatus(step) === "current" ? "!" : "○"}</i><div><strong>${step.label}</strong><small>${step.detail}</small></div><b>${state.completed.has(step.id) ? "完成" : stepStatus(step) === "current" ? "当前" : "稍后"}</b></div>`).join("")}</aside>
    </div>
    ${dailySignals()}`;
}

function journeyToday() {
  const next = currentStep();
  if (!next) return readyToday("准备路径已完成", "全部步骤保持可见，用户仍能复查每一步的状态。", "查看完整准备记录");
  return `
    <div class="page-intro"><div><span class="eyebrow">TODAY · GET READY</span><h1>准备 ArcOrbit</h1><p>一次看见从项目到自动执行的完整路径，当前可操作步骤保持高强调，后续步骤提前建立预期。</p></div><span class="state-pill dark">${state.completed.size} / ${steps.length}</span></div>
    <div class="journey-layout">
      <section class="panel journey-list">${steps.map((step, index) => `<div class="journey-step ${stepStatus(step)}"><i>${state.completed.has(step.id) ? "✓" : index + 1}</i><div><strong>${step.label}</strong><small>${step.detail}</small></div>${stepStatus(step) === "current" ? actionButton(step, "secondary-button") : `<span class="state-pill">${state.completed.has(step.id) ? "已完成" : "等待前一步"}</span>`}</div>`).join("")}</section>
      <aside class="panel journey-summary"><h3>完成准备后</h3><p>ArcOrbit 将从当前用户的待处理任务中领取工作，在绑定目录内启动持续 Agent thread，并把需要你的决定集中到 Automation。</p><div class="preview-box"><span>第一个可执行任务</span><strong>完善 Today 的新人交互</strong><small>ArcOrbit · 执行人：Glare · 当前为待评审</small></div><div class="preview-box"><span>组织与成员</span><strong>不属于必经步骤</strong><small>只有选择团队协作时才进入 Organization。</small></div></aside>
    </div>`;
}

function portfolioToday() {
  const next = currentStep();
  if (!next) return readyToday("1 个产品已就绪", "产品卡保持长期可用，并继续展示运行、任务和人工事项。", "打开 ArcOrbit 产品");
  const readyCount = state.completed.size;
  return `
    <div class="page-intro"><div><span class="eyebrow">TODAY · PRODUCT READINESS</span><h1>今天推进哪些产品</h1><p>每个 Product Workspace 独立展示协作事实、本地执行边界和当前阻断，适合后续同时管理多个产品。</p></div><span class="state-pill">1 个产品 · 1 项需准备</span></div>
    <div class="portfolio-layout">
      <section class="panel product-card">
        <div class="product-card-head"><div class="product-identity"><i>A</i><div><strong>ArcOrbit</strong><small>个人项目 · 默认产品集</small></div></div><div class="readiness-score"><strong>${readyCount}/${steps.length}</strong><small>就绪条件</small></div></div>
        <div class="readiness-bar">${progressSegments()}</div>
        <div class="readiness-grid">${steps.slice(1).map((step) => `<div><span>${step.label}</span><strong>${state.completed.has(step.id) ? "已完成" : stepStatus(step) === "current" ? "需处理" : "未检查"}</strong></div>`).join("")}</div>
        <div class="product-next"><div><strong>首要阻断：${next.label}</strong><small>${next.detail}</small></div>${actionButton(next)}</div>
      </section>
      <aside class="panel portfolio-side"><h3>产品集信号</h3><div class="signal-row"><strong>待评审 · 1</strong><small>有一条分配给你的任务尚未进入 Automation 队列。</small></div><div class="signal-row"><strong>Automation · 未就绪</strong><small>当前 Product Workspace 尚缺 ${steps.length - state.completed.size} 个条件。</small></div><div class="signal-row"><strong>Chat · ${state.completed.has("workspace") ? "可用" : "不可用"}</strong><small>${state.completed.has("workspace") ? "可以在绑定目录创建自由会话。" : "绑定本地目录后可创建自由会话。"}</small></div><button class="secondary-button" type="button">＋ 添加另一个产品</button></aside>
    </div>`;
}

function readyToday(title, detail, action) {
  return `<div class="page-intro"><div><span class="eyebrow">TODAY · READY</span><h1>${title}</h1><p>${detail}</p></div><span class="state-pill dark">READY</span></div><section class="panel done-state"><div><i>✓</i><h3>ArcOrbit 可以开始领取工作</h3><p>本地目录、项目授权、任务资格和全局总闸已经形成完整执行条件。</p><button class="primary-button" type="button">${action}</button></div></section>${dailySignals()}`;
}

function dailySignals() {
  return `<div class="secondary-grid"><section class="panel metric"><span>待推进</span><strong>1</strong><small>当前用户的待评审任务</small></section><section class="panel metric"><span>运行中</span><strong>0</strong><small>Automation 当前待命</small></section><section class="panel metric"><span>需要你处理</span><strong>${currentStep() ? 1 : 0}</strong><small>${currentStep()?.label || "当前没有阻断"}</small></section></div>`;
}

function impactLabel(id) {
  return ({ workspace: "Chat 与本地执行", authorization: "Automation 项目范围", task: "任务执行资格", automation: "全局领取" })[id] || "项目范围";
}

function nextOutcome(id) {
  return ({ workspace: "可以授权项目", authorization: "可以确认任务", task: "可以开启领取", automation: "开始监听队列" })[id] || "继续准备";
}

function moduleFacts(module) {
  const facts = {
    organization: { title: "ArcOrbit", lead: "项目事实、成员关系与本地执行连接。", rows: [["组织归属", "个人项目"], ["本地项目", state.completed.has("workspace") ? "…/feitianchengzi/arckit" : "尚未绑定"], ["Automation", state.completed.has("authorization") ? "已允许" : "未允许"], ["当前产品集", "默认产品集"]] },
    work: { title: "完善 Today 的新人交互", lead: "当前用户待办详情与自动执行资格。", rows: [["产品", "ArcOrbit"], ["执行人", "Glare · 我"], ["状态", state.completed.has("task") ? "待处理" : "待评审"], ["自动执行资格", moduleBlocker("work") ? "不可执行" : "可执行"]] },
    automation: { title: "Automation Command Center", lead: "队列、执行资格、运行与恢复。", rows: [["待评审", state.completed.has("task") ? "0" : "1"], ["待处理", state.completed.has("task") ? "1" : "0"], ["项目授权", state.completed.has("authorization") ? "已允许" : "未允许"], ["自动领取", state.completed.has("automation") ? "已开启" : "已关闭"]] },
    chat: { title: "新对话", lead: "自由对话固定属于一个本地 Product Workspace。", rows: [["目标项目", "ArcOrbit"], ["本地工作区", state.completed.has("workspace") ? "…/feitianchengzi/arckit" : "不可用"], ["草稿", "帮我梳理当前项目…"], ["发送", state.completed.has("workspace") ? "可用" : "已禁用"]] }
  };
  return facts[module];
}

function moduleBlocker(module) {
  const missing = (id) => !state.completed.has(id);
  if (module === "organization") {
    if (missing("workspace")) return steps[1];
    if (missing("authorization")) return steps[2];
    return null;
  }
  if (module === "work") {
    if (missing("workspace")) return steps[1];
    if (missing("authorization")) return steps[2];
    if (missing("task")) return steps[3];
    if (missing("automation")) return steps[4];
    return null;
  }
  if (module === "automation") return currentStep();
  if (module === "chat") return missing("workspace") ? steps[1] : null;
  return null;
}

function baseModule() {
  const data = moduleFacts(state.module);
  return `<section class="module-main"><span class="eyebrow">${state.module.toUpperCase()}</span><h3>${data.title}</h3><p>${data.lead}</p><div class="fact-list">${data.rows.map(([label, value]) => `<div class="fact-row"><span>${label}</span><strong>${value}</strong></div>`).join("")}</div></section>`;
}

function focusModule() {
  const blocker = moduleBlocker(state.module);
  if (!blocker) return `${baseModule()}<aside class="module-inspector done-state"><div><i>✓</i><h3>当前页面条件已满足</h3><p>页面保留日常操作，不继续展示引导。</p></div></aside>`;
  return `${baseModule()}<aside class="module-inspector"><h3>当前对象</h3><p>只解释会影响当前页面任务的首要条件。</p><div class="guidance-strip"><div><strong>${blocker.label}</strong><small>${blocker.detail}。完成后留在当前页面并重新计算。</small></div>${actionButton(blocker)}</div></aside>`;
}

function journeyModule() {
  const blocker = moduleBlocker(state.module);
  return `${baseModule()}<aside class="guidance-rail"><small>准备路径</small><h3>${blocker ? `当前：${blocker.label}` : "当前页面已准备"}</h3>${steps.map((step, index) => `<div class="rail-step"><i>${state.completed.has(step.id) ? "✓" : index + 1}</i><div><strong>${step.label}</strong><small>${state.completed.has(step.id) ? "已完成" : stepStatus(step) === "current" ? "当前可以操作" : "等待前置条件"}</small></div></div>`).join("")}${blocker ? actionButton(blocker) : ""}</aside>`;
}

function portfolioModule() {
  const blocker = moduleBlocker(state.module);
  return `${baseModule()}<aside class="module-inspector"><h3>ArcOrbit · 就绪状态</h3><p>默认只显示状态标记，用户选择阻断标记后再展开原因和操作。</p><div class="status-badges"><button type="button">项目 ✓</button><button class="${state.completed.has("workspace") ? "" : "blocked"}" type="button">本地目录 ${state.completed.has("workspace") ? "✓" : "!"}</button><button class="${state.completed.has("authorization") ? "" : "blocked"}" type="button">项目授权 ${state.completed.has("authorization") ? "✓" : "!"}</button><button class="${state.completed.has("task") ? "" : "blocked"}" type="button">任务资格 ${state.completed.has("task") ? "✓" : "!"}</button></div>${blocker ? `<div class="popover-card"><strong>${blocker.label}</strong><small>${blocker.detail}</small>${actionButton(blocker)}</div>` : `<div class="popover-card"><strong>当前页面条件已满足</strong><small>产品就绪标记保持低强调，不阻断日常操作。</small></div>`}</aside>`;
}

function render() {
  comparisonNote.textContent = concepts[state.concept].note;
  document.querySelectorAll("[data-concept]").forEach((button) => button.classList.toggle("active", button.dataset.concept === state.concept));
  document.querySelectorAll("[data-module]").forEach((button) => button.classList.toggle("active", button.dataset.module === state.module));
  automationToggle.checked = state.completed.has("automation");
  todayCanvas.innerHTML = state.concept === "focus" ? focusToday() : state.concept === "journey" ? journeyToday() : portfolioToday();
  moduleCanvas.innerHTML = `<div class="module-shell">${state.concept === "focus" ? focusModule() : state.concept === "journey" ? journeyModule() : portfolioModule()}</div>`;
}

document.addEventListener("click", (event) => {
  const conceptButton = event.target.closest("[data-concept]");
  if (conceptButton) state.concept = conceptButton.dataset.concept;
  const moduleButton = event.target.closest("[data-module]");
  if (moduleButton) state.module = moduleButton.dataset.module;
  const completionButton = event.target.closest("[data-complete]");
  if (completionButton) state.completed.add(completionButton.dataset.complete);
  if (event.target.closest("#resetButton")) state.completed = new Set(["project"]);
  render();
});

automationToggle.addEventListener("change", () => {
  if (automationToggle.checked) state.completed.add("automation");
  else state.completed.delete("automation");
  render();
});

render();
