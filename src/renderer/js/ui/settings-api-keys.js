// Obsługa zapisu i testowania kluczy API dla scraperów metadanych
// (zakładka "Okładki"). Wartości trafiają do config.apiKeys, skąd czytają
// je funkcje fetchSteamGridCoverByName / fetchRawgMetadataByName /
// fetchTheGamesDbMetadataByName.

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

  const gamesDbInput = document.getElementById('thegamesdb-api-key-input');
  if (gamesDbInput) gamesDbInput.value = config.apiKeys.thegamesdb || '';
}

async function saveApiKeyField(inputId, keyName, label) {
  ensureApiKeysConfig();
  const input = document.getElementById(inputId);
  config.apiKeys[keyName] = input?.value.trim() || '';
  await saveStoredConfig();
  showToast(`Zapisano klucz ${label} ✔`);
}

async function testApiKey(testFn, okFallback, failFallback) {
  if (typeof testFn !== 'function') {
    showToast(t(failFallback), true);
    return;
  }

  const result = await testFn();
  if (result.ok) {
    showToast((t(okFallback) || 'Połączenie działa ✓') + (result.message ? ` — ${result.message}` : ''));
  } else {
    showToast((t(failFallback) || 'Test nieudany') + ` — ${result.error || '?'}`, true);
  }
}

document.getElementById('save-steamgrid-api-key')?.addEventListener('click', () => {
  saveApiKeyField('steamgrid-api-key-input', 'steamgrid', 'SteamGridDB');
});

document.getElementById('test-steamgrid-api-key')?.addEventListener('click', async () => {
  await saveApiKeyField('steamgrid-api-key-input', 'steamgrid', 'SteamGridDB');
  await testApiKey(testSteamGridConnection, 'steamgridTestOk', 'steamgridTestFail');
});

document.getElementById('save-rawg-api-key')?.addEventListener('click', () => {
  saveApiKeyField('rawg-api-key-input', 'rawg', 'RAWG');
});

document.getElementById('test-rawg-api-key')?.addEventListener('click', async () => {
  await saveApiKeyField('rawg-api-key-input', 'rawg', 'RAWG');
  await testApiKey(testRawgConnection, 'rawgTestOk', 'rawgTestFail');
});

document.getElementById('save-thegamesdb-api-key')?.addEventListener('click', () => {
  saveApiKeyField('thegamesdb-api-key-input', 'thegamesdb', 'TheGamesDB');
});

document.getElementById('test-thegamesdb-api-key')?.addEventListener('click', async () => {
  await saveApiKeyField('thegamesdb-api-key-input', 'thegamesdb', 'TheGamesDB');
  await testApiKey(testTheGamesDbConnection, 'thegamesdbTestOk', 'thegamesdbTestFail');
});

// Wywołaj przy każdym otwarciu zakładki "Okładki" (albo w renderSettings()
// / activateSettingsSubtab('artwork')), żeby pola pokazywały już zapisane
// wartości, a nie zawsze puste inputy.
function initApiKeyFieldsOnSettingsOpen() {
  fillApiKeyFields();
}
