import { dirname, resolve } from "node:path";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { createStateStore } from "./state-store.mjs";
import { probeCodexAppServer } from "../adapters/codex-app-server-adapter.mjs";
import { validateRuntimeResult } from "./validator.mjs";
import { loadRuntimeResultFile } from "./runtime-result-file.mjs";
import { evaluateRuntimeGates } from "./gate-engine.mjs";
import { writeLedger } from "./ledger-writer.mjs";
import { ensureArckitProject } from "./project-initializer.mjs";
import { detectConversationLocale } from "./conversation-locale.mjs";
import { runStateDrivenSession } from "./state-driven-runner.mjs";
import { analyzeLifecycleTrace } from "./observability/lifecycle-trace.mjs";

export async function main(argv) {
  const command = argv[0];
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "run") {
    const options = parseRunOptions(argv.slice(1));
    const result = await run(options);
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printRunSummary(result);
    }
    return;
  }

  if (command === "init-project") {
    const options = parseInitProjectOptions(argv.slice(1));
    const result = await ensureArckitProject({
      projectRoot: resolve(options.project),
      projectName: options.name,
      intent: options.intent
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "validate-result") {
    const options = parseValidateOptions(argv.slice(1));
    const { runtimeResult } = await loadRuntimeResultFile(options.file);
    const validation = validateRuntimeResult(runtimeResult);
    console.log(JSON.stringify(validation, null, 2));
    process.exitCode = validation.valid ? 0 : 1;
    return;
  }

  if (command === "gate-result") {
    const options = parseGateOptions(argv.slice(1));
    const { envelope, runtimeResult } = await loadRuntimeResultFile(options.file);
    const snapshot = await readOptionalSnapshot(options.project);
    const gate = await evaluateRuntimeGates({ runtimeResult, snapshot, envelope, projectRoot: resolve(options.project) });
    if (options.json) {
      console.log(JSON.stringify(gate, null, 2));
    } else {
      printGateSummary(gate);
    }
    process.exitCode = gate.allowed ? 0 : 1;
    return;
  }

  if (command === "write-ledger") {
    const options = parseWriteLedgerOptions(argv.slice(1));
    const projectRoot = resolve(options.project);
    const { envelope, runtimeResult } = await loadRuntimeResultFile(options.file);
    const stateStore = createStateStore(projectRoot);
    const snapshot = await stateStore.readSnapshot();
    const result = await writeLedger({
      projectRoot,
      runtimeResult,
      envelope,
      snapshot,
      dryRun: options.dryRun,
      runtimeRecordRef: options.runtimeRecordRef
    });
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printWriteLedgerSummary(result);
    }
    process.exitCode = result.gate.allowed && (options.dryRun || result.written) ? 0 : 1;
    return;
  }

  if (command === "probe-app-server") {
    const options = parseProbeOptions(argv.slice(1));
    const result = await probeCodexAppServer(options);
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Codex app-server probe: ${result.ok ? "ok" : "failed"}`);
      if (result.error) {
        console.log(result.error);
      }
    }
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (command === "analyze-lifecycle") {
    const options = parseLifecycleAnalysisOptions(argv.slice(1));
    const result = await analyzeLifecycleTrace(options.file);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

export async function run(options) {
  const projectRoot = resolve(options.project);
  await ensureArckitProject({
    projectRoot,
    intent: options.task || "Initialize Arckit project state before supervised runtime execution."
  });
  const stateStore = createStateStore(projectRoot);
  if (options.threadBindingFile) {
    options.onThreadBound = async (binding) => {
      await writeThreadBinding(options.threadBindingFile, {
        schema_version: "arckit-codex-thread-binding/v1",
        project_root: projectRoot,
        task_id: String(options.taskId || ""),
        ...binding
      });
    };
  }
  options.conversationLocale = options.conversationLocale
    || detectConversationLocale(options.task || "");
  return runStateDrivenSession({
    projectRoot,
    stateStore,
    options
  });
}

function parseRunOptions(args) {
  const options = {
    project: ".",
    adapter: "dry-run",
    dryRun: false,
    json: false,
    maxNoProgressRounds: 8,
    streamEvents: false,
    superviseStdin: false,
    approvalPolicy: "on-request",
    codexBin: "codex"
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--project") {
      options.project = requiredValue(args, ++index, arg);
    } else if (arg === "--task") {
      options.task = requiredValue(args, ++index, arg);
    } else if (arg === "--adapter") {
      options.adapter = requiredValue(args, ++index, arg);
    } else if (arg === "--dry-run") {
      options.dryRun = true;
      options.adapter = "dry-run";
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--stream-events") {
      options.streamEvents = true;
    } else if (arg === "--supervise-stdin") {
      options.superviseStdin = true;
    } else if (arg === "--approval-policy") {
      options.approvalPolicy = requiredValue(args, ++index, arg);
    } else if (arg === "--model") {
      options.model = requiredValue(args, ++index, arg);
    } else if (arg === "--codex-bin") {
      options.codexBin = requiredValue(args, ++index, arg);
    } else if (arg === "--task-id") {
      options.taskId = requiredValue(args, ++index, arg);
    } else if (arg === "--thread-id") {
      options.threadId = requiredValue(args, ++index, arg);
    } else if (arg === "--thread-binding-file") {
      options.threadBindingFile = resolve(requiredValue(args, ++index, arg));
    } else if (arg === "--runtime-record-ref") {
      options.runtimeRecordRef = requiredValue(args, ++index, arg);
    } else if (arg === "--runtime-context") {
      options.runtimeContext = parseJsonObject(requiredValue(args, ++index, arg), arg);
    } else if (arg === "--max-no-progress-rounds") {
      options.maxNoProgressRounds = Number(requiredValue(args, ++index, arg));
      if (!Number.isInteger(options.maxNoProgressRounds) || options.maxNoProgressRounds < 1) {
        throw new Error("--max-no-progress-rounds must be a positive integer.");
      }
    } else if (arg === "--lifecycle-trace-id") {
      options.lifecycleTraceId = requiredValue(args, ++index, arg);
    } else if (arg === "--lifecycle-parent-span-id") {
      options.lifecycleParentSpanId = requiredValue(args, ++index, arg);
    } else if (arg === "--lifecycle-run-id") {
      options.lifecycleRunId = requiredValue(args, ++index, arg);
    } else {
      throw new Error(`Unknown run option: ${arg}`);
    }
  }

  return options;
}

function parseLifecycleAnalysisOptions(args) {
  const options = { file: "" };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--file") options.file = requiredValue(args, ++index, arg);
    else throw new Error(`Unknown analyze-lifecycle option: ${arg}`);
  }
  if (!options.file) throw new Error("analyze-lifecycle requires --file <events.jsonl>.");
  return options;
}

function parseJsonObject(value, flag) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new Error(`${flag} must contain valid JSON: ${error.message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${flag} must contain a JSON object.`);
  }
  return parsed;
}

function parseInitProjectOptions(args) {
  const options = {
    project: ".",
    name: "",
    intent: ""
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--project") {
      options.project = requiredValue(args, ++index, arg);
    } else if (arg === "--name") {
      options.name = requiredValue(args, ++index, arg);
    } else if (arg === "--intent") {
      options.intent = requiredValue(args, ++index, arg);
    } else {
      throw new Error(`Unknown init-project option: ${arg}`);
    }
  }
  return options;
}

function parseProbeOptions(args) {
  const options = {
    json: false,
    codexBin: "codex",
    project: "."
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--codex-bin") {
      options.codexBin = requiredValue(args, ++index, arg);
    } else if (arg === "--project") {
      options.project = requiredValue(args, ++index, arg);
    } else {
      throw new Error(`Unknown probe-app-server option: ${arg}`);
    }
  }
  return options;
}

function parseValidateOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--file") {
      options.file = requiredValue(args, ++index, arg);
    } else {
      throw new Error(`Unknown validate-result option: ${arg}`);
    }
  }
  if (!options.file) {
    throw new Error("validate-result requires --file <path>.");
  }
  return options;
}

function parseGateOptions(args) {
  const options = {
    project: ".",
    json: false
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--file") {
      options.file = requiredValue(args, ++index, arg);
    } else if (arg === "--project") {
      options.project = requiredValue(args, ++index, arg);
    } else if (arg === "--json") {
      options.json = true;
    } else {
      throw new Error(`Unknown gate-result option: ${arg}`);
    }
  }
  if (!options.file) {
    throw new Error("gate-result requires --file <path>.");
  }
  return options;
}

function parseWriteLedgerOptions(args) {
  const options = {
    project: ".",
    json: false,
    dryRun: false
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--file") {
      options.file = requiredValue(args, ++index, arg);
    } else if (arg === "--project") {
      options.project = requiredValue(args, ++index, arg);
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--runtime-record-ref") {
      options.runtimeRecordRef = requiredValue(args, ++index, arg);
    } else {
      throw new Error(`Unknown write-ledger option: ${arg}`);
    }
  }
  if (!options.file) {
    throw new Error("write-ledger requires --file <path>.");
  }
  return options;
}

async function readOptionalSnapshot(project) {
  try {
    const stateStore = createStateStore(resolve(project));
    return await stateStore.readSnapshot();
  } catch {
    return null;
  }
}

function requiredValue(args, index, flag) {
  const value = args[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

function printHelp() {
  console.log(`arckit-runtime

Usage:
  arckit-runtime init-project [--project <path>] [--name <name>] [--intent <text>]
  arckit-runtime run [--project <path>] [--task <text>] [--task-id <id>] [--thread-id <id>] [--thread-binding-file <path>] [--runtime-context <json>] [--max-no-progress-rounds <count>] [--runtime-record-ref <arckit-runtime://runs/RUN-...>] [--dry-run] [--json]
  arckit-runtime run --adapter codex-app-server [--stream-events] [--supervise-stdin]
  arckit-runtime probe-app-server [--project <path>] [--json]
  arckit-runtime analyze-lifecycle --file <events.jsonl>
  arckit-runtime validate-result --file <runtime-result.json>
  arckit-runtime gate-result --file <runtime-result.json> [--project <path>] [--json]
  arckit-runtime write-ledger --file <runtime-result.json> [--project <path>] [--runtime-record-ref <arckit-runtime://runs/RUN-...>] [--dry-run] [--json]

MVP behavior:
  - reads arckit/project state
  - keeps one persistent Codex thread for the full todo, including validation, repair, and Git closeout
  - resumes the saved thread after process restart and compacts that same thread at 80% context utilization
  - lets the manifest-triggered Controller select one Case gap per round
  - sends only skill triggers, human input, and bounded Runtime facts to Agent turns
  - validates the required runtime result envelope
  - gates runtime results before ledger writeback
  - writes accepted results, fresh-reads the ledger, and continues until complete or human/external responsibility

Codex app-server controls:
  - --stream-events prints normalized runtime events as JSONL on stderr
  - --supervise-stdin accepts "/steer <text>" and "/interrupt" while a turn runs
  - Desktop todo runs persist correlated lifecycle spans and analyze them with analyze-lifecycle
`);
}

async function writeThreadBinding(file, value) {
  const target = resolve(file);
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, target);
}

function printRunSummary(result) {
  console.log(`Arckit Runtime ${result.runtime_version}`);
  console.log(`Project: ${result.project_root}`);
  console.log(`Mode: ${result.mode}`);
  console.log(`Selected gap: ${result.selected_round.gap_id}`);
  console.log(`Round goal: ${result.selected_round.round_goal}`);
  console.log(`Validation: ${result.validation.valid ? "valid" : "invalid"}`);
  if (!result.validation.valid) {
    for (const issue of result.validation.issues) {
      console.log(`- ${issue.path}: ${issue.message}`);
    }
  }
  console.log("");
  console.log("Operator input:");
  console.log(result.compiled_prompt.prompt);
}

function printGateSummary(gate) {
  console.log(`Gate: ${gate.decision}`);
  if (gate.reasons.length > 0) {
    for (const reason of gate.reasons) {
      console.log(`- ${reason}`);
    }
  }
  if (gate.warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of gate.warnings) {
      console.log(`- ${warning}`);
    }
  }
}

function printWriteLedgerSummary(result) {
  console.log(`Ledger write: ${result.written ? "written" : result.dry_run ? "dry-run" : "blocked"}`);
  console.log(`Gate: ${result.gate.decision}`);
  if (result.run_id) {
    console.log(`Run: ${result.run_id}`);
  }
  if (result.plan.length > 0) {
    console.log("Plan:");
    for (const item of result.plan) {
      console.log(`- ${item.action}: ${item.path}`);
    }
  }
  if (result.changed_files.length > 0) {
    console.log("Changed files:");
    for (const file of result.changed_files) {
      console.log(`- ${file}`);
    }
  }
  if (result.gate.reasons.length > 0) {
    console.log("Blocked reasons:");
    for (const reason of result.gate.reasons) {
      console.log(`- ${reason}`);
    }
  }
}
