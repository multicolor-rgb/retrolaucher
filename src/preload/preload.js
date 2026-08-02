const { contextBridge, ipcRenderer } = require('electron');

function onChannel(channel, cb) {
  const listener = (_event, data) => cb(data);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('launcherAPI', {
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),

  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  selectExecutable: () => ipcRenderer.invoke('dialog:selectExecutable'),
  selectImageFile: () => ipcRenderer.invoke('dialog:selectImageFile'),

  scanRoms: (folderPath, extensions) => ipcRenderer.invoke('roms:scan', folderPath, extensions),
  launchGame: (payload) => ipcRenderer.invoke('game:launch', payload),
  stopLastGame: () => ipcRenderer.invoke('game:stopLast'),
  testEmulator: (payload) => ipcRenderer.invoke('emulator:test', payload),

  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  getFullscreenState: () => ipcRenderer.invoke('window:getFullscreenState'),
  setFullscreen: (value) => ipcRenderer.invoke('window:setFullscreen', value),

  cacheRemoteImage: (payload) => ipcRenderer.invoke('image:cacheRemote', payload),

  focusGame: () => ipcRenderer.invoke('game:focus'),
  getLastLaunchedPid: () => ipcRenderer.invoke('game:lastPid'),

  getPlaytime: (gameId) => ipcRenderer.invoke('game:getPlaytime', gameId),
  getPlaytimeRaw: (gameId) => ipcRenderer.invoke('game:getPlaytimeRaw', gameId),

  onWindowFocus: (cb) => onChannel('app:window-focus', cb),
  onWindowBlur: (cb) => onChannel('app:window-blur', cb)
});