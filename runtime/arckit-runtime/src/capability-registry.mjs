import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(sourceDir, "../../..");
const CODEX_SKILLS_ROOT = join(homedir(), ".codex/skills");

const DEFAULT_CAPABILITY_PATHS = [
  "entry/skills/using-arckit/arckit.capability.json",
  "memory/skills/arckit-development-ledger/arckit.capability.json",
  "memory/skills/arckit-pending/arckit.capability.json",
  "engineering/skills/arckit-implementation-handoff/arckit.capability.json",
  "engineering/skills/arckit-debug-diagnosis/arckit.capability.json",
  "definition/skills/arckit-spec/arckit.capability.json",
  "thinking/skills/arckit-architecture-decision/arckit.capability.json"
];

export async function loadRuntimeCapabilities(paths = DEFAULT_CAPABILITY_PATHS) {
  const capabilitiesById = new Map();
  for (const relativePath of paths) {
    const file = join(repositoryRoot, relativePath);
    if (!existsSync(file)) {
      continue;
    }
    addCapability(capabilitiesById, await readCapabilityFile(file, {
      manifestPath: relativePath,
      source: "repository"
    }));
  }
  for (const capability of await loadInstalledSkillCapabilities()) {
    if (!capabilitiesById.has(capability.id)) {
      addCapability(capabilitiesById, capability);
    }
  }
  return [...capabilitiesById.values()];
}

export function selectCapabilitiesForRound(capabilities, round, task = "") {
  const selected = new Map();
  const taskText = String(task || "");
  const implementationOrDiagnosis = round.dimension === "implementation_coverage"
    || (/implement|build|code|ship|test|refactor|实现|开发|编码|写代码|重构|测试/i.test(taskText) && round.current_state !== "unknown")
    || (/bug|error|fail|crash|regression|修复|错误|失败|异常/i.test(taskText) && round.current_state !== "unknown");
  add("using-arckit");
  add("arckit-development-ledger");
  if (implementationOrDiagnosis) {
    add("arckit-implementation-handoff");
  }
  if (/bug|error|fail|crash|regression|修复|错误|失败|异常/i.test(taskText)) {
    add("arckit-debug-diagnosis");
  }
  if (["product_behavior", "problem_scenarios", "project_intent"].includes(round.dimension)) {
    add("arckit-spec");
    add("arckit-pending");
  }
  if (["architecture_foundation", "integration_boundaries"].includes(round.dimension)) {
    add("arckit-architecture-decision");
  }

  return [...selected.values()];

  function add(id) {
    const capability = capabilities.find((item) => item.id === id);
    if (capability) {
      selected.set(id, capability);
    }
  }
}

async function loadInstalledSkillCapabilities() {
  if (!existsSync(CODEX_SKILLS_ROOT)) {
    return [];
  }
  const entries = await readdir(CODEX_SKILLS_ROOT, { withFileTypes: true });
  const capabilities = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const manifest = join(CODEX_SKILLS_ROOT, entry.name, "arckit.capability.json");
    if (!existsSync(manifest)) {
      continue;
    }
    capabilities.push(await readCapabilityFile(manifest, {
      manifestPath: manifest,
      source: "installed_codex_skill"
    }));
  }
  return capabilities;
}

async function readCapabilityFile(file, { manifestPath, source }) {
  const capability = JSON.parse(await readFile(file, "utf8"));
  return {
    ...capability,
    manifest_path: manifestPath,
    source
  };
}

function addCapability(capabilitiesById, capability) {
  if (!capability?.id) {
    return;
  }
  capabilitiesById.set(capability.id, capability);
}
