import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const runtimeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extensions = new Set([".js", ".cjs", ".mjs"]);
const files = (await Promise.all(["bin", "src", "adapters", "scripts", "desktop"].map(moduleFiles))).flat();

for (const file of [...new Set(files)].sort()) {
  await execFileAsync(process.execPath, ["--check", file], { cwd: runtimeRoot, windowsHide: true });
}

async function moduleFiles(relativeDirectory) {
  const directory = join(runtimeRoot, relativeDirectory);
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return moduleFiles(join(relativeDirectory, entry.name));
    return entry.isFile() && extensions.has(extname(entry.name)) ? [entryPath] : [];
  }));
  return nested.flat();
}
