import { resolve } from "node:path";
import { codexProbeFromSetupSnapshot } from "./codex-setup-manager.mjs";

export function desktopSetupCheckInput(store = {}, input = {}) {
  const projectId = String(input?.projectId || "").trim();
  const projects = Array.isArray(store.projects) ? store.projects : [];
  if (projectId) {
    const selectedProject = projects.find((project) => String(project?.id || "") === projectId);
    if (!selectedProject?.path) {
      throw new Error(`Unknown local Product Workspace: ${projectId}`);
    }
  }

  const projectRoot = [...new Set(projects
    .map((project) => String(project?.path || "").trim())
    .filter(Boolean)
    .map((projectPath) => resolve(projectPath)))]
    .sort();

  return { projectRoot };
}

export async function checkDesktopSetupReadiness({ input, readDesktopStore, check }) {
  if (typeof check !== "function") throw new TypeError("A Setup Readiness check function is required.");
  if (typeof readDesktopStore !== "function") throw new TypeError("A Desktop Store reader is required for Setup Readiness.");

  const store = await readDesktopStore();
  return check(desktopSetupCheckInput(store, input));
}

export function shouldStartAutomationAfterSetupReadiness(readiness = {}) {
  return readiness.status === "ready" && !readiness.first_install;
}

export async function checkCoordinatedDesktopSetupReadiness({ input, readDesktopStore, checkCodex, checkSkills }) {
  if (typeof checkCodex !== "function") throw new TypeError("A Codex Setup check function is required.");
  if (typeof checkSkills !== "function") throw new TypeError("A Skill Provisioning check function is required.");

  const codex = await checkCodex();
  const codexProbeResult = codexProbeFromSetupSnapshot(codex);
  const skills = await checkDesktopSetupReadiness({
    input,
    readDesktopStore,
    check: (setupInput = {}) => checkSkills({ ...setupInput, codexProbeResult })
  });
  return combineDesktopSetupReadiness(skills, codex);
}

export function combineDesktopSetupReadiness(skills, codex) {
  const skillSnapshot = skills || { status: "checking", checks: [] };
  const codexSnapshot = codex || { status: "checking", installation: {}, authentication: {}, operation: null, error: null };
  const codexReady = codexSnapshot.status === "ready";
  const codexOnlySkillBlock = skillSnapshot.status === "blocked" && skillSnapshot.error?.code === "CODEX_UNAVAILABLE";
  const staleCodexEvidence = codexOnlySkillBlock && codexReady;
  const status = codexSnapshot.operation
    ? "applying"
    : staleCodexEvidence
      ? "blocked"
      : (skillSnapshot.status === "ready" || codexOnlySkillBlock) && !codexReady
        ? codexSnapshot.error ? "blocked" : "codex-action-required"
        : skillSnapshot.status;
  const checks = (skillSnapshot.checks || []).filter((item) => item.id !== "codex");
  checks.push({
    id: "codex",
    status: codexReady ? "passed" : codexSnapshot.error ? "failed" : "pending",
    summary: codexSetupSummary(codexSnapshot)
  });
  const skillError = skillSnapshot.error?.code === "CODEX_UNAVAILABLE" ? null : skillSnapshot.error;
  const evidenceError = staleCodexEvidence
    ? {
        code: "SETUP_EVIDENCE_STALE",
        stage: "aggregate",
        message: "Codex readiness 证据在 Setup 检查期间发生变化；请重新检查后再继续。"
      }
    : null;
  return {
    ...skillSnapshot,
    status,
    checks,
    codex: codexSnapshot.installation,
    codex_setup: codexSnapshot,
    can_continue: status === "ready",
    error: skillError || codexSnapshot.error || evidenceError
  };
}

function codexSetupSummary(snapshot = {}) {
  const installation = snapshot.installation || {};
  const authentication = snapshot.authentication || {};
  if (!installation.available) return installation.state === "broken" ? "Codex CLI 已找到但无法运行。" : "未找到 Codex CLI；可使用官方 standalone installer 恢复。";
  if (snapshot.operation) return `Codex ${snapshot.operation.kind} · ${snapshot.operation.phase}`;
  if (!authentication.authenticated) return `${installation.version_summary || "Codex CLI 可用"} · 等待显式登录`;
  return `${installation.version_summary || "Codex CLI 可用"} · 已认证 · ${installation.provenance}`;
}
