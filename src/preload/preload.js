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
  selectGamelist: () => ipcRenderer.invoke('dialog:selectGamelist'),
  selectGameFiles: () => ipcRenderer.invoke('dialog:selectGameFiles'),

  scanRoms: (folderPath, extensions) => ipcRenderer.invoke('roms:scan', folderPath, extensions),
  scanExecutables: (folderPath, extensions) => ipcRenderer.invoke('fs:scanExecutables', folderPath, extensions),
  launchGame: (payload) => ipcRenderer.invoke('game:launch', payload),
  launchPcGame: (payload) => ipcRenderer.invoke('pc:launch', payload),
  detectPcRunners: () => ipcRenderer.invoke('pc:detectRunners'),
  installPcRunner: (runner) => ipcRenderer.invoke('pc:installRunner', { runner }),
  runWinetricks: (payload) => ipcRenderer.invoke('pc:winetricks', payload),
  stopLastGame: () => ipcRenderer.invoke('game:stopLast'),
  testEmulator: (payload) => ipcRenderer.invoke('emulator:test', payload),

  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  getFullscreenState: () => ipcRenderer.invoke('window:getFullscreenState'),
  setFullscreen: (value) => ipcRenderer.invoke('window:setFullscreen', value),

  cacheRemoteImage: (payload) => ipcRenderer.invoke('image:cacheRemote', payload),

  // Wspólne żądania HTTP do scraperów (bez CORS — idą przez proces main).
  httpRequest: (payload) => ipcRenderer.invoke('http:request', payload),

  focusGame: () => ipcRenderer.invoke('game:focus'),
  getLastLaunchedPid: () => ipcRenderer.invoke('game:lastPid'),

  getPlaytime: (gameId) => ipcRenderer.invoke('game:getPlaytime', gameId),
  getPlaytimeRaw: (gameId) => ipcRenderer.invoke('game:getPlaytimeRaw', gameId),
  getAllPlaytime: () => ipcRenderer.invoke('game:getPlaytimeAll'),

  exportBackup: () => ipcRenderer.invoke('backup:export'),
  importBackup: () => ipcRenderer.invoke('backup:import'),

  getPortableInfo: () => ipcRenderer.invoke('portable:get'),
  enablePortableMode: () => ipcRenderer.invoke('portable:enable'),
  disablePortableMode: () => ipcRenderer.invoke('portable:disable'),

  showItemInFolder: (targetPath) => ipcRenderer.invoke('shell:showItem', targetPath),
  pathExists: (targetPath) => ipcRenderer.invoke('fs:pathExists', targetPath),

  onWindowFocus: (cb) => onChannel('app:window-focus', cb),
  onWindowBlur: (cb) => onChannel('app:window-blur', cb),
  onRunnerProgress: (cb) => onChannel('runner:progress', cb)
});