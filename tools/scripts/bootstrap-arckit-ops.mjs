#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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

function assertDirectory(directory, label) {
  if (!fs.statSync(directory, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`${label} is not a directory: ${directory}`);
  }
}

function writeTracked(root, relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents.endsWith("\n") ? contents : `${contents}\n`, { mode: 0o644 });
}

function writeSecret(root, relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  fs.writeFileSync(target, contents, { mode: 0o600 });
  fs.chmodSync(target, 0o600);
}

function copyQuarantine(source, target) {
  fs.mkdirSync(target, { recursive: true, mode: 0o700 });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) copyQuarantine(sourcePath, targetPath);
    else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      fs.chmodSync(targetPath, 0o600);
    }
  }
}

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function extractAssignments(file, sourceRoot) {
  const absolute = path.join(sourceRoot, file);
  if (!fs.existsSync(absolute)) return [];
  const text = fs.readFileSync(absolute, "utf8");
  const rows = [];
  const rules = [
    /(?:password|passwd|secret|token|api[_-]?key|access[_-]?key|signing[_-]?key|shared[_-]?secret)\s*[=:]\s*["']([^"']{12,})["']/gi,
    /^\s*([A-Z0-9_]*(?:PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|ACCESS_KEY|SIGNING_KEY)[A-Z0-9_]*)=([^\s#]{12,})/gim
  ];
  for (const pattern of rules) {
    for (const match of text.matchAll(pattern)) {
      const value = match[2] || match[1];
      rows.push({ source: file, fingerprint: fingerprint(match[0]), value });
    }
  }
  return rows;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

const args = parseArgs(process.argv.slice(2));
const required = ["ops", "workshop-api", "todo-web"];
for (const name of required) {
  if (!args[name]) throw new Error(`Missing --${name}`);
}
assertDirectory(args["workshop-api"], "Workshop API source");
assertDirectory(args["todo-web"], "Todo Web source");

const opsRoot = args.ops;
if (fs.existsSync(opsRoot) && fs.readdirSync(opsRoot).length > 0) {
  throw new Error(`Refusing to overwrite non-empty ops workspace: ${opsRoot}`);
}
fs.mkdirSync(opsRoot, { recursive: true });

writeTracked(opsRoot, ".gitignore", `# Plaintext secrets and quarantined source are never tracked.
secrets/**
!secrets/README.md

# Environment-local overrides stay outside Git.
**/.env
**/.env.*
!**/.env.example
**/*.local
.DS_Store
`);

writeTracked(opsRoot, "LICENSE.md", `Copyright (c) 2026 Arckit contributors

All rights reserved.

This repository contains private operational and customer-specific material. No
permission is granted to use, copy, modify, publish, distribute, sublicense, or
sell any part of it without explicit written authorization from the copyright
holder.
`);

writeTracked(opsRoot, "README.md", `# arckit-ops

Arckit 的私有运维工作区。这里保存环境部署覆盖层、客户专属配置、轮换记录和秘密管理引用；公开产品代码位于同级 \`arckit\`。

## 安全边界

- \`secrets/\` 整体被 Git 忽略；不得用“私有仓库”代替 secrets manager 或加密存储。
- 可跟踪文件只保存配置契约、秘密标识符、脱敏 fingerprint、责任人与轮换证据，不保存明文秘密。
- 公开 Arckit 的构建和测试不得依赖本目录；部署时由操作者显式提供环境与秘密来源。
- 本地导入的历史凭据一律按已泄露处理，只用于完成轮换或失效确认。

本地秘密迁移说明见 \`secrets/README.md\`，人工轮换门禁见 \`runbooks/credential-rotation.md\`。
`);

writeTracked(opsRoot, "secrets/README.md", `# Local secret storage

除本文件外，\`secrets/\` 下的所有内容均被 Git 忽略。这里的导入副本只用于轮换过渡或取证隔离，并不是长期秘密存储方案。轮换完成后，应将运行时秘密迁移到受控 secrets manager，并安全删除本地过渡副本。
`);

const fingerprints = [
  ["Workshop API OSS temporary secret", "8f34e336a8a5306c", "rotate-or-revoke"],
  ["Workshop API OSS security token", "c833818e180cee0e", "expire-and-confirm"],
  ["Workshop API documented API credential", "8af4d0eb40fdb36e", "rotate-or-revoke"],
  ["Workshop API documented API credential", "5255d291cfb7c5c7", "rotate-or-revoke"],
  ["Workshop API documented API credential", "b5e0b9cb7deaac32", "rotate-or-revoke"],
  ["Workshop API documented database credential", "38fd2040d7a795d9", "rotate-or-revoke"],
  ["Workshop API documented database credential", "95fd118ed3457250", "rotate-or-revoke"],
  ["Workshop API production example secret", "02a4d2582cb9a56b", "prove-invalid-or-rotate"],
  ["Workshop API production example secret", "ea94be284d331295", "prove-invalid-or-rotate"],
  ["Workshop API historical JWT example", "ba80ffd6d0024109", "prove-invalid"],
  ["Todo Web Feedback API key", "75b4a00e7c532dbb", "rotate-or-revoke"],
  ["Todo Web historical OSS access key id", "a8785f90a5628b39", "rotate-or-revoke"],
  ["Todo Web historical OSS access key secret", "d2d51f63b1710e5e", "rotate-or-revoke"],
  ["Workshop API historical OSS temporary secret", "335ab3f4e999b3f9", "prove-invalid-or-rotate"],
  ["Workshop API historical OSS security token", "382e833d12ada2c6", "prove-expired-or-revoke"],
  ["Workshop API historical database password", "478c1b91d7adf773", "prove-invalid-or-rotate"],
  ["ArcOrbit Feedback API key", "4d45357560c48842", "rotate-or-revoke"]
];
const rows = fingerprints.map(([identifier, fp, action]) => `| ${identifier} | \`${fp}\` | ${action} | unassigned | pending |`).join("\n");
writeTracked(opsRoot, "runbooks/credential-rotation.md", `# Credential rotation gate

这些 fingerprint 来自公开导入前的完整历史审计，不包含明文值。任何公开 push 之前，凭据所有者必须为每一项记录责任人、轮换/失效时间和云厂商或系统侧证据。

| Secret identifier | Fingerprint | Required action | Owner | Status |
|---|---|---|---|---|
${rows}

## 完成标准

1. 当前凭据已轮换或撤销，历史临时凭据已确认过期/失效。
2. 新值只存在于受控 secrets manager 或本地 ignored secret 中。
3. 公开仓库完整可达历史不再包含上述 fingerprint。
4. 负责人在本表附上不含秘密的证据引用，并将状态改为 \`verified\`。
`);

const environments = ["development", "staging", "production"];
for (const environment of environments) {
  writeTracked(opsRoot, `environments/${environment}/workshop-api/config-contract.md`, `# Workshop API — ${environment}

只记录无秘密部署覆盖层和 secrets manager 引用。数据库口令、签名密钥、OSS 凭据、Feedback API Key 等不得写入本目录的 tracked 文件。
`);
  writeTracked(opsRoot, `environments/${environment}/todo-web/config-contract.md`, `# Todo Web — ${environment}

公开应用通过 \`VITE_FEEDBACK_API_KEY\` 等显式环境契约接收部署配置。tracked 文件只允许记录变量名、目标环境和秘密引用，不允许记录值。
`);
  writeTracked(opsRoot, `environments/${environment}/feedback-console/config-contract.md`, `# Feedback Console — ${environment}

只记录 Feedback Console 的公开 endpoint、Project ID、功能开关和 secrets manager 引用。Feedback SDK API Key、OSS 凭据及客户专属覆盖值不得写入 tracked 文件。
`);
  writeTracked(opsRoot, `environments/${environment}/feedback-sdk-web/config-contract.md`, `# Feedback Web SDK — ${environment}

只记录 SDK gateway/public-base 契约和秘密引用。API Key、会话令牌及客户专属配置必须由部署环境或受控 secrets manager 显式提供。
`);
  writeTracked(opsRoot, `environments/${environment}/arcorbit/config-contract.md`, `# ArcOrbit — ${environment}

ArcOrbit 产品反馈由 \`ARCORBIT_FEEDBACK_PROJECT_ID\` 和 \`ARCORBIT_FEEDBACK_API_KEY\` 显式配置。tracked 文件只记录变量名和秘密引用，不记录实际值。
`);
}

const feedbackSource = fs.readFileSync(path.join(args["todo-web"], "frontend/src/lib/feedbackSdk.ts"), "utf8");
const feedbackMatch = feedbackSource.match(/const\s+FEEDBACK_API_KEY\s*=\s*["']([^"']{12,})["']/);
if (!feedbackMatch) throw new Error("Todo Web Feedback API key assignment was not found; refusing partial extraction");
writeSecret(opsRoot, "secrets/imported/todo-web-feedback.env", `VITE_FEEDBACK_API_KEY=${feedbackMatch[1]}\n`);

const apiSource = args["workshop-api"];
const documentPaths = [
  "USER_GUIDE.md",
  "docs/feedback-v2-deployment-runbook.md",
  "docs/feedback-v2-notifications-unread.md",
  "deploy/prod/env.production.example",
  "deploy/prod/env.workshop.production.example"
];
const documentValues = documentPaths.flatMap((file) => extractAssignments(file, apiSource));
writeSecret(opsRoot, "secrets/quarantine/workshop-api-doc-values.json", `${JSON.stringify({ extracted_at: new Date().toISOString(), values: documentValues }, null, 2)}\n`);

const webSource = path.join(apiSource, "web");
assertDirectory(webSource, "Workshop API web quarantine source");
copyQuarantine(webSource, path.join(opsRoot, "secrets/quarantine/workshop-api-web"));

run("git", ["init", "--initial-branch=main", opsRoot]);
const ignored = [
  "secrets/imported/todo-web-feedback.env",
  "secrets/quarantine/workshop-api-doc-values.json",
  "secrets/quarantine/workshop-api-web/index.html"
];
for (const relative of ignored) {
  run("git", ["-C", opsRoot, "check-ignore", "--quiet", relative]);
}
const trackedSecrets = run("git", ["-C", opsRoot, "ls-files", "secrets"]);
if (trackedSecrets && trackedSecrets !== "secrets/README.md") {
  throw new Error("Unexpected tracked material exists below secrets/");
}

console.log(JSON.stringify({
  schema_version: "arckit-ops-bootstrap/v1",
  ops_root: opsRoot,
  tracked_policy_files: 20,
  ignored_secret_targets_verified: ignored.length,
  extracted_secret_values: 1 + documentValues.length,
  secret_values_emitted: false,
  git_initialized: true
}, null, 2));
