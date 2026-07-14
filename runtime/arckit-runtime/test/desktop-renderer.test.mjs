import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rendererPath = new URL("../desktop/renderer/renderer.js", import.meta.url);
const rendererHtmlPath = new URL("../desktop/renderer/index.html", import.meta.url);
const rendererStylesPath = new URL("../desktop/renderer/styles.css", import.meta.url);
const desktopMainPath = new URL("../desktop/main.mjs", import.meta.url);
const desktopPreloadPath = new URL("../desktop/preload.cjs", import.meta.url);

test("desktop renderer defines every text truncation helper it calls", async () => {
  const source = await readFile(rendererPath, "utf8");

  assert.match(source, /function truncate\(value, limit\)/);
  assert.match(source, /function safeFormatEvent\(formatFn\)/);
  assert.match(source, /safeFormatEvent\(\(\) => formatActivityEvent\(event\)\)/);
  assert.match(source, /safeFormatEvent\(\(\) => formatPayload\(event\)\)/);
});

test("desktop sidebar uses a single-delete-item context menu", async () => {
  const [source, html, styles, main, preload] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8"),
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8")
  ]);

  assert.doesNotMatch(html, /projectPathInput|addProjectPathButton/);
  assert.match(source, /item\.addEventListener\("contextmenu"/);
  assert.match(source, /showSidebarContextMenu\(event,/);
  assert.match(source, /api\.removeProject\(project\.id\)/);
  assert.match(source, /api\.deleteSession\(project\.id, session\.id\)/);
  assert.match(source, /window\.confirm/);
  assert.match(html, /<div id="sidebarContextMenu"[^>]*role="menu">\s*<button[^>]*role="menuitem">Delete<\/button>\s*<\/div>/);
  assert.equal((html.match(/role="menuitem"/g) || []).length, 1);
  assert.doesNotMatch(source, /contextmenu[\s\S]{0,300}window\.confirm/);
  assert.match(styles, /\.project-name,[\s\S]*text-overflow: ellipsis;/);
  assert.match(main, /ipcMain\.handle\("arckit:delete-session"/);
  assert.match(preload, /deleteSession: \(projectId, sessionId\)/);
});

test("desktop sidebar keeps one-line chats and a bounded resizable Projects section", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);

  assert.match(html, /id="projectSection" class="sidebar-section project-section"/);
  assert.match(html, /id="sidebarDivider"[^>]*role="separator"[^>]*aria-valuemin="120"[^>]*aria-valuenow="220"/);
  assert.match(html, /class="sidebar-section chat-section"/);
  assert.doesNotMatch(source, /class="session-meta"/);
  assert.match(styles, /--project-section-height: 220px;/);
  assert.match(styles, /\.project-section \{[\s\S]*flex: 0 0 var\(--project-section-height\);[\s\S]*min-height: 120px;/);
  assert.match(styles, /\.chat-section \{[\s\S]*min-height: 120px;/);
  assert.match(styles, /\.project-list,[\s\S]*align-content: start;/);
  assert.match(styles, /\.project-list \{[\s\S]*grid-auto-rows: var\(--project-item-height\);/);
  assert.match(styles, /\.session-list \{[\s\S]*grid-auto-rows: var\(--session-item-height\);/);
  assert.match(styles, /\.project-item \{[\s\S]*height: var\(--project-item-height\);[\s\S]*grid-template-rows: 20px 18px;/);
  assert.match(styles, /\.session-item \{[\s\S]*height: var\(--session-item-height\);[\s\S]*align-items: center;/);
  assert.match(source, /MIN_PROJECT_SECTION_HEIGHT = 120/);
  assert.match(source, /MIN_CHAT_SECTION_HEIGHT = 120/);
  assert.match(source, /setPointerCapture\(event\.pointerId\)/);
  assert.match(source, /setProjectSectionHeight\(dragStartHeight \+ event\.clientY - dragStartY\)/);
});
