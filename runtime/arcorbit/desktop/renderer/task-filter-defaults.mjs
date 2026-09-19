export function defaultWorkFilters() {
  const end = new Date();
  const start = new Date(end.getTime() - 99 * 24 * 60 * 60 * 1000);
  return {
    creator_ids: [], executor_ids: [], tag_ids: [], priorities: [],
    start_time: start.toISOString().slice(0, 10), end_time: end.toISOString().slice(0, 10)
  };
}

