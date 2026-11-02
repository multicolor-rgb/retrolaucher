// Skanowanie ROM-ów i budowa biblioteki gier.

function normalizeStoredMetacritic(meta) {
  const value = meta?.metacritic ?? meta?.metaScore ?? meta?.metacriticScore ?? null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function normalizeStoredHltb(meta) {
  if (!meta) return null;

  if (meta.hltb && typeof meta.hltb === 'object') {
    const main = Number(meta.hltb.main ?? meta.hltb.story ?? meta.hltb.mainStory);
    const extra = Number(meta.hltb.extra ?? meta.hltb.mainExtra);
    const completionist = Number(meta.hltb.completionist ?? meta.hltb.complete);

    return {
      main: Number.isFinite(main) && main > 0 ? main : null,
      extra: Number.isFinite(extra) && extra > 0 ? extra : null,
      completionist: Number.isFinite(completionist) && completionist > 0 ? completionist : null
    };
  }

  const main = Number(meta.hltb ?? meta.hltbMain ?? meta.hltbHours);
  if (Number.isFinite(main) && main > 0) {
    return { main, extra: null, completionist: null };
  }

  return null;
}

function normalizeRomFileSize(rom) {
  const value = rom?.size ?? rom?.fileSize ?? rom?.bytes ?? null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function buildGameId(platformKey, rom, index) {
  return rom.id || `${platformKey}-${index}-${normalizeGameName(rom.title || 'gra')}`;
}

function getStoredGameMeta(platformKey, gameId) {
  return (((config.metadata || {})[platformKey] || {})[gameId]) || {};
}

// Opis wg języka interfejsu: PL gdy jest, inaczej EN (i odwrotnie dla
// języka en). Scrapery zapisują desc_pl/desc_en — stare rekordy mają
// tylko `description`, więc zostaje jako ostateczny fallback.
function pickStoredDescription(meta) {
  const lang = config?.uiState?.language === 'en' ? 'en' : 'pl';
  const pl = meta.desc_pl || '';
  const en = meta.desc_en || meta.description || meta.desc || '';

  if (lang === 'en') return en || pl;
  return pl || en;
}

function buildLibraryGame(platform, rom, index) {
  const gameId = buildGameId(platform.key, rom, index);
  const meta = getStoredGameMeta(platform.key, gameId);
  const manualCover = getManualCover(platform.key, gameId);
  const fileSize = normalizeRomFileSize(rom);
  const metacritic = normalizeStoredMetacritic(meta);
  const hltb = normalizeStoredHltb(meta);
  const storedDesc = pickStoredDescription(meta);

  return {
    id: gameId,
    title: normalizeGameName(meta.title || rom.title || 'Nieznana gra'),
    platform: platform.key,
    rom: rom.rom,
    file: rom.rom,
    location: rom.rom || '',
    fileSize,

    cover:
      manualCover ||
      meta.cover ||
      COVER_PLACEHOLDER,

    // Dodatkowe media ze scraperów (fanart jako tło, wheel/logo i trailer).
    fanart: meta.fanart || '',
    wheel: meta.wheel || '',
    trailer: meta.video || meta.trailer || '',

    rating: Number(meta.rating ?? meta.userRating ?? 8.0) || 8.0,
    ratingCount: Number(meta.ratingCount ?? meta.userRatingCount ?? 1) || 1,

    genres: Array.isArray(meta.genres) && meta.genres.length ? meta.genres : ['ROM'],
    dev: meta.dev || meta.developer || meta.source || 'Twoja biblioteka',
    year: meta.year || meta.releaseYear || '',
    desc: storedDesc || 'Gra wykryta automatycznie z wybranego folderu ROM-ów.',

    metacritic,
    hltb
  };
}

async function refreshLibrary() {
  const merged = [];

  for (const p of config.platforms) {
    if (p.kind === 'pc') {
      const list = Array.isArray(config.pcGames?.[p.key]) ? config.pcGames[p.key] : [];
      list.forEach((entry, index) => {
        const filePath = String(entry?.path || '').trim();
        if (!filePath) return;

        const fileName = filePath.split(/[\\/]/).pop() || filePath;
        const extMatch = fileName.match(/(\.[^.]+)$/);
        const ext = extMatch ? extMatch[1] : '';
        const fallbackTitle = ext ? fileName.slice(0, -ext.length) : fileName;

        merged.push(buildLibraryGame(p, {
          id: pcGameId(filePath),
          title: entry.title || fallbackTitle,
          rom: filePath,
          location: filePath,
          fileName,
          ext
        }, index));
      });
      continue;
    }

    const folder = config.romFolders[p.key];
    if (!folder) continue;

    try {
      if (!window.launcherAPI?.scanRoms) continue;
      const scanned = await window.launcherAPI.scanRoms(folder, p.extensions || []);
      scanned.forEach((rom, index) => {
        merged.push(buildLibraryGame(p, rom, index));
      });
    } catch (e) {
      console.warn('Nie udało się przeskanować folderu', p.key, e);
    }
  }

  // Pełna lista (z ukrytymi) — dla menedżera gier.
  scannedGames.length = 0;
  scannedGames.push(...merged);

  // Na półkę trafiają tylko widoczne gry; ukryte są odfiltrowywane
  // jeszcze przed filtrem platformy i wyszukiwania.
  const visible = merged.filter(g => !isGameHidden(g.platform, g.id));

  games.length = 0;
  games.push(...visible);

  // Statystyki czasu gry — potrzebne do sortowania „Ostatnio grane”
  // i „Czas gry” już przy pierwszym renderze.
  await loadPlaytimeStats({ reapply: false });

  filtered = sortLibraryList(getFilteredLibraryBase());

  if (current >= filtered.length) current = 0;

  renderTabs();
  renderShelf();
}

// ------------------------------------------------------------
// Statystyki czasu gry (współdzielone przez sortowanie i modal)
// ------------------------------------------------------------

function formatPlaytimeMs(ms) {
  const totalSeconds = Math.floor((Number(ms) || 0) / 1000);
  if (totalSeconds <= 0) return '';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

function getPlaytimeStatsEntry(gameId) {
  return gameId ? (playtimeStats[gameId] || null) : null;
}

function getGameTotalPlaytimeMs(gameId) {
  const entry = getPlaytimeStatsEntry(gameId);
  if (!entry) return 0;
  const total = Number(entry.totalMs) || 0;
  const runningMs =
    entry.running && entry.lastStartAt ? Date.now() - Number(entry.lastStartAt) : 0;
  return total + Math.max(0, runningMs);
}

function getGameLastPlayedAt(gameId) {
  const entry = getPlaytimeStatsEntry(gameId);
  if (!entry) return 0;
  const last = Number(entry.lastPlayedAt) || 0;
  if (last) return last;
  // Gra właśnie działa — traktujemy start jak „ostatnio grana”.
  if (entry.running && entry.lastStartAt) return Number(entry.lastStartAt) || 0;
  return 0;
}

function formatLastPlayedDate(ms) {
  if (!ms) return t('neverPlayed');
  const lang = getSavedLanguage() === 'en' ? 'en-GB' : 'pl-PL';
  try {
    return new Date(ms).toLocaleDateString(lang, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (_) {
    return new Date(ms).toLocaleDateString();
  }
}

async function loadPlaytimeStats({ reapply = true, force = false } = {}) {
  if (!window.launcherAPI?.getAllPlaytime) return;

  // Lekki throttle: refreshLibrary jest wołane przy każdym znaku w
  // wyszukiwarce, a statystyki zmieniają się rzadko.
  if (!force && Date.now() - playtimeStatsLoadedAt < 2500) return;

  try {
    const res = await window.launcherAPI.getAllPlaytime();
    if (!res?.ok || !res.playtime || typeof res.playtime !== 'object') return;

    playtimeStatsLoadedAt = Date.now();

    Object.keys(playtimeStats).forEach(id => delete playtimeStats[id]);
    Object.assign(playtimeStats, res.playtime);

    if (typeof playtimeCache === 'object') {
      Object.keys(playtimeStats).forEach(id => {
        const formatted = formatPlaytimeMs(getGameTotalPlaytimeMs(id));
        if (formatted) playtimeCache[id] = formatted;
      });
    }

    if (reapply) reapplyLibraryOrdering();
  } catch (e) {
    console.warn('Nie udało się wczytać statystyk czasu gry:', e);
  }
}

// ------------------------------------------------------------
// Filtrowanie, ulubione i sortowanie biblioteki
// ------------------------------------------------------------

function getFilteredLibraryBase() {
  const q = (searchInput?.value || '').trim().toLowerCase();

  let base = activePlatform === 'all'
    ? games
    : games.filter(g => g.platform === activePlatform);

  if (q) {
    const nq = normalizeGameName(q).toLowerCase();
    base = base.filter(g =>
      normalizeGameName(g.title).toLowerCase().includes(nq)
    );
  }

  return base;
}

function sortLibraryList(list) {
  const sort = config.uiState?.librarySort || 'default';

  if (sort === 'favorites') {
    return list.filter(g => isGameFavorite(g.id));
  }

  if (sort === 'title') {
    return [...list].sort((a, b) =>
      getDisplayTitle(a).localeCompare(getDisplayTitle(b), getSavedLanguage(), {
        sensitivity: 'base',
        numeric: true
      })
    );
  }

  if (sort === 'recent') {
    return [...list].sort((a, b) =>
      getGameLastPlayedAt(b.id) - getGameLastPlayedAt(a.id)
    );
  }

  if (sort === 'playtime') {
    return [...list].sort((a, b) =>
      getGameTotalPlaytimeMs(b.id) - getGameTotalPlaytimeMs(a.id)
    );
  }

  return list;
}

// Ponowne przeliczenie kolejności bez skanowania ROM-ów (np. po zmianie
// sortowania albo po wczytaniu statystyk czasu gry).
function reapplyLibraryOrdering() {
  const prevId = filtered[current]?.id;
  filtered = sortLibraryList(getFilteredLibraryBase());

  if (prevId) {
    const idx = filtered.findIndex(g => g.id === prevId);
    current = idx >= 0 ? idx : 0;
  }
  if (current >= filtered.length) current = 0;

  if (typeof renderShelf === 'function') renderShelf();
}