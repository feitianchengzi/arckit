import { access, cp, readdir, mkdir, mkdtemp, realpath, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSceneSkillProvisioningManager } from "../src/scene-skill-provisioning.mjs";
import { createSceneSkillManager, validateSceneSkillBinding } from "../src/scene-skill-manager.mjs";

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const options = parseArgs(process.argv.slice(2));
const resourcesRoot = path.resolve(options.resourcesRoot || path.join(runtimeRoot, "dist-package", "resources"));
const fixture = await realpath(await mkdtemp(path.join(os.tmpdir(), "arckit-distribution-smoke-")));
try {
  const homeDir = path.join(fixture, "home");
  const projectRoot = path.join(fixture, "project");
  const unrelated = path.join(homeDir, ".codex", "skills", "distribution-smoke-unrelated");
  await mkdir(unrelated, { recursive: true });
  await writeFile(path.join(unrelated, "SKILL.md"), "---\nname: distribution-smoke-unrelated\ndescription: Must remain untouched.\n---\n");
  const payloadRoot = path.join(resourcesRoot, 'provisioning', 'arckit-skills');
  const payload = JSON.parse(await readFile(path.join(payloadRoot, 'payload.manifest.json'), 'utf8'));
  const oldSkill = path.join(projectRoot, '.codex', 'skills', path.basename(payload.skillPaths[0]));
  await cp(path.join(payloadRoot, payload.skillPaths[0]), oldSkill, { recursive: true });
  const manager = createSceneSkillProvisioningManager({
    resourcesRoot,
    dataRoot: path.join(fixture, "data"),
    homeDir,
    stateRoot: path.join(fixture, "arcforge"),
    codexProbe: async () => ({ available: true, summary: "CI packaging probe" })
  });
  const planned = await manager.check({ projectRoot });
  await access(oldSkill);
  if (planned.migration?.removed?.length || planned.migration?.pending?.length !== 1) throw new Error(`Environment check must only plan cleanup: ${planned.error?.message || JSON.stringify(planned.migration)}`);
  if (planned.plan.operation !== 'install' || !planned.installation.items.some(i => i.mode === 'user-on-demand' && i.status === 'install')) throw new Error('Missing on-demand installation plan.');
  try { await access(planned.catalog.path); throw new Error('Check installed the catalog without confirmation.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const installed = await manager.apply({ planDigest: planned.plan.digest, confirmed: true });
  await access(oldSkill);
  if (installed.plan.operation !== 'cleanup' || installed.migration.removed.length) throw new Error('Installation implicitly cleaned old skills.');
  const applied = await manager.apply({ planDigest: installed.plan.digest, confirmed: true });
  if (applied.status !== 'ready' || applied.can_apply) throw new Error(`Catalog setup failed: ${applied.error?.message || applied.status}`);
  await access(path.join(homeDir, ".codex", "skills", "distribution-smoke-unrelated", "SKILL.md"));
  await access(path.join(applied.catalog.path, '_arckit_shared/case-gap-contract.md'));
  await access(path.join(applied.catalog.path, '_arckit_shared/content-spec.md'));
  const scenes = createSceneSkillManager({ dataRoot: path.join(fixture, 'data'), homeDir, catalog: manager.catalog, getProjectRoots: async () => [projectRoot] });
  const chat = await scenes.resolveScene('chat', projectRoot), automation = await scenes.resolveScene('automation', projectRoot);
  if (chat.skills.filter(x => x.source === 'builtin').some(x=>x.name!=='arcforge-on-demand')) throw new Error('Chat leaked bundled business skills.');
  if(!chat.skills.some(x=>x.name==='arcforge-on-demand')) throw new Error('On-demand entry missing.');
  await validateSceneSkillBinding(automation);
  if (applied.migration.removed.length !== 1) throw new Error('Provider did not migrate the exact old project copy.');
  if ((await readdir(path.join(projectRoot, '.codex/skills'))).length) throw new Error('Setup installed project skills.');
  const repeated = await manager.check({ projectRoot });
  if (repeated.status !== 'ready' || repeated.migration.removed.length !== 0) throw new Error('Provider migration did not converge.');
  if (!(await readdir(path.join(fixture, 'arcforge', 'projects'))).length) throw new Error('Standard ArcForge installation relationship missing.');
  if(applied.catalog.path!==path.join(fixture,'arcforge','catalog')) throw new Error('Installation still uses a private consumer catalog.');
  const catalogIndex=JSON.parse(await readFile(path.join(fixture,'arcforge','catalog','index.json'),'utf8'));
  if(catalogIndex.version!==2 || catalogIndex.entries.length!==applied.catalog.count) throw new Error('Standard ArcForge catalog missing.');
  const lock = JSON.parse(await readFile(path.join(resourcesRoot, "provisioning", "distribution-lock.json"), "utf8"));
  console.log(JSON.stringify({
    schema_version: "arckit-distribution-smoke/v1",
    release_tag: lock.arckit.releaseTag,
    target: lock.runtime.target,
    provider: lock.arcforgeProvider.providerVersion,
    arckit_skill_total: payload.skillPaths.length,
    builtin_skill_total: applied.catalog.count,
    builtin_on_demand_skills: installed.installation.items.filter(i => i.mode === 'user-on-demand').length,
    chat_builtin_skills: chat.skills.filter(x=>x.source==='builtin').length,
    automation_skills: automation.skills.length,
    project_skills_installed: false,
    legacy_skills_removed: applied.migration.removed.length,
    arcforge_catalog_managed: true,
    unrelated_skill_preserved: true,
    shared_skill_assets_installed: true,
    status: "passed"
  }, null, 2));
} finally {
  await rm(fixture, { recursive: true, force: true });
}

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--resources-root") result.resourcesRoot = args[++index];
  }
  return result;
}
