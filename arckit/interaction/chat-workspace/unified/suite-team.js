(() => {
  const { e, btn, field, area, select } = S,
    st = S.state();
  st.orgs ??= [
    {
      id: "studio",
      name: "Arc Studio",
      description: "一起交付有价值的软件。",
      role: "owner",
      members: [
        { id: "me", name: "我", role: "owner", joined: "2026-08-01" },
        { id: "lin", name: "林悦", role: "admin", joined: "2026-08-12" },
        { id: "chen", name: "陈昊", role: "member", joined: "2026-09-02" },
        { id: "yan", name: "严青", role: "member", joined: "2026-09-21" },
      ],
    },
    {
      id: "partner",
      name: "协作实验室",
      description: "跨团队项目协作",
      role: "member",
      members: [
        { id: "me", name: "我", role: "member", joined: "2026-09-01" },
        { id: "external", name: "周远", role: "owner", joined: "2026-08-01" },
      ],
    },
  ];
  if (!st.governanceSeeded) {
    M.s.projects.forEach((p) => {
      p.org = p.id === "reading" ? "studio" : "personal";
      const me = p.members.find((m) => m.id === "me");
      if (me) me.role = "所有者";
    });
    st.governanceSeeded = true;
  }
  const labels = { owner: "所有者", admin: "管理员", member: "成员" };
  const org = () => S.state().orgs.find((o) => o.id === S.state().org);
  const projects = () =>
    M.s.projects.filter(
      (p) =>
        p.org === S.state().org ||
        (S.state().org === "personal" && (!p.org || p.org === "personal")),
    );
  const project = () =>
    M.s.projects.find((p) => p.id === S.state().teamProject) || projects()[0];
  const pRole = (p) => p?.members.find((m) => m.id === "me")?.role;
  const canManage = (p) => ["所有者", "管理员"].includes(pRole(p));
  const statusError = (text) => {
    S.notice(text);
    return true;
  };
  S.renderers.team = () => {
    const s = S.state(),
      o = org(),
      ps = projects().filter(
        (p) =>
          !o || o.role !== "member" || p.members.some((m) => m.id === "me"),
      ),
      p = project();
    const left = `<div class="suite-left-title"><h2>团队</h2>${btn("org-create", V.icon("plus"), 'aria-label="创建组织"')}</div><small class="section-caption">组织与项目归属</small>${s.orgs.map((x) => btn("org-select", `<strong>${e(x.name)}</strong><small>${labels[x.role]}</small>`, `data-id="${x.id}" class="suite-list-item ${s.org === x.id ? "selected" : ""}"`)).join("")}${btn("org-select", "个人与外部参与", 'data-id="personal" class="suite-list-item"')}<div class="suite-left-bottom">${btn("join", "使用邀请码加入")}</div>`;
    let body = "",
      right = "";
    if (s.teamTab === "overview") {
      body = `<h2>${e(o?.description || "个人拥有和外部参与的项目")}</h2><p>${o ? o.members.length + " 位成员 · " + ps.length + " 个项目" : ps.length + " 个项目"}${o?.role === "member" ? " · 仅显示我参与的项目" : ""}</p><h3>成员与项目关系</h3><div class="matrix-wrap"><table class="matrix"><thead><tr><th>成员</th>${ps.map((p) => `<th>${e(p.name)}</th>`).join("")}</tr></thead><tbody>${(o?.members || [{ id: "me", name: "我" }]).map((m) => `<tr><th>${e(m.name)}</th>${ps.map((p) => `<td>${e(p.members.find((x) => x.id === m.id)?.role || "—")}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="muted">关系矩阵仅展示已有关系。添加成员请进入具体项目。</p>`;
      right = `<h3>组织管理</h3>${o && ["owner", "admin"].includes(o.role) ? btn("org-edit", "编辑组织") + btn("org-invite", "生成组织邀请") : ""}${o ? btn("org-leave", "退出组织") : ""}${o?.role === "owner" ? btn("org-delete", "删除组织", 'class="danger-link"') : ""}<section><p>产品集不会裁剪组织治理范围。</p><p>${o?.role === "member" ? "当前只可查看自己参与的项目。" : "成员角色和项目权限分别校验。"}</p></section>`;
    }
    if (s.teamTab === "members") {
      const m = o?.members.find((m) => m.id === s.member) || o?.members[0];
      body = o
        ? `<h2>组织成员</h2><div class="domain-list">${o.members.map((x) => btn("member-select", `<span><strong>${e(x.name)}</strong><small>加入于 ${x.joined || "2026-10-12"}</small></span><span>${labels[x.role]}</span>`, `data-id="${x.id}" class="domain-row ${m?.id === x.id ? "selected" : ""}"`)).join("")}</div>`
        : '<div class="suite-empty">个人范围没有组织成员目录，请进入具体项目管理成员。</div>';
      right = m
        ? `<h2>${e(m.name)}</h2><p>${labels[m.role]} · ${e(m.joined || "今天")}</p><h3>已有项目关系</h3>${
            ps
              .filter((p) => p.members.some((x) => x.id === m.id))
              .map((p) => {
                const rel = p.members.find((x) => x.id === m.id);
                return `<section><strong>${e(p.name)}</strong><p>${e(rel.role)} · ${e(rel.duty || "未填写职责")}${rel.external ? " · 外部成员" : ""}</p>${btn("team-project-select", "查看项目", `data-id="${p.id}"`)}</section>`;
              })
              .join("") || "<p>尚未参与项目</p>"
          }${m.role !== "owner" && o.role === "owner" ? btn("org-role", "修改组织角色", `data-id="${m.id}"`) : ""}${m.role !== "owner" && ["owner", "admin"].includes(o.role) ? btn("org-remove", "移除成员", `data-id="${m.id}"`) : ""}`
        : "<p>选择组织查看成员。</p>";
    }
    if (s.teamTab === "projects") {
      body = `<div class="row between"><h2>${o?.role === "member" ? "我参与的项目" : "项目目录"}</h2>${btn("new-project", "新建项目", 'class="primary"')}</div>${ps.map((x) => btn("team-project-select", `<span><strong>${e(x.name)}</strong><small>${x.external ? "外部参与" : e(o?.name || "个人项目")} · 我的角色 ${e(pRole(x) || "非成员")}</small></span>→`, `data-id="${x.id}" class="domain-row ${p?.id === x.id ? "selected" : ""}"`)).join("") || '<p class="muted">此范围没有可访问项目</p>'}`;
      right =
        p && ps.includes(p)
          ? `<h2>${e(p.name)}</h2><p>归属：${e(o?.name || "个人项目")}（创建后不可修改）</p><p>${e(p.git || "未配置 Git URL")}</p>${canManage(p) ? btn("team-project-edit", "编辑项目") + btn("project-invite", "生成项目邀请") : ""}<section><h3>项目成员</h3>${p.members.map((m) => `<div class="compact-member"><span>${e(m.name)}<small>${e(m.role)} · ${e(m.duty || "未填写职责")}</small></span>${m.role !== "所有者" && pRole(p) === "所有者" ? btn("project-member-edit", "管理", `data-id="${m.id}"`) : ""}${m.role !== "所有者" && canManage(p) ? btn("project-member-remove", "移出", `data-id="${m.id}"`) : ""}</div>`).join("")}${o && canManage(p) ? btn("direct-add", "从组织添加成员") : ""}</section><section><h3>本机连接</h3><p>${e(p.directory || "未绑定本地目录")}</p>${pRole(p) ? btn("binding", "绑定 / 解除目录") : ""}<label class="checkline"><input type="checkbox" data-team-connection="workset" ${W.state().ids.includes(p.id) ? "checked" : ""}>加入产品集</label><label class="checkline"><input type="checkbox" data-team-connection="auto" ${p.participation ? "checked" : ""} ${canManage(p) ? "" : "disabled"}>允许本机 Auto 参与</label><small>三个连接独立，不互相授权。</small></section>${pRole(p) === "所有者" ? btn("team-project-delete", "删除项目", 'class="danger-link"') : pRole(p) ? btn("project-leave", "退出项目") : ""}`
          : "<p>选择项目查看成员、邀请和推进连接。</p>";
    }
    return S.layout(
      left,
      S.header(
        o?.name || "个人与外部参与",
        "团队 / Organization",
        btn("team-refresh", "刷新"),
      ) +
        S.tabs(
          [
            ["overview", "概览"],
            ["members", "成员"],
            ["projects", "项目"],
          ],
          s.teamTab,
          "team-tab",
        ) +
        `<div class="suite-content">${body}</div>`,
      right,
    );
  };
  function invitation(kind) {
    const o = org(),
      p = project();
    S.form(
      kind === "org" ? "生成组织邀请" : "生成项目邀请",
      "invitation",
      `<input type="hidden" name="kind" value="${kind}"><p>${e(kind === "org" ? o.name : p.name)}</p>` +
        select(
          "角色",
          "role",
          [
            ["member", "成员"],
            ["admin", "管理员"],
          ],
          "member",
        ) +
        field("有效小时", "hours", "72", "number") +
        field("最大使用次数", "max", "5", "number"),
    );
  }
  S.handlers.team = (a, el) => {
    const s = S.state(),
      o = org(),
      p = project();
    if (a === "copy-invite") {
      const text = document.querySelector("[aria-label=邀请内容]");
      text.value = el.dataset.copy;
      text.select();
      const ok = document.execCommand("copy");
      el.textContent = ok ? "已复制" : "已选中，请复制";
      return true;
    }
    if (a === "org-select") {
      s.org = el.dataset.id;
      s.teamProject = null;
      U.refresh();
      return true;
    }
    if (a === "team-tab") {
      s.teamTab = el.dataset.id;
      U.refresh();
      return true;
    }
    if (a === "member-select") {
      s.member = el.dataset.id;
      U.refresh();
      return true;
    }
    if (a === "team-project-select") {
      s.teamProject = el.dataset.id;
      s.teamTab = "projects";
      U.refresh();
      return true;
    }
    if (a === "team-refresh") {
      S.notice(
        M.s.offline
          ? "组织列表刷新失败，保留已读取内容。"
          : "组织、成员与项目已重新读取（本地样本）。",
      );
      return true;
    }
    if (a === "org-create") {
      S.form(
        "创建组织",
        "org-create",
        field("名称", "name") + area("说明", "description"),
      );
      return true;
    }
    if (a === "org-edit") {
      if (!["owner", "admin"].includes(o?.role))
        return statusError("需要组织管理员权限。");
      S.form(
        "编辑组织",
        "org-edit",
        field("名称", "name", o.name) +
          area("说明", "description", o.description),
      );
      return true;
    }
    if (a === "org-invite") {
      if (!["owner", "admin"].includes(o?.role))
        return statusError("需要组织管理员权限。");
      invitation("org");
      return true;
    }
    if (a === "project-invite") {
      if (!canManage(p)) return statusError("需要项目管理员权限。");
      invitation("project");
      return true;
    }
    if (a === "join") {
      S.form(
        "使用邀请码加入",
        "join",
        select(
          "加入类型",
          "kind",
          [
            ["org", "组织"],
            ["project", "项目"],
          ],
          "org",
        ) +
          field("邀请码", "code") +
          "<small>演示码：ARC-DEMO。无效或过期时保留输入。</small>",
      );
      return true;
    }
    if (a === "org-role") {
      if (o.role !== "owner") return statusError("只有所有者可以修改角色。");
      S.form(
        "修改组织角色",
        "org-role",
        `<input type="hidden" name="id" value="${el.dataset.id}">` +
          select(
            "角色",
            "role",
            [
              ["admin", "管理员"],
              ["member", "成员"],
            ],
            o.members.find((m) => m.id === el.dataset.id).role,
          ),
      );
      return true;
    }
    if (a === "org-remove") {
      if (!["owner", "admin"].includes(o.role))
        return statusError("需要管理员权限。");
      S.form(
        "移除组织成员",
        "org-remove",
        `<input type="hidden" name="id" value="${el.dataset.id}"><p>成员将失去该组织访问权限。项目关系以刷新结果为准。</p>`,
      );
      return true;
    }
    if (a === "org-delete") {
      if (o.role !== "owner") return statusError("只有所有者可以删除组织。");
      S.form(
        "删除组织",
        "org-delete",
        `<p>请先处理组织中的项目和协作关系。</p>${field("输入组织名称确认", "name")}`,
      );
      return true;
    }
    if (a === "org-leave") {
      S.form(
        "退出组织",
        "org-leave",
        `<p>${o.role === "owner" ? "所有者退出需要服务端处理所有权交接；原型不会自行指定继任者。" : "退出后将失去组织访问权限。"}</p>`,
      );
      return true;
    }
    if (a === "team-project-edit") {
      if (!canManage(p)) return statusError("需要项目管理权限。");
      S.form(
        "编辑项目",
        "team-project-edit",
        field("项目名称", "name", p.name) +
          field("Git URL", "git", p.git || "") +
          `<p>归属：${e(o?.name || "个人")}，不可修改。</p>`,
      );
      return true;
    }
    if (a === "direct-add") {
      if (!org() || !canManage(p))
        return statusError("需要该组织项目的管理员权限。");
      S.form(
        "从组织添加成员",
        "direct-add",
        `<p>${e(o.name)} / ${e(p.name)}</p><label>搜索组织成员<input data-member-search placeholder="输入姓名"></label><label>选择一位成员<select name="id">${o.members.map((m) => `<option value="${m.id}" ${p.members.some((x) => x.id === m.id) ? "disabled" : ""}>${e(m.name)}${p.members.some((x) => x.id === m.id) ? " · 已加入" : ""}</option>`).join("")}</select></label><p>新增角色固定为成员，不会生成邀请。</p>`,
      );
      return true;
    }
    if (a === "project-member-edit") {
      if (pRole(p) !== "所有者")
        return statusError("只有项目所有者可以修改成员角色。");
      const m = p.members.find((m) => m.id === el.dataset.id);
      S.form(
        "项目角色与职责",
        "project-member-edit",
        `<input type="hidden" name="id" value="${m.id}">` +
          select("角色", "role", ["管理员", "成员"], m.role) +
          field("职责", "duty", m.duty || ""),
      );
      return true;
    }
    if (a === "project-member-remove") {
      S.form(
        "移出项目成员",
        "project-member-remove",
        `<input type="hidden" name="id" value="${el.dataset.id}"><p>先交接活动工作，历史记录保留。</p>`,
      );
      return true;
    }
    if (a === "binding") {
      S.form(
        "本机目录绑定",
        "binding",
        field("目录路径（留空解除）", "directory", p.directory || "") +
          "<p>只修改你的本机连接，不授权 Auto。</p>",
      );
      return true;
    }
    if (a === "team-project-delete" || a === "project-leave") {
      S.form(
        a === "team-project-delete" ? "删除项目" : "退出项目",
        a,
        field("输入项目名称确认", "name") +
          "<p>活动执行和待交接工作存在时不能继续。</p>",
      );
      return true;
    }
    return false;
  };
  const finish = (text) => {
    document.querySelector("#dialog").close();
    S.notice(text);
  };
  S.forms["org-create"] = (d) => {
    const name = d.get("name").trim();
    if (!name) return;
    const o = {
      id: "org-" + Date.now(),
      name,
      description: d.get("description"),
      role: "owner",
      members: [{ id: "me", name: "我", role: "owner", joined: "2026-10-12" }],
    };
    S.state().orgs.push(o);
    S.state().org = o.id;
    finish("组织已创建。");
  };
  S.forms["org-edit"] = (d) => {
    org().name = d.get("name");
    org().description = d.get("description");
    finish("组织信息已保存。");
  };
  S.forms["org-role"] = (d) => {
    const m = org().members.find((m) => m.id === d.get("id"));
    if (org().role === "owner" && m.role !== "owner") m.role = d.get("role");
    finish("组织角色已更新。");
  };
  S.forms["org-remove"] = (d) => {
    org().members = org().members.filter(
      (m) => m.id !== d.get("id") || m.role === "owner",
    );
    finish("组织成员已移除，项目关系保留待核对。");
  };
  S.forms["org-delete"] = (d, f) => {
    if (projects().length) {
      f.querySelector("[data-error]").textContent =
        "组织仍有项目，请先处理项目归属和协作。";
      return;
    }
    if (d.get("name") !== org().name) return;
    S.state().orgs = S.state().orgs.filter((x) => x.id !== org().id);
    S.state().org = "personal";
    finish("组织已删除。");
  };
  S.forms["org-leave"] = (d, f) => {
    if (org().role === "owner") {
      f.querySelector("[data-error]").textContent =
        "需要服务端确认所有权交接，尚未退出。";
      return;
    }
    S.state().orgs = S.state().orgs.filter((x) => x.id !== org().id);
    S.state().org = "personal";
    finish("已退出组织。");
  };
  S.forms.invitation = (d) => {
    const name = d.get("kind") === "org" ? org().name : project().name;
    S.popup(
      "邀请已生成",
      `<h3>${e(name)}</h3><p>角色：${labels[d.get("role")]}</p><p>邀请码：<code>ARC-DEMO</code></p><p>链接：<code>https://example.invalid/join/ARC-DEMO</code></p><p>有效期 ${e(d.get("hours"))} 小时 · 使用 0/${e(d.get("max"))} 次</p><p>请立即保存并自行转发。邀请不绑定特定成员，不提供历史或撤销。</p>${btn("copy-invite", "复制邀请码", 'data-copy="ARC-DEMO"')}${btn("copy-invite", "复制链接", 'data-copy="https://example.invalid/join/ARC-DEMO"')}<textarea aria-label="邀请内容" readonly>ARC-DEMO\nhttps://example.invalid/join/ARC-DEMO</textarea><small>本地示例凭证，不可用于真实加入。</small>`,
    );
  };
  S.forms.join = (d, f) => {
    if (d.get("code") !== "ARC-DEMO") {
      f.querySelector("[data-error]").textContent =
        "邀请码无效或已过期，请核对后重试。";
      return;
    }
    finish("已核对加入结果：当前演示账户已在该范围内，无需重复加入。");
  };
  S.forms["team-project-edit"] = (d) => {
    project().name = d.get("name");
    project().git = d.get("git");
    finish("项目资料已保存，归属未改变。");
  };
  S.forms["direct-add"] = (d, f) => {
    const p = project(),
      m = org().members.find((m) => m.id === d.get("id"));
    if (!m || !canManage(p)) {
      f.querySelector("[data-error]").textContent =
        "请选一位有资格加入的成员。";
      return;
    }
    if (!p.members.some((x) => x.id === m.id))
      p.members.push({ id: m.id, name: m.name, role: "成员" });
    finish("成员已加入，关系矩阵已更新。");
  };
  S.forms["project-member-edit"] = (d) => {
    const m = project().members.find((m) => m.id === d.get("id"));
    m.role = d.get("role");
    m.duty = d.get("duty");
    finish("项目角色与职责已保存。");
  };
  S.forms["project-member-remove"] = (d, f) => {
    const p = project(),
      m = p.members.find((m) => m.id === d.get("id"));
    if (
      M.s.tasks.some(
        (t) =>
          t.project === p.id &&
          t.owner === m.name &&
          !["accepted", "done"].includes(t.mode),
      )
    ) {
      f.querySelector("[data-error]").textContent =
        "该成员仍有工作需要交接，请先在 Chat 中分配。";
      return;
    }
    p.members = p.members.filter((x) => x.id !== m.id);
    finish("项目成员已移出。");
  };
  S.forms.binding = (d) => {
    project().directory = d.get("directory");
    finish("本机目录配置已保存，未启用 Auto。");
  };
  for (const kind of ["team-project-delete", "project-leave"])
    S.forms[kind] = (d, f) => {
      const p = project();
      if (d.get("name") !== p.name) return;
      if (M.s.tasks.some((t) => t.project === p.id)) {
        f.querySelector("[data-error]").textContent =
          "项目仍有工作，请先完成交接。";
        return;
      }
      M.s.projects = M.s.projects.filter((x) => x.id !== p.id);
      W.state().ids = W.state().ids.filter((x) => x !== p.id);
      S.state().teamProject = null;
      if (M.s.project === p.id && M.s.projects[0])
        W.context(M.s.projects[0].id);
      finish(kind === "project-leave" ? "已退出项目。" : "项目已删除。");
    };
  document.addEventListener("input", (ev) => {
    if (ev.target.matches("[data-member-search]"))
      document
        .querySelectorAll("#dialog select[name=id] option")
        .forEach((n) => (n.hidden = !n.textContent.includes(ev.target.value)));
  });
  document.addEventListener("change", (ev) => {
    const kind = ev.target.dataset.teamConnection;
    if (!kind) return;
    const p = project();
    if (kind === "workset") {
      W.state().ids = ev.target.checked
        ? [...new Set([...W.state().ids, p.id])]
        : W.state().ids.filter((x) => x !== p.id);
    } else if (canManage(p)) p.participation = ev.target.checked;
    S.notice("本机连接已更新，其他连接保持不变。");
  });
})();
