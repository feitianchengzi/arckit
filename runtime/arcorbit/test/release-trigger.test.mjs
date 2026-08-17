import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const validator = fileURLToPath(new URL("../scripts/validate-release-trigger.mjs", import.meta.url));

test("Runtime release validator accepts existing governed tags and enforces release baselines", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "arcorbit-release-"));
  try {
    await git(repo, ["init", "-b", "main"]);
    await git(repo, ["config", "user.email", "test@example.com"]);
    await git(repo, ["config", "user.name", "Arckit Test"]);
    await writeFile(path.join(repo, "package.json"), `${JSON.stringify({ version: "0.1.0" })}\n`);
    await git(repo, ["add", "package.json"]);
    await git(repo, ["commit", "-m", "fixture"]);
    await git(repo, ["tag", "tf/v0.1.0-b1"]);
    assert.equal(JSON.parse((await run(repo, "tf/v0.1.0-b1")).stdout).packageVersion, "0.1.0-tf.b1");
    await git(repo, ["tag", "beta/v0.1.0-rc1"]);
    await assert.rejects(run(repo, "beta/v0.1.0-rc1"), /requires release\/v0\.1\.0/);
    await git(repo, ["branch", "release/v0.1.0"]);
    assert.equal(JSON.parse((await run(repo, "beta/v0.1.0-rc1")).stdout).channel, "beta");
  } finally { await rm(repo, { recursive: true, force: true }); }
});

function run(cwd, tag) { return execFileAsync(process.execPath, [validator, "--tag", tag], { cwd }); }
function git(cwd, args) { return execFileAsync("git", args, { cwd }); }
