// Obsługa zapisu kluczy API dla scraperów metadanych (zakładka "Okładki").
// Wzorzec identyczny do istniejącego handlera SteamGridDB — wszystkie
// wartości trafiają do config.apiKeys, skąd czytają je funkcje
// fetchSteamGridCoverByName / fetchRawgMetadataByName /
// fetchScreenScraperMetadataByName / fetchTheGamesDbMetadataByName.

function ensureApiKeysConfig() {
  if (!config.apiKeys || typeof config.apiKeys !== 'object') {
    config.apiKeys = {};
  }
}

function fillApiKeyFields() {
  ensureApiKeysConfig();

  const steamgridInput = document.getElementById('steamgrid-api-key-input');
  if (steamgridInput) steamgridInput.value = config.apiKeys.steamgrid || '';

  const rawgInput = document.getElementById('rawg-api-key-input');
  if (rawgInput) rawgInput.value = config.apiKeys.rawg || '';

  const screenscraperUserInput = document.getElementById('screenscraper-user-input');
  if (screenscraperUserInput) screenscraperUserInput.value = config.apiKeys.screenscraperUser || '';

  const screenscraperPasswordInput = document.getElementById('screenscraper-password-input');
  if (screenscraperPasswordInput) screenscraperPasswordInput.value = config.apiKeys.screenscraperPassword || '';

  const gamesDbInput = document.getElementById('thegamesdb-api-key-input');
  if (gamesDbInput) gamesDbInput.value = config.apiKeys.thegamesdb || '';
}

document.getElementById('save-steamgrid-api-key')?.addEventListener('click', async () => {
  ensureApiKeysConfig();
  const input = document.getElementById('steamgrid-api-key-input');
  config.apiKeys.steamgrid = input?.value.trim() || '';
  await saveStoredConfig();
  showToast('Zapisano klucz SteamGridDB ✔');
});

document.getElementById('save-rawg-api-key')?.addEventListener('click', async () => {
  ensureApiKeysConfig();
  const input = document.getElementById('rawg-api-key-input');
  config.apiKeys.rawg = input?.value.trim() || '';
  await saveStoredConfig();
  showToast('Zapisano klucz RAWG ✔');
});

document.getElementById('save-screenscraper-credentials')?.addEventListener('click', async () => {
  ensureApiKeysConfig();
  const userInput = document.getElementById('screenscraper-user-input');
  const passwordInput = document.getElementById('screenscraper-password-input');

  config.apiKeys.screenscraperUser = userInput?.value.trim() || '';
  config.apiKeys.screenscraperPassword = passwordInput?.value.trim() || '';

  await saveStoredConfig();
  showToast('Zapisano dane logowania ScreenScraper ✔');
});

document.getElementById('save-thegamesdb-api-key')?.addEventListener('click', async () => {
  ensureApiKeysConfig();
  const input = document.getElementById('thegamesdb-api-key-input');
  config.apiKeys.thegamesdb = input?.value.trim() || '';
  await saveStoredConfig();
  showToast('Zapisano klucz TheGamesDB ✔');
});

// Wywołaj przy każdym otwarciu zakładki "Okładki" (albo w renderSettings()
// / activateSettingsSubtab('artwork')), żeby pola pokazywały już zapisane
// wartości, a nie zawsze puste inputy.
function initApiKeyFieldsOnSettingsOpen() {
  fillApiKeyFields();
}
