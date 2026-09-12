import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { atomicJson, digest, readJson, readSkill, treeManifest, within } from './skill-files.mjs';

const SCENES = ['chat', 'automation'];
import { CORE_SKILLS, RETIRED_CORE_SKILLS, migrateCoreSkillPreferences } from './core-skill-identity.mjs';
export { CORE_SKILLS } from './core-skill-identity.mjs';
const core = skill => CORE_SKILLS.includes(skill.name);

export function createSceneSkillManager({ dataRoot, catalog }) {
  const file = path.join(dataRoot, 'engineering', 'scene-skills.json');
  let operation = Promise.resolve();
  const listeners = new Set();
  const exclusive = task => { const next = operation.then(task, task); operation = next.catch(() => {}); return next; };
  const initial = () => ({ schema_version: 'arcorbit-scene-skills/v1', revision: 0, localPaths: [], scenes: { chat: {}, automation: {} } });
  async function settings() {
    const state = await readJson(file, initial());
    if (state.schema_version !== 'arcorbit-scene-skills/v1' || !Number.isInteger(state.revision) || !Array.isArray(state.localPaths) || SCENES.some(x => !state.scenes?.[x] || typeof state.scenes[x] !== 'object' || Object.values(state.scenes[x]).some(mode => ![true,false,'direct','on-demand','disabled'].includes(mode)))) throw new Error('Engineering configuration is damaged.');
    return migrateCoreSkillPreferences(state);
  }
  async function inventory() {
    const bundled = await catalog.getCatalog();
    const skills = bundled.skills
      .filter(x => x.source === 'builtin' && x.id === `builtin:${x.name}`)
      .map(x => ({ ...x, protected: core(x), available: true }));
    return { skills, errors: [], version: bundled.version, catalogContext: bundled.catalogContext };
  }
  function mode(state, scene, skill) {
    if (RETIRED_CORE_SKILLS.includes(skill.name) || (core(skill) && skill.source !== 'builtin')) return 'disabled';
    if (scene === 'automation' && core(skill)) return 'direct';
    const configured = state.scenes[scene][skill.id];
    if (configured !== undefined) return configured === true ? 'direct' : configured === false ? 'disabled' : configured;
    if (!skill.available) return 'disabled';
    if (skill.name === 'arcforge-on-demand' && skill.source === 'builtin') return 'direct';
    return scene === 'automation' && skill.recommendation === 'user-ambient' ? 'direct' : 'on-demand';
  }
  const enabled = (state, scene, skill) => mode(state, scene, skill) === 'direct';
  async function snapshot() {
    const state = await settings(), list = await inventory();
    return { revision: state.revision, catalogVersion: list.version, errors: list.errors, scenes: SCENES.map(scene => ({
      id: scene,
      managedCount: list.skills.length,
      enabledCount: list.skills.filter(x => enabled(state, scene, x)).length,
      onDemandCount: list.skills.filter(x => mode(state, scene, x) === 'on-demand').length,
      disabledCount: list.skills.filter(x => mode(state, scene, x) === 'disabled').length
    })), skills: list.skills.map(skill => ({ ...skill, modes: Object.fromEntries(SCENES.map(scene => [scene, mode(state, scene, skill)])), enabled: Object.fromEntries(SCENES.map(scene => [scene, enabled(state, scene, skill)])) })) };
  }
  async function update({ scene, expectedRevision, changes = [], reset = false }) {
    return exclusive(async () => {
      if (!SCENES.includes(scene)) throw new Error('Unknown skill consumer.');
      const state = await settings();
      if (state.revision !== expectedRevision) throw new Error('Engineering configuration changed. Refresh before saving.');
      const { skills } = await inventory();
      if (reset) for (const id of Object.keys(state.scenes[scene])) if (id.startsWith('builtin:')) delete state.scenes[scene][id];
      for (const change of changes) {
        const skill = skills.find(x => x.id === change.id);
        const selection = change.mode ?? (change.enabled === true ? 'direct' : change.enabled === false ? 'disabled' : null);
        if (!skill || skill.source !== 'builtin' || !change.id.startsWith('builtin:') || !['direct','on-demand','disabled'].includes(selection)) throw new Error('Engineering only manages ArcOrbit built-in skills.');
        if (selection === 'on-demand' && (!skill.qualifiedName || skill.name === 'arcforge-on-demand')) throw new Error('按需使用需要 ArcForge catalog 技能；按需入口自身必须直接可发现。');
        if (selection !== 'disabled' && RETIRED_CORE_SKILLS.includes(skill.name)) throw new Error('Retired core skill; use the bundled State Driven Loop.');
        if (core(skill) && (skill.source !== 'builtin' || (scene === 'automation' && selection !== 'direct'))) throw new Error('Automation core skills cannot be disabled or replaced.');
        if (selection !== 'disabled' && !skill.available) throw new Error(`Skill unavailable: ${skill.name}`);
        state.scenes[scene][skill.id] = selection;
      }
      selectSkills(state, scene, skills);
      state.revision++;
      await atomicJson(file, state);
      const result = await snapshot();
      for (const listener of listeners) listener(result);
      return result;
    });
  }
  async function resolveScene(scene, projectRoot) {
    if (!SCENES.includes(scene)) throw new Error('Unknown skill consumer.');
    const state = await settings(), list = await inventory();
    const relevant = list.skills;
    const selected = selectSkills(state, scene, relevant);
    for (const skill of selected) if (!skill.available) throw new Error(`Enabled skill unavailable: ${skill.path}`);
    assertUnique(selected);
    for (const name of scene === 'automation' ? CORE_SKILLS : []) if (!selected.some(x => x.name === name && x.source === 'builtin')) throw new Error(`Required core skill missing: ${name}`);
    const binding = { schema_version: 'arcorbit-scene-skill-binding/v1', scene, revision: state.revision, catalogVersion: list.version,
      catalogContext: list.catalogContext,
      onDemand: relevant.filter(x => mode(state, scene, x) === 'on-demand').map(({qualifiedName, catalogDigest, packageDigest}) => ({qualifiedName, catalogDigest, ...(packageDigest ? {packageDigest} : {})})),
      skills: selected.map(({ id, name, path: folder, skillPath, contentDigest, source, qualifiedName, catalogDigest, packageDigest }) => ({ id, name, path: folder, skillPath, contentDigest, source, ...(qualifiedName ? {qualifiedName,catalogDigest,...(packageDigest ? {packageDigest} : {})} : {}) })),
      managedNames: [...new Set([...list.skills.filter(x => x.source === 'builtin').map(x => x.name), ...RETIRED_CORE_SKILLS])],
      disabledPaths: relevant.filter(x => !selected.includes(x)).map(x => x.path) };
    return { ...binding, fingerprint: sceneBindingFingerprint(binding) };
  }
  function selectSkills(state, scene, skills) {
    const selected = new Map();
    for (const skill of skills.filter(x => enabled(state, scene, x))) {
      const previous = selected.get(skill.name);
      if (previous) {
        throw new Error(`Multiple enabled versions of ${skill.name}. Disable one before selecting another.`);
      }
      selected.set(skill.name, skill);
    }
    return [...selected.values()];
  }
  return { snapshot, update, resolveScene, onEvent: listener => { listeners.add(listener); return () => listeners.delete(listener); }, waitForIdle: () => operation };
}

function assertUnique(skills) {
  const names = new Set();
  for (const skill of skills) { if (names.has(skill.name)) throw new Error(`Multiple enabled versions of ${skill.name}. Disable one before selecting another.`); names.add(skill.name); }
}

export async function validateSceneSkillBinding(binding) {
  if (binding?.schema_version !== 'arcorbit-scene-skill-binding/v1' || !SCENES.includes(binding.scene) || !Array.isArray(binding.skills) || !Array.isArray(binding.managedNames) || !Array.isArray(binding.disabledPaths)) throw new Error('Invalid scene skill binding.');
  if (sceneBindingFingerprint(binding) !== binding.fingerprint) throw new Error('Scene skill binding fingerprint mismatch.');
  assertUnique(binding.skills);
  for (const item of binding.skills) {
    if (RETIRED_CORE_SKILLS.includes(item.name)) throw new Error('Retired core skill binding; resolve the scene again.');
    if (item.qualifiedName && binding.catalogContext) {
      const provider = await import(pathToFileURL(binding.catalogContext.providerEntrypoint).href);
      const result = await provider.queryCatalog({...binding.catalogContext, action: 'resolve', query: item.qualifiedName, allowedSkills: [item.qualifiedName]});
      if (result.status !== 'resolved' || result.resolved.installedPath !== item.path || result.resolved.contentDigest !== item.catalogDigest || (item.packageDigest && result.resolved.packageDigest !== item.packageDigest)) throw new Error(`Selected skill changed since configuration was resolved: ${item.name}`);
      if (CORE_SKILLS.includes(item.name) && (item.source !== 'builtin' || item.id !== `builtin:${item.name}`)) throw new Error('Core skill source is not trusted.');
      continue;
    }
    const skill = await readSkill(item.path);
    if (skill.name !== item.name || skill.contentDigest !== item.contentDigest || skill.skillPath !== item.skillPath || !within(item.path, item.skillPath)) throw new Error(`Selected skill changed since configuration was resolved: ${item.name}`);
    if (CORE_SKILLS.includes(item.name) && (item.source !== 'builtin' || item.id !== `builtin:${item.name}`)) throw new Error('Core skill source is not trusted.');
  }
  if (binding.scene === 'automation') for (const name of CORE_SKILLS) if (!binding.skills.some(x => x.name === name)) throw new Error(`Missing Automation core skill: ${name}`);
  return binding;
}

export function sceneBindingFingerprint({ fingerprint, revision, ...content }) {
  // The global edit revision must not restart Chat when only Automation changed.
  return digest(JSON.stringify(content));
}
