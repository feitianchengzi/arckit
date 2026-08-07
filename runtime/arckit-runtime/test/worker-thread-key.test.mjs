import assert from "node:assert/strict";
import test from "node:test";
import {
  controllerThreadKey,
  normalizeWorkstreamId,
  workerContextScopeSignature,
  workerThreadKeyForTask
} from "../src/agent-orchestrator.mjs";

test("workers reuse context only within the same Case, semantic type, and workstream", () => {
  const workers = [
    task({ workerType: "product", workstreamId: "runtime-spec", skills: ["arckit-spec"], paths: ["arckit/spec/**"] }),
    task({ workerType: "product", workstreamId: "runtime-spec", skills: ["arckit-spec"], paths: ["arckit/spec/**"] }),
    task({ workerType: "product", workstreamId: "runtime-interaction", skills: ["arckit-interaction"], paths: ["arckit/interaction/**"] }),
    task({ workerType: "tech", workstreamId: "runtime-architecture", skills: ["arckit-tech"], paths: ["arckit/tech/**"] }),
    task({ workerType: "diagnosis", workstreamId: "context-loss", skills: ["arckit-debug-diagnosis"], paths: ["runtime/**"] }),
    task({ workerType: "implementation", workstreamId: "runtime-core", paths: ["runtime/arckit-runtime/**"] }),
    task({ workerType: "closeout", workstreamId: "case-closeout", paths: ["arckit/**"] }),
    task({
      workerType: "product",
      workstreamId: "runtime-spec",
      skills: ["arckit-spec"],
      paths: ["./arckit/spec/**"],
      caseRevision: "REV-2",
      role: "spec-reconciler"
    })
  ];

  assert.deepEqual(workers.map(workerThreadKeyForTask), [
    "worker:CASE-1:product:runtime-spec",
    "worker:CASE-1:product:runtime-spec",
    "worker:CASE-1:product:runtime-interaction",
    "worker:CASE-1:tech:runtime-architecture",
    "worker:CASE-1:diagnosis:context-loss",
    "worker:CASE-1:implementation:runtime-core",
    "worker:CASE-1:closeout:case-closeout",
    "worker:CASE-1:product:runtime-spec"
  ]);
});

test("verification uses an independent semantic thread", () => {
  const implementation = task({ workerType: "implementation", workstreamId: "runtime-core", paths: ["runtime/arckit-runtime/**"] });
  const verification = task({ workerType: "verification", workstreamId: "runtime-core", paths: ["runtime/arckit-runtime/**"] });
  const nextVerification = task({
    workerType: "verification",
    workstreamId: "runtime-core",
    paths: ["runtime/arckit-runtime/test/**"],
    caseRevision: "REV-2",
    role: "regression-verifier"
  });

  assert.equal(workerThreadKeyForTask(implementation), "worker:CASE-1:implementation:runtime-core");
  assert.equal(workerThreadKeyForTask(verification), "worker:CASE-1:verification:runtime-core");
  assert.equal(workerThreadKeyForTask(nextVerification), "worker:CASE-1:verification:runtime-core");
});

test("worker thread identity is isolated by Case", () => {
  assert.equal(workerThreadKeyForTask(task({ workerType: "implementation" })), "worker:CASE-1:implementation:default");
  assert.equal(workerThreadKeyForTask(task({ workerType: "implementation", caseId: "CASE-2" })), "worker:CASE-2:implementation:default");
  assert.equal(workerThreadKeyForTask(task({ workerType: "verification", caseId: "CASE-2" })), "worker:CASE-2:verification:default");
});

test("a Worker without a Case cannot reuse a thread", () => {
  assert.equal(workerThreadKeyForTask(task({ workerType: "implementation", caseId: "" })), "");
});

test("Controller project planning and Case review never share a thread", () => {
  assert.equal(controllerThreadKey({ phase: "planning" }), "controller:project:planning");
  assert.equal(controllerThreadKey({ phase: "review", caseId: "CASE-1" }), "controller:case:CASE-1:review");
  assert.equal(controllerThreadKey({ phase: "review", caseId: "CASE-2" }), "controller:case:CASE-2:review");
});

test("workstream ids and scope signatures are stable but keep independent domains apart", () => {
  assert.equal(normalizeWorkstreamId(" Runtime Core "), "runtime-core");
  const first = task({ workerType: "implementation", workstreamId: "runtime-core", paths: ["./runtime/**"] });
  const equivalent = task({ workerType: "implementation", workstreamId: "runtime-core", paths: ["runtime/**"] });
  const independent = task({ workerType: "implementation", workstreamId: "desktop-ui", paths: ["runtime/desktop/**"] });
  assert.equal(workerContextScopeSignature(first), workerContextScopeSignature(equivalent));
  assert.notEqual(workerContextScopeSignature(first), workerContextScopeSignature(independent));
});

function task({
  workerType,
  workstreamId = "",
  skills = [],
  paths = [],
  caseId = "CASE-1",
  caseRevision = "REV-1",
  role = "worker"
}) {
  return {
    worker_type: workerType,
    workstream_id: workstreamId,
    role,
    loop_frame_excerpt: {
      case_id: caseId,
      case_updated_at: caseRevision
    },
    scope: {
      allowed_skills: skills,
      allowed_paths: paths
    }
  };
}
