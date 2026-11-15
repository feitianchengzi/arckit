(() => {
  const base = V.render,
    { e } = V,
    { action } = U;
  M.s.dock ??= {
    tab: "task",
    file: "",
    diff: "",
    collapsed: [],
    query: "",
    index: false,
    staged: [],
    scroll: {},
  };
  const query = new URLSearchParams(location.search);
  if (query.has("scenario") && M.s.appliedScenario !== query.get("scenario")) {
    U.scenario(query.get("scenario"));
    M.s.appliedScenario = query.get("scenario");
  }
  V.render = () => {
    const box = document.createElement("div");
    box.innerHTML = base();
    const s = M.s,
      t = M.current();
    const lab = box.querySelector(".lab");
    if (lab)
      lab.innerHTML =
        '<a href="scenarios.html">场景目录</a><span class="grow"></span><button data-act="tick">推进一轮</button><button data-act="lab">故障与重置</button>';
    if (t && s.screen === "chat") {
      const controls = box.querySelector(".header-execution");
      if (t.mode === "failed")
        controls.innerHTML =
          '<span class="pill">执行失败</span>' +
          action("retry-run", "检查后恢复");
      if (t.mode === "waiting")
        controls.innerHTML =
          '<span class="pill">等待外部条件</span>' +
          action("release-wait", "条件已恢复");
      if (t.mode === "queued")
        controls.innerHTML =
          '<span class="pill">等待执行位置</span>' +
          action("cancel-queue", "取消排队");
      if (t.mode === "accepted")
        controls.insertAdjacentHTML("beforeend", action("reopen", "重新打开"));
      if (t.archived) {
        controls.innerHTML =
          '<span class="pill">已归档</span>' + action("restore", "恢复工作");
        box
          .querySelectorAll(
            "[name=message],[aria-label=发送],[data-act=edit],[data-act=assign]",
          )
          .forEach((n) => (n.disabled = true));
      }
      const transcript = box.querySelector("#transcript");
      if (t.mode === "failed" || t.mode === "waiting")
        transcript.insertAdjacentHTML(
          "beforeend",
          `<div class="note">${e(t.failure || t.waitReason)}</div>`,
        );
      const detail = box.querySelector(".inspector-content");
      if (s.dock.tab === "task") {
        if (t.notes.length)
          detail.insertAdjacentHTML(
            "beforeend",
            `<section class="section"><h3>协作补充</h3>${t.notes.map((n) => `<p>${e(n.text)}</p>`).join("")}</section>`,
          );
        detail.insertAdjacentHTML(
          "beforeend",
          `<section class="section work-more">${action("history", "工作记录")}${!U.active(t) && t.mode !== "queued" ? action(t.archived ? "restore" : "archive", t.archived ? "恢复工作" : "归档工作") : ""}</section>`,
        );
      }
      if (t.runOwner && t.runOwner !== "我" && U.active(t)) {
        controls.innerHTML = `<span class="pill">${e(t.runOwner)} 正在执行</span>`;
      }
    }
    if (s.offline)
      box
        .querySelector(".alert")
        ?.insertAdjacentHTML("beforeend", action("reconnect", "重新连接"));
    if (s.loadError)
      box
        .querySelector(".workspace")
        .insertAdjacentHTML(
          "afterbegin",
          `<div class="alert" role="alert">刷新失败，当前显示上次读取的内容。${action("reconnect", "重新读取")}</div>`,
        );
    if (s.fileError && s.dock.tab === "files")
      box.querySelector(".inspector-content").innerHTML =
        `<div class="inspector-empty">文件读取失败，未显示旧内容。${action("reconnect", "重试读取")}</div>`;
    if (U.readonly()) {
      box
        .querySelector(".workspace")
        .insertAdjacentHTML(
          "afterbegin",
          '<div class="alert">你拥有此项目的查看权限。可浏览对话、工作和成果。</div>',
        );
      box
        .querySelectorAll(
          "[aria-label=发送],[data-act=start-auto],[data-act=auto],[data-act=edit],[data-act=assign],[data-project=invite],[data-project=create-work],[data-act=create]",
        )
        .forEach((n) => {
          n.disabled = true;
          n.title = "需要项目编辑权限";
        });
    }
    box
      .querySelector(".composer-footer small")
      ?.insertAdjacentHTML(
        "afterend",
        action(
          "settings",
          e(s.model || "Codex") + " · " + e(s.effort || "标准"),
          "quiet small",
        ),
      );
    // Keep task identity in title; model has one dedicated setting control.
    const label = box.querySelector(".composer-footer small");
    if (label)
      label.textContent =
        (t ? "#" + t.id : "新工作") +
        " · " +
        (t?.mode === "auto" ? "补充给 Auto" : "人工协作");
    box
      .querySelectorAll(".inspector-tabs [role=tab]")
      .forEach(
        (n) =>
          (n.tabIndex = n.getAttribute("aria-selected") === "true" ? 0 : -1),
      );
    return box.innerHTML;
  };
  document.addEventListener(
    "compositionstart",
    (ev) => (ev.target.dataset.composing = "true"),
  );
  document.addEventListener(
    "compositionend",
    (ev) => delete ev.target.dataset.composing,
  );
})();
