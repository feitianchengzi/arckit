import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const options = parseArgs(process.argv.slice(2));
if (!options.tag) throw new Error("--tag is required.");
const parsed = parseReleaseTag(options.tag);
const manifest = JSON.parse(await readFile(options.manifest ?? "package.json", "utf8"));
if (manifest.version !== parsed.productVersion) throw new Error(`Release tag version ${parsed.productVersion} does not match package version ${manifest.version}.`);

const tagCommit = await git(["rev-parse", "--verify", `refs/tags/${options.tag}^{commit}`]);
const headCommit = await git(["rev-parse", "HEAD"]);
if (tagCommit !== headCommit) throw new Error(`Checked out commit ${headCommit} does not match ${options.tag} (${tagCommit}).`);
const releaseRef = await existingRef(`refs/remotes/origin/release/v${parsed.productVersion}`) ?? await existingRef(`refs/heads/release/v${parsed.productVersion}`);
const mainRef = await existingRef("refs/remotes/origin/main") ?? await existingRef("refs/heads/main");
const higher = (await gitLines(["for-each-ref", "--format=%(refname)", "refs/remotes/origin/release/v*", "refs/heads/release/v*"]))
  .filter((ref) => compareVersions(versionFromReleaseRef(ref), parsed.productVersion) > 0);
if (releaseRef) await assertOnBaseline(tagCommit, releaseRef, `release/v${parsed.productVersion}`);
else if (higher.length) throw new Error(`Higher release line(s) exist (${higher.join(", ")}); ${options.tag} cannot bypass release/v${parsed.productVersion}.`);
else if (parsed.channel === "tf") await assertOnBaseline(tagCommit, requiredRef(mainRef, "main"), "main");
else if (parsed.channel === "beta" && options.allowMainBeta === "true") await assertOnBaseline(tagCommit, requiredRef(mainRef, "main"), "explicitly confirmed main beta");
else throw new Error(`${options.tag} requires release/v${parsed.productVersion}; only beta may use main with explicit confirmation.`);

const result = { ...parsed, tag: options.tag, commit: tagCommit, baseline: releaseRef ?? mainRef };
if (options.githubOutput) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(options.githubOutput, `${Object.entries(result).map(([key, value]) => `${snakeCase(key)}=${value}`).join("\n")}\n`);
}
console.log(JSON.stringify(result, null, 2));

export function parseReleaseTag(tag) {
  let match = /^tf\/v(\d+\.\d+\.\d+)-b([1-9]\d*)$/.exec(tag);
  if (match) return releaseResult("tf", match[1], `b${match[2]}`, `${match[1]}-tf.b${match[2]}`, true);
  match = /^beta\/v(\d+\.\d+\.\d+)-rc([1-9]\d*)$/.exec(tag);
  if (match) return releaseResult("beta", match[1], `rc${match[2]}`, `${match[1]}-beta.rc${match[2]}`, true);
  match = /^appstore\/v(\d+\.\d+\.\d+)$/.exec(tag);
  if (match) return releaseResult("appstore", match[1], "stable", match[1], false);
  throw new Error("Release tag must match tf/vx.x.x-bN, beta/vx.x.x-rcN, or appstore/vx.x.x with N starting at 1.");
}

function releaseResult(channel, productVersion, buildLabel, packageVersion, prerelease) { return { channel, productVersion, buildLabel, packageVersion, prerelease }; }
function requiredRef(value, label) { if (!value) throw new Error(`${label} baseline is unavailable.`); return value; }
async function assertOnBaseline(commit, ref, label) {
  try { await execFileAsync("git", ["merge-base", "--is-ancestor", commit, ref]); }
  catch { throw new Error(`${label} does not contain release commit ${commit}.`); }
}
async function existingRef(ref) {
  try { await execFileAsync("git", ["show-ref", "--verify", "--quiet", ref]); return ref; }
  catch { return undefined; }
}
async function git(args) { return (await execFileAsync("git", args)).stdout.trim(); }
async function gitLines(args) { const value = await git(args); return value ? value.split("\n").map((item) => item.trim()).filter(Boolean) : []; }
function versionFromReleaseRef(ref) { return ref.match(/release\/v(\d+\.\d+\.\d+)$/)?.[1] ?? "0.0.0"; }
function compareVersions(left, right) { const a = left.split(".").map(Number); const b = right.split(".").map(Number); for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index] - b[index]; return 0; }
function snakeCase(value) { return value.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`); }
function parseArgs(args) { const result = {}; for (let index = 0; index < args.length; index += 1) { if (args[index] === "--tag") result.tag = args[++index]; else if (args[index] === "--manifest") result.manifest = args[++index]; else if (args[index] === "--allow-main-beta") result.allowMainBeta = args[++index]; else if (args[index] === "--github-output") result.githubOutput = args[++index]; } return result; }
