const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("arcOrbitImageViewer", {
  onState(listener) {
    const handler = (_event, state) => listener(state);
    ipcRenderer.on("arckit:work-task-image-viewer-state", handler);
    return () => ipcRenderer.off("arckit:work-task-image-viewer-state", handler);
  },
  save: () => ipcRenderer.invoke("arckit:work-task-image-viewer-save"),
  retry: () => ipcRenderer.invoke("arckit:work-task-image-viewer-retry")
});
