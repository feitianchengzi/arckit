import assert from "node:assert/strict";
import crypto from "node:crypto";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { prepareReleaseAssets } from "../scripts/prepare-release-assets.mjs";

test("release assets combine target checksums into one deterministic manifest", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "arckit-release-assets-"));
  try {
    const targets = [
      ["windows", "Arckit-Runtime-win.exe", "windows installer"],
      ["linux", "Arckit-Runtime-linux.AppImage", "linux installer"]
    ];
    for (const [target, artifactName, bytes] of targets) {
      const targetRoot = path.join(root, target);
      await mkdir(path.join(targetRoot, "attestations"), { recursive: true });
      await writeFile(path.join(targetRoot, artifactName), bytes);
      await writeFile(path.join(targetRoot, "checksums.txt"), `${sha256(bytes)}  ${artifactName}\n`);
      await writeFile(path.join(targetRoot, "attestations", `${artifactName}.json`), "{}\n");
    }

    const result = await prepareReleaseAssets(root);

    assert.deepEqual(result.checksums, [
      `${sha256("linux installer")}  Arckit-Runtime-linux.AppImage`,
      `${sha256("windows installer")}  Arckit-Runtime-win.exe`
    ]);
    assert.equal(await readFile(path.join(root, "checksums.txt"), "utf8"), `${result.checksums.join("\n")}\n`);
    await assert.rejects(access(path.join(root, "linux", "checksums.txt")));
    await assert.rejects(access(path.join(root, "windows", "checksums.txt")));
    assert.equal(new Set(result.assets.map((file) => path.basename(file))).size, result.assets.length);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("release assets reject duplicate basenames before mutating downloaded artifacts", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "arckit-release-assets-"));
  try {
    const artifactRoot = path.join(root, "linux");
    await mkdir(artifactRoot, { recursive: true });
    await mkdir(path.join(root, "windows"), { recursive: true });
    await writeFile(path.join(artifactRoot, "installer.AppImage"), "installer");
    await writeFile(path.join(artifactRoot, "checksums.txt"), `${sha256("installer")}  installer.AppImage\n`);
    await writeFile(path.join(artifactRoot, "metadata.json"), "{}\n");
    await writeFile(path.join(root, "windows", "metadata.json"), "{}\n");

    await assert.rejects(prepareReleaseAssets(root), /Duplicate GitHub Release asset basename "metadata\.json"/);
    assert.match(await readFile(path.join(artifactRoot, "checksums.txt"), "utf8"), /installer\.AppImage/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("release assets verify each target checksum before aggregation", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "arckit-release-assets-"));
  try {
    const targetRoot = path.join(root, "linux");
    await mkdir(targetRoot, { recursive: true });
    await writeFile(path.join(targetRoot, "installer.AppImage"), "actual installer");
    await writeFile(path.join(targetRoot, "checksums.txt"), `${sha256("different bytes")}  installer.AppImage\n`);

    await assert.rejects(prepareReleaseAssets(root), /Checksum mismatch for linux\/installer\.AppImage/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
