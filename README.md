# Retro Launcher

**Language / Język:** [Polski](#polski) | [English](#english)

![widok](https://pbs.twimg.com/media/HOeBAbxXwAArTMc?format=jpg&name=large)
![widok](https://pbs.twimg.com/media/HOeF8LPWgAEquvA?format=jpg&name=large)

---

## Polski

Retro Launcher to desktopowy launcher gier retro inspirowany trybem Steam Big Picture. Aplikacja działa w Electronie, obsługuje pada, pełny ekran, bibliotekę ROM-ów dla wielu platform, ręczne i automatyczne okładki oraz trwały zapis konfiguracji emulatorów na dysku.

### Co potrafi

- Przegląda bibliotekę gier w widoku kanapy, z nawigacją klawiaturą i padem.
- Obsługuje wiele platform jednocześnie, każdą z własnym folderem ROM-ów, emulatorem i argumentami startowymi.
- Uruchamia gry przez skonfigurowane emulatory.
- Pozwala testować polecenie uruchomieniowe emulatora z poziomu ustawień.
- Pobiera okładki i opisy z SteamGridDB po wpisaniu klucza API.
- Pozwala ręcznie ustawić okładkę gry przez URL albo plik lokalny.
- Zapamiętuje ustawienia użytkownika, platformy, ścieżki ROM-ów, emulatory, argumenty, okładki i preferencje widoku.
- Obsługuje pełny ekran przy starcie oraz przełączanie fullscreen w trakcie pracy.
- Ma efekty dźwiękowe UI, animowane tło i obsługę kilku trybów widoku półki z grami.
- Działa z bezpiecznym mostkiem preload/IPC między rendererem a main process.

### Dla kogo

Projekt jest przeznaczony dla osób, które chcą mieć jeden interfejs do uruchamiania gier retro z różnych emulatorów, najlepiej z poziomu kanapy, kontrolera albo mini-PC pod telewizorem.

### Szybki start

1. Uruchom aplikację.
2. Otwórz zakładkę **Ustawienia**.
3. Dodaj platformę albo użyj już istniejących wpisów.
4. Dla każdej platformy ustaw:
   - folder z ROM-ami,
   - polecenie uruchomieniowe emulatora,
   - opcjonalne argumenty startowe,
   - typ okładki.
5. Zapisz ustawienia.
6. Wróć do biblioteki i wybierz grę.
7. Uruchom grę przyciskiem `Uruchom` albo padem.

### Jak działa konfiguracja platform

Każda platforma może mieć własny zestaw ustawień:

- nazwę i identyfikator,
- kolor wyróżnienia,
- listę rozszerzeń ROM-ów,
- folder z ROM-ami,
- emulator lub komendę uruchomieniową,
- domyślne argumenty,
- preferowany format okładki.

Dzięki temu można osobno skonfigurować np. PSP, PS2, PS1, SNES, DS albo inne systemy.

### Okładki i metadane

Launcher wspiera dwa sposoby zarządzania grafikami:

#### Automatyczne

Po wpisaniu klucza SteamGridDB API można pobierać:

- okładki,
- opisy,
- dodatkowe dane dla gier.

Pobieranie można wykonać dla jednej platformy albo dla wszystkich naraz.

#### Ręczne

Dla każdej gry można ręcznie ustawić okładkę przez:

- adres URL,
- lokalny plik z dysku.

Można też usunąć ręczną okładkę i wrócić do automatycznej.

### Obsługa pada

Launcher jest przygotowany do używania kontrolera jako głównej metody nawigacji.

- Lewo/prawo, D-pad lub analog: przełączanie gier.
- Góra: otwarcie listy platform.
- LB / RB: szybka zmiana platformy.
- LT / RT: zmiana trybu widoku półki.
- A: uruchomienie gry albo zatwierdzenie wyboru.
- Y: otwarcie szczegółów gry.
- B: powrót lub zamknięcie aktywnego panelu.
- Start: otwarcie ustawień.

### Klawiatura

- `Strzałka w lewo` / `Strzałka w prawo`: przełączanie gier.
- `Enter`: uruchomienie wybranej gry.
- `Esc`: zamknięcie modala albo powrót z ustawień.
- `F11` lub `Alt+Enter`: przełączenie pełnego ekranu.

### Gdzie zapisują się ustawienia

Konfiguracja jest zapisywana trwale w pliku JSON w katalogu danych użytkownika systemu. Obejmuje to między innymi:

- platformy,
- ścieżki do ROM-ów,
- emulatory,
- argumenty uruchomieniowe,
- ustawienia interfejsu,
- ręczne okładki,
- część metadanych.

Przykładowe lokalizacje:

- Windows: `%APPDATA%/retro-launcher`
- Linux: katalog `userData` Electron dla aplikacji

### Testowanie emulatora

W ustawieniach każdej platformy można użyć przycisku `Testuj`, aby sprawdzić, czy polecenie emulatora uruchamia się poprawnie. To ułatwia diagnozowanie problemów zanim użytkownik spróbuje uruchomić konkretną grę.

### Flatpak i Linux

Przy uruchamianiu w Flatpaku niektóre emulatory lub foldery spoza sandboxa mogą wymagać dodatkowych uprawnień. Jeśli emulator działa na hoście, a launcher jest zamknięty w sandboxie, może być potrzebne uruchamianie przez `flatpak-spawn --host` albo nadanie dostępu do systemu plików.

### Najczęstszy scenariusz użycia

1. Dodanie platformy, na przykład PSP.
2. Wskazanie folderu z ROM-ami.
3. Ustawienie emulatora, na przykład PPSSPP.
4. Opcjonalne ustawienie argumentów typu fullscreen.
5. Pobranie okładek z API albo ręczne podpięcie grafik.
6. Nawigacja po bibliotece z poziomu pada.
7. Uruchamianie gier z jednego, spójnego interfejsu.

### Rozwiązywanie problemów

#### Emulator się nie uruchamia

Sprawdź:

- czy ścieżka lub komenda emulatora jest poprawna,
- czy emulator uruchamia się ręcznie poza launcherem,
- czy argumenty startowe są poprawne,
- czy przycisk `Testuj` działa dla danej platformy.

#### Nie widać okładki

Sprawdź:

- czy URL jest poprawny,
- czy lokalny plik istnieje,
- czy aplikacja ma dostęp do pliku,
- czy dla Linux/Flatpak nie brakuje uprawnień do odczytu plików.

### Status projektu

Projekt rozwija launcher typu couch-gaming UI dla emulatorów i bibliotek ROM-ów, z naciskiem na prostą obsługę, sterowanie padem i szybkie uruchamianie gier.

### Wersja 1.1.0

- Naprawienie focusowania po włączeniu emu (minimalizacja launchera i powrót po zamknięciu emu).
- Dodanie skanowania plików w subfolderach.
- Dodanie możliwości zmiany nazwy konkretnej gry.
- Dodano grid do widoków.
- Dodano skrót klawiszowy do powrotu do menu (pad).

[⬆ Powrót na góre](#retro-launcher)

---

## English

Retro Launcher is a desktop launcher for retro games, inspired by Steam's Big Picture mode. The app runs on Electron, supports gamepads, fullscreen mode, a ROM library for multiple platforms, manual and automatic cover art, and persistent on-disk storage of emulator configurations.

### What it can do

- Browse your game library in a couch-mode view, with keyboard and gamepad navigation.
- Support multiple platforms simultaneously, each with its own ROM folder, emulator, and launch arguments.
- Launch games through configured emulators.
- Test the emulator launch command directly from the settings panel.
- Fetch cover art and descriptions from SteamGridDB after entering an API key.
- Manually set a game's cover art via URL or a local file.
- Remember user settings, platforms, ROM paths, emulators, arguments, cover art, and view preferences.
- Support fullscreen on startup as well as toggling fullscreen while running.
- Include UI sound effects, an animated background, and several shelf view modes for games.
- Use a secure preload/IPC bridge between the renderer and the main process.

### Who it's for

The project is designed for people who want a single interface to launch retro games from different emulators, ideally from the couch, using a controller, or from a mini-PC connected to a TV.

### Quick start

1. Launch the app.
2. Open the **Settings** tab.
3. Add a platform or use an existing entry.
4. For each platform, set:
   - the ROM folder,
   - the emulator launch command,
   - optional startup arguments,
   - the cover art type.
5. Save the settings.
6. Return to the library and select a game.
7. Launch the game with the `Run` button or the gamepad.

### How platform configuration works

Each platform can have its own set of settings:

- name and identifier,
- highlight color,
- list of ROM file extensions,
- ROM folder,
- emulator or launch command,
- default arguments,
- preferred cover art format.

This lets you configure systems like PSP, PS2, PS1, SNES, DS, or others independently.

### Cover art and metadata

The launcher supports two ways of managing artwork:

#### Automatic

After entering a SteamGridDB API key, you can fetch:

- cover art,
- descriptions,
- additional game data.

Fetching can be run for a single platform or for all platforms at once.

#### Manual

For each game, you can manually set cover art via:

- a URL,
- a local file from disk.

You can also remove a manual cover and revert to the automatic one.

### Gamepad support

The launcher is built with a controller as the primary navigation method.

- Left/right, D-pad or analog stick: switch between games.
- Up: open the platform list.
- LB / RB: quickly switch platforms.
- LT / RT: change shelf view mode.
- A: launch the game or confirm a selection.
- Y: open game details.
- B: go back or close the active panel.
- Start: open settings.

### Keyboard

- `Left arrow` / `Right arrow`: switch between games.
- `Enter`: launch the selected game.
- `Esc`: close a modal or go back from settings.
- `F11` or `Alt+Enter`: toggle fullscreen.

### Where settings are saved

The configuration is stored persistently in a JSON file inside the system's user data directory. This includes, among other things:

- platforms,
- ROM paths,
- emulators,
- launch arguments,
- interface settings,
- manual cover art,
- some metadata.

Example locations:

- Windows: `%APPDATA%/retro-launcher`
- Linux: Electron's `userData` directory for the app

### Testing the emulator

In each platform's settings, you can use the `Test` button to check whether the emulator command launches correctly. This makes it easier to diagnose problems before trying to run a specific game.

### Flatpak and Linux

When running inside Flatpak, some emulators or folders outside the sandbox may require additional permissions. If the emulator runs on the host while the launcher is confined to the sandbox, you may need to run it via `flatpak-spawn --host` or grant filesystem access.

### Most common usage scenario

1. Add a platform, for example PSP.
2. Point it to the ROM folder.
3. Set up the emulator, for example PPSSPP.
4. Optionally set arguments such as fullscreen.
5. Fetch cover art via the API or attach graphics manually.
6. Navigate the library using the gamepad.
7. Launch games from a single, consistent interface.

### Troubleshooting

#### The emulator won't launch

Check:

- whether the emulator path or command is correct,
- whether the emulator launches manually outside the launcher,
- whether the startup arguments are correct,
- whether the `Test` button works for that platform.

#### No cover art showing

Check:

- whether the URL is correct,
- whether the local file exists,
- whether the app has access to the file,
- whether, on Linux/Flatpak, file read permissions are missing.

### Project status

The project is developing a couch-gaming UI launcher for emulators and ROM libraries, with a focus on ease of use, gamepad control, and fast game launching.

### Version 1.1.0

- Fixed window focus after launching an emulator (launcher minimizes and restores after the emulator closes).
- Added scanning of files in subfolders.
- Added the ability to rename a specific game.
- Added a grid layout to the views.
- Added a keyboard/gamepad shortcut to return to the menu.

[⬆ Back to top](#retro-launcher)
