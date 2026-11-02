// Integracja ze SteamGridDB, RAWG i TheGamesDB.
// Wszystkie żądania idą przez backend (launcherAPI.httpRequest), więc
// WebKit nie blokuje ich przez CORS. ScreenScraper nie jest już używany:
// wymagał czterech pól logowania i miał agresywne limity.

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

// ============================================================
// Wspólny transport HTTP dla scraperów.
//
// Wcześniej metadata.js wołało przeglądarkowy fetch. W Tauri/WebKit
// żądania do SteamGridDB/RAWG/TheGamesDB są cross-origin i kończyły się
// błędem CORS, a awaryjny http_proxy nie zawsze był wywoływany. Teraz
// każde żądanie idzie przez backend (launcherAPI.httpRequest), więc CORS
// w ogóle nie dotyczy scraperów. W Electronie robi to proces main.
// ============================================================

function truncateApiBody(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > 180 ? clean.slice(0, 180) + '…' : clean;
}

function apiErrorText(error) {
  if (!error) return 'nieznany błąd';
  if (typeof error === 'string') return error;
  return error.message || error.name || String(error) || 'nieznany błąd';
}

async function apiFetchResponse(url, options = {}) {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  const body = options.body ?? null;

  if (window.launcherAPI?.httpRequest) {
    const res = await window.launcherAPI.httpRequest({ url, method, headers, body });
    if (!res || res.error) {
      throw new Error(res?.error || 'Błąd sieci');
    }

    return {
      ok: res.ok !== false && (res.status == null || Number(res.status) < 400),
      status: Number(res.status) || 0,
      json: async () => JSON.parse(res.body || 'null'),
      text: async () => res.body || ''
    };
  }

  return fetch(url, {
    method,
    headers,
    body: body == null ? undefined : body
  });
}

async function apiFetchJson(url, options = {}) {
  const res = await apiFetchResponse(url, options);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status || '?'}${text ? `: ${truncateApiBody(text)}` : ''}`);
  }

  try {
    return JSON.parse(text || 'null');
  } catch (_) {
    throw new Error('Nieprawidłowa odpowiedź JSON z API.');
  }
}

function searchNameForApi(name) {
  return normalizeGameName(name)
    .replace(/([a-z])([0-9])/gi, '$1 $2')
    .replace(/([0-9])([a-z])/gi, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// Testy połączenia — używane przez przyciski „Test” w Ustawieniach.
// ============================================================

async function testSteamGridConnection() {
  const apiKey = getSteamGridApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Brak klucza SteamGridDB API w ustawieniach.' };
  }

  try {
    const data = await apiFetchJson(`${STEAMGRIDBASE}/search/autocomplete/portal`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (data?.success === false) {
      return { ok: false, error: (data?.errors || []).join(', ') || 'API odrzuciło klucz.' };
    }

    const count = Array.isArray(data?.data) ? data.data.length : 0;
    return { ok: true, message: `OK — ${count} wyników testowych` };
  } catch (e) {
    return { ok: false, error: apiErrorText(e) };
  }
}

async function testRawgConnection() {
  const apiKey = getRawgApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Brak klucza RAWG API w ustawieniach.' };
  }

  try {
    const url = new URL('https://api.rawg.io/api/games');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('search', 'portal');
    url.searchParams.set('page_size', '1');

    const data = await apiFetchJson(url.toString());
    const count = Array.isArray(data?.results) ? data.results.length : 0;
    return { ok: true, message: `OK — ${count} wyników testowych` };
  } catch (e) {
    return { ok: false, error: apiErrorText(e) };
  }
}

async function testTheGamesDbConnection() {
  const apiKey = getTheGamesDbApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Brak klucza TheGamesDB API w ustawieniach.' };
  }

  try {
    const url = new URL(`${THEGAMESDB_BASE}/Games/ByGameName`);
    url.searchParams.set('apikey', apiKey);
    url.searchParams.set('name', 'portal');

    const data = await apiFetchJson(url.toString());
    const count = theGamesDbList(data?.data?.games).length;
    return { ok: true, message: `OK — ${count} wyników testowych` };
  } catch (e) {
    return { ok: false, error: apiErrorText(e) };
  }
}

// TheGamesDB — od 2021 wymaga darmowego klucza API (rejestracja przez
// Patreon-free-tier albo formularz na forum), ale limnity są wysokie.
function getTheGamesDbApiKey() {
  return config.apiKeys?.thegamesdb?.trim() || '';
}

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
// własne `tgdb` z presetu (działa też po zmianie nazwy).
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

async function fetchSteamGridGrids(gameId, dimensions, apiKey) {
  const params = dimensions
    ? `?${new URLSearchParams({ dimensions }).toString()}`
    : '';
  const data = await apiFetchJson(
    `${STEAMGRIDBASE}/grids/game/${encodeURIComponent(gameId)}${params}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  return Array.isArray(data?.data) ? data.data.filter(grid => grid?.url) : [];
}

async function fetchSteamGridCoverByName(name, platformKey) {
  const apiKey = getSteamGridApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Brak klucza SteamGridDB API w ustawieniach.' };
  }

  const rawName = String(name || '').trim();
  const normalizedName = searchNameForApi(rawName) || normalizeGameName(rawName);
  const query = encodeURIComponent(normalizedName);

  const platform = getPlatform(platformKey);
  const aspect = platform?.aspect || 'standard';
  const dimensions = getSteamGridDimensionsForAspect(aspect, platform?.aspectCustom);

  let searchData;
  try {
    searchData = await apiFetchJson(`${STEAMGRIDBASE}/search/autocomplete/${query}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  } catch (e) {
    return { ok: false, error: `SteamGridDB: ${apiErrorText(e)}` };
  }

  if (searchData?.success === false) {
    return {
      ok: false,
      error: `SteamGridDB: ${(searchData?.errors || []).join(', ') || 'API odrzuciło klucz'}`
    };
  }

  const candidates = Array.isArray(searchData?.data) ? searchData.data.slice(0, 12) : [];

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
  if (!best || best.score < 140 || !best.item?.id) {
    return { ok: false, error: 'Nie udało się dobrać trafnego wyniku w SteamGridDB.' };
  }

  // Najpierw pytamy o preferowany wymiar. Jeśli dana platforma nie ma
  // okładek w tym rozmiarze, bierzemy dowolną — lepsza okładka w innym
  // kadrze niż brak okładki.
  let grids = [];
  try {
    grids = await fetchSteamGridGrids(best.item.id, dimensions, apiKey);
    if (!grids.length) {
      grids = await fetchSteamGridGrids(best.item.id, null, apiKey);
    }
  } catch (e) {
    return { ok: false, error: `SteamGridDB: ${apiErrorText(e)}` };
  }

  const remoteCover = grids[0]?.url || null;
  if (!remoteCover) {
    return { ok: false, error: 'SteamGridDB: brak okładek dla tej gry.' };
  }

  let cover = remoteCover;
  if (window.launcherAPI?.cacheRemoteImage) {
    const cached = await window.launcherAPI.cacheRemoteImage({
      url: remoteCover,
      platformKey,
      gameTitle: best.item.name || normalizedName,
      aspect
    });

    if (cached?.ok && cached.localUrl) {
      cover = cached.localUrl;
    }
  }

  return {
    ok: true,
    data: {
      title: best.item.name || normalizedName,
      cover,
      remoteCover,
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
  const normalizedName = searchNameForApi(rawName) || normalizeGameName(rawName);

  const searchUrl = new URL('https://api.rawg.io/api/games');
  searchUrl.searchParams.set('key', apiKey);
  searchUrl.searchParams.set('search', normalizedName);
  searchUrl.searchParams.set('page_size', '10');

  let searchData;
  try {
    searchData = await apiFetchJson(searchUrl.toString());
  } catch (e) {
    return { ok: false, error: `RAWG: ${apiErrorText(e)}` };
  }

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

  let details;
  try {
    details = await apiFetchJson(detailsUrl.toString());
  } catch (e) {
    return { ok: false, error: `RAWG: ${apiErrorText(e)}` };
  }

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
// TheGamesDB — fallback z jednym kluczem API. Używany głównie do
// okładki + roku, gdy SteamGridDB i RAWG nie mają trafienia
// (rzadkie, niszowe ROMy).
// ============================================================

let theGamesDbGenresCache = null;

function theGamesDbList(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

async function getTheGamesDbGenres(apiKey) {
  if (theGamesDbGenresCache) return theGamesDbGenresCache;

  try {
    const url = new URL(`${THEGAMESDB_BASE}/Genres`);
    url.searchParams.set('apikey', apiKey);
    const data = await apiFetchJson(url.toString());
    theGamesDbGenresCache = data?.data?.genres || {};
  } catch (_) {
    theGamesDbGenresCache = {};
  }

  return theGamesDbGenresCache;
}

async function fetchTheGamesDbMetadataByName(name, platformKey) {
  const apiKey = getTheGamesDbApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Brak klucza TheGamesDB w ustawieniach.' };
  }

  const platformId = getTheGamesDbPlatformId(platformKey);
  const rawName = String(name || '').trim();
  const normalizedName = searchNameForApi(rawName) || normalizeGameName(rawName);

  const searchUrl = new URL(`${THEGAMESDB_BASE}/Games/ByGameName`);
  searchUrl.searchParams.set('apikey', apiKey);
  searchUrl.searchParams.set('name', normalizedName);
  if (platformId) searchUrl.searchParams.set('filter[platform]', String(platformId));

  let searchData;
  try {
    searchData = await apiFetchJson(searchUrl.toString());
  } catch (e) {
    return { ok: false, error: `TheGamesDB: ${apiErrorText(e)}` };
  }

  const candidates = theGamesDbList(searchData?.data?.games);

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

  // Szczegóły (opis, gatunki, liczba graczy) — opcjonalne; jeśli endpoint
  // zawiedzie, zostają dane z wyszukiwania.
  let details = best.item;
  try {
    const detailsUrl = new URL(`${THEGAMESDB_BASE}/Games/ByGameID`);
    detailsUrl.searchParams.set('apikey', apiKey);
    detailsUrl.searchParams.set('id', String(best.item.id));
    detailsUrl.searchParams.set(
      'fields',
      'players,publishers,genres,overview,last_updated,rating,platform,release_date'
    );
    const detailsData = await apiFetchJson(detailsUrl.toString());
    details = theGamesDbList(detailsData?.data?.games)[0] || details;
  } catch (_) {}

  const genreMap = await getTheGamesDbGenres(apiKey);
  const genres = Array.isArray(details?.genres)
    ? details.genres
        .map(id => genreMap[id] || genreMap[String(id)] || '')
        .filter(Boolean)
    : [];

  const imagesUrl = new URL(`${THEGAMESDB_BASE}/Games/Images`);
  imagesUrl.searchParams.set('apikey', apiKey);
  imagesUrl.searchParams.set('games_id', String(best.item.id));
  imagesUrl.searchParams.set('filter[type]', 'boxart');

  let remoteCover = null;
  try {
    const imagesData = await apiFetchJson(imagesUrl.toString());
    const baseUrl = imagesData?.data?.base_url?.original || '';
    const gameImages = imagesData?.data?.images?.[String(best.item.id)] || [];
    const front = gameImages.find(img => img.side === 'front') || gameImages[0];
    if (front?.filename && baseUrl) {
      remoteCover = baseUrl + front.filename;
    }
  } catch (_) {}

  let cover = remoteCover;
  if (remoteCover && window.launcherAPI?.cacheRemoteImage) {
    const platform = getPlatform(platformKey);
    const cached = await window.launcherAPI.cacheRemoteImage({
      url: remoteCover,
      platformKey,
      gameTitle: details.game_title || best.item.game_title || normalizedName,
      aspect: platform?.aspect || 'standard'
    });
    if (cached?.ok && cached.localUrl) cover = cached.localUrl;
  }

  const releaseDate = details?.release_date || best.item.release_date;
  const rating = Number(details?.rating ?? best.item.rating);
  const overview = details?.overview || '';

  return {
    ok: true,
    data: {
      title: details?.game_title || best.item.game_title || normalizedName,
      description: overview,
      desc_en: overview,
      desc_pl: '',
      genres,
      players: details?.players || '',
      communityRating: Number.isFinite(rating) && rating > 0 ? rating : null,
      year: releaseDate ? Number(String(releaseDate).slice(0, 4)) || '' : '',
      cover,
      remoteCover,
      source: 'TheGamesDB',
      sourceUrl: 'https://thegamesdb.net'
    }
  };
}

// ============================================================
// Scalenie wszystkich źródeł. Priorytet dla coveru: SteamGridDB ->
// TheGamesDB. Priorytet dla opisu/genres/rok: RAWG -> TheGamesDB.
// ScreenScraper został usunięty — wymagał czterech pól logowania
// i miał agresywne limity, a RAWG + TheGamesDB pokrywają to samo
// bez dodatkowej konfiguracji aplikacji.
// ============================================================

function settledSource(result) {
  if (result.status === 'fulfilled' && result.value?.ok) {
    return { data: result.value.data || {}, error: '' };
  }
  if (result.status === 'fulfilled') {
    return { data: {}, error: result.value?.error || 'Nieznany błąd źródła.' };
  }
  return { data: {}, error: result.reason?.message || 'Błąd sieci.' };
}

async function fetchCombinedGameMetadata(name, platformKey) {
  const [coverResult, rawgResult, gamesDbResult] = await Promise.allSettled([
    fetchSteamGridCoverByName(name, platformKey),
    fetchRawgMetadataByName(name),
    fetchTheGamesDbMetadataByName(name, platformKey)
  ]);

  const coverSource = settledSource(coverResult);
  const rawgSource = settledSource(rawgResult);
  const gamesDbSource = settledSource(gamesDbResult);

  const coverData = coverSource.data;
  const rawgData = rawgSource.data;
  const gdbData = gamesDbSource.data;

  const resolvedCover = coverData.cover || gdbData.cover || null;
  const resolvedRemoteCover = coverData.remoteCover || gdbData.remoteCover || null;
  const description = rawgData.description || gdbData.description || '';
  const genres = (Array.isArray(rawgData.genres) && rawgData.genres.length)
    ? rawgData.genres
    : (Array.isArray(gdbData.genres) ? gdbData.genres : []);
  const year = rawgData.year || gdbData.year || '';

  // Sam tytuł z wyszukiwarki nie jest jeszcze przydatnym metadanym.
  // Sukces liczymy tylko wtedy, gdy przyszła okładka, opis, gatunki,
  // rok albo ocena.
  const hasRealData = Boolean(
    resolvedCover ||
    description ||
    genres.length ||
    year ||
    rawgData.metacritic != null ||
    gdbData.communityRating != null
  );

  const errors = [coverSource.error, rawgSource.error, gamesDbSource.error].filter(Boolean);

  if (!hasRealData) {
    return {
      ok: false,
      error: errors.join(' | ') || 'Nie udało się pobrać metadanych z żadnego źródła.',
      errors
    };
  }

  const merged = {
    title: rawgData.title || coverData.title || gdbData.title || normalizeGameName(name),
    description,
    desc_pl: gdbData.desc_pl || '',
    desc_en: rawgData.desc_en || gdbData.desc_en || '',
    cover: resolvedCover,
    remoteCover: resolvedRemoteCover,
    fanart: '',
    wheel: '',
    video: '',
    genres,
    dev: rawgData.developer || '',
    year,
    metacritic: rawgData.metacritic ?? null,
    communityRating: gdbData.communityRating ?? null,
    players: gdbData.players || '',
    hltb: null,
    source: [
      coverData.source,
      rawgData.sourceMeta,
      gdbData.source
    ].filter(Boolean).join(' + '),
    sourceUrl: coverData.sourceUrl || gdbData.sourceUrl || '',
    sourceMetaUrl: rawgData.sourceMetaUrl || '',
    dimensions: coverData.dimensions || null
  };

  return { ok: true, data: merged, errors };
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
  let failed = 0;
  let lastError = '';

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

    // SteamGridDB i RAWG nie mają tak agresywnego limitu jak dawny
    // ScreenScraper, ale 350 ms nadal chroni przed 429 przy dużej bibliotece.
    await delay(350);

    if (result.ok) {
      if (!config.metadata[platformKey]) config.metadata[platformKey] = {};

      config.metadata[platformKey][game.id] = {
        ...existing,
        ...result.data
      };

      updated += 1;
      await saveStoredConfig();
    } else {
      failed += 1;
      lastError = result.error || lastError;
      console.warn('metadata: nie udało się pobrać dla', game.title, result.error);
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
    if (updated) {
      showToast(`Pobrano metadane dla ${updated} gier`);
    } else if (failed) {
      const detail = lastError ? `: ${truncateApiBody(lastError)}` : '';
      showToast(`Nie udało się pobrać metadanych${detail}`, true);
    } else {
      showToast('Nie było nowych metadanych do pobrania');
    }
  }

  return { updated, failed, lastError };
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
  if (!getSteamGridApiKey() && !getRawgApiKey() && !getTheGamesDbApiKey()) {
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
