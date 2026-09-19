export function realtimeProjection(projects) {
  const entries = Object.fromEntries(Object.entries(projects).map(([id, item]) => [id, {
    state: item.state || "idle",
    mode: item.mode || "unknown",
    cursor: Number(item.cursor || 0),
    last_event_at: item.last_event_at || "",
    last_refreshed_at: item.last_refreshed_at || "",
    updated_at: item.updated_at || "",
    error: item.error || ""
  }]));
  const active = Object.values(entries).filter((item) => item.state !== "idle");
  const states = active.map((item) => item.state);
  const modes = [...new Set(active.map((item) => item.mode).filter((mode) => mode && mode !== "unknown"))];
  return {
    status: states.length === 0 ? "idle"
      : states.every((state) => state === "connected") ? "connected"
        : states.some((state) => state === "degraded") ? "degraded"
          : states.some((state) => state === "reconnecting") ? "reconnecting"
            : states.some((state) => state === "recovering") ? "recovering" : "connecting",
    mode: modes.length === 0 ? "unknown" : modes.length === 1 ? modes[0] : "mixed",
    last_refreshed_at: active.map((item) => item.last_refreshed_at).filter(Boolean).sort().at(-1) || "",
    projects: entries
  };
}

