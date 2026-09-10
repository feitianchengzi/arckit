import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import {
  createLocalBuildPlan,
  isCurrentLocalArtifact,
  packagedRendererSmokeExecutable,
  parseArgs,
  resolveHostBuild
} from "../scripts/build-local-distribution.mjs";

test("the packager resolves the Python 3.13 compatible native rebuilder", () => {
  const require = createRequire(import.meta.url);
  const builderRequire = createRequire(require.resolve("app-builder-lib/package.json"));
  const rebuildRequire = createRequire(builderRequire.resolve("@electron/rebuild/package.json"));
  assert.equal(builderRequire("@electron/rebuild/package.json").version, require("@electron/rebuild/package.json").version);
  const gyp = rebuildRequire("@electron/node-gyp/package.json");
  assert.ok(Number(gyp.version.split(".")[0]) >= 10, `Python 3.13 requires node-gyp >= 10; resolved ${gyp.version}`);
});

test("local build preserves child diagnostics on success and failure without swallowing exit status", async () => {
  const moduleUrl = new URL("../scripts/build-local-distribution.mjs", import.meta.url).href;
  for (const exitCode of [0, 23]) {
    const childCode = `process.stdout.write('builder stdout diagnostic\\n'); process.stderr.write('builder stderr diagnostic\\n'); process.exitCode = ${exitCode};`;
    const driverCode = `
      import { runLocalBuildCommand } from ${JSON.stringify(moduleUrl)};
      try {
        await runLocalBuildCommand(process.execPath, ['-e', ${JSON.stringify(childCode)}], process.cwd());
      } catch (error) { process.exitCode = error.code; }
    `;
    let output;
    try {
      output = await promisify(execFile)(process.execPath, ["--input-type=module", "-e", driverCode]);
      assert.equal(exitCode, 0, "a failed build must reject");
    } catch (error) {
      assert.equal(error.code, exitCode);
      output = error;
    }
    assert.match(output.stdout, /builder stdout diagnostic\n/);
    assert.match(output.stderr, /builder stderr diagnostic\n/);
  }
});

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

test("local build resolves the unpacked application used by the post-package Renderer smoke", () => {
  assert.equal(
    packagedRendererSmokeExecutable("/workspace/release", "mac"),
    path.resolve("/workspace/release/mac/arcorbit.app/Contents/MacOS/arcorbit")
  );
  assert.equal(
    packagedRendererSmokeExecutable("/workspace/release", "win"),
    path.resolve("/workspace/release/win-unpacked/arcorbit.exe")
  );
  assert.equal(
    packagedRendererSmokeExecutable("/workspace/release", "linux"),
    path.resolve("/workspace/release/linux-unpacked/arcorbit")
  );
  assert.throws(() => packagedRendererSmokeExecutable("/workspace/release", "freebsd"), /Unsupported packaged Renderer smoke platform/);
});

test("local build plan marks provider and Runtime metadata as local and unsigned", () => {
  const plan = createLocalBuildPlan({
    runtimeDirectory: "/workspace/arckit/runtime/arcorbit",
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
  assert.equal(plan.provider.releaseTag, "local/arcorbit-20260817090000");
  assert.equal(plan.runtime.releaseTag, "local/v0.1.0-20260817090000");
  assert.equal(plan.signing, "disabled");
  assert.equal(plan.resourcesOnly, true);
  assert.equal(plan.host.packageScript, "package:mac:x64");
  assert.equal(plan.provider.archive, path.join("/workspace/arcforge", "release", "provider-release", "arcforge-provider-0.1.8-local.20260817090000.tgz"));
  assert.equal(plan.runtime.resourcesRoot, path.join("/workspace/arckit/runtime/arcorbit", "dist-package", "resources"));
  assert.equal(isCurrentLocalArtifact("ArcOrbit-0.1.0-local.20260817090000-local-20260817090000-mac-x64.dmg", plan), true);
  assert.equal(isCurrentLocalArtifact("ArcOrbit-0.1.0-tf.b1-tf-b1-mac-x64.dmg", plan), false);
  assert.equal(isCurrentLocalArtifact("ArcOrbit-0.1.0-local.older-local-older-mac-x64.dmg", plan), false);
  const armPlan = createLocalBuildPlan({ ...plan.roots, runtimeDirectory: plan.roots.runtime, repositoryDirectory: plan.roots.repository, arcforgeDirectory: plan.roots.arcforge, runtimeVersion: "0.1.0", providerVersion: "0.1.8", buildId: "20260817090000", platform: "darwin", arch: "arm64" });
  assert.equal(isCurrentLocalArtifact("ArcOrbit-0.1.0-local.20260817090000-local-20260817090000-mac-x64.dmg", armPlan), false);
  assert.equal(isCurrentLocalArtifact("ArcOrbit-0.1.0-local.20260817090000-local-20260817090000-mac-arm64.dmg", armPlan), true);
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
