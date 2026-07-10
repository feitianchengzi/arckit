import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { runLedgerScript } from "./ledger-scripts.mjs";
import { detectConversationLocale } from "./conversation-locale.mjs";

const VALID_STATE_VALUE = new Set([
  "unknown",
  "not_required",
  "needed",
  "defined",
  "designed",
  "implemented",
  "integrated",
  "verified",
  "accepted",
  "released",
  "operational",
  "deferred",
  "blocked"
]);
const VALID_EVIDENCE_MATURITY = new Set(["none", "exploratory", "confirmed", "formalized", "validated"]);
const VALID_PRIORITY = new Set(["none", "low", "medium", "high", "critical"]);
const VALID_CONFIDENCE = new Set(["low", "medium", "high"]);
const VALID_PROJECT_STATUS = new Set(["active", "paused", "archived"]);
const VALID_NEXT_RESPONSIBILITY = new Set(["agent", "human", "external", "none"]);
const VALID_TRIGGER_MODE = new Set(["manual_bridge", "auto_bridge", "user_decision", "external_wait", "none"]);

export async function ensureArckitProject({ projectRoot, projectName = "", intent = "", nodeBin = process.execPath } = {}) {
  const root = resolve(projectRoot || ".");
  const conversationLocale = detectConversationLocale(intent);
  const statePath = join(root, "arckit/project/state.record.json");
  const changedFiles = [];
  const result = {
    initialized: false,
    repaired: false,
    project_root: root,
    state_path: "arckit/project/state.record.json",
    case_ref: "",
    changed_files: changedFiles
  };

  if (!existsSync(root)) {
    throw new Error(`Project path does not exist: ${root}`);
  }

  const createdState = !existsSync(statePath);
  if (createdState) {
    runLedgerScript(root, [
      "project-state.mjs",
      "init",
      "--name",
      projectName || basename(root) || root,
      "--intent",
      intent || t(conversationLocale, "Initialized from Arckit Desktop for a first supervised development conversation.", "从 Arckit Desktop 初始化，用于第一次受监督的软件开发对话。")
    ], { nodeBin });
    changedFiles.push("arckit/project/state.record.json", "arckit/project/STATE.md");
    result.initialized = true;
  }

  const caseRef = await ensureInitialCase(root, intent, nodeBin, conversationLocale);
  if (caseRef.created) {
    changedFiles.push(caseRef.ref);
    result.initialized = true;
  }
  result.case_ref = caseRef.ref;
  const caseSeeded = await seedInitialCase(root, caseRef.ref, intent, conversationLocale);
  if (caseSeeded) {
    changedFiles.push(caseRef.ref);
    result.repaired = true;
  }

  const state = await readJson(statePath);
  const normalized = normalizeProjectStateRecord(state);
  const stateChanged = applyInitialLoopState(state, {
    projectName: projectName || basename(root) || root,
    intent,
    caseRef: caseRef.ref,
    seedInitialGap: createdState,
    conversationLocale
  }) || normalized;
  if (stateChanged) {
    await writeJson(statePath, state);
    changedFiles.push("arckit/project/state.record.json");
    result.repaired = true;
  }

  runLedgerScript(root, ["project-state.mjs", "render", "arckit/project/state.record.json"], { nodeBin });
  runLedgerScript(root, ["project-state.mjs", "audit", "arckit/project/state.record.json"], { nodeBin });
  runLedgerScript(root, ["development-case.mjs", "index"], { nodeBin });
  changedFiles.push("arckit/project/STATE.md", "arckit/cases/INDEX.md");

  result.changed_files = Array.from(new Set(changedFiles));
  return result;
}

async function ensureInitialCase(root, intent, nodeBin, conversationLocale) {
  const activeDir = join(root, "arckit/cases/active");
  if (existsSync(activeDir)) {
    const existing = await firstMarkdown(activeDir);
    if (existing) {
      return { ref: relativeToProject(root, existing), created: false };
    }
  }

  const output = runLedgerScript(root, [
    "development-case.mjs",
    "new",
    "--title",
      t(conversationLocale, "Arckit runtime loop", "Arckit runtime loop"),
    "--artifact-type",
    "mixed",
    "--intent",
    intent || t(conversationLocale, "Start a new Arckit-managed software project from the first Desktop chat.", "从第一次 Desktop 对话开始一个由 Arckit 管理的软件项目。")
  ], { nodeBin });
  const file = output.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
  return {
    ref: relativeToProject(root, file),
    created: true
  };
}

async function seedInitialCase(root, caseRef, intent, conversationLocale) {
  if (!caseRef) {
    return false;
  }
  const file = join(root, caseRef);
  if (!existsSync(file)) {
    return false;
  }
  const text = await readFile(file, "utf8");
  const marker = "```json\n";
  if (!text.includes(marker)) {
    return false;
  }
  const before = `${text.split(marker)[0]}${marker}`;
  const rest = text.split(marker)[1];
  const recordJson = rest.split("\n```")[0];
  const after = "\n```" + rest.split("\n```").slice(1).join("\n```");
  const record = JSON.parse(recordJson);
  if (record.current_round_gap && record.current_round_gap !== "unknown") {
    return false;
  }

  const timestamp = new Date().toISOString();
  const nextGoal = t(conversationLocale, "Analyze the operator task and project evidence, then return a protocol-valid route plan, evidence summary, and next loop handoff.", "分析用户任务和项目证据，然后返回符合协议的 route plan、证据摘要和下一轮 loop handoff。");
  record.updated_at = timestamp;
  record.expected_outcome = record.expected_outcome || t(conversationLocale, "The project has a recoverable Project State that is advanced through Case and Loop, without runtime-selected workflow strategy.", "项目拥有可恢复的 Project State，并通过 Case 和 Loop 被持续推进，但 Runtime 不预选具体工作流策略。");
  record.current_round_goal = nextGoal;
  record.current_round_gap = "pending_agent_analysis";
  record.round_strategy_decision = {
    ...(record.round_strategy_decision || {}),
    selected_route: "pending_agent_analysis",
    reason: t(conversationLocale, "Runtime initialized the recoverable loop container but does not choose the workflow route; the agent must analyze the task and evidence.", "Runtime 初始化可恢复 loop 容器，但不选择具体工作流 route；应由 Agent 分析任务和证据。"),
    considered_routes: [],
    next_route_triggers: [],
    user_visible_summary: t(conversationLocale, "The first run initializes Project State as the recoverable object, then leaves Case/Loop route selection to the agent.", "第一次运行会初始化 Project State 作为可恢复对象，然后把 Case/Loop 的具体 route selection 留给 Agent。")
  };
  record.project_state_delta = {
    ...(record.project_state_delta || {}),
    changed: [],
    unchanged_unknown: [],
    deferred: [],
    blocked: [],
    next_project_question: nextGoal,
    updated_at: timestamp
  };
  record.decisions = [
    ...asArray(record.decisions),
    t(conversationLocale, "Empty projects are valid Arckit Desktop inputs; initialization creates a neutral recoverable Project State that can be advanced through Case and Loop without preselecting workflow strategy.", "空项目是有效的 Arckit Desktop 输入；初始化会创建中性的可恢复 Project State，使其通过 Case 和 Loop 被持续推进，但不预选工作流策略。")
  ];
  record.completion_audit = {
    ...(record.completion_audit || {}),
    status: "incomplete",
    next_round_goal: nextGoal,
    updated_at: timestamp,
    loop_handoff: {
      version: "loop-handoff/v1",
      status: "continue",
      next_responsibility: "agent",
      agent_continuation_available: true,
      human_decision_required: false,
      trigger_mode: "manual_bridge",
      responsibility_reason: t(conversationLocale, "The next step is agent-continuable analysis; Runtime does not preselect the workflow route.", "下一步是可由 Agent 继续的分析；Runtime 不预选工作流 route。"),
      next_prompt: t(conversationLocale, "Continue the Arckit runtime loop. Read project state, the active case, and the operator task, then decide the route, required evidence, execution boundary, and next loop handoff.", "继续 Arckit runtime loop。读取 project state、active case 和用户任务，然后决定 route、所需证据、执行边界和下一轮 loop handoff。"),
      agent_instruction: {
        goal: nextGoal,
        required_context_refs: [
          "arckit/project/state.record.json",
          "arckit/project/STATE.md",
          caseRef
        ],
        required_actions: [
          t(conversationLocale, "Read the operator task and local project evidence.", "读取用户任务和本地项目证据。"),
          t(conversationLocale, "Decide the workflow route from evidence instead of following a runtime default.", "基于证据决定工作流 route，而不是遵循 Runtime 默认编排。"),
          t(conversationLocale, "Return explicit evidence, risks, unknowns, and next loop handoff.", "返回明确的 evidence、risks、unknowns 和下一轮 loop handoff。")
        ],
        required_checks: [
          "source_projection_check",
          "case_audit",
          "workflow_memory_closeout"
        ],
        stop_condition: t(conversationLocale, "Stop after route choice, evidence, risks, unknowns, and next loop handoff are explicit.", "当 route choice、evidence、risks、unknowns 和下一轮 loop handoff 明确后停止。")
      },
      human_gate: {
        required: false,
        reason: "",
        decision_needed: ""
      },
      progress_guard: {
        expected_state_change: nextGoal,
        actual_state_change: "",
        no_progress_limit: 2,
        max_auto_rounds: 3
      },
      blocked_reason: ""
    }
  };

  const nextText = before + JSON.stringify(record, null, 2) + after;
  await writeFile(file, syncCaseHeader(nextText, record), "utf8");
  return true;
}

function applyInitialLoopState(record, { projectName, intent, caseRef, seedInitialGap, conversationLocale }) {
  let changed = false;
  const timestamp = new Date().toISOString();

  record.project ||= {};
  if (!record.project.name) {
    record.project.name = projectName;
    changed = true;
  }
  if (!record.project.original_intent && intent) {
    record.project.original_intent = intent;
    changed = true;
  }

  record.active_case_refs = Array.isArray(record.active_case_refs) ? record.active_case_refs : [];
  if (caseRef && !record.active_case_refs.includes(caseRef)) {
    record.active_case_refs.push(caseRef);
    changed = true;
  }

  if (!Array.isArray(record.state_gaps)) {
    record.state_gaps = [];
    changed = true;
  }

  const nextTransition = t(conversationLocale, "Let the agent analyze the current task and project evidence, choose the route, and return the next loop handoff.", "让 Agent 分析当前任务和项目证据，选择 route，并返回下一轮 loop handoff。");
  if (seedInitialGap) {
    record.loop_control = {
      ...(record.loop_control || {}),
      current_loop_focus: record.loop_control?.current_loop_focus || t(conversationLocale, "Agent-directed runtime loop", "Agent 驱动的 runtime loop"),
      next_transition: record.loop_control?.next_transition || nextTransition,
      priority_basis: record.loop_control?.priority_basis || t(conversationLocale, "Runtime initialized the loop container; agent analysis must choose the concrete workflow strategy.", "Runtime 已初始化 loop 容器；具体工作流策略必须由 Agent 分析选择。"),
      stop_condition: record.loop_control?.stop_condition || t(conversationLocale, "Stop after route choice, evidence, risks, unknowns, and next loop handoff are explicit.", "当 route choice、evidence、risks、unknowns 和下一轮 loop handoff 明确后停止。"),
      next_responsibility: record.loop_control?.next_responsibility === "none" ? "agent" : record.loop_control?.next_responsibility || "agent",
      agent_continuation_available: true,
      human_decision_required: record.loop_control?.human_decision_required === true ? true : false,
      trigger_mode: record.loop_control?.trigger_mode === "none" ? "manual_bridge" : record.loop_control?.trigger_mode || "manual_bridge",
      continuation_prompt: record.loop_control?.continuation_prompt || t(conversationLocale, "Continue the Arckit runtime loop from the operator task and project evidence.", "基于用户任务和项目证据继续 Arckit runtime loop。"),
      responsibility_reason: record.loop_control?.responsibility_reason || t(conversationLocale, "The next step is agent-continuable analysis; no human decision is required just to initialize the loop container.", "下一步是 Agent 可继续的分析；仅初始化 loop 容器不需要人类决策。")
    };

    record.last_state_delta = {
      ...(record.last_state_delta || {}),
      changed_dimensions: asArray(record.last_state_delta?.changed_dimensions),
      state_transitions: asArray(record.last_state_delta?.state_transitions),
      deferred_dimensions: asArray(record.last_state_delta?.deferred_dimensions),
      blocked_dimensions: asArray(record.last_state_delta?.blocked_dimensions),
      case_refs: record.active_case_refs,
      iteration_ref: record.active_iteration_ref || "",
      next_loop_focus: record.loop_control.current_loop_focus,
      updated_at: timestamp
    };
    if (!record.project.current_phase) {
      record.project.current_phase = "runtime-loop";
    }
    changed = true;
  }

  if (changed) {
    record.project.updated_at = timestamp;
  }

  record.canonical_artifact_refs = Array.from(new Set([
    ...asArray(record.canonical_artifact_refs),
    "arckit/project/state.record.json",
    "arckit/project/STATE.md",
    caseRef
  ].filter(Boolean)));

  return changed;
}

function normalizeProjectStateRecord(record) {
  let changed = false;
  const timestamp = new Date().toISOString();

  record.project ||= {};
  if (!VALID_PROJECT_STATUS.has(record.project.status)) {
    record.project.status = "active";
    changed = true;
  }

  for (const dimension of Object.values(record.completeness_dimensions || {})) {
    if (!dimension || typeof dimension !== "object" || Array.isArray(dimension)) {
      continue;
    }
    changed = normalizeEnumField(dimension, "current_state", VALID_STATE_VALUE, "unknown") || changed;
    changed = normalizeEnumField(dimension, "target_state", VALID_STATE_VALUE, "accepted") || changed;
    changed = normalizeEvidenceMaturity(dimension) || changed;
    changed = normalizeEnumField(dimension, "priority", VALID_PRIORITY, "medium") || changed;
    changed = normalizeEnumField(dimension, "confidence", VALID_CONFIDENCE, "medium") || changed;
    if (!Array.isArray(dimension.evidence)) {
      dimension.evidence = [];
      changed = true;
    }
    if (!Array.isArray(dimension.blockers)) {
      dimension.blockers = [];
      changed = true;
    }
  }

  if (!Array.isArray(record.state_gaps)) {
    record.state_gaps = [];
    changed = true;
  }
  for (const gap of record.state_gaps) {
    if (!gap || typeof gap !== "object" || Array.isArray(gap)) {
      continue;
    }
    changed = normalizeEnumField(gap, "current_state", VALID_STATE_VALUE, "unknown") || changed;
    changed = normalizeEnumField(gap, "target_state", VALID_STATE_VALUE, "accepted") || changed;
    changed = normalizeEnumField(gap, "urgency", VALID_PRIORITY, "medium") || changed;
    changed = normalizeEnumField(gap, "risk", VALID_PRIORITY, "medium") || changed;
    if (gap.urgency === "none") {
      gap.urgency = "medium";
      changed = true;
    }
    if (gap.risk === "none") {
      gap.risk = "medium";
      changed = true;
    }
    if (!Array.isArray(gap.dependencies)) {
      gap.dependencies = [];
      changed = true;
    }
  }

  record.loop_control ||= {};
  if (!VALID_NEXT_RESPONSIBILITY.has(record.loop_control.next_responsibility)) {
    record.loop_control.next_responsibility = "none";
    changed = true;
  }
  if (!VALID_TRIGGER_MODE.has(record.loop_control.trigger_mode)) {
    record.loop_control.trigger_mode = "none";
    changed = true;
  }
  for (const key of ["agent_continuation_available", "human_decision_required"]) {
    if (record.loop_control[key] !== undefined && typeof record.loop_control[key] !== "boolean") {
      record.loop_control[key] = record.loop_control[key] === "true";
      changed = true;
    }
  }

  for (const key of ["active_case_refs", "active_constraints", "open_questions", "canonical_artifact_refs"]) {
    if (!Array.isArray(record[key])) {
      record[key] = [];
      changed = true;
    }
  }
  const normalizedCaseRefs = record.active_case_refs.map(normalizeProjectRef).filter(Boolean);
  if (JSON.stringify(normalizedCaseRefs) !== JSON.stringify(record.active_case_refs)) {
    record.active_case_refs = normalizedCaseRefs;
    changed = true;
  }
  const normalizedArtifactRefs = record.canonical_artifact_refs.map(normalizeProjectRef).filter(Boolean);
  if (JSON.stringify(normalizedArtifactRefs) !== JSON.stringify(record.canonical_artifact_refs)) {
    record.canonical_artifact_refs = normalizedArtifactRefs;
    changed = true;
  }

  record.last_state_delta ||= {};
  for (const key of ["changed_dimensions", "state_transitions", "deferred_dimensions", "blocked_dimensions"]) {
    if (!Array.isArray(record.last_state_delta[key])) {
      record.last_state_delta[key] = [];
      changed = true;
    }
  }
  if (!Array.isArray(record.last_state_delta.case_refs)) {
    record.last_state_delta.case_refs = [];
    changed = true;
  }
  if (typeof record.last_state_delta.iteration_ref !== "string") {
    record.last_state_delta.iteration_ref = "";
    changed = true;
  }
  if (typeof record.last_state_delta.next_loop_focus !== "string") {
    record.last_state_delta.next_loop_focus = "";
    changed = true;
  }
  if (typeof record.last_state_delta.updated_at !== "string") {
    record.last_state_delta.updated_at = timestamp;
    changed = true;
  }

  if (changed) {
    record.project.updated_at = timestamp;
  }
  return changed;
}

function normalizeEnumField(object, key, valid, fallback) {
  if (valid.has(object[key])) {
    return false;
  }
  object[key] = fallback;
  return true;
}

function normalizeEvidenceMaturity(dimension) {
  const value = dimension.evidence_maturity;
  if (VALID_EVIDENCE_MATURITY.has(value)) {
    return false;
  }
  const mapped = {
    unknown: "none",
    needed: "none",
    defined: "formalized",
    designed: "formalized",
    implemented: "confirmed",
    integrated: "confirmed",
    verified: "validated",
    accepted: "validated",
    released: "validated",
    operational: "validated",
    complete: "validated",
    satisfied: "confirmed",
    formal: "formalized",
    validated_evidence: "validated"
  }[String(value || "").trim()];
  dimension.evidence_maturity = mapped || (Array.isArray(dimension.evidence) && dimension.evidence.length > 0 ? "confirmed" : "none");
  return true;
}

async function firstMarkdown(dir) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dir);
  const name = entries.filter((entry) => entry.endsWith(".md")).sort()[0];
  return name ? join(dir, name) : "";
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function relativeToProject(root, file) {
  const absolute = isAbsolute(file) ? file : join(root, file);
  return normalizeProjectRef(relative(root, resolve(absolute)));
}

function normalizeProjectRef(ref) {
  if (typeof ref !== "string" || !ref.trim()) {
    return "";
  }
  const normalized = ref.replaceAll("\\", "/");
  const marker = "/arckit/";
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex >= 0) {
    return normalized.slice(markerIndex + 1);
  }
  if (normalized.startsWith("arckit/")) {
    return normalized;
  }
  return normalized;
}

function syncCaseHeader(text, record) {
  return text
    .replace(/^Status: .*$/m, `Status: ${record.status}`)
    .replace(/^Artifact Type: .*$/m, `Artifact Type: ${record.artifact_type}`)
    .replace(/^Current Gap: .*$/m, `Current Gap: ${record.current_round_gap}`)
    .replace(/^Updated: .*$/m, `Updated: ${record.updated_at}`);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function t(language, english, zhHans) {
  return language === "zh-Hans" ? zhHans : english;
}
