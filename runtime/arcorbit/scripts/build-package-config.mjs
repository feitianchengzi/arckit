import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const options = parseArgs(process.argv.slice(2));
if (!["disabled", "auto", "required"].includes(options.signing)) throw new Error("--signing must be disabled, auto, or required.");
if (!["mac", "win", "linux"].includes(options.platform)) throw new Error("--platform must be mac, win, or linux.");
const buildRoot = path.resolve(options.buildRoot || path.join(runtimeRoot, "dist-package"));
const lock = JSON.parse(await readFile(path.join(buildRoot, "resources", "provisioning", "distribution-lock.json"), "utf8"));
const pkg = JSON.parse(await readFile(path.join(runtimeRoot, "package.json"), "utf8"));
const outputPath = path.join(buildRoot, "electron-builder.generated.json");
const resourcesFrom = path.relative(runtimeRoot, path.join(buildRoot, "resources")) || ".";
const notarize = options.signing !== "disabled" && options.notarize === "true";
const config = {
  appId: "com.feitianchengzi.arckit.runtime",
  productName: "ArcOrbit",
  executableName: "arcorbit",
  artifactName: `ArcOrbit-${lock.runtime.packageVersion}-${lock.runtime.channel}-${lock.runtime.buildLabel}-${"${os}"}-${"${arch}"}.${"${ext}"}`,
  directories: { output: "release", buildResources: "build" },
  asar: true,
  files: ["package.json", "bin/**/*", "adapters/**/*", "config/**/*", "desktop/**/*", "schemas/**/*", "src/**/*", "README.md"],
  extraResources: [
    { from: path.join(resourcesFrom, "arcorbit"), to: "arcorbit", filter: ["**/*"] },
    { from: path.join(resourcesFrom, "provisioning"), to: "provisioning", filter: ["**/*"] }
  ],
  extraMetadata: { name: pkg.name, version: lock.runtime.productVersion, description: pkg.description, main: "desktop/main.mjs", license: pkg.license },
  forceCodeSigning: options.signing === "required" && options.platform !== "linux",
  mac: {
    category: "public.app-category.developer-tools",
    target: ["dmg"],
    hardenedRuntime: options.signing !== "disabled",
    notarize,
    entitlements: "build/entitlements.mac.plist",
    entitlementsInherit: "build/entitlements.mac.inherit.plist",
    ...(options.signing === "disabled" ? { identity: null } : {})
  },
  dmg: { sign: options.signing !== "disabled" },
  win: { target: ["nsis"], ...(options.signing === "disabled" ? { sign: false } : {}) },
  nsis: { oneClick: false, perMachine: false, allowToChangeInstallationDirectory: true },
  linux: { target: ["AppImage"], category: "Development", maintainer: "Arckit Maintainers <hi@feitianchengzi.com>" },
  publish: null
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(outputPath);

function parseArgs(args) { const result = {}; for (let index = 0; index < args.length; index += 1) { if (args[index] === "--signing") result.signing = args[++index]; else if (args[index] === "--notarize") result.notarize = args[++index]; else if (args[index] === "--platform") result.platform = args[++index]; else if (args[index] === "--build-root") result.buildRoot = args[++index]; } return result; }
