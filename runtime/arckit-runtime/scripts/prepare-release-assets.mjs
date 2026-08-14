import crypto from "node:crypto";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function prepareReleaseAssets(inputRoot) {
  const root = path.resolve(inputRoot);
  const files = await listFiles(root);
  const checksumFiles = files.filter((file) => path.basename(file) === "checksums.txt");
  if (!checksumFiles.length) throw new Error("No target checksum manifests found.");

  const checksums = new Map();
  for (const checksumFile of checksumFiles) {
    const lines = (await readFile(checksumFile, "utf8")).split(/\r?\n/).filter(Boolean);
    if (!lines.length) throw new Error(`Checksum manifest is empty: ${relative(root, checksumFile)}`);
    for (const line of lines) {
      const match = line.match(/^([0-9a-f]{64}) {2}(.+)$/);
      if (!match) throw new Error(`Invalid checksum entry in ${relative(root, checksumFile)}: ${line}`);
      const [, expectedSha256, artifactName] = match;
      if (artifactName !== path.basename(artifactName)) throw new Error(`Checksum artifact must be a basename: ${artifactName}`);
      if (checksums.has(artifactName)) throw new Error(`Duplicate checksum artifact name: ${artifactName}`);

      const artifactPath = path.join(path.dirname(checksumFile), artifactName);
      const actualSha256 = sha256(await readFile(artifactPath));
      if (actualSha256 !== expectedSha256) throw new Error(`Checksum mismatch for ${relative(root, artifactPath)}`);
      checksums.set(artifactName, expectedSha256);
    }
  }

  const aggregatePath = path.join(root, "checksums.txt");
  const retainedFiles = files.filter((file) => path.basename(file) !== "checksums.txt");
  assertUniqueBasenames([...retainedFiles, aggregatePath], root);

  const checksumLines = [...checksums]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([artifactName, digest]) => `${digest}  ${artifactName}`);
  await Promise.all(checksumFiles.map((file) => rm(file)));
  await writeFile(aggregatePath, `${checksumLines.join("\n")}\n`);

  const assets = [...retainedFiles, aggregatePath]
    .map((file) => relative(root, file))
    .sort();
  return { assets, checksums: checksumLines, aggregatePath };
}

function assertUniqueBasenames(files, root) {
  const observed = new Map();
  for (const file of files) {
    const name = path.basename(file);
    const existing = observed.get(name);
    if (existing) throw new Error(`Duplicate GitHub Release asset basename "${name}": ${relative(root, existing)}, ${relative(root, file)}`);
    observed.set(name, file);
  }
}

async function listFiles(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...await listFiles(entryPath));
    else if (entry.isFile()) result.push(entryPath);
  }
  return result.sort();
}

function relative(root, file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--root") result.root = args[++index];
    else throw new Error(`Unknown argument: ${args[index]}`);
  }
  if (!result.root) throw new Error("--root is required");
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareReleaseAssets(parseArgs(process.argv.slice(2)).root)
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
