import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/sidebar-layout-electron.mjs", import.meta.url));

test("platform desktop renders the confirmed multi-product shell geometry", {
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

  assert.equal(measurements.sidebarWidth, 244);
  assert.equal(measurements.titlebarHeight, 40);
  assert.equal(measurements.commandbarHeight, 64);
  assert.equal(measurements.viewCount, 8);
  assert.equal(measurements.activeViewDisplay, "block");
  assert.deepEqual(measurements.hiddenViewDisplays, ["none", "none", "none", "none", "none", "none", "none"]);
  assert.equal(measurements.metricColumns, 5);
  assert.equal(measurements.productColumns, 3);
  assert.equal(measurements.platformColumns, 2);
  assert.equal(measurements.commandColumns, 2);
  assert.equal(measurements.minBodyWidth, "1100px");
  assert.equal(measurements.transcriptLeft, measurements.transcriptColumnLeft);
  assert.equal(measurements.transcriptRight, measurements.transcriptColumnRight);
  assert.equal(measurements.transcriptRight, measurements.evidenceColumnLeft);
});

test("Intervention Workbench confines heading and transcript to the middle column at the responsive boundary", {
  skip: process.env.ARCORBIT_ELECTRON_LAYOUT_TEST !== "1" && process.env.ARCKIT_ELECTRON_LAYOUT_TEST !== "1" && "set ARCORBIT_ELECTRON_LAYOUT_TEST=1 to run the real-render Electron regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath, "--workbench-boundary"], {
    env,
    timeout: 20_000,
    maxBuffer: 1024 * 1024
  });
  const measurements = JSON.parse(stdout.trim());

  assert.equal(measurements.headingLeft, measurements.transcriptColumnLeft);
  assert.equal(measurements.headingRight, measurements.transcriptColumnRight);
  assert.ok(measurements.headingTitleLeft >= measurements.headingLeft);
  assert.ok(measurements.headingTitleRight <= measurements.headingRight);
  assert.equal(measurements.transcriptLeft, measurements.transcriptColumnLeft);
  assert.equal(measurements.transcriptRight, measurements.transcriptColumnRight);
  assert.ok(measurements.messageLeft >= measurements.transcriptLeft);
  assert.ok(measurements.messageRight <= measurements.transcriptRight);
  assert.equal(measurements.transcriptColumnRight, measurements.evidenceColumnLeft);
  assert.equal(measurements.evidenceColumnRight, measurements.workbenchLayoutRight);
  assert.equal(measurements.workbenchLayoutRight, measurements.viewportWidth);
});
