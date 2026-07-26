(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const app = $("#desktop-app");
  const loginScreen = $("#login-screen");
  const modalLayer = $("#modal-layer");
  const commandPalette = $("#command-palette");
  const notificationDrawer = $("#notification-drawer");
  const toastRegion = $("#toast-region");

  const routeLabels = {
    today: ["今日"],
    products: ["产品", "Product Studio"],
    work: ["工作", "我的工作"],
    automations: ["自动化", "运行中心"],
    workbench: ["开发工作台", "拾光 iOS"],
    releases: ["交付", "Build 18"],
    feedback: ["反馈", "智能分组"],
    capabilities: ["能力", "Capability Hub"]
  };

  const workItems = {
    "work-203": {
      eyebrow: "WORK-203 · 产品决策",
      status: "需要决策",
      statusClass: "status-pill--warm",
      title: "选择首页洞察的第一版范围",
      lead: "为了让测试用户更快感受到长期记录的价值，需要确定第一版情绪洞察的表现范围。"
    },
    "work-205": {
      eyebrow: "HANDOFF-18 · 人工授权",
      status: "等待处理",
      statusClass: "status-pill--danger",
      title: "允许访问 App Store Connect",
      lead: "自动化已经完成本地构建准备，需要一次性授权才能继续上传 TestFlight Build。"
    },
    "work-201": {
      eyebrow: "WORK-201 · iOS 开发",
      status: "AI 已完成初稿",
      statusClass: "status-pill--running",
      title: "完善情绪洞察空状态",
      lead: "检查记录不足、无数据和加载失败三种状态，并补齐 VoiceOver 标签与测试。"
    },
    "work-202": {
      eyebrow: "WORK-202 · Capability",
      status: "可自动执行",
      statusClass: "status-pill--success",
      title: "接入反馈截图附件",
      lead: "在现有 Feedback SDK 基础上增加截图选择、压缩、上传和失败恢复。"
    },
    "work-204": {
      eyebrow: "WORK-204 · 交付准备",
      status: "等待 Build",
      statusClass: "",
      title: "准备 TestFlight 测试说明",
      lead: "汇总本版本变更、验证重点和已知问题，形成面向外部测试用户的说明。"
    }
  };

  const feedbackItems = {
    "fb-101": {
      eyebrow: "反馈组 FB-101 · AI 建议置信度 92%",
      title: "情绪卡片在离线后消失",
      lead: "8 位用户报告在弱网或离线记录后，回到首页看不到刚刚创建的情绪卡片。",
      status: "高影响",
      statusClass: "status-pill--danger"
    },
    "fb-102": {
      eyebrow: "反馈组 FB-102 · 产品建议",
      title: "希望趋势图支持月视图",
      lead: "5 位连续记录超过两周的用户，希望从七日趋势继续查看月度变化。",
      status: "待评估",
      statusClass: "status-pill--warm"
    },
    "fb-103": {
      eyebrow: "反馈组 FB-103 · 信息待补充",
      title: "Face ID 偶尔没有弹出",
      lead: "3 位 iOS 19 测试用户报告二次进入 App 时没有出现 Face ID，需要补充设备日志。",
      status: "待澄清",
      statusClass: "status-pill--running"
    },
    "fb-104": {
      eyebrow: "反馈 FB-104 · 体验改进",
      title: "导出图片字体太小",
      lead: "一位用户表示分享到社交平台后文字难以阅读，建议检查导出画布的字号层级。",
      status: "低影响",
      statusClass: ""
    }
  };

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i>${type === "success" ? "✓" : "i"}</i><span>${message}</span>`;
    toastRegion.appendChild(toast);
    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(6px)";
      window.setTimeout(() => toast.remove(), 180);
    }, 2800);
  }

  function closeTransient() {
    notificationDrawer.classList.remove("is-open");
    $("#user-menu").classList.add("is-hidden");
    closeOverlay(commandPalette);
    closeModal();
  }

  function setBreadcrumb(route) {
    const labels = routeLabels[route] || [route];
    $("#breadcrumbs").innerHTML = labels
      .map((label, index) => index === 0 ? `<strong>${label}</strong>` : `<span>${label}</span>`)
      .join("");
  }

  function switchRoute(route) {
    if (!route || !$("[data-view='" + route + "']")) return;
    $$(".app-view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === route));
    $$(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.route === route));
    setBreadcrumb(route);
    notificationDrawer.classList.remove("is-open");
    closeOverlay(commandPalette);
    $("#user-menu").classList.add("is-hidden");
  }

  function openOverlay(element) {
    element.classList.remove("is-hidden");
  }

  function closeOverlay(element) {
    element.classList.add("is-hidden");
  }

  function openModal(id) {
    $$(".modal", modalLayer).forEach((modal) => modal.classList.add("is-hidden"));
    const modal = $("#" + id);
    if (!modal) return;
    modal.classList.remove("is-hidden");
    openOverlay(modalLayer);
    window.setTimeout(() => $("input, textarea, select", modal)?.focus(), 80);
  }

  function closeModal() {
    closeOverlay(modalLayer);
    $$(".modal", modalLayer).forEach((modal) => modal.classList.add("is-hidden"));
  }

  function login() {
    const button = $("#login-button");
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span>正在恢复产品上下文…</span><span class="spinner"></span>';
    }
    window.setTimeout(() => {
      loginScreen.classList.add("is-hidden");
      app.classList.remove("is-hidden");
      switchRoute("today");
      showToast("已恢复 Feitian Studio 的产品上下文");
    }, 680);
  }

  function logout() {
    app.classList.add("is-hidden");
    loginScreen.classList.remove("is-hidden");
    const button = $("#login-button");
    button.disabled = false;
    button.innerHTML = '<span>进入 Feitian Studio</span><svg class="icon"><use href="#i-arrow"></use></svg>';
  }

  function selectWork(id) {
    const data = workItems[id];
    if (!data) return;
    $$(".work-list-item").forEach((item) => item.classList.toggle("is-selected", item.dataset.workId === id));
    const detail = $("#work-detail");
    $(".detail-scroll > .eyebrow", detail).textContent = data.eyebrow;
    $(".detail-scroll > h1", detail).textContent = data.title;
    $(".detail-lead", detail).textContent = data.lead;
    const pill = $(".detail-toolbar .status-pill", detail);
    pill.className = "status-pill " + data.statusClass;
    pill.textContent = data.status;
  }

  function selectFeedback(id) {
    const data = feedbackItems[id];
    if (!data) return;
    $$(".feedback-item").forEach((item) => item.classList.toggle("is-selected", item.dataset.feedbackId === id));
    const detail = $(".feedback-detail");
    $(".detail-scroll > .eyebrow", detail).textContent = data.eyebrow;
    $(".detail-scroll > h1", detail).textContent = data.title;
    $(".detail-lead", detail).textContent = data.lead;
    const pill = $(".detail-toolbar .status-pill", detail);
    pill.className = "status-pill " + data.statusClass;
    pill.textContent = data.status;
  }

  function startAgentRun() {
    const button = $("#run-agent-button");
    const output = $("#prototype-run-output");
    if (button.dataset.running === "true") {
      showToast("当前验证仍在运行中", "info");
      return;
    }
    button.dataset.running = "true";
    button.innerHTML = '<span>执行中</span><span class="spinner"></span>';
    output.classList.remove("is-hidden");
    output.scrollIntoView({ behavior: "smooth", block: "end" });
    window.setTimeout(() => {
      const conversation = $("#agent-conversation");
      const message = document.createElement("article");
      message.className = "message message--assistant";
      message.innerHTML = '<header><span class="agent-orb agent-orb--tiny"><i></i></span><strong>Codex</strong><time>刚刚</time></header><p>验证完成：12 项测试通过，VoiceOver 标签完整。已生成 Worker Report，等待你确认后写回 CASE-42。</p>';
      conversation.insertBefore(message, $(".prototype-run-output", conversation).nextSibling);
      button.dataset.running = "false";
      button.innerHTML = '<span>审阅并写回</span><svg class="icon"><use href="#i-check"></use></svg>';
      showToast("RUN-8421 已完成验证，等待状态写回");
    }, 2300);
  }

  function confirmDecision() {
    showToast("已选择方案 A，Automation Runtime 正在创建下一轮");
    window.setTimeout(() => switchRoute("automations"), 650);
  }

  function feedbackToWork() {
    const button = $("#feedback-to-work");
    if (button.dataset.created === "true") {
      switchRoute("work");
      selectWork("work-201");
      return;
    }
    button.dataset.created = "true";
    button.innerHTML = '<svg class="icon"><use href="#i-check"></use></svg> 已创建 WORK-206';
    button.classList.add("primary-button--done");
    showToast("已合并 8 条反馈并创建 WORK-206");
  }

  function installCapability(button) {
    if (button.dataset.installed === "true") {
      showToast("崩溃诊断能力已加入拾光");
      return;
    }
    button.disabled = true;
    button.textContent = "检查配置…";
    window.setTimeout(() => {
      button.disabled = false;
      button.dataset.installed = "true";
      button.textContent = "已启用";
      const card = button.closest(".capability-card");
      card.classList.remove("capability-card--recommended");
      const pill = $(".status-pill", card);
      pill.textContent = "已启用";
      pill.className = "status-pill status-pill--success";
      showToast("崩溃诊断已加入拾光，接入工作已创建");
    }, 1000);
  }

  function approveHandoff() {
    closeModal();
    showToast("已授权本次上传，自动化将继续执行");
    window.setTimeout(() => switchRoute("automations"), 500);
  }

  function createIdea() {
    closeModal();
    showToast("ProductIdea 草案已创建，AI 正在整理分析");
    switchRoute("products");
  }

  function createWork() {
    closeModal();
    showToast("工作项已创建并进入 AI 分析");
    switchRoute("work");
  }

  function prepareBuild() {
    closeModal();
    showToast("Build 19 交付计划已创建");
    switchRoute("releases");
  }

  function openCommand() {
    openOverlay(commandPalette);
    const input = $("#command-input");
    input.value = "";
    $$(".command-group button", commandPalette).forEach((button) => button.style.display = "");
    window.setTimeout(() => input.focus(), 50);
  }

  $("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    login();
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, label");
    if (!target) return;

    if (target.matches("[data-login]")) {
      login();
      return;
    }

    if (target.dataset.route) {
      switchRoute(target.dataset.route);
      if (target.dataset.selectWork) window.setTimeout(() => selectWork(target.dataset.selectWork), 0);
      if (target.dataset.selectFeedback) window.setTimeout(() => selectFeedback(target.dataset.selectFeedback), 0);
      return;
    }

    if (target.dataset.modal) {
      openModal(target.dataset.modal);
      return;
    }

    if (target.dataset.toast) {
      showToast(target.dataset.toast, "info");
      if (target.closest("#modal-layer")) closeModal();
      return;
    }

    if (target.matches(".work-list-item")) {
      selectWork(target.dataset.workId);
      return;
    }

    if (target.matches(".feedback-item")) {
      selectFeedback(target.dataset.feedbackId);
      return;
    }

    if (target.matches(".choice-card")) {
      $$(".choice-card").forEach((card) => card.classList.remove("is-selected"));
      target.classList.add("is-selected");
      $("input", target).checked = true;
      return;
    }

    const action = target.dataset.action;
    if (!action) return;

    const actions = {
      "collapse-sidebar": () => app.classList.toggle("sidebar-collapsed"),
      "toggle-user-menu": () => $("#user-menu").classList.toggle("is-hidden"),
      "logout": logout,
      "open-command": openCommand,
      "toggle-notifications": () => notificationDrawer.classList.toggle("is-open"),
      "open-handoff": () => openModal("handoff-modal"),
      "close-modal": closeModal,
      "approve-handoff": approveHandoff,
      "confirm-decision": confirmDecision,
      "feedback-to-work": feedbackToWork,
      "install-capability": () => installCapability(target),
      "create-idea": createIdea,
      "create-work": createWork,
      "prepare-build": prepareBuild,
      "open-product-detail": () => {
        showToast("已进入拾光产品工作区");
        $(".featured-product").scrollIntoView({ behavior: "smooth" });
      }
    };
    actions[action]?.();
  });

  $$(".segmented-control, .panel-tabs, .work-filters, .feedback-filterbar, .capability-tabs").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      $$("button", group).forEach((item) => item.classList.toggle("is-active", item === button));
    });
  });

  $$(".release-check input").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      checkbox.closest(".release-check").classList.toggle("is-done", checkbox.checked);
      showToast(checkbox.checked ? "检查项已完成" : "检查项已重新打开", "info");
    });
  });

  $("#run-agent-button").addEventListener("click", startAgentRun);

  $("#command-input").addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    $$(".command-group button", commandPalette).forEach((button) => {
      button.style.display = button.textContent.toLowerCase().includes(query) ? "" : "none";
    });
  });

  commandPalette.addEventListener("click", (event) => {
    if (event.target === commandPalette) closeOverlay(commandPalette);
  });
  modalLayer.addEventListener("click", (event) => {
    if (event.target === modalLayer) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    const isCommand = event.metaKey || event.ctrlKey;
    if (isCommand && event.key.toLowerCase() === "k") {
      event.preventDefault();
      app.classList.contains("is-hidden") || openCommand();
      return;
    }
    if (event.key === "Escape") {
      closeTransient();
      return;
    }
    if (!app.classList.contains("is-hidden") && !isCommand && !event.altKey && !event.shiftKey) {
      const routeByKey = {
        "1": "today",
        "2": "products",
        "3": "work",
        "4": "automations",
        "5": "workbench",
        "6": "releases",
        "7": "feedback",
        "8": "capabilities"
      };
      const activeElement = document.activeElement;
      const editing = activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName);
      if (!editing && routeByKey[event.key]) switchRoute(routeByKey[event.key]);
    }
  });

  selectWork("work-203");
  selectFeedback("fb-101");
})();
