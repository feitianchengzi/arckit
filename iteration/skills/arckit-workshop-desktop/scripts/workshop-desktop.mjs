#!/usr/bin/env node
import { execFile, spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const OWNER = "hoewo";
const REPO = "workshop-desktop";
const PRODUCT_NAME = "Workshop Todo";
const APP_SERVER_NAME = "workshop-desktop";
const LATEST_RELEASE_API = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
const RELEASES_URL = `https://github.com/${OWNER}/${REPO}/releases/latest`;
const NETWORK_TIMEOUT_MS = 20_000;

function usage() {
  return `Usage:
  workshop-desktop.mjs status [--check-latest] [--json]
  workshop-desktop.mjs verify [--json]
  workshop-desktop.mjs ensure [--yes] [--json]
  workshop-desktop.mjs open
  workshop-desktop.mjs record create --title <text> [--body <markdown>] [--body-file <path>] [--scope none|project|task] [--project-id N] [--project-name <text>] [--task-id N] [--task-title <text>] [--open] [--json]
  workshop-desktop.mjs project list [--json]
  workshop-desktop.mjs task list --project-id N [--state pending,completed] [--json]
  workshop-desktop.mjs rpc <method> --params '{...}' [--json]

Install/update packages are selected from ${RELEASES_URL}.`;
}

function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      result._.push(arg);
      continue;
    }

    const key = arg.slice(2);
    if (["json", "check-latest", "yes", "open"].includes(key)) {
      result[key] = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    result[key] = value;
    index += 1;
  }
  return result;
}

function numberOption(value, name) {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a number`);
  }
  return parsed;
}

function splitList(value) {
  if (!value) {
    return undefined;
  }
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function cacheDir() {
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Caches", "arckit", "workshop-desktop");
  }
  if (process.platform === "win32") {
    return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "arckit", "workshop-desktop");
  }
  return path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"), "arckit", "workshop-desktop");
}

function userDataDir() {
  if (process.env.WORKSHOP_DESKTOP_USER_DATA) {
    return process.env.WORKSHOP_DESKTOP_USER_DATA;
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", APP_SERVER_NAME);
  }
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), APP_SERVER_NAME);
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), APP_SERVER_NAME);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function installedAppCandidates() {
  if (process.platform === "darwin") {
    return [
      path.join(os.homedir(), "Applications", `${PRODUCT_NAME}.app`),
      path.join("/Applications", `${PRODUCT_NAME}.app`)
    ];
  }
  if (process.platform === "win32") {
    const roots = [
      process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs", PRODUCT_NAME, `${PRODUCT_NAME}.exe`),
      process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, PRODUCT_NAME, `${PRODUCT_NAME}.exe`),
      process.env["PROGRAMFILES(X86)"] && path.join(process.env["PROGRAMFILES(X86)"], PRODUCT_NAME, `${PRODUCT_NAME}.exe`)
    ].filter(Boolean);
    return roots;
  }
  return [
    path.join(os.homedir(), ".local", "bin", "workshop-todo"),
    path.join(os.homedir(), "Applications", "Workshop.Todo.AppImage")
  ];
}

async function findInstalledApp() {
  for (const candidate of await installedAppCandidates()) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function readMacAppVersion(appPath) {
  if (process.platform !== "darwin" || !appPath?.endsWith(".app")) {
    return null;
  }
  const plistPath = path.join(appPath, "Contents", "Info.plist");
  try {
    const { stdout } = await execFileAsync("/usr/libexec/PlistBuddy", ["-c", "Print :CFBundleShortVersionString", plistPath]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "arckit-workshop-desktop"
      },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    const { stdout } = await curl(["--connect-timeout", "10", "--max-time", "30", "-L", "-sS", "-H", "Accept: application/vnd.github+json", "-H", "User-Agent: arckit-workshop-desktop", url], {
      maxBuffer: 64 * 1024 * 1024
    });
    try {
      return JSON.parse(stdout);
    } catch {
      throw error;
    }
  } finally {
    clearTimeout(timer);
  }
}

async function curl(args, options = {}) {
  try {
    return await execFileAsync("curl", args, options);
  } catch (firstError) {
    try {
      return await execFileAsync("curl", ["--noproxy", "*", ...args], options);
    } catch {
      throw firstError;
    }
  }
}

function normalizeVersion(value) {
  return String(value || "").trim().replace(/^v/i, "");
}

async function latestRelease() {
  const release = await fetchJson(LATEST_RELEASE_API);
  return {
    tagName: release.tag_name,
    version: normalizeVersion(release.tag_name),
    htmlUrl: release.html_url || RELEASES_URL,
    assets: Array.isArray(release.assets)
      ? release.assets.map((asset) => ({
          name: asset.name,
          size: asset.size,
          downloadUrl: asset.browser_download_url
        }))
      : []
  };
}

function selectAsset(release) {
  const arch = os.arch();
  const assets = release.assets || [];
  const byName = (predicate) => assets.find((asset) => predicate(asset.name.toLowerCase()));

  if (process.platform === "darwin") {
    const archNeedle = arch === "arm64" ? "arm64" : "x64";
    const isGenericMac = (name) => name.includes("mac") && !name.includes("arm64") && !name.includes("x64");
    return (
      byName((name) => name.endsWith(".zip") && name.includes("mac") && name.includes(archNeedle)) ||
      byName((name) => name.endsWith(".zip") && isGenericMac(name)) ||
      byName((name) => name.endsWith(".dmg") && name.includes("mac") && name.includes(archNeedle)) ||
      byName((name) => name.endsWith(".dmg") && isGenericMac(name))
    );
  }

  if (process.platform === "win32") {
    return (
      byName((name) => name.endsWith(".exe") && !name.includes("portable")) ||
      byName((name) => name.endsWith(".exe")) ||
      byName((name) => name.endsWith(".msi"))
    );
  }

  return byName((name) => name.endsWith(".appimage")) || byName((name) => name.endsWith(".deb")) || byName((name) => name.endsWith(".rpm"));
}

async function appServerConnection() {
  const envPort = Number(process.env.WORKSHOP_DESKTOP_SERVER_PORT);
  const envToken = process.env.WORKSHOP_DESKTOP_SERVER_TOKEN?.trim();
  if (Number.isFinite(envPort) && envPort > 0 && envToken) {
    return { host: "127.0.0.1", port: envPort, token: envToken, source: "env" };
  }

  const connectionPath = path.join(userDataDir(), "app-server.json");
  const connection = JSON.parse(await fs.readFile(connectionPath, "utf8"));
  if (!connection?.port || !connection?.token) {
    throw new Error(`Invalid Workshop Desktop app-server file: ${connectionPath}`);
  }
  return { ...connection, host: "127.0.0.1", source: connectionPath };
}

async function health() {
  try {
    const connection = await appServerConnection();
    const response = await fetch(`http://127.0.0.1:${connection.port}/health`);
    if (!response.ok) {
      return { ok: false, error: `health returned ${response.status}`, source: connection.source };
    }
    return { ok: true, source: connection.source, port: connection.port };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function rpc(method, params) {
  const connection = await appServerConnection();
  const response = await fetch(`http://127.0.0.1:${connection.port}/rpc`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${connection.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ method, params })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || `Workshop Desktop RPC failed: ${response.status}`);
  }
  return payload.result;
}

async function status(options = {}) {
  const appPath = await findInstalledApp();
  const installedVersion = appPath ? await readMacAppVersion(appPath) : null;
  const server = await health();
  const result = {
    platform: process.platform,
    arch: os.arch(),
    installed: Boolean(appPath),
    appPath,
    installedVersion,
    appServer: server
  };

  if (options.checkLatest) {
    const release = await latestRelease();
    const asset = selectAsset(release);
    result.latest = {
      tagName: release.tagName,
      version: release.version,
      url: release.htmlUrl,
      selectedAsset: asset || null,
      updateAvailable: Boolean(installedVersion && release.version && normalizeVersion(installedVersion) !== release.version)
    };
  }

  return result;
}

async function downloadAsset(asset, release) {
  if (!asset?.downloadUrl) {
    throw new Error(`No matching release asset for ${process.platform}/${os.arch()}. See ${release.htmlUrl}`);
  }
  await fs.mkdir(cacheDir(), { recursive: true });
  const targetPath = path.join(cacheDir(), asset.name);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    const response = await fetch(asset.downloadUrl, {
      headers: { "User-Agent": "arckit-workshop-desktop" },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(targetPath, bytes);
  } catch {
    await curl(["--connect-timeout", "10", "--max-time", "900", "-L", "-f", "-sS", "-H", "User-Agent: arckit-workshop-desktop", "-o", targetPath, asset.downloadUrl], {
      maxBuffer: 1024 * 1024
    });
  } finally {
    clearTimeout(timer);
  }
  return targetPath;
}

async function installMacZip(zipPath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "workshop-desktop-"));
  await execFileAsync("ditto", ["-x", "-k", zipPath, tempDir]);
  const appPath = await findFirstApp(tempDir);
  if (!appPath) {
    throw new Error(`No .app found in ${zipPath}`);
  }

  const applicationsDir = path.join(os.homedir(), "Applications");
  const targetPath = path.join(applicationsDir, `${PRODUCT_NAME}.app`);
  const stagingPath = path.join(applicationsDir, `${PRODUCT_NAME}.app.installing-${process.pid}`);
  await fs.mkdir(applicationsDir, { recursive: true });
  await fs.rm(stagingPath, { recursive: true, force: true });

  try {
    await execFileAsync("ditto", [appPath, stagingPath]);
    await verifyMacApp(stagingPath);
    await fs.rm(targetPath, { recursive: true, force: true });
    await fs.rename(stagingPath, targetPath);
  } catch (error) {
    await fs.rm(stagingPath, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
  return targetPath;
}

async function verifyMacApp(appPath) {
  if (process.platform !== "darwin" || !appPath?.endsWith(".app")) {
    return { ok: true, skipped: true };
  }

  try {
    await execFileAsync("codesign", ["--verify", "--deep", "--strict", "--verbose=4", appPath], {
      maxBuffer: 8 * 1024 * 1024
    });
  } catch (error) {
    throw new Error(`Installed ${PRODUCT_NAME} failed codesign verification: ${commandOutput(error)}`);
  }

  try {
    const { stdout, stderr } = await execFileAsync("spctl", ["--assess", "--type", "execute", "--verbose=4", appPath], {
      maxBuffer: 8 * 1024 * 1024
    });
    return {
      ok: true,
      codeSignature: "valid",
      gatekeeper: "accepted",
      detail: String(stdout || stderr || "").trim()
    };
  } catch (error) {
    throw new Error(`Installed ${PRODUCT_NAME} was rejected by Gatekeeper: ${commandOutput(error)}`);
  }
}

function commandOutput(error) {
  return String(error?.stderr || error?.stdout || error?.message || error).trim();
}

async function findFirstApp(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name.endsWith(".app")) {
      return fullPath;
    }
    if (entry.isDirectory()) {
      const found = await findFirstApp(fullPath);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

async function ensure(options) {
  const current = await status({ checkLatest: true });
  const release = current.latest;
  const asset = release?.selectedAsset;
  const needsInstall = !current.installed;
  const needsUpdate = Boolean(current.installed && release?.updateAvailable);
  const plan = {
    action: needsInstall ? "install" : needsUpdate ? "update" : "none",
    current,
    release,
    asset,
    note: ""
  };

  if (plan.action === "none") {
    plan.note = current.appServer.ok ? "Workshop Desktop is installed and app server is reachable." : "Workshop Desktop is installed; open it to start the app server.";
    return plan;
  }

  if (!asset) {
    plan.note = `No matching installer package for ${process.platform}/${os.arch()} in ${release.url}.`;
    return plan;
  }

  if (!options.yes) {
    plan.note = "Run ensure --yes to download and apply this plan.";
    return plan;
  }

  const downloadedPath = await downloadAsset(asset, { htmlUrl: release.url });
  plan.downloadedPath = downloadedPath;

  if (process.platform === "darwin" && downloadedPath.toLowerCase().endsWith(".zip")) {
    plan.installedPath = await installMacZip(downloadedPath);
    plan.verification = await verifyMacApp(plan.installedPath);
    plan.note = `Installed ${PRODUCT_NAME} to ${plan.installedPath}.`;
    return plan;
  }

  if (process.platform !== "win32" && downloadedPath.toLowerCase().endsWith(".appimage")) {
    await fs.chmod(downloadedPath, 0o755);
  }
  plan.note = `Downloaded installer package to ${downloadedPath}. Install or run it with the platform's normal installer.`;
  return plan;
}

async function openApp() {
  const appPath = await findInstalledApp();
  if (!appPath) {
    throw new Error("Workshop Desktop is not installed. Run status --check-latest, then ensure --yes after approval.");
  }

  if (process.platform === "darwin") {
    const verification = await verifyMacApp(appPath);
    await execFileAsync("open", [appPath]);
    return { opened: true, appPath, verification };
  }
  if (process.platform === "win32") {
    spawn(appPath, { detached: true, stdio: "ignore" }).unref();
    return { opened: true, appPath };
  }
  spawn(appPath, { detached: true, stdio: "ignore" }).unref();
  return { opened: true, appPath };
}

async function bodyFromOptions(options) {
  const parts = [];
  if (options.title) {
    parts.push(`# ${options.title}`);
  }
  if (options.body) {
    parts.push(String(options.body));
  }
  if (options["body-file"]) {
    parts.push(await fs.readFile(options["body-file"], "utf8"));
  }
  return parts.join("\n\n").trim();
}

async function createRecord(options) {
  const scopeType = options.scope || "none";
  const params = {
    title: options.title,
    bodyMarkdown: await bodyFromOptions(options),
    scopeType,
    projectId: numberOption(options["project-id"], "--project-id"),
    projectName: options["project-name"],
    taskId: numberOption(options["task-id"], "--task-id"),
    taskTitle: options["task-title"],
    open: Boolean(options.open)
  };
  if (!params.title && !params.bodyMarkdown) {
    throw new Error("record create requires --title, --body, or --body-file");
  }
  return rpc("record.create", params);
}

function printResult(result, options) {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (Array.isArray(result?.projects)) {
    for (const project of result.projects) {
      console.log([project.id, project.name, project.organizationName].filter(Boolean).join("\t"));
    }
    return;
  }
  if (Array.isArray(result?.tasks)) {
    for (const task of result.tasks) {
      console.log([task.id, `[${task.state}]`, `project:${task.project_id}`, String(task.content || "").replace(/\s+/g, " ").slice(0, 120)].join("\t"));
    }
    return;
  }
  if (result?.record) {
    console.log([result.record.id, `[${result.record.scopeType}/${result.record.status}]`, result.record.title].join("\t"));
    return;
  }
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [command, subcommand, method] = options._;

  if (!command || command === "help" || command === "--help") {
    console.log(usage());
    return;
  }

  if (command === "status") {
    printResult(await status({ checkLatest: Boolean(options["check-latest"]) }), options);
    return;
  }

  if (command === "verify") {
    const appPath = await findInstalledApp();
    if (!appPath) {
      throw new Error("Workshop Desktop is not installed.");
    }
    printResult({ appPath, verification: await verifyMacApp(appPath) }, options);
    return;
  }

  if (command === "ensure") {
    printResult(await ensure({ yes: Boolean(options.yes) }), options);
    return;
  }

  if (command === "open") {
    printResult(await openApp(), options);
    return;
  }

  if (command === "record" && subcommand === "create") {
    printResult(await createRecord(options), options);
    return;
  }

  if (command === "project" && subcommand === "list") {
    printResult(await rpc("project.list", {}), options);
    return;
  }

  if (command === "task" && subcommand === "list") {
    const projectId = numberOption(options["project-id"], "--project-id");
    if (projectId === undefined) {
      throw new Error("task list requires --project-id");
    }
    printResult(await rpc("task.list", { projectId, states: splitList(options.state) }), options);
    return;
  }

  if (command === "rpc") {
    if (!subcommand) {
      throw new Error("rpc requires a method name");
    }
    const params = options.params ? JSON.parse(String(options.params)) : method ? JSON.parse(method) : {};
    printResult(await rpc(subcommand, params), { ...options, json: true });
    return;
  }

  throw new Error(`Unknown command: ${[command, subcommand].filter(Boolean).join(" ")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
