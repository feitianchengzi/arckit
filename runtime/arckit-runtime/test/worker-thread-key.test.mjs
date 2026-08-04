import assert from "node:assert/strict";
import test from "node:test";
import { workerThreadKeyForTask } from "../src/agent-orchestrator.mjs";

test("all non-verification workers reuse one Case builder thread", () => {
  const workers = [
    task({ workerType: "product", skills: ["arckit-spec"], paths: ["arckit/spec/**"] }),
    task({ workerType: "product", skills: ["arckit-interaction"], paths: ["arckit/interaction/**"] }),
    task({ workerType: "product", skills: ["arckit-visual"], paths: ["arckit/visual/**"] }),
    task({ workerType: "tech", skills: ["arckit-tech"], paths: ["arckit/tech/**"] }),
    task({ workerType: "diagnosis", skills: ["arckit-debug-diagnosis"], paths: ["runtime/**"] }),
    task({ workerType: "implementation", paths: ["runtime/arckit-runtime/**"] }),
    task({ workerType: "closeout", paths: ["arckit/**"] }),
    task({
      workerType: "product",
      skills: ["arckit-spec"],
      paths: ["./arckit/spec/**"],
      caseRevision: "REV-2",
      role: "spec-reconciler"
    })
  ];

  for (const worker of workers) {
    assert.equal(workerThreadKeyForTask(worker), "worker:CASE-1:builder");
  }
});

test("verification uses the independent Case verifier thread", () => {
  const implementation = task({ workerType: "implementation", paths: ["runtime/arckit-runtime/**"] });
  const verification = task({ workerType: "verification", paths: ["runtime/arckit-runtime/**"] });
  const nextVerification = task({
    workerType: "verification",
    paths: ["runtime/arckit-runtime/test/**"],
    caseRevision: "REV-2",
    role: "regression-verifier"
  });

  assert.equal(workerThreadKeyForTask(implementation), "worker:CASE-1:builder");
  assert.equal(workerThreadKeyForTask(verification), "worker:CASE-1:verifier");
  assert.equal(workerThreadKeyForTask(nextVerification), "worker:CASE-1:verifier");
});

test("worker thread identity is isolated by Case", () => {
  assert.equal(workerThreadKeyForTask(task({ workerType: "implementation" })), "worker:CASE-1:builder");
  assert.equal(workerThreadKeyForTask(task({ workerType: "implementation", caseId: "CASE-2" })), "worker:CASE-2:builder");
  assert.equal(workerThreadKeyForTask(task({ workerType: "verification", caseId: "CASE-2" })), "worker:CASE-2:verifier");
});

test("a Worker without a Case cannot reuse a thread", () => {
  assert.equal(workerThreadKeyForTask(task({ workerType: "implementation", caseId: "" })), "");
});

function task({
  workerType,
  skills = [],
  paths = [],
  caseId = "CASE-1",
  caseRevision = "REV-1",
  role = "worker"
}) {
  return {
    worker_type: workerType,
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
