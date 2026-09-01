#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const MAX_BLOB_BYTES = 4 * 1024 * 1024;
const SKIP_WALK_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "out", "DerivedData", ".vite", ".npm-cache"]);
const SENSITIVE_PATH = /(^|\/)(\.env(?:\.|$)|[^/]*\.(?:pem|key|p12|pfx|mobileprovision|keystore|jks)|credentials?(?:\.|$)|secrets?(?:\.|$)|google-services\.json$|GoogleService-Info\.plist$)/i;
const NON_PRODUCT_PATH = /(^|\/)(\.cursor|\.agents|\.claude|\.shared|\.arckit|\.tools|frontend-nextjs-backup|node_modules|dist|build|DerivedData|xcuserdata)(\/|$)|(^|\/)\.DS_Store$/;
const RULES = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["alibaba-access-key", /\bLTAI[A-Za-z0-9]{12,30}\b/],
  ["github-token", /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/],
  ["slack-token", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ["jwt", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ["secret-literal", /(?:password|passwd|secret|token|api[_-]?key|access[_-]?key|signing[_-]?key|shared[_-]?secret)\s*[=:]\s*["']([^"']{12,})["']/i],
  ["secret-env-assignment", /^\s*[A-Z0-9_]*(?:PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|ACCESS_KEY|SIGNING_KEY)[A-Z0-9_]*=([^\s#]{12,})/]
];

function git(repo, args, options = {}) {
  const result = spawnSync("git", ["-C", repo, ...args], {
    encoding: Object.hasOwn(options, "encoding") ? options.encoding : "utf8",
    input: options.input,
    maxBuffer: 512 * 1024 * 1024
  });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed for ${repo}: ${String(result.stderr).trim()}`);
  return result.stdout;
}

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function looksPlaceholder(line) {
  return /(?:example|placeholder|replace[-_ ]?me|your[-_]|changeme|development-|dummy|sample|mock|fake|test[-_ ]|password123|access[-_ ]token|refresh[-_ ]token|token[-_ ]value|secret[-_ ]value|xxxx|<[^>]+>)/i.test(line);
}

function scanText({ repository, scope, object, file, text }) {
  const findings = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const [rule, pattern] of RULES) {
      const match = line.match(pattern);
      if (!match) continue;
      if (["secret-literal", "secret-env-assignment"].includes(rule) && looksPlaceholder(line)) continue;
      findings.push({
        repository,
        scope,
        object,
        path: file,
        line: index + 1,
        rule,
        fingerprint: fingerprint(match[0]),
        assignment_name: ["secret-literal", "secret-env-assignment"].includes(rule) ? match[0].split(/[=:]/, 1)[0].trim().slice(0, 80) : "",
        value_length: typeof match[1] === "string" ? match[1].length : match[0].length
      });
    }
  }
  return findings;
}

function objectInventory(repo) {
  const listed = String(git(repo, ["rev-list", "--objects", "--all"])).trim().split(/\n/).filter(Boolean);
  const pathsByOid = new Map();
  for (const line of listed) {
    const [oid, ...rest] = line.split(" ");
    if (!pathsByOid.has(oid)) pathsByOid.set(oid, new Set());
    if (rest.length) pathsByOid.get(oid).add(rest.join(" "));
  }
  const oids = [...pathsByOid.keys()];
  const checks = String(git(repo, ["cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"], { input: `${oids.join("\n")}\n` }))
    .trim().split(/\n/).filter(Boolean);
  const blobs = [];
  for (const line of checks) {
    const [oid, type, sizeText] = line.split(" ");
    const size = Number(sizeText);
    if (type === "blob" && Number.isFinite(size) && size <= MAX_BLOB_BYTES) blobs.push({ oid, size, paths: [...(pathsByOid.get(oid) || [])] });
  }
  return blobs;
}

function readBlobs(repo, blobs) {
  if (!blobs.length) return new Map();
  const output = git(repo, ["cat-file", "--batch"], { input: `${blobs.map((item) => item.oid).join("\n")}\n`, encoding: null });
  const result = new Map();
  let offset = 0;
  while (offset < output.length) {
    const newline = output.indexOf(10, offset);
    if (newline < 0) break;
    const header = output.subarray(offset, newline).toString("utf8");
    const [oid, type, sizeText] = header.split(" ");
    const size = Number(sizeText);
    offset = newline + 1;
    if (type !== "blob" || !Number.isFinite(size)) throw new Error(`Unexpected cat-file header: ${header}`);
    result.set(oid, output.subarray(offset, offset + size));
    offset += size + 1;
  }
  return result;
}

function headBlobOids(repo) {
  const output = git(repo, ["ls-tree", "-r", "-z", "HEAD"], { encoding: null });
  const current = new Set();
  for (const entry of output.toString("utf8").split("\0").filter(Boolean)) {
    const match = entry.match(/^\d+ blob ([0-9a-f]+)\t/);
    if (match) current.add(match[1]);
  }
  return current;
}

function walkWorkspace(root, relative = "") {
  const rows = [];
  const directory = path.join(root, relative);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_WALK_DIRS.has(entry.name)) continue;
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) rows.push(...walkWorkspace(root, child));
    else if (entry.isFile() || entry.isSymbolicLink()) rows.push(child);
  }
  return rows;
}

function auditRepository(repoArg) {
  const repo = fs.realpathSync(repoArg);
  const repository = path.basename(repo);
  const head = String(git(repo, ["rev-parse", "HEAD"])).trim();
  const branch = String(git(repo, ["branch", "--show-current"])).trim();
  const status = String(git(repo, ["status", "--porcelain"])).trim();
  const blobs = objectInventory(repo);
  const contents = readBlobs(repo, blobs);
  const currentOids = headBlobOids(repo);
  const findings = [];
  const sensitivePaths = new Map();
  const excludedCandidates = new Set();
  for (const blob of blobs) {
    const body = contents.get(blob.oid);
    if (!body || body.subarray(0, 8192).includes(0)) continue;
    const text = body.toString("utf8");
    const scope = currentOids.has(blob.oid) ? "current-or-history" : "history-only";
    for (const file of blob.paths.length ? blob.paths : ["<unknown>"]) {
      if (SENSITIVE_PATH.test(file)) sensitivePaths.set(file, scope);
      if (NON_PRODUCT_PATH.test(file)) excludedCandidates.add(file);
      findings.push(...scanText({ repository, scope, object: blob.oid, file, text }));
    }
  }
  const workspacePaths = walkWorkspace(repo);
  for (const file of workspacePaths) {
    if (SENSITIVE_PATH.test(file) && !sensitivePaths.has(file)) sensitivePaths.set(file, "workspace-only");
    if (NON_PRODUCT_PATH.test(file)) excludedCandidates.add(file);
  }
  const licenseFiles = String(git(repo, ["ls-files"])).split(/\n/).filter((file) => /(^|\/)(licen[sc]e|copying|notice)(\.|$)/i.test(file));
  const submodules = String(git(repo, ["ls-files", "--stage"])).split(/\n/).filter((line) => line.startsWith("160000 ")).map((line) => {
    const match = line.match(/^160000 ([0-9a-f]+) \d+\t(.+)$/);
    return match ? { object: match[1], path: match[2] } : { path: line };
  });
  const largeCurrentFiles = String(git(repo, ["ls-tree", "-r", "-l", "HEAD"])).split(/\n/).filter(Boolean).flatMap((line) => {
    const match = line.match(/^\d+ blob ([0-9a-f]+)\s+(\d+)\t(.+)$/);
    if (!match || Number(match[2]) < 1024 * 1024) return [];
    return [{ path: match[3], bytes: Number(match[2]), object: match[1] }];
  });
  return {
    repository,
    path: repo,
    head,
    branch,
    clean: status === "",
    refs_scanned: "--all",
    blobs_scanned: blobs.length,
    findings,
    sensitive_paths: [...sensitivePaths].map(([file, scope]) => ({ path: file, scope })),
    excluded_candidates: [...excludedCandidates].sort(),
    license_files: licenseFiles,
    submodules,
    large_current_files: largeCurrentFiles
  };
}

const repos = process.argv.slice(2);
if (!repos.length) {
  console.error("Usage: audit-monorepo-sources.mjs <repo>...");
  process.exit(2);
}

const reports = repos.map(auditRepository);
console.log(JSON.stringify({
  schema_version: "arckit-monorepo-source-audit/v1",
  generated_at: new Date().toISOString(),
  redaction: "No matched content or secret value is emitted; findings contain rule, path, line, object id, and a truncated SHA-256 fingerprint only.",
  reports
}, null, 2));
