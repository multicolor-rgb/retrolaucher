// Render półki, szczegółów gry i akcje związane z biblioteką.

let wheelNavigationLocked = false;
let wheelNavigationBound = false;
let shelfInfoAnimating = false;
let playtimeRefreshTimer = null;
let playtimeCache = {};

function getAllowedShelfViewModes() {
  return ['flat', 'arc', 'stack', 'cascade'];
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

function renderShelf() {
  shelf.innerHTML = '';
  const range = 3;
  const len = filtered.length;

  bindShelfWheelNavigation();
  bindViewModeSwitch();

  if (!viewMode || !getAllowedShelfViewModes().includes(viewMode)) {
    viewMode = getSavedShelfViewMode();
  }

  syncViewModeButtons();

  if (len === 0) {
    shelfViewport.innerHTML = `<div class="empty-state">${t('noGamesForPlatform')}</div>`;
    titleEl.textContent = '';
    platEl.textContent = '';
    if (ratingMini) ratingMini.textContent = '';
    stopPlaytimeAutoRefresh();
    return;
  }

  if (!shelf.parentElement) {
    shelfViewport.innerHTML = '';
    shelfViewport.appendChild(shelf);
  }

  shelf.className = 'shelf mode-' + viewMode;
  shelfViewport.className = 'shelf-viewport mode-' + viewMode;

  for (let offset = -range; offset <= range; offset++) {
    const idx = mod(current + offset, len);
    const g = filtered[idx];
    const el = document.createElement('div');

    el.className = 'sh-item' + (offset === 0 ? ' focus' : '');
    el.dataset.offset = offset;
    el.dataset.gameId = g.id;
    el.dataset.platform = g.platform;

    applyCoverGeometry(el, g.platform, offset === 0);

    const coverSrc = getCoverForGame(g);
    el.innerHTML = `<img src="${coverSrc}" alt="${getDisplayTitle(g)}"/>`;

    el.addEventListener('click', () => {
      if (current === idx) return;
      current = idx;
      renderShelf();
    });

    el.addEventListener('dblclick', () => launchGame(g));
    shelf.appendChild(el);
  }

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
  titleEl2.textContent = getDisplayTitle(g) || t('unknownGame');

  document.getElementById('modalTags').innerHTML =
    (g.genres || []).map(t => `<span class="tag">${t}</span>`).join('');
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

      const currentTitle = document.getElementById('modalTitle');
      if (!currentTitle || !currentTitle.parentElement) return;

      const old = document.getElementById('modalPlaytime');
      if (old) old.remove();

      const div = document.createElement('div');
      div.id = 'modalPlaytime';
      div.className = 'modal-playtime';
      div.textContent = res.formatted;

      currentTitle.insertAdjacentElement('afterend', div);
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