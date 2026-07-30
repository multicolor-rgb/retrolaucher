const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcherAPI', {
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),

  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  selectExecutable: () => ipcRenderer.invoke('dialog:selectExecutable'),

  scanRoms: (folderPath, extensions) => ipcRenderer.invoke('roms:scan', folderPath, extensions),
  launchGame: (payload) => ipcRenderer.invoke('game:launch', payload),
  testEmulator: (payload) => ipcRenderer.invoke('emulator:test', payload),

  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  getFullscreenState: () => ipcRenderer.invoke('window:getFullscreenState'),
  setFullscreen: (value) => ipcRenderer.invoke('window:setFullscreen', value),

  cacheRemoteImage: (payload) => ipcRenderer.invoke('image:cacheRemote', payload)
});