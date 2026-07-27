# Retro Launcher

Launcher gier retro w stylu Steam Big Picture, z obsluga pada, animowanym tlem,
dzwiekami UI, muzyka w tle oraz konfiguracja emulatorow zapisywana trwale na dysku.

## Instalacja

```
npm install
```

## Uruchomienie

```
npm start
```

## Konfiguracja

W zakladce "Ustawienia" w aplikacji ustaw:
- Folder z ROM-ami dla kazdej platformy
- Sciezke do pliku wykonywalnego emulatora (domyslne propozycje sa juz wpisane: PPSSPP, PCSX2, DuckStation, RPCS3, Snes9x, melonDS, Xenia)

Ustawienia sa zapisywane automatycznie do pliku JSON w katalogu danych uzytkownika
systemu (np. %APPDATA%/retro-launcher na Windows) i wczytywane przy kazdym starcie.

## Obsluga pada

- Lewo/prawo (dpad lub analog) - przelaczanie gier
- Gora (dpad) - otworz dropdown platform
- LB / RB - szybkie przelaczanie platform
- A - uruchom gre / zatwierdz wybor
- Y - szczegoly gry
- B - wstecz / zamknij
- Start - otworz ustawienia

## Struktura projektu

```
src/
  main/main.js       - proces glowny Electron (okna, IPC, uruchamianie emulatorow)
  preload/preload.js - bezpieczny mostek API do renderera
  renderer/           - interfejs uzytkownika (HTML/CSS/JS)
```
