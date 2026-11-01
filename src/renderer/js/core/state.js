// Stan globalny aplikacji i stałe konfiguracyjne.

const games = [];

// Pełna lista plików wykrytych podczas ostatniego skanowania ROM-ów —
// zawiera również gry ukryte przez użytkownika. Używana przez menedżera
// gier, żeby dało się przywrócić (odkryć) schowane pozycje.
const scannedGames = [];

// Lokalny placeholder okładki — działa offline i w trybie przenośnym,
// zamiast pobierać przypadkową grafikę z zewnętrznego CDN.
const COVER_PLACEHOLDER = new URL('./assets/cover-placeholder.svg', document.baseURI).toString();

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
  // Argumenty uruchomienia nadpisujące platformę dla konkretnej gry.
  gameArgs: {},
  // Gry dodane ręcznie na platformach typu PC: { [platformKey]: [{ path, title }] }.
  pcGames: {},
  // Nadpisania ustawień uruchamiania PC dla konkretnej gry:
  // { [gameId]: { runner, prefix, env } }.
  pcGameSettings: {},
  metadata: {},
  manualCovers: {},
  userRatings: {},

  // Ukryte gry/pliki per platforma: { [platformKey]: { [gameId]: true } }.
  // Ukryte pozycje nie pojawiają się na półce ani w licznikach platform,
  // ale nadal są dostępne w menedżerze gier, żeby można je było odkryć.
  hiddenGames: {},

  // Klucze/dane logowania do scraperów metadanych. steamgrid i rawg to
  // jednolite klucze API. screenscraperUser/Password to login+hasło
  // konta ScreenScraper (nie klucz API — ich autoryzacja działa inaczej).
  // thegamesdb to klucz API TheGamesDB (fallback dla niszowych ROM-ów).
  apiKeys: {
    steamgrid: '',
    rawg: '',
    screenscraperUser: '',
    screenscraperPassword: '',
    screenscraperDevId: '',
    screenscraperDevPass: '',
    thegamesdb: ''
  },

  uiState: {
    settingsOpen: false,
    fullscreenOnLaunch: false,
    shelfViewMode: 'flat',
    language: 'pl',
    theme: 'default',
    gameTitles: {},
    autoFetchOnStart: false,

    // Ulubione gry (gameId → true), sposób sortowania biblioteki oraz
    // wygaszacz (tryb atrakcji). Wszystko trafia do pliku konfiguracji.
    favorites: {},
    librarySort: 'default',
    attractMode: true
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

// Bazowe URL-e dodatkowych scraperów retro (ScreenScraper, TheGamesDB).
const SCREENSCRAPER_BASE =
  'https://www.screenscraper.fr/api2';

const SCREENSCRAPER_ATTRIBUTION_URL =
  'https://www.screenscraper.fr';

const THEGAMESDB_BASE =
  'https://api.thegamesdb.net/v1';

const THEGAMESDB_ATTRIBUTION_URL =
  'https://thegamesdb.net';

const DEFAULT_LAUNCH_PLACEHOLDER =
  'Np. pcsx2-qt | flatpak run net.pcsx2.PCSX2 | /home/user/Emulator.AppImage | C:\\Emu\\emu.exe';

const DEFAULT_PLATFORM_ICON = '🎮';

// Gotowe definicje popularnych platform. Używane do podpowiedzi nazw
// (datalist) oraz automatycznego wypełniania rozszerzeń, koloru,
// proporcji okładki i mapowań scraperów. `scraperSystem` to ID systemu
// ScreenScraper, `tgdb` — ID platformy TheGamesDB.
const PLATFORM_PRESETS = [
  { id: 'nes', label: 'Nintendo Entertainment System', extensions: ['.nes'], color: '#ff6b6b', aspect: 'standard', scraperSystem: 3, tgdb: 7 },
  { id: 'snes', label: 'Super Nintendo', extensions: ['.sfc', '.smc'], color: '#ff8ca8', aspect: 'square', scraperSystem: 4, tgdb: 6 },
  { id: 'n64', label: 'Nintendo 64', extensions: ['.n64', '.z64', '.v64'], color: '#ffd166', aspect: 'standard', scraperSystem: 14, tgdb: 3 },
  { id: 'gamecube', label: 'Nintendo GameCube', extensions: ['.iso', '.gcm', '.rvz'], color: '#9d8cff', aspect: 'standard', scraperSystem: 13, tgdb: 21 },
  { id: 'wii', label: 'Nintendo Wii', extensions: ['.iso', '.wbfs', '.rvz'], color: '#8cffe0', aspect: 'wide', scraperSystem: 16, tgdb: 9 },
  { id: 'wiiu', label: 'Nintendo Wii U', extensions: ['.wud', '.wux', '.rpx'], color: '#8cc8ff', aspect: 'wide' },
  { id: 'switch', label: 'Nintendo Switch', extensions: ['.nsp', '.xci'], color: '#ff6b6b', aspect: 'square' },
  { id: 'gb', label: 'Game Boy', extensions: ['.gb'], color: '#a8d8b9', aspect: 'standard', scraperSystem: 9, tgdb: 4 },
  { id: 'gbc', label: 'Game Boy Color', extensions: ['.gbc'], color: '#c8a8ff', aspect: 'standard', scraperSystem: 10, tgdb: 41 },
  { id: 'gba', label: 'Game Boy Advance', extensions: ['.gba'], color: '#8c78ff', aspect: 'gba', scraperSystem: 12, tgdb: 5 },
  { id: 'nds', label: 'Nintendo DS', extensions: ['.nds'], color: '#8cffe0', aspect: 'nds' },
  { id: '3ds', label: 'Nintendo 3DS', extensions: ['.3ds', '.cia'], color: '#ff8ca8', aspect: 'standard' },
  { id: 'psx', label: 'PlayStation', extensions: ['.bin', '.cue', '.img', '.chd'], color: '#c88cff', aspect: 'standard', scraperSystem: 57, tgdb: 10 },
  { id: 'ps2', label: 'PlayStation 2', extensions: ['.iso', '.bin', '.chd'], color: '#64b4ff', aspect: 'standard', scraperSystem: 58, tgdb: 11 },
  { id: 'ps3', label: 'PlayStation 3', extensions: ['.iso', '.pkg'], color: '#78ffb4', aspect: 'wide' },
  { id: 'ps4', label: 'PlayStation 4', extensions: ['.pkg'], color: '#64b4ff', aspect: 'wide' },
  { id: 'psp', label: 'PlayStation Portable', extensions: ['.iso', '.cso', '.pbp', '.chd'], color: '#ffb450', aspect: 'psp', scraperSystem: 61, tgdb: 13 },
  { id: 'psvita', label: 'PlayStation Vita', extensions: ['.vpk'], color: '#38e0ff', aspect: 'standard' },
  { id: 'megadrive', label: 'Sega Mega Drive / Genesis', extensions: ['.md', '.gen', '.bin'], color: '#ffb450', aspect: 'standard', scraperSystem: 1, tgdb: 18 },
  { id: 'saturn', label: 'Sega Saturn', extensions: ['.cue', '.bin', '.iso'], color: '#9dff8c', aspect: 'standard', scraperSystem: 22, tgdb: 17 },
  { id: 'dreamcast', label: 'Sega Dreamcast', extensions: ['.gdi', '.cdi', '.chd'], color: '#64b4ff', aspect: 'standard', scraperSystem: 23, tgdb: 16 },
  { id: 'gamegear', label: 'Sega Game Gear', extensions: ['.gg'], color: '#ffd166', aspect: 'standard' },
  { id: 'mastersystem', label: 'Sega Master System', extensions: ['.sms'], color: '#64b4ff', aspect: 'standard' },
  { id: 'xbox', label: 'Xbox', extensions: ['.iso', '.xbe'], color: '#9dff8c', aspect: 'standard' },
  { id: 'xbox360', label: 'Xbox 360', extensions: ['.iso', '.xex'], color: '#9dff8c', aspect: 'standard' },
  { id: 'arcade', label: 'Arcade / MAME', extensions: ['.zip', '.7z'], color: '#ff5c5c', aspect: 'marquee', scraperSystem: 75, tgdb: 23 },
  { id: 'atari2600', label: 'Atari 2600', extensions: ['.a26'], color: '#ffb450', aspect: 'standard' },
  { id: 'amiga', label: 'Commodore Amiga', extensions: ['.adf', '.hdf', '.lha'], color: '#ff8ca8', aspect: 'standard' },
  { id: 'dos', label: 'DOS', extensions: ['.zip', '.exe', '.bat'], color: '#c8a8ff', aspect: 'wide' },
  { id: 'pc', label: 'PC (Windows / Linux)', extensions: ['.exe', '.AppImage', '.sh'], color: '#38e0ff', aspect: 'standard', kind: 'pc' }
];



let activePlatform = 'all';
let filtered = [];
let current = 0;
let viewMode = 'flat';

// Statystyki z pliku playtime (main process / Tauri): gameId → wpis
// { totalMs, lastStartAt, lastPlayedAt, running, plays }.
const playtimeStats = {};
let playtimeStatsLoadedAt = 0;


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

    metaSourcesTitle: 'Źródła metadanych i okładek',
    metaSourcesNote: 'Skonfiguruj klucze API dla poszczególnych scraperów. SteamGridDB i RAWG działają najlepiej dla nowszych gier, ScreenScraper i TheGamesDB są zorientowane na retro (SNES, Genesis, arcade, handheldy). Możesz skonfigurować tylko te źródła, z których chcesz korzystać — pozostałe zostaną pominięte przy pobieraniu.',

    steamgridNote: 'Wpisz własny klucz API, aby pobierać okładki i opisy automatycznie.',
    apiKeyPlaceholder: 'Wpisz klucz API',
    saveKey: 'Zapisz klucz',

    rawgNote: 'Klucz API RAWG służy do pobierania opisów, gatunków i oceny Metacritic. Klucz generujesz bezpłatnie na rawg.io/apidocs.',

    screenscraperNote: 'Główne źródło metadanych dla retro (opisy, gatunki, liczba graczy, okładki). Wymaga konta na screenscraper.fr oraz identyfikatora aplikacji (Dev ID + hasło aplikacji) — obie pary wpisujesz poniżej.',
    screenscraperUser: 'Login ScreenScraper',
    screenscraperPassword: 'Hasło ScreenScraper',
    screenscraperDevId: 'Dev ID aplikacji (API)',
    screenscraperDevPass: 'Hasło aplikacji (API)',
    devIdPlaceholder: 'np. identyfikator z formularza API',
    usernamePlaceholder: 'Nazwa użytkownika',
    passwordPlaceholder: 'Hasło',
    testScreenscraper: 'Test połączenia',
    screenscraperTestOk: 'ScreenScraper działa ✓',
    screenscraperTestFail: 'Test ScreenScraper nieudany',
    autoFetchOnStart: 'Auto-uzupełnianie po starcie',
    autoFetchOnStartNote: 'Po starcie launcher cicho uzupełni brakujące okładki i opisy w tle. Wymaga skonfigurowanych kluczy API. Domyślnie wyłączone.',
    enabledShort: 'Włączone',
    disabledShort: 'Wyłączone',
    saveAutoFetch: 'Zapisz opcję',

    fetchMissingCovers: 'Uzupełnij okładki',
    fetchingCovers: 'Pobieram okładki…',
    coversFetchedPlatforms: 'Uzupełniono metadane dla platform',
    coversFetchedDone: 'Gotowe — odświeżono okładki i opisy',
    coversFetchError: 'Nie udało się pobrać metadanych',

    viewModeDetailed: 'Lista z opisem (EmulationStation)',
    viewModeHero: 'Spotlight z opisem',
    viewModeBigbox: 'Pełnoekranowe okładki',
    viewModeFramed: 'Półka w ramce platformy',
    playtimeLabel: 'Czas gry',
    noDescription: 'Brak opisu — użyj „Pobierz okładki i opisy” w Ustawieniach.',

    gamesdbNote: 'Zapasowe źródło okładek dla niszowych ROM-ów, gdy SteamGridDB i ScreenScraper nie znajdą trafienia. Wymaga darmowego klucza API z thegamesdb.net.',

    language: 'Język',
    languageNote: 'Wybierz język interfejsu aplikacji.',
    languageInterface: 'Język interfejsu',
    saveLanguage: 'Zapisz język',
    theme: 'Motyw',
    themeNote: 'Wybierz motyw graficzny interfejsu. Zmiana jest widoczna od razu.',
    themeInterface: 'Motyw interfejsu',
    saveTheme: 'Zapisz motyw',
    themeDefault: 'Domyślny (ciemny)',
    themeWii: 'Wii — jasny, połysk',
    themeSwitch: 'Nintendo Switch — czerwień',
    themePs3: 'PlayStation 3 — XMB',
    themeXbox: 'Xbox — zieleń',
    themeSaved: 'Zapisano motyw ✓',
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
    aspectPortrait: 'Portret (Steam 2:3)',
    aspectNds: 'Nintendo DS / szeroka',
    aspectGba: 'Game Boy Advance',
    aspectBanner: 'Banner 16:9',
    aspectMarquee: 'Marquee arcade (3:1)',
    aspectSteam: 'Steam Grid (2:3)',
    aspectCustom: 'Własne proporcje…',
    customWidth: 'Szerokość (px)',
    customRatio: 'Proporcja (szer. / wys.)',
    aspectCustomHint: 'Np. 0.72 dla klasycznego pudełka lub 1 dla kwadratu.',
    platformKind: 'Typ platformy',
    platformKindConsole: 'Konsola / emulator',
    platformKindPc: 'PC (pliki .exe / Linux)',
    platformNamePlaceholder: 'Nazwa platformy, np. Dreamcast',
    platformExtsPlaceholder: 'Rozszerzenia, np. .gdi, .cdi',
    platformPresetHint: 'Zacznij pisać nazwę — podpowiemy popularne platformy i uzupełnimy ustawienia.',
    renamePlatform: 'Zmień nazwę platformy',
    renamePlatformPrompt: 'Podaj nową nazwę platformy:',
    platformRenamed: 'Zmieniono nazwę platformy',
    pcSettingsTitle: 'Uruchamianie gier PC',
    pcSettingsNote: 'Dotyczy platform typu PC. Gry Windows na Linuksie uruchamiane są przez Wine/Proton; gry natywne bezpośrednio.',
    pcRunner: 'Runner',
    pcRunnerNative: 'Natywny (Linux / Windows)',
    pcRunnerWine: 'Wine (systemowy)',
    pcRunnerWineGe: 'Wine-GE',
    pcRunnerProtonGe: 'Proton-GE',
    pcRunnerAuto: 'Automatycznie (wykryj)',
    pcPrefix: 'Prefiks Wine (WINEPREFIX)',
    pcPrefixPlaceholder: 'Domyślnie ~/Games/retro-launcher',
    pcEnv: 'Zmienne środowiskowe',
    pcEnvPlaceholder: 'Np. WINEDLLOVERRIDES=... (każda w nowej linii)',
    pcEnvHint: 'Format KEY=WARTOŚĆ, jedna zmienna na linię.',
    pcRunnerPath: 'Ścieżka runnera (opcjonalnie)',
    pcRunnerPathPlaceholder: 'Np. ~/.local/share/Steam/compatibilitytools.d/GE-Proton...',
    pcDetect: 'Wykryj runnery',
    pcDetected: 'Wykryto runnery',
    pcInstall: 'Pobierz',
    pcInstalling: 'Pobieranie…',
    pcRunnerInstalled: 'Zainstalowano runner',
    pcRunnerInstallFailed: 'Nie udało się zainstalować runnera',
    pcRunnerExists: 'Runner jest już zainstalowany',
    pcRunnerNotFound: 'Nie wykryto wymaganego runnera. Zainstaluj go przyciskiem „Pobierz”.',
    pcExeNeedsRunner: 'Plik .exe na Linuksie wymaga runnera Wine lub Proton — wybierz go w ustawieniach platformy PC.',
    pcRunnerNotSupported: 'Automatyczna instalacja runnerów jest dostępna tylko na Linuksie.',
    pcWineMissing: 'Nie znaleziono Wine w systemie.',
    pcNoSteam: 'Nie znaleziono katalogu Steam (wymagany przez Proton).',
    pcWinetricks: 'Winetricks',
    pcWinetricksHint: 'Pakiety instalowane w wybranym prefiksie, np. corefonts vcrun2019.',
    pcWinetricksPlaceholder: 'corefonts vcrun2019',
    pcWinetricksRun: 'Uruchom winetricks',
    pcWinetricksStarted: 'Uruchomiono winetricks w tle',
    pcWinetricksError: 'Błąd winetricks',
    pcAddGames: 'Dodaj gry…',
    pcScanFolder: 'Skanuj folder…',
    pcClearGames: 'Wyczyść listę gier PC',
    pcGameCount: 'Dodane gry PC: ',
    pcAddGamesSuccess: 'Dodano gry PC: ',
    pcScanSuccess: 'Znaleziono i dodano pliki: ',
    pcNoExecutables: 'Nie znaleziono plików wykonywalnych w tym folderze.',
    pcClearConfirm: 'Usunąć wszystkie ręcznie dodane gry PC z tej platformy?',
    pcGamesCleared: 'Wyczyszczono listę gier PC',
    pcChooseFiles: 'Wybierz pliki gier (.exe / .AppImage / .sh)',
    pcGameRunner: 'Runner dla tej gry',
    pcGamePrefix: 'Prefiks dla tej gry',
    pcGameEnv: 'Zmienne dla tej gry',
    pcGameOverrideHint: 'Puste pola oznaczają użycie ustawień platformy.',
    pcSaveOverride: 'Zapisz ustawienia gry',
    pcResetOverride: 'Wyczyść nadpisania',
    pcOverrideSaved: 'Zapisano ustawienia uruchamiania gry',
    pcOverrideReset: 'Wyczyszczono nadpisania gry',
    pcPlatformNote: 'Ta platforma przechowuje listę plików wykonywalnych zamiast folderu ROM-ów.',
    pcRemoveGame: 'Usuń z listy PC',
    pcRunnerDownloading: 'Pobieranie runnera…',
    noTestBridge: 'Brak mostka IPC do testu uruchomienia',
    testCommandLaunched: 'Polecenie testowe uruchomione',
    testFailed: 'Test nieudany',
    platformRemoved: 'Usunięto platformę',
    savedSteamgridKey: 'Zapisano klucz SteamGridDB API',
    savedRawgKey: 'Zapisano klucz RAWG API',
    savedScreenscraperCredentials: 'Zapisano dane logowania ScreenScraper',
    savedGamesDbKey: 'Zapisano klucz TheGamesDB API',
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
    gameRenamed: 'Nazwa gry została zmieniona.',

    gamesManager: 'Menedżer gier',
    gamesManagerNote: 'Wybierz platformę i schowaj (ukryj) wybrane gry lub pliki, aby nie pojawiały się na półce. Ukrycie jest zapisywane osobno dla każdej platformy i można je w każdej chwili cofnąć.',
    managerPlatform: 'Platforma',
    managerSearchPlaceholder: 'Szukaj gry lub pliku…',
    hideGame: 'Ukryj',
    unhideGame: 'Odkryj',
    hiddenBadge: 'Ukryta',
    hideAllGames: 'Ukryj wszystkie',
    unhideAllGames: 'Odkryj wszystkie',
    visibleBadge: 'Widoczna',
    noScannedGames: 'Brak plików — ustaw folder ROM-ów w zakładce Platformy.',
    hiddenGamesSaved: 'Zapisano stan ukrycia',
    platformHiddenCount: 'ukryte',
    selectAll: 'Zaznacz wszystkie',
    hideSelected: 'Ukryj zaznaczone',
    unhideSelected: 'Odkryj zaznaczone',
    selectedCount: 'zaznaczone',
    managerNoSelection: 'Zaznacz gry, aby wykonać akcję',

    // Ulubione, sortowanie, losowa gra, tryb atrakcji, kopie zapasowe.
    sortBy: 'Sortowanie biblioteki',
    sortDefault: 'Domyślnie',
    sortRecent: 'Ostatnio grane',
    sortFavorites: 'Ulubione',
    sortTitle: 'A–Z',
    sortPlaytime: 'Czas gry',
    favoriteAdd: 'Dodaj do ulubionych',
    favoriteRemove: 'Usuń z ulubionych',
    favoriteAdded: 'Dodano do ulubionych',
    favoriteRemoved: 'Usunięto z ulubionych',
    randomGame: 'Losowa gra',
    randomGameToast: 'Wylosowano: ',
    randomGameEmpty: 'Brak gier do wylosowania',
    attractMode: 'Tryb atrakcji',
    attractModeNote: 'Po bezczynności launcher sam przewija gry na półce, tworząc efekt wygaszacza. Każde naciśnięcie klawisza lub sygnał z pada przywraca normalne sterowanie.',
    saveAttract: 'Zapisz tryb atrakcji',
    attractSaved: 'Zapisano tryb atrakcji',
    attractHint: 'Tryb atrakcji — naciśnij dowolny klawisz, aby wrócić',
    launchCount: 'Liczba uruchomień',
    lastPlayed: 'Ostatnio grane',
    neverPlayed: 'Nigdy',
    backupTitle: 'Kopia zapasowa',
    backupNote: 'Zapisz konfigurację, platformy, okładki, metadane i statystyki czasu gry do pliku JSON. Import przywraca wszystko i przeładowuje aplikację.',
    exportBackup: 'Eksportuj kopię',
    importBackup: 'Importuj kopię',
    backupExported: 'Zapisano kopię zapasową',
    backupImported: 'Zaimportowano kopię — przeładowuję…',
    backupImportError: 'Nie udało się zaimportować kopii',
    backupInvalid: 'Nieprawidłowy plik kopii zapasowej',
    noFavoriteGames: 'Brak ulubionych — dodaj gry gwiazdką przy tytule',

    portableTitle: 'Tryb przenośny (pendrive)',
    portableNote: 'Trzymaj konfigurację, statystyki i okładki razem z launcher em na pendrive. Po włączeniu dane trafiają do folderu LauncherData obok aplikacji, a ścieżki ROM-ów są zapisywane względem katalogu launchera — dzięki temu biblioteka działa po zmianie komputera lub litery dysku. Wymaga ponownego uruchomienia.',
    portableEnabled: 'Tryb przenośny aktywny',
    portableDisabled: 'Tryb przenośny wyłączony (dane w katalogu użytkownika)',
    portableUnavailable: 'Tryb przenośny jest niedostępny w tej wersji.',
    portableEnable: 'Włącz tryb przenośny',
    portableDisable: 'Wyłącz tryb przenośny',
    portableEnableConfirm: 'Włączyć tryb przenośny? Obecna konfiguracja, statystyki i cache okładek zostaną skopiowane do folderu LauncherData obok launchera, a aplikacja uruchomi się ponownie.',
    portableDisableConfirm: 'Wyłączyć tryb przenośny? Dane z pendrive zostaną skopiowane z powrotem do katalogu użytkownika, a aplikacja uruchomi się ponownie.',
    portableRestarting: 'Przeładowuję aplikację…',
    portableError: 'Nie udało się zmienić trybu przenośnego',
    portableDataDir: 'Katalog danych',

    openGameFolder: 'Otwórz folder gry',
    openFolderUnavailable: 'Nie udało się otworzyć folderu gry',
    libraryHealthTitle: 'Stan biblioteki',
    libraryHealthNote: 'Sprawdź, czy foldery ROM-ów istnieją, czy nie ma pustych plików i czy te same gry nie są zdublowane na różnych platformach.',
    checkLibrary: 'Sprawdź bibliotekę',
    checkingLibrary: 'Sprawdzanie biblioteki…',
    libraryHealthy: 'Biblioteka wygląda dobrze — nie znaleziono problemów.',
    folderMissing: 'Brak folderu ROM-ów:',
    noRomFolder: 'Nie ustawiono folderu ROM-ów.',
    emptyFile: 'Pusty plik (0 B):',
    duplicateGame: 'Duplikat gry na platformach:',

    gameLaunchArgs: 'Argumenty uruchomienia (ta gra)',
    gameLaunchArgsNote: 'Nadpisują argumenty platformy tylko dla tej gry.',
    saveGameArgs: 'Zapisz argumenty',
    gameArgsSaved: 'Zapisano argumenty gry',

    statsTitle: 'Statystyki',
    statsNote: 'Zbiorcze podsumowanie czasu gry, liczby uruchomień i ulubionych. Dane pochodzą z pliku playtime i odświeżają się po powrocie z gry.',
    refreshStats: 'Odśwież statystyki',
    checkingStats: 'Liczenie statystyk…',
    statsTotalTime: 'Łączny czas gry',
    statsGamesPlayed: 'Gry z czasem',
    statsLaunches: 'Łączna liczba uruchomień',
    statsFavorites: 'Ulubione gry',
    statsTopGames: 'Najczęściej grane',
    statsByPlatform: 'Czas według platform',
    statsNoData: 'Brak danych — uruchom pierwszą grę, aby zobaczyć statystyki.',

    gamelistTitle: 'Import z EmulationStation',
    gamelistNote: 'Zaimportuj plik gamelist.xml: tytuły, opisy, gatunki, rok, developera, ocenę i okładki. Dopasowanie odbywa się po nazwie pliku ROM lub tytule. Względne ścieżki obrazków działają w wersji Electron.',
    gamelistPlatform: 'Platforma docelowa',
    gamelistNoOverwrite: 'Nie nadpisuj istniejących metadanych',
    importGamelist: 'Wybierz gamelist.xml',
    gamelistImported: 'Zaimportowano gamelist.xml',
    gamelistInvalid: 'Nieprawidłowy plik gamelist.xml',
    gamelistNoPlatform: 'Najpierw wybierz platformę',
    gamelistReadError: 'Nie udało się odczytać pliku gamelist.xml',
    gamelistSkipped: 'pominięto',
    gamelistNoMatch: 'bez dopasowania',
    gamelistUpdated: 'zaktualizowano',

    artworkWarning: 'Okładki i opisy są pobierane z zewnętrznych baz (SteamGridDB, RAWG, ScreenScraper, TheGamesDB). Pobieranie możesz uruchomić dla jednej platformy albo dla wszystkich naraz. Dla każdej platformy ustawisz też własny typ proporcji okładki oraz ręcznie podmienisz cover wybranej gry.'
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
    fullscreenOnLaunch: 'Fullscreen on launch',
    enabled: 'Enabled',
    disabled: 'Disabled',
    saveStartup: 'Save startup settings',

    metaSourcesTitle: 'Metadata and cover sources',
    metaSourcesNote: 'Configure API keys for each scraper. SteamGridDB and RAWG work best for newer games, ScreenScraper and TheGamesDB are focused on retro (SNES, Genesis, arcade, handhelds). You can configure only the sources you want to use — the rest will be skipped when fetching.',

    saveKey: 'Save key',

    rawgNote: 'The RAWG API key is used to fetch descriptions, genres and Metacritic score. Generate a free key at rawg.io/apidocs.',

    screenscraperNote: 'Main metadata source for retro (descriptions, genres, player count, covers). Requires a screenscraper.fr account plus an application identifier (Dev ID + app password) — enter both pairs below.',
    screenscraperUser: 'ScreenScraper login',
    screenscraperPassword: 'ScreenScraper password',
    screenscraperDevId: 'App Dev ID (API)',
    screenscraperDevPass: 'App password (API)',
    devIdPlaceholder: 'e.g. the id from the API request form',
    usernamePlaceholder: 'Username',
    passwordPlaceholder: 'Password',
    testScreenscraper: 'Test connection',
    screenscraperTestOk: 'ScreenScraper works ✓',
    screenscraperTestFail: 'ScreenScraper test failed',
    autoFetchOnStart: 'Auto-fetch on startup',
    autoFetchOnStartNote: 'On startup the launcher silently fills missing covers and descriptions in the background. Requires configured API keys. Off by default.',
    enabledShort: 'On',
    disabledShort: 'Off',
    saveAutoFetch: 'Save option',

    fetchMissingCovers: 'Fetch missing covers',
    fetchingCovers: 'Fetching covers…',
    coversFetchedPlatforms: 'Metadata updated for platforms',
    coversFetchedDone: 'Done — covers and descriptions refreshed',
    coversFetchError: 'Failed to fetch metadata',

    viewModeDetailed: 'List with description (EmulationStation)',
    viewModeHero: 'Spotlight with description',
    viewModeBigbox: 'Fullscreen covers',
    viewModeFramed: 'Platform-framed shelf',
    playtimeLabel: 'Playtime',
    noDescription: 'No description yet — use “Fetch covers and descriptions” in Settings.',

    gamesdbNote: 'Backup cover source for niche ROMs when SteamGridDB and ScreenScraper find no match. Requires a free API key from thegamesdb.net.',

    language: 'Language',
    languageNote: 'Choose the application interface language.',
    languageInterface: 'Interface language',
    saveLanguage: 'Save language',
    theme: 'Theme',
    themeNote: 'Choose the graphical theme of the interface. The change is applied instantly.',
    themeInterface: 'Interface theme',
    saveTheme: 'Save theme',
    themeDefault: 'Default (dark)',
    themeWii: 'Wii — light, glossy',
    themeSwitch: 'Nintendo Switch — red',
    themePs3: 'PlayStation 3 — XMB',
    themeXbox: 'Xbox — green',
    themeSaved: 'Theme saved ✓',
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
    aspectPortrait: 'Portrait (Steam 2:3)',
    aspectNds: 'Nintendo DS / wide',
    aspectGba: 'Game Boy Advance',
    aspectBanner: 'Banner 16:9',
    aspectMarquee: 'Arcade marquee (3:1)',
    aspectSteam: 'Steam Grid (2:3)',
    aspectCustom: 'Custom ratio…',
    customWidth: 'Width (px)',
    customRatio: 'Ratio (width / height)',
    aspectCustomHint: 'E.g. 0.72 for classic box art or 1 for a square.',
    platformKind: 'Platform type',
    platformKindConsole: 'Console / emulator',
    platformKindPc: 'PC (.exe / Linux files)',
    platformNamePlaceholder: 'Platform name, e.g. Dreamcast',
    platformExtsPlaceholder: 'Extensions, e.g. .gdi, .cdi',
    platformPresetHint: 'Start typing a name — we will suggest popular platforms and fill in the settings.',
    renamePlatform: 'Rename platform',
    renamePlatformPrompt: 'Enter the new platform name:',
    platformRenamed: 'Platform renamed',
    pcSettingsTitle: 'PC game launching',
    pcSettingsNote: 'Applies to PC-type platforms. Windows games on Linux run through Wine/Proton; native games run directly.',
    pcRunner: 'Runner',
    pcRunnerNative: 'Native (Linux / Windows)',
    pcRunnerWine: 'Wine (system)',
    pcRunnerWineGe: 'Wine-GE',
    pcRunnerProtonGe: 'Proton-GE',
    pcRunnerAuto: 'Automatic (detect)',
    pcPrefix: 'Wine prefix (WINEPREFIX)',
    pcPrefixPlaceholder: 'Default: ~/Games/retro-launcher',
    pcEnv: 'Environment variables',
    pcEnvPlaceholder: 'E.g. WINEDLLOVERRIDES=... (one per line)',
    pcEnvHint: 'Format KEY=VALUE, one variable per line.',
    pcRunnerPath: 'Runner path (optional)',
    pcRunnerPathPlaceholder: 'E.g. ~/.local/share/Steam/compatibilitytools.d/GE-Proton...',
    pcDetect: 'Detect runners',
    pcDetected: 'Runners detected',
    pcInstall: 'Download',
    pcInstalling: 'Downloading…',
    pcRunnerInstalled: 'Runner installed',
    pcRunnerInstallFailed: 'Failed to install runner',
    pcRunnerExists: 'Runner is already installed',
    pcRunnerNotFound: 'Required runner was not found. Install it with the “Download” button.',
    pcExeNeedsRunner: 'A .exe file on Linux needs a Wine or Proton runner — choose one in the PC platform settings.',
    pcRunnerNotSupported: 'Automatic runner installation is available on Linux only.',
    pcWineMissing: 'Wine was not found on this system.',
    pcNoSteam: 'Steam directory was not found (required by Proton).',
    pcWinetricks: 'Winetricks',
    pcWinetricksHint: 'Packages installed into the selected prefix, e.g. corefonts vcrun2019.',
    pcWinetricksPlaceholder: 'corefonts vcrun2019',
    pcWinetricksRun: 'Run winetricks',
    pcWinetricksStarted: 'Winetricks started in the background',
    pcWinetricksError: 'Winetricks error',
    pcAddGames: 'Add games…',
    pcScanFolder: 'Scan folder…',
    pcClearGames: 'Clear PC game list',
    pcGameCount: 'PC games added: ',
    pcAddGamesSuccess: 'PC games added: ',
    pcScanSuccess: 'Files found and added: ',
    pcNoExecutables: 'No executable files found in this folder.',
    pcClearConfirm: 'Remove all manually added PC games from this platform?',
    pcGamesCleared: 'PC game list cleared',
    pcChooseFiles: 'Choose game files (.exe / .AppImage / .sh)',
    pcGameRunner: 'Runner for this game',
    pcGamePrefix: 'Prefix for this game',
    pcGameEnv: 'Variables for this game',
    pcGameOverrideHint: 'Empty fields use the platform settings.',
    pcSaveOverride: 'Save game settings',
    pcResetOverride: 'Clear overrides',
    pcOverrideSaved: 'Saved game launch settings',
    pcOverrideReset: 'Cleared game overrides',
    pcPlatformNote: 'This platform stores a list of executable files instead of a ROM folder.',
    pcRemoveGame: 'Remove from PC list',
    pcRunnerDownloading: 'Downloading runner…',
    noTestBridge: 'No IPC bridge for launch test',
    testCommandLaunched: 'Test command launched',
    testFailed: 'Test failed',
    platformRemoved: 'Platform removed',
    savedSteamgridKey: 'Saved SteamGridDB API key',
    savedRawgKey: 'Saved RAWG API key',
    savedScreenscraperCredentials: 'Saved ScreenScraper credentials',
    savedGamesDbKey: 'Saved TheGamesDB API key',
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
    gameRenamed: 'Game name changed.',

    gamesManager: 'Games manager',
    gamesManagerNote: 'Pick a platform and hide selected games or files so they no longer appear on the shelf. Hiding is saved separately for each platform and can be undone at any time.',
    managerPlatform: 'Platform',
    managerSearchPlaceholder: 'Search game or file…',
    hideGame: 'Hide',
    unhideGame: 'Unhide',
    hiddenBadge: 'Hidden',
    hideAllGames: 'Hide all',
    unhideAllGames: 'Unhide all',
    visibleBadge: 'Visible',
    noScannedGames: 'No files — set the ROM folder in the Platforms tab.',
    hiddenGamesSaved: 'Hidden state saved',
    platformHiddenCount: 'hidden',
    selectAll: 'Select all',
    hideSelected: 'Hide selected',
    unhideSelected: 'Unhide selected',
    selectedCount: 'selected',
    managerNoSelection: 'Select games to perform this action',

    // Favorites, sorting, random game, attract mode, backups.
    sortBy: 'Library sorting',
    sortDefault: 'Default',
    sortRecent: 'Recently played',
    sortFavorites: 'Favorites',
    sortTitle: 'A–Z',
    sortPlaytime: 'Playtime',
    favoriteAdd: 'Add to favorites',
    favoriteRemove: 'Remove from favorites',
    favoriteAdded: 'Added to favorites',
    favoriteRemoved: 'Removed from favorites',
    randomGame: 'Random game',
    randomGameToast: 'Picked: ',
    randomGameEmpty: 'No games to pick from',
    attractMode: 'Attract mode',
    attractModeNote: 'When idle, the launcher cycles through games on the shelf like a screensaver. Any key press or gamepad input restores normal control.',
    saveAttract: 'Save attract mode',
    attractSaved: 'Attract mode saved',
    attractHint: 'Attract mode — press any key to return',
    launchCount: 'Launch count',
    lastPlayed: 'Last played',
    neverPlayed: 'Never',
    backupTitle: 'Backup',
    backupNote: 'Save configuration, platforms, covers, metadata and playtime statistics to a JSON file. Import restores everything and reloads the app.',
    exportBackup: 'Export backup',
    importBackup: 'Import backup',
    backupExported: 'Backup saved',
    backupImported: 'Backup imported — reloading…',
    backupImportError: 'Failed to import backup',
    backupInvalid: 'Invalid backup file',
    noFavoriteGames: 'No favorites yet — star a game to add it here',

    portableTitle: 'Portable mode (USB drive)',
    portableNote: 'Keep the configuration, statistics, and covers together with the launcher on a USB drive. When enabled, data goes to the LauncherData folder next to the app and ROM paths are stored relative to the launcher directory — so the library keeps working after changing computers or drive letters. Requires a restart.',
    portableEnabled: 'Portable mode active',
    portableDisabled: 'Portable mode disabled (data in the user directory)',
    portableUnavailable: 'Portable mode is unavailable in this build.',
    portableEnable: 'Enable portable mode',
    portableDisable: 'Disable portable mode',
    portableEnableConfirm: 'Enable portable mode? The current configuration, statistics, and cover cache will be copied to the LauncherData folder next to the launcher, and the app will restart.',
    portableDisableConfirm: 'Disable portable mode? Data from the USB drive will be copied back to the user directory, and the app will restart.',
    portableRestarting: 'Reloading the app…',
    portableError: 'Failed to change portable mode',
    portableDataDir: 'Data directory',

    openGameFolder: 'Open game folder',
    openFolderUnavailable: 'Failed to open the game folder',
    libraryHealthTitle: 'Library health',
    libraryHealthNote: 'Check whether ROM folders exist, whether there are empty files, and whether the same games are duplicated across platforms.',
    checkLibrary: 'Check library',
    checkingLibrary: 'Checking library…',
    libraryHealthy: 'Library looks good — no problems found.',
    folderMissing: 'Missing ROM folder:',
    noRomFolder: 'No ROM folder configured.',
    emptyFile: 'Empty file (0 B):',
    duplicateGame: 'Duplicate game on platforms:',

    gameLaunchArgs: 'Launch arguments (this game)',
    gameLaunchArgsNote: 'Override the platform arguments for this game only.',
    saveGameArgs: 'Save arguments',
    gameArgsSaved: 'Game arguments saved',

    statsTitle: 'Statistics',
    statsNote: 'Aggregate summary of playtime, launch count, and favorites. Data comes from the playtime file and refreshes after returning from a game.',
    refreshStats: 'Refresh statistics',
    checkingStats: 'Calculating statistics…',
    statsTotalTime: 'Total playtime',
    statsGamesPlayed: 'Games with playtime',
    statsLaunches: 'Total launches',
    statsFavorites: 'Favorite games',
    statsTopGames: 'Most played',
    statsByPlatform: 'Playtime by platform',
    statsNoData: 'No data yet — launch your first game to see statistics.',

    gamelistTitle: 'EmulationStation import',
    gamelistNote: 'Import a gamelist.xml file: titles, descriptions, genres, year, developer, rating, and covers. Matching uses the ROM filename or title. Relative image paths work in the Electron build.',
    gamelistPlatform: 'Target platform',
    gamelistNoOverwrite: 'Do not overwrite existing metadata',
    importGamelist: 'Choose gamelist.xml',
    gamelistImported: 'gamelist.xml imported',
    gamelistInvalid: 'Invalid gamelist.xml file',
    gamelistNoPlatform: 'Choose a platform first',
    gamelistReadError: 'Failed to read the gamelist.xml file',
    gamelistSkipped: 'skipped',
    gamelistNoMatch: 'no match',
    gamelistUpdated: 'updated',

    artworkWarning: 'Covers and descriptions are fetched from external databases (SteamGridDB, RAWG, ScreenScraper, TheGamesDB). You can fetch for a single platform or for all at once. Each platform can also have its own cover aspect ratio, and any game cover can be replaced manually.'
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

  const allowedThemes = ['default', 'wii', 'switch', 'ps3', 'xbox'];
  if (!allowedThemes.includes(config.uiState.theme)) {
    config.uiState.theme = 'default';
  }

  if (typeof config.uiState.settingsOpen !== 'boolean') {
    config.uiState.settingsOpen = false;
  }

  if (typeof config.uiState.autoFetchOnStart !== 'boolean') {
    config.uiState.autoFetchOnStart = false;
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

  if (
    !config.gameArgs
    || typeof config.gameArgs !== 'object'
    || Array.isArray(config.gameArgs)
  ) {
    config.gameArgs = {};
  }

  if (!config.pcGames || typeof config.pcGames !== 'object' || Array.isArray(config.pcGames)) {
    config.pcGames = {};
  }

  if (!config.pcGameSettings || typeof config.pcGameSettings !== 'object' || Array.isArray(config.pcGameSettings)) {
    config.pcGameSettings = {};
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

  if (
    !config.hiddenGames
    || typeof config.hiddenGames !== 'object'
    || Array.isArray(config.hiddenGames)
  ) {
    config.hiddenGames = {};
  }

  if (!config.apiKeys || typeof config.apiKeys !== 'object') {
    config.apiKeys = {};
  }

  // Każdy klucz scrapera ma własny, jawny domyślny string — ten sam
  // wzorzec co istniejący config.apiKeys.steamgrid, rozszerzony o
  // RAWG, ScreenScraper (login+hasło) i TheGamesDB.
  if (typeof config.apiKeys.steamgrid !== 'string') {
    config.apiKeys.steamgrid = '';
  }

  if (typeof config.apiKeys.rawg !== 'string') {
    config.apiKeys.rawg = '';
  }

  if (typeof config.apiKeys.screenscraperUser !== 'string') {
    config.apiKeys.screenscraperUser = '';
  }

  if (typeof config.apiKeys.screenscraperPassword !== 'string') {
    config.apiKeys.screenscraperPassword = '';
  }

  if (typeof config.apiKeys.thegamesdb !== 'string') {
    config.apiKeys.thegamesdb = '';
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

      apiKeys: {
        ...config.apiKeys,
        ...(loadedConfig.apiKeys || {})
      },

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
