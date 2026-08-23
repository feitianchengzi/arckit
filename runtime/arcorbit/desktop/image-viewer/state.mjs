const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

export function initialImageViewerTransform() {
  return { zoom: 1, rotation: 0, offset_x: 0, offset_y: 0, mode: "fit" };
}

export function imageViewerFitScale({ image_width, image_height, viewport_width, viewport_height, rotation = 0 } = {}) {
  const quarterTurn = Math.abs(normalizeRotation(rotation)) % 180 === 90;
  const width = positive(quarterTurn ? image_height : image_width);
  const height = positive(quarterTurn ? image_width : image_height);
  const availableWidth = positive(viewport_width);
  const availableHeight = positive(viewport_height);
  if (!width || !height || !availableWidth || !availableHeight) return 1;
  return clampZoom(Math.min(availableWidth / width, availableHeight / height, 1));
}

export function reduceImageViewerTransform(state = initialImageViewerTransform(), action = {}) {
  const current = normalizeState(state);
  switch (action.type) {
    case "zoom":
      return { ...current, zoom: clampZoom(Number(action.zoom) || current.zoom), mode: "custom" };
    case "zoom_by":
      return { ...current, zoom: clampZoom(current.zoom * (Number(action.factor) || 1)), mode: "custom" };
    case "fit":
      return { ...current, zoom: clampZoom(action.zoom), offset_x: 0, offset_y: 0, mode: "fit" };
    case "actual":
      return { ...current, zoom: 1, offset_x: 0, offset_y: 0, mode: "actual" };
    case "rotate":
      return { ...current, rotation: normalizeRotation(current.rotation + Number(action.degrees || 0)), offset_x: 0, offset_y: 0 };
    case "pan":
      return { ...current, offset_x: current.offset_x + finite(action.x), offset_y: current.offset_y + finite(action.y), mode: "custom" };
    case "reset":
      return { zoom: clampZoom(action.zoom), rotation: 0, offset_x: 0, offset_y: 0, mode: "fit" };
    default:
      return current;
  }
}

export function normalizeRotation(value) {
  const rotation = Math.trunc(finite(value)) % 360;
  return rotation < 0 ? rotation + 360 : rotation;
}

function normalizeState(value = {}) {
  return {
    zoom: clampZoom(value.zoom),
    rotation: normalizeRotation(value.rotation),
    offset_x: finite(value.offset_x),
    offset_y: finite(value.offset_y),
    mode: ["fit", "actual", "custom"].includes(value.mode) ? value.mode : "custom"
  };
}

function clampZoom(value) {
  const zoom = Number(value);
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number.isFinite(zoom) && zoom > 0 ? zoom : 1));
}

function positive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
