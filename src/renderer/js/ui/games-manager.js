// Menedżer gier — ukrywanie/odkrywanie plików z listy, osobno per platforma.
//
// Korzysta z globalnej tablicy `scannedGames` (pełna lista plików z ostatniego
// skanowania, razem z ukrytymi) ORAZ z helperów z storage.js:
//   getHiddenGames(), isGameHidden(), setGameHidden(), toggleGameHidden().

function getGamesManagerPlatformSelect() {
  return document.getElementById('games-manager-platform');
}

function getGamesManagerSearchInput() {
  return document.getElementById('games-manager-search');
}

function getGamesManagerPlatform() {
  return getGamesManagerPlatformSelect()?.value || '';
}

function getScannedGamesForPlatform(platformKey) {
  if (!platformKey) return [];
  return scannedGames.filter(g => g.platform === platformKey);
}

function countHiddenForPlatform(platformKey) {
  return getScannedGamesForPlatform(platformKey)
    .filter(g => isGameHidden(platformKey, g.id))
    .length;
}

function getManagerSearchValue() {
  return (getGamesManagerSearchInput()?.value || '').trim().toLowerCase();
}

function matchesManagerSearch(game, search) {
  if (!search) return true;

  const title = normalizeGameName(getDisplayTitle(game)).toLowerCase();
  const file = String(game.fileName || game.file || '').toLowerCase();

  return title.includes(normalizeGameName(search).toLowerCase()) || file.includes(search);
}

function getManagerFilteredGames(all, search) {
  if (!search) return all;
  return all.filter(g => matchesManagerSearch(g, search));
}

// ------------------------------------------------------------
// Zaznaczanie wielu wierszy (checkboxy)
// ------------------------------------------------------------

// Zaznaczone gry bieżącej platformy (klucz = game.id).
const gamesManagerSelection = new Set();

function getGamesManagerRowCheckbox(row) {
  return Array.from(row.children)
    .find(c => (c.className || '').includes('gm-check')) || null;
}

function getGamesManagerRows() {
  const list = document.getElementById('games-manager-list');
  if (!list) return [];
  return Array.from(list.children).filter(c => (c.className || '').includes('gm-row'));
}

// Ustawia stan checkboxa „Zaznacz wszystkie" (z uwzględnieniem stanu częściowego).
function syncGamesManagerSelectAll() {
  const selectAll = document.getElementById('games-manager-select-all');
  if (!selectAll) return;

  const rows = getGamesManagerRows();
  const total = rows.length;
  const selected = rows.filter(r => {
    const cb = getGamesManagerRowCheckbox(r);
    return cb && cb.checked;
  }).length;

  selectAll.checked = total > 0 && selected === total;
  selectAll.indeterminate = selected > 0 && selected < total;
}

// Odświeża tekst podsumowania (liczba pozycji, ukrytych i zaznaczonych).
function updateGamesManagerSummary() {
  const list = document.getElementById('games-manager-list');
  if (!list) return;

  const summaryEl = Array.from(list.children)
    .find(c => (c.className || '').includes('gm-summary'));
  if (!summaryEl) return;

  const platformKey = getGamesManagerPlatform();
  const all = getScannedGamesForPlatform(platformKey);
  const items = getManagerFilteredGames(all, getManagerSearchValue());
  const hiddenCount = countHiddenForPlatform(platformKey);
  const selectedCount = items.filter(g => gamesManagerSelection.has(g.id)).length;

  summaryEl.textContent =
    `${items.length} / ${all.length} • ${hiddenCount} ${t('platformHiddenCount') || 'ukryte'} • `
    + `${selectedCount} ${t('selectedCount') || 'zaznaczone'}`;
}

// Wypełnia selektor platformy. W opcjach pokazuje liczbę ukrytych plików,
// żeby od razu było widać, gdzie coś schowano.
function populateGamesManagerPlatformSelect() {
  const select = getGamesManagerPlatformSelect();
  if (!select) return;

  const previous = select.value || activePlatform;

  select.innerHTML = '';

  config.platforms.forEach(p => {
    const hiddenCount = countHiddenForPlatform(p.key);

    const opt = document.createElement('option');
    opt.value = p.key;
    opt.textContent = hiddenCount
      ? `${p.label} — ${hiddenCount} ${t('platformHiddenCount') || 'ukryte'}`
      : p.label;

    select.appendChild(opt);
  });

  const allowed = config.platforms.map(p => p.key);
  const preferred = allowed.includes(previous)
    ? previous
    : (allowed.includes(activePlatform) ? activePlatform : allowed[0]);

  if (preferred) select.value = preferred;
}

function buildGamesManagerRow(game) {
  const hidden = isGameHidden(game.platform, game.id);

  const row = document.createElement('div');
  row.className = 'gm-row' + (hidden ? ' is-hidden' : '');

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'gm-check';
  check.checked = gamesManagerSelection.has(game.id);
  check.dataset.gameId = game.id;
  check.addEventListener('change', () => {
    if (check.checked) gamesManagerSelection.add(game.id);
    else gamesManagerSelection.delete(game.id);

    updateGamesManagerSummary();
    syncGamesManagerSelectAll();
  });

  const info = document.createElement('div');
  info.className = 'gm-info';

  const title = document.createElement('strong');
  title.textContent = getDisplayTitle(game);
  title.title = getDisplayTitle(game);

  const path = document.createElement('span');
  path.textContent = game.fileName || game.file || '';
  path.title = game.file || '';

  info.appendChild(title);
  info.appendChild(path);

  const size = document.createElement('span');
  size.className = 'gm-size';
  size.textContent = formatBytes(game.fileSize);

  const badge = document.createElement('span');
  badge.className = 'gm-badge' + (hidden ? ' is-hidden' : '');
  badge.textContent = hidden
    ? (t('hiddenBadge') || 'Ukryta')
    : (t('visibleBadge') || 'Widoczna');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'gm-toggle' + (hidden ? ' is-hidden' : '');
  toggle.textContent = hidden
    ? (t('unhideGame') || 'Odkryj')
    : (t('hideGame') || 'Ukryj');

  toggle.addEventListener('click', async () => {
    toggleGameHidden(game.platform, game.id);
    await refreshLibrary();
    await saveStoredConfig();
    populateGamesManagerPlatformSelect();
    renderGamesManagerList();
    showToast(t('hiddenGamesSaved') || 'Zapisano stan ukrycia');
  });

  row.appendChild(check);
  row.appendChild(info);
  row.appendChild(size);
  row.appendChild(badge);
  row.appendChild(toggle);

  return row;
}

function renderGamesManagerList() {
  const list = document.getElementById('games-manager-list');
  if (!list) return;

  const platformKey = getGamesManagerPlatform();
  const search = getManagerSearchValue();

  list.innerHTML = '';

  if (!platformKey) {
    list.innerHTML = `<div class="gm-empty">${t('managerPlatform') || 'Platforma'}</div>`;
    syncGamesManagerSelectAll();
    return;
  }

  const all = getScannedGamesForPlatform(platformKey);

  // Zaznaczenie trzymamy tylko dla plików istniejących na bieżącej platformie.
  const platformIds = new Set(all.map(g => g.id));
  [...gamesManagerSelection].forEach(id => {
    if (!platformIds.has(id)) gamesManagerSelection.delete(id);
  });

  if (!all.length) {
    list.innerHTML = `<div class="gm-empty">${t('noScannedGames') || 'Brak plików'}</div>`;
    syncGamesManagerSelectAll();
    return;
  }

  const items = getManagerFilteredGames(all, search);

  if (!items.length) {
    list.innerHTML = `<div class="gm-empty">${t('noGamesForPlatform') || 'Brak gier'}</div>`;
    syncGamesManagerSelectAll();
    return;
  }

  const summary = document.createElement('div');
  summary.className = 'gm-summary';
  list.appendChild(summary);

  items.forEach(game => list.appendChild(buildGamesManagerRow(game)));

  updateGamesManagerSummary();
  syncGamesManagerSelectAll();
}

async function setGamesManagerHiddenBulk(hidden) {
  const platformKey = getGamesManagerPlatform();
  if (!platformKey) return;

  const all = getScannedGamesForPlatform(platformKey);
  const items = getManagerFilteredGames(all, getManagerSearchValue());

  if (!items.length) return;

  items.forEach(game => setGameHidden(platformKey, game.id, hidden));
  gamesManagerSelection.clear();

  await refreshLibrary();
  await saveStoredConfig();
  populateGamesManagerPlatformSelect();
  renderGamesManagerList();

  showToast(t('hiddenGamesSaved') || 'Zapisano stan ukrycia');
}

// Ukrywa/odkrywa wyłącznie wiersze zaznaczone checkboxami.
async function setGamesManagerSelectedHidden(hidden) {
  const platformKey = getGamesManagerPlatform();
  if (!platformKey) return;

  const all = getScannedGamesForPlatform(platformKey);
  const items = all.filter(g => gamesManagerSelection.has(g.id));

  if (!items.length) {
    showToast(t('managerNoSelection') || 'Zaznacz gry, aby wykonać akcję');
    return;
  }

  items.forEach(game => setGameHidden(platformKey, game.id, hidden));
  gamesManagerSelection.clear();

  await refreshLibrary();
  await saveStoredConfig();
  populateGamesManagerPlatformSelect();
  renderGamesManagerList();

  showToast(t('hiddenGamesSaved') || 'Zapisano stan ukrycia');
}

function bindGamesManager() {
  const select = getGamesManagerPlatformSelect();
  const search = getGamesManagerSearchInput();
  const selectAll = document.getElementById('games-manager-select-all');
  const hideSelected = document.getElementById('games-manager-hide-selected');
  const unhideSelected = document.getElementById('games-manager-unhide-selected');
  const hideAll = document.getElementById('games-manager-hide-all');
  const unhideAll = document.getElementById('games-manager-unhide-all');

  if (select && select.dataset.bound !== 'true') {
    select.addEventListener('change', renderGamesManagerList);
    select.dataset.bound = 'true';
  }

  if (search && search.dataset.bound !== 'true') {
    search.addEventListener('input', renderGamesManagerList);
    search.dataset.bound = 'true';
  }

  if (selectAll && selectAll.dataset.bound !== 'true') {
    selectAll.addEventListener('change', () => {
      const want = selectAll.checked;

      getGamesManagerRows().forEach(row => {
        const cb = getGamesManagerRowCheckbox(row);
        if (!cb) return;

        cb.checked = want;

        const id = cb.dataset.gameId;
        if (want) gamesManagerSelection.add(id);
        else gamesManagerSelection.delete(id);
      });

      updateGamesManagerSummary();
      syncGamesManagerSelectAll();
    });
    selectAll.dataset.bound = 'true';
  }

  if (hideSelected && hideSelected.dataset.bound !== 'true') {
    hideSelected.addEventListener('click', () => setGamesManagerSelectedHidden(true));
    hideSelected.dataset.bound = 'true';
  }

  if (unhideSelected && unhideSelected.dataset.bound !== 'true') {
    unhideSelected.addEventListener('click', () => setGamesManagerSelectedHidden(false));
    unhideSelected.dataset.bound = 'true';
  }

  if (hideAll && hideAll.dataset.bound !== 'true') {
    hideAll.addEventListener('click', () => setGamesManagerHiddenBulk(true));
    hideAll.dataset.bound = 'true';
  }

  if (unhideAll && unhideAll.dataset.bound !== 'true') {
    unhideAll.addEventListener('click', () => setGamesManagerHiddenBulk(false));
    unhideAll.dataset.bound = 'true';
  }
}

// Odświeża panel menedżera (np. przy wejściu w zakładkę „Gry").
function refreshGamesManager() {
  populateGamesManagerPlatformSelect();
  bindGamesManager();
  renderGamesManagerList();
}

