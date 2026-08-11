#!/usr/bin/env node

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditCaseRecord, readCaseRecord } from './development-case.mjs';
import { probeProtocolCompatibility } from './protocol-compatibility.mjs';

const PROJECT_REF = 'arckit/project/state.record.json';
const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

export function readLedgerSnapshot(projectRoot, { afterCommitToken = '' } = {}) {
  const root = path.resolve(projectRoot);
  const compatibility = probeProtocolCompatibility(root);
  const base = {
    schema_version: 'arckit-ledger-snapshot/v1',
    protocol_revision: 'software-definition-ledger/v8',
    state_availability: compatibility.status === 'compatible' ? 'available' : 'unavailable',
    observed_at: new Date().toISOString(),
    snapshot_token: compatibility.snapshot_token,
    observed_after_commit: afterCommitToken ? compatibility.snapshot_token === afterCommitToken : false,
    expected_after_commit_token: afterCommitToken,
    compatibility,
    source_digests: Object.fromEntries((compatibility.observed || []).map((item) => [item.ref, item.source_digest])),
  };
  if (afterCommitToken && !base.observed_after_commit) {
    throw new Error(`Fresh ledger snapshot does not observe commit token ${afterCommitToken}; current token is ${compatibility.snapshot_token}.`);
  }
  if (compatibility.status !== 'compatible') {
    return {
      ...base,
      project_revision: null,
      case_revisions: [],
      selection_tokens: {},
      canonical: { project_state: null, iteration_record: null, active_cases: [] },
      candidate_catalog: { persisted_candidates: [], persisted_obligations: [] },
      paths: defaultPaths([]),
    };
  }

  const projectState = JSON.parse(fs.readFileSync(path.join(root, PROJECT_REF), 'utf8'));
  const activeCaseRefs = projectState.advancement?.active_case_refs || [];
  const activeCases = activeCaseRefs.map((ref) => ({ ref, record: readCaseRecord(path.join(root, ref)).record }));
  const iterationRef = projectState.advancement?.active_iteration_ref || '';
  const iterationRecord = iterationRef && fs.existsSync(path.join(root, iterationRef))
    ? JSON.parse(fs.readFileSync(path.join(root, iterationRef), 'utf8'))
    : null;
  return {
    ...base,
    project_revision: projectState.project.revision,
    case_revisions: activeCases.map(({ ref, record }) => ({
      ref,
      case_id: record.id,
      updated_at: record.updated_at,
      content_revision: record.content_revision,
      latest_invariant_assessment: structuredClone(record.rounds?.at(-1)?.invariant_assessment || null),
    })),
    selection_tokens: Object.fromEntries(activeCases.map(({ ref, record }) => [record.id, selectionToken(compatibility, ref)])),
    canonical: { project_state: projectState, iteration_record: iterationRecord, active_cases: activeCases },
    candidate_catalog: candidateCatalog(projectState, activeCases),
    paths: defaultPaths(activeCaseRefs, iterationRef),
  };
}

function selectionToken(compatibility, caseRef) {
  const digests = new Map((compatibility.observed || []).map((item) => [item.ref, item.source_digest]));
  return crypto.createHash('sha256').update(JSON.stringify({
    project: digests.get(PROJECT_REF) || '',
    case: digests.get(caseRef) || '',
    protocol: 'software-definition-ledger/v8',
  })).digest('hex');
}

function candidateCatalog(projectState, activeCases) {
  const persistedCandidates = (projectState.advancement?.project_gaps || []).map((gap) => ({
    ref: `project-gap:${gap.id}`,
    source: 'persisted',
    kind: 'project_gap',
    case_id: '',
    gap: structuredClone(gap),
  }));
  const persistedObligations = [...persistedCandidates.map((item) => ({ ...item, eligibility: 'case_required' }))];
  for (const { ref: caseRef, record } of activeCases) {
    const audit = auditCaseRecord(record, record.updated_at);
    const candidateIds = new Set((audit.candidate_gaps || []).map((gap) => gap.id));
    for (const gap of record.gaps || []) {
      if (gap.status !== 'open') continue;
      const item = {
        ref: `case-gap:${record.id}:${gap.id}`,
        source: 'persisted',
        kind: 'case_gap',
        case_id: record.id,
        case_ref: caseRef,
        gap: candidateIds.has(gap.id)
          ? structuredClone(audit.candidate_gaps.find((candidate) => candidate.id === gap.id))
          : candidateGap(gap),
      };
      persistedObligations.push({ ...item, eligibility: candidateIds.has(gap.id) ? 'ready' : 'blocked' });
      if (candidateIds.has(gap.id)) persistedCandidates.push(item);
    }
    for (const gap of audit.candidate_gaps || []) {
      const candidateRef = `case-gap:${record.id}:${gap.id}`;
      if (persistedCandidates.some((item) => item.ref === candidateRef)) continue;
      const item = { ref: candidateRef, source: 'persisted', kind: 'derived_case_gap', case_id: record.id, case_ref: caseRef, gap: structuredClone(gap) };
      persistedCandidates.push(item);
      persistedObligations.push({ ...item, eligibility: 'ready' });
    }
  }
  return { persisted_candidates: persistedCandidates, persisted_obligations: persistedObligations };
}

function candidateGap(gap) {
  const { status, resolution, ...candidate } = structuredClone(gap);
  return candidate;
}

function defaultPaths(activeCases, activeIteration = '') {
  return {
    project_state: PROJECT_REF,
    state_brief: 'arckit/project/STATE.md',
    active_iteration: activeIteration,
    active_cases: activeCases,
    cases_index: 'arckit/cases/INDEX.md',
    spec_index: 'arckit/spec/INDEX.md',
    interaction_index: 'arckit/interaction/INDEX.md',
    visual_index: 'arckit/visual/INDEX.md',
    tech_index: 'arckit/tech/INDEX.md',
  };
}

function parseArgs(argv) {
  const args = { command: argv[2] || '', afterCommitToken: '' };
  for (let index = 3; index < argv.length; index += 1) {
    if (argv[index] === '--after-commit') args.afterCommitToken = argv[++index] || '';
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return args;
}

if (path.resolve(process.argv[1] || '') === path.join(scriptsDir, 'loop-snapshot.mjs')) {
  try {
    const args = parseArgs(process.argv);
    if (args.command !== 'read') throw new Error('Usage: loop-snapshot.mjs read [--after-commit <snapshot-token>]');
    console.log(JSON.stringify(readLedgerSnapshot(process.cwd(), args), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
