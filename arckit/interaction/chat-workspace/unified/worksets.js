(() => {
  const { e, icon } = V;
  function state() {
    M.s.workset ??= {
      name: "研发产品集",
      ids: M.s.projects.map((p) => p.id),
      scope: "all",
      collapsed: [],
    };
    return M.s.workset;
  }
  const ids = () => {
    const w = state();
    return w.scope === "all" ? w.ids : w.ids.filter((id) => id === w.scope);
  };
  function context(id) {
    const s = M.s;
    if (id === s.project) return;
    s.projectContexts[s.project] = {
      ...s.projectContexts[s.project],
      selected: s.selected,
      newDraft: s.newDraft,
      dock: structuredClone(s.dock),
    };
    const c = s.projectContexts[id];
    s.project = id;
    s.selected =
      c?.selected || s.tasks.find((t) => t.project === id)?.id || null;
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
  }
  const base = V.render;
  V.render = () => {
    const w = state(),
      box = document.createElement("div");
    box.innerHTML = base();
    const scope =
      w.scope === "all"
        ? "全部项目"
        : M.s.projects.find((p) => p.id === w.scope)?.name || "全部项目";
    box.querySelector(".sidebar .project").innerHTML =
      `<button data-workset="open" class="project-switch"><span><strong>${e(w.name)}</strong><small>${e(scope)} · ${w.ids.length} 个项目</small></span>⌄</button>`;
    const rail = box.querySelector(".app-rail [data-project=switch]");
    rail.removeAttribute("data-project");
    rail.dataset.workset = "open";
    rail.setAttribute("aria-label", "产品集");
    rail.querySelector(".rail-tooltip").textContent = "产品集";
    const creation=box.querySelector('.create button');
    if(creation){creation.disabled=!M.s.projects.some(p=>ids().includes(p.id)&&p.access!=='viewer');if(!creation.disabled)creation.removeAttribute('title');}
    const list = box.querySelector(".worklist");
    list.innerHTML =
      ids()
        .map((id) => {
          const p = M.s.projects.find((p) => p.id === id);
          if (!p) return "";
          let ts = M.s.tasks.filter(
            (t) =>
              t.project === id && `${t.title} ${t.id}`.includes(M.s.search),
          );
          if (M.s.listMode === "chat")
            ts = ts
              .filter((t) => !t.archived && t.messages.length)
              .sort(
                (a, b) =>
                  (b.lastActivity || Number(b.id)) -
                  (a.lastActivity || Number(a.id)),
              );
          else
            ts = ts.filter(
              (t) =>
                (M.s.listFilter === "archived" ? t.archived : !t.archived) &&
                (!M.s.listFilter ||
                  ["all", "archived"].includes(M.s.listFilter) ||
                  (M.s.listFilter === "mine" && t.owner === "我") ||
                  (M.s.listFilter === "auto" &&
                    [
                      "auto",
                      "queued",
                      "pausing",
                      "waiting",
                      "decision",
                      "failed",
                    ].includes(t.mode)) ||
                  (M.s.listFilter === "done" &&
                    ["done", "accepted"].includes(t.mode))),
            );
          const collapsed = w.collapsed.includes(id);
          return `<section class="project-work-group"><button class="project-group-heading" data-workset="collapse" data-id="${e(id)}" aria-expanded="${!collapsed}"><span>${collapsed ? "›" : "⌄"} ${e(p.name)}</span><small>${ts.length}</small></button>${collapsed ? "" : ts.map((t) => `<button class="workrow ${M.s.selected === t.id ? "selected" : ""}" data-act="select" data-id="${t.id}" title="${e(t.title)}" aria-label="${e(p.name + " · " + t.title)}"><span class="marquee-window"><strong class="marquee-text">${e(t.title)}</strong></span><small><span>#${t.id} · ${e(t.owner)}</span><span>${e(t.archived ? "已归档" : M.status(t))}</span></small></button>`).join("") || '<p class="group-empty">暂无匹配内容</p>'}</section>`;
        })
        .join("") ||
      `<div class="list-empty"><p>产品集还没有项目</p><button data-workset="manage">选择项目</button></div>`;
    if (
      M.s.screen === "chat" &&
      M.current() &&
      !ids().includes(M.current().project)
    )
      box
        .querySelector(".workspace")
        .insertAdjacentHTML(
          "afterbegin",
          `<div class="scope-notice">当前工作不在列表范围内${button("reveal", w.ids.includes(M.current().project) ? "查看所属项目" : "加入产品集并查看")}</div>`,
        );
    if (M.s.screen === "feedback") {
      box.querySelector(".page-top .meta").textContent = w.name + " · " + scope;
      box
        .querySelector(".page-top")
        .insertAdjacentHTML("beforeend", button("open", "查看范围"));
    }
    if (M.s.screen === "team")
      box
        .querySelector(".page-top")
        .insertAdjacentHTML("beforeend", button("team", "选择项目"));
    return box.innerHTML;
  };
  function button(a, text, attrs = "") {
    return `<button data-workset="${a}" ${attrs}>${text}</button>`;
  }
  let returnEl,
    pendingAction = null,
    bypass = false;
  function close() {
    document.querySelector("#workset-panel")?.remove();
    returnEl?.focus();
  }
  function panel(mode = "browse") {
    close();
    returnEl = document.activeElement;
    const w = state();
    const d = document.createElement("dialog");
    d.id = "workset-panel";
    d.setAttribute("aria-labelledby", "workset-title");
    d.innerHTML = `<header><div><small>${mode === "team" ? "项目团队" : "工作空间"}</small><h2 id="workset-title">${mode === "manage" ? "管理产品集" : e(w.name)}</h2></div>${button("close", icon("close"), 'aria-label="关闭产品集"')}</header>${
      mode === "manage"
        ? `<form data-workset-form="manage"><label>产品集名称<input name="name" value="${e(w.name)}" required></label><p class="muted">只改变查看范围，不影响项目权限或 Auto。</p><div class="set-projects">${M.s.projects.map((p) => `<label class="set-member"><input type="checkbox" name="project" value="${e(p.id)}" ${w.ids.includes(p.id) ? "checked" : ""}><span>${e(p.name)}</span></label>`).join("")}</div><footer><button class="primary">保存产品集</button></footer></form>`
        : `<input class="set-search" aria-label="搜索产品集项目" placeholder="搜索项目…">${mode === "team" ? "" : button("scope", "全部项目", `data-id="all" class="set-scope ${w.scope === "all" ? "selected" : ""}"`)}<div class="set-projects">${
            (mode === "team"
              ? M.s.projects
              : M.s.projects.filter((p) => w.ids.includes(p.id))
            )
              .map((p) => {
                const ts = M.s.tasks.filter((t) => t.project === p.id),
                  needs = ts.filter((t) =>
                    ["decision", "done", "failed"].includes(t.mode),
                  ).length,
                  runs = ts.filter((t) =>
                    ["auto", "pausing"].includes(t.mode),
                  ).length;
                return button(
                  mode === "team" ? "team-select" : "scope",
                  `<strong>${e(p.name)}</strong><small>${needs ? needs + " 待处理 · " : ""}${runs ? runs + " 运行中" : "暂无运行"}</small>`,
                  `data-id="${e(p.id)}" data-name="${e(p.name)}" class="set-project ${w.scope === p.id ? "selected" : ""}"`,
                );
              })
              .join("") || '<p class="muted">产品集为空，先选择关注的项目。</p>'
          }</div><p class="set-no-results" hidden>没有匹配的项目</p><footer>${button("manage", "管理产品集")}${button("idea", "新建项目")}</footer>`
    }`;
    document.body.append(d);
    d.addEventListener("cancel", () => {
      setTimeout(close, 0);
    });
    d.addEventListener("click", (ev) => {
      if (ev.target === d) {
        const r = d.getBoundingClientRect();
        if (
          ev.clientX < r.left ||
          ev.clientX > r.right ||
          ev.clientY < r.top ||
          ev.clientY > r.bottom
        )
          close();
      }
    });
    d.showModal();
  }
  function chooseTarget(action) {
    pendingAction = action;
    close();
    returnEl = document.activeElement;
    const d = document.createElement("dialog");
    d.id = "workset-panel";
    const options = M.s.projects.filter(
      (p) => state().ids.includes(p.id) && p.access !== "viewer",
    );
    d.innerHTML = `<header><h2>选择工作所属项目</h2>${button("close", icon("close"), 'aria-label="关闭产品集"')}</header><form data-workset-form="target"><label>项目<select name="project" required>${options.map((p) => `<option value="${e(p.id)}" ${p.id === M.s.project ? "selected" : ""}>${e(p.name)}</option>`).join("")}</select></label><p class="muted">工作创建后保持此归属，查看范围不受影响。</p><button class="primary" ${options.length ? "" : "disabled"}>继续${action === "new" ? "对话" : "创建待办"}</button>${options.length ? "" : "<p>产品集中没有可创建工作的项目。</p>"}</form>`;
    document.body.append(d);
    d.addEventListener("cancel", () => setTimeout(close, 0));
    d.showModal();
  }
  window.W = { ids, context, state, createInProject(id,action){
    context(id);M.s.suite.route='chat';M.s.screen='chat';M.s.listMode=action==='new'?'chat':'work';U.refresh();
    const b=document.createElement('button');b.dataset.act=action;document.body.append(b);bypass=true;b.click();bypass=false;b.remove();
  }};
  // Window capture runs before existing project handlers, preserving their business flows.
  window.addEventListener(
    "click",
    (ev) => {
      const node = ev.target.closest("button");
      if (!node || node.disabled) return;
      const act = node.dataset.act,
        pr = node.dataset.project;
      if (pr === "team" && M.s.screen !== "team")
        M.s.workBeforeTeam = { project: M.s.project, selected: M.s.selected };
      if (pr === "chat" && M.s.screen === "team" && M.s.workBeforeTeam) {
        context(M.s.workBeforeTeam.project);
        M.s.selected = M.s.workBeforeTeam.selected;
      }
      if (act === "select") {
        const t = M.s.tasks.find((t) => t.id === node.dataset.id);
        if (t) context(t.project);
      }
      if (pr === "feedback" && node.dataset.id) {
        const f = M.s.feedbacks.find((f) => f.id === node.dataset.id);
        if (f) context(f.project);
      }
      if (["new", "create"].includes(act) && !bypass) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        if (state().scope === "all") chooseTarget(act);
        else {
          context(state().scope);
          bypass = true;
          node.click();
          bypass = false;
        }
        return;
      }
      if (pr === "switch") {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        panel();
        return;
      }
      const a = node.dataset.workset;
      if (!a) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (a === "close") return close();
      if (a === "open") return panel();
      if (a === "manage") return panel("manage");
      if (a === "team") return panel("team");
      if (a === "collapse") {
        const w = state();
        w.collapsed = w.collapsed.includes(node.dataset.id)
          ? w.collapsed.filter((x) => x !== node.dataset.id)
          : [...w.collapsed, node.dataset.id];
        U.refresh();
        return;
      }
      if (a === "scope") {
        state().scope = node.dataset.id;
        close();
        U.refresh();
        return;
      }
      if (a === "reveal") {
        const id = M.current().project;
        if (!state().ids.includes(id)) state().ids.push(id);
        state().scope = id;
        U.refresh();
        return;
      }
      if (a === "team-select") {
        context(node.dataset.id);
        close();
        U.refresh();
        return;
      }
      if (a === "idea") {
        close();
        document.querySelector(".app-rail [data-project=idea]").click();
      }
    },
    true,
  );
  window.addEventListener("input", (ev) => {
    if (ev.target.matches(".set-search")) {
      const q = ev.target.value.toLowerCase();
      let n = 0;
      document.querySelectorAll("#workset-panel .set-project").forEach((el) => {
        el.hidden = !el.dataset.name.toLowerCase().includes(q);
        if (!el.hidden) n++;
      });
      document.querySelector(".set-no-results").hidden = n > 0;
    }
  });
  window.addEventListener(
    "submit",
    (ev) => {
      const kind = ev.target.dataset.worksetForm;
      if (!kind) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const data = new FormData(ev.target);
      if (kind === "manage") {
        state().name = data.get("name").trim() || "我的产品集";
        state().ids = data.getAll("project");
        if (!state().ids.includes(state().scope)) state().scope = "all";
        close();
        U.refresh();
      }
      if (kind === "target") {
        context(data.get("project"));
        const action = pendingAction;
        close();
        M.s.screen = "chat";
        M.s.listMode = action === "new" ? "chat" : "work";
        U.refresh();
        bypass = true;
        document.querySelector(`[data-act="${action}"]`).click();
        bypass = false;
      }
    },
    true,
  );
})();
