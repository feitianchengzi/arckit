import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { canonicalArcOrbitUserDataPath } from "../src/desktop-user-data.mjs";

test("ArcOrbit uses only its canonical post-rename Electron userData identity", () => {
  const appData = path.resolve(path.sep, "Users", "fixture", "Library", "Application Support");
  assert.equal(canonicalArcOrbitUserDataPath(appData), path.join(appData, "@arckit", "arcorbit"));
  assert.notEqual(canonicalArcOrbitUserDataPath(appData), path.join(appData, "@arckit", "runtime"));
  assert.throws(() => canonicalArcOrbitUserDataPath("relative"), /explicit absolute path/);
});
