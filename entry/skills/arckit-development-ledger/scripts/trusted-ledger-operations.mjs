import fs from "node:fs";
import path from "node:path";
import {
  createProjectStateRecord,
  renderProjectState,
  validateProjectStateRecord
} from "./project-state.mjs";
import {
  auditCaseRecord,
  createDefaultCaseRecord,
  readCaseRecord,
  validateCaseRecord,
  writeCaseRecord
} from "./development-case.mjs";
import { renderIteration, validateIterationStateRecord } from "./project-iteration.mjs";

export function executeTrustedLedgerCommand(projectRoot, args) {
  const [script, command, ...rest] = args;
  const options = parseOptions(rest);
  if (script === "project-state.mjs") {
    if (command === "init") return initializeProjectState(projectRoot, options);
    if (command === "register-case") return registerProjectCase(projectRoot, options);
    if (command === "audit") return auditProjectState(projectRoot, options._[0]);
    if (command === "render") return renderProjectStateProjection(projectRoot, options._[0]);
  }
  if (script === "development-case.mjs") {
    if (command === "new") return createDevelopmentCase(projectRoot, options);
    if (command === "audit") return auditDevelopmentCase(projectRoot, options._[0], options.write === "true");
    if (command === "index") return writeDevelopmentCaseIndex(projectRoot);
  }
  throw new Error(`Unsupported in-process ledger command: ${script} ${command || ""}`.trim());
}

export function initializeProjectState(projectRoot, options) {
  if (!options.name) throw new Error("init requires --name");
  const record = createProjectStateRecord({ name: options.name, intent: options.intent || "" });
  writeProjectState(projectRoot, record);
  return `${projectStateRecordPath(projectRoot)}\n`;
}

export function registerProjectCase(projectRoot, options) {
  if (!options["case-ref"]) throw new Error("register-case requires --case-ref");
  const file = projectStateRecordPath(projectRoot);
  const record = JSON.parse(fs.readFileSync(file, "utf8"));
  record.advancement.active_case_refs = unique([...record.advancement.active_case_refs, options["case-ref"]]);
  if (options.intent) record.advancement.selection_context.current_focus = options.intent;
  record.project.revision += 1;
  record.project.updated_at = new Date().toISOString();
  const errors = validateProjectStateRecord(record, file);
  if (errors.length) throw new Error(errors.join("\n"));
  writeProjectState(projectRoot, record);
  return `${file}\n`;
}

export function auditProjectState(projectRoot, input = "") {
  const file = input ? path.resolve(projectRoot, input) : projectStateRecordPath(projectRoot);
  const record = JSON.parse(fs.readFileSync(file, "utf8"));
  const errors = validateProjectStateRecord(record, file);
  for (const ref of record.advancement?.active_case_refs || []) {
    const caseFile = path.join(projectRoot, ref);
    if (!fs.existsSync(caseFile)) {
      errors.push(`${file}: active Case does not exist: ${ref}`);
      continue;
    }
    const caseRecord = readCaseRecord(caseFile).record;
    if (caseRecord.schema_version !== "development-case-record/v5" || caseRecord.status === "closed") {
      errors.push(`${file}: active Case must be unfinished development-case-record/v5: ${ref}`);
    }
  }
  if (record.advancement?.active_iteration_ref) {
    const iterationFile = path.join(projectRoot, record.advancement.active_iteration_ref);
    if (!fs.existsSync(iterationFile)) errors.push(`${file}: active iteration does not exist: ${record.advancement.active_iteration_ref}`);
    else if (JSON.parse(fs.readFileSync(iterationFile, "utf8")).schema_version !== "iteration-state-record/v3") errors.push(`${file}: active iteration must use iteration-state-record/v3`);
  }
  const projection = path.join(projectRoot, "arckit/project/STATE.md");
  if (path.resolve(file) === path.resolve(projectStateRecordPath(projectRoot)) && fs.existsSync(projection)) {
    if (normalize(fs.readFileSync(projection, "utf8")) !== normalize(renderProjectState(record))) errors.push(`${projection}: projection is stale`);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return `${file}: audit ok\n`;
}

export function renderProjectStateProjection(projectRoot, input = "") {
  const file = input ? path.resolve(projectRoot, input) : projectStateRecordPath(projectRoot);
  const record = JSON.parse(fs.readFileSync(file, "utf8"));
  const errors = validateProjectStateRecord(record, file);
  if (errors.length) throw new Error(errors.join("\n"));
  const target = path.join(projectRoot, "arckit/project/STATE.md");
  fs.writeFileSync(target, `${renderProjectState(record)}\n`);
  return `${target}\n`;
}

export function createDevelopmentCase(projectRoot, options) {
  const artifactType = options["artifact-type"] || "unknown";
  const caseId = options["case-id"] || nextDevelopmentCaseId(projectRoot);
  if (!/^CASE-\d{8}-\d{3}$/.test(caseId)) throw new Error("development Case requires a canonical Case id");
  const record = createDefaultCaseRecord({
    id: caseId,
    title: options.title,
    artifactType,
    intent: options.intent || "",
    expectedOutcome: options["expected-outcome"] || "",
    initialFacts: parseArrayOption(options, "initial-facts"),
    initialImpacts: parseArrayOption(options, "initial-impacts"),
    initialGaps: parseArrayOption(options, "initial-gaps"),
    maxReviewCycles: Number(options["max-review-cycles"]),
    reviewPolicySource: options["review-policy-source"]
  });
  const activeDir = path.join(projectRoot, "arckit/cases/active");
  fs.mkdirSync(activeDir, { recursive: true });
  const closedDir = path.join(projectRoot, "arckit/cases/closed");
  fs.mkdirSync(closedDir, { recursive: true });
  const collision = [activeDir, closedDir].some((dir) => fs.readdirSync(dir).some((name) => name.startsWith(`${record.id}-`)));
  if (collision) throw new Error(`development Case ${record.id} already exists`);
  const file = path.join(activeDir, `${record.id}-${slugify(record.title)}.md`);
  fs.writeFileSync(file, renderNewCase(record));
  return `${file}\n`;
}

export function auditDevelopmentCase(projectRoot, input, write = false) {
  if (!input) throw new Error("audit requires a case-file");
  const file = path.resolve(projectRoot, input);
  const { text, record } = readCaseRecord(file);
  const errors = validateCaseRecord({ ...record, case_resolution: auditCaseRecord(record, record.case_resolution?.updated_at || new Date().toISOString()) }, file)
    .filter((error) => !error.includes("case_resolution is not"));
  if (errors.length) throw new Error(errors.join("\n"));
  const timestamp = new Date().toISOString();
  const audit = auditCaseRecord(record, timestamp);
  if (write) {
    record.case_resolution = audit;
    record.current_round = { goal: "", selected_gap: null };
    record.updated_at = timestamp;
    writeCaseRecord(file, text, record);
  }
  return `${JSON.stringify(audit, null, 2)}\n`;
}

export function writeDevelopmentCaseIndex(projectRoot) {
  const casesRoot = path.join(projectRoot, "arckit/cases");
  const activeDir = path.join(casesRoot, "active");
  const closedDir = path.join(casesRoot, "closed");
  fs.mkdirSync(activeDir, { recursive: true });
  fs.mkdirSync(closedDir, { recursive: true });
  const active = [];
  const closed = [];
  for (const directory of [activeDir, closedDir]) {
    for (const name of fs.readdirSync(directory).filter((item) => item.endsWith(".md"))) {
      const file = path.join(directory, name);
      const record = readCaseRecord(file).record;
      (record.status === "closed" ? closed : active).push({ file, record });
    }
  }
  active.sort(byCaseFile);
  closed.sort(byCaseFile);
  const rel = (file) => path.relative(casesRoot, file).replaceAll("\\", "/");
  const content = [
    "# Development Cases", "",
    "`arckit/cases` stores Case State. Project State chooses or creates a Case; each Case exposes unordered evidence-backed candidate gaps; Loops apply one Controller-selected bounded Case transition.", "",
    "## Active Cases", "", "| ID | Status | Title | Selected Gap | Updated |", "| --- | --- | --- | --- | --- |",
    ...active.map(({ file, record }) => `| [${record.id}](${rel(file)}) | ${tableEscape(record.status)} | ${tableEscape(record.title)} | ${tableEscape(record.current_round?.selected_gap?.id || "none")} | ${tableEscape(record.updated_at)} |`),
    "", "## Closed Cases", "", "| ID | Status | Title | Updated |", "| --- | --- | --- | --- |",
    ...closed.map(({ file, record }) => `| [${record.id}](${rel(file)}) | ${tableEscape(record.status)} | ${tableEscape(record.title)} | ${tableEscape(record.updated_at)} |`), ""
  ].join("\n");
  const target = path.join(casesRoot, "INDEX.md");
  fs.writeFileSync(target, content);
  return `${target}\n`;
}

export function renderIterationProjection(projectRoot, iterationRef) {
  const file = path.resolve(projectRoot, iterationRef);
  const record = JSON.parse(fs.readFileSync(file, "utf8"));
  const errors = validateIterationStateRecord(record, file);
  if (errors.length) throw new Error(errors.join("\n"));
  const projectFile = path.join(projectRoot, record.project_state_ref);
  const project = fs.existsSync(projectFile) ? JSON.parse(fs.readFileSync(projectFile, "utf8")) : null;
  record._file = file;
  const content = renderIteration(record, project);
  delete record._file;
  const target = file.replace(/\.record\.json$/, ".md");
  fs.writeFileSync(target, `${content}\n`);
  return `${target}\n`;
}

export function writeIterationIndex(projectRoot) {
  const dir = path.join(projectRoot, "arckit/project/iterations");
  fs.mkdirSync(dir, { recursive: true });
  const records = fs.readdirSync(dir).filter((name) => name.endsWith(".record.json")).sort()
    .map((name) => ({ name, record: JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")) }));
  const lines = ["# Project Iterations", "", "| ID | Status | Title | Updated |", "| --- | --- | --- | --- |", ...records.map(({ name, record }) => `| [${record.id}](iterations/${name.replace(/\.record\.json$/, ".md")}) | ${record.status} | ${record.title} | ${record.updated_at} |`), ""];
  const target = path.join(projectRoot, "arckit/project/ITERATIONS.md");
  fs.writeFileSync(target, lines.join("\n"));
  return `${target}\n`;
}

function writeProjectState(projectRoot, record) {
  const dir = path.join(projectRoot, "arckit/project");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "state.record.json"), `${JSON.stringify(record, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, "STATE.md"), `${renderProjectState(record)}\n`);
}

function projectStateRecordPath(projectRoot) { return path.join(projectRoot, "arckit/project/state.record.json"); }
function normalize(value) { return String(value).replaceAll("\r\n", "\n").trim(); }
function unique(values) { return [...new Set(values)]; }
function byCaseFile(left, right) { return left.file.localeCompare(right.file); }
function tableEscape(value) { return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " "); }
function slugify(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "development-case"; }

export function nextDevelopmentCaseId(projectRoot) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const casesRoot = path.join(projectRoot, "arckit/cases");
  const files = ["active", "closed"].flatMap((name) => {
    const dir = path.join(casesRoot, name);
    return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  });
  const used = files.map((name) => name.match(new RegExp(`^CASE-${date}-(\\d{3})`))).filter(Boolean).map((match) => Number(match[1]));
  return `CASE-${date}-${String(used.length ? Math.max(...used) + 1 : 1).padStart(3, "0")}`;
}

function renderNewCase(record) {
  return [`# ${record.title}`, "", `Case: ${record.id}`, `Status: ${record.status}`, `Artifact Type: ${record.artifact_type}`, `Selected Gap: ${record.current_round.selected_gap?.id || "none"}`, `Updated: ${record.updated_at}`, "", "## User Intent", "", record.user_intent || "TBD", "", "## Structured Record", "", "```json", JSON.stringify(record, null, 2), "```", "", "## Round Notes", "", "- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.", ""].join("\n");
}

function parseArrayOption(options, key) {
  const value = JSON.parse(options[key] || "[]");
  if (!Array.isArray(value)) throw new Error(`--${key} must be a JSON array`);
  return value;
}

function parseOptions(args) {
  const result = { _: [] };
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) result._.push(token);
    else {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
      result[token.slice(2)] = value;
      index += 1;
    }
  }
  return result;
}
