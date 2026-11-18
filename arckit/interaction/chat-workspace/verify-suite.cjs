const { app, BrowserWindow } = require("electron"),
  fs = require("fs"),
  path = require("path"),
  os = require("os");
const out =
  process.env.ARCORBIT_TEST_OUTPUT ||
  fs.mkdtempSync(path.join(os.tmpdir(), "arcorbit-suite-"));
fs.mkdirSync(out, { recursive: true });
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1512, height: 1050 }),
    errors = [],
    checks = [];
  w.webContents.on("console-message", (_, l, t) => {
    if (l >= 3) errors.push(t);
  });
  const js = async (s) => {
      try {
        return await w.webContents.executeJavaScript(s);
      } catch (e) {
        throw Error(s + "\n" + e.message);
      }
    },
    click = (s) =>
      js(
        `(()=>{const n=document.querySelector(${JSON.stringify(s)});if(!n||n.disabled)throw Error('Missing or disabled '+${JSON.stringify(s)});n.click()})()`,
      ),
    wait = () => new Promise((r) => setTimeout(r, 140)),
    check = async (s, n) => {
      if (!(await js(s))) throw Error(n);
      checks.push(n);
    },
    fill = (n, v) =>
      js(
        `(()=>{const x=document.querySelector('[name="${n}"]');x.value=${JSON.stringify(v)};x.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      ),
    submit = (k) =>
      js(`document.querySelector('[data-suite-form="${k}"]').requestSubmit()`),
    shot = async (n) => {
      await wait();
      fs.writeFileSync(
        path.join(out, n + ".png"),
        (await w.webContents.capturePage()).toPNG(),
      );
    };
  try {
    await w.loadFile(path.join(__dirname, "default.html"), {
      query: { preview: "1", scenario: "baseline", reset: "1" },
    });
    await check(
      'document.querySelectorAll(".app-rail button").length===5&&document.querySelector(".real-logo").complete',
      "real logo and five nav controls",
    );
    await check(
      '!document.querySelector(".sidebar .search")&&!document.querySelector(".sidebar .create")&&!document.querySelector(".sidebar .project")',
      "chat simplified",
    );
    await shot("chat");
    await click("[data-suite=group-create][data-id=reading]");
    await check(
      'M.s.selected===null&&!document.querySelector("#workset-panel")',
      "inline creation uses project",
    );
    await fill("message", "保存这个草稿");
    await click("[data-suite-route=projects]");
    await check(
      'document.querySelectorAll(".suite-tabs button").length===8',
      "lifecycle sections",
    );
    await shot("projects");
    await click("[data-suite=project-tab][data-id=collection]");
    await fill("name", "日常产品");
    await submit("collection");
    await check(
      'W.state().name==="日常产品"',
      "collection belongs to project page",
    );
    await click("[data-suite=project-tab][data-id=idea]");
    await click("[data-suite=idea-edit]");
    await fill("idea", "让每次阅读都有清晰的回顾。");
    await submit("project-idea");
    await check('S.project().idea.includes("回顾")', "idea editable");
    await click("[data-suite=project-tab][data-id=release]");
    await fill("version", "0.2.0");
    await submit("release-save");
    await check(
      'S.project().lifecycle.release==="准备中"',
      "release is preparation, not deployment",
    );
    await click("[data-suite=release-preview]");
    await check(
      'document.querySelector("#dialog").textContent.includes("不会触发部署")',
      "release handoff boundary",
    );
    await click("[data-suite=close]");
    await click("[data-suite=project-tab][data-id=operations]");
    await click("[data-suite=incident]");
    await fill("title", "导出请求超时");
    await fill("body", "部分用户导出耗时过长。");
    await submit("incident");
    await click("[data-suite=incident-work]");
    await check(
      "!!S.project().lifecycle.signals[0].work",
      "operations issue to work",
    );
    await click("[data-suite=project-tab][data-id=feedback]");
    await check(
      'document.querySelectorAll(".feedback-row").length===2',
      "project feedback context",
    );
    await click("[data-suite-route=team]");
    await shot("team");
    await check(
      '!!document.querySelector(".matrix")',
      "organization relation matrix",
    );
    await click("[data-suite=team-tab][data-id=projects]");
    await click("[data-suite=direct-add]");
    await js(`document.querySelector('[name=id]').value='yan'`);
    await submit("direct-add");
    await check(
      'M.s.projects[0].members.some(m=>m.id==="yan"&&m.role==="成员")',
      "direct org member add",
    );
    await click("[data-suite=project-invite]");
    await submit("invitation");
    await check(
      'document.querySelector("#dialog").textContent.includes("不提供历史或撤销")',
      "invitation one-time result",
    );
    await click("[data-suite=close]");
    await click("[data-suite=binding]");
    await fill("directory", "/workspace/reading");
    await submit("binding");
    await check(
      'M.s.projects[0].directory==="/workspace/reading"&&!M.s.projects[0].participation',
      "binding does not authorize auto",
    );
    await click("[data-suite=org-select][data-id=partner]");
    await check(
      '!document.querySelector("[data-suite=direct-add]")',
      "member scope does not inherit management",
    );
    await click("[data-suite-route=engineering]");
    await shot("engineering");
    await check(
      'document.querySelector("[data-skill-mode=using-arckit]").disabled',
      "automation core locked",
    );
    await click("[data-suite=eng-scene][data-id=chat]");
    await js(
      `var n=document.querySelector('[data-skill-mode=arckit-spec]');n.value='on-demand';n.dispatchEvent(new Event('change',{bubbles:true}))`,
    );
    await check(
      'S.state().skills.find(x=>x.id==="arckit-spec").modes.chat==="on-demand"&&S.state().skills.find(x=>x.id==="arckit-spec").modes.automation==="direct"',
      "skill scenes independent",
    );
    await click("[data-suite=eng-reset]");
    await submit("eng-reset");
    await click("[data-suite-route=settings]");
    await click("[data-suite=settings-tab][data-id=runtime]");
    await shot("settings");
    await fill("chatModel", "custom-model");
    await submit("chat-save");
    await check(
      'S.state().settings.chatModel==="custom-model"',
      "runtime defaults save",
    );
    await click("[data-suite=settings-tab][data-id=source]");
    await js(
      `var n=document.querySelector('[name=authMode]');n.value='bearer';n.dispatchEvent(new Event('change',{bubbles:true}))`,
    );
    await fill("token", "not-a-real-secret");
    await submit("source-save");
    await check(
      'S.state().settings.tokenConfigured&&!localStorage.getItem(M.key).includes("not-a-real-secret")',
      "credentials not persisted",
    );
    await click("[data-suite=settings-tab][data-id=appearance]");
    await js(
      `var n=document.querySelector('[name=theme]');n.value='dark';n.dispatchEvent(new Event('change',{bubbles:true}))`,
    );
    await check(
      'document.documentElement.dataset.theme==="dark"',
      "appearance immediate",
    );
    await shot("dark");
    await click("[data-suite=settings-tab][data-id=account]");
    await click("[data-suite=logout]");
    await submit("logout");
    await click("[data-suite-route=chat]");
    await check(
      'S.state().route==="settings"&&!S.state().account.loggedIn',
      "login gate",
    );
    await fill("target", "sample@example.com");
    await fill("code", "000");
    await submit("login");
    await check(
      'document.querySelector("[data-error]").textContent.includes("无效")',
      "login failure preserves input",
    );
    await fill("code", "123456");
    await submit("login");
    await check("S.state().account.loggedIn", "sample login");
    await click("[data-suite=settings-tab][data-id=source]");
    await js("M.s.offline=true");
    await fill("service", "offline-saved");
    await submit("source-save");
    await check(
      'S.state().settings.service==="offline-saved"&&S.state().notice.includes("未触发同步")',
      "local save survives sync failure",
    );
    await js("M.s.offline=false;M.s.fail=true");
    await fill("service", "retry-value");
    await submit("source-save");
    await check(
      'S.state().settings.service==="offline-saved"&&document.querySelector("[name=service]").value==="retry-value"',
      "save failure preserves draft",
    );
    await submit("source-save");
    await check('S.state().settings.service==="retry-value"', "save retry");
    await click("[data-suite-route=engineering]");
    await click("[data-suite=eng-scene][data-id=chat]");
    await js("M.s.conflict=true");
    await js(
      `var n=document.querySelector('[data-skill-mode=arckit-spec]');n.value='disabled';n.dispatchEvent(new Event('change',{bubbles:true}))`,
    );
    await check(
      'S.state().skills.find(x=>x.id==="arckit-spec").modes.chat==="direct"',
      "conflict preserves skill config",
    );
    await click("[data-suite=eng-refresh]");
    await check("!M.s.conflict", "skill conflict recovery");
    for (const route of [
      "chat",
      "projects",
      "team",
      "engineering",
      "settings",
    ]) {
      await click(`[data-suite-route=${route}]`);
      for (const width of [1440, 1024, 760, 390]) {
        w.setSize(width, 1050);
        await wait();
        await check(
          "document.documentElement.scrollWidth<=innerWidth",
          route + " " + width + " no overflow",
        );
      }
      await shot(route + "-narrow");
    }
    if (errors.length) throw Error(errors.join("\n"));
    fs.writeFileSync(
      path.join(out, "report.json"),
      JSON.stringify({ checks, errors }, null, 2),
    );
    console.log(JSON.stringify({ out, checks: checks.length, errors }));
    app.quit();
  } catch (e) {
    console.error(e);
    console.log(out, errors);
    await shot("failure");
    app.exit(1);
  }
});
