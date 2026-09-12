import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createDefaultCaseRecord } from "../../../entry/skills/arckit-development-ledger/scripts/development-case.mjs";
import { createProjectStateRecord } from "../../../entry/skills/arckit-development-ledger/scripts/project-state.mjs";
import {
  applyRuntimeCaseControl,
  validateCaseControlHandoff
} from "../../../entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs";
import { createLoopFrame } from "../src/agent-orchestrator.mjs";
import { createCaseControlRuntimeResult } from "../src/kernel/runtime-result-builder.mjs";
import { validateRuntimeResult } from "../src/validator.mjs";

test("trusted Case creation materializes semantic handles into canonical identities and references", async () => {
  const fixture = await createCaseFixture();
  try {
    const result = await applyRuntimeCaseControl(fixture.input);
    assert.equal(result.written, true);
    assert.equal(result.case_control_result.action, "create_case");
    const caseKey = result.case_control_result.case_id.replace(/^CASE-/, "");
    assert.deepEqual(result.case_control_result.canonical_id_mapping, {
      "local:fact:reported-defect": `FACT-${caseKey}-001`,
      "local:gap:repair-defect": `GAP-${caseKey}-001`,
      "local:impact:realization-threat": `IMPACT-${caseKey}-001`
    });

    const [caseName] = await readdir(join(fixture.root, "arckit/cases/active"));
    const record = parseCaseMarkdown(await readFile(join(fixture.root, "arckit/cases/active", caseName), "utf8"));
    assert.equal(record.facts[0].id, `FACT-${caseKey}-001`);
    assert.equal(record.facts[0].revision, 1);
    assert.equal(record.facts[0].status, "accepted");
    assert.equal(record.gaps[0].id, `GAP-${caseKey}-001`);
    assert.deepEqual(record.gaps[0].derived_from, [`FACT-${caseKey}-001`]);
    assert.equal(record.state_impacts[0].id, `IMPACT-${caseKey}-001`);
    assert.equal(record.state_impacts[0].fact_id, `FACT-${caseKey}-001`);
    assert.deepEqual(record.state_impacts[0].gap_ids, [`GAP-${caseKey}-001`]);
    assert.equal(record.state_impacts[0].target.ref, "accepted-facts-are-realized");
    assert.equal(record.state_impacts[0].target.revision, null);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("empty canonical-shaped Case creation claim is rejected for same-thread Agent repair before write", async () => {
  const fixture = await createCaseFixture();
  try {
    const invalid = {
      ...fixture.input.runtimeResult.case_control_handoff,
      initial_facts: [
        { id: "", revision: 1, status: "accepted", statement: "Requirement", basis: "Operator input", evidence: ["system:current_operator_input"] },
        { id: "", revision: 1, status: "accepted", statement: "Current behavior", basis: "Code", evidence: ["src/example.mjs"] }
      ],
      initial_impacts: [],
      initial_gaps: [{ id: "", status: "open", goal: "Repair", reason: "Broken", derived_from: ["system:current_operator_input"], blocked_by: [], priority_basis: { blocking: "high" }, responsibility: "agent", evidence_required: [], resolution: null }]
    };
    const result = await applyRuntimeCaseControl({ ...fixture.input, runtimeResult: { case_control_handoff: invalid } });
    assert.equal(result.written, false);
    assert.equal(result.rejection.kind, "claim_invalid");
    assert.equal(result.rejection.responsibility, "agent");
    assert.equal(result.rejection.recovery_action, "repair_rejected_claim");
    assert.equal(result.rejection.counts_toward_agent_repair, true);
    assert.match(result.rejection.reason, /local:fact:<handle>/);
    assert.deepEqual(await readdir(join(fixture.root, "arckit/cases/active")), []);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("duplicate handles and unknown initial references fail closed without canonical mutation", async () => {
  const fixture = await createCaseFixture();
  try {
    const base = fixture.input.runtimeResult.case_control_handoff;
    const duplicate = { ...base, initial_facts: [...base.initial_facts, structuredClone(base.initial_facts[0])] };
    const duplicateResult = await applyRuntimeCaseControl({ ...fixture.input, runtimeResult: { case_control_handoff: duplicate } });
    assert.equal(duplicateResult.rejection.kind, "claim_invalid");
    assert.match(duplicateResult.rejection.reason, /must appear only once/);

    const unknown = structuredClone(base);
    unknown.initial_gaps[0].derived_from = ["local:fact:unknown"];
    const unknownResult = await applyRuntimeCaseControl({ ...fixture.input, runtimeResult: { case_control_handoff: unknown } });
    assert.equal(unknownResult.rejection.kind, "claim_invalid");
    assert.match(unknownResult.rejection.reason, /unknown local fact/);
    assert.deepEqual(await readdir(join(fixture.root, "arckit/cases/active")), []);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("trusted closed Case reuse is exact, idempotent, and does not mutate canonical files", async () => {
  const fixture = await closedCaseFixture();
  try {
    const first = await applyRuntimeCaseControl(fixture.input);
    const second = await applyRuntimeCaseControl(fixture.input);

    assert.equal(first.written, true);
    assert.equal(first.case_control_result.action, "bind_closed_case");
    assert.equal(first.case_control_result.binding_kind, "completed_case_reuse");
    assert.equal(first.case_control_result.case_id, fixture.caseId);
    assert.equal(first.case_control_result.case_source_digest, fixture.digest);
    assert.deepEqual(first.changed_files, []);
    assert.deepEqual(second.case_control_result, first.case_control_result);
    assert.equal(second.post_commit_snapshot_token, first.post_commit_snapshot_token);
    assert.equal(await readFile(fixture.caseFile, "utf8"), fixture.caseText);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("closed Case reuse rejects stale identity evidence and non-resolved records", async () => {
  const fixture = await closedCaseFixture();
  try {
    const base = fixture.input.runtimeResult.case_control_handoff;
    await assert.rejects(
      applyRuntimeCaseControl({ ...fixture.input, runtimeResult: { case_control_handoff: { ...base, expected_case_updated_at: "2026-01-01T00:00:00.000Z" } } }),
      /claim is stale/
    );
    await assert.rejects(
      applyRuntimeCaseControl({ ...fixture.input, runtimeResult: { case_control_handoff: { ...base, case_source_digest: "0".repeat(64) } } }),
      /digest mismatch/
    );

    const active = JSON.parse(JSON.stringify(fixture.record));
    active.status = "active";
    active.case_resolution.status = "unresolved";
    const activeText = caseMarkdown(active);
    await writeFile(fixture.caseFile, activeText);
    const activeDigest = createHash("sha256").update(activeText).digest("hex");
    await assert.rejects(
      applyRuntimeCaseControl({ ...fixture.input, runtimeResult: { case_control_handoff: { ...base, case_source_digest: activeDigest } } }),
      /not both closed and resolved/
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("closed Case reuse rejects missing or ambiguous canonical identity", async () => {
  const fixture = await closedCaseFixture();
  try {
    await rm(fixture.caseFile);
    await assert.rejects(applyRuntimeCaseControl(fixture.input), /found 0/);

    await writeFile(fixture.caseFile, fixture.caseText);
    await writeFile(
      join(fixture.root, `arckit/cases/closed/${fixture.caseId}-duplicate.md`),
      fixture.caseText
    );
    await assert.rejects(applyRuntimeCaseControl(fixture.input), /found 2/);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("closed Case reuse handoff requires typed coverage evidence", () => {
  const valid = {
    schema_version: "arckit-case-control-handoff/v1",
    action: "bind_closed_case",
    expected_project_revision: 3,
    case_id: "CASE-20260825-007",
    expected_case_updated_at: "2026-08-25T15:00:00.000Z",
    case_source_digest: "a".repeat(64),
    coverage_reason: "The closed Case outcome fully covers the todo.",
    coverage_evidence: ["arckit/cases/closed/CASE-20260825-007-fix.md"]
  };
  assert.deepEqual(validateCaseControlHandoff(valid), []);
  assert.match(validateCaseControlHandoff({ ...valid, coverage_evidence: [] }).join("\n"), /coverage_evidence/);
});

test("Runtime projects closed Case reuse as a terminal writeback-gated result", async () => {
  const snapshot = {
    projectRoot: process.cwd(),
    projectState: createProjectStateRecord({ name: "Fixture", intent: "Validate reuse projection." }),
    summary: {}, activeCases: [], ledgerSnapshot: {}
  };
  const round = { round_index: 1, required_context_refs: [], stop_conditions: [] };
  const loopFrame = createLoopFrame({ snapshot, round, task: "finish" });
  const control = {
    action: "bind_closed_case", case_id: "CASE-20260825-007", expected_case_updated_at: "2026-08-25T15:00:00.000Z",
    case_source_digest: "a".repeat(64), coverage_reason: "The Case exactly covers the todo.", coverage_evidence: ["test/fix.test.mjs"]
  };
  const result = await createCaseControlRuntimeResult({
    controllerPlan: {
      execution_plan: { runtime_actions: [{ type: "case_control", ...control }] },
      continuation_intent: { goal: control.coverage_reason, state_transition: "Todo unbound -> authoritative closed Case binding", next_prompt: "" }
    },
    loopFrame, round, snapshot, compiledPrompt: { output_schema: "runtime/arcorbit/schemas/agent-loop-result.schema.json" }, roundState: {}
  });

  assert.equal(result.round_result, "done");
  assert.equal(result.case_outcome.status, "resolved");
  assert.equal(result.ledger_stage.writeback_required, true);
  assert.equal(result.loop_handoff.next_responsibility, "none");
  assert.deepEqual(validateRuntimeResult(result).issues, []);
});

async function createCaseFixture() {
  const root = await mkdtemp(join(tmpdir(), "arckit-create-case-"));
  await mkdir(join(root, "arckit/project"), { recursive: true });
  await mkdir(join(root, "arckit/cases/active"), { recursive: true });
  await mkdir(join(root, "arckit/cases/closed"), { recursive: true });
  const project = createProjectStateRecord({ name: "Fixture", intent: "Validate semantic Case creation." });
  await writeFile(join(root, "arckit/project/state.record.json"), `${JSON.stringify(project, null, 2)}\n`);
  const handoff = {
    schema_version: "arckit-case-control-handoff/v1",
    action: "create_case",
    expected_project_revision: project.project.revision,
    case_id: "",
    title: "Repair semantic Case creation",
    intent: "Let the Ledger own canonical identity.",
    expected_outcome: "Semantic handles are materialized atomically.",
    artifact_type: "code",
    selection_reason: "No active Case covers the defect.",
    initial_facts: [{
      ref: "local:fact:reported-defect",
      statement: "Case creation currently has an identity ownership defect.",
      basis: "Runtime trace and code inspection.",
      evidence: ["runtime:test-trace"]
    }],
    initial_impacts: [{
      ref: "local:impact:realization-threat",
      fact_ref: "local:fact:reported-defect",
      target_ref: "project:invariant:accepted-facts-are-realized",
      effect: "threatened",
      reason: "The Runtime cannot persist the accepted fact.",
      gap_refs: ["local:gap:repair-defect"],
      evidence: []
    }],
    initial_gaps: [{
      ref: "local:gap:repair-defect",
      goal: "Materialize Case identities.",
      reason: "Canonical persistence is blocked.",
      derived_from: ["local:fact:reported-defect"],
      blocked_by: [],
      priority_basis: { blocking: "high", risk: "high" },
      responsibility: "agent",
      evidence_required: ["runtime/arcorbit/test/runtime-case-control.test.mjs"]
    }],
    review_policy: { max_autonomous_cycles: 3, source: "test-policy" }
  };
  return {
    root,
    input: {
      projectRoot: root,
      runtimeResult: { case_control_handoff: handoff },
      snapshot: null,
      gate: { allowed: true },
      dryRun: false
    }
  };
}

async function closedCaseFixture() {
  const root = await mkdtemp(join(tmpdir(), "arckit-closed-case-reuse-"));
  const caseId = "CASE-20260825-007";
  await mkdir(join(root, "arckit/project"), { recursive: true });
  await mkdir(join(root, "arckit/cases/closed"), { recursive: true });
  const project = createProjectStateRecord({ name: "Fixture", intent: "Validate closed Case reuse." });
  project.project.revision = 3;
  await writeFile(join(root, "arckit/project/state.record.json"), `${JSON.stringify(project, null, 2)}\n`);

  const record = createDefaultCaseRecord({
    title: "Already fixed", artifactType: "code", intent: "Fix the todo", expectedOutcome: "The todo is fixed",
    maxReviewCycles: 3, reviewPolicySource: "test-policy",
    initialFacts: [{ id: "FACT-1", revision: 1, status: "accepted", statement: "The fix is present.", basis: "Test evidence.", evidence: ["test/fix.test.mjs"] }],
    initialImpacts: [],
    initialGaps: [{
      id: "GAP-1", status: "open", goal: "Implement the fix.", reason: "The fix was initially missing.",
      derived_from: ["FACT-1"], blocked_by: [], priority_basis: { blocking: "high" }, responsibility: "agent",
      evidence_required: ["test/fix.test.mjs"], resolution: null
    }]
  });
  record.id = caseId;
  record.status = "closed";
  record.updated_at = "2026-08-25T15:00:00.000Z";
  record.case_resolution.status = "resolved";
  record.case_resolution.stage = "closed";
  record.gaps[0].status = "resolved";
  record.gaps[0].resolution = { outcome: "Fixed.", reason: "The implementation and tests passed.", evidence: ["test/fix.test.mjs"] };
  record.case_resolution.candidate_gaps = [];
  const caseText = caseMarkdown(record);
  const caseFile = join(root, `arckit/cases/closed/${caseId}-already-fixed.md`);
  await writeFile(caseFile, caseText);
  const digest = createHash("sha256").update(caseText).digest("hex");
  const handoff = {
    schema_version: "arckit-case-control-handoff/v1", action: "bind_closed_case", expected_project_revision: 3,
    case_id: caseId, expected_case_updated_at: record.updated_at, case_source_digest: digest,
    coverage_reason: "The resolved outcome and evidence fully cover the current todo.", coverage_evidence: ["test/fix.test.mjs"]
  };
  return {
    root, caseId, record, caseText, caseFile, digest,
    input: { projectRoot: root, runtimeResult: { case_control_handoff: handoff }, snapshot: null, gate: { allowed: true }, dryRun: false }
  };
}

function caseMarkdown(record) {
  return `# ${record.title}\n\nStatus: ${record.status}\nArtifact Type: ${record.artifact_type}\nSelected Gap: none\nUpdated: ${record.updated_at}\n\n## Structured Record\n\n\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\`\n`;
}

function parseCaseMarkdown(text) {
  return JSON.parse(text.match(/## Structured Record[\s\S]*?```json\s*\n([\s\S]*?)\n```/)[1]);
}
