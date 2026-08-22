#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseCaseRecordText, renderCaseRecord, validateCaseRecord } from './development-case.mjs';
import { renderIteration, validateIterationStateRecord } from './project-iteration.mjs';
import { withProjectCommitLock } from './project-commit-lock.mjs';
import { projectTargetRefs, renderProjectState, validateProjectStateRecord } from './project-state.mjs';
import { writeDevelopmentCaseIndex, writeIterationIndex } from './trusted-ledger-operations.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const schemaDir = path.join(path.dirname(scriptsDir), 'schema');

export const CURRENT_PROTOCOL_SUITE = Object.freeze({
  project: schemaVersion('project-state-record.schema.json'),
  case: schemaVersion('development-case-record.schema.json'),
  iteration: schemaVersion('iteration-state-record.schema.json'),
  reconciliation: schemaVersion('protocol-reconciliation.schema.json'),
});

const PROJECT_REF = 'arckit/project/state.record.json';
const ALLOWED_KINDS = new Set(['project', 'case', 'iteration']);

export function probeProtocolCompatibility(projectRoot = process.cwd()) {
  const root = path.resolve(projectRoot);
  const observations = [];
  const projectObservation = observeRecord(root, PROJECT_REF, 'project');
  observations.push(projectObservation);

  const projectRecord = projectObservation.record;
  const caseRefs = new Set(Array.isArray(projectRecord?.advancement?.active_case_refs)
    ? projectRecord.advancement.active_case_refs
    : []);
  const activeDir = safeDirectoryPath(root, 'arckit/cases/active');
  if (fs.existsSync(activeDir)) {
    for (const name of fs.readdirSync(activeDir).filter((item) => item.endsWith('.md')).sort()) {
      caseRefs.add(`arckit/cases/active/${name}`);
    }
  }
  for (const ref of [...caseRefs].sort()) observations.push(observeRecord(root, ref, 'case'));

  if (projectRecord && projectObservation.condition === 'compatible') {
    const registered = new Set(Array.isArray(projectRecord.advancement?.active_case_refs) ? projectRecord.advancement.active_case_refs : []);
    for (const item of observations.filter((observation) => observation.kind === 'case')) {
      if (!registered.has(item.ref) && item.condition === 'compatible') {
        item.condition = 'current_protocol_invalid';
        item.issues.push(`${item.ref}: active Case file is not registered in Project advancement.active_case_refs`);
      }
      if (item.record && item.condition === 'compatible') {
        const crossIssues = [];
        if (item.record.status === 'closed') crossIssues.push(`${item.ref}: active Case file cannot contain a closed Case`);
        validateCaseTargets(item.record, projectRecord, item.ref, crossIssues);
        if (crossIssues.length) {
          item.condition = 'current_protocol_invalid';
          item.issues.push(...crossIssues);
        }
      }
    }
  }

  const iterationRefs = new Set();
  if (typeof projectRecord?.advancement?.active_iteration_ref === 'string' && projectRecord.advancement.active_iteration_ref) {
    iterationRefs.add(projectRecord.advancement.active_iteration_ref);
  } else if (!projectRecord) {
    const iterationDir = safeDirectoryPath(root, 'arckit/project/iterations');
    if (fs.existsSync(iterationDir)) {
      for (const name of fs.readdirSync(iterationDir).filter((item) => item.endsWith('.record.json')).sort()) {
        const ref = `arckit/project/iterations/${name}`;
        const parsed = readCanonical(root, ref, 'iteration');
        if (parsed.record?.status === 'active') iterationRefs.add(ref);
      }
    }
  }
  for (const ref of [...iterationRefs].sort()) observations.push(observeRecord(root, ref, 'iteration'));

  const publicObservations = observations.map(({ record: _record, raw: _raw, ...item }) => item);
  const incompatible = publicObservations.filter((item) => item.condition !== 'compatible');
  const hasVersionMismatch = incompatible.some((item) => [
    'older_protocol', 'newer_protocol', 'unknown_protocol', 'missing_schema_version',
  ].includes(item.condition));
  const snapshotToken = digest(JSON.stringify(publicObservations.map((item) => ({ ref: item.ref, source_digest: item.source_digest }))));
  return {
    schema_version: 'arckit-ledger-compatibility/v1',
    status: incompatible.length ? 'incompatible' : 'compatible',
    state_availability: incompatible.length ? 'unavailable' : 'available',
    recovery_required: incompatible.length > 0,
    recovery_mode: incompatible.length ? (hasVersionMismatch ? 'protocol_reconciliation' : 'current_protocol_repair') : 'none',
    expected: { ...CURRENT_PROTOCOL_SUITE },
    observed: publicObservations,
    affected_refs: incompatible.map((item) => item.ref),
    snapshot_token: snapshotToken,
  };
}

export function validateProtocolReconciliation(plan, compatibility, projectRoot = process.cwd()) {
  const errors = [];
  if (!isObject(plan) || plan.schema_version !== CURRENT_PROTOCOL_SUITE.reconciliation) {
    return ['reconciliation.schema_version must be arckit-protocol-reconciliation/v1'];
  }
  if (compatibility?.status === 'compatible') errors.push('Canonical ledger state is already compatible; reconciliation is not applicable.');
  if (plan.observed_snapshot_token !== compatibility?.snapshot_token) errors.push('reconciliation observed_snapshot_token is stale.');
  if (typeof plan.reason !== 'string' || !plan.reason.trim()) errors.push('reconciliation.reason must be non-empty.');
  if (!nonEmptyStrings(plan.evidence)) errors.push('reconciliation.evidence must contain durable evidence.');
  if (!nonEmptyStrings(plan.preservation_claims)) errors.push('reconciliation.preservation_claims must state what was preserved.');
  if (!Array.isArray(plan.replacements) || plan.replacements.length === 0) errors.push('reconciliation.replacements must be non-empty.');

  const observedByRef = new Map((compatibility?.observed || []).map((item) => [item.ref, item]));
  const replacementRefs = new Set();
  for (const [index, replacement] of (plan.replacements || []).entries()) {
    const label = `reconciliation.replacements[${index}]`;
    if (!isObject(replacement)) { errors.push(`${label} must be an object.`); continue; }
    if (replacementRefs.has(replacement.ref)) errors.push(`${label}.ref is duplicated: ${replacement.ref}`);
    replacementRefs.add(replacement.ref);
    const observed = observedByRef.get(replacement.ref);
    if (!observed) errors.push(`${label}.ref is not part of the probed canonical set: ${replacement.ref || '<missing>'}`);
    if (!ALLOWED_KINDS.has(replacement.kind) || replacement.kind !== observed?.kind) errors.push(`${label}.kind does not match the observed canonical object.`);
    if (replacement.source_digest !== observed?.source_digest) errors.push(`${label}.source_digest is stale.`);
    if ((replacement.observed_schema_version || '') !== (observed?.schema_version || '')) errors.push(`${label}.observed_schema_version does not match the probe.`);
    if (replacement.target_schema_version !== CURRENT_PROTOCOL_SUITE[replacement.kind]) errors.push(`${label}.target_schema_version is not current.`);
    if (!isObject(replacement.record)) errors.push(`${label}.record must be an object.`);
    if (typeof replacement.semantic_basis !== 'string' || !replacement.semantic_basis.trim()) errors.push(`${label}.semantic_basis must be non-empty.`);
    if (!Array.isArray(replacement.uncertainties)) errors.push(`${label}.uncertainties must be an array.`);
    else if (replacement.uncertainties.length) errors.push(`${label}.uncertainties must be resolved before trusted writeback.`);
    if (observed && replacement.record?.schema_version !== CURRENT_PROTOCOL_SUITE[observed.kind]) errors.push(`${label}.record does not use the current ${observed.kind} schema.`);
    errors.push(...validateCandidate(replacement?.record, replacement?.kind, replacement?.ref));
  }
  for (const affectedRef of compatibility?.affected_refs || []) {
    if (!replacementRefs.has(affectedRef)) errors.push(`reconciliation must replace incompatible canonical object: ${affectedRef}`);
  }
  errors.push(...validateProjectedLedger({ projectRoot, plan, compatibility }));
  return unique(errors);
}

export async function applyProtocolReconciliation({ projectRoot = process.cwd(), plan, dryRun = false } = {}) {
  const root = path.resolve(projectRoot);
  const apply = async () => {
    const before = probeProtocolCompatibility(root);
    const errors = validateProtocolReconciliation(plan, before, root);
    if (errors.length) throw new Error(errors.join('\n'));
    const rendered = renderReplacements(root, plan);
    const projectionFiles = projectionPaths(root, plan);
    const transactionFiles = unique([
      ...rendered.map((item) => item.file),
      ...projectionFiles,
      path.join(root, 'arckit/cases/INDEX.md'),
      path.join(root, 'arckit/project/ITERATIONS.md'),
    ]);
    transactionFiles.forEach((file) => assertFilesystemBoundary(root, file));
    if (dryRun) {
      return reconciliationResult({ before, after: null, plan, applied: false, dryRun: true, changedFiles: [] });
    }
    const snapshots = transactionFiles.map(snapshotFile);
    const changedFiles = [];
    try {
      for (const item of rendered) {
        fs.mkdirSync(path.dirname(item.file), { recursive: true });
        fs.writeFileSync(item.file, item.content);
        changedFiles.push(relativeRef(root, item.file));
      }
      regenerateProjections(root, plan, changedFiles);
      const after = probeProtocolCompatibility(root);
      if (after.status !== 'compatible') {
        throw new Error(`Reconciled ledger did not pass the current protocol probe:\n${formatCompatibilityIssues(after)}`);
      }
      return reconciliationResult({ before, after, plan, applied: true, dryRun: false, changedFiles });
    } catch (error) {
      restoreSnapshots(snapshots);
      throw error;
    }
  };
  return dryRun ? apply() : withProjectCommitLock(root, apply);
}

function observeRecord(root, ref, kind) {
  const parsed = readCanonical(root, ref, kind);
  const expected = CURRENT_PROTOCOL_SUITE[kind];
  if (parsed.error) return observation(ref, kind, '', expected, 'unreadable', parsed, [`${ref}: ${parsed.error}`]);
  if (!parsed.exists) return observation(ref, kind, '', expected, 'missing', parsed, [`${ref}: canonical object does not exist`]);
  const actual = typeof parsed.record?.schema_version === 'string' ? parsed.record.schema_version : '';
  if (!actual) return observation(ref, kind, '', expected, 'missing_schema_version', parsed, [`${ref}: schema_version is missing`]);
  if (actual !== expected) return observation(ref, kind, actual, expected, compareVersion(actual, expected), parsed, []);
  const issues = validateCandidate(parsed.record, kind, ref).filter((issue) => !isRepairableCaseProjectionIssue(kind, issue));
  return observation(ref, kind, actual, expected, issues.length ? 'current_protocol_invalid' : 'compatible', parsed, issues);
}

function observation(ref, kind, schemaVersion, expected, condition, parsed, issues) {
  return {
    ref,
    kind,
    schema_version: schemaVersion,
    expected_schema_version: expected,
    condition,
    source_digest: digest(parsed.raw || ''),
    issues,
    record: parsed.record,
    raw: parsed.raw,
  };
}

function readCanonical(root, ref, kind) {
  let file;
  try {
    file = safeCanonicalPath(root, ref, kind);
  } catch (error) {
    return { exists: false, raw: '', record: null, error: error.message };
  }
  if (!fs.existsSync(file)) return { exists: false, raw: '', record: null, error: '' };
  const raw = fs.readFileSync(file, 'utf8');
  try {
    const record = kind === 'case' ? parseCaseRecordText(raw, file) : JSON.parse(raw);
    return { exists: true, raw, record, error: '' };
  } catch (error) {
    return { exists: true, raw, record: null, error: error.message };
  }
}

function validateCandidate(record, kind, ref) {
  if (kind === 'project') return validateProjectStateRecord(record, ref);
  if (kind === 'case') return validateCaseRecord(record, ref);
  if (kind === 'iteration') return validateIterationStateRecord(record, ref);
  return [`${ref || '<record>'}: unsupported canonical kind ${kind || '<missing>'}`];
}

function validateProjectedLedger({ projectRoot, plan, compatibility }) {
  if (!Array.isArray(plan?.replacements)) return [];
  const root = path.resolve(projectRoot);
  const validReplacements = plan.replacements.filter(isObject);
  const replacements = new Map(validReplacements.map((item) => [item.ref, item]));
  const errors = [];
  const project = projectedRecord(root, PROJECT_REF, 'project', replacements);
  if (!project) return [`${PROJECT_REF}: projected Project State is unavailable.`];
  const originalProject = observedRecord(root, PROJECT_REF, 'project');
  preserveProjectIdentity(originalProject, project, errors);

  const activeRefs = Array.isArray(project.advancement?.active_case_refs) ? project.advancement.active_case_refs : [];
  for (const ref of activeRefs) {
    const record = projectedRecord(root, ref, 'case', replacements);
    if (!record) { errors.push(`${ref}: projected active Case is unavailable.`); continue; }
    if (record.status === 'closed') errors.push(`${ref}: projected active Case cannot be closed.`);
    if (record.project_state_ref !== PROJECT_REF) errors.push(`${ref}: project_state_ref must remain ${PROJECT_REF}.`);
    validateCaseTargets(record, project, ref, errors);
  }
  for (const replacement of validReplacements.filter((item) => item.kind === 'case')) {
    preserveCaseIdentity(observedRecord(root, replacement.ref, 'case'), replacement.record, replacement.ref, errors);
  }
  const iterationRef = project.advancement?.active_iteration_ref || '';
  if (iterationRef) {
    const iteration = projectedRecord(root, iterationRef, 'iteration', replacements);
    if (!iteration) errors.push(`${iterationRef}: projected active Iteration is unavailable.`);
    else {
      if (iteration.project_state_ref !== PROJECT_REF) errors.push(`${iterationRef}: project_state_ref must remain ${PROJECT_REF}.`);
      const refs = projectTargetRefs(project);
      refs.project_gap = new Set(project.advancement?.project_gaps?.map((gap) => gap.id) || []);
      for (const target of iteration.targets || []) if (!refs[target.kind]?.has(target.ref)) errors.push(`${iterationRef}: target references unknown ${target.kind}: ${target.ref}`);
    }
  }
  for (const replacement of validReplacements.filter((item) => item.kind === 'iteration')) {
    preserveIterationIdentity(observedRecord(root, replacement.ref, 'iteration'), replacement.record, replacement.ref, errors);
  }
  for (const affected of compatibility?.affected_refs || []) {
    if (!replacements.has(affected)) errors.push(`Projected ledger leaves an incompatible object unreconciled: ${affected}`);
  }
  return errors;
}

function validateCaseTargets(record, project, ref, errors) {
  const targets = projectTargetRefs(project);
  for (const [index, impact] of (record.state_impacts || []).entries()) {
    const target = impact.target || {};
    if (!targets[target.kind]?.has(target.ref)) errors.push(`${ref}: state_impacts[${index}] references unknown ${target.kind}: ${target.ref}`);
    if (target.kind === 'software_decision') {
      const decision = project.software_definition?.decision_areas?.find((area) => area.id === target.ref)?.decision;
      if (decision && target.revision !== decision.revision) errors.push(`${ref}: state_impacts[${index}] binds stale software decision revision ${target.ref}@${target.revision}`);
    }
  }
  const latestRound = (record.rounds || []).at(-1);
  if (latestRound?.transition_schema_version === 'arckit-case-transition/v8') {
    const assessment = latestRound.invariant_assessment;
    if (assessment?.project_revision > project.project.revision) errors.push(`${ref}: latest invariant assessment references future Project revision ${assessment.project_revision}`);
    if (assessment?.project_revision === project.project.revision) {
      const expected = new Set((project.software_invariants || []).map((item) => item.id));
      const actual = (assessment.judgments || []).map((item) => item.invariant_ref);
      const missing = [...expected].filter((id) => !actual.includes(id));
      const unknown = actual.filter((id) => !expected.has(id));
      if (missing.length || unknown.length || actual.length !== expected.size) errors.push(`${ref}: latest invariant assessment does not exactly cover the current Project invariant catalog`);
    }
  }
}

function preserveProjectIdentity(before, after, errors) {
  if (!before) return;
  if (before.project?.name && before.project.name !== after.project?.name) errors.push(`${PROJECT_REF}: reconciliation cannot rename the project.`);
  if (before.project?.intent && !after.project?.intent) errors.push(`${PROJECT_REF}: reconciliation cannot erase project intent.`);
  if (Number.isInteger(before.project?.revision) && after.project?.revision < before.project.revision) errors.push(`${PROJECT_REF}: reconciliation cannot decrease project revision.`);
  const beforeRefs = strings(before.advancement?.active_case_refs);
  const afterRefs = strings(after.advancement?.active_case_refs);
  for (const ref of beforeRefs) if (!afterRefs.includes(ref)) errors.push(`${PROJECT_REF}: reconciliation cannot silently remove active Case ref ${ref}.`);
}

function preserveCaseIdentity(before, after, ref, errors) {
  if (!before) return;
  if (before.id && before.id !== after.id) errors.push(`${ref}: reconciliation cannot change Case id.`);
  if (before.created_at && before.created_at !== after.created_at) errors.push(`${ref}: reconciliation cannot change Case created_at.`);
  if (before.user_intent && !after.user_intent) errors.push(`${ref}: reconciliation cannot erase Case user_intent.`);
  if (before.expected_outcome && !after.expected_outcome) errors.push(`${ref}: reconciliation cannot erase Case expected_outcome.`);
  preserveIds(before.facts, after.facts, `${ref}: accepted fact`, errors, (item) => item?.status === 'accepted');
  preserveIds(before.gaps, after.gaps, `${ref}: open gap`, errors, (item) => item?.status === 'open');
  preserveIds(before.open_questions, after.open_questions, `${ref}: open question`, errors, (item) => item?.status === 'open');
  preserveIds(before.pending_handoffs, after.pending_handoffs, `${ref}: pending handoff`, errors, (item) => item?.status === 'pending');
}

function preserveIterationIdentity(before, after, ref, errors) {
  if (!before) return;
  if (before.id && before.id !== after.id) errors.push(`${ref}: reconciliation cannot change Iteration id.`);
  if (before.created_at && before.created_at !== after.created_at) errors.push(`${ref}: reconciliation cannot change Iteration created_at.`);
}

function preserveIds(before, after, label, errors, predicate) {
  const afterIds = new Set((after || []).map((item) => item?.id).filter(Boolean));
  for (const item of (before || []).filter(predicate)) if (item?.id && !afterIds.has(item.id)) errors.push(`${label} ${item.id} cannot be silently removed.`);
}

function projectedRecord(root, ref, kind, replacements) {
  if (replacements.has(ref)) return replacements.get(ref).record;
  return observedRecord(root, ref, kind);
}

function observedRecord(root, ref, kind) {
  return readCanonical(root, ref, kind).record;
}

function renderReplacements(root, plan) {
  return plan.replacements.map((replacement) => {
    const file = safeCanonicalPath(root, replacement.ref, replacement.kind);
    if (replacement.kind === 'project' || replacement.kind === 'iteration') {
      return { file, content: `${JSON.stringify(replacement.record, null, 2)}\n`, replacement };
    }
    const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    let content;
    try {
      content = renderCaseRecord(existing, replacement.record, file);
    } catch {
      content = renderRecoveredCase(replacement.record);
    }
    return { file, content: content.endsWith('\n') ? content : `${content}\n`, replacement };
  });
}

function regenerateProjections(root, plan, changedFiles) {
  const replacements = new Map(plan.replacements.map((item) => [item.ref, item]));
  const project = projectedRecord(root, PROJECT_REF, 'project', replacements);
  const statePath = path.join(root, 'arckit/project/STATE.md');
  fs.writeFileSync(statePath, `${renderProjectState(project)}\n`);
  changedFiles.push(relativeRef(root, statePath));

  const iterationRef = project.advancement?.active_iteration_ref || '';
  if (iterationRef) {
    const iteration = projectedRecord(root, iterationRef, 'iteration', replacements);
    const iterationProjection = path.join(root, iterationRef.replace(/\.record\.json$/, '.md'));
    const renderable = { ...iteration, _file: path.join(root, iterationRef) };
    fs.writeFileSync(iterationProjection, `${renderIteration(renderable, project)}\n`);
    changedFiles.push(relativeRef(root, iterationProjection));
  }
  try {
    writeDevelopmentCaseIndex(root);
  } catch (error) {
    throw new Error(`development-case.mjs index failed\n${error.message}`);
  }
  changedFiles.push('arckit/cases/INDEX.md');
  writeIterationIndex(root);
  changedFiles.push('arckit/project/ITERATIONS.md');
}

function projectionPaths(root, plan) {
  const replacements = new Map(plan.replacements.map((item) => [item.ref, item]));
  const project = projectedRecord(root, PROJECT_REF, 'project', replacements);
  const values = [path.join(root, 'arckit/project/STATE.md')];
  if (project?.advancement?.active_iteration_ref) values.push(path.join(root, project.advancement.active_iteration_ref.replace(/\.record\.json$/, '.md')));
  return values;
}

function renderRecoveredCase(record) {
  return [
    `# ${record.title}`,
    '',
    `Case: ${record.id}`,
    `Status: ${record.status}`,
    `Artifact Type: ${record.artifact_type}`,
    `Selected Gap: ${record.current_round?.selected_gap?.id || 'none'}`,
    `Updated: ${record.updated_at}`,
    '',
    '## User Intent',
    '',
    record.user_intent || 'TBD',
    '',
    '## Structured Record',
    '',
    '```json',
    JSON.stringify(record, null, 2),
    '```',
    '',
    '## Round Notes',
    '',
    '- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.',
    '',
  ].join('\n');
}

function safeCanonicalPath(root, ref, kind) {
  if (typeof ref !== 'string' || !ref || path.isAbsolute(ref) || ref.includes('..')) throw new Error(`Unsafe canonical ref: ${ref || '<missing>'}`);
  const normalized = ref.replaceAll('\\', '/');
  const allowed = kind === 'project'
    ? normalized === PROJECT_REF
    : kind === 'case'
      ? normalized.startsWith('arckit/cases/active/') && normalized.endsWith('.md')
      : normalized.startsWith('arckit/project/iterations/') && normalized.endsWith('.record.json');
  if (!allowed) throw new Error(`Canonical ${kind} ref is outside its allowed ledger boundary: ${ref}`);
  const file = path.resolve(root, normalized);
  if (!file.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`Canonical ref escapes project root: ${ref}`);
  assertFilesystemBoundary(root, file);
  return file;
}

function safeDirectoryPath(root, relative) {
  const directory = path.resolve(root, relative);
  if (!directory.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`Ledger directory escapes project root: ${relative}`);
  assertFilesystemBoundary(root, directory);
  return directory;
}

function assertFilesystemBoundary(root, target) {
  const rootReal = fs.realpathSync(root);
  let existing = path.resolve(target);
  while (!fs.existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing) throw new Error(`Cannot resolve ledger path boundary: ${target}`);
    existing = parent;
  }
  const existingReal = fs.realpathSync(existing);
  if (existingReal !== rootReal && !existingReal.startsWith(`${rootReal}${path.sep}`)) {
    throw new Error(`Ledger path resolves outside project root: ${target}`);
  }
}

function compareVersion(actual, expected) {
  const actualMatch = actual.match(/^(.*)\/v(\d+)$/);
  const expectedMatch = expected.match(/^(.*)\/v(\d+)$/);
  if (!actualMatch || !expectedMatch || actualMatch[1] !== expectedMatch[1]) return 'unknown_protocol';
  if (Number(actualMatch[2]) < Number(expectedMatch[2])) return 'older_protocol';
  return 'newer_protocol';
}

function isRepairableCaseProjectionIssue(kind, issue) {
  return kind === 'case' && issue.includes('case_resolution is not the deterministic projection');
}

function formatCompatibilityIssues(compatibility) {
  return compatibility.observed.filter((item) => item.condition !== 'compatible')
    .map((item) => `${item.ref}: ${item.condition}${item.issues.length ? ` (${item.issues.join('; ')})` : ''}`).join('\n');
}

function reconciliationResult({ before, after, plan, applied, dryRun, changedFiles }) {
  return {
    schema_version: 'arckit-protocol-reconciliation-result/v1',
    applied,
    dry_run: dryRun,
    compatibility_before: before.status,
    compatibility_after: after?.status || 'not_checked',
    observed_snapshot_token: before.snapshot_token,
    reason: plan.reason,
    evidence: plan.evidence,
    preservation_claims: plan.preservation_claims,
    changed_files: unique(changedFiles),
  };
}

function snapshotFile(file) {
  return { file, existed: fs.existsSync(file), content: fs.existsSync(file) ? fs.readFileSync(file) : null };
}

function restoreSnapshots(snapshots) {
  for (const snapshot of snapshots) {
    if (snapshot.existed) {
      fs.mkdirSync(path.dirname(snapshot.file), { recursive: true });
      fs.writeFileSync(snapshot.file, snapshot.content);
    } else if (fs.existsSync(snapshot.file)) fs.unlinkSync(snapshot.file);
  }
}

function readPlan(input) {
  return JSON.parse(input === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(path.resolve(input), 'utf8'));
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith('--')) args._.push(argv[index]);
    else {
      const key = argv[index].slice(2);
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function relativeRef(root, file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function strings(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function nonEmptyStrings(value) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.trim());
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function schemaVersion(name) {
  const schema = JSON.parse(fs.readFileSync(path.join(schemaDir, name), 'utf8'));
  const value = schema?.properties?.schema_version?.const;
  if (typeof value !== 'string' || !value) throw new Error(`Schema ${name} does not declare properties.schema_version.const`);
  return value;
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const command = args._[0];
    if (command === 'probe') {
      console.log(JSON.stringify(probeProtocolCompatibility(process.cwd()), null, 2));
    } else if (command === 'validate' || command === 'reconcile') {
      if (!args._[1]) throw new Error(`${command} requires <reconciliation.json|->`);
      const plan = readPlan(args._[1]);
      if (command === 'validate') {
        const compatibility = probeProtocolCompatibility(process.cwd());
        const errors = validateProtocolReconciliation(plan, compatibility, process.cwd());
        if (errors.length) throw new Error(errors.join('\n'));
        console.log(`${args._[1]}: ok`);
      } else {
        const result = await applyProtocolReconciliation({ projectRoot: process.cwd(), plan, dryRun: args['dry-run'] === 'true' });
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      console.log('Usage: protocol-compatibility.mjs probe | validate <reconciliation.json|-> | reconcile <reconciliation.json|-> [--dry-run true]');
      if (command) process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
