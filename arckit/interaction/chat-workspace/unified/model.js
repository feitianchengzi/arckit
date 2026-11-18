(() => {
  const variant = document.body.dataset.variant,
    key = "arcorbit-formal-workspace-v1:" + variant;
  function task(id, title, withChat = true) {
    return {
      id,
      title,
      goal: title,
      owner: "我",
      state: "探索中",
      mode: "manual",
      progress: 0,
      draft: "",
      notes: [],
      questions: ["下载失败时，是否需要保留已选内容？"],
      criteria: ["可看到导出进度", "失败后保留选择并允许重试"],
      artifacts: [],
      viewed: false,
      checked: false,
      revision: 1,
      summaryVersion: 1,
      messages: withChat
        ? [
            {
              id: "m1",
              role: "user",
              text: "用户说导出阅读记录时不知道有没有反应。先分析原因，暂时不要改代码。",
            },
            {
              id: "m2",
              role: "assistant",
              text: "先区分“没有进度反馈”和“实际导出失败”。我会检查现有流程，整理可验证的改进范围。暂不修改代码。",
              receipt: "已整理目标与约束 · 工作 #" + id,
            },
          ]
        : [],
      constraints: withChat
        ? [{ text: "先分析原因，暂不修改代码", source: "m1", kind: "已明确" }]
        : [],
      events: ["工作已建立"],
      scroll: 0,
    };
  }
  function initial() {
    const first = task("128", "改善阅读记录导出体验");
    first.goal = "定位导出缺少反馈的问题，明确轻量改进方案。";
    const second = task("127", "补充导出失败的提示文案", false);
    second.owner = "林悦";
    second.state = "待开始";
    return {
      selected: "128",
      tasks: [first, second],
      nextId: 129,
      newDraft: "",
      search: "",
      filter: "all",
      drawer: false,
      nav: false,
      tab: "summary",
      theme: "light",
      offline: false,
      fail: false,
      error: "",
      recovered: false,
    };
  }
  const query = new URLSearchParams(location.search);
  if (query.has("reset")) {
    localStorage.removeItem(key);
    query.delete("reset");
    history.replaceState(null, "", location.pathname + "?" + query);
  }
  let s;
  try {
    s = JSON.parse(localStorage.getItem(key));
  } catch {}
  if (!s?.tasks) s = initial();
  for (const t of s.tasks)
    if (["auto", "pausing"].includes(t.mode)) {
      t.mode = "paused";
      t.events.push("重新打开后已暂停，等待明确继续。");
      s.recovered = true;
    }
  const save = () => {
    try {
      localStorage.setItem(key, JSON.stringify(s));
    } catch {}
  };
  const current = () => s.tasks.find((t) => t.id === s.selected);
  const add = (title, chat = false) => {
    const t = task(String(s.nextId++), title, false);
    t.goal = title;
    t.questions = [];
    t.criteria = [];
    t.state = chat ? "探索中" : "待开始";
    s.tasks.unshift(t);
    s.selected = t.id;
    return t;
  };
  const msg = (t, role, text, extra = {}) => {
    const m = {
      id: "m" + Date.now() + Math.random().toString(16).slice(2),
      role,
      text,
      ...extra,
    };
    t.messages.push(m);
    return m;
  };
  const settle = (t) => {
    for (const m of t.messages)
      if (m.pending) {
        m.pending = false;
        m.receipt = "已在本轮采用（样本）";
        t.constraints.push({ text: m.text, source: m.id, kind: "已采用补充" });
      }
    t.summaryVersion++;
  };
  window.M = {
    variant,
    key,
    get s() {
      return s;
    },
    current,
    save,
    add,
    msg,
    settle,
    reset() {
      s = initial();
      save();
    },
    status: (t) =>
      ({
        manual: "人工协作",
        auto: "Auto 推进中",
        pausing: "正在暂停",
        queued: "等待执行位置",
        paused: "已暂停",
        decision: "需要你决定",
        failed: "执行失败",
        waiting: "等待外部条件",
        done: "等待验收",
        accepted: "已验收",
      })[t.mode],
  };
  save();
})();
