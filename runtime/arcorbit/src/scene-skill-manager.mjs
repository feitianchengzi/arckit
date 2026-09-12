import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { atomicJson, digest, directories, readJson, readSkill, treeManifest, within } from './skill-files.mjs';

const SCENES = ['chat', 'automation'];
import { CORE_SKILLS, RETIRED_CORE_SKILLS, migrateCoreSkillPreferences } from './core-skill-identity.mjs';
export { CORE_SKILLS } from './core-skill-identity.mjs';
const core = skill => CORE_SKILLS.includes(skill.name);

export function createSceneSkillManager({ dataRoot, catalog, homeDir = os.homedir(), getProjectRoots = async () => [] }) {
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
  async function inventory(state) {
    const bundled = await catalog.getCatalog();
    const skills = bundled.skills.map(x => ({ ...x, protected: core(x), available: true }));
    const foundPaths = new Set(skills.map(x => x.path));
    const errors = [];
    const builtinNames = new Set(skills.map(x => x.name));
    const roots = [
      { root: path.join(homeDir, '.codex', 'skills'), source: 'user' },
      { root: path.join(homeDir, '.agents', 'skills'), source: 'user' },
      ...((await getProjectRoots()).flatMap(project => ['.codex', '.agents'].map(dir => ({ root: path.join(project, dir, 'skills'), source: 'project', projectRoot: path.resolve(project) })))),
    ];
    const paths = [];
    for (const item of roots) for (const folder of await directories(item.root)) paths.push({ ...item, folder });
    try {
      for (const entry of await catalog.inspectEntries()) {
        if (foundPaths.has(entry.installedPath)) continue;
        foundPaths.add(entry.installedPath);
        skills.push({ id: `catalog:${entry.qualifiedName}`, name: entry.skillName, description: entry.summary || '', path: entry.installedPath,
          skillPath: path.join(entry.installedPath, 'SKILL.md'), source: 'on-demand', recommendation: entry.availabilityMode || 'user-on-demand',
          qualifiedName: entry.qualifiedName, catalogDigest: entry.contentDigest, packageDigest: entry.packageDigest,
          contentDigest: entry.packageDigest || entry.contentDigest, available: entry.available, error: entry.error, protected: core({name:entry.skillName}) });
      }
    } catch (error) { errors.push({path: bundled.root, message: error.message}); }
    paths.push(...state.localPaths.map(folder => ({ folder, source: 'local' })));
    for (const item of paths) {
      let id = `local:${digest(path.resolve(item.folder))}`;
      try {
        const skill = await readSkill(item.folder);
        id = `local:${digest(skill.path)}`;
        if (foundPaths.has(skill.path)) continue;
        foundPaths.add(skill.path);
        skills.push({ ...skill, id, source: item.source, projectRoot: item.projectRoot || '', available: true, protected: core(skill), shadowed: builtinNames.has(skill.name) });
      } catch (error) {
        if (error.code === 'ENOENT' && !state.localPaths.includes(item.folder)) continue;
        errors.push({ path: item.folder, message: error.message });
        skills.push({ id, name: path.basename(item.folder), description: '', path: item.folder, skillPath: path.join(item.folder, 'SKILL.md'), source: item.source, projectRoot: item.projectRoot || '', available: false, error: error.message });
      }
    }
    for (const [id, skill] of Object.entries(state.knownSkills || {})) if (!skills.some(x => x.id === id)) skills.push({ ...skill, id, available: false, error: '技能来源已移除，请重新选择或关闭。' });
    return { skills, errors, version: bundled.version, catalogContext: bundled.catalogContext };
  }
  function mode(state, scene, skill) {
    if (RETIRED_CORE_SKILLS.includes(skill.name) || (core(skill) && skill.source !== 'builtin')) return 'disabled';
    if (scene === 'automation' && core(skill)) return 'direct';
    const configured = state.scenes[scene][skill.id];
    if (configured !== undefined) return configured === true ? 'direct' : configured === false ? 'disabled' : configured;
    if (!skill.available) return 'disabled';
    if (skill.name === 'arcforge-on-demand' && skill.source === 'builtin') return 'direct';
    if (skill.source === 'builtin') return scene === 'automation' && skill.recommendation === 'user-ambient' ? 'direct' : 'on-demand';
    if (skill.qualifiedName) return 'on-demand';
    return !skill.shadowed && ['user', 'project'].includes(skill.source) ? 'direct' : 'disabled';
  }
  const enabled = (state, scene, skill) => mode(state, scene, skill) === 'direct';
  async function snapshot() {
    const state = await settings(), list = await inventory(state);
    const inherited = (scene, skill) => enabled(state, scene, skill) && ['user', 'project'].includes(skill.source) && !Object.hasOwn(state.scenes[scene], skill.id);
    return { revision: state.revision, catalogVersion: list.version, errors: list.errors, scenes: SCENES.map(scene => ({ id: scene, enabledCount: list.skills.filter(x => enabled(state, scene, x) && !inherited(scene, x)).length, onDemandCount: list.skills.filter(x => mode(state, scene, x) === 'on-demand').length, inheritedCount: list.skills.filter(x => inherited(scene, x)).length })), skills: list.skills.map(skill => ({ ...skill, modes: Object.fromEntries(SCENES.map(scene => [scene, mode(state, scene, skill)])), enabled: Object.fromEntries(SCENES.map(scene => [scene, enabled(state, scene, skill)])), inherited: Object.fromEntries(SCENES.map(scene => [scene, inherited(scene, skill)])) })) };
  }
  async function update({ scene, expectedRevision, changes = [], reset = false }) {
    return exclusive(async () => {
      if (!SCENES.includes(scene)) throw new Error('Unknown skill consumer.');
      const state = await settings();
      if (state.revision !== expectedRevision) throw new Error('Engineering configuration changed. Refresh before saving.');
      const { skills } = await inventory(state);
      if (reset) state.scenes[scene] = {};
      for (const change of changes) {
        const skill = skills.find(x => x.id === change.id);
        const selection = change.mode ?? (change.enabled === true ? 'direct' : change.enabled === false ? 'disabled' : null);
        if (!skill || !['direct','on-demand','disabled'].includes(selection)) throw new Error('Invalid skill selection.');
        if (selection === 'on-demand' && (!skill.qualifiedName || skill.name === 'arcforge-on-demand')) throw new Error('按需使用需要 ArcForge catalog 技能；按需入口自身必须直接可发现。');
        if (selection !== 'disabled' && RETIRED_CORE_SKILLS.includes(skill.name)) throw new Error('Retired core skill; use the bundled State Driven Loop.');
        if (core(skill) && (skill.source !== 'builtin' || (scene === 'automation' && selection !== 'direct'))) throw new Error('Automation core skills cannot be disabled or replaced.');
        if (selection !== 'disabled' && !skill.available) throw new Error(`Skill unavailable: ${skill.name}`);
        state.scenes[scene][skill.id] = selection;
        if (skill.source !== 'builtin') { state.knownSkills ||= {}; state.knownSkills[skill.id] = { name: skill.name, path: skill.path, source: skill.source, projectRoot: skill.projectRoot || '' }; }
      }
      for (const project of ['', ...new Set(skills.map(x => x.projectRoot).filter(Boolean))]) selectSkills(state, scene, skills.filter(x => !x.projectRoot || x.projectRoot === project));
      state.revision++;
      await atomicJson(file, state);
      const result = await snapshot();
      for (const listener of listeners) listener(result);
      return result;
    });
  }
  async function importLocal(folder) {
    return exclusive(async () => {
      const skill = await readSkill(folder);
      if (core(skill) || RETIRED_CORE_SKILLS.includes(skill.name)) throw new Error('Core skill replacements are not allowed.');
      const state = await settings();
      if (!state.localPaths.includes(skill.path)) { state.localPaths.push(skill.path); state.revision++; await atomicJson(file, state); }
      const result = await snapshot();
      for (const listener of listeners) listener(result);
      return result;
    });
  }
  async function resolveScene(scene, projectRoot) {
    if (!SCENES.includes(scene)) throw new Error('Unknown skill consumer.');
    const state = await settings(), list = await inventory(state);
    const relevant = list.skills.filter(x => !x.projectRoot || path.resolve(x.projectRoot) === path.resolve(projectRoot));
    const selected = selectSkills(state, scene, relevant);
    for (const skill of selected) if (!skill.available) throw new Error(`Enabled skill unavailable: ${skill.path}`);
    assertUnique(selected);
    for (const name of scene === 'automation' ? CORE_SKILLS : []) if (!selected.some(x => x.name === name && x.source === 'builtin')) throw new Error(`Required core skill missing: ${name}`);
    const binding = { schema_version: 'arcorbit-scene-skill-binding/v1', scene, revision: state.revision, catalogVersion: list.version,
      catalogContext: list.catalogContext,
      onDemand: relevant.filter(x => mode(state, scene, x) === 'on-demand').map(({qualifiedName, catalogDigest, packageDigest}) => ({qualifiedName, catalogDigest, ...(packageDigest ? {packageDigest} : {})})),
      skills: selected.map(({ id, name, path: folder, skillPath, contentDigest, source, qualifiedName, catalogDigest, packageDigest }) => ({ id, name, path: folder, skillPath, contentDigest, source, ...(qualifiedName ? {qualifiedName,catalogDigest,...(packageDigest ? {packageDigest} : {})} : {}), inheritNative: ['user', 'project'].includes(source) && !Object.hasOwn(state.scenes[scene], id) })),
      managedNames: [...new Set([...list.skills.filter(x => x.source === 'builtin').map(x => x.name), ...RETIRED_CORE_SKILLS])],
      disabledPaths: relevant.filter(x => !selected.includes(x)).map(x => x.path) };
    return { ...binding, fingerprint: sceneBindingFingerprint(binding) };
  }
  function selectSkills(state, scene, skills) {
    const selected = new Map();
    for (const skill of skills.filter(x => enabled(state, scene, x))) {
      const previous = selected.get(skill.name);
      if (previous) {
        const inherited = x => ['user', 'project'].includes(x.source) && !Object.hasOwn(state.scenes[scene], x.id);
        if (!inherited(skill) && !inherited(previous)) throw new Error(`Multiple enabled versions of ${skill.name}. Disable one before selecting another.`);
        if (inherited(skill) && (!inherited(previous) || previous.source === 'project')) continue;
      }
      selected.set(skill.name, skill);
    }
    return [...selected.values()];
  }
  return { snapshot, update, importLocal, resolveScene, onEvent: listener => { listeners.add(listener); return () => listeners.delete(listener); }, waitForIdle: () => operation };
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
