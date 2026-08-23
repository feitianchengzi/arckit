import {
  isConversationSurfaceMessageVisible,
  transcriptMessageType,
} from "../../src/desktop/transcript-presentation.mjs";
import { renderRestrictedMarkdown } from "./restricted-markdown.mjs";

const ACTIVE_STATUSES = new Set(["streaming", "started", "running", "in_progress"]);

export function createConversationSurface({
  element,
  jumpButton,
  formatTime = (value) => String(value || ""),
  onApproval = null,
  onExternalLink = null,
  clipboard = globalThis.navigator?.clipboard,
  performAction = (action) => action(),
  requestFrame = globalThis.requestAnimationFrame || ((callback) => callback()),
} = {}) {
  if (!element || !jumpButton) throw new Error("Conversation Surface requires an element and jump button.");
  let followingLatest = true;

  const isNearBottom = () => element.scrollHeight - element.scrollTop - element.clientHeight < 72;
  const updateJumpButton = () => jumpButton.classList.toggle("hidden", followingLatest || isNearBottom());
  const scrollToLatest = ({ behavior = "auto" } = {}) => {
    followingLatest = true;
    element.scrollTo({ top: element.scrollHeight, behavior });
    updateJumpButton();
  };
  const handleScroll = () => {
    followingLatest = isNearBottom();
    updateJumpButton();
  };

  element.addEventListener("scroll", handleScroll, { passive: true });
  jumpButton.addEventListener("click", () => scrollToLatest({ behavior: "smooth" }));

  function bindActions(messages) {
    element.querySelectorAll("[data-conversation-approval]").forEach((button) => button.addEventListener("click", () => {
      const message = messages.find((item) => item.approval_request_id === button.dataset.conversationApproval);
      if (message && onApproval) onApproval(message, button.dataset.conversationApprovalDecision);
    }));
    element.querySelectorAll("[data-task-markdown-external-link]").forEach((button) => button.addEventListener("click", () => {
      if (onExternalLink) onExternalLink(button.dataset.taskMarkdownExternalLink);
    }));
    element.querySelectorAll("[data-conversation-copy-code]").forEach((button) => button.addEventListener("click", () => {
      void Promise.resolve(performAction(() => copyConversationCode(button, { clipboard }))).catch(() => {});
    }));
  }

  function render({ messages = [], emptyHtml = "" } = {}) {
    const visibleMessages = messages.filter(isConversationSurfaceMessageVisible);
    const previousScrollTop = element.scrollTop;
    const shouldFollow = followingLatest || isNearBottom();
    element.innerHTML = visibleMessages.length
      ? visibleMessages.map((message) => renderConversationSurfaceMessage(message, { formatTime, approvalEnabled: Boolean(onApproval) })).join("")
      : emptyHtml;
    bindActions(visibleMessages);
    requestFrame(() => {
      if (shouldFollow) scrollToLatest();
      else {
        element.scrollTop = previousScrollTop;
        updateJumpButton();
      }
    });
  }

  return {
    render,
    followLatest() { followingLatest = true; },
    isFollowingLatest() { return followingLatest; },
    isNearBottom,
    scrollToLatest,
  };
}

export async function copyConversationCode(button, { clipboard = globalThis.navigator?.clipboard, setTimer = globalThis.setTimeout } = {}) {
  const code = button.closest(".chat-code-block")?.querySelector("code")?.textContent || "";
  if (!clipboard?.writeText) throw new Error("当前环境不支持复制代码。");
  await clipboard.writeText(code);
  button.textContent = "已复制";
  setTimer?.(() => { button.textContent = "复制"; }, 1200);
}

export function renderConversationSurfaceMessage(message, { formatTime = (value) => String(value || ""), approvalEnabled = true } = {}) {
  const type = transcriptMessageType(message);
  const time = formatTime(message.updated_at || message.created_at);
  const status = String(message.status || "completed").toLowerCase();
  if (type === "reasoning") {
    return `<details class="chat-reasoning"><summary>思考过程 · ${escapeHtml(time)}</summary><div>${escapeHtml(message.content)}</div></details>`;
  }
  if (type === "tool") {
    const glyph = ["failed", "error"].includes(status) ? "!" : ACTIVE_STATUSES.has(status) ? "◌" : "✓";
    return `<div class="chat-tool"><span>${glyph}</span><span>${escapeHtml(message.content || "使用工具")}</span><small>${escapeHtml(messageStatusLabel(status))}</small></div>`;
  }
  if (type === "approval") {
    const actions = status === "pending" && approvalEnabled
      ? `<div class="chat-approval-actions"><button class="primary-button" data-conversation-approval="${escapeHtml(message.approval_request_id)}" data-conversation-approval-decision="accept" type="button">允许本次操作</button><button class="secondary-button" data-conversation-approval="${escapeHtml(message.approval_request_id)}" data-conversation-approval-decision="decline" type="button">拒绝</button></div>`
      : `<small>${status === "completed" ? "已允许" : status === "pending" ? "等待在任务控制面板处理" : "已拒绝或已失效"}</small>`;
    return `<section class="chat-approval"><p><strong>Codex 请求批准</strong><br>${escapeHtml(message.content)}</p>${actions}</section>`;
  }
  if (type === "error") return `<div class="chat-error conversation-error" role="alert">${escapeHtml(message.content)}</div>`;
  const user = type === "user";
  const content = user
    ? escapeHtml(message.content).replaceAll("\n", "<br>")
    : message.content ? renderConversationMarkdown(message.content) : `<span class="chat-streaming-cursor">▍</span>`;
  const label = user ? "你" : message.actor_label || "Codex";
  return `<article class="chat-message ${user ? "user" : "assistant"}"><div class="chat-message-meta"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(time)}</span>${status === "interrupted" ? "<span>已停止</span>" : ""}</div><div class="chat-message-content">${content}</div></article>`;
}

export function renderConversationMarkdown(value) {
  return renderRestrictedMarkdown(value)
    .replaceAll("<pre>", `<div class="chat-code-block"><button data-conversation-copy-code type="button">复制</button><pre>`)
    .replaceAll("</pre>", "</pre></div>");
}

function messageStatusLabel(status) {
  return ({ streaming: "进行中", started: "进行中", running: "进行中", in_progress: "进行中", completed: "完成", interrupted: "已停止", failed: "失败", error: "失败" })[status] || status;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}
