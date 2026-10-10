function getArtworkSettingsPlatform() {
  const select = document.getElementById('artwork-platform-select');
  return select?.value || 'all';
}

function getManualCoverPlatform() {
  const select = document.getElementById('manual-cover-platform');
  return select?.value || 'all';
}

function populateArtworkPlatformSelect() {
  const select = document.getElementById('artwork-platform-select');
  if (!select) return;

  const current = select.value || 'all';
  select.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = t('allPlatforms') || 'Wszystkie platformy';
  select.appendChild(allOpt);

  config.platforms.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.key;
    opt.textContent = p.label;
    select.appendChild(opt);
  });

  const allowed = ['all', ...config.platforms.map(p => p.key)];
  select.value = allowed.includes(current) ? current : 'all';
}

function populateManualCoverPlatformSelect() {
  const select = document.getElementById('manual-cover-platform');
  if (!select) return;

  const preferred = select.value || activePlatform || 'all';
  select.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = t('choosePlatform') || 'Wybierz platformę';
  select.appendChild(allOpt);

  config.platforms.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.key;
    opt.textContent = p.label;
    select.appendChild(opt);
  });

  const allowed = ['all', ...config.platforms.map(p => p.key)];
  select.value = allowed.includes(preferred) ? preferred : 'all';
}

function renderSettingsWarning() {
  const warning = document.getElementById('settings-warning');
  if (!warning) return;
  warning.textContent = t('artworkWarning') ||
    'Okładki i opisy są pobierane z SteamGridDB. W ustawieniach możesz wybrać jedną platformę albo wszystkie naraz. Dla każdej platformy możesz też ustawić własny typ proporcji okładki oraz ręcznie podmienić cover wybranej gry.';
}

function populateManualCoverGameSelect() {
  const select = document.getElementById('manual-cover-game');
  const platformKey = getManualCoverPlatform();
  if (!select) return [];

  const platformGames = games.filter(g => platformKey !== 'all' ? g.platform === platformKey : false);
  const previousValue = select.value || '';
  select.innerHTML = '';

  if (!platformGames.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = platformKey === 'all'
      ? (t('choosePlatformFirst') || 'Najpierw wybierz platformę w panelu okładek')
      : (t('noGamesForPlatform') || 'Brak gier dla tej platformy');
    select.appendChild(opt);
    return [];
  }

  platformGames.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = getDisplayTitle(g);
    select.appendChild(opt);
  });

  const exists = platformGames.some(g => g.id === previousValue);
  select.value = exists ? previousValue : platformGames[0].id;
  return platformGames;
}

function renderManualCoverPreview() {
  const preview = document.getElementById('manual-cover-preview');
  const platformKey = getManualCoverPlatform();
  const select = document.getElementById('manual-cover-game');
  const input = document.getElementById('manual-cover-url');
  const saveUrlBtn = document.getElementById('save-manual-cover-url');
  const pickFileBtn = document.getElementById('pick-manual-cover-file');
  const clearBtn = document.getElementById('clear-manual-cover');

  if (!preview || !select || !input) return;

  const disableEditing = platformKey === 'all';
  input.disabled = disableEditing;
  select.disabled = disableEditing;
  if (saveUrlBtn) saveUrlBtn.disabled = disableEditing;
  if (pickFileBtn) pickFileBtn.disabled = disableEditing;
  if (clearBtn) clearBtn.disabled = disableEditing;

  if (disableEditing) {
    preview.classList.add('empty');
    preview.innerHTML = t('choosePlatformToEdit') || 'Wybierz konkretną platformę, aby edytować ręczne okładki.';
    input.value = '';
    return;
  }

  const game = games.find(g => g.id === select.value && g.platform === platformKey);
  if (!game) {
    preview.classList.add('empty');
    preview.innerHTML = t('chooseGameFromList') || 'Wybierz grę z listy.';
    input.value = '';
    return;
  }

  const manual = getManualCover(game.platform, game.id);
  input.value = manual || '';
  preview.classList.remove('empty');
  preview.innerHTML = `
    <img src="${getCoverForGame(game)}" alt="${getDisplayTitle(game)}" />
    <div class="manual-cover-meta">
      <strong>${getDisplayTitle(game)}</strong>
      <span>${manual ? (t('sourceManual') || 'Źródło: ręczne') : (t('sourceAuto') || 'Źródło: SteamGridDB / automatyczne')}</span>
      <span>${manual || (t('noManualCover') || 'Brak ręcznego URL lub pliku.')}</span>
    </div>
  `;
}

async function saveManualCoverFromUrl() {
  const platformKey = getManualCoverPlatform();

  if (platformKey === 'all') {
    showToast(t('choosePlatformFirst') || 'Najpierw wybierz konkretną platformę w panelu okładek', true);
    return;
  }

  const select = document.getElementById('manual-cover-game');
  const input = document.getElementById('manual-cover-url');
  const gameId = select?.value || '';
  const value = (input?.value || '').trim();

  if (!gameId || !value) {
    showToast(t('chooseGameAndUrl') || 'Wybierz grę i wpisz URL okładki', true);
    return;
  }

  const game = games.find(g => g.id === gameId && g.platform === platformKey);
  if (!game) {
    showToast(t('gameNotFound') || 'Nie znaleziono gry', true);
    return;
  }

  setManualCover(game.platform, game.id, value);
  await saveStoredConfig();
  await refreshLibrary();
  populateManualCoverGameSelect();

  const manualCoverSelect = document.getElementById('manual-cover-game');
  if (manualCoverSelect) manualCoverSelect.value = gameId;

  renderManualCoverPreview();
  showToast(t('savedManualCoverUrl') || 'Zapisano ręczny URL okładki');
}

async function pickManualCoverFile() {
  const platformKey = getManualCoverPlatform();

  if (platformKey === 'all') {
    showToast(t('choosePlatformFirst') || 'Najpierw wybierz konkretną platformę w panelu okładek', true);
    return;
  }

  const select = document.getElementById('manual-cover-game');
  const gameId = select?.value || '';
  if (!gameId) {
    showToast(t('chooseGameFirst') || 'Najpierw wybierz grę', true);
    return;
  }

  const game = games.find(g => g.id === gameId && g.platform === platformKey);
  if (!game) {
    showToast(t('gameNotFound') || 'Nie znaleziono gry', true);
    return;
  }

  const api = window.launcherAPI;
  const picker = api?.selectImageFile || api?.selectFile;

  if (!picker) {
    showToast(t('noFilePicker') || 'Brak natywnego okna wyboru pliku w launcherAPI', true);
    return;
  }

  let picked;
  try {
    picked = await picker.call(api);
  } catch (e) {
    showToast(t('filePickerError') || 'Nie udało się otworzyć okna wyboru pliku', true);
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
  showToast(t('savedManualCoverFile') || 'Zapisano ręczny plik okładki');
}

async function clearManualCover() {
  const platformKey = getManualCoverPlatform();

  if (platformKey === 'all') {
    showToast(t('choosePlatformFirst') || 'Najpierw wybierz konkretną platformę w panelu okładek', true);
    return;
  }

  const select = document.getElementById('manual-cover-game');
  const gameId = select?.value || '';
  if (!gameId) {
    showToast(t('chooseGameFirst') || 'Najpierw wybierz grę', true);
    return;
  }

  const game = games.find(g => g.id === gameId && g.platform === platformKey);
  if (!game) {
    showToast(t('gameNotFound') || 'Nie znaleziono gry', true);
    return;
  }

  setManualCover(game.platform, game.id, '');
  await saveStoredConfig();
  await refreshLibrary();
  populateManualCoverGameSelect();

  const manualCoverSelect = document.getElementById('manual-cover-game');
  if (manualCoverSelect) manualCoverSelect.value = gameId;

  renderManualCoverPreview();
  showToast(t('removedManualCover') || 'Usunięto ręczną okładkę');
}

async function fetchMetadataForSelectedPlatforms(force = false) {
  const selectedPlatform = getArtworkSettingsPlatform();

  if (selectedPlatform === 'all') {
    const platformKeys = config.platforms.map(p => p.key);
    if (!platformKeys.length) {
      showToast(t('noPlatformsToFetch') || 'Brak platform do pobrania', true);
      return;
    }

    for (const platformKey of platformKeys) {
      await enrichPlatformMetadata(platformKey, force);
    }

    await refreshLibrary();
    showToast(
      force
        ? (t('refreshedAllPlatforms') || 'Odświeżono dane dla wszystkich platform')
        : (t('fetchedAllPlatforms') || 'Pobrano dane dla wszystkich platform')
    );
    return;
  }

  await enrichPlatformMetadata(selectedPlatform, force);
  await refreshLibrary();
}

function renderSettings() {
  renderSettingsWarning();

  const steamgridInput = document.getElementById('steamgrid-api-key-input');
  if (steamgridInput) steamgridInput.value = config.apiKeys?.steamgrid || '';
if (typeof fillApiKeyFields === 'function') fillApiKeyFields();

  const fsSel = document.getElementById('fullscreen-on-launch');
  if (fsSel) fsSel.value = String(!!config.uiState?.fullscreenOnLaunch);

  populateArtworkPlatformSelect();
  populateManualCoverPlatformSelect();

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
        <button type="button" class="remove-platform-btn" data-key="${p.key}" title="${t('removePlatform') || 'Usuń platformę'}">✕</button>
      </div>
      <div class="field-row">
        <div class="field-label">${t('romFolder') || 'Folder z ROM-ami'}</div>
        <div class="field-input ${romPath ? '' : 'empty'}">${romPath || (t('notSet') || 'Nie ustawiono')}</div>
        <button type="button" class="browse-btn" data-type="rom" data-key="${p.key}">${t('chooseFolder') || 'Wybierz folder…'}</button>
      </div>
      <div class="field-row field-row-stack">
        <div class="field-label">${t('launchCommand') || 'Polecenie uruchomieniowe'}</div>
        <input
          type="text"
          class="field-textinput"
          data-emulator-input="${p.key}"
          value="${emuPath || ''}"
          placeholder="${DEFAULT_LAUNCH_PLACEHOLDER}"
        />
        <button type="button" class="browse-btn" data-type="emu" data-key="${p.key}">${t('chooseFile') || 'Wybierz plik…'}</button>
      </div>
      <div class="field-row field-row-stack">
        <div class="field-label">${t('defaultArgs') || 'Domyślne argumenty'}</div>
        <input
          type="text"
          class="field-textinput"
          data-args-input="${p.key}"
          value="${launchArgs || ''}"
          placeholder="${t('argsPlaceholder') || 'Np. --fullscreen --fastboot'}"
        />
        <button type="button" class="test-launch-btn" data-key="${p.key}">${t('test') || 'Testuj'}</button>
      </div>
      <div class="field-row field-row-stack">
        <div class="field-label">${t('coverType') || 'Typ okładki'}</div>
        <select class="field-select" data-aspect-input="${p.key}">
          <option value="standard" ${aspect === 'standard' ? 'selected' : ''}>${t('standard') || 'Standard'}</option>
          <option value="psp" ${aspect === 'psp' ? 'selected' : ''}>${t('pspNarrow') || 'PSP / wąska'}</option>
          <option value="square" ${aspect === 'square' ? 'selected' : ''}>${t('square') || 'Kwadrat'}</option>
          <option value="wide" ${aspect === 'wide' ? 'selected' : ''}>${t('wide') || 'Szeroka'}</option>
          <option value="bigpic" ${aspect === 'bigpic' ? 'selected' : ''}>${t('steamBigPicture') || 'Steam Big Picture'}</option>
        </select>
      </div>
    `;
    platformBlocks.appendChild(block);
  });

  const saveStartupBtn = document.getElementById('save-startup-settings');
  if (saveStartupBtn) {
    saveStartupBtn.onclick = async () => {
      config.uiState.fullscreenOnLaunch =
        document.getElementById('fullscreen-on-launch')?.value === 'true';
      await saveStoredConfig();
      showToast(t('savedStartupSettings') || 'Zapisano ustawienia startu');
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
        showToast(t('savedRomFolder') || 'Zapisano folder z ROM-ami');
      } else {
        config.emulators[key] = picked;
        await saveStoredConfig();
        renderSettings();
        showToast(t('savedLaunchCommand') || 'Zapisano polecenie uruchomieniowe');
      }
    };
  });

  document.querySelectorAll('[data-emulator-input]').forEach(el => {
    el.oninput = () => {
      config.emulators[el.dataset.emulatorInput] = el.value;
      saveStoredConfig();
    };
  });

  document.querySelectorAll('[data-args-input]').forEach(el => {
    el.oninput = () => {
      config.launchArgs[el.dataset.argsInput] = el.value;
      saveStoredConfig();
    };
  });

  document.querySelectorAll('[data-aspect-input]').forEach(el => {
    el.onchange = async () => {
      const key = el.dataset.aspectInput;
      const platform = getPlatform(key);
      if (!platform) return;
      platform.aspect = el.value;
      await saveStoredConfig();
      renderShelf();
      renderManualCoverPreview();
      showToast(t('savedCoverType') || 'Zapisano typ okładki');
    };
  });

  document.querySelectorAll('.test-launch-btn').forEach(btn => {
    btn.onclick = async () => {
      const key = btn.dataset.key;
      const emulatorPath = config.emulators[key] || '';
      const rawArgs = config.launchArgs[key] || '';
      const extraArgs = parseArgString(rawArgs);

      if (!window.launcherAPI?.testEmulator) {
        showToast(t('noTestBridge') || 'Brak mostka IPC do testu uruchomienia', true);
        return;
      }

      const result = await window.launcherAPI.testEmulator({
        emulatorPath,
        extraArgs
      });

      if (result?.ok) showToast(t('testCommandLaunched') || 'Polecenie testowe uruchomione');
      else showToast(result?.error || (t('testFailed') || 'Test nieudany'), true);
    };
  });

  const langSel = document.getElementById('language-select');
  if (langSel) langSel.value = getSavedLanguage();

  populateThemeSelect();

  bindLanguageSettings();
  bindThemeSettings();
  applyI18n();

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
      showToast(t('platformRemoved') || 'Usunięto platformę');

      renderSettings();
      renderTabs();

      const artworkPlatformSelect = document.getElementById('artwork-platform-select');
      const manualPlatformSelect = document.getElementById('manual-cover-platform');
      const removedWasActive = activePlatform === key;

      if (artworkPlatformSelect && artworkPlatformSelect.value === key) {
        artworkPlatformSelect.value = 'all';
      }

      if (manualPlatformSelect && manualPlatformSelect.value === key) {
        manualPlatformSelect.value = 'all';
      }

      if (removedWasActive) {
        activePlatform = 'all';
        await refreshLibrary();
      } else {
        renderManualCoverPreview();
      }
    };
  });

  const steamgridSaveBtn = document.getElementById('save-steamgrid-api-key');
  if (steamgridSaveBtn) {
    steamgridSaveBtn.onclick = async () => {
      const input = document.getElementById('steamgrid-api-key-input');
      config.apiKeys.steamgrid = (input?.value || '').trim();
      await saveStoredConfig();
      showToast(t('savedSteamgridKey') || 'Zapisano klucz SteamGridDB API');
    };
  }

  const artworkPlatformSelect = document.getElementById('artwork-platform-select');
  if (artworkPlatformSelect) {
    artworkPlatformSelect.onchange = () => {
      const selected = artworkPlatformSelect.value || 'all';
      const manualPlatformSelect = document.getElementById('manual-cover-platform');

      if (manualPlatformSelect) {
        manualPlatformSelect.value = selected;
      }

      populateManualCoverGameSelect();
      renderManualCoverPreview();
    };
  }

  const manualCoverPlatformSelect = document.getElementById('manual-cover-platform');
  if (manualCoverPlatformSelect) {
    manualCoverPlatformSelect.onchange = () => {
      populateManualCoverGameSelect();
      renderManualCoverPreview();
    };
  }

  const manualCoverSelect = document.getElementById('manual-cover-game');
  populateManualCoverGameSelect();

  const manualCoverUrlBtn = document.getElementById('save-manual-cover-url');
  const manualCoverFileBtn = document.getElementById('pick-manual-cover-file');
  const manualCoverClearBtn = document.getElementById('clear-manual-cover');

  renderManualCoverPreview();

  if (manualCoverSelect) {
    manualCoverSelect.onchange = () => renderManualCoverPreview();
  }

  if (manualCoverUrlBtn) manualCoverUrlBtn.onclick = saveManualCoverFromUrl;
  if (manualCoverFileBtn) manualCoverFileBtn.onclick = pickManualCoverFile;
  if (manualCoverClearBtn) manualCoverClearBtn.onclick = clearManualCover;

  const bulkMetaBtn = document.getElementById('bulk-fetch-platform-meta');
  if (bulkMetaBtn) {
    bulkMetaBtn.onclick = async () => {
      await fetchMetadataForSelectedPlatforms(false);
    };
  }

  const forceMetaBtn = document.getElementById('force-fetch-platform-meta');
  if (forceMetaBtn) {
    forceMetaBtn.onclick = async () => {
      await fetchMetadataForSelectedPlatforms(true);
    };
  }

  // Panel „Menedżer gier" (ukrywanie plików per platforma).
  if (typeof refreshGamesManager === 'function') {
    refreshGamesManager();
  }
}

function activateSettingsSubtab(name) {
  const tabs = [...document.querySelectorAll('.settings-subtab')];
  const panels = [...document.querySelectorAll('.settings-subpanel')];

  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.subtab === name);
    t.setAttribute('aria-selected', String(t.dataset.subtab === name));
  });

  panels.forEach(p => p.classList.toggle('active', p.dataset.subpanel === name));

  if (name === 'games' && typeof refreshGamesManager === 'function') {
    refreshGamesManager();
  }
}

function switchToPage(page) {
  const shelfView = document.querySelector('[data-view="shelf"]');
  const navSettings = document.getElementById('navSettings');
  const navHome = document.getElementById('navHome');
  const overlay = document.getElementById('overlay');
  const shelf = document.querySelector('.shelf');
  const shelfInfo = document.querySelector('.shelf-info');

  if (shelfView) shelfView.hidden = page === 'settings';
  if (settingsPanel) settingsPanel.hidden = page !== 'settings';

  if (page !== 'settings') {
    overlay?.classList.remove('open');
    shelf?.classList.remove('switching');
    shelfInfo?.classList.remove('switching');
    renderShelf?.();
    renderManualCoverPreview?.();
  }

  if (navSettings) navSettings.classList.toggle('active-view', page === 'settings');
  if (navHome) navHome.classList.toggle('active-view', page !== 'settings');

  config.uiState.settingsOpen = page === 'settings';
  location.hash = page === 'settings' ? '#settings' : '#home';
}

function getSavedLanguage() {
  return config.uiState?.language === 'en' ? 'en' : 'pl';
}

function setSavedLanguage(lang) {
  const next = lang === 'en' ? 'en' : 'pl';
  config.uiState = config.uiState || {};
  config.uiState.language = next;
  return next;
}

function t(key) {
  const lang = getSavedLanguage();
  return I18N[lang]?.[key] || I18N.pl[key] || key;
}

function bindLanguageSettings() {
  const select = document.getElementById('language-select');
  const btn = document.getElementById('save-language');
  if (!select || !btn || btn.dataset.bound === 'true') return;

  select.value = getSavedLanguage();

  btn.addEventListener('click', async () => {
    setSavedLanguage(select.value);
    await saveStoredConfig();
    applyI18n();
    renderSettings();
    renderShelf();
    showToast(getSavedLanguage() === 'en' ? (t('languageSavedEn') || 'Language saved ✓') : (t('languageSavedPl') || 'Zapisano język ✓'));
  });

  btn.dataset.bound = 'true';
}

function applyI18n() {
  const lang = getSavedLanguage();
  const dict = I18N[lang] || I18N.pl;

  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key] != null) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    if (dict[key] != null) el.title = dict[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key] != null) el.placeholder = dict[key];
  });

  applyLanguageToUI();
}

function applyLanguageToUI() {
  const lang = getSavedLanguage();

  const navHome = document.getElementById('navHome');
  const navSettings = document.getElementById('navSettings');
  const search = document.getElementById('search');
  const playBtn = document.getElementById('playBtn');
  const detailsBtn = document.getElementById('detailsBtn');
  const modalPlayBtn = document.getElementById('modalPlayBtn');
  const modalCoverBtn = document.getElementById('modalCoverBtn');
  const languageLabel = document.getElementById('language-label');
  const languageCardTitle = document.getElementById('language-card-title');
  const languageCardNote = document.getElementById('language-card-note');

  if (navHome) navHome.title = t('library');
  if (navSettings) navSettings.title = t('settings');
  if (search) search.placeholder = t('search');
  if (playBtn) playBtn.textContent = `▶ ${t('launch')}`;
  if (detailsBtn) detailsBtn.textContent = t('details');
  if (modalPlayBtn) modalPlayBtn.textContent = `▶ ${t('playGame')}`;
  if (modalCoverBtn) modalCoverBtn.textContent = `🖼 ${t('setCover')}`;
  if (languageLabel) languageLabel.textContent = t('languageInterface');
  if (languageCardTitle) languageCardTitle.textContent = t('language');
  if (languageCardNote) languageCardNote.textContent =
    lang === 'en'
      ? 'Choose the application interface language.'
      : 'Wybierz język interfejsu aplikacji.';
}

function initLanguage() {
  if (!config.uiState) config.uiState = {};
  if (!config.uiState.language) config.uiState.language = 'pl';
  applyI18n();
}