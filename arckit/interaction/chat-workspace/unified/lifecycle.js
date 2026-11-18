/* Local prototype behavior. No network, filesystem or Agent execution. */
(() => {
  const { e, b } = V;
  let returnFocus;
  const refresh = () => {
    M.save();
    document.dispatchEvent(new Event("dock:refresh"));
  };
  const project = () => M.s.projects.find((p) => p.id === M.s.project);
  const readonly = () => project()?.access === "viewer";
  const active = (t) =>
    ["auto", "pausing", "decision", "waiting"].includes(t.mode);
  function modal(title, body) {
    returnFocus = { ...document.activeElement?.dataset };
    const d = document.querySelector("#dialog");
    d.innerHTML = `<div class="row between"><h2 id="dialog-title">${e(title)}</h2>${action("close-life", "关闭", "quiet")}</div>${body}`;
    d.dataset.lifeModal="true";
    if (!d.open) d.showModal();
  }
  function restore() {
    const n=[...document.querySelectorAll('button')].find(n=>Object.entries(returnFocus||{}).every(([k,v])=>n.dataset[k]===v));
    (n||document.querySelector('[data-project=chat]'))?.focus({preventScroll:true});
  }
  document.querySelector('#dialog').addEventListener('cancel',()=>{
    const d=document.querySelector('#dialog');if(d.dataset.lifeModal){delete d.dataset.lifeModal;setTimeout(restore,30);}
  });
  function action(name, label, cls = "") {
    return `<button type="button" data-life="${name}" class="${cls}">${label}</button>`;
  }
  function advance() {
    if (M.s.offline) return;
    for (const t of M.s.tasks) {
      if (t.mode === "pausing") {
        t.mode = "paused";
        M.settle(t);
        t.events.push("停止已确认，执行权交还人工");
        M.msg(t, "assistant", "执行已停止。补充已保留，可调整后明确继续。");
      } else if (t.mode === "auto") {
        M.settle(t);
        t.progress++;
        if (t.failNext) {
          t.failNext = false;
          t.mode = "failed";
          t.failure = "执行环境连接中断。本轮记录与已形成的内容已保存。";
          M.msg(t, "assistant", t.failure);
        } else if (t.progress === 1 && t.questions.length) {
          t.mode = "decision";
          M.msg(t, "assistant", "遇到一个需要你确认的取舍，已暂停推进。");
        } else if (t.progress >= 3) {
          t.mode = "done";
          t.state = "待验收";
          t.artifacts = [t.title];
          t.checked = false;
          t.viewed = false;
          M.msg(
            t,
            "assistant",
            "本轮成果已准备好，请检查目标与完成标准。验收后再决定是否归档。",
          );
        } else
          M.msg(
            t,
            "assistant",
            "正在按已确认目标推进，整理候选成果与检查记录。",
          );
      }
    }
    for (const t of M.s.tasks.filter((t) => t.mode === "queued")) {
      if (
        !M.s.tasks.some(
          (x) => x.id !== t.id && x.project === t.project && active(x),
        )
      ) {
        t.mode = "auto";
        M.msg(
          t,
          "assistant",
          "当前项目的执行位置已空闲，开始已授权的本轮工作。",
        );
      }
    }
    refresh();
  }
  function scenario(name) {
    if (!name) return;
    const s = M.s,
      t = M.current();
    if (name === "offline") s.offline = true;
    if (name === "readonly") project().access = "viewer";
    if (name === "member") project().access = "member";
    if (name === "conflict") s.conflict = true;
    if (name === "failure") {
      t.mode = "auto";
      t.state = "进行中";
      t.failNext = true;
    }
    if (name === "waiting") {
      t.mode = "waiting";
      t.state = "进行中";
      t.waitReason = "需要项目管理员补充测试环境访问权限。";
    }
    if (name === "occupied") {
      t.mode = "auto";
      t.runOwner = "林悦";
      t.state = "进行中";
    }
    if (name === "empty") {
      s.tasks = s.tasks.filter((x) => x.project !== s.project);
      s.selected = null;
      s.feedbacks = s.feedbacks.filter((x) => x.project !== s.project);
    }
    if (name === "done") {
      t.mode = "done";
      t.state = "待验收";
      t.artifacts = [t.title];
    }
    if (name === "load-error") s.loadError = true;
    if (name === "file-error") {
      s.dock.tab = "files";
      s.fileError = true;
    }
    if (name === "long") {
      t.title =
        "为跨项目协作建立包含中文 English 与多种异常恢复路径的完整软件交付流程".repeat(
          3,
        );
      t.notes.push({ text: "长文本检查 ".repeat(100), source: "manual" });
    }
    M.save();
  }
  window.U = { refresh, advance, scenario, readonly, project, active, action };
  const mutations = new Set([
    "start-auto",
    "pause",
    "edit",
    "assign",
    "accept",
    "repair",
    "decide",
    "create",
    "dock-stage",
  ]);
  const teamActions = new Set(["invite", "member", "revoke"]);
  document.addEventListener(
    "click",
    (ev) => {
      const el = ev.target.closest("button");
      if (!el || el.disabled) return;
      const a = el.dataset.act,
        p = el.dataset.project,
        life = el.dataset.life,
        t = M.current();
      const block = (text) => {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        modal("操作暂不可用", `<p>${e(text)}</p>`);
      };
      if (
        readonly() &&
        (mutations.has(a) ||
          [
            "convert",
            "link",
            "ignore",
            "resolve",
            "create-work",
            ...teamActions,
          ].includes(p) ||
          [
            "reopen",
            "archive",
            "restore",
            "retry-run",
            "release-wait",
          ].includes(life))
      )
        return block("你拥有此项目的查看权限。请联系项目管理员调整权限。");
      if (teamActions.has(p) && project()?.access === "member")
        return block("团队管理需要项目管理员权限。");
      if (
        t?.runOwner &&
        t.runOwner !== "我" &&
        active(t) &&
        (mutations.has(a) || life === "retry-run")
      )
        return block(`${t.runOwner} 正在控制此工作，请先联系执行者交接。`);
      if (a === "start-auto") {
        if (M.s.offline) return;
        const other = M.s.tasks.find(
          (x) => x.id !== t.id && x.project === t.project && active(x),
        );
        if (other) {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          t.mode = "queued";
          t.state = "进行中";
          t.runOwner = "我";
          t.events.push("明确授权，等待同项目执行位置");
          document.querySelector("#dialog").close();
          refresh();
          return;
        }
      }
      if (a === "edit") M.s.editBase = t.revision;
      if (a === "inspect" && t?.project !== "reading") {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        t.viewed = true;
        modal(
          t.title + " · 成果",
          `<p>${e(t.goal)}</p><h3>本轮交付</h3><p>已整理目标、约束和下一步安排。</p><h3>完成标准</h3><ul>${t.criteria.map((c) => `<li>${e(c)}</li>`).join("") || "<li>需核对工作目标是否达成</li>"}</ul><label class="checks"><input type="checkbox" data-check ${t.checked ? "checked" : ""}>符合当前目标与完成标准</label>${b("accept", t.mode === "accepted" ? "已验收" : "确认验收", "primary", t.mode !== "done" || !t.checked ? "disabled" : "")}${t.mode === "done" ? b("repair", "提出调整") : ""}`,
        );
        return;
      }
      if (
        M.s.offline &&
        (["pause", "start-auto", "accept"].includes(a) ||
          ["ignore", "resolve", "revoke"].includes(p) ||
          ["confirm-archive", "restore", "reopen", "remove-member"].includes(
            life,
          ))
      )
        return block("连接已断开，状态未变更。恢复连接后重试。");
      if (
        ["remove-member"].includes(life) &&
        (readonly() || project().access === "member")
      )
        return block("成员管理需要项目管理员权限。");
      if (!life) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (life === "remove-member") {
        const member = project().members.find((m) => m.id === el.dataset.id);
        if (!member || member.id === "me") return;
        if (
          M.s.tasks.some(
            (x) =>
              x.project === M.s.project &&
              x.owner === member.name &&
              (active(x) || x.mode === "queued"),
          )
        )
          return modal(
            "先完成执行交接",
            "<p>该成员还有活动执行，请暂停并确认交接后再移出。</p>",
          );
        return modal(
          "移出 " + member.name,
          `<form data-life-form="remove-member"><input type="hidden" name="id" value="${e(member.id)}"><p>历史对话保留；此成员负责的工作需要转交。</p><label>转交给<select name="owner">${project()
            .members.filter((m) => m.id !== member.id)
            .map((m) => `<option>${e(m.name)}</option>`)
            .join(
              "",
            )}</select></label><button class="primary">转交并移出</button><p data-error class="error"></p></form>`,
        );
      }
      if(life === 'close-life') {const d=document.querySelector('#dialog');d.close();delete d.dataset.lifeModal;refresh();restore();return;}
      if (life === "settings")
        return modal(
          "工作环境",
          `<form data-life-form="settings"><label>模型<select name="model"><option>Codex</option><option>项目默认</option></select></label><label>推理强度<select name="effort">${["标准", "深入"].map((v) => `<option ${M.s.effort === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><p class="muted">设置用于后续回合，运行中的本轮不受影响。</p><button class="primary">保存</button></form>`,
        );
      if (life === "reconnect") {
        M.s.offline = false;
        M.s.loadError = false;
        M.s.fileError = false;
      }
      if (life === "reopen") {
        t.mode = "paused";
        t.state = "进行中";
        t.revision++;
        t.checked = false;
        t.viewed = false;
        t.progress = 0;
        t.events.push("人工重新打开，旧成果作为历史保留");
      }
      if (life === "archive")
        return modal(
          "归档这件工作？",
          `<p>对话、成果和来源会保留。可在待办列表的“已归档”筛选中恢复。</p>${action("confirm-archive", "确认归档", "primary")}`,
        );
      if (life === "confirm-archive") {
        if (active(t) || t.mode === "queued")
          return modal("先停止执行", "<p>请先暂停当前执行或取消排队。</p>");
        t.archived = true;
        M.s.selected = null;
        document.querySelector("#dialog").close();
      }
      if (life === "restore") t.archived = false;
      if (life === "cancel-queue") {
        t.mode = "paused";
        t.events.push("用户取消排队");
      }
      if (life === "retry-run" || life === "release-wait") {
        t.mode = "paused";
        t.events.push("已恢复条件，等待明确继续");
      }
      if (life === "history")
        return modal(
          "工作记录",
          t.events.map((x) => `<p>${e(x)}</p>`).join(""),
        );
      if (life === "latest") {
        const form = el.closest("form");
        form.querySelector("[data-conflict]").innerHTML =
          `<p>最新版本 v${t.revision}：${e(t.goal)}</p><p>你的草稿保留在上方，请合并后再次保存。</p>`;
        M.s.editBase = t.revision;
        M.s.conflict = false;
        M.save();
        return;
      }
      refresh();
      if (life === "reopen") document.querySelector("[name=message]")?.focus();
    },
    true,
  );
  document.addEventListener(
    "submit",
    (ev) => {
      const form = ev.target;
      const kind =
        form.dataset.form || form.dataset.projectForm || form.dataset.lifeForm;
      if (!kind) return;
      const error = (text) => {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        let node = form.querySelector("[data-error]");
        if (!node) {
          node = document.createElement("p");
          node.dataset.error = "";
          node.className = "error";
          form.append(node);
        }
        node.textContent = text;
      };
      if (readonly() && !["idea", "settings"].includes(kind))
        return error("此项目为只读，输入已保留。");
      if (["invite", "member"].includes(kind) && project().access === "member")
        return error("团队管理需要管理员权限。");
      if (kind === "message" && M.current()?.archived)
        return error("请先恢复已归档的工作。");
      if (
        kind === "edit" &&
        (M.s.conflict || M.s.editBase !== M.current().revision)
      ) {
        if (M.s.conflict) {
          M.current().revision++;
          M.s.conflict = false;
        }
        error("工作已有新版本，未覆盖其他成员的修改。");
        if (!form.querySelector("[data-conflict]"))
          form.insertAdjacentHTML(
            "beforeend",
            `<div data-conflict>${action("latest", "查看最新版本并合并")}</div>`,
          );
        M.save();
        return;
      }
      if (kind === "remove-member") {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        if (M.s.offline || M.s.fail) {
          M.s.fail = false;
          return error("提交失败，成员和待办未变更，请重试。");
        }
        if (readonly() || project().access === "member")
          return error("需要管理员权限。");
        const data = new FormData(form),
          member = project().members.find((m) => m.id === data.get("id"));
        if (!member || member.id === "me") return error("不能移出当前管理员。");
        M.s.tasks
          .filter((x) => x.project === M.s.project && x.owner === member.name)
          .forEach((x) => {
            x.owner = data.get("owner");
            x.events.push("成员移出，工作转交给 " + x.owner);
          });
        project().members = project().members.filter((m) => m.id !== member.id);
        document.querySelector("#dialog").close();
        refresh();
        return;
      }
      if (kind === "settings") {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        const d = new FormData(form);
        M.s.model = d.get("model");
        M.s.effort = d.get("effort");
        document.querySelector("#dialog").close();
        refresh();
      }
    },
    true,
  );
  document.addEventListener("keydown", (ev) => {
    if (
      ev.key === "Escape" &&
      M.s.nav &&
      !document.querySelector("#dialog").open
    ) {
      M.s.nav = false;
      refresh();
      document.querySelector("[data-act=nav]")?.focus();
    }
  });
  setInterval(() => {
    if (new URLSearchParams(location.search).has("preview")) return;
    // Rerender only when something advances; do not interrupt dialogs or input composition.
    if (
      document.querySelector("#dialog").open ||
      document.querySelector("[data-composing=true]")
    )
      return;
    if (M.s.tasks.some((t) => ["auto", "pausing", "queued"].includes(t.mode)))
      advance();
  }, 2400);
})();
