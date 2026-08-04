import assert from "node:assert/strict";
import test from "node:test";

import { artifactPathAllowedByPatterns } from "../src/artifact-ownership-map.mjs";
import { reduceWorkerReports } from "../src/controller-reducer.mjs";

test("artifact path scopes support recursive and segment globs", () => {
  assert.equal(artifactPathAllowedByPatterns(
    "sources/src/business/pages/modules/tool/DataConversionToolModule.cpp",
    ["sources/src/**"]
  ), true);
  assert.equal(artifactPathAllowedByPatterns(
    "sources/tests/framework/test_qml_runtime.cpp",
    ["sources/tests/**/*.cpp"]
  ), true);
  assert.equal(artifactPathAllowedByPatterns(
    "sources/src/nested/OverlayManager.cpp",
    ["sources/src/*.cpp"]
  ), false);
  assert.equal(artifactPathAllowedByPatterns(
    "sources/resources/qml/components/Panel.qml",
    ["sources/src/**"]
  ), false);
  assert.equal(artifactPathAllowedByPatterns(
    "sources/src/file.cpp",
    ["../sources/src/**"]
  ), false);
});

test("recursive worker scopes do not create false artifact-outside-scope blockers", () => {
  const taskId = "TASK-01-implementation";
  const artifacts = [
    "sources/src/business/pages/modules/tool/DataConversionToolModule.cpp",
    "sources/resources/qml/components/PointCloudDisplayModePanel.qml",
    "sources/tests/business/modules/tool/test_data_conversion_tool.cpp"
  ];
  const report = {
    schema_version: "arckit-worker-report/v2",
    task_id: taskId,
    worker_type: "implementation",
    role: "implementation-worker",
    status: "completed",
    summary: "Implemented and verified the bounded change.",
    findings: [],
    evidence: ["focused tests passed"],
    changes: ["Updated the authorized implementation surface."],
    artifact_impacts: artifacts.map((artifact) => ({
      artifact,
      operation: "updated",
      claim: "implementation_state",
      summary: "Authorized implementation change.",
      evidence: ["focused tests passed"]
    })),
    case_state_claims: [],
    risks: [],
    unknowns: [],
    recommendation: "Accept the implementation evidence.",
    requires_main_agent_decision: false,
    requires_human_decision: false
  };

  const result = reduceWorkerReports({
    reports: [report],
    loopFrame: {
      case_id: "CASE-1",
      worker_packets: [{
        worker_id: taskId,
        worker_type: "implementation",
        allowed_paths: ["sources/src/**", "sources/resources/**", "sources/tests/**"]
      }],
      execution_gate: { status: "authorized" }
    },
    round: { gap_id: "CASE-1:implementation_state" },
    dryRun: false
  });

  assert.equal(result.hard_gate.status, "pass");
  assert.equal(result.hard_gate.blockers.length, 0);
  assert.deepEqual(result.changed_files, artifacts);
});
