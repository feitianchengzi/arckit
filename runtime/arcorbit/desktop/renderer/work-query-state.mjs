const DEFAULT_CACHE_LIMIT = 12;
const DEFAULT_WINDOW_SIZE = 80;

export function normalizeWorkQuery(input = {}) {
  const filters = input.filters && typeof input.filters === "object" ? input.filters : input;
  return {
    workset_id: String(input.workset_id || ""),
    project_id: String(input.project_id || "all"),
    state: String(input.state || "pending"),
    search_key: String(input.search_key || "").trim().toLowerCase(),
    creator_ids: normalizedValues(filters.creator_ids),
    executor_ids: normalizedValues(filters.executor_ids),
    tag_ids: normalizedValues(filters.tag_ids),
    priorities: normalizedValues(filters.priorities),
    start_time: String(filters.start_time || ""),
    end_time: String(filters.end_time || ""),
    offset: Math.max(0, Math.trunc(Number(input.offset) || 0)),
    limit: Math.min(200, Math.max(1, Math.trunc(Number(input.limit) || DEFAULT_WINDOW_SIZE)))
  };
}

export function workQueryKey(input = {}) {
  return JSON.stringify(normalizeWorkQuery(input));
}

export function createWorkQueryState({ cacheLimit = DEFAULT_CACHE_LIMIT } = {}) {
  const cache = new Map();
  const cachedGenerations = new Map();
  let epoch = 0;
  let generation = 0;
  let currentKey = "";

  function begin(input) {
    const query = normalizeWorkQuery(input);
    const key = workQueryKey(query);
    generation += 1;
    currentKey = key;
    const cached = cache.get(key) || null;
    if (cached) touch(key, cached);
    return { epoch, generation, key, query, cached };
  }

  function accept(request, value) {
    if (!request || value?.query_key !== request.key) return { current: false, accepted: false };
    const cachedGeneration = cachedGenerations.get(request.key) || 0;
    if (request.epoch === epoch && request.generation >= cachedGeneration) {
      touch(request.key, value);
      cachedGenerations.set(request.key, request.generation);
      trim();
    }
    return {
      current: request.epoch === epoch && request.generation === generation && request.key === currentKey,
      accepted: true
    };
  }

  function isCurrent(request) {
    return Boolean(request && request.epoch === epoch && request.generation === generation && request.key === currentKey);
  }

  function get(key) {
    return cache.get(key) || null;
  }

  function clear() {
    cache.clear();
    cachedGenerations.clear();
    epoch += 1;
    generation += 1;
    currentKey = "";
  }

  function touch(key, value) {
    cache.delete(key);
    cache.set(key, value);
  }

  function trim() {
    while (cache.size > cacheLimit) {
      const key = cache.keys().next().value;
      cache.delete(key);
      cachedGenerations.delete(key);
    }
  }

  return { begin, accept, isCurrent, get, clear, size: () => cache.size };
}

function normalizedValues(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value)).filter(Boolean))].sort();
}
