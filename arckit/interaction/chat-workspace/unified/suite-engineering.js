(() => {
  const { e, btn } = S,
    st = S.state();
  const definitions = [
    ["using-arckit", "恢复项目上下文，推进同一件工作的有界循环。", true],
    ["arckit-development-ledger", "维护项目和 Case 的可信状态。"],
    ["arckit-interaction", "交互设计、原型探索与维护。"],
    ["arckit-spec", "产品行为和验收口径。"],
    ["arckit-tech", "架构、数据模型与技术方案。"],
    ["arckit-visual", "视觉规范、主题和组件。"],
    ["arckit-debug-diagnosis", "定位问题，收集证据并恢复。"],
    ["arcforge-on-demand", "显式调用按需能力入口。"],
  ];
  st.skills ??= definitions.map(([id, description, protectedCore]) => ({
    id,
    description,
    protected: !!protectedCore,
    modes: { chat: "direct", automation: "direct" },
    available: true,
  }));
  st.skillRevision ??= 1;
  S.renderers.engineering = () => {
    const s = S.state(),
      scene = s.engScene,
      skill = s.skills.find((x) => x.id === s.engSelected) || s.skills[0],
      names = {
        direct: "直接发现",
        "on-demand": "按需使用",
        disabled: "已停用",
      },
      rows = s.skills.filter(
        (x) =>
          (x.id + " " + x.description)
            .toLowerCase()
            .includes(s.engQuery.toLowerCase()) &&
          (!s.engFilter || x.modes[scene] === s.engFilter),
      );
    const left = `<h2>工程</h2><small class="section-caption">Agent 使用场景</small>${[
      ["chat", "Chat"],
      ["automation", "Automation"],
    ]
      .map(([k, n]) =>
        btn(
          "eng-scene",
          `<strong>${n}</strong><small>${k === "chat" ? "下一条消息生效" : "下一次 Run 生效"}</small>`,
          `data-id="${k}" class="suite-list-item ${scene === k ? "selected" : ""}"`,
        ),
      )
      .join(
        "",
      )}<section><h3>内置能力</h3><p class="muted">只管理 ArcOrbit 随包 Skills。自行安装的能力继续由 Codex 管理。</p></section>`;
    const controls = `<div class="suite-toolbar"><input data-eng-query aria-label="搜索内置 Skill" placeholder="搜索名称或说明" value="${e(s.engQuery)}"><select data-eng-filter aria-label="使用状态">${[["", "全部状态"], ...Object.entries(names)].map(([k, n]) => `<option value="${k}" ${s.engFilter === k ? "selected" : ""}>${n}</option>`).join("")}</select>${btn("eng-refresh", "刷新")}${btn("eng-reset", "恢复默认")}</div>`;
    const main =
      S.header(
        "内置 Skills",
        "工程 / " + (scene === "chat" ? "Chat" : "Automation"),
      ) +
      `<div class="suite-content">${controls}<div class="engineering-counts"><span>总数 ${s.skills.length}</span>${Object.entries(
        names,
      )
        .map(
          ([k, n]) =>
            `<span>${n} ${s.skills.filter((x) => x.modes[scene] === k).length}</span>`,
        )
        .join("")}</div><div class="domain-list">${
        rows
          .map(
            (x) =>
              `<article class="engineering-row"><button data-suite="eng-select" data-id="${x.id}" class="skill-name"><strong>${e(x.id)}</strong><small>${e(x.description)}</small></button><span class="pill">${x.available ? "已安装" : "需修复"}</span><select data-skill-mode="${x.id}" aria-label="${x.id} 使用方式" ${x.protected && scene === "automation" ? "disabled" : ""}>${Object.entries(
                names,
              )
                .filter(
                  ([k]) => k !== "on-demand" || x.id !== "arcforge-on-demand",
                )
                .map(
                  ([k, n]) =>
                    `<option value="${k}" ${x.modes[scene] === k ? "selected" : ""}>${n}</option>`,
                )
                .join("")}</select></article>`,
          )
          .join("") ||
        `<div class="suite-empty">没有匹配的内置 Skill。${btn("eng-clear", "清除筛选")}</div>`
      }</div><p class="muted">配置版本 ${s.skillRevision} · 已安装内容 · 显示 ${rows.length} / ${s.skills.length}</p></div>`;
    const right = `<small class="section-caption">能力详情</small><h2>${e(skill.id)}</h2><p>${e(skill.description)}</p><section><h3>${skill.protected ? "官方核心" : "使用方式"}</h3><p>${e(names[skill.modes[scene]])}</p>${skill.protected && scene === "automation" ? "<p>Automation 必需，使用方式锁定。</p>" : ""}<p>${scene === "chat" ? "下一条 Chat 消息采用新配置。" : "下一次 Automation Run 采用新配置；当前运行保持启动时配置。"}</p></section><details><summary>安装路径</summary><code class="break">~/.arcorbit/builtin/${e(skill.id)}/SKILL.md</code></details><section>${btn("eng-environment", "检查安装环境")}</section>`;
    return S.layout(left, main, right);
  };
  S.handlers.engineering = (a, el) => {
    const s = S.state();
    if (a === "eng-scene") {
      s.engScene = el.dataset.id;
      U.refresh();
      return true;
    }
    if (a === "eng-select") {
      s.engSelected = el.dataset.id;
      U.refresh();
      return true;
    }
    if (a === "eng-clear") {
      s.engQuery = "";
      s.engFilter = "";
      U.refresh();
      return true;
    }
    if (a === "eng-refresh") {
      M.s.conflict = false;
      S.notice(
        M.s.offline ? "读取失败，保留上次列表。" : "已重新读取内置集合。",
      );
      return true;
    }
    if (a === "eng-reset") {
      S.form(
        "恢复当前场景默认值",
        "eng-reset",
        `<p>仅重置 ${s.engScene === "chat" ? "Chat" : "Automation"} 的内置 Skills，不影响另一场景。</p>`,
      );
      return true;
    }
    if (a === "eng-environment") {
      S.state().route = "settings";
      S.state().settingsTab = "runtime";
      U.refresh();
      return true;
    }
    return false;
  };
  S.forms["eng-reset"] = () => {
    S.state().skills.forEach((x) => (x.modes[S.state().engScene] = "direct"));
    S.state().skillRevision++;
    document.querySelector("#dialog").close();
    S.notice("当前场景已恢复默认。");
  };
  document.addEventListener("input", (ev) => {
    if (ev.target.matches("[data-eng-query]")) {
      const pos = ev.target.selectionStart;
      S.state().engQuery = ev.target.value;
      U.refresh();
      const n = document.querySelector("[data-eng-query]");
      n.focus();
      n.setSelectionRange(pos, pos);
    }
  });
  document.addEventListener("change", (ev) => {
    const s = S.state();
    if (ev.target.matches("[data-eng-filter]")) {
      s.engFilter = ev.target.value;
      U.refresh();
    }
    if (ev.target.dataset.skillMode) {
      const x = s.skills.find((x) => x.id === ev.target.dataset.skillMode);
      if (x.protected && s.engScene === "automation") return;
      if (M.s.offline || M.s.fail || M.s.conflict) {
        M.s.fail = false;
        S.notice(
          M.s.conflict
            ? "配置版本冲突，请刷新后重新选择。"
            : "保存失败，原配置保留，请重试。",
        );
        return;
      }
      x.modes[s.engScene] = ev.target.value;
      s.skillRevision++;
      S.notice(
        "已保存；" +
          (s.engScene === "chat" ? "下一条消息" : "下一次运行") +
          "生效。",
      );
    }
  });
})();
