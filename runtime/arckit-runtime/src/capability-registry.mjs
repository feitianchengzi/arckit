import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const developmentRepositoryRoot = resolve(here, "../../..");
const defaultPolicyPath = resolve(here, "../config/capability-policy.json");
const IGNORED_DIRS = new Set([".git", "node_modules", "runtime-results", "dist-package", "release", ".DS_Store"]);

export async function loadRuntimeCapabilities(options = {}) {
  const policy = options.capabilityPolicy || await loadCapabilityPolicy(options);
  if (Array.isArray(options)) {
    return filterCapabilities(normalizeCapabilities(options), allPolicyCapabilityIds(policy));
  }
  if (Array.isArray(options.capabilities)) {
    return filterCapabilities(normalizeCapabilities(options.capabilities), allPolicyCapabilityIds(policy));
  }

  const repositoryCapabilityRoot = options.repositoryCapabilityRoot
    ? resolve(options.repositoryCapabilityRoot)
    : await defaultRepositoryCapabilityRoot();
  const roots = unique([
    repositoryCapabilityRoot,
    options.projectRoot ? resolve(options.projectRoot) : ""
  ].filter(Boolean));
  const manifests = [];
  for (const root of roots) {
    manifests.push(...await findCapabilityManifests(root));
  }
  const loaded = [];
  for (const manifestPath of manifests) {
    const capability = await readCapabilityManifest(manifestPath, repositoryCapabilityRoot);
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

export async function loadRuntimeCapabilityForEntrypoint({ projectRoot, entrypoint, repositoryCapabilityRoot }) {
  const policy = await loadCapabilityPolicy();
  const capabilities = await loadRuntimeCapabilities({ projectRoot, repositoryCapabilityRoot, capabilityPolicy: policy });
  const runtimeCapabilities = capabilitiesForBinding(capabilities, policy, "runtime");
  return runtimeCapabilityForEntrypoint(runtimeCapabilities, entrypoint);
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

async function readCapabilityManifest(manifestPath, repositoryCapabilityRoot) {
  try {
    const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
    if (parsed?.schema_version !== "arckit-capability/v1" || !parsed.id) {
      return null;
    }
    return {
      ...parsed,
      capability_root: dirname(manifestPath),
      manifest_path: relative(repositoryCapabilityRoot, manifestPath) || manifestPath,
      source: isWithin(repositoryCapabilityRoot, manifestPath) ? "repository" : "project"
    };
  } catch {
    return null;
  }
}

async function defaultRepositoryCapabilityRoot() {
  const resourcesPath = typeof process.resourcesPath === "string" ? process.resourcesPath : "";
  const packagedRoot = resourcesPath ? resolve(resourcesPath, "arckit-runtime", "trusted-capabilities") : "";
  if (packagedRoot) {
    try {
      await access(resolve(packagedRoot, "arckit-development-ledger", "arckit.capability.json"));
      return packagedRoot;
    } catch {
      // Electron development mode has a resourcesPath but uses repository capabilities.
    }
  }
  return developmentRepositoryRoot;
}

function isWithin(root, candidate) {
  const relativePath = relative(resolve(root), resolve(candidate));
  return relativePath === "" || (!relativePath.startsWith("..") && !relativePath.startsWith(sep));
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
