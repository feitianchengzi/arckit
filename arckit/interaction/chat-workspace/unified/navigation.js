(() => {
  const base = V.render,
    { e, icon } = V;
  const symbols = {
    chat: "M3 3h12v9H8l-4 3v-3H3z",
    feedback: "M9 3v6M9 12v1M2 2h14v14H2z",
    team: "M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M2 16v-2a5 5 0 0 1 10 0v2M12 3a3 3 0 0 1 0 6M14 11a4 4 0 0 1 2 5",
    switch: "M2 4h6l2 2h6v10H2z",
    theme: "M9 2a7 7 0 1 0 7 7A7 7 0 0 1 9 2",
  };
  const svg = (key) =>
    symbols[key]
      ? `<svg viewBox="0 0 18 18" aria-hidden="true"><path d="${symbols[key]}"/></svg>`
      : icon(key);
  const railButton = (attr, value, label, glyph, selected = false) =>
    `<button ${attr}="${value}" class="rail-button ${selected ? "selected" : ""}" aria-label="${label}" ${selected ? 'aria-current="page"' : ""}>${svg(glyph)}<span class="rail-tooltip" role="tooltip">${label}</span></button>`;
  V.render = () => {
    const s = M.s;
    // Compatibility with stored routes: Work is a list perspective, not a page.
    if (s.screen === "work") {
      s.screen = "chat";
      s.listMode = "work";
    }
    s.listMode ??= "chat";
    const box = document.createElement("div");
    box.innerHTML = base();
    const shell = box.querySelector(".shell"),
      sidebar = box.querySelector(".sidebar");
    shell.classList.add("unified-navigation");
    if (s.screen !== "chat") shell.classList.add("management-route");
    const rail = document.createElement("nav");
    rail.className = "app-rail";
    rail.setAttribute("aria-label", "主导航");
    rail.innerHTML = `<div class="rail-brand" aria-label="ArcOrbit">${icon("orbit")}</div>${railButton("data-project", "switch", "切换项目", "switch")}${railButton("data-project", "chat", "工作空间", "chat", s.screen === "chat")}${railButton("data-project", "feedback", "反馈", "feedback", s.screen === "feedback")}${railButton("data-project", "team", "团队", "team", s.screen === "team")}<div class="rail-spacer"></div>${railButton("data-project", "idea", "新建项目", "plus")}${railButton("data-act", "runs", "运行概况", "play")}${railButton("data-act", "theme", s.theme === "dark" ? "浅色外观" : "深色外观", "theme")}`;
    shell.prepend(rail);
    sidebar.querySelector(".brand")?.remove();
    sidebar.querySelector(".project-navigation")?.remove();
    sidebar.querySelector(".sidebar-foot")?.remove();
    sidebar.insertAdjacentHTML("afterbegin", `<button data-list-toggle class="list-panel-close" aria-label="关闭工作列表">${icon("close")}</button>`);
    const project = sidebar.querySelector(".project");
    project.insertAdjacentHTML(
      "afterend",
      `<div class="work-list-tabs" role="tablist" aria-label="工作列表视角">${[
        ["chat", "对话"],
        ["work", "待办"],
      ]
        .map(
          ([k, n]) =>
            `<button role="tab" data-list-mode="${k}" aria-selected="${s.listMode === k}" tabindex="${s.listMode === k ? 0 : -1}">${n}</button>`,
        )
        .join("")}</div>`,
    );
    const create = sidebar.querySelector(".create");
    create.innerHTML =
      s.listMode === "chat"
        ? `<button data-act="new" class="primary">${icon("plus")} 新对话</button>`
        : `<button data-act="create" class="primary" ${U.readonly() ? "disabled" : ""}>${icon("plus")} 新建待办</button>`;
    const filter = sidebar.querySelector(".filters");
    filter.innerHTML =
      s.listMode === "work"
        ? `<select aria-label="筛选待办" data-list-filter>${[
            ["all", "全部待办"],
            ["mine", "我负责"],
            ["auto", "Auto"],
            ["done", "待验收与已验收"],
            ["archived", "已归档"],
          ]
            .map(
              ([v, n]) =>
                `<option value="${v}" ${s.listFilter === v ? "selected" : ""}>${n}</option>`,
            )
            .join("")}</select>`
        : "";
    let tasks = s.tasks.filter(
      (t) => t.project === s.project && `${t.title} ${t.id}`.includes(s.search),
    );
    if (s.listMode === "chat")
      tasks = tasks
        .filter((t) => !t.archived && t.messages.length)
        .sort(
          (a, b) =>
            (b.lastActivity || Number(b.id)) - (a.lastActivity || Number(a.id)),
        );
    else
      tasks = tasks.filter(
        (t) =>
          (s.listFilter === "archived" ? t.archived : !t.archived) &&
          (!s.listFilter ||
            ["all", "archived"].includes(s.listFilter) ||
            (s.listFilter === "mine" && t.owner === "我") ||
            (s.listFilter === "auto" &&
              [
                "auto",
                "pausing",
                "queued",
                "decision",
                "waiting",
                "failed",
              ].includes(t.mode)) ||
            (s.listFilter === "done" && ["done", "accepted"].includes(t.mode))),
      );
    sidebar.querySelector(".worklist").innerHTML =
      tasks
        .map(
          (t) =>
            `<button class="workrow ${s.selected === t.id ? "selected" : ""}" data-act="select" data-id="${t.id}" aria-label="${e(t.title)}，${e(M.status(t))}" title="${e(t.title)}"><span class="marquee-window"><strong class="marquee-text">${e(t.title)}</strong></span><small><span>#${t.id} · ${e(t.owner)}</span><span>${e(t.archived ? "已归档" : M.status(t))}</span></small></button>`,
        )
        .join("") ||
      `<p class="muted list-empty">${s.listMode === "chat" ? "暂无匹配的对话" : "暂无匹配的待办"}</p>`;
    if (s.screen === "chat")
      box
        .querySelector(".top-actions")
        ?.insertAdjacentHTML(
          "afterbegin",
          `<button data-list-toggle aria-label="${s.listCollapsed ? "展开" : "收起"}工作列表" class="quiet list-toggle">${icon("menu")}</button>`,
        );
    if (s.listCollapsed) shell.classList.add("list-collapsed");
    return box.innerHTML;
  };
  const msg = M.msg;
  M.msg = (t, ...args) => {
    t.lastActivity = Date.now();
    return msg(t, ...args);
  };
  document.addEventListener("click", (ev) => {
    const mode = ev.target.closest("[data-list-mode]");
    if (mode) {
      M.s.listMode = mode.dataset.listMode;
      U.refresh();
      document.querySelector(`[data-list-mode="${M.s.listMode}"]`)?.focus();
    }
    if (ev.target.closest("[data-list-toggle]")) {
      if (innerWidth <= 760) {
        M.s.nav = !M.s.nav;
        M.s.listCollapsed = false;
      } else {
        M.s.listCollapsed = !M.s.listCollapsed;
        M.s.nav = false;
      }
      U.refresh();
    }
  });
  document.addEventListener("change", (ev) => {
    if (ev.target.matches("[data-list-filter]")) {
      M.s.listFilter = ev.target.value;
      U.refresh();
      document.querySelector("[data-list-filter]")?.focus();
    }
  });
  document.addEventListener("keydown", (ev) => {
    if (
      ev.target.matches("[data-list-mode]") &&
      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(ev.key)
    ) {
      ev.preventDefault();
      document
        .querySelector(
          `[data-list-mode="${ev.key === "Home" ? "chat" : ev.key === "End" ? "work" : M.s.listMode === "chat" ? "work" : "chat"}"]`,
        )
        .click();
    }
  });
  // Animate only the hovered/focused overflowing title. No duplicated text or perpetual movement.
  const moving = new WeakMap();
  const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion.addEventListener("change",()=>document.querySelectorAll(".workrow").forEach(stop));
  function start(row) {
    if (
      !row ||
      moving.has(row) ||
      reducedMotion.matches
    )
      return;
    const text = row.querySelector(".marquee-text"),
      frame = row.querySelector(".marquee-window");
    if (!text || !frame) return;
    const distance = text.scrollWidth - frame.clientWidth;
    if (distance <= 1) return;
    frame.classList.add("is-moving");
    row.dataset.fullTitle=row.title;row.removeAttribute("title");
    const travel = Math.max(1800, (distance / 32) * 1000),
      hold = 850,
      total = travel * 2 + hold * 2;
    moving.set(
      row,
      text.animate(
        [
          { transform: "translateX(0)", offset: 0 },
          { transform: "translateX(0)", offset: hold / total },
          {
            transform: `translateX(-${distance}px)`,
            offset: (hold + travel) / total,
          },
          {
            transform: `translateX(-${distance}px)`,
            offset: (hold * 2 + travel) / total,
          },
          { transform: "translateX(0)", offset: 1 },
        ],
        { duration: total, iterations: Infinity, easing: "linear" },
      ),
    );
  }
  function stop(row) {
    if (!row) return;
    moving.get(row)?.cancel();
    moving.delete(row);
    if(row.dataset.fullTitle){row.title=row.dataset.fullTitle;delete row.dataset.fullTitle;}
    row.querySelector(".marquee-window")?.classList.remove("is-moving");
  }
  document.addEventListener("pointerover", (ev) => {
    const row = ev.target.closest(".workrow");
    if (row && !row.contains(ev.relatedTarget)) start(row);
  });
  document.addEventListener("pointerout", (ev) => {
    const row = ev.target.closest(".workrow");
    if (row && !row.contains(ev.relatedTarget)) stop(row);
  });
  document.addEventListener("focusin", (ev) =>
    start(ev.target.closest(".workrow")),
  );
  document.addEventListener("focusout", (ev) =>
    stop(ev.target.closest(".workrow")),
  );
})();
