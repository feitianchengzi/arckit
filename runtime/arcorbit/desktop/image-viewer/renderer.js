import { imageViewerFitScale, initialImageViewerTransform, reduceImageViewerTransform } from "./state.mjs";

const api = window.arcOrbitImageViewer;
const els = Object.fromEntries(Array.from(document.querySelectorAll("[id]")).map((element) => [element.id, element]));
let transform = initialImageViewerTransform();
let drag = null;

api.onState((state) => renderState(state));
document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => runAction(button.dataset.action)));
els.retryButton.addEventListener("click", retryImage);
window.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", () => {
  if (transform.mode === "fit" && !els.image.hidden) fitImage();
});
els.viewport.addEventListener("wheel", (event) => {
  if (els.image.hidden) return;
  event.preventDefault();
  transform = reduceImageViewerTransform(transform, { type: "zoom_by", factor: event.deltaY < 0 ? 1.12 : 1 / 1.12 });
  projectTransform();
}, { passive: false });
els.viewport.addEventListener("pointerdown", (event) => {
  if (els.image.hidden || transform.zoom <= fitScale()) return;
  drag = { x: event.clientX, y: event.clientY };
  els.viewport.setPointerCapture(event.pointerId);
  els.viewport.classList.add("is-panning");
});
els.viewport.addEventListener("pointermove", (event) => {
  if (!drag) return;
  transform = reduceImageViewerTransform(transform, { type: "pan", x: event.clientX - drag.x, y: event.clientY - drag.y });
  drag = { x: event.clientX, y: event.clientY };
  projectTransform();
});
els.viewport.addEventListener("pointerup", endPan);
els.viewport.addEventListener("pointercancel", endPan);

function renderState(state = {}) {
  els.fileName.textContent = state.file_name || "评论图片";
  if (state.status === "loading") {
    clearDisplayedImage();
    showStatus("正在载入图片…");
    return;
  }
  if (state.status === "error") {
    clearDisplayedImage();
    showStatus(state.message || "评论图片不可用。", true, 0, true);
    return;
  }
  if (state.status !== "ready" || !String(state.data_url || "").startsWith("data:image/")) return;
  showStatus("正在解码图片…");
  els.image.onload = () => {
    els.status.hidden = true;
    els.image.hidden = false;
    transform = initialImageViewerTransform();
    fitImage();
    els.viewport.focus();
  };
  els.image.onerror = () => showStatus("图片解码失败，请重试。", true, 0, true);
  els.image.alt = state.file_name || "评论图片";
  els.image.src = state.data_url;
}

function clearDisplayedImage() {
  els.image.hidden = true;
  els.image.removeAttribute("src");
  els.image.style.transform = "";
  els.viewport.classList.remove("can-pan", "is-panning");
  drag = null;
}

function runAction(action) {
  if (action === "save") return saveImage();
  if (els.image.hidden) return;
  if (action === "zoom-in") transform = reduceImageViewerTransform(transform, { type: "zoom_by", factor: 1.2 });
  if (action === "zoom-out") transform = reduceImageViewerTransform(transform, { type: "zoom_by", factor: 1 / 1.2 });
  if (action === "fit") return fitImage();
  if (action === "actual") transform = reduceImageViewerTransform(transform, { type: "actual" });
  if (action === "rotate-left") transform = reduceImageViewerTransform(transform, { type: "rotate", degrees: -90 });
  if (action === "rotate-right") transform = reduceImageViewerTransform(transform, { type: "rotate", degrees: 90 });
  if (action === "reset") transform = reduceImageViewerTransform(transform, { type: "reset", zoom: fitScale(0) });
  projectTransform();
}

function fitImage() {
  transform = reduceImageViewerTransform(transform, { type: "fit", zoom: fitScale() });
  projectTransform();
}

function fitScale(rotation = transform.rotation) {
  return imageViewerFitScale({
    image_width: els.image.naturalWidth,
    image_height: els.image.naturalHeight,
    viewport_width: Math.max(1, els.viewport.clientWidth - 48),
    viewport_height: Math.max(1, els.viewport.clientHeight - 48),
    rotation
  });
}

function projectTransform() {
  els.image.style.transform = `translate(${transform.offset_x}px, ${transform.offset_y}px) rotate(${transform.rotation}deg) scale(${transform.zoom})`;
  els.zoomValue.textContent = `${Math.round(transform.zoom * 100)}%`;
  els.viewport.classList.toggle("can-pan", transform.zoom > fitScale());
}

async function saveImage() {
  try {
    const result = await api.save();
    if (result?.saved) showStatus(`已保存为 ${result.file_name}`, false, 1800);
  } catch (error) {
    showStatus(error?.message || "图片保存失败，请重新选择位置。", true);
  }
}

async function retryImage() {
  showStatus("正在重新载入图片…");
  try {
    await api.retry();
  } catch (error) {
    showStatus(error?.message || "评论图片仍不可用。", true, 0, true);
  }
}

function showStatus(message, error = false, hideAfter = 0, retry = false) {
  els.statusMessage.textContent = message;
  els.retryButton.hidden = !retry;
  els.status.classList.toggle("error", error);
  els.status.hidden = false;
  if (hideAfter) window.setTimeout(() => { els.status.hidden = true; }, hideAfter);
}

function handleKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    return saveImage();
  }
  if (event.key === "Escape") return window.close();
  if (["+", "="].includes(event.key)) return runAction("zoom-in");
  if (event.key === "-") return runAction("zoom-out");
  if (event.key === "0") return runAction("fit");
  if (event.key === "1") return runAction("actual");
  if (event.key.toLowerCase() === "r") return runAction(event.shiftKey ? "rotate-left" : "rotate-right");
}

function endPan() {
  drag = null;
  els.viewport.classList.remove("is-panning");
}
