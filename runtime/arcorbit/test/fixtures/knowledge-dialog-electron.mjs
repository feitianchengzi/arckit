import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-knowledge-dialog-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const errors = [];
  const window = new BrowserWindow({
    show: false,
    width: 1440,
    height: 900,
    webPreferences: {
      preload: join(fixtureDir, "organization-center-preload.cjs"),
      contextIsolation: true,
      sandbox: false
    }
  });
  window.webContents.on("console-message", (_event, level, message, lineNumber, sourceId) => {
    if (level >= 2) errors.push(`${message} @ ${sourceId}:${lineNumber}`);
  });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const rendererErrors = [];
      const originalConsoleError = console.error;
      console.error = (value) => { rendererErrors.push(value?.stack || String(value)); originalConsoleError(value?.stack || value); };
      const wait = (duration = 120) => new Promise((resolve) => setTimeout(resolve, duration));
      const click = (selector) => document.querySelector(selector)?.click();
      const dialog = () => document.querySelector("dialog.knowledge-dialog");
      const view = (name) => dialog()?.querySelector('[data-kb-view="' + name + '"]');

      click('[data-page="organization"]');
      await wait(320);
      // 组织页默认落在 overview 视图；切到当前顶部产品范围内的组织项目。
      click('[data-organization-scope="31"]');
      await wait(320);
      click('[data-organization-section="projects"]');
      await wait(320);
      const configureButton = document.querySelector("[data-knowledge-configure]");
      if (!configureButton) return { fatal: "organization page did not render knowledge configure button", rendererErrors };
      const lockedProjectId = configureButton.dataset.knowledgeConfigure;
      click("[data-knowledge-configure]");
      await wait(260);

      const opened = Boolean(dialog()?.open);
      const listView = {
        listVisible: view("list")?.hidden === false,
        addHidden: view("add")?.hidden === true,
        addLabel: dialog()?.querySelector("[data-kb-add]")?.textContent,
        projectPickerAbsent: !dialog()?.querySelector("[data-kb-project]")
      };

      click("[data-kb-add]");
      await wait(140);
      const addView = {
        addVisible: view("add")?.hidden === false,
        listHidden: view("list")?.hidden === true,
        title: dialog()?.querySelector("[data-kb-title]")?.textContent,
        backVisible: dialog()?.querySelector("[data-kb-back]")?.hidden === false,
        customerFocused: document.activeElement?.name === "customer_id"
      };

      click("[data-kb-add]");
      await wait(140);
      const validationHolds = view("add")?.hidden === false;

      click("[data-kb-back]");
      await wait(140);
      const cancelReturnsToList = {
        backToList: view("list")?.hidden === false,
        addLabel: dialog()?.querySelector("[data-kb-add]")?.textContent
      };

      click("[data-kb-add]");
      await wait(140);
      const form = dialog()?.querySelector("[data-kb-add-form]");
      form.querySelector('[name="customer_id"]').value = "customer-001";
      form.querySelector('[name="repo_location"]').value = "https://github.com/customer/repo.git";
      click("[data-kb-add]");
      await wait(260);
      const added = {
        backToList: view("list")?.hidden === false,
        rows: dialog()?.querySelectorAll(".kb-repo-row").length,
        repoUrl: dialog()?.querySelector(".kb-repo-line1 code")?.textContent,
        status: dialog()?.querySelector("[data-kb-status]")?.textContent
      };

      click("[data-kb-delete]");
      await wait(100);
      const armedLabel = dialog()?.querySelector("[data-kb-delete]")?.textContent;
      click("[data-kb-delete]");
      await wait(220);
      const deleted = {
        rows: dialog()?.querySelectorAll(".kb-repo-row").length,
        status: dialog()?.querySelector("[data-kb-status]")?.textContent
      };

      click("[data-kb-dismiss]");
      await wait(180);
      const closed = {
        dialogGone: !document.querySelector("dialog.knowledge-dialog"),
        lockedProjectId
      };

      return { opened, listView, addView, validationHolds, cancelReturnsToList, added, armedLabel, deleted, closed, rendererErrors };
    })()`);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.log(JSON.stringify({ fatal: String(error?.stack || error), rendererErrors: errors }));
  } finally {
    await rm(userData, { recursive: true, force: true }).catch(() => {});
    app.exit(0);
  }
});
