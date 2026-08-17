import path from "node:path";

export function canonicalArcOrbitUserDataPath(appDataPath) {
  if (!appDataPath || !path.isAbsolute(appDataPath)) {
    throw new Error("appDataPath must be an explicit absolute path.");
  }
  return path.join(path.resolve(appDataPath), "@arckit", "arcorbit");
}
