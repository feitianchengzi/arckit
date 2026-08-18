import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { loadRuntimeCapabilities, resolveCapabilityEntrypoint } from "../src/capability-registry.mjs";

const execFileAsync = promisify(execFile);
const runtimeRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url));

test("package exposes the ArcOrbit identity and the legacy CLI alias through one entrypoint", async () => {
  const manifest = JSON.parse(await readFile(path.join(runtimeRoot, "package.json"), "utf8"));
  assert.equal(manifest.name, "@arckit/arcorbit");
  assert.equal(manifest.bin.arcorbit, "./bin/arcorbit.mjs");
  assert.equal(manifest.bin["arckit-runtime"], manifest.bin.arcorbit);
});

test("distribution assembly binds provider, skills, trusted capabilities, config, and external artifact attestation", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "arckit-distribution-"));
  try {
    const packageRoot = path.join(fixture, "package");
    await mkdir(path.join(packageRoot, "dist", "provider"), { recursive: true });
    await mkdir(path.join(packageRoot, "skills", "arcforge-on-demand"), { recursive: true });
    const internalManifest = { schemaVersion: "arcforge-provider-package/v1", apiVersion: "arcforge-embedded-provider/v1", providerVersion: "0.1.0-tf.b1", buildCommit: "a".repeat(40), releaseTag: "tf/v0.1.0-b1", capabilities: ["declared-shared-assets/v1", "source-upgrade-recovery/v1", "conflict-reinstall-recovery/v1"], entrypoint: "dist/provider/index.js", loaderPath: "skills/arcforge-on-demand" };
    await writeFile(path.join(packageRoot, "arcforge-provider.manifest.json"), `${JSON.stringify(internalManifest)}\n`);
    await writeFile(path.join(packageRoot, "dist", "provider", "index.js"), "export const provider = true;\n");
    await writeFile(path.join(packageRoot, "skills", "arcforge-on-demand", "SKILL.md"), "---\nname: arcforge-on-demand\ndescription: fixture\n---\n");
    await writeFile(path.join(packageRoot, "package.json"), `${JSON.stringify({ name: "@arcforge/embedded-provider", version: internalManifest.providerVersion, type: "module" })}\n`);
    const archive = path.join(fixture, "arcforge-provider-0.1.0-tf.b1.tgz");
    await execFileAsync("tar", ["-czf", archive, "package"], { cwd: fixture });
    const archiveSha = sha256(await readFile(archive));
    const externalManifestPath = path.join(fixture, "arcforge-provider.manifest.json");
    await writeFile(externalManifestPath, `${JSON.stringify({ ...internalManifest, artifactName: path.basename(archive), artifactSha256: archiveSha })}\n`);

    const incompatibleManifestPath = path.join(fixture, "arcforge-provider-incompatible.manifest.json");
    await writeFile(incompatibleManifestPath, `${JSON.stringify({ ...internalManifest, capabilities: [], artifactName: path.basename(archive), artifactSha256: archiveSha })}\n`);
    await assert.rejects(execFileAsync(process.execPath, [
      "scripts/prepare-distribution.mjs", "--release-tag", "tf/v0.1.0-b1", "--provider-archive", archive,
      "--provider-manifest", incompatibleManifestPath, "--provider-sha256", archiveSha, "--provider-release", "tf/v0.1.0-b1",
      "--target", "macos-arm64", "--signing", "disabled", "--build-root", path.join(fixture, "incompatible-dist-package")
    ], { cwd: runtimeRoot }), /missing required capabilities/);

    const packageBuildRoot = path.join(fixture, "dist-package");
    await execFileAsync(process.execPath, [
      "scripts/prepare-distribution.mjs", "--release-tag", "tf/v0.1.0-b1", "--provider-archive", archive,
      "--provider-manifest", externalManifestPath, "--provider-sha256", archiveSha, "--provider-release", "tf/v0.1.0-b1",
      "--provider-repository", "feitianchengzi/arcforge", "--target", "macos-arm64", "--signing", "disabled", "--source-commit", "b".repeat(40), "--build-root", packageBuildRoot
    ], { cwd: runtimeRoot });
    await execFileAsync(process.execPath, ["scripts/build-package-config.mjs", "--signing", "disabled", "--notarize", "false", "--platform", "mac", "--build-root", packageBuildRoot], { cwd: runtimeRoot });

    const resourcesRoot = path.join(packageBuildRoot, "resources");
    const lockPath = path.join(resourcesRoot, "provisioning", "distribution-lock.json");
    const lock = JSON.parse(await readFile(lockPath, "utf8"));
    const payloadRoot = path.join(resourcesRoot, "provisioning", "arckit-skills");
    const payloadManifest = JSON.parse(await readFile(path.join(payloadRoot, "payload.manifest.json"), "utf8"));
    assert.equal(lock.arcforgeProvider.sha256, archiveSha);
    assert.deepEqual(lock.arcforgeProvider.capabilities, ["declared-shared-assets/v1", "source-upgrade-recovery/v1", "conflict-reinstall-recovery/v1"]);
    assert.equal(lock.skillPayload.skillCount >= 13, true);
    assert.deepEqual(payloadManifest.sharedAssetPaths, ["definition/skills/_arckit_shared"]);
    assert.equal(lock.skillPayload.sharedAssetCount, payloadManifest.sharedAssetPaths.length);
    assert.equal(payloadManifest.files.some((item) => item.path === "definition/skills/_arckit_shared/case-gap-contract.md"), true);
    assert.equal(payloadManifest.files.some((item) => item.path === "definition/skills/_arckit_shared/content-spec.md"), true);
    assert.equal(
      await readFile(path.join(payloadRoot, "definition", "skills", "_arckit_shared", "case-gap-contract.md"), "utf8"),
      await readFile(path.join(repositoryRoot, "definition", "skills", "_arckit_shared", "case-gap-contract.md"), "utf8")
    );
    assert.equal(lock.artifact.sha256, null);
    assert.match(lock.artifact.attestation, /external/);
    const config = JSON.parse(await readFile(path.join(packageBuildRoot, "electron-builder.generated.json"), "utf8"));
    assert.equal(config.mac.identity, null);
    assert.equal(config.forceCodeSigning, false);
    assert.equal(config.mac.entitlements, "build/entitlements.mac.plist");
    assert.equal(config.mac.entitlementsInherit, "build/entitlements.mac.inherit.plist");
    assert.equal(config.appId, "com.feitianchengzi.arckit.runtime");
    assert.equal(config.productName, "ArcOrbit");
    assert.equal(config.executableName, "arcorbit");
    assert.equal(config.afterPack, "scripts/flip-electron-fuses.cjs");
    assert.match(config.artifactName, /^ArcOrbit-/);
    assert.deepEqual(config.extraResources.map((item) => item.to), ["arcorbit", "provisioning"]);

    const localBuildRoot = path.join(fixture, "local-dist-package");
    await execFileAsync(process.execPath, [
      "scripts/prepare-distribution.mjs", "--release-tag", "local/v0.1.0-dev.1", "--provider-archive", archive,
      "--provider-manifest", externalManifestPath, "--provider-sha256", archiveSha, "--provider-release", "tf/v0.1.0-b1",
      "--provider-repository", "local/arcforge", "--target", "macos-arm64", "--signing", "disabled", "--source-commit", "dirty-local-source", "--repository", "local/arckit", "--workflow", "local-build", "--build-root", localBuildRoot
    ], { cwd: runtimeRoot });
    const localLock = JSON.parse(await readFile(path.join(localBuildRoot, "resources", "provisioning", "distribution-lock.json"), "utf8"));
    assert.equal(localLock.runtime.channel, "local");
    assert.equal(localLock.runtime.packageVersion, "0.1.0-local.dev.1");
    assert.equal(localLock.build.workflow, "local-build");
    assert.equal(localLock.signing.requestedMode, "disabled");

    await execFileAsync(process.execPath, ["scripts/build-package-config.mjs", "--signing", "required", "--notarize", "true", "--platform", "mac", "--build-root", packageBuildRoot], { cwd: runtimeRoot });
    const requiredMacConfig = JSON.parse(await readFile(path.join(packageBuildRoot, "electron-builder.generated.json"), "utf8"));
    assert.equal(requiredMacConfig.forceCodeSigning, true);
    assert.equal(requiredMacConfig.mac.hardenedRuntime, true);
    assert.equal(requiredMacConfig.mac.notarize, true);
    assert.equal(Object.hasOwn(requiredMacConfig.mac, "identity"), false);
    assert.equal(requiredMacConfig.dmg.sign, true);

    await execFileAsync(process.execPath, ["scripts/build-package-config.mjs", "--signing", "required", "--notarize", "false", "--platform", "win", "--build-root", packageBuildRoot], { cwd: runtimeRoot });
    const requiredWindowsConfig = JSON.parse(await readFile(path.join(packageBuildRoot, "electron-builder.generated.json"), "utf8"));
    assert.equal(requiredWindowsConfig.forceCodeSigning, true);
    assert.equal(Object.hasOwn(requiredWindowsConfig.win, "sign"), false);

    await execFileAsync(process.execPath, ["scripts/build-package-config.mjs", "--signing", "disabled", "--notarize", "false", "--platform", "linux", "--build-root", packageBuildRoot], { cwd: runtimeRoot });
    const unsignedLinuxConfig = JSON.parse(await readFile(path.join(packageBuildRoot, "electron-builder.generated.json"), "utf8"));
    assert.equal(unsignedLinuxConfig.forceCodeSigning, false);
    assert.deepEqual(unsignedLinuxConfig.linux.target, ["AppImage"]);

    const trustedRoot = path.join(resourcesRoot, "arcorbit", "trusted-capabilities");
    const capabilities = await loadRuntimeCapabilities({ repositoryCapabilityRoot: trustedRoot, projectRoot: fixture });
    assert.deepEqual(capabilities.map((item) => item.id), ["arckit-development-ledger", "using-arckit"]);
    assert.match(resolveCapabilityEntrypoint(capabilities[0], "loop_snapshot"), /trusted-capabilities.*arckit-development-ledger.*loop-snapshot\.mjs/);

    const releaseRoot = path.join(fixture, "release");
    await mkdir(releaseRoot, { recursive: true });
    const artifactName = "ArcOrbit-0.1.0-tf.b1-tf-b1-mac-arm64.dmg";
    await writeFile(path.join(releaseRoot, artifactName), "installer fixture");
    await execFileAsync(process.execPath, ["scripts/finalize-package-artifacts.mjs", "--release-root", releaseRoot, "--embedded-lock", lockPath, "--signing-result", "disabled"], { cwd: runtimeRoot });
    const attestation = JSON.parse(await readFile(path.join(releaseRoot, "attestations", `${artifactName}.distribution-attestation.json`), "utf8"));
    const checksums = await readFile(path.join(releaseRoot, "checksums.txt"), "utf8");
    assert.equal(attestation.artifact.sha256, sha256("installer fixture"));
    assert.equal(attestation.signing.verification, "disabled");
    assert.equal(checksums, `${sha256("installer fixture")}  ${artifactName}\n`);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

test("Runtime package workflow is manual-only and consumes immutable release/provider inputs", async () => {
  const workflow = await readFile(path.join(repositoryRoot, ".github", "workflows", "arcorbit-package.yml"), "utf8");
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n\s+push:/);
  assert.match(workflow, /release_tag:/);
  assert.match(workflow, /arcforge_release:/);
  assert.match(workflow, /arcforge_sha256:/);
  assert.match(workflow, /validate-release-trigger\.mjs/);
  assert.match(workflow, /gh release download/);
  assert.match(workflow, /"os":"macos-15","platform":"mac","target":"macos-arm64"/);
  assert.match(workflow, /macos-15-intel/);
  assert.match(workflow, /environment:.*internal/);
  assert.match(workflow, /npm run smoke:distribution/);
  assert.match(workflow, /WIN_CSC_LINK:.*matrix\.platform == 'win'/);
  assert.match(workflow, /APPLE_API_KEY:.*matrix\.platform == 'mac'/);
  assert.match(workflow, /codesign --verify --deep --strict/);
  assert.match(workflow, /xcrun stapler validate/);
  assert.match(workflow, /spctl --assess --type execute/);
  assert.match(workflow, /prepare-release-assets\.mjs --root release-assets/);
  assert.match(workflow, /--verify-tag/);
  assert.doesNotMatch(workflow, /git tag|git push/);
});
