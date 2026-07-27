const games = [];

let config = {
  platforms: [
    { key: 'psp', label: 'PlayStation Portable', color: '#ffb450', icon: 'đŽ', extensions: ['.iso', '.cso', '.pbp'], aspect: 'psp' },
    { key: 'ps2', label: 'PlayStation 2', color: '#64b4ff', icon: 'đšď¸', extensions: ['.iso', '.bin'], aspect: 'standard' },
    { key: 'psx', label: 'PlayStation (PSX)', color: '#c88cff', icon: 'đ˝', extensions: ['.bin', '.cue', '.img'], aspect: 'standard' },
    { key: 'ps3', label: 'PlayStation 3', color: '#78ffb4', icon: 'đ', extensions: ['.iso', '.pkg'], aspect: 'wide' },
    { key: 'snes', label: 'Super Nintendo', color: '#ff8ca8', icon: 'đť', extensions: ['.sfc', '.smc'], aspect: 'square' },
    { key: 'nds', label: 'Nintendo DS', color: '#8cffe0', icon: 'đą', extensions: ['.nds'], aspect: 'psp' },
    { key: 'xbox360', label: 'Xbox 360', color: '#9dff8c', icon: 'â', extensions: ['.iso', '.xex'], aspect: 'standard' }
  ],
  romFolders: {},
  emulators: {},
  launchArgs: {},
  metadata: {},
  manualCovers: {},
  userRatings: {},
  apiKeys: { rawg: '' },
  uiState: { settingsOpen: false }
};

const CONFIG_STORAGE_KEY = 'retroLauncherConfig';
const RAWG_API_BASE = 'https://api.rawg.io/api';
const RAWG_ATTRIBUTION_URL = 'https://rawg.io';
const DEFAULT_LAUNCH_PLACEHOLDER = 'Np. pcsx2-qt | flatpak run net.pcsx2.PCSX2 | /home/user/Emulator.AppImage | C:\\Emu\\emu.exe';
const DEFAULT_PLATFORM_ICON = 'đŽ';

function normalizeGameName(name) {
  return String(name || '')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[_\.]+/g, ' ')
    .replace(/\([^\)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\b(usa|europe|japan|rev\s*[a-z0-9]+|v\d+(?:\.\d+)*)\b/gi, ' ')
    .replace(/\s+/g, ' ')
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
      return { width: 180, ratio: '0.68 / 1' };
    case 'square':
      return { width: 180, ratio: '1 / 1' };
    case 'wide':
      return { width: 180, ratio: '0.78 / 1' };
    default:
      return { width: 180, ratio: '0.72 / 1' };
  }
}

async function fetchRawgMetadataByName(name) {
  const apiKey = (config.apiKeys?.rawg || '').trim();
  if (!apiKey) return { ok: false, error: 'Brak klucza RAWG API w ustawieniach.' };
  const query = encodeURIComponent(normalizeGameName(name));
  const listRes = await fetch(`${RAWG_API_BASE}/games?key=${encodeURIComponent(apiKey)}&search=${query}&search_precise=true&page_size=1`);
  if (!listRes.ok) return { ok: false, error: 'Nie udaĹo siÄ wyszukaÄ gry w RAWG.' };
  const listData = await listRes.json();
  const first = listData?.results?.[0];
  if (!first) return { ok: false, error: 'Nie znaleziono gry w RAWG.' };
  const detailsRes = await fetch(`${RAWG_API_BASE}/games/${encodeURIComponent(first.slug || first.id)}?key=${encodeURIComponent(apiKey)}`);
  if (!detailsRes.ok) return { ok: false, error: 'Nie udaĹo siÄ pobraÄ szczegĂłĹĂłw gry z RAWG.' };
  const details = await detailsRes.json();
  return {
    ok: true,
    data: {
      title: details.name || first.name || normalizeGameName(name),
      description: String(details.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      cover: details.background_image || first.background_image || '',
      source: 'RAWG',
      sourceUrl: RAWG_ATTRIBUTION_URL
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
    const result = await fetchRawgMetadataByName(game.title || game.name || game.file || game.rom);
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
  showToast(updated ? `Pobrano metadane dla ${updated} gier` : 'Nie byĹo nowych metadanych do pobrania');
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
  if (!config.apiKeys || typeof config.apiKeys.rawg !== 'string') config.apiKeys = { rawg: '' };
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
    console.warn('Nie udalo sie wczytac ustawien:', e);
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
    console.warn('Nie udalo sie zapisac ustawien:', e);
  }
}

function getPlatform(key) {
  return config.platforms.find(p => p.key === key) || { key, label: key.toUpperCase(), color: '#38e0ff', icon: 'đŽ', extensions: [], aspect: 'standard' };
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
  return 'â'.repeat(full) + 'â'.repeat(5 - full);
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
            title: meta.title || rom.title,
            platform: p.key,
            rom: rom.rom,
            file: rom.rom,
            cover: manualCover || meta.cover || 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1vfw.jpg',
            rating: 8.0,
            ratingCount: 1,
            genres: ['ROM'],
            dev: meta.source || 'Twoja biblioteka',
            year: new Date().getFullYear(),
            desc: meta.description || 'Gra wykryta automatycznie z wybranego folderu ROM-Ăłw.',
            size: 'Lokalny plik'
          });
        });
      } catch (e) {
        console.warn('Nie udalo sie przeskanowac folderu', p.key, e);
      }
    }
  }
  games.length = 0;
  games.push(...merged);
  const q = (searchInput?.value || '').trim().toLowerCase();
  let base = activePlatform === 'all' ? games : games.filter(g => g.platform === activePlatform);
  if (q) base = base.filter(g => g.title.toLowerCase().includes(q));
  filtered = base;
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
    shelfViewport.innerHTML = '<div class="empty-state">Brak gier dla tej platformy â skonfiguruj folder i emulator w Ustawieniach</div>';
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
    el.innerHTML = `<img src="${coverSrc}" alt="${g.title}"/><div class="sh-tag">${pf.label}</div><div class="bp-status-title">${g.title}</div>`;
    el.addEventListener('click', () => { current = idx; renderShelf(); });
    el.addEventListener('dblclick', () => launchGame(g));
    shelf.appendChild(el);
  }

  const g = filtered[current];
  const pf = getPlatform(g.platform);
  titleEl.textContent = g.title;
  platEl.textContent = pf.label;
  ratingMini.textContent = `â ${g.rating.toFixed(1)} (${g.ratingCount.toLocaleString('pl-PL')} ocen)`;
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
  if (!validatePathExists(game.rom)) { showToast('Brak ĹcieĹźki do pliku gry', true); return; }
  if (/flatpak run/.test(emulatorPath) && /^\/media\//.test(game.rom)) showToast('JeĹli gra nie startuje, nadaj Flatpakowi dostÄp do /media', true);
  if (window.launcherAPI?.launchGame) {
    const result = await window.launcherAPI.launchGame({ emulatorPath, romPath: game.rom, extraArgs });
    if (!result.ok) showToast('BĹÄd: ' + result.error, true);
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
  document.getElementById('modalCount').textContent = `na podstawie ${g.ratingCount.toLocaleString('pl-PL')} ocen uĹźytkownikĂłw`;
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
  warning.textContent = 'OkĹadki i opisy sÄ pobierane z RAWG. Dla kaĹźdej platformy moĹźesz teĹź ustawiÄ wĹasny typ proporcji okĹadki oraz rÄcznie podmieniÄ cover wybranej gry.';
}

function populateManualCoverGameSelect() {
  const select = document.getElementById('manual-cover-game');
  if (!select) return [];
  const platformGames = games.filter(g => activePlatform !== 'all' ? g.platform === activePlatform : false);
  select.innerHTML = '';
  if (!platformGames.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = activePlatform === 'all' ? 'Najpierw wybierz platformÄ u gĂłry' : 'Brak gier dla tej platformy';
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
    preview.innerHTML = activePlatform === 'all' ? 'Wybierz konkretnÄ platformÄ, aby edytowaÄ rÄczne okĹadki.' : 'Wybierz grÄ z listy.';
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
      <span>${manual ? 'ĹšrĂłdĹo: rÄczne' : 'ĹšrĂłdĹo: RAWG / automatyczne'}</span>
      <span>${manual || 'Brak rÄcznego URL lub pliku.'}</span>
    </div>
  `;
}

async function saveManualCoverFromUrl() {
  if (activePlatform === 'all') { showToast('Najpierw wybierz konkretnÄ platformÄ', true); return; }
  const select = document.getElementById('manual-cover-game');
  const input = document.getElementById('manual-cover-url');
  const gameId = select?.value || '';
  const value = (input?.value || '').trim();
  if (!gameId || !value) { showToast('Wybierz grÄ i wpisz URL okĹadki', true); return; }
  const game = games.find(g => g.id === gameId && g.platform === activePlatform);
  if (!game) { showToast('Nie znaleziono gry', true); return; }
  setManualCover(game.platform, game.id, value);
  await saveStoredConfig();
  await refreshLibrary();
  populateManualCoverGameSelect();
  document.getElementById('manual-cover-game').value = gameId;
  renderManualCoverPreview();
  showToast('Zapisano rÄczny URL okĹadki');
}

async function pickManualCoverFile() {
  if (activePlatform === 'all') { showToast('Najpierw wybierz konkretnÄ platformÄ', true); return; }
  const select = document.getElementById('manual-cover-game');
  const gameId = select?.value || '';
  if (!gameId) { showToast('Najpierw wybierz grÄ', true); return; }
  const game = games.find(g => g.id === gameId && g.platform === activePlatform);
  if (!game) { showToast('Nie znaleziono gry', true); return; }
  let picked = null;
  if (window.launcherAPI?.selectImageFile) picked = await window.launcherAPI.selectImageFile();
  else if (window.launcherAPI?.selectFile) picked = await window.launcherAPI.selectFile();
  else picked = prompt('Podaj ĹcieĹźkÄ do pliku obrazu');
  if (!picked) return;
  let normalized = picked;
  if (!/^https?:\/\//i.test(normalized) && !/^file:\/\//i.test(normalized)) normalized = 'file://' + normalized;
  setManualCover(game.platform, game.id, normalized);
  await saveStoredConfig();
  await refreshLibrary();
  populateManualCoverGameSelect();
  document.getElementById('manual-cover-game').value = gameId;
  renderManualCoverPreview();
  showToast('Zapisano rÄczny plik okĹadki');
}

async function clearManualCover() {
  if (activePlatform === 'all') { showToast('Najpierw wybierz konkretnÄ platformÄ', true); return; }
  const select = document.getElementById('manual-cover-game');
  const gameId = select?.value || '';
  if (!gameId) { showToast('Najpierw wybierz grÄ', true); return; }
  const game = games.find(g => g.id === gameId && g.platform === activePlatform);
  if (!game) { showToast('Nie znaleziono gry', true); return; }
  setManualCover(game.platform, game.id, '');
  await saveStoredConfig();
  await refreshLibrary();
  populateManualCoverGameSelect();
  document.getElementById('manual-cover-game').value = gameId;
  renderManualCoverPreview();
  showToast('UsuniÄto rÄcznÄ okĹadkÄ');
}

function renderSettings() {
  renderSettingsWarning();
  const rawgInput = document.getElementById('rawg-api-key-input');
  if (rawgInput) rawgInput.value = config.apiKeys?.rawg || '';

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
        <button type="button" class="remove-platform-btn" data-key="${p.key}" title="UsuĹ platformÄ">â</button>
      </div>
      <div class="field-row">
        <div class="field-label">Folder z ROM-ami</div>
        <div class="field-input ${romPath ? '' : 'empty'}">${romPath || 'Nie ustawiono'}</div>
        <button type="button" class="browse-btn" data-type="rom" data-key="${p.key}">Wybierz folderâŚ</button>
      </div>
      <div class="field-row field-row-stack">
        <div class="field-label">Polecenie uruchomieniowe</div>
        <input type="text" class="field-textinput" data-emulator-input="${p.key}" value="${emuPath || ''}" placeholder="${DEFAULT_LAUNCH_PLACEHOLDER}" />
        <button type="button" class="browse-btn" data-type="emu" data-key="${p.key}">Wybierz plikâŚ</button>
      </div>
      <div class="field-row field-row-stack">
        <div class="field-label">DomyĹlne argumenty</div>
        <input type="text" class="field-textinput" data-args-input="${p.key}" value="${launchArgs || ''}" placeholder="Np. --fullscreen --fastboot" />
        <button type="button" class="test-launch-btn" data-key="${p.key}">Testuj</button>
      </div>
      <div class="field-row field-row-stack">
        <div class="field-label">Typ okĹadki</div>
        <select class="field-select" data-aspect-input="${p.key}">
          <option value="standard" ${aspect === 'standard' ? 'selected' : ''}>Standard</option>
          <option value="psp" ${aspect === 'psp' ? 'selected' : ''}>PSP / wÄska</option>
          <option value="square" ${aspect === 'square' ? 'selected' : ''}>Kwadrat</option>
          <option value="wide" ${aspect === 'wide' ? 'selected' : ''}>Szeroka</option>
        </select>
      </div>
    `;
    platformBlocks.appendChild(block);
  });

  document.querySelectorAll('.browse-btn').forEach(btn => {
    btn.onclick = async () => {
      const type = btn.dataset.type;
      const key = btn.dataset.key;
      let picked = null;
      if (window.launcherAPI) picked = type === 'rom' ? await window.launcherAPI.selectFolder() : await window.launcherAPI.selectExecutable();
      else picked = type === 'rom' ? `/home/user/roms/${key}` : `/opt/emulators/${key}/run`;
      if (!picked) return;
      if (type === 'rom') {
        config.romFolders[key] = picked;
        await saveStoredConfig();
        showToast('Zapisano folder z ROM-ami');
        renderSettings();
        await refreshLibrary();
      } else {
        config.emulators[key] = picked;
        await saveStoredConfig();
        showToast('Zapisano polecenie uruchomieniowe');
        renderSettings();
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
      showToast('Zapisano typ okĹadki');
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
      delete config.romFolders[key]; delete config.emulators[key]; delete config.launchArgs[key]; delete config.metadata[key]; delete config.manualCovers[key]; delete config.userRatings[key];
      await saveStoredConfig();
      showToast('UsuniÄto platformÄ');
      renderSettings();
      renderTabs();
      if (activePlatform === key) { activePlatform = 'all'; await refreshLibrary(); }
    };
  });

  const rawgSaveBtn = document.getElementById('save-rawg-api-key');
  if (rawgSaveBtn) rawgSaveBtn.onclick = async () => {
    const input = document.getElementById('rawg-api-key-input');
    config.apiKeys.rawg = (input?.value || '').trim();
    await saveStoredConfig();
    showToast('Zapisano klucz RAWG API');
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
    if (activePlatform === 'all') { showToast('Najpierw wybierz konkretnÄ platformÄ', true); return; }
    await enrichPlatformMetadata(activePlatform, false);
    await refreshLibrary();
  };

  const forceMetaBtn = document.getElementById('force-fetch-platform-meta');
  if (forceMetaBtn) forceMetaBtn.onclick = async () => {
    if (activePlatform === 'all') { showToast('Najpierw wybierz konkretnÄ platformÄ', true); return; }
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
  if (config.platforms.some(p => p.key === key)) { showToast('Platforma o tym identyfikatorze juĹź istnieje', true); return; }
  const extsRaw = newPlatformExts.value.trim();
  const extensions = extsRaw ? extsRaw.split(',').map(x => x.trim()).filter(Boolean).map(x => x.startsWith('.') ? x : '.' + x) : [];
  config.platforms.push({ key, label, color: newPlatformColor.value, icon: DEFAULT_PLATFORM_ICON, extensions, aspect: newPlatformAspect.value || 'standard' });
  newPlatformName.value = '';
  newPlatformExts.value = '';
  newPlatformAspect.value = 'standard';
  await saveStoredConfig();
  renderSettings();
  renderTabs();
  showToast('Dodano platformÄ: ' + label);
});

document.getElementById('saveBtn').addEventListener('click', async () => { await saveStoredConfig(); await refreshLibrary(); showToast('Zapisano ustawienia â'); });
document.getElementById('resetBtn').addEventListener('click', async () => {
  config.romFolders = {}; config.emulators = {}; config.launchArgs = {};
  await saveStoredConfig(); renderSettings(); await refreshLibrary();
});

document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
document.getElementById('platformDropdownBtn').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('platformDropdown').classList.toggle('open'); });
document.addEventListener('click', (e) => { if (!document.getElementById('platformDropdown').contains(e.target)) closeDropdown(); });

document.querySelectorAll('.vm-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    viewMode = btn.dataset.mode;
    document.querySelectorAll('.vm-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderShelf();
  });
});

playBtn.addEventListener('click', () => { const g = filtered[current]; if (g) launchGame(g); });
detailsBtn.addEventListener('click', () => { const g = filtered[current]; if (g) openDetails(g); });
document.getElementById('closeBtn').addEventListener('click', () => overlay.classList.remove('open'));
overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
document.getElementById('modalPlayBtn').addEventListener('click', () => { if (overlay.currentGame) launchGame(overlay.currentGame); overlay.classList.remove('open'); });
document.getElementById('modalCoverBtn').addEventListener('click', () => { if (overlay.currentGame) { overlay.classList.remove('open'); openManualCoverEditorForGame(overlay.currentGame); } });
searchInput.addEventListener('input', refreshLibrary);

document.getElementById('navHome').addEventListener('click', () => switchToPage('home'));
document.getElementById('navSettings').addEventListener('click', () => { switchToPage('settings'); activateSettingsSubtab('general'); });
document.getElementById('settings-close-btn').addEventListener('click', () => switchToPage('home'));
document.querySelectorAll('.settings-subtab').forEach(t => t.addEventListener('click', () => activateSettingsSubtab(t.dataset.subtab)));

window.addEventListener('hashchange', () => {
  const page = location.hash.replace('#', '') || 'home';
  if (page === 'settings') { switchToPage('settings'); activateSettingsSubtab('general'); }
  else switchToPage('home');
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
  if (e.key === 'Enter') { const g = filtered[current]; if (g) launchGame(g); }
});

async function init() {
  await loadStoredConfig();
  ensurePresetEmulators();
  renderTabs();
  renderSettings();
  await refreshLibrary();
  if (location.hash === '#settings') { switchToPage('settings'); activateSettingsSubtab('general'); }
  else switchToPage('home');
}

init();