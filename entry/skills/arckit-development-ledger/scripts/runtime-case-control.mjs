import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { withProjectCommitLock } from './project-commit-lock.mjs';
import { readLedgerSnapshot } from './loop-snapshot.mjs';
import { createDefaultCaseRecord } from './development-case.mjs';
import {
  CaseControlClaimError,
  materializeSemanticCreateCaseHandoff,
  validateSemanticCreateCaseHandoff,
} from './semantic-case-control.mjs';
import {
  auditProjectState,
  createDevelopmentCase,
  nextDevelopmentCaseId,
  registerProjectCase,
  writeDevelopmentCaseIndex,
} from './trusted-ledger-operations.mjs';
const ARTIFACT_TYPES = new Set(['code', 'skill', 'document', 'workflow', 'mixed', 'unknown']);
const ACTIONS = new Set(['create_case', 'bind_closed_case']);

export function validateCaseControlHandoff(handoff, field = 'case_control_handoff') {
  const issues = [];
  if (!handoff || typeof handoff !== 'object' || Array.isArray(handoff)) return [`${field} must be an object.`];
  if (handoff.schema_version !== 'arckit-case-control-handoff/v1') issues.push(`${field}.schema_version must be arckit-case-control-handoff/v1.`);
  if (!ACTIONS.has(handoff.action)) issues.push(`${field}.action must be create_case or bind_closed_case.`);
  if (!Number.isInteger(handoff.expected_project_revision) || handoff.expected_project_revision < 0) issues.push(`${field}.expected_project_revision must be a non-negative integer.`);
  if (handoff.action === 'create_case') {
    for (const key of ['case_id', 'title', 'intent', 'expected_outcome', 'artifact_type', 'selection_reason']) {
      if (typeof handoff[key] !== 'string') issues.push(`${field}.${key} must be a string.`);
    }
    if (!ARTIFACT_TYPES.has(handoff.artifact_type)) issues.push(`${field}.artifact_type is invalid.`);
    for (const key of ['initial_facts', 'initial_impacts', 'initial_gaps']) if (!Array.isArray(handoff[key])) issues.push(`${field}.${key} must be an array.`);
    if (!handoff.review_policy || typeof handoff.review_policy !== 'object' || Array.isArray(handoff.review_policy)) {
      issues.push(`${field}.review_policy must be an object.`);
    } else {
      if (!Number.isInteger(handoff.review_policy.max_autonomous_cycles) || handoff.review_policy.max_autonomous_cycles < 1) issues.push(`${field}.review_policy.max_autonomous_cycles must be a positive integer.`);
      if (typeof handoff.review_policy.source !== 'string' || !handoff.review_policy.source.trim()) issues.push(`${field}.review_policy.source must be a non-empty string.`);
    }
    if (!handoff.title?.trim() || !handoff.intent?.trim() || !handoff.expected_outcome?.trim() || !handoff.selection_reason?.trim()) issues.push(`${field} create_case requires title, intent, expected_outcome, and selection_reason.`);
    if (handoff.initial_facts?.length === 0 || handoff.initial_gaps?.length === 0) issues.push(`${field} create_case requires semantic initial_facts and at least one initial_gap.`);
    if (handoff.case_id) issues.push(`${field}.case_id must be empty when action=create_case; the ledger allocates the id.`);
    issues.push(...validateSemanticCreateCaseHandoff(handoff, field).map((issue) => `${issue.path}: ${issue.message}`));
  }
  if (handoff.action === 'bind_closed_case') {
    for (const key of ['case_id', 'expected_case_updated_at', 'case_source_digest', 'coverage_reason']) {
      if (typeof handoff[key] !== 'string' || !handoff[key].trim()) issues.push(`${field}.${key} must be a non-empty string.`);
    }
    if (!/^[a-f0-9]{64}$/.test(handoff.case_source_digest || '')) issues.push(`${field}.case_source_digest must be a lowercase SHA-256 digest.`);
    if (!Array.isArray(handoff.coverage_evidence) || handoff.coverage_evidence.length === 0 || handoff.coverage_evidence.some((item) => typeof item !== 'string' || !item.trim())) {
      issues.push(`${field}.coverage_evidence must contain at least one non-empty evidence ref.`);
    }
  }
  return issues;
}

export async function applyRuntimeCaseControl({ projectRoot, runtimeResult, snapshot, gate, dryRun = false, runtimeRecordRef = '' }) {
  const root = path.resolve(projectRoot);
  if (!gate?.allowed) return emptyResult(gate, dryRun);
  const handoff = runtimeResult.case_control_handoff;
  const issues = validateCaseControlHandoff(handoff);
  if (issues.length) return rejectionResult({ gate, dryRun, handoff, kind: 'claim_invalid', issues: issues.map(issueRecord) });
  if (dryRun) return applyRuntimeCaseControlUnlocked({ root, handoff, gate, dryRun, runtimeRecordRef });
  return withProjectCommitLock(root, () => applyRuntimeCaseControlUnlocked({ root, handoff, gate, dryRun: false, runtimeRecordRef }));
}

async function applyRuntimeCaseControlUnlocked({ root, handoff, gate, dryRun, runtimeRecordRef }) {
  const statePath = path.join(root, 'arckit/project/state.record.json');
  const projectState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  if (projectState.project?.revision !== handoff.expected_project_revision) {
    const message = `Case control handoff is stale: expected Project revision ${projectState.project?.revision ?? '<missing>'}, received ${handoff.expected_project_revision ?? '<missing>'}.`;
    return rejectionResult({ gate, dryRun, handoff, kind: 'snapshot_stale', issues: [{ path: 'case_control_handoff.expected_project_revision', message }] });
  }
  if (handoff.action === 'bind_closed_case') {
    return bindClosedCase({ root, handoff, gate, dryRun, runtimeRecordRef });
  }

  const caseId = nextDevelopmentCaseId(root);
  let materialized;
  try {
    materialized = materializeSemanticCreateCaseHandoff({ handoff, projectState, caseId });
  } catch (error) {
    if (error instanceof CaseControlClaimError) return rejectionResult({ gate, dryRun, handoff, kind: error.kind, issues: error.issues });
    throw error;
  }

  let selectedCaseRef = '';

  const plan = [
    { action: 'materialize_case_control_identities', path: caseId },
    { action: 'create_case', path: 'arckit/cases/active/' },
    { action: 'register_case', path: 'ledger_allocated_case_ref' },
    { action: 'render_case_index', path: 'arckit/cases/INDEX.md' },
  ];
  if (dryRun) {
    createDefaultCaseRecord({
      id: caseId, title: handoff.title, artifactType: handoff.artifact_type, intent: handoff.intent,
      expectedOutcome: handoff.expected_outcome, initialFacts: materialized.facts,
      initialImpacts: materialized.impacts, initialGaps: materialized.gaps,
      maxReviewCycles: handoff.review_policy.max_autonomous_cycles, reviewPolicySource: handoff.review_policy.source,
    });
    return { schema_version: 'arckit-ledger-write/v2', written: false, dry_run: true, gate, runtime_result_ref: runtimeRecordRef, plan, changed_files: [] };
  }

  const snapshots = snapshotMutableFiles(root, projectState.advancement.active_iteration_ref || '');
  const activeDir = path.join(root, 'arckit/cases/active');
  const initialActiveFiles = new Set(fs.existsSync(activeDir) ? fs.readdirSync(activeDir) : []);
  try {
    const created = { stdout: createDevelopmentCase(root, {
      'case-id': caseId,
      title: handoff.title,
      'artifact-type': handoff.artifact_type,
      intent: handoff.intent,
      'expected-outcome': handoff.expected_outcome,
      'initial-facts': JSON.stringify(materialized.facts),
      'initial-impacts': JSON.stringify(materialized.impacts),
      'initial-gaps': JSON.stringify(materialized.gaps),
      'max-review-cycles': String(handoff.review_policy.max_autonomous_cycles),
      'review-policy-source': handoff.review_policy.source,
    }) };
    selectedCaseRef = relativeCaseRef(root, created.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1));
    registerProjectCase(root, { 'case-ref': selectedCaseRef, intent: handoff.intent, reason: handoff.selection_reason });
    writeDevelopmentCaseIndex(root);
    auditProjectState(root, 'arckit/project/state.record.json');
  } catch (error) {
    restoreSnapshots(snapshots);
    if (fs.existsSync(activeDir)) {
      for (const name of fs.readdirSync(activeDir)) {
        if (!initialActiveFiles.has(name)) fs.unlinkSync(path.join(activeDir, name));
      }
    }
    throw error;
  }

  const selectedCase = readCaseRecord(path.join(root, selectedCaseRef));
  const postCommitSnapshot = readLedgerSnapshot(root);
  return {
    schema_version: 'arckit-ledger-write/v2',
    written: true,
    dry_run: false,
    gate,
    runtime_result_ref: runtimeRecordRef,
    plan,
    case_control_result: {
      schema_version: 'arckit-case-control-result/v1',
      action: handoff.action,
      registered_case_ref: selectedCaseRef,
      case_id: selectedCase.id,
      case_updated_at: selectedCase.updated_at,
      canonical_id_mapping: materialized.canonical_id_mapping,
      candidate_gaps: selectedCase.case_resolution?.candidate_gaps || [],
    },
    post_commit_snapshot_token: postCommitSnapshot.snapshot_token,
    changed_files: [...new Set([
      selectedCaseRef,
      'arckit/project/state.record.json',
      'arckit/project/STATE.md',
      'arckit/cases/INDEX.md',
      ...(projectState.advancement.active_iteration_ref
        ? [projectState.advancement.active_iteration_ref, projectState.advancement.active_iteration_ref.replace(/\.record\.json$/, '.md'), 'arckit/project/ITERATIONS.md']
        : []),
    ])],
  };
}

function bindClosedCase({ root, handoff, gate, dryRun, runtimeRecordRef }) {
  const closedDir = path.join(root, 'arckit/cases/closed');
  const matches = fs.existsSync(closedDir)
    ? fs.readdirSync(closedDir).filter((name) => name.startsWith(`${handoff.case_id}-`) && name.endsWith('.md'))
    : [];
  if (matches.length !== 1) {
    throw new Error(`Closed Case reuse requires exactly one canonical closed Case for ${handoff.case_id}; found ${matches.length}.`);
  }
  const caseFile = path.join(closedDir, matches[0]);
  const caseRef = relativeClosedCaseRef(root, caseFile);
  const content = fs.readFileSync(caseFile, 'utf8');
  const record = readCaseRecord(caseFile, content);
  if (record.id !== handoff.case_id) throw new Error(`Closed Case identity mismatch: expected ${handoff.case_id}, found ${record.id || '<missing>'}.`);
  if (record.status !== 'closed' || record.case_resolution?.status !== 'resolved') {
    throw new Error(`Case ${handoff.case_id} is not both closed and resolved.`);
  }
  if (record.updated_at !== handoff.expected_case_updated_at) {
    throw new Error(`Closed Case reuse claim is stale for ${handoff.case_id}: expected updated_at ${record.updated_at}, received ${handoff.expected_case_updated_at}.`);
  }
  const digest = createHash('sha256').update(content).digest('hex');
  if (digest !== handoff.case_source_digest) {
    throw new Error(`Closed Case reuse digest mismatch for ${handoff.case_id}.`);
  }
  const plan = [{ action: 'validate_closed_case_reuse', path: caseRef }];
  if (dryRun) {
    return { schema_version: 'arckit-ledger-write/v2', written: false, dry_run: true, gate, runtime_result_ref: runtimeRecordRef, plan, changed_files: [] };
  }
  const postCommitSnapshot = readLedgerSnapshot(root);
  return {
    schema_version: 'arckit-ledger-write/v2',
    written: true,
    dry_run: false,
    gate,
    runtime_result_ref: runtimeRecordRef,
    plan,
    case_control_result: {
      schema_version: 'arckit-case-control-result/v1',
      action: handoff.action,
      binding_kind: 'completed_case_reuse',
      registered_case_ref: caseRef,
      case_id: record.id,
      case_updated_at: record.updated_at,
      case_source_digest: digest,
      coverage_reason: handoff.coverage_reason,
      coverage_evidence: handoff.coverage_evidence,
      candidate_gaps: [],
    },
    post_commit_snapshot_token: postCommitSnapshot.snapshot_token,
    changed_files: [],
  };
}

function relativeCaseRef(root, absolutePath) {
  const resolved = fs.realpathSync(path.resolve(absolutePath));
  const canonicalRoot = fs.realpathSync(root);
  const relative = path.relative(canonicalRoot, resolved).replaceAll('\\', '/');
  if (!relative.startsWith('arckit/cases/active/') || relative.includes('..')) throw new Error(`Ledger returned an unexpected Case path: ${absolutePath}`);
  return relative;
}

function relativeClosedCaseRef(root, absolutePath) {
  const resolved = fs.realpathSync(path.resolve(absolutePath));
  const canonicalRoot = fs.realpathSync(root);
  const relative = path.relative(canonicalRoot, resolved).replaceAll('\\', '/');
  if (!relative.startsWith('arckit/cases/closed/') || relative.includes('..')) {
    throw new Error(`Closed Case reuse requires a canonical closed Case path: ${absolutePath}`);
  }
  return relative;
}

function snapshotMutableFiles(root, iterationRef) {
  const refs = [
    'arckit/project/state.record.json',
    'arckit/project/STATE.md',
    'arckit/project/ITERATIONS.md',
    'arckit/cases/INDEX.md',
    iterationRef,
    iterationRef ? iterationRef.replace(/\.record\.json$/, '.md') : '',
  ].filter(Boolean);
  return refs.map((ref) => {
    const file = path.join(root, ref);
    return { file, existed: fs.existsSync(file), content: fs.existsSync(file) ? fs.readFileSync(file) : null };
  });
}

function restoreSnapshots(snapshots) {
  for (const snapshot of snapshots) {
    if (snapshot.existed) {
      fs.mkdirSync(path.dirname(snapshot.file), { recursive: true });
      fs.writeFileSync(snapshot.file, snapshot.content);
    } else if (fs.existsSync(snapshot.file)) {
      fs.unlinkSync(snapshot.file);
    }
  }
}

function readCaseRecord(file, sourceText = null) {
  const text = sourceText ?? fs.readFileSync(file, 'utf8');
  const match = text.match(/## Structured Record[\s\S]*?```json\s*\n([\s\S]*?)\n```/);
  if (!match) throw new Error(`${file}: missing Structured Record json block`);
  return JSON.parse(match[1]);
}

function emptyResult(gate, dryRun) {
  return { schema_version: 'arckit-ledger-write/v2', written: false, dry_run: dryRun, gate, plan: [], changed_files: [] };
}

function rejectionResult({ gate, dryRun, handoff, kind, issues }) {
  const stale = kind === 'snapshot_stale';
  return {
    schema_version: 'arckit-ledger-write/v2',
    written: false,
    dry_run: dryRun,
    gate,
    rejection: {
      kind,
      recoverable: true,
      responsibility: 'agent',
      reason: issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'),
      issues,
      case_id: handoff?.case_id || '',
      selected_gap_id: '',
      recovery_action: stale ? 'replan_from_fresh_state' : 'repair_rejected_claim',
      counts_toward_agent_repair: !stale,
    },
    plan: [],
    changed_files: [],
  };
}

function issueRecord(value) {
  const match = String(value || '').match(/^([^:]+(?:\.[^:]+)*):\s*(.*)$/);
  return match ? { path: match[1], message: match[2] } : { path: 'case_control_handoff', message: String(value || 'Invalid Case control handoff.') };
}
