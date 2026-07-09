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
  messageAutoStick: true
};

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
  projectStateBadge: document.getElementById("projectStateBadge"),
  activeRunBadge: document.getElementById("activeRunBadge"),
  settingsButton: document.getElementById("settingsButton"),
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
    state.events.unshift(event);
    state.events = state.events.slice(0, 200);
    applyRunEventToState(event);
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
        dryRun: selectedMode() === "dry-run",
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
  const [projects, runs] = await Promise.all([
    api.listProjects(),
    api.listRuns()
  ]);
  state.projects = projects;
  state.runs = runs;
  if (!state.selectedProjectId && projects.length > 0) {
    state.selectedProjectId = projects[0].id;
  }
  await refreshSessions();
  selectDefaultRun();
  await Promise.all([
    refreshProjectConversation(),
    refreshProjectStatus()
  ]);
  render();
}

async function refreshSettings() {
  state.settings = normalizeSettings(await api.getSettings());
  renderSettingsForm();
}

async function refreshRuns() {
  state.runs = await api.listRuns();
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
  renderProjects();
  renderSessions();
  renderRuns();
  renderSelectedProject();
  renderMessages();
  renderActiveRun();
  renderProjectStatus();
  renderEvents();
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
      await refreshSessions();
      selectDefaultRun();
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
    els.projectStateBadge.textContent = "No state";
    els.projectStateBadge.className = "badge";
    els.sendButton.disabled = true;
    return;
  }
  els.selectedProjectName.textContent = project.name;
  els.selectedSessionTitle.textContent = selectedSession()?.title || "No chat";
  els.selectedProjectPath.textContent = project.path;
  els.projectStateBadge.textContent = project.has_arckit_state ? "Arckit state" : "Missing state";
  els.projectStateBadge.className = project.has_arckit_state ? "badge ok" : "badge warning";
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
        <span>${escapeHtml(message.role)}${message.kind ? ` · ${escapeHtml(message.kind)}` : ""}</span>
        <span>${escapeHtml(shortTime(message.created_at))}</span>
      </div>
      <div class="message-content">${escapeHtml(message.content)}</div>
    </article>
  `),
    renderLiveRunCard()
  ].filter(Boolean).join("");
  restoreMessageScroll({ shouldStick, previousScrollTop });
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
  els.activeRunBadge.className = `badge ${active ? "warning" : run?.status === "completed" ? "ok" : run?.status === "failed" ? "danger" : ""}`;
  els.activeRunSummary.innerHTML = run
    ? renderRunInspector(run, activity)
    : "No active run.";
  els.sendButton.textContent = active
    ? "Send To Controller"
    : !hasDraftInput && controlState.primary_label
      ? controlState.primary_label
      : hasDraftInput && controlState.state !== "no_context"
        ? "Send To Controller"
        : selectedMode() === "dry-run" ? "Preview Packet" : "Run";
  els.interruptButton.disabled = !active;
  els.continueButton.textContent = isOperatorEventAction(controlState.primary_action)
    ? controlState.primary_label
    : "Continue";
  els.continueButton.disabled = active || !isOperatorEventAction(controlState.primary_action);
  els.authorizePacketButton.disabled = controlState.primary_action !== "run_packet";
  els.gateButton.disabled = !run || active || !["ledger_gate_ready", "ledger_writeback_ready", "ledger_writeback_blocked"].includes(controlState.state);
  els.writeDryRunButton.disabled = !run || active || controlState.primary_action !== "write_ledger";
  els.writeLedgerButton.disabled = !run || active || controlState.primary_action !== "write_ledger";
}

function renderSettingsForm() {
  const settings = normalizeSettings(state.settings);
  state.settings = settings;
  els.codexProxyEnabled.checked = Boolean(settings.codex_proxy.enabled);
  els.codexProxyUrl.value = settings.codex_proxy.url || "http://127.0.0.1:7890";
}

function renderProjectStatus() {
  const status = state.projectStatus;
  if (!status || !status.has_arckit_state) {
    els.loopState.innerHTML = `<div class="empty">Arckit state will be initialized on first message</div>`;
    els.stateGaps.innerHTML = `<div class="empty">Initial discovery gap will be created automatically</div>`;
    return;
  }
  const loop = status.loop_control || {};
  const gap = status.top_gap || {};
  els.loopState.innerHTML = [
    stateLine("Focus", loop.current_loop_focus || ""),
    stateLine("Next", loop.next_transition || ""),
    stateLine("Owner", loop.next_responsibility || ""),
    stateLine("Trigger", loop.trigger_mode || ""),
    stateLine("Top gap", gap.id || "")
  ].join("");

  const dimensionItems = status.dimensions.map((dimension) => `
    <div class="state-item">
      <div class="state-title">${escapeHtml(dimension.name)}</div>
      <div class="state-meta">${escapeHtml(dimension.current_state)} -> ${escapeHtml(dimension.target_state)} · ${escapeHtml(dimension.priority)}</div>
      <div class="state-meta">${escapeHtml(dimension.next_transition || dimension.gap || "")}</div>
    </div>
  `);
  if (status.top_gap) {
    dimensionItems.unshift(`
      <div class="state-item">
        <div class="state-title">${escapeHtml(status.top_gap.id)}</div>
        <div class="state-meta">${escapeHtml(status.top_gap.current_state)} -> ${escapeHtml(status.top_gap.target_state)} · ${escapeHtml(status.top_gap.urgency)}</div>
        <div class="state-meta">${escapeHtml(status.top_gap.next_transition || status.top_gap.impact || "")}</div>
      </div>
    `);
  }
  els.stateGaps.innerHTML = dimensionItems.length > 0 ? dimensionItems.join("") : `<div class="empty">No priority gaps</div>`;
}

function renderEvents() {
  const run = currentRun();
  const rawEvents = normalizedActivity(run)?.raw_events || [];
  if (rawEvents.length === 0 && state.events.length === 0) {
    els.eventList.innerHTML = `<div class="empty">No events</div>`;
    return;
  }
  const items = rawEvents.length > 0
    ? rawEvents.slice().reverse().map((event) => `
      <div class="event-item">
        <div class="event-title">${escapeHtml(event.type || "raw")}</div>
        <div class="event-meta">${escapeHtml(shortTime(event.at || ""))}</div>
        <div>${escapeHtml(event.text || "")}</div>
      </div>
    `)
    : state.events.map((event) => `
    <div class="event-item">
      <div class="event-title">${escapeHtml(event.type)}</div>
      <div class="event-meta">${escapeHtml(shortTime(event.at || ""))}${event.runId ? ` · ${escapeHtml(event.runId)}` : ""}</div>
      <div>${escapeHtml(formatPayload(event))}</div>
    </div>
  `);
  els.eventList.innerHTML = items.join("");
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
  const entryCapability = activity.entry_capability || run.entry_capability || "using-arckit";
  const operator = activity.operator || run.operator || "desktop";
  const plan = Array.isArray(activity.plan) && activity.plan.length > 0
    ? `<div class="run-card-section">
        <div class="run-card-label">Plan</div>
        <div class="plan-list">${activity.plan.map((item) => `
          <div class="plan-item">
            <span class="plan-status">${escapeHtml(item.status || "-")}</span>
            <span>${escapeHtml(item.text || "")}</span>
          </div>
        `).join("")}</div>
      </div>`
    : "";
  const reasoning = activity.reasoning_text
    ? `<div class="run-card-section">
        <div class="run-card-label">Thinking Summary</div>
        <pre class="run-output thinking">${escapeHtml(tail(activity.reasoning_text, 1800))}</pre>
      </div>`
    : "";
  const execution = Array.isArray(activity.execution_events) && activity.execution_events.length > 0
    ? `<div class="run-card-section">
        <div class="run-card-label">Execution Details</div>
        <div class="execution-list">${activity.execution_events.slice(-12).map((item) => `
          <div class="execution-item ${escapeHtml(item.status || "")}">
            <div class="execution-title">
              <span>${escapeHtml(item.title || item.type || "Event")}</span>
              <span>${escapeHtml(item.status || "")}</span>
            </div>
            ${item.detail ? `<div class="execution-detail">${escapeHtml(item.detail)}</div>` : ""}
          </div>
        `).join("")}</div>
      </div>`
    : "";
  const agents = Array.isArray(activity.agents) && activity.agents.length > 0
    ? `<div class="run-card-section">
        <div class="run-card-label">Worker Loop</div>
        <div class="agent-grid">${activity.agents.map((agent) => `
          <div class="agent-tile ${escapeHtml(agent.status || "")}">
            <div class="agent-tile-head">
              <span>${escapeHtml(agent.role || agent.task_id || "agent")}</span>
              <span>${escapeHtml(agent.status || "waiting")}</span>
            </div>
            <div class="worker-task">${escapeHtml(agent.current_step || agent.summary || agent.objective || "")}</div>
            ${renderAgentReportSnapshot(agent)}
            ${agent.latest_detail ? `<div class="agent-stream-line">${escapeHtml(agent.latest_detail)}</div>` : ""}
            ${agent.reasoning_text ? `<pre class="agent-stream thinking">${escapeHtml(tail(agent.reasoning_text, 700))}</pre>` : ""}
            ${renderAgentText(agent.agent_text, agent.report)}
            ${agent.command_output ? `<pre class="agent-stream command">${escapeHtml(tail(agent.command_output, 700))}</pre>` : ""}
          </div>
        `).join("")}</div>
      </div>`
    : "";
  const controller = renderControllerPacket(activity);
  const reports = Array.isArray(activity.reports) && activity.reports.length > 0
    ? `<div class="run-card-section">
        <div class="run-card-label">Worker Reports</div>
        <div class="report-list">${activity.reports.map((report) => `
          <div class="report-item ${escapeHtml(report.status || "")}">
            <div class="report-head">
              <span>${escapeHtml(report.role || report.task_id || "")}</span>
              <span>${escapeHtml(report.status || "")}</span>
            </div>
            <div class="report-summary">${escapeHtml(report.summary || "")}</div>
            ${renderReportDetails(report)}
          </div>
        `).join("")}</div>
      </div>`
    : "";
  const merge = activity.merge_result
    ? `<div class="run-card-section">
        <div class="run-card-label">Merge Gate</div>
        <div class="merge-box">
          <div><strong>${escapeHtml(activity.merge_result.decision || "unknown")}</strong> · ${escapeHtml(activity.merge_result.loop_gate?.status || "")}</div>
          <div>${escapeHtml(activity.merge_result.loop_gate?.reason || "")}</div>
          ${activity.merge_result.next_prompt ? `<div class="merge-next">${escapeHtml(activity.merge_result.next_prompt)}</div>` : ""}
        </div>
      </div>`
    : "";
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
  const agentText = activity.agent_text
    ? renderCodexOutputSection(activity.agent_text, activity.reports || [])
    : "";
  const commandOutput = activity.command_output
    ? `<div class="run-card-section">
        <div class="run-card-label">Command Output</div>
        <pre class="run-output command">${escapeHtml(tail(activity.command_output, 1600))}</pre>
      </div>`
    : "";
  return `
    <article class="run-card ${run.status === "running" ? "live" : ""}">
      <div class="run-card-header">
        <div>
          <div class="run-card-title">${escapeHtml(activity.phase_label || run.status || "Run")}</div>
          <div class="run-card-meta">${escapeHtml(run.id)} · ${escapeHtml(run.adapter || "")}</div>
          <div class="entry-chip-row">
            <span class="entry-chip">${escapeHtml(entryCapability)}</span>
            <span class="entry-chip muted">${escapeHtml(operator)} operator</span>
          </div>
        </div>
        <span class="badge ${run.status === "running" ? "warning" : run.status === "completed" ? "ok" : run.status === "failed" ? "danger" : ""}">
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
      ${controller}
      ${agents}
      ${reports}
      ${merge}
      ${reasoning}
      ${plan}
      ${execution}
      ${agentText}
      ${commandOutput}
      ${errors}
      ${renderArtifactPaths(activity)}
    </article>
  `;
}

function renderCodexOutputSection(text, reports = []) {
  const parsedReports = parseWorkerReportsFromText(text);
  if ((Array.isArray(reports) && reports.length > 0) && looksLikeWorkerReportStream(text)) {
    return "";
  }
  if (parsedReports.length > 0) {
    return `<div class="run-card-section">
        <div class="run-card-label">Structured Agent Output</div>
        <div class="report-list">${parsedReports.map((report) => renderStructuredReportCard(report)).join("")}</div>
      </div>`;
  }
  return `<div class="run-card-section">
        <div class="run-card-label">Codex Output</div>
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
        <span>${escapeHtml(report.role || report.task_id || "worker")}</span>
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

function renderRunInspector(run, activity) {
  if (!activity) {
    return escapeHtml(`${run.id}\n${run.adapter}${run.round_result ? ` · ${run.round_result}` : ""}`);
  }
  const entryCapability = activity.entry_capability || run.entry_capability || "using-arckit";
  const operator = activity.operator || run.operator || "desktop";
  const timeline = (activity.timeline || []).slice(-8).reverse().map((item) => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div>
        <div class="timeline-title">${escapeHtml(item.label || item.type || "")}</div>
        <div class="timeline-meta">${escapeHtml(shortTime(item.at || ""))}${item.detail ? ` · ${escapeHtml(item.detail)}` : ""}</div>
      </div>
    </div>
  `).join("");
  const agents = (activity.agents || []).map((agent) => `
    <div class="mini-agent ${escapeHtml(agent.status || "")}">
      <span>${escapeHtml(agent.role || agent.task_id || "")}</span>
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
      <div class="entry-chip-row compact">
        <span class="entry-chip">${escapeHtml(entryCapability)}</span>
        <span class="entry-chip muted">${escapeHtml(operator)} operator</span>
      </div>
      <div class="active-run-phase">${escapeHtml(activity.phase_label || run.status)} · ${escapeHtml(activity.current_step || "")}</div>
      <div class="active-run-excerpt"><strong>Control</strong><span>${escapeHtml(controlState.state)}${controlState.primary_label ? ` · ${escapeHtml(controlState.primary_label)}` : ""}</span></div>
      <div class="active-run-excerpt"><strong>Round</strong><span>${escapeHtml(activity.round_state || "-")}${activity.ledger_stage?.status ? ` · ${escapeHtml(activity.ledger_stage.status)}` : ""}</span></div>
      <div class="active-run-excerpt"><strong>Gate</strong><span>${escapeHtml(gate.status || "-")} · ${escapeHtml(binding.executor || "no executor")}</span></div>
      ${persistedGate ? `<div class="active-run-excerpt"><strong>Write Gate</strong><span>${escapeHtml(persistedGate.decision || "")}${Array.isArray(persistedGate.reasons) && persistedGate.reasons.length ? ` · ${escapeHtml(persistedGate.reasons[0])}` : ""}</span></div>` : ""}
      ${ledgerWrite ? `<div class="active-run-excerpt"><strong>Ledger</strong><span>${ledgerWrite.written ? "written" : "not written"}${Array.isArray(ledgerWrite.changed_files) && ledgerWrite.changed_files.length ? ` · ${escapeHtml(ledgerWrite.changed_files.length)} files` : ""}</span></div>` : ""}
      <div class="active-run-meta">Elapsed ${escapeHtml(durationSince(activity.started_at || run.started_at))} · Last event ${escapeHtml(formatIdle(idle))}</div>
      ${run.status === "running" && idle >= 30 ? `<div class="run-warning compact">No events for ${idle}s</div>` : ""}
      ${agents ? `<div class="mini-agent-list">${agents}</div>` : ""}
      ${activity.merge_result ? `<div class="active-run-excerpt"><strong>Merge</strong><span>${escapeHtml(activity.merge_result.loop_gate?.reason || activity.merge_result.decision || "")}</span></div>` : ""}
      ${activity.reasoning_text ? `<div class="active-run-excerpt"><strong>Thinking</strong><span>${escapeHtml(tail(activity.reasoning_text, 280))}</span></div>` : ""}
      ${activity.agent_text ? `<div class="active-run-excerpt"><strong>Agent</strong><span>${escapeHtml(tail(activity.agent_text, 280))}</span></div>` : ""}
      <div class="timeline-list">${timeline || `<div class="empty compact-empty">No timeline yet</div>`}</div>
    </div>
  `;
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
      round_result: event.result?.runtime_result?.round_result || state.runs[index].round_result || "",
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
    entry_capability: run.entry_capability || "using-arckit",
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
        <span>${escapeHtml(packet.role || packet.worker_id || "")}</span>
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
  const paths = activity.artifact_paths || {};
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

function canAuthorizeRun(run) {
  const activity = normalizedActivity(run);
  return Boolean(run)
    && run.status !== "running"
    && run.adapter === "dry-run"
    && activity?.execution_gate?.status === "pending"
    && Array.isArray(activity.worker_packets)
    && activity.worker_packets.length > 0;
}

function deriveRuntimeControlState() {
  const run = currentRun();
  const project = selectedProject();
  const session = selectedSession();
  const activity = normalizedActivity(run);
  const base = {
    state: "no_context",
    primary_action: "none",
    primary_label: "",
    reason: "No selected project, chat, or run.",
    run_id: run?.id || ""
  };
  if (!project || !session || !run) {
    return base;
  }
  if (run.status === "running") {
    return {
      ...base,
      state: "running",
      reason: activity?.current_step || "Run is still active."
    };
  }
  if (canAuthorizeRun(run)) {
    return {
      ...base,
      state: "packet_pending_authorization",
      primary_action: "run_packet",
      primary_label: "Run Packet",
      reason: "Preview packet has a pending execution gate."
    };
  }
  if (activity?.pending_controller_event) {
    return {
      ...base,
      state: "interrupted_pending_controller_event",
      primary_action: "resume_with_update",
      primary_label: "Resume With Update",
      reason: "Interrupted run has controller input that still needs recovery."
    };
  }

  const ledgerWrite = activity?.ledger_write_result?.parsed || null;
  const gateResult = activity?.gate_result?.parsed || ledgerWrite?.gate || null;
  const ledgerStage = activity?.ledger_stage || null;
  if (ledgerWrite?.written === true || ledgerStage?.status === "written") {
    return {
      ...base,
      state: "ledger_written",
      primary_action: "start_next_round",
      primary_label: "Start Next Round",
      reason: "Ledger writeback has updated project state."
    };
  }
  if (ledgerStage?.status === "gate_blocked") {
    return {
      ...base,
      state: "ledger_writeback_blocked",
      primary_action: "resolve_gate",
      primary_label: "Resolve Gate",
      reason: ledgerStage.reason || "Ledger gate blocked writeback."
    };
  }
  if (run.status === "failed" || activity?.validation_valid === false) {
    return {
      ...base,
      state: "failed_or_invalid",
      primary_action: "diagnose",
      primary_label: "Diagnose",
      reason: run.status === "failed" ? "Run failed." : "Runtime result validation failed."
    };
  }

  const runtimeDone = run.round_result === "done"
    || activity?.round_result === "done"
    || activity?.loop_handoff?.status === "done"
    || activity?.merge_result?.loop_gate?.status === "done";
  if (runtimeDone) {
    if (gateResult?.allowed === false || ledgerWrite?.written === false && ledgerWrite?.gate?.allowed === false) {
      return {
        ...base,
        state: "ledger_writeback_blocked",
        primary_action: "resolve_gate",
        primary_label: "Resolve Gate",
        reason: (gateResult?.reasons || ledgerWrite?.gate?.reasons || []).join(" | ") || "Ledger gate blocked writeback."
      };
    }
    return {
      ...base,
      state: activity?.round_state === "ledger_gate_ready" ? "ledger_gate_ready" : "ledger_writeback_ready",
      primary_action: "write_ledger",
      primary_label: "Write Ledger",
      reason: "Runtime result is done and awaits ledger writeback."
    };
  }

  const handoff = activity?.loop_handoff || {};
  const loopGate = activity?.merge_result?.loop_gate || {};
  const reportIntake = activity?.report_intake || activity?.merge_result?.report_intake || {};
  const reports = Array.isArray(activity?.reports) ? activity.reports : [];
  const workerPackets = Array.isArray(activity?.worker_packets) ? activity.worker_packets : [];
  const missing = Array.isArray(reportIntake.missing) ? reportIntake.missing : [];
  const needsRevision = Array.isArray(reportIntake.needs_revision) ? reportIntake.needs_revision : [];
  const rejected = Array.isArray(reportIntake.rejected) ? reportIntake.rejected : [];

  if (requiresHumanDecision(activity)) {
    return {
      ...base,
      state: "human_gate_required",
      primary_action: "respond_to_gate",
      primary_label: "Respond To Gate",
      reason: handoff.responsibility_reason || loopGate.reason || "Human decision is required."
    };
  }
  if (handoff.next_responsibility === "external" || handoff.trigger_mode === "external_wait" || run.round_result === "external_wait") {
    return {
      ...base,
      state: "external_wait",
      primary_action: "resume_with_update",
      primary_label: "Resume With Update",
      reason: handoff.responsibility_reason || "The loop is waiting on an external result."
    };
  }
  if (handoff.status === "blocked" || loopGate.status === "blocked") {
    return {
      ...base,
      state: "blocked",
      primary_action: "resolve_blocker",
      primary_label: "Resolve Blocker",
      reason: handoff.responsibility_reason || loopGate.reason || "Loop is blocked."
    };
  }
  if (reports.length > 0 && (missing.length > 0 || needsRevision.length > 0 || rejected.length > 0)) {
    return {
      ...base,
      state: "reviewing_reports",
      primary_action: "review_reports",
      primary_label: "Resume Review",
      reason: "Worker reports need controller review or revision."
    };
  }
  if (workerPackets.length > 0 && missing.length > 0) {
    return {
      ...base,
      state: "waiting_worker_reports",
      primary_action: "review_reports",
      primary_label: "Review Reports",
      reason: "Worker packets exist and required reports are missing."
    };
  }
  if (latestNextPrompt() && (
    handoff.agent_continuation_available === true
    || handoff.next_responsibility === "agent"
    || handoff.status === "continue"
    || loopGate.status === "continue"
  )) {
    return {
      ...base,
      state: "agent_resumable",
      primary_action: "resume",
      primary_label: "Resume",
      reason: handoff.responsibility_reason || loopGate.reason || "Agent continuation is available."
    };
  }
  return {
    ...base,
    reason: "No runtime control action is available."
  };
}

function requiresHumanDecision(activity) {
  return activity?.loop_handoff?.human_decision_required === true
    || activity?.loop_handoff?.next_responsibility === "human"
    || activity?.loop_handoff?.trigger_mode === "user_decision"
    || activity?.merge_result?.loop_gate?.human_decision_required === true
    || activity?.merge_result?.loop_gate?.next_responsibility === "human"
    || activity?.merge_result?.loop_gate?.trigger_mode === "user_decision";
}

function isOperatorEventAction(action) {
  return [
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
  const task = [
    "Arckit Desktop operator event.",
    "",
    "Controller instruction:",
    "- Recover project state, latest run activity, loop handoff, report intake, gate result, and ledger write result.",
    "- Classify user_input as supplement, correction, goal_change, report_intake, status_query, new_case, or continuation.",
    "- Decide the next business step from Arckit state. Do not assume the UI action determines the business path.",
    "- If a packet is stale, say so and generate a replacement packet or ask for a human decision.",
    "- If ledger writeback is blocked, explain the gate evidence and produce the next recoverable action.",
    "",
    JSON.stringify(operatorEvent, null, 2)
  ].join("\n");
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
    dryRun: selectedMode() === "dry-run",
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
  return {
    schema_version: "arckit-desktop-operator-event/v1",
    action,
    user_input: userInput || "",
    control_state: {
      state: controlState.state,
      primary_action: controlState.primary_action,
      primary_label: controlState.primary_label,
      reason: controlState.reason
    },
    project: selectedProject()
      ? {
        id: selectedProject().id,
        name: selectedProject().name,
        path: selectedProject().path
      }
      : null,
    session: selectedSession()
      ? {
        id: selectedSession().id,
        title: selectedSession().title || ""
      }
      : null,
    source_run: run
      ? {
        id: run.id,
        status: run.status,
        adapter: run.adapter || "",
        round_result: run.round_result || activity?.round_result || "",
        validation_valid: run.validation_valid ?? activity?.validation_valid ?? null,
        result_file: run.result_file || "",
        activity_file: run.activity_file || ""
      }
      : null,
    controller_context: {
      controller_frame: activity?.controller_frame || null,
      execution_gate: activity?.execution_gate || null,
      executor_binding: activity?.executor_binding || null,
      worker_packets: summarizeWorkerPackets(activity?.worker_packets || []),
      report_intake: activity?.report_intake || activity?.merge_result?.report_intake || null,
      worker_reports: summarizeWorkerReports(activity?.reports || []),
      merge_gate: activity?.merge_result?.loop_gate || null,
      loop_handoff: activity?.loop_handoff || null,
      pending_controller_event: activity?.pending_controller_event || null,
      gate_result: activity?.gate_result?.parsed || activity?.ledger_write_result?.parsed?.gate || null,
      ledger_write_result: activity?.ledger_write_result?.parsed || null,
      latest_next_prompt: latestNextPrompt()
    },
    project_loop_control: state.projectStatus?.loop_control || null,
    project_top_gap: state.projectStatus?.top_gap || null
  };
}

function summarizeWorkerPackets(packets) {
  return (Array.isArray(packets) ? packets : []).map((packet) => ({
    worker_id: packet.worker_id || packet.id || "",
    role: packet.role || "",
    task: packet.task || packet.objective || "",
    context_refs: Array.isArray(packet.context_refs) ? packet.context_refs : packet.inputs?.known_state_paths || []
  }));
}

function summarizeWorkerReports(reports) {
  return (Array.isArray(reports) ? reports : []).map((report) => ({
    task_id: report.task_id || "",
    role: report.role || "",
    status: report.status || "",
    summary: report.summary || "",
    recommendation: report.recommendation || "",
    requires_main_agent_decision: report.requires_main_agent_decision === true
  }));
}

async function authorizeCurrentPacket() {
  const project = selectedProject();
  const packetRun = currentRun();
  if (!project || !packetRun || !canAuthorizeRun(packetRun)) {
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

function selectedMode() {
  return document.querySelector("input[name='mode']:checked")?.value || "dry-run";
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
  if (copy.parsed?.event?.type) {
    return `${copy.parsed.event.type} ${copy.parsed.event.message || ""}`.trim();
  }
  if (copy.message?.content) {
    return copy.message.content;
  }
  return JSON.stringify(copy, null, 2);
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
