import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runLedgerScript } from './ledger-scripts.mjs';
import { detectConversationLocale } from './conversation-locale.mjs';
import { loadRuntimeCapabilityForEntrypoint } from './capability-registry.mjs';

const runtimeRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const casePolicyPath = join(runtimeRoot, 'config', 'case-policy.json');

export async function ensureArckitProject({ projectRoot, projectName = '', intent = '', nodeBin = process.execPath } = {}) {
  const root = resolve(projectRoot || '.');
  if (!existsSync(root)) throw new Error(`Project path does not exist: ${root}`);
  const locale = detectConversationLocale(intent);
  const casePolicy = JSON.parse(await readFile(casePolicyPath, 'utf8'));
  if (casePolicy.schema_version !== 'arckit-case-policy/v1' || !Number.isInteger(casePolicy.completion_review?.max_autonomous_cycles) || casePolicy.completion_review.max_autonomous_cycles < 1) throw new Error(`Invalid Runtime Case policy: ${casePolicyPath}`);
  const statePath = join(root, 'arckit/project/state.record.json');
  const changedFiles = [];
  const ledgerCapability = await loadRuntimeCapabilityForEntrypoint({ projectRoot: root, entrypoint: 'project_state' });

  if (!existsSync(statePath)) {
    await runLedgerScript(root, [
      'project-state.mjs',
      'init',
      '--name', projectName || basename(root) || root,
      '--intent', intent || t(locale, 'Initialize a recoverable Arckit software project.', '初始化一个可恢复的 Arckit 软件项目。'),
    ], { nodeBin, capability: ledgerCapability });
    changedFiles.push('arckit/project/state.record.json', 'arckit/project/STATE.md');
  }

  const state = JSON.parse(await readFile(statePath, 'utf8'));
  if (state.schema_version !== 'project-state-record/v3') throw new Error('Runtime requires a project-state-record/v3 project. Reinitialize or replace the unsupported state record before running Runtime.');

  let caseRef = state.case_control?.selected_case_ref || '';
  if (!caseRef && (state.active_case_refs || []).length === 0) {
    const output = await runLedgerScript(root, [
      'development-case.mjs',
      'new',
      '--title', t(locale, 'Initial software development case', '初始软件研发事项'),
      '--artifact-type', 'mixed',
      '--intent', intent || t(locale, 'Establish the first bounded Case from the operator request.', '从用户请求建立第一个有边界的 Case。'),
      '--max-review-cycles', String(casePolicy.completion_review.max_autonomous_cycles),
      '--review-policy-source', 'runtime/arckit-runtime/config/case-policy.json',
    ], { nodeBin, capability: ledgerCapability });
    const absoluteCasePath = output.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
    const normalizedCasePath = absoluteCasePath.replaceAll('\\', '/');
    const arckitMarker = normalizedCasePath.lastIndexOf('/arckit/cases/');
    if (arckitMarker < 0) throw new Error(`Ledger returned an unexpected Case path: ${absoluteCasePath}`);
    caseRef = normalizedCasePath.slice(arckitMarker + 1);
    await runLedgerScript(root, [
      'project-state.mjs',
      'select-case',
      '--case-ref', caseRef,
      '--intent', intent || t(locale, 'Determine the first evidence-backed Case transition.', '确定第一个有证据支持的 Case 状态转移。'),
      '--reason', t(locale, 'The operator request created this bounded Case.', '用户请求创建了这个有边界的 Case。'),
    ], { nodeBin, capability: ledgerCapability });
    changedFiles.push(caseRef, 'arckit/project/state.record.json', 'arckit/project/STATE.md');
  } else if (caseRef && !existsSync(join(root, caseRef))) {
    throw new Error(`Project State selected Case does not exist: ${caseRef}`);
  }

  await runLedgerScript(root, ['project-state.mjs', 'audit', 'arckit/project/state.record.json'], { nodeBin, capability: ledgerCapability });
  await runLedgerScript(root, ['development-case.mjs', 'index'], { nodeBin, capability: ledgerCapability });
  changedFiles.push('arckit/cases/INDEX.md');
  return {
    initialized: changedFiles.length > 0,
    repaired: false,
    project_root: root,
    state_path: 'arckit/project/state.record.json',
    case_ref: caseRef,
    changed_files: [...new Set(changedFiles)],
  };
}

function t(language, english, zhHans) {
  return language === 'zh-Hans' ? zhHans : english;
}
