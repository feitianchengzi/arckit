import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { runLedgerScript } from "./ledger-scripts.mjs";
import { detectConversationLocale } from "./conversation-locale.mjs";

const INITIAL_GAP_ID = "GAP-initial-project-discovery";
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
    t(conversationLocale, "Initial Arckit project loop", "初始 Arckit 项目 loop"),
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
  const nextGoal = t(conversationLocale, "Use the first Desktop chat task to establish project intent, scenarios, behavior expectations, implementation boundary, and next loop handoff.", "使用第一次 Desktop 对话任务建立项目意图、场景、行为预期、实现边界和下一轮 loop handoff。");
  record.updated_at = timestamp;
  record.expected_outcome = record.expected_outcome || t(conversationLocale, "A new Arckit-managed project can start from an empty directory and become recoverable by future agent rounds.", "新的 Arckit 管理项目可以从空目录启动，并能被后续 Agent 轮次恢复。");
  record.current_round_goal = nextGoal;
  record.current_round_gap = "initial_project_discovery";
  record.round_strategy_decision = {
    ...(record.round_strategy_decision || {}),
    selected_route: "initial_project_discovery",
    reason: t(conversationLocale, "The project started without Arckit state, so the first runtime turn must establish source facts and a bounded implementation handoff before treating implementation as complete.", "项目启动时没有 Arckit state，因此第一轮 runtime 必须先建立 source facts 和有边界的 implementation handoff，不能直接把实现当成完成。"),
    considered_routes: [
      {
        route: "direct_implementation",
        decision: "deferred",
        reason: t(conversationLocale, "Direct implementation would guess project intent and validation boundaries.", "直接实现会猜测项目意图和验证边界。")
      },
      {
        route: "initial_project_discovery",
        decision: "selected",
        reason: t(conversationLocale, "This creates recoverable state for a real project from the first chat.", "这会从第一次对话开始为真实项目创建可恢复状态。")
      }
    ],
    next_route_triggers: [
      t(conversationLocale, "Initial project intent and success criteria are defined.", "初始项目意图和成功标准已定义。"),
      t(conversationLocale, "Unknowns are routed to pending or user decision.", "未知项已路由到 pending 或用户决策。"),
      t(conversationLocale, "A bounded implementation handoff exists.", "已有有边界的 implementation handoff。")
    ],
    user_visible_summary: t(conversationLocale, "The first run initializes the project loop instead of failing on missing Arckit state.", "第一次运行会初始化项目 loop，而不是因为缺少 Arckit state 失败。")
  };
  record.project_state_delta = {
    ...(record.project_state_delta || {}),
    changed: ["project_intent", "problem_scenarios", "maintainability_handoff"],
    unchanged_unknown: ["product_behavior", "architecture_foundation", "quality_validation"],
    deferred: [],
    blocked: [],
    next_project_question: nextGoal,
    updated_at: timestamp
  };
  record.decisions = [
    ...asArray(record.decisions),
    t(conversationLocale, "Empty projects are valid Arckit Desktop inputs; initialization creates state, case, and an initial discovery gap instead of requiring terminal setup.", "空项目是有效的 Arckit Desktop 输入；初始化会创建 state、case 和初始 discovery gap，而不是要求先用终端配置。")
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
      responsibility_reason: t(conversationLocale, "The next step is agent-continuable initial discovery from the first Desktop chat.", "下一步是可由 Agent 继续的初始发现，基于第一次 Desktop 对话推进。"),
      next_prompt: t(conversationLocale, "Continue the initial Arckit project loop from the first Desktop chat. Read project state and this case, then establish source facts, unknowns, implementation boundary, validation evidence, and next loop handoff.", "继续第一次 Desktop 对话启动的初始 Arckit 项目 loop。读取 project state 和本 case，然后建立 source facts、unknowns、implementation boundary、validation evidence 和下一轮 loop handoff。"),
      agent_instruction: {
        goal: nextGoal,
        required_context_refs: [
          "arckit/project/state.record.json",
          "arckit/project/STATE.md",
          caseRef
        ],
        required_actions: [
          t(conversationLocale, "Read the first chat task and local project evidence.", "读取第一次对话任务和本地项目证据。"),
          t(conversationLocale, "Create or update stable source facts only when justified.", "只有证据充分时才创建或更新稳定 source facts。"),
          t(conversationLocale, "Route unknowns to pending or loop handoff.", "把 unknowns 路由到 pending 或 loop handoff。")
        ],
        required_checks: [
          "source_projection_check",
          "case_audit",
          "workflow_memory_closeout"
        ],
        stop_condition: t(conversationLocale, "Stop after the initial source facts, unknowns, validation evidence, and next loop handoff are explicit.", "当初始 source facts、unknowns、validation evidence 和下一轮 loop handoff 明确后停止。")
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

  const dimensions = record.completeness_dimensions || {};
  if (seedInitialGap) {
    changed = tuneDimension(dimensions.project_intent, {
      target_state: "defined",
      gap: t(conversationLocale, "Project intent is not established yet.", "项目意图尚未建立。"),
      next_transition: t(conversationLocale, "Use the first chat task to define project intent, boundaries, success criteria, and immediate development objective.", "使用第一次对话任务定义项目意图、边界、成功标准和直接开发目标。"),
      priority: "high"
    }) || changed;
    changed = tuneDimension(dimensions.problem_scenarios, {
      target_state: "defined",
      gap: t(conversationLocale, "Core user/problem scenarios are not established yet.", "核心用户/问题场景尚未建立。"),
      next_transition: t(conversationLocale, "Extract the first useful scenario set from the chat and repo evidence.", "从对话和仓库证据中提取第一组有用场景。"),
      priority: "high"
    }) || changed;
    changed = tuneDimension(dimensions.product_behavior, {
      target_state: "defined",
      gap: t(conversationLocale, "Expected product behavior is not established yet.", "预期产品行为尚未建立。"),
      next_transition: t(conversationLocale, "Turn the first request into stable behavior expectations or a pending question.", "把第一次请求转成稳定行为预期，或转成 pending question。"),
      priority: "medium"
    }) || changed;
    changed = tuneDimension(dimensions.architecture_foundation, {
      target_state: "designed",
      gap: t(conversationLocale, "Architecture and implementation boundary are not established yet.", "架构和实现边界尚未建立。"),
      next_transition: t(conversationLocale, "Inspect the project surface and define the first safe implementation boundary.", "检查项目表面，并定义第一个安全实现边界。"),
      priority: "medium"
    }) || changed;
    changed = tuneDimension(dimensions.maintainability_handoff, {
      target_state: "defined",
      gap: t(conversationLocale, "A future agent cannot yet recover the project state safely.", "后续 Agent 还不能安全恢复项目状态。"),
      next_transition: t(conversationLocale, "Create enough Arckit ledger evidence for the next round to continue.", "创建足够的 Arckit ledger 证据，让下一轮可以继续。"),
      priority: "high"
    }) || changed;
  }

  if (!Array.isArray(record.state_gaps)) {
    record.state_gaps = [];
    changed = true;
  }
  if (seedInitialGap && !record.state_gaps.some((gap) => gap.id === INITIAL_GAP_ID)) {
    record.state_gaps.unshift({
      id: INITIAL_GAP_ID,
      dimension: "project_intent",
      current_state: dimensions.project_intent?.current_state || "unknown",
      target_state: "defined",
      urgency: "high",
      risk: "high",
      impact: t(conversationLocale, "Empty project has no stable Arckit source facts yet; implementation would otherwise guess intent, scope, and validation.", "空项目还没有稳定的 Arckit source facts；如果直接实现，会猜测意图、范围和验证方式。"),
      next_transition: t(conversationLocale, "Use the current chat task to establish initial source facts, route unknowns to pending, and produce the next bounded implementation handoff.", "使用当前对话任务建立初始 source facts，把 unknowns 路由到 pending，并产出下一步有边界的 implementation handoff。"),
      dependencies: []
    });
    changed = true;
  }

  const nextTransition = t(conversationLocale, "Use the current chat task to establish initial source facts, route unknowns to pending, and produce the next bounded implementation handoff.", "使用当前对话任务建立初始 source facts，把 unknowns 路由到 pending，并产出下一步有边界的 implementation handoff。");
  if (seedInitialGap) {
    record.loop_control = {
      ...(record.loop_control || {}),
      current_loop_focus: record.loop_control?.current_loop_focus || t(conversationLocale, "Initial project discovery from Desktop chat", "从 Desktop 对话进行初始项目发现"),
      next_transition: record.loop_control?.next_transition || nextTransition,
      priority_basis: record.loop_control?.priority_basis || t(conversationLocale, "The project has no stable Arckit source facts yet.", "项目还没有稳定的 Arckit source facts。"),
      stop_condition: record.loop_control?.stop_condition || t(conversationLocale, "Stop after source facts, unknowns, implementation boundary, and loop handoff are explicit.", "当 source facts、unknowns、implementation boundary 和 loop handoff 明确后停止。"),
      next_responsibility: record.loop_control?.next_responsibility === "none" ? "agent" : record.loop_control?.next_responsibility || "agent",
      agent_continuation_available: true,
      human_decision_required: record.loop_control?.human_decision_required === true ? true : false,
      trigger_mode: record.loop_control?.trigger_mode === "none" ? "manual_bridge" : record.loop_control?.trigger_mode || "manual_bridge",
      continuation_prompt: record.loop_control?.continuation_prompt || t(conversationLocale, "Continue the initial Arckit project loop from the first Desktop chat.", "继续第一次 Desktop 对话启动的初始 Arckit 项目 loop。"),
      responsibility_reason: record.loop_control?.responsibility_reason || t(conversationLocale, "The next step is agent-continuable project discovery; no human decision is required just to initialize the loop.", "下一步是 Agent 可继续的项目发现；仅初始化 loop 不需要人类决策。")
    };

    record.last_state_delta = {
      ...(record.last_state_delta || {}),
      changed_dimensions: Array.from(new Set([
        ...asArray(record.last_state_delta?.changed_dimensions),
        "project_intent",
        "problem_scenarios",
        "maintainability_handoff"
      ])),
      state_transitions: asArray(record.last_state_delta?.state_transitions),
      deferred_dimensions: asArray(record.last_state_delta?.deferred_dimensions),
      blocked_dimensions: asArray(record.last_state_delta?.blocked_dimensions),
      case_refs: record.active_case_refs,
      iteration_ref: record.active_iteration_ref || "",
      next_loop_focus: record.loop_control.current_loop_focus,
      updated_at: timestamp
    };
    record.project.current_phase = record.project.current_phase || "state-discovery";
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

function tuneDimension(dimension, patch) {
  if (!dimension) {
    return false;
  }
  let changed = false;
  for (const [key, value] of Object.entries(patch)) {
    if (shouldSeedField(dimension, key)) {
      dimension[key] = value;
      changed = true;
    }
  }
  return changed;
}

function shouldSeedField(dimension, key) {
  if (!dimension[key]) {
    return true;
  }
  if (key === "target_state" && dimension.current_state === "unknown" && dimension.target_state === "accepted") {
    return true;
  }
  if (key === "gap" && /^Move unknown toward accepted\.$/.test(dimension.gap || "")) {
    return true;
  }
  if (key === "priority" && dimension.priority === "medium") {
    return true;
  }
  return false;
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
