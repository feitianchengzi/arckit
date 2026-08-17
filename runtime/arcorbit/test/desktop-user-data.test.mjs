import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { stableArcOrbitUserDataPath } from "../src/desktop-user-data.mjs";

test("ArcOrbit preserves the pre-rename Electron userData identity", () => {
  const appData = path.resolve(path.sep, "Users", "fixture", "Library", "Application Support");
  assert.equal(stableArcOrbitUserDataPath(appData), path.join(appData, "@arckit", "runtime"));
  assert.throws(() => stableArcOrbitUserDataPath("relative"), /explicit absolute path/);
});
