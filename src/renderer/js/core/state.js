// Stan globalny aplikacji i stałe konfiguracyjne.
const games = [];

let config = {
  platforms: [
    { key: 'psp', label: 'PlayStation Portable', color: '#ffb450', icon: '🎮', extensions: ['.iso', '.cso', '.pbp', '.chd'], aspect: 'psp' },
    { key: 'ps2', label: 'PlayStation 2', color: '#64b4ff', icon: '🔒️', extensions: ['.iso', '.bin'], aspect: 'standard' },
    { key: 'psx', label: 'PlayStation (PSX)', color: '#c88cff', icon: '💕', extensions: ['.bin', '.cue', '.img'], aspect: 'standard' },
    { key: 'ps3', label: 'PlayStation 3', color: '#78ffb4', icon: '📀', extensions: ['.iso', '.pkg'], aspect: 'wide' },
    { key: 'snes', label: 'Super Nintendo', color: '#ff8ca8', icon: '🔥', extensions: ['.sfc', '.smc'], aspect: 'square' },
    { key: 'nds', label: 'Nintendo DS', color: '#8cffe0', icon: '📱', extensions: ['.nds'], aspect: 'psp' },
    { key: 'xbox360', label: 'Xbox 360', color: '#9dff8c', icon: '❎', extensions: ['.iso', '.xex'], aspect: 'standard' }
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
    language: 'pl'
  }
};

const CONFIG_STORAGE_KEY = 'retroLauncherConfig';
const STEAMGRIDBASE = 'https://www.steamgriddb.com/api/v2';
const STEAMGRIDATTRIBUTIONURL = 'https://www.steamgriddb.com';
const SteamGridDB_API_BASE = 'https://www.steamgriddb.com/api/v2';
const SteamGridDB_ATTRIBUTION_URL = 'https://www.steamgriddb.com';
const DEFAULT_LAUNCH_PLACEHOLDER = 'Np. pcsx2-qt | flatpak run net.pcsx2.PCSX2 | /home/user/Emulator.AppImage | C:\\Emu\\emu.exe';
const DEFAULT_PLATFORM_ICON = '🎮';

let activePlatform = 'all';
let filtered = [];
current = 0;
let viewMode = config.uiState.shelfViewMode || 'flat';
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
    artworkMetaNote: 'Wybierz platformę do pobierania danych. Możesz pobrać metadata dla jednej platformy albo wszystkich.',
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
    addPlatformNote: 'Dodaj nazwę platformy, rozszerzenia ROM-ów, kolor i typ okładki. Launcher sam utworzy wpis konfiguracji.',
    platformNamePlaceholder: 'Nazwa platformy, np. Dreamcast',
    platformExtsPlaceholder: 'Rozszerzenia, np. .gdi, .cdi',
    addPlatformBtn: 'Dodaj platformę',
    platformHelp: 'Szybka wskazówka: po dodaniu platformy ustaw folder ROM-ów, polecenie emulatora i opcjonalne argumenty startowe.',
    romEmu: 'ROM-y i emulatory',
    romEmuNote: 'Każda platforma może mieć własny folder ROM-ów, emulator, argumenty i proporcje okładek.',
    clearPaths: 'Wyczyść ścieżki',
    saveChanges: 'Zapisz zmiany',
    windows: 'Windows',
    windowsNote: 'Dla emulatora wybierz plik `.exe`, a dla ROM-ów folder z grami. Lokalne pliki okładek mogą wymagać poprawnego adresu `file:///`, szczególnie dla ścieżek dyskowych typu `C:\\...`.',
    windowsEmuExample: 'Przykład emulatora: C:\\Emulatory\\PPSSPP\\PPSSPPWindows64.exe',
    windowsCoverExample: 'Przykład okładki: file:///C:/Retro/covers/god-of-war.jpg',
    linux: 'Linux',
    linuxNote: 'Na Linuxie zwykle wybierasz binarkę emulatora albo komendę uruchomieniową, a przy Flatpaku mogą być potrzebne uprawnienia do katalogów spoza sandboxa, np. `/media` lub własnych folderów z ROM-ami.',
    linuxEmuExample: 'Przykład emulatora: /usr/bin/retroarch',
    linuxFlatpakExample: 'Przykład Flatpak: flatpak run org.ppsspp.PPSSPP',
    linuxPermExample: 'Przykład uprawnień: flatpak override --user --filesystem=/media org.ppsspp.PPSSPP',
    howToAdd: 'Jak dodać platformę i okładki',
    howToAddNote: '1. Dodaj platformę w zakładce „Platformy”. 2. Ustaw folder ROM-ów i emulator. 3. W zakładce „Okładki” wybierz platformę i pobierz dane albo ustaw ręczną okładkę przez URL lub plik lokalny.',
    howToAddHint: 'Jeśli lokalna okładka nie pokazuje się poprawnie, sprawdź format ścieżki `file://` oraz to, czy aplikacja ma dostęp do pliku.'
  },
  en: {
    appTitle: 'Retro Launcher',
    library: 'Library',
    settings: 'Settings',
    platforms: 'Platforms',
    search: 'Search...',
    fullscreen: 'Fullscreen',
    fullscreenHint: 'Fullscreen (F11) / Alt + Enter',
    gamepadStatus: 'Gamepad status',
    chooseGame: 'Choose a game',
    launch: 'Launch',
    details: 'Details',
    navHint: 'Navigation',
    platformHint: 'Platforms',
    changePlatformHint: 'Change platform',
    launchHint: 'Launch',
    fullscreenHintLabel: 'Fullscreen',
    closeHint: 'Close',
    fileSize: 'File size',
    location: 'Location',
    playGame: 'Launch game',
    setCover: 'Set cover',
    general: 'General',
    artwork: 'Covers',
    system: 'System',
    startup: 'Startup',
    startupNote: 'Choose whether the launcher starts in fullscreen mode.',
    fullscreenOnLaunch: 'Fullscreen on launch',
    enabled: 'Enabled',
    disabled: 'Disabled',
    saveStartup: 'Save startup settings',
    steamgridNote: 'Enter your own API key to fetch covers and descriptions automatically.',
    apiKeyPlaceholder: 'Enter API key',
    saveKey: 'Save key',
    language: 'Language',
    languageNote: 'Choose the application interface language.',
    languageInterface: 'Interface language',
    saveLanguage: 'Save language',
    artworkMetaTitle: 'Covers and descriptions',
    artworkMetaNote: 'Choose a platform to fetch data. You can fetch metadata for one platform or all at once.',
    fetchPlatform: 'Fetch platform',
    fetchCovers: 'Fetch covers and descriptions',
    forceRefresh: 'Force refresh',
    manualCover: 'Manual cover',
    manualCoverNote: 'Choose a platform and a game, then enter an image URL or select a file from disk.',
    gamePlatform: 'Game platform',
    game: 'Game',
    coverUrl: 'Cover URL',
    coverUrlPlaceholder: 'https://example.com/cover.jpg',
    saveUrl: 'Save URL',
    chooseFile: 'Choose file from disk',
    removeCover: 'Remove manual cover',
    addPlatform: 'Add platform',
    addPlatformNote: 'Add a platform name, ROM extensions, color, and cover type. The launcher will create the config entry automatically.',
    platformNamePlaceholder: 'Platform name, e.g. Dreamcast',
    platformExtsPlaceholder: 'Extensions, e.g. .gdi, .cdi',
    addPlatformBtn: 'Add platform',
    platformHelp: 'Quick tip: after adding a platform, set the ROM folder, emulator command, and optional launch arguments.',
    romEmu: 'ROMs and emulators',
    romEmuNote: 'Each platform can have its own ROM folder, emulator, arguments, and cover proportions.',
    clearPaths: 'Clear paths',
    saveChanges: 'Save changes',
    windows: 'Windows',
    windowsNote: 'For the emulator choose an `.exe` file, and for ROMs choose the game folder. Local cover files may require a proper `file:///` path, especially on disk paths like `C:\\...`.',
    windowsEmuExample: 'Example emulator: C:\\Emulators\\PPSSPP\\PPSSPPWindows64.exe',
    windowsCoverExample: 'Example cover: file:///C:/Retro/covers/god-of-war.jpg',
    linux: 'Linux',
    linuxNote: 'On Linux you usually choose an emulator binary or a launch command, and with Flatpak you may need permissions for folders outside the sandbox, such as `/media` or your own ROM folders.',
    linuxEmuExample: 'Example emulator: /usr/bin/retroarch',
    linuxFlatpakExample: 'Example Flatpak: flatpak run org.ppsspp.PPSSPP',
    linuxPermExample: 'Example permission: flatpak override --user --filesystem=/media org.ppsspp.PPSSPP',
    howToAdd: 'How to add platforms and covers',
    howToAddNote: '1. Add a platform in the “Platforms” tab. 2. Set the ROM folder and emulator. 3. In the “Covers” tab choose a platform and fetch data or set a manual cover using a URL or a local file.',
    howToAddHint: 'If a local cover does not appear correctly, check the `file://` path format and whether the app can access the file.'
  }
};

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
  return I18N[lang]?.[key] ?? I18N.pl[key] ?? key;
}