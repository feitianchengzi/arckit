import { EventEmitter } from "node:events";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

export function createDesktopRunManager({ runtimeRoot, dataDir, nodeBin = process.env.ARCKIT_NODE_BIN || "node" }) {
  const emitter = new EventEmitter();
  const storePath = join(dataDir, "desktop-store.json");
  const runsDir = join(dataDir, "runs");
  const runtimeBin = join(runtimeRoot, "bin/arckit-runtime.mjs");
  const activeRuns = new Map();

  async function ensureStore() {
    await mkdir(dataDir, { recursive: true });
    await mkdir(runsDir, { recursive: true });
    if (!existsSync(storePath)) {
      await writeJson(storePath, { version: 3, projects: [], runs: [], sessions: {}, messages: {} });
    }
  }

  async function readStore() {
    await ensureStore();
    const store = JSON.parse(await readFile(storePath, "utf8"));
    return normalizeStore(store);
  }

  async function updateStore(updater) {
    const store = await readStore();
    const next = await updater(store) || store;
    await writeJson(storePath, next);
    return next;
  }

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
    return store.runs;
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
    const session = getSession(store, projectIdValue, sessionIdValue);
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
    if (!existsSync(join(project.path, "arckit/project/state.record.json"))) {
      throw new Error("Selected project is missing arckit/project/state.record.json.");
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
      task: input.task || "",
      adapter: input.dryRun ? "dry-run" : input.adapter || "codex-app-server",
      status: "running",
      started_at: new Date().toISOString(),
      finished_at: "",
      result_file: join(runDir, "result.json"),
      events_file: join(runDir, "events.jsonl"),
      error_file: join(runDir, "stderr.log"),
      exit_code: null
    };
    const selectedSession = getSession(store, project.id, run.session_id);
    run.session_id = selectedSession.id;

    await updateStore((draft) => {
      getSession(draft, project.id, run.session_id).updated_at = run.started_at;
      draft.runs.unshift(run);
      draft.runs = draft.runs.slice(0, 100);
      return draft;
    });

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
    if (input.dryRun) {
      args.push("--dry-run");
    } else {
      args.push("--adapter", run.adapter, "--stream-events", "--supervise-stdin", "--approval-policy", input.approvalPolicy || "on-request");
      if (input.model) {
        args.push("--model", input.model);
      }
    }

    const child = spawn(nodeBin, args, {
      cwd: runtimeRoot,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        FORCE_COLOR: "0"
      }
    });

    activeRuns.set(runId, { child, run });
    await addMessage(project.id, {
      role: "system",
      kind: "run-started",
      content: `${run.adapter} started: ${run.id}`,
      run_id: run.id,
      session_id: run.session_id
    });
    emit("run.started", { run });

    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      emit("run.stdout", { runId, chunk });
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", async (chunk) => {
      await appendText(run.events_file, chunk);
      for (const line of chunk.split(/\r?\n/).filter(Boolean)) {
        emit("run.event_line", { runId, line, parsed: parseEventLine(line) });
      }
    });

    child.on("error", async (error) => {
      await finishRun(runId, "failed", null, error.message, stdout);
    });

    child.on("close", async (code) => {
      await finishRun(runId, code === 0 ? "completed" : "failed", code, "", stdout);
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
    if (stdout.trim()) {
      await writeFile(run.result_file, stdout, "utf8");
    }
    if (errorMessage) {
      await appendText(run.error_file, `${errorMessage}\n`);
    }
    let parsedResult = null;
    if (stdout.trim()) {
      try {
        parsedResult = JSON.parse(stdout);
      } catch (error) {
        await appendText(run.error_file, `Failed to parse result JSON: ${error.message}\n`);
        status = "failed";
      }
    }
    await updateStore((store) => {
      const index = store.runs.findIndex((item) => item.id === runId);
      if (index >= 0) {
        store.runs[index] = {
          ...store.runs[index],
          status,
          finished_at: new Date().toISOString(),
          exit_code: exitCode,
          validation_valid: parsedResult?.validation?.valid ?? null,
          round_result: parsedResult?.runtime_result?.round_result || ""
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
    emit("run.finished", { runId, status, exitCode, result: parsedResult });
  }

  async function controlRun(runId, control) {
    const active = activeRuns.get(runId);
    if (!active) {
      throw new Error(`Run is not active: ${runId}`);
    }
    if (control.type === "interrupt") {
      active.child.stdin.write("/interrupt\n");
      await addMessage(active.run.project_id, {
        role: "user",
        kind: "interrupt",
        content: "Interrupt current run.",
        run_id: runId,
        session_id: active.run.session_id
      });
      emit("run.control", { runId, type: "interrupt" });
      return { ok: true };
    }
    if (control.type === "steer") {
      const message = String(control.message || "").trim();
      if (!message) {
        throw new Error("Steer message is required.");
      }
      active.child.stdin.write(`/steer ${message}\n`);
      await addMessage(active.run.project_id, {
        role: "user",
        kind: "steer",
        content: message,
        run_id: runId,
        session_id: active.run.session_id
      });
      emit("run.control", { runId, type: "steer", message });
      return { ok: true };
    }
    throw new Error(`Unknown run control: ${control.type}`);
  }

  async function gateRun(runId) {
    const run = await findRun(runId);
    return runRuntimeCommand(run, ["gate-result", "--project", run.project_path, "--file", run.result_file, "--json"]);
  }

  async function writeLedgerForRun(runId, { dryRun = true } = {}) {
    const run = await findRun(runId);
    const args = ["write-ledger", "--project", run.project_path, "--file", run.result_file, "--json"];
    if (dryRun) {
      args.push("--dry-run");
    }
    return runRuntimeCommand(run, args);
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
    startRun,
    controlRun,
    gateRun,
    writeLedgerForRun
  };
}

function normalizeStore(store) {
  const normalized = {
    version: 3,
    projects: Array.isArray(store.projects) ? store.projects : [],
    runs: Array.isArray(store.runs) ? store.runs : [],
    sessions: store.sessions && typeof store.sessions === "object" ? store.sessions : {},
    messages: store.messages && typeof store.messages === "object" ? store.messages : {}
  };
  for (const project of normalized.projects) {
    const legacyMessages = Array.isArray(normalized.messages[project.id]) ? normalized.messages[project.id] : null;
    if (legacyMessages) {
      const session = ensureProjectSession(normalized, project.id);
      normalized.messages[session.id] = legacyMessages.map((message) => ({
        ...message,
        session_id: session.id
      }));
      delete normalized.messages[project.id];
    } else {
      ensureProjectSession(normalized, project.id);
    }
  }
  normalized.runs = normalized.runs.map((run) => {
    if (run.session_id) {
      return run;
    }
    const session = ensureProjectSession(normalized, run.project_id);
    return { ...run, session_id: session.id };
  });
  return normalized;
}

function ensureProjectSession(store, projectIdValue) {
  store.sessions ||= {};
  store.messages ||= {};
  store.sessions[projectIdValue] ||= [];
  if (store.sessions[projectIdValue].length === 0) {
    const session = {
      id: `SESSION-${projectIdValue}-default`,
      project_id: projectIdValue,
      title: "Default chat",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.sessions[projectIdValue].push(session);
    store.messages[session.id] ||= [];
  }
  return store.sessions[projectIdValue][0];
}

function getSession(store, projectIdValue, sessionIdValue = "") {
  ensureProjectSession(store, projectIdValue);
  const session = sessionIdValue
    ? store.sessions[projectIdValue].find((item) => item.id === sessionIdValue)
    : store.sessions[projectIdValue][0];
  if (!session) {
    throw new Error(`Unknown session: ${sessionIdValue}`);
  }
  store.messages[session.id] ||= [];
  return session;
}

function projectId(projectPath) {
  return createHash("sha256").update(resolve(projectPath)).digest("hex").slice(0, 16);
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function appendText(path, text) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, { encoding: "utf8", flag: "a" });
}

function parseEventLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function summarizeRuntimeResult(status, parsedResult, errorMessage) {
  if (errorMessage) {
    return `Run failed: ${errorMessage}`;
  }
  const runtimeResult = parsedResult?.runtime_result;
  if (!runtimeResult) {
    return status === "completed" ? "Run completed without a parsed runtime result." : `Run ${status}.`;
  }
  const parts = [
    `Round result: ${runtimeResult.round_result || "unknown"}.`,
    runtimeResult.summary || "",
    parsedResult.validation?.valid === true ? "Validation: valid." : "Validation: invalid."
  ].filter(Boolean);
  const nextPrompt = runtimeResult.loop_handoff?.next_prompt;
  if (nextPrompt) {
    parts.push(`Next: ${nextPrompt.slice(0, 600)}`);
  }
  return parts.join("\n\n");
}
