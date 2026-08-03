import { EventEmitter } from "node:events";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { ensureArckitProject } from "./project-initializer.mjs";
import {
  appendJsonLine,
  appendText,
  buildRuntimeEnv,
  createDesktopStore,
  deleteProjectSession,
  ensureProjectSession,
  findSession,
  getSession,
  normalizeSettings,
  publicSettings,
  projectId,
  writeJson
} from "./desktop/desktop-store.mjs";
import {
  applyRunCommandResult,
  applyRunEvent,
  createRunActivity,
  finalizeRunActivity,
  normalizeCommandResult,
  parseEventLine,
  summarizeRuntimeResult,
  updateRunActivity
} from "./projection/run-event-projector.mjs";
import { buildControllerOperatorTask } from "./kernel/operator-event.mjs";
import {
  AUTOMATIC_CONTINUATION_POLICY,
  normalizeContinuationPolicy,
  shouldAutomaticallyBridge
} from "./kernel/continuation-policy.mjs";
import { runtimeRecordRefForRun } from "./runtime-record-ref.mjs";

export function createDesktopRunManager({
  runtimeRoot,
  dataDir,
  nodeBin = process.env.ARCKIT_NODE_BIN || "node",
  spawnProcess = spawn,
  ensureProject = ensureArckitProject
}) {
  const emitter = new EventEmitter();
  const storePath = join(dataDir, "desktop-store.json");
  const runsDir = join(dataDir, "runs");
  const runtimeBin = join(runtimeRoot, "bin/arckit-runtime.mjs");
  const activeRuns = new Map();
  const { readStore, updateStore } = createDesktopStore({ dataDir, runsDir, storePath });

  async function listProjects() {
    const store = await readStore();
    return store.projects.map((project) => ({
      ...project,
      has_arckit_state: existsSync(join(project.path, "arckit/project/state.record.json"))
    }));
  }

  async function addProject(projectPath) {
    const root = resolve(projectPath);
    if (!existsSync(root)) {
      throw new Error(`Project path does not exist: ${root}`);
    }
    const initialization = await ensureProject({
      projectRoot: root,
      projectName: basename(root) || root,
      intent: "Added to Arckit Desktop as a managed software project.",
      nodeBin
    });
    const project = {
      id: projectId(root),
      name: basename(root) || root,
      path: root,
      has_arckit_state: existsSync(join(root, "arckit/project/state.record.json")),
      added_at: new Date().toISOString()
    };
    await updateStore((store) => {
      const index = store.projects.findIndex((item) => item.id === project.id);
      if (index >= 0) {
        store.projects[index] = { ...store.projects[index], ...project };
      } else {
        store.projects.push(project);
      }
      ensureProjectSession(store, project.id);
      return store;
    });
    if (initialization.initialized || initialization.repaired) {
      emit("project.initialized", { project, initialization });
    }
    return project;
  }

  async function removeProject(projectIdValue) {
    const activeRun = Array.from(activeRuns.values()).find(({ run }) => (
      run.project_id === projectIdValue && run.status === "running"
    ));
    if (activeRun) {
      throw new Error("Stop the active run before removing this project.");
    }
    await updateStore((store) => {
      store.projects = store.projects.filter((project) => project.id !== projectIdValue);
      for (const session of store.sessions[projectIdValue] || []) {
        delete store.messages[session.id];
      }
      delete store.sessions[projectIdValue];
      return store;
    });
  }

  async function listRuns(filter = {}) {
    const store = await readStore();
    const projectFilter = filter.projectId || filter.project_id || "";
    const sessionFilter = filter.sessionId || filter.session_id || "";
    const runs = store.runs.filter((run) => {
      if (projectFilter && run.project_id !== projectFilter) {
        return false;
      }
      if (sessionFilter && run.session_id !== sessionFilter) {
        return false;
      }
      return true;
    });
    return Promise.all(runs.map(async (run) => ({
      ...run,
      activity: await loadRunActivity(run)
    })));
  }

  async function loadRunActivity(run) {
    const active = activeRuns.get(run.id)?.run.activity;
    if (active) {
      return active;
    }
    if (run.activity) {
      return run.activity;
    }
    if (run.activity_file && existsSync(run.activity_file)) {
      try {
        return JSON.parse(await readFile(run.activity_file, "utf8"));
      } catch {
        // Fall through to result reconstruction.
      }
    }
    if (run.result_file && existsSync(run.result_file)) {
      try {
        const parsedResult = JSON.parse(await readFile(run.result_file, "utf8"));
        const hydrated = {
          ...run,
          activity: createRunActivity(run)
        };
        finalizeRunActivity(hydrated, {
          status: run.status || "completed",
          exitCode: run.exit_code,
          parsedResult,
          errorMessage: ""
        });
        return hydrated.activity;
      } catch {
        // Fall through to an empty activity so the UI remains usable.
      }
    }
    return createRunActivity(run);
  }

  async function listSessions(projectIdValue) {
    let store = await readStore();
    if (!store.sessions[projectIdValue]?.length) {
      store = await updateStore((draft) => {
        ensureProjectSession(draft, projectIdValue);
        return draft;
      });
    }
    return store.sessions[projectIdValue] || [];
  }

  async function createSession(projectIdValue, input = {}) {
    let session;
    await updateStore((draft) => {
      const project = draft.projects.find((item) => item.id === projectIdValue);
      if (!project) {
        throw new Error(`Unknown project: ${projectIdValue}`);
      }
      draft.sessions[projectIdValue] ||= [];
      session = {
        id: `SESSION-${new Date().toISOString().replace(/[-:.]/g, "").replace("T", "-").replace("Z", "Z")}-${Math.random().toString(16).slice(2, 8)}`,
        project_id: projectIdValue,
        title: input.title || "New chat",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      draft.sessions[projectIdValue].unshift(session);
      draft.messages[session.id] = [];
      return draft;
    });
    emit("session.created", { projectId: projectIdValue, session });
    return session;
  }

  async function deleteSession(projectIdValue, sessionIdValue) {
    const activeRun = Array.from(activeRuns.values()).find(({ run }) => (
      run.project_id === projectIdValue
      && run.session_id === sessionIdValue
      && run.status === "running"
    ));
    if (activeRun) {
      throw new Error("Stop the active run before deleting this chat.");
    }

    let deletedSession = null;
    const store = await updateStore((draft) => {
      deletedSession = deleteProjectSession(draft, projectIdValue, sessionIdValue);
      return draft;
    });
    if (!deletedSession) {
      throw new Error(`Unknown session: ${sessionIdValue}`);
    }
    const nextSessionId = store.sessions[projectIdValue]?.[0]?.id || "";
    emit("session.deleted", {
      projectId: projectIdValue,
      sessionId: sessionIdValue,
      nextSessionId
    });
    return {
      deleted_session_id: sessionIdValue,
      next_session_id: nextSessionId
    };
  }

  async function listMessages(projectIdValue, sessionIdValue = "") {
    const store = await readStore();
    const session = findSession(store, projectIdValue, sessionIdValue);
    if (!session) {
      return [];
    }
    return store.messages[session.id] || [];
  }

  async function addMessage(projectIdValue, message) {
    const sessionIdValue = message.session_id || "";
    const entry = {
      id: `MSG-${new Date().toISOString().replace(/[-:.]/g, "").replace("T", "-").replace("Z", "Z")}-${Math.random().toString(16).slice(2, 8)}`,
      session_id: "",
      role: message.role || "system",
      kind: message.kind || "text",
      content: String(message.content || ""),
      run_id: message.run_id || "",
      created_at: new Date().toISOString()
    };
    let selectedSession;
    await updateStore((store) => {
      selectedSession = getSession(store, projectIdValue, sessionIdValue);
      entry.session_id = selectedSession.id;
      store.messages[selectedSession.id] ||= [];
      store.messages[selectedSession.id].push(entry);
      store.messages[selectedSession.id] = store.messages[selectedSession.id].slice(-300);
      selectedSession.updated_at = entry.created_at;
      if (entry.role === "user" && selectedSession.title === "New chat") {
        selectedSession.title = entry.content.slice(0, 64) || selectedSession.title;
      }
      return store;
    });
    emit("message.added", { projectId: projectIdValue, sessionId: selectedSession.id, message: entry });
    return entry;
  }

  async function getSettings() {
    const store = await readStore();
    return publicSettings(store.settings);
  }

  async function getTaskSourceSettings() {
    const store = await readStore();
    return { ...store.settings.task_source };
  }

  async function replaceTaskSourceSettings(input = {}) {
    let taskSourceSettings;
    let visibleSettings;
    await updateStore((store) => {
      const nextSettings = normalizeSettings({
        ...store.settings,
        task_source: input
      });
      store.settings = nextSettings;
      taskSourceSettings = { ...nextSettings.task_source };
      visibleSettings = publicSettings(nextSettings);
      return store;
    });
    emit("settings.updated", { settings: visibleSettings });
    return taskSourceSettings;
  }

  async function updateSettings(input = {}) {
    let nextSettings;
    await updateStore((store) => {
      const currentTaskSource = store.settings?.task_source || {};
      const incomingTaskSource = input.task_source && typeof input.task_source === "object" ? input.task_source : null;
      let taskSource = currentTaskSource;
      if (incomingTaskSource) {
        const nextAuthMode = incomingTaskSource.auth_mode || currentTaskSource.auth_mode || "nebula";
        const sameAuthMode = nextAuthMode === currentTaskSource.auth_mode;
        const accessToken = incomingTaskSource.access_token || (sameAuthMode ? currentTaskSource.access_token : "") || "";
        const headerUserId = "user_id" in incomingTaskSource ? incomingTaskSource.user_id : currentTaskSource.user_id;
        const headerAuthenticated = nextAuthMode === "headers" && Boolean(String(headerUserId || "").trim());
        taskSource = {
          ...currentTaskSource,
          ...incomingTaskSource,
          auth_mode: nextAuthMode,
          access_token: accessToken,
          refresh_token: nextAuthMode === "nebula" && sameAuthMode ? currentTaskSource.refresh_token || "" : "",
          access_token_expires_at: nextAuthMode === "nebula" && sameAuthMode ? currentTaskSource.access_token_expires_at || 0 : 0,
          refresh_token_expires_at: nextAuthMode === "nebula" && sameAuthMode ? currentTaskSource.refresh_token_expires_at || 0 : 0,
          user_id: nextAuthMode === "headers" ? String(headerUserId || "") : "",
          username: nextAuthMode === "headers"
            ? String("username" in incomingTaskSource ? incomingTaskSource.username || "" : currentTaskSource.username || "")
            : nextAuthMode === "nebula" && sameAuthMode ? currentTaskSource.username || "" : "",
          session_id: nextAuthMode === "headers"
            ? String("session_id" in incomingTaskSource ? incomingTaskSource.session_id || "" : currentTaskSource.session_id || "")
            : "",
          auth_state: accessToken || headerAuthenticated ? "authenticated" : "logged_out",
          auth_error: ""
        };
      }
      nextSettings = normalizeSettings({
        ...store.settings,
        ...input,
        codex_proxy: {
          ...store.settings?.codex_proxy,
          ...input.codex_proxy
        },
        task_source: taskSource
      });
      store.settings = nextSettings;
      return store;
    });
    const visibleSettings = publicSettings(nextSettings);
    emit("settings.updated", { settings: visibleSettings });
    return visibleSettings;
  }

  async function getProjectStatus(projectIdValue) {
    const store = await readStore();
    const project = store.projects.find((item) => item.id === projectIdValue);
    if (!project) {
      return null;
    }
    const statePath = join(project.path, "arckit/project/state.record.json");
    const caseIndexPath = join(project.path, "arckit/cases/INDEX.md");
    if (!existsSync(statePath)) {
      return {
        project,
        has_arckit_state: false,
        summary: null,
        project_gaps: [],
        case_control: null,
        case_state: null,
        dimensions: [],
        active_cases: [],
        cases_index_excerpt: ""
      };
    }

    const projectState = JSON.parse(await readFile(statePath, "utf8"));
    const gaps = Array.isArray(projectState.state_gaps) ? projectState.state_gaps : [];
    const dimensions = Object.entries(projectState.completeness_dimensions || {})
      .map(([name, dimension]) => ({
        name,
        current_state: dimension.current_state || "",
        target_state: dimension.target_state || "",
        priority: dimension.priority || "",
        gap: dimension.gap || "",
        next_transition: dimension.next_transition || ""
      }))
      .filter((dimension) => dimension.priority && dimension.priority !== "none")
      .slice(0, 8);

    const selectedCaseRef = projectState.case_control?.selected_case_ref || "";
    const selectedCasePath = selectedCaseRef ? join(project.path, selectedCaseRef) : "";
    const caseState = selectedCasePath && existsSync(selectedCasePath)
      ? parseCaseRecord(await readFile(selectedCasePath, "utf8"))
      : null;

    return {
      project,
      has_arckit_state: true,
      summary: {
        name: projectState.project?.name || project.name,
        phase: projectState.project?.current_phase || "",
        status: projectState.project?.status || ""
      },
      project_gaps: gaps,
      case_control: projectState.case_control || null,
      case_state: caseState,
      dimensions,
      active_cases: projectState.active_case_refs || [],
      cases_index_excerpt: existsSync(caseIndexPath)
        ? (await readFile(caseIndexPath, "utf8")).split("\n").slice(0, 24).join("\n")
        : ""
    };
  }

  function parseCaseRecord(text) {
    const match = text.match(/## Structured Record[\s\S]*?```json\s*\n([\s\S]*?)\n```/);
    return match ? JSON.parse(match[1]) : null;
  }

  async function startRun(input) {
    const store = await readStore();
    const project = store.projects.find((item) => item.id === input.projectId);
    if (!project) {
      throw new Error("Select a project before starting a run.");
    }
    const initialization = await ensureProject({
      projectRoot: project.path,
      projectName: project.name,
      intent: input.task || "Start an Arckit Desktop supervised runtime turn.",
      nodeBin
    });
    if (initialization.initialized || initialization.repaired) {
      emit("project.initialized", { project, initialization });
    }
    const sourceRun = input.authorizeRunId ? await findRun(input.authorizeRunId) : null;
    if (sourceRun && sourceRun.project_id !== project.id) {
      throw new Error("Cannot authorize a packet from a different project.");
    }

    const runId = `RUN-${new Date().toISOString().replace(/[-:.]/g, "").replace("T", "-").replace("Z", "Z")}`;
    const runDir = join(runsDir, runId);
    await mkdir(runDir, { recursive: true });

    const directAgentTask = input.entryCapability === "agent-task";
    const run = {
      id: runId,
      project_id: project.id,
      session_id: input.sessionId || "",
      project_name: project.name,
      project_path: project.path,
      task: input.task || sourceRun?.task || "",
      authorized_from_run_id: sourceRun?.id || "",
      entry_capability: directAgentTask ? "agent-task" : "runtime",
      operator: "desktop",
      adapter: input.dryRun ? "dry-run" : input.adapter || "codex-app-server",
      codex_proxy_enabled: Boolean(store.settings?.codex_proxy?.enabled),
      codex_proxy_url: store.settings?.codex_proxy?.enabled ? store.settings?.codex_proxy?.url || "" : "",
      auto_continue_from_run_id: input.autoContinueFromRunId || "",
      auto_continue_depth: Number(input.autoContinueDepth || 0),
      auto_no_progress_streak: Number(input.autoNoProgressStreak || 0),
      auto_rounds_since_progress: Number(input.autoRoundsSinceProgress || 0),
      max_auto_rounds: positiveInteger(input.maxAutoRounds ?? sourceRun?.max_auto_rounds, 8),
      continuation_policy: directAgentTask ? "" : normalizeContinuationPolicy(input.continuationPolicy ?? sourceRun?.continuation_policy),
      runtime_context: directAgentTask ? null : normalizeRuntimeContext(input.runtimeContext),
      status: "running",
      started_at: new Date().toISOString(),
      finished_at: "",
      result_file: join(runDir, "result.json"),
      events_file: join(runDir, "events.jsonl"),
      raw_events_file: join(runDir, "raw-events.jsonl"),
      activity_file: join(runDir, "activity.json"),
      error_file: join(runDir, "stderr.log"),
      exit_code: null
    };
    run.activity = createRunActivity(run);
    const selectedSession = getSession(store, project.id, run.session_id);
    run.session_id = selectedSession.id;
    run.activity = createRunActivity(run);

    await updateStore((draft) => {
      getSession(draft, project.id, run.session_id).updated_at = run.started_at;
      draft.runs.unshift(run);
      draft.runs = draft.runs.slice(0, 100);
      return draft;
    });
    await appendJsonLine(run.raw_events_file, {
      at: new Date().toISOString(),
      event: {
        type: "desktop.run.started",
        run_id: run.id,
        adapter: run.adapter,
        codex_proxy_enabled: run.codex_proxy_enabled,
        codex_proxy_url: run.codex_proxy_url,
        entry_capability: run.entry_capability,
        operator: run.operator,
        project_path: run.project_path,
        task: run.task
      }
    });
    await writeJson(run.activity_file, run.activity);

    const args = [runtimeBin, directAgentTask ? "agent-task" : "run", "--project", project.path, "--json"];
    if (run.task) {
      args.push("--task", run.task);
    }
    if (!directAgentTask && run.runtime_context) {
      args.push("--runtime-context", JSON.stringify(run.runtime_context));
    }
    if (!directAgentTask) {
      args.push("--max-auto-rounds", String(run.max_auto_rounds));
    }
    args.push("--stream-events");
    if (input.dryRun) {
      args.push("--dry-run");
    } else {
      if (directAgentTask) {
        args.push("--supervise-stdin", "--approval-policy", input.approvalPolicy || "on-request");
      } else {
        args.push("--adapter", run.adapter, "--supervise-stdin", "--approval-policy", input.approvalPolicy || "on-request");
      }
      if (!directAgentTask && sourceRun) {
        args.push("--packet-file", sourceRun.result_file);
      }
      if (input.model) {
        args.push("--model", input.model);
      }
    }

    const child = spawnProcess(nodeBin, args, {
      cwd: runtimeRoot,
      stdio: ["pipe", "pipe", "pipe"],
      detached: process.platform !== "win32",
      env: buildRuntimeEnv({
        ...process.env,
        FORCE_COLOR: "0"
      }, store.settings)
    });

    const activeRun = { child, run, stdout: "", aborting: false, eventWrite: Promise.resolve() };
    activeRuns.set(runId, activeRun);
    child.stdin.on("error", () => {
      // The runtime may already be exiting when Desktop sends interrupt/abort input.
    });
    if (!directAgentTask) {
      await addMessage(project.id, {
        role: "system",
        kind: "run-started",
        content: `${run.entry_capability} entry started via ${run.operator}: ${run.id}`,
        run_id: run.id,
        session_id: run.session_id
      });
    }
    emit("run.started", { run });

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      activeRun.stdout += chunk;
      emit("run.stdout", { runId, chunk });
    });

    let stderrLineBuffer = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      queueRunWrite(activeRun, () => appendText(run.events_file, chunk));
      stderrLineBuffer += chunk;
      const lines = stderrLineBuffer.split(/\r?\n/);
      stderrLineBuffer = lines.pop() || "";
      for (const line of lines.filter(Boolean)) {
        const parsed = parseEventLine(line);
        const activity = applyRunEvent(run, { line, parsed });
        emit("run.event_line", { runId, line, parsed, activity });
        queueRunWrite(activeRun, () => appendJsonLine(run.raw_events_file, {
          at: new Date().toISOString(),
          line,
          parsed
        }));
      }
    });

    child.on("error", async (error) => {
      await finishRun(
        runId,
        activeRun.aborting ? "aborted" : "failed",
        null,
        activeRun.aborting ? "Desktop terminated the active run before completion." : error.message,
        activeRun.stdout
      );
    });

    child.on("close", async (code) => {
      if (stderrLineBuffer.trim()) {
        const line = stderrLineBuffer;
        stderrLineBuffer = "";
        const parsed = parseEventLine(line);
        const activity = applyRunEvent(run, { line, parsed });
        emit("run.event_line", { runId, line, parsed, activity });
        queueRunWrite(activeRun, () => appendJsonLine(run.raw_events_file, {
          at: new Date().toISOString(),
          line,
          parsed
        }));
      }
      await finishRun(
        runId,
        activeRun.aborting ? "aborted" : code === 0 ? "completed" : "failed",
        code,
        activeRun.aborting ? "Desktop terminated the active run before completion." : "",
        activeRun.stdout
      );
    });

    return run;
  }

  async function finishRun(runId, status, exitCode, errorMessage, stdout) {
    const active = activeRuns.get(runId);
    if (!active) {
      return;
    }
    activeRuns.delete(runId);
    const { run } = active;
    if (stdout.trim() && status !== "aborted") {
      await writeFile(run.result_file, stdout, "utf8");
    }
    if (errorMessage) {
      await appendText(run.error_file, `${errorMessage}\n`);
    }
    let parsedResult = null;
    if (stdout.trim() && status !== "aborted") {
      try {
        parsedResult = JSON.parse(stdout);
      } catch (error) {
        await appendText(run.error_file, `Failed to parse result JSON: ${error.message}\n`);
        status = "failed";
      }
    }
    finalizeRunActivity(run, { status, exitCode, parsedResult, errorMessage });
    if (shouldRunAutomaticLedgerStage(run, status, parsedResult)) {
      await runAutomaticLedgerStage(run);
    }
    run.status = status;
    run.finished_at = new Date().toISOString();
    run.exit_code = exitCode;
    run.validation_valid = parsedResult?.validation?.valid ?? null;
    run.round_result = parsedResult?.runtime_result?.round_result || (status === "aborted" ? "aborted" : "");
    await active.eventWrite;
    await appendJsonLine(run.raw_events_file, {
      at: new Date().toISOString(),
      event: {
        type: "desktop.run.finished",
        run_id: run.id,
        status,
        exit_code: exitCode,
        round_result: parsedResult?.runtime_result?.round_result || (status === "aborted" ? "aborted" : "")
      }
    });
    await writeJson(run.activity_file, run.activity);
    await updateStore((store) => {
      const index = store.runs.findIndex((item) => item.id === runId);
      if (index >= 0) {
        store.runs[index] = {
          ...store.runs[index],
          status: run.status,
          finished_at: run.finished_at,
          exit_code: run.exit_code,
          validation_valid: run.validation_valid,
          round_result: run.round_result,
          activity: run.activity
        };
      }
      return store;
    });
    if (run.entry_capability !== "agent-task") {
      await addMessage(run.project_id, {
        role: status === "completed" ? "assistant" : "system",
        kind: "run-finished",
        content: summarizeRuntimeResult(status, parsedResult, errorMessage),
        run_id: runId,
        session_id: run.session_id
      });
    }
    emit("run.finished", { runId, status, exitCode, result: parsedResult, activity: run.activity });
    try {
      const continuation = await maybeStartAutoContinue(run, parsedResult);
      if (continuation.requested && continuation.status !== "started") {
        emit("run.auto_continue.not_started", {
          sourceRunId: run.id,
          reason: continuation.reason,
          message: continuation.message
        });
      }
    } catch (error) {
      await appendText(run.error_file, `\nAuto-continue failed: ${error?.message || String(error)}\n`);
      emit("run.auto_continue.failed", {
        sourceRunId: run.id,
        message: error?.message || String(error)
      });
    }
  }

  async function abortActiveRuns({ reason = "Desktop is quitting; active runs were aborted.", graceMs = 750 } = {}) {
    const entries = Array.from(activeRuns.entries());
    if (entries.length === 0) {
      return { aborted: 0 };
    }

    for (const [runId, active] of entries) {
      if (!activeRuns.has(runId)) {
        continue;
      }
      active.aborting = true;
      sendInterrupt(active.child);
      updateRunActivity(active.run, {
        phase: "aborted",
        current_step: reason,
        timeline: {
          type: "desktop.run.abort_requested",
          label: "Abort requested",
          detail: reason
        }
      });
      await appendJsonLine(active.run.raw_events_file, {
        at: new Date().toISOString(),
        event: {
          type: "desktop.run.abort_requested",
          run_id: runId,
          reason
        }
      });
      emit("run.abort_requested", { runId, reason, activity: active.run.activity });
    }

    await delay(graceMs);

    let aborted = 0;
    for (const [runId, active] of entries) {
      if (!activeRuns.has(runId)) {
        continue;
      }
      terminateChildTree(active.child, "SIGTERM");
      await finishRun(runId, "aborted", null, reason, active.stdout);
      aborted += 1;
    }
    return { aborted };
  }

  async function controlRun(runId, control) {
    const active = activeRuns.get(runId);
    if (!active) {
      throw new Error(`Run is not active: ${runId}`);
    }
    if (control.type === "interrupt") {
      active.child.stdin.write("/interrupt\n");
      updateRunActivity(active.run, {
        phase: "interrupting",
        current_step: "Interrupt requested",
        timeline: {
          type: "operator.interrupt",
          label: "Stop requested",
          detail: "The runtime sent /interrupt to the active Codex turn."
        }
      });
      await addMessage(active.run.project_id, {
        role: "user",
        kind: "interrupt",
        content: "Interrupt current run.",
        run_id: runId,
        session_id: active.run.session_id
      });
      emit("run.control", { runId, type: "interrupt", activity: active.run.activity });
      return { ok: true };
    }
    if (control.type === "steer") {
      const message = String(control.message || "").trim();
      if (!message) {
        throw new Error("Steer message is required.");
      }
      active.child.stdin.write(`/steer ${message}\n`);
      updateRunActivity(active.run, {
        phase: "steering",
        current_step: "Steer message sent",
        timeline: {
          type: "operator.steer",
          label: "Steer sent",
          detail: message
        }
      });
      await addMessage(active.run.project_id, {
        role: "user",
        kind: "steer",
        content: message,
        run_id: runId,
        session_id: active.run.session_id
      });
      emit("run.control", { runId, type: "steer", message, activity: active.run.activity });
      return { ok: true };
    }
    if (control.type === "controller-input") {
      const message = String(control.message || "").trim();
      if (!message) {
        throw new Error("Controller input message is required.");
      }
      active.child.stdin.write("/interrupt\n");
      updateRunActivity(active.run, {
        phase: "controller-correction",
        current_step: "Controller input received; active execution is being interrupted",
        timeline: {
          type: "operator.controller_input",
          label: "Controller input",
          detail: message
        }
      });
      active.run.activity.pending_controller_event = {
        type: "controller-input",
        message,
        created_at: new Date().toISOString()
      };
      await addMessage(active.run.project_id, {
        role: "user",
        kind: "controller-input",
        content: message,
        run_id: runId,
        session_id: active.run.session_id
      });
      emit("run.control", { runId, type: "controller-input", message, activity: active.run.activity });
      return { ok: true };
    }
    throw new Error(`Unknown run control: ${control.type}`);
  }

  async function gateRun(runId) {
    const run = await findRun(runId);
    const result = await runRuntimeCommand(run, ["gate-result", "--project", run.project_path, "--file", run.result_file, "--json"]);
    await persistRunCommandResult(run.id, "gate-result", result);
    return result;
  }

  async function writeLedgerForRun(runId, { dryRun = true } = {}) {
    const run = await findRun(runId);
    const args = buildWriteLedgerCommandArgs(run, { dryRun });
    const result = await runRuntimeCommand(run, args);
    await persistRunCommandResult(run.id, dryRun ? "write-ledger-preview" : "write-ledger", result);
    return result;
  }

  async function findRun(runId) {
    const store = await readStore();
    const run = store.runs.find((item) => item.id === runId);
    if (!run) {
      throw new Error(`Unknown run: ${runId}`);
    }
    if (!existsSync(run.result_file)) {
      throw new Error(`Run result file does not exist yet: ${run.result_file}`);
    }
    return run;
  }

  async function runRuntimeCommand(run, args) {
    return new Promise((resolvePromise, rejectPromise) => {
      const child = spawnProcess(nodeBin, [runtimeBin, ...args], {
        cwd: runtimeRoot,
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
      child.on("error", rejectPromise);
      child.on("close", (code) => {
        let parsed = null;
        try {
          parsed = stdout.trim() ? JSON.parse(stdout) : null;
        } catch (error) {
          rejectPromise(new Error(`Failed to parse runtime command output: ${error.message}`));
          return;
        }
        const result = { code, stdout, stderr, parsed };
        emit("run.command", { runId: run.id, args, result });
        resolvePromise(result);
      });
    });
  }

  async function runAutomaticLedgerStage(run) {
    const gateResult = await runRuntimeCommand(run, ["gate-result", "--project", run.project_path, "--file", run.result_file, "--json"]);
    applyRunCommandResult(run, "gate-result", gateResult);
    emit("run.command_result", {
      runId: run.id,
      commandType: "gate-result",
      result: normalizeCommandResult(gateResult),
      activity: run.activity || null
    });
    if (gateResult.parsed?.allowed === true) {
      const writeResult = await runRuntimeCommand(run, buildWriteLedgerCommandArgs(run));
      applyRunCommandResult(run, "write-ledger", writeResult);
      emit("run.command_result", {
        runId: run.id,
        commandType: "write-ledger",
        result: normalizeCommandResult(writeResult),
        activity: run.activity || null
      });
    }
  }

  async function maybeStartAutoContinue(sourceRun, parsedResult) {
    const decision = evaluateAutoContinuation({ sourceRun, parsedResult });
    if (!decision.allowed) return decision;
    const runtimeResult = parsedResult?.runtime_result || null;
    const ledgerHandoff = sourceRun.activity?.ledger_write_result?.parsed?.case_transition_result?.case_resolution?.loop_handoff || null;
    const handoff = ledgerHandoff || runtimeResult?.loop_handoff || {};
    const currentDepth = Number(sourceRun.auto_continue_depth || 0);
    for (const active of activeRuns.values()) {
      if (active.run.project_id === sourceRun.project_id && active.run.session_id === sourceRun.session_id) {
        return autoContinueDecision("active_run_conflict", "Another Runtime run is already active for this project conversation.");
      }
    }
    const store = await readStore();
    const project = store.projects.find((item) => item.id === sourceRun.project_id);
    if (!project) {
      return autoContinueDecision("project_missing", "The project is no longer available in Desktop.");
    }
    getSession(store, project.id, sourceRun.session_id);
    const task = buildControllerOperatorTask({ user_input: "" });
    const nextRun = await startRun({
      projectId: project.id,
      sessionId: sourceRun.session_id,
      task,
      runtimeContext: buildAutoContinuationRuntimeContext(sourceRun, handoff, decision),
      adapter: sourceRun.adapter,
      approvalPolicy: "on-request",
      autoContinueFromRunId: sourceRun.id,
      autoContinueDepth: currentDepth + 1,
      autoNoProgressStreak: decision.next_no_progress_streak,
      autoRoundsSinceProgress: decision.next_rounds_since_progress,
      maxAutoRounds: decision.max_auto_rounds,
      continuationPolicy: sourceRun.continuation_policy
    });
    emit("run.auto_continue.started", {
      sourceRunId: sourceRun.id,
      runId: nextRun.id,
      depth: currentDepth + 1
    });
    return { ...decision, status: "started", run: nextRun };
  }

  async function resumeAutoContinuation(sourceRunId) {
    const storedRun = await findRun(sourceRunId);
    const sourceRun = {
      ...storedRun,
      activity: await loadRunActivity(storedRun),
      continuation_policy: AUTOMATIC_CONTINUATION_POLICY
    };
    const parsedResult = JSON.parse(await readFile(sourceRun.result_file, "utf8"));
    return maybeStartAutoContinue(sourceRun, parsedResult);
  }

  function queueRunWrite(activeRun, operation) {
    activeRun.eventWrite = (activeRun.eventWrite || Promise.resolve())
      .then(operation)
      .catch((error) => {
        console.error("Failed to persist run stream event:", error);
      });
    return activeRun.eventWrite;
  }

  function positiveInteger(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(1, Math.floor(number)) : fallback;
  }

  function normalizeRuntimeContext(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return JSON.parse(JSON.stringify(value));
  }

  async function persistRunCommandResult(runId, commandType, result) {
    let updatedRun = null;
    await updateStore(async (store) => {
      const index = store.runs.findIndex((item) => item.id === runId);
      if (index < 0) {
        return store;
      }
      const run = store.runs[index];
      run.activity = await loadRunActivity(run);
      applyRunCommandResult(run, commandType, result);
      store.runs[index] = {
        ...run,
        activity: run.activity
      };
      updatedRun = store.runs[index];
      return store;
    });
    if (updatedRun?.activity_file) {
      await writeJson(updatedRun.activity_file, updatedRun.activity);
    }
    emit("run.command_result", {
      runId,
      commandType,
      result: normalizeCommandResult(result),
      activity: updatedRun?.activity || null
    });
  }

  function emit(type, payload) {
    emitter.emit("event", {
      type,
      at: new Date().toISOString(),
      ...payload
    });
  }

  return {
    onEvent(listener) {
      emitter.on("event", listener);
      return () => emitter.off("event", listener);
    },
    listProjects,
    addProject,
    removeProject,
    getProjectStatus,
    listRuns,
    isRunActive(runId) {
      return activeRuns.has(runId);
    },
    listSessions,
    createSession,
    deleteSession,
    listMessages,
    addMessage,
    getSettings,
    getTaskSourceSettings,
    replaceTaskSourceSettings,
    updateSettings,
    startRun,
    startAgentTask(input) {
      return startRun({
        ...input,
        entryCapability: "agent-task",
        runtimeContext: null,
        continuationPolicy: ""
      });
    },
    controlRun,
    resumeAutoContinuation,
    abortActiveRuns,
    gateRun,
    writeLedgerForRun,
    readDesktopStore: readStore,
    updateDesktopStore: updateStore
  };
}

export function buildWriteLedgerCommandArgs(run, { dryRun = false } = {}) {
  const args = [
    "write-ledger",
    "--project", run.project_path,
    "--file", run.result_file,
    "--runtime-record-ref", runtimeRecordRefForRun(run.id),
    "--json"
  ];
  if (dryRun) args.push("--dry-run");
  return args;
}

export function evaluateAutoContinuation({ sourceRun, parsedResult }) {
  const runtimeResult = parsedResult?.runtime_result || null;
  const ledgerHandoff = sourceRun?.activity?.ledger_write_result?.parsed?.case_transition_result?.case_resolution?.loop_handoff || null;
  const handoff = ledgerHandoff || runtimeResult?.loop_handoff || {};
  const requested = shouldAutomaticallyBridge(handoff, sourceRun?.continuation_policy);
  if (!requested) return autoContinueDecision("not_requested", "Runtime did not request agent auto-continuation.", false);
  if (sourceRun?.status !== "completed") return autoContinueDecision("run_not_completed", `Source run status is ${sourceRun?.status || "unknown"}.`);
  if (sourceRun?.adapter === "dry-run") return autoContinueDecision("dry_run", "Dry-run does not start an automatic continuation.");
  if (parsedResult?.validation?.valid === false) return autoContinueDecision("invalid_result", "Runtime result validation failed.");
  if (handoff.human_decision_required === true) return autoContinueDecision("human_decision_required", "Runtime handoff requires a human decision.");
  if (!handoff.next_prompt) return autoContinueDecision("next_prompt_missing", "Runtime handoff did not provide a continuation intent.");

  const progressGuard = handoff.progress_guard || {};
  const currentDepth = Number(sourceRun?.auto_continue_depth || 0);
  const maxAutoRounds = moduleNonNegativeInteger(sourceRun?.max_auto_rounds, moduleNonNegativeInteger(progressGuard.max_auto_rounds, 0));

  const ledgerWriteRequired = runtimeResult?.ledger_stage?.writeback_required === true;
  const ledgerWritten = sourceRun?.activity?.ledger_write_result?.parsed?.written === true;
  const gate = sourceRun?.activity?.gate_result?.parsed || null;
  const ledgerRejection = recoverableLedgerRejection(sourceRun?.activity?.ledger_write_result);
  const recoverableFreshStateReplan = ledgerWriteRequired && !ledgerWritten && isRecoverableFreshnessGate(gate);
  const recoverableTransitionReplan = ledgerWriteRequired && !ledgerWritten && ledgerRejection?.recoverable === true;
  const recoverableStateReplan = recoverableFreshStateReplan || recoverableTransitionReplan;
  const automationPolicyBridge = handoff.trigger_mode === "manual_bridge"
    && sourceRun?.continuation_policy === AUTOMATIC_CONTINUATION_POLICY;
  if (ledgerWriteRequired && !ledgerWritten && !recoverableStateReplan) {
    return autoContinueDecision("ledger_writeback_incomplete", "Required deterministic ledger writeback did not complete.");
  }

  const currentRoundsSinceProgress = moduleNonNegativeInteger(sourceRun?.auto_rounds_since_progress, 0);
  if (!ledgerWritten && maxAutoRounds <= currentRoundsSinceProgress) {
    return autoContinueDecision("max_auto_rounds", "Automatic continuation reached max_auto_rounds without deterministic ledger progress.");
  }

  const currentNoProgressStreak = moduleNonNegativeInteger(sourceRun?.auto_no_progress_streak, 0);
  const noProgressLimit = moduleNonNegativeInteger(progressGuard.no_progress_limit, 2);
  if (!ledgerWritten && currentNoProgressStreak >= noProgressLimit) {
    return autoContinueDecision("no_progress_limit", "Automatic continuation exhausted its no-progress retry budget.");
  }
  return {
    status: "ready",
    requested: true,
    allowed: true,
    reason: recoverableTransitionReplan ? "state_replan" : recoverableFreshStateReplan ? "fresh_state_replan" : automationPolicyBridge ? "automation_policy" : "auto_bridge",
    message: recoverableTransitionReplan
      ? "The deterministic ledger rejected the proposed Case transition; start one fresh-state Controller replan."
      : recoverableFreshStateReplan
      ? "The deterministic ledger gate rejected stale state; start one fresh-state Controller replan."
      : automationPolicyBridge
        ? "Desktop automation promotes an eligible agent manual bridge to automatic continuation."
        : "Runtime handoff is eligible for automatic continuation.",
    recoverable_state_replan: recoverableStateReplan,
    recoverable_fresh_state_replan: recoverableFreshStateReplan,
    ledger_rejection: recoverableTransitionReplan ? ledgerRejection : null,
    gate_reasons: recoverableFreshStateReplan ? gate.reasons : [],
    next_no_progress_streak: ledgerWritten ? 0 : currentNoProgressStreak + 1,
    next_rounds_since_progress: ledgerWritten ? 0 : currentRoundsSinceProgress + 1,
    max_auto_rounds: maxAutoRounds
  };
}

export function buildAutoContinuationRuntimeContext(sourceRun, handoff, decision = {}) {
  const stateReplan = decision.recoverable_state_replan === true || decision.recoverable_fresh_state_replan === true;
  return {
    kind: "auto_continuation",
    source_run_id: sourceRun?.id || "",
    source_result_ref: sourceRun?.result_file || "",
    source_activity_ref: sourceRun?.activity_file || "",
    continuation: {
      next_prompt: handoff?.next_prompt || "",
      responsibility_reason: handoff?.responsibility_reason || ""
    },
    ...(stateReplan ? {
      recovery: {
        kind: decision.reason === "state_replan" ? "state_replan" : "fresh_state_replan",
        reason: decision.message,
        gate_reasons: decision.gate_reasons || [],
        ledger_rejection: decision.ledger_rejection || null
      }
    } : {})
  };
}

function autoContinueDecision(reason, message, requested = true) {
  return { status: "not_started", requested, allowed: false, reason, message };
}

function isRecoverableFreshnessGate(gate) {
  const reasons = Array.isArray(gate?.reasons) ? gate.reasons : [];
  return gate?.allowed === false && reasons.length > 0 && reasons.every((reason) => (
    / is stale for | is not an active Case| is already resolved| is not an unresolved candidate/.test(String(reason))
  ));
}

function recoverableLedgerRejection(commandResult) {
  const structured = commandResult?.parsed?.rejection;
  if (structured?.recoverable === true) return structured;
  const stderr = String(commandResult?.stderr || '');
  if (commandResult?.code === 1
    && stderr.includes('at applyCaseTransitionToRecord')
    && stderr.includes('at applyRuntimeLedgerWriteback')) {
    return {
      kind: 'case_transition_rejected',
      recoverable: true,
      responsibility: 'agent',
      reason: stderr.split(/\r?\n/, 1)[0].replace(/^Error:\s*/, '') || 'The deterministic ledger rejected the proposed Case transition.',
      recovery_action: 'replan_from_fresh_state',
      legacy_record: true
    };
  }
  return null;
}

function moduleNonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function sendInterrupt(child) {
  try {
    if (child?.stdin?.writable) {
      child.stdin.write("/interrupt\n");
    }
  } catch {
    // The process may already be exiting; abort finalization still marks the run.
  }
}

function terminateChildTree(child, signal) {
  if (!child || child.exitCode !== null || child.signalCode) {
    return;
  }
  try {
    if (process.platform !== "win32" && child.pid) {
      process.kill(-child.pid, signal);
      return;
    }
    child.kill(signal);
  } catch (error) {
    if (error?.code !== "ESRCH") {
      throw error;
    }
  }
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function shouldRunAutomaticLedgerStage(run, status, parsedResult) {
  return status === "completed"
    && run.adapter !== "dry-run"
    && ["done", "continue"].includes(parsedResult?.runtime_result?.round_result)
    && parsedResult?.runtime_result?.ledger_stage?.status === "gate_ready"
    && parsedResult?.runtime_result?.ledger_stage?.writeback_required === true;
}
