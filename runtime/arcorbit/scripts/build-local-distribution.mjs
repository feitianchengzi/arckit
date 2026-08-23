import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const runtimeRoot = path.resolve(path.dirname(scriptPath), "..");
const repositoryRoot = path.resolve(runtimeRoot, "..", "..");

const HOST_BUILDS = new Map([
  ["darwin:arm64", { target: "macos-arm64", platform: "mac", packageScript: "package:mac:arm64", artifactExtension: ".dmg", artifactSuffix: "-mac-arm64.dmg" }],
  ["darwin:x64", { target: "macos-x64", platform: "mac", packageScript: "package:mac:x64", artifactExtension: ".dmg", artifactSuffix: "-mac-x64.dmg" }],
  ["win32:x64", { target: "windows-x64", platform: "win", packageScript: "package:win:x64", artifactExtension: ".exe", artifactSuffix: "-win-x64.exe" }],
  ["linux:x64", { target: "linux-x64", platform: "linux", packageScript: "package:linux:x64", artifactExtension: ".AppImage", artifactSuffix: "-linux-x64.AppImage" }]
]);

export function resolveHostBuild(platform = process.platform, arch = process.arch) {
  const host = HOST_BUILDS.get(`${platform}:${arch}`);
  if (!host) throw new Error(`Unsupported local Runtime build host: ${platform}/${arch}. Supported hosts are macOS arm64/x64, Windows x64, and Linux x64.`);
  return { ...host };
}

export function createLocalBuildPlan({
  runtimeDirectory = runtimeRoot,
  repositoryDirectory = repositoryRoot,
  arcforgeDirectory = path.resolve(repositoryDirectory, "..", "arcforge"),
  runtimeVersion,
  providerVersion,
  buildId,
  platform = process.platform,
  arch = process.arch,
  resourcesOnly = false
}) {
  assertVersion(runtimeVersion, "Runtime package version");
  assertVersion(providerVersion, "ArcForge package version");
  assertBuildId(buildId);
  const host = resolveHostBuild(platform, arch);
  const localProviderVersion = `${providerVersion}-local.${buildId}`;
  const providerReleaseTag = `local/arcorbit-${buildId}`;
  const runtimeReleaseTag = `local/v${runtimeVersion}-${buildId}`;
  const providerOutputRoot = path.join(arcforgeDirectory, "release", "provider-release");
  const providerArtifactName = `arcforge-provider-${localProviderVersion}.tgz`;
  return {
    schemaVersion: "arckit-local-build-plan/v1",
    buildId,
    host,
    resourcesOnly,
    signing: "disabled",
    roots: {
      repository: repositoryDirectory,
      runtime: runtimeDirectory,
      arcforge: arcforgeDirectory
    },
    provider: {
      version: localProviderVersion,
      releaseTag: providerReleaseTag,
      outputRoot: providerOutputRoot,
      archive: path.join(providerOutputRoot, providerArtifactName),
      manifest: path.join(providerOutputRoot, "arcforge-provider.manifest.json")
    },
    runtime: {
      version: runtimeVersion,
      releaseTag: runtimeReleaseTag,
      buildRoot: path.join(runtimeDirectory, "dist-package"),
      resourcesRoot: path.join(runtimeDirectory, "dist-package", "resources"),
      releaseRoot: path.join(runtimeDirectory, "release")
    }
  };
}

export function parseArgs(args) {
  const result = { arcforgeRoot: "", buildId: "", resourcesOnly: false, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (key === "--arcforge-root") result.arcforgeRoot = requiredValue(args, ++index, key);
    else if (key === "--build-id") result.buildId = requiredValue(args, ++index, key);
    else if (key === "--resources-only") result.resourcesOnly = true;
    else if (key === "--help" || key === "-h") result.help = true;
    else throw new Error(`Unknown argument: ${key}`);
  }
  if (result.buildId) assertBuildId(result.buildId);
  return result;
}

export function isCurrentLocalArtifact(name, plan) {
  const marker = `-${plan.runtime.version}-local.${plan.buildId}-`;
  return name.includes(marker) && name.endsWith(plan.host.artifactSuffix);
}

export function packagedRendererSmokeExecutable(releaseRoot, platform) {
  const root = path.resolve(releaseRoot);
  if (platform === "mac") return path.join(root, "mac", "arcorbit.app", "Contents", "MacOS", "arcorbit");
  if (platform === "win") return path.join(root, "win-unpacked", "arcorbit.exe");
  if (platform === "linux") return path.join(root, "linux-unpacked", "arcorbit");
  throw new Error(`Unsupported packaged Renderer smoke platform: ${platform || "<missing>"}.`);
}

export async function runLocalBuild(options = {}) {
  const arcforgeDirectory = path.resolve(options.arcforgeRoot || path.resolve(repositoryRoot, "..", "arcforge"));
  const runtimePackage = await readPackage(runtimeRoot, "@arckit/arcorbit");
  const arcforgePackage = await readPackage(arcforgeDirectory, "arcforge");
  const buildId = options.buildId || createBuildId();
  const plan = createLocalBuildPlan({
    runtimeVersion: runtimePackage.version,
    providerVersion: arcforgePackage.version,
    buildId,
    arcforgeDirectory,
    resourcesOnly: Boolean(options.resourcesOnly)
  });
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const providerCommit = await gitRevision(arcforgeDirectory);
  const arckitCommit = await gitRevision(repositoryRoot);

  logPlan(plan);
  await run(npm, ["run", "check"], arcforgeDirectory);
  await run(process.execPath, ["--test", "--test-name-pattern=embedded provider", "tests/provider.test.mjs"], arcforgeDirectory);
  await run(npm, [
    "run", "package:provider", "--",
    "--version", plan.provider.version,
    "--commit", providerCommit,
    "--tag", plan.provider.releaseTag
  ], arcforgeDirectory);

  const providerManifest = JSON.parse(await readFile(plan.provider.manifest, "utf8"));
  const providerBytes = await readFile(plan.provider.archive);
  const providerSha256 = sha256(providerBytes);
  assertProviderOutput(plan, providerManifest, providerSha256);

  await run(npm, ["run", "check"], runtimeRoot);
  await run(process.execPath, [
    "scripts/prepare-distribution.mjs",
    "--release-tag", plan.runtime.releaseTag,
    "--provider-archive", plan.provider.archive,
    "--provider-manifest", plan.provider.manifest,
    "--provider-sha256", providerSha256,
    "--provider-release", plan.provider.releaseTag,
    "--provider-repository", "local/arcforge",
    "--target", plan.host.target,
    "--signing", plan.signing,
    "--source-commit", arckitCommit,
    "--repository", "local/arckit",
    "--workflow", "local-build",
    "--run-id", plan.buildId,
    "--run-attempt", "1",
    "--source-ref", plan.runtime.releaseTag
  ], runtimeRoot);
  await run(process.execPath, [
    "scripts/build-package-config.mjs",
    "--signing", plan.signing,
    "--notarize", "false",
    "--platform", plan.host.platform
  ], runtimeRoot);
  await run(npm, ["run", "smoke:distribution"], runtimeRoot);

  let runtimeArtifacts = [];
  if (!plan.resourcesOnly) {
    await run(npm, ["run", plan.host.packageScript], runtimeRoot);
    await runPackagedRendererSmoke(plan);
    runtimeArtifacts = (await readdir(plan.runtime.releaseRoot, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && isCurrentLocalArtifact(entry.name, plan))
      .map((entry) => path.join(plan.runtime.releaseRoot, entry.name))
      .sort();
    if (!runtimeArtifacts.length) throw new Error(`Runtime packaging completed without a ${plan.host.artifactExtension} artifact in ${plan.runtime.releaseRoot}.`);
  }

  const result = {
    schemaVersion: "arckit-local-build-result/v1",
    mode: plan.resourcesOnly ? "resources-only" : "installer",
    buildId: plan.buildId,
    target: plan.host.target,
    signing: plan.signing,
    provider: {
      archive: plan.provider.archive,
      manifest: plan.provider.manifest,
      version: plan.provider.version,
      sha256: providerSha256,
      buildCommit: providerCommit
    },
    runtime: {
      resourcesRoot: plan.runtime.resourcesRoot,
      releaseRoot: plan.runtime.releaseRoot,
      artifacts: runtimeArtifacts,
      sourceCommit: arckitCommit
    },
    governance: "Local validation artifact only; not a governed release artifact."
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write([
      "Build the sibling ArcForge provider and ArcOrbit for local validation.",
      "",
      "Usage: npm run package:local -- [--arcforge-root <path>] [--build-id <id>] [--resources-only]",
      "",
      "The default ArcForge root is ../../../arcforge relative to this Runtime package.",
      "The default mode builds the current host's unsigned installer; --resources-only stops after resource assembly and smoke verification.",
      ""
    ].join("\n"));
    return;
  }
  await runLocalBuild(options);
}

async function readPackage(root, expectedName) {
  const packagePath = path.join(root, "package.json");
  const pkg = JSON.parse(await readFile(packagePath, "utf8").catch((error) => {
    if (error?.code === "ENOENT") throw new Error(`Expected ${expectedName} package at ${packagePath}.`);
    throw error;
  }));
  if (pkg.name !== expectedName) throw new Error(`Expected package ${expectedName} at ${root}, received ${pkg.name || "<missing>"}.`);
  assertVersion(pkg.version, `${expectedName} package version`);
  return pkg;
}

async function gitRevision(root) {
  const revision = (await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" })).stdout.trim();
  const status = (await execFileAsync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root, encoding: "utf8" })).stdout.trim();
  return status ? `${revision}-dirty` : revision;
}

async function run(executable, args, cwd) {
  process.stdout.write(`[local-build] ${cwd}\n[local-build] ${displayCommand(executable, args)}\n`);
  const { stdout, stderr } = await execFileAsync(executable, args, { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

async function runPackagedRendererSmoke(plan) {
  const executable = packagedRendererSmokeExecutable(plan.runtime.releaseRoot, plan.host.platform);
  await access(executable);
  const userData = await mkdtemp(path.join(os.tmpdir(), "arcorbit-packaged-renderer-smoke-"));
  try {
    process.stdout.write(`[local-build] packaged Renderer smoke: ${executable}\n`);
    const { stdout, stderr } = await execFileAsync(executable, ["--renderer-load-smoke"], {
      cwd: runtimeRoot,
      encoding: "utf8",
      env: { ...process.env, ARCORBIT_RENDERER_SMOKE_USER_DATA: userData },
      maxBuffer: 1024 * 1024,
      timeout: 20_000
    });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } finally {
    await rm(userData, { recursive: true, force: true });
  }
}

function assertProviderOutput(plan, manifest, actualSha256) {
  if (manifest.schemaVersion !== "arcforge-provider-package/v1") throw new Error(`Unexpected provider manifest schema: ${manifest.schemaVersion || "<missing>"}.`);
  if (manifest.providerVersion !== plan.provider.version) throw new Error(`Provider manifest version ${manifest.providerVersion} does not match ${plan.provider.version}.`);
  if (manifest.releaseTag !== plan.provider.releaseTag) throw new Error(`Provider manifest release tag ${manifest.releaseTag} does not match ${plan.provider.releaseTag}.`);
  if (manifest.artifactName !== path.basename(plan.provider.archive)) throw new Error("Provider manifest does not name the expected local archive.");
  if (manifest.artifactSha256 !== actualSha256) throw new Error("Provider manifest digest does not match the built local archive.");
}

function assertVersion(value, label) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value || "")) throw new Error(`${label} is not a supported semantic version: ${value || "<missing>"}.`);
}

function assertBuildId(value) {
  const validCharacters = /^[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*$/.test(value || "");
  const validNumericIdentifiers = String(value || "").split(".").every((identifier) => !/^\d+$/.test(identifier) || identifier === "0" || !identifier.startsWith("0"));
  if (!validCharacters || !validNumericIdentifiers) throw new Error(`Invalid local build id: ${value || "<missing>"}. Use SemVer prerelease identifiers without leading zeroes in numeric segments.`);
}

function createBuildId(now = new Date()) {
  return now.toISOString().replace(/\D/g, "").slice(0, 14);
}

function requiredValue(args, index, key) {
  const value = args[index];
  if (!value || value.startsWith("--")) throw new Error(`${key} requires a value.`);
  return value;
}

function displayCommand(executable, args) {
  return [executable, ...args].map((value) => (/^[0-9A-Za-z_./:@=-]+$/.test(value) ? value : JSON.stringify(value))).join(" ");
}

function logPlan(plan) {
  process.stdout.write(`${JSON.stringify({
    schemaVersion: plan.schemaVersion,
    notice: "Local validation build only; governed release workflows are unchanged.",
    buildId: plan.buildId,
    target: plan.host.target,
    mode: plan.resourcesOnly ? "resources-only" : "installer",
    arcforgeRoot: plan.roots.arcforge,
    providerVersion: plan.provider.version,
    providerReleaseTag: plan.provider.releaseTag,
    runtimeReleaseTag: plan.runtime.releaseTag,
    signing: plan.signing
  }, null, 2)}\n`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
