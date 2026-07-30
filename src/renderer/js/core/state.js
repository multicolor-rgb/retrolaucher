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
    shelfViewMode: 'flat'
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