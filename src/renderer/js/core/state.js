// Stan globalny aplikacji i stałe konfiguracyjne.

const games = [];

let config = {
  platforms: [
    {
      key: 'psp',
      label: 'PlayStation Portable',
      color: '#ffb450',
      icon: '🎮',
      extensions: ['.iso', '.cso', '.pbp', '.chd'],
      aspect: 'psp'
    },
    {
      key: 'ps2',
      label: 'PlayStation 2',
      color: '#64b4ff',
      icon: '🔒️',
      extensions: ['.iso', '.bin'],
      aspect: 'standard'
    },
    {
      key: 'psx',
      label: 'PlayStation (PSX)',
      color: '#c88cff',
      icon: '💕',
      extensions: ['.bin', '.cue', '.img'],
      aspect: 'standard'
    },
    {
      key: 'ps3',
      label: 'PlayStation 3',
      color: '#78ffb4',
      icon: '📀',
      extensions: ['.iso', '.pkg'],
      aspect: 'wide'
    },
    {
      key: 'snes',
      label: 'Super Nintendo',
      color: '#ff8ca8',
      icon: '🔥',
      extensions: ['.sfc', '.smc'],
      aspect: 'square'
    },
    {
      key: 'nds',
      label: 'Nintendo DS',
      color: '#8cffe0',
      icon: '📱',
      extensions: ['.nds'],
      aspect: 'psp'
    },
    {
      key: 'xbox360',
      label: 'Xbox 360',
      color: '#9dff8c',
      icon: '❎',
      extensions: ['.iso', '.xex'],
      aspect: 'standard'
    }
  ],

  romFolders: {},
  emulators: {},
  launchArgs: {},
  metadata: {},
  manualCovers: {},
  userRatings: {},

  apiKeys: {
    steamgrid: ''
  },

  uiState: {
    settingsOpen: false,
    fullscreenOnLaunch: false,
    shelfViewMode: 'flat',
    language: 'pl',
    gameTitles: {}
  }
};


const CONFIG_STORAGE_KEY = 'retroLauncherConfig';

const STEAMGRIDBASE =
  'https://www.steamgriddb.com/api/v2';

const STEAMGRIDATTRIBUTIONURL =
  'https://www.steamgriddb.com';

const SteamGridDB_API_BASE =
  'https://www.steamgriddb.com/api/v2';

const SteamGridDB_ATTRIBUTION_URL =
  'https://www.steamgriddb.com';

const DEFAULT_LAUNCH_PLACEHOLDER =
  'Np. pcsx2-qt | flatpak run net.pcsx2.PCSX2 | /home/user/Emulator.AppImage | C:\\Emu\\emu.exe';

const DEFAULT_PLATFORM_ICON = '🎮';


let activePlatform = 'all';
let filtered = [];
let current = 0;
let viewMode = 'flat';


// ------------------------------------------------------------
// Tłumaczenia
// ------------------------------------------------------------

const I18N = {
  pl: {
    appTitle: 'Retro Launcher',
    library: 'Biblioteka',
    settings: 'Ustawienia',
    platforms: 'Platformy',
    search: 'Szukaj...',
    fullscreen: 'Pełny ekran',
    fullscreenHint: 'Pełny ekran (F11) / Alt + Enter',
    gamepadStatus: 'Status pada',
    chooseGame: 'Wybierz grę',
    launch: 'Uruchom',
    details: 'Szczegóły',
    navHint: 'Nawigacja',
    platformHint: 'Platformy',
    changePlatformHint: 'Zmień platformę',
    launchHint: 'Uruchom',
    fullscreenHintLabel: 'Pełny ekran',
    closeHint: 'Zamknij',
    fileSize: 'Waga pliku',
    location: 'Lokalizacja',
    playGame: 'Uruchom grę',
    setCover: 'Ustaw okładkę',
    general: 'Ogólne',
    artwork: 'Okładki',
    system: 'System',
    startup: 'Start aplikacji',
    startupNote: 'Ustaw, czy launcher ma uruchamiać się od razu w trybie pełnoekranowym.',
    fullscreenOnLaunch: 'Fullscreen przy uruchomieniu',
    enabled: 'Włączony',
    disabled: 'Wyłączony',
    saveStartup: 'Zapisz ustawienia startu',
    steamgridNote: 'Wpisz własny klucz API, aby pobierać okładki i opisy automatycznie.',
    apiKeyPlaceholder: 'Wpisz klucz API',
    saveKey: 'Zapisz klucz',
    language: 'Język',
    languageNote: 'Wybierz język interfejsu aplikacji.',
    languageInterface: 'Język interfejsu',
    saveLanguage: 'Zapisz język',
    artworkMetaTitle: 'Okładki i opisy',
    artworkMetaNote: 'Wybierz platformę do pobierania danych.',
    fetchPlatform: 'Platforma do pobierania',
    fetchCovers: 'Pobierz okładki i opisy',
    forceRefresh: 'Wymuś odświeżenie',
    manualCover: 'Ręczna okładka',
    manualCoverNote: 'Wybierz platformę i grę, a następnie podaj URL obrazka albo wskaż plik z dysku.',
    gamePlatform: 'Platforma gry',
    game: 'Gra',
    coverUrl: 'URL okładki',
    coverUrlPlaceholder: 'https://example.com/cover.jpg',
    saveUrl: 'Zapisz URL',
    chooseFile: 'Wybierz plik z dysku',
    removeCover: 'Usuń ręczną okładkę',
    addPlatform: 'Dodawanie platformy',
    addPlatformBtn: 'Dodaj platformę',
    romEmu: 'ROM-y i emulatory',
    clearPaths: 'Wyczyść ścieżki',
    saveChanges: 'Zapisz zmiany',
    windows: 'Windows',
    linux: 'Linux',
    noGamesForPlatform: 'Brak gier dla tej platformy — skonfiguruj folder i emulator w Ustawieniach',
    unknownPlatform: 'Nieznana platforma',
    unknownGame: 'Nieznana gra',
    noDescription: 'Brak opisu dla tej gry.',
    noData: 'Brak danych',
    missingEmulatorCommand: 'Brak polecenia uruchomieniowego dla tej platformy',
    missingGamePath: 'Brak ścieżki do pliku gry',
    flatpakMediaHint: 'Jeśli gra nie startuje, nadaj Flatpakowi dostęp do /media',
    errorLaunch: 'Błąd: ',
    demoLaunch: 'Demo: uruchomienie ',
    launchGamePrefix: 'Uruchamiam: ',
    saved: 'Zapisano ✓',
    allPlatforms: 'Wszystkie platformy',
    choosePlatform: 'Wybierz platformę',
    chooseGameFromList: 'Wybierz grę z listy.',
    sourceManual: 'Źródło: ręczne',
    sourceAuto: 'Źródło: SteamGridDB / automatyczne',
    noManualCover: 'Brak ręcznego URL lub pliku.',
    gameNotFound: 'Nie znaleziono gry',
    chooseGameFirst: 'Najpierw wybierz grę',
    noFilePicker: 'Brak natywnego okna wyboru pliku w launcherAPI',
    filePickerError: 'Nie udało się otworzyć okna wyboru pliku',
    noPlatformsToFetch: 'Brak platform do pobrania',
    removePlatform: 'Usuń platformę',
    romFolder: 'Folder z ROM-ami',
    notSet: 'Nie ustawiono',
    chooseFolder: 'Wybierz folder…',
    launchCommand: 'Polecenie uruchomieniowe',
    defaultArgs: 'Domyślne argumenty',
    argsPlaceholder: 'Np. --fullscreen --fastboot',
    test: 'Testuj',
    coverType: 'Typ okładki',
    standard: 'Standard',
    pspNarrow: 'PSP / wąska',
    square: 'Kwadrat',
    wide: 'Szeroka',
    steamBigPicture: 'Steam Big Picture',
    savedStartupSettings: 'Zapisano ustawienia startu',
    savedRomFolder: 'Zapisano folder z ROM-ami',
    savedLaunchCommand: 'Zapisano polecenie uruchomieniowe',
    savedCoverType: 'Zapisano typ okładki',
    noTestBridge: 'Brak mostka IPC do testu uruchomienia',
    testCommandLaunched: 'Polecenie testowe uruchomione',
    testFailed: 'Test nieudany',
    platformRemoved: 'Usunięto platformę',
    savedSteamgridKey: 'Zapisano klucz SteamGridDB API',
    languageSavedEn: 'Language saved ✓',
    languageSavedPl: 'Zapisano język ✓',
    stopShortcut: 'Skrót zatrzymywania emulatora',
    stopShortcutNote: 'Aby zamknąć aktywny emulator, naciśnij jednocześnie L3 + R3 + LB + RB na padzie.',
    stopShortcutKeys: 'Klawisze:',
    stopShortcutKeysValue: 'L3 + R3 + LB + RB',
    about: 'O aplikacji',
    aboutTitle: 'Retro Launcher',
    aboutNote: 'Prosty launcher do retro gier z obsługą wielu platform i emulatorów.',
    supportTitle: 'Wspieraj rozwój',
    supportNote: 'Jeśli podoba Ci się ten program, możesz postawić mi wirtualną kawę i wesprzeć dalszy rozwój.',
    supportButton: '☕ Postaw kawę',
    all: 'Wszystkie',

    renameGame: 'Podaj nową nazwę gry:',
    gameNameEmpty: 'Nazwa gry nie może być pusta.',
    gameRenamed: 'Nazwa gry została zmieniona.'
  },

  en: {
    appTitle: 'Retro Launcher',
    library: 'Library',
    settings: 'Settings',
    platforms: 'Platforms',
    search: 'Search...',
    fullscreen: 'Fullscreen',
    gamepadStatus: 'Gamepad status',
    chooseGame: 'Choose a game',
    launch: 'Launch',
    details: 'Details',
    navHint: 'Navigation',
    platformHint: 'Platforms',
    changePlatformHint: 'Change platform',
    launchHint: 'Launch',
    closeHint: 'Close',
    fileSize: 'File size',
    location: 'Location',
    playGame: 'Launch game',
    setCover: 'Set cover',
    general: 'General',
    artwork: 'Covers',
    system: 'System',
    startup: 'Startup',
    fullscreenOnLaunch: 'Fullscreen on launch',
    enabled: 'Enabled',
    disabled: 'Disabled',
    saveStartup: 'Save startup settings',
    saveKey: 'Save key',
    language: 'Language',
    languageNote: 'Choose the application interface language.',
    languageInterface: 'Interface language',
    saveLanguage: 'Save language',
    artworkMetaTitle: 'Covers and descriptions',
    fetchPlatform: 'Fetch platform',
    fetchCovers: 'Fetch covers and descriptions',
    forceRefresh: 'Force refresh',
    manualCover: 'Manual cover',
    gamePlatform: 'Game platform',
    game: 'Game',
    coverUrl: 'Cover URL',
    saveUrl: 'Save URL',
    chooseFile: 'Choose file from disk',
    removeCover: 'Remove manual cover',
    addPlatform: 'Add platform',
    addPlatformBtn: 'Add platform',
    romEmu: 'ROMs and emulators',
    clearPaths: 'Clear paths',
    saveChanges: 'Save changes',
    windows: 'Windows',
    linux: 'Linux',
    noGamesForPlatform: 'No games for this platform — configure the folder and emulator in Settings',
    unknownPlatform: 'Unknown platform',
    unknownGame: 'Unknown game',
    noDescription: 'No description for this game.',
    noData: 'No data',
    missingEmulatorCommand: 'No launch command for this platform',
    missingGamePath: 'No path to game file',
    flatpakMediaHint: 'If the game does not start, grant Flatpak access to /media',
    errorLaunch: 'Error: ',
    demoLaunch: 'Demo: launching ',
    launchGamePrefix: 'Launching: ',
    saved: 'Saved ✓',
    allPlatforms: 'All platforms',
    choosePlatform: 'Choose platform',
    chooseGameFromList: 'Choose a game from the list.',
    sourceManual: 'Source: manual',
    sourceAuto: 'Source: SteamGridDB / automatic',
    noManualCover: 'No manual URL or file.',
    gameNotFound: 'Game not found',
    chooseGameFirst: 'Choose a game first',
    noFilePicker: 'No native file picker in launcherAPI',
    filePickerError: 'Failed to open file picker',
    noPlatformsToFetch: 'No platforms to fetch',
    removePlatform: 'Remove platform',
    romFolder: 'ROM folder',
    notSet: 'Not set',
    chooseFolder: 'Choose folder…',
    launchCommand: 'Launch command',
    defaultArgs: 'Default arguments',
    argsPlaceholder: 'E.g. --fullscreen --fastboot',
    test: 'Test',
    coverType: 'Cover type',
    standard: 'Standard',
    pspNarrow: 'PSP / narrow',
    square: 'Square',
    wide: 'Wide',
    steamBigPicture: 'Steam Big Picture',
    savedStartupSettings: 'Saved startup settings',
    savedRomFolder: 'Saved ROM folder',
    savedLaunchCommand: 'Saved launch command',
    savedCoverType: 'Saved cover type',
    noTestBridge: 'No IPC bridge for launch test',
    testCommandLaunched: 'Test command launched',
    testFailed: 'Test failed',
    platformRemoved: 'Platform removed',
    savedSteamgridKey: 'Saved SteamGridDB API key',
    languageSavedEn: 'Language saved ✓',
    languageSavedPl: 'Zapisano język ✓',
    stopShortcut: 'Emulator stop shortcut',
    stopShortcutNote: 'To close the active emulator, press L3 + R3 + LB + RB on the gamepad at the same time.',
    stopShortcutKeys: 'Keys:',
    stopShortcutKeysValue: 'L3 + R3 + LB + RB',
    about: 'About',
    aboutTitle: 'Retro Launcher',
    aboutNote: 'Simple launcher for retro games with support for multiple platforms and emulators.',
    supportTitle: 'Support development',
    supportNote: 'If you like this app, you can buy me a virtual coffee and support further development.',
    supportButton: '☕ Buy me a coffee',
    all: 'All',

    renameGame: 'Enter a new game name:',
    gameNameEmpty: 'The game name cannot be empty.',
    gameRenamed: 'Game name changed.'
  }
};


// ------------------------------------------------------------
// Język
// ------------------------------------------------------------

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

  return I18N[lang]?.[key]
    ?? I18N.pl[key]
    ?? key;
}


// ------------------------------------------------------------
// Domyślne wartości konfiguracji
// ------------------------------------------------------------

function ensureConfigDefaults() {
  if (!config.uiState || typeof config.uiState !== 'object') {
    config.uiState = {};
  }

  if (
    !config.uiState.gameTitles
    || typeof config.uiState.gameTitles !== 'object'
    || Array.isArray(config.uiState.gameTitles)
  ) {
    config.uiState.gameTitles = {};
  }

  if (!config.uiState.shelfViewMode) {
    config.uiState.shelfViewMode = 'flat';
  }

  if (!config.uiState.language) {
    config.uiState.language = 'pl';
  }

  if (typeof config.uiState.settingsOpen !== 'boolean') {
    config.uiState.settingsOpen = false;
  }

  if (typeof config.uiState.fullscreenOnLaunch !== 'boolean') {
    config.uiState.fullscreenOnLaunch = false;
  }

  if (!config.platforms || !Array.isArray(config.platforms)) {
    config.platforms = [];
  }

  if (!config.romFolders || typeof config.romFolders !== 'object') {
    config.romFolders = {};
  }

  if (!config.emulators || typeof config.emulators !== 'object') {
    config.emulators = {};
  }

  if (!config.launchArgs || typeof config.launchArgs !== 'object') {
    config.launchArgs = {};
  }

  if (!config.metadata || typeof config.metadata !== 'object') {
    config.metadata = {};
  }

  if (!config.manualCovers || typeof config.manualCovers !== 'object') {
    config.manualCovers = {};
  }

  if (!config.userRatings || typeof config.userRatings !== 'object') {
    config.userRatings = {};
  }

  if (!config.apiKeys || typeof config.apiKeys !== 'object') {
    config.apiKeys = {};
  }

  if (typeof config.apiKeys.steamgrid !== 'string') {
    config.apiKeys.steamgrid = '';
  }
}


// ------------------------------------------------------------
// Nazwy gier
// ------------------------------------------------------------

function getDisplayTitle(game) {
  if (!game) return t('unknownGame');

  const customTitle = config?.uiState?.gameTitles?.[game.id];

  const title =
    customTitle
    || game.customTitle
    || game.displayTitle
    || game.title
    || game.name
    || t('unknownGame');

  return String(title).trim() || t('unknownGame');
}


async function renameGame(game) {
  if (!game?.id) return;

  ensureConfigDefaults();

  const currentTitle = getDisplayTitle(game);

  const newTitle = window.prompt(
    t('renameGame'),
    currentTitle
  );

  if (newTitle === null) return;

  const trimmedTitle = String(newTitle).trim();

  if (!trimmedTitle) {
    showToast(t('gameNameEmpty'), true);
    return;
  }

  const originalTitle = String(
    game.title
    || game.displayTitle
    || t('unknownGame')
  ).trim();

  if (trimmedTitle === originalTitle) {
    delete config.uiState.gameTitles[game.id];
  } else {
    config.uiState.gameTitles[game.id] = trimmedTitle;
  }

  await saveStoredConfig();

  if (typeof renderShelf === 'function') {
    renderShelf();
  }

  if (
    typeof overlay !== 'undefined'
    && overlay?.classList?.contains('open')
    && overlay.currentGame?.id === game.id
  ) {
    const modalTitle = document.getElementById('modalTitle');

    if (modalTitle) {
      modalTitle.textContent = getDisplayTitle(game);
    }
  }

  showToast(t('gameRenamed'));
}


// ------------------------------------------------------------
// Wczytywanie konfiguracji
// ------------------------------------------------------------

async function loadStoredConfig() {
  let loadedConfig = null;

  try {
    if (window.launcherAPI?.loadConfig) {
      loadedConfig = await window.launcherAPI.loadConfig();
    } else {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);

      if (raw) {
        loadedConfig = JSON.parse(raw);
      }
    }
  } catch (e) {
    console.warn('Nie udało się wczytać konfiguracji:', e);
  }

  if (loadedConfig && typeof loadedConfig === 'object') {
    config = {
      ...config,
      ...loadedConfig,

      uiState: {
        ...config.uiState,
        ...(loadedConfig.uiState || {})
      }
    };
  }

  ensureConfigDefaults();

  viewMode = config.uiState.shelfViewMode;

  return config;
}