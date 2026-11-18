const { app, BrowserWindow } = require("electron");
const fs = require("fs"),
  path = require("path"),
  os = require("os");
const out =
  process.env.ARCORBIT_TEST_OUTPUT ||
  fs.mkdtempSync(path.join(os.tmpdir(), "arcorbit-formal-"));
fs.mkdirSync(out, { recursive: true });
app.on("window-all-closed", () => {});
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1440, height: 1050 });
  const errors = [],
    checks = [];
  w.webContents.on("console-message", (_, level, text) => {
    if (level >= 3) errors.push(text);
  });
  const js = async (code) => {
    try {
      return await w.webContents.executeJavaScript(code);
    } catch (e) {
      throw new Error(code + "\n" + e.message);
    }
  };
  const wait = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
  const click = (selector) =>
    js(
      `(()=>{var selector=${JSON.stringify(selector)};if(selector.includes('data-project=work')){document.querySelector('[data-project=chat]').click();selector='[data-list-mode=work]';}if(selector.includes('data-act="create"')&&!document.querySelector(selector))document.querySelector('[data-list-mode=work]').click();if(selector.includes('data-act="new"')&&!document.querySelector(selector))document.querySelector('[data-list-mode=chat]').click();var n=document.querySelector(selector);if(!n||n.disabled)throw Error('Missing or disabled: '+${JSON.stringify(selector)});n.focus();n.click();document.querySelector('[data-workset-form=target]')?.requestSubmit()})()`,
    );
  const act = (a) => click(`[data-act="${a}"]`);
  const fill = (name, value) =>
    js(
      `(()=>{var n=document.querySelector('[name="${name}"]');n.value=${JSON.stringify(value)};n.dispatchEvent(new Event('input',{bubbles:true}))})()`,
    );
  const submit = (kind, attr = "form") =>
    js(`document.querySelector('[data-${attr}="${kind}"]').requestSubmit()`);
  const check = async (condition, message) => {
    if (!(await js(condition))) throw Error(message);
    checks.push(message);
  };
  const load = async (scenario = "baseline", preview = true) => {
    await w.loadFile(path.join(__dirname, "default.html"), {
      query: { ...(preview ? { preview: "1" } : {}), scenario, reset: "1" },
    });
    await wait();
  };
  const shot = async (name) => {
    await wait();
    fs.writeFileSync(
      path.join(out, name + ".png"),
      (await w.webContents.capturePage()).toPNG(),
    );
  };
  try {
    await load();
    await act("fill");
    await submit("message");
    await check(
      'M.current().constraints.some(c=>c.text.includes("历史记录"))',
      "对话信息沉淀到同一工作",
    );
    await act("auto");
    await act("start-auto");
    await fill("message", "保持当前选择，不增加新页面");
    await submit("message");
    await check(
      "M.current().messages.some(m=>m.pending)",
      "运行中补充明确显示待采用",
    );
    await act("pause");
    await check(
      'M.current().mode==="pausing" && document.querySelector("[aria-label=发送]").disabled',
      "暂停回执前禁止接管",
    );
    await act("tick");
    await check(
      'M.current().mode==="paused" && !M.current().messages.some(m=>m.pending)',
      "停止回执后补充保留",
    );
    await act("auto");
    await act("start-auto");
    await act("tick");
    await act("decide");
    await submit("decide");
    await act("tick");
    await act("tick");
    await check('M.current().mode==="done"', "决策后继续到待验收");
    await act("inspect");
    await check(
      'document.querySelector("[data-act=accept]").disabled',
      "未经检查不能验收",
    );
    await act("preview-start");
    await act("preview-fail");
    await check(
      'document.querySelector("#preview-status").textContent.includes("保留")',
      "失败重试保留选择",
    );
    await js(
      `var n=document.querySelector('[data-check]');n.checked=true;n.dispatchEvent(new Event('change',{bubbles:true}))`,
    );
    await act("accept");
    await click("[data-life=reopen]");
    await check(
      'M.current().mode==="paused"&&!M.current().checked',
      "重新打开保留身份并失效旧检查",
    );
    await click("[data-life=archive]");
    await click("[data-life=confirm-archive]");
    await click("[data-project=work]");
    await js(
      `var n=document.querySelector('[data-list-filter]');n.value='archived';n.dispatchEvent(new Event('change',{bubbles:true}))`,
    );
    await click(".workrow");
    await check("M.current().archived", "归档可从列表找回");
    await click("[data-life=restore]");
    await check("!M.current().archived", "恢复归档");
    await act("new");
    const n = await js("M.s.tasks.length");
    await fill("message", "验证首条消息失败");
    await act("lab");
    await act("fail");
    await submit("message");
    await check(
      `M.s.tasks.length===${n}&&M.s.newDraft.length>0`,
      "首条消息失败不产生空工作",
    );
    await submit("message");
    await check(
      `M.s.tasks.length===${n + 1}&&M.current().messages.length===2`,
      "重试只创建一个工作",
    );
    await act("create");
    await fill("title", "独立待办");
    await submit("create");
    await check("M.current().messages.length===0", "直接待办没有伪造 Chat");
    await fill("message", "输入法草稿");
    await js(
      `var a=document.querySelector('[name=message]');a.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));a.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));a.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}));`,
    );
    await check(
      'M.current().draft==="输入法草稿"&&M.current().messages.length===0',
      "输入法 Enter 不提交",
    );
    await act("edit");
    await w.webContents.sendInputEvent({ type: "keyDown", keyCode: "Escape" });
    await w.webContents.sendInputEvent({ type: "keyUp", keyCode: "Escape" });
    await wait();
    await check(
      '!document.querySelector("#dialog").open&&document.activeElement.dataset.act==="edit"',
      "Esc 关闭并恢复焦点",
    );
    await load("conflict");
    await act("edit");
    await fill("goal", "我的修改不能丢失");
    await submit("edit");
    await check(
      'document.querySelector("[data-error]").textContent.includes("新版本")&&document.querySelector("[name=goal]").value==="我的修改不能丢失"',
      "版本冲突保留草稿",
    );
    await click("[data-life=latest]");
    await submit("edit");
    await check('M.current().goal==="我的修改不能丢失"', "核对新版本后合并");
    await load("failure");
    await act("tick");
    await check('M.current().mode==="failed"', "执行失败可触达");
    await click("[data-life=retry-run]");
    await check('M.current().mode==="paused"', "恢复失败不暗中启动");
    await load("waiting");
    await click("[data-life=release-wait]");
    await check('M.current().mode==="paused"', "外部等待恢复需要明确继续");
    await load("readonly");
    await fill("message", "只读草稿");
    await submit("message");
    await check(
      'M.current().messages.length===2&&M.current().draft==="只读草稿"',
      "只读权限阻止写入并保留草稿",
    );
    await load("member");
    await click("[data-project=team]");
    await click("[data-project=invite]");
    await check(
      'document.querySelector("#dialog").textContent.includes("管理员")&&!document.querySelector("[data-project-form=invite]")',
      "普通成员不能邀请",
    );
    await load("occupied");
    await act("edit");
    await check(
      'document.querySelector("#dialog").textContent.includes("林悦")',
      "他人占用不能改写",
    );
    await load();
    await act("auto");
    await act("start-auto");
    await act("create");
    await fill("title", "同项目排队");
    await submit("create");
    await act("auto");
    await act("start-auto");
    await check('M.current().mode==="queued"', "同项目执行串行排队");
    await click("[data-life=cancel-queue]");
    await check('M.current().mode==="paused"', "可取消排队");
    await load();
    await act("auto");
    await act("start-auto");
    await click(".app-rail [data-workset=open]");
    await click("[data-workset=scope][data-id=notes]"); await click("[data-list-mode=work]"); await click('.workrow[data-id="129"]');
    await act("tick");
    await check(
      'M.s.project==="notes"&&M.s.tasks.find(t=>t.id==="128").mode==="decision"',
      "跨项目切换不停止后台推进、不抢当前工作",
    );
    await act("runs");
    await click('[data-act=locate][data-id="128"]');
    await check(
      'M.s.project==="reading"&&M.current().id==="128"',
      "跨项目运行定位",
    );
    await load("file-error");
    await click("[data-life=reconnect]");
    await check(
      'document.querySelectorAll(".tree-file").length>0',
      "文件读取失败可重试",
    );
    await click("[data-dock=file]");
    await fill("message", "已有草稿");
    await act("dock-reference");
    await check(
      'M.current().draft.startsWith("已有草稿")&&M.current().draft.includes("src/")',
      "引用文件追加草稿",
    );
    await click("[data-tab=git]");
    await click("[data-dock=diff]");
    await act("dock-stage");
    await click("[data-dock=git-scope][data-index=true]");
    await check(
      'document.querySelectorAll(".diff-file").length===1',
      "Git 暂存与筛选",
    );
    await load("offline");
    await fill("message", "离线消息");
    await submit("message");
    await click("[data-life=reconnect]");
    await submit("message");
    await check(
      'M.current().messages.some(m=>m.text==="离线消息")',
      "离线恢复可重试",
    );
    await load("long", false);
    await check(
      '!document.querySelector(".lab")&&document.querySelector(".inspector").getBoundingClientRect().top===0',
      "正式产品视图无场景工具、右栏顶到顶部",
    );
    await shot("desktop");
    for (const width of [1440, 1024, 760, 390]) {
      w.setSize(width, 1050);
      await wait();
      await check(
        "document.documentElement.scrollWidth<=innerWidth",
        `长标题 ${width}px 无页面横向溢出`,
      );
    }
    await act("details");
    await shot("narrow-inspector");
    await act("close-details");
    w.setSize(1440, 1050);
    await act("theme");
    await shot("dark");
    await load("baseline", false);
    await act("auto");
    await act("start-auto");
    await wait(2700);
    await check(
      'M.current().mode==="decision"',
      "产品入口自动推进而非依赖场景工具",
    );
    await act("decide");
    await submit("decide");
    await js("location.reload()");
    await wait(200);
    await check('M.current().mode==="paused"', "刷新后保留现场并暂停");
    if (errors.length) throw Error(errors.join("\n"));
    fs.writeFileSync(
      path.join(out, "report.json"),
      JSON.stringify({ passed: true, checks, errors }, null, 2),
    );
    console.log(JSON.stringify({ out, checks: checks.length, errors }));
    app.quit();
  } catch (error) {
    console.error(error);
    console.log("Evidence: " + out);
    await shot("failure");
    app.exit(1);
  }
});
