import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../../..");
const IGNORED_DIRS = new Set([".git", "node_modules", "runtime-results", ".DS_Store"]);

export async function loadRuntimeCapabilities(options = {}) {
  if (Array.isArray(options)) {
    return normalizeCapabilities(options);
  }
  if (Array.isArray(options.capabilities)) {
    return normalizeCapabilities(options.capabilities);
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
  return normalizeCapabilities(loaded);
}

export function selectCapabilitiesForRound(capabilities = []) {
  return normalizeCapabilities(capabilities);
}

export function capabilityIds(capabilities = []) {
  return new Set(normalizeCapabilities(capabilities).map((capability) => capability.id));
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
    byId.set(String(capability.id), {
      schema_version: "arckit-capability/v1",
      id: String(capability.id),
      kind: String(capability.kind || ""),
      runtime_role: arrayOfStrings(capability.runtime_role),
      summary: String(capability.summary || ""),
      input_facts: arrayOfStrings(capability.input_facts),
      outputs: arrayOfStrings(capability.outputs),
      allowed_write_targets: arrayOfStrings(capability.allowed_write_targets),
      forbidden_decisions: arrayOfStrings(capability.forbidden_decisions),
      runtime_notes: arrayOfStrings(capability.runtime_notes),
      manifest_path: String(capability.manifest_path || ""),
      source: String(capability.source || "")
    });
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function arrayOfStrings(value) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function unique(values) {
  return [...new Set(values)];
}
