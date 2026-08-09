import { randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const EVENT_SCHEMA = "arckit-lifecycle-event/v1";
const SUMMARY_SCHEMA = "arckit-lifecycle-summary/v1";
const EVENT_TYPES = new Set(["runtime.lifecycle.span.started", "runtime.lifecycle.span.completed"]);
const COST_CENTERS = new Set(["orchestration", "task_execution", "external", "closeout", "unclassified"]);

export function createLifecycleTraceStore({ rootDir, now = () => new Date().toISOString() }) {
  const root = resolve(rootDir);
  const queues = new Map();
  const roots = new Map();

  async function startTrace(metadata = {}) {
    const traceId = safeId(metadata.trace_id) || createId("TRACE");
    const traceDir = join(root, traceId);
    const eventsFile = join(traceDir, "events.jsonl");
    const summaryFile = join(traceDir, "summary.json");
    await mkdir(traceDir, { recursive: true });
    const rootSpan = createSpanContext({
      traceId,
      name: "todo.lifecycle",
      category: "lifecycle",
      costCenter: "unclassified",
      scope: "desktop",
      attributes: sanitizeAttributes(metadata),
      now
    });
    enqueue(traceId, eventsFile, rootSpan.started_event);
    roots.set(traceId, rootSpan);
    return {
      trace_id: traceId,
      root_span_id: rootSpan.span_id,
      events_file: eventsFile,
      summary_file: summaryFile,
      root_span: rootSpan
    };
  }

  function startSpan(context, input = {}) {
    if (!context?.trace_id) return null;
    const span = createSpanContext({
      traceId: context.trace_id,
      parentSpanId: input.parent_span_id || context.root_span_id || "",
      name: input.name,
      category: input.category,
      costCenter: input.cost_center,
      scope: input.scope || "desktop",
      attributes: input.attributes,
      now
    });
    enqueue(context.trace_id, eventsPath(context.trace_id), span.started_event);
    return span;
  }

  function endSpan(context, span, input = {}) {
    if (!context?.trace_id || !span || span.ended) return null;
    const event = completeSpan(span, { ...input, now });
    enqueue(context.trace_id, eventsPath(context.trace_id), event);
    return event;
  }

  function recordEvent(event) {
    if (!isLifecycleEvent(event)) return false;
    enqueue(event.trace_id, eventsPath(event.trace_id), normalizeExternalEvent(event));
    return true;
  }

  async function finishTrace(context, input = {}) {
    if (!context?.trace_id) return null;
    const rootSpan = context.root_span || roots.get(context.trace_id) || null;
    if (rootSpan && !rootSpan.ended) endSpan(context, rootSpan, input);
    await flush(context.trace_id);
    if (!rootSpan) {
      const file = eventsPath(context.trace_id);
      const events = (await readFile(file, "utf8")).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
      const started = events.find((event) => event.type === "runtime.lifecycle.span.started" && !event.parent_span_id);
      const completed = events.find((event) => event.type === "runtime.lifecycle.span.completed" && event.span_id === started?.span_id);
      if (started && !completed) {
        const timestamp = now();
        enqueue(context.trace_id, file, {
          ...started,
          type: "runtime.lifecycle.span.completed",
          at: timestamp,
          completed_at: timestamp,
          duration_ms: Math.max(0, (Date.parse(timestamp) || Date.now()) - (Date.parse(started.started_at) || Date.now())),
          status: ["ok", "error", "cancelled"].includes(input.status) ? input.status : "ok",
          attributes: sanitizeAttributes(input.attributes),
          error: sanitizeError(input.error)
        });
        await flush(context.trace_id);
      }
    }
    const summary = await analyzeLifecycleTrace(eventsPath(context.trace_id));
    await writeFile(summaryPath(context.trace_id), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    roots.delete(context.trace_id);
    return summary;
  }

  function enqueue(traceId, file, event) {
    const normalized = safeId(traceId);
    if (!normalized) return;
    const previous = queues.get(normalized) || Promise.resolve();
    const operation = previous.catch(() => {}).then(async () => {
      await mkdir(join(root, normalized), { recursive: true });
      await appendFile(file, `${JSON.stringify(event)}\n`, "utf8");
    });
    queues.set(normalized, operation);
  }

  async function flush(traceId) {
    await (queues.get(safeId(traceId)) || Promise.resolve());
  }

  function eventsPath(traceId) {
    return join(root, safeId(traceId), "events.jsonl");
  }

  function summaryPath(traceId) {
    return join(root, safeId(traceId), "summary.json");
  }

  return {
    startTrace,
    startSpan,
    endSpan,
    recordEvent,
    finishTrace,
    flush
  };
}

export function startLifecycleSpan(options = {}, input = {}) {
  const traceId = safeId(input.trace_id || options.lifecycleTraceId);
  if (!traceId) return null;
  const span = createSpanContext({
    traceId,
    parentSpanId: input.parent_span_id || options.lifecycleParentSpanId || "",
    name: input.name,
    category: input.category,
    costCenter: input.cost_center || options.lifecycleCostCenter,
    scope: input.scope || "runtime",
    attributes: input.attributes,
    now: options.lifecycleNow || (() => new Date().toISOString()),
    monotonicNow: options.lifecycleMonotonicNow || (() => performance.now())
  });
  emitLifecycleEvent(options, span.started_event);
  return span;
}

export function endLifecycleSpan(options = {}, span, input = {}) {
  if (!span || span.ended) return null;
  const event = completeSpan(span, {
    ...input,
    now: options.lifecycleNow || (() => new Date().toISOString()),
    monotonicNow: options.lifecycleMonotonicNow || (() => performance.now())
  });
  emitLifecycleEvent(options, event);
  return event;
}

export async function analyzeLifecycleTrace(file) {
  const text = await readFile(resolve(file), "utf8");
  const events = text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`${file}:${index + 1}: invalid lifecycle JSONL: ${error.message}`);
    }
  });
  return buildLifecycleSummary(events, { sourceFile: resolve(file) });
}

export function buildLifecycleSummary(events, { sourceFile = "", generatedAt = new Date().toISOString() } = {}) {
  const spanMap = new Map();
  for (const event of events.filter(isLifecycleEvent)) {
    const existing = spanMap.get(event.span_id) || {};
    if (event.type === "runtime.lifecycle.span.started") {
      spanMap.set(event.span_id, {
        ...existing,
        ...event,
        attributes: { ...(existing.attributes || {}), ...(event.attributes || {}) },
        started_at: event.started_at || event.at
      });
    } else {
      spanMap.set(event.span_id, {
        ...existing,
        ...event,
        attributes: { ...(existing.attributes || {}), ...(event.attributes || {}) },
        completed_at: event.completed_at || event.at
      });
    }
  }
  const generatedMs = timestampMs(generatedAt) || Date.now();
  const spans = [...spanMap.values()].map((span) => {
    const startMs = timestampMs(span.started_at);
    const endMs = timestampMs(span.completed_at) || generatedMs;
    const durationMs = finiteNumber(span.duration_ms, Math.max(0, endMs - startMs));
    return {
      trace_id: span.trace_id || "",
      span_id: span.span_id || "",
      parent_span_id: span.parent_span_id || "",
      name: span.name || "unknown",
      category: span.category || "unknown",
      cost_center: normalizedCostCenter(span.cost_center),
      scope: span.scope || "",
      status: span.completed_at ? span.status || "ok" : "running",
      started_at: span.started_at || "",
      completed_at: span.completed_at || "",
      start_ms: startMs,
      end_ms: Math.max(startMs, endMs),
      duration_ms: durationMs,
      attributes: sanitizeAttributes(span.attributes),
      error: sanitizeError(span.error)
    };
  }).filter((span) => span.span_id && span.start_ms > 0);
  const children = new Map();
  for (const span of spans) {
    if (!span.parent_span_id) continue;
    const list = children.get(span.parent_span_id) || [];
    list.push(span);
    children.set(span.parent_span_id, list);
  }
  for (const span of spans) {
    const childIntervals = (children.get(span.span_id) || []).map((child) => [
      Math.max(span.start_ms, child.start_ms),
      Math.min(span.end_ms, child.end_ms)
    ]).filter(([start, end]) => end >= start);
    span.exclusive_ms = Math.max(0, span.duration_ms - intervalUnionDuration(childIntervals));
  }
  const roots = spans.filter((span) => !span.parent_span_id || !spanMap.has(span.parent_span_id));
  const traceStart = Math.min(...spans.map((span) => span.start_ms), generatedMs);
  const traceEnd = Math.max(...spans.map((span) => span.end_ms), traceStart);
  const totalMs = Math.max(0, traceEnd - traceStart);
  const costCenters = aggregate(spans, "cost_center");
  const categories = aggregate(spans, "category");
  const phases = aggregate(spans, "name").slice(0, 30);
  const topSpans = [...spans]
    .sort((left, right) => right.exclusive_ms - left.exclusive_ms || right.duration_ms - left.duration_ms)
    .slice(0, 20)
    .map(publicSpan);
  const orchestrationMs = aggregateValue(costCenters, "orchestration");
  const taskExecutionMs = aggregateValue(costCenters, "task_execution");
  const externalMs = aggregateValue(costCenters, "external");
  const closeoutMs = aggregateValue(costCenters, "closeout");
  const unclassifiedMs = aggregateValue(costCenters, "unclassified");
  const classifiedMs = orchestrationMs + taskExecutionMs + externalMs + closeoutMs + unclassifiedMs;
  const diagnosis = diagnose({
    totalMs,
    orchestrationMs,
    taskExecutionMs,
    externalMs,
    closeoutMs,
    unclassifiedMs,
    topSpans
  });
  return {
    schema_version: SUMMARY_SCHEMA,
    trace_id: spans[0]?.trace_id || "",
    source_file: sourceFile ? basename(sourceFile) : "",
    generated_at: generatedAt,
    started_at: traceStart ? new Date(traceStart).toISOString() : "",
    completed_at: roots.every((span) => span.status !== "running") && traceEnd ? new Date(traceEnd).toISOString() : "",
    status: spans.some((span) => span.status === "error") ? "error" : spans.some((span) => span.status === "running") ? "running" : "completed",
    total_ms: totalMs,
    span_count: spans.length,
    open_span_count: spans.filter((span) => span.status === "running").length,
    error_span_count: spans.filter((span) => span.status === "error").length,
    accounted_exclusive_ms: roundMs(classifiedMs),
    cost_centers: costCenters,
    categories,
    phase_hotspots: phases,
    top_exclusive_spans: topSpans,
    diagnosis
  };
}

function createSpanContext({
  traceId,
  parentSpanId = "",
  name,
  category = "runtime",
  costCenter = "unclassified",
  scope = "runtime",
  attributes = {},
  now = () => new Date().toISOString(),
  monotonicNow = () => performance.now()
}) {
  const timestamp = now();
  const span = {
    trace_id: safeId(traceId),
    span_id: createId("SPAN"),
    parent_span_id: safeId(parentSpanId),
    name: safeName(name),
    category: safeName(category),
    cost_center: normalizedCostCenter(costCenter),
    scope: safeName(scope),
    started_at: timestamp,
    monotonic_started_at: monotonicNow(),
    ended: false
  };
  span.started_event = {
    schema_version: EVENT_SCHEMA,
    type: "runtime.lifecycle.span.started",
    at: timestamp,
    trace_id: span.trace_id,
    span_id: span.span_id,
    parent_span_id: span.parent_span_id,
    name: span.name,
    category: span.category,
    cost_center: span.cost_center,
    scope: span.scope,
    started_at: timestamp,
    attributes: sanitizeAttributes(attributes)
  };
  return span;
}

function completeSpan(span, {
  status = "ok",
  attributes = {},
  error = null,
  now = () => new Date().toISOString(),
  monotonicNow = () => performance.now()
} = {}) {
  const timestamp = now();
  const durationMs = Math.max(0, monotonicNow() - span.monotonic_started_at);
  span.ended = true;
  return {
    schema_version: EVENT_SCHEMA,
    type: "runtime.lifecycle.span.completed",
    at: timestamp,
    trace_id: span.trace_id,
    span_id: span.span_id,
    parent_span_id: span.parent_span_id,
    name: span.name,
    category: span.category,
    cost_center: span.cost_center,
    scope: span.scope,
    started_at: span.started_at,
    completed_at: timestamp,
    duration_ms: roundMs(durationMs),
    status: ["ok", "error", "cancelled"].includes(status) ? status : "ok",
    attributes: sanitizeAttributes(attributes),
    error: sanitizeError(error)
  };
}

function emitLifecycleEvent(options, event) {
  if (typeof options.lifecycleEventSink === "function") {
    options.lifecycleEventSink(event);
  } else if (options.streamEvents) {
    console.error(JSON.stringify({ event }));
  }
}

function normalizeExternalEvent(event) {
  return {
    ...event,
    schema_version: EVENT_SCHEMA,
    trace_id: safeId(event.trace_id),
    span_id: safeId(event.span_id),
    parent_span_id: safeId(event.parent_span_id),
    name: safeName(event.name),
    category: safeName(event.category),
    cost_center: normalizedCostCenter(event.cost_center),
    scope: safeName(event.scope),
    attributes: sanitizeAttributes(event.attributes),
    error: sanitizeError(event.error)
  };
}

function aggregate(spans, key) {
  const values = new Map();
  for (const span of spans) {
    const name = String(span[key] || "unknown");
    const current = values.get(name) || { name, count: 0, inclusive_ms: 0, exclusive_ms: 0, max_ms: 0, error_count: 0 };
    current.count += 1;
    current.inclusive_ms += span.duration_ms;
    current.exclusive_ms += span.exclusive_ms;
    current.max_ms = Math.max(current.max_ms, span.duration_ms);
    if (span.status === "error") current.error_count += 1;
    values.set(name, current);
  }
  return [...values.values()]
    .map((entry) => Object.fromEntries(Object.entries(entry).map(([entryKey, value]) => (
      entryKey.endsWith("_ms") ? [entryKey, roundMs(value)] : [entryKey, value]
    ))))
    .sort((left, right) => right.exclusive_ms - left.exclusive_ms || right.inclusive_ms - left.inclusive_ms);
}

function publicSpan(span) {
  return {
    span_id: span.span_id,
    parent_span_id: span.parent_span_id,
    name: span.name,
    category: span.category,
    cost_center: span.cost_center,
    scope: span.scope,
    status: span.status,
    duration_ms: roundMs(span.duration_ms),
    exclusive_ms: roundMs(span.exclusive_ms),
    attributes: span.attributes
  };
}

function diagnose({ totalMs, orchestrationMs, taskExecutionMs, externalMs, closeoutMs, unclassifiedMs, topSpans }) {
  const denominator = Math.max(1, orchestrationMs + taskExecutionMs + externalMs + closeoutMs + unclassifiedMs);
  const ratios = {
    orchestration: orchestrationMs / denominator,
    task_execution: taskExecutionMs / denominator,
    external: externalMs / denominator,
    closeout: closeoutMs / denominator,
    unclassified: unclassifiedMs / denominator
  };
  let tendency = "mixed";
  let reason = "No single cost center dominates the observed exclusive time.";
  if (ratios.unclassified >= 0.3) {
    tendency = "insufficient_attribution";
    reason = "A material lifecycle interval is not covered by a child span; inspect open spans, interruption, recovery, or manual handoff boundaries.";
  } else if (ratios.external >= 0.4) {
    tendency = "external_dependency";
    reason = "Task-source or another external boundary dominates exclusive time.";
  } else if (ratios.orchestration >= 0.4 && orchestrationMs > taskExecutionMs) {
    tendency = "architecture_overhead";
    reason = "Runtime orchestration dominates task execution exclusive time.";
  } else if (ratios.closeout >= 0.35) {
    tendency = "closeout_overhead";
    reason = "Commit or completion closeout dominates exclusive time.";
  } else if (ratios.task_execution >= 0.5) {
    tendency = "task_specific";
    reason = "Agent/model/tool execution dominates the lifecycle.";
  }
  return {
    tendency,
    reason,
    total_wall_clock_ms: roundMs(totalMs),
    orchestration_exclusive_ms: roundMs(orchestrationMs),
    task_execution_exclusive_ms: roundMs(taskExecutionMs),
    external_exclusive_ms: roundMs(externalMs),
    closeout_exclusive_ms: roundMs(closeoutMs),
    unclassified_exclusive_ms: roundMs(unclassifiedMs),
    ratios: Object.fromEntries(Object.entries(ratios).map(([key, value]) => [key, Number(value.toFixed(4))])),
    primary_hotspot: topSpans[0] || null
  };
}

function intervalUnionDuration(intervals) {
  if (!intervals.length) return 0;
  const sorted = [...intervals].sort((left, right) => left[0] - right[0] || left[1] - right[1]);
  let total = 0;
  let [start, end] = sorted[0];
  for (const [nextStart, nextEnd] of sorted.slice(1)) {
    if (nextStart <= end) {
      end = Math.max(end, nextEnd);
    } else {
      total += Math.max(0, end - start);
      [start, end] = [nextStart, nextEnd];
    }
  }
  return total + Math.max(0, end - start);
}

function aggregateValue(entries, name) {
  return entries.find((entry) => entry.name === name)?.exclusive_ms || 0;
}

function isLifecycleEvent(event) {
  return Boolean(event && EVENT_TYPES.has(event.type) && safeId(event.trace_id) && safeId(event.span_id));
}

function safeId(value) {
  const normalized = String(value || "").trim();
  return /^[A-Za-z0-9._:-]{1,160}$/.test(normalized) ? normalized : "";
}

function safeName(value) {
  return String(value || "unknown").trim().replace(/[^A-Za-z0-9._:-]/g, "_").slice(0, 120) || "unknown";
}

function createId(prefix) {
  return `${prefix}-${randomUUID()}`;
}

function sanitizeAttributes(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result = {};
  for (const [key, raw] of Object.entries(value).slice(0, 32)) {
    const safeKey = safeName(key);
    if (["string", "number", "boolean"].includes(typeof raw)) {
      result[safeKey] = typeof raw === "string" ? redactSensitiveString(raw).slice(0, 240) : raw;
    }
  }
  return result;
}

function sanitizeError(error) {
  if (!error) return null;
  const message = typeof error === "string" ? error : error.message || String(error);
  return { name: safeName(error.name || "Error"), message: redactSensitiveString(message).slice(0, 500) };
}

function redactSensitiveString(value) {
  return String(value || "")
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [REDACTED]")
    .replace(/\b(authorization|access[_-]?token|refresh[_-]?token|api[_-]?key|password|secret)\b(\s*[=:]\s*|\s+)[^\s,;]+/gi, "$1$2[REDACTED]");
}

function normalizedCostCenter(value) {
  return COST_CENTERS.has(value) ? value : "unclassified";
}

function timestampMs(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function roundMs(value) {
  return Number(Math.max(0, Number(value) || 0).toFixed(3));
}
