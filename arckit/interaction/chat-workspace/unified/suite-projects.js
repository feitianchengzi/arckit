(() => {
  const { e, btn, field, area, select } = S;
  const sections = [
    ["overview", "概览"],
    ["idea", "Idea"],
    ["plan", "计划与工作"],
    ["results", "成果"],
    ["release", "发布"],
    ["operations", "运行"],
    ["feedback", "反馈"],
    ["collection", "产品集"],
  ];
  function init(p) {
    p.lifecycle ??= {
      version: "0.1.0",
      release: "草稿",
      checks: [],
      environment: "测试环境",
      signals: [],
      goal: p.idea,
    };
    return p.lifecycle;
  }
  S.renderers.projects = (base) => {
    const st = S.state(),
      p = S.project(),
      l = init(p),
      ts = M.s.tasks.filter((t) => t.project === p.id),
      fs = M.s.feedbacks.filter((f) => f.project === p.id);
    const left = `<div class="suite-left-title"><h2>项目</h2>${btn("new-project", V.icon("plus"), 'aria-label="新建项目"')}</div><small class="section-caption">当前产品集</small>${
      M.s.projects
        .filter((x) => W.state().ids.includes(x.id))
        .map((x) =>
          btn(
            "project-select",
            `<strong>${e(x.name)}</strong><small>${e(x.idea || "尚未填写 Idea")}</small>`,
            `data-id="${x.id}" class="suite-list-item ${x.id === p.id ? "selected" : ""}"`,
          ),
        )
        .join("") || '<p class="muted">暂无项目</p>'
    }<details class="all-projects"><summary>其他可访问项目</summary>${
      M.s.projects
        .filter((x) => !W.state().ids.includes(x.id))
        .map((x) =>
          btn(
            "project-select",
            e(x.name),
            `data-id="${x.id}" class="suite-list-item"`,
          ),
        )
        .join("") || '<p class="muted">没有其他项目</p>'
    }</details><div class="suite-left-bottom">${btn("project-tab", "管理产品集", 'data-id="collection"')}</div>`;
    let content = "";
    if (st.projectTab === "overview")
      content = `<section class="hero-summary"><small>项目目标</small><h2>${e(l.goal)}</h2><p>从想法到用户反馈，把每一步的工作、成果与决定留在项目里。</p>${btn("project-tab", "梳理下一步", 'data-id="plan" class="primary"')}</section><div class="suite-stats"><div><strong>${ts.length}</strong>工作</div><div><strong>${ts.filter((t) => t.mode === "done").length}</strong>待验收</div><div><strong>${fs.filter((f) => f.state !== "已解决").length}</strong>待处理反馈</div></div><h3>近期工作</h3>${workRows(ts.slice(0, 5))}<h3>生命周期</h3><div class="lifecycle-map">${sections
        .slice(1, 7)
        .map(([k, n]) => btn("project-tab", n, `data-id="${k}"`))
        .join("")}</div>`;
    if (st.projectTab === "idea")
      content = `<section class="content-card"><small>最初的想法</small><h2>${e(p.name)}</h2><p class="preserve">${e(p.idea)}</p>${btn("idea-edit", "完善 Idea")}</section><h3>探索与决定</h3>${workRows(ts.filter((t) => t.messages.length))}${btn("project-create", "围绕 Idea 发起讨论", 'data-kind="new" class="primary"')}`;
    if (st.projectTab === "plan")
      content = `<div class="row between"><h2>计划与工作</h2>${btn("project-create", "新建待办", 'data-kind="create" class="primary"')}</div>${workRows(ts)}<section class="content-card"><h3>当前目标</h3><p>${e(l.goal)}</p>${btn("goal-edit", "调整目标")}</section>`;
    if (st.projectTab === "results")
      content = `<h2>项目成果</h2>${
        ts
          .filter((t) => t.artifacts.length)
          .map(
            (t) =>
              `<article class="content-card"><small>#${t.id} · ${e(t.state)}</small><h3>${e(t.title)}</h3><p>${e(t.artifacts.join("、"))}</p>${btn("project-work", "打开工作并检查", `data-id="${t.id}"`)}</article>`,
          )
          .join("") ||
        '<div class="suite-empty">还没有成果。工作推进后，候选成果和验收记录会汇集在这里。</div>'
      }`;
    if (st.projectTab === "release")
      content = `<div class="row between"><h2>版本 ${e(l.version)}</h2><span class="pill">${e(l.release)}</span></div><p>准备版本内容，核对检查项，再交由发布流程执行。</p><form data-suite-form="release-save">${field("版本号", "version", l.version)}${area("发布说明", "notes", l.notes || "导出进度反馈与失败重试。")}<h3>发布前检查</h3>${["关联工作已验收", "回归检查已完成", "回滚方案已准备"].map((x, i) => `<label class="checkline"><input type="checkbox" name="checks" value="${i}" ${l.checks.includes(String(i)) ? "checked" : ""}>${x}</label>`).join("")}<button class="primary">保存发布准备</button><p data-error class="error"></p></form>${btn("release-preview", "预览发布交接")}<p class="muted">尚未连接发布服务。此处准备交接，不执行上线。</p>`;
    if (st.projectTab === "operations")
      content = `<div class="row between"><h2>运行与运维</h2>${btn("incident", "记录问题", 'class="primary"')}</div><section class="content-card"><h3>${e(l.environment)}</h3><p>未连接监控数据源</p>${btn("environment", "配置环境")}</section><h3>问题与改进</h3>${l.signals.map((x) => `<article class="content-card"><strong>${e(x.title)}</strong><p>${e(x.body)}</p>${x.work ? btn("project-work", "查看处理工作", `data-id="${x.work}"`) : btn("incident-work", "创建处理工作", `data-id="${x.id}"`)}</article>`).join("") || '<p class="muted">暂无记录。可手动记录线上问题，关联后续处理工作。</p>'}`;
    if (st.projectTab === "feedback") {
      const box = document.createElement("div");
      box.innerHTML = base;
      content =
        box.querySelector(".feedback-layout")?.outerHTML || "<p>暂无反馈</p>";
    }
    if (st.projectTab === "collection")
      content = `<h2>产品集</h2><p class="muted">组织日常关注的项目，不改变项目权限、工作归属或 Auto。</p><form data-suite-form="collection">${field("名称", "name", W.state().name)}${M.s.projects.map((x) => `<label class="checkline"><input type="checkbox" name="ids" value="${x.id}" ${W.state().ids.includes(x.id) ? "checked" : ""}>${e(x.name)}</label>`).join("")}<button class="primary">保存产品集</button><p data-error class="error"></p></form>`;
    const right = `<small class="section-caption">项目上下文</small><h2>${e(p.name)}</h2><p>${e(p.idea)}</p><section><h3>负责人</h3><p>${p.members.map((m) => e(m.name)).join("、")}</p>${btn("project-team", "管理团队")}</section><section><h3>本机连接</h3><p>${e(p.directory || (p.id === "reading" ? "已连接 · workspace" : "尚未绑定目录"))}</p>${btn("project-connection", "查看连接")}</section><section><h3>继续推进</h3>${btn("project-create", "发起对话", 'data-kind="new"')}${btn("project-runs", "查看 Auto 运行")}</section><section><small>发布与运行数据源尚未接入，准备记录保存在本地原型。</small></section>`;
    return S.layout(
      left,
      S.header(
        p.name,
        "项目 / 全生命周期",
        btn("project-create", "讨论这个项目", 'data-kind="new"'),
      ) +
        S.tabs(sections, st.projectTab, "project-tab") +
        `<div class="suite-content ${st.projectTab === "feedback" ? "embedded-feedback" : ""}">${content}</div>`,
      right,
    );
  };
  function workRows(ts) {
    return `<div class="domain-list">${ts.map((t) => btn("project-work", `<span><strong>${e(t.title)}</strong><small>#${t.id} · ${e(t.owner)}</small></span><span class="pill">${e(t.state)}</span>`, `data-id="${t.id}" class="domain-row"`)).join("") || '<p class="muted">暂无工作</p>'}</div>`;
  }
  S.handlers.projects = (a, el) => {
    const st = S.state(),
      p = S.project(),
      l = init(p);
    if (a === "project-select") {
      st.project = el.dataset.id;
      W.context(st.project);
      U.refresh();
      return true;
    }
    if (a === "project-tab") {
      st.projectTab = el.dataset.id;
      if (st.projectTab === "feedback") {
        W.context(p.id);
        M.s.feedbackSelected = M.s.feedbacks.find(
          (f) => f.project === p.id,
        )?.id;
      }
      U.refresh();
      return true;
    }
    if (a === "project-work") {
      const t = M.s.tasks.find((t) => t.id === el.dataset.id);
      W.context(t.project);
      M.s.selected = t.id;
      st.route = "chat";
      U.refresh();
      return true;
    }
    if (a === "project-create") {
      W.createInProject(p.id, el.dataset.kind);
      return true;
    }
    if (a === "project-runs") {
      document.querySelector("[data-suite-route=chat]").click();
      const n = document.createElement("button");
      n.dataset.suite = "runs";
      document.body.append(n);
      n.click();
      n.remove();
      return true;
    }
    if (a === "project-team") {
      st.route = "team";
      st.teamTab = "projects";
      st.teamProject = p.id;
      st.org = p.org || "personal";
      U.refresh();
      return true;
    }
    if (a === "project-connection") {
      st.route = "team";
      st.teamTab = "projects";
      st.teamProject = p.id;
      st.org = p.org || "personal";
      U.refresh();
      return true;
    }
    if (a === "idea-edit") {
      S.form("完善 Idea", "project-idea", area("想法与问题", "idea", p.idea));
      return true;
    }
    if (a === "goal-edit") {
      S.form("项目目标", "project-goal", area("当前目标", "goal", l.goal));
      return true;
    }
    if (a === "environment") {
      S.form(
        "环境配置",
        "environment",
        field("环境名称", "environment", l.environment) +
          field("访问地址", "url", l.url || "", "url"),
      );
      return true;
    }
    if (a === "incident") {
      S.form(
        "记录运行问题",
        "incident",
        field("问题标题", "title") + area("现象与影响", "body"),
      );
      return true;
    }
    if (a === "incident-work") {
      const x = l.signals.find((x) => String(x.id) === el.dataset.id);
      W.context(p.id);
      const t = M.add(x.title);
      t.goal = x.body;
      x.work = t.id;
      S.notice("已建立处理工作，未自动启动执行。");
      return true;
    }
    if (a === "release-preview") {
      S.popup(
        "发布交接",
        `<h3>${e(p.name)} · ${e(l.version)}</h3><p>${e(l.notes || "尚未填写发布说明")}</p><p>检查 ${l.checks.length}/3 项${l.checks.length === 3 ? "已齐备" : "，还需补齐"}。</p><p>未连接发布执行器，不会触发部署。</p>`,
      );
      return true;
    }
    return false;
  };
  const save = (name, fn) =>
    (S.forms[name] = (d) => {
      fn(S.project(), init(S.project()), d);
      document.querySelector("#dialog").close();
      S.notice("已保存到项目。");
    });
  save("project-idea", (p, l, d) => (p.idea = d.get("idea")));
  save("project-goal", (p, l, d) => (l.goal = d.get("goal")));
  save("environment", (p, l, d) => {
    l.environment = d.get("environment");
    l.url = d.get("url");
  });
  save("incident", (p, l, d) =>
    l.signals.push({
      id: Date.now(),
      title: d.get("title"),
      body: d.get("body"),
    }),
  );
  S.forms["release-save"] = (d) => {
    const l = init(S.project());
    l.version = d.get("version");
    l.notes = d.get("notes");
    l.checks = d.getAll("checks");
    l.release = l.checks.length === 3 ? "准备就绪" : "准备中";
    S.notice("已保存发布准备，尚未执行发布。");
  };
  S.forms.collection = (d) => {
    W.state().name = d.get("name").trim() || "我的产品集";
    W.state().ids = d.getAll("ids");
    W.state().scope = "all";
    S.notice("产品集已更新，项目与运行不受影响。");
  };
})();
