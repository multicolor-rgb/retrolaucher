const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('watchAPI', {
  stopLastGame: () => ipcRenderer.invoke('game:stopLast')
});