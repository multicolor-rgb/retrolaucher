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

function buildLibraryGame(platform, rom, index) {
  const gameId = buildGameId(platform.key, rom, index);
  const meta = getStoredGameMeta(platform.key, gameId);
  const manualCover = getManualCover(platform.key, gameId);
  const fileSize = normalizeRomFileSize(rom);
  const metacritic = normalizeStoredMetacritic(meta);
  const hltb = normalizeStoredHltb(meta);

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
      'https://images.igdb.com/igdb/image/upload/t_cover_big/co1vfw.jpg',

    rating: Number(meta.rating ?? meta.userRating ?? 8.0) || 8.0,
    ratingCount: Number(meta.ratingCount ?? meta.userRatingCount ?? 1) || 1,

    genres: Array.isArray(meta.genres) && meta.genres.length ? meta.genres : ['ROM'],
    dev: meta.dev || meta.developer || meta.source || 'Twoja biblioteka',
    year: meta.year || meta.releaseYear || '',
    desc: meta.description || meta.desc || 'Gra wykryta automatycznie z wybranego folderu ROM-ów.',

    metacritic,
    hltb
  };
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
          merged.push(buildLibraryGame(p, rom, index));
        });
      } catch (e) {
        console.warn('Nie udało się przeskanować folderu', p.key, e);
      }
    }
  }

  games.length = 0;
  games.push(...merged);

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

  filtered = base;

  if (current >= filtered.length) current = 0;

  renderTabs();
  renderShelf();
}