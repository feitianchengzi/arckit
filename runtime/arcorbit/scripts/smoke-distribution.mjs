import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSkillProvisioningManager } from "../src/skill-provisioning-manager.mjs";

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const options = parseArgs(process.argv.slice(2));
const resourcesRoot = path.resolve(options.resourcesRoot || path.join(runtimeRoot, "dist-package", "resources"));
const fixture = await mkdtemp(path.join(os.tmpdir(), "arckit-distribution-smoke-"));
try {
  const homeDir = path.join(fixture, "home");
  const projectRoot = path.join(fixture, "project");
  const unrelated = path.join(homeDir, ".codex", "skills", "distribution-smoke-unrelated");
  await mkdir(unrelated, { recursive: true });
  await writeFile(path.join(unrelated, "SKILL.md"), "---\nname: distribution-smoke-unrelated\ndescription: Must remain untouched.\n---\n");
  const manager = createSkillProvisioningManager({
    resourcesRoot,
    dataRoot: path.join(fixture, "data"),
    homeDir,
    stateRoot: path.join(fixture, "arcforge"),
    codexProbe: async () => ({ available: true, summary: "CI packaging probe" })
  });
  const planned = await manager.check({ projectRoot });
  if (planned.status !== "needs-install" || !planned.can_apply || !planned.plan?.digest) {
    throw new Error(`Expected a safe fresh install plan, received ${planned.status}: ${planned.error?.message || "no error"}`);
  }
  const applied = await manager.apply({ planDigest: planned.plan.digest });
  if (applied.status !== "ready" || applied.drift?.counts?.missing || applied.drift?.counts?.changed) {
    throw new Error(`Distribution provisioning did not converge to ready: ${applied.error?.message || applied.status}`);
  }
  await access(path.join(homeDir, ".codex", "skills", "distribution-smoke-unrelated", "SKILL.md"));
  await access(path.join(projectRoot, ".codex", "skills", "_arckit_shared", "case-gap-contract.md"));
  await access(path.join(projectRoot, ".codex", "skills", "_arckit_shared", "content-spec.md"));
  const lock = JSON.parse(await readFile(path.join(resourcesRoot, "provisioning", "distribution-lock.json"), "utf8"));
  console.log(JSON.stringify({
    schema_version: "arckit-distribution-smoke/v1",
    release_tag: lock.arckit.releaseTag,
    target: lock.runtime.target,
    provider: lock.arcforgeProvider.providerVersion,
    arckit_skill_total: planned.plan.availability.arckit_total,
    user_ambient_skills: planned.plan.availability.user_ambient,
    user_on_demand_skills: planned.plan.availability.user_on_demand,
    shared_assets: planned.plan.availability.shared_assets,
    arcforge_loader_targets: planned.plan.availability.arcforge_loader_targets,
    deferred_project_skills: planned.plan.deferred_project_skills,
    post_drift: applied.drift.counts,
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
