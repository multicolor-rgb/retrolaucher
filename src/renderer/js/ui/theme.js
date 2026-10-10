// System motywów graficznych.
// Każdy motyw to samodzielny plik CSS w katalogu themes/, aktywny po
// ustawieniu atrybutu data-theme na <html>. Wybór zapisujemy w
// config.uiState.theme (przez saveStoredConfig / loadStoredConfig).

const THEMES = [
  { id: 'default', i18nKey: 'themeDefault' },
  { id: 'wii', i18nKey: 'themeWii' },
  { id: 'switch', i18nKey: 'themeSwitch' },
  { id: 'ps3', i18nKey: 'themePs3' },
  { id: 'xbox', i18nKey: 'themeXbox' }
];

const ALLOWED_THEMES = THEMES.map(theme => theme.id);

function getSavedTheme() {
  const saved = config.uiState?.theme;
  return ALLOWED_THEMES.includes(saved) ? saved : 'default';
}

function setSavedTheme(themeId) {
  const next = ALLOWED_THEMES.includes(themeId) ? themeId : 'default';
  config.uiState = config.uiState || {};
  config.uiState.theme = next;
  return next;
}

// Ustawia motyw wizualnie (atrybut na <html>, bez zapisu konfiguracji).
function applyTheme(themeId) {
  const theme = ALLOWED_THEMES.includes(themeId) ? themeId : 'default';
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('theme-custom', theme !== 'default');
  return theme;
}

function populateThemeSelect() {
  const select = document.getElementById('theme-select');
  if (!select) return;

  select.innerHTML = '';
  THEMES.forEach(theme => {
    const opt = document.createElement('option');
    opt.value = theme.id;
    opt.textContent = t(theme.i18nKey) || theme.id;
    select.appendChild(opt);
  });

  select.value = getSavedTheme();
}

function bindThemeSettings() {
  const select = document.getElementById('theme-select');
  const btn = document.getElementById('save-theme');
  if (!select || !btn || btn.dataset.bound === 'true') return;

  select.value = getSavedTheme();

  // Podgląd na żywo — zmiana na liście od razu przełącza skórkę.
  select.addEventListener('change', () => applyTheme(select.value));

  btn.addEventListener('click', async () => {
    setSavedTheme(select.value);
    applyTheme(select.value);
    await saveStoredConfig();
    renderSettings();
    showToast(t('themeSaved') || 'Zapisano motyw ✓');
  });

  btn.dataset.bound = 'true';
}

function initTheme() {
  if (!config.uiState) config.uiState = {};
  applyTheme(getSavedTheme());
}
