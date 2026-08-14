import crypto from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const options = parseArgs(process.argv.slice(2));
const releaseRoot = path.resolve(options.releaseRoot || path.join(runtimeRoot, "release"));
const outputRoot = path.join(releaseRoot, "attestations");
const embeddedLockBytes = await readFile(path.resolve(options.embeddedLock || path.join(runtimeRoot, "dist-package", "resources", "provisioning", "distribution-lock.json")));
const embeddedLock = JSON.parse(embeddedLockBytes);
const artifacts = (await readdir(releaseRoot, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && ([".dmg", ".exe"].includes(path.extname(entry.name)) || entry.name.endsWith(".AppImage")))
  .map((entry) => entry.name)
  .sort();
if (!artifacts.length) throw new Error("No supported installer artifact was produced.");
await mkdir(outputRoot, { recursive: true });
const checksums = [];
for (const artifactName of artifacts) {
  const artifactSha256 = sha256(await readFile(path.join(releaseRoot, artifactName)));
  checksums.push(`${artifactSha256}  ${artifactName}`);
  const attestation = {
    schemaVersion: "arckit-runtime-distribution-attestation/v1",
    embeddedLockDigest: sha256(embeddedLockBytes),
    runtime: embeddedLock.runtime,
    releaseTag: embeddedLock.arckit.releaseTag,
    artifact: { name: artifactName, sha256: artifactSha256 },
    signing: { requestedMode: embeddedLock.signing.requestedMode, verification: options.signingResult || (embeddedLock.signing.requestedMode === "disabled" ? "disabled" : "not-verified"), notarization: options.notarizationResult || "not-applicable" },
    build: embeddedLock.build
  };
  await writeFile(path.join(outputRoot, `${artifactName}.distribution-attestation.json`), `${JSON.stringify(attestation, null, 2)}\n`);
}
const checksumsPath = path.join(releaseRoot, "checksums.txt");
await writeFile(checksumsPath, `${checksums.join("\n")}\n`);
console.log(JSON.stringify({ artifacts, embeddedLockDigest: sha256(embeddedLockBytes), outputRoot, checksumsPath }, null, 2));

function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function parseArgs(args) { const result = {}; for (let index = 0; index < args.length; index += 1) { if (args[index] === "--signing-result") result.signingResult = args[++index]; else if (args[index] === "--notarization-result") result.notarizationResult = args[++index]; else if (args[index] === "--release-root") result.releaseRoot = args[++index]; else if (args[index] === "--embedded-lock") result.embeddedLock = args[++index]; } return result; }
