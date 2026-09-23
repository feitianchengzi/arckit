import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const runtimeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const testRoot = join(runtimeRoot, "test");
const allTests = (await readdir(testRoot, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.mjs"))
  .map((entry) => join(testRoot, entry.name))
  .sort();

// Separate vitest files (import from 'vitest') from node:test files
const vitestTests = [];
const nodeTests = [];
for (const file of allTests) {
  const content = await import("node:fs/promises").then((fs) => fs.readFile(file, "utf-8"));
  if (content.includes("from 'vitest'") || content.includes('from "vitest"')) {
    vitestTests.push(file);
  } else {
    nodeTests.push(file);
  }
}

let exitCode = 0;

// Run node:test files
if (nodeTests.length > 0) {
  const child = spawn(process.execPath, ["--test", ...nodeTests], {
    cwd: runtimeRoot,
    stdio: "inherit",
    windowsHide: true
  });
  const code = await new Promise((resolvePromise, rejectPromise) => {
    child.once("error", rejectPromise);
    child.once("close", (code) => resolvePromise(code ?? 1));
  });
  if (code !== 0) exitCode = code;
}

// Run vitest files
if (vitestTests.length > 0) {
  const child = spawn("npx", ["vitest", "run", ...vitestTests], {
    cwd: runtimeRoot,
    stdio: "inherit",
    windowsHide: true
  });
  const code = await new Promise((resolvePromise, rejectPromise) => {
    child.once("error", rejectPromise);
    child.once("close", (code) => resolvePromise(code ?? 1));
  });
  if (code !== 0) exitCode = code;
}

process.exitCode = exitCode;
