#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BLOCKED_CATALOG = JSON.parse(fs.readFileSync(new URL("../monorepo/blocked-secret-fingerprints.json", import.meta.url), "utf8"));
const BLOCKED_FINGERPRINTS = new Set(BLOCKED_CATALOG.fingerprints
  .filter((item) => item.scopes.includes("source-import"))
  .map((item) => item.fingerprint));
const RULES = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  /\bLTAI[A-Za-z0-9]{12,30}\b/g,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /(?:password|passwd|secret|token|api[_-]?key|access[_-]?key|signing[_-]?key|shared[_-]?secret)\s*[=:]\s*["']([^"']{12,})["']/gi,
  /^\s*[A-Z0-9_]*(?:PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|ACCESS_KEY|SIGNING_KEY)[A-Z0-9_]*=([^\s#]{12,})/gim
];

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value) throw new Error(`Invalid argument near ${key || "<end>"}`);
    result[key.slice(2)] = path.resolve(value);
  }
  return result;
}

function git(repo, args, encoding = "utf8") {
  const result = spawnSync("git", ["-C", repo, ...args], { encoding, maxBuffer: 128 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed for ${repo}: ${String(result.stderr).trim()}`);
  return result.stdout;
}

function trackedFiles(repo) {
  const output = git(repo, ["ls-tree", "-r", "-z", "--name-only", "HEAD"], null);
  return output.toString("utf8").split("\0").filter(Boolean);
}

function readHead(repo, file) {
  return git(repo, ["show", `HEAD:${file}`], null);
}

function excluded(file) {
  return /(^|\/)(\.agents|\.cursor|\.claude|\.shared|\.arckit|\.tools|frontend-nextjs-backup|node_modules|dist|build|DerivedData|xcuserdata)(\/|$)|(^|\/)\.DS_Store$|(^|\/)\.env(?:\.|$)|\.(?:p12|mobileprovision)$/i.test(file);
}

function sanitizeText(file, text) {
  let output = text;
  if (file.endsWith("frontend/src/lib/feedbackSdk.ts")) {
    output = output.replace(
      /const\s+FEEDBACK_API_KEY\s*=\s*["'][^"']+["']/,
      "const FEEDBACK_API_KEY = import.meta.env.VITE_FEEDBACK_API_KEY?.trim() || ''"
    );
  }
  output = output
    .replace(/\bLTAI[A-Za-z0-9]{12,30}\b/g, "INVALID_ALIBABA_ACCESS_KEY_ID")
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "INVALID_JWT_EXAMPLE")
    .replace(/((?:password|passwd|secret|token|api[_-]?key|access[_-]?key|signing[_-]?key|shared[_-]?secret)\s*[=:]\s*["'])[^"']{12,}(["'])/gi, "$1REPLACE_WITH_PRIVATE_SECRET$2")
    .replace(/^(\s*[A-Z0-9_]*(?:PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|ACCESS_KEY|SIGNING_KEY)[A-Z0-9_]*=)[^\s#]{12,}/gim, "$1REPLACE_WITH_PRIVATE_SECRET");
  return output;
}

function writeFromGit(repo, source, destination, sanitize) {
  const contents = readHead(repo, source);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (sanitize && !contents.subarray(0, 8192).includes(0)) {
    fs.writeFileSync(destination, sanitizeText(source, contents.toString("utf8")));
  } else {
    fs.writeFileSync(destination, contents);
  }
}

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function scanBlocked(root) {
  const hits = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile()) {
        const body = fs.readFileSync(absolute);
        if (body.subarray(0, 8192).includes(0)) continue;
        const text = body.toString("utf8");
        for (const pattern of RULES) {
          pattern.lastIndex = 0;
          for (const match of text.matchAll(pattern)) {
            const fp = fingerprint(match[0]);
            if (BLOCKED_FINGERPRINTS.has(fp)) hits.push({ path: path.relative(root, absolute), fingerprint: fp });
          }
        }
      }
    }
  }
  walk(root);
  return hits;
}

const args = parseArgs(process.argv.slice(2));
for (const name of ["workshop-api", "todo-web", "feedbacks"]) {
  if (!args[name]) throw new Error(`Missing --${name}`);
}
const stage = args.output || path.join(os.tmpdir(), "arckit-monorepo-sanitized");
const allowedBases = [path.resolve(os.tmpdir()), path.resolve("/private/tmp")];
if (!allowedBases.some((base) => stage.startsWith(`${base}${path.sep}`))) {
  throw new Error(`Staging output must be below the system temporary directory: ${stage}`);
}
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });

const apiRootNames = new Set(["AGENTS.md", "README.md", "go.mod", "go.sum", "main.go", "deploy.sh", "USER_GUIDE.md"]);
const apiPrefixes = ["api/", "database/", "deploy/", "docs/", "handler/", "middleware/", "models/", "realtime/", "response/", "router/", "test/"];
const apiSanitize = new Set(["USER_GUIDE.md", "api/user_api.md", "deploy/prod/env.production.example", "deploy/prod/env.workshop.production.example", "docs/feedback-v2-deployment-runbook.md", "docs/feedback-v2-notifications-unread.md"]);
let fileCount = 0;
for (const file of trackedFiles(args["workshop-api"])) {
  if (excluded(file) || file.startsWith("web/")) continue;
  if (!apiRootNames.has(file) && !apiPrefixes.some((prefix) => file.startsWith(prefix))) continue;
  writeFromGit(args["workshop-api"], file, path.join(stage, "services/workshop-api", file), apiSanitize.has(file));
  fileCount += 1;
}

const todoSanitize = new Set(["frontend/src/lib/feedbackSdk.ts", "frontend/env.template", "frontend/.env.production.example"]);
for (const file of trackedFiles(args["todo-web"])) {
  if ((excluded(file) && !todoSanitize.has(file)) || file.startsWith("frontend/public/sdk/")) continue;
  let target = "";
  if (file.startsWith("frontend/")) target = path.join("apps/todo-web", file.slice("frontend/".length));
  else if (file.startsWith("specs/")) target = path.join("apps/todo-web/docs/specs", file.slice("specs/".length));
  if (!target) continue;
  writeFromGit(args["todo-web"], file, path.join(stage, target), todoSanitize.has(file));
  fileCount += 1;
}

const feedbackMappings = [
  ["webapps/feedback-console-web/", "apps/feedback-console/"],
  ["webapps/feedback-sdk-web/", "packages/feedback-sdk-web/"],
  ["Test/ios/TestFeedBack/", "examples/feedback-ios/"],
  ["design/", "docs/workshop/feedback-design/"]
];
for (const file of trackedFiles(args.feedbacks)) {
  if (excluded(file)) continue;
  const mapping = feedbackMappings.find(([prefix]) => file.startsWith(prefix));
  if (!mapping) continue;
  writeFromGit(args.feedbacks, file, path.join(stage, mapping[1], file.slice(mapping[0].length)), false);
  fileCount += 1;
}

const blockedHits = scanBlocked(stage);
if (blockedHits.length) {
  throw new Error(`Sanitized staging still contains ${blockedHits.length} blocked fingerprint(s): ${blockedHits.map((hit) => `${hit.path}:${hit.fingerprint}`).join(", ")}`);
}
const sourceHeads = Object.fromEntries([
  ["workshop-api", args["workshop-api"]],
  ["todo-web", args["todo-web"]],
  ["workshop-feedbacks", args.feedbacks]
].map(([name, repo]) => [name, String(git(repo, ["rev-parse", "HEAD"])).trim()]));
const report = {
  schema_version: "arckit-monorepo-sanitized-stage/v1",
  generated_at: new Date().toISOString(),
  source_heads: sourceHeads,
  output: stage,
  files: fileCount,
  blocked_fingerprints_checked: BLOCKED_FINGERPRINTS.size,
  blocked_fingerprints_found: 0,
  secret_values_emitted: false
};
fs.writeFileSync(path.join(stage, ".arckit-import-stage.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
