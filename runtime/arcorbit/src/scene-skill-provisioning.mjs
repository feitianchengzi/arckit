import { createBundledSkillCatalog } from './bundled-skill-catalog.mjs';

// Environment checks prepare the catalog and a read-only cleanup plan. Only apply deletes.
export function createSceneSkillProvisioningManager(options) {
  const catalog = options.catalog || createBundledSkillCatalog(options);
  const listeners = new Set();
  let state = { schema_version: 'arckit-setup-readiness/v1', status: 'checking', checks: [], plan: null };
  let operation = Promise.resolve();
  let projectRoots = [];
  const exclusive = task => { const next = operation.then(task, task); operation = next.catch(() => {}); return next; };
  function publish(next) { state = { ...next, schema_version: 'arckit-setup-readiness/v1', updated_at: new Date().toISOString() }; for (const listener of listeners) listener(structuredClone(state)); return structuredClone(state); }
  async function checkUnlocked(input = {}, applied = null) {
    if (input.projectRoot) projectRoots = Array.isArray(input.projectRoot) ? input.projectRoot : [input.projectRoot];
    if (!input.quiet) publish({ ...state, status: 'checking', can_continue: false, can_apply: false });
    try {
      const bundled = await catalog.prepare();
      const installation = bundled.installation;
      const planned = await catalog.planMigration(projectRoots);
      const migration = { status: planned.removed.length ? 'awaiting-confirmation' : 'checked', pending: planned.removed,
        removed: applied?.removed || [], preserved: planned.preserved, errors: [...(applied?.errors || []), ...planned.errors] };
      const probe = input.codexProbeResult || await options.codexProbe();
      const error = installation.blocking.length ? { code: 'SKILL_INSTALLATION_CONFLICT', stage: 'installation', message: installation.blocking.map(x => `${x.path || 'catalog'}: ${x.message}`).join('\n') } : migration.errors.length ? { code: 'SKILL_MIGRATION_FAILED', stage: 'migration', message: migration.errors.map(x => `${x.path}: ${x.message}`).join('\n') }
        : probe.available ? null : { code: 'CODEX_UNAVAILABLE', stage: 'codex', message: 'Codex CLI 尚未就绪。' };
      return publish({ status: error ? 'blocked' : installation.ready ? 'ready' : 'needs-install', can_apply: !error && (installation.needsApply || migration.pending.length > 0), can_continue: !error && installation.ready,
        first_install: installation.needsApply || migration.pending.length > 0 || migration.removed.length > 0 || Boolean(applied), last_action: applied?.action || null, write_state: applied ? 'committed' : 'not_started', error, codex: probe,
        catalog: { path: bundled.root, version: bundled.version, count: bundled.count }, installation: { items: installation.items, assets: installation.assets, ready: installation.ready, needsApply: installation.needsApply, blocking: installation.blocking }, migration,
        checks: [{ id: 'source', status: installation.ready ? 'passed' : 'pending', summary: installation.ready ? `${bundled.count} 个内置技能已由 ArcForge 管理并就绪` : `${bundled.count} 个内置技能已检查，安装和更新等待确认（包含 on-demand）` },
          { id: 'migration', status: migration.errors.length ? 'failed' : migration.pending.length ? 'pending' : 'passed', summary: `待确认清理 ${migration.pending.length} 项，已清理 ${migration.removed.length} 项，保留 ${migration.preserved.length} 项` }],
        plan: { operation: installation.needsApply ? 'install' : 'cleanup', digest: installation.needsApply ? installation.planDigest : planned.planDigest, project_roots: projectRoots, items: [], cleanup: [], loader_targets: [], diagnostics: [], counts: { arckit_total: bundled.count, user_on_demand: installation.items.filter(x => x.mode === 'user-on-demand').length, user_ambient: installation.items.filter(x => x.mode === 'user-ambient').length, project_ambient: installation.items.filter(x => x.mode === 'project-ambient').length, project_ambient_deferred: 0 } } });
    } catch (error) { return publish({ ...state, status: 'blocked', can_continue: false, can_apply: false, error: { code: 'SKILL_CATALOG_FAILED', stage: 'catalog', message: error.message } }); }
  }
  const check = (input = {}) => exclusive(() => checkUnlocked(input));
  const apply = (input = {}) => exclusive(async () => {
    if (input.confirmed !== true || !input.planDigest || input.planDigest !== state.plan?.digest || !state.can_apply) throw new Error('请先查看当前变更清单，勾选确认后再执行。');
    const probe = state.codex;
    const action = state.plan.operation;
    publish({ ...state, status: 'applying', can_apply: false, can_continue: false });
    try {
      const result = action === 'install' ? (await catalog.install(input), { action: 'install', removed: [], errors: [] }) : await catalog.migrateProjects(projectRoots, input);
      return await checkUnlocked({ quiet: true, codexProbeResult: probe }, result);
    } catch (error) {
      await checkUnlocked({ quiet: true, codexProbeResult: probe });
      // Revoke the old acknowledgement even when the provider failure did not change the plan.
      return publish({ ...state, first_install: true, can_apply: false, error: { code: action === 'install' ? 'SKILL_INSTALLATION_CONFIRMATION_INVALID' : 'SKILL_MIGRATION_CONFIRMATION_INVALID', stage: action === 'install' ? 'installation' : 'migration', message: `变更未完成，请重新检查并确认清单：${error.message}` } });
    }
  });
  return { catalog, check, apply, getSnapshot: () => structuredClone(state), onEvent: listener => { listeners.add(listener); return () => listeners.delete(listener); }, waitForIdle: () => operation,
    async assertReady(projectRoot) { if (!projectRoot || state.status !== 'ready' || !projectRoots.includes(projectRoot)) throw new Error('技能环境尚未就绪，请重新检查本地环境。'); return structuredClone(state); },
    recoverSourceUpgrade: () => check({ quiet: true }),
    planManagedRemoval: async () => { throw new Error('请重新检查环境并查看旧技能清理清单。'); },
    removeManaged: async () => { throw new Error('请使用清理清单中的明确确认操作。'); } };
}
