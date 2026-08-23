import { basename, extname } from "node:path";

export function createWorkTaskImageViewer({ BrowserWindow, dialog, writeFile, shellFile, preloadFile, loadImage, getParentWindow = () => null }) {
  let window = null;
  let ready = false;
  let generation = 0;
  let state = { status: "idle" };
  let currentImage = null;
  let currentInput = null;

  async function open(input) {
    currentInput = { ...input };
    const requestGeneration = ++generation;
    ensureWindow();
    currentImage = null;
    state = { status: "loading", file_name: safeFileName(input?.object_key) };
    sendState();
    window.show();
    window.focus();
    try {
      const image = await loadImage(input);
      if (requestGeneration !== generation || !window || window.isDestroyed()) return { opened: false, stale: true };
      currentImage = {
        bytes: image.bytes,
        data_url: image.data_url,
        content_type: image.content_type,
        file_name: safeFileName(image.file_name || input?.object_key)
      };
      state = { status: "ready", file_name: currentImage.file_name, data_url: currentImage.data_url };
      window.setTitle?.(`${currentImage.file_name} · ArcOrbit`);
      sendState();
      return { opened: true };
    } catch (error) {
      if (requestGeneration !== generation || !window || window.isDestroyed()) return { opened: false, stale: true };
      currentImage = null;
      state = { status: "error", file_name: safeFileName(input?.object_key), message: publicImageError(error) };
      sendState();
      throw error;
    }
  }

  async function retry(sender) {
    assertViewerSender(sender);
    if (!currentInput) throw new Error("当前没有可重试的评论图片。");
    return open(currentInput);
  }

  async function save(sender) {
    assertViewerSender(sender);
    if (!currentImage?.bytes) throw new Error("当前没有可保存的评论图片。");
    const extension = extname(currentImage.file_name).replace(/^\./, "");
    const result = await dialog.showSaveDialog(window, {
      title: "另存评论图片",
      defaultPath: currentImage.file_name,
      ...(extension ? { filters: [{ name: "Image", extensions: [extension] }] } : {})
    });
    if (result.canceled || !result.filePath) return { saved: false, canceled: true };
    await writeFile(result.filePath, currentImage.bytes);
    return { saved: true, file_name: basename(result.filePath) };
  }

  function owns(sender) {
    return Boolean(window && !window.isDestroyed() && sender === window.webContents);
  }

  function close() {
    generation += 1;
    if (window && !window.isDestroyed()) window.close();
  }

  function ensureWindow() {
    if (window && !window.isDestroyed()) return;
    ready = false;
    window = new BrowserWindow({
      parent: getParentWindow?.() || undefined,
      width: 980,
      height: 760,
      minWidth: 560,
      minHeight: 420,
      show: false,
      title: "评论图片 · ArcOrbit",
      backgroundColor: "#eef0f4",
      webPreferences: { preload: preloadFile, contextIsolation: true, nodeIntegration: false, sandbox: true }
    });
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event) => event.preventDefault());
    window.webContents.on("did-finish-load", () => {
      ready = true;
      sendState();
    });
    window.on("closed", () => {
      generation += 1;
      ready = false;
      currentImage = null;
      currentInput = null;
      state = { status: "idle" };
      window = null;
    });
    void window.loadFile(shellFile);
  }

  function sendState() {
    if (ready && window && !window.isDestroyed()) window.webContents.send("arckit:work-task-image-viewer-state", state);
  }

  function assertViewerSender(sender) {
    if (!owns(sender)) throw new Error("Image save is only available from the managed ArcOrbit image viewer.");
  }

  return { open, retry, save, owns, close };
}

function safeFileName(value) {
  const raw = String(value || "comment-image").split(/[\\/]/).pop() || "comment-image";
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch {}
  return decoded.replace(/[\u0000-\u001f\u007f<>:\"|?*]/g, "").slice(0, 180) || "comment-image";
}

function publicImageError(error) {
  const message = String(error?.message || "评论图片不可用。");
  return message.slice(0, 500);
}
