const ARTIFACT_RULES = [
  { owner: "projection", kind: "projection", prefix: "arckit/project/STATE.md" },
  { owner: "projection", kind: "projection", prefix: "arckit/project/ITERATIONS.md" },
  { owner: "projection", kind: "projection", prefix: "arckit/cases/INDEX.md" },
  { owner: "projection", kind: "projection", prefix: "arckit/spec/INDEX.md" },
  { owner: "projection", kind: "projection", prefix: "arckit/tech/INDEX.md" },
  { owner: "project_ledger", kind: "source_fact", prefix: "arckit/project/state.record.json" },
  { owner: "project_ledger", kind: "source_fact", prefix: "arckit/project/iterations/", suffix: ".record.json" },
  { owner: "case_ledger", kind: "source_fact", prefix: "arckit/cases/active/", suffix: ".md" },
  { owner: "spec", kind: "source_fact", prefix: "arckit/spec/" },
  { owner: "tech", kind: "source_fact", prefix: "arckit/tech/" },
  { owner: "interaction", kind: "source_fact", prefix: "arckit/interaction/" },
  { owner: "visual", kind: "source_fact", prefix: "arckit/visual/" },
  { owner: "pending", kind: "candidate_context", prefix: "arckit/pending/" },
  { owner: "intake", kind: "raw_input", prefix: "arckit/intake/" },
  { owner: "debug", kind: "evidence", prefix: "arckit/debug/" },
  { owner: "workflow_memory", kind: "runtime_memory", prefix: "arckit/workflow-memory/" },
  { owner: "agent_context", kind: "source_fact", prefix: "AGENTS.md" },
  { owner: "runtime", kind: "runtime_log", prefix: "arckit/project/runtime-results/" },
  { owner: "runtime", kind: "runtime_log", suffix: "activity.json" },
  { owner: "runtime", kind: "runtime_log", suffix: "events.jsonl" },
  { owner: "runtime", kind: "runtime_log", suffix: "raw-events.jsonl" },
  { owner: "projection", kind: "projection", suffix: "/INDEX.md" }
];

export function classifyArtifactPath(path) {
  const normalized = normalizeArtifactPath(path);
  if (!normalized) {
    return {
      path: String(path || ""),
      owner: "unknown",
      kind: "unknown"
    };
  }

  for (const rule of ARTIFACT_RULES) {
    const prefixMatches = !rule.prefix || normalized === rule.prefix || normalized.startsWith(rule.prefix);
    const suffixMatches = !rule.suffix || normalized.endsWith(rule.suffix);
    if (prefixMatches && suffixMatches) {
      return {
        path: normalized,
        owner: rule.owner,
        kind: rule.kind
      };
    }
  }

  return {
    path: normalized,
    owner: "implementation",
    kind: "implementation_artifact"
  };
}

export function buildArtifactOwnershipScan(paths = []) {
  const classified = unique(paths).map(classifyArtifactPath);
  const sourceFactsChanged = classified
    .filter((item) => item.kind === "source_fact")
    .map((item) => item.path);
  const projectionArtifactsChanged = classified
    .filter((item) => item.kind === "projection")
    .map((item) => item.path);
  const runtimeLogs = classified
    .filter((item) => item.kind === "runtime_log")
    .map((item) => item.path);
  const implementationEvidence = classified
    .filter((item) => item.kind === "implementation_artifact" || item.kind === "evidence")
    .map((item) => item.path);
  const pendingItems = classified
    .filter((item) => item.kind === "candidate_context" || item.kind === "raw_input")
    .map((item) => item.path);
  const unknownArtifacts = classified
    .filter((item) => item.kind === "unknown")
    .map((item) => item.path);

  return {
    schema_version: "arckit-artifact-ownership-scan/v1",
    classified,
    source_facts_changed: sourceFactsChanged,
    projection_artifacts_changed: projectionArtifactsChanged,
    implementation_evidence: implementationEvidence,
    pending_items: pendingItems,
    runtime_logs: runtimeLogs,
    unknown_artifacts: unknownArtifacts
  };
}

export function createArtifactImpactScan(ownershipScan, { dryRun = false } = {}) {
  const ownerImpact = new Map();
  for (const item of ownershipScan.classified || []) {
    ownerImpact.set(item.owner, impactForKind(item.kind));
  }

  return {
    project: ownerImpact.get("project_ledger") || (dryRun ? "read" : "none"),
    intake: ownerImpact.get("intake") || "none",
    cases: ownerImpact.get("case_ledger") || (dryRun ? "read" : "none"),
    spec: ownerImpact.get("spec") || "none",
    interaction: ownerImpact.get("interaction") || "none",
    visual: ownerImpact.get("visual") || "none",
    tech: ownerImpact.get("tech") || "none",
    debug: ownerImpact.get("debug") || "none",
    pending: ownerImpact.get("pending") || "none",
    workflow_memory: ownerImpact.get("workflow_memory") || "none",
    agent_context: ownerImpact.get("agent_context") || "none",
    handoff: dryRun ? "generated" : "candidate_update"
  };
}

function impactForKind(kind) {
  if (kind === "source_fact") {
    return "source_update";
  }
  if (kind === "projection") {
    return "projection_update";
  }
  if (kind === "candidate_context" || kind === "raw_input") {
    return "candidate_update";
  }
  if (kind === "evidence" || kind === "implementation_artifact") {
    return "evidence_update";
  }
  if (kind === "runtime_memory") {
    return "runtime_memory_update";
  }
  if (kind === "runtime_log") {
    return "runtime_log";
  }
  return "unknown";
}

function normalizeArtifactPath(path) {
  const value = String(path || "").trim();
  if (!value || value.startsWith("/") || value.includes("\0")) {
    return "";
  }
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
