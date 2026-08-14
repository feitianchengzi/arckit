import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { execLocalTar, localTarInvocation } from "../scripts/local-tar.mjs";

test("local tar invocation keeps a Windows drive-letter archive out of tar arguments", () => {
  const archive = "D:\\a\\arckit\\arckit\\provider-input\\arcforge-provider-0.1.8-tf.b1.tgz";
  const invocation = localTarInvocation(archive, ["-tzf"], [], path.win32);

  assert.equal(invocation.command, "tar");
  assert.deepEqual(invocation.args, ["-tzf", "arcforge-provider-0.1.8-tf.b1.tgz"]);
  assert.deepEqual(invocation.options, { cwd: "D:\\a\\arckit\\arckit\\provider-input" });
});

test("local tar execution preserves arguments after the archive for extraction", async () => {
  const archive = path.resolve("fixtures", "provider.tgz");
  const extractRoot = path.resolve("fixtures", "extract");
  let observed;

  await execLocalTar(archive, ["-xzf"], ["-C", extractRoot], async (command, args, options) => {
    observed = { command, args, options };
    return { stdout: "", stderr: "" };
  });

  assert.deepEqual(observed, {
    command: "tar",
    args: ["-xzf", "provider.tgz", "-C", extractRoot],
    options: { cwd: path.dirname(archive) }
  });
});
