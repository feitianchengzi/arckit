import assert from "node:assert/strict";
import test from "node:test";
import { electronFixtureArguments } from "./electron-fixture-launch.mjs";

test("Electron fixtures disable the Chromium sandbox only on Linux CI", () => {
  const fixturePath = "/fixtures/experience-realization-electron.mjs";

  assert.deepEqual(
    electronFixtureArguments(fixturePath, { platform: "linux", ci: "true" }),
    ["--no-sandbox", fixturePath]
  );
  assert.deepEqual(
    electronFixtureArguments(fixturePath, { platform: "linux", ci: undefined }),
    [fixturePath]
  );
  assert.deepEqual(
    electronFixtureArguments(fixturePath, { platform: "darwin", ci: "true" }),
    [fixturePath]
  );
});
