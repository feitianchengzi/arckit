const path = require("node:path");
const { flipFuses, getCurrentFuseWire, FuseVersion, FuseV1Options } = require("@electron/fuses");
const { Arch } = require("builder-util");
const FUSE_DISABLED = "0".charCodeAt(0);
const FUSE_ENABLED = "1".charCodeAt(0);

module.exports = async function flipArcOrbitFuses(context) {
  const executableName = context.packager.executableName;
  const executablePath = context.electronPlatformName === "darwin"
    ? path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)
    : path.join(context.appOutDir, context.electronPlatformName === "win32" ? `${executableName}.exe` : executableName);

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
    [FuseV1Options.GrantFileProtocolExtraPrivileges]: false
  });

  const wire = await getCurrentFuseWire(executablePath);
  const expected = new Map([
    [FuseV1Options.RunAsNode, FUSE_DISABLED],
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable, FUSE_DISABLED],
    [FuseV1Options.EnableNodeCliInspectArguments, FUSE_DISABLED],
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation, FUSE_ENABLED],
    [FuseV1Options.OnlyLoadAppFromAsar, FUSE_ENABLED]
  ]);
  for (const [fuse, state] of expected) {
    if (wire[fuse] !== state) throw new Error(`ArcOrbit packaged fuse ${FuseV1Options[fuse]} was not written as expected.`);
  }
};
