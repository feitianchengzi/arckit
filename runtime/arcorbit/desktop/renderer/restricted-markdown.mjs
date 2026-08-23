import { requireWorkExternalLinkUrl } from "../../src/work-external-link.mjs";

const WORK_TASK_STATES = new Set(["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"]);

export function workTaskReference(task = {}) {
  return `arcorbit-work://project/${encodeURIComponent(task.project_id ?? "")}/task/${encodeURIComponent(task.id ?? "")}`;
}

export function parseWorkTaskReference(value = "") {
  const reference = String(value || "").trim();
  const match = reference.match(/^arcorbit-work:\/\/project\/([^/?#]+)\/task\/([^/?#]+)$/);
  if (!match) throw new Error("任务引用格式无效。");
  let projectId;
  let taskId;
  try {
    projectId = decodeURIComponent(match[1]);
    taskId = decodeURIComponent(match[2]);
  } catch {
    throw new Error("任务引用包含无效编码。");
  }
  if (!projectId || !taskId || projectId.length > 120 || taskId.length > 120) throw new Error("任务引用中的产品或待办标识无效。");
  const target = { project_id: projectId, task_id: taskId };
  if (workTaskReference({ project_id: projectId, id: taskId }) !== reference) throw new Error("任务引用不是规范格式。");
  return target;
}

export function resolveWorkTaskReference(value, platform = {}) {
  const target = parseWorkTaskReference(value);
  const projectIds = new Set((platform.active_workset?.project_ids || []).map(String));
  if (!projectIds.has(target.project_id)) throw new Error("引用产品不在当前产品集中。");
  const task = (platform.tasks || []).find((item) => String(item.project_id) === target.project_id && String(item.id) === target.task_id);
  if (!task) throw new Error("当前账户无法在该产品中找到引用的待办。");
  if (!WORK_TASK_STATES.has(task.state)) throw new Error("引用待办的状态不可识别。");
  return { ...target, state: task.state, created_at: task.created_at || "" };
}

export function workTaskReferenceSelection(target = {}) {
  if (!target.project_id || !target.task_id || !WORK_TASK_STATES.has(target.state)) throw new Error("引用待办上下文无效。");
  return {
    page: "work",
    selectedProjectId: String(target.project_id),
    selectedState: target.state,
    selectedPlatformTaskId: String(target.task_id)
  };
}

export function renderRestrictedMarkdown(value = "") {
  const source = String(value || "").replaceAll("\r\n", "\n").trim();
  if (!source) return "<p>没有补充内容</p>";

  const blocks = [];
  const fenced = source.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_match, language, code) => {
    const token = `\u0000ARCBLOCKCODE${blocks.length}Z\u0000`;
    blocks.push(`<pre><code${language.trim() ? ` data-language="${escapeHtml(language.trim())}"` : ""}>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`);
    return token;
  });

  const rendered = fenced.split(/\n{2,}/).map((block) => renderBlock(block.trim())).filter(Boolean).join("");
  return blocks.reduce((html, block, index) => html.replace(`<p>\u0000ARCBLOCKCODE${index}Z\u0000</p>`, block), rendered);
}

function renderBlock(block) {
  if (!block) return "";
  if (/^\u0000ARCBLOCKCODE\d+Z\u0000$/.test(block)) return `<p>${block}</p>`;

  const lines = block.split("\n");
  const table = renderTable(lines);
  if (table) return table;
  const heading = lines.length === 1 && lines[0].match(/^(#{1,4})\s+(.+)$/);
  if (heading) {
    const level = heading[1].length + 1;
    return `<h${level}>${renderInline(heading[2])}</h${level}>`;
  }

  if (lines.every((line) => /^\s*[-*+]\s+/.test(line))) {
    return `<ul>${lines.map((line) => `<li>${renderInline(line.replace(/^\s*[-*+]\s+/, ""))}</li>`).join("")}</ul>`;
  }
  if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
    return `<ol>${lines.map((line) => `<li>${renderInline(line.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`;
  }
  if (lines.every((line) => /^\s*>\s?/.test(line))) {
    return `<blockquote>${lines.map((line) => renderInline(line.replace(/^\s*>\s?/, ""))).join("<br>")}</blockquote>`;
  }
  return `<p>${lines.map(renderInline).join("<br>")}</p>`;
}

function renderTable(lines) {
  if (lines.length < 2 || !lines[0].includes("|") || !lines[1].includes("|")) return "";
  const rows = lines.map(tableCells);
  if (!rows[0].length || rows[1].length !== rows[0].length || !rows[1].every((cell) => /^:?-{3,}:?$/.test(cell))) return "";
  if (rows.slice(2).some((row) => row.length !== rows[0].length)) return "";
  const head = `<thead><tr>${rows[0].map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead>`;
  const body = rows.length > 2 ? `<tbody>${rows.slice(2).map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody>` : "";
  return `<table>${head}${body}</table>`;
}

function tableCells(line) {
  const trimmed = String(line || "").trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function renderInline(value) {
  const code = [];
  const links = [];
  let text = String(value || "")
    .replace(/`([^`\n]+)`/g, (_match, content) => {
      const token = `\u0000ARCINLINECODE${code.length}Z\u0000`;
      code.push(`<code>${escapeHtml(content)}</code>`);
      return token;
    })
    .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_match, label, href) => {
      const token = `\u0000ARCLINK${links.length}Z\u0000`;
      links.push(renderLink(label, href));
      return token;
    });

  text = escapeHtml(text)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");

  text = code.reduce((html, replacement, index) => html.replace(`\u0000ARCINLINECODE${index}Z\u0000`, replacement), text);
  return links.reduce((html, replacement, index) => html.replace(`\u0000ARCLINK${index}Z\u0000`, replacement), text);
}

function renderLink(label, href) {
  const safeLabel = escapeHtml(label);
  try {
    const url = requireWorkExternalLinkUrl(href);
    return `<button class="task-markdown-link" type="button" data-task-markdown-external-link="${escapeHtml(url)}" title="打开外部链接：${escapeHtml(url)}">${safeLabel}</button>`;
  } catch {
    return `${safeLabel} <code>${escapeHtml(href)}</code>`;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
