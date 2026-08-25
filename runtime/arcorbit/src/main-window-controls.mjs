export function mainWindowState(window) {
  return {
    maximized: Boolean(window?.isMaximized?.() || window?.isFullScreen?.()),
    minimized: Boolean(window?.isMinimized?.())
  };
}

export function performMainWindowAction(window, action) {
  if (!window || window.isDestroyed?.()) throw new Error("ArcOrbit main window is unavailable.");
  if (action === "minimize") {
    window.minimize();
  } else if (action === "toggle-maximize") {
    if (window.isFullScreen?.()) window.setFullScreen(false);
    else if (window.isMaximized()) window.unmaximize();
    else window.maximize();
  } else if (action === "close") {
    window.close();
  } else {
    throw new TypeError("Unsupported ArcOrbit window action.");
  }
  return action === "close" ? { closed: true } : mainWindowState(window);
}

export function observeMainWindowState(window, listener) {
  const events = ["maximize", "unmaximize", "minimize", "restore", "enter-full-screen", "leave-full-screen"];
  const publish = () => listener(mainWindowState(window));
  for (const event of events) window.on(event, publish);
  return () => {
    for (const event of events) window.removeListener(event, publish);
  };
}
