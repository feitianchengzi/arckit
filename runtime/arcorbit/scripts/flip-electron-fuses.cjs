const path = require("node:path");
const { flipFuses, getCurrentFuseWire, FuseVersion, FuseV1Options } = require("@electron/fuses");
const { Arch } = require("builder-util");
const FUSE_DISABLED = "0".charCodeAt(0);
const FUSE_ENABLED = "1".charCodeAt(0);

module.exports = async function flipArcOrbitFuses(context) {
  const executablePath = resolvePackagedExecutablePath(context);

  await flipFuses(executablePath, {
    version: FuseVersion.V1,
    strictlyRequireAllFuses: true,
    resetAdHocDarwinSignature: context.electronPlatformName === "darwin" && context.arch === Arch.arm64,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
    [FuseV1Options.GrantFileProtocolExtraPrivileges]: true
  });

  const wire = await getCurrentFuseWire(executablePath);
  const expected = new Map([
    [FuseV1Options.RunAsNode, FUSE_DISABLED],
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable, FUSE_DISABLED],
    [FuseV1Options.EnableNodeCliInspectArguments, FUSE_DISABLED],
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation, FUSE_ENABLED],
    [FuseV1Options.OnlyLoadAppFromAsar, FUSE_ENABLED],
    [FuseV1Options.GrantFileProtocolExtraPrivileges, FUSE_ENABLED]
  ]);
  for (const [fuse, state] of expected) {
    if (wire[fuse] !== state) throw new Error(`ArcOrbit packaged fuse ${FuseV1Options[fuse]} was not written as expected.`);
  }
};

function resolvePackagedExecutablePath(context) {
  const { appOutDir, electronPlatformName, packager } = context;
  if (electronPlatformName === "darwin") return path.join(appOutDir, `${packager.appInfo.productFilename}.app`);
  if (electronPlatformName === "win32") return path.join(appOutDir, `${packager.appInfo.productFilename}.exe`);
  if (electronPlatformName === "linux") return path.join(appOutDir, packager.executableName);
  throw new Error(`Unsupported Electron platform for ArcOrbit fuse configuration: ${electronPlatformName}`);
}

module.exports.resolvePackagedExecutablePath = resolvePackagedExecutablePath;
