# Retro Launcher 2.0 — wersja Tauri

Port launchera z Electrona na Tauri 2. Frontend (`src/renderer`) pozostał
bez zmian — w `src-tauri` stoi backend w Rust, a `src/renderer/bridge.js`
udostępnia rendererowi dokładnie ten sam interfejs `window.launcherAPI`,
co Electronowy `preload.js`.

## Budowanie

```bash
sudo apt install -y build-essential libwebkit2gtk-4.1-dev libgtk-3-dev \
    librsvg2-dev libayatana-appindicator3-dev
npm install
npm run dist:deb        # tylko .deb dla Debiana/Ubuntu
npm run dist            # .deb + AppImage
```

Produkty builda trafiają do `src-tauri/target/release/bundle/deb/`.
Do szybkiego testu można też odpalić binarkę bezpośrednio:
`src-tauri/target/release/retro-launcher`.

## Wydania (release)

- **Linux** buduje się lokalnie: `npm run dist` → `.deb` + `.AppImage`.
- **Windows** nie da się cross-kompilować z Linuksa — build NSIS robi
  GitHub Actions na `windows-latest` (`.github/workflows/release.yml`).
- Publikacja: push taga `rel/*`, np. `git tag rel/2.1.1 && git push origin rel/2.1.1`.
  Workflow zbuduje oba systemy i utworzy release z plikami `.deb`,
  `.AppImage`, `-setup.exe` oraz `SHA256SUMS.txt`.

## Różnice względem wersji Electronowej

| Temat | Electron 1.x | Tauri 2.0 |
|---|---|---|
| Okładek cache lokalny | `file://` | asset protocol (`convertFileSrc`); stare configi z `file://` konwertowane automatycznie (bridge) |
| Stop-kombo pada | ukryte okno `input-watch` + `backgroundThrottling: false` | watchdog w Rust (`/dev/input`, kombinacja L3+R3+LB+RB) |
| `emulator:test` | handler nie istniał (dead path) | zaimplementowany |
| Rozmiar pakietu | ~90 MB | ~10-15 MB |
| RAM przy starcie | ~300 MB | ~50-100 MB |

## Kompatybilność danych

Ścieżka danych pozostała bez zmian: `~/.config/retro-launcher`
(`retro-launcher-config.json`, `retro-launcher-playtime.json`, `covers/`).
Instalacja nowej wersji nie utraci konfiguracji ani postępów gry.

## Struktura

- `src-tauri/src/main.rs` — cała logika backendowa (port `src/main/main.js`),
- `src/renderer/bridge.js` — most IPC zgodny z preload.js + fetch-fallback (CORS),
- `src-tauri/tauri.conf.json` — okno główne, bundling (deb), asset protocol.
