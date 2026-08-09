const TOOL_KINDS = new Set(["command", "command_execution", "tool", "tool_call", "file_change", "edit", "web_search"]);
const LOOP_KINDS = new Set(["status", "round", "ledger", "handoff", "warning", "error"]);
const READ_COMMANDS = new Set(["cat", "sed", "head", "tail", "bat", "less"]);

export function transcriptMessageType(message = {}) {
  const role = String(message.role || "").toLowerCase();
  const actor = String(message.actor || "").toLowerCase();
  const kind = String(message.kind || "").toLowerCase();
  if (role === "user" || actor === "operator" || actor === "user") return "user";
  if (role === "tool" || actor === "tool" || TOOL_KINDS.has(kind)) return "tool";
  if (role === "system" || actor === "runtime" || actor === "system" || LOOP_KINDS.has(kind)) return "loop";
  return "agent";
}

export function summarizeToolActivity(message = {}) {
  const command = oneLine(message.content || message.command || "");
  const kind = String(message.kind || "").toLowerCase();
  if (kind === "file_change" || kind === "edit") return command && command !== "Files changed" ? `更新 ${truncate(command, 100)}` : "更新文件";
  if (kind === "web_search") return command && command !== "Web search" ? `搜索网络 · ${truncate(command, 90)}` : "搜索网络";
  if (kind === "tool_call") return command && command !== "Tool call" ? `调用 ${truncate(command, 100)}` : "执行工具";
  if (!command) return fallbackToolSummary(kind);
  const words = shellWords(command);
  const executable = basename(words[0] || "").toLowerCase();

  if (READ_COMMANDS.has(executable)) {
    const paths = readPaths(words, executable);
    if (paths.length === 1) return `读取 ${compactPath(paths[0])}`;
    if (paths.length > 1) return `读取 ${paths.length} 个文件`;
    return "读取文件";
  }
  if (executable === "rg" || executable === "grep") {
    const query = searchQuery(words);
    return query ? `搜索 “${truncate(query, 72)}”` : "搜索代码";
  }
  if (isTestCommand(command, words)) return `运行测试 · ${truncate(command, 96)}`;
  if (executable === "git" && ["diff", "status", "show"].includes(words[1])) return "查看工作区变更";
  if (command.includes("apply_patch")) return "更新文件";
  if (["mkdir", "cp", "mv", "touch"].includes(executable)) return `更新文件 · ${truncate(command, 90)}`;
  return `运行 ${truncate(command, 112)}`;
}

export function summarizeLoopStatus(message = {}) {
  const text = oneLine(message.content || "状态已更新");
  return truncate(text, 220);
}

export function statusGlyph(status = "completed") {
  const normalized = String(status).toLowerCase();
  if (["failed", "error", "cancelled"].includes(normalized)) return "×";
  if (["warning", "waiting", "blocked"].includes(normalized)) return "!";
  if (["streaming", "started", "running", "in_progress"].includes(normalized)) return "◌";
  return "✓";
}

function fallbackToolSummary(kind = "") {
  const normalized = String(kind).toLowerCase();
  if (normalized === "file_change" || normalized === "edit") return "更新文件";
  if (normalized === "web_search") return "搜索网络";
  return "执行工具";
}

function shellWords(command) {
  return (String(command).match(/'[^']*'|"[^"]*"|[^\s]+/g) || []).map((word) => word.replace(/^(['"])(.*)\1$/, "$2"));
}

function readPaths(words, executable) {
  const start = words.findIndex((word) => basename(word).toLowerCase() === executable) + 1;
  return [...new Set(words.slice(start).filter((word) => (
    word && !word.startsWith("-") && !/^\d+(,\d+)?p$/.test(word) && !/[;&|]$/.test(word) && looksLikePath(word)
  )))];
}

function searchQuery(words) {
  const start = words.findIndex((word) => ["rg", "grep"].includes(basename(word).toLowerCase())) + 1;
  return words.slice(start).find((word) => word && !word.startsWith("-") && !looksLikePath(word)) || "";
}

function looksLikePath(word) {
  return word.startsWith("/") || word.startsWith("./") || word.startsWith("../") || /[/.][a-z0-9_-]{1,12}$/i.test(word);
}

function isTestCommand(command, words) {
  return /(^|\s)(test|tests|check|verify)(\s|$)/i.test(command)
    || ["pytest", "xcodebuild", "vitest", "jest"].includes(basename(words[0] || "").toLowerCase())
    || words.includes("--test");
}

function compactPath(path) {
  const clean = String(path).replace(/[;,]$/, "");
  if (!clean.startsWith("/")) return clean;
  for (const marker of ["/runtime/", "/arckit/", "/entry/", "/definition/", "/engineering/", "/code/", "/quality/"]) {
    const index = clean.lastIndexOf(marker);
    if (index >= 0) return clean.slice(index + 1);
  }
  return clean.split("/").filter(Boolean).slice(-3).join("/");
}

function basename(value) {
  return String(value).split("/").at(-1) || "";
}

function oneLine(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function truncate(value, limit) {
  const text = String(value);
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}
