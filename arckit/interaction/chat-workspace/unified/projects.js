(() => {
  if (M.variant !== "dock") return;
  const { e, b, icon } = V,
    base = V.render,
    add = M.add;
  function setup() {
    const s = M.s;
    if (!s.projects) {
      s.projects = [
        {
          id: "reading",
          name: "拾光",
          idea: "让阅读留下自己的痕迹。",
          members: [
            { id: "me", name: "我", role: "管理员" },
            { id: "lin", name: "林悦", role: "成员" },
            { id: "chen", name: "陈昊", role: "成员" },
          ],
        },
        {
          id: "notes",
          name: "轻记",
          idea: "随手记录，轻松找回。",
          members: [
            { id: "me", name: "我", role: "管理员" },
            { id: "chen", name: "陈昊", role: "成员" },
          ],
        },
      ];
      s.project = "reading";
      s.screen = "chat";
      s.projectContexts = {};
      s.feedbacks = [
        {
          id: "F-21",
          project: "reading",
          title: "导出阅读记录时没有反应",
          body: "我选了十二条记录，点击导出后不知道有没有开始。希望能看到进度，失败也能重试。",
          author: "小禾",
          state: "待处理",
          messages: [],
          task: null,
        },
        {
          id: "F-22",
          project: "reading",
          title: "夜间阅读的字号偏小",
          body: "晚上看回顾时，希望能放大字体。",
          author: "陆远",
          state: "待处理",
          messages: [],
          task: null,
        },
        {
          id: "F-23",
          project: "notes",
          title: "希望按日期查找笔记",
          body: "记录多了以后，想按月份找到以前的内容。",
          author: "小北",
          state: "待处理",
          messages: [],
          task: null,
        },
      ];
      s.invitations = [];
      s.tasks.forEach((t) => (t.project = "reading"));
      const old = s.selected;
      const t = add("梳理笔记检索的核心场景");
      t.project = "notes";
      t.goal = "比较关键词、日期和标签三种查找方式。";
      s.selected = old;
      s.feedbackSelected = "F-21";
      s.workSearch = "";
      s.workStatus = "all";
      s.ideaDraft = { name: "", idea: "" };
      s.replies = {};
    }
    s.tasks.forEach((t) => (t.project ??= "reading"));
    return s;
  }
  setup();
  M.add = (title, chat = false) => {
    const t = add(title, chat);
    t.project = setup().project;
    return t;
  };
  const project = () => setup().projects.find((p) => p.id === M.s.project);
  const button = (a, label, cls = "", attrs = "") =>
    `<button type="button" data-project="${a}" class="${cls}" ${attrs}>${label}</button>`;
  const ownTasks = () => M.s.tasks.filter((t) => t.project === M.s.project);
  function head(title, description, actions = "") {
    return `<header class="top page-top">${b("nav", icon("menu"), "quiet mobile-nav", 'aria-label="工作列表"')}<div class="grow"><h1>${title}</h1><div class="meta">${e(project().name)} · ${description}</div></div>${actions}</header>`;
  }
  function work() {
    const s = M.s,
      ts = ownTasks().filter(
        (t) =>
          (s.workStatus === "archived" ? t.archived : !t.archived) &&
          (s.workStatus === "all" ||
            s.workStatus === "archived" ||
            (s.workStatus === "mine" && t.owner === "我") ||
            (s.workStatus === "done" &&
              ["待验收", "已验收"].includes(t.state))) &&
          t.title.includes(s.workSearch),
      );
    return (
      head(
        "待办",
        "目标、协作与执行",
        button("create-work", icon("plus") + " 创建待办", "primary"),
      ) +
      `<div class="management"><div class="row work-tools"><input aria-label="搜索待办" data-field="workSearch" placeholder="搜索待办…" value="${e(s.workSearch)}"><select aria-label="筛选待办" data-field="workStatus"><option value="all" ${s.workStatus === "all" ? "selected" : ""}>全部待办</option><option value="mine" ${s.workStatus === "mine" ? "selected" : ""}>我负责</option><option value="done" ${s.workStatus === "done" ? "selected" : ""}>待验收与已验收</option><option value="archived" ${s.workStatus === "archived" ? "selected" : ""}>已归档</option></select></div><div class="task-table"><div class="table-label"><span>工作</span><span>负责人</span><span>状态</span></div>${ts.map((t) => `<button class="task-table-row" data-project="open-work" data-id="${t.id}"><span><small>#${t.id}</small><strong>${e(t.title)}</strong><small>${t.messages.length ? "有协作记录" : "尚无对话"}</small></span><span>${e(t.owner)}</span><span class="pill">${e(t.mode === "auto" ? "Auto 推进中" : t.state)}</span></button>`).join("") || '<div class="management-empty">暂无匹配的待办。</div>'}</div></div>`
    );
  }
  function feedback() {
    const s = M.s,
      items = s.feedbacks.filter((f) => window.W ? W.ids().includes(f.project) : f.project === s.project),
      f = items.find((f) => f.id === s.feedbackSelected);
    return (
      head("反馈", "从用户问题继续推进") +
      `<div class="feedback-layout"><div class="feedback-list">${items.map((x) => `<button class="feedback-row ${f?.id === x.id ? "selected" : ""}" data-project="feedback" data-id="${x.id}"><small>${x.id} · ${e(x.state)}</small><strong>${e(x.title)}</strong><small>${e(x.author)}</small></button>`).join("") || '<p class="muted">还没有收到反馈</p>'}</div><div class="feedback-detail">${f ? `<div class="row between"><small>${f.id} · ${e(f.author)}</small><span class="pill">${e(f.state)}</span></div><h2>${e(f.title)}</h2><p>${e(f.body)}</p>${f.task ? `<button class="linked-work" data-project="open-work" data-id="${f.task}"><small>关联待办 #${f.task}</small><strong>${e(s.tasks.find((t) => t.id === f.task)?.title || "工作")}</strong><span>${e(s.tasks.find((t) => t.id === f.task)?.state || "")}</span></button>` : `<div class="row wrap">${button("convert", "创建关联待办", "primary")}${button("link", "关联已有待办")}${button("ignore", f.state === "已忽略" ? "恢复处理" : "忽略", "quiet")}</div>`}<section class="feedback-thread"><h3>与用户沟通</h3>${f.messages.map((m) => `<div class="reply"><small>${e(m.author)} · ${e(m.at)}</small><p>${e(m.text)}</p></div>`).join("") || '<p class="muted">尚无回复</p>'}<form data-project-form="reply"><textarea name="reply" aria-label="回复用户" placeholder="回复用户，或说明当前处理进展…" required>${e(s.replies[f.id] || "")}</textarea><div class="row between"><small>回复到这条反馈</small><button class="primary">发送回复</button></div><p class="error" data-error></p></form></section>${f.task ? `<div class="feedback-close"><p class="muted">${s.tasks.find((t) => t.id === f.task)?.state === "已验收" ? "关联工作已验收，可与用户确认问题是否解决。" : "关联工作仍在推进，回复和处理状态持续保留。"}</p>${button("resolve", f.state === "已解决" ? "重新打开" : "标记已解决", "", f.state !== "已解决" && s.tasks.find((t) => t.id === f.task)?.state !== "已验收" ? 'disabled title="先验收关联工作"' : "")}</div>` : ""}` : '<div class="management-empty">选择一条反馈查看内容</div>'}</div></div>`
    );
  }
  function team() {
    const p = project(),
      s = M.s;
    return (
      head(
        "团队",
        `${p.members.length} 位成员`,
        button("invite", "邀请成员", "primary"),
      ) +
      `<div class="management"><div class="team-intro"><h2>一起推进 ${e(p.name)}</h2><p class="muted">成员可以参与项目讨论、处理反馈和负责待办。</p></div>${p.members.map((m) => `<div class="member-row"><span class="avatar">${e(m.name.slice(0, 1))}</span><div class="grow"><strong>${e(m.name)}</strong><small>${ownTasks().filter((t) => t.owner === m.name).length} 件工作</small></div><span class="pill">${m.role}</span>${m.id !== "me" ? button("member", "管理", "quiet", `data-id="${m.id}"`) : "<small>你</small>"}</div>`).join("")}<h3 style="margin-top:30px">待接受的邀请</h3>${
        s.invitations
          .filter((i) => i.project === p.id)
          .map(
            (i) =>
              `<div class="member-row"><div class="grow"><strong>${e(i.email)}</strong><small>等待接受 · ${e(i.role)}</small></div>${button("revoke", "撤销", "quiet", `data-id="${i.id}"`)}</div>`,
          )
          .join("") || '<p class="muted">暂无待接受邀请</p>'
      }</div>`
    );
  }
  function overview() {
    const p = project();
    return `<h2>${e(p.name)}</h2><p class="muted">${e(p.idea)}</p><section class="section"><h3>项目工作</h3><p>${ownTasks().length} 件待办</p><p>${ownTasks().filter((t) => t.mode === "auto").length} 件 Auto 推进中</p></section><section class="section"><h3>成员</h3><p>${p.members.map((m) => e(m.name)).join("、")}</p></section><section class="section"><h3>继续协作</h3>${button("chat", "回到对话", "")}<p class="muted">讨论、执行与成果保留在各自的工作中。</p></section>`;
  }
  V.render = () => {
    const s = setup(),
      p = project(),
      all = s.tasks;
    s.tasks = ownTasks();
    let html;
    try {
      html = base();
    } finally {
      s.tasks = all;
    }
    const box = document.createElement("div");
    box.innerHTML = html;
    box.querySelector(".project").innerHTML =
      `<button class="project-switch" data-project="switch"><span><strong>${e(p.name)}</strong><small>${p.members.length} 位成员</small></span><span>⌄</span></button>`;
    const create = box.querySelector(".create");
    create.insertAdjacentHTML(
      "beforebegin",
      `<nav class="project-navigation" aria-label="项目功能">${[
        ["chat", "对话"],
        ["work", "待办"],
        ["feedback", "反馈"],
        ["team", "团队"],
      ]
        .map(([k, n]) =>
          button(
            k,
            `<span>${n}</span><small>${k === "work" ? ownTasks().length : k === "feedback" ? s.feedbacks.filter((f) => f.project === p.id && f.state === "待处理").length : ""}</small>`,
            s.screen === k ? "active" : "",
          ),
        )
        .join("")}</nav>`,
    );
    box.querySelectorAll(".workrow").forEach((el) => {
      const t = all.find((t) => t.id === el.dataset.id);
      if (t?.project !== p.id) el.remove();
    });
    box.querySelector(".project").insertAdjacentHTML("afterend", "");
    if (s.screen !== "chat") {
      const main = box.querySelector(".workspace");
      main.innerHTML =
        s.screen === "work"
          ? work()
          : s.screen === "feedback"
            ? feedback()
            : team();
      const inspector = box.querySelector(".inspector");
      inspector.innerHTML = `<header class="inspector-tabs"><strong>项目概况</strong>${b("close-details", icon("close"), "quiet inspector-close", 'aria-label="关闭综合栏"')}</header><div class="inspector-content">${overview()}</div>`;
    } else {
      box
        .querySelector(".summary-head small")
        ?.replaceChildren(document.createTextNode(p.name));
      const meta = box.querySelector(".top .meta");
      if (meta)
        meta.textContent =
          p.name +
          (M.current()
            ? " / #" + M.current().id + " · " + M.current().owner + "负责"
            : " / 新工作");
      if (p.id !== "reading") {
        box
          .querySelectorAll(".inspector-context,.git-branch")
          .forEach((n) => (n.textContent = p.name));
        const content = box.querySelector(".inspector-content");
        if (s.dock?.tab !== "task" && content)
          content.innerHTML =
            '<div class="inspector-empty">此项目尚未连接本地目录。</div>';
        box.querySelector(".inspector-footer").innerHTML =
          `<span>${e(p.name)}</span><span>未连接目录</span>`;
      } else box.querySelector(".inspector-footer span").textContent = p.name;
      box
        .querySelector(".empty-start small")
        ?.replaceChildren(document.createTextNode(p.name + " / 新的工作"));
    }
    const footer = box.querySelector(".sidebar-foot");
    footer.insertAdjacentHTML(
      "afterbegin",
      button("idea", icon("plus") + " 新建项目", "quiet new-project"),
    );
    return box.innerHTML;
  };
  let restore = null;
  function refresh() {
    M.save();
    document.dispatchEvent(new Event("dock:refresh"));
  }
  function modal(title, body) {
    restore = document.activeElement?.dataset.project;
    const d = document.querySelector("#dialog");
    delete d.dataset.lifeModal;
    d.innerHTML = `<div class="row between"><h2 id="dialog-title">${title}</h2>${button("close", icon("close"), "quiet", 'aria-label="关闭"')}</div>${body}`;
    if (!d.open) d.showModal();
  }
  function close() {
    document.querySelector("#dialog").close();
    refresh();
    [...document.querySelectorAll("[data-project]")]
      .find((n) => n.dataset.project === restore)
      ?.focus();
  }
  function selectProject(id) {
    const s = M.s;
    s.projectContexts[s.project] = {
      selected: s.selected,
      newDraft: s.newDraft,
      dock: structuredClone(s.dock || {}),
      search: s.search,
    };
    s.project = id;
    const c = s.projectContexts[id];
    s.selected = c
      ? c.selected
      : s.tasks.find((t) => t.project === id)?.id || null;
    s.newDraft = c?.newDraft || "";
    s.dock = c?.dock || {
      tab: "task",
      file: "",
      diff: "",
      collapsed: [],
      query: "",
      index: false,
      staged: [],
      scroll: {},
    };
    s.search = c?.search || "";
    s.filter = "all";
    s.screen = "chat";
    s.drawer = false;
    s.nav = false;
    s.feedbackSelected = s.feedbacks.find((f) => f.project === id)?.id || null;
    s.error = "";
  }
  function selectedFeedback() {
    return M.s.feedbacks.find(
      (f) => f.id === M.s.feedbackSelected && f.project === M.s.project,
    );
  }
  document.addEventListener(
    "click",
    (ev) => {
      const act = ev.target.closest("[data-act]");
      if (act && ["new", "select", "locate"].includes(act.dataset.act)) {
        M.s.screen = "chat";
        if (act.dataset.act === "locate") {
          const t = M.s.tasks.find((t) => t.id === act.dataset.id);
          if (t && t.project !== M.s.project) selectProject(t.project);
        }
      }
      if (act?.dataset.act === "create") M.s.screen = "chat";
      if (act?.dataset.act === "source" && act.dataset.source === "feedback") {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        M.s.screen = "feedback";
        M.s.feedbackSelected = M.current()?.feedback;
        refresh();
        return;
      }
      const el = ev.target.closest("[data-project]");
      if (!el) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const a = el.dataset.project,
        s = setup(),
        p = project();
      if (a === "close") return close();
      if (["chat", "work", "feedback", "team"].includes(a)) {
        s.screen = a;
        s.nav = false;
        if (el.dataset.id) s.feedbackSelected = el.dataset.id;
        refresh();
        return;
      }
      if (a === "switch")
        return modal(
          "选择项目",
          `<div class="project-choices">${s.projects.map((p) => button("choose", `<strong>${e(p.name)}</strong><small>${e(p.idea)}</small>`, s.project === p.id ? "selected" : "", `data-id="${p.id}"`)).join("")}</div>${button("idea", icon("plus") + " 从 Idea 新建项目", "primary")}`,
        );
      if (a === "choose") {
        selectProject(el.dataset.id);
        close();
        return;
      }
      if (a === "idea")
        return modal(
          "从 Idea 开始",
          `<p class="muted">带来一个想法，建立你的项目空间。</p><form data-project-form="idea"><label>项目名称<input name="name" value="${e(s.ideaDraft.name)}" placeholder="例如：轻舟" required maxlength="60"></label><label>你想做什么？<textarea name="idea" required placeholder="想解决什么问题，为谁创造价值？">${e(s.ideaDraft.idea)}</textarea></label><small>先建立项目，再和 Agent 一起完善方向。</small><p><button class="primary">创建项目并开始讨论</button></p><p class="error" data-error></p></form>`,
        );
      if (a === "create-work") {
        s.screen = "chat";
        refresh();
        document.querySelector("[data-act=create]").click();
        return;
      }
      if (a === "open-work") {
        const t = s.tasks.find((t) => t.id === el.dataset.id);
        if (t.project !== s.project) selectProject(t.project);
        s.selected = t.id;
        s.screen = "chat";
        s.drawer = false;
        refresh();
        return;
      }
      if (a === "convert") {
        const f = selectedFeedback();
        if (f.task) return;
        return modal(
          "从反馈创建待办",
          `<form data-project-form="convert"><small>${f.id} · ${e(f.author)}</small><label>目标<textarea name="goal" required>${e(f.title)}\n\n${e(f.body)}</textarea></label><label>负责人<select name="owner">${p.members.map((m) => `<option>${e(m.name)}</option>`).join("")}</select></label><p><button class="primary">创建并开始协作</button></p><p class="error" data-error></p></form>`,
        );
      }
      if (a === "link")
        return modal(
          "关联已有待办",
          `<form data-project-form="link"><label>当前项目的待办<select name="task">${ownTasks()
            .map(
              (t) => `<option value="${t.id}">#${t.id} ${e(t.title)}</option>`,
            )
            .join(
              "",
            )}</select></label><button class="primary" ${ownTasks().length ? "" : "disabled"}>确认关联</button><p class="error" data-error></p></form>`,
        );
      if (a === "ignore") {
        const f = selectedFeedback();
        f.state = f.state === "已忽略" ? "待处理" : "已忽略";
        refresh();
        return;
      }
      if (a === "resolve") {
        const f = selectedFeedback();
        if (
          f.state !== "已解决" &&
          s.tasks.find((t) => t.id === f.task)?.state !== "已验收"
        )
          return;
        f.state = f.state === "已解决" ? "处理中" : "已解决";
        refresh();
        return;
      }
      if (a === "invite")
        return modal(
          "邀请加入 " + e(p.name),
          `<form data-project-form="invite"><label>邮箱<input type="email" name="email" placeholder="name@example.com" required></label><label>角色<select name="role"><option>成员</option><option>管理员</option></select></label><button class="primary">创建邀请</button><p class="error" data-error></p></form>`,
        );
      if (a === "revoke") {
        s.invitations = s.invitations.filter((i) => i.id !== el.dataset.id);
        refresh();
        return;
      }
      if (a === "member") {
        const m = p.members.find((m) => m.id === el.dataset.id);
        return modal(
          "管理 " + e(m.name),
          `<form data-project-form="member"><input type="hidden" name="id" value="${m.id}"><label>项目角色<select name="role"><option ${m.role === "成员" ? "selected" : ""}>成员</option><option ${m.role === "管理员" ? "selected" : ""}>管理员</option></select></label><button class="primary">保存角色</button><button type="button" data-life="remove-member" data-id="${m.id}">移出项目</button><p class="error" data-error></p></form>`,
        );
      }
    },
    true,
  );
  document.addEventListener("input", (ev) => {
    const s = setup();
    if (ev.target.dataset.field === "workSearch") {
      const n = ev.target.selectionStart;
      s.workSearch = ev.target.value;
      refresh();
      const field = document.querySelector("[data-field=workSearch]");
      field.focus();
      field.setSelectionRange(n, n);
    }
    if (ev.target.closest("[data-project-form=idea]")) {
      s.ideaDraft[ev.target.name] = ev.target.value;
      M.save();
    }
    if (ev.target.name === "reply") {
      s.replies[s.feedbackSelected] = ev.target.value;
      M.save();
    }
  });
  document.addEventListener("change", (ev) => {
    if (ev.target.dataset.field === "workStatus") {
      M.s.workStatus = ev.target.value;
      refresh();
    }
  });
  document.addEventListener(
    "submit",
    (ev) => {
      const form = ev.target,
        kind = form.dataset.projectForm;
      if (!kind) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const s = setup(),
        data = new FormData(form),
        f = selectedFeedback(),
        error = (text) =>
          (form.querySelector("[data-error]").textContent = text);
      if (s.offline || s.fail) {
        s.fail = false;
        M.save();
        return error("提交失败，内容已保留，请重试。");
      }
      if (kind === "idea") {
        const name = data.get("name").trim(),
          idea = data.get("idea").trim();
        if (!name || !idea) return error("请填写项目名称和想法");
        const id = "project-" + Date.now();
        s.projects.push({
          id,
          name,
          idea,
          members: [{ id: "me", name: "我", role: "管理员" }],
        });
        selectProject(id);
        const t = M.add("探索 " + name + " 的产品方向", true);
        t.goal = idea;
        M.msg(t, "user", idea);
        M.msg(
          t,
          "assistant",
          "先从目标用户与核心问题开始。我们可以在这件工作里逐步明确第一版的范围。",
        );
        s.ideaDraft = { name: "", idea: "" };
      }
      if (kind === "convert") {
        if (f.task) return error("此反馈已经关联待办");
        const goal = data.get("goal").trim();
        if (!goal) return error("请填写目标");
        const t = M.add(f.title);
        t.goal = goal;
        t.owner = data.get("owner");
        t.feedback = f.id;
        t.constraints = [
          { text: "来源反馈 " + f.id, source: "feedback", kind: "用户反馈" },
        ];
        f.task = t.id;
        f.state = "处理中";
        s.screen = "chat";
      }
      if (kind === "link") {
        f.task = data.get("task");
        f.state = "处理中";
      }
      if (kind === "reply") {
        const text = data.get("reply").trim();
        if (!text) return;
        f.messages.push({
          author: "我",
          text,
          at: new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
        s.replies[f.id] = "";
        refresh();
        return;
      }
      if (kind === "invite") {
        const email = data.get("email").trim();
        if (
          s.invitations.some(
            (i) => i.project === s.project && i.email === email,
          )
        )
          return error("此邮箱已有待接受邀请");
        s.invitations.push({
          id: "invite-" + Date.now(),
          project: s.project,
          email,
          role: data.get("role"),
        });
      }
      if (kind === "member")
        project().members.find((m) => m.id === data.get("id")).role =
          data.get("role");
      close();
    },
    true,
  );
  M.save();
})();
