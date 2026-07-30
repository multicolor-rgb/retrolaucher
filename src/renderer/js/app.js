// Plik zbiorczy zachowany dla wygody debugowania.
// Ładuj osobne pliki z index.html, a ten traktuj pomocniczo.
const games = [];


let config = {
  platforms: [
    { key: 'psp', label: 'PlayStation Portable', color: '#ffb450', icon: '🎮', extensions: ['.iso', '.cso', '.pbp','.chd'], aspect: 'psp' },
    { key: 'ps2', label: 'PlayStation 2', color: '#64b4ff', icon: '🔒️', extensions: ['.iso', '.bin'], aspect: 'standard' },
    { key: 'psx', label: 'PlayStation (PSX)', color: '#c88cff', icon: '💕', extensions: ['.bin', '.cue', '.img'], aspect: 'standard' },
    { key: 'ps3', label: 'PlayStation 3', color: '#78ffb4', icon: '📀', extensions: ['.iso', '.pkg'], aspect: 'wide' },
    { key: 'snes', label: 'Super Nintendo', color: '#ff8ca8', icon: '🔥', extensions: ['.sfc', '.smc'], aspect: 'square' },
    { key: 'nds', label: 'Nintendo DS', color: '#8cffe0', icon: '📱', extensions: ['.nds'], aspect: 'psp' },
    { key: 'xbox360', label: 'Xbox 360', color: '#9dff8c', icon: '❎', extensions: ['.iso', '.xex'], aspect: 'standard' }
  ],
  romFolders: {},
  emulators: {},
  launchArgs: {},
  metadata: {},
  manualCovers: {},
  userRatings: {},
  apiKeys: { steamgrid: '' },
uiState: { settingsOpen: false, musicOnLaunch: true, fullscreenOnLaunch: false }

};


const CONFIG_STORAGE_KEY = 'retroLauncherConfig';
const STEAMGRIDBASE = 'https://www.steamgriddb.com/api/v2';
const STEAMGRIDATTRIBUTIONURL = 'https://www.steamgriddb.com';
const SteamGridDB_API_BASE = 'https://www.steamgriddb.com/api/v2';
const SteamGridDB_ATTRIBUTION_URL = 'https://www.steamgriddb.com';
const DEFAULT_LAUNCH_PLACEHOLDER = 'Np. pcsx2-qt | flatpak run net.pcsx2.PCSX2 | /home/user/Emulator.AppImage | C:\\Emu\\emu.exe';
const DEFAULT_PLATFORM_ICON = '🎮';


function normalizeGameName(name) {
  return String(name || "")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[_\.]+/g, " ")
    .replace(/\([^)]+\)/g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/:\d+$/g, "")
    .replace(/[-–—]\s*(USA|EUR|PAL|NTSC).*$/i, "")
    .replace(/\b(v\d+(\.\d+)*)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^disney\s+/i, "")
    .replace(/^dreamworks\s+/i, "")
    .replace(/^DreamWorks\s+/i, "")
    .replace(/\b(HD|Remastered|Collection|Deluxe|Definitive)\b/gi, "")
    .trim();
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function validatePathExists(path) { return typeof path === 'string' && path.trim().length > 0; }
function parseArgString(raw) {
  return raw
    ? (raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || []).map(p => p.replace(/^"|"$/g, '').replace(/^'|'$/g, ''))
    : [];
}
function mod(n, m) { return ((n % m) + m) % m; }


function getAspectVars(aspect) {
  switch (aspect) {
    case 'psp':
      return { width: 180, ratio: '0.62 / 1' };
    case 'ps2':
      return { width: 180, ratio: '0.72 / 1' };
    case 'psx':
      return { width: 180, ratio: '0.70 / 1' };
    case 'ps3':
      return { width: 180, ratio: '0.78 / 1' };
    case 'ps4':
      return { width: 180, ratio: '0.78 / 1' };
    case 'ps5':
      return { width: 180, ratio: '0.78 / 1' };
    case 'wiiu':
      return { width: 180, ratio: '0.78 / 1' };
    case 'switch':
      return { width: 180, ratio: '0.78 / 1' };
    case 'xbox':
      return { width: 180, ratio: '0.78 / 1' };
    case 'xbox360':
      return { width: 180, ratio: '0.72 / 1' };
    case 'xboxone':
      return { width: 180, ratio: '0.78 / 1' };
    case 'xsx':
      return { width: 180, ratio: '0.78 / 1' };
    case 'nes':
    case 'snes':
    case 'n64':
    case 'gamecube':
    case 'wii':
    case 'gb':
    case 'gbc':
    case 'gba':
    case 'nds':
    case '3ds':
      return { width: 180, ratio: '1 / 1' };
    default:
      return { width: 180, ratio: '0.70 / 1' };
  }
}


async function fetchSteamGridMetadataByName(name) {
  const apiKey = config.apiKeys?.steamgrid?.trim();
  if (!apiKey) return { ok: false, error: "Brak klucza SteamGridDB API w ustawieniach." };

  const rawName = String(name || "").trim();
  const query = encodeURIComponent(normalizeGameName(rawName));
  const searchRes = await fetch(`${STEAMGRIDBASE}/search/autocomplete/${query}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!searchRes.ok) {
    return { ok: false, error: "Nie udało się wyszukać gry w SteamGridDB." };
  }

  const searchData = await searchRes.json();
  const q = normalizeGameName(rawName).toLowerCase();
  const qWords = q.split(/\s+/).filter(w => w.length >= 3);
  const candidates = (searchData?.data || []).slice(0, 12);

  if (!candidates.length) {
    return { ok: false, error: "Nie znaleziono gry w SteamGridDB." };
  }

 function scoreCandidate(item) {
  const n = String(item?.name || "").toLowerCase();
  if (!n) return -999;

  let score = 0;
  const qTokens = q
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 3);

  const nTokens = n
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (n === q) score += 300;
  if (n.startsWith(q)) score += 120;
  if (n.includes(q)) score += 90;

  let matched = 0;
  for (const token of qTokens) {
    if (n.includes(token)) {
      score += 25;
      matched += 1;
    }
  }

  const coverage = qTokens.length ? matched / qTokens.length : 0;
  score += Math.round(coverage * 100);

  const lengthPenalty = Math.abs(nTokens.length - qTokens.length) * 6;
  score -= lengthPenalty;

  const badWords = [
    'brave', 'frozen', 'cars', 'up', 'wall-e',
    'inside out', 'monsters university', 'wreck-it ralph', 'big hero 6'
  ];

  for (const bad of badWords) {
    if (q.includes('toy story') && n.includes(bad)) score -= 60;
  }

  if (q.includes('toy story') && n.includes('toy story')) score += 60;

  return score;
}

const ranked = candidates
  .map(item => ({ item, score: scoreCandidate(item) }))
  .sort((a, b) => b.score - a.score);

const best = ranked[0];
if (!best || best.score < 140) {
  return { ok: false, error: "Nie udało się dobrać trafnego wyniku w SteamGridDB." };
}

const first = best.item;

  if (!first || ranked[0].score < 10) {
    return { ok: false, error: "Nie udało się dobrać trafnego wyniku w SteamGridDB." };
  }

  const params = new URLSearchParams({ dimensions: "600x900" });
  const coverRes = await fetch(
    `${STEAMGRIDBASE}/grids/game/${encodeURIComponent(first.id)}?${params.toString()}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  let cover = null;
  if (coverRes.ok) {
    const coverData = await coverRes.json();
    cover = coverData?.data?.[0]?.url ?? null;
  }

  return {
    ok: true,
    data: {
      title: first.name || normalizeGameName(rawName),
      description: "Gra dopasowana automatycznie w SteamGridDB.",
      cover,
      source: "SteamGridDB",
      sourceUrl: STEAMGRIDATTRIBUTIONURL
    }
  };
}

async function enrichPlatformMetadata(platformKey, force = false) {
  const progressEl = document.getElementById('bulk-progress');
  const progressBar = document.getElementById('bulk-progress-bar');
  const progressText = document.getElementById('bulk-progress-text');
  const platformGames = games.filter(g => g.platform === platformKey && g.rom);

  if (!platformGames.length) {
    showToast('Brak gier do pobrania metadanych', true);
    return;
  }

  if (force) {
    config.metadata[platformKey] = {};
    await saveStoredConfig();
  }

  let updated = 0;
  let processed = 0;

  if (progressEl) progressEl.hidden = false;
  if (progressBar) progressBar.style.width = '0%';
  if (progressText) progressText.textContent = '0 / ' + platformGames.length;

  for (const game of platformGames) {
    processed += 1;
    const existing = (((config.metadata || {})[platformKey] || {})[game.id]) || {};

    if (!force && existing.cover && existing.description) {
      if (progressBar) progressBar.style.width = `${Math.round((processed / platformGames.length) * 100)}%`;
      if (progressText) progressText.textContent = `${processed} / ${platformGames.length}`;
      continue;
    }

    const result = await fetchSteamGridMetadataByName(game.title || game.name || game.file || game.rom);
    await delay(250);

    if (result.ok) {
      if (!config.metadata[platformKey]) config.metadata[platformKey] = {};
      config.metadata[platformKey][game.id] = result.data;
      updated += 1;
      await saveStoredConfig();
    }

    if (progressBar) progressBar.style.width = `${Math.round((processed / platformGames.length) * 100)}%`;
    if (progressText) progressText.textContent = `${processed} / ${platformGames.length}`;
  }

  setTimeout(() => { if (progressEl) progressEl.hidden = true; }, 800);
  renderShelf();
  showToast(updated ? `Pobrano metadane dla ${updated} gier` : 'Nie było nowych metadanych do pobrania');
}


function ensurePresetEmulators() {
  config.platforms.forEach(p => {
    if (typeof config.emulators[p.key] !== 'string') config.emulators[p.key] = '';
    if (typeof config.launchArgs[p.key] !== 'string') config.launchArgs[p.key] = '';
    if (!config.metadata[p.key]) config.metadata[p.key] = {};
    if (!config.manualCovers[p.key]) config.manualCovers[p.key] = {};
    if (!config.userRatings[p.key]) config.userRatings[p.key] = {};
    if (!p.aspect) p.aspect = 'standard';
  });
  if (!config.apiKeys || typeof config.apiKeys.steamgrid !== 'string') config.apiKeys = { steamgrid: '' };
  if (!config.uiState) config.uiState = { settingsOpen: false };
}


async function loadStoredConfig() {
  try {
    if (window.launcherAPI?.loadConfig) {
      const stored = await window.launcherAPI.loadConfig();
      if (stored) {
        if (stored.platforms) config.platforms = stored.platforms;
        if (stored.romFolders) config.romFolders = { ...stored.romFolders };
        if (stored.emulators) config.emulators = { ...config.emulators, ...stored.emulators };
        if (stored.launchArgs) config.launchArgs = { ...config.launchArgs, ...stored.launchArgs };
        if (stored.metadata) config.metadata = { ...config.metadata, ...stored.metadata };
        if (stored.manualCovers) config.manualCovers = { ...config.manualCovers, ...stored.manualCovers };
        if (stored.userRatings) config.userRatings = { ...config.userRatings, ...stored.userRatings };
        if (stored.apiKeys) config.apiKeys = { ...config.apiKeys, ...stored.apiKeys };
        if (stored.uiState) config.uiState = { ...config.uiState, ...stored.uiState };
      }
    } else {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored.platforms) config.platforms = stored.platforms;
        if (stored.romFolders) config.romFolders = { ...stored.romFolders };
        if (stored.emulators) config.emulators = { ...config.emulators, ...stored.emulators };
        if (stored.launchArgs) config.launchArgs = { ...config.launchArgs, ...stored.launchArgs };
        if (stored.metadata) config.metadata = { ...config.metadata, ...stored.metadata };
        if (stored.manualCovers) config.manualCovers = { ...config.manualCovers, ...stored.manualCovers };
        if (stored.userRatings) config.userRatings = { ...config.userRatings, ...stored.userRatings };
        if (stored.apiKeys) config.apiKeys = { ...config.apiKeys, ...stored.apiKeys };
        if (stored.uiState) config.uiState = { ...config.uiState, ...stored.uiState };
      }
    }
  } catch (e) {
    console.warn('Nie udało się wczytać ustawień:', e);
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
    if (window.launcherAPI?.saveConfig) await window.launcherAPI.saveConfig(payload);
    else localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Nie udało się zapisać ustawień:', e);
  }
}


function getPlatform(key) {
  return config.platforms.find(p => p.key === key) || { key, label: key.toUpperCase(), color: '#38e0ff', icon: '🎮', extensions: [], aspect: 'standard' };
}


function getManualCover(platformKey, gameId) {
  return (((config.manualCovers || {})[platformKey] || {})[gameId]) || '';
}


function setManualCover(platformKey, gameId, value) {
  if (!config.manualCovers[platformKey]) config.manualCovers[platformKey] = {};
  if (value) config.manualCovers[platformKey][gameId] = value;
  else delete config.manualCovers[platformKey][gameId];
}


function getCoverForGame(game) {
  return getManualCover(game.platform, game.id) || game.cover || 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1vfw.jpg';
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
    const select = document.getElementById('manual-cover-game');
    const input = document.getElementById('manual-cover-url');
    if (select) { select.value = game.id; select.dispatchEvent(new Event('change')); }
    if (input) input.focus();
  }, 60);
}


const shelf = document.getElementById('shelf');
const shelfViewport = document.getElementById('shelfViewport');
const shelfInfo = document.getElementById('shelfInfo');
const bgBlur = document.getElementById('bgBlur');
const bgGradient = document.getElementById('bgGradient');
const titleEl = document.getElementById('gameTitle');
const platEl = document.getElementById('plat');
const platTag = document.getElementById('plat');
const ratingMini = document.getElementById('ratingMini');
const playBtn = document.getElementById('playBtn');
const detailsBtn = document.getElementById('detailsBtn');
const tabsContainer = document.getElementById('tabsContainer');
const tabHighlight = document.getElementById('tabHighlight');
const searchInput = document.getElementById('search');
const overlay = document.getElementById('overlay');
const platformBlocks = document.getElementById('platformBlocks');
const settingsPanel = document.getElementById('settings-panel');


let current = 0;
let activePlatform = 'all';
let filtered = games;
let viewMode = 'flat';


const colorCache = {};
function getDominantColor(src, cb) {
  if (!src) { cb({ r: 20, g: 22, b: 30 }); return; }
  if (colorCache[src]) { cb(colorCache[src]); return; }
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const w = canvas.width = 32, h = canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
      const result = { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
      colorCache[src] = result;
      cb(result);
    } catch (e) {
      cb({ r: 20, g: 22, b: 30 });
    }
  };
  img.onerror = () => cb({ r: 20, g: 22, b: 30 });
  img.src = src;
}


function applyGradient(rgb) {
  const { r, g, b } = rgb;
  const c1 = `rgb(${r},${g},${b})`;
  const c2 = `rgb(${Math.round(r * 0.4)},${Math.round(g * 0.4)},${Math.round(b * 0.5)})`;
  bgGradient.style.background = `linear-gradient(135deg, ${c1} 0%, ${c2} 55%, #05060a 100%)`;
  platTag.style.background = `rgba(${r},${g},${b},0.35)`;
  playBtn.style.background = c1;
  playBtn.style.color = (r + g + b) / 3 > 150 ? '#05060a' : '#fff';
}


function moveHighlight(tabEl) {
  if (!tabEl) return;
  tabHighlight.style.left = tabEl.offsetLeft + 'px';
  tabHighlight.style.width = tabEl.offsetWidth + 'px';
}


function usedPlatforms() {
  const usedKeys = new Set(games.map(g => g.platform));
  return config.platforms.filter(p => usedKeys.has(p.key));
}


function closeDropdown() { document.getElementById('platformDropdown').classList.remove('open'); }


function renderPlatformDropdown() {
  const menu = document.getElementById('platformDropdownMenu');
  const label = document.getElementById('platformDropdownLabel');
  const dropdownBtn = document.getElementById('platformDropdownBtn');
  menu.innerHTML = '';
  usedPlatforms().forEach(p => {
    const item = document.createElement('div');
    item.className = 'pd-item' + (activePlatform === p.key ? ' active' : '');
    item.textContent = p.label;
    item.addEventListener('click', () => { applyFilter(p.key, null); closeDropdown(); });
    menu.appendChild(item);
  });
  const currentPlatform = config.platforms.find(p => p.key === activePlatform);
  label.textContent = currentPlatform ? currentPlatform.label : 'Platformy';
  dropdownBtn.classList.toggle('active', activePlatform !== 'all');
}


function renderTabs() {
  tabsContainer.innerHTML = '';
  tabsContainer.appendChild(tabHighlight);
  const allTab = document.createElement('div');
  allTab.className = 'tab' + (activePlatform === 'all' ? ' active' : '');
  allTab.dataset.platform = 'all';
  allTab.title = 'Wszystkie';
  allTab.innerHTML = '<span class="tab-label">Wszystkie</span>';
  allTab.addEventListener('click', () => applyFilter('all', allTab));
  tabsContainer.appendChild(allTab);
  const activeTab = tabsContainer.querySelector('.tab.active');
  if (activeTab) moveHighlight(activeTab);
  renderPlatformDropdown();
}


function applyFilter(platform, tabEl) {
  if (platform === activePlatform) return;
  activePlatform = platform;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (tabEl) {
    tabEl.classList.add('active');
    moveHighlight(tabEl);
  } else {
    document.getElementById('tabHighlight').style.width = '0px';
  }
  renderPlatformDropdown();
  shelf.classList.add('switching');
  shelfInfo.classList.add('switching');
  setTimeout(() => {
    filtered = platform === 'all' ? games : games.filter(g => g.platform === platform);
    current = 0;
    renderShelf();
    shelf.classList.remove('switching');
    shelfInfo.classList.remove('switching');
  }, 260);
}


function starString(rating) {
  const full = Math.round(rating / 2);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}


async function refreshLibrary() {
  const merged = [];
  if (window.launcherAPI?.scanRoms) {
    for (const p of config.platforms) {
      const folder = config.romFolders[p.key];
      if (!folder) continue;
      try {
        const scanned = await window.launcherAPI.scanRoms(folder, p.extensions || []);
        scanned.forEach((rom, index) => {
          const gameId = rom.id || `${p.key}-${index}-${rom.title}`;
          const meta = (((config.metadata || {})[p.key] || {})[gameId]) || {};
          const manualCover = getManualCover(p.key, gameId);
       merged.push({
  id: gameId,
  title: normalizeGameName(meta.title || rom.title),
  platform: p.key,
  rom: rom.rom,
  file: rom.rom,
  cover: manualCover || meta.cover || 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1vfw.jpg',
  rating: 8.0,
  ratingCount: 1,
  genres: ['ROM'],
  dev: meta.source || 'Twoja biblioteka',
  year: new Date().getFullYear(),
  desc: meta.description || 'Gra wykryta automatycznie z wybranego folderu ROM-ów.',
  size: 'Lokalny plik'
});
        });
      } catch (e) {
        console.warn('Nie udało się przeskanować folderu', p.key, e);
      }
    }
  }
  games.length = 0;
  games.push(...merged);
  const q = (searchInput?.value || '').trim().toLowerCase();
  let base = activePlatform === 'all' ? games : games.filter(g => g.platform === activePlatform);
if (q) {
  const nq = normalizeGameName(q).toLowerCase();
  base = base.filter(g => normalizeGameName(g.title).toLowerCase().includes(nq));
}; filtered = base;
  if (current >= filtered.length) current = 0;
  renderTabs();
  renderShelf();
}


function applyCoverGeometry(el, platformKey, focused = false) {
  const platform = getPlatform(platformKey);
  const vars = getAspectVars(platform.aspect || 'standard');
  el.style.setProperty('--cover-width', '180px');
  el.style.setProperty('--cover-ratio', vars.ratio);
}


function renderShelf() {
  shelf.innerHTML = '';
  const range = 3;
  const len = filtered.length;


  if (len === 0) {
    shelfViewport.innerHTML = '<div class="empty-state">Brak gier dla tej platformy — skonfiguruj folder i emulator w Ustawieniach</div>';
    titleEl.textContent = '';
    platEl.textContent = '';
    ratingMini.textContent = '';
    return;
  }
  if (!shelf.parentElement) shelfViewport.appendChild(shelf);


  shelf.className = 'shelf mode-' + viewMode;
  shelfViewport.className = 'shelf-viewport mode-' + viewMode;


  for (let offset = -range; offset <= range; offset++) {
    const idx = mod(current + offset, len);
    const g = filtered[idx];
    const pf = getPlatform(g.platform);
    const el = document.createElement('div');
    el.className = 'sh-item' + (offset === 0 ? ' focus' : '');
    el.dataset.offset = offset;
    applyCoverGeometry(el, g.platform, offset === 0);
    const coverSrc = getCoverForGame(g);
    el.innerHTML = `<img src="${coverSrc}" alt="${g.title}"/> `;
    el.addEventListener('click', () => { current = idx; renderShelf(); });
    el.addEventListener('dblclick', () => launchGame(g));
    shelf.appendChild(el);
  }


  const g = filtered[current];
  const pf = getPlatform(g.platform);
  titleEl.textContent = g.title;
  platEl.textContent = pf.label;
  ratingMini.textContent = `★ ${g.rating.toFixed(1)} (${g.ratingCount.toLocaleString('pl-PL')} ocen)`;
  const activeCover = getCoverForGame(g);
  bgBlur.style.backgroundImage = `url('${activeCover}')`;
  getDominantColor(activeCover, applyGradient);
}


function next() { if (filtered.length) { current = mod(current + 1, filtered.length); renderShelf(); } }
function prev() { if (filtered.length) { current = mod(current - 1, filtered.length); renderShelf(); } }


function showToast(msg, isError) {
  const toast = document.getElementById('toast');
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
  if (!validatePathExists(emulatorPath)) { showToast('Brak polecenia uruchomieniowego dla tej platformy', true); return; }
  if (!validatePathExists(game.rom)) { showToast('Brak ścieżki do pliku gry', true); return; }
  if (/flatpak run/.test(emulatorPath) && /^\/media\//.test(game.rom)) showToast('Jeśli gra nie startuje, nadaj Flatpakowi dostęp do /media', true);
  if (window.launcherAPI?.launchGame) {
    const result = await window.launcherAPI.launchGame({ emulatorPath, romPath: game.rom, extraArgs });
    if (!result.ok) showToast('Błąd: ' + result.error, true);
    else showToast('Uruchamiam: ' + game.title);
  } else {
    showToast('Demo: uruchomienie ' + game.title);
  }
}


function openDetails(g) {
  const pf = getPlatform(g.platform);
  document.getElementById('modalCoverImg').src = getCoverForGame(g);
  const platEl2 = document.getElementById('modalPlatform');
  platEl2.textContent = pf.label;
  platEl2.style.background = pf.color + '33';
  platEl2.style.color = pf.color;
  document.getElementById('modalTitle').textContent = g.title;
  document.getElementById('modalScore').textContent = g.rating.toFixed(1);
  document.getElementById('modalStars').textContent = starString(g.rating);
  document.getElementById('modalCount').textContent = `na podstawie ${g.ratingCount.toLocaleString('pl-PL')} ocen użytkowników`;
  document.getElementById('modalTags').innerHTML = (g.genres || []).map(t => `<span class="tag">${t}</span>`).join('');
  document.getElementById('modalDesc').textContent = g.desc || '';
  document.getElementById('modalDev').textContent = g.dev || '';
  document.getElementById('modalYear').textContent = g.year || '';
  document.getElementById('modalGenre').textContent = (g.genres || [])[0] || '';
  document.getElementById('modalSize').textContent = g.size || '';
  overlay.classList.add('open');
  overlay.currentGame = g;
}


function renderSettingsWarning() {
  const warning = document.getElementById('settings-warning');
  if (!warning) return;
  warning.textContent = 'Okładki i opisy są pobierane z SteamGridDB. Dla każdej platformy możesz też ustawić własny typ proporcji okładki oraz ręcznie podmienić cover wybranej gry.';
}


function populateManualCoverGameSelect() {
  const select = document.getElementById('manual-cover-game');
  if (!select) return [];
  const platformGames = games.filter(g => activePlatform !== 'all' ? g.platform === activePlatform : false);
  select.innerHTML = '';
  if (!platformGames.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = activePlatform === 'all' ? 'Najpierw wybierz platformę u góry' : 'Brak gier dla tej platformy';
    select.appendChild(opt);
    return [];
  }
  platformGames.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.title;
    select.appendChild(opt);
  });
  select.value = platformGames[0].id;
  return platformGames;
}


function renderManualCoverPreview() {
  const preview = document.getElementById('manual-cover-preview');
  const select = document.getElementById('manual-cover-game');
  const input = document.getElementById('manual-cover-url');
  if (!preview || !select || !input) return;
  const game = games.find(g => g.id === select.value && g.platform === activePlatform);
  if (!game) {
    preview.classList.add('empty');
    preview.innerHTML = activePlatform === 'all'
      ? 'Wybierz konkretną platformę, aby edytować ręczne okładki.'
      : 'Wybierz grę z listy.';
    input.value = '';
    return;
  }
  const manual = getManualCover(game.platform, game.id);
  input.value = manual || '';
  preview.classList.remove('empty');
  preview.innerHTML = `
    <img src="${getCoverForGame(game)}" alt="${game.title}" />
    <div class="manual-cover-meta">
      <strong>${game.title}</strong>
      <span>${manual ? 'Źródło: ręczne' : 'Źródło: SteamGridDB / automatyczne'}</span>
      <span>${manual || 'Brak ręcznego URL lub pliku.'}</span>
    </div>
  `;
}


async function saveManualCoverFromUrl() {
  if (activePlatform === 'all') { showToast('Najpierw wybierz konkretną platformę', true); return; }
  const select = document.getElementById('manual-cover-game');
  const input = document.getElementById('manual-cover-url');
  const gameId = select?.value || '';
  const value = (input?.value || '').trim();
  if (!gameId || !value) { showToast('Wybierz grę i wpisz URL okładki', true); return; }
  const game = games.find(g => g.id === gameId && g.platform === activePlatform);
  if (!game) { showToast('Nie znaleziono gry', true); return; }
  setManualCover(game.platform, game.id, value);
  await saveStoredConfig();
  await refreshLibrary();
  populateManualCoverGameSelect();
  document.getElementById('manual-cover-game').value = gameId;
  renderManualCoverPreview();
  showToast('Zapisano ręczny URL okładki');
}


async function pickManualCoverFile() {
  if (activePlatform === 'all') {
    showToast('Najpierw wybierz konkretną platformę', true);
    return;
  }

  const select = document.getElementById('manual-cover-game');
  const gameId = select?.value;
  if (!gameId) {
    showToast('Najpierw wybierz grę', true);
    return;
  }

  const game = games.find(g => g.id === gameId && g.platform === activePlatform);
  if (!game) {
    showToast('Nie znaleziono gry', true);
    return;
  }

  const api = window.launcherAPI;
  const picker = api?.selectImageFile || api?.selectFile;

  if (!picker) {
    showToast('Brak natywnego okna wyboru pliku w launcherAPI', true);
    return;
  }

  let picked;
  try {
    picked = await picker.call(api);
  } catch (e) {
    showToast('Nie udało się otworzyć okna wyboru pliku', true);
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
  showToast('Zapisano ręczny plik okładki');
}


async function clearManualCover() {
  if (activePlatform === 'all') { showToast('Najpierw wybierz konkretną platformę', true); return; }
  const select = document.getElementById('manual-cover-game');
  const gameId = select?.value || '';
  if (!gameId) { showToast('Najpierw wybierz grę', true); return; }
  const game = games.find(g => g.id === gameId && g.platform === activePlatform);
  if (!game) { showToast('Nie znaleziono gry', true); return; }
  setManualCover(game.platform, game.id, '');
  await saveStoredConfig();
  await refreshLibrary();
  populateManualCoverGameSelect();
  document.getElementById('manual-cover-game').value = gameId;
  renderManualCoverPreview();
  showToast('Usunięto ręczną okładkę');
}


function renderSettings() {
  renderSettingsWarning();

  const steamgridInput = document.getElementById('steamgrid-api-key-input');
  if (steamgridInput) steamgridInput.value = config.apiKeys?.steamgrid || '';

  const musicSel = document.getElementById('music-on-launch');
  const fsSel = document.getElementById('fullscreen-on-launch');
  if (musicSel) musicSel.value = String(!!config.uiState?.musicOnLaunch);
  if (fsSel) fsSel.value = String(!!config.uiState?.fullscreenOnLaunch);

  platformBlocks.innerHTML = '';
  config.platforms.forEach(p => {
    const romPath = config.romFolders[p.key] || '';
    const emuPath = config.emulators[p.key] || '';
    const launchArgs = config.launchArgs[p.key] || '';
    const aspect = p.aspect || 'standard';
    const block = document.createElement('div');
    block.className = 'platform-block';
    block.innerHTML = `
      <div class="platform-header">
        <span class="platform-badge" style="background:${p.color}33;color:${p.color}">${p.label}</span>
        <span class="ext-hint">${(p.extensions || []).join(', ')}</span>
        <button type="button" class="remove-platform-btn" data-key="${p.key}" title="Usuń platformę">✕</button>
      </div>
      <div class="field-row">
        <div class="field-label">Folder z ROM-ami</div>
        <div class="field-input ${romPath ? '' : 'empty'}">${romPath || 'Nie ustawiono'}</div>
        <button type="button" class="browse-btn" data-type="rom" data-key="${p.key}">Wybierz folder…</button>
      </div>
      <div class="field-row field-row-stack">
        <div class="field-label">Polecenie uruchomieniowe</div>
        <input type="text" class="field-textinput" data-emulator-input="${p.key}" value="${emuPath || ''}" placeholder="${DEFAULT_LAUNCH_PLACEHOLDER}" />
        <button type="button" class="browse-btn" data-type="emu" data-key="${p.key}">Wybierz plik…</button>
      </div>
      <div class="field-row field-row-stack">
        <div class="field-label">Domyślne argumenty</div>
        <input type="text" class="field-textinput" data-args-input="${p.key}" value="${launchArgs || ''}" placeholder="Np. --fullscreen --fastboot" />
        <button type="button" class="test-launch-btn" data-key="${p.key}">Testuj</button>
      </div>
      <div class="field-row field-row-stack">
        <div class="field-label">Typ okładki</div>
        <select class="field-select" data-aspect-input="${p.key}">
          <option value="standard" ${aspect === 'standard' ? 'selected' : ''}>Standard</option>
          <option value="psp" ${aspect === 'psp' ? 'selected' : ''}>PSP / wąska</option>
          <option value="square" ${aspect === 'square' ? 'selected' : ''}>Kwadrat</option>
          <option value="wide" ${aspect === 'wide' ? 'selected' : ''}>Szeroka</option>
        </select>
      </div>
    `;
    platformBlocks.appendChild(block);
  });

  const saveStartupBtn = document.getElementById('save-startup-settings');
if (saveStartupBtn) {
  saveStartupBtn.onclick = async () => {
    config.uiState.musicOnLaunch = document.getElementById('music-on-launch')?.value === 'true';
    config.uiState.fullscreenOnLaunch = document.getElementById('fullscreen-on-launch')?.value === 'true';
    await saveStoredConfig();
    showToast('Zapisano ustawienia startu');
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
      showToast('Zapisano folder z ROM-ami');
    } else {
      config.emulators[key] = picked;
      await saveStoredConfig();
      renderSettings();
      showToast('Zapisano polecenie uruchomieniowe');
    }
  };
});


  document.querySelectorAll('[data-emulator-input]').forEach(el => {
    el.oninput = () => { config.emulators[el.dataset.emulatorInput] = el.value; saveStoredConfig(); };
  });
  document.querySelectorAll('[data-args-input]').forEach(el => {
    el.oninput = () => { config.launchArgs[el.dataset.argsInput] = el.value; saveStoredConfig(); };
  });
  document.querySelectorAll('[data-aspect-input]').forEach(el => {
    el.onchange = async () => {
      const key = el.dataset.aspectInput;
      const platform = getPlatform(key);
      platform.aspect = el.value;
      await saveStoredConfig();
      renderShelf();
      showToast('Zapisano typ okładki');
    };
  });


  document.querySelectorAll('.test-launch-btn').forEach(btn => {
    btn.onclick = async () => {
      const key = btn.dataset.key;
      const emulatorPath = config.emulators[key] || '';
      const rawArgs = config.launchArgs[key] || '';
      const extraArgs = parseArgString(rawArgs);
      const api = window.api || window.launcherAPI;
      if (!api?.invoke) { showToast('Brak mostka IPC do testu uruchomienia', true); return; }
      const result = await api.invoke('emulator:test', { emulatorPath, extraArgs });
      if (result?.ok) showToast('Polecenie testowe uruchomione');
      else showToast(result?.error || 'Test nieudany', true);
    };
  });


  document.querySelectorAll('.remove-platform-btn').forEach(btn => {
    btn.onclick = async () => {
      const key = btn.dataset.key;
      config.platforms = config.platforms.filter(p => p.key !== key);
      delete config.romFolders[key];
      delete config.emulators[key];
      delete config.launchArgs[key];
      delete config.metadata[key];
      delete config.manualCovers[key];
      delete config.userRatings[key];
      await saveStoredConfig();
      showToast('Usunięto platformę');
      renderSettings();
      renderTabs();
      if (activePlatform === key) { activePlatform = 'all'; await refreshLibrary(); }
    };
  });


  const steamgridSaveBtn = document.getElementById('save-steamgrid-api-key');
  if (steamgridSaveBtn) steamgridSaveBtn.onclick = async () => {
    const input = document.getElementById('steamgrid-api-key-input');
    config.apiKeys.steamgrid = (input?.value || '').trim();
    await saveStoredConfig();
    showToast('Zapisano klucz SteamGridDB API');
  };


  const manualCoverSelect = document.getElementById('manual-cover-game');
  const platformGames = populateManualCoverGameSelect();
  const manualCoverUrlBtn = document.getElementById('save-manual-cover-url');
  const manualCoverFileBtn = document.getElementById('pick-manual-cover-file');
  const manualCoverClearBtn = document.getElementById('clear-manual-cover');
  renderManualCoverPreview();
  if (manualCoverSelect) manualCoverSelect.onchange = () => renderManualCoverPreview();
  if (manualCoverUrlBtn) manualCoverUrlBtn.onclick = saveManualCoverFromUrl;
  if (manualCoverFileBtn) manualCoverFileBtn.onclick = pickManualCoverFile;
  if (manualCoverClearBtn) manualCoverClearBtn.onclick = clearManualCover;


  const bulkMetaBtn = document.getElementById('bulk-fetch-platform-meta');
  if (bulkMetaBtn) bulkMetaBtn.onclick = async () => {
    if (activePlatform === 'all') { showToast('Najpierw wybierz konkretną platformę', true); return; }
    await enrichPlatformMetadata(activePlatform, false);
    await refreshLibrary();
  };


  const forceMetaBtn = document.getElementById('force-fetch-platform-meta');
  if (forceMetaBtn) forceMetaBtn.onclick = async () => {
    if (activePlatform === 'all') { showToast('Najpierw wybierz konkretną platformę', true); return; }
    await enrichPlatformMetadata(activePlatform, true);
    await refreshLibrary();
  };
}


function activateSettingsSubtab(name) {
  const tabs = [...document.querySelectorAll('.settings-subtab')];
  const panels = [...document.querySelectorAll('.settings-subpanel')];
  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.subtab === name);
    t.setAttribute('aria-selected', String(t.dataset.subtab === name));
  });
  panels.forEach(p => p.classList.toggle('active', p.dataset.subpanel === name));
}


function switchToPage(page) {
  const shelfView = document.querySelector('[data-view="shelf"]');
  const navSettings = document.getElementById('navSettings');
  const navHome = document.getElementById('navHome');
  if (shelfView) shelfView.hidden = page === 'settings';
  if (settingsPanel) settingsPanel.hidden = page !== 'settings';
  if (navSettings) navSettings.classList.toggle('active-view', page === 'settings');
  if (navHome) navHome.classList.toggle('active-view', page !== 'settings');
  config.uiState.settingsOpen = page === 'settings';
  location.hash = page === 'settings' ? '#settings' : '#home';
}


function slugify(str) { return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, ''); }
function toggleFullscreen() {
  if (window.launcherAPI?.toggleFullscreen) window.launcherAPI.toggleFullscreen();
  else {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }
}


const addPlatformForm = document.getElementById('addPlatformForm');
const newPlatformName = document.getElementById('newPlatformName');
const newPlatformExts = document.getElementById('newPlatformExts');
const newPlatformColor = document.getElementById('newPlatformColor');
const newPlatformAspect = document.getElementById('newPlatformAspect');


addPlatformForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const label = newPlatformName.value.trim();
  if (!label) return;
  const key = slugify(label) || ('platform' + Date.now());
  if (config.platforms.some(p => p.key === key)) { showToast('Platforma o tym identyfikatorze już istnieje', true); return; }
  const extsRaw = newPlatformExts.value.trim();
  const extensions = extsRaw
    ? extsRaw.split(',').map(x => x.trim()).filter(Boolean).map(x => (x.startsWith('.') ? x : '.' + x))
    : [];
  config.platforms.push({ key, label, color: newPlatformColor.value, icon: DEFAULT_PLATFORM_ICON, extensions, aspect: newPlatformAspect.value || 'standard' });
  newPlatformName.value = '';
  newPlatformExts.value = '';
  newPlatformAspect.value = 'standard';
  await saveStoredConfig();
  renderSettings();
  renderTabs();
  showToast('Dodano platformę: ' + label);
});


document.getElementById('saveBtn').addEventListener('click', async () => {
  await saveStoredConfig();
  await refreshLibrary();
  showToast('Zapisano ustawienia ✔');
});
document.getElementById('resetBtn').addEventListener('click', async () => {
  config.romFolders = {};
  config.emulators = {};
  config.launchArgs = {};
  await saveStoredConfig();
  renderSettings();
  await refreshLibrary();
});


document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
document.getElementById('platformDropdownBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('platformDropdown').classList.toggle('open');
});
document.addEventListener('click', (e) => {
  if (!document.getElementById('platformDropdown').contains(e.target)) closeDropdown();
});


document.querySelectorAll('.vm-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    viewMode = btn.dataset.mode;
    document.querySelectorAll('.vm-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderShelf();
  });
});


playBtn.addEventListener('click', () => {
  const g = filtered[current];
  if (g) launchGame(g);
});
detailsBtn.addEventListener('click', () => {
  const g = filtered[current];
  if (g) openDetails(g);
});
document.getElementById('closeBtn').addEventListener('click', () => overlay.classList.remove('open'));
overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
document.getElementById('modalPlayBtn').addEventListener('click', () => {
  if (overlay.currentGame) launchGame(overlay.currentGame);
  overlay.classList.remove('open');
});
document.getElementById('modalCoverBtn').addEventListener('click', () => {
  if (overlay.currentGame) {
    overlay.classList.remove('open');
    openManualCoverEditorForGame(overlay.currentGame);
  }
});
searchInput.addEventListener('input', refreshLibrary);


document.getElementById('navHome').addEventListener('click', () => switchToPage('home'));
document.getElementById('navSettings').addEventListener('click', () => {
  switchToPage('settings');
  activateSettingsSubtab('general');
});
document.getElementById('settings-close-btn').addEventListener('click', () => switchToPage('home'));
document.querySelectorAll('.settings-subtab').forEach(t =>
  t.addEventListener('click', () => activateSettingsSubtab(t.dataset.subtab))
);


window.addEventListener('hashchange', () => {
  const page = location.hash.replace('#', '') || 'home';
  if (page === 'settings') {
    switchToPage('settings');
    activateSettingsSubtab('general');
  } else switchToPage('home');
});


window.addEventListener('keydown', (e) => {
  const settingsActive = !settingsPanel.hidden;
  if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
  if (e.key === 'Escape') {
    if (overlay.classList.contains('open')) overlay.classList.remove('open');
    else if (settingsActive) switchToPage('home');
  }
  if (settingsActive) return;
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') prev();
  if (e.key === 'Enter') {
    const g = filtered[current];
    if (g) launchGame(g);
  }
});

function stopMusic() {
  musicPlaying = false;
  if (musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
  if (musicNodes && musicNodes.length) {
    musicNodes.forEach(n => {
      try { n.osc?.stop?.(); } catch (e) {}
      try { n.gain?.disconnect?.(); } catch (e) {}
      try { n.osc?.disconnect?.(); } catch (e) {}
    });
    musicNodes = [];
  }
  const np = document.getElementById('nowPlaying');
  if (np) np.classList.remove('show');
}

function toggleFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement) {
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (req) return req.call(el).catch?.(() => {});
  } else {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
    if (exit) return exit.call(document).catch?.(() => {});
  }
}


async function init() {
  await loadStoredConfig();
  ensurePresetEmulators();
  renderTabs();
  renderSettings();

  if (config.uiState?.musicOnLaunch) startMusic();
  else stopMusic();

  if (config.uiState?.fullscreenOnLaunch) {
    const tryFullscreen = () => {
      if (!document.fullscreenElement) {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (req) req.call(el).catch?.(() => {});
      }
    };
    setTimeout(tryFullscreen, 500);
    setTimeout(tryFullscreen, 1500);
  }

  await refreshLibrary();
  if (location.hash === '#settings') {
    switchToPage('settings');
    activateSettingsSubtab('general');
  } else {
    switchToPage('home');
  }
}

init();



// ---------- Obsluga pada (Gamepad API) ----------
let gamepadIndex = null;
let gamepadLoopActive = false;
const gpState = { lastMove: 0, lastAction: 0 };
const GP_MOVE_COOLDOWN = 260;
const GP_ACTION_COOLDOWN = 400;
const GP_DEADZONE = 0.4;

window.addEventListener('gamepadconnected', (e) => {
  gamepadIndex = e.gamepad.index;
  const ind = document.getElementById('gamepadIndicator');
  if (ind) ind.classList.add('connected');
  showToast('Pad podlaczony: ' + e.gamepad.id);
  if (!gamepadLoopActive) { gamepadLoopActive = true; requestAnimationFrame(gamepadLoop); }
});

window.addEventListener('gamepaddisconnected', (e) => {
  if (gamepadIndex === e.gamepad.index) {
    gamepadIndex = null;
    const ind2 = document.getElementById('gamepadIndicator');
    if (ind2) ind2.classList.remove('connected');
    showToast('Pad odlaczony', true);
  }
});

function isSettingsActive() {
  const view = document.querySelector('.view[data-view="settings"]');
  if (view) return view.classList.contains('active');
  return settingsPanel ? !settingsPanel.hidden : false;
}

function gamepadLoop() {
  if (gamepadIndex !== null) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads[gamepadIndex];
    if (gp) handleGamepadInput(gp);
  }
  requestAnimationFrame(gamepadLoop);
}

function handleGamepadInput(gp) {
  const now = performance.now();
  const axisX = gp.axes[0] || 0;
  const dpadLeft = gp.buttons[14] && gp.buttons[14].pressed;
  const dpadRight = gp.buttons[15] && gp.buttons[15].pressed;
  const dpadUp = gp.buttons[12] && gp.buttons[12].pressed;
  const dpadDown = gp.buttons[13] && gp.buttons[13].pressed;
  const btnA = gp.buttons[0] && gp.buttons[0].pressed;
  const btnB = gp.buttons[1] && gp.buttons[1].pressed;
  const btnY = gp.buttons[3] && gp.buttons[3].pressed;
  const btnStart = gp.buttons[9] && gp.buttons[9].pressed;
  const shoulderL = gp.buttons[4] && gp.buttons[4].pressed;
  const shoulderR = gp.buttons[5] && gp.buttons[5].pressed;

  if (overlay.classList.contains('open')) {
    if ((btnB || btnStart) && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
      overlay.classList.remove('open');
      gpState.lastAction = now;
    }
    if (btnA && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
      if (overlay.currentGame) launchGame(overlay.currentGame);
      overlay.classList.remove('open');
      gpState.lastAction = now;
    }
    return;
  }

  if (isSettingsActive()) {
    if (btnB && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
      switchView('shelf');
      document.getElementById('settingsBtn').classList.remove('active-view');
      gpState.lastAction = now;
    }
    return;
  }

  const dropdownEl = document.getElementById('platformDropdown');
  const isDropdownOpen = dropdownEl && dropdownEl.classList.contains('open');

  if (isDropdownOpen) {
    const items = Array.from(document.querySelectorAll('.pd-item'));
    if (items.length === 0) { closeDropdown(); return; }
    if (typeof gpState.pdIndex !== 'number') {
      gpState.pdIndex = Math.max(0, items.findIndex(i => i.classList.contains('active')));
    }
    const wantUp = dpadUp || (gp.axes[1] || 0) < -GP_DEADZONE;
    const wantDown = dpadDown || (gp.axes[1] || 0) > GP_DEADZONE;

    if ((wantUp || wantDown) && now - gpState.lastMove > GP_MOVE_COOLDOWN) {
      if (wantUp) gpState.pdIndex = mod(gpState.pdIndex - 1, items.length);
      if (wantDown) gpState.pdIndex = mod(gpState.pdIndex + 1, items.length);
      items.forEach((it, i) => it.classList.toggle('pd-focus', i === gpState.pdIndex));
      items[gpState.pdIndex].scrollIntoView({ block: 'nearest' });
      sfxHover();
      gpState.lastMove = now;
    }

    if (btnA && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
      items[gpState.pdIndex].click();
      gpState.pdIndex = null;
      gpState.lastAction = now;
    }

    if ((btnB || btnStart) && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
      closeDropdown();
      gpState.pdIndex = null;
      gpState.lastAction = now;
    }
    return;
  }

  const wantLeft = dpadLeft || axisX < -GP_DEADZONE;
  const wantRight = dpadRight || axisX > GP_DEADZONE;

  if ((wantLeft || wantRight) && now - gpState.lastMove > GP_MOVE_COOLDOWN) {
    if (wantLeft) prev(); else next();
    gpState.lastMove = now;
  }

  if ((shoulderL || shoulderR) && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    const plats = usedPlatforms();
    const keys = ['all', ...plats.map(p => p.key)];
    const activeIdx = keys.indexOf(activePlatform);
    let newIdx = activeIdx;
    if (shoulderL) newIdx = mod(activeIdx - 1, keys.length);
    if (shoulderR) newIdx = mod(activeIdx + 1, keys.length);
    const newKey = keys[newIdx];
    if (newKey === 'all') applyFilter('all', document.querySelector('.tab[data-platform="all"]'));
    else applyFilter(newKey, null);
    gpState.lastAction = now;
  }

  if (dpadUp && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    document.getElementById('platformDropdown').classList.add('open');
    gpState.pdIndex = null;
    sfxTab();
    gpState.lastAction = now;
  }

  if (btnA && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    const g = filtered[current];
    if (g) launchGame(g);
    gpState.lastAction = now;
  }

  if (btnY && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    const g = filtered[current];
    if (g) openDetails(g);
    gpState.lastAction = now;
  }

  if (btnStart && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    switchView('settings');
    document.getElementById('settingsBtn').classList.add('active-view');
    gpState.lastAction = now;
  }
}

function checkExistingGamepads() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of pads) {
    if (gp) {
      gamepadIndex = gp.index;
      const ind3 = document.getElementById('gamepadIndicator');
      if (ind3) ind3.classList.add('connected');
      if (!gamepadLoopActive) { gamepadLoopActive = true; requestAnimationFrame(gamepadLoop); }
      break;
    }
  }
}
checkExistingGamepads();


// ---------- System audio: efekty UI + muzyka w tle ----------
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const actx = new AudioCtx();
let masterGain = actx.createGain();
masterGain.gain.value = 0.35;
masterGain.connect(actx.destination);

let musicGain = actx.createGain();
musicGain.gain.value = 0.35;
musicGain.connect(masterGain);

let sfxGain = actx.createGain();
sfxGain.gain.value = 0.6;
sfxGain.connect(masterGain);

let isMuted = false;
let musicPlaying = false;
let musicNodes = [];
let musicTimer = null;

function resumeAudio() {
  if (actx.state === 'suspended') actx.resume();
}
window.addEventListener('click', resumeAudio, { once: true });
window.addEventListener('keydown', resumeAudio, { once: true });

function playTone(freq, duration, type, gainVal, delay) {
  if (isMuted) return;
  const t0 = actx.currentTime + (delay || 0);
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainVal || 0.25, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function sfxHover() { playTone(880, 0.08, 'sine', 0.12); }
function sfxMove() { playTone(660, 0.12, 'triangle', 0.18); playTone(990, 0.1, 'sine', 0.08, 0.02); }
function sfxSelect() { playTone(523.25, 0.15, 'sine', 0.22); playTone(783.99, 0.18, 'sine', 0.16, 0.05); }
function sfxBack() { playTone(392, 0.14, 'triangle', 0.16); }
function sfxLaunch() {
  playTone(440, 0.1, 'sine', 0.2);
  playTone(554.37, 0.1, 'sine', 0.18, 0.08);
  playTone(659.25, 0.16, 'sine', 0.2, 0.16);
}
function sfxTab() { playTone(740, 0.1, 'square', 0.06); }

// Proceduralna ambientowa melodia w tle (loopowana progresja akordow)
const AMBIENT_SCALE = [220.0, 246.94, 277.18, 329.63, 369.99, 415.30, 440.0];
let ambientStep = 0;

function scheduleAmbientNote() {
  if (isMuted || !musicPlaying) return;
  const t0 = actx.currentTime;
  const freq = AMBIENT_SCALE[ambientStep % AMBIENT_SCALE.length] / 2;
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.12, t0 + 1.2);
  gain.gain.linearRampToValueAtTime(0, t0 + 3.6);
  osc.connect(gain);
  gain.connect(musicGain);
  osc.start(t0);
  osc.stop(t0 + 3.8);

  if (ambientStep % 3 === 0) {
    const osc2 = actx.createOscillator();
    const gain2 = actx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq / 2, t0);
    gain2.gain.setValueAtTime(0, t0);
    gain2.gain.linearRampToValueAtTime(0.07, t0 + 1.5);
    gain2.gain.linearRampToValueAtTime(0, t0 + 4.5);
    osc2.connect(gain2);
    gain2.connect(musicGain);
    osc2.start(t0);
    osc2.stop(t0 + 4.7);
  }

  ambientStep++;
  musicTimer = setTimeout(scheduleAmbientNote, 1800);
}

function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  resumeAudio();
  scheduleAmbientNote();
  const np = document.getElementById('nowPlaying');
  if (np) { np.classList.add('show'); setTimeout(() => np.classList.remove('show'), 4000); }
}

function stopMusic() {
  musicPlaying = false;
  if (musicTimer) clearTimeout(musicTimer);
}

const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');

function updateMuteUI() {
  if (!muteBtn) return;
  muteBtn.textContent = isMuted ? '🔇' : '🔊';
  muteBtn.classList.toggle('muted', isMuted);
}

if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    masterGain.gain.value = isMuted ? 0 : (volumeSlider ? volumeSlider.value / 100 : 0.35);
    updateMuteUI();
    if (!isMuted) resumeAudio();
  });
}

if (volumeSlider) {
  volumeSlider.addEventListener('input', () => {
    const v = volumeSlider.value / 100;
    if (!isMuted) masterGain.gain.value = v;
  });
}

startMusic();

init();
 


function sfxPlatform() { playTone(330, 0.10, 'square', 0.14); playTone(523.25, 0.12, 'sine', 0.10, 0.03); }

function next() {
  if (filtered.length) {
    current = mod(current + 1, filtered.length);
    renderShelf();
    sfxMove();
  }
}

function prev() {
  if (filtered.length) {
    current = mod(current - 1, filtered.length);
    renderShelf();
    sfxMove();
  }
}

function applyFilter(platform, tabEl) {
  if (platform === activePlatform) return;
  activePlatform = platform;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (tabEl) {
    tabEl.classList.add('active');
    moveHighlight(tabEl);
  } else {
    document.getElementById('tabHighlight').style.width = '0px';
  }
  renderPlatformDropdown();
  shelf.classList.add('switching');
  shelfInfo.classList.add('switching');
  sfxPlatform();
  setTimeout(() => {
    filtered = platform === 'all' ? games : games.filter(g => g.platform === platform);
    current = 0;
    renderShelf();
    shelf.classList.remove('switching');
    shelfInfo.classList.remove('switching');
  }, 260);
}