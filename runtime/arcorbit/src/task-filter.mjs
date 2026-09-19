export function matchesLocalTask(task, filters) {
  const states = boundedValues(filters.states);
  if (states.length > 0 && !states.includes(String(task.state))) return false;
  const search = String(filters.search_key || "").trim().toLocaleLowerCase();
  if (search && !String(task.content || "").toLocaleLowerCase().includes(search)) return false;
  if (!matchesBoundedValue(task.creator_id, filters.creator_ids)) return false;
  if (!matchesBoundedValue(task.executor_id, filters.executor_ids)) return false;
  if (!matchesBoundedValue(task.priority, filters.priorities)) return false;
  const selectedTags = boundedValues(filters.tag_ids);
  if (selectedTags.length > 0) {
    const taskTags = Array.isArray(task.tags)
      ? task.tags.map((tag) => String(tag?.id ?? tag))
      : String(task.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);
    if (!selectedTags.some((tag) => taskTags.includes(tag))) return false;
  }
  const createdAt = Date.parse(task.created_at || "");
  const start = Date.parse(filters.start_time || "");
  const endText = String(filters.end_time || "");
  const end = endText ? Date.parse(endText.length <= 10 ? `${endText}T23:59:59.999Z` : endText) : Number.NaN;
  if (Number.isFinite(start) && (!Number.isFinite(createdAt) || createdAt < start)) return false;
  if (Number.isFinite(end) && (!Number.isFinite(createdAt) || createdAt > end)) return false;
  return true;
}

function matchesBoundedValue(value, selected) {
  const values = boundedValues(selected);
  return values.length === 0 || values.includes(String(value ?? ""));
}

function boundedValues(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value).trim()).filter(Boolean))].slice(0, 100);
}
