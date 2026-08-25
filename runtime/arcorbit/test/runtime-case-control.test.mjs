import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
