(() => {
  const { e, btn, field, select } = S,
    st = S.state(),
    draft = {};
  st.account ??= { loggedIn: true, identity: "glare@example.com" };
  st.settings = {
    theme: "light",
    chatModel: "gpt-6-astra",
    chatEffort: "high",
    autoModel: "gpt-6-astra",
    autoEffort: "high",
    authMode: "nebula",
    sourceEnabled: true,
    baseUrl: "https://api.example.invalid",
    service: "workshop",
    ...st.settings,
  };
  const sections = [
    ["account", "账户"],
    ["appearance", "外观"],
    ["runtime", "Codex Runtime"],
    ["source", "任务源"],
    ["network", "网络与代理"],
    ["workspace", "同步与运行"],
    ["feedback", "产品反馈"],
  ];
  const cfg = () => ({ ...S.state().settings, ...draft });
  const toggle = (label, name, on) =>
    `<label class="checkline"><input type="checkbox" name="${name}" ${on ? "checked" : ""}>${label}</label>`;
  const form = (kind, body, label = "保存") =>
    `<form data-suite-form="${kind}" data-settings-form>${body}<div class="suite-form-actions"><button class="primary">${label}</button></div><p data-error class="error" role="alert"></p></form>`;
  S.renderers.settings = () => {
    const s = S.state(),
      v = cfg(),
      tab = s.settingsTab,
      a = s.account;
    const left = `<h2>设置</h2>${sections.map(([k, n]) => btn("settings-tab", n, `data-id="${k}" class="suite-list-item ${tab === k ? "selected" : ""}"`)).join("")}`;
    let body = "",
      help = "设置保存在本机。";
    if (tab === "account") {
      body = `<section class="account-summary-card"><span class="avatar">G</span><div><h2>${a.loggedIn ? e(a.identity) : "登录 Workshop"}</h2><p>${a.loggedIn ? "已登录 · 项目与工作可同步" : "登录后恢复项目与团队。"}</p></div></section>${
        a.loggedIn
          ? btn("logout", "退出登录")
          : form(
              "login",
              select(
                "验证码类型",
                "authType",
                [
                  ["email", "邮箱"],
                  ["sms", "手机号"],
                ],
                v.authType || "email",
              ) +
                field("邮箱或手机号", "target", v.target || "") +
                field("验证码", "code", v.code || "") +
                btn(
                  "verification",
                  s.codeSent ? "重新获取验证码" : "获取验证码",
                ),
              "登录并同步",
            )
      }`;
      help = "验证码只用于当前登录。退出前会检查本机活动执行。";
    }
    if (tab === "appearance") {
      body = `<h2>外观</h2>${select(
        "主题",
        "theme",
        [
          ["system", "跟随系统"],
          ["light", "浅色"],
          ["dark", "深色"],
        ],
        v.theme,
      )}<p>立即生效，不提交其他配置草稿。</p>`;
      help = "系统减少动态效果偏好同样适用于列表标题滚动。";
    }
    if (tab === "runtime") {
      body = `<h2>Codex Runtime</h2>` + form("permissions-save", toggle("YOLO 模式", "yolo", v.yolo) + `<p>仅影响后续调用，应用业务确认仍然有效。</p>`, "保存执行权限")
        + form("chat-save", `<h3>Chat 默认值</h3><div class="field-grid">${field("Model", "chatModel", v.chatModel)}${field("Level", "chatEffort", v.chatEffort)}</div>`, "保存 Chat 默认值")
        + form("automation-save", `<h3>Automation 默认值</h3><div class="field-grid">${field("Model", "autoModel", v.autoModel)}${field("Level", "autoEffort", v.autoEffort)}</div>`, "保存 Automation 默认值")
        + btn("model-refresh", "刷新模型清单") + `<p>${e(s.modelNotice || "可手动填写 Model 与 Level。")}</p>`;
      help =
        "Chat 与 Automation 默认值独立。保存此分区不提交任务源或代理草稿。";
    }
    if (tab === "source") {
      body = form(
        "source-save",
        `<h2>高级任务源</h2>${toggle("启用任务源", "sourceEnabled", v.sourceEnabled)}${field("服务根地址", "baseUrl", v.baseUrl, "url")}${field("服务名", "service", v.service)}${select(
          "认证模式",
          "authMode",
          [
            ["nebula", "Workshop 登录"],
            ["bearer", "Bearer Token"],
            ["headers", "用户请求头"],
          ],
          v.authMode,
        )}${v.authMode === "bearer" ? field("访问令牌（留空保留已有配置）", "token", "", "password") : v.authMode === "headers" ? field("用户 ID", "userId", v.userId || "") + field("用户名", "username", v.username || "") + field("App ID", "appId", v.appId || "") + field("Session ID（留空保留）", "sessionId", "", "password") : ""}`,
        "保存任务源",
      );
      help =
        "令牌与 Session ID 不写入原型存储，只保留“已配置”标记。请勿填入真实凭据。";
    }
    if (tab === "network") {
      body = form(
        "proxy-save",
        `<h2>网络与代理</h2>${toggle("为 Codex 使用代理", "proxyEnabled", v.proxyEnabled)}${field("代理地址", "proxyUrl", v.proxyUrl || "", "url")}<p>仅影响后续启动的 Codex Runtime。</p>`,
        "保存代理",
      );
    }
    if (tab === "workspace") {
      body = `<h2>同步与运行</h2><p>最近同步：${e(s.syncedAt || "尚未同步")}</p>${btn("sync", "同步项目与工作", 'class="primary"')}<h3>当前执行</h3>${
        M.s.tasks
          .filter((t) =>
            [
              "auto",
              "queued",
              "pausing",
              "waiting",
              "decision",
              "failed",
              "paused",
            ].includes(t.mode),
          )
          .map(
            (t) =>
              `<div class="domain-row"><span>${e(t.title)}<small>${e(M.s.projects.find((p) => p.id === t.project)?.name)} · ${e(M.status(t))}</small></span>${btn("settings-run", "打开工作", `data-id="${t.id}"`)}</div>`,
          )
          .join("") || '<p class="muted">暂无活动执行</p>'
      }<p class="muted">项目本机参与资格在团队的项目连接中维护。</p>`;
      help = "保存与同步分开报告；同步失败不表示已保存配置丢失。";
    }
    if (tab === "feedback") {
      body = form(
        "product-feedback",
        `<h2>向 ArcOrbit 反馈</h2>${field("反馈标题", "title")}${S.area("问题或建议", "body")}`,
        "保存反馈草稿",
      );
      help =
        "这是 ArcOrbit 自身产品反馈，和项目用户反馈分开。原型只保存本地草稿，不发送。";
    }
    const right = `<small class="section-caption">${e(sections.find((x) => x[0] === tab)?.[1] || "设置")}</small><h3>生效范围</h3><p>${help}</p><section><h3>配置状态</h3><p>${e(s.settingsStatus || "尚无待处理错误")}</p><p>已有配置：${s.settings.tokenConfigured ? "访问令牌已配置" : "未设置令牌"}${s.settings.sessionConfigured ? " · Session 已配置" : ""}</p></section><section>${btn("settings-reconnect", "重新连接")}</section>`;
    return S.layout(
      left,
      S.header(
        sections.find((x) => x[0] === tab)?.[1] || "设置",
        "设置 / 本机与账户",
      ) + `<div class="suite-content settings-content">${body}</div>`,
      right,
    );
  };
  S.handlers.settings = (a, el) => {
    const s = S.state();
    if (a === "settings-tab") {
      s.settingsTab = el.dataset.id;
      U.refresh();
      return true;
    }
    if (a === "model-refresh") {
      s.modelNotice = M.s.offline
        ? "清单读取失败，可手动填写。"
        : "本地清单：gpt-6-astra · high / medium / low";
      U.refresh();
      return true;
    }
    if (a === "sync") {
      s.syncedAt = M.s.offline
        ? s.syncedAt
        : new Date().toLocaleTimeString("zh-CN");
      S.notice(
        M.s.offline ? "同步失败，已保存配置保留。" : "本地样本同步完成。",
      );
      return true;
    }
    if (a === "settings-reconnect") {
      M.s.offline = false;
      M.s.fail = false;
      S.notice("连接已恢复；不会启动 Auto。");
      return true;
    }
    if (a === "logout") {
      S.form(
        "退出登录",
        "logout",
        `<p>${M.s.tasks.some((t) => ["auto", "pausing"].includes(t.mode)) ? "当前存在活动执行；确认后暂停模拟执行，再退出。" : "确认退出当前账户？"}</p>`,
      );
      return true;
    }
    if (a === "verification") {
      const v = cfg();
      if (
        !v.target ||
        (v.authType === "sms"
          ? !/^\+?[\d -]{7,20}$/.test(v.target)
          : !/^.+@.+\..+$/.test(v.target))
      ) {
        S.notice("请输入有效邮箱或手机号。");
        return true;
      }
      if (s.codeSentAt && Date.now() - s.codeSentAt < 60000) {
        S.notice("请稍后再获取验证码。");
        return true;
      }
      s.codeSent = true;
      s.codeSentAt = Date.now();
      S.notice("演示验证码：123456。未发送真实验证码。");
      return true;
    }
    if (a === "settings-run") {
      const t = M.s.tasks.find((t) => t.id === el.dataset.id);
      W.context(t.project);
      M.s.selected = t.id;
      s.route = "chat";
      U.refresh();
      return true;
    }
    return false;
  };
  function save(d, keys) {
    for (const k of keys) {
      const value = d.get(k);
      S.state().settings[k] = [
        "yolo",
        "sourceEnabled",
        "proxyEnabled",
      ].includes(k)
        ? !!value
        : String(value || "");
      delete draft[k];
    }
  }
  for (const [kind, keys] of Object.entries({"permissions-save":["yolo"], "chat-save":["chatModel","chatEffort"], "automation-save":["autoModel","autoEffort"]})) {
    S.forms[kind] = (d, f) => {
      if (M.s.fail) { f.querySelector("[data-error]").textContent = "保存失败，草稿保留，请重试。"; return; }
      save(d, keys); S.notice("当前配置已保存，其他草稿保留，未触发同步。");
    };
  }
  S.forms["source-save"] = (d) => {
    save(d, [
      "sourceEnabled",
      "baseUrl",
      "service",
      "authMode",
      "userId",
      "username",
      "appId",
    ]);
    if (d.get("token")) S.state().settings.tokenConfigured = true;
    if (d.get("sessionId")) S.state().settings.sessionConfigured = true;
    delete draft.token;
    delete draft.sessionId;
    S.state().settingsStatus = "任务源配置已保存";
    S.notice(
      M.s.offline
        ? "任务源配置已保存，未触发同步。"
        : "任务源配置已保存，未触发同步。",
    );
  };
  S.forms["proxy-save"] = (d) => {
    save(d, ["proxyEnabled", "proxyUrl"]);
    S.notice(
      M.s.offline
        ? "代理设置已保存，后续启动生效。"
        : "代理设置已保存，后续启动生效。",
    );
  };
  S.forms.logout = () => {
    M.s.tasks
      .filter((t) => ["auto", "pausing", "queued"].includes(t.mode))
      .forEach((t) => (t.mode = "paused"));
    S.state().account.loggedIn = false;
    document.querySelector("#dialog").close();
    Object.keys(draft).forEach((k) => delete draft[k]);
    S.state().settingsTab = "account";
    S.notice("已退出演示账户，活动执行已暂停。");
  };
  S.forms.login = (d, f) => {
    const target = String(d.get("target") || "");
    if (
      d.get("authType") === "sms"
        ? !/^\+?[\d -]{7,20}$/.test(target)
        : !/^.+@.+\..+$/.test(target)
    ) {
      f.querySelector("[data-error]").textContent = "请输入有效邮箱或手机号。";
      return;
    }
    if (d.get("code") !== "123456") {
      f.querySelector("[data-error]").textContent = "验证码无效，请重试。";
      return;
    }
    S.state().account = { loggedIn: true, identity: d.get("target") };
    delete draft.code;
    S.notice("已登录并恢复本地样本。");
  };
  S.forms["product-feedback"] = (d) => {
    S.state().feedbackDraft = { title: d.get("title"), body: d.get("body") };
    S.notice("ArcOrbit 反馈草稿已保存，未发送。");
  };
  document.addEventListener("input", (ev) => {
    if (
      ev.target.closest("[data-settings-form]") ||
      ev.target.name === "theme"
    ) {
      draft[ev.target.name] =
        ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
    }
  });
  document.addEventListener("change", (ev) => {
    const n = ev.target;
    if (n.closest("[data-settings-form]"))
      draft[n.name] = n.type === "checkbox" ? n.checked : n.value;
    if (n.name === "authMode" && S.state().route === "settings") U.refresh();
    if (n.name === "theme" && S.state().route === "settings") {
      S.state().settings.theme = n.value;
      M.s.theme =
        n.value === "system"
          ? matchMedia("(prefers-color-scheme:dark)").matches
            ? "dark"
            : "light"
          : n.value;
      delete draft.theme;
      U.refresh();
    }
  });
})();
