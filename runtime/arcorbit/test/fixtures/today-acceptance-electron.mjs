import assert from "node:assert/strict";
import { app, BrowserWindow, ipcMain } from "electron";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTodayAcceptanceState } from "./today-acceptance-state.mjs";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = await mkdtemp(join(tmpdir(), "arcorbit-today-acceptance-ui-"));
app.setPath("userData", userData);
app.disableHardwareAcceleration();
process.env.ARCORBIT_TODAY_ACCEPTANCE_FIXTURE = "1";
app.whenReady().then(async () => {
const fixture = await createTodayAcceptanceState();
ipcMain.handle("test:today-acceptance:automation", (_event, input) => fixture.automation.getSnapshot(input));
ipcMain.handle("test:today-acceptance:platform", (_event, input) => fixture.platform.getSnapshot(input));
ipcMain.handle("test:today-acceptance:submit", (_event, input) => fixture.automation.submitAcceptanceFeedback(input));
ipcMain.handle("test:today-acceptance:preference", async (_event, input) => {
  await fixture.runManager.updateDesktopStore((store) => { store.platform.ui_preferences.today = input; });
  return input;
});
const window = new BrowserWindow({ show: false, width: 1440, height: 1000,
  webPreferences: { preload: join(fixtureDir, "organization-center-preload.cjs"), contextIsolation: true, sandbox: false }
});
const errors = [];
const warnings = [];
window.webContents.on("console-message", (_event, level, message) => {
  if (level >= 2) (message.includes("Electron Security Warning") ? warnings : errors).push(message);
});
let exitCode = 0;
try {
  await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
  const submitted = await window.webContents.executeJavaScript(`(async () => {
    const until = async (read) => { for (let i=0;i<100;i++) { const value=read(); if(value) return value; await new Promise(r=>setTimeout(r,30)); } throw new Error('UI condition timed out: '+document.querySelector('#todayOperator')?.textContent); };
    await until(()=>document.querySelector('[data-page="today"]'));
    document.querySelector('[data-page="today"]').click();
    await until(()=>document.querySelector('[data-today-project="11"]')?.textContent.includes('Synthetic project'));
    document.querySelector('[data-today-mode="intervention"]').click();
    const row = await until(()=>document.querySelector('[data-today-item="work:W-COMPLETED:completed"]'));
    row.click();
    const composer = await until(()=>document.querySelector('#todayOperator textarea'));
    composer.value='Today 第三栏真实提交验收问题';
    composer.dispatchEvent(new Event('input',{bubbles:true}));
    const submit = document.querySelector('#todayOperator [data-today-action="raise_acceptance_issue"]');
    if(!submit) throw new Error('No Today submit action');
    submit.click();
    const issue = await until(()=>document.querySelector('#todayOperator [data-today-acceptance-feedback]'));
    issue.scrollIntoView({block:'center'});
    const rect=issue.getBoundingClientRect();
    return {text:issue.textContent, visible:rect.width>0&&rect.height>0&&getComputedStyle(issue).visibility!=='hidden', selected:document.querySelector('#todayResponsibilityList .is-active')?.dataset.todayItem, count:document.querySelectorAll('#todayOperator [data-today-acceptance-feedback]').length};
  })()`);
  assert.equal(submitted.visible, true);
  assert.equal(submitted.count, 1);
  assert.match(submitted.text, /Today 第三栏真实提交验收问题/);
  assert.match(submitted.text, /queued/);
  assert.equal(submitted.selected, "work:W-COMPLETED:completed");
  await fixture.runManager.updateDesktopStore((store) => {
    store.automation.acceptance_feedback_items[0].status = "running";
    store.automation.acceptance_feedback_items[0].progress = "正在验证第三栏";
  });
  const updated = await window.webContents.executeJavaScript(`(async()=>{
    await window.arckitDesktop.emitTestAutomationEvent({type:'automation.changed',reason:'acceptance-progress'});
    for(let i=0;i<100;i++){
      const issue=document.querySelector('#todayOperator [data-today-acceptance-feedback]');
      if(issue?.textContent.includes('正在验证第三栏')){
        issue.scrollIntoView({block:'center'});
        await new Promise(requestAnimationFrame);
        return issue.textContent;
      }
      await new Promise(r=>setTimeout(r,30));
    }
    throw new Error('Updated issue did not render');
  })()`);
  assert.match(updated, /running/);
  assert.match(updated, /正在验证第三栏/);
  assert.equal((await fixture.runManager.readDesktopStore()).automation.snapshot.tasks[0].state, "completed");
  assert.deepEqual(errors, []);
  const result = { submitted, updated, errors, warnings, electron: process.versions.electron, scope: "current development renderer and production coordinators; isolated disk store, synthetic Work and account, no live Agent or installed-package replacement" };
  const evidenceDir = new URL("../../../../arckit/cases/evidence/CASE-20260911-002/", import.meta.url);
  await writeFile(new URL("today-electron.json", evidenceDir), JSON.stringify(result, null, 2) + "\n");
  await new Promise((resolve) => setTimeout(resolve, 250));
  await writeFile(new URL("today-third-column.png", evidenceDir), (await window.webContents.capturePage()).toPNG());
  process.stdout.write(JSON.stringify(result) + "\n");
} catch (error) {
  exitCode = 1;
  process.stderr.write(error.stack + "\n");
} finally {
  window.destroy();
  await fixture.dispose();
  await rm(userData, { recursive: true, force: true });
  app.exit(exitCode);
}
}).catch((error) => { process.stderr.write(error.stack + "\n"); app.exit(1); });
