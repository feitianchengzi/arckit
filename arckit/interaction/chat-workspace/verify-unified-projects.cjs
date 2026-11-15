const { app, BrowserWindow } = require("electron"),
  fs = require("fs"),
  path = require("path"),
  os = require("os");
const out =
  process.env.ARCORBIT_TEST_OUTPUT ||
  fs.mkdtempSync(path.join(os.tmpdir(), "arcorbit-formal-projects-"));
app.on("window-all-closed", () => {});
app.whenReady().then(async () => {
  try {
    const w = new BrowserWindow({ show: false, width: 1440, height: 1050 });
    const errs = [];
    w.webContents.on("console-message", (_, l, t) => {
      if (l >= 3) errs.push(t);
    });
    await w.loadFile(path.join(__dirname, "default.html"), {
      query: { preview: "1" },
    });
    const js = (s) => w.webContents.executeJavaScript(s),
      wait = () => new Promise((r) => setTimeout(r, 120)),
      click = (s) =>
        js(
          `(()=>{let selector=${JSON.stringify(s)};if(selector.includes('data-project=work')){document.querySelector('[data-project=chat]').click();selector='[data-list-mode=work]';}const el=document.querySelector(selector);if(!el)throw Error(${JSON.stringify(s)});el.focus();el.click()})()`,
        ),
      assert = async (c, m) => {
        if (!(await js(c))) throw Error(m);
      },
      fill = (name, value) =>
        js(
          `(()=>{const el=document.querySelector('[name="${name}"]');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}))})()`,
        ),
      submit = (k) =>
        js(
          `document.querySelector('[data-project-form="${k}"]').requestSubmit()`,
        );
    await js("M.reset();location.reload()");
    await wait();
    await wait();
    fs.mkdirSync(out, { recursive: true });
    const shot = async (n) => {
      await wait();
      fs.writeFileSync(
        out + "/" + n + ".png",
        (await w.webContents.capturePage()).toPNG(),
      );
    };
    await shot("chat");
    await fill("message", "拾光的草稿");
    await click(".app-rail [data-workset=open]");
    await click("[data-workset=scope][data-id=notes]"); await click("[data-list-mode=work]"); await click('.workrow[data-id="129"]');
    await assert('M.current().project==="notes"', "project identity");
    await click("[data-tab=files]");
    await assert(
      'document.querySelector(".inspector-content").textContent.includes("尚未连接")',
      "no other files",
    );
    await click(".app-rail [data-workset=open]");
    await click("[data-workset=scope][data-id=reading]"); await click("[data-list-mode=work]"); await click('.workrow[data-id="128"]');
    await assert('M.current().draft==="拾光的草稿"', "draft retained");
    await click("[data-project=work]");
    await shot("work");
    await assert(
      'document.querySelectorAll(".workrow").length===2',
      "filtered works",
    );
    await click("[data-project=feedback]");
    await shot("feedback");
    await fill("reply", "收到，我们先检查导出流程。");
    await submit("reply");
    await assert("M.s.feedbacks[0].messages.length===1", "reply");
    await click("[data-project=convert]");
    await submit("convert");
    await assert(
      'M.current().feedback==="F-21" && M.s.screen==="chat" && M.current().messages.length===0',
      "converted work",
    );
    const taskid = await js("M.current().id");
    await click("[data-project=feedback]");
    await assert('!!document.querySelector(".linked-work")', "linked result");
    await assert(
      'document.querySelector("[data-project=resolve]").disabled',
      "closure gate",
    );
    await click(".linked-work");
    await click("[data-act=auto]");
    await click("[data-act=start-auto]");
    for (let i = 0; i < 3; i++) await click("[data-act=tick]");
    await click("[data-act=inspect]");
    await js(
      `var c=document.querySelector('[data-check]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))`,
    );
    await click("[data-act=accept]");
    await click("[data-project=feedback]");
    await click("[data-project=resolve]");
    await assert('M.s.feedbacks[0].state==="已解决"', "feedback closed");
    await click("[data-project=team]");
    await click("[data-project=invite]");
    await fill("email", "new@example.com");
    await submit("invite");
    await assert(
      "M.s.invitations.length===1 && M.s.projects[0].members.length===3",
      "invitation not membership",
    );
    await shot("team");
    await click("[data-project=member][data-id=lin]");
    await click("[data-life=remove-member]");
    await js(
      `document.querySelector('[data-life-form=remove-member]').requestSubmit()`,
    );
    await assert(
      'M.s.projects[0].members.length===2&&M.s.tasks.find(t=>t.id==="127").owner==="我"',
      "remove transfers work",
    );
    await click("[data-project=member]");
    await js(`document.querySelector('[name=role]').value='管理员'`);
    await submit("member");
    await assert('M.s.projects[0].members[1].role==="管理员"', "role update");
    await click("[data-project=idea]");
    await fill("name", "轻舟");
    await fill("idea", "帮助小团队整理会议决定。");
    await shot("idea");
    await submit("idea");
    await assert(
      "M.s.projects.length===3 && M.current().project===M.s.project && M.current().messages.length===2",
      "idea creates project chat",
    );
    await js("location.reload()");
    await wait();
    await wait();
    await assert(
      'M.s.projects.length===3 && M.current().goal.includes("会议")',
      "restart",
    );
    let widths = [];
    for (const screen of ["chat", "work", "feedback", "team"]) {
      await click(`[data-project=${screen}]`);
      for (const width of [1440, 1024, 760, 390]) {
        w.setSize(width, 1050);
        await wait();
        widths.push({
          screen,
          width,
          overflow: await js("document.documentElement.scrollWidth>innerWidth"),
        });
      }
    }
    if (errs.length || widths.some((x) => x.overflow))
      throw Error(JSON.stringify({ errs, widths }));
    fs.writeFileSync(
      path.join(out, "report.json"),
      JSON.stringify({ passed: true, widths, errs }),
    );
    console.log("PASS " + JSON.stringify({ out, widths }));
    app.quit();
  } catch (e) {
    console.error(e);
    app.exit(1);
  }
});
