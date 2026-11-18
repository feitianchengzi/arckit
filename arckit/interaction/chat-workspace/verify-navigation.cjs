const { app, BrowserWindow } = require("electron");
const fs = require("fs"),
  path = require("path"),
  os = require("os");
const out =
  process.env.ARCORBIT_TEST_OUTPUT ||
  fs.mkdtempSync(path.join(os.tmpdir(), "arcorbit-nav-"));
fs.mkdirSync(out, { recursive: true });
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1440, height: 1000 });
  const errors = [],
    checks = [];
  w.webContents.on("console-message", (_, l, t) => {
    if (l >= 3) errors.push(t);
  });
  const js = (s) => w.webContents.executeJavaScript(s),
    wait = (ms) => new Promise((r) => setTimeout(r, ms || 100)),
    click = (s) => js(`document.querySelector(${JSON.stringify(s)}).click()`),
    check = async (s, n) => {
      if (!(await js(s))) throw Error(n);
      checks.push(n);
    };
  try {
    await w.loadFile(path.join(__dirname, "default.html"), {
      query: { preview: "1", scenario: "long", reset: "1" },
    });
    await w.webContents.debugger.attach("1.3");
    await w.webContents.debugger.sendCommand(
      "Emulation.setFocusEmulationEnabled",
      { enabled: true },
    );
    await check(
      'document.querySelectorAll(".app-rail [data-project=work]").length===0&&document.querySelector(".app-rail").getBoundingClientRect().width===60',
      "icon rail and merged route",
    );
    await check(
      'document.querySelectorAll(".workrow").length===1',
      "chat only contains conversations",
    );
    await js(
      `M.current().draft='未发送的草稿';M.current().scroll=10;U.refresh()`,
    );
    await click("[data-list-mode=work]");
    await check(
      'document.querySelectorAll(".workrow").length===3&&M.current().id==="128"&&document.querySelector("[name=message]").value==="未发送的草稿"',
      "tab keeps current work and draft",
    );
    await click('[data-act=select][data-id="127"]');
    await check(
      'M.current().messages.length===0&&document.querySelector("#transcript").textContent.includes("还没有人工对话")',
      "todo opens same conversation empty state",
    );
    await click("[data-list-mode=chat]");
    await check(
      'M.current().id==="127"',
      "filter does not steal selected work",
    );
    await click(".workrow");
    await js(
      `document.querySelector('.workrow').dispatchEvent(new PointerEvent('pointerover',{bubbles:true}))`,
    );
    await wait(1200);
    await check(
      'document.querySelector(".marquee-text").getAnimations().length===1&&getComputedStyle(document.querySelector(".marquee-text")).transform!=="none"',
      "overflow title scrolls on hover",
    );
    await js(
      `document.querySelector('.workrow').dispatchEvent(new PointerEvent('pointerout',{bubbles:true}))`,
    );
    await check(
      'document.querySelector(".marquee-text").getAnimations().length===0',
      "hover exit resets",
    );
    await js(
      `document.activeElement.blur();document.querySelector('.workrow').focus()`,
    );
    await check(
      'document.querySelector(".marquee-text").getAnimations().length===1',
      "keyboard focus scrolls",
    );
    await js(`document.querySelector('[data-project=team]').focus()`);
    await check(
      'getComputedStyle(document.querySelector("[data-project=team] .rail-tooltip")).visibility==="visible"',
      "keyboard tooltip",
    );
    await click("[data-project=team]");
    await check(
      'document.querySelector(".management-route")&&document.querySelector(".team-intro")',
      "team route remains usable",
    );
    await click("[data-project=chat]");
    await click(".top [data-list-toggle]");
    await check(
      'getComputedStyle(document.querySelector(".sidebar")).display==="none"',
      "collapse list",
    );
    await click(".top [data-list-toggle]");
    for (const width of [1440, 1024, 760, 390]) {
      w.setSize(width, 1000);
      await wait();
      await check(
        "document.documentElement.scrollWidth<=innerWidth",
        width + " no overflow",
      );
      if (width === 390) {
        await click(".top [data-list-toggle]");
        await check(
          'getComputedStyle(document.querySelector(".sidebar")).display!=="none"',
          "mobile list opens",
        );
      }
      await wait();
      fs.writeFileSync(
        path.join(out, width + ".png"),
        (await w.webContents.capturePage()).toPNG(),
      );
    }
    await w.webContents.debugger.sendCommand("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await js(
      `document.activeElement.blur();document.querySelector('.workrow').dispatchEvent(new PointerEvent('pointerout',{bubbles:true}));document.querySelector('.workrow').dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));`,
    );
    await check(
      'document.querySelector(".marquee-text").getAnimations().length===0&&document.querySelector(".workrow").title.length>30',
      "reduced motion has static title",
    );
    if (errors.length) throw Error(errors.join("\n"));
    fs.writeFileSync(
      path.join(out, "report.json"),
      JSON.stringify({ checks, errors }, null, 2),
    );
    console.log(JSON.stringify({ out, checks: checks.length, errors }));
    app.quit();
  } catch (e) {
    console.error(e);
    console.log(
      await js(
        `JSON.stringify({active:document.activeElement.outerHTML,focus:document.hasFocus(),animations:document.getAnimations().length})`,
      ),
    );
    console.log(out);
    app.exit(1);
  }
});
