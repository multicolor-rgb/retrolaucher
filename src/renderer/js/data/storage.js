// Odczyt i zapis konfiguracji oraz pomocnicze get/set dla danych.

function ensurePresetEmulators() {
  // Upewnij się, że struktury per-platform są poprawne
  config.platforms.forEach(p => {
    if (typeof config.emulators[p.key] !== 'string') config.emulators[p.key] = '';
    if (typeof config.launchArgs[p.key] !== 'string') config.launchArgs[p.key] = '';
    if (!config.metadata[p.key]) config.metadata[p.key] = {};
    if (!config.manualCovers[p.key]) config.manualCovers[p.key] = {};
    if (!config.userRatings[p.key]) config.userRatings[p.key] = {};
    if (!config.hiddenGames[p.key]) config.hiddenGames[p.key] = {};
    if (!p.aspect) p.aspect = 'standard';
    if (p.kind !== 'pc') p.kind = 'console';
    if (!p.aspectCustom || typeof p.aspectCustom !== 'object') {
      p.aspectCustom = { width: 180, ratio: 0.72 };
    }
    if (p.kind === 'pc' && !config.pcGames[p.key]) config.pcGames[p.key] = [];
  });

  if (
    !config.pcGames
    || typeof config.pcGames !== 'object'
    || Array.isArray(config.pcGames)
  ) {
    config.pcGames = {};
  }

  if (
    !config.pcGameSettings
    || typeof config.pcGameSettings !== 'object'
    || Array.isArray(config.pcGameSettings)
  ) {
    config.pcGameSettings = {};
  }

  if (
    !config.gameArgs
    || typeof config.gameArgs !== 'object'
    || Array.isArray(config.gameArgs)
  ) {
    config.gameArgs = {};
  }

  // API keys
  if (!config.apiKeys || typeof config.apiKeys !== 'object') {
    config.apiKeys = {
      steamgrid: '',
      igdbClientId: '',
      igdbClientSecret: '',
      thegamesdb: ''
    };
  }
  if (typeof config.apiKeys.steamgrid !== 'string') {
    config.apiKeys.steamgrid = '';
  }
  if (typeof config.apiKeys.igdbClientId !== 'string') {
    config.apiKeys.igdbClientId = '';
  }
  if (typeof config.apiKeys.igdbClientSecret !== 'string') {
    config.apiKeys.igdbClientSecret = '';
  }
  if (typeof config.apiKeys.thegamesdb !== 'string') {
    config.apiKeys.thegamesdb = '';
  }

  // uiState
  if (!config.uiState || typeof config.uiState !== 'object') {
    config.uiState = {};
  }

  if (typeof config.uiState.settingsOpen !== 'boolean') {
    config.uiState.settingsOpen = false;
  }

  if (typeof config.uiState.fullscreenOnLaunch !== 'boolean') {
    config.uiState.fullscreenOnLaunch = false;
  }

  // view mode – lista musi zgadzać się z getAllowedShelfViewModes()
  const allowedViewModes = ['flat', 'arc', 'stack', 'cascade', 'grid', 'detailed', 'hero', 'bigbox', 'framed'];
  if (!allowedViewModes.includes(config.uiState.shelfViewMode)) {
    config.uiState.shelfViewMode = 'flat';
  }

  if (typeof config.uiState.autoFetchOnStart !== 'boolean') {
    config.uiState.autoFetchOnStart = false;
  }

  // Ulubione gry: { [gameId]: true }. Musi być zwykłym obiektem — stare
  // configi mogą mieć tu śmieci z ręcznych edycji pliku JSON.
  if (
    !config.uiState.favorites
    || typeof config.uiState.favorites !== 'object'
    || Array.isArray(config.uiState.favorites)
  ) {
    config.uiState.favorites = {};
  }

  // Sortowanie biblioteki — wartości muszą zgadzać się z opcjami w UI.
  const allowedSorts = ['default', 'recent', 'favorites', 'title', 'playtime'];
  if (!allowedSorts.includes(config.uiState.librarySort)) {
    config.uiState.librarySort = 'default';
  }

  // Tryb atrakcji (wygaszacz) — domyślnie włączony.
  if (typeof config.uiState.attractMode !== 'boolean') {
    config.uiState.attractMode = true;
  }

  // język
  if (!config.uiState.language) {
    config.uiState.language = 'pl';
  }

  // motyw interfejsu – odpowiada plikom w themes/*.css
  const allowedThemes = ['default', 'wii', 'switch', 'ps3', 'xbox'];
  if (!allowedThemes.includes(config.uiState.theme)) {
    config.uiState.theme = 'default';
  }

  // customowe tytuły gier
  if (
    !config.uiState.gameTitles ||
    typeof config.uiState.gameTitles !== 'object' ||
    Array.isArray(config.uiState.gameTitles)
  ) {
    config.uiState.gameTitles = {};
  }
}

// ------------------------------------------------------------
// Tryb przenośny — znaczniki ścieżek na pendrive
// ------------------------------------------------------------

let portableInfo = { loaded: false, portable: false, root: '', dataDir: '' };

const PORTABLE_MARK = '{{PORTABLE}}';
const PORTABLE_FILE_MARK = '{{PORTABLE_FILE}}';

async function loadPortableInfo(force = false) {
  if (portableInfo.loaded && !force) return portableInfo;

  try {
    const res = await window.launcherAPI?.getPortableInfo?.();
    portableInfo = res?.ok
      ? { ...res, loaded: true }
      : { loaded: true, portable: false, root: '', dataDir: '' };
  } catch (e) {
    portableInfo = { loaded: true, portable: false, root: '', dataDir: '' };
  }

  return portableInfo;
}

function getPortableRoot() {
  return (portableInfo.root || '').replace(/[\\/]+$/, '');
}

function getPortableSep() {
  return getPortableRoot().includes('\\') ? '\\' : '/';
}

function normalizePortablePath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/\/+$/, '');
}

function encodePortableString(value) {
  if (typeof value !== 'string' || !value) return value;
  if (!portableInfo.portable || !portableInfo.root) return value;

  const root = normalizePortablePath(portableInfo.root);
  let isFileUrl = false;
  let raw = value;

  if (/^file:\/\//i.test(raw)) {
    isFileUrl = true;
    raw = raw.slice(7);
    try { raw = decodeURIComponent(raw); } catch (_) {}
    raw = raw.replace(/^\/([A-Za-z]:\/)/, '$1');
  }

  const normalized = normalizePortablePath(raw);
  let rest = '';

  if (normalized === root) {
    rest = '';
  } else if (normalized.startsWith(`${root}/`)) {
    rest = normalized.slice(root.length);
  } else {
    return value;
  }

  return (isFileUrl ? PORTABLE_FILE_MARK : PORTABLE_MARK) + rest;
}

function decodePortableString(value) {
  if (typeof value !== 'string') return value;

  const isFileUrl = value.startsWith(PORTABLE_FILE_MARK);
  if (!isFileUrl && !value.startsWith(PORTABLE_MARK)) return value;

  const root = getPortableRoot();
  if (!root) return value;

  const mark = isFileUrl ? PORTABLE_FILE_MARK : PORTABLE_MARK;
  const rest = value.slice(mark.length).replace(/^[/\\]+/, '');
  const sep = getPortableSep();
  const parts = rest ? rest.split('/').filter(Boolean) : [];
  const full = parts.length ? root + sep + parts.join(sep) : root;

  if (!isFileUrl) return full;

  let normalized = full.replace(/\\/g, '/');
  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  return 'file://' + encodeURI(normalized).replace(/#/g, '%23');
}

function mapPortablePaths(value, fn, depth = 0) {
  if (depth > 8 || value == null) return value;
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) {
    return value.map(item => mapPortablePaths(item, fn, depth + 1));
  }
  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(key => {
      out[key] = mapPortablePaths(value[key], fn, depth + 1);
    });
    return out;
  }
  return value;
}

function mapPcGamePaths(store, fn) {
  const out = {};
  const source = store && typeof store === 'object' ? store : {};
  Object.keys(source).forEach(platformKey => {
    const list = Array.isArray(source[platformKey]) ? source[platformKey] : [];
    out[platformKey] = list.map(entry => ({
      ...entry,
      path: entry?.path ? fn(entry.path) : entry?.path
    }));
  });
  return out;
}

function mergePcGames(base, stored) {
  const out = { ...(base || {}) };
  const source = stored && typeof stored === 'object' ? stored : {};
  Object.keys(source).forEach(platformKey => {
    if (Array.isArray(source[platformKey])) {
      out[platformKey] = source[platformKey];
    }
  });
  return out;
}

function mergeStoredConfig(stored = {}) {
  return {
    ...config,
    ...stored,

    platforms: Array.isArray(stored.platforms) && stored.platforms.length
      ? stored.platforms
      : config.platforms,

    romFolders: {
      ...(config.romFolders || {}),
      ...((stored && stored.romFolders) || {})
    },

    emulators: {
      ...(config.emulators || {}),
      ...((stored && stored.emulators) || {})
    },

    launchArgs: {
      ...(config.launchArgs || {}),
      ...((stored && stored.launchArgs) || {})
    },

    gameArgs: {
      ...(config.gameArgs || {}),
      ...((stored && stored.gameArgs) || {})
    },

    metadata: {
      ...(config.metadata || {}),
      ...((stored && stored.metadata) || {})
    },

    manualCovers: {
      ...(config.manualCovers || {}),
      ...((stored && stored.manualCovers) || {})
    },

    userRatings: {
      ...(config.userRatings || {}),
      ...((stored && stored.userRatings) || {})
    },

    hiddenGames: {
      ...(config.hiddenGames || {}),
      ...((stored && stored.hiddenGames) || {})
    },

    pcGames: mergePcGames(config.pcGames, stored && stored.pcGames),

    pcGameSettings: {
      ...(config.pcGameSettings || {}),
      ...((stored && stored.pcGameSettings) || {})
    },

    apiKeys: {
      ...(config.apiKeys || {}),
      ...((stored && stored.apiKeys) || {})
    },

    uiState: {
      ...(config.uiState || {}),
      ...((stored && stored.uiState) || {})
      // tu wciągamy też stored.uiState.gameTitles, jeśli jest
    }
  };
}

async function loadStoredConfig() {
  try {
    let stored = null;

    await loadPortableInfo();

    if (window.launcherAPI?.loadConfig) {
      stored = await window.launcherAPI.loadConfig();
    } else {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    }

    config = mergeStoredConfig(stored || {});
  } catch (e) {
    console.warn('Nie udało się wczytać ustawień:', e);
    config = mergeStoredConfig({});
  }

  // Tryb przenośny: w pliku konfiguracji ścieżki leżące na pendrive są
  // zapisane ze znacznikiem {{PORTABLE}} — rozwijamy je do bieżącej litery
  // dysku / punktu montowania.
  if (portableInfo.portable) {
    config.romFolders = mapPortablePaths(config.romFolders, decodePortableString);
    config.manualCovers = mapPortablePaths(config.manualCovers, decodePortableString);
    config.metadata = mapPortablePaths(config.metadata, decodePortableString);
    config.pcGames = mapPcGamePaths(config.pcGames, decodePortableString);
    config.pcGameSettings = mapPortablePaths(config.pcGameSettings, decodePortableString);
  }

  ensurePresetEmulators();
}

async function saveStoredConfig() {
  let payload = {
    platforms: config.platforms,
    romFolders: config.romFolders,
    emulators: config.emulators,
    launchArgs: config.launchArgs,
    gameArgs: config.gameArgs,
    pcGames: config.pcGames,
    pcGameSettings: config.pcGameSettings,
    metadata: config.metadata,
    manualCovers: config.manualCovers,
    userRatings: config.userRatings,
    hiddenGames: config.hiddenGames,
    apiKeys: config.apiKeys,
    uiState: config.uiState
  };

  if (portableInfo.portable) {
    payload = {
      ...payload,
      romFolders: mapPortablePaths(payload.romFolders, encodePortableString),
      manualCovers: mapPortablePaths(payload.manualCovers, encodePortableString),
      metadata: mapPortablePaths(payload.metadata, encodePortableString),
      pcGames: mapPcGamePaths(payload.pcGames, encodePortableString),
      pcGameSettings: mapPortablePaths(payload.pcGameSettings, encodePortableString)
    };
  }

  try {
    if (window.launcherAPI?.saveConfig) {
      await window.launcherAPI.saveConfig(payload);
    } else {
      localStorage.setItem(
        CONFIG_STORAGE_KEY,
        JSON.stringify(payload)
      );
    }
  } catch (e) {
    console.warn('Nie udało się zapisać ustawień:', e);
  }
}

function getPlatform(key) {
  return config.platforms.find(p => p.key === key) || {
    key,
    label: key.toUpperCase(),
    color: '#38e0ff',
    icon: '🎮',
    extensions: [],
    aspect: 'standard'
  };
}

function getManualCover(platformKey, gameId) {
  return (((config.manualCovers || {})[platformKey] || {})[gameId]) || '';
}

function setManualCover(platformKey, gameId, value) {
  if (!config.manualCovers[platformKey]) {
    config.manualCovers[platformKey] = {};
  }

  if (value) {
    // Tauri: ścieżki file:// → asset protocol (użytkownik może też wkleić URL)
    const normalized = typeof window.toCoverUrl === 'function' ? window.toCoverUrl(value) : value;
    config.manualCovers[platformKey][gameId] = normalized;
  } else {
    delete config.manualCovers[platformKey][gameId];
  }
}

function getCoverForGame(game) {
  return toCoverUrlSafe(getManualCover(game.platform, game.id))
    || toCoverUrlSafe(game.cover)
    || COVER_PLACEHOLDER;
}

// toCoverUrl z bridge.js — stare configi z Electrona mają okładki jako file://
function toCoverUrlSafe(value) {
  if (typeof window.toCoverUrl !== 'function') return value;
  return window.toCoverUrl(value);
}

// ------------------------------------------------------------
// Ukrywanie gier/plików per platforma (menedżer gier)
// ------------------------------------------------------------

function getHiddenGames(platformKey) {
  return (((config.hiddenGames || {})[platformKey]) || {});
}

function isGameHidden(platformKey, gameId) {
  if (!platformKey || !gameId) return false;
  return getHiddenGames(platformKey)[gameId] === true;
}

function setGameHidden(platformKey, gameId, hidden) {
  if (!platformKey || !gameId) return;

  if (!config.hiddenGames) config.hiddenGames = {};
  if (!config.hiddenGames[platformKey]) config.hiddenGames[platformKey] = {};

  if (hidden) {
    config.hiddenGames[platformKey][gameId] = true;
  } else {
    delete config.hiddenGames[platformKey][gameId];
  }
}

function toggleGameHidden(platformKey, gameId) {
  const next = !isGameHidden(platformKey, gameId);
  setGameHidden(platformKey, gameId, next);
  return next;
}

// ------------------------------------------------------------
// Ulubione gry (globalnie, gameId zawiera już prefiks platformy)
// ------------------------------------------------------------

function isGameFavorite(gameId) {
  if (!gameId) return false;
  return (((config.uiState || {}).favorites || {})[gameId]) === true;
}

function setGameFavorite(gameId, favorite) {
  if (!gameId) return;

  if (!config.uiState) config.uiState = {};
  if (!config.uiState.favorites) config.uiState.favorites = {};

  if (favorite) {
    config.uiState.favorites[gameId] = true;
  } else {
    delete config.uiState.favorites[gameId];
  }
}

function toggleGameFavorite(gameId) {
  const next = !isGameFavorite(gameId);
  setGameFavorite(gameId, next);
  return next;
}

function openManualCoverEditorForGame(game) {
  if (!game) return;

  const settingsOpen = !settingsPanel.hidden;
  if (!settingsOpen) switchToPage('settings');

  activePlatform = game.platform;
  renderTabs();
  renderSettings();
  activateSettingsSubtab('artwork');

  setTimeout(() => {
    const artworkPlatformSelect = document.getElementById('artwork-platform-select');
    const manualPlatformSelect = document.getElementById('manual-cover-platform');
    const gameSelect = document.getElementById('manual-cover-game');
    const input = document.getElementById('manual-cover-url');

    if (artworkPlatformSelect) {
      artworkPlatformSelect.value = game.platform;
    }

    if (manualPlatformSelect) {
      manualPlatformSelect.value = game.platform;
      manualPlatformSelect.dispatchEvent(new Event('change'));
    }

    if (gameSelect) {
      gameSelect.value = game.id;
      gameSelect.dispatchEvent(new Event('change'));
    }

    if (input) input.focus();
  }, 60);
}