const api = window.arckitDesktop;

const state = {
  projects: [],
  runs: [],
  sessions: [],
  messages: [],
  events: [],
  projectStatus: null,
  selectedProjectId: "",
  selectedSessionId: "",
  activeRunId: ""
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
  messageList: document.getElementById("messageList"),
  chatInput: document.getElementById("chatInput"),
  approvalPolicy: document.getElementById("approvalPolicy"),
  modelInput: document.getElementById("modelInput"),
  sendButton: document.getElementById("sendButton"),
  interruptButton: document.getElementById("interruptButton"),
  continueButton: document.getElementById("continueButton"),
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
  await refreshAll();
}

function wireEvents() {
  els.pickProjectButton.addEventListener("click", () => runAction(async () => {
    const project = await api.pickProject();
    if (project) {
      state.selectedProjectId = project.id;
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
    await refreshAll();
  }));
  els.chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      sendChat();
    }
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
    const project = selectedProject();
    if (!project) {
      return;
    }
    await api.addMessage(project.id, {
      role: "user",
      kind: "continue",
      content: "Continue from the current Arckit loop handoff.",
      session_id: state.selectedSessionId
    });
    const run = await api.startRun({
      projectId: project.id,
      sessionId: state.selectedSessionId,
      task: "Continue from the current Arckit loop handoff.",
      dryRun: selectedMode() === "dry-run",
      adapter: "codex-app-server",
      approvalPolicy: els.approvalPolicy.value,
      model: els.modelInput.value.trim()
    });
    state.activeRunId = run.id;
    await refreshAll();
  }));

  els.gateButton.addEventListener("click", () => runAction(async () => {
    const result = await api.gateRun(state.activeRunId);
    await addSystemMessage(`Gate: ${formatCommandResult(result)}`);
    addUiEvent("gate-result", result.parsed || result.stderr || result.stdout);
  }));

  els.writeDryRunButton.addEventListener("click", () => runAction(async () => {
    const result = await api.writeLedger(state.activeRunId, { dryRun: true });
    await addSystemMessage(`Ledger preview: ${formatCommandResult(result)}`);
    addUiEvent("write-ledger dry-run", result.parsed || result.stderr || result.stdout);
  }));

  els.writeLedgerButton.addEventListener("click", () => runAction(async () => {
    const result = await api.writeLedger(state.activeRunId, { dryRun: false });
    await addSystemMessage(`Ledger write: ${formatCommandResult(result)}`);
    addUiEvent("write-ledger", result.parsed || result.stderr || result.stdout);
    await refreshAll();
  }));

  els.clearEventsButton.addEventListener("click", () => {
    state.events = [];
    renderEvents();
  });

  els.refreshButton.addEventListener("click", () => refreshAll());

  api.onEvent((event) => {
    state.events.unshift(event);
    state.events = state.events.slice(0, 200);
  if (event.type === "run.started") {
      state.activeRunId = event.run.id;
      state.selectedSessionId = event.run.session_id || state.selectedSessionId;
    }
    if (event.type === "session.created") {
      state.selectedSessionId = event.session.id;
    }
    if (event.type === "run.finished" || event.type === "message.added" || event.type === "session.created") {
      refreshProjectConversation();
      refreshRuns();
      refreshProjectStatus();
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
    if (!text) {
      return;
    }
    els.chatInput.value = "";
    const active = currentRun()?.status === "running";
    if (active) {
      await api.controlRun(state.activeRunId, { type: "steer", message: text });
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

async function refreshRuns() {
  state.runs = await api.listRuns();
  renderRuns();
  renderActiveRun();
}

async function refreshSessions() {
  if (!state.selectedProjectId) {
    state.sessions = [];
    state.selectedSessionId = "";
    return;
  }
  state.sessions = await api.listSessions(state.selectedProjectId);
  if (!state.selectedSessionId || !state.sessions.some((session) => session.id === state.selectedSessionId)) {
    state.selectedSessionId = state.sessions[0]?.id || "";
  }
}

async function refreshProjectConversation() {
  if (!state.selectedProjectId || !state.selectedSessionId) {
    state.messages = [];
    return;
  }
  state.messages = await api.listMessages(state.selectedProjectId, state.selectedSessionId);
  renderMessages();
}

async function refreshProjectStatus() {
  if (!state.selectedProjectId) {
    state.projectStatus = null;
    return;
  }
  state.projectStatus = await api.projectStatus(state.selectedProjectId);
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
  els.projectStateBadge.className = project.has_arckit_state ? "badge ok" : "badge danger";
  els.sendButton.disabled = !project.has_arckit_state;
}

function renderMessages() {
  if (!state.selectedProjectId) {
    els.messageList.innerHTML = `<div class="empty">No project selected</div>`;
    return;
  }
  if (!state.selectedSessionId) {
    els.messageList.innerHTML = `<div class="empty">No chat selected</div>`;
    return;
  }
  if (state.messages.length === 0) {
    els.messageList.innerHTML = `<div class="empty">No messages</div>`;
    return;
  }
  els.messageList.innerHTML = state.messages.map((message) => `
    <article class="message ${escapeHtml(message.role)}">
      <div class="message-meta">
        <span>${escapeHtml(message.role)}${message.kind ? ` · ${escapeHtml(message.kind)}` : ""}</span>
        <span>${escapeHtml(shortTime(message.created_at))}</span>
      </div>
      <div class="message-content">${escapeHtml(message.content)}</div>
    </article>
  `).join("");
  els.messageList.scrollTop = els.messageList.scrollHeight;
}

function renderActiveRun() {
  const run = currentRun();
  const active = run?.status === "running";
  els.activeRunBadge.textContent = run ? run.status : "Idle";
  els.activeRunBadge.className = `badge ${active ? "warning" : run?.status === "completed" ? "ok" : run?.status === "failed" ? "danger" : ""}`;
  els.activeRunSummary.textContent = run
    ? `${run.id}\n${run.adapter}${run.round_result ? ` · ${run.round_result}` : ""}`
    : "No active run.";
  els.sendButton.textContent = active ? "Steer" : "Send";
  els.interruptButton.disabled = !active;
  els.continueButton.disabled = !selectedProject();
  els.gateButton.disabled = !run || active;
  els.writeDryRunButton.disabled = !run || active;
  els.writeLedgerButton.disabled = !run || active;
}

function renderProjectStatus() {
  const status = state.projectStatus;
  if (!status || !status.has_arckit_state) {
    els.loopState.innerHTML = `<div class="empty">No Arckit state</div>`;
    els.stateGaps.innerHTML = `<div class="empty">No gaps</div>`;
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
  if (state.events.length === 0) {
    els.eventList.innerHTML = `<div class="empty">No events</div>`;
    return;
  }
  els.eventList.innerHTML = state.events.map((event) => `
    <div class="event-item">
      <div class="event-title">${escapeHtml(event.type)}</div>
      <div class="event-meta">${escapeHtml(shortTime(event.at || ""))}${event.runId ? ` · ${escapeHtml(event.runId)}` : ""}</div>
      <div>${escapeHtml(formatPayload(event))}</div>
    </div>
  `).join("");
}

function stateLine(label, value) {
  return `
    <div class="state-line">
      <div class="state-label">${escapeHtml(label)}</div>
      <div class="state-value">${escapeHtml(value || "-")}</div>
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
