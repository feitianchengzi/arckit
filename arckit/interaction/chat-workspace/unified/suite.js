/* Product shell: the existing chat engine remains the single work identity. */
(() => {
  const { e, icon } = V;
  const s = M.s;
  s.suite ??= {
    route: "chat",
    project: "reading",
    projectTab: "overview",
    org: "studio",
    teamTab: "overview",
    member: "lin",
    engScene: "automation",
    engSelected: "using-arckit",
    engQuery: "",
    engFilter: "",
    settingsTab: "account",
    settings: {},
    drafts: {},
    notice: "",
  };
  const state = () => M.s.suite;
  const btn = (a, label, attrs = "") =>
    `<button type="button" data-suite="${a}" ${attrs}>${label}</button>`;
  const field = (label, name, value = "", type = "text") =>
    `<label>${e(label)}<input name="${name}" type="${type}" value="${e(value)}" ${type === "password" ? 'autocomplete="off"' : ""}></label>`;
  const select = (label, name, options, value) =>
    `<label>${e(label)}<select name="${name}">${options
      .map((o) => {
        const [v, n] = Array.isArray(o) ? o : [o, o];
        return `<option value="${e(v)}" ${v === value ? "selected" : ""}>${e(n)}</option>`;
      })
      .join("")}</select></label>`;
  const area = (label, name, value = "") =>
    `<label>${e(label)}<textarea name="${name}" required>${e(value)}</textarea></label>`;
  const currentProject = () =>
    M.s.projects.find((p) => p.id === state().project) || M.s.projects[0];
  const notice = (text) => {
    state().notice = text;
    U.refresh();
  };
  function form(title, kind, body) {
    const d = document.querySelector("#dialog");
    delete d.dataset.lifeModal;
    d.innerHTML = `<div class="row between"><h2 id="dialog-title">${e(title)}</h2>${btn("close", "关闭")}</div><form data-suite-form="${kind}">${body}<div class="suite-form-actions"><button class="primary">确认</button></div><p data-error role="alert" class="error"></p></form>`;
    if (!d.open) d.showModal();
  }
  function popup(title, body) {
    const d = document.querySelector("#dialog");
    delete d.dataset.lifeModal;
    d.innerHTML = `<div class="row between"><h2 id="dialog-title">${e(title)}</h2>${btn("close", "关闭")}</div>${body}`;
    if (!d.open) d.showModal();
  }
  function rail(route) {
    const items = [
      ["chat", "Chat", "M3 3h12v9H8l-4 3v-3H3z"],
      ["projects", "项目", "M2 4h6l2 2h6v10H2z"],
      [
        "team",
        "团队",
        "M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M2 16v-2a5 5 0 0 1 10 0v2M12 3a3 3 0 0 1 0 6M14 11a4 4 0 0 1 2 5",
      ],
      ["engineering", "工程", "M6 2v5M12 2v5M4 7h10v4l-5 5-5-5z"],
    ];
    const button = (k, n, path) =>
      `<button class="rail-button ${route === k ? "selected" : ""}" data-suite-route="${k}" aria-label="${n}" ${route === k ? 'aria-current="page"' : ""}><svg viewBox="0 0 18 18" aria-hidden="true"><path d="${path}"/></svg><span class="rail-tooltip">${n}</span></button>`;
    return `<nav class="app-rail" aria-label="主导航"><img src="assets/arcorbit.svg" alt="ArcOrbit" class="real-logo">${items.map((x) => button(...x)).join("")}<div class="rail-spacer"></div>${button("settings", "设置", "M9 2v2M9 14v2M2 9h2M14 9h2M4 4l2 2M12 12l2 2M4 14l2-2M12 6l2-2M12 9a3 3 0 1 0-6 0 3 3 0 0 0 6 0")}</nav>`;
  }
  const header = (title, sub, actions = "") =>
    `<header class="suite-header"><div><small>${e(sub)}</small><h1>${e(title)}</h1></div><div class="row wrap">${actions}</div></header>`;
  const tabs = (items, current, attr) =>
    `<nav class="suite-tabs" aria-label="页面分区">${items.map(([k, n]) => btn(attr, n, `data-id="${k}" class="${current === k ? "active" : ""}"`)).join("")}</nav>`;
  const layout = (left, main, right) =>
    `<div class="suite-shell">${rail(state().route)}<aside class="suite-left">${left}</aside><main class="suite-main">${main}${state().notice ? `<div class="suite-notice" role="status">${e(state().notice)}${btn("dismiss", "×", 'aria-label="关闭提示"')}</div>` : ""}</main><aside class="suite-right">${right}</aside></div>`;
  const base = V.render;
  window.S = {
    state,
    btn,
    field,
    select,
    area,
    project: currentProject,
    notice,
    form,
    popup,
    header,
    tabs,
    layout,
    e,
    renderers: {},
    handlers: {},
    forms: {},
  };
  V.render = () => {
    const st = state();
    if (!st) return base();
    const savedScope = W.state().scope;
    if (st.route === "chat") W.state().scope = "all";
    if (st.route === "projects" && st.projectTab === "feedback") {
      W.state().scope = st.project;
      W.context(st.project);
    }
    M.s.screen =
      st.route === "projects" && st.projectTab === "feedback"
        ? "feedback"
        : "chat";
    const html = base();
    W.state().scope = savedScope;
    if (st.route !== "chat") return S.renderers[st.route]?.(html) || html;
    const box = document.createElement("div");
    box.innerHTML = html;
    box.querySelector(".app-rail").outerHTML = rail("chat");
    box.querySelector(".sidebar .project")?.remove();
    box.querySelector(".sidebar .create")?.remove();
    box.querySelector(".sidebar .search")?.remove();
    box
      .querySelector(".work-list-tabs")
      .insertAdjacentHTML(
        "beforebegin",
        '<h2 class="chat-list-heading">Chat</h2>',
      );
    box.querySelectorAll(".project-group-heading").forEach((n) => {
      const id = n.dataset.id;
      const wrap = document.createElement("div");
      wrap.className = "group-heading-row";
      n.replaceWith(wrap);
      wrap.append(n);
      wrap.insertAdjacentHTML(
        "beforeend",
        btn(
          "group-create",
          icon("plus"),
          `data-id="${id}" class="quiet" aria-label="在${e(M.s.projects.find((p) => p.id === id)?.name)}新建${M.s.listMode === "chat" ? "对话" : "待办"}"`,
        ),
      );
    });
    box
      .querySelector(".sidebar")
      .insertAdjacentHTML(
        "beforeend",
        btn(
          "new-project",
          icon("plus") + " 新建项目",
          'class="chat-new-project quiet"',
        ),
      );
    box.querySelectorAll("[data-workset]").forEach((n) => {
      if (n.dataset.workset === "manage") {
        n.removeAttribute("data-workset");
        n.dataset.suite = "to-projects";
        n.textContent = "前往项目";
      }
    });
    box
      .querySelector(".top-actions")
      .insertAdjacentHTML(
        "beforeend",
        btn("runs", icon("play"), 'class="quiet" aria-label="运行概况"'),
      );
    return box.innerHTML;
  };
  window.addEventListener(
    "click",
    (ev) => {
      const el = ev.target.closest("button");
      if (!el || el.disabled) return;
      if (el.dataset.act === "source" && el.dataset.source === "feedback") {
        state().route = "projects";
        state().project = M.current().project;
        state().projectTab = "feedback";
      }
      if (el.dataset.project === "open-work") {
        state().route = "chat";
      }
      if (el.dataset.suiteRoute) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        state().route =
          state().account?.loggedIn === false
            ? "settings"
            : el.dataset.suiteRoute;
        if (state().account?.loggedIn === false)
          state().settingsTab = "account";
        state().notice = "";
        M.s.screen = "chat";
        U.refresh();
        return;
      }
      const a = el.dataset.suite;
      if (!a) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (a === "close") {
        document.querySelector("#dialog").close();
        return;
      }
      if (a === "dismiss") {
        state().notice = "";
        U.refresh();
        return;
      }
      if (a === "to-projects") {
        state().route = "projects";
        U.refresh();
        return;
      }
      if (a === "group-create") {
        W.createInProject(
          el.dataset.id,
          M.s.listMode === "chat" ? "new" : "create",
        );
        return;
      }
      if (a === "new-project") {
        S.form(
          "从 Idea 开始",
          "idea-create",
          S.field("项目名称", "name") +
            S.area("想解决什么问题？", "idea") +
            S.select(
              "归属",
              "org",
              [
                ["personal", "个人项目"],
                ...(state().orgs || []).map((o) => [o.id, o.name]),
              ],
              "personal",
            ) +
            '<label class="checkline"><input type="checkbox" name="join" checked>加入当前产品集</label>',
        );
        return;
      }
      if (a === "runs") {
        const b = document.createElement("button");
        b.dataset.act = "runs";
        document.body.append(b);
        b.click();
        b.remove();
        return;
      }
      for (const handler of Object.values(S.handlers))
        if (handler(a, el)) return;
    },
    true,
  );
  window.addEventListener(
    "submit",
    (ev) => {
      const kind = ev.target.dataset.suiteForm;
      if (!kind) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const form = ev.target,
        data = new FormData(form);
      if (
        (M.s.offline &&
          ![
            "runtime-save",
            "source-save",
            "proxy-save",
            "product-feedback",
            "logout",
          ].includes(kind)) ||
        M.s.fail
      ) {
        M.s.fail = false;
        const error = form.querySelector("[data-error]");
        if (error) error.textContent = "提交失败，输入已保留。恢复连接后重试。";
        return;
      }
      if (kind === "idea-create") {
        const name = data.get("name").trim(),
          idea = data.get("idea").trim();
        if (!name || !idea) return;
        const p = {
          id: "p-" + Date.now(),
          name,
          idea,
          org: data.get("org"),
          members: [{ id: "me", name: "我", role: "所有者" }],
        };
        M.s.projects.push(p);
        if (data.get("join")) W.state().ids.push(p.id);
        W.context(p.id);
        const t = M.add("探索 " + name, true);
        M.msg(t, "user", idea);
        M.msg(t, "assistant", "先明确目标用户、核心问题和第一版范围。");
        state().project = p.id;
        state().route = "projects";
        state().projectTab = "idea";
        document.querySelector("#dialog").close();
        U.refresh();
        return;
      }
      S.forms[kind]?.(data, form);
    },
    true,
  );
})();
