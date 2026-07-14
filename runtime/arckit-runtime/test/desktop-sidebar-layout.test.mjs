import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/sidebar-layout-electron.mjs", import.meta.url));

test("desktop sidebar renders fixed project and chat item geometry for sparse and overflowing lists", {
  skip: process.env.ARCKIT_ELECTRON_LAYOUT_TEST !== "1" && "set ARCKIT_ELECTRON_LAYOUT_TEST=1 to run the real-render Electron regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], {
    env,
    timeout: 20_000,
    maxBuffer: 1024 * 1024
  });
  const measurements = JSON.parse(stdout.trim());

  for (const scenario of measurements.project) {
    assert.equal(scenario.count, scenario.itemHeights.length);
    assert.deepEqual(scenario.itemHeights, Array(scenario.count).fill(56));
    assert.equal(scenario.itemOverflow, "hidden");
    assert.deepEqual(scenario.contents.map((content) => content.height), [20, 18]);
    for (const content of scenario.contents) {
      assert.equal(content.overflow, "hidden");
      assert.equal(content.textOverflow, "ellipsis");
      assert.equal(content.whiteSpace, "nowrap");
      assert.equal(content.isClipped, true);
    }
  }

  for (const scenario of measurements.session) {
    assert.equal(scenario.count, scenario.itemHeights.length);
    assert.deepEqual(scenario.itemHeights, Array(scenario.count).fill(36));
    assert.equal(scenario.itemOverflow, "hidden");
    assert.deepEqual(scenario.contents.map((content) => content.height), [20]);
    assert.equal(scenario.contents[0].overflow, "hidden");
    assert.equal(scenario.contents[0].textOverflow, "ellipsis");
    assert.equal(scenario.contents[0].whiteSpace, "nowrap");
    assert.equal(scenario.contents[0].isClipped, true);
  }

  assert.ok(measurements.project[2].scrollHeight > measurements.project[2].clientHeight);
  assert.ok(measurements.session[2].scrollHeight > measurements.session[2].clientHeight);
});
