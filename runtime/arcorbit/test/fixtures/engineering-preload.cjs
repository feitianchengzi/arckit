const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('sceneTest', {
  engineeringSnapshot: () => ipcRenderer.invoke('scene:snapshot'),
  engineeringUpdate: value => ipcRenderer.invoke('scene:update', value),
  engineeringImport: () => ipcRenderer.invoke('scene:import')
});
