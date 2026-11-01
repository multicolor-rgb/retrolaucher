function getArtworkSettingsPlatform() {
  const select = document.getElementById('artwork-platform-select');
  return select?.value || 'all';
}

function getManualCoverPlatform() {
  const select = document.getElementById('manual-cover-platform');
  return select?.value || 'all';
}

function populateArtworkPlatformSelect() {
  const select = document.getElementById('artwork-platform-select');
  if (!select) return;

  const current = select.value || 'all';
  select.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = t('allPlatforms') || 'Wszystkie platformy';
  select.appendChild(allOpt);

  config.platforms.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.key;
    opt.textContent = p.label;
    select.appendChild(opt);
  });

  const allowed = ['all', ...config.platforms.map(p => p.key)];
  select.value = allowed.includes(current) ? current : 'all';
}

function populateManualCoverPlatformSelect() {
  const select = document.getElementById('manual-cover-platform');
  if (!select) return;

  const preferred = select.value || activePlatform || 'all';
  select.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = t('choosePlatform') || 'Wybierz platformę';
  select.appendChild(allOpt);

  config.platforms.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.key;
    opt.textContent = p.label;
    select.appendChild(opt);
  });

  const allowed = ['all', ...config.platforms.map(p => p.key)];
  select.value = allowed.includes(preferred) ? preferred : 'all';
}

function renderSettingsWarning() {
  const warning = document.getElementById('settings-warning');
  if (!warning) return;
  warning.textContent = t('artworkWarning') ||
    'Okładki i opisy są pobierane z SteamGridDB. W ustawieniach możesz wybrać jedną platformę albo wszystkie naraz. Dla każdej platformy możesz też ustawić własny typ proporcji okładki oraz ręcznie podmienić cover wybranej gry.';
}

function populateManualCoverGameSelect() {
  const select = document.getElementById('manual-cover-game');
  const platformKey = getManualCoverPlatform();
  if (!select) return [];

  const platformGames = games.filter(g => platformKey !== 'all' ? g.platform === platformKey : false);
  const previousValue = select.value || '';
  select.innerHTML = '';

  if (!platformGames.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = platformKey === 'all'
      ? (t('choosePlatformFirst') || 'Najpierw wybierz platformę w panelu okładek')
      : (t('noGamesForPlatform') || 'Brak gier dla tej platformy');
    select.appendChild(opt);
    return [];
  }

  platformGames.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = getDisplayTitle(g);
    select.appendChild(opt);
  });

  const exists = platformGames.some(g => g.id === previousValue);
  select.value = exists ? previousValue : platformGames[0].id;
  return platformGames;
}

function renderManualCoverPreview() {
  const preview = document.getElementById('manual-cover-preview');
  const platformKey = getManualCoverPlatform();
  const select = document.getElementById('manual-cover-game');
  const input = document.getElementById('manual-cover-url');
  const saveUrlBtn = document.getElementById('save-manual-cover-url');
  const pickFileBtn = document.getElementById('pick-manual-cover-file');
  const clearBtn = document.getElementById('clear-manual-cover');

  if (!preview || !select || !input) return;

  const disableEditing = platformKey === 'all';
  input.disabled = disableEditing;
  select.disabled = disableEditing;
  if (saveUrlBtn) saveUrlBtn.disabled = disableEditing;
  if (pickFileBtn) pickFileBtn.disabled = disableEditing;
  if (clearBtn) clearBtn.disabled = disableEditing;

  if (disableEditing) {
    preview.classList.add('empty');
    preview.innerHTML = t('choosePlatformToEdit') || 'Wybierz konkretną platformę, aby edytować ręczne okładki.';
    input.value = '';
    return;
  }

  const game = games.find(g => g.id === select.value && g.platform === platformKey);
  if (!game) {
    preview.classList.add('empty');
    preview.innerHTML = t('chooseGameFromList') || 'Wybierz grę z listy.';
    input.value = '';
    return;
  }

  const manual = getManualCover(game.platform, game.id);
  input.value = manual || '';
  preview.classList.remove('empty');
  const previewPlatform = getPlatform(platformKey);
  const previewGeometry = getAspectVars(previewPlatform?.aspect || 'standard', previewPlatform?.aspectCustom);
  preview.innerHTML = `
    <img src="${getCoverForGame(game)}" alt="${getDisplayTitle(game)}" style="aspect-ratio:${previewGeometry.ratio}" />
    <div class="manual-cover-meta">
      <strong>${getDisplayTitle(game)}</strong>
      <span>${manual ? (t('sourceManual') || 'Źródło: ręczne') : (t('sourceAuto') || 'Źródło: SteamGridDB / automatyczne')}</span>
      <span>${manual || (t('noManualCover') || 'Brak ręcznego URL lub pliku.')}</span>
    </div>
  `;
}

async function saveManualCoverFromUrl() {
  const platformKey = getManualCoverPlatform();

  if (platformKey === 'all') {
    showToast(t('choosePlatformFirst') || 'Najpierw wybierz konkretną platformę w panelu okładek', true);
    return;
  }

  const select = document.getElementById('manual-cover-game');
  const input = document.getElementById('manual-cover-url');
  const gameId = select?.value || '';
  const value = (input?.value || '').trim();

  if (!gameId || !value) {
    showToast(t('chooseGameAndUrl') || 'Wybierz grę i wpisz URL okładki', true);
    return;
  }

  const game = games.find(g => g.id === gameId && g.platform === platformKey);
  if (!game) {
    showToast(t('gameNotFound') || 'Nie znaleziono gry', true);
    return;
  }

  setManualCover(game.platform, game.id, value);
  await saveStoredConfig();
  await refreshLibrary();
  populateManualCoverGameSelect();

  const manualCoverSelect = document.getElementById('manual-cover-game');
  if (manualCoverSelect) manualCoverSelect.value = gameId;

  renderManualCoverPreview();
  showToast(t('savedManualCoverUrl') || 'Zapisano ręczny URL okładki');
}

async function pickManualCoverFile() {
  const platformKey = getManualCoverPlatform();

  if (platformKey === 'all') {
    showToast(t('choosePlatformFirst') || 'Najpierw wybierz konkretną platformę w panelu okładek', true);
    return;
  }

  const select = document.getElementById('manual-cover-game');
  const gameId = select?.value || '';
  if (!gameId) {
    showToast(t('chooseGameFirst') || 'Najpierw wybierz grę', true);
    return;
  }

  const game = games.find(g => g.id === gameId && g.platform === platformKey);
  if (!game) {
    showToast(t('gameNotFound') || 'Nie znaleziono gry', true);
    return;
  }

  const api = window.launcherAPI;
  const picker = api?.selectImageFile || api?.selectFile;

  if (!picker) {
    showToast(t('noFilePicker') || 'Brak natywnego okna wyboru pliku w launcherAPI', true);
    return;
  }

  let picked;
  try {
    picked = await picker.call(api);
  } catch (e) {
    showToast(t('filePickerError') || 'Nie udało się otworzyć okna wyboru pliku', true);
    return;
  }

  if (!picked) return;

  const normalized = /^https?:/i.test(picked) || /^file:/i.test(picked)
    ? picked
    : `file://${picked}`;

  setManualCover(game.platform, game.id, normalized);
  await saveStoredConfig();
  await refreshLibrary();

  const manualCoverSelect = document.getElementById('manual-cover-game');
  if (manualCoverSelect) manualCoverSelect.value = gameId;

  renderManualCoverPreview();
  showToast(t('savedManualCoverFile') || 'Zapisano ręczny plik okładki');
}

async function clearManualCover() {
  const platformKey = getManualCoverPlatform();

  if (platformKey === 'all') {
    showToast(t('choosePlatformFirst') || 'Najpierw wybierz konkretną platformę w panelu okładek', true);
    return;
  }

  const select = document.getElementById('manual-cover-game');
  const gameId = select?.value || '';
  if (!gameId) {
    showToast(t('chooseGameFirst') || 'Najpierw wybierz grę', true);
    return;
  }

  const game = games.find(g => g.id === gameId && g.platform === platformKey);
  if (!game) {
    showToast(t('gameNotFound') || 'Nie znaleziono gry', true);
    return;
  }

  setManualCover(game.platform, game.id, '');
  await saveStoredConfig();
  await refreshLibrary();
  populateManualCoverGameSelect();

  const manualCoverSelect = document.getElementById('manual-cover-game');
  if (manualCoverSelect) manualCoverSelect.value = gameId;

  renderManualCoverPreview();
  showToast(t('removedManualCover') || 'Usunięto ręczną okładkę');
}

// Auto-uzupełnianie metadanych po starcie — checkbox w zakładce Okładki.
function bindAutoFetchSettings() {
  const checkbox = document.getElementById('auto-fetch-on-start');
  if (checkbox) checkbox.checked = config.uiState?.autoFetchOnStart === true;

  const saveBtn = document.getElementById('save-auto-fetch');
  if (!saveBtn || saveBtn.dataset.bound === 'true') return;

  saveBtn.addEventListener('click', async () => {
    const box = document.getElementById('auto-fetch-on-start');
    config.uiState.autoFetchOnStart = box?.checked === true;
    await saveStoredConfig();
    showToast(t('savedAutoFetch') || 'Zapisano opcję');
  });

  saveBtn.dataset.bound = 'true';
}

// Tryb atrakcji (wygaszacz) — checkbox w zakładce Ogólne.
function bindAttractSettings() {
  const checkbox = document.getElementById('attract-mode-toggle');
  if (checkbox) checkbox.checked = config.uiState?.attractMode !== false;

  const saveBtn = document.getElementById('save-attract-mode');
  if (!saveBtn || saveBtn.dataset.bound === 'true') return;

  saveBtn.addEventListener('click', async () => {
    const box = document.getElementById('attract-mode-toggle');
    config.uiState.attractMode = box?.checked === true;
    await saveStoredConfig();
    if (typeof initAttractMode === 'function') initAttractMode();
    showToast(t('attractSaved') || 'Zapisano tryb atrakcji');
  });

  saveBtn.dataset.bound = 'true';
}

// ------------------------------------------------------------
// Kopia zapasowa konfiguracji i statystyk
// ------------------------------------------------------------

function downloadBackupFallback(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `retro-launcher-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function exportBackup() {
  if (window.launcherAPI?.exportBackup) {
    const res = await window.launcherAPI.exportBackup();
    if (res?.canceled) return;
    if (!res?.ok) {
      showToast(t('backupImportError') || 'Nie udało się zapisać kopii', true);
      return;
    }
    showToast(t('backupExported') || 'Zapisano kopię zapasową');
    return;
  }

  // Fallback (np. Tauri): pobranie pliku przez Blob.
  downloadBackupFallback({
    app: 'retro-launcher',
    exportedAt: new Date().toISOString(),
    config,
    playtime: { playtime: playtimeStats }
  });
  showToast(t('backupExported') || 'Zapisano kopię zapasową');
}

async function importBackup() {
  if (window.launcherAPI?.importBackup) {
    const res = await window.launcherAPI.importBackup();
    if (res?.canceled) return;
    if (!res?.ok) {
      showToast(t('backupInvalid') || 'Nieprawidłowy plik kopii zapasowej', true);
      return;
    }
    showToast(t('backupImported') || 'Zaimportowano kopię — przeładowuję…');
    setTimeout(() => location.reload(), 900);
    return;
  }

  document.getElementById('import-backup-file')?.click();
}

async function importBackupFromFile(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const nextConfig =
      parsed?.config && typeof parsed.config === 'object'
        ? parsed.config
        : parsed;

    if (
      !nextConfig
      || typeof nextConfig !== 'object'
      || (!Array.isArray(nextConfig.platforms) && !nextConfig.uiState)
    ) {
      showToast(t('backupInvalid') || 'Nieprawidłowy plik kopii zapasowej', true);
      return;
    }

    config = mergeStoredConfig(nextConfig);
    ensurePresetEmulators();
    await saveStoredConfig();
    showToast(t('backupImported') || 'Zaimportowano kopię — przeładowuję…');
    setTimeout(() => location.reload(), 900);
  } catch (e) {
    showToast(t('backupImportError') || 'Nie udało się zaimportować kopii', true);
  }
}

function bindBackupSettings() {
  const exportBtn = document.getElementById('export-backup');
  const importBtn = document.getElementById('import-backup');
  const fileInput = document.getElementById('import-backup-file');

  if (exportBtn && exportBtn.dataset.bound !== 'true') {
    exportBtn.addEventListener('click', exportBackup);
    exportBtn.dataset.bound = 'true';
  }

  if (importBtn && importBtn.dataset.bound !== 'true') {
    importBtn.addEventListener('click', importBackup);
    importBtn.dataset.bound = 'true';
  }

  if (fileInput && fileInput.dataset.bound !== 'true') {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) importBackupFromFile(file);
      fileInput.value = '';
    });
    fileInput.dataset.bound = 'true';
  }
}

// ------------------------------------------------------------
// Tryb przenośny
// ------------------------------------------------------------

async function refreshPortableSettings() {
  const status = document.getElementById('portable-status');
  const enableBtn = document.getElementById('portable-enable');
  const disableBtn = document.getElementById('portable-disable');
  if (!status) return;

  if (!window.launcherAPI?.getPortableInfo) {
    status.textContent = t('portableUnavailable');
    if (enableBtn) enableBtn.hidden = true;
    if (disableBtn) disableBtn.hidden = true;
    return;
  }

  const info = await loadPortableInfo(true);
  const label = info.portable ? t('portableEnabled') : t('portableDisabled');

  status.textContent = '';
  const strong = document.createElement('strong');
  strong.textContent = label;
  const br = document.createElement('br');
  const code = document.createElement('code');
  code.textContent = info.dataDir || info.defaultDataDir || '';
  status.append(strong, br, code);

  if (enableBtn) enableBtn.hidden = !!info.portable;
  if (disableBtn) disableBtn.hidden = !info.portable;
}

function bindPortableSettings() {
  const enableBtn = document.getElementById('portable-enable');
  const disableBtn = document.getElementById('portable-disable');

  if (enableBtn && enableBtn.dataset.bound !== 'true') {
    enableBtn.addEventListener('click', async () => {
      if (!window.confirm(t('portableEnableConfirm'))) return;

      enableBtn.disabled = true;
      const res = await window.launcherAPI.enablePortableMode();

      if (!res?.ok) {
        enableBtn.disabled = false;
        showToast(t('portableError'), true);
        return;
      }

      showToast(t('portableRestarting'));
    });
    enableBtn.dataset.bound = 'true';
  }

  if (disableBtn && disableBtn.dataset.bound !== 'true') {
    disableBtn.addEventListener('click', async () => {
      if (!window.confirm(t('portableDisableConfirm'))) return;

      disableBtn.disabled = true;
      const res = await window.launcherAPI.disablePortableMode();

      if (!res?.ok) {
        disableBtn.disabled = false;
        showToast(t('portableError'), true);
        return;
      }

      showToast(t('portableRestarting'));
    });
    disableBtn.dataset.bound = 'true';
  }

  refreshPortableSettings();
}

// ------------------------------------------------------------
// Kontrola stanu biblioteki
// ------------------------------------------------------------

async function checkLibraryHealth() {
  const box = document.getElementById('library-health');
  if (!box) return;

  box.textContent = t('checkingLibrary');
  const issues = [];

  for (const platform of config.platforms) {
    const folder = config.romFolders?.[platform.key];

    if (!folder) {
      if (games.some(g => g.platform === platform.key)) {
        issues.push(`${platform.label}: ${t('noRomFolder')}`);
      }
      continue;
    }

    if (window.launcherAPI?.pathExists) {
      const res = await window.launcherAPI.pathExists(folder);
      if (res?.ok && res.exists === false) {
        issues.push(`${platform.label}: ${t('folderMissing')} ${folder}`);
      }
    }
  }

  games
    .filter(game => Number(game.fileSize) === 0)
    .forEach(game => {
      issues.push(`${t('emptyFile')} ${getDisplayTitle(game)}`);
    });

  const byTitle = new Map();
  games.forEach(game => {
    const key = getDisplayTitle(game).trim().toLowerCase();
    if (!key) return;
    if (!byTitle.has(key)) byTitle.set(key, new Set());
    byTitle.get(key).add(game.platform);
  });

  byTitle.forEach((platforms, title) => {
    if (platforms.size > 1) {
      issues.push(`${t('duplicateGame')} ${title} (${[...platforms].join(', ')})`);
    }
  });

  box.textContent = '';

  if (!issues.length) {
    box.textContent = t('libraryHealthy');
    return;
  }

  const list = document.createElement('ul');
  issues.slice(0, 40).forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    list.appendChild(li);
  });

  if (issues.length > 40) {
    const li = document.createElement('li');
    li.textContent = `+${issues.length - 40}…`;
    list.appendChild(li);
  }

  box.appendChild(list);
}

function bindLibraryHealth() {
  const button = document.getElementById('check-library-health');
  if (!button || button.dataset.bound === 'true') return;

  button.addEventListener('click', checkLibraryHealth);
  button.dataset.bound = 'true';
}

// ------------------------------------------------------------
// Statystyki zbiorcze
// ------------------------------------------------------------

async function renderStatsPanel() {
  const box = document.getElementById('stats-summary');
  if (!box) return;

  box.textContent = t('checkingStats');

  if (typeof loadPlaytimeStats === 'function') {
    await loadPlaytimeStats({ reapply: false, force: true });
  }

  const rows = Object.keys(playtimeStats).map(id => {
    const game = games.find(g => g.id === id) || null;
    return {
      id,
      game,
      ms: typeof getGameTotalPlaytimeMs === 'function' ? getGameTotalPlaytimeMs(id) : 0,
      plays: Number(playtimeStats[id]?.plays) || 0
    };
  }).filter(row => row.ms > 0 || row.plays > 0);

  const totalMs = rows.reduce((sum, row) => sum + row.ms, 0);
  const totalPlays = rows.reduce((sum, row) => sum + row.plays, 0);
  const favoriteCount = games.filter(g => isGameFavorite(g.id)).length;

  box.textContent = '';

  const grid = document.createElement('div');
  grid.className = 'stats-grid';

  const tiles = [
    [t('statsTotalTime'), formatPlaytimeMs(totalMs) || '0m'],
    [t('statsGamesPlayed'), `${rows.length} / ${games.length}`],
    [t('statsLaunches'), String(totalPlays)],
    [t('statsFavorites'), String(favoriteCount)]
  ];

  tiles.forEach(([label, value]) => {
    const tile = document.createElement('div');
    tile.className = 'stats-tile';
    const span = document.createElement('span');
    span.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = value;
    tile.append(span, strong);
    grid.appendChild(tile);
  });

  box.appendChild(grid);

  if (!rows.length) {
    const empty = document.createElement('p');
    empty.className = 'stats-empty';
    empty.textContent = t('statsNoData');
    box.appendChild(empty);
    return;
  }

  const top = [...rows].sort((a, b) => b.ms - a.ms).slice(0, 5);
  const topTitle = document.createElement('h4');
  topTitle.textContent = t('statsTopGames');
  box.appendChild(topTitle);

  const list = document.createElement('ol');
  list.className = 'stats-list';
  top.forEach(row => {
    const li = document.createElement('li');
    const name = row.game ? getDisplayTitle(row.game) : row.id;
    li.textContent = `${name} — ${formatPlaytimeMs(row.ms) || '0m'} (${row.plays}×)`;
    list.appendChild(li);
  });
  box.appendChild(list);

  const byPlatform = new Map();
  rows.forEach(row => {
    const key = row.game?.platform || '—';
    byPlatform.set(key, (byPlatform.get(key) || 0) + row.ms);
  });

  const platformTitle = document.createElement('h4');
  platformTitle.textContent = t('statsByPlatform');
  box.appendChild(platformTitle);

  const platformList = document.createElement('ul');
  platformList.className = 'stats-list';
  [...byPlatform.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, ms]) => {
      const li = document.createElement('li');
      const name = key === '—' ? '—' : (getPlatform(key)?.label || key);
      li.textContent = `${name} — ${formatPlaytimeMs(ms) || '0m'}`;
      platformList.appendChild(li);
    });
  box.appendChild(platformList);
}

function bindStatsPanel() {
  const button = document.getElementById('refresh-stats');
  if (!button || button.dataset.bound === 'true') return;

  button.addEventListener('click', renderStatsPanel);
  button.dataset.bound = 'true';
}

// ------------------------------------------------------------
// Import gamelist.xml z EmulationStation
// ------------------------------------------------------------

function populateGamelistPlatformSelect() {
  const select = document.getElementById('gamelist-platform');
  if (!select) return;

  const previous = select.value;
  select.innerHTML = '';

  config.platforms.forEach(platform => {
    const option = document.createElement('option');
    option.value = platform.key;
    option.textContent = platform.label;
    select.appendChild(option);
  });

  if (previous && config.platforms.some(p => p.key === previous)) {
    select.value = previous;
  } else if (activePlatform !== 'all' && config.platforms.some(p => p.key === activePlatform)) {
    select.value = activePlatform;
  } else if (config.platforms[0]) {
    select.value = config.platforms[0].key;
  }
}

function gamelistNodeText(node, tag) {
  const el = node.getElementsByTagName(tag)[0];
  return el?.textContent?.trim() || '';
}

function gamelistFileUrl(absPath) {
  const normalized = String(absPath).replace(/\\/g, '/');
  return 'file://' + (normalized.startsWith('/') ? '' : '/') + encodeURI(normalized);
}

async function applyGamelistContent(content, dir, platformKey) {
  if (!platformKey) {
    showToast(t('gamelistNoPlatform'), true);
    return;
  }

  const resultBox = document.getElementById('gamelist-result');
  const noOverwrite = document.getElementById('gamelist-no-overwrite')?.checked !== false;

  let doc = null;
  try {
    doc = new DOMParser().parseFromString(content, 'text/xml');
  } catch (_) {
    doc = null;
  }

  if (!doc || doc.querySelector('parsererror')) {
    showToast(t('gamelistInvalid'), true);
    return;
  }

  const nodes = [...doc.querySelectorAll('game')];
  if (!nodes.length) {
    showToast(t('gamelistInvalid'), true);
    return;
  }

  config.metadata = config.metadata || {};
  config.metadata[platformKey] = config.metadata[platformKey] || {};
  config.manualCovers = config.manualCovers || {};
  config.manualCovers[platformKey] = config.manualCovers[platformKey] || {};

  const platformGames = games.filter(game => game.platform === platformKey);
  let updated = 0;
  let skipped = 0;
  let missing = 0;

  nodes.forEach(node => {
    const name = gamelistNodeText(node, 'name');
    const relPath = gamelistNodeText(node, 'path');
    const baseName = relPath.split(/[\\/]/).pop().toLowerCase();

    const target =
      platformGames.find(game =>
        baseName && String(game.rom).split(/[\\/]/).pop().toLowerCase() === baseName
      )
      || platformGames.find(game =>
        normalizeGameName(game.title).toLowerCase() === normalizeGameName(name).toLowerCase()
      );

    if (!target) {
      missing += 1;
      return;
    }

    const existing = config.metadata[platformKey][target.id] || {};

    if (noOverwrite && (existing.title || existing.description || existing.desc_pl || existing.desc_en)) {
      skipped += 1;
      return;
    }

    const desc = gamelistNodeText(node, 'desc');
    const genre = gamelistNodeText(node, 'genre');
    const yearText = gamelistNodeText(node, 'year')
      || gamelistNodeText(node, 'releasedate').slice(0, 4);
    const dev = gamelistNodeText(node, 'developer') || gamelistNodeText(node, 'publisher');
    const players = gamelistNodeText(node, 'players');
    const rating = Number.parseFloat(gamelistNodeText(node, 'rating').replace(',', '.'));

    const meta = { ...existing };

    if (name) meta.title = name;
    if (desc) {
      meta.description = desc;
      if (getSavedLanguage() === 'en') meta.desc_en = desc;
      else meta.desc_pl = desc;
    }
    if (genre) {
      meta.genres = genre.split(/[,/;]/).map(value => value.trim()).filter(Boolean);
    }
    if (yearText) meta.year = Number(String(yearText).slice(0, 4)) || yearText;
    if (dev) meta.dev = dev;
    if (players) meta.players = players;
    if (Number.isFinite(rating)) {
      meta.rating = Math.round((rating <= 1 ? rating * 10 : rating) * 10) / 10;
    }

    config.metadata[platformKey][target.id] = meta;

    const image = gamelistNodeText(node, 'image') || gamelistNodeText(node, 'thumbnail');
    const hasManualCover = !!config.manualCovers[platformKey][target.id];

    if (image && (!noOverwrite || !hasManualCover)) {
      let resolved = '';

      if (/^https?:/i.test(image)) resolved = image;
      else if (image.startsWith('/')) resolved = gamelistFileUrl(image);
      else if (dir) resolved = gamelistFileUrl(`${dir}/${image.replace(/^\.\//, '')}`);
      else if (/^[A-Za-z]:[\\/]/.test(image)) resolved = gamelistFileUrl(image);

      if (resolved) config.manualCovers[platformKey][target.id] = resolved;
    }

    updated += 1;
  });

  await saveStoredConfig();
  await refreshLibrary();

  if (resultBox) {
    resultBox.hidden = false;
    resultBox.textContent =
      `${t('gamelistImported')} — ${t('gamelistUpdated')}: ${updated}, `
      + `${t('gamelistSkipped')}: ${skipped}, ${t('gamelistNoMatch')}: ${missing}`;
  }

  showToast(`${t('gamelistImported')}: ${updated}`);
}

async function importGamelist() {
  const platformKey = document.getElementById('gamelist-platform')?.value || '';
  if (!platformKey) {
    showToast(t('gamelistNoPlatform'), true);
    return;
  }

  if (window.launcherAPI?.selectGamelist) {
    let res;
    try {
      res = await window.launcherAPI.selectGamelist();
    } catch (e) {
      showToast(t('gamelistReadError'), true);
      return;
    }

    if (!res) return;
    if (!res.ok) {
      showToast(t('gamelistReadError'), true);
      return;
    }

    await applyGamelistContent(res.content, res.dir, platformKey);
    return;
  }

  document.getElementById('gamelist-file-input')?.click();
}

function bindGamelistImport() {
  const button = document.getElementById('import-gamelist');
  if (button && button.dataset.bound !== 'true') {
    button.addEventListener('click', importGamelist);
    button.dataset.bound = 'true';
  }

  const input = document.getElementById('gamelist-file-input');
  if (input && input.dataset.bound !== 'true') {
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        const platformKey = document.getElementById('gamelist-platform')?.value || '';
        await applyGamelistContent(content, '', platformKey);
      } catch (e) {
        showToast(t('gamelistReadError'), true);
      }

      input.value = '';
    });
    input.dataset.bound = 'true';
  }
}

async function fetchMetadataForSelectedPlatforms(force = false) {
  const selectedPlatform = getArtworkSettingsPlatform();

  if (selectedPlatform === 'all') {
    const platformKeys = config.platforms.map(p => p.key);
    if (!platformKeys.length) {
      showToast(t('noPlatformsToFetch') || 'Brak platform do pobrania', true);
      return;
    }

    for (const platformKey of platformKeys) {
      await enrichPlatformMetadata(platformKey, force);
    }

    await refreshLibrary();
    showToast(
      force
        ? (t('refreshedAllPlatforms') || 'Odświeżono dane dla wszystkich platform')
        : (t('fetchedAllPlatforms') || 'Pobrano dane dla wszystkich platform')
    );
    return;
  }

  await enrichPlatformMetadata(selectedPlatform, force);
  await refreshLibrary();
}

function renderAspectOptions(current) {
  const selected = current || 'standard';
  return ASPECT_ORDER.map(aspect => {
    const label = t(getAspectLabelKey(aspect)) || aspect;
    return `<option value="${aspect}" ${aspect === selected ? 'selected' : ''}>${label}</option>`;
  }).join('');
}

function renderPcRunnerOptions(current) {
  const runners = [
    ['native', 'pcRunnerNative'],
    ['wine', 'pcRunnerWine'],
    ['wine-ge', 'pcRunnerWineGe'],
    ['proton-ge', 'pcRunnerProtonGe']
  ];
  return runners.map(([value, key]) =>
    `<option value="${value}" ${value === current ? 'selected' : ''}>${t(key) || value}</option>`
  ).join('');
}

let pcRunnersCache = {};

if (window.launcherAPI?.onRunnerProgress) {
  window.launcherAPI.onRunnerProgress(data => {
    const button = document.querySelector(`[data-pc-install="${data?.runner}"]`);
    if (!button) return;
    if (data?.percent != null) {
      button.textContent = `${t('pcInstalling') || 'Pobieranie…'} ${data.percent}%`;
    } else {
      button.textContent = t('pcInstalling') || 'Pobieranie…';
    }
  });
}

function basenameOf(filePath) {
  return String(filePath || '').split(/[\\/]/).pop() || String(filePath || '');
}

function addPcEntries(platformKey, entries) {
  if (!config.pcGames) config.pcGames = {};
  if (!Array.isArray(config.pcGames[platformKey])) config.pcGames[platformKey] = [];

  const list = config.pcGames[platformKey];
  const seen = new Set(list.map(entry => entry.path));
  let added = 0;

  (entries || []).forEach(entry => {
    const filePath = typeof entry === 'string' ? entry : (entry?.path || entry?.rom);
    if (!filePath || seen.has(filePath)) return;
    seen.add(filePath);

    const fileName = basenameOf(filePath);
    const extMatch = fileName.match(/(\.[^.]+)$/);
    list.push({
      path: filePath,
      title: entry?.title || (extMatch ? fileName.slice(0, -extMatch[1].length) : fileName)
    });
    added += 1;
  });

  return added;
}

async function addPcGamesFromPicker(platformKey) {
  if (!window.launcherAPI?.selectGameFiles) {
    showToast(t('noFilePicker') || 'Brak okna wyboru plików', true);
    return;
  }

  const files = await window.launcherAPI.selectGameFiles();
  if (!files?.length) return;

  const added = addPcEntries(platformKey, files);
  if (!added) return;

  await saveStoredConfig();
  await refreshLibrary();
  renderSettings();
  showToast((t('pcAddGamesSuccess') || 'Dodano gry PC: ') + added);
}

async function addPcGamesFromFolder(platformKey) {
  if (!window.launcherAPI?.scanExecutables) {
    showToast(t('noFilePicker') || 'Brak mostka do skanowania', true);
    return;
  }

  const folder = await window.launcherAPI.selectFolder();
  if (!folder) return;

  const platform = getPlatform(platformKey);
  const found = await window.launcherAPI.scanExecutables(folder, platform?.extensions || []);
  if (!found?.length) {
    showToast(t('pcNoExecutables') || 'Nie znaleziono plików wykonywalnych.', true);
    return;
  }

  const added = addPcEntries(platformKey, found);
  if (!added) {
    showToast(t('pcNoExecutables') || 'Brak nowych plików.', true);
    return;
  }

  await saveStoredConfig();
  await refreshLibrary();
  renderSettings();
  showToast((t('pcScanSuccess') || 'Znaleziono i dodano pliki: ') + added);
}

function renderPcRunnerList(platformKey, data) {
  const el = document.querySelector(`[data-pc-runner-list="${platformKey}"]`);
  if (!el) return;

  if (!data?.ok) {
    el.innerHTML = `<span class="pc-runner-missing">${escapeHtmlText(data?.error || '')}</span>`;
    return;
  }

  const parts = [];
  if (data.wine) parts.push(`Wine: <code>${escapeHtmlText(data.wine)}</code>`);
  if (data.winetricks) parts.push(`Winetricks: <code>${escapeHtmlText(data.winetricks)}</code>`);
  if (data.proton?.length) parts.push(`Proton-GE: ${data.proton.map(p => escapeHtmlText(p.name)).join(', ')}`);
  if (data.wineGe?.length) parts.push(`Wine-GE: ${data.wineGe.map(p => escapeHtmlText(p.name)).join(', ')}`);
  if (data.steamRoot) parts.push(`Steam: <code>${escapeHtmlText(data.steamRoot)}</code>`);

  const hasRunner = !!data.wine || !!data.proton?.length || !!data.wineGe?.length;
  if (!hasRunner) {
    parts.push(`<span class="pc-runner-missing">${t('pcRunnerNotFound') || 'Nie wykryto runnerów.'}</span>`);
  }

  el.innerHTML = parts.length
    ? parts.map(part => `<div class="pc-runner-item">${part}</div>`).join('')
    : `<span class="pc-runner-missing">${t('pcRunnerNotFound') || 'Nie wykryto runnerów.'}</span>`;
}

async function refreshPcRunners(platformKey, silent = true) {
  if (!window.launcherAPI?.detectPcRunners) return null;
  const data = await window.launcherAPI.detectPcRunners();
  pcRunnersCache = data || {};
  renderPcRunnerList(platformKey, data);
  if (!silent) showToast(t('pcDetected') || 'Wykryto runnery');
  return data;
}

function renderSettings() {
  renderSettingsWarning();

  const steamgridInput = document.getElementById('steamgrid-api-key-input');
  if (steamgridInput) steamgridInput.value = config.apiKeys?.steamgrid || '';
if (typeof fillApiKeyFields === 'function') fillApiKeyFields();

  const fsSel = document.getElementById('fullscreen-on-launch');
  if (fsSel) fsSel.value = String(!!config.uiState?.fullscreenOnLaunch);

  populateArtworkPlatformSelect();
  populateManualCoverPlatformSelect();
  bindAutoFetchSettings();
  bindAttractSettings();
  bindBackupSettings();
  bindPortableSettings();
  bindLibraryHealth();
  bindStatsPanel();
  populateGamelistPlatformSelect();
  bindGamelistImport();

  platformBlocks.innerHTML = '';

  config.platforms.forEach(p => {
    const romPath = config.romFolders[p.key] || '';
    const emuPath = config.emulators[p.key] || '';
    const launchArgs = config.launchArgs[p.key] || '';
    const aspect = p.aspect || 'standard';
    const custom = p.aspectCustom || { width: 180, ratio: 0.72 };
    const isPc = p.kind === 'pc';
    const pcGamesCount = Array.isArray(config.pcGames?.[p.key]) ? config.pcGames[p.key].length : 0;

    const block = document.createElement('div');
    block.className = 'platform-block' + (isPc ? ' platform-block-pc' : '');
    block.innerHTML = `
      <div class="platform-header">
        <span class="platform-badge" style="background:${p.color}33;color:${p.color}">${escapeHtmlText(p.label)}</span>
        <span class="ext-hint">${escapeHtmlText((p.extensions || []).join(', '))}</span>
        <button type="button" class="rename-platform-btn" data-key="${p.key}" title="${t('renamePlatform') || 'Zmień nazwę platformy'}">✎</button>
        <button type="button" class="remove-platform-btn" data-key="${p.key}" title="${t('removePlatform') || 'Usuń platformę'}">${svgIcon('i-x')}</button>
      </div>

      ${isPc ? `
      <div class="pc-panel">
        <p class="settings-note">${t('pcPlatformNote') || 'Ta platforma przechowuje listę plików wykonywalnych zamiast folderu ROM-ów.'}</p>

        <div class="field-row field-row-stack">
          <div class="field-label">${t('pcGameCount') || 'Dodane gry PC: '} ${pcGamesCount}</div>
          <div class="settings-actions-row">
            <button type="button" class="browse-btn" data-pc-add="${p.key}">${t('pcAddGames') || 'Dodaj gry…'}</button>
            <button type="button" class="browse-btn" data-pc-scan="${p.key}">${t('pcScanFolder') || 'Skanuj folder…'}</button>
            <button type="button" class="test-launch-btn" data-pc-clear="${p.key}">${t('pcClearGames') || 'Wyczyść listę gier PC'}</button>
          </div>
        </div>

        <div class="field-row field-row-stack">
          <div class="field-label">${t('pcRunner') || 'Runner'}</div>
          <select class="field-select" data-pc-runner="${p.key}">
            ${renderPcRunnerOptions(p.pcRunner || 'native')}
          </select>
        </div>

        <div class="field-row field-row-stack">
          <div class="field-label">${t('pcPrefix') || 'Prefiks Wine (WINEPREFIX)'}</div>
          <input type="text" class="field-textinput" data-pc-prefix="${p.key}"
            value="${escapeHtmlText(p.pcPrefix || '')}"
            placeholder="${t('pcPrefixPlaceholder') || 'Domyślnie ~/Games/retro-launcher'}" />
        </div>

        <div class="field-row field-row-stack">
          <div class="field-label">${t('pcRunnerPath') || 'Ścieżka runnera (opcjonalnie)'}</div>
          <input type="text" class="field-textinput" data-pc-runner-path="${p.key}"
            value="${escapeHtmlText(p.pcRunnerPath || '')}"
            placeholder="${t('pcRunnerPathPlaceholder') || 'Np. ~/.local/share/Steam/compatibilitytools.d/GE-Proton...'}" />
        </div>

        <div class="field-row field-row-stack">
          <div class="field-label">${t('pcEnv') || 'Zmienne środowiskowe'}</div>
          <textarea class="field-textinput" rows="2" data-pc-env="${p.key}"
            placeholder="${t('pcEnvPlaceholder') || 'KEY=WARTOŚĆ (jedna na linię)'}">${escapeHtmlText(p.pcEnv || '')}</textarea>
          <small class="settings-note">${t('pcEnvHint') || 'Format KEY=WARTOŚĆ, jedna zmienna na linię.'}</small>
        </div>

        <div class="field-row field-row-stack">
          <div class="field-label">${t('pcDetect') || 'Wykryj runnery'}</div>
          <div class="settings-actions-row">
            <button type="button" class="browse-btn" data-pc-detect="${p.key}">${t('pcDetect') || 'Wykryj runnery'}</button>
            <button type="button" class="browse-btn" data-pc-install="proton-ge" data-key="${p.key}">${t('pcInstall') || 'Pobierz'} Proton-GE</button>
            <button type="button" class="browse-btn" data-pc-install="wine-ge" data-key="${p.key}">${t('pcInstall') || 'Pobierz'} Wine-GE</button>
          </div>
          <div class="pc-runner-list" data-pc-runner-list="${p.key}"></div>
        </div>

        <div class="field-row field-row-stack">
          <div class="field-label">${t('pcWinetricks') || 'Winetricks'}</div>
          <div class="pc-winetricks-row">
            <input type="text" class="field-textinput" data-pc-winetricks="${p.key}"
              value="${escapeHtmlText(p.pcWinetricks || '')}"
              placeholder="${t('pcWinetricksPlaceholder') || 'corefonts vcrun2019'}" />
            <button type="button" class="btn-secondary" data-pc-winetricks-run="${p.key}">${t('pcWinetricksRun') || 'Uruchom winetricks'}</button>
          </div>
          <small class="settings-note">${t('pcWinetricksHint') || 'Pakiety instalowane w wybranym prefiksie.'}</small>
        </div>
      </div>
      ` : `
      <div class="field-row">
        <div class="field-label">${t('romFolder') || 'Folder z ROM-ami'}</div>
        <div class="field-input ${romPath ? '' : 'empty'}">${escapeHtmlText(romPath || (t('notSet') || 'Nie ustawiono'))}</div>
        <button type="button" class="browse-btn" data-type="rom" data-key="${p.key}">${t('chooseFolder') || 'Wybierz folder…'}</button>
      </div>
      <div class="field-row field-row-stack">
        <div class="field-label">${t('launchCommand') || 'Polecenie uruchomieniowe'}</div>
        <input
          type="text"
          class="field-textinput"
          data-emulator-input="${p.key}"
          value="${escapeHtmlText(emuPath)}"
          placeholder="${DEFAULT_LAUNCH_PLACEHOLDER}"
        />
        <button type="button" class="browse-btn" data-type="emu" data-key="${p.key}">${t('chooseFile') || 'Wybierz plik…'}</button>
      </div>
      `}

      <div class="field-row field-row-stack">
        <div class="field-label">${t('defaultArgs') || 'Domyślne argumenty'}</div>
        <input
          type="text"
          class="field-textinput"
          data-args-input="${p.key}"
          value="${escapeHtmlText(launchArgs)}"
          placeholder="${t('argsPlaceholder') || 'Np. --fullscreen --fastboot'}"
        />
        ${isPc ? '' : `<button type="button" class="test-launch-btn" data-key="${p.key}">${t('test') || 'Testuj'}</button>`}
      </div>

      <div class="field-row field-row-stack">
        <div class="field-label">${t('coverType') || 'Typ okładki'}</div>
        <select class="field-select" data-aspect-input="${p.key}">
          ${renderAspectOptions(aspect)}
        </select>
        <div class="aspect-custom-row" data-aspect-custom="${p.key}" ${aspect === 'custom' ? '' : 'hidden'}>
          <input type="number" min="80" max="600" step="10" class="field-textinput" data-aspect-width="${p.key}"
            value="${Number(custom.width) || 180}" title="${t('customWidth') || 'Szerokość (px)'}" />
          <input type="number" min="0.25" max="6" step="0.01" class="field-textinput" data-aspect-ratio="${p.key}"
            value="${Number(custom.ratio) || 0.72}" title="${t('customRatio') || 'Proporcja (szer. / wys.)'}" />
          <small class="settings-note">${t('aspectCustomHint') || ''}</small>
        </div>
      </div>
    `;
    platformBlocks.appendChild(block);
  });

  const saveStartupBtn = document.getElementById('save-startup-settings');
  if (saveStartupBtn) {
    saveStartupBtn.onclick = async () => {
      config.uiState.fullscreenOnLaunch =
        document.getElementById('fullscreen-on-launch')?.value === 'true';
      await saveStoredConfig();
      showToast(t('savedStartupSettings') || 'Zapisano ustawienia startu');
    };
  }

  document.querySelectorAll('.browse-btn').forEach(btn => {
    btn.onclick = async () => {
      const type = btn.dataset.type;
      const key = btn.dataset.key;
      let picked = null;

      if (window.launcherAPI) {
        picked = type === 'rom'
          ? await window.launcherAPI.selectFolder()
          : await window.launcherAPI.selectExecutable();
      } else {
        picked = type === 'rom'
          ? `/home/user/roms/${key}`
          : `/opt/emulators/${key}/run`;
      }

      if (!picked) return;

      if (type === 'rom') {
        config.romFolders[key] = picked;
        await saveStoredConfig();
        await refreshLibrary();
        renderSettings();
        showToast(t('savedRomFolder') || 'Zapisano folder z ROM-ami');
      } else {
        config.emulators[key] = picked;
        await saveStoredConfig();
        renderSettings();
        showToast(t('savedLaunchCommand') || 'Zapisano polecenie uruchomieniowe');
      }
    };
  });

  document.querySelectorAll('[data-emulator-input]').forEach(el => {
    el.oninput = () => {
      config.emulators[el.dataset.emulatorInput] = el.value;
      saveStoredConfig();
    };
  });

  document.querySelectorAll('[data-args-input]').forEach(el => {
    el.oninput = () => {
      config.launchArgs[el.dataset.argsInput] = el.value;
      saveStoredConfig();
    };
  });

  document.querySelectorAll('[data-aspect-input]').forEach(el => {
    el.onchange = async () => {
      const key = el.dataset.aspectInput;
      const platform = getPlatform(key);
      if (!platform) return;
      platform.aspect = el.value;

      const customRow = document.querySelector(`[data-aspect-custom="${key}"]`);
      if (customRow) customRow.hidden = el.value !== 'custom';

      await saveStoredConfig();
      renderShelf();
      renderManualCoverPreview();
      showToast(t('savedCoverType') || 'Zapisano typ okładki');
    };
  });

  document.querySelectorAll('[data-aspect-width]').forEach(el => {
    el.onchange = async () => {
      const platform = getPlatform(el.dataset.aspectWidth);
      if (!platform) return;
      platform.aspectCustom = {
        width: Math.min(600, Math.max(80, Number(el.value) || 180)),
        ratio: Number(platform.aspectCustom?.ratio) || 0.72
      };
      await saveStoredConfig();
      renderShelf();
    };
  });

  document.querySelectorAll('[data-aspect-ratio]').forEach(el => {
    el.onchange = async () => {
      const platform = getPlatform(el.dataset.aspectRatio);
      if (!platform) return;
      platform.aspectCustom = {
        width: Number(platform.aspectCustom?.width) || 180,
        ratio: Math.min(6, Math.max(0.25, Number(el.value) || 0.72))
      };
      await saveStoredConfig();
      renderShelf();
    };
  });

  document.querySelectorAll('.rename-platform-btn').forEach(btn => {
    btn.onclick = async () => {
      const key = btn.dataset.key;
      const platform = getPlatform(key);
      if (!platform) return;

      const next = window.prompt(t('renamePlatformPrompt') || 'Podaj nową nazwę platformy:', platform.label);
      const label = String(next || '').trim();
      if (!label || label === platform.label) return;

      platform.label = label;
      const preset = PLATFORM_PRESETS.find(p => p.label.toLowerCase() === label.toLowerCase());
      if (preset) {
        platform.scraperSystem = preset.scraperSystem || platform.scraperSystem || null;
        platform.tgdb = preset.tgdb || platform.tgdb || null;
      }

      await saveStoredConfig();
      renderSettings();
      renderTabs();
      renderShelf();
      showToast(t('platformRenamed') || 'Zmieniono nazwę platformy');
    };
  });

  document.querySelectorAll('[data-pc-add]').forEach(btn => {
    btn.onclick = () => addPcGamesFromPicker(btn.dataset.pcAdd);
  });

  document.querySelectorAll('[data-pc-scan]').forEach(btn => {
    btn.onclick = () => addPcGamesFromFolder(btn.dataset.pcScan);
  });

  document.querySelectorAll('[data-pc-clear]').forEach(btn => {
    btn.onclick = async () => {
      if (!window.confirm(t('pcClearConfirm') || 'Usunąć wszystkie gry PC?')) return;
      const key = btn.dataset.pcClear;
      config.pcGames[key] = [];
      await saveStoredConfig();
      await refreshLibrary();
      renderSettings();
      showToast(t('pcGamesCleared') || 'Wyczyszczono listę gier PC');
    };
  });

  document.querySelectorAll('[data-pc-runner]').forEach(el => {
    el.onchange = async () => {
      const platform = getPlatform(el.dataset.pcRunner);
      if (!platform) return;
      platform.pcRunner = el.value;
      await saveStoredConfig();
    };
  });

  document.querySelectorAll('[data-pc-prefix]').forEach(el => {
    el.oninput = () => {
      const platform = getPlatform(el.dataset.pcPrefix);
      if (platform) platform.pcPrefix = el.value;
      saveStoredConfig();
    };
  });

  document.querySelectorAll('[data-pc-env]').forEach(el => {
    el.oninput = () => {
      const platform = getPlatform(el.dataset.pcEnv);
      if (platform) platform.pcEnv = el.value;
      saveStoredConfig();
    };
  });

  document.querySelectorAll('[data-pc-runner-path]').forEach(el => {
    el.oninput = () => {
      const platform = getPlatform(el.dataset.pcRunnerPath);
      if (platform) platform.pcRunnerPath = el.value;
      saveStoredConfig();
    };
  });

  document.querySelectorAll('[data-pc-winetricks]').forEach(el => {
    el.oninput = () => {
      const platform = getPlatform(el.dataset.pcWinetricks);
      if (platform) platform.pcWinetricks = el.value;
      saveStoredConfig();
    };
  });

  document.querySelectorAll('[data-pc-detect]').forEach(btn => {
    btn.onclick = () => refreshPcRunners(btn.dataset.pcDetect, false);
  });

  document.querySelectorAll('[data-pc-install]').forEach(btn => {
    btn.onclick = async () => {
      if (!window.launcherAPI?.installPcRunner) {
        showToast(t('pcRunnerNotSupported') || 'Instalacja niedostępna', true);
        return;
      }

      const runner = btn.dataset.pcInstall;
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = t('pcInstalling') || 'Pobieranie…';

      const result = await window.launcherAPI.installPcRunner(runner);
      btn.disabled = false;
      btn.textContent = label;

      if (result?.ok) {
        showToast(result.alreadyInstalled
          ? (t('pcRunnerExists') || 'Runner jest już zainstalowany')
          : (t('pcRunnerInstalled') || 'Zainstalowano runner') + (result.name ? ': ' + result.name : ''));
        await refreshPcRunners(btn.dataset.key, true);
      } else {
        showToast((t('pcRunnerInstallFailed') || 'Nie udało się zainstalować runnera') + ': ' + (result?.error || ''), true);
      }
    };
  });

  document.querySelectorAll('[data-pc-winetricks-run]').forEach(btn => {
    btn.onclick = async () => {
      const platform = getPlatform(btn.dataset.pcWinetricksRun);
      if (!platform) return;

      if (!window.launcherAPI?.runWinetricks) {
        showToast(t('pcWinetricksError') || 'Brak mostka winetricks', true);
        return;
      }

      const result = await window.launcherAPI.runWinetricks({
        prefix: platform.pcPrefix || '',
        verbs: platform.pcWinetricks || '',
        runner: platform.pcRunner || 'native',
        runnerPath: platform.pcRunnerPath || ''
      });

      if (result?.ok) showToast(t('pcWinetricksStarted') || 'Uruchomiono winetricks w tle');
      else showToast((t('pcWinetricksError') || 'Błąd winetricks') + ': ' + (result?.error || ''), true);
    };
  });

  // Status runnerów pokazujemy od razu po wejściu w Ustawienia → Platformy.
  document.querySelectorAll('[data-pc-runner-list]').forEach(el => {
    refreshPcRunners(el.dataset.pcRunnerList, true);
  });

  document.querySelectorAll('.test-launch-btn').forEach(btn => {
    btn.onclick = async () => {
      const key = btn.dataset.key;
      const emulatorPath = config.emulators[key] || '';
      const rawArgs = config.launchArgs[key] || '';
      const extraArgs = parseArgString(rawArgs);

      if (!window.launcherAPI?.testEmulator) {
        showToast(t('noTestBridge') || 'Brak mostka IPC do testu uruchomienia', true);
        return;
      }

      const result = await window.launcherAPI.testEmulator({
        emulatorPath,
        extraArgs
      });

      if (result?.ok) showToast(t('testCommandLaunched') || 'Polecenie testowe uruchomione');
      else showToast(result?.error || (t('testFailed') || 'Test nieudany'), true);
    };
  });

  const langSel = document.getElementById('language-select');
  if (langSel) langSel.value = getSavedLanguage();

  populateThemeSelect();

  bindLanguageSettings();
  bindThemeSettings();
  applyI18n();

  document.querySelectorAll('.remove-platform-btn').forEach(btn => {
    btn.onclick = async () => {
      const key = btn.dataset.key;
      const removedGameIds = scannedGames.filter(g => g.platform === key).map(g => g.id);
      config.platforms = config.platforms.filter(p => p.key !== key);
      delete config.romFolders[key];
      delete config.emulators[key];
      delete config.launchArgs[key];
      delete config.metadata[key];
      delete config.manualCovers[key];
      delete config.userRatings[key];
      delete config.hiddenGames[key];
      delete config.pcGames[key];
      removedGameIds.forEach(gameId => {
        delete config.gameArgs?.[gameId];
        delete config.pcGameSettings?.[gameId];
      });

      await saveStoredConfig();
      showToast(t('platformRemoved') || 'Usunięto platformę');

      renderSettings();
      renderTabs();

      const artworkPlatformSelect = document.getElementById('artwork-platform-select');
      const manualPlatformSelect = document.getElementById('manual-cover-platform');
      const removedWasActive = activePlatform === key;

      if (artworkPlatformSelect && artworkPlatformSelect.value === key) {
        artworkPlatformSelect.value = 'all';
      }

      if (manualPlatformSelect && manualPlatformSelect.value === key) {
        manualPlatformSelect.value = 'all';
      }

      if (removedWasActive) {
        activePlatform = 'all';
        await refreshLibrary();
      } else {
        renderManualCoverPreview();
      }
    };
  });

  const steamgridSaveBtn = document.getElementById('save-steamgrid-api-key');
  if (steamgridSaveBtn) {
    steamgridSaveBtn.onclick = async () => {
      const input = document.getElementById('steamgrid-api-key-input');
      config.apiKeys.steamgrid = (input?.value || '').trim();
      await saveStoredConfig();
      showToast(t('savedSteamgridKey') || 'Zapisano klucz SteamGridDB API');
    };
  }

  const artworkPlatformSelect = document.getElementById('artwork-platform-select');
  if (artworkPlatformSelect) {
    artworkPlatformSelect.onchange = () => {
      const selected = artworkPlatformSelect.value || 'all';
      const manualPlatformSelect = document.getElementById('manual-cover-platform');

      if (manualPlatformSelect) {
        manualPlatformSelect.value = selected;
      }

      populateManualCoverGameSelect();
      renderManualCoverPreview();
    };
  }

  const manualCoverPlatformSelect = document.getElementById('manual-cover-platform');
  if (manualCoverPlatformSelect) {
    manualCoverPlatformSelect.onchange = () => {
      populateManualCoverGameSelect();
      renderManualCoverPreview();
    };
  }

  const manualCoverSelect = document.getElementById('manual-cover-game');
  populateManualCoverGameSelect();

  const manualCoverUrlBtn = document.getElementById('save-manual-cover-url');
  const manualCoverFileBtn = document.getElementById('pick-manual-cover-file');
  const manualCoverClearBtn = document.getElementById('clear-manual-cover');

  renderManualCoverPreview();

  if (manualCoverSelect) {
    manualCoverSelect.onchange = () => renderManualCoverPreview();
  }

  if (manualCoverUrlBtn) manualCoverUrlBtn.onclick = saveManualCoverFromUrl;
  if (manualCoverFileBtn) manualCoverFileBtn.onclick = pickManualCoverFile;
  if (manualCoverClearBtn) manualCoverClearBtn.onclick = clearManualCover;

  const bulkMetaBtn = document.getElementById('bulk-fetch-platform-meta');
  if (bulkMetaBtn) {
    bulkMetaBtn.onclick = async () => {
      await fetchMetadataForSelectedPlatforms(false);
    };
  }

  const forceMetaBtn = document.getElementById('force-fetch-platform-meta');
  if (forceMetaBtn) {
    forceMetaBtn.onclick = async () => {
      await fetchMetadataForSelectedPlatforms(true);
    };
  }

  // Panel „Menedżer gier" (ukrywanie plików per platforma).
  if (typeof refreshGamesManager === 'function') {
    refreshGamesManager();
  }
}

function activateSettingsSubtab(name) {
  const tabs = [...document.querySelectorAll('.settings-subtab')];
  const panels = [...document.querySelectorAll('.settings-subpanel')];

  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.subtab === name);
    t.setAttribute('aria-selected', String(t.dataset.subtab === name));
  });

  panels.forEach(p => p.classList.toggle('active', p.dataset.subpanel === name));

  if (name === 'games' && typeof refreshGamesManager === 'function') {
    refreshGamesManager();
  }

  if (name === 'general' && typeof checkLibraryHealth === 'function') {
    setTimeout(checkLibraryHealth, 80);
  }

  if (name === 'stats' && typeof renderStatsPanel === 'function') {
    setTimeout(renderStatsPanel, 80);
  }
}

function switchToPage(page) {
  const shelfView = document.querySelector('[data-view="shelf"]');
  const navSettings = document.getElementById('navSettings');
  const navHome = document.getElementById('navHome');
  const overlay = document.getElementById('overlay');
  const shelf = document.querySelector('.shelf');
  const shelfInfo = document.querySelector('.shelf-info');

  if (shelfView) shelfView.hidden = page === 'settings';
  if (settingsPanel) settingsPanel.hidden = page !== 'settings';

  if (page !== 'settings') {
    overlay?.classList.remove('open');
    shelf?.classList.remove('switching');
    shelfInfo?.classList.remove('switching');
    renderShelf?.();
    renderManualCoverPreview?.();
  }

  if (navSettings) navSettings.classList.toggle('active-view', page === 'settings');
  if (navHome) navHome.classList.toggle('active-view', page !== 'settings');

  config.uiState.settingsOpen = page === 'settings';
  location.hash = page === 'settings' ? '#settings' : '#home';

  if (page === 'settings') {
    const activeSubtab = document.querySelector('.settings-subtab.active')?.dataset.subtab;
    if (activeSubtab === 'general' && typeof checkLibraryHealth === 'function') {
      setTimeout(checkLibraryHealth, 120);
    }
    if (activeSubtab === 'stats' && typeof renderStatsPanel === 'function') {
      setTimeout(renderStatsPanel, 120);
    }
  }
}

function getSavedLanguage() {
  return config.uiState?.language === 'en' ? 'en' : 'pl';
}

function setSavedLanguage(lang) {
  const next = lang === 'en' ? 'en' : 'pl';
  config.uiState = config.uiState || {};
  config.uiState.language = next;
  return next;
}

function t(key) {
  const lang = getSavedLanguage();
  return I18N[lang]?.[key] || I18N.pl[key] || key;
}

function bindLanguageSettings() {
  const select = document.getElementById('language-select');
  const btn = document.getElementById('save-language');
  if (!select || !btn || btn.dataset.bound === 'true') return;

  select.value = getSavedLanguage();

  btn.addEventListener('click', async () => {
    setSavedLanguage(select.value);
    await saveStoredConfig();
    applyI18n();
    renderSettings();
    await refreshLibrary();
    renderShelf();
    showToast(getSavedLanguage() === 'en' ? (t('languageSavedEn') || 'Language saved ✓') : (t('languageSavedPl') || 'Zapisano język ✓'));
  });

  btn.dataset.bound = 'true';
}

function applyI18n() {
  const lang = getSavedLanguage();
  const dict = I18N[lang] || I18N.pl;

  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key] != null) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    if (dict[key] != null) el.title = dict[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key] != null) el.placeholder = dict[key];
  });

  applyLanguageToUI();
}

function applyLanguageToUI() {
  const lang = getSavedLanguage();

  const navHome = document.getElementById('navHome');
  const navSettings = document.getElementById('navSettings');
  const search = document.getElementById('search');
  const languageLabel = document.getElementById('language-label');
  const languageCardTitle = document.getElementById('language-card-title');
  const languageCardNote = document.getElementById('language-card-note');

  if (navHome) navHome.title = t('library');
  if (navSettings) navSettings.title = t('settings');
  if (search) search.placeholder = t('search');
  // Przyciski akcji mają ikony SVG + wewnętrzne <span data-i18n>, więc
  // ich tekst tłumaczy applyI18n (nadpisanie textContent zjadłoby ikony).
  if (languageLabel) languageLabel.textContent = t('languageInterface');
  if (languageCardTitle) languageCardTitle.textContent = t('language');
  if (languageCardNote) languageCardNote.textContent =
    lang === 'en'
      ? 'Choose the application interface language.'
      : 'Wybierz język interfejsu aplikacji.';
}

function initLanguage() {
  if (!config.uiState) config.uiState = {};
  if (!config.uiState.language) config.uiState.language = 'pl';
  applyI18n();
}