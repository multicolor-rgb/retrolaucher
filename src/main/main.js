const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const CONFIG_PATH = path.join(app.getPath('userData'), 'retro-launcher-config.json');
let mainWindow;
let lastLaunchedPid = null;
let lastLaunchedCommand = null;
let lastEmulatorChild = null;
let launcherWasFullscreen = false;

function readConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
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
  if (!response.ok) throw new Error(`Nie udało się pobrać obrazka: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function isFlatpak() {
  return !!process.env.FLATPAK_ID || fs.existsSync('/.flatpak-info');
}

function buildSpawnCommand(command, args = []) {
  if (process.platform === 'linux' && isFlatpak()) {
    return { command: 'flatpak-spawn', args: ['--host', command, ...args] };
  }
  return { command, args };
}

function showLauncher() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setFocusable(true);
  mainWindow.setSkipTaskbar(false);
  if (launcherWasFullscreen) {
    mainWindow.show();
    mainWindow.setFullScreen(true);
  } else {
    mainWindow.show();
    mainWindow.restore();
  }
  mainWindow.focus();
  launcherWasFullscreen = false;
}

function hideLauncherForGame() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  launcherWasFullscreen = mainWindow.isFullScreen();
  mainWindow.blur();
  mainWindow.setSkipTaskbar(true);
  mainWindow.setFocusable(false);
  mainWindow.hide();
}

function createWindow() {
  const storedConfig = readConfig() || {};
  const fullscreenOnLaunch = !!storedConfig?.uiState?.fullscreenOnLaunch;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    icon: path.join(__dirname, '../../build/icons/512x512.png'),
    backgroundColor: '#05060a',
    autoHideMenuBar: true,
    fullscreen: fullscreenOnLaunch,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isKeyDown = input.type === 'keyDown';
    const key = String(input.key || '').toLowerCase();
    const isF11 = isKeyDown && key === 'f11';
    const isAltEnter = isKeyDown && input.alt && key === 'enter';
    const isF12 = isKeyDown && key === 'f12';
    const isCtrlShiftI = isKeyDown && input.control && input.shift && key === 'i';
    const isCtrlShiftJ = isKeyDown && input.control && input.shift && key === 'j';
    const isCtrlU = isKeyDown && input.control && key === 'u';
    const isAltOnly = isKeyDown && key === 'alt';
    if (isF11 || isAltEnter) {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      return;
    }
    if (isF12 || isCtrlShiftI || isCtrlShiftJ || isCtrlU || isAltOnly) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on('context-menu', (event) => event.preventDefault());
  mainWindow.on('system-context-menu', (event) => event.preventDefault());
  mainWindow.on('close', () => {
    lastEmulatorChild = null;
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('config:load', async () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    return null;
  } catch (e) {
    console.error('Blad wczytywania configu:', e);
    return null;
  }
});

ipcMain.handle('config:save', async (_event, config) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('window:toggleFullscreen', async () => {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) return { ok: false, error: 'Brak aktywnego okna.' };
    const nextState = !mainWindow.isFullScreen();
    mainWindow.setFullScreen(nextState);
    return { ok: true, fullscreen: nextState };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('window:getFullscreenState', async () => {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) return { ok: false, fullscreen: false, error: 'Brak aktywnego okna.' };
    return { ok: true, fullscreen: mainWindow.isFullScreen() };
  } catch (e) {
    return { ok: false, fullscreen: false, error: e.message };
  }
});

ipcMain.handle('window:setFullscreen', async (_event, value) => {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) return { ok: false, error: 'Brak aktywnego okna.' };
    const nextState = !!value;
    mainWindow.setFullScreen(nextState);
    return { ok: true, fullscreen: nextState };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('image:cacheRemote', async (_event, payload) => {
  try {
    const { url, platformKey, gameTitle, aspect } = payload || {};
    if (!url) return { ok: false, error: 'Brak URL obrazka.' };
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
      fs.writeFileSync(filePath, await downloadImageToBuffer(url));
    }
    return { ok: true, filePath, localUrl: pathToFileURL(filePath).toString() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:selectExecutable', async () => {
  const filters = process.platform === 'win32'
    ? [{ name: 'Programy', extensions: ['exe'] }, { name: 'Wszystkie pliki', extensions: ['*'] }]
    : [{ name: 'Wszystkie pliki', extensions: ['*'] }];
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:selectImageFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Obrazy', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
      { name: 'Wszystkie pliki', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

function scanFilesRecursive(rootDir, normalizedExts, baseDir = rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  let results = [];
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanFilesRecursive(fullPath, normalizedExts, baseDir));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (normalizedExts.length && !normalizedExts.includes(ext)) continue;
    const stat = fs.statSync(fullPath);
    const baseTitle = path.basename(entry.name, ext);
    const safeIdTitle = sanitizeGameIdPart(baseTitle);
    const relativePath = path.relative(baseDir, fullPath);
    results.push({
      id: `${safeIdTitle}-${stat.size}-${Math.floor(stat.mtimeMs)}`,
      title: baseTitle,
      rom: fullPath,
      location: fullPath,
      relativePath,
      fileName: entry.name,
      ext,
      size: stat.size,
      bytes: stat.size,
      mtimeMs: stat.mtimeMs
    });
  }
  return results;
}

ipcMain.handle('roms:scan', async (_event, folderPath, extensions) => {
  try {
    if (!folderPath || !fs.existsSync(folderPath)) return [];
    const normalizedExts = (extensions || []).map(ext => String(ext || '').trim().toLowerCase()).filter(Boolean);
    return scanFilesRecursive(folderPath, normalizedExts).sort((a, b) => a.title.localeCompare(b.title, 'pl', { sensitivity: 'base' }));
  } catch (e) {
    console.error('Blad skanowania ROM-ow:', e);
    return [];
  }
});

ipcMain.handle('game:launch', async (_event, { emulatorPath, romPath, extraArgs }) => {
  try {
    if (!emulatorPath) return { ok: false, error: 'Nie skonfigurowano emulatora dla tej platformy.' };
    const cleaned = parseCommandString(emulatorPath);
    const command = cleaned.shift();
    const args = [...cleaned, ...(extraArgs || []), romPath].filter(Boolean);
    if (!command) return { ok: false, error: 'Nieprawidłowe polecenie emulatora.' };
    const prepared = buildSpawnCommand(command, args);
    const child = spawn(prepared.command, prepared.args, { detached: true, stdio: 'ignore', windowsHide: true });
    lastLaunchedPid = child.pid || null;
    lastLaunchedCommand = command;
    lastEmulatorChild = child;
    child.unref();
    hideLauncherForGame();
    child.on('exit', () => {
      showLauncher();
      lastEmulatorChild = null;
    });
    return { ok: true, pid: lastLaunchedPid };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('game:focus', async () => {
  try {
    if (!lastLaunchedPid && !lastLaunchedCommand) return { ok: false, error: 'Brak ostatnio uruchomionego procesu.' };
    hideLauncherForGame();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('game:lastPid', async () => ({ pid: lastLaunchedPid, command: lastLaunchedCommand }));