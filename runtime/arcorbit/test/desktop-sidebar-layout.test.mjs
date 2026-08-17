import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/sidebar-layout-electron.mjs", import.meta.url));

test("automation desktop renders the confirmed professional shell geometry", {
  skip: process.env.ARCORBIT_ELECTRON_LAYOUT_TEST !== "1" && process.env.ARCKIT_ELECTRON_LAYOUT_TEST !== "1" && "set ARCORBIT_ELECTRON_LAYOUT_TEST=1 to run the real-render Electron regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], {
    env,
    timeout: 20_000,
    maxBuffer: 1024 * 1024
  });
  const measurements = JSON.parse(stdout.trim());

  assert.equal(measurements.sidebarWidth, 228);
  assert.equal(measurements.titlebarHeight, 35);
  assert.equal(measurements.commandbarHeight, 58);
  assert.equal(measurements.viewCount, 4);
  assert.equal(measurements.activeViewDisplay, "block");
  assert.deepEqual(measurements.hiddenViewDisplays, ["none", "none", "none"]);
  assert.equal(measurements.metricColumns, 5);
  assert.equal(measurements.commandColumns, 2);
  assert.equal(measurements.minBodyWidth, "1100px");
});
