export function initializeWindowControls({ api, closeButton, minimizeButton, maximizeButton, dragRegion, onError = () => {} }) {
  if (!api || !closeButton || !minimizeButton || !maximizeButton || !dragRegion) {
    throw new TypeError("ArcOrbit window controls require the bounded API and complete titlebar elements.");
  }

  const controlMode = api.windowControlMode === "native-macos" ? "native-macos" : "custom";
  if (globalThis.document?.documentElement) document.documentElement.dataset.windowControlMode = controlMode;
  if (controlMode === "native-macos") {
    closeButton.setAttribute("aria-hidden", "true");
    minimizeButton.setAttribute("aria-hidden", "true");
    maximizeButton.setAttribute("aria-hidden", "true");
    closeButton.tabIndex = -1;
    minimizeButton.tabIndex = -1;
    maximizeButton.tabIndex = -1;
    return () => {};
  }

  const applyState = (state = {}) => {
    const maximized = Boolean(state.maximized);
    maximizeButton.classList.toggle("is-maximized", maximized);
    maximizeButton.setAttribute("aria-label", maximized ? "还原窗口" : "最大化窗口");
    maximizeButton.title = maximized ? "还原窗口" : "最大化窗口";
  };
  let stateEpoch = 0;
  const invoke = (action) => {
    const requestEpoch = ++stateEpoch;
    return Promise.resolve(action()).then((state) => {
      if (requestEpoch === stateEpoch && typeof state?.maximized === "boolean") applyState(state);
    }).catch(onError);
  };

  closeButton.addEventListener("click", () => invoke(() => api.closeWindow()));
  minimizeButton.addEventListener("click", () => invoke(() => api.minimizeWindow()));
  maximizeButton.addEventListener("click", () => invoke(() => api.toggleMaximizeWindow()));
  dragRegion.addEventListener("dblclick", () => invoke(() => api.toggleMaximizeWindow()));

  const unsubscribe = api.onWindowState((state) => {
    stateEpoch += 1;
    applyState(state);
  });
  invoke(() => api.getWindowState());
  return typeof unsubscribe === "function" ? unsubscribe : () => {};
}
