// Retro Launcher 2.0 (Tauri) — warstwa zgodności z Electronową `window.launcherAPI`.
//
// Renderer pozostaje nietknięty: wszystkie metody mają te same sygnatury i
// kształty odpowiedzi co w preload.js z Electrona. Pod maską:
//  - IPC → komendy Rusta (invoke),
//  - okładki → asset protocol (convertFileSrc) zamiast file://,
//  - dialogi → tauri-plugin-dialog,
//  - fetch → zwykły fetch z automatycznym fallbackiem na http_proxy (CORS),
//  - watchdog pada → Rust (brak ukrytego okna input-watch).
(function () {
  const T = window.__TAURI__;
  if (!T || !T.core) {
    console.error('[bridge] brak __TAURI__ — czy withGlobalTauri jest włączone?');
    return;
  }

  const { invoke, convertFileSrc } = T.core;

  // -------------------------------------------------------------- zdarzenia okna
  const focusCbs = [];
  const blurCbs = [];
  T.event.listen('app:window-focus', () => { focusCbs.forEach(cb => { try { cb(); } catch (_) {} }); });
  T.event.listen('app:window-blur', () => { blurCbs.forEach(cb => { try { cb(); } catch (_) {} }); });

  // -------------------------------------------------------------- okładki: ścieżki ↔ asset URL
  function pathFromFileUrl(u) {
    try {
      const raw = u.replace(/^file:\/\//i, '');
      // file:///home/x.jpg → /home/x.jpg ; na Windows file:///C:/x.jpg → C:/x.jpg
      const m = raw.match(/^\/[A-Za-z]:/);
      return decodeURIComponent(m ? raw.slice(1) : raw);
    } catch (_) {
      return u;
    }
  }

  // Konwertuje dowolną wartość okładki (http, file://, stara ścieżka) na URL
  // właściwy dla webview Tauri. Idempotentna.
  function toCoverUrl(value) {
    if (!value || typeof value !== 'string') return value;
    if (/^https?:/i.test(value)) return value;
    if (/^asset:/i.test(value) || value.startsWith('http://asset.localhost')) return value;
    if (/^data:/i.test(value)) return value;
    if (/^file:/i.test(value)) return convertFileSrc(pathFromFileUrl(value));
    if (/^[A-Za-z]:[\\/]/.test(value)) return convertFileSrc(value);
    if (value.startsWith('/')) return convertFileSrc(value);
    return value;
  }

  // -------------------------------------------------------------- platforma
  const isWindows = /^Win/.test(navigator.platform || '');

  // -------------------------------------------------------------- API (1:1 z preload.js)
  window.launcherAPI = {
    loadConfig: () => invoke('config_load'),
    saveConfig: (config) => invoke('config_save', { config }),

    selectFolder: () => T.dialog.open({ multiple: false, directory: true }).then(v => v || null),
    selectExecutable: () => T.dialog
      .open({
        multiple: false,
        filters: isWindows
          ? [{ name: 'Programy', extensions: ['exe'] }, { name: 'Wszystkie pliki', extensions: ['*'] }]
          : []
      })
      .then(v => v || null),
    selectImageFile: () => T.dialog
      .open({
        multiple: false,
        filters: [
          { name: 'Obrazy', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
          { name: 'Wszystkie pliki', extensions: ['*'] }
        ]
      })
      .then(v => v || null),
    selectGameFiles: () => T.dialog
      .open({
        multiple: true,
        filters: isWindows
          ? [{ name: 'Gry', extensions: ['exe'] }]
          : [
              { name: 'Gry', extensions: ['exe', 'AppImage', 'sh', 'bin'] },
              { name: 'Wszystkie pliki', extensions: ['*'] }
            ]
      })
      .then(v => (Array.isArray(v) ? v : v ? [v] : [])),

    scanRoms: (folderPath, extensions) => invoke('roms_scan', { folderPath, extensions }),
    scanExecutables: (folderPath, extensions) => invoke('fs_scan_executables', { folderPath, extensions }),
    launchGame: (payload) => invoke('game_launch', payload),
    launchPcGame: (payload) => invoke('pc_launch', { payload }),
    detectPcRunners: () => invoke('pc_detect_runners'),
    installPcRunner: (runner) => invoke('pc_install_runner', { runner }),
    runWinetricks: (payload) => invoke('pc_winetricks', { payload }),
    stopLastGame: () => invoke('game_stop_last'),
    testEmulator: (payload) => invoke('emulator_test', payload),

    toggleFullscreen: () => invoke('window_toggle_fullscreen'),
    getFullscreenState: () => invoke('window_get_fullscreen_state'),
    setFullscreen: (value) => invoke('window_set_fullscreen', { value }),

    cacheRemoteImage: async (payload) => {
      const res = await invoke('image_cache_remote', payload);
      if (res && res.ok && res.filePath) res.localUrl = convertFileSrc(res.filePath);
      return res;
    },

    // Żądania HTTP do zewnętrznych API (SteamGridDB, IGDB, TheGamesDB).
    // Idą przez backend, więc WebKit nie blokuje ich przez CORS.
    // Tauri przekazuje argumenty po nazwie parametru komendy (`req`).
    httpRequest: (payload) => invoke('http_proxy', { req: payload }),

    focusGame: () => invoke('game_focus'),
    getLastLaunchedPid: () => invoke('game_last_pid'),

    getPlaytime: (gameId) => invoke('game_get_playtime', { gameId }),
    getPlaytimeRaw: (gameId) => invoke('game_get_playtime_raw', { gameId }),
    getAllPlaytime: () => invoke('game_get_playtime_all'),

    getPortableInfo: () => invoke('portable_get'),
    enablePortableMode: () => invoke('portable_enable'),
    disablePortableMode: () => invoke('portable_disable'),

    showItemInFolder: (targetPath) => invoke('shell_show_item', { targetPath }),
    pathExists: (targetPath) => invoke('fs_path_exists', { targetPath }),

    onWindowFocus: (cb) => {
      focusCbs.push(cb);
      return () => {
        const i = focusCbs.indexOf(cb);
        if (i >= 0) focusCbs.splice(i, 1);
      };
    },
    onWindowBlur: (cb) => {
      blurCbs.push(cb);
      return () => {
        const i = blurCbs.indexOf(cb);
        if (i >= 0) blurCbs.splice(i, 1);
      };
    },
    onRunnerProgress: () => () => {}
  };

  // src/renderer/input-watch.js używał watchAPI — watchdog przeniesiony do Rusta,
  // okno input-watch nie istnieje; shim dla bezpieczeństwa.
  window.watchAPI = { stopLastGame: () => window.launcherAPI.stopLastGame() };

  // pomocnik globalny do konwersji okładek (używany przez storage.js)
  window.toCoverUrl = toCoverUrl;

  // -------------------------------------------------------------- context menu wyłączone
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // -------------------------------------------------------------- fetch + fallback CORS
  const origFetch = window.fetch ? window.fetch.bind(window) : null;

  function proxyResponse(raw) {
    return {
      ok: !!raw.ok,
      status: raw.status || 0,
      json: async () => JSON.parse(raw.body || 'null'),
      text: async () => raw.body || ''
    };
  }

  window.fetch = async function (input, init) {
    if (origFetch) {
      try {
        return await origFetch(input, init);
      } catch (e) {
        // fallback: przez backend (bez ograniczeń CORS)
      }
    }
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    const headers = {};
    const h = init && init.headers;
    if (h) {
      if (typeof h.forEach === 'function') h.forEach((v, k) => (headers[k] = v));
      else Object.keys(h).forEach(k => (headers[k] = h[k]));
    }
    const res = await invoke('http_proxy', {
      req: {
        url,
        method: (init && init.method) || 'GET',
        headers,
        body: typeof init?.body === 'string' ? init.body : null
      }
    });
    if (res && res.error && !('status' in res)) throw new Error(res.error);
    return proxyResponse(res);
  };
})();
