import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-organization-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const errors = [];
  const window = new BrowserWindow({ show: false, width: 1440, height: 900, webPreferences: { preload: join(fixtureDir, "organization-center-preload.cjs"), contextIsolation: true, sandbox: false } });
  window.webContents.on("console-message", (_event, level, message) => { if (level >= 2) errors.push(message); });
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const click = (selector) => document.querySelector(selector).click();
      const wait = () => new Promise((resolve) => setTimeout(resolve, 60));
      click('[data-page="organization"]'); await wait();
      const initialHeading = document.querySelector('#organizationHeading').textContent;
      const matrixRows = document.querySelectorAll('.organization-matrix tbody tr').length;
      click('[data-organization-section="members"]'); await wait();
      const memberText = document.querySelector('#organizationContent').textContent;
      click('[data-organization-section="projects"]'); await wait();
      click('[data-organization-project-open="12"]'); await wait();
      const memberProjectHasInvite = Boolean(document.querySelector('[data-product-invite="12"]'));
      click('[data-organization-project-open="11"]'); await wait();
      click('[data-product-invite="11"]'); await wait();
      const inviteFormTitle = document.querySelector('#platformActionTitle').textContent;
      document.querySelector('[name="role"]').value = 'member';
      document.querySelector('[name="expires_in"]').value = '24';
      document.querySelector('[name="max_uses"]').value = '1';
      document.querySelector('#platformActionForm').requestSubmit(); await wait();
      const inviteResultTitle = document.querySelector('#platformActionTitle').textContent;
      const inviteResultLead = document.querySelector('#platformActionLead').textContent;
      const inviteResultText = document.querySelector('#platformActionFields').textContent;
      click('#confirmPlatformActionButton'); await wait();
      click('[data-product-edit="11"]'); await wait();
      const editHasOrganizationMutation = Boolean(document.querySelector('[name="organization_id"]'));
      const editScopeIsReadonly = Boolean(document.querySelector('[name="project_scope"][readonly]'));
      click('#cancelPlatformActionButton'); await wait();
      click('#editWorksetButton'); await wait();
      const worksetChoices = document.querySelectorAll('[name="project_ids"]').length;
      document.querySelector('#platformActionForm').requestSubmit(); await wait();
      click('#joinByCodeButton'); await wait();
      document.querySelector('[name="kind"]').value = 'project';
      document.querySelector('[name="invite_code"]').value = 'JOIN-CODE';
      document.querySelector('#platformActionForm').requestSubmit(); await wait();
      return { initialHeading, matrixRows, memberText, memberProjectHasInvite, inviteFormTitle, inviteResultTitle, inviteResultLead, inviteResultText, editHasOrganizationMutation, editScopeIsReadonly, worksetChoices, calls: await window.arckitDesktop.getTestCalls() };
    })()`);
    process.stdout.write(`${JSON.stringify({ ...result, errors })}\n`);
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); app.exit(1); });
