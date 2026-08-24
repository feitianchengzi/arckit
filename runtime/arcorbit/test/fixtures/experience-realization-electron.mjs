import { app, BrowserWindow } from "electron";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const userData = join(tmpdir(), `arcorbit-experience-realization-${process.pid}`);
app.setPath("userData", userData);
app.disableHardwareAcceleration();

const wait = (duration = 120) => new Promise((resolve) => setTimeout(resolve, duration));

app.whenReady().then(async () => {
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
  try {
    await window.loadFile(join(fixtureDir, "../../desktop/renderer/index.html"));
    await wait(300);
    const result = await window.webContents.executeJavaScript(`(async () => {
      const pages = ["today", "work", "feedback", "command", "chat", "idea", "organization", "release", "operations", "engineering"];
      const visible = (node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };
      let visibleTextBelow11 = 0;
      let standardControlViolations = 0;
      let checkboxTargetViolations = 0;
      let selectableRowViolations = 0;
      const controlViolationDetails = [];
      const checkboxViolationDetails = [];
      for (const page of pages) {
        document.querySelector('[data-page="' + page + '"]').click();
        await new Promise((resolve) => setTimeout(resolve, 120));
        const root = document.querySelector('[data-page-view="' + page + '"]');
        const textNodes = [...root.querySelectorAll("*")].filter((node) => {
          if (!visible(node)) return false;
          const ownText = [...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
          return ownText || node.matches("input, select, textarea");
        });
        visibleTextBelow11 += textNodes.filter((node) => Number.parseFloat(getComputedStyle(node).fontSize) < 11).length;
        const controls = [...root.querySelectorAll('button, input:not([type="checkbox"]):not([type="radio"]):not([type="color"]), select, textarea, summary')].filter(visible);
        const pageControlViolations = controls.filter((node) => {
          const minimum = node.matches(".icon-button, .chat-code-block > button") ? 32 : 36;
          return node.getBoundingClientRect().height + .01 < minimum;
        });
        standardControlViolations += pageControlViolations.length;
        controlViolationDetails.push(...pageControlViolations.map((node) => ({ page, tag: node.tagName, id: node.id, class_name: node.className, height: node.getBoundingClientRect().height })));
        const checkboxes = [...root.querySelectorAll('input[type="checkbox"], input[type="radio"]')].filter(visible);
        const pageCheckboxViolations = checkboxes.filter((node) => {
          const target = node.closest("label") || node;
          return target.getBoundingClientRect().height + .01 < 36;
        });
        checkboxTargetViolations += pageCheckboxViolations.length;
        checkboxViolationDetails.push(...pageCheckboxViolations.map((node) => { const target = node.closest("label") || node; return { page, id: node.id, class_name: target.className, height: target.getBoundingClientRect().height }; }));
        const selectableRows = [...root.querySelectorAll("tr[data-platform-task-select], tr[data-feedback-id], tr[data-queue-task], tr[data-task-id]")].filter(visible);
        selectableRowViolations += selectableRows.filter((row) => row.tabIndex !== 0 || row.getAttribute("role") !== "button" || row.getBoundingClientRect().height + .01 < 40).length;
      }
      document.querySelector('[data-page="work"]').click();
      await new Promise((resolve) => setTimeout(resolve, 120));
      const rows = [...document.querySelectorAll("tr[data-platform-task-select]")];
      const targetRow = rows[1] || rows[0];
      const longTaskRow = document.querySelector('tr[data-platform-task-select="W-11"] .task-tree-title');
      const workDisplayTitle = longTaskRow?.textContent || "";
      const workInspectorTitle = document.querySelector('#platformWorkInspector h2')?.textContent || "";
      const workInspectorContent = document.querySelector('#platformWorkInspector .task-markdown-detail')?.textContent || "";
      const currentRunTitle = document.querySelector('#currentRunPanel h3');
      const currentRunDisplayTitle = currentRunTitle?.textContent || "";
      const currentRunSingleLine = Boolean(currentRunTitle && currentRunTitle.scrollHeight <= currentRunTitle.clientHeight + 1);
      const before = targetRow?.getAttribute("aria-selected");
      targetRow?.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      const keyboardSelectionChanged = Boolean(targetRow && before !== "true" && targetRow.getAttribute("aria-selected") === "true");
      const navigation = [...document.querySelectorAll(".primary-nav .nav-item")];
      const tableCell = document.querySelector(".platform-work-table td");
      document.querySelector('[data-page="chat"]').click();
      await new Promise((resolve) => setTimeout(resolve, 120));
      const conversationSample = document.querySelector(".chat-message-content") || document.createElement("div");
      if (!conversationSample.isConnected) {
        conversationSample.className = "chat-message-content";
        conversationSample.textContent = "sample";
        document.body.append(conversationSample);
      }
      return {
        pages,
        visible_text_below_11: visibleTextBelow11,
        standard_control_violations: standardControlViolations,
        checkbox_target_violations: checkboxTargetViolations,
        selectable_row_violations: selectableRowViolations,
        control_violation_details: controlViolationDetails,
        checkbox_violation_details: checkboxViolationDetails,
        keyboard_selection_changed: keyboardSelectionChanged,
        work_display_title: workDisplayTitle,
        work_inspector_title: workInspectorTitle,
        work_inspector_content: workInspectorContent,
        current_run_display_title: currentRunDisplayTitle,
        current_run_single_line: currentRunSingleLine,
        core_navigation_vector_icons: navigation.filter((item) => item.querySelector("svg.ui-icon use")).length,
        core_navigation_text_icons: navigation.filter((item) => [...item.childNodes].some((node) => node.nodeType === Node.ELEMENT_NODE && node.matches("span") && node.textContent.trim())).length,
        table_font_px: Number.parseFloat(getComputedStyle(tableCell).fontSize),
        conversation_font_px: Number.parseFloat(getComputedStyle(conversationSample).fontSize)
      };
    })()`);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    window.destroy();
    await rm(userData, { recursive: true, force: true });
    app.exit(0);
  }
}).catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  app.exit(1);
});
