const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcherAPI', {
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  selectExecutable: () => ipcRenderer.invoke('dialog:selectExecutable'),
  scanRoms: (folderPath, extensions) => ipcRenderer.invoke('roms:scan', folderPath, extensions),
  launchGame: (payload) => ipcRenderer.invoke('game:launch', payload)
});
