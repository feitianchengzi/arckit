import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const runtimeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extensions = new Set([".js", ".cjs", ".mjs"]);
const files = [
  join(runtimeRoot, "bin", "arcorbit.mjs"),
  ...await moduleFiles("src"),
  ...await moduleFiles("src/kernel"),
  ...await moduleFiles("src/projection"),
  ...await moduleFiles("src/desktop"),
  ...await moduleFiles("adapters"),
  ...await moduleFiles("scripts"),
  join(runtimeRoot, "desktop", "main.mjs"),
  join(runtimeRoot, "desktop", "preload.cjs"),
  join(runtimeRoot, "desktop", "renderer", "renderer.js"),
  join(runtimeRoot, "desktop", "product-feedback", "preload.cjs"),
  join(runtimeRoot, "desktop", "product-feedback", "renderer.js"),
  join(runtimeRoot, "desktop", "image-viewer", "preload.cjs"),
  join(runtimeRoot, "desktop", "image-viewer", "renderer.js"),
  join(runtimeRoot, "desktop", "image-viewer", "state.mjs")
];

for (const file of [...new Set(files)].sort()) {
  await execFileAsync(process.execPath, ["--check", file], { cwd: runtimeRoot, windowsHide: true });
}

async function moduleFiles(relativeDirectory) {
  const directory = join(runtimeRoot, relativeDirectory);
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && extensions.has(extname(entry.name)))
    .map((entry) => join(directory, entry.name));
}
