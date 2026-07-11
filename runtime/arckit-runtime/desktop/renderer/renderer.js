import { canAuthorizeRun as canAuthorizeRuntimeRun, deriveRuntimeControlState as deriveCanonicalRuntimeControlState } from "../../src/kernel/control-state.mjs";
import { buildControllerOperatorTask, buildDesktopOperatorEvent } from "../../src/kernel/operator-event.mjs";

const api = window.arckitDesktop;

const state = {
  projects: [],
  runs: [],
  sessions: [],
  messages: [],
  events: [],
  settings: {
    codex_proxy: {
      enabled: false,
      url: "http://127.0.0.1:7890"
    }
  },
  projectStatus: null,
  selectedProjectId: "",
  selectedSessionId: "",
  activeRunId: "",
  inspectorTab: "focus",
  messageAutoStick: true
};

let liveRunRenderScheduled = false;

const els = {
  pickProjectButton: document.getElementById("pickProjectButton"),
  projectPathInput: document.getElementById("projectPathInput"),
  addProjectPathButton: document.getElementById("addProjectPathButton"),
  projectList: document.getElementById("projectList"),
  sessionList: document.getElementById("sessionList"),
  newChatButton: document.getElementById("newChatButton"),
  runList: document.getElementById("runList"),
  selectedProjectName: document.getElementById("selectedProjectName"),
  selectedSessionTitle: document.getElementById("selectedSessionTitle"),
  selectedProjectPath: document.getElementById("selectedProjectPath"),
  activeRunBadge: document.getElementById("activeRunBadge"),
  settingsButton: document.getElementById("settingsButton"),
  inspectorTabs: Array.from(document.querySelectorAll("[data-inspector-tab]")),
  inspectorPanels: Array.from(document.querySelectorAll("[data-inspector-panel]")),
  settingsOverlay: document.getElementById("settingsOverlay"),
  closeSettingsButton: document.getElementById("closeSettingsButton"),
  codexProxyEnabled: document.getElementById("codexProxyEnabled"),
  codexProxyUrl: document.getElementById("codexProxyUrl"),
  saveSettingsButton: document.getElementById("saveSettingsButton"),
  messageList: document.getElementById("messageList"),
  chatInput: document.getElementById("chatInput"),
  approvalPolicy: document.getElementById("approvalPolicy"),
  modelInput: document.getElementById("modelInput"),
  sendButton: document.getElementById("sendButton"),
  interruptButton: document.getElementById("interruptButton"),
  continueButton: document.getElementById("continueButton"),
  authorizePacketButton: document.getElementById("authorizePacketButton"),
  gateButton: document.getElementById("gateButton"),
  writeDryRunButton: document.getElementById("writeDryRunButton"),
  writeLedgerButton: document.getElementById("writeLedgerButton"),
  activeRunSummary: document.getElementById("activeRunSummary"),
  runDetailSummary: document.getElementById("runDetailSummary"),
  loopState: document.getElementById("loopState"),
  stateGaps: document.getElementById("stateGaps"),
  eventList: document.getElementById("eventList"),
  clearEventsButton: document.getElementById("clearEventsButton"),
  refreshButton: document.getElementById("refreshButton")
};

boot();

async function boot() {
  wireEvents();
  await refreshSettings();
  await refreshAll();
  window.setInterval(() => {
    if (currentRun()?.status === "running") {
      renderMessages();
      renderActiveRun();
    }
  }, 5000);
}

function wireEvents() {
  els.pickProjectButton.addEventListener("click", () => runAction(async () => {
    const project = await api.pickProject();
    if (project) {
      state.selectedProjectId = project.id;
      resetMessageScrollStick();
    }
    await refreshAll();
  }));

  els.addProjectPathButton.addEventListener("click", () => runAction(async () => {
    const value = els.projectPathInput.value.trim();
    if (!value) {
      return;
    }
    const project = await api.addProject(value);
    state.selectedProjectId = project.id;
    resetMessageScrollStick();
    els.projectPathInput.value = "";
    await refreshAll();
  }));

  els.sendButton.addEventListener("click", () => sendChat());
  els.newChatButton.addEventListener("click", () => runAction(async () => {
    const project = selectedProject();
    if (!project) {
      return;
    }
    const session = await api.createSession(project.id, { title: "New chat" });
    state.selectedSessionId = session.id;
    state.activeRunId = "";
    resetMessageScrollStick();
    await refreshAll();
  }));
  els.chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      sendChat();
    }
  });
  els.chatInput.addEventListener("input", () => renderActiveRun());
  els.messageList.addEventListener("scroll", () => {
    state.messageAutoStick = isMessageListAtBottom();
  });

  els.interruptButton.addEventListener("click", () => runAction(async () => {
    const run = currentRun();
    if (!run || run.status !== "running") {
      return;
    }
    await api.controlRun(run.id, { type: "interrupt" });
    await refreshProjectConversation();
  }));

  els.continueButton.addEventListener("click", () => runAction(async () => {
    await handleRuntimePrimaryAction(deriveRuntimeControlState());
  }));

  els.authorizePacketButton.addEventListener("click", () => runAction(async () => {
    await authorizeCurrentPacket();
  }));

  els.gateButton.addEventListener("click", () => runAction(async () => {
    const result = await api.gateRun(state.activeRunId);
    await addSystemMessage(`Gate: ${formatCommandResult(result)}`);
    addUiEvent("gate-result", result.parsed || result.stderr || result.stdout);
    await refreshAll();
  }));

  els.writeDryRunButton.addEventListener("click", () => runAction(async () => {
    await writeLedgerForCurrentRun({ dryRun: true });
  }));

  els.writeLedgerButton.addEventListener("click", () => runAction(async () => {
    await writeLedgerForCurrentRun({ dryRun: false });
  }));

  els.clearEventsButton.addEventListener("click", () => {
    state.events = [];
    renderEvents();
  });

  els.refreshButton.addEventListener("click", () => refreshAll());

  for (const tab of els.inspectorTabs) {
    tab.addEventListener("click", () => {
      state.inspectorTab = tab.dataset.inspectorTab || "focus";
      renderInspectorTabs();
    });
  }

  els.settingsButton.addEventListener("click", () => {
    renderSettingsForm();
    els.settingsOverlay.classList.remove("hidden");
  });

  els.closeSettingsButton.addEventListener("click", () => {
    els.settingsOverlay.classList.add("hidden");
  });

  els.settingsOverlay.addEventListener("click", (event) => {
    if (event.target === els.settingsOverlay) {
      els.settingsOverlay.classList.add("hidden");
    }
  });

  els.saveSettingsButton.addEventListener("click", () => runAction(async () => {
    const url = els.codexProxyUrl.value.trim() || "http://127.0.0.1:7890";
    state.settings = await api.updateSettings({
      codex_proxy: {
        enabled: els.codexProxyEnabled.checked,
        url
      }
    });
    renderSettingsForm();
    els.settingsOverlay.classList.add("hidden");
    addUiEvent("settings.saved", {
      codex_proxy_enabled: state.settings.codex_proxy.enabled,
      codex_proxy_url: state.settings.codex_proxy.url
    });
  }));

  api.onEvent((event) => {
    const isStreamEvent = event.type === "run.event_line" || event.type === "run.stdout";
    if (!isStreamEvent) {
      state.events.unshift(event);
      state.events = state.events.slice(0, 200);
    }
    applyRunEventToState(event);
    if (event.type === "run.event_line") {
      scheduleLiveRunRender();
      return;
    }
    if (event.type === "run.stdout") {
      return;
    }
    if (event.type === "run.started") {
      if (eventBelongsToSelectedProject(event)) {
        state.activeRunId = event.run.id;
        state.selectedSessionId = event.run.session_id || state.selectedSessionId;
      }
    }
    if (event.type === "session.created") {
      if (eventBelongsToSelectedProject(event)) {
        state.selectedSessionId = event.session.id;
      }
    }
    if (event.type === "settings.updated") {
      state.settings = normalizeSettings(event.settings);
      renderSettingsForm();
    }
    if (event.type === "run.finished" || event.type === "message.added" || event.type === "session.created") {
      const belongs = eventBelongsToSelectedProject(event);
      if (belongs) {
        refreshProjectConversation();
        refreshProjectStatus();
      }
      refreshRuns();
    }
    render();
  });
}

function scheduleLiveRunRender() {
  if (liveRunRenderScheduled) {
    return;
  }
  liveRunRenderScheduled = true;
  window.requestAnimationFrame(() => {
    liveRunRenderScheduled = false;
    renderMessages();
    renderActiveRun();
    renderEvents();
  });
}

async function sendChat() {
  await runAction(async () => {
    const project = selectedProject();
    if (!project) {
      throw new Error("Select a project first.");
    }
    const text = els.chatInput.value.trim();
    const controlState = deriveRuntimeControlState();
    if (!text && controlState.primary_action !== "none") {
      await handleRuntimePrimaryAction(controlState);
      return;
    }
    if (!text) {
      return;
    }
    els.chatInput.value = "";
    const active = currentRun()?.status === "running";
    if (active) {
      await api.controlRun(state.activeRunId, { type: "controller-input", message: text });
    } else if (currentRun() && controlState.state !== "no_context") {
      await runControllerOperatorEvent(controlState, { userInput: text, action: "user_input" });
    } else {
      const session = await ensureSelectedSession(project.id);
      await api.addMessage(project.id, { role: "user", kind: "task", content: text, session_id: session.id });
      const run = await api.startRun({
        projectId: project.id,
        sessionId: session.id,
        task: text,
        dryRun: false,
        adapter: "codex-app-server",
        approvalPolicy: els.approvalPolicy.value,
        model: els.modelInput.value.trim()
      });
      state.activeRunId = run.id;
    }
    await refreshAll();
  });
}

async function refreshAll() {
  const projects = await api.listProjects();
  state.projects = projects;
  if (!state.selectedProjectId && projects.length > 0) {
    state.selectedProjectId = projects[0].id;
  }
  await refreshSessions();
  state.runs = await api.listRuns(runListFilter());
  selectDefaultRun();
  renderProjectShell();
  const refreshResults = await Promise.allSettled([
    refreshProjectConversation(),
    refreshProjectStatus()
  ]);
  for (const result of refreshResults) {
    if (result.status === "rejected") {
      addUiEvent("ui.refresh-warning", result.reason?.message || String(result.reason));
    }
  }
  render();
}

async function refreshSettings() {
  state.settings = normalizeSettings(await api.getSettings());
  renderSettingsForm();
}

async function refreshRuns() {
  state.runs = await api.listRuns(runListFilter());
  renderRuns();
  renderActiveRun();
}

async function refreshSessions() {
  const projectId = state.selectedProjectId;
  if (!projectId) {
    state.sessions = [];
    state.selectedSessionId = "";
    return;
  }
  const sessions = await api.listSessions(projectId);
  if (state.selectedProjectId !== projectId) {
    return;
  }
  state.sessions = sessions;
  if (!state.selectedSessionId || !state.sessions.some((session) => session.id === state.selectedSessionId)) {
    state.selectedSessionId = state.sessions[0]?.id || "";
  }
}

async function refreshProjectConversation() {
  const projectId = state.selectedProjectId;
  const sessionId = state.selectedSessionId;
  if (!projectId || !sessionId) {
    state.messages = [];
    return;
  }
  if (!state.sessions.some((session) => session.id === sessionId)) {
    state.messages = [];
    renderMessages();
    return;
  }
  const messages = await api.listMessages(projectId, sessionId);
  if (state.selectedProjectId !== projectId || state.selectedSessionId !== sessionId) {
    return;
  }
  state.messages = messages;
  renderMessages();
}

function resetMessageScrollStick() {
  state.messageAutoStick = true;
}

async function refreshProjectStatus() {
  const projectId = state.selectedProjectId;
  if (!projectId) {
    state.projectStatus = null;
    return;
  }
  const projectStatus = await api.projectStatus(projectId);
  if (state.selectedProjectId !== projectId) {
    return;
  }
  state.projectStatus = projectStatus;
  renderProjectStatus();
}

function render() {
  renderProjectShell();
  renderMessages();
  renderProjectStatus();
  renderEvents();
  renderInspectorTabs();
}

function renderProjectShell() {
  renderProjects();
  renderSessions();
  renderRuns();
  renderSelectedProject();
  renderActiveRun();
  renderInspectorTabs();
}

function renderInspectorTabs() {
  for (const tab of els.inspectorTabs) {
    const active = tab.dataset.inspectorTab === state.inspectorTab;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  }
  for (const panel of els.inspectorPanels) {
    panel.classList.toggle("active", panel.dataset.inspectorPanel === state.inspectorTab);
  }
}

function renderProjects() {
  if (state.projects.length === 0) {
    els.projectList.innerHTML = `<div class="empty">No projects</div>`;
    return;
  }
  els.projectList.innerHTML = state.projects.map((project) => `
    <div class="project-item ${project.id === state.selectedProjectId ? "selected" : ""}" data-project-id="${escapeHtml(project.id)}">
      <div class="project-name">${escapeHtml(project.name)}</div>
      <div class="project-path">${escapeHtml(project.path)}</div>
    </div>
  `).join("");
  for (const item of els.projectList.querySelectorAll(".project-item")) {
    item.addEventListener("click", async () => {
      state.selectedProjectId = item.dataset.projectId;
      state.selectedSessionId = "";
      resetMessageScrollStick();
      await refreshAll();
    });
  }
}

function renderSessions() {
  if (!state.selectedProjectId) {
    els.sessionList.innerHTML = `<div class="empty">No project</div>`;
    return;
  }
  if (state.sessions.length === 0) {
    els.sessionList.innerHTML = `<div class="empty">No chats</div>`;
    return;
  }
  els.sessionList.innerHTML = state.sessions.map((session) => `
    <div class="session-item ${session.id === state.selectedSessionId ? "selected" : ""}" data-session-id="${escapeHtml(session.id)}">
      <div class="session-title">${escapeHtml(session.title || "Untitled chat")}</div>
      <div class="session-meta">${escapeHtml(shortTime(session.updated_at || session.created_at))}</div>
    </div>
  `).join("");
  for (const item of els.sessionList.querySelectorAll(".session-item")) {
    item.addEventListener("click", async () => {
      state.selectedSessionId = item.dataset.sessionId;
      resetMessageScrollStick();
      selectDefaultRun();
      renderActiveRun();
      await refreshProjectConversation();
      render();
    });
  }
}

function renderRuns() {
  const projectRuns = state.selectedProjectId
    ? state.runs.filter((run) => run.project_id === state.selectedProjectId && (!state.selectedSessionId || run.session_id === state.selectedSessionId))
    : state.runs;
  if (projectRuns.length === 0) {
    els.runList.innerHTML = `<div class="empty">No runs</div>`;
    return;
  }
  els.runList.innerHTML = projectRuns.slice(0, 20).map((run) => `
    <div class="run-item ${run.id === state.activeRunId ? "selected" : ""}" data-run-id="${escapeHtml(run.id)}">
      <div class="run-title">${escapeHtml(run.id)}</div>
      <div class="run-meta">${escapeHtml(run.status)} · ${escapeHtml(run.adapter || "")}${run.round_result ? ` · ${escapeHtml(run.round_result)}` : ""}</div>
    </div>
  `).join("");
  for (const item of els.runList.querySelectorAll(".run-item")) {
    item.addEventListener("click", () => {
      state.activeRunId = item.dataset.runId;
      const run = currentRun();
      if (run?.session_id) {
        state.selectedSessionId = run.session_id;
      }
      resetMessageScrollStick();
      renderActiveRun();
      renderRuns();
      renderSessions();
      refreshProjectConversation();
      renderActiveRun();
    });
  }
}

function renderSelectedProject() {
  const project = selectedProject();
  if (!project) {
    els.selectedProjectName.textContent = "No project selected";
    els.selectedSessionTitle.textContent = "No chat";
    els.selectedProjectPath.textContent = "Select a project.";
    els.sendButton.disabled = true;
    return;
  }
  els.selectedProjectName.textContent = project.name;
  els.selectedSessionTitle.textContent = selectedSession()?.title || "No chat";
  els.selectedProjectPath.textContent = project.path;
  els.sendButton.disabled = false;
}

function renderMessages() {
  const shouldStick = state.messageAutoStick || isMessageListAtBottom();
  const previousScrollTop = els.messageList.scrollTop;
  if (!state.selectedProjectId) {
    els.messageList.innerHTML = `<div class="empty">No project selected</div>`;
    return;
  }
  if (!state.selectedSessionId) {
    els.messageList.innerHTML = `<div class="empty">No chat selected</div>`;
    return;
  }
  if (state.messages.length === 0) {
    const runCard = renderLiveRunCard();
    els.messageList.innerHTML = runCard || `<div class="empty">No messages</div>`;
    restoreMessageScroll({ shouldStick, previousScrollTop });
    return;
  }
  els.messageList.innerHTML = [
    ...state.messages.map((message) => `
    <article class="message ${escapeHtml(message.role)}">
      <div class="message-meta">
        <span>${escapeHtml(messageDisplayRole(message))}${message.kind ? ` · ${escapeHtml(message.kind)}` : ""}</span>
        <span>${escapeHtml(shortTime(message.created_at))}</span>
      </div>
      <div class="message-content">${escapeHtml(message.content)}</div>
    </article>
  `),
    renderLiveRunCard()
  ].filter(Boolean).join("");
  restoreMessageScroll({ shouldStick, previousScrollTop });
}

function messageDisplayRole(message) {
  if (message.role === "assistant") {
    return "Main agent";
  }
  if (message.role === "user") {
    return "You";
  }
  if (message.role === "system") {
    return "Runtime";
  }
  return message.role || "Message";
}

function isMessageListAtBottom() {
  const threshold = 80;
  return els.messageList.scrollHeight - els.messageList.scrollTop - els.messageList.clientHeight <= threshold;
}

function restoreMessageScroll({ shouldStick, previousScrollTop }) {
  if (shouldStick) {
    els.messageList.scrollTop = els.messageList.scrollHeight;
    state.messageAutoStick = true;
    return;
  }
  els.messageList.scrollTop = previousScrollTop;
  state.messageAutoStick = isMessageListAtBottom();
}

function renderActiveRun() {
  const run = currentRun();
  const active = run?.status === "running";
  const activity = normalizedActivity(run);
  const controlState = deriveRuntimeControlState();
  const hasDraftInput = els.chatInput.value.trim().length > 0;
  els.activeRunBadge.textContent = run ? run.status : "Idle";
  els.activeRunBadge.className = `badge ${active ? "warning" : run?.status === "completed" ? "ok" : ["failed", "aborted"].includes(run?.status) ? "danger" : ""}`;
  els.sendButton.textContent = active
    ? "Send To Controller"
    : !hasDraftInput && controlState.primary_label
      ? controlState.primary_label
      : hasDraftInput && controlState.state !== "no_context"
        ? "Send To Controller"
        : "Run";
  els.interruptButton.disabled = !active;
  els.continueButton.textContent = isOperatorEventAction(controlState.primary_action)
    ? controlState.primary_label
    : "Continue";
  els.sendButton.title = controlActionTooltip(controlState, hasDraftInput);
  els.continueButton.title = controlActionTooltip(controlState, false);
  els.continueButton.disabled = active || !isOperatorEventAction(controlState.primary_action);
  els.authorizePacketButton.disabled = controlState.primary_action !== "run_packet";
  els.gateButton.disabled = !run || active || !["ledger_gate_ready", "ledger_writeback_ready", "ledger_writeback_blocked"].includes(controlState.state);
  els.writeDryRunButton.disabled = !run || active || controlState.primary_action !== "write_ledger";
  els.writeLedgerButton.disabled = !run || active || controlState.primary_action !== "write_ledger";
  els.activeRunSummary.innerHTML = run
    ? safeRenderRunPanel(() => renderFocusActionSummary(run, activity, controlState), "Run summary")
    : "No active run.";
  if (els.runDetailSummary) {
    els.runDetailSummary.innerHTML = run
      ? safeRenderRunPanel(() => renderRunInspector(run, activity), "Worker detail")
      : "No active run.";
  }
}

function safeRenderRunPanel(renderFn, label) {
  try {
    return renderFn();
  } catch (error) {
    return `<div class="run-warning compact">${escapeHtml(label)} could not render: ${escapeHtml(error?.message || String(error))}</div>`;
  }
}

function renderSettingsForm() {
  const settings = normalizeSettings(state.settings);
  state.settings = settings;
  els.codexProxyEnabled.checked = Boolean(settings.codex_proxy.enabled);
  els.codexProxyUrl.value = settings.codex_proxy.url || "http://127.0.0.1:7890";
}

function renderProjectStatus() {
  const status = state.projectStatus;
  const project = selectedProject();
  const session = selectedSession();
  const run = currentRun();
  const controlState = deriveRuntimeControlState();
  if (!status || !status.has_arckit_state) {
    els.loopState.innerHTML = [
      stateLine("Project", project?.name || "No project"),
      stateLine("Chat", session?.title || "No chat"),
      stateLine("Run", run ? `${run.status || "-"} · ${run.adapter || ""}` : "Idle"),
      stateLine("Control", controlState.state || "No context")
    ].join("");
    els.stateGaps.innerHTML = `<div class="empty">First message will initialize a neutral recoverable state. The agent chooses the concrete route from the request and evidence.</div>`;
    return;
  }
  const loop = status.loop_control || {};
  const gap = status.top_gap || {};
  els.loopState.innerHTML = [
    stateLine("Project", project?.name || status.summary?.name || ""),
    stateLine("Chat", session?.title || "No chat"),
    stateLine("Run", run ? `${run.status || "-"} · ${run.adapter || ""}` : "Idle"),
    stateLine("Control", `${controlState.state || "-"}${controlState.primary_label ? ` · ${controlState.primary_label}` : ""}`),
    stateLine("Next", latestNextPrompt() || loop.next_transition || gap.next_transition || "Waiting for input")
  ].join("");

  const signals = [];
  if (gap.id || gap.next_transition || gap.impact) {
    signals.push(`
      <div class="state-item top-gap-item">
        <div class="state-title">${escapeHtml(gap.id || "Current state signal")}</div>
        <div class="state-meta">${escapeHtml([gap.current_state, gap.target_state].filter(Boolean).join(" -> "))}${gap.urgency ? ` · ${escapeHtml(gap.urgency)}` : ""}</div>
        <div class="state-meta">${escapeHtml(gap.next_transition || gap.impact || "")}</div>
      </div>
    `);
  }
  signals.push(...status.dimensions.slice(0, 5).map((dimension) => `
    <div class="state-item">
      <div class="state-title">${escapeHtml(dimension.name)}</div>
      <div class="state-meta">${escapeHtml(dimension.current_state)} -> ${escapeHtml(dimension.target_state)} · ${escapeHtml(dimension.priority)}</div>
      <div class="state-meta">${escapeHtml(dimension.next_transition || dimension.gap || "")}</div>
    </div>
  `));
  els.stateGaps.innerHTML = signals.length > 0 ? signals.join("") : `<div class="empty">No project signals yet. Use the chat to start or continue the turn.</div>`;
}

function renderEvents() {
  const run = currentRun();
  const rawEvents = normalizedActivity(run)?.raw_events || [];
  const evidence = renderArtifactPaths(normalizedActivity(run));
  if (rawEvents.length === 0 && state.events.length === 0) {
    els.eventList.innerHTML = [evidence, `<div class="empty">No events</div>`].filter(Boolean).join("");
    return;
  }
  const items = rawEvents.length > 0
    ? groupedActivityEventsForDisplay(rawEvents).slice().reverse().map((event) => `
      <div class="event-item">
        <div class="event-title">${escapeHtml(event.type || "raw")}</div>
        <div class="event-meta">${escapeHtml(shortTime(event.at || ""))}</div>
        <div>${escapeHtml(formatActivityEvent(event))}${event.count > 1 ? ` · ${escapeHtml(String(event.count))} events` : ""}</div>
      </div>
    `)
    : state.events.map((event) => `
    <div class="event-item">
      <div class="event-title">${escapeHtml(event.type)}</div>
      <div class="event-meta">${escapeHtml(shortTime(event.at || ""))}${event.runId ? ` · ${escapeHtml(event.runId)}` : ""}</div>
      <div>${escapeHtml(formatPayload(event))}</div>
    </div>
  `);
  els.eventList.innerHTML = [evidence, items.join("")].filter(Boolean).join("");
}

function groupedActivityEventsForDisplay(events) {
  const groups = [];
  for (const event of events) {
    const key = activityEventDisplayKey(event);
    const previous = groups.at(-1);
    if (previous?.display_key === key) {
      previous.at = event.at || previous.at;
      previous.type = activityEventDisplayType(event);
      previous.text = event.text || previous.text;
      previous.stream_text = event.stream_text || previous.stream_text;
      previous.delta_chunks = event.delta_chunks || previous.delta_chunks;
      previous.delta_chars = event.delta_chars || previous.delta_chars;
      previous.count += 1;
      continue;
    }
    groups.push({
      ...event,
      display_key: key,
      type: activityEventDisplayType(event),
      count: 1
    });
  }
  return groups;
}

function activityEventDisplayKey(event = {}) {
  if (event.delta_key) {
    return `delta:${event.delta_key}`;
  }
  if (event.type === "codex.item.started" || event.type === "codex.item.completed") {
    return `codex.item:${timelineBaseLabel(event.text || event.type || "")}`;
  }
  if (event.type === "codex.thread.status.changed") {
    return "codex.thread.status";
  }
  return `${event.type || "raw"}:${timelineStableDetail(event.text || "")}`;
}

function activityEventDisplayType(event = {}) {
  if (event.type === "codex.item.started" || event.type === "codex.item.completed") {
    return timelineBaseLabel(event.text || "Codex item");
  }
  return event.type || "raw";
}

function stateLine(label, value) {
  return `
    <div class="state-line">
      <div class="state-label">${escapeHtml(label)}</div>
      <div class="state-value">${escapeHtml(value || "-")}</div>
    </div>
  `;
}

function renderLiveRunCard() {
  const run = currentRun();
  if (!run || run.session_id !== state.selectedSessionId) {
    return "";
  }
  const activity = normalizedActivity(run);
  if (!activity || (run.status !== "running" && !activity.timeline?.length)) {
    return "";
  }
  const idle = idleSeconds(activity);
  const stale = run.status === "running" && idle >= 30;
  const errors = Array.isArray(activity.errors) && activity.errors.length > 0
    ? `<div class="run-card-section">
        <div class="run-card-label">Errors / Retries</div>
        <div class="execution-list">${activity.errors.slice(-5).map((item) => `
          <div class="execution-item ${item.will_retry ? "retrying" : "failed"}">
            <div class="execution-title">
              <span>${item.will_retry ? "Retrying" : "Error"}</span>
              <span>${escapeHtml(shortTime(item.at || ""))}</span>
            </div>
            <div class="execution-detail">${escapeHtml(item.message || "")}</div>
          </div>
        `).join("")}</div>
      </div>`
    : "";
  return `
    <article class="run-card ${run.status === "running" ? "live" : ""}">
      <div class="run-card-header">
        <div>
          <div class="run-card-title">Main agent is working</div>
          <div class="run-card-meta">${escapeHtml(activity.phase_label || run.status || "Run")} · ${escapeHtml(run.adapter || "")}</div>
        </div>
        <span class="badge ${run.status === "running" ? "warning" : run.status === "completed" ? "ok" : ["failed", "aborted"].includes(run.status) ? "danger" : ""}">
          ${escapeHtml(run.status)}
        </span>
      </div>
      <div class="run-card-step">${escapeHtml(activity.current_step || "Waiting for runtime events")}</div>
      <div class="run-card-metrics">
        <span>Elapsed ${escapeHtml(durationSince(activity.started_at || run.started_at))}</span>
        <span class="${stale ? "stale" : ""}">Last event ${escapeHtml(formatIdle(idle))}</span>
        <span>${activity.controls?.steer ? "Steer available" : "Steer unavailable"}</span>
      </div>
      ${stale ? `<div class="run-warning">No runtime events for ${idle}s. You can steer with the chat box or stop the run.</div>` : ""}
      ${renderMainAgentPanel(activity)}
      ${renderWorkerStatusPanel(activity)}
      ${renderMergePanel(activity)}
      ${errors}
    </article>
  `;
}

function renderMainAgentPanel(activity) {
  const output = activity.agent_text
    ? renderCodexOutputSection(activity.agent_text, activity.reports || [], activity)
    : "";
  const thinking = activity.reasoning_text
    ? `<details class="agent-disclosure">
        <summary>Reasoning summary</summary>
        <pre class="run-output thinking">${escapeHtml(tail(activity.reasoning_text, 1800))}</pre>
      </details>`
    : "";
  const commandOutput = activity.command_output
    ? `<details class="agent-disclosure">
        <summary>Command output</summary>
        <pre class="run-output command">${escapeHtml(tail(activity.command_output, 1600))}</pre>
      </details>`
    : "";
  if (!output && !thinking && !commandOutput) {
    return "";
  }
  return `
    <div class="main-agent-panel">
      <div class="run-card-label">Main agent</div>
      ${output}
      ${thinking}
      ${commandOutput}
    </div>
  `;
}

function renderWorkerStatusPanel(activity) {
  const workers = Array.isArray(activity.agents) ? activity.agents : [];
  const reports = Array.isArray(activity.reports) ? activity.reports : [];
  const packets = Array.isArray(activity.worker_packets) ? activity.worker_packets : [];
  const cards = workers.length
    ? workers.map((agent) => renderWorkerCard(agent)).join("")
    : packets.map((packet) => renderPendingWorkerPacket(packet)).join("");
  const reportCards = reports
    .filter((report) => !workers.some((agent) => agent.task_id && agent.task_id === report.task_id))
    .map((report) => renderStructuredReportCard(report))
    .join("");
  if (!cards && !reportCards) {
    return `
      <div class="run-card-section compact-run-details">
        <div class="run-card-label">Workers</div>
        <div class="compact-run-reason">No worker activity yet. The main agent is still planning or running directly.</div>
      </div>
    `;
  }
  return `
    <div class="run-card-section">
      <div class="worker-section-head">
        <div class="run-card-label">Workers</div>
        <div class="run-card-meta">${escapeHtml(String(workers.length || packets.length))} active · ${escapeHtml(String(reports.length))} reports</div>
      </div>
      <div class="agent-grid">${cards}${reportCards}</div>
    </div>
  `;
}

function renderWorkerCard(agent) {
  return `
    <div class="agent-tile ${escapeHtml(agent.status || "")}">
      <div class="agent-tile-head">
        <span>${escapeHtml(workerDisplayName(agent))}</span>
        <span>${escapeHtml(agent.status || "waiting")}</span>
      </div>
      <div class="worker-task">${escapeHtml(agent.current_step || agent.summary || agent.objective || "")}</div>
      ${renderAgentReportSnapshot(agent)}
      ${renderWorkerReportDetails(agent)}
      ${agent.latest_detail ? `<div class="agent-stream-line">${escapeHtml(agent.latest_detail)}</div>` : ""}
      ${agent.reasoning_text ? `<details class="agent-disclosure compact"><summary>Reasoning</summary><pre class="agent-stream thinking">${escapeHtml(tail(agent.reasoning_text, 700))}</pre></details>` : ""}
      ${renderAgentText(agent.agent_text, agent.report)}
      ${agent.command_output ? `<details class="agent-disclosure compact"><summary>Command</summary><pre class="agent-stream command">${escapeHtml(tail(agent.command_output, 700))}</pre></details>` : ""}
    </div>
  `;
}

function renderPendingWorkerPacket(packet) {
  return `
    <div class="agent-tile pending">
      <div class="agent-tile-head">
        <span>${escapeHtml(workerDisplayName(packet))}</span>
        <span>ready</span>
      </div>
      <div class="worker-task">${escapeHtml(packet.task || "")}</div>
      ${Array.isArray(packet.context_refs) && packet.context_refs.length
        ? `<div class="agent-stream-line">${escapeHtml(packet.context_refs.slice(0, 4).join(" · "))}</div>`
        : ""}
    </div>
  `;
}

function workerDisplayName(worker) {
  const workerType = worker?.worker_type || "";
  const role = worker?.role || worker?.task_id || worker?.worker_id || "";
  if (workerType && role && workerType !== role) {
    return `${workerType} · ${role}`;
  }
  return role || workerType || "worker";
}

function renderMergePanel(activity) {
  if (!activity.merge_result) {
    return "";
  }
  return `
    <div class="run-card-section">
      <div class="run-card-label">Main agent merge</div>
      <div class="merge-box">
        <div><strong>${escapeHtml(activity.merge_result.decision || "unknown")}</strong> · ${escapeHtml(activity.merge_result.loop_gate?.status || "")}</div>
        <div>${escapeHtml(activity.merge_result.loop_gate?.reason || "")}</div>
        ${activity.merge_result.next_prompt ? `<div class="merge-next">${escapeHtml(activity.merge_result.next_prompt)}</div>` : ""}
      </div>
    </div>
  `;
}

function renderCodexOutputSection(text, reports = [], activity = {}) {
  const parsedReports = parseWorkerReportsFromText(text);
  if ((Array.isArray(reports) && reports.length > 0) && looksLikeWorkerReportStream(text)) {
    return "";
  }
  if ((activity.controller_plan || activity.controller_frame) && looksLikeStructuredControllerStream(text)) {
    return "";
  }
  if (parsedReports.length > 0) {
    return `<div class="run-card-section">
        <div class="run-card-label">Structured Agent Output</div>
        <div class="report-list">${parsedReports.map((report) => renderStructuredReportCard(report)).join("")}</div>
      </div>`;
  }
  return `<div class="run-card-section">
        <div class="run-card-label">Message</div>
        <pre class="run-output">${escapeHtml(tail(text, 1800))}</pre>
      </div>`;
}

function looksLikeWorkerReportStream(text) {
  return typeof text === "string"
    && (
      text.includes("arckit-worker-report/v1")
      || text.includes("\"task_id\":\"TASK-")
      || text.includes("\"requires_main_agent_decision\"")
    );
}

function looksLikeStructuredControllerStream(text) {
  return typeof text === "string"
    && (
      text.includes("arckit-controller-plan/v1")
      || text.includes("arckit-desktop-operator-event/v1")
      || text.includes("\"route_plan\"")
      || text.includes("\"worker_intents\"")
    );
}

function renderAgentReportSnapshot(agent) {
  const report = agent.report || firstWorkerReportFromText(agent.agent_text || "");
  if (!report) {
    return "";
  }
  return `
    <div class="agent-report-snapshot">
      <div>${escapeHtml(report.summary || "")}</div>
      ${report.recommendation ? `<div class="agent-report-recommendation">${escapeHtml(report.recommendation)}</div>` : ""}
      ${report.requires_main_agent_decision ? `<div class="agent-report-warning">Controller decision required</div>` : ""}
    </div>
  `;
}

function renderWorkerReportDetails(agent) {
  const report = agent.report || firstWorkerReportFromText(agent.agent_text || "");
  const details = report ? renderReportDetails(report) : "";
  if (!details) {
    return "";
  }
  return `
    <details class="agent-disclosure compact worker-report-details" open>
      <summary>Details</summary>
      <div class="worker-report-detail-list">${details}</div>
    </details>
  `;
}

function renderAgentText(text, report) {
  if (!text || report || firstWorkerReportFromText(text)) {
    return "";
  }
  return `<pre class="agent-stream">${escapeHtml(tail(text, 900))}</pre>`;
}

function renderStructuredReportCard(report) {
  return `
    <div class="report-item ${escapeHtml(report.status || "")}">
      <div class="report-head">
        <span>${escapeHtml(workerDisplayName(report))}</span>
        <span>${escapeHtml(report.status || "")}</span>
      </div>
      <div class="report-summary">${escapeHtml(report.summary || "")}</div>
      ${renderReportDetails(report)}
    </div>
  `;
}

function firstWorkerReportFromText(text) {
  return parseWorkerReportsFromText(text)[0] || null;
}

function parseWorkerReportsFromText(text) {
  if (!text || typeof text !== "string") {
    return [];
  }
  return parseJsonObjectsFromText(text)
    .filter((item) => item?.schema_version === "arckit-worker-report/v1");
}

function parseJsonObjectsFromText(text) {
  const values = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }
    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
      continue;
    }
    if (char === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        const candidate = text.slice(start, index + 1);
        try {
          values.push(JSON.parse(candidate));
        } catch {
          // Ignore partial or corrupted historical stream fragments.
        }
        start = -1;
      }
    }
  }
  return values;
}

function renderFocusActionSummary(run, activity, controlState) {
  const loopGate = activity?.merge_result?.loop_gate || {};
  const ledgerStage = activity?.ledger_stage || {};
  const reportIntake = activity?.report_intake || activity?.merge_result?.report_intake || {};
  const reports = Array.isArray(activity?.reports) ? activity.reports : [];
  const workers = Array.isArray(activity?.agents) ? activity.agents : [];
  const reason = controlState.reason || loopGate.reason || activity?.current_step || "";
  const detailRows = [
    ["Run", `${run.status || "-"}${run.round_result ? ` · ${run.round_result}` : ""}`],
    ["Round", `${activity?.round_state || loopGate.status || "-"}${ledgerStage.status ? ` · ${ledgerStage.status}` : ""}`],
    ["Reports", `${reports.length} returned${Array.isArray(reportIntake.missing) && reportIntake.missing.length ? ` · ${reportIntake.missing.length} missing` : ""}`],
    ["Workers", workers.length ? workers.map((agent) => `${workerDisplayName(agent)}:${agent.status || "waiting"}`).slice(0, 3).join(" · ") : "No worker activity yet"]
  ];
  return `
    <div class="focus-summary ${escapeHtml(controlState.state)}">
      <div class="focus-state-row">
        <span class="focus-state">${escapeHtml(controlState.state.replaceAll("_", " "))}</span>
        ${controlState.primary_label ? `<span class="focus-primary">${escapeHtml(controlState.primary_label)}</span>` : ""}
      </div>
      <div class="focus-reason">${escapeHtml(reason || "No runtime control action is available.")}</div>
      <div class="focus-facts">
        ${detailRows.map(([label, value]) => `
          <div class="focus-fact">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderRunInspector(run, activity) {
  if (!activity) {
    return escapeHtml(`${run.id}\n${run.adapter}${run.round_result ? ` · ${run.round_result}` : ""}`);
  }
  const timeline = groupedTimelineForDisplay(activity.timeline || []).slice(-8).reverse().map((item) => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div>
        <div class="timeline-title">${escapeHtml(item.label || item.type || "")}</div>
        <div class="timeline-meta">${escapeHtml(shortTime(item.at || ""))}${item.detail ? ` · ${escapeHtml(item.detail)}` : ""}${item.count > 1 ? ` · ${escapeHtml(String(item.count))} events` : ""}</div>
      </div>
    </div>
  `).join("");
  const agents = (activity.agents || []).map((agent) => `
    <div class="mini-agent ${escapeHtml(agent.status || "")}">
      <span>${escapeHtml(workerDisplayName(agent))}</span>
      <strong>${escapeHtml(agent.status || "waiting")}</strong>
    </div>
  `).join("");
  const idle = idleSeconds(activity);
  const gate = activity.execution_gate || {};
  const binding = activity.executor_binding || {};
  const controlState = deriveRuntimeControlState();
  const persistedGate = activity.gate_result?.parsed || activity.ledger_write_result?.parsed?.gate || null;
  const ledgerWrite = activity.ledger_write_result?.parsed || null;
  return `
    <div class="active-run-panel">
      <div class="active-run-id">${escapeHtml(run.id)}</div>
      <div class="active-run-phase">${escapeHtml(activity.phase_label || run.status)} · ${escapeHtml(run.adapter || "")}</div>
      <div class="active-run-excerpt"><strong>Now</strong><span>${escapeHtml(activity.current_step || "")}</span></div>
      <div class="active-run-excerpt"><strong>Control</strong><span>${escapeHtml(controlState.state)}${controlState.primary_label ? ` · ${escapeHtml(controlState.primary_label)}` : ""}</span></div>
      <div class="active-run-excerpt"><strong>Round</strong><span>${escapeHtml(activity.round_state || "-")}${activity.ledger_stage?.status ? ` · ${escapeHtml(activity.ledger_stage.status)}` : ""}</span></div>
      <div class="active-run-excerpt"><strong>Gate</strong><span>${escapeHtml(gate.status || "-")} · ${escapeHtml(binding.executor || "no executor")}</span></div>
      ${persistedGate ? `<div class="active-run-excerpt"><strong>Write Gate</strong><span>${escapeHtml(persistedGate.decision || "")}${Array.isArray(persistedGate.reasons) && persistedGate.reasons.length ? ` · ${escapeHtml(persistedGate.reasons[0])}` : ""}</span></div>` : ""}
      ${ledgerWrite ? `<div class="active-run-excerpt"><strong>Ledger</strong><span>${ledgerWrite.written ? "written" : "not written"}${Array.isArray(ledgerWrite.changed_files) && ledgerWrite.changed_files.length ? ` · ${escapeHtml(ledgerWrite.changed_files.length)} files` : ""}</span></div>` : ""}
      <div class="active-run-meta">Elapsed ${escapeHtml(durationSince(activity.started_at || run.started_at))} · Last event ${escapeHtml(formatIdle(idle))}</div>
      ${run.status === "running" && idle >= 30 ? `<div class="run-warning compact">No events for ${idle}s</div>` : ""}
      ${agents ? `<div class="mini-agent-list">${agents}</div>` : `<div class="empty compact-empty">No worker activity yet</div>`}
      ${activity.merge_result ? `<div class="active-run-excerpt"><strong>Merge</strong><span>${escapeHtml(activity.merge_result.loop_gate?.reason || activity.merge_result.decision || "")}</span></div>` : ""}
      <div class="timeline-list">${timeline || `<div class="empty compact-empty">No timeline yet</div>`}</div>
    </div>
  `;
}

function groupedTimelineForDisplay(timeline) {
  const groups = [];
  for (const item of timeline) {
    const key = timelineDisplayKey(item);
    const previous = groups.at(-1);
    if (previous?.display_key === key) {
      previous.at = item.at || previous.at;
      previous.type = item.type || previous.type;
      previous.label = timelineDisplayLabel(item);
      previous.detail = timelineDisplayDetail(item) || previous.detail;
      previous.count += 1;
      continue;
    }
    groups.push({
      ...item,
      display_key: key,
      label: timelineDisplayLabel(item),
      detail: timelineDisplayDetail(item),
      count: 1
    });
  }
  return groups;
}

function timelineDisplayKey(item = {}) {
  const label = timelineBaseLabel(item.label || item.type || "");
  if (item.type === "codex.item.started" || item.type === "codex.item.completed") {
    return `codex.item:${label}`;
  }
  if (item.type === "codex.thread.status.changed") {
    return "codex.thread.status";
  }
  return `${item.type || label}:${label}:${timelineStableDetail(item.detail || "")}`;
}

function timelineDisplayLabel(item = {}) {
  return timelineBaseLabel(item.label || item.type || "");
}

function timelineDisplayDetail(item = {}) {
  const detail = item.detail || "";
  if (looksLikeStructuredControllerStream(detail) || looksLikeWorkerReportStream(detail)) {
    return "Structured output received";
  }
  return truncate(detail, 360);
}

function timelineBaseLabel(label) {
  return String(label || "")
    .replace(/\s+(started|completed)(\s*·.*)?$/i, "")
    .trim();
}

function timelineStableDetail(detail) {
  const text = String(detail || "");
  if (/^(msg|item|turn|thread)_[a-z0-9]+/i.test(text)) {
    return "";
  }
  return truncate(text, 80);
}

function applyRunEventToState(event) {
  const runId = event.run?.id || event.runId;
  if (!runId) {
    return;
  }
  const index = state.runs.findIndex((run) => run.id === runId);
  const incomingRun = event.run || null;
  if (index < 0 && incomingRun) {
    state.runs.unshift(incomingRun);
    return;
  }
  if (index < 0) {
    return;
  }
  if (incomingRun) {
    state.runs[index] = { ...state.runs[index], ...incomingRun };
  }
  if (event.activity) {
    state.runs[index] = { ...state.runs[index], activity: event.activity };
  }
  if (event.type === "run.finished") {
    state.runs[index] = {
      ...state.runs[index],
      status: event.status || state.runs[index].status,
      exit_code: event.exitCode ?? state.runs[index].exit_code,
      round_result: event.result?.runtime_result?.round_result || (event.status === "aborted" ? "aborted" : state.runs[index].round_result || ""),
      validation_valid: event.result?.validation?.valid ?? state.runs[index].validation_valid ?? null
    };
  }
}

function eventBelongsToSelectedProject(event) {
  const projectId = event.run?.project_id || event.projectId || event.project_id || "";
  return Boolean(projectId && projectId === state.selectedProjectId);
}

function normalizedActivity(run) {
  if (!run) {
    return null;
  }
  return run.activity || {
    status: run.status || "",
    phase_label: run.status || "",
    current_step: run.status === "running" ? "Waiting for runtime events" : "",
    started_at: run.started_at || "",
    last_event_at: run.started_at || "",
    controls: {
      steer: run.status === "running",
      interrupt: run.status === "running"
    },
    timeline: [],
    raw_events: [],
    execution_events: [],
    agents: [],
    reports: [],
    merge_result: null,
    controller_frame: null,
    execution_gate: null,
    executor_binding: null,
    worker_packets: [],
    report_intake_rules: null,
    closeout_rules: null,
    report_intake: null,
    loop_handoff: null,
    errors: [],
    plan: [],
    entry_capability: run.entry_capability || "runtime",
    operator: run.operator || "desktop"
  };
}

function renderControllerPacket(activity) {
  const frame = activity.controller_frame || {};
  const gate = activity.execution_gate || {};
  const binding = activity.executor_binding || {};
  const packets = Array.isArray(activity.worker_packets) ? activity.worker_packets : [];
  if (!frame.round_goal && !gate.status && packets.length === 0) {
    return "";
  }
  const packetRows = packets.slice(0, 8).map((packet) => `
    <div class="worker-packet">
      <div class="worker-packet-head">
        <span>${escapeHtml(workerDisplayName(packet))}</span>
        <span>${escapeHtml(packet.worker_id || "")}</span>
      </div>
      <div class="worker-packet-task">${escapeHtml(packet.task || "")}</div>
      ${Array.isArray(packet.context_refs) && packet.context_refs.length
        ? `<div class="worker-packet-meta">${escapeHtml(packet.context_refs.slice(0, 4).join(" · "))}</div>`
        : ""}
    </div>
  `).join("");
  const intake = activity.report_intake || {};
  const intakeLine = intake.accepted || intake.missing || intake.needs_revision
    ? `<div class="packet-line"><strong>Report intake</strong><span>accepted ${escapeHtml((intake.accepted || []).length)} · missing ${escapeHtml((intake.missing || []).length)} · revision ${escapeHtml((intake.needs_revision || []).length)}</span></div>`
    : "";
  return `
    <div class="run-card-section">
      <div class="run-card-label">Controller Packet</div>
      <div class="controller-packet">
        <div class="packet-line"><strong>Round</strong><span>${escapeHtml(frame.round_goal || "")}</span></div>
        <div class="packet-line"><strong>Status</strong><span>${escapeHtml(frame.round_status || activity.phase || "")}</span></div>
        <div class="packet-line"><strong>Turn</strong><span>${escapeHtml(frame.turn_delta?.relation_to_previous_loop || "")}${frame.turn_delta?.packet_effect ? ` · ${escapeHtml(frame.turn_delta.packet_effect)}` : ""}</span></div>
        <div class="packet-line"><strong>Gate</strong><span>${escapeHtml(gate.status || "-")} · ${escapeHtml(gate.required_decision || "")}</span></div>
        <div class="packet-line"><strong>Executor</strong><span>${escapeHtml(binding.executor || "none")} · ${escapeHtml(binding.authorization_source || "none")}</span></div>
        ${intakeLine}
        ${packetRows ? `<div class="worker-packet-list">${packetRows}</div>` : ""}
      </div>
    </div>
  `;
}

function renderArtifactPaths(activity) {
  const paths = activity?.artifact_paths || {};
  const rows = [
    ["Raw JSONL", paths.raw_events_file],
    ["Normalized", paths.events_file],
    ["Activity", paths.activity_file],
    ["Result", paths.result_file]
  ].filter(([, value]) => value);
  if (rows.length === 0) {
    return "";
  }
  return `
    <div class="run-card-section">
      <div class="run-card-label">Saved Evidence</div>
      <div class="artifact-paths">${rows.map(([label, value]) => `
        <div class="artifact-path"><span>${escapeHtml(label)}</span><code>${escapeHtml(value)}</code></div>
      `).join("")}</div>
    </div>
  `;
}

function renderReportDetails(report) {
  return [
    renderReportList("Findings", report.findings),
    renderReportList("Evidence", report.evidence),
    renderReportList("Changes", report.changes),
    renderReportList("Risks", report.risks),
    renderReportList("Unknowns", report.unknowns),
    report.recommendation ? `<div class="report-detail"><strong>Recommendation</strong><span>${escapeHtml(report.recommendation)}</span></div>` : "",
    report.requires_main_agent_decision ? `<div class="report-detail warning"><strong>Decision</strong><span>Main-agent decision required</span></div>` : ""
  ].filter(Boolean).join("");
}

function renderReportList(label, values) {
  if (!Array.isArray(values) || values.length === 0) {
    return "";
  }
  return `
    <div class="report-detail">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(values.slice(0, 6).join(" · "))}${values.length > 6 ? ` · +${values.length - 6}` : ""}</span>
    </div>
  `;
}

async function addSystemMessage(content) {
  const project = selectedProject();
  if (!project) {
    return;
  }
  await api.addMessage(project.id, {
    role: "system",
    kind: "command",
    content,
    run_id: state.activeRunId,
    session_id: state.selectedSessionId
  });
  await refreshProjectConversation();
}

function addUiEvent(type, payload) {
  state.events.unshift({
    type,
    at: new Date().toISOString(),
    payload
  });
  state.events = state.events.slice(0, 200);
  renderEvents();
}

async function runAction(action) {
  try {
    await action();
  } catch (error) {
    addUiEvent("ui.error", error.message || String(error));
  }
}

function selectedProject() {
  return state.projects.find((project) => project.id === state.selectedProjectId) || null;
}

function selectedSession() {
  return state.sessions.find((session) => session.id === state.selectedSessionId) || null;
}

function currentRun() {
  return state.runs.find((run) => run.id === state.activeRunId) || null;
}

function deriveRuntimeControlState() {
  const run = currentRun();
  return deriveCanonicalRuntimeControlState({
    run,
    project: selectedProject(),
    session: selectedSession(),
    activity: normalizedActivity(run),
    latestNextPrompt: latestNextPrompt()
  });
}

function isOperatorEventAction(action) {
  return [
    "auto_continue",
    "continue_next_round",
    "respond_to_gate",
    "resume",
    "resume_with_update",
    "resolve_blocker",
    "resolve_gate",
    "diagnose",
    "start_next_round",
    "review_reports"
  ].includes(action);
}

function controlActionTooltip(controlState, hasDraftInput) {
  if (hasDraftInput) {
    return "Send your message to the Controller as additional context for the next runtime turn.";
  }
  switch (controlState.primary_action) {
    case "auto_continue":
      return "The loop handoff allows automatic agent continuation. Click to start the next round now.";
    case "continue_next_round":
      return "Start the next runtime round using the current loop handoff and worker reports.";
    case "resolve_blocker":
      return "A hard blocker remains. Start a recovery round with the blocker evidence attached.";
    case "respond_to_gate":
      return "A human decision is required before the loop can continue.";
    case "write_ledger":
      return "Write validated runtime progress into the project ledger.";
    case "run_packet":
      return "Authorize and execute the previewed worker packet.";
    case "review_reports":
      return "Resume Controller review for worker reports that need attention.";
    case "resume_with_update":
      return "Resume the loop with external or corrected context.";
    case "diagnose":
      return "Start a diagnostic round for the failed or invalid runtime result.";
    default:
      return "";
  }
}

async function handleRuntimePrimaryAction(controlState) {
  if (controlState.primary_action === "run_packet") {
    await authorizeCurrentPacket();
    return;
  }
  if (controlState.primary_action === "write_ledger") {
    await writeLedgerForCurrentRun({ dryRun: false });
    return;
  }
  if (isOperatorEventAction(controlState.primary_action)) {
    await runControllerOperatorEvent(controlState, { action: controlState.primary_action });
  }
}

async function writeLedgerForCurrentRun({ dryRun }) {
  const run = currentRun();
  if (!run || run.status === "running") {
    return;
  }
  const result = await api.writeLedger(run.id, { dryRun });
  await addSystemMessage(`${dryRun ? "Ledger preview" : "Ledger write"}: ${formatCommandResult(result)}`);
  addUiEvent(dryRun ? "write-ledger dry-run" : "write-ledger", result.parsed || result.stderr || result.stdout);
  await refreshAll();
}

async function runControllerOperatorEvent(controlState, { userInput = "", action = "" } = {}) {
  const project = selectedProject();
  if (!project) {
    return;
  }
  const session = await ensureSelectedSession(project.id);
  const operatorEvent = buildOperatorEvent(controlState, {
    action: action || controlState.primary_action,
    userInput
  });
  const task = buildControllerOperatorTask(operatorEvent);
  await api.addMessage(project.id, {
    role: "user",
    kind: "operator-event",
    content: task,
    session_id: session.id
  });
  const run = await api.startRun({
    projectId: project.id,
    sessionId: session.id,
    task,
    dryRun: false,
    adapter: "codex-app-server",
    approvalPolicy: els.approvalPolicy.value,
    model: els.modelInput.value.trim()
  });
  state.activeRunId = run.id;
  await refreshAll();
}

function buildOperatorEvent(controlState, { action, userInput }) {
  const run = currentRun();
  const activity = normalizedActivity(run);
  return buildDesktopOperatorEvent({
    action,
    userInput,
    controlState,
    project: selectedProject(),
    session: selectedSession(),
    run,
    activity,
    projectStatus: state.projectStatus,
    latestNextPrompt: latestNextPrompt()
  });
}

async function authorizeCurrentPacket() {
  const project = selectedProject();
  const packetRun = currentRun();
  if (!project || !packetRun || !canAuthorizeRuntimeRun({ run: packetRun, activity: normalizedActivity(packetRun) })) {
    return;
  }
  await api.addMessage(project.id, {
    role: "user",
    kind: "authorize-packet",
    content: `Authorize execution for packet ${packetRun.id}.`,
    run_id: packetRun.id,
    session_id: state.selectedSessionId
  });
  const run = await api.startRun({
    projectId: project.id,
    sessionId: state.selectedSessionId,
    authorizeRunId: packetRun.id,
    task: packetRun.task || "",
    dryRun: false,
    adapter: "codex-app-server",
    approvalPolicy: els.approvalPolicy.value,
    model: els.modelInput.value.trim()
  });
  state.activeRunId = run.id;
  await refreshAll();
}

function latestNextPrompt() {
  const run = currentRun();
  const activity = normalizedActivity(run);
  return activity?.loop_handoff?.next_prompt
    || activity?.merge_result?.next_prompt
    || state.projectStatus?.loop_control?.continuation_prompt
    || "";
}

function selectDefaultRun() {
  const latestRun = state.runs.find((run) => run.project_id === state.selectedProjectId && (!state.selectedSessionId || run.session_id === state.selectedSessionId));
  state.activeRunId = latestRun?.id || "";
}

function runListFilter() {
  return {
    projectId: state.selectedProjectId,
    sessionId: state.selectedSessionId
  };
}

async function ensureSelectedSession(projectId) {
  const current = selectedSession();
  if (current) {
    return current;
  }
  const session = await api.createSession(projectId, { title: "New chat" });
  state.selectedSessionId = session.id;
  await refreshSessions();
  return session;
}

function normalizeSettings(settings = {}) {
  const proxy = settings.codex_proxy && typeof settings.codex_proxy === "object"
    ? settings.codex_proxy
    : {};
  return {
    codex_proxy: {
      enabled: Boolean(proxy.enabled),
      url: String(proxy.url || "http://127.0.0.1:7890").trim() || "http://127.0.0.1:7890"
    }
  };
}

function formatPayload(event) {
  const copy = { ...event };
  delete copy.type;
  delete copy.at;
  delete copy.activity;
  delete copy.run;
  delete copy.result;
  if (copy.parsed?.event?.type) {
    return summarizeRuntimeEvent(copy.parsed.event);
  }
  if (copy.message?.content) {
    return truncate(copy.message.content, 1200);
  }
  if (event.activity?.current_step) {
    return event.activity.current_step;
  }
  if (event.run?.id) {
    return `${event.run.id} ${event.run.status || ""}`.trim();
  }
  return truncate(JSON.stringify(copy, null, 2), 1200);
}

function formatActivityEvent(entry) {
  if (entry?.stream_text) {
    if (looksLikeWorkerReportStream(entry.stream_text) || looksLikeStructuredControllerStream(entry.stream_text)) {
      return entry.text || "Structured stream";
    }
    return `${entry.text || "Delta stream"}\n${tail(entry.stream_text, 900)}`;
  }
  const parsed = parseActivityEventText(entry.text || "");
  if (parsed?.event) {
    return summarizeRuntimeEvent(parsed.event);
  }
  return truncate(entry.text || "", 1200);
}

function parseActivityEventText(text) {
  if (!text || typeof text !== "string" || !text.trim().startsWith("{")) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function summarizeRuntimeEvent(event) {
  if (!event || typeof event !== "object") {
    return "";
  }
  switch (event.type) {
    case "codex.agent_message.delta":
      return `Agent message delta · ${String(event.text || "").length} chars${event.task_id ? ` · ${event.task_id}` : ""}`;
    case "codex.reasoning.delta":
      return `Reasoning delta · ${String(event.text || "").length} chars${event.task_id ? ` · ${event.task_id}` : ""}`;
    case "codex.command.output.delta":
      return `Command output delta · ${String(event.text || "").length} chars${event.task_id ? ` · ${event.task_id}` : ""}`;
    case "runtime.loop_frame.created":
      return `Controller frame · ${event.loop_frame?.execution_gate?.status || "gate"} · ${(event.loop_frame?.worker_packets || []).length} workers`;
    case "runtime.controller_plan.completed":
      return `Controller plan · ${event.status || ""}${event.controller_plan?.summary ? ` · ${truncate(event.controller_plan.summary, 700)}` : ""}`;
    case "runtime.worker_report.completed":
      return `${event.role || event.task_id || "worker"} report · ${event.status || event.report?.status || ""}${event.report?.summary ? ` · ${truncate(event.report.summary, 700)}` : ""}`;
    case "runtime.merge.completed":
      return `Merge · ${event.merge_result?.decision || "unknown"}${event.merge_result?.loop_gate?.reason ? ` · ${truncate(event.merge_result.loop_gate.reason, 700)}` : ""}`;
    case "codex.item.started":
    case "codex.item.completed":
      return `${event.params?.item?.type || "item"} ${event.type.endsWith("completed") ? "completed" : "started"}${event.params?.item?.id ? ` · ${event.params.item.id}` : ""}`;
    default:
      return truncate([event.message, event.params?.message, event.status, event.type].filter(Boolean).join(" · "), 1200);
  }
}

function formatCommandResult(result) {
  if (result.parsed?.decision) {
    return `${result.parsed.decision}${result.parsed.reasons?.length ? `\n${result.parsed.reasons.join("\n")}` : ""}`;
  }
  if (typeof result.parsed?.written === "boolean") {
    return result.parsed.written ? "written" : result.parsed.gate?.decision || "not written";
  }
  return result.stderr || result.stdout || `exit ${result.code}`;
}

function shortTime(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function durationSince(value) {
  if (!value) {
    return "-";
  }
  const start = new Date(value).getTime();
  if (Number.isNaN(start)) {
    return "-";
  }
  const seconds = Math.max(0, Math.round((Date.now() - start) / 1000));
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

function idleSeconds(activity) {
  const value = activity?.last_event_at || activity?.updated_at || activity?.started_at;
  const time = new Date(value || "").getTime();
  if (Number.isNaN(time)) {
    return 0;
  }
  return Math.max(0, Math.round((Date.now() - time) / 1000));
}

function formatIdle(seconds) {
  if (seconds < 3) {
    return "just now";
  }
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

function tail(value, limit) {
  const text = String(value || "");
  return text.length > limit ? text.slice(text.length - limit) : text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
