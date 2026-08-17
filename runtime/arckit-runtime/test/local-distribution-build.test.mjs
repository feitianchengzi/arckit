import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  createLocalBuildPlan,
  isCurrentLocalArtifact,
  parseArgs,
  resolveHostBuild
} from "../scripts/build-local-distribution.mjs";

test("local Runtime build selects only supported host-native package targets", () => {
  assert.deepEqual(resolveHostBuild("darwin", "arm64"), {
    target: "macos-arm64", platform: "mac", packageScript: "package:mac:arm64", artifactExtension: ".dmg", artifactSuffix: "-mac-arm64.dmg"
  });
  assert.deepEqual(resolveHostBuild("darwin", "x64"), {
    target: "macos-x64", platform: "mac", packageScript: "package:mac:x64", artifactExtension: ".dmg", artifactSuffix: "-mac-x64.dmg"
  });
  assert.deepEqual(resolveHostBuild("win32", "x64"), {
    target: "windows-x64", platform: "win", packageScript: "package:win:x64", artifactExtension: ".exe", artifactSuffix: "-win-x64.exe"
  });
  assert.deepEqual(resolveHostBuild("linux", "x64"), {
    target: "linux-x64", platform: "linux", packageScript: "package:linux:x64", artifactExtension: ".AppImage", artifactSuffix: "-linux-x64.AppImage"
  });
  assert.throws(() => resolveHostBuild("linux", "arm64"), /Unsupported local Runtime build host/);
});

test("local build plan marks provider and Runtime metadata as local and unsigned", () => {
  const plan = createLocalBuildPlan({
    runtimeDirectory: "/workspace/arckit/runtime/arckit-runtime",
    repositoryDirectory: "/workspace/arckit",
    arcforgeDirectory: "/workspace/arcforge",
    runtimeVersion: "0.1.0",
    providerVersion: "0.1.8",
    buildId: "20260817090000",
    platform: "darwin",
    arch: "x64",
    resourcesOnly: true
  });
  assert.equal(plan.provider.version, "0.1.8-local.20260817090000");
  assert.equal(plan.provider.releaseTag, "local/arckit-runtime-20260817090000");
  assert.equal(plan.runtime.releaseTag, "local/v0.1.0-20260817090000");
  assert.equal(plan.signing, "disabled");
  assert.equal(plan.resourcesOnly, true);
  assert.equal(plan.host.packageScript, "package:mac:x64");
  assert.equal(plan.provider.archive, path.join("/workspace/arcforge", "release", "provider-release", "arcforge-provider-0.1.8-local.20260817090000.tgz"));
  assert.equal(plan.runtime.resourcesRoot, path.join("/workspace/arckit/runtime/arckit-runtime", "dist-package", "resources"));
  assert.equal(isCurrentLocalArtifact("Arckit-Runtime-0.1.0-local.20260817090000-local-20260817090000-mac-x64.dmg", plan), true);
  assert.equal(isCurrentLocalArtifact("Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg", plan), false);
  assert.equal(isCurrentLocalArtifact("Arckit-Runtime-0.1.0-local.older-local-older-mac-x64.dmg", plan), false);
  const armPlan = createLocalBuildPlan({ ...plan.roots, runtimeDirectory: plan.roots.runtime, repositoryDirectory: plan.roots.repository, arcforgeDirectory: plan.roots.arcforge, runtimeVersion: "0.1.0", providerVersion: "0.1.8", buildId: "20260817090000", platform: "darwin", arch: "arm64" });
  assert.equal(isCurrentLocalArtifact("Arckit-Runtime-0.1.0-local.20260817090000-local-20260817090000-mac-x64.dmg", armPlan), false);
  assert.equal(isCurrentLocalArtifact("Arckit-Runtime-0.1.0-local.20260817090000-local-20260817090000-mac-arm64.dmg", armPlan), true);
});

test("local build arguments fail closed on ambiguous inputs", () => {
  assert.deepEqual(parseArgs(["--arcforge-root", "../arcforge", "--build-id", "dev.2", "--resources-only"]), {
    arcforgeRoot: "../arcforge", buildId: "dev.2", resourcesOnly: true, help: false
  });
  assert.throws(() => parseArgs(["--arcforge-root"]), /requires a value/);
  assert.throws(() => parseArgs(["--build-id", "../unsafe"]), /Invalid local build id/);
  assert.throws(() => parseArgs(["--build-id", "dev.01"]), /without leading zeroes/);
  assert.equal(parseArgs(["--build-id", "dev-01"]).buildId, "dev-01");
  assert.throws(() => parseArgs(["--target", "windows-x64"]), /Unknown argument/);
});
