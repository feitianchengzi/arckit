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
  deferOffscreenLayout = false,
  onExternalLink = null,
  clipboard = globalThis.navigator?.clipboard,
  performAction = (action) => action(),
  requestFrame = globalThis.requestAnimationFrame || ((callback) => callback()),
} = {}) {
  if (!element || !jumpButton) throw new Error("Conversation Surface requires an element and jump button.");
  let followingLatest = true;
  let explicitSmoothScroll = false;
  let pendingRenderScroll = null;
  let activeContextId = "conversation:default";
  let nextFrameToken = 0;
  let restoreGeneration = 0;
  let settlingLatest = false;
  const contextScrollStates = new Map();
  let renderedOrder = [];
  let renderedSignatures = new Map();

  const isNearBottom = () => element.scrollHeight - element.scrollTop - element.clientHeight < 72;
  const updateJumpButton = () => jumpButton.classList.toggle("hidden", followingLatest || isNearBottom());
  const saveContextScrollState = (captureAnchor = false) => {
    if (activeContextId === null) return;
    let anchor = contextScrollStates.get(activeContextId)?.anchor || null;
    if (captureAnchor && deferOffscreenLayout && !followingLatest) {
      const top = element.getBoundingClientRect().top + element.clientTop;
      const node = [...element.children].find(node => node.dataset.conversationMessageId && node.getBoundingClientRect().bottom > top);
      anchor = node ? { id: node.dataset.conversationMessageId, offset: node.getBoundingClientRect().top - top } : null;
    }
    contextScrollStates.set(activeContextId, { followingLatest, scrollTop: element.scrollTop, anchor });
  };
  const restoreReadingPosition = (restored) => {
    const node = restored.anchor && [...element.children].find(node => node.dataset.conversationMessageId === restored.anchor.id);
    if (!node) { element.scrollTop = restored.scrollTop; return; }
    // Offscreen heights are estimates. Restore a message and its visible offset,
    // not a pixel coordinate based on the previous context's measured heights.
    const generation = ++restoreGeneration;
    node.scrollIntoView({ block: "start", behavior: "instant" });
    const align = () => {
      if (generation !== restoreGeneration || !element.contains(node)) return;
      element.scrollTop += node.getBoundingClientRect().top - element.getBoundingClientRect().top - element.clientTop - restored.anchor.offset;
      saveContextScrollState();
      updateJumpButton();
    };
    align();
    requestFrame(() => { align(); requestFrame(align); });
  };
  const scrollToLatest = ({ behavior = "instant" } = {}) => {
    restoreGeneration += 1;
    followingLatest = true;
    explicitSmoothScroll = behavior === "smooth";
    element.scrollTo({ top: element.scrollHeight, behavior });
    saveContextScrollState();
    updateJumpButton();
    if (deferOffscreenLayout && behavior !== "smooth") {
      const generation = restoreGeneration;
      settlingLatest = true;
      const settle = (remaining) => {
        if (generation !== restoreGeneration || !followingLatest) return;
        element.scrollTop = element.scrollHeight;
        if (remaining) requestFrame(() => settle(remaining - 1));
        else { settlingLatest = false; saveContextScrollState(); updateJumpButton(); }
      };
      requestFrame(() => settle(2));
    }
  };
  const handleScroll = () => {
    if (!explicitSmoothScroll && !settlingLatest) followingLatest = isNearBottom();
    saveContextScrollState();
    updateJumpButton();
  };
  const handleUserScrollIntent = () => {
    restoreGeneration += 1;
    settlingLatest = false;
    explicitSmoothScroll = false;
    followingLatest = false;
    pendingRenderScroll = null;
    saveContextScrollState();
    updateJumpButton();
  };
  const handleScrollEnd = () => {
    if (settlingLatest) return;
    if (deferOffscreenLayout && explicitSmoothScroll) { scrollToLatest(); return; }
    explicitSmoothScroll = false;
    followingLatest = isNearBottom();
    saveContextScrollState();
    updateJumpButton();
  };
  const flushRenderScroll = (frameToken) => {
    const pending = pendingRenderScroll;
    if (!pending || pending.frameToken !== frameToken) return;
    pendingRenderScroll = null;
    if (pending.contextId !== activeContextId) return;
    scrollToLatest();
  };
  const scheduleRenderScroll = () => {
    if (pendingRenderScroll?.contextId === activeContextId) return;
    const frameToken = ++nextFrameToken;
    pendingRenderScroll = { contextId: activeContextId, frameToken };
    requestFrame(() => flushRenderScroll(frameToken));
  };

  element.addEventListener("scroll", handleScroll, { passive: true });
  element.addEventListener("scrollend", handleScrollEnd, { passive: true });
  for (const eventName of ["wheel", "touchstart", "pointerdown", "keydown"]) {
    element.addEventListener(eventName, handleUserScrollIntent, { passive: true });
  }
  jumpButton.addEventListener("click", () => {
    pendingRenderScroll = null;
    scrollToLatest({ behavior: "smooth" });
  });

  function bindActions(messages, root = element) {
    root.querySelectorAll("[data-conversation-approval]").forEach((button) => button.addEventListener("click", () => {
      const message = messages.find((item) => item.approval_request_id === button.dataset.conversationApproval);
      if (message && onApproval) onApproval(message, button.dataset.conversationApprovalDecision);
    }));
    root.querySelectorAll("[data-task-markdown-external-link]").forEach((button) => button.addEventListener("click", () => {
      if (onExternalLink) onExternalLink(button.dataset.taskMarkdownExternalLink);
    }));
    root.querySelectorAll("[data-conversation-copy-code]").forEach((button) => button.addEventListener("click", () => {
      void Promise.resolve(performAction(() => copyConversationCode(button, { clipboard }))).catch(() => {});
    }));
  }

  function activateContext(contextId) {
    const nextContextId = contextId === undefined ? "conversation:default" : `conversation:${String(contextId || "empty")}`;
    if (nextContextId === activeContextId) return { changed: false, restored: null };
    saveContextScrollState(true);
    restoreGeneration += 1;
    activeContextId = nextContextId;
    settlingLatest = false;
    pendingRenderScroll = null;
    explicitSmoothScroll = false;
    renderedOrder = [];
    renderedSignatures = new Map();
    const restored = contextScrollStates.get(activeContextId) || null;
    followingLatest = restored?.followingLatest ?? true;
    return { changed: true, restored };
  }

  function render({ contextId, messages = [], emptyHtml = "" } = {}) {
    const context = activateContext(contextId);
    const visibleMessages = messages.filter(isConversationSurfaceMessageVisible);
    const entries = visibleMessages.map((message, index) => {
      const id = String(message.id || `conversation-${index}`);
      const type = transcriptMessageType(message);
      return { message, id, type, signature: messageRenderSignature(message, type) };
    });
    const nextOrder = entries.map((entry) => `${entry.id}:${entry.type}`);
    const shouldFollow = followingLatest;
    let changed = false;
    const sameStructure = nextOrder.length === renderedOrder.length && nextOrder.every((key, index) => key === renderedOrder[index]);
    let readingState = context.changed ? context.restored : null;
    if (deferOffscreenLayout && !context.changed && !sameStructure && !shouldFollow) {
      saveContextScrollState(true);
      readingState = contextScrollStates.get(activeContextId);
    }
    if (deferOffscreenLayout) element.classList.toggle("conversation-deferred-layout", visibleMessages.length > 100);
    if (!sameStructure || entries.length === 0) {
      const html = entries.length
        ? entries.map(({ message, id }) => renderConversationSurfaceMessage(message, { formatTime, approvalEnabled: Boolean(onApproval), messageId: id })).join("")
        : emptyHtml;
      if (context.changed || element.innerHTML !== html) {
        element.innerHTML = html;
        bindActions(visibleMessages);
        changed = true;
      }
    } else {
      const currentNodes = new Map([...element.querySelectorAll("[data-conversation-message-id]")]
        .map((node) => [String(node.dataset.conversationMessageId || ""), node]));
      for (const entry of entries) {
        if (renderedSignatures.get(entry.id) === entry.signature) continue;
        const current = currentNodes.get(entry.id);
        const replacement = current && conversationNodeFromHtml(element, renderConversationSurfaceMessage(entry.message, {
          formatTime,
          approvalEnabled: Boolean(onApproval),
          messageId: entry.id
        }));
        if (!current || !replacement || current.tagName !== replacement.tagName) {
          element.innerHTML = entries.map(({ message, id }) => renderConversationSurfaceMessage(message, {
            formatTime,
            approvalEnabled: Boolean(onApproval),
            messageId: id
          })).join("");
          bindActions(visibleMessages);
          changed = true;
          break;
        }
        current.className = replacement.className;
        current.innerHTML = replacement.innerHTML;
        bindActions([entry.message], current);
        changed = true;
      }
    }
    renderedOrder = nextOrder;
    renderedSignatures = new Map(entries.map((entry) => [entry.id, entry.signature]));
    if (readingState && !followingLatest) {
      restoreReadingPosition(readingState);
      saveContextScrollState();
      updateJumpButton();
    } else if ((changed || context.changed) && shouldFollow) scheduleRenderScroll();
    else updateJumpButton();
  }

  return {
    render,
    followLatest() { followingLatest = true; saveContextScrollState(); },
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

export function renderConversationSurfaceMessage(message, { formatTime = (value) => String(value || ""), approvalEnabled = true, messageId = String(message?.id || "") } = {}) {
  const type = transcriptMessageType(message);
  const identity = `data-conversation-message-id="${escapeHtml(messageId)}" data-conversation-message-type="${escapeHtml(type)}"`;
  const time = formatTime(message.updated_at || message.created_at);
  const status = String(message.status || "completed").toLowerCase();
  if (type === "reasoning") {
    return `<details class="chat-reasoning" ${identity}><summary>思考过程 · ${escapeHtml(time)}</summary><div>${escapeHtml(message.content)}</div></details>`;
  }
  if (type === "tool" && message.native_result?.task) {
    const r=message.native_result,t=r.task;return `<button type="button" class="chat-native-result" ${identity} data-native-task="${escapeHtml(t.id)}"><span><strong>${escapeHtml(t.title)}</strong><small>#${escapeHtml(t.id)} · ${escapeHtml(t.state)} · ${r.associated?"对应当前会话":r.action=== "create"?"从本会话创建": "已读取最新结果"}</small></span><span>打开对话 →</span></button>`;
  }
  if (type === "tool") {
    const glyph = ["failed", "error"].includes(status) ? "!" : ACTIVE_STATUSES.has(status) ? "◌" : "✓";
    return `<div class="chat-tool" ${identity}><span>${glyph}</span><span>${escapeHtml(message.content || "使用工具")}</span><small>${escapeHtml(messageStatusLabel(status))}</small></div>`;
  }
  if (type === "approval") {
    const actions = status === "pending" && approvalEnabled
      ? `<div class="chat-approval-actions"><button class="primary-button" data-conversation-approval="${escapeHtml(message.approval_request_id)}" data-conversation-approval-decision="accept" type="button">允许本次操作</button><button class="secondary-button" data-conversation-approval="${escapeHtml(message.approval_request_id)}" data-conversation-approval-decision="decline" type="button">拒绝</button></div>`
      : `<small>${status === "completed" ? "已允许" : status === "pending" ? "等待在任务控制面板处理" : "已拒绝或已失效"}</small>`;
    return `<section class="chat-approval" ${identity}><p><strong>Codex 请求批准</strong><br>${escapeHtml(message.content)}</p>${actions}</section>`;
  }
  if (type === "error") return `<div class="chat-error conversation-error" ${identity} role="alert">${escapeHtml(message.content)}</div>`;
  const user = type === "user";
  const content = user
    ? escapeHtml(message.content).replaceAll("\n", "<br>")
    : message.content ? renderConversationMarkdown(message.content) : `<span class="chat-streaming-cursor">▍</span>`;
  const context=message.native_context;const tags=user&&context ? `<div class="chat-message-context">${[context.capability,...(context.refs||[])].filter(Boolean).map(x=>`<span>${escapeHtml(x.label)}</span>`).join("")}</div>` : "";
  const label = user ? "你" : message.actor_label || "Codex";
  return `<article class="chat-message ${user ? "user" : "assistant"}" ${identity}><div class="chat-message-meta"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(time)}</span>${status === "interrupted" ? "<span>已停止</span>" : ""}</div><div class="chat-message-content">${content}${tags}</div></article>`;
}

export function renderConversationMarkdown(value) {
  return renderRestrictedMarkdown(value)
    .replaceAll("<pre>", `<div class="chat-code-block"><button data-conversation-copy-code type="button">复制</button><pre>`)
    .replaceAll("</pre>", "</pre></div>");
}

function messageStatusLabel(status) {
  return ({ streaming: "进行中", started: "进行中", running: "进行中", in_progress: "进行中", completed: "完成", interrupted: "已停止", failed: "失败", error: "失败" })[status] || status;
}

function messageRenderSignature(message, type) {
  return JSON.stringify([
    type,
    message.role || "",
    message.kind || "",
    message.content || "",
    JSON.stringify(message.native_context||null),JSON.stringify(message.native_result||null),
    message.status || "",
    message.approval_request_id || "",
    message.actor_label || "",
    message.updated_at || message.created_at || ""
  ]);
}

function conversationNodeFromHtml(element, html) {
  const document = element.ownerDocument;
  if (!document?.createElement) return null;
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content.firstElementChild;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}
