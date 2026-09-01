import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createDesktopStore } from "../src/desktop/desktop-store.mjs";
import { createRunActivityPatch } from "../src/projection/run-activity-patch.mjs";
import { applyRunActivityPatch } from "../desktop/renderer/run-activity-sync.mjs";

const HISTORY_BYTES = 50 * 1024 * 1024;
const STREAM_DURATION_SECONDS = 30 * 60;
const STREAM_INTERVAL_MS = 160;
const STREAM_EVENTS = Math.ceil(STREAM_DURATION_SECONDS * 1000 / STREAM_INTERVAL_MS);

export async function runStateKernelBenchmark() {
  const root = await mkdtemp(join(tmpdir(), "arcorbit-state-kernel-benchmark-"));
  const storePath = join(root, "desktop-store.json");
  try {
    let historyContent = "x".repeat(HISTORY_BYTES);
    await writeFile(storePath, `${JSON.stringify({
      version: 16,
      projects: [{ id: "LOCAL-1", name: "Local", path: root }],
      runs: [],
      sessions: { "LOCAL-1": [{ id: "SESSION-1", project_id: "LOCAL-1", kind: "chat" }] },
      messages: { "SESSION-1": [{ id: "MESSAGE-1", session_id: "SESSION-1", content: historyContent }] },
      settings: {},
      automation: {
        enabled: true,
        project_bindings: { "REMOTE-1": "LOCAL-1" },
        project_participation: { "REMOTE-1": true }
      },
      platform: {
        active_workset_id: "WORKSET-DEFAULT",
        worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["REMOTE-1"] }],
        task_sync: {
          user: { id: "USER-1" },
          project_catalog: [{ id: "REMOTE-1", current_user_id: "USER-1" }],
          projects: {
            "REMOTE-1": {
              project: { id: "REMOTE-1", current_user_id: "USER-1" },
              tasks: [{ id: "TASK-1", project_id: "REMOTE-1", executor_id: "USER-1", state: "pending" }],
              tags: [], trusted: true, revision: 1
            }
          },
          source_status: "healthy"
        }
      },
      chat: { selected_session_id: "SESSION-1" }
    })}\n`, "utf8");
    let migratingStore = createDesktopStore({ dataDir: root, runsDir: join(root, "runs"), storePath });
    await migratingStore.captureStateView();
    migratingStore = null;
    historyContent = null;
    globalThis.gc?.();

    const diskReads = [];
    const reopenedStore = createDesktopStore({
      dataDir: root,
      runsDir: join(root, "runs"),
      storePath,
      io: {
        async readJson(path) {
          const text = await readFile(path, "utf8");
          diskReads.push({ path, bytes: Buffer.byteLength(text) });
          return JSON.parse(text);
        }
      }
    });
    const coldView = await reopenedStore.captureStateView();
    const readsAfterColdCapture = diskReads.length;
    const captureDurations = [];
    for (let index = 0; index < 2_000; index += 1) {
      const started = performance.now();
      const view = await reopenedStore.captureStateView();
      captureDurations.push((performance.now() - started) * 1000);
      if (view !== coldView && view.state !== coldView.state) throw new Error("Warm state view identity changed without a mutation.");
    }
    const readsAfterWarmCapture = diskReads.length;
    await reopenedStore.updateControlStore((draft) => {
      draft.automation.queue_paused = !draft.automation.queue_paused;
      return draft;
    });
    const messagePartitionReads = diskReads.filter((entry) => entry.path.includes("session-messages")).length;
    const control = JSON.parse(await readFile(storePath, "utf8"));
    const messagePartitionBytes = (await stat(join(root, control.partitions.message_file))).size;

    globalThis.gc?.();
    const streaming = await benchmarkStreamingProjection();
    return {
      schema_version: "arcorbit-state-kernel-benchmark/v1",
      generated_at: new Date().toISOString(),
      history_isolation: {
        fixture_bytes: HISTORY_BYTES,
        message_partition_bytes: messagePartitionBytes,
        cold_partition_reads: readsAfterColdCapture,
        warm_partition_reads: readsAfterWarmCapture - readsAfterColdCapture,
        message_partition_reads: messagePartitionReads,
        warm_capture_p50_us: percentile(captureDurations, 50),
        warm_capture_p95_us: percentile(captureDurations, 95),
        warm_capture_p99_us: percentile(captureDurations, 99),
        control_snapshot_bytes: (await stat(storePath)).size
      },
      streaming
    };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function benchmarkStreamingProjection() {
  const runs = Array.from({ length: 3 }, (_, index) => ({
    id: `RUN-${index + 1}`,
    project_id: `LOCAL-${index + 1}`,
    session_id: `SESSION-${index + 1}`,
    task_id: `TASK-${index + 1}`,
    activity: {
      schema_version: "desktop-run-activity/v3",
      projection_revision: 0,
      run_id: `RUN-${index + 1}`,
      status: "running",
      current_step: "Starting",
      messages: [{ id: `MESSAGE-${index + 1}`, revision: 1, content: "Starting" }]
    }
  }));
  const previous = runs.map((run) => structuredClone(run.activity));
  const delay = monitorEventLoopDelay({ resolution: 10 });
  delay.enable();
  await new Promise((resolve) => setTimeout(resolve, 20));
  globalThis.gc?.();
  const heapBefore = process.memoryUsage().heapUsed;
  const cpuBefore = process.cpuUsage();
  const wallStarted = performance.now();
  for (let index = 0; index < STREAM_EVENTS; index += 1) {
    const lane = index % runs.length;
    const run = runs[lane];
    const baseRevision = run.activity.projection_revision;
    const current = {
      ...run.activity,
      current_step: `Lane ${lane + 1} event ${index + 1}`,
      messages: [{
        ...run.activity.messages[0],
        revision: run.activity.messages[0].revision + 1,
        content: `Streaming event ${index + 1}`
      }]
    };
    const patch = createRunActivityPatch({
      runId: run.id,
      previous: previous[lane],
      current,
      baseRevision,
      revision: baseRevision + 1
    });
    const projected = applyRunActivityPatch(run, patch);
    if (!projected) throw new Error(`Contiguous activity patch ${index + 1} was rejected.`);
    runs[lane] = projected;
    previous[lane] = structuredClone(current);
    previous[lane].projection_revision = projected.activity.projection_revision;
    if (index % 32 === 31) await new Promise((resolve) => setImmediate(resolve));
  }
  const wallMs = performance.now() - wallStarted;
  const cpu = process.cpuUsage(cpuBefore);
  globalThis.gc?.();
  const heapAfter = process.memoryUsage().heapUsed;
  await new Promise((resolve) => setTimeout(resolve, 20));
  delay.disable();
  const cpuMs = (cpu.user + cpu.system) / 1000;
  return {
    lanes: runs.length,
    equivalent_duration_seconds: STREAM_DURATION_SECONDS,
    interval_ms: STREAM_INTERVAL_MS,
    events: STREAM_EVENTS,
    replay_wall_ms: round(wallMs),
    replay_cpu_ms: round(cpuMs),
    equivalent_logical_core_cpu_percent: round((cpuMs / (STREAM_DURATION_SECONDS * 1000)) * 100),
    event_loop_p99_ms: round(delay.percentile(99) / 1e6),
    event_loop_max_ms: round(delay.max / 1e6),
    heap_delta_bytes: heapAfter - heapBefore,
    final_revisions: runs.map((run) => run.activity.projection_revision)
  };
}

function percentile(values, target) {
  const sorted = [...values].sort((left, right) => left - right);
  return round(sorted[Math.min(sorted.length - 1, Math.floor((target / 100) * sorted.length))] || 0, 3);
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runStateKernelBenchmark();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
