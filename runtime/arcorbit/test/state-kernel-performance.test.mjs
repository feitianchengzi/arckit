import assert from "node:assert/strict";
import test from "node:test";
import { runStateKernelBenchmark } from "../scripts/benchmark-state-kernel.mjs";

test("State Kernel isolates 50 MB history and passes the three-lane 30-minute equivalent stream budget", {
  skip: process.env.ARCORBIT_STATE_KERNEL_PERFORMANCE_TEST !== "1" && "set ARCORBIT_STATE_KERNEL_PERFORMANCE_TEST=1 to run the State Kernel architecture benchmark"
}, async (context) => {
  const result = await runStateKernelBenchmark();
  context.diagnostic(JSON.stringify(result));

  assert.ok(result.history_isolation.fixture_bytes >= 50 * 1024 * 1024);
  assert.equal(result.history_isolation.warm_partition_reads, 0);
  assert.equal(result.history_isolation.message_partition_reads, 0);
  assert.ok(result.history_isolation.warm_capture_p99_us < 1_000);
  assert.equal(result.streaming.lanes, 3);
  assert.equal(result.streaming.equivalent_duration_seconds, 30 * 60);
  assert.equal(result.streaming.events, 11_250);
  assert.ok(result.streaming.equivalent_logical_core_cpu_percent < 20);
  assert.ok(result.streaming.event_loop_p99_ms < 50);
  assert.ok(result.streaming.heap_delta_bytes < 64 * 1024 * 1024);
});
