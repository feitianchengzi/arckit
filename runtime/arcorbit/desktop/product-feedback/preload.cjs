const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("productFeedback", {
  switchMode: (mode) => ipcRenderer.invoke("arckit:product-feedback-mode", mode),
  retry: () => ipcRenderer.invoke("arckit:product-feedback-retry"),
  close: () => ipcRenderer.invoke("arckit:product-feedback-close"),
  onState: (listener) => {
    const handler = (_event, value) => listener(value);
    ipcRenderer.on("arckit:product-feedback-state", handler);
    return () => ipcRenderer.off("arckit:product-feedback-state", handler);
  }
});
