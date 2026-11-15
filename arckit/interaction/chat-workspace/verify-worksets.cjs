const { app, BrowserWindow } = require("electron"),
  fs = require("fs"),
  path = require("path"),
  os = require("os");
const out =
  process.env.ARCORBIT_TEST_OUTPUT ||
  fs.mkdtempSync(path.join(os.tmpdir(), "arcorbit-worksets-"));
fs.mkdirSync(out, { recursive: true });
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1440, height: 1050 }),
    errors = [],
    checks = [];
  w.webContents.on("console-message", (_, l, t) => {
    if (l >= 3) errors.push(t);
  });
  const js = (s) => w.webContents.executeJavaScript(s),
    click = (s) =>
      js(
        `(()=>{const el=document.querySelector(${JSON.stringify(s)});if(!el||el.disabled)throw Error(${JSON.stringify(s)});el.click()})()`,
      ),
    wait = () => new Promise((r) => setTimeout(r, 120)),
    check = async (s, n) => {
      if (!(await js(s))) throw Error(n);
      checks.push(n);
    },
    fill = (name, v) =>
      js(
        `(()=>{const el=document.querySelector('[name="${name}"]');el.value=${JSON.stringify(v)};el.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      ),
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
    await click("[data-list-mode=work]");
    await check(
      'document.querySelectorAll(".project-work-group").length===2&&document.querySelectorAll(".workrow").length===3',
      "aggregate grouped work",
    );
    await shot("workspace");
    await fill("message", "跨项目草稿");
    await click('.workrow[data-id="129"]');
    await check(
      'M.s.project==="notes"&&M.s.workset.scope==="all"&&document.querySelectorAll(".project-work-group").length===2',
      "select does not change scope",
    );
    await click("[data-tab=files]");
    await check(
      'document.querySelector(".inspector-content").textContent.includes("尚未连接")',
      "files belong to selected task",
    );
    await click('.workrow[data-id="128"]');
    await check('M.current().draft==="跨项目草稿"', "draft restores");
    await click(".app-rail [data-workset=open]");
    await shot("panel");
    await click("[data-workset=scope][data-id=notes]");
    await check(
      'M.current().id==="128"&&!!document.querySelector(".scope-notice")&&document.querySelectorAll(".project-work-group").length===1',
      "narrow scope retains current work",
    );
    await click("[data-workset=reveal]");
    await check('M.s.workset.scope==="reading"', "reveal current project");
    await click("[data-workset=open]");
    await click("[data-workset=scope][data-id=all]");
    await click("[data-act=create]");
    await check(
      '!!document.querySelector("[data-workset-form=target]")',
      "aggregate create requires explicit target",
    );
    await js(
      `document.querySelector('[name=project]').value='notes';document.querySelector('[data-workset-form=target]').requestSubmit()`,
    );
    await fill("title", "轻记新工作");
    await js(`document.querySelector('[data-form=create]').requestSubmit()`);
    await check(
      'M.current().project==="notes"&&M.current().messages.length===0&&M.s.workset.scope==="all"',
      "create preserves explicit ownership and scope",
    );
    await click("[data-project=feedback]");
    await check(
      'document.querySelectorAll(".feedback-row").length===3',
      "aggregate feedback",
    );
    await click('[data-project=feedback][data-id="F-21"]');
    await fill("reply", "收到，正在处理");
    await js(
      `document.querySelector('[data-project-form=reply]').requestSubmit()`,
    );
    await check(
      'M.s.feedbacks.find(f=>f.id==="F-21").messages.length===1',
      "feedback writes correct project",
    );
    await click("[data-project=chat]");
    const selected = await js("M.s.selected");
    await click("[data-project=team]");
    await click("[data-workset=team]");
    await click("[data-workset=team-select][data-id=notes]");
    await check(
      'M.s.project==="notes"&&M.s.workset.scope==="all"',
      "team governance independent",
    );
    await click("[data-project=chat]");
    await check(
      `M.s.selected===${JSON.stringify(selected)}`,
      "team return preserves work",
    );
    await click("[data-workset=open]");
    await click("[data-workset=manage]");
    await shot("manage");
    await js(
      `document.querySelectorAll('[name=project]').forEach(n=>n.checked=false);document.querySelector('[data-workset-form=manage]').requestSubmit()`,
    );
    await check(
      'M.s.workset.ids.length===0&&!!document.querySelector(".scope-notice")',
      "empty workset retains work",
    );
    await click("[data-workset=manage]");
    await js(
      `document.querySelectorAll('[name=project]').forEach(n=>n.checked=true);document.querySelector('[data-workset-form=manage]').requestSubmit()`,
    );
    await click("[data-workset=collapse][data-id=reading]");
    await check('M.s.workset.collapsed.includes("reading")', "group collapse");
    await js("location.reload()");
    await wait();
    await check(
      'M.s.workset.collapsed.includes("reading")&&M.s.workset.ids.length===2',
      "workset persistence",
    );
    for (const width of [1440, 1024, 760, 390]) {
      w.setSize(width, 1050);
      await wait();
      await click(".app-rail [data-workset=open]");
      await check(
        'document.documentElement.scrollWidth<=innerWidth&&document.querySelector("#workset-panel").getBoundingClientRect().right<=innerWidth',
        width + " panel fits",
      );
      if (width === 390) await shot("narrow");
      await click("[data-workset=close]");
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
    console.log(out);
    await shot("failure");
    app.exit(1);
  }
});
