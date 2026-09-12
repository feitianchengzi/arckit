import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
import { CORE_SKILLS } from './core-skill-identity.mjs';
import { digest, directories, readJson, readSkill, treeManifest, within } from './skill-files.mjs';

const REQUIRED_CAPABILITIES = ['stable-catalog/v1', 'project-skill-migration/v1'];

// ArcOrbit validates its distribution and adapts ArcForge-owned installations to scene bindings.
export function createBundledSkillCatalog(options) {
  const { resourcesRoot, dataRoot, sourceRoot = '', homeDir = os.homedir() } = options;
  const stateRoot = options.stateRoot || path.join(homeDir, '.arcforge');
  let active = null, provider = null, migrationInput = null, installationInput = null, entryInput = null, planInputs = [];
  let operation = Promise.resolve();
  const exclusive = task => { const next = operation.then(task, task); operation = next.catch(() => {}); return next; };
  async function inspect() {
    provider = options.provider || await loadProvider(resourcesRoot, options.providerLoader);
    for (const name of ['inspectProvisioningPlan', 'applyProvisioningPlan', 'planProjectSkillMigration', 'applyProjectSkillMigration']) {
      if (typeof provider[name] !== 'function') throw new Error(`ArcForge provider 缺少 ${name}，请重新构建分发资源。`);
    }
    const source = sourceRoot ? await developmentSource(sourceRoot) : await packagedSource(resourcesRoot);
    const incoming = await Promise.all(source.skillPaths.map(relative => readSkill(path.join(source.root, relative))));
    for (const name of CORE_SKILLS) if (!incoming.some(x => x.name === name)) throw new Error(`Required bundled skill missing: ${name}`);
    installationInput = { sourceRoot: source.root, consumerRoot: dataRoot, stateRoot, homeDir, profile: source.profile || 'default', skills: incoming.map(x => x.name),
      declaredSkillPaths: source.skillPaths, agentTargetIds: ['codex'], destinationPolicy: 'catalog-only', declaredSharedAssetPaths: source.copyPaths.filter(p => !source.skillPaths.includes(p)),
      sourceProvenance: { sourceIdentity: 'arckit', payloadVersion: source.digest } };
    const reviewedInstallation = await reviewSourceConflicts(provider, installationInput);
    installationInput = reviewedInstallation.input;
    const installation = reviewedInstallation.plan;
    const info = await provider.inspectProvider();
    entryInput = {sourceRoot: info.sourceRoot, consumerRoot: dataRoot, stateRoot, homeDir, agentTargetIds: ['codex'], destinationPolicy: 'catalog-only',
      skills: ['arcforge-on-demand'], declaredSkillPaths: ['skills/arcforge-on-demand'], declaredSharedAssetPaths: [], availabilityOverrides: [{skill: 'arcforge-on-demand', mode: 'user-ambient'}], sourceProvenance: {sourceIdentity: 'arcforge'}};
    const reviewedEntry = await reviewSourceConflicts(provider, entryInput);
    entryInput = reviewedEntry.input;
    const entryInstallation = reviewedEntry.plan;
    planInputs = [{input: installationInput, plan: installation}, {input: entryInput, plan: entryInstallation}];
    const combined = { ...installation, planDigest: digest(JSON.stringify(planInputs.map(x => x.plan.planDigest))),
      items: [...installation.items, ...entryInstallation.items], assets: [...installation.assets, ...entryInstallation.assets],
      blocking: [...installation.blocking, ...entryInstallation.blocking], needsApply: installation.needsApply || entryInstallation.needsApply, ready: installation.ready && entryInstallation.ready };
    const { catalogRoot } = installation.plan;
    const catalogVersion = source.digest;
    if (!catalogRoot) throw new Error('ArcForge provider did not return the user catalog target.');
    const root = catalogRoot;
    const entries = await provider.inspectCatalogEntries({stateRoot});
    const builtinNames = new Set([...incoming.map(x => x.name), 'arcforge-on-demand']);
    const skills = combined.ready ? entries.filter(e => builtinNames.has(e.skillName)).map(e => ({
      id: `builtin:${e.skillName}`, name: e.skillName, description: e.summary || '', path: e.installedPath,
      skillPath: path.join(e.installedPath, 'SKILL.md'), contentDigest: e.packageDigest || e.contentDigest,
      source: 'builtin', recommendation: e.availabilityMode || 'user-on-demand', qualifiedName: e.qualifiedName,
      catalogDigest: e.contentDigest, packageDigest: e.packageDigest, available: e.available, error: e.error
    })) : [];
    active = { root, version: catalogVersion, count: incoming.length + 1, skills, ready: combined.ready, installation: combined,
      catalogContext: { stateRoot, providerEntrypoint: info.entrypoint, ...(options.catalogCommand ? {catalogCommand: options.catalogCommand} : {}) } };
    migrationInput = { stateRoot, consumerRoot: dataRoot, sourceId: 'arckit', catalogRoot, version: catalogVersion,
      referenceRoot: source.root, trustedSourceRoots: [...new Set([source.root, path.join(dataRoot, 'skill-sources', 'arckit', 'current')])], skillPaths: source.skillPaths };
    return structuredClone(active);
  }
  const prepare = () => exclusive(inspect);
  const install = ({ planDigest, confirmed } = {}) => exclusive(async () => {
    if (!installationInput || confirmed !== true || !planDigest) throw new Error('请先查看安装更新清单并确认。');
    const fresh = await inspect();
    if (planDigest !== fresh.installation.planDigest) throw new Error('安装计划已变化，请重新确认。');
    const reviewed = [...planInputs];
    for (const {input, plan} of reviewed) if (plan.needsApply) await provider.applyProvisioningPlan({ ...input, expectedPlanDigest: plan.planDigest, confirm: true, cleanupPaths: [] });
    return inspect();
  });
  const planMigration = projectRoots => exclusive(async () => {
    if (!migrationInput) throw new Error('Check the source before planning cleanup.');
    return provider.planProjectSkillMigration({ ...migrationInput, projectRoots });
  });
  const migrateProjects = (projectRoots, { planDigest, confirmed } = {}) => exclusive(async () => {
    if (!active?.ready || !migrationInput || confirmed !== true || !planDigest) throw new Error('请先确认安装并验证技能，再查看清理清单并明确确认删除。');
    return provider.applyProjectSkillMigration({ ...migrationInput, projectRoots, expectedPlanDigest: planDigest, confirm: true });
  });
  return { prepare, install, planMigration, migrateProjects, inspectEntries: async () => { if (!provider) await prepare(); return provider.inspectCatalogEntries({stateRoot}); }, getCatalog: async () => {
    const snapshot = active?.ready ? structuredClone(active) : await prepare();
    if (!snapshot.ready) throw new Error('内置技能尚未安装或存在待确认更新，请在环境检查中查看计划。');
    return snapshot;
  }, waitForIdle: () => operation };
}

async function loadProvider(resourcesRoot, loader = entry => import(pathToFileURL(entry).href)) {
  if (!resourcesRoot) throw new Error('ArcForge provider resources are required.');
  const provisioning = path.join(resourcesRoot, 'provisioning');
  const lock = await readJson(path.join(provisioning, 'distribution-lock.json'));
  const expected = new Map();
  for (const line of (await readFile(path.join(provisioning, 'checksums.txt'), 'utf8')).trim().split(/\r?\n/)) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match) throw new Error('Invalid distribution checksum list.');
    const file = path.resolve(resourcesRoot, match[2]);
    if (!within(resourcesRoot, file) || (await lstat(file)).isSymbolicLink() || digest(await readFile(file)) !== match[1]) throw new Error(`Distribution checksum mismatch: ${match[2]}`);
    expected.set(file, match[1]);
  }
  const root = path.join(provisioning, 'arcforge-provider');
  for (const file of await treeManifest(root)) if (expected.get(path.join(root, file.path)) !== file.sha256) throw new Error(`Unverified ArcForge provider file: ${file.path}`);
  const provider = await loader(path.join(root, 'dist', 'provider', 'index.js'));
  const info = await provider.inspectProvider();
  const locked = lock.arcforgeProvider;
  if (info.apiVersion !== 'arcforge-embedded-provider/v1' || info.apiVersion !== locked?.apiVersion || info.providerVersion !== locked.providerVersion || info.buildCommit !== locked.buildCommit) throw new Error('ArcForge provider lock mismatch.');
  for (const capability of REQUIRED_CAPABILITIES) if (!info.capabilities?.includes(capability) || !locked.capabilities?.includes(capability)) throw new Error(`ArcForge provider 缺少 ${capability}，请重新构建分发资源。`);
  return provider;
}

async function developmentSource(root) {
  const skillPaths = [], copyPaths = [];
  for (const domain of await directories(root)) {
    if (path.basename(domain).startsWith('.') || ['node_modules', 'runtime', 'arckit'].includes(path.basename(domain))) continue;
    for (const folder of await directories(path.join(domain, 'skills'))) {
      const relative = path.relative(root, folder);
      copyPaths.push(relative);
      try { await readFile(path.join(folder, 'SKILL.md')); skillPaths.push(relative); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
  const manifest = await readJson(path.join(root, 'arcforge.skill-project.json'));
  const fingerprints = [];
  for (const relative of copyPaths) fingerprints.push([relative, await treeManifest(path.join(root, relative))]);
  return { root, skillPaths, copyPaths, availability: manifest.availability, digest: digest(JSON.stringify([manifest, fingerprints])) };
}

async function packagedSource(resourcesRoot) {
  const provisioning = path.join(resourcesRoot, 'provisioning');
  const lines = (await readFile(path.join(provisioning, 'checksums.txt'), 'utf8')).trim().split(/\r?\n/);
  for (const line of lines) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match) throw new Error('Invalid distribution checksum list.');
    const file = path.resolve(resourcesRoot, match[2]);
    if (!within(resourcesRoot, file) || (await lstat(file)).isSymbolicLink() || digest(await readFile(file)) !== match[1]) throw new Error(`Distribution checksum mismatch: ${match[2]}`);
  }
  const root = path.join(provisioning, 'arckit-skills');
  const payload = await readJson(path.join(root, 'payload.manifest.json'));
  const lock = await readJson(path.join(provisioning, 'distribution-lock.json'));
  if (payload.schemaVersion !== 'arckit-skill-payload/v1' || digest(JSON.stringify(payload.files)) !== payload.payloadDigest || lock.skillPayload?.payloadDigest !== payload.payloadDigest) throw new Error('Invalid skill payload lock.');
  // Reject links and undeclared/changed payload files before copying.
  const observed = await treeManifest(root);
  const expected = new Map(payload.files.map(x => [x.path, x.sha256]));
  for (const item of observed) if (item.path !== 'payload.manifest.json' && expected.get(item.path) !== item.sha256) throw new Error(`Invalid payload file: ${item.path}`);
  for (const item of payload.files) if (!observed.some(x => x.path === item.path && x.sha256 === item.sha256)) throw new Error(`Missing payload file: ${item.path}`);
  const manifest = await readJson(path.join(root, 'arcforge.skill-project.json'));
  if (digest(await readFile(path.join(root, 'arcforge.skill-project.json'))) !== payload.sourceManifestDigest || lock.skillPayload.sourceManifestDigest !== payload.sourceManifestDigest) throw new Error('Invalid source manifest lock.');
  return { root, profile: lock.skillPayload.profile, skillPaths: payload.skillPaths, copyPaths: [...payload.skillPaths, ...(payload.sharedAssetPaths || [])], availability: manifest.availability, digest: payload.payloadDigest };
}


// Propose an explicit source selection for review; inspection never applies it.
// ArcForge still checks installed content, ownership, links, and the fresh plan digest.
async function reviewSourceConflicts(provider, input) {
  const initial = await provider.inspectProvisioningPlan(input);
  const conflicts = initial.plan.items.filter(item => initial.blocking.some(d => d.code === 'CATALOG_VERSION_CONFLICT' && d.path === item.skill));
  const selections = conflicts.map(item => ({skill: item.skill, sourceKey: item.catalogDecision?.incomingSourceKey,
    contentDigest: item.contentDigest, expectedCurrentDigest: item.catalogDecision?.currentDigest}));
  if (!selections.length || selections.some(s => !s.sourceKey || !s.contentDigest || !s.expectedCurrentDigest)) return {input, plan: initial};
  const entries = await provider.inspectCatalogEntries({stateRoot: input.stateRoot});
  const selectedInput = {...input, catalogSourceSelections: selections};
  const plan = await provider.inspectProvisioningPlan(selectedInput);
  plan.items = plan.items.map(item => {
    const previous = conflicts.find(c => c.skill === item.skill);
    if (!previous || item.status === 'conflict') return item;
    const entry = entries.find(e => e.skillName === item.skill);
    const claim = entry?.sourceClaims.find(c => c.sourceKey === previous.catalogDecision.currentSourceKey && c.contentDigest === previous.catalogDecision.currentDigest);
    return {...item, status: 'replace-source', sourceSelection: {
      currentSourceKey: previous.catalogDecision.currentSourceKey,
      currentSourcePath: claim ? path.resolve(claim.sourceRoot, claim.skillPath) : undefined,
      incomingSourceKey: previous.catalogDecision.incomingSourceKey,
      reason: previous.catalogDecision.reason
    }};
  });
  return {input: selectedInput, plan};
}
