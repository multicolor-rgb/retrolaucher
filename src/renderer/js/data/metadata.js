// Integracja z SteamGridDB i wzbogacanie metadanych.

function getSteamGridDimensionsForAspect(aspect) {
  switch (aspect) {
    case 'square':
      return '512x512';
    case 'wide':
      return '920x430';
    case 'bigpic':
      return '460x215';
    case 'psp':
      return '660x930';
    case 'standard':
    default:
      return '600x900';
  }
}

function getRawgApiKey() {
  return config.apiKeys?.rawg?.trim() || '';
}

function getSteamGridApiKey() {
  return config.apiKeys?.steamgrid?.trim() || '';
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
  const dimensions = getSteamGridDimensionsForAspect(aspect);

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

async function fetchCombinedGameMetadata(name, platformKey) {
  const [coverResult, rawgResult] = await Promise.allSettled([
    fetchSteamGridCoverByName(name, platformKey),
    fetchRawgMetadataByName(name)
  ]);

  const coverData =
    coverResult.status === 'fulfilled' && coverResult.value?.ok
      ? coverResult.value.data
      : {};

  const rawgData =
    rawgResult.status === 'fulfilled' && rawgResult.value?.ok
      ? rawgResult.value.data
      : {};

  const merged = {
    title: rawgData.title || coverData.title || normalizeGameName(name),
    description:
      rawgData.description ||
      'Gra dopasowana automatycznie na podstawie zewnętrznych baz danych.',
    cover: coverData.cover || null,
    remoteCover: coverData.remoteCover || null,
    genres: Array.isArray(rawgData.genres) ? rawgData.genres : [],
    dev: rawgData.developer || '',
    year: rawgData.year || '',
    metacritic: rawgData.metacritic ?? null,
    hltb: null,
    source: [
      coverData.source,
      rawgData.sourceMeta
    ].filter(Boolean).join(' + '),
    sourceUrl: coverData.sourceUrl || '',
    sourceMetaUrl: rawgData.sourceMetaUrl || '',
    dimensions: coverData.dimensions || null
  };

  if (!merged.cover && !merged.description && merged.metacritic == null) {
    return { ok: false, error: 'Nie udało się pobrać metadanych.' };
  }

  return { ok: true, data: merged };
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
      continue;
    }

    const result = await fetchCombinedGameMetadata(
      game.title || game.name || game.file || game.rom,
      platformKey
    );

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
  }

  setTimeout(() => {
    if (progressEl) progressEl.hidden = true;
  }, 800);

  await refreshLibrary();
  renderShelf();
  showToast(updated ? `Pobrano metadane dla ${updated} gier` : 'Nie było nowych metadanych do pobrania');
}