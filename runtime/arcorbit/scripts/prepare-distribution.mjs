import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { execLocalTar } from "./local-tar.mjs";

const execFileAsync = promisify(execFile);
const REQUIRED_PROVIDER_CAPABILITIES = ["declared-shared-assets/v1", "source-upgrade-recovery/v1", "conflict-reinstall-recovery/v1"];
const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(runtimeRoot, "..", "..");
const options = parseArgs(process.argv.slice(2));
for (const required of ["releaseTag", "providerArchive", "providerManifest", "providerSha256", "providerRelease", "target", "signing"]) {
  if (!options[required]) throw new Error(`--${kebab(required)} is required.`);
}
if (!/^[a-f0-9]{64}$/.test(options.providerSha256)) throw new Error("--provider-sha256 must be a lowercase SHA-256 digest.");
const release = parseReleaseTag(options.releaseTag);
const runtimePackage = JSON.parse(await readFile(path.join(runtimeRoot, "package.json"), "utf8"));
if (runtimePackage.version !== release.productVersion) throw new Error(`Runtime package version ${runtimePackage.version} does not match ${release.productVersion}.`);
const providerArchive = path.resolve(options.providerArchive);
const providerBytes = await readFile(providerArchive);
const actualProviderSha = sha256(providerBytes);
if (!safeEqual(actualProviderSha, options.providerSha256)) throw new Error(`ArcForge provider SHA-256 mismatch: expected ${options.providerSha256}, received ${actualProviderSha}.`);
const externalProviderManifest = JSON.parse(await readFile(path.resolve(options.providerManifest), "utf8"));
if (externalProviderManifest.artifactName !== path.basename(providerArchive) || externalProviderManifest.artifactSha256 !== actualProviderSha) throw new Error("ArcForge provider release manifest does not bind the selected archive and digest.");
if (externalProviderManifest.releaseTag !== options.providerRelease) throw new Error(`ArcForge provider manifest release tag ${externalProviderManifest.releaseTag} does not match ${options.providerRelease}.`);
assertProviderCapabilities(externalProviderManifest, "release");

const buildRoot = path.resolve(options.buildRoot || path.join(runtimeRoot, "dist-package"));
const resourcesRoot = path.join(buildRoot, "resources");
const provisioningRoot = path.join(resourcesRoot, "provisioning");
const providerRoot = path.join(provisioningRoot, "arcforge-provider");
const payloadRoot = path.join(provisioningRoot, "arckit-skills");
const trustedRoot = path.join(resourcesRoot, "arcorbit", "trusted-capabilities");
await rm(resourcesRoot, { recursive: true, force: true });
await mkdir(resourcesRoot, { recursive: true });

const extractRoot = await mkdtemp(path.join(os.tmpdir(), "arckit-provider-"));
try {
  const stagedProviderArchive = path.join(extractRoot, path.basename(providerArchive));
  await writeFile(stagedProviderArchive, providerBytes);
  await validateTar(stagedProviderArchive);
  await execLocalTar(stagedProviderArchive, ["-xzf"]);
  const extractedPackage = path.join(extractRoot, "package");
  await assertNoLinks(extractedPackage);
  await cp(extractedPackage, providerRoot, { recursive: true });
} finally {
  await rm(extractRoot, { recursive: true, force: true });
}
const providerManifest = JSON.parse(await readFile(path.join(providerRoot, "arcforge-provider.manifest.json"), "utf8"));
if (providerManifest.apiVersion !== "arcforge-embedded-provider/v1") throw new Error(`Unsupported provider API: ${providerManifest.apiVersion}`);
if (providerManifest.providerVersion !== externalProviderManifest.providerVersion || providerManifest.buildCommit !== externalProviderManifest.buildCommit) throw new Error("ArcForge provider internal and release manifests disagree.");
assertProviderCapabilities(providerManifest, "embedded");

const { skillPaths, sharedAssetPaths } = await discoverPayloadPaths();
for (const relativePath of [...skillPaths, ...sharedAssetPaths]) {
  await cp(path.join(repositoryRoot, relativePath), path.join(payloadRoot, relativePath), { recursive: true });
}
await cp(path.join(repositoryRoot, "arcforge.skill-project.json"), path.join(payloadRoot, "arcforge.skill-project.json"));
await writeFile(path.join(payloadRoot, "arcforge.config.json"), `${JSON.stringify({
  version: 1,
  sourceDir: ".",
  profiles: [{ name: "arckit-runtime", description: "Complete Arckit skill payload supplied by ArcOrbit.", skills: ["*"], targets: ["codex"] }]
}, null, 2)}\n`);
const payloadFiles = await fileManifest(payloadRoot, ["payload.manifest.json"]);
const payloadManifest = {
  schemaVersion: "arckit-skill-payload/v1",
  profile: "arckit-runtime",
  sourceCommit: options.sourceCommit || await gitCommit(repositoryRoot),
  sourceManifestDigest: sha256(await readFile(path.join(repositoryRoot, "arcforge.skill-project.json"))),
  skillPaths,
  sharedAssetPaths,
  files: payloadFiles,
  payloadDigest: digestManifest(payloadFiles)
};
await writeFile(path.join(payloadRoot, "payload.manifest.json"), `${JSON.stringify(payloadManifest, null, 2)}\n`);

for (const skillName of ["using-arckit", "arckit-development-ledger"]) {
  await cp(path.join(repositoryRoot, "entry", "skills", skillName), path.join(trustedRoot, skillName), { recursive: true });
}
const trustedFiles = await fileManifest(trustedRoot);
const lock = {
  schemaVersion: "arckit-runtime-distribution/v1",
  runtime: { productVersion: release.productVersion, packageVersion: release.packageVersion, channel: release.channel, buildLabel: release.buildLabel, target: options.target },
  arckit: { repository: options.repository || "feitianchengzi/arckit", releaseTag: options.releaseTag, commit: payloadManifest.sourceCommit },
  trustedCapabilities: { digest: digestManifest(trustedFiles), files: trustedFiles },
  skillPayload: { profile: payloadManifest.profile, sourceManifestDigest: payloadManifest.sourceManifestDigest, payloadDigest: payloadManifest.payloadDigest, skillCount: skillPaths.length, sharedAssetCount: sharedAssetPaths.length },
  arcforgeProvider: { repository: options.providerRepository || "feitianchengzi/arcforge", releaseTag: options.providerRelease, apiVersion: providerManifest.apiVersion, providerVersion: providerManifest.providerVersion, buildCommit: providerManifest.buildCommit, capabilities: providerManifest.capabilities, artifactName: path.basename(providerArchive), sha256: actualProviderSha },
  toolchain: { electron: runtimePackage.devDependencies?.electron ?? "", electronBuilder: runtimePackage.devDependencies?.["electron-builder"] ?? "", node: process.version },
  build: { repository: options.repository || "feitianchengzi/arckit", workflow: options.workflow || "local", runId: options.runId || "local", runAttempt: options.runAttempt || "1", sourceRef: options.sourceRef || options.releaseTag },
  signing: { requestedMode: options.signing },
  artifact: { expectedNamePattern: `ArcOrbit-${release.packageVersion}-${options.target}.*`, sha256: null, attestation: "external distribution-attestation.json binds the final artifact digest to this embedded lock digest" }
};
const lockPath = path.join(provisioningRoot, "distribution-lock.json");
await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
const resourceFiles = await fileManifest(resourcesRoot, ["provisioning/checksums.txt"]);
await writeFile(path.join(provisioningRoot, "checksums.txt"), resourceFiles.map((item) => `${item.sha256}  ${item.path}`).join("\n") + "\n");
console.log(JSON.stringify({ resourcesRoot, lockPath, embeddedLockDigest: sha256(await readFile(lockPath)), payloadDigest: payloadManifest.payloadDigest, skillCount: skillPaths.length, sharedAssetCount: sharedAssetPaths.length }, null, 2));

async function discoverPayloadPaths() {
  const skillPaths = [];
  const sharedAssetPaths = [];
  for (const domain of await readdir(repositoryRoot, { withFileTypes: true })) {
    if (!domain.isDirectory() || domain.name.startsWith(".") || ["arckit", "runtime", "node_modules"].includes(domain.name)) continue;
    const skillsRoot = path.join(repositoryRoot, domain.name, "skills");
    for (const entry of await readdir(skillsRoot, { withFileTypes: true }).catch(() => [])) {
      if (!entry.isDirectory()) continue;
      const relativePath = path.posix.join(domain.name, "skills", entry.name);
      try {
        await readFile(path.join(repositoryRoot, relativePath, "SKILL.md"));
        skillPaths.push(relativePath);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        sharedAssetPaths.push(relativePath);
      }
    }
  }
  if (!skillPaths.includes("entry/skills/using-arckit") || !skillPaths.includes("entry/skills/arckit-development-ledger")) throw new Error("Required Runtime skills are absent from the payload.");
  return { skillPaths: skillPaths.sort(), sharedAssetPaths: sharedAssetPaths.sort() };
}

async function validateTar(archive) {
  const names = (await execLocalTar(archive, ["-tzf"])).stdout.split(/\r?\n/).filter(Boolean);
  if (!names.length) throw new Error("Provider archive is empty.");
  for (const name of names) {
    const normalized = name.replace(/\\/g, "/");
    if (!normalized.startsWith("package/") || normalized.startsWith("/") || normalized.split("/").some((segment) => segment === "..")) throw new Error(`Unsafe provider archive entry: ${name}`);
  }
  const verbose = (await execLocalTar(archive, ["-tvzf"])).stdout.split(/\r?\n/).filter(Boolean);
  if (verbose.some((line) => !["-", "d"].includes(line.trimStart()[0]))) throw new Error("Provider archive contains links or unsupported entry types.");
}

async function assertNoLinks(root) {
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      const stats = await lstat(target);
      if (stats.isSymbolicLink()) throw new Error(`Provider package contains a symbolic link: ${target}`);
      if (stats.isDirectory()) await walk(target);
    }
  }
  await walk(root);
}

async function fileManifest(root, excluded = []) {
  const exclude = new Set(excluded);
  const files = [];
  async function walk(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.isFile()) {
        const relativePath = path.relative(root, target).replaceAll(path.sep, "/");
        if (!exclude.has(relativePath)) files.push({ path: relativePath, sha256: sha256(await readFile(target)) });
      }
    }
  }
  await walk(root);
  return files;
}

function digestManifest(files) { return sha256(JSON.stringify(files)); }
function assertProviderCapabilities(manifest, origin) {
  const capabilities = new Set(Array.isArray(manifest.capabilities) ? manifest.capabilities : []);
  const missing = REQUIRED_PROVIDER_CAPABILITIES.filter((capability) => !capabilities.has(capability));
  if (missing.length) throw new Error(`ArcForge ${origin} provider is missing required capabilities: ${missing.join(", ")}`);
}
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function safeEqual(left, right) { return left.length === right.length && crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right)); }
async function gitCommit(root) { return (await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: root })).stdout.trim(); }
function parseReleaseTag(tag) { let match = /^local\/v(\d+\.\d+\.\d+)-([0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)$/.exec(tag); if (match) return { channel: "local", productVersion: match[1], buildLabel: match[2], packageVersion: `${match[1]}-local.${match[2]}` }; match = /^tf\/v(\d+\.\d+\.\d+)-b([1-9]\d*)$/.exec(tag); if (match) return { channel: "tf", productVersion: match[1], buildLabel: `b${match[2]}`, packageVersion: `${match[1]}-tf.b${match[2]}` }; match = /^beta\/v(\d+\.\d+\.\d+)-rc([1-9]\d*)$/.exec(tag); if (match) return { channel: "beta", productVersion: match[1], buildLabel: `rc${match[2]}`, packageVersion: `${match[1]}-beta.rc${match[2]}` }; match = /^appstore\/v(\d+\.\d+\.\d+)$/.exec(tag); if (match) return { channel: "appstore", productVersion: match[1], buildLabel: "stable", packageVersion: match[1] }; throw new Error(`Invalid release tag: ${tag}`); }
function kebab(value) { return value.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`); }
function parseArgs(args) { const result = {}; for (let index = 0; index < args.length; index += 1) { const key = args[index]; const value = args[index + 1]; if (key === "--release-tag") result.releaseTag = value; else if (key === "--provider-archive") result.providerArchive = value; else if (key === "--provider-manifest") result.providerManifest = value; else if (key === "--provider-sha256") result.providerSha256 = value; else if (key === "--provider-release") result.providerRelease = value; else if (key === "--provider-repository") result.providerRepository = value; else if (key === "--target") result.target = value; else if (key === "--signing") result.signing = value; else if (key === "--source-commit") result.sourceCommit = value; else if (key === "--repository") result.repository = value; else if (key === "--workflow") result.workflow = value; else if (key === "--run-id") result.runId = value; else if (key === "--run-attempt") result.runAttempt = value; else if (key === "--source-ref") result.sourceRef = value; else if (key === "--build-root") result.buildRoot = value; else continue; index += 1; } return result; }
