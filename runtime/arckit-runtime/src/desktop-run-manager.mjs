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
  ensureProjectSession,
  findSession,
  getSession,
  normalizeSettings,
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

export function createDesktopRunManager({ runtimeRoot, dataDir, nodeBin = process.env.ARCKIT_NODE_BIN || "node" }) {
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
    const initialization = await ensureArckitProject({
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
    await updateStore((store) => {
      store.projects = store.projects.filter((project) => project.id !== projectIdValue);
      for (const session of store.sessions[projectIdValue] || []) {
        delete store.messages[session.id];
      }
      delete store.sessions[projectIdValue];
      return store;
    });
  }

  async function listRuns() {
    const store = await readStore();
    return Promise.all(store.runs.map(async (run) => ({
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
    const store = await updateStore((draft) => {
      ensureProjectSession(draft, projectIdValue);
      return draft;
    });
    return store.sessions[projectIdValue] || [];
  }

  async function createSession(projectIdValue, input = {}) {
    const store = await updateStore((draft) => {
      const project = draft.projects.find((item) => item.id === projectIdValue);
      if (!project) {
        throw new Error(`Unknown project: ${projectIdValue}`);
      }
      draft.sessions[projectIdValue] ||= [];
      const session = {
        id: `SESSION-${new Date().toISOString().replace(/[-:.]/g, "").replace("T", "-").replace("Z", "Z")}-${Math.random().toString(16).slice(2, 8)}`,
        project_id: projectIdValue,
        title: input.title || "New chat",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      draft.sessions[projectIdValue].unshift(session);
      draft.messages[session.id] = [];
      draft.created_session = session;
      return draft;
    });
    const session = store.created_session;
    delete store.created_session;
    await writeJson(storePath, store);
    emit("session.created", { projectId: projectIdValue, session });
    return session;
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
    return store.settings;
  }

  async function updateSettings(input = {}) {
    let nextSettings;
    await updateStore((store) => {
      nextSettings = normalizeSettings({
        ...store.settings,
        ...input,
        codex_proxy: {
          ...store.settings?.codex_proxy,
          ...input.codex_proxy
        }
      });
      store.settings = nextSettings;
      return store;
    });
    emit("settings.updated", { settings: nextSettings });
    return nextSettings;
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
        top_gap: null,
        loop_control: null,
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

    return {
      project,
      has_arckit_state: true,
      summary: {
        name: projectState.project?.name || project.name,
        phase: projectState.project?.current_phase || "",
        status: projectState.project?.status || ""
      },
      top_gap: gaps[0] || null,
      loop_control: projectState.loop_control || null,
      dimensions,
      active_cases: projectState.active_case_refs || [],
      cases_index_excerpt: existsSync(caseIndexPath)
        ? (await readFile(caseIndexPath, "utf8")).split("\n").slice(0, 24).join("\n")
        : ""
    };
  }

  async function startRun(input) {
    const store = await readStore();
    const project = store.projects.find((item) => item.id === input.projectId);
    if (!project) {
      throw new Error("Select a project before starting a run.");
    }
    const initialization = await ensureArckitProject({
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

    const run = {
      id: runId,
      project_id: project.id,
      session_id: input.sessionId || "",
      project_name: project.name,
      project_path: project.path,
      task: input.task || sourceRun?.task || "",
      authorized_from_run_id: sourceRun?.id || "",
      entry_capability: "using-arckit",
      operator: "desktop",
      adapter: input.dryRun ? "dry-run" : input.adapter || "codex-app-server",
      codex_proxy_enabled: Boolean(store.settings?.codex_proxy?.enabled),
      codex_proxy_url: store.settings?.codex_proxy?.enabled ? store.settings?.codex_proxy?.url || "" : "",
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

    const args = [
      runtimeBin,
      "run",
      "--project",
      project.path,
      "--json"
    ];
    if (run.task) {
      args.push("--task", run.task);
    }
    args.push("--stream-events");
    if (input.dryRun) {
      args.push("--dry-run");
    } else {
      args.push("--adapter", run.adapter, "--supervise-stdin", "--approval-policy", input.approvalPolicy || "on-request");
      if (sourceRun) {
        args.push("--packet-file", sourceRun.result_file);
      }
      if (input.model) {
        args.push("--model", input.model);
      }
    }

    const child = spawn(nodeBin, args, {
      cwd: runtimeRoot,
      stdio: ["pipe", "pipe", "pipe"],
      detached: process.platform !== "win32",
      env: buildRuntimeEnv({
        ...process.env,
        FORCE_COLOR: "0"
      }, store.settings)
    });

    const activeRun = { child, run, stdout: "", aborting: false };
    activeRuns.set(runId, activeRun);
    child.stdin.on("error", () => {
      // The runtime may already be exiting when Desktop sends interrupt/abort input.
    });
    await addMessage(project.id, {
      role: "system",
      kind: "run-started",
      content: `${run.entry_capability} entry started via ${run.operator}: ${run.id}`,
      run_id: run.id,
      session_id: run.session_id
    });
    emit("run.started", { run });

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      activeRun.stdout += chunk;
      emit("run.stdout", { runId, chunk });
    });

    let stderrLineBuffer = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", async (chunk) => {
      await appendText(run.events_file, chunk);
      stderrLineBuffer += chunk;
      const lines = stderrLineBuffer.split(/\r?\n/);
      stderrLineBuffer = lines.pop() || "";
      for (const line of lines.filter(Boolean)) {
        const parsed = parseEventLine(line);
        await appendJsonLine(run.raw_events_file, {
          at: new Date().toISOString(),
          line,
          parsed
        });
        const activity = applyRunEvent(run, { line, parsed });
        emit("run.event_line", { runId, line, parsed, activity });
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
        await appendJsonLine(run.raw_events_file, {
          at: new Date().toISOString(),
          line,
          parsed
        });
        const activity = applyRunEvent(run, { line, parsed });
        emit("run.event_line", { runId, line, parsed, activity });
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
          status,
          finished_at: new Date().toISOString(),
          exit_code: exitCode,
          validation_valid: parsedResult?.validation?.valid ?? null,
          round_result: parsedResult?.runtime_result?.round_result || (status === "aborted" ? "aborted" : ""),
          activity: run.activity
        };
      }
      return store;
    });
    await addMessage(run.project_id, {
      role: status === "completed" ? "assistant" : "system",
      kind: "run-finished",
      content: summarizeRuntimeResult(status, parsedResult, errorMessage),
      run_id: runId,
      session_id: run.session_id
    });
    emit("run.finished", { runId, status, exitCode, result: parsedResult, activity: run.activity });
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
    const args = ["write-ledger", "--project", run.project_path, "--file", run.result_file, "--json"];
    if (dryRun) {
      args.push("--dry-run");
    }
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
      const child = spawn(nodeBin, [runtimeBin, ...args], {
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
      const writeResult = await runRuntimeCommand(run, ["write-ledger", "--project", run.project_path, "--file", run.result_file, "--json"]);
      applyRunCommandResult(run, "write-ledger", writeResult);
      emit("run.command_result", {
        runId: run.id,
        commandType: "write-ledger",
        result: normalizeCommandResult(writeResult),
        activity: run.activity || null
      });
    }
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
    listSessions,
    createSession,
    listMessages,
    addMessage,
    getSettings,
    updateSettings,
    startRun,
    controlRun,
    abortActiveRuns,
    gateRun,
    writeLedgerForRun
  };
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
