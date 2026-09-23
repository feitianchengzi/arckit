const { app, BrowserWindow, nativeTheme } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'arcorbit-appearance-prototype-'));
app.setPath('userData', scratch);
app.disableHardwareAcceleration();
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1440, height: 1000, webPreferences: { sandbox: true, contextIsolation: true } });
  const errors = [], checks = [];
  win.webContents.on('console-message', (_event, level, text) => { if (level >= 3 && !text.includes('Content Security Policy')) errors.push(text); });
  win.webContents.session.webRequest.onBeforeRequest((details, done) => done({ cancel: /^https?:/.test(details.url) }));
  const run = code => win.webContents.executeJavaScript(code);
  const wait = () => new Promise(resolve => setTimeout(resolve, 150));
  const select = value => run(`(() => { const el = document.querySelector('#appearanceTheme'); el.focus(); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('change', {bubbles:true})); })()`);
  const theme = () => run('document.documentElement.dataset.theme');
  const evidence = path.resolve(__dirname, '../../visual/_map/dark-mode');
  fs.mkdirSync(evidence, { recursive: true });
  try {
    nativeTheme.themeSource = 'light';
    await win.loadFile(path.resolve(__dirname, '../project-workbench/default.html'), {query:{autoplay:'off'}});
    await wait();
    assert.equal(await theme(), 'light');
    await run('AccountPrototype.open()');
    await wait();
    const before = await run('JSON.stringify(WorkModel.state.tasks)');
    await run("document.querySelector('#codexProxyUrl').value='draft-retained'");
    await select('dark');
    assert.equal(await theme(), 'dark');
    assert.equal(await run("document.querySelector('#codexProxyUrl').value"), 'draft-retained');
    assert.equal(await run('JSON.stringify(WorkModel.state.tasks)'), before);
    assert.equal(await run('document.activeElement.id'), 'appearanceTheme');
    assert.equal(await run('getComputedStyle(document.body).backgroundColor'), 'rgb(22, 27, 34)');
    checks.push('explicit dark applies without replacing task state, settings draft or focus');
    await wait();
    fs.writeFileSync(path.join(evidence, 'settings-dark.png'), (await win.webContents.capturePage()).toPNG());
    await run('WorkModel.state.failNext=true');
    await select('light');
    assert.equal(await theme(), 'dark');
    assert.equal(await run("document.querySelector('#appearanceTheme').value"), 'dark');
    assert.match(await run("document.querySelector('#appearanceFeedback').textContent"), /未能保存/);
    await select('light');
    assert.equal(await theme(), 'light');
    checks.push('save failure restores prior selection and retry succeeds');
    nativeTheme.themeSource = 'dark'; await wait();
    assert.equal(await theme(), 'light');
    await select('system');
    assert.equal(await theme(), 'dark');
    nativeTheme.themeSource = 'light'; await wait();
    assert.equal(await theme(), 'light');
    checks.push('system follows changes; explicit preference ignores changes');
    await select('dark');
    await run("localStorage.setItem('arcorbit:prototype:appearance:v1','dark')");
    win.reload(); await new Promise(resolve => win.webContents.once('did-finish-load', resolve)); await wait();
    assert.equal(await theme(), 'dark');
    checks.push('reload restores isolated local preference');
    await run("localStorage.setItem('arcorbit:prototype:appearance:v1','invalid')");
    win.reload(); await new Promise(resolve => win.webContents.once('did-finish-load', resolve)); await wait();
    assert.equal(await theme(), 'light');
    checks.push('invalid stored preference falls back to system');
    await run("AppearancePrototype.select('dark'); AccountPrototype.open()");
    await wait();
    for (const width of [1440,760,390]) {
      win.setSize(width,1000); await wait();
      assert.ok(await run('document.documentElement.scrollWidth <= innerWidth + 1'), `overflow at ${width}`);
    }
    checks.push('settings prototype fits 1440, 760 and 390 pixels');
    win.setSize(1440,1000);
    const consumers = ['chat-workspace','product-list','idea-add','platform-workspace','idea-workspace','product-feedback-center','automation-workspace','engineering-profile','task-browser','today-workspace','product-detail','release-workspace','operations-workspace'];
    for (const consumer of consumers) {
      await win.loadFile(path.resolve(__dirname, '../'+consumer+'/default.html'));
      await wait();
      await run("AppearancePrototype.select('dark');AccountPrototype.open()");
      assert.equal(await theme(), 'dark');
      assert.equal(await run("document.querySelector('#appearanceTheme').value"),'dark');
    }
    await win.loadFile(path.resolve(__dirname, '../platform-workspace/collaboration-views.html'));
    await wait();
    await run("AppearancePrototype.select('dark');AccountPrototype.open()");
    assert.equal(await theme(), 'dark');
    checks.push('all 15 shared settings consumers load and open appearance in dark mode');
    await win.loadFile(path.resolve(__dirname, '../../visual/_library/style-preview.html'));
    for (const value of ['dark','light','legacy-mixed']) {
      await run(`(() => {const el=document.querySelector('#theme');el.value='${value}';el.dispatchEvent(new Event('change'));})()`);
      for (const width of [1440,760,390]) {
        win.setSize(width,1000); await wait();
        assert.ok(await run('document.documentElement.scrollWidth <= innerWidth + 1'), `${value} overflow at ${width}`);
      }
    }
    win.setSize(1440,1000);
    await run("document.querySelector('#theme').value='dark';document.querySelector('#theme').dispatchEvent(new Event('change'))");
    await wait();
    fs.writeFileSync(path.join(evidence, 'components-dark.png'), (await win.webContents.capturePage()).toPNG());
    await run("document.querySelector('#draft').value='保留草稿';document.querySelector('#send').click()");
    assert.equal(await run("document.querySelector('#draft').value"),'保留草稿');
    assert.match(await run("document.querySelector('#send-status').textContent"), /提交失败/);
    checks.push('three component themes fit 1440/760/390; dark composer failure preserves draft');
    assert.deepEqual(errors, []);
    const report={checks,errors,limitations:['prototype only; no production persistence, native window or live service verification','shared consumers checked for load and appearance entry only; business states not exhaustively checked']};
    fs.writeFileSync(path.join(evidence,'verification.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));
    win.destroy(); app.exit(0);
  } catch (error) { console.error(error); win.destroy(); app.exit(1); }
});
