import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const runtimeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const testRoot = join(runtimeRoot, "test");
const tests = (await readdir(testRoot, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.mjs"))
  .map((entry) => join(testRoot, entry.name))
  .sort();

const child = spawn(process.execPath, ["--test", ...tests], {
  cwd: runtimeRoot,
  stdio: "inherit",
  windowsHide: true
});

const exitCode = await new Promise((resolvePromise, rejectPromise) => {
  child.once("error", rejectPromise);
  child.once("close", (code) => resolvePromise(code ?? 1));
});

process.exitCode = exitCode;
