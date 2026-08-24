const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("arcOrbitImageViewer", {
  onState(listener) {
    const handler = (_event, state) => listener(state);
    ipcRenderer.on("arckit:image-viewer-state", handler);
    return () => ipcRenderer.off("arckit:image-viewer-state", handler);
  },
  save: () => ipcRenderer.invoke("arckit:image-viewer-save"),
  retry: () => ipcRenderer.invoke("arckit:image-viewer-retry")
});
