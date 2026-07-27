const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const CONFIG_PATH = path.join(app.getPath('userData'), 'retro-launcher-config.json');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#05060a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ---------- IPC: konfiguracja ----------
ipcMain.handle('config:load', async () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Blad wczytywania configu:', e);
  }
  return null;
});

ipcMain.handle('config:save', async (event, config) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ---------- IPC: wybor plikow/folderow ----------
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:selectExecutable', async () => {
  const filters = process.platform === 'win32'
    ? [{ name: 'Programy', extensions: ['exe'] }, { name: 'Wszystkie pliki', extensions: ['*'] }]
    : [{ name: 'Wszystkie pliki', extensions: ['*'] }];
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// ---------- IPC: skanowanie folderu ROM-ow ----------
ipcMain.handle('roms:scan', async (event, folderPath, extensions) => {
  try {
    if (!folderPath || !fs.existsSync(folderPath)) return [];
    const files = fs.readdirSync(folderPath);
    return files
      .filter(f => extensions.some(ext => f.toLowerCase().endsWith(ext.toLowerCase())))
      .map(f => ({
        title: path.basename(f, path.extname(f)),
        rom: path.join(folderPath, f)
      }));
  } catch (e) {
    console.error('Blad skanowania ROM-ow:', e);
    return [];
  }
});

// ---------- IPC: uruchamianie emulatora ----------
ipcMain.handle('game:launch', async (event, { emulatorPath, romPath, extraArgs }) => {
  try {
    if (!emulatorPath) {
      return { ok: false, error: 'Nie skonfigurowano emulatora dla tej platformy.' };
    }

    const parts = String(emulatorPath).match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    const cleaned = parts.map(p => p.replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
    const command = cleaned.shift();
    const args = [...cleaned, ...(extraArgs || []), romPath].filter(Boolean);

    const child = spawn(command, args, { detached: true, stdio: 'ignore' });
    child.unref();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('emulator:test', async (event, { emulatorPath, extraArgs }) => {
  try {
    if (!emulatorPath) return { ok: false, error: 'Brak polecenia uruchomieniowego.' };
    const parts = String(emulatorPath).match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    const cleaned = parts.map(p => p.replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
    const command = cleaned.shift();
    const args = [...cleaned, ...((extraArgs || []).filter(Boolean))];
    if (!command) return { ok: false, error: 'Nieprawidłowe polecenie.' };
    const child = spawn(command, args, { stdio: 'ignore' });
    child.on('error', (e) => {});
    setTimeout(() => { try { if (!child.killed) child.kill('SIGTERM'); } catch (e) {} }, 2500);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});
