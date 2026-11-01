// Integracja z SteamGridDB i wzbogacanie metadanych.
// ROZSZERZENIE: dodano ScreenScraper.fr (główne źródło dla retro —
// opisy, cover, genres, liczba graczy) i TheGamesDB (fallback bez
// rejestracji, głównie cover + rok + genres) jako kolejne bezpłatne
// scrapery dla platform retro, gdzie RAWG/SteamGridDB mają słabe
// pokrycie (SNES, Genesis, PSX, arcade, handheldy itd.).

function getSteamGridDimensionsForAspect(aspect, custom) {
  const ratio = getAspectVars(aspect || 'standard', custom).ratioNumber;

  if (aspect === 'square') return '512x512';
  if (aspect === 'wide' || aspect === 'banner' || aspect === 'bigpic' || aspect === 'marquee') return '920x430';
  if (aspect === 'psp') return '660x930';
  if (aspect === 'portrait' || aspect === 'steam') return '600x900';
  if (ratio > 1.5) return '920x430';
  if (ratio > 0.85) return '512x512';
  return '600x900';
}

function getRawgApiKey() {
  return config.apiKeys?.rawg?.trim() || '';
}

function getSteamGridApiKey() {
  return config.apiKeys?.steamgrid?.trim() || '';
}

// ScreenScraper wymaga DWÓCH par danych:
// 1) dev id/dev password — identyfikator aplikacji (prosi się o niego
//    przez formularz na screenscraper.fr, sekcja "API");
// 2) ssid/sspassword — login i hasło zwykłego konta użytkownika.
// Bez pełnej czwórki API zwraca błąd autoryzacji — dlatego nie trzymamy
// tu żadnych "fałszywych" wartości domyślnych i pomijamy źródło, aż
// użytkownik wpisze dane w Ustawienia → Okładki.
function getScreenScraperCredentials() {
  return {
    devId: config.apiKeys?.screenscraperDevId?.trim() || '',
    devPassword: config.apiKeys?.screenscraperDevPass?.trim() || '',
    user: config.apiKeys?.screenscraperUser?.trim() || '',
    password: config.apiKeys?.screenscraperPassword?.trim() || ''
  };
}

function screenScraperConfigured() {
  const c = getScreenScraperCredentials();
  return Boolean(c.devId && c.devPassword && c.user && c.password);
}

// Lekki test autoryzacji — ssuserInfos.php zwraca info o koncie.
// Używany przez przycisk "Test" w panelu kluczy API.
async function testScreenScraperConnection() {
  const c = getScreenScraperCredentials();
  if (!c.devId || !c.devPassword || !c.user || !c.password) {
    return { ok: false, error: 'Uzupełnij wszystkie 4 pola ScreenScraper (Dev ID, Dev Hasło, Login, Hasło).' };
  }

  const params = new URLSearchParams({
    devid: c.devId,
    devpassword: c.devPassword,
    ssid: c.user,
    sspassword: c.password,
    output: 'json'
  });

  try {
    const res = await fetch(`https://www.screenscraper.fr/api2/ssuserInfos.php?${params.toString()}`);
    if (!res.ok) {
      return { ok: false, error: `Serwer zwrócił HTTP ${res.status}` };
    }
    const data = await res.json();
    const okFlag = data?.header?.success === 'true' || data?.response?.user;
    if (!okFlag) {
      return { ok: false, error: 'Serwer odrzucił dane logowania (header.success != true).' };
    }
    const user = data.response?.user || {};
    return { ok: true, message: `OK — konto: ${user.id || c.user}, poziom: ${user.level ?? '?'}` };
  } catch (e) {
    return { ok: false, error: 'Błąd sieci: ' + (e?.message || e) };
  }
}

// TheGamesDB — od 2021 wymaga darmowego klucza API (rejestracja przez
// Patreon-free-tier albo formularz na forum), ale limnity są wysokie.
function getTheGamesDbApiKey() {
  return config.apiKeys?.thegamesdb?.trim() || '';
}

// Mapa platformKey (Twoje wewnętrzne klucze) -> ID systemu ScreenScraper.
// Uzupełnij / dopasuj do własnych platform.key. Pełna lista systemeid
// jest dostępna po zalogowaniu na https://www.screenscraper.fr/api2.php
const SCREENSCRAPER_SYSTEM_IDS = {
  nes: 3,
  snes: 4,
  n64: 14,
  gb: 9,
  gbc: 10,
  gba: 12,
  genesis: 1,
  megadrive: 1,
  psx: 57,
  ps1: 57,
  ps2: 58,
  psp: 61,
  arcade: 75,
  neogeo: 142,
  dreamcast: 23,
  saturn: 22,
  gamecube: 13,
  wii: 16
};

// Mapa platformKey -> platform id TheGamesDB (patrz theGamesDb.net/api ->
// endpoint /Platforms dla pełnej listy).
const THEGAMESDB_PLATFORM_IDS = {
  nes: 7,
  snes: 6,
  n64: 3,
  gb: 4,
  gbc: 41,
  gba: 5,
  genesis: 18,
  megadrive: 18,
  psx: 10,
  ps1: 10,
  ps2: 11,
  psp: 13,
  arcade: 23,
  neogeo: 24,
  dreamcast: 16,
  saturn: 17,
  gamecube: 21,
  wii: 9
};

// Mapy są fallbackiem dla starych configów; nowe platformy zapisują
// własne `scraperSystem` / `tgdb` z presetu (działa też po zmianie nazwy).
function getScraperSystemId(platformKey) {
  const platform = getPlatform(platformKey);
  const custom = Number(platform?.scraperSystem);
  if (Number.isFinite(custom) && custom > 0) return custom;
  return SCREENSCRAPER_SYSTEM_IDS[platformKey];
}

function getTheGamesDbPlatformId(platformKey) {
  const platform = getPlatform(platformKey);
  const custom = Number(platform?.tgdb);
  if (Number.isFinite(custom) && custom > 0) return custom;
  return THEGAMESDB_PLATFORM_IDS[platformKey];
}

function normalizeRawgYear(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.getFullYear();
}

function normalizeRawgGenres(genres) {
  if (!Array.isArray(genres)) return [];
  return genres
    .map(g => g?.name)
    .filter(Boolean);
}

function pickRawgDeveloper(gameDetails) {
  if (!gameDetails) return '';
  if (Array.isArray(gameDetails.developers) && gameDetails.developers.length) {
    return gameDetails.developers.map(d => d?.name).filter(Boolean).join(', ');
  }
  return '';
}

function scoreCandidateMatch(query, candidateName) {
  const q = String(query || '').toLowerCase().trim();
  const n = String(candidateName || '').toLowerCase().trim();
  if (!q || !n) return -999;

  let score = 0;

  if (n === q) score += 300;
  if (n.startsWith(q)) score += 120;
  if (n.includes(q)) score += 90;

  const qTokens = q
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3);

  const nTokens = n
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

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

  return score;
}

async function fetchSteamGridCoverByName(name, platformKey) {
  const apiKey = getSteamGridApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Brak klucza SteamGridDB API w ustawieniach.' };
  }

  const rawName = String(name || '').trim();
  const normalizedName = normalizeGameName(rawName);
  const query = encodeURIComponent(normalizedName);

  const platform = getPlatform(platformKey);
  const aspect = platform?.aspect || 'standard';
  const dimensions = getSteamGridDimensionsForAspect(aspect, platform?.aspectCustom);

  const searchRes = await fetch(`${STEAMGRIDBASE}/search/autocomplete/${query}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!searchRes.ok) {
    return { ok: false, error: 'Nie udało się wyszukać gry w SteamGridDB.' };
  }

  const searchData = await searchRes.json();
  const candidates = (searchData?.data || []).slice(0, 12);

  if (!candidates.length) {
    return { ok: false, error: 'Nie znaleziono gry w SteamGridDB.' };
  }

  const ranked = candidates
    .map(item => ({
      item,
      score: scoreCandidateMatch(normalizedName, item?.name || '')
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 140 || !best.item) {
    return { ok: false, error: 'Nie udało się dobrać trafnego wyniku w SteamGridDB.' };
  }

  const params = new URLSearchParams({ dimensions });
  const coverRes = await fetch(
    `${STEAMGRIDBASE}/grids/game/${encodeURIComponent(best.item.id)}?${params.toString()}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  let cover = null;
  let remoteCover = null;

  if (coverRes.ok) {
    const coverData = await coverRes.json();
    remoteCover = coverData?.data?.[0]?.url ?? null;
  }

  if (remoteCover && window.launcherAPI?.cacheRemoteImage) {
    const cached = await window.launcherAPI.cacheRemoteImage({
      url: remoteCover,
      platformKey,
      gameTitle: best.item.name || normalizedName,
      aspect
    });

    if (cached?.ok && cached.localUrl) {
      cover = cached.localUrl;
    } else {
      cover = remoteCover;
    }
  } else {
    cover = remoteCover;
  }

  return {
    ok: true,
    data: {
      title: best.item.name || normalizedName,
      cover,
      remoteCover: remoteCover || null,
      source: 'SteamGridDB',
      sourceUrl: STEAMGRIDATTRIBUTIONURL,
      dimensions
    }
  };
}

async function fetchRawgMetadataByName(name) {
  const apiKey = getRawgApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Brak klucza RAWG API w ustawieniach.' };
  }

  const rawName = String(name || '').trim();
  const normalizedName = normalizeGameName(rawName);

  const searchUrl = new URL('https://api.rawg.io/api/games');
  searchUrl.searchParams.set('key', apiKey);
  searchUrl.searchParams.set('search', normalizedName);
  searchUrl.searchParams.set('page_size', '10');

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) {
    return { ok: false, error: 'Nie udało się wyszukać gry w RAWG.' };
  }

  const searchData = await searchRes.json();
  const candidates = Array.isArray(searchData?.results) ? searchData.results : [];

  if (!candidates.length) {
    return { ok: false, error: 'Nie znaleziono gry w RAWG.' };
  }

  const ranked = candidates
    .map(item => ({
      item,
      score: scoreCandidateMatch(normalizedName, item?.name || '')
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 120 || !best.item?.slug) {
    return { ok: false, error: 'Nie udało się dobrać trafnego wyniku w RAWG.' };
  }

  const detailsUrl = new URL(`https://api.rawg.io/api/games/${encodeURIComponent(best.item.slug)}`);
  detailsUrl.searchParams.set('key', apiKey);

  const detailsRes = await fetch(detailsUrl.toString());
  if (!detailsRes.ok) {
    return { ok: false, error: 'Nie udało się pobrać szczegółów gry z RAWG.' };
  }

  const details = await detailsRes.json();

  return {
    ok: true,
    data: {
      title: details?.name || normalizedName,
      description: details?.description_raw || details?.description || '',
      desc_en: details?.description_raw || details?.description || '',
      desc_pl: '',
      genres: normalizeRawgGenres(details?.genres),
      developer: pickRawgDeveloper(details),
      year: normalizeRawgYear(details?.released),
      metacritic: Number.isFinite(Number(details?.metacritic))
        ? Number(details.metacritic)
        : null,
      sourceMeta: 'RAWG',
      sourceMetaUrl: details?.website || details?.reddit_url || ''
    }
  };
}

// ============================================================
// ScreenScraper.fr — główne źródło metadanych dla retro. Darmowe konto
// wystarcza (bez limitów płatnego API). Dopasowanie po nazwie ROM-u +
// ID systemu. Zwraca opis (PL jeśli dostępny, inaczej EN), gatunki,
// liczbę graczy, ocenę społeczności i cover (box-2D).
//
// Endpoint: https://www.screenscraper.fr/api2/jeuInfos.php
// Wymaga: devid/devpassword (per-aplikacja, można użyć wartości testowych
// z dokumentacji dla użytku non-commercial) + ssid/sspassword użytkownika.
// ============================================================

 const SCREENSCRAPER_DEV_ID = 'twojDevId';
const SCREENSCRAPER_DEV_PASSWORD = 'twojDevPassword';
const SCREENSCRAPER_SOFTNAME = 'RetroLauncher';

async function fetchScreenScraperMetadataByName(name, platformKey) {
  const { devId, devPassword, user, password } = getScreenScraperCredentials();
  if (!devId || !devPassword || !user || !password) {
    return { ok: false, error: 'Brak pełnych danych ScreenScraper (Dev ID/Hasło + Login/Hasło) w ustawieniach.' };
  }

  const systemeid = getScraperSystemId(platformKey);
  if (!systemeid) {
    return { ok: false, error: `Brak mapowania platformy "${platformKey}" na systemeid ScreenScraper.` };
  }

  const rawName = String(name || '').trim();
  const normalizedName = normalizeGameName(rawName);

  const params = new URLSearchParams({
    devid: devId,
    devpassword: devPassword,
    softname: SCREENSCRAPER_SOFTNAME,
    ssid: user,
    sspassword: password,
    output: 'json',
    romnom: rawName,
    recherche: normalizedName,
    systemeid: String(systemeid)
  });

  const res = await fetch(`${SCREENSCRAPER_BASE}/jeuInfos.php?${params.toString()}`);
  if (!res.ok) {
    return { ok: false, error: 'Nie udało się połączyć z ScreenScraper.' };
  }

  const data = await res.json();
  const jeu = data?.response?.jeu;

  if (!jeu) {
    return { ok: false, error: 'Nie znaleziono gry w ScreenScraper.' };
  }

  const score = scoreCandidateMatch(normalizedName, jeu?.noms?.[0]?.text || jeu?.nom || '');
  if (score < 100) {
    return { ok: false, error: 'Nie udało się dobrać trafnego wyniku w ScreenScraper.' };
  }

  // Dwujęzyczne opisy: PL preferowane, EN fallback; zapisujemy OBA w
  // config.metadata, żeby przy zmianie języka UI nie trzeba było
  // odświeżać danych z sieci.
  const synopses = Array.isArray(jeu.synopsis) ? jeu.synopsis : [];
  const descPl = (synopses.find(s => s.langue === 'pl') || {}).text || '';
  const descEn = (synopses.find(s => s.langue === 'en') || synopses[0] || {}).text || '';
  const synopsisEntry = descPl ? { text: descPl } : { text: descEn };

  const genresList = Array.isArray(jeu.genres)
    ? jeu.genres.map(g => {
        const noms = g?.noms || [];
        return (noms.find(n => n.langue === 'pl') || noms.find(n => n.langue === 'en') || noms[0])?.text;
      }).filter(Boolean)
    : [];

  const boxArt = (jeu.medias || []).find(m => m.type === 'box-2D' && m.url);
  const remoteCover = boxArt?.url || null;

  // Dodatkowe media (przydatne w trybach hero/bigbox i w trailerze).
  const fanart = (jeu.medias || []).find(m => m.type === 'fanart' && m.url)?.url || '';
  const wheel = (jeu.medias || []).find(
    m => (m.type === 'wheel' || m.type === 'wheel-hd') && m.url
  )?.url || '';
  const video = (jeu.medias || []).find(
    m => (m.type === 'video' || m.type === 'video-normalized') && m.url
  )?.url || '';

  let cover = remoteCover;
  if (remoteCover && window.launcherAPI?.cacheRemoteImage) {
    const platform = getPlatform(platformKey);
    const cached = await window.launcherAPI.cacheRemoteImage({
      url: remoteCover,
      platformKey,
      gameTitle: jeu.nom || normalizedName,
      aspect: platform?.aspect || 'standard'
    });
    if (cached?.ok && cached.localUrl) cover = cached.localUrl;
  }

  return {
    ok: true,
    data: {
      title: jeu.nom || normalizedName,
      description: synopsisEntry?.text || '',
      desc_pl: descPl || '',
      desc_en: descEn || '',
      genres: genresList,
      developer: jeu.developpeur?.text || '',
      year: jeu?.dates?.[0]?.text ? Number(String(jeu.dates[0].text).slice(0, 4)) || '' : '',
      players: jeu.joueurs?.text || '',
      communityRating: jeu.note?.text ? Number(jeu.note.text) : null,
      cover,
      remoteCover,
      fanart,
      wheel,
      video,
      source: 'ScreenScraper',
      sourceUrl: 'https://www.screenscraper.fr'
    }
  };
}

// ============================================================
// TheGamesDB — fallback bez pełnej rejestracji dewelopera (darmowy klucz
// wystarcza), głównie do coveru + roku + gatunków, gdy SteamGridDB i
// ScreenScraper nie mają trafienia (rzadkie, niszowe ROMy).
// ============================================================

 
async function fetchTheGamesDbMetadataByName(name, platformKey) {
  const apiKey = getTheGamesDbApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Brak klucza TheGamesDB w ustawieniach.' };
  }

  const platformId = getTheGamesDbPlatformId(platformKey);
  const rawName = String(name || '').trim();
  const normalizedName = normalizeGameName(rawName);

  const searchUrl = new URL(`${THEGAMESDB_BASE}/Games/ByGameName`);
  searchUrl.searchParams.set('apikey', apiKey);
  searchUrl.searchParams.set('name', normalizedName);
  if (platformId) searchUrl.searchParams.set('filter[platform]', String(platformId));

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) {
    return { ok: false, error: 'Nie udało się wyszukać gry w TheGamesDB.' };
  }

  const searchData = await searchRes.json();
  const candidates = searchData?.data?.games || [];

  if (!candidates.length) {
    return { ok: false, error: 'Nie znaleziono gry w TheGamesDB.' };
  }

  const ranked = candidates
    .map(item => ({
      item,
      score: scoreCandidateMatch(normalizedName, item?.game_title || '')
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 120 || !best.item?.id) {
    return { ok: false, error: 'Nie udało się dobrać trafnego wyniku w TheGamesDB.' };
  }

  const imagesUrl = new URL(`${THEGAMESDB_BASE}/Games/Images`);
  imagesUrl.searchParams.set('apikey', apiKey);
  imagesUrl.searchParams.set('games_id', String(best.item.id));
  imagesUrl.searchParams.set('filter[type]', 'boxart');

  const imagesRes = await fetch(imagesUrl.toString());
  let remoteCover = null;

  if (imagesRes.ok) {
    const imagesData = await imagesRes.json();
    const baseUrl = imagesData?.data?.base_url?.original || '';
    const gameImages = imagesData?.data?.images?.[String(best.item.id)] || [];
    const front = gameImages.find(img => img.side === 'front') || gameImages[0];
    if (front?.filename && baseUrl) {
      remoteCover = baseUrl + front.filename;
    }
  }

  let cover = remoteCover;
  if (remoteCover && window.launcherAPI?.cacheRemoteImage) {
    const platform = getPlatform(platformKey);
    const cached = await window.launcherAPI.cacheRemoteImage({
      url: remoteCover,
      platformKey,
      gameTitle: best.item.game_title || normalizedName,
      aspect: platform?.aspect || 'standard'
    });
    if (cached?.ok && cached.localUrl) cover = cached.localUrl;
  }

  return {
    ok: true,
    data: {
      title: best.item.game_title || normalizedName,
      year: best.item.release_date ? Number(String(best.item.release_date).slice(0, 4)) || '' : '',
      cover,
      remoteCover,
      source: 'TheGamesDB',
      sourceUrl: 'https://thegamesdb.net'
    }
  };
}

// ============================================================
// Scalenie wszystkich źródeł. Priorytet dla coveru: SteamGridDB ->
// ScreenScraper -> TheGamesDB. Priorytet dla opisu/genres/rok: RAWG ->
// ScreenScraper (RAWG lepszy dla nowszych/multi-platform, ScreenScraper
// lepszy dla czysto retro, więc RAWG ma pierwszeństwo gdy się trafi,
// inaczej ScreenScraper wypełnia braki).
// ============================================================

async function fetchCombinedGameMetadata(name, platformKey) {
  const [coverResult, rawgResult, screenScraperResult, gamesDbResult] = await Promise.allSettled([
    fetchSteamGridCoverByName(name, platformKey),
    fetchRawgMetadataByName(name),
    fetchScreenScraperMetadataByName(name, platformKey),
    fetchTheGamesDbMetadataByName(name, platformKey)
  ]);

  const coverData =
    coverResult.status === 'fulfilled' && coverResult.value?.ok
      ? coverResult.value.data
      : {};

  const rawgData =
    rawgResult.status === 'fulfilled' && rawgResult.value?.ok
      ? rawgResult.value.data
      : {};

  const ssData =
    screenScraperResult.status === 'fulfilled' && screenScraperResult.value?.ok
      ? screenScraperResult.value.data
      : {};

  const gdbData =
    gamesDbResult.status === 'fulfilled' && gamesDbResult.value?.ok
      ? gamesDbResult.value.data
      : {};

  const resolvedCover = coverData.cover || ssData.cover || gdbData.cover || null;
  const resolvedRemoteCover = coverData.remoteCover || ssData.remoteCover || gdbData.remoteCover || null;

  const merged = {
    title: rawgData.title || ssData.title || coverData.title || gdbData.title || normalizeGameName(name),
    description:
      rawgData.description ||
      ssData.description ||
      'Gra dopasowana automatycznie na podstawie zewnętrznych baz danych.',
    desc_pl: ssData.desc_pl || '',
    desc_en: ssData.desc_en || rawgData.desc_en || '',
    cover: resolvedCover,
    remoteCover: resolvedRemoteCover,
    fanart: ssData.fanart || '',
    wheel: ssData.wheel || '',
    video: ssData.video || '',
    genres: (Array.isArray(rawgData.genres) && rawgData.genres.length)
      ? rawgData.genres
      : (Array.isArray(ssData.genres) ? ssData.genres : []),
    dev: rawgData.developer || ssData.developer || '',
    year: rawgData.year || ssData.year || gdbData.year || '',
    metacritic: rawgData.metacritic ?? null,
    communityRating: ssData.communityRating ?? null,
    players: ssData.players || '',
    hltb: null,
    source: [
      coverData.source,
      rawgData.sourceMeta,
      ssData.source,
      gdbData.source
    ].filter(Boolean).join(' + '),
    sourceUrl: coverData.sourceUrl || ssData.sourceUrl || gdbData.sourceUrl || '',
    sourceMetaUrl: rawgData.sourceMetaUrl || '',
    dimensions: coverData.dimensions || null
  };

  if (!merged.cover && !merged.description && merged.metacritic == null && merged.communityRating == null) {
    return { ok: false, error: 'Nie udało się pobrać metadanych z żadnego źródła.' };
  }

  return { ok: true, data: merged };
}

async function enrichPlatformMetadata(platformKey, force = false, opts = {}) {
  // opts.onProgress(done, total) — callback dla pigułki na półce i
  // auto-upełniania w tle; opts.silent — bez toastów (auto-run).
  const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : null;
  const silent = opts.silent === true;

  const progressEl = document.getElementById('bulk-progress');
  const progressBar = document.getElementById('bulk-progress-bar');
  const progressText = document.getElementById('bulk-progress-text');
  const platformGames = games.filter(g => g.platform === platformKey && g.rom);

  if (!platformGames.length) {
    if (!silent) showToast('Brak gier do pobrania metadanych', true);
    return;
  }

  if (!config.metadata) config.metadata = {};

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

    const hasEnoughData =
      existing.cover &&
      (existing.description || existing.desc) &&
      (existing.metacritic != null || existing.genres?.length);

    if (!force && hasEnoughData) {
      if (progressBar) progressBar.style.width = `${Math.round((processed / platformGames.length) * 100)}%`;
      if (progressText) progressText.textContent = `${processed} / ${platformGames.length}`;
      onProgress?.(processed, platformGames.length);
      continue;
    }

    const result = await fetchCombinedGameMetadata(
      game.title || game.name || game.file || game.rom,
      platformKey
    );

    // ScreenScraper ma agresywny rate-limit dla darmowych kont (ok. 1
    // req/s, kilka wątków max) — 350ms zostaje bezpieczne dla RAWG/
    // SteamGridDB, ale przy wielu grach warto rozważyć zwiększenie do
    // 600-800ms, jeśli zaczniesz widzieć błędy 429 z ScreenScraper.
    await delay(350);

    if (result.ok) {
      if (!config.metadata[platformKey]) config.metadata[platformKey] = {};

      config.metadata[platformKey][game.id] = {
        ...existing,
        ...result.data
      };

      updated += 1;
      await saveStoredConfig();
    }

    if (progressBar) progressBar.style.width = `${Math.round((processed / platformGames.length) * 100)}%`;
    if (progressText) progressText.textContent = `${processed} / ${platformGames.length}`;
    onProgress?.(processed, platformGames.length);
  }

  setTimeout(() => {
    if (progressEl) progressEl.hidden = true;
  }, 800);

  await refreshLibrary();
  renderShelf();
  if (!silent) {
    showToast(updated ? `Pobrano metadane dla ${updated} gier` : 'Nie było nowych metadanych do pobrania');
  }
}

// ============================================================
// Auto-uzupełnianie metadanych w tle po starcie (opcja w Ustawienia →
// Okładki). Bezpieczne domyślnie: włącza się tylko gdy użytkownik
// zaznaczy opcję, przerywa się gdy otwarte jest Ustawienia/modal lub
// gra właśnie wystartowała (now-playing). Idzie po platformach po
// kolei, bez force — uzupełnia tylko braki.
// ============================================================

let metadataAutoFetchRunning = false;
let metadataAutoFetchDone = false;

async function autoFetchMetadataInBackground() {
  if (metadataAutoFetchRunning || metadataAutoFetchDone) return;
  if (config.uiState?.autoFetchOnStart !== true) return;

  // Bez żadnych kluczy nie ma czego robić w sieci — odpuść od razu.
  if (!getSteamGridApiKey() && !getRawgApiKey() && !screenScraperConfigured() && !getTheGamesDbApiKey()) {
    return;
  }

  metadataAutoFetchRunning = true;

  try {
    for (const p of config.platforms) {
      // Przerwij, gdy użytkownik wszedł w ustawienia/modal albo odpala grę.
      if (!settingsPanel?.hidden) break;
      if (overlay?.classList?.contains('open')) break;
      if (document.querySelector('.now-playing.show')) break;

      const platformGames = games.filter(g => g.platform === p.key && g.rom);
      if (!platformGames.length) continue;

      const missing = platformGames.filter(g => {
        const meta = getStoredGameMeta(p.key, g.id);
        return !meta.cover || !(meta.description || meta.desc);
      }).length;

      if (missing === 0) continue;

      try {
        await enrichPlatformMetadata(p.key, false, { silent: true });
      } catch (e) {
        console.warn('autoFetch: enrich failed for', p.key, e);
      }
    }
  } finally {
    metadataAutoFetchRunning = false;
    metadataAutoFetchDone = true;
  }
}
