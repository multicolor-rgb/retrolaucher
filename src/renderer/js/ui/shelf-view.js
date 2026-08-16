// Render półki, szczegółów gry i akcje związane z biblioteką.

let wheelNavigationLocked = false;
let wheelNavigationBound = false;
let shelfInfoAnimating = false;
let playtimeRefreshTimer = null;
let playtimeCache = {};

let gridColsCache = 0;
let gridColsCacheTime = 0;

// Pamięta ostatni tryb, w jakim faktycznie zbudowano DOM shelfa — potrzebne,
// żeby wykryć przełączenie grid <-> carousel i wyczyścić stare elementy
// (inaczej reużycie po data-gameId miesza elementy z różnych layoutów i
// "psuje stylowanie": stare inline style / klasy z gridu zostają na
// elementach renderowanych teraz jako carousel, albo odwrotnie).
let lastBuiltShelfMode = null;

function getAllowedShelfViewModes() {
  return ['flat', 'arc', 'stack', 'cascade', 'grid'];
}

function getSavedShelfViewMode() {
  const saved = config?.uiState?.shelfViewMode;
  return getAllowedShelfViewModes().includes(saved) ? saved : 'flat';
}

function syncViewModeButtons() {
  const switcher = document.getElementById('viewModeSwitch');
  if (!switcher) return;

  switcher.querySelectorAll('.vm-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === viewMode);
  });
}

async function setShelfViewMode(mode) {
  if (!getAllowedShelfViewModes().includes(mode)) return;
  if (viewMode === mode) return;

  viewMode = mode;

  if (!config.uiState || typeof config.uiState !== 'object') {
    config.uiState = {};
  }

  config.uiState.shelfViewMode = mode;
  syncViewModeButtons();
  renderShelf();
  await saveStoredConfig();
}

function bindViewModeSwitch() {
  const switcher = document.getElementById('viewModeSwitch');
  if (!switcher || switcher.dataset.bound === 'true') return;

  switcher.querySelectorAll('.vm-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mode = btn.dataset.mode;
      await setShelfViewMode(mode);
    });
  });

  switcher.dataset.bound = 'true';
}

function animateShelfInfoChange() {
  const shelfInfo = document.getElementById('shelfInfo');
  if (!shelfInfo || shelfInfoAnimating) return;

  shelfInfoAnimating = true;
  shelfInfo.classList.remove('shelf-info-swap');
  void shelfInfo.offsetWidth;
  shelfInfo.classList.add('shelf-info-swap');

  setTimeout(() => {
    shelfInfo.classList.remove('shelf-info-swap');
    shelfInfoAnimating = false;
  }, 320);
}

function applyCoverGeometry(el, platformKey, focused = false) {
  const platform = getPlatform(platformKey);
  const vars = getAspectVars(platform?.aspect || 'standard');

  el.style.setProperty('--cover-width', `${vars.width || 180}px`);
  el.style.setProperty('--cover-ratio', vars.ratio || '0.70 / 1');

  if (focused) el.classList.add('focus');
  else el.classList.remove('focus');
}

function bindGridScrollSync() {
  if (!shelfViewport || shelfViewport.dataset.scrollSyncBound === 'true') return;

  let scrollTimer = null;
  shelfViewport.addEventListener('scroll', () => {
    if (viewMode !== 'grid') return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const items = shelf.querySelectorAll('.sh-item');
      if (!items.length) return;

      const viewportRect = shelfViewport.getBoundingClientRect();
      const viewportCenter = viewportRect.top + viewportRect.height / 2;

      let closestIdx = current;
      let closestDist = Infinity;

      items.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const dist = Math.abs(elCenter - viewportCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = idx;
        }
      });

      if (closestIdx !== current) {
        current = closestIdx;
        updateGridFocusOnly(true);
      }
    }, 120);
  }, { passive: true });

  shelfViewport.dataset.scrollSyncBound = 'true';
}

function bindShelfWheelNavigation() {
  if (wheelNavigationBound) return;
  if (!shelfViewport) return;

  shelfViewport.addEventListener('wheel', onShelfWheel, { passive: false });
  wheelNavigationBound = true;
}

function onShelfWheel(e) {
  if (!filtered.length) return;
  if (overlay?.classList?.contains('open')) return;
  if (settingsPanel && !settingsPanel.hidden) return;

  // W grid: pozwól na natywne przewijanie kontenera, nie przełączaj gier
  if (viewMode === 'grid') return;

  const absY = Math.abs(e.deltaY);
  const absX = Math.abs(e.deltaX);

  if (absY < 10 && absX < 10) return;

  e.preventDefault();

  if (wheelNavigationLocked) return;
  wheelNavigationLocked = true;

  const primaryDelta = absY >= absX ? e.deltaY : e.deltaX;

  if (primaryDelta > 0) next();
  else if (primaryDelta < 0) prev();

  setTimeout(() => {
    wheelNavigationLocked = false;
  }, 220);
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return t('noData');

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  const formatted = value / Math.pow(1024, index);
  const decimals = formatted >= 100 ? 0 : formatted >= 10 ? 1 : 2;

  return `${formatted.toFixed(decimals)} ${units[index]}`;
}

function formatHltb(value) {
  if (value == null || value === '') return t('noData');

  const hours = Number(value);
  if (!Number.isFinite(hours) || hours <= 0) return String(value);

  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)} h`;
}

function getGameLocation(game) {
  return game.location || game.rom || game.path || game.filePath || t('noData');
}

function getGameFileSize(game) {
  return game.fileSize ?? game.sizeBytes ?? game.bytes ?? game.size ?? null;
}

function getGameMetacritic(game) {
  return game.metacritic ?? game.metaScore ?? game.metacriticScore ?? null;
}

function getGameHltb(game) {
  if (game.hltb && typeof game.hltb === 'object') {
    return game.hltb.main ?? game.hltb.story ?? game.hltb.mainStory ?? null;
  }
  return game.hltb ?? game.hltbMain ?? game.hltbHours ?? null;
}

function getGamePlaytimeText(game) {
  if (!game?.id) return t('noData');
  return playtimeCache[game.id] || t('noData');
}

function renderShelfSubinfo(game) {
  const metacritic = getGameMetacritic(game);
  const hltb = getGameHltb(game);
  const playtime = getGamePlaytimeText(game);

  const parts = [];

  if (playtime && playtime !== t('noData')) {
    parts.push(`Czas gry: ${playtime}`);
  }

  if (metacritic != null && metacritic !== '') {
    parts.push(`Metacritic: ${metacritic}/100`);
  }

  if (hltb != null && hltb !== '') {
    parts.push(`HLTB: ${formatHltb(hltb)}`);
  }

  return parts.join(' • ');
}

async function refreshCurrentGamePlaytime() {
  const g = filtered[current];
  if (!g || !g.id || !window.launcherAPI?.getPlaytime) return;

  try {
    const res = await window.launcherAPI.getPlaytime(g.id);
    if (!res || !res.ok) return;

    playtimeCache[g.id] = res.formatted;

    const active = filtered[current];
    if (active && active.id === g.id) {
      const mini = document.getElementById('ratingMini');
      if (mini) mini.textContent = renderShelfSubinfo(active);

      if (overlay?.classList?.contains('open') && overlay.currentGame?.id === g.id) {
        updateGameDetailsPlaytime(active, res.formatted);
      }
    }
  } catch (_) {}
}

function startPlaytimeAutoRefresh() {
  stopPlaytimeAutoRefresh();
  playtimeRefreshTimer = setInterval(refreshCurrentGamePlaytime, 5000);
}

function stopPlaytimeAutoRefresh() {
  if (playtimeRefreshTimer) {
    clearInterval(playtimeRefreshTimer);
    playtimeRefreshTimer = null;
  }
}

function updateGameDetailsPlaytime(g, formatted) {
  const el = document.getElementById('modalPlaytime');
  if (el) el.textContent = formatted || playtimeCache[g.id] || t('noData');
}


//zmiana nazwy

// Zmiana nazwy gry

async function renameGame(game) {
  openRenameInline(game);
}

function openRenameInline(game) {
  const row = document.getElementById('renameGameRow');
  const input = document.getElementById('renameGameInput');
  const saveBtn = document.getElementById('renameGameSave');
  const cancelBtn = document.getElementById('renameGameCancel');

  if (!row || !input || !saveBtn || !cancelBtn) return;

  row.hidden = false;
  input.value = getDisplayTitle(game);
  input.focus();
  input.select();

  const cleanup = () => {
    row.hidden = true;
    saveBtn.onclick = null;
    cancelBtn.onclick = null;
    input.onkeydown = null;
  };

  saveBtn.onclick = async () => {
    await renameGameCore(game, input.value.trim(), cleanup);
  };

  cancelBtn.onclick = cleanup;

  input.onkeydown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await renameGameCore(game, input.value.trim(), cleanup);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
    }
  };
}

async function renameGameCore(game, newTitle, onDone) {
  if (!game?.id) return;

  if (!newTitle) {
    showToast(t('gameNameEmpty'), true);
    return;
  }

  if (!config.uiState || typeof config.uiState !== 'object') {
    config.uiState = {};
  }

  if (
    !config.uiState.gameTitles ||
    typeof config.uiState.gameTitles !== 'object' ||
    Array.isArray(config.uiState.gameTitles)
  ) {
    config.uiState.gameTitles = {};
  }

  const originalTitle = String(
    game.title || game.displayTitle || game.name || t('unknownGame')
  ).trim();

  if (newTitle === originalTitle) {
    delete config.uiState.gameTitles[game.id];
  } else {
    config.uiState.gameTitles[game.id] = newTitle;
  }

  await saveStoredConfig();

  if (typeof renderShelf === 'function') renderShelf();

  if (
    typeof overlay !== 'undefined' &&
    overlay?.classList?.contains('open') &&
    overlay.currentGame?.id === game.id
  ) {
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = getDisplayTitle(game);
  }

  showToast(t('gameRenamed'));

  if (typeof onDone === 'function') onDone();
}

//koniec zmiany nazwy


// Buduje/aktualizuje shelf w trybach carousel (flat, arc, stack, cascade).
//
// POPRAWKA: dwa realne problemy, które psuły stylowanie i wyglądały jak
// "przeskakiwanie":
//
// 1) Mieszanie elementów między trybami — jeśli poprzedni render był w
//    'grid' (inne klasy/atrybuty na .sh-item) a teraz wchodzimy w carousel,
//    trzeba wyczyścić shelf od zera, inaczej reużycie po data-gameId łapie
//    elementy ze starym stylem/inline atrybutami z innego layoutu.
//
// 2) Nowe elementy wchodzące na krawędzi zakresu (offset ±3) nie miały
//    ustawionej pozycji startowej przed wejściem do DOM — dostawały od
//    razu finalny --offset, więc nie było z czego animować. Teraz nowy
//    element startuje z offsetu "za krawędzią" i w następnej klatce
//    dostaje docelowy --offset, więc transition ma z czego animować wjazd.
function renderCarouselShelf() {
  const len = filtered.length;
  const range = 3;

  const desired = [];
  for (let offset = -range; offset <= range; offset++) {
    desired.push({ offset, idx: mod(current + offset, len) });
  }

  const existing = new Map();
  shelf.querySelectorAll('.sh-item').forEach(el => {
    existing.set(el.dataset.gameId, el);
  });

  const usedIds = new Set();
  const newlyCreated = [];
  let anchor = null;

  desired.forEach(({ offset, idx }) => {
    const g = filtered[idx];
    const gameId = String(g.id);
    let el = existing.get(gameId);
    const isNew = !el;

    if (isNew) {
      el = document.createElement('div');
      el.className = 'sh-item';
      el.dataset.gameId = gameId;

      const coverSrc = getCoverForGame(g);
      el.innerHTML = `<img src="${coverSrc}" alt="${getDisplayTitle(g)}"/>`;

      el.addEventListener('click', () => {
        const liveIdx = filtered.indexOf(g);
        if (liveIdx === -1 || current === liveIdx) return;
        current = liveIdx;
        renderShelf();
      });

      el.addEventListener('dblclick', () => launchGame(g));

      const startOffset = offset === 0 ? offset : offset + Math.sign(offset);
      el.dataset.offset = startOffset;
      el.style.setProperty('--offset', startOffset);
      el.style.transition = 'none';

      applyCoverGeometry(el, g.platform, false);
      newlyCreated.push(el);
    }

    // Re-insercja: kolejność DOM musi odpowiadać logicznemu offsetowi,
    // żeby flex + justify-content:center centrowało poprawny element
    // w trybie flat. To nie przerywa animacji w arc/stack/cascade, bo
    // sama pozycja jest tam sterowana przez --offset/transform, nie
    // przez kolejność DOM.
    if (anchor) {
      anchor.insertAdjacentElement('afterend', el);
    } else {
      shelf.insertBefore(el, shelf.firstChild);
    }
    anchor = el;

    el.dataset.platform = g.platform;
    el.classList.toggle('focus', offset === 0);
    applyCoverGeometry(el, g.platform, offset === 0);

    usedIds.add(gameId);

    if (!isNew) {
      el.dataset.offset = offset;
      el.style.setProperty('--offset', offset);
    } else {
      el._pendingOffset = offset;
    }
  });

  existing.forEach((el, gameId) => {
    if (!usedIds.has(gameId)) el.remove();
  });

  if (newlyCreated.length) {
    void shelf.offsetWidth;

    requestAnimationFrame(() => {
      newlyCreated.forEach(el => {
        el.style.transition = '';
        const target = el._pendingOffset;
        if (target !== undefined) {
          el.dataset.offset = target;
          el.style.setProperty('--offset', target);
          delete el._pendingOffset;
        }
      });
    });
  }
}

function renderShelf() {
  const len = filtered.length;

  bindShelfWheelNavigation();
  bindViewModeSwitch();
  bindGridScrollSync();

  if (!viewMode || !getAllowedShelfViewModes().includes(viewMode)) {
    viewMode = getSavedShelfViewMode();
  }

  syncViewModeButtons();

  // Dodaj klasę grid-mode na shelf-info, jeśli tryb grid
  const shelfInfo = document.getElementById('shelfInfo');
  if (shelfInfo) {
    shelfInfo.classList.toggle('grid-mode', viewMode === 'grid');
  }

  if (len === 0) {
    shelfViewport.innerHTML = `<div class="empty-state">${t('noGamesForPlatform')}</div>`;
    titleEl.textContent = '';
    platEl.textContent = '';
    if (ratingMini) ratingMini.textContent = '';
    stopPlaytimeAutoRefresh();
    lastBuiltShelfMode = null;
    return;
  }

  if (!shelf.parentElement) {
    shelfViewport.innerHTML = '';
    shelfViewport.appendChild(shelf);
  }

  const modeGroup = viewMode === 'grid' ? 'grid' : 'carousel';
  const lastGroup = lastBuiltShelfMode === 'grid' ? 'grid' : (lastBuiltShelfMode ? 'carousel' : null);
  if (lastGroup !== null && lastGroup !== modeGroup) {
    shelf.innerHTML = '';
    invalidateGridColsCache();
  }

  shelf.className = 'shelf mode-' + viewMode;
  shelf.dataset.mode = viewMode;
  shelfViewport.className = 'shelf-viewport mode-' + viewMode;

  // Grid: aktualizuj tylko focus, nie buduj od nowa całej listy
  if (viewMode === 'grid') {
    if (shelf.children.length !== len) {
      shelf.innerHTML = '';
      filtered.forEach((g, idx) => {
        const el = document.createElement('div');
        el.className = 'sh-item' + (idx === current ? ' focus' : '');
        el.dataset.index = idx;
        el.dataset.gameId = g.id;
        el.dataset.platform = g.platform;

        applyCoverGeometry(el, g.platform, idx === current);

        const coverSrc = getCoverForGame(g);
        el.innerHTML = `<img src="${coverSrc}" alt="${getDisplayTitle(g)}"/>`;

        el.addEventListener('click', () => {
          if (current === idx) return;
          current = idx;
          updateGridFocusOnly();
        });

        el.addEventListener('dblclick', () => launchGame(g));
        shelf.appendChild(el);
      });
      invalidateGridColsCache();
    } else {
      updateGridFocusOnly();
    }

    const g = filtered[current];
    const pf = getPlatform(g.platform) || { label: g.platform || t('unknownPlatform') };
    titleEl.textContent = getDisplayTitle(g) || t('unknownGame');
    platEl.textContent = pf.label;

    if (ratingMini) {
      ratingMini.textContent = renderShelfSubinfo(g);
    }

    const activeCover = getCoverForGame(g);
    bgBlur.style.backgroundImage = `url('${activeCover}')`;
    getDominantColor(activeCover, applyGradient);

    refreshCurrentGamePlaytime();
    startPlaytimeAutoRefresh();
    lastBuiltShelfMode = viewMode;
    return;
  }

  renderCarouselShelf();

  const g = filtered[current];
  const pf = getPlatform(g.platform) || { label: g.platform || t('unknownPlatform') };

  titleEl.textContent = getDisplayTitle(g) || t('unknownGame');
  platEl.textContent = pf.label;

  if (ratingMini) {
    ratingMini.textContent = renderShelfSubinfo(g);
  }

  animateShelfInfoChange();

  const activeCover = getCoverForGame(g);
  bgBlur.style.backgroundImage = `url('${activeCover}')`;
  getDominantColor(activeCover, applyGradient);

  refreshCurrentGamePlaytime();
  startPlaytimeAutoRefresh();
  lastBuiltShelfMode = viewMode;
}


function updateGridFocusOnly(skipScrollIntoView = false) {
  const items = shelf.querySelectorAll('.sh-item');
  items.forEach((el, idx) => {
    el.classList.toggle('focus', idx === current);
  });

  if (!skipScrollIntoView) {
    const focusEl = items[current];
    if (focusEl) {
      focusEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  const g = filtered[current];
  const pf = getPlatform(g.platform) || { label: g.platform || t('unknownPlatform') };
  titleEl.textContent = getDisplayTitle(g) || t('unknownGame');
  platEl.textContent = pf.label;

  if (ratingMini) {
    ratingMini.textContent = renderShelfSubinfo(g);
  }

  const activeCover = getCoverForGame(g);
  bgBlur.style.backgroundImage = `url('${activeCover}')`;
  getDominantColor(activeCover, applyGradient);

  refreshCurrentGamePlaytime();
}


function next() {
  if (filtered.length) {
    current = mod(current + 1, filtered.length);
    renderShelf();
    if (typeof sfxMove === 'function') sfxMove();
  }
}

function prev() {
  if (filtered.length) {
    current = mod(current - 1, filtered.length);
    renderShelf();
    if (typeof sfxMove === 'function') sfxMove();
  }
}

// ============================================================
// Pomocnicze funkcje nawigacji w widoku grid (góra/dół/lewo/prawo).
// UWAGA: to jest TYLKO logika przesunięcia zaznaczenia — nie ma tu
// żadnego bindowania klawiatury/gamepada. Klawiatura jest obsługiwana
// wyłącznie w audio-input.js (window.addEventListener('keydown', ...)),
// gamepad wyłącznie w audio-input.js (gamepadLoop/handleLibraryGamepad).
// Duplikowanie tych nasłuchów tutaj powodowało podwójne wywołanie
// next()/prev()/moveGridSelection() na jedno naciśnięcie — przeskok o 2
// pozycje zamiast o 1. NIE dodawać tu drugiego bindShelfKeyboardNavigation()
// ani startGamepadNavLoop().
// ============================================================

function getGridColumnCount() {
  const now = performance.now();
  if (gridColsCache && now - gridColsCacheTime < 250) return gridColsCache;

  const items = shelf.querySelectorAll('.sh-item');
  if (items.length < 2) {
    gridColsCache = items.length || 1;
    gridColsCacheTime = now;
    return gridColsCache;
  }

  const firstTop = items[0].offsetTop;
  let cols = 1;

  for (let i = 1; i < items.length; i++) {
    if (items[i].offsetTop !== firstTop) break;
    cols++;
  }

  gridColsCache = cols;
  gridColsCacheTime = now;
  return cols;
}

function invalidateGridColsCache() {
  gridColsCache = 0;
  gridColsCacheTime = 0;
}

function moveGridSelection(dx, dy) {
  const len = filtered.length;
  if (!len) return;

  const cols = getGridColumnCount();
  let nextIdx = current;

  if (dx !== 0) {
    nextIdx = current + dx;
    if (nextIdx < 0) nextIdx = len - 1;
    else if (nextIdx >= len) nextIdx = 0;
  } else if (dy !== 0) {
    const candidate = current + dy * cols;
    if (candidate < 0 || candidate >= len) return;
    nextIdx = candidate;
  }

  if (nextIdx === current) return;

  current = nextIdx;
  updateGridFocusOnly();
  if (typeof sfxMove === 'function') sfxMove();
}

window.addEventListener('resize', invalidateGridColsCache);

function showToast(msg, isError) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.style.borderColor = isError ? '#ff5c5c' : '#38e0ff';
  toast.style.color = isError ? '#ff5c5c' : '#38e0ff';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

async function launchGame(game) {
  const emulatorPath = config.emulators[game.platform] || '';
  const rawArgs = config.launchArgs[game.platform] || '';
  const extraArgs = parseArgString(rawArgs);

  if (!validatePathExists(emulatorPath)) {
    showToast(t('missingEmulatorCommand'), true);
    return;
  }

  if (!validatePathExists(game.rom)) {
    showToast(t('missingGamePath'), true);
    return;
  }

  if (/flatpak run/.test(emulatorPath) && /^\/media\//.test(game.rom)) {
    showToast(t('flatpakMediaHint'), true);
  }

  if (window.launcherAPI?.launchGame) {
    const result = await window.launcherAPI.launchGame({
      gameId: game.id,
      emulatorPath,
      romPath: game.rom,
      extraArgs
    });

    if (!result.ok) showToast(t('errorLaunch') + result.error, true);
    else showToast(t('launchGamePrefix') + getDisplayTitle(game));
  } else {
    showToast(t('demoLaunch') + getDisplayTitle(game));
  }
}

function openDetails(g) {
  const pf = getPlatform(g.platform) || {
    label: g.platform || t('unknownPlatform'),
    color: '#38e0ff'
  };

  const metacritic = getGameMetacritic(g);
  const hltb = getGameHltb(g);
  const fileSize = getGameFileSize(g);
  const location = getGameLocation(g);

  document.getElementById('modalCoverImg').src = getCoverForGame(g);

  const platEl2 = document.getElementById('modalPlatform');
  platEl2.textContent = pf.label;
  platEl2.style.background = pf.color + '33';
  platEl2.style.color = pf.color;

  const titleEl2 = document.getElementById('modalTitle');
  if (titleEl2) {
    titleEl2.textContent = getDisplayTitle(g);
  }

  const renameRow = document.getElementById('renameGameRow');
  if (renameRow) {
    renameRow.hidden = true;
  }

  const renameButton = document.getElementById('renameGameButton');
  if (renameButton) {
    renameButton.textContent = t('renameGame');
    renameButton.onclick = () => openRenameInline(g);
  }

  document.getElementById('modalTags').innerHTML =
    (g.genres || []).map(tag => `<span class="tag">${tag}</span>`).join('');

  document.getElementById('modalDesc').textContent =
    g.desc || g.description || t('noDescription');

  document.getElementById('modalFileSize').textContent = formatBytes(fileSize);
  document.getElementById('modalLocation').textContent = location;

  document.getElementById('modalMetacritic').textContent =
    metacritic != null && metacritic !== ''
      ? `${metacritic}/100`
      : t('noData');

  document.getElementById('modalHltb').textContent = formatHltb(hltb);

  const existingPlaytime = document.getElementById('modalPlaytime');
  if (existingPlaytime) existingPlaytime.remove();

  if (window.launcherAPI?.getPlaytime) {
    window.launcherAPI.getPlaytime(g.id).then(res => {
      if (!res?.ok) return;
      if (!res.totalMs || res.totalMs <= 0) return;

      const titleRow = document.getElementById('modalTitleRow');
      if (!titleRow || !titleRow.parentElement) return;

      const old = document.getElementById('modalPlaytime');
      if (old) old.remove();

      const div = document.createElement('div');
      div.id = 'modalPlaytime';
      div.className = 'modal-playtime';
      div.textContent = res.formatted;

      titleRow.insertAdjacentElement('afterend', div);
    }).catch(() => {});
  }

  overlay.classList.add('open');
  overlay.currentGame = g;
}

if (window.launcherAPI?.onWindowFocus) {
  window.launcherAPI.onWindowFocus(() => {
    refreshCurrentGamePlaytime();
    renderShelf();
  });
}
