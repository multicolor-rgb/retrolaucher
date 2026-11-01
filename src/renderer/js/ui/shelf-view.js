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
  return ['flat', 'arc', 'stack', 'cascade', 'grid', 'detailed', 'hero', 'bigbox', 'framed'];
}

// Tryby dwupanelowe (lista + panel opisu) — mają własny builder DOM,
// podobnie jak 'grid'. bigbox/framed korzystają z generycznego carouselu.
const PANE_VIEW_MODES = ['detailed', 'hero'];

function viewModeGroup(mode) {
  if (mode === 'grid') return 'grid';
  if (PANE_VIEW_MODES.includes(mode)) return 'pane';
  return 'carousel';
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
  const vars = getAspectVars(platform?.aspect || 'standard', platform?.aspectCustom);

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

  // W grid: pozwól na natywne przewijanie kontenera, nie przełączaj gier.
  // W trybach dwupanelowych (detailed/hero) kółko scrolluje listę/opis
  // natywnie — nawigacja gier działa strzałkami/klikiem/padem.
  if (viewMode === 'grid' || PANE_VIEW_MODES.includes(viewMode)) return;

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
  const text = playtimeCache[game.id];
  if (!text || text === '0s' || text === '0m 00s') return t('noData');
  return text;
}

function getGameBackgroundImage(game) {
  return game?.fanart || getCoverForGame(game);
}

function applyGameBackground(game) {
  const cover = getCoverForGame(game);
  const background = getGameBackgroundImage(game);

  bgBlur.style.backgroundImage = `url('${background}')`;
  // Gradient liczymy z okładki — fanart bywa zbyt ciemny lub zbyt jasny.
  getDominantColor(cover, applyGradient);
}

function stopModalTrailer() {
  const video = document.getElementById('modalTrailer');
  if (!video) return;
  try { video.pause(); } catch (_) {}
}

function renderShelfSubinfo(game) {
  const metacritic = getGameMetacritic(game);
  const hltb = getGameHltb(game);
  const playtime = getGamePlaytimeText(game);

  const parts = [];

  if (playtime && playtime !== t('noData')) {
    parts.push(`${t('playtimeLabel') || 'Czas gry'}: ${playtime}`);
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
  const el = document.getElementById('modalPlaytimeValue');
  const clean = formatted && formatted !== '0s' ? formatted : '';
  if (el) {
    el.textContent = clean || formatPlaytimeMs(getGameTotalPlaytimeMs(g.id)) || t('noData');
  }

  const stats = getPlaytimeStatsEntry(g.id);
  const countEl = document.getElementById('modalPlayCount');
  if (countEl) countEl.textContent = String(stats?.plays || 0);

  const lastEl = document.getElementById('modalLastPlayed');
  if (lastEl) lastEl.textContent = formatLastPlayedDate(getGameLastPlayedAt(g.id));
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


function escapeHtmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Utnij opis do zadanej liczby znaków na granicy słowa (półka/panel).
function truncateDescription(text, maxLen) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut) + '…';
}

// ============================================================
// Tryby dwupanelowe (detailed / hero) — EmulationStation-style:
// lewa lista gier, prawa okładka + OPIS + metadane. DOM budowany raz
// (per zestaw gier), zmiana zaznaczenia = updatePaneFocusOnly().
// Zasada identyczna jak w gridzie: nie przebudowywać listy przy
// każdym przestawieniu, żeby nie gubić scrolla i nie migać.
// ============================================================

let paneLastBuildKey = null;

function paneBuildKey() {
  return filtered.map(g => g.id).join('|');
}

function destroyPaneIfStale(key) {
  if (paneLastBuildKey === key) return;
  shelf.innerHTML = '';
  paneLastBuildKey = null;
}

function buildPaneListRow(g, idx) {
  const row = document.createElement('div');
  row.className = 'pane-row';
  row.dataset.index = String(idx);
  row.dataset.gameId = g.id;
  applyCoverGeometry(row, g.platform, false);

  const coverSrc = getCoverForGame(g);
  row.innerHTML = `
    <img src="${coverSrc}" alt="" draggable="false">
    <span class="pane-row-title">${escapeHtmlText(getDisplayTitle(g))}</span>
  `;

  row.addEventListener('click', () => {
    if (current === idx) return;
    current = idx;
    updatePaneFocusOnly();
    if (typeof sfxMove === 'function') sfxMove();
  });

  row.addEventListener('dblclick', () => launchGame(g));
  return row;
}

function renderPaneShelf() {
  const key = paneBuildKey();
  destroyPaneIfStale(key);

  let listWrap = shelf.querySelector('.pane-list');
  if (!listWrap || shelf.children.length !== 2) {
    shelf.innerHTML = '';

    const detailWrap = document.createElement('div');
    detailWrap.className = 'pane-info';

    listWrap = document.createElement('div');
    listWrap.className = 'pane-list';
    filtered.forEach((g, idx) => {
      listWrap.appendChild(buildPaneListRow(g, idx));
    });

    detailWrap.innerHTML = `
      <img class="pane-cover" src="" alt="" draggable="false">
      <div class="pane-text">
        <div class="pane-plat"></div>
        <h2 class="pane-title"></h2>
        <p class="pane-desc"></p>
        <div class="pane-chips"></div>
        <div class="pane-meta"></div>
      </div>
    `;

    shelf.appendChild(listWrap);
    shelf.appendChild(detailWrap);
    paneLastBuildKey = key;
  } else {
    paneLastBuildKey = key;
  }

  updatePaneFocusOnly();
}

// Aktualizacja zaznaczenia + prawego panelu (opis, metadane) w trybach
// detailed/hero. Nie przebudowuje DOM-u — analogicznie do gridowego
// updateGridFocusOnly().
function updatePaneFocusOnly(skipScrollIntoView = false) {
  const rows = shelf.querySelectorAll('.pane-row');
  rows.forEach((el, idx) => {
    el.classList.toggle('focus', idx === current);
  });

  if (!skipScrollIntoView) {
    const focusRow = rows[current];
    focusRow?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  const g = filtered[current];
  if (!g) return;

  const pf = getPlatform(g.platform) || { label: g.platform || t('unknownPlatform'), color: '#38e0ff' };
  const infoWrap = shelf.querySelector('.pane-info');
  if (infoWrap) {
    const geometry = getAspectVars(pf.aspect || 'standard', pf.aspectCustom);
    infoWrap.style.setProperty('--cover-ratio', geometry.ratio);
    const coverEl = infoWrap.querySelector('.pane-cover');
    const coverSrc = getCoverForGame(g);
    if (coverEl && coverEl.getAttribute('src') !== coverSrc) coverEl.src = coverSrc;

    const platElp = infoWrap.querySelector('.pane-plat');
    if (platElp) {
      platElp.textContent = pf.label;
      platElp.style.background = (pf.color || '#38e0ff') + '33';
      platElp.style.color = pf.color || '#38e0ff';
    }

    const titleElp = infoWrap.querySelector('.pane-title');
    if (titleElp) titleElp.textContent = getDisplayTitle(g) || t('unknownGame');

    const descEl = infoWrap.querySelector('.pane-desc');
    if (descEl) {
      descEl.textContent = g.desc || g.description || t('noDescription');
    }

    const chipsEl = infoWrap.querySelector('.pane-chips');
    if (chipsEl) {
      const chips = [];
      if (g.year) chips.push(String(g.year));
      (g.genres || []).slice(0, 4).forEach(genre => chips.push(escapeHtmlText(genre)));
      if (g.dev) chips.push(escapeHtmlText(g.dev));
      chipsEl.innerHTML = chips
        .map(c => `<span class="pane-chip">${c}</span>`)
        .join('');
    }

    const metaEl = infoWrap.querySelector('.pane-meta');
    if (metaEl) {
      const bits = [];
      const playtime = getGamePlaytimeText(g);
      const metacritic = getGameMetacritic(g);
      const hltb = getGameHltb(g);
      const fileSize = getGameFileSize(g);

      if (playtime && playtime !== t('noData')) {
        bits.push(`<span><b>${t('playtimeLabel') || 'Czas gry'}</b> ${escapeHtmlText(playtime)}</span>`);
      }
      if (metacritic != null && metacritic !== '') {
        bits.push(`<span><b>Metacritic</b> ${metacritic}/100</span>`);
      }
      if (hltb != null && hltb !== '') {
        bits.push(`<span><b>HLTB</b> ${escapeHtmlText(formatHltb(hltb))}</span>`);
      }
      if (fileSize != null) {
        bits.push(`<span><b>${t('fileSize') || 'Waga pliku'}</b> ${escapeHtmlText(formatBytes(fileSize))}</span>`);
      }
      metaEl.innerHTML = bits.join('');
    }
  }

  // Spójność z resztą aplikacji: dolny pasek info + tło.
  titleEl.textContent = getDisplayTitle(g) || t('unknownGame');
  platEl.textContent = pf.label;
  if (ratingMini) ratingMini.textContent = renderShelfSubinfo(g);

  const activeCover = getCoverForGame(g);
  applyGameBackground(g);

  refreshCurrentGamePlaytime();
  updateFavoriteButtons();
}

// Buduje/aktualizuje shelf w trybach carousel (flat, arc, stack, cascade,
// bigbox, framed). bigbox/framed to pure-CSS warianty tej samej maszyny.
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

  // Gdy biblioteka jest mniejsza niż okno ±3, mod() powtarzałby te same
  // gry 7 razy (przy 1 grze wyglądało to jak 7 identycznych okładek).
  // Dla małych bibliotek renderujemy każdą grę tylko raz, z offsetami
  // symetrycznymi wokół 0, żeby aktualna gra była wyśrodkowana.
  const desired = [];
  if (len < range * 2 + 1) {
    const half = Math.floor((len - 1) / 2);
    const offsets = [];
    for (let o = -half; o <= half; o++) offsets.push(o);
    if (len % 2 === 0) offsets.push(half + 1);

    for (const offset of offsets) {
      desired.push({ offset, idx: mod(current + offset, len) });
    }
  } else {
    for (let offset = -range; offset <= range; offset++) {
      desired.push({ offset, idx: mod(current + offset, len) });
    }
  }

  const existing = new Map();
  shelf.querySelectorAll('.sh-item').forEach(el => {
    existing.set(el.dataset.gameId, el);
  });

  // bigbox/framed pokazują tytuł na okładce (duża typografia na dole)
  const withTitle = viewMode === 'bigbox' || viewMode === 'framed';
  const titleFor = (game) => {
    if (!withTitle) return '';
    return `<span class="sh-title">${escapeHtmlText(getDisplayTitle(game))}</span>`;
  };

  // bigbox steruje szerokością okładek wyłącznie w CSS (skala od wysokości
  // okna). Inline --cover-width z applyCoverGeometry nadpisałby CSS i
  // okładka zostałaby mała, dlatego dla tego trybu czyścimy inline var.
  const usesDynamicCoverWidth = viewMode === 'bigbox';
  const applyCarouselGeometry = (el, platform, focused) => {
    if (usesDynamicCoverWidth) {
      el.style.removeProperty('--cover-width');
      el.style.removeProperty('--cover-ratio');
      el.classList.toggle('focus', focused);
      return;
    }
    applyCoverGeometry(el, platform, focused);
  };

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
      el.innerHTML = `<img src="${coverSrc}" alt="${getDisplayTitle(g)}"/>${titleFor(g)}`;

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

      applyCarouselGeometry(el, g.platform, false);
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
    applyCarouselGeometry(el, g.platform, offset === 0);

    // Elementy są reużywane między trybami carousel — trzeba zadbać,
    // żeby etykieta tytułu (tylko bigbox/framed) nie zostawała w flat
    // ani nie znikała po powrocie do bigbox/framed.
    const titleEls = el.querySelectorAll('.sh-title');
    if (withTitle) {
      if (!titleEls.length) {
        el.insertAdjacentHTML('beforeend', `<span class="sh-title">${escapeHtmlText(getDisplayTitle(g))}</span>`);
      } else {
        titleEls.forEach(node => { node.textContent = getDisplayTitle(g); });
      }
    } else {
      titleEls.forEach(node => node.remove());
    }

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

// ============================================================
// Pigułka "Uzupełnij okładki (n)" — szybka akcja na półce dla
// aktywnej platformy (albo wszystkich przy 'all'), bez wchodzenia
// w Ustawienia → Okładki. Liczy gry bez okładki w metadanych.
// ============================================================

let coversPillBusy = false;
let coversPillBound = false;

function countMissingCovers() {
  const base = activePlatform && activePlatform !== 'all'
    ? games.filter(g => g.platform === activePlatform)
    : games;

  let missing = 0;
  base.forEach(g => {
    if (getManualCover(g.platform, g.id)) return;
    const meta = getStoredGameMeta(g.platform, g.id);
    if (!meta.cover) missing += 1;
  });

  return { total: base.length, missing };
}

function updateCoversPill() {
  const pill = document.getElementById('coversPill');
  if (!pill || coversPillBusy) return;

  const { missing } = countMissingCovers();
  if (missing <= 0) {
    pill.hidden = true;
    return;
  }

  pill.hidden = false;
  pill.disabled = false;
  pill.classList.remove('busy');
  pill.innerHTML = `${svgIcon('i-image')}<span>${t('fetchMissingCovers') || 'Uzupełnij okładki'} (${missing})</span>`;
}

function bindCoversPill() {
  const pill = document.getElementById('coversPill');
  if (!pill || coversPillBound || pill.dataset.bound === 'true') return;

  pill.addEventListener('click', async () => {
    if (coversPillBusy) return;

    const targets = activePlatform && activePlatform !== 'all'
      ? [activePlatform]
      : usedPlatforms().map(p => p.key);

    if (!targets.length) return;

    coversPillBusy = true;
    pill.classList.add('busy');
    pill.disabled = true;
    pill.innerHTML = `${svgIcon('i-refresh', 'icon--spin')}<span>${t('fetchingCovers') || 'Pobieram okładki…'}</span>`;

    let done = 0;
    const total = targets.length;

    try {
      for (const key of targets) {
        await enrichPlatformMetadata(key, false, {
          silent: true,
          onProgress: (processed, all) => {
            if (coversPillBusy) {
              pill.innerHTML = `${svgIcon('i-refresh', 'icon--spin')}<span>${key}: ${processed} / ${all}</span>`;
            }
          }
        });
        done += 1;
      }
      showToast(
        done > 1
          ? (t('coversFetchedPlatforms') || 'Uzupełniono metadane dla platform') + ` (${done}/${total})`
          : (t('coversFetchedDone') || 'Gotowe — odświeżono okładki i opisy')
      );
    } catch (e) {
      console.warn('coversPill enrich failed', e);
      showToast(t('coversFetchError') || 'Nie udało się pobrać metadanych', true);
    } finally {
      coversPillBusy = false;
      updateCoversPill();
    }
  });

  pill.dataset.bound = 'true';
  coversPillBound = true;
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
  bindCoversPill();
  updateCoversPill();
  updateFavoriteButtons();

  // shelf-info: grid dostaje własny pasek, panele ukrywają zdublowany
  // tytuł (jest już w panelu po prawej) i zostawiają same przyciski.
  const shelfInfo = document.getElementById('shelfInfo');
  if (shelfInfo) {
    shelfInfo.classList.toggle('grid-mode', viewMode === 'grid');
    shelfInfo.classList.toggle('pane-mode', PANE_VIEW_MODES.includes(viewMode));
  }

  if (len === 0) {
    const emptyMessage =
      (config.uiState?.librarySort || 'default') === 'favorites'
        ? t('noFavoriteGames')
        : t('noGamesForPlatform');
    shelfViewport.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
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

  const modeGroup = viewModeGroup(viewMode);
  const lastGroup = lastBuiltShelfMode ? viewModeGroup(lastBuiltShelfMode) : null;
  if (lastGroup !== null && lastGroup !== modeGroup) {
    shelf.innerHTML = '';
    paneLastBuildKey = null;
    invalidateGridColsCache();
  }

  shelf.className = 'shelf mode-' + viewMode;
  shelf.dataset.mode = viewMode;
  shelfViewport.className = 'shelf-viewport mode-' + viewMode;

  // Ramka/tło w trybie framed — kolor akcentu aktywnej platformy.
  const stageEl = shelfViewport.closest('.shelf-stage');
  if (stageEl) {
    stageEl.classList.toggle('framed-bg', viewMode === 'framed');
  }

  // Panele dwukolumnowe (detailed/hero): własny builder + update focusu
  if (PANE_VIEW_MODES.includes(viewMode)) {
    renderPaneShelf();

    const g = filtered[current];
    const pf = getPlatform(g.platform) || { label: g.platform || t('unknownPlatform') };

    if (stageEl && pf.color) {
      stageEl.style.setProperty('--stage-accent', pf.color);
    }

    animateShelfInfoChange();
    refreshCurrentGamePlaytime();
    startPlaytimeAutoRefresh();
    lastBuiltShelfMode = viewMode;
    return;
  }

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
    applyGameBackground(g);

    refreshCurrentGamePlaytime();
    startPlaytimeAutoRefresh();
    lastBuiltShelfMode = viewMode;
    return;
  }

  renderCarouselShelf();

  const g = filtered[current];
  const pf = getPlatform(g.platform) || { label: g.platform || t('unknownPlatform') };

  if (stageEl && pf.color) {
    stageEl.style.setProperty('--stage-accent', pf.color);
  }

  titleEl.textContent = getDisplayTitle(g) || t('unknownGame');
  platEl.textContent = pf.label;

  if (ratingMini) {
    ratingMini.textContent = renderShelfSubinfo(g);
  }

  animateShelfInfoChange();

  const activeCover = getCoverForGame(g);
  applyGameBackground(g);

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
  applyGameBackground(g);

  refreshCurrentGamePlaytime();
  updateFavoriteButtons();
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

// ============================================================
// Ulubione, losowa gra, szybki skok po literze i tryb atrakcji
// ============================================================

function getFocusedGameForFavorites() {
  if (overlay?.classList?.contains('open') && overlay.currentGame) {
    return overlay.currentGame;
  }
  return filtered[current] || null;
}

function updateFavoriteButtons() {
  const game = getFocusedGameForFavorites();
  const active = !!game && isGameFavorite(game.id);
  const label = active ? t('favoriteRemove') : t('favoriteAdd');

  ['favoriteBtn', 'modalFavoriteBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('is-active', active);
    btn.title = label;
    btn.setAttribute('aria-label', label);
  });
}

async function toggleFavoriteForGame(game) {
  if (!game?.id) return;

  const next = toggleGameFavorite(game.id);
  await saveStoredConfig();

  // Gdy aktywne jest sortowanie „Ulubione”, lista musi się przefiltrować.
  if ((config.uiState?.librarySort || 'default') === 'favorites') {
    reapplyLibraryOrdering();
  } else {
    updateFavoriteButtons();
  }

  showToast(next ? t('favoriteAdded') : t('favoriteRemoved'));
}

function randomGame() {
  if (!filtered.length) {
    showToast(t('randomGameEmpty'), true);
    return;
  }

  if (filtered.length > 1) {
    let idx = current;
    while (idx === current) idx = Math.floor(Math.random() * filtered.length);
    current = idx;
  }

  renderShelf();
  openDetails(filtered[current]);
  showToast(t('randomGameToast') + getDisplayTitle(filtered[current]));
}

function jumpToLetter(char) {
  if (!filtered.length || !char) return false;

  const lang = getSavedLanguage();
  const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase(lang);

  const needle = normalize(char);

  for (let step = 1; step <= filtered.length; step++) {
    const idx = mod(current + step, filtered.length);
    if (normalize(getDisplayTitle(filtered[idx])).startsWith(needle)) {
      current = idx;
      renderShelf();
      return true;
    }
  }

  return false;
}

// Tryb atrakcji: po bezczynności półka sama przewija gry (wygaszacz).
const ATTRACT_IDLE_MS = 120000;
const ATTRACT_STEP_MS = 7000;
let attractWatchTimer = null;
let attractStepTimer = null;
let lastUserActivityAt = Date.now();

function noteUserActivity() {
  lastUserActivityAt = Date.now();
  if (document.body.classList.contains('attract-mode')) stopAttractMode();
}

function isAttractBlocked() {
  return !config.uiState?.attractMode
    || (settingsPanel && !settingsPanel.hidden)
    || overlay?.classList?.contains('open');
}

function startAttractMode() {
  if (document.body.classList.contains('attract-mode')) return;

  document.body.classList.add('attract-mode');
  showToast(t('attractHint'));

  attractStepTimer = setInterval(() => {
    if (isAttractBlocked() || filtered.length < 2) {
      stopAttractMode();
      return;
    }
    next();
  }, ATTRACT_STEP_MS);
}

function stopAttractMode() {
  document.body.classList.remove('attract-mode');
  if (attractStepTimer) {
    clearInterval(attractStepTimer);
    attractStepTimer = null;
  }
}

function initAttractMode() {
  stopAttractMode();

  if (attractWatchTimer) clearInterval(attractWatchTimer);
  attractWatchTimer = setInterval(() => {
    if (isAttractBlocked()) return;
    if (Date.now() - lastUserActivityAt >= ATTRACT_IDLE_MS) startAttractMode();
  }, 5000);
}

['keydown', 'pointerdown', 'wheel'].forEach(evt => {
  window.addEventListener(evt, noteUserActivity, { passive: true });
});

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
  const platform = getPlatform(game.platform);
  const rawArgs = config.launchArgs[game.platform] || '';
  // Argumenty per gra dokładamy po platformowych — emulator stosuje
  // ostatnią wartość danego przełącznika, więc gra może nadpisać platformę.
  const perGameArgs = config.gameArgs?.[game.id] || '';
  const extraArgs = [
    ...parseArgString(rawArgs),
    ...parseArgString(perGameArgs)
  ];

  if (platform?.kind === 'pc') {
    if (!validatePathExists(game.rom)) {
      showToast(t('missingGamePath'), true);
      return;
    }

    if (window.launcherAPI?.launchPcGame) {
      const isWindowsHost = /^Win/i.test(navigator.platform || '');
      const selectedRunner = platform.pcRunner || 'native';
      if (!isWindowsHost && /\.exe$/i.test(game.rom) && selectedRunner === 'native') {
        showToast(t('pcExeNeedsRunner') || 'Plik .exe na Linuksie wymaga runnera Wine lub Proton.', true);
        return;
      }

      const result = await window.launcherAPI.launchPcGame({
        gameId: game.id,
        gamePath: game.rom,
        platform: {
          pcRunner: platform.pcRunner || 'native',
          pcPrefix: platform.pcPrefix || '',
          pcEnv: platform.pcEnv || '',
          pcRunnerPath: platform.pcRunnerPath || ''
        },
        override: config.pcGameSettings?.[game.id] || {},
        extraArgs
      });

      if (!result.ok) showToast(t('errorLaunch') + result.error, true);
      else showToast(t('launchGamePrefix') + getDisplayTitle(game));
    } else {
      showToast(t('demoLaunch') + getDisplayTitle(game));
    }
    return;
  }

  const emulatorPath = config.emulators[game.platform] || '';

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

  const modalCover = document.getElementById('modalCoverImg');
  const modalCoverSrc = getCoverForGame(g);
  modalCover.src = modalCoverSrc;
  modalCover.classList.toggle('is-placeholder', modalCoverSrc.includes('cover-placeholder.svg'));

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
    // Tekst tłumaczy <span data-i18n> (applyI18n) — nie nadpisujemy
    // textContent, bo zjadłoby to ikonę ołówka.
    renameButton.onclick = () => openRenameInline(g);
  }

  document.getElementById('modalTags').innerHTML =
    (g.genres || []).map(tag => `<span class="tag">${tag}</span>`).join('');

  document.getElementById('modalDesc').textContent =
    g.desc || g.description || t('noDescription');

  // Trailer ze ScreenScraper — odtwarzacz pojawia się tylko, gdy znamy URL.
  const trailerWrap = document.getElementById('modalTrailerWrap');
  const trailerVideo = document.getElementById('modalTrailer');
  if (trailerWrap && trailerVideo) {
    if (g.trailer) {
      trailerWrap.hidden = false;
      if (trailerVideo.getAttribute('src') !== g.trailer) {
        trailerVideo.pause?.();
        trailerVideo.setAttribute('src', g.trailer);
      }
    } else {
      trailerWrap.hidden = true;
      try { trailerVideo.pause(); } catch (_) {}
      trailerVideo.removeAttribute('src');
      trailerVideo.load?.();
    }
  }

  document.getElementById('modalFileSize').textContent = formatBytes(fileSize);
  document.getElementById('modalLocation').textContent = location;

  document.getElementById('modalMetacritic').textContent =
    metacritic != null && metacritic !== ''
      ? `${metacritic}/100`
      : t('noData');

  document.getElementById('modalHltb').textContent = formatHltb(hltb);

  // Statystyki z pliku playtime: czas gry, liczba uruchomień, ostatnia gra.
  const stats = getPlaytimeStatsEntry(g.id);
  const totalMs = getGameTotalPlaytimeMs(g.id);
  const playtimeValue = document.getElementById('modalPlaytimeValue');
  if (playtimeValue) {
    playtimeValue.textContent = totalMs > 0 ? formatPlaytimeMs(totalMs) : t('noData');
  }
  const playCount = document.getElementById('modalPlayCount');
  if (playCount) playCount.textContent = String(stats?.plays || 0);
  const lastPlayed = document.getElementById('modalLastPlayed');
  if (lastPlayed) lastPlayed.textContent = formatLastPlayedDate(getGameLastPlayedAt(g.id));

  const argsInput = document.getElementById('modalGameArgs');
  if (argsInput) argsInput.value = config.gameArgs?.[g.id] || '';

  const platformInfo = getPlatform(g.platform);
  const pcSettingsRow = document.getElementById('modalPcSettings');
  if (pcSettingsRow) pcSettingsRow.hidden = platformInfo?.kind !== 'pc';

  if (platformInfo?.kind === 'pc') {
    const override = config.pcGameSettings?.[g.id] || {};
    const runnerSel = document.getElementById('modalPcRunner');
    if (runnerSel) runnerSel.value = override.runner || '';
    const prefixInput = document.getElementById('modalPcPrefix');
    if (prefixInput) prefixInput.value = override.prefix || '';
    const envInput = document.getElementById('modalPcEnv');
    if (envInput) envInput.value = override.env || '';
  }

  updateFavoriteButtons();

  overlay.classList.add('open');
  overlay.currentGame = g;
}

if (window.launcherAPI?.onWindowFocus) {
  window.launcherAPI.onWindowFocus(() => {
    loadPlaytimeStats({ force: true });
    refreshCurrentGamePlaytime();
    renderShelf();
  });
}
