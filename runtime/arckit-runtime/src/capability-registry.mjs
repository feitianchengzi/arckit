import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../../..");
const defaultPolicyPath = resolve(here, "../config/capability-policy.json");
const IGNORED_DIRS = new Set([".git", "node_modules", "runtime-results", ".DS_Store"]);

export async function loadRuntimeCapabilities(options = {}) {
  const policy = options.capabilityPolicy || await loadCapabilityPolicy(options);
  if (Array.isArray(options)) {
    return filterCapabilities(normalizeCapabilities(options), allPolicyCapabilityIds(policy));
  }
  if (Array.isArray(options.capabilities)) {
    return filterCapabilities(normalizeCapabilities(options.capabilities), allPolicyCapabilityIds(policy));
  }

  const roots = unique([
    repositoryRoot,
    options.projectRoot ? resolve(options.projectRoot) : ""
  ].filter(Boolean));
  const manifests = [];
  for (const root of roots) {
    manifests.push(...await findCapabilityManifests(root));
  }
  const loaded = [];
  for (const manifestPath of manifests) {
    const capability = await readCapabilityManifest(manifestPath);
    if (capability) {
      loaded.push(capability);
    }
  }
  return filterCapabilities(normalizeCapabilities(loaded), allPolicyCapabilityIds(policy));
}

export function capabilityIds(capabilities = []) {
  return new Set(normalizeCapabilities(capabilities).map((capability) => capability.id));
}

export function capabilitiesForBinding(capabilities = [], policy, bindingTarget) {
  const policyIds = capabilityIdsForBinding(policy, bindingTarget);
  return normalizeCapabilities(capabilities).filter((capability) => (
    policyIds.has(capability.id) && capability.binding_targets.includes(bindingTarget)
  ));
}

export function capabilityIdsForBinding(policy, bindingTarget) {
  if (!["controller", "runtime"].includes(bindingTarget)) {
    throw new Error(`Unsupported capability binding target: ${bindingTarget}`);
  }
  return new Set(arrayOfStrings(policy?.[`${bindingTarget}_capability_ids`]));
}

export function agentSkillInvocationForPhase(capabilities = [], phase) {
  const matches = normalizeCapabilities(capabilities).filter((capability) => (
    capability.invocation.type === "agent_skill"
      && capability.invocation.phases.includes(phase)
      && capability.invocation.skill_trigger.startsWith("$")
  ));
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one agent skill capability for phase ${phase}; found ${matches.length}.`);
  }
  return {
    capability: matches[0],
    skill_trigger: matches[0].invocation.skill_trigger,
    phase
  };
}

export function runtimeCapabilityForEntrypoint(capabilities = [], entrypoint) {
  const matches = normalizeCapabilities(capabilities).filter((capability) => (
    capability.binding_targets.includes("runtime")
      && capability.source === "repository"
      && typeof capability.runtime_entrypoints?.[entrypoint] === "string"
      && capability.runtime_entrypoints[entrypoint]
  ));
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one trusted repository runtime capability for entrypoint ${entrypoint}; found ${matches.length}.`);
  }
  return matches[0];
}

export function resolveCapabilityEntrypoint(capability, entrypoint) {
  const capabilityRootValue = String(capability?.capability_root || "");
  const declaredPath = capability?.runtime_entrypoints?.[entrypoint];
  if (!capabilityRootValue || typeof declaredPath !== "string" || !declaredPath) {
    throw new Error(`Capability ${capability?.id || "unknown"} does not declare runtime entrypoint ${entrypoint}.`);
  }
  const capabilityRoot = resolve(capabilityRootValue);
  const resolvedPath = resolve(capabilityRoot, declaredPath);
  if (resolvedPath !== capabilityRoot && !resolvedPath.startsWith(`${capabilityRoot}${sep}`)) {
    throw new Error(`Capability entrypoint escapes its capability root: ${capability?.id || "unknown"}:${entrypoint}`);
  }
  return resolvedPath;
}

export async function loadRuntimeCapabilityForEntrypoint({ projectRoot, entrypoint }) {
  const policy = await loadCapabilityPolicy();
  const capabilities = await loadRuntimeCapabilities({ projectRoot, capabilityPolicy: policy });
  const runtimeCapabilities = capabilitiesForBinding(capabilities, policy, "runtime");
  return runtimeCapabilityForEntrypoint(runtimeCapabilities, entrypoint);
}

export async function assertInstalledAgentSkillCompatibility(capabilities = [], options = {}) {
  const codexHome = resolve(options.codexHome || process.env.CODEX_HOME || join(homedir(), ".codex"));
  const checked = [];
  for (const capability of normalizeCapabilities(capabilities).filter((item) => item.invocation.type === "agent_skill")) {
    if (capability.source !== "repository") {
      throw new Error(`Agent skill compatibility requires a repository capability source: ${capability.id}.`);
    }
    const installedRoot = join(codexHome, "skills", capability.id);
    const installedManifestPath = join(installedRoot, "arckit.capability.json");
    const installedSkillPath = join(installedRoot, "SKILL.md");
    let installedManifestText;
    let installedSkillText;
    try {
      [installedManifestText, installedSkillText] = await Promise.all([
        readFile(installedManifestPath, "utf8"),
        readFile(installedSkillPath, "utf8")
      ]);
    } catch {
      throw new Error(`Installed Controller skill is missing: ${capability.id}. Sync it from ${capability.capability_root} to ${installedRoot}.`);
    }
    const sourceManifestText = await readFile(join(capability.capability_root, "arckit.capability.json"), "utf8");
    let installedManifest;
    try {
      installedManifest = JSON.parse(installedManifestText);
    } catch {
      throw new Error(`Installed Controller capability manifest is invalid JSON: ${installedManifestPath}.`);
    }
    if (!capability.protocol_revision || installedManifest.protocol_revision !== capability.protocol_revision) {
      throw new Error(`Installed Controller skill protocol is incompatible: ${capability.id} expected ${capability.protocol_revision || "<missing>"}, found ${installedManifest.protocol_revision || "<missing>"}. Sync the repository skill before starting Runtime.`);
    }
    const [sourceFiles, installedFiles] = await Promise.all([
      readComparableSkillFiles(capability.capability_root),
      readComparableSkillFiles(installedRoot)
    ]);
    if (installedManifestText !== sourceManifestText || installedSkillText.length === 0 || !sameSkillFiles(sourceFiles, installedFiles)) {
      throw new Error(`Installed Controller skill has drifted from the Runtime repository source: ${capability.id}. Sync ${capability.capability_root} to ${installedRoot}.`);
    }
    checked.push({ id: capability.id, protocol_revision: capability.protocol_revision, installed_root: installedRoot });
  }
  return checked;
}

async function readComparableSkillFiles(root) {
  const files = new Map();
  async function walk(dir, prefix = "") {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".DS_Store") continue;
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolutePath = join(dir, entry.name);
      if (entry.isDirectory()) await walk(absolutePath, relativePath);
      else if (entry.isFile()) files.set(relativePath, await readFile(absolutePath));
    }
  }
  await walk(root);
  return files;
}

function sameSkillFiles(left, right) {
  if (left.size !== right.size) return false;
  for (const [path, content] of left) {
    const candidate = right.get(path);
    if (!candidate || !content.equals(candidate)) return false;
  }
  return true;
}

export async function loadCapabilityPolicy(options = {}) {
  const policyPath = options.policyPath ? resolve(options.policyPath) : defaultPolicyPath;
  const parsed = JSON.parse(await readFile(policyPath, "utf8"));
  return normalizeCapabilityPolicy(parsed, policyPath);
}

async function findCapabilityManifests(root) {
  const results = [];
  async function walk(dir, depth = 0) {
    if (depth > 8) {
      return;
    }
    let entries = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
      } else if (entry.isFile() && entry.name === "arckit.capability.json") {
        results.push(fullPath);
      }
    }
  }
  await walk(root);
  return results;
}

async function readCapabilityManifest(manifestPath) {
  try {
    const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
    if (parsed?.schema_version !== "arckit-capability/v1" || !parsed.id) {
      return null;
    }
    return {
      ...parsed,
      capability_root: dirname(manifestPath),
      manifest_path: relative(repositoryRoot, manifestPath) || manifestPath,
      source: manifestPath.startsWith(repositoryRoot) ? "repository" : "project"
    };
  } catch {
    return null;
  }
}

function normalizeCapabilities(capabilities = []) {
  const byId = new Map();
  for (const capability of capabilities) {
    if (!capability || typeof capability !== "object" || !capability.id) {
      continue;
    }
    const normalized = {
      schema_version: "arckit-capability/v1",
      id: String(capability.id),
      protocol_revision: String(capability.protocol_revision || ""),
      kind: String(capability.kind || ""),
      runtime_role: arrayOfStrings(capability.runtime_role),
      binding_targets: arrayOfStrings(capability.binding_targets),
      invocation: normalizeInvocation(capability.invocation),
      runtime_entrypoints: normalizeRuntimeEntrypoints(capability.runtime_entrypoints),
      summary: String(capability.summary || ""),
      input_facts: arrayOfStrings(capability.input_facts),
      outputs: arrayOfStrings(capability.outputs),
      allowed_write_targets: arrayOfStrings(capability.allowed_write_targets),
      forbidden_decisions: arrayOfStrings(capability.forbidden_decisions),
      runtime_notes: arrayOfStrings(capability.runtime_notes),
      capability_root: String(capability.capability_root || ""),
      manifest_path: String(capability.manifest_path || ""),
      source: String(capability.source || "")
    };
    const existing = byId.get(normalized.id);
    if (existing?.source === "repository" && normalized.source !== "repository") {
      continue;
    }
    byId.set(normalized.id, normalized);
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function filterCapabilities(capabilities, allowedIds) {
  return capabilities.filter((capability) => allowedIds.has(capability.id));
}

function normalizeCapabilityPolicy(policy, source) {
  if (policy?.schema_version !== "arckit-capability-policy/v3") {
    throw new Error(`Invalid Arckit capability policy: ${source}`);
  }
  const normalized = {
    schema_version: "arckit-capability-policy/v3",
    controller_capability_ids: arrayOfStrings(policy.controller_capability_ids),
    runtime_capability_ids: arrayOfStrings(policy.runtime_capability_ids)
  };
  if (![policy.controller_capability_ids, policy.runtime_capability_ids].every(Array.isArray)) {
    throw new Error(`Invalid Arckit capability policy: ${source}`);
  }
  const allIds = [
    ...normalized.controller_capability_ids,
    ...normalized.runtime_capability_ids
  ];
  if (new Set(allIds).size !== allIds.length) {
    throw new Error(`Capability ids must belong to exactly one binding target: ${source}`);
  }
  return normalized;
}

function allPolicyCapabilityIds(policy) {
  return new Set([
    ...capabilityIdsForBinding(policy, "controller"),
    ...capabilityIdsForBinding(policy, "runtime")
  ]);
}

function normalizeInvocation(invocation) {
  if (!invocation || typeof invocation !== "object" || Array.isArray(invocation)) {
    return { type: "none", skill_trigger: "", phases: [] };
  }
  return {
    type: String(invocation.type || "none"),
    skill_trigger: String(invocation.skill_trigger || ""),
    phases: arrayOfStrings(invocation.phases)
  };
}

function normalizeRuntimeEntrypoints(entrypoints) {
  if (!entrypoints || typeof entrypoints !== "object" || Array.isArray(entrypoints)) {
    return {};
  }
  return Object.fromEntries(Object.entries(entrypoints)
    .filter(([, value]) => typeof value === "string" && value)
    .map(([key, value]) => [String(key), String(value)]));
}

function arrayOfStrings(value) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function unique(values) {
  return [...new Set(values)];
}
