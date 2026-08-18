import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureUserData = path.join(tmpdir(), `arcorbit-organization-management-${process.pid}`);

app.setName("ArcOrbit Organization Management Prototype");
app.setPath("userData", fixtureUserData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: { sandbox: true }
  });
  const pageErrors = [];
  window.webContents.on("console-message", (_event, level, message) => {
    if (level >= 2) pageErrors.push(message);
  });
  try {
    await window.loadFile(path.join(here, "index.html"));
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = await window.webContents.executeJavaScript(`({
      organizations: document.querySelectorAll('[data-organization]').length,
      activeOrganization: document.querySelector('.organization-item.active')?.textContent.trim(),
      activeSection: document.querySelector('.section-tabs button.active')?.textContent.trim(),
      matrixRows: document.querySelectorAll('[data-member-row]').length,
      workset: document.querySelector('#worksetLabel')?.textContent.trim()
    })`);
    const image = await window.webContents.capturePage();
    await import("node:fs").then(({ writeFileSync }) => writeFileSync("/tmp/arcorbit-organization-management.png", image.toPNG()));
    const interactions = await window.webContents.executeJavaScript(`(() => {
      document.querySelector('[data-section="members"]').click();
      const memberRows = document.querySelectorAll('[data-member]').length;
      document.querySelector('[data-member]')?.click();
      const inspectorTitle = document.querySelector('#inspector h2')?.textContent.trim();
      const memberHasProjectInvite = Boolean(document.querySelector('[data-inspector-action="invite"], [data-project-invite]'));
      document.querySelector('[data-member-project]')?.click();
      const relationOpenedProject = document.querySelector('#inspector h2')?.textContent.trim() === 'ArcOrbit';
      document.querySelector('[data-project-invite]')?.click();
      const inviteProject = document.querySelector('[data-invite-project]')?.getAttribute('data-invite-project');
      const inviteExplainsGeneric = document.querySelector('#modalBody')?.textContent.includes('不是给某位成员的定向邀请');
      document.querySelector('#confirmModal')?.click();
      const inviteResultVisible = Boolean(document.querySelector('[data-invite-result]'));
      const inviteExplainsLifecycleLimit = document.querySelector('#modalBody')?.textContent.includes('没有邀请列表与撤销接口');
      document.querySelector('#cancelModal').click();
      document.querySelector('#worksetButton').click();
      const worksetModalOpen = !document.querySelector('#modalBackdrop').classList.contains('hidden');
      document.querySelector('#cancelModal').click();
      document.querySelector('[data-organization="lab"]').click();
      const limitedScopeVisible = !document.querySelector('#scopeNotice').classList.contains('hidden');
      document.querySelector('[data-section="projects"]').click();
      document.querySelector('[data-project]')?.click();
      const memberRoleHasProjectInvite = Boolean(document.querySelector('[data-project-invite]'));
      return { memberRows, inspectorTitle, memberHasProjectInvite, relationOpenedProject, inviteProject, inviteExplainsGeneric, inviteResultVisible, inviteExplainsLifecycleLimit, worksetModalOpen, limitedScopeVisible, memberRoleHasProjectInvite };
    })()`);
    process.stdout.write(`${JSON.stringify({ ...result, interactions, errors: pageErrors })}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  } finally {
    window.destroy();
    await rm(fixtureUserData, { recursive: true, force: true });
    app.exit(process.exitCode || 0);
  }
}).catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  app.exit(1);
});
