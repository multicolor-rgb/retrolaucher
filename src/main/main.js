const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const CONFIG_PATH = path.join(app.getPath('userData'), 'retro-launcher-config.json');

let mainWindow;

function readConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Blad odczytu configu przy starcie:', e);
    return null;
  }
}

function sanitizeFileName(name) {
  return String(name || 'cover')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function sanitizeGameIdPart(name) {
  return String(name || 'game')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function parseCommandString(value) {
  const parts = String(value).match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  return parts.map(p => p.replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
}

async function downloadImageToBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Nie udało się pobrać obrazka: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function createWindow() {
  const storedConfig = readConfig() || {};
  const fullscreenOnLaunch = !!storedConfig?.uiState?.fullscreenOnLaunch;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
      icon: path.join(__dirname, 'build', 'icon.png'),

    backgroundColor: '#05060a',
    autoHideMenuBar: true,
    fullscreen: fullscreenOnLaunch,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isKeyDown = input.type === 'keyDown';
    const key = String(input.key || '').toLowerCase();

    const isF11 = isKeyDown && key === 'f11';
    const isAltEnter = isKeyDown && input.alt && key === 'enter';

    if (isF11 || isAltEnter) {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
}

app.whenReady().then(() => {
  createWindow();
});

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

// ---------- IPC: fullscreen ----------
ipcMain.handle('window:toggleFullscreen', async () => {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return { ok: false, error: 'Brak aktywnego okna.' };
    }

    const nextState = !mainWindow.isFullScreen();
    mainWindow.setFullScreen(nextState);

    return { ok: true, fullscreen: nextState };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('window:getFullscreenState', async () => {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return { ok: false, fullscreen: false, error: 'Brak aktywnego okna.' };
    }

    return { ok: true, fullscreen: mainWindow.isFullScreen() };
  } catch (e) {
    return { ok: false, fullscreen: false, error: e.message };
  }
});

ipcMain.handle('window:setFullscreen', async (event, value) => {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return { ok: false, error: 'Brak aktywnego okna.' };
    }

    const nextState = !!value;
    mainWindow.setFullScreen(nextState);

    return { ok: true, fullscreen: nextState };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ---------- IPC: cache obrazkow ----------
ipcMain.handle('image:cacheRemote', async (event, payload) => {
  try {
    const { url, platformKey, gameTitle, aspect } = payload || {};

    if (!url) {
      return { ok: false, error: 'Brak URL obrazka.' };
    }

    const parsedUrl = new URL(url);
    const ext = path.extname(parsedUrl.pathname) || '.png';

    const safePlatform = sanitizeFileName(platformKey || 'unknown');
    const safeTitle = sanitizeFileName(gameTitle || 'game');
    const safeAspect = sanitizeFileName(aspect || 'standard');

    const coversDir = path.join(app.getPath('userData'), 'covers', safePlatform);
    fs.mkdirSync(coversDir, { recursive: true });

    const fileName = `${safeTitle}__${safeAspect}${ext}`;
    const filePath = path.join(coversDir, fileName);

    if (!fs.existsSync(filePath)) {
      const buffer = await downloadImageToBuffer(url);
      fs.writeFileSync(filePath, buffer);
    }

    return {
      ok: true,
      filePath,
      localUrl: pathToFileURL(filePath).toString()
    };
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
    ? [
        { name: 'Programy', extensions: ['exe'] },
        { name: 'Wszystkie pliki', extensions: ['*'] }
      ]
    : [
        { name: 'Wszystkie pliki', extensions: ['*'] }
      ];

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

    const normalizedExts = (extensions || [])
      .map(ext => String(ext || '').trim().toLowerCase())
      .filter(Boolean);

    const files = fs.readdirSync(folderPath, { withFileTypes: true });

    return files
      .filter(entry => entry.isFile())
      .filter(entry => {
        const ext = path.extname(entry.name).toLowerCase();
        if (!normalizedExts.length) return true;
        return normalizedExts.includes(ext);
      })
      .map(entry => {
        const fullPath = path.join(folderPath, entry.name);
        const stat = fs.statSync(fullPath);
        const baseTitle = path.basename(entry.name, path.extname(entry.name));
        const safeIdTitle = sanitizeGameIdPart(baseTitle);
        const ext = path.extname(entry.name).toLowerCase();

        return {
          id: `${safeIdTitle}-${stat.size}-${Math.floor(stat.mtimeMs)}`,
          title: baseTitle,
          rom: fullPath,
          location: fullPath,
          fileName: entry.name,
          ext,
          size: stat.size,
          bytes: stat.size,
          mtimeMs: stat.mtimeMs
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title, 'pl', { sensitivity: 'base' }));
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

    const cleaned = parseCommandString(emulatorPath);
    const command = cleaned.shift();
    const args = [...cleaned, ...(extraArgs || []), romPath].filter(Boolean);

    if (!command) {
      return { ok: false, error: 'Nieprawidłowe polecenie emulatora.' };
    }

    const child = spawn(command, args, { detached: true, stdio: 'ignore' });
    child.unref();

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('emulator:test', async (event, { emulatorPath, extraArgs }) => {
  try {
    if (!emulatorPath) {
      return { ok: false, error: 'Brak polecenia uruchomieniowego.' };
    }

    const cleaned = parseCommandString(emulatorPath);
    const command = cleaned.shift();
    const args = [...cleaned, ...((extraArgs || []).filter(Boolean))];

    if (!command) {
      return { ok: false, error: 'Nieprawidłowe polecenie.' };
    }

    const child = spawn(command, args, { stdio: 'ignore' });
    child.on('error', () => {});

    setTimeout(() => {
      try {
        if (!child.killed) child.kill('SIGTERM');
      } catch (e) {}
    }, 2500);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});