import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { runLedgerScript } from './ledger-scripts.mjs';
import { detectConversationLocale } from './conversation-locale.mjs';
import { loadRuntimeCapabilityForEntrypoint } from './capability-registry.mjs';

export async function ensureArckitProject({ projectRoot, projectName = '', intent = '' } = {}) {
  const root = resolve(projectRoot || '.');
  if (!existsSync(root)) throw new Error(`Project path does not exist: ${root}`);
  const locale = detectConversationLocale(intent);
  const statePath = join(root, 'arckit/project/state.record.json');
  const changedFiles = [];
  let repaired = false;
  const [projectCapability, caseCapability, compatibilityCapability] = await Promise.all([
    loadRuntimeCapabilityForEntrypoint({ projectRoot: root, entrypoint: 'project_state' }),
    loadRuntimeCapabilityForEntrypoint({ projectRoot: root, entrypoint: 'development_case' }),
    loadRuntimeCapabilityForEntrypoint({ projectRoot: root, entrypoint: 'protocol_compatibility' }),
  ]);

  if (!existsSync(statePath)) {
    await runLedgerScript(root, [
      'project-state.mjs',
      'init',
      '--name', projectName || basename(root) || root,
      '--intent', intent || t(locale, 'Initialize a recoverable Arckit software project.', '初始化一个可恢复的 Arckit 软件项目。'),
    ], { capability: projectCapability });
    changedFiles.push('arckit/project/state.record.json', 'arckit/project/STATE.md');
  }

  const compatibilityResult = await runLedgerScript(root, ['protocol-compatibility.mjs', 'probe'], {
    capability: compatibilityCapability,
  });
  const compatibility = JSON.parse(compatibilityResult.stdout);
  if (compatibility.status !== 'compatible') {
    return {
      initialized: changedFiles.length > 0,
      repaired: false,
      recovery_required: true,
      compatibility,
      project_root: root,
      state_path: 'arckit/project/state.record.json',
      case_ref: '',
      changed_files: [...new Set(changedFiles)],
    };
  }

  const state = JSON.parse(await readFile(statePath, 'utf8'));

  await runLedgerScript(root, ['project-state.mjs', 'audit', 'arckit/project/state.record.json'], { capability: projectCapability });
  for (const activeCaseRef of state.advancement.active_case_refs || []) {
    const casePath = join(root, activeCaseRef);
    const record = parseCaseRecord(await readFile(casePath, 'utf8'), casePath);
    if (record.schema_version !== 'development-case-record/v5') throw new Error(`Runtime requires development-case-record/v5: ${activeCaseRef}. Upgrade this project explicitly before starting Runtime.`);
    const auditResult = await runLedgerScript(root, [
      'development-case.mjs',
      'audit',
      activeCaseRef,
    ], { capability: caseCapability });
    const derivedResolution = JSON.parse(auditResult.stdout);
    if (!sameCaseResolution(record.case_resolution, derivedResolution)) {
      await runLedgerScript(root, [
        'development-case.mjs',
        'audit',
        activeCaseRef,
        '--write',
        'true',
      ], { capability: caseCapability });
      changedFiles.push(activeCaseRef);
      repaired = true;
    }
  }
  await runLedgerScript(root, ['development-case.mjs', 'index'], { capability: caseCapability });
  changedFiles.push('arckit/cases/INDEX.md');
  return {
    initialized: changedFiles.length > 0,
    repaired,
    recovery_required: false,
    compatibility,
    project_root: root,
    state_path: 'arckit/project/state.record.json',
    case_ref: '',
    changed_files: [...new Set(changedFiles)],
  };
}

function parseCaseRecord(text, file) {
  const match = text.match(/## Structured Record[\s\S]*?```json\s*\n([\s\S]*?)\n```/);
  if (!match) throw new Error(`${file}: missing Structured Record json block`);
  return JSON.parse(match[1]);
}

function sameCaseResolution(stored, derived) {
  return JSON.stringify({ ...stored, updated_at: '' }) === JSON.stringify({ ...derived, updated_at: '' });
}

function t(language, english, zhHans) {
  return language === 'zh-Hans' ? zhHans : english;
}
