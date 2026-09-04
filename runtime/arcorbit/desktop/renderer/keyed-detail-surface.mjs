export function createKeyedDetailSurface({
  host,
  scrollSelector,
  focusKeyAttribute = "data-detail-focus-key"
} = {}) {
  if (!host || !scrollSelector) throw new Error("Keyed Detail Surface requires a host and scroll selector.");

  let activeContextId = null;
  let renderedHtml = null;

  function render({ contextId, html = "" } = {}) {
    const nextContextId = String(contextId || "empty");
    const contextChanged = nextContextId !== activeContextId;
    if (!contextChanged && html === renderedHtml) {
      return { changed: false, contextChanged: false };
    }

    const scroll = contextChanged ? null : host.querySelector(scrollSelector);
    const scrollTop = Number(scroll?.scrollTop || 0);
    const focus = contextChanged ? null : captureFocus(host, focusKeyAttribute);

    host.innerHTML = html;
    activeContextId = nextContextId;
    renderedHtml = html;

    if (!contextChanged) {
      restoreFocus(host, focusKeyAttribute, focus);
      const nextScroll = host.querySelector(scrollSelector);
      if (nextScroll) nextScroll.scrollTop = scrollTop;
    }

    return { changed: true, contextChanged };
  }

  return {
    render,
    contextId() { return activeContextId; }
  };
}

function captureFocus(host, focusKeyAttribute) {
  const activeElement = host.ownerDocument?.activeElement;
  if (!activeElement || !host.contains(activeElement)) return null;
  const key = activeElement.getAttribute?.(focusKeyAttribute);
  if (!key) return null;
  return {
    key,
    value: typeof activeElement.value === "string" ? activeElement.value : null,
    selectionStart: numericSelection(activeElement.selectionStart),
    selectionEnd: numericSelection(activeElement.selectionEnd),
    selectionDirection: activeElement.selectionDirection || "none"
  };
}

function restoreFocus(host, focusKeyAttribute, focus) {
  if (!focus) return;
  const next = Array.from(host.querySelectorAll(`[${focusKeyAttribute}]`))
    .find((candidate) => candidate.getAttribute?.(focusKeyAttribute) === focus.key);
  if (!next) return;
  if (focus.value !== null && typeof next.value === "string") next.value = focus.value;
  next.focus?.({ preventScroll: true });
  if (focus.selectionStart === null || focus.selectionEnd === null || !next.setSelectionRange) return;
  next.setSelectionRange(focus.selectionStart, focus.selectionEnd, focus.selectionDirection);
}

function numericSelection(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}
