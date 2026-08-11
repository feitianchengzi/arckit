import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";

export async function readBoundCaseState(projectRoot, caseId) {
  const id = String(caseId || "").trim();
  if (!/^CASE-\d{8}-\d{3}$/.test(id)) return null;
  try {
    const projectText = await readFile(join(projectRoot, "arckit/project/state.record.json"), "utf8");
    const project = JSON.parse(projectText);
    for (const caseRef of project?.advancement?.active_case_refs || []) {
      const ref = String(caseRef || "");
      if (!matchesCaseFile(basename(ref), id)) continue;
      const record = parseCaseRecord(await readFile(join(projectRoot, ref), "utf8"), id);
      if (record) return { location: "active", record };
    }
    const closedDir = join(projectRoot, "arckit/cases/closed");
    if (existsSync(closedDir)) {
      const names = (await readdir(closedDir))
        .filter((name) => name.endsWith(".md") && matchesCaseFile(name, id))
        .sort((left, right) => left.localeCompare(right));
      for (const name of [...names].reverse()) {
        const record = parseCaseRecord(await readFile(join(closedDir, name), "utf8"), id);
        if (record) return { location: "closed", record };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function isBoundCaseResolved(caseState) {
  return caseState?.location === "closed"
    && caseState?.record?.status === "closed"
    && caseState?.record?.case_resolution?.status === "resolved";
}

function matchesCaseFile(name, caseId) {
  return name === `${caseId}.md` || name.startsWith(`${caseId}-`);
}

function parseCaseRecord(text, expectedId) {
  const match = String(text || "").match(/## Structured Record[\s\S]*?```json\s*\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    const record = JSON.parse(match[1]);
    return record
      && typeof record === "object"
      && !Array.isArray(record)
      && record.schema_version === "development-case-record/v5"
      && record.id === expectedId
      ? record
      : null;
  } catch {
    return null;
  }
}
