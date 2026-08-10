// Odczyt i zapis konfiguracji oraz pomocnicze get/set dla danych.

function ensurePresetEmulators() {
  // Upewnij się, że struktury per-platform są poprawne
  config.platforms.forEach(p => {
    if (typeof config.emulators[p.key] !== 'string') config.emulators[p.key] = '';
    if (typeof config.launchArgs[p.key] !== 'string') config.launchArgs[p.key] = '';
    if (!config.metadata[p.key]) config.metadata[p.key] = {};
    if (!config.manualCovers[p.key]) config.manualCovers[p.key] = {};
    if (!config.userRatings[p.key]) config.userRatings[p.key] = {};
    if (!p.aspect) p.aspect = 'standard';
  });

  // API keys
  if (!config.apiKeys || typeof config.apiKeys !== 'object') {
    config.apiKeys = { steamgrid: '' };
  }
  if (typeof config.apiKeys.steamgrid !== 'string') {
    config.apiKeys.steamgrid = '';
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

  // view mode – rozszerz o grid, skoro masz go w renderShelf
  const allowedViewModes = ['flat', 'arc', 'stack', 'cascade', 'grid'];
  if (!allowedViewModes.includes(config.uiState.shelfViewMode)) {
    config.uiState.shelfViewMode = 'flat';
  }

  // język
  if (!config.uiState.language) {
    config.uiState.language = 'pl';
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

  ensurePresetEmulators();
}

async function saveStoredConfig() {
  const payload = {
    platforms: config.platforms,
    romFolders: config.romFolders,
    emulators: config.emulators,
    launchArgs: config.launchArgs,
    metadata: config.metadata,
    manualCovers: config.manualCovers,
    userRatings: config.userRatings,
    apiKeys: config.apiKeys,
    uiState: config.uiState
  };

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
    config.manualCovers[platformKey][gameId] = value;
  } else {
    delete config.manualCovers[platformKey][gameId];
  }
}

function getCoverForGame(game) {
  return getManualCover(game.platform, game.id)
    || game.cover
    || 'https://cdn2.steamgriddb.com/thumb/fd1b83d80a10d9a7ca298e8e6fe705f0.jpg';
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