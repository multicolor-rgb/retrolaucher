const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

let mainWindow;
let inputWatchWindow;
let lastLaunchedPid = null;
let lastLaunchedCommand = null;
let lastEmulatorChild = null;
let launcherWasFullscreen = false;

let CONFIG_PATH;
let PLAYTIME_PATH;

// ---------------------------------------------------------------- tryb przenośny
//
// Jeśli obok launchera (w wersji dev: w katalogu projektu) leży plik
// `portable.flag`, dane użytkownika trzymamy w <root>/LauncherData zamiast
// w systemowym katalogu użytkownika. Dzięki temu konfiguracja, statystyki
// i cache okładek jadą razem z pendrive'em.

function resolvePortableRoot() {
  if (process.env.APPIMAGE) return path.dirname(process.env.APPIMAGE);
  if (!app.isPackaged) return path.resolve(__dirname, '..', '..');
  return path.dirname(app.getPath('exe'));
}

const PORTABLE_ROOT = resolvePortableRoot();
const PORTABLE_FLAG_PATH = path.join(PORTABLE_ROOT, 'portable.flag');
const PORTABLE_DATA_DIR = path.join(PORTABLE_ROOT, 'LauncherData');
const DEFAULT_USER_DATA = app.getPath('userData');

let portableMode = false;

try {
  portableMode = fs.existsSync(PORTABLE_FLAG_PATH);
  if (portableMode) {
    fs.mkdirSync(PORTABLE_DATA_DIR, { recursive: true });
    app.setPath('userData', PORTABLE_DATA_DIR);
    // Cache Chromium (Cookies, GPUCache itd.) zostawiamy poza pendrive'em —
    // na nośniku trzymamy tylko config, statystyki i okładki.
    try {
      app.setPath('sessionData', path.join(DEFAULT_USER_DATA, 'portable-session'));
    } catch (_) {}
  }
} catch (e) {
  console.error('Nie udało się włączyć trybu przenośnego:', e);
  portableMode = false;
}

const PORTABLE_FILES = [
  'retro-launcher-config.json',
  'retro-launcher-playtime.json'
];

function copyPortableData(fromDir, toDir) {
  fs.mkdirSync(toDir, { recursive: true });

  PORTABLE_FILES.forEach(file => {
    const src = path.join(fromDir, file);
    const dst = path.join(toDir, file);
    try {
      if (fs.existsSync(src)) fs.copyFileSync(src, dst);
    } catch (e) {
      console.error(`Nie udało się skopiować ${file}:`, e);
    }
  });

  // Cache okładek jest częścią danych użytkownika — bez niego po przeniesieniu
  // na inny komputer trzeba by pobierać grafiki od nowa.
  const coversSrc = path.join(fromDir, 'covers');
  const coversDst = path.join(toDir, 'covers');
  try {
    if (fs.existsSync(coversSrc)) {
      fs.cpSync(coversSrc, coversDst, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('Nie udało się skopiować cache okładek:', e);
  }
}

function relaunchSoon() {
  setTimeout(() => {
    app.relaunch();
    app.exit(0);
  }, 600);
}

function ensureDataFiles() {
  const userData = app.getPath('userData');
  CONFIG_PATH = path.join(userData, 'retro-launcher-config.json');
  PLAYTIME_PATH = path.join(userData, 'retro-launcher-playtime.json');
  fs.mkdirSync(userData, { recursive: true });
}

function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`Blad odczytu JSON: ${filePath}`, e);
    return fallback;
  }
}

function writeJsonSafe(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getDefaultConfig() {
  return {
    uiState: {
      fullscreenOnLaunch: false
    }
  };
}

function readConfig() {
  return readJsonSafe(CONFIG_PATH, null);
}

function saveConfig(config) {
  writeJsonSafe(CONFIG_PATH, config);
}

function readPlaytimeStore() {
  const data = readJsonSafe(PLAYTIME_PATH, { playtime: {} });
  if (!data.playtime) data.playtime = {};
  return data;
}

function savePlaytimeStore(data) {
  writeJsonSafe(PLAYTIME_PATH, data);
}

function getPlaytimeEntry(gameId) {
  const store = readPlaytimeStore();
  return store.playtime[gameId] || {
    totalMs: 0,
    lastStartAt: null,
    running: false,
    lastPlayedAt: null,
    plays: 0
  };
}

function setPlaytimeEntry(gameId, entry) {
  const store = readPlaytimeStore();
  store.playtime[gameId] = entry;
  savePlaytimeStore(store);
}

function startPlaytime(gameId) {
  if (!gameId) return;
  const entry = getPlaytimeEntry(gameId);
  if (!entry.running) {
    entry.running = true;
    entry.lastStartAt = Date.now();
    entry.lastPlayedAt = Date.now();
    entry.plays = (Number(entry.plays) || 0) + 1;
    setPlaytimeEntry(gameId, entry);
  }
}

function stopPlaytime(gameId) {
  if (!gameId) return;
  const entry = getPlaytimeEntry(gameId);
  if (entry.running && entry.lastStartAt) {
    entry.totalMs = (entry.totalMs || 0) + (Date.now() - entry.lastStartAt);
    entry.running = false;
    entry.lastStartAt = null;
    entry.lastPlayedAt = Date.now();
    setPlaytimeEntry(gameId, entry);
  }
}

function getCurrentPlaytimeMs(gameId) {
  const entry = getPlaytimeEntry(gameId);
  const runningMs = entry.running && entry.lastStartAt ? (Date.now() - entry.lastStartAt) : 0;
  return (entry.totalMs || 0) + runningMs;
}

function formatPlaytime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
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

function stableGameId(relativePath) {
  return crypto.createHash('sha1').update(String(relativePath || '')).digest('hex');
}

function parseCommandString(value) {
  const parts = String(value).match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  return parts.map(p => p.replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
}

function parseEnvLines(value) {
  const out = {};
  String(value || '')
    .split(/[\n;]+/)
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      const eq = line.indexOf('=');
      if (eq <= 0) return;
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      if (key) out[key] = val;
    });
  return out;
}

async function downloadImageToBuffer(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'RetroLauncher/2.1 (+https://github.com/multicolor-rgb/retrolaucher)' }
  });
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

// ---------------------------------------------------------------- gry PC / runnery
//
// Platformy typu PC nie mają emulatora: uruchamiamy plik bezpośrednio
// (Windows / natywny Linux) albo przez Wine, Wine-GE lub Proton-GE.
// Poniższe helpery obsługują wykrywanie, pobieranie i uruchamianie.

function homeDir() {
  return process.env.HOME || process.env.USERPROFILE || '';
}

function expandHome(input) {
  const value = String(input || '').trim();
  if (!value) return '';
  if (value === '~') return homeDir();
  if (value.startsWith('~/') || value.startsWith('~\\')) {
    return path.join(homeDir(), value.slice(2));
  }
  return value;
}

function fileExists(target) {
  try {
    return !!target && fs.statSync(target).isFile();
  } catch (_) {
    return false;
  }
}

function dirExists(target) {
  try {
    return !!target && fs.statSync(target).isDirectory();
  } catch (_) {
    return false;
  }
}

function isExecutableFile(target) {
  try {
    const stat = fs.statSync(target);
    if (!stat.isFile()) return false;
    if (process.platform === 'win32') return true;
    fs.accessSync(target, fs.constants.X_OK);
    return true;
  } catch (_) {
    return false;
  }
}

function findInPath(binName) {
  if (!binName) return null;
  const dirs = String(process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const names = process.platform === 'win32'
    ? [binName, `${binName}.exe`, `${binName}.cmd`, `${binName}.bat`]
    : [binName];

  for (const dir of dirs) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      if (isExecutableFile(candidate)) return candidate;
    }
  }
  return null;
}

function listChildDirs(root) {
  try {
    if (!dirExists(root)) return [];
    return fs.readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(root, entry.name))
      .sort((a, b) => a.localeCompare(b));
  } catch (_) {
    return [];
  }
}

function getSteamRoots() {
  const home = homeDir();
  const roots = [
    path.join(home, '.steam', 'steam'),
    path.join(home, '.steam', 'root'),
    path.join(home, '.local', 'share', 'Steam')
  ];
  return [...new Set(roots)].filter(dirExists);
}

function getProtonDirs() {
  const dirs = [];
  for (const steamRoot of getSteamRoots()) {
    dirs.push(path.join(steamRoot, 'compatibilitytools.d'));
    dirs.push(path.join(steamRoot, 'steamapps', 'common'));
  }
  dirs.push(path.join(homeDir(), '.local', 'share', 'retro-launcher', 'compatibilitytools.d'));

  const found = [];
  const seen = new Set();
  for (const base of [...new Set(dirs)]) {
    for (const child of listChildDirs(base)) {
      const proton = path.join(child, 'proton');
      if (!fileExists(proton)) continue;
      if (seen.has(child)) continue;
      seen.add(child);
      found.push({ name: path.basename(child), path: child });
    }
  }
  return found.sort((a, b) => b.name.localeCompare(a.name));
}

function getWineGeDirs() {
  const home = homeDir();
  const bases = [
    path.join(home, '.local', 'share', 'retro-launcher', 'runners', 'wine'),
    path.join(home, '.local', 'share', 'lutris', 'runners', 'wine'),
    path.join(home, '.local', 'share', 'bottles', 'runners')
  ];

  const found = [];
  const seen = new Set();
  for (const base of bases) {
    for (const child of listChildDirs(base)) {
      if (seen.has(child)) continue;
      if (!resolveWineBinary(child)) continue;
      seen.add(child);
      found.push({ name: path.basename(child), path: child });
    }
  }
  return found.sort((a, b) => b.name.localeCompare(a.name));
}

function resolveWineBinary(runnerPath) {
  const value = expandHome(runnerPath);
  if (!value) return null;

  if (isExecutableFile(value)) return value;

  const candidates = process.platform === 'win32'
    ? [path.join(value, 'bin', 'wine.exe')]
    : [
        path.join(value, 'bin', 'wine'),
        path.join(value, 'files', 'bin', 'wine'),
        path.join(value, 'wine'),
        path.join(value, 'wine64')
      ];

  for (const candidate of candidates) {
    if (isExecutableFile(candidate)) return candidate;
  }
  return null;
}

function resolveProtonBinary(runnerPath) {
  const value = expandHome(runnerPath);
  if (!value) return null;
  if (isExecutableFile(value)) return value;
  const candidate = path.join(value, 'proton');
  return isExecutableFile(candidate) ? candidate : null;
}

function getDefaultWinePrefix() {
  return path.join(homeDir(), 'Games', 'retro-launcher');
}

function detectPcRunners() {
  const steamRoots = getSteamRoots();
  return {
    ok: true,
    platform: process.platform,
    wine: findInPath('wine'),
    winetricks: findInPath('winetricks'),
    steamRoot: steamRoots[0] || null,
    proton: getProtonDirs(),
    wineGe: getWineGeDirs(),
    defaultPrefix: getDefaultWinePrefix()
  };
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'ignore', ...options });
    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} zakończył się kodem ${code}`));
    });
  });
}

async function fetchLatestReleaseAsset(repo, matcher) {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: {
      'User-Agent': 'Retro-Launcher',
      Accept: 'application/vnd.github+json'
    }
  });
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  const data = await res.json();
  const assets = Array.isArray(data.assets) ? data.assets : [];
  const asset = assets.find(item => matcher(item.name || ''));
  if (!asset?.browser_download_url) {
    throw new Error('Nie znaleziono archiwum w najnowszym wydaniu.');
  }
  return { name: asset.name, url: asset.browser_download_url, version: data.tag_name || '' };
}

async function downloadFileWithProgress(url, destination, onProgress) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Retro-Launcher' } });
  if (!res.ok) throw new Error(`Nie udało się pobrać pliku: ${res.status}`);
  const total = Number(res.headers.get('content-length')) || 0;
  const file = fs.openSync(destination, 'w');
  let received = 0;

  try {
    if (res.body) {
      for await (const chunk of res.body) {
        const buffer = Buffer.from(chunk);
        fs.writeSync(file, buffer);
        received += buffer.length;
        if (typeof onProgress === 'function') {
          onProgress({
            received,
            total,
            percent: total ? Math.min(100, Math.round((received / total) * 100)) : null
          });
        }
      }
    } else {
      fs.writeFileSync(destination, Buffer.from(await res.arrayBuffer()));
    }
  } finally {
    fs.closeSync(file);
  }
}

async function installRunner(sender, runner) {
  if (process.platform !== 'linux') {
    return { ok: false, error: 'Automatyczna instalacja runnerów jest dostępna tylko na Linuksie.' };
  }

  const isProton = runner === 'proton-ge';
  const isWineGe = runner === 'wine-ge';
  if (!isProton && !isWineGe) {
    return { ok: false, error: 'Nieznany runner.' };
  }

  try {
    const arch = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
    const assetMatches = name => {
      if (/\.sha/i.test(name) || !name.includes(arch)) return false;
      return isProton ? /\.tar\.gz$/i.test(name) : /\.tar\.xz$/i.test(name);
    };

    const release = isProton
      ? await fetchLatestReleaseAsset('GloriousEggroll/proton-ge-custom', assetMatches)
      : await fetchLatestReleaseAsset('GloriousEggroll/wine-ge-custom', assetMatches);

    const targetBase = isProton
      ? path.join(getSteamRoots()[0] || path.join(homeDir(), '.local', 'share', 'Steam'), 'compatibilitytools.d')
      : path.join(homeDir(), '.local', 'share', 'retro-launcher', 'runners', 'wine');

    fs.mkdirSync(targetBase, { recursive: true });

    const staging = fs.mkdtempSync(path.join(targetBase, '.download-'));
    const archive = path.join(staging, release.name);
    const progress = data => {
      if (sender && !sender.isDestroyed?.()) {
        sender.send('runner:progress', { runner, ...data, version: release.version });
      }
    };

    try {
      await downloadFileWithProgress(release.url, archive, progress);
      await runCommand('tar', [isProton ? '-xzf' : '-xJf', archive, '-C', staging]);

      const entries = fs.readdirSync(staging, { withFileTypes: true })
        .filter(entry => entry.isDirectory());
      if (!entries.length) throw new Error('Archiwum nie zawiera katalogu runnera.');

      const extracted = path.join(staging, entries[0].name);
      const finalPath = path.join(targetBase, entries[0].name);

      if (dirExists(finalPath)) {
        fs.rmSync(staging, { recursive: true, force: true });
        return { ok: true, alreadyInstalled: true, path: finalPath, name: entries[0].name };
      }

      fs.renameSync(extracted, finalPath);
      try {
        const proton = path.join(finalPath, 'proton');
        if (fileExists(proton)) fs.chmodSync(proton, 0o755);
      } catch (_) {}
      fs.rmSync(staging, { recursive: true, force: true });
      return { ok: true, path: finalPath, name: entries[0].name };
    } catch (e) {
      fs.rmSync(staging, { recursive: true, force: true });
      throw e;
    }
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

function ensureWinetricks() {
  const found = findInPath('winetricks');
  if (found) return found;

  const target = path.join(homeDir(), '.local', 'share', 'retro-launcher', 'winetricks');
  if (isExecutableFile(target)) return target;

  throw new Error('Brak winetricks — użyj przycisku pobierania w ustawieniach PC.');
}

async function downloadWinetricks(sender) {
  const targetDir = path.join(homeDir(), '.local', 'share', 'retro-launcher');
  const target = path.join(targetDir, 'winetricks');
  fs.mkdirSync(targetDir, { recursive: true });

  const res = await fetch('https://raw.githubusercontent.com/Winetricks/winetricks/master/src/winetricks', {
    headers: { 'User-Agent': 'Retro-Launcher' }
  });
  if (!res.ok) throw new Error(`Nie udało się pobrać winetricks: ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(target, text, { mode: 0o755 });
  fs.chmodSync(target, 0o755);
  if (sender && !sender.isDestroyed?.()) {
    sender.send('runner:progress', { runner: 'winetricks', percent: 100 });
  }
  return target;
}

function launchTrackedProcess(child, gameId, command) {
  lastLaunchedPid = child.pid || null;
  lastLaunchedCommand = command;
  lastEmulatorChild = child;

  if (gameId) startPlaytime(gameId);

  child.unref();
  hideLauncherForGame();

  child.on('exit', () => {
    if (gameId) stopPlaytime(gameId);
    showLauncher();
    lastEmulatorChild = null;
    lastLaunchedPid = null;
    lastLaunchedCommand = null;
  });
}


function emitWindowState(state) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(state === 'focus' ? 'app:window-focus' : 'app:window-blur');
  }
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
  emitWindowState('focus');
  launcherWasFullscreen = false;
}

function hideLauncherForGame() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  launcherWasFullscreen = mainWindow.isFullScreen();
  mainWindow.blur();
  mainWindow.setSkipTaskbar(true);
  mainWindow.setFocusable(false);
  mainWindow.hide();
  emitWindowState('blur');
}

function stopLastGameProcess() {
  try {
    const pid = lastEmulatorChild?.pid || lastLaunchedPid;
    if (!pid) return false;

    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(pid), '/F', '/T'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      }).unref();
      return true;
    }

    if (process.platform === 'linux') {
      try {
        process.kill(-pid, 'SIGTERM');
      } catch (_) {
        try {
          process.kill(pid, 'SIGTERM');
        } catch (_) {}
      }

      setTimeout(() => {
        try {
          process.kill(-pid, 'SIGKILL');
        } catch (_) {
          try {
            process.kill(pid, 'SIGKILL');
          } catch (_) {}
        }
      }, 1200);

      return true;
    }

    try {
      if (lastEmulatorChild && !lastEmulatorChild.killed) {
        lastEmulatorChild.kill('SIGTERM');
      } else {
        process.kill(pid, 'SIGTERM');
      }
    } catch (_) {}

    setTimeout(() => {
      try {
        if (lastEmulatorChild && !lastEmulatorChild.killed) {
          lastEmulatorChild.kill('SIGKILL');
        } else {
          process.kill(pid, 'SIGKILL');
        }
      } catch (_) {}
    }, 1200);

    return true;
  } catch (e) {
    console.error('Blad zamykania gry:', e);
    return false;
  }
}

function createInputWatchWindow() {
  inputWatchWindow = new BrowserWindow({
    show: false,
    width: 1,
    height: 1,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'input-watch-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
      backgroundThrottling: false
    }
  });

  inputWatchWindow.setMenuBarVisibility(false);
  inputWatchWindow.loadFile(path.join(__dirname, '..', 'renderer', 'input-watch.html'));

  inputWatchWindow.on('closed', () => {
    inputWatchWindow = null;
  });
}

function createWindow() {
  const storedConfig = readConfig() || getDefaultConfig();
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


 

  mainWindow.on('focus', () => emitWindowState('focus'));
  mainWindow.on('blur', () => emitWindowState('blur'));

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

app.whenReady().then(() => {
  ensureDataFiles();
  if (!fs.existsSync(CONFIG_PATH)) saveConfig(getDefaultConfig());
  if (!fs.existsSync(PLAYTIME_PATH)) savePlaytimeStore({ playtime: {} });
  createWindow();
  createInputWatchWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    createInputWatchWindow();
  }
});

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
    saveConfig(config);
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

ipcMain.handle('http:request', async (_event, payload) => {
  try {
    const { url, method = 'GET', headers = {}, body = null } = payload || {};
    if (!url) return { ok: false, status: 0, error: 'Pusty adres URL.' };

    const requestHeaders = {
      'User-Agent': 'RetroLauncher/2.1 (+https://github.com/multicolor-rgb/retrolaucher)',
      Accept: 'application/json, text/plain, */*',
      ...headers
    };

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body == null ? undefined : body
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await response.text()
    };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
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

ipcMain.handle('dialog:selectGamelist', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'EmulationStation (gamelist.xml)', extensions: ['xml'] },
        { name: 'Wszystkie pliki', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePaths?.length) return null;

    const filePath = result.filePaths[0];
    return {
      ok: true,
      filePath,
      dir: path.dirname(filePath),
      content: fs.readFileSync(filePath, 'utf-8')
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
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
    const relativePath = path.relative(baseDir, fullPath);
    const gameId = stableGameId(relativePath);
    results.push({
      id: gameId,
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

ipcMain.handle('dialog:selectGameFiles', async () => {
  const filters = process.platform === 'win32'
    ? [
        { name: 'Gry', extensions: ['exe'] },
        { name: 'Wszystkie pliki', extensions: ['*'] }
      ]
    : [
        { name: 'Gry', extensions: ['exe', 'AppImage', 'sh', 'bin'] },
        { name: 'Wszystkie pliki', extensions: ['*'] }
      ];

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters
  });
  if (result.canceled || !result.filePaths.length) return [];
  return result.filePaths;
});

function scanExecutablesRecursive(rootDir, normalizedExts, baseDir = rootDir, results = []) {
  if (results.length >= 800) return results;

  let entries = [];
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch (_) {
    return results;
  }

  for (const entry of entries) {
    if (results.length >= 800) break;
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      scanExecutablesRecursive(fullPath, normalizedExts, baseDir, results);
      continue;
    }

    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (normalizedExts.length && !normalizedExts.includes(ext)) continue;

    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (_) {
      continue;
    }

    results.push({
      id: stableGameId(path.relative(baseDir, fullPath)),
      title: path.basename(entry.name, ext),
      path: fullPath,
      rom: fullPath,
      fileName: entry.name,
      ext,
      size: stat.size
    });
  }

  return results;
}

ipcMain.handle('fs:scanExecutables', async (_event, folderPath, extensions) => {
  try {
    if (!folderPath || !fs.existsSync(folderPath)) return [];
    const normalizedExts = (extensions || [])
      .map(ext => String(ext || '').trim().toLowerCase())
      .filter(Boolean);
    const exts = normalizedExts.length
      ? normalizedExts
      : ['.exe', '.appimage', '.sh', '.bat', '.cmd'];
    return scanExecutablesRecursive(folderPath, exts)
      .sort((a, b) => a.title.localeCompare(b.title, 'pl', { sensitivity: 'base' }));
  } catch (e) {
    console.error('Blad skanowania plikow PC:', e);
    return [];
  }
});

ipcMain.handle('pc:detectRunners', async () => {
  try {
    return detectPcRunners();
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('pc:installRunner', async (event, payload) => {
  return installRunner(event.sender, payload?.runner);
});

ipcMain.handle('pc:winetricks', async (_event, payload) => {
  try {
    const { prefix, verbs, runner, runnerPath } = payload || {};
    let winePrefix = expandHome(prefix) || getDefaultWinePrefix();
    fs.mkdirSync(winePrefix, { recursive: true });

    let winetricks = findInPath('winetricks');
    if (!winetricks) {
      winetricks = await downloadWinetricks();
    }

    const env = { ...process.env, WINEPREFIX: winePrefix };
    if (runner === 'wine-ge') {
      const wineBin = resolveWineBinary(runnerPath) ||
        (detectPcRunners().wineGe[0] && resolveWineBinary(detectPcRunners().wineGe[0].path));
      if (wineBin) env.WINE = wineBin;
    }

    if (runner === 'proton-ge') {
      // Proton trzyma prefiks w <STEAM_COMPAT_DATA_PATH>/pfx.
      winePrefix = path.join(winePrefix, 'pfx');
      fs.mkdirSync(winePrefix, { recursive: true });
      env.WINEPREFIX = winePrefix;

      let protonDir = expandHome(runnerPath);
      if (!protonDir) {
        const detected = detectPcRunners();
        protonDir = detected.proton[0]?.path || '';
      }
      const protonWine = protonDir ? path.join(protonDir, 'files', 'bin', 'wine') : '';
      if (protonWine && isExecutableFile(protonWine)) env.WINE = protonWine;
    }

    const args = parseCommandString(verbs);
    const child = spawn(winetricks, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env
    });
    child.unref();
    return { ok: true, pid: child.pid || null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('pc:launch', async (_event, payload) => {
  try {
    const {
      gameId,
      gamePath,
      platform = {},
      override = {},
      extraArgs = []
    } = payload || {};

    const target = expandHome(gamePath);
    if (!target || !fileExists(target)) {
      return { ok: false, error: 'Nie znaleziono pliku gry.' };
    }

    const runner = String(override.runner || platform.pcRunner || 'native');
    const prefix = expandHome(override.prefix || platform.pcPrefix) || getDefaultWinePrefix();
    const env = {
      ...process.env,
      ...parseEnvLines(platform.pcEnv || ''),
      ...parseEnvLines(override.env || '')
    };
    const args = [...(extraArgs || []).filter(Boolean)];
    let command = target;
    let spawnArgs = [...args];

    const nativeLaunch = process.platform === 'win32' || runner === 'native';

    if (nativeLaunch) {
      if (process.platform !== 'win32') {
        try {
          fs.accessSync(target, fs.constants.X_OK);
        } catch (_) {
          try { fs.chmodSync(target, 0o755); } catch (_) {}
        }
      }
      command = target;
      spawnArgs = [...args];
    } else {
      fs.mkdirSync(prefix, { recursive: true });

      if (runner === 'wine' || runner === 'wine-ge') {
        let wineBin = resolveWineBinary(platform.pcRunnerPath);
        if (!wineBin && runner === 'wine') wineBin = findInPath('wine');
        if (!wineBin && runner === 'wine-ge') {
          const installed = detectPcRunners().wineGe[0];
          wineBin = installed ? resolveWineBinary(installed.path) : null;
        }
        if (!wineBin) {
          return { ok: false, error: runner === 'wine' ? 'Nie znaleziono Wine w systemie.' : 'Nie znaleziono Wine-GE.' };
        }

        command = wineBin;
        spawnArgs = [target, ...args];
        env.WINEPREFIX = prefix;
      } else if (runner === 'proton-ge' || runner === 'proton') {
        let protonBin = resolveProtonBinary(platform.pcRunnerPath);
        if (!protonBin) {
          const detected = detectPcRunners();
          protonBin = detected.proton[0] ? resolveProtonBinary(detected.proton[0].path) : null;
        }
        if (!protonBin) return { ok: false, error: 'Nie znaleziono Proton-GE.' };

        const steamRoot = getSteamRoots()[0];
        if (!steamRoot) return { ok: false, error: 'Nie znaleziono katalogu Steam (wymagany przez Proton).' };

        command = protonBin;
        spawnArgs = ['run', target, ...args];
        env.STEAM_COMPAT_CLIENT_INSTALL_PATH = steamRoot;
        env.STEAM_COMPAT_DATA_PATH = prefix;
      } else {
        return { ok: false, error: 'Nieznany runner: ' + runner };
      }
    }

    const prepared = buildSpawnCommand(command, spawnArgs);
    const child = spawn(prepared.command, prepared.args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env
    });

    launchTrackedProcess(child, gameId, command);
    return { ok: true, pid: lastLaunchedPid };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('game:launch', async (_event, { gameId, emulatorPath, romPath, extraArgs }) => {
  try {
    if (!emulatorPath) return { ok: false, error: 'Nie skonfigurowano emulatora dla tej platformy.' };
    const cleaned = parseCommandString(emulatorPath);
    const command = cleaned.shift();
    const args = [...cleaned, ...(extraArgs || []), romPath].filter(Boolean);
    if (!command) return { ok: false, error: 'Nieprawidłowe polecenie emulatora.' };

    const prepared = buildSpawnCommand(command, args);
    const child = spawn(prepared.command, prepared.args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });

    launchTrackedProcess(child, gameId, command);
    return { ok: true, pid: lastLaunchedPid };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('game:stopLast', async () => {
  try {
    const ok = stopLastGameProcess();
    return { ok: true, requested: ok };
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

ipcMain.handle('game:getPlaytime', async (_event, gameId) => {
  try {
    if (!gameId) return { ok: false, error: 'Brak gameId.' };
    const totalMs = getCurrentPlaytimeMs(gameId);
    return { ok: true, totalMs, formatted: formatPlaytime(totalMs) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('game:getPlaytimeRaw', async (_event, gameId) => {
  try {
    if (!gameId) return { ok: false, error: 'Brak gameId.' };
    return { ok: true, entry: getPlaytimeEntry(gameId) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('game:getPlaytimeAll', async () => {
  try {
    const store = readPlaytimeStore();
    return { ok: true, playtime: store.playtime || {} };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ---------------------------------------------------------------- kopie zapasowe

ipcMain.handle('backup:export', async () => {
  try {
    const stamp = new Date().toISOString().slice(0, 10);
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Eksportuj kopię zapasową',
      defaultPath: path.join(
        app.getPath('documents') || app.getPath('userData'),
        `retro-launcher-backup-${stamp}.json`
      ),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }

    writeJsonSafe(result.filePath, {
      app: 'retro-launcher',
      version: app.getVersion(),
      exportedAt: new Date().toISOString(),
      config: readConfig(),
      playtime: readPlaytimeStore()
    });

    return { ok: true, filePath: result.filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('backup:import', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Importuj kopię zapasową',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (result.canceled || !result.filePaths?.length) {
      return { ok: false, canceled: true };
    }

    const filePath = result.filePaths[0];
    const parsed = readJsonSafe(filePath, null);

    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'invalid' };
    }

    // Obsługujemy zarówno nowy format { config, playtime }, jak i stary
    // plik konfiguracji wprost (np. retro-launcher-config.json).
    const nextConfig =
      parsed.config && typeof parsed.config === 'object'
        ? parsed.config
        : parsed;

    if (!Array.isArray(nextConfig.platforms) && !nextConfig.uiState) {
      return { ok: false, error: 'invalid' };
    }

    writeJsonSafe(CONFIG_PATH, nextConfig);

    if (parsed.playtime && typeof parsed.playtime === 'object') {
      const playtime = parsed.playtime.playtime
        ? parsed.playtime
        : { playtime: parsed.playtime };
      writeJsonSafe(PLAYTIME_PATH, playtime);
    }

    return { ok: true, filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ---------------------------------------------------------------- tryb przenośny

ipcMain.handle('portable:get', async () => {
  try {
    return {
      ok: true,
      portable: portableMode,
      root: PORTABLE_ROOT,
      dataDir: app.getPath('userData'),
      defaultDataDir: DEFAULT_USER_DATA,
      flagPath: PORTABLE_FLAG_PATH
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('portable:enable', async () => {
  try {
    if (portableMode) return { ok: true, already: true, portable: true };

    fs.mkdirSync(PORTABLE_DATA_DIR, { recursive: true });
    copyPortableData(DEFAULT_USER_DATA, PORTABLE_DATA_DIR);
    fs.writeFileSync(PORTABLE_FLAG_PATH, '', 'utf-8');

    relaunchSoon();
    return { ok: true, restarting: true, root: PORTABLE_ROOT };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('portable:disable', async () => {
  try {
    if (!portableMode) return { ok: true, already: true, portable: false };

    // Przenosimy dane z powrotem do systemowego katalogu użytkownika,
    // żeby po wyłączeniu trybu nic nie zginęło.
    copyPortableData(PORTABLE_DATA_DIR, DEFAULT_USER_DATA);
    if (fs.existsSync(PORTABLE_FLAG_PATH)) fs.unlinkSync(PORTABLE_FLAG_PATH);

    relaunchSoon();
    return { ok: true, restarting: true, dataDir: DEFAULT_USER_DATA };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('shell:showItem', async (_event, targetPath) => {
  try {
    if (!targetPath || typeof targetPath !== 'string') {
      return { ok: false, error: 'Brak ścieżki.' };
    }
    shell.showItemInFolder(targetPath);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('fs:pathExists', async (_event, targetPath) => {
  try {
    return { ok: true, exists: !!targetPath && fs.existsSync(targetPath) };
  } catch (e) {
    return { ok: false, exists: false, error: e.message };
  }
});