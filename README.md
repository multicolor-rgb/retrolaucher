# Retro Launcher

**Language / Język:** [Polski](#polski) | [English](#english)

![widok](https://pbs.twimg.com/media/HOeBAbxXwAArTMc?format=jpg&name=large)
![widok](https://pbs.twimg.com/media/HOeF8LPWgAEquvA?format=jpg&name=large)

---

## Polski

Retro Launcher to desktopowy launcher gier retro inspirowany trybem Steam Big Picture. Aplikacja działa w Electronie, obsługuje pada, pełny ekran, bibliotekę ROM-ów dla wielu platform, ręczne i automatyczne okładki oraz trwały zapis konfiguracji emulatorów na dysku.

### Co potrafi

- Przegląda bibliotekę gier w widoku kanapy, z nawigacją klawiaturą i padem.
- Oferuje 9 trybów półki: płaski, łuk (coverflow), Big Picture, kaskadowy, siatkę, listę z opisem (EmulationStation), spotlight, pełnoekranowe okładki i półkę w ramce platformy.
- Obsługuje wiele platform jednocześnie, każdą z własnym folderem ROM-ów, emulatorem i argumentami startowymi.
- Uruchamia gry przez skonfigurowane emulatory.
- Pozwala testować polecenie uruchomieniowe emulatora z poziomu ustawień.
- Pobiera okładki i opisy z wielu źródeł: SteamGridDB, RAWG, ScreenScraper.fr i TheGamesDB — z automatycznym cache'owaniem grafik.
- Pozwala ręcznie ustawić okładkę gry przez URL albo plik lokalny.
- Używa lokalnego placeholdera okładki („BRAK OKŁADKI / NO COVER”) dla gier bez grafiki oraz gdy zapisany obrazek nie wczyta się.
- Prowadzi statystyki: czas gry, liczbę uruchomień i datę ostatniej rozgrywki.
- Dodaje ulubione gry (gwiazdka), sortowanie (domyślnie / ostatnio grane / ulubione / A–Z / czas gry) oraz losową grę.
- Ma tryb atrakcji (wygaszacz) — po bezczynności sam przewija gry na półce.
- Pozwala eksportować i importować kopię zapasową konfiguracji wraz ze statystykami.
- Obsługuje szybki skok po literze lub cyfrze w bibliotece.
- Działa w **trybie przenośnym (pendrive)** — konfiguracja, statystyki i okładki w folderze `LauncherData`, a ścieżki ROM-ów zapisywane względem katalogu launchera.
- Pozwala ustawić **argumenty uruchomienia dla konkretnej gry** i otworzyć jej folder z poziomu szczegółów.
- Importuje metadane i okładki z **gamelist.xml EmulationStation**.
- Pokazuje **zbiorcze statystyki** oraz sprawdza **stan biblioteki** (brakujące foldery, puste pliki, duplikaty).
- Odtwarza **trailery** i używa **fanartów ScreenScraper** jako tła.
- Oferuje **11 proporcji miniatur** (m.in. portret Steam, PSP, GBA, NDS, kwadrat, banner 16:9, marquee arcade, Steam Big Picture) oraz **własne proporcje** szerokość + ratio dla każdej platformy. Wybór działa we wszystkich trybach półki.
- Pozwala **zmienić nazwę platformy** po dodaniu oraz podpowiada **30 popularnych platform** (datalist), automatycznie uzupełniając rozszerzenia, kolor, proporcje i mapowanie scraperów.
- Obsługuje **platformę PC**: dodawanie plików `.exe`, `.AppImage` i `.sh` (pojedynczo lub przez skan folderu), uruchamianie natywne na Windows/Linux oraz przez **Wine**, **Wine-GE** i **Proton-GE**.
- Wykrywa zainstalowane runnery i **pobiera Proton-GE / Wine-GE** jednym przyciskiem (z paskiem postępu), a także uruchamia **winetricks** w wybranym prefiksie.
- Pozwala ustawić **prefiks Wine, zmienne środowiskowe i runner per gra** (nadpisanie ustawień platformy).
- Zapamiętuje ustawienia użytkownika, platformy, ścieżki ROM-ów, emulatory, argumenty, okładki i preferencje widoku.
- Obsługuje pełny ekran przy starcie oraz przełączanie fullscreen w trakcie pracy.
- Ma efekty dźwiękowe UI, animowane tło dopasowujące się do okładki i spójne ikony SVG.
- Oferuje pięć motywów graficznych całego interfejsu (domyślny, Wii, Nintendo Switch, PlayStation 3, Xbox) wybieranych w ustawieniach.
- Ma pełne tłumaczenie interfejsu na polski i angielski.
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

- nazwę i identyfikator (nazwę można później zmienić przyciskiem ✎),
- typ: konsola/emulator albo PC,
- kolor wyróżnienia,
- listę rozszerzeń ROM-ów,
- folder z ROM-ami (dla konsol) lub listę plików wykonywalnych (dla PC),
- emulator lub komendę uruchomieniową,
- domyślne argumenty,
- preferowany format okładki: gotowy preset albo własna szerokość i proporcja.

Dzięki temu można osobno skonfigurować np. PSP, PS2, PS1, SNES, DS albo inne systemy.

### Nazwy platform i podpowiedzi

Przy dodawaniu platformy pole nazwy podpowiada **30 popularnych systemów** (m.in. NES, SNES, N64, GameCube, Wii, Switch, Game Boy, GBA, NDS, 3DS, PlayStation 1–4, PSP, Vita, Mega Drive, Saturn, Dreamcast, Xbox, Arcade, Amiga, DOS i PC). Wybranie podpowiedzi automatycznie uzupełnia:

- typowe rozszerzenia plików,
- kolor platformy,
- domyślną proporcję okładki,
- mapowanie do ScreenScraper i TheGamesDB (metadane działają od razu).

Nazwę można zmienić w każdej chwili przyciskiem **✎** przy platformie. Identyfikator (`key`) pozostaje bez zmian, więc foldery, okładki, statystyki i metadane nie giną.

### Proporcje okładek

Dostępne presety: standardowe pudełko, portret Steam (2:3), PSP/wąska, Game Boy Advance, Nintendo DS, kwadrat, szeroka, banner 16:9, Steam Big Picture, marquee arcade (3:1) oraz **własne proporcje**. Dla własnych podajesz szerokość w pikselach i stosunek szerokość/wysokość (np. `0.72`). Wybór obowiązuje na półce we wszystkich trybach (także siatka, lista z opisem i spotlight).

### Platforma PC (Windows / Linux)

Platforma typu **PC** nie używa folderu ROM-ów ani emulatora. Zamiast tego prowadzi listę plików wykonywalnych:

- **Windows:** pliki `.exe` uruchamiane bezpośrednio.
- **Linux:** pliki natywne `.sh` / `.AppImage` / binarki oraz gry Windows `.exe` przez wybrany runner.

Gry dodajesz przyciskiem **„Dodaj gry…”** (wybór wielu plików) albo **„Skanuj folder…”** (launcher znajdzie pliki `.exe`, `.AppImage` i `.sh`).

Dla każdej platformy PC wybierasz:

- **Runner:** natywny, Wine (systemowy), Wine-GE albo Proton-GE,
- **WINEPREFIX** (domyślnie `~/Games/retro-launcher`),
- **ścieżkę runnera** (opcjonalnie, np. konkretny katalog Proton-GE),
- **zmienne środowiskowe** (`KEY=WARTOŚĆ`, jedna na linię),
- **pakiety winetricks** uruchamiane w tym prefiksie.

Przycisk **„Wykryj runnery”** pokazuje znalezione Wine, winetricks, Proton-GE (ze `Steam/compatibilitytools.d` i `steamapps/common`) oraz Wine-GE (z katalogów Retro Launcher, Lutris i Bottles). Jeżeli wybranego runnera nie ma, **„Pobierz”** pobiera najnowsze wydanie Proton-GE lub Wine-GE z GitHuba i instaluje je w odpowiednim katalogu (z paskiem postępu). Winetricks jest pobierany automatycznie przy pierwszym uruchomieniu, jeśli nie ma go w systemie.

W szczegółach gry PC można **nadpisać runner, prefiks i zmienne** tylko dla tej jednej gry. Puste pola oznaczają ustawienia platformy. Plik `.exe` na Linuksie wymaga wybrania Wine, Wine-GE lub Proton-GE — launcher ostrzeże, jeśli zostanie ustawiony runner natywny.

### Okładki i metadane

Launcher wspiera dwa sposoby zarządzania grafikami:

#### Automatyczne

Launcher korzysta z kilku źródeł metadanych (w zależności od skonfigurowanych kluczy):

- **SteamGridDB** — okładki i grafiki (klucz API),
- **RAWG** — opisy, gatunki i ocena Metacritic (klucz API),
- **ScreenScraper.fr** — okładki, opisy, gatunki i rok dla gier retro (login, hasło oraz Dev ID i hasło aplikacji),
- **TheGamesDB** — zapasowe okładki dla niszowych ROM-ów (klucz API).

Można pobierać dane dla jednej platformy albo dla wszystkich naraz. Pobrane okładki są cache'owane lokalnie, a opisy zapisywane w wersji polskiej i angielskiej.

#### Ręczne

Dla każdej gry można ręcznie ustawić okładkę przez:

- adres URL,
- lokalny plik z dysku.

Można też usunąć ręczną okładkę i wrócić do automatycznej.

Gdy gra nie ma żadnej okładki — albo zapisany obrazek nie wczyta się — launcher pokazuje lokalny, typograficzny placeholder `BRAK OKŁADKI / NO COVER` (plik `assets/cover-placeholder.svg`). Działa on offline i w trybie przenośnym, bez odpytywania zewnętrznych CDN.

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
- `Litera` / `cyfra`: szybki skok do pierwszej gry zaczynającej się od danego znaku.
- `R`: losowa gra.
- `F`: dodanie lub usunięcie gry z ulubionych.
- `Esc`: zamknięcie modala albo powrót z ustawień.
- `F11` lub `Alt+Enter`: przełączenie pełnego ekranu.

### Ulubione, ostatnio grane i statystyki

- Gwiazdka obok przycisków `Uruchom` / `Szczegóły` dodaje grę do ulubionych (jest też na okładce w oknie szczegółów).
- Sortowanie biblioteki wybierasz w górnym pasku: `Domyślnie`, `Ostatnio grane`, `Ulubione`, `A–Z`, `Czas gry`.
- Filtr `Ulubione` pokazuje wyłącznie gry oznaczone gwiazdką.
- W szczegółach gry widoczne są: łączny czas gry, liczba uruchomień i data ostatniej rozgrywki.
- Statystyki są zapisywane globalnie w pliku `retro-launcher-playtime.json`.

### Tryb atrakcji

Po 2 minutach bezczynności launcher sam przechodzi do kolejnych gier na półce, tworząc efekt wygaszacza. Każde naciśnięcie klawisza, kliknięcie lub sygnał z pada natychmiast przywraca normalne sterowanie. Tryb można włączyć lub wyłączyć w `Ustawienia → Ogólne`.

### Kopia zapasowa

W `Ustawienia → Ogólne` dostępne są przyciski:

- `Eksportuj kopię` — zapisuje konfigurację, platformy, okładki, metadane i statystyki czasu gry do pliku JSON,
- `Importuj kopię` — przywraca dane z pliku i przeładowuje aplikację.

Kopię można też wykonać ręcznie, kopiując plik `retro-launcher-config.json` oraz `retro-launcher-playtime.json` z katalogu danych użytkownika.

### Tryb przenośny (pendrive)

Tryb przenośny pozwala zabrać launcher razem z biblioteką na jednym pendrive.

1. Wejdź w `Ustawienia → Ogólne → Tryb przenośny`.
2. Kliknij `Włącz tryb przenośny` i potwierdź — launcher skopiuje konfigurację, statystyki i cache okładek do folderu `LauncherData` obok aplikacji, utworzy plik `portable.flag` i uruchomi się ponownie.
3. Wskaż foldery ROM-ów znajdujące się na pendrive, np. `E:\roms\psp` albo `/media/pendrive/roms/psp`.
4. Od tej pory ścieżki ROM-ów są zapisywane jako `{{PORTABLE}}/roms/psp` i rozwijane do aktualnej litery dysku lub punktu montowania.

Ważne:

- Emulatory pozostają zainstalowane w systemie — na pendrive trafiają ROM-y, konfiguracja, statystyki i okładki.
- `Wyłącz tryb przenośny` kopiuje dane z powrotem do katalogu użytkownika i usuwa flagę.
- Tryb można też włączyć ręcznie, tworząc pusty plik `portable.flag` obok launchera (w wersji dev: w katalogu projektu).
- Dla ROM-ów większych niż 4 GB używaj exFAT/NTFS (FAT32 ma limit rozmiaru pliku).
- Cache Chromium (cookies, GPU) nie jest zapisywany na pendrive — na nośniku leżą tylko dane aplikacji.

### Argumenty uruchomienia dla gry

W oknie szczegółów gry znajduje się pole `Argumenty uruchomienia (ta gra)`. Wartości są doklejane po argumentach platformy, więc mogą nadpisać ustawienia domyślne (np. `--fullscreen --fastboot`). Zapis odbywa się przyciskiem `Zapisz argumenty` i trafia do `config.gameArgs`.

### Import z EmulationStation

W `Ustawienia → Okładki → Import z EmulationStation` wybierz `gamelist.xml`. Launcher dopasowuje gry po nazwie pliku ROM lub tytule i importuje:

- tytuł, opis (PL/EN zależnie od języka UI),
- gatunki, rok, developera, liczbę graczy i ocenę,
- okładki (`image`/`thumbnail`) — lokalne i URL.

Domyślnie istniejące metadane nie są nadpisywane (można to wyłączyć checkboxem). Względne ścieżki obrazków są rozwiązywane względem katalogu pliku XML w wersji Electron.

### Statystyki i stan biblioteki

- `Ustawienia → Statystyki` pokazuje łączny czas gry, liczbę gier z czasem, liczbę uruchomień, ulubione, top 5 najczęściej granych i czas według platform.
- `Ustawienia → Ogólne → Stan biblioteki` wykrywa brakujące foldery ROM-ów, puste pliki (0 B) i duplikaty gier między platformami.

### Dodatkowe media i trailery

ScreenScraper dostarcza teraz także `fanart`, `wheel` i `video`:

- fanart jest używany jako tło półki (zamiast powiększonej okładki),
- jeśli gra ma trailer, w oknie szczegółów pojawia się odtwarzacz wideo,
- logo (`wheel`) jest zapisywane w metadanych i może być użyte przez kolejne tryby widoku.

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

W trybie przenośnym dane trafiają do `<katalog launchera>/LauncherData`, a ścieżki ROM-ów są zapisywane ze znacznikiem `{{PORTABLE}}`.

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

### Wersja 1.5.0

- Dodano **11 proporcji miniatur** (portret Steam, PSP, GBA, NDS, kwadrat, szeroka, banner 16:9, Steam Big Picture, marquee 3:1) oraz **własne proporcje** (szerokość + ratio) per platforma.
- Proporcje działają teraz we **wszystkich trybach półki** — także siatce, liście z opisem, spotlight i panelu szczegółów.
- Dodano **zmianę nazwy platformy** (✎) oraz **podpowiedzi 30 popularnych platform** z automatycznym uzupełnianiem rozszerzeń, koloru, proporcji i mapowań scraperów.
- Dodano **platformę PC**: ręczne dodawanie plików `.exe` / `.AppImage` / `.sh`, skan folderu, lista gier PC i usuwanie wpisów.
- Dodano uruchamianie gier PC przez **Wine**, **Wine-GE** i **Proton-GE** (z automatycznym wykrywaniem), a na Windows bezpośrednio `.exe`.
- Dodano **automatyczne pobieranie Proton-GE / Wine-GE** z GitHuba z paskiem postępu oraz **winetricks** (z auto-pobieraniem skryptu).
- Dodano ustawienia **WINEPREFIX**, zmiennych środowiskowych, ścieżki runnera i **nadpisań per gra** dla platform PC.
- Dodano mapowanie nowych platform na ScreenScraper/TheGamesDB po wybraniu presetu lub zmianie nazwy.
- Rozszerzono czyszczenie danych przy usuwaniu platformy o gry PC i ukryte pozycje.

### Wersja 1.4.0

- Dodano **tryb przenośny (pendrive)**: dane w `LauncherData`, flaga `portable.flag`, kopiowanie configu/statystyk/okładek przy włączaniu i wyłączaniu, relaunch.
- Dodano **względne ścieżki ROM-ów** (`{{PORTABLE}}`) — biblioteka działa po zmianie komputera lub litery dysku.
- Dodano skróty **`R`** (losowa gra) i **`F`** (ulubione).
- Dodano przycisk **`Otwórz folder gry`** w oknie szczegółów.
- Dodano **kontrolę stanu biblioteki** (brakujące foldery, puste pliki, duplikaty).
- Dodano **argumenty uruchomienia per gra** (`config.gameArgs`), doklejane po argumentach platformy.
- Dodano **import `gamelist.xml`** z EmulationStation (tytuł, opis, gatunki, rok, developer, ocena, okładki).
- Dodano zakładkę **Statystyki** (łączny czas, top 5, czas według platform, ulubione).
- Rozszerzono ScreenScraper o **fanart**, **wheel** i **video**.
- Dodano **odtwarzacz trailera** w szczegółach gry oraz tło z fanartu na półce.
- Dodano **lokalny, typograficzny placeholder okładki** (`assets/cover-placeholder.svg`) dla gier bez grafiki i dla obrazków, które nie wczytają się.
- Poprawiono resetowanie aktywnej zakładki ustawień przy zmianie hasha oraz działanie atrybutu `hidden` na przyciskach.

### Wersja 1.3.0

- Dodano **ulubione gry** (gwiazdka na półce i w oknie szczegółów).
- Dodano **sortowanie biblioteki**: domyślnie, ostatnio grane, ulubione, A–Z, czas gry.
- Dodano **statystyki gry**: łączny czas, liczba uruchomień i data ostatniej rozgrywki.
- Dodano **losową grę** (przycisk kostki w górnym pasku).
- Dodano **tryb atrakcji** — wygaszacz przewijający gry po bezczynności.
- Dodano **eksport i import kopii zapasowej** konfiguracji oraz statystyk.
- Dodano **szybki skok po literze/cyfrze** w bibliotece.
- Dodano 4 nowe tryby półki (lista z opisem, spotlight, pełnoekranowe okładki, ramka platformy) — łącznie 9 trybów.
- Dodano opisy gier w widokach szczegółowych i oknie modalnym oraz dwujęzyczne opisy (PL/EN).
- Rozbudowano pobieranie metadanych o ScreenScraper.fr (okładki, opisy, gatunki, rok) z testem połączenia.
- Dodano przycisk „Uzupełnij okładki” na półce i opcjonalne auto-uzupełnianie po starcie.
- Wprowadzono spójny zestaw **ikon SVG** (topbar, tryby półki, przyciski akcji, ustawienia, menedżer gier).
- Dodano pełne tłumaczenie interfejsu **PL/EN**.
- Poprawiono widoczność list rozwijanych (`color-scheme` dla wszystkich motywów) i drobne błędy stylowania.

### Planowane / pomysły na przyszłość

- **Kreator pierwszej konfiguracji** — wybór systemu, folderu ROM i autodetekcja emulatorów (PPSSPP, DuckStation, RetroArch, PCSX2).
- **Filtry biblioteki** — gatunek, rok, liczba graczy, ocena.
- **Kolekcje / playlisty** — własne półki tematyczne (np. „Na weekend”, „Co-op”).
- **Edytor mapowania pada** — przypisanie własnych przycisków do akcji.
- **Rozbudowane media** — marquee, logo platform w półkach, tapety per platforma.
- **Wykresy i historia** — wykres czasu gry w czasie i najczęściej uruchamiane platformy.
- **Ulepszone trailery** — lokalny cache, autoplay w trybie spotlight i wyciszanie tła.
- **Automatyczne aktualizacje** i podpisywanie paczek.

### Wersja 1.2.0

- Dodano system motywów graficznych — cztery pełne skórki całego interfejsu:
  - **Wii** — jasny, połyskliwy motyw w stylu Wii Menu,
  - **Nintendo Switch** — ciemny motyw z czerwonym akcentem (`#e60012`),
  - **PlayStation 3 (XMB)** — ciemnogranatowy motyw z falą i pasem światła,
  - **Xbox** — ciemny motyw z zielonym akcentem (`#107c10`).
- Motyw wybiera się w Ustawieniach → Ogólne (z podglądem na żywo) i jest zapisywany w konfiguracji.

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
- Offer 9 shelf modes: flat, arc (coverflow), Big Picture, cascade, grid, detailed list (EmulationStation), spotlight, fullscreen covers, and platform-framed shelf.
- Support multiple platforms simultaneously, each with its own ROM folder, emulator, and launch arguments.
- Launch games through configured emulators.
- Test the emulator launch command directly from the settings panel.
- Fetch cover art and descriptions from multiple sources: SteamGridDB, RAWG, ScreenScraper.fr, and TheGamesDB — with automatic image caching.
- Manually set a game's cover art via URL or a local file.
- Use a local cover placeholder (“BRAK OKŁADKI / NO COVER”) for games without artwork and for images that fail to load.
- Track playtime, launch count, and last played date for every game.
- Add favorite games (star), sort the library (default / recently played / favorites / A–Z / playtime), and pick a random game.
- Include an attract mode (screensaver) that cycles through games when idle.
- Export and import a backup of the configuration together with playtime statistics.
- Jump quickly to a game by typing its first letter or digit.
- Run in **portable mode (USB drive)** — configuration, statistics, and covers live in `LauncherData`, while ROM paths are stored relative to the launcher directory.
- Set **per-game launch arguments** and open the game folder from the details modal.
- Import metadata and covers from an **EmulationStation `gamelist.xml`**.
- Show **aggregate statistics** and run **library health checks** (missing folders, empty files, duplicates).
- Play **video trailers** and use **ScreenScraper fanart** as the shelf background.
- Offer **11 thumbnail aspect ratios** (including Steam portrait, PSP, GBA, NDS, square, 16:9 banner, arcade marquee, Steam Big Picture) plus **custom ratios** (width + ratio) per platform; the choice applies to every shelf mode.
- Let you **rename a platform** after adding it and suggest **30 popular platforms** (datalist), automatically filling extensions, color, aspect ratio, and scraper mappings.
- Support a **PC platform**: add `.exe`, `.AppImage`, and `.sh` files (individually or by scanning a folder), launch natively on Windows/Linux, or through **Wine**, **Wine-GE**, and **Proton-GE**.
- Detect installed runners, **download Proton-GE / Wine-GE** with one button (progress bar), and run **winetricks** in the selected prefix.
- Allow a **Wine prefix, environment variables, and runner override per game** (overriding platform settings).
- Remember user settings, platforms, ROM paths, emulators, arguments, cover art, and view preferences.
- Support fullscreen on startup as well as toggling fullscreen while running.
- Include UI sound effects, an animated background that follows the cover art, and consistent SVG icons.
- Offer five graphical themes for the whole interface (default, Wii, Nintendo Switch, PlayStation 3, Xbox), selectable in settings.
- Provide a complete Polish and English interface translation.
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

- name and identifier (the name can be changed later with the ✎ button),
- type: console/emulator or PC,
- highlight color,
- list of ROM file extensions,
- ROM folder (consoles) or list of executable files (PC),
- emulator or launch command,
- default arguments,
- preferred cover format: a preset or a custom width and ratio.

This lets you configure systems like PSP, PS2, PS1, SNES, DS, or others independently.

### Platform names and suggestions

When adding a platform, the name field suggests **30 popular systems** (including NES, SNES, N64, GameCube, Wii, Switch, Game Boy, GBA, NDS, 3DS, PlayStation 1–4, PSP, Vita, Mega Drive, Saturn, Dreamcast, Xbox, Arcade, Amiga, DOS, and PC). Selecting a suggestion automatically fills in:

- typical file extensions,
- the platform color,
- the default cover aspect ratio,
- ScreenScraper and TheGamesDB mappings (metadata works immediately).

You can rename a platform at any time with the **✎** button. Its identifier (`key`) stays unchanged, so folders, covers, statistics, and metadata are preserved.

### Cover aspect ratios

Available presets: standard box art, Steam portrait (2:3), PSP/narrow, Game Boy Advance, Nintendo DS, square, wide, 16:9 banner, Steam Big Picture, arcade marquee (3:1), and **custom ratios**. For custom, provide the width in pixels and the width/height ratio (e.g. `0.72`). The choice applies to the shelf in every mode (including grid, detailed list, and spotlight).

### PC platform (Windows / Linux)

A **PC**-type platform does not use a ROM folder or an emulator. Instead, it keeps a list of executable files:

- **Windows:** `.exe` files launched directly.
- **Linux:** native `.sh` / `.AppImage` / binaries, and Windows `.exe` games through the selected runner.

Add games with **“Add games…”** (multi-file picker) or **“Scan folder…”** (the launcher finds `.exe`, `.AppImage`, and `.sh`).

For each PC platform you choose:

- **Runner:** native, Wine (system), Wine-GE, or Proton-GE,
- **WINEPREFIX** (defaults to `~/Games/retro-launcher`),
- **runner path** (optional, e.g. a specific Proton-GE directory),
- **environment variables** (`KEY=VALUE`, one per line),
- **winetricks packages** to run in that prefix.

The **“Detect runners”** button lists the detected Wine, winetricks, Proton-GE (from `Steam/compatibilitytools.d` and `steamapps/common`), and Wine-GE (from Retro Launcher, Lutris, and Bottles directories). If the selected runner is missing, **“Download”** fetches the latest Proton-GE or Wine-GE release from GitHub and installs it in the right directory (with a progress bar). Winetricks is downloaded automatically on first use if it is not available in the system.

In a PC game's details you can **override the runner, prefix, and variables** for that single game. Empty fields fall back to the platform settings. A `.exe` file on Linux requires Wine, Wine-GE, or Proton-GE — the launcher warns you if the native runner is selected.

### Cover art and metadata

The launcher supports two ways of managing artwork:

#### Automatic

The launcher uses several metadata sources (depending on the configured keys):

- **SteamGridDB** — covers and artwork (API key),
- **RAWG** — descriptions, genres, and Metacritic score (API key),
- **ScreenScraper.fr** — covers, descriptions, genres, and year for retro games (username, password, plus Dev ID and app password),
- **TheGamesDB** — fallback covers for niche ROMs (API key).

You can fetch data for a single platform or for all platforms at once. Downloaded covers are cached locally, and descriptions are stored in both Polish and English.

#### Manual

For each game, you can manually set cover art via:

- a URL,
- a local file from disk.

You can also remove a manual cover and revert to the automatic one.

When a game has no cover at all — or a stored image fails to load — the launcher shows a local, typographic `BRAK OKŁADKI / NO COVER` placeholder (`assets/cover-placeholder.svg`). It works offline and in portable mode without contacting external CDNs.

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
- `Letter` / `digit`: jump to the first game starting with that character.
- `R`: random game.
- `F`: add or remove the game from favorites.
- `Esc`: close a modal or go back from settings.
- `F11` or `Alt+Enter`: toggle fullscreen.

### Favorites, recently played and statistics

- The star next to `Launch` / `Details` adds a game to favorites (it is also available on the cover in the details modal).
- Choose the library sorting in the top bar: `Default`, `Recently played`, `Favorites`, `A–Z`, `Playtime`.
- The `Favorites` filter shows only starred games.
- The details modal shows total playtime, launch count, and the last played date.
- Statistics are stored globally in `retro-launcher-playtime.json`.

### Attract mode

After 2 minutes of inactivity the launcher automatically cycles through games on the shelf like a screensaver. Any key press, click, or gamepad input immediately restores normal control. You can enable or disable it in `Settings → General`.

### Backup

In `Settings → General` you will find:

- `Export backup` — saves the configuration, platforms, covers, metadata, and playtime statistics to a JSON file,
- `Import backup` — restores the data from a file and reloads the app.

You can also back up manually by copying `retro-launcher-config.json` and `retro-launcher-playtime.json` from the user data directory.

### Portable mode (USB drive)

Portable mode lets you take the launcher and its library on a single USB drive.

1. Go to `Settings → General → Portable mode`.
2. Click `Enable portable mode` and confirm — the launcher copies the configuration, statistics, and cover cache to the `LauncherData` folder next to the app, creates a `portable.flag` file, and restarts.
3. Point the ROM folders at the USB drive, e.g. `E:\roms\psp` or `/media/usb/roms/psp`.
4. From then on ROM paths are stored as `{{PORTABLE}}/roms/psp` and expanded to the current drive letter or mount point.

Important:

- Emulators stay installed on the system — only ROMs, configuration, statistics, and covers go on the USB drive.
- `Disable portable mode` copies the data back to the user directory and removes the flag.
- You can also enable it manually by creating an empty `portable.flag` file next to the launcher (in dev builds: in the project directory).
- For ROMs larger than 4 GB use exFAT/NTFS (FAT32 has a file size limit).
- Chromium cache (cookies, GPU) is not stored on the USB drive — only application data lives there.

### Per-game launch arguments

The details modal contains a `Launch arguments (this game)` field. Values are appended after the platform arguments, so they can override defaults (e.g. `--fullscreen --fastboot`). The `Save arguments` button stores them in `config.gameArgs`.

### EmulationStation import

In `Settings → Artwork → EmulationStation import`, choose a `gamelist.xml`. The launcher matches games by ROM filename or title and imports:

- title and description (PL/EN depending on the UI language),
- genres, year, developer, player count, and rating,
- covers (`image`/`thumbnail`) — local and URL.

Existing metadata is not overwritten by default (you can disable this with a checkbox). Relative image paths are resolved against the XML file directory in the Electron build.

### Statistics and library health

- `Settings → Statistics` shows total playtime, the number of games with playtime, total launches, favorites, top 5 most played, and playtime by platform.
- `Settings → General → Library health` detects missing ROM folders, empty files (0 B), and duplicate games across platforms.

### Extra media and trailers

ScreenScraper now provides `fanart`, `wheel`, and `video` as well:

- fanart is used as the shelf background (instead of the enlarged cover),
- if a game has a trailer, a video player appears in the details modal,
- the logo (`wheel`) is stored in metadata and can be used by future view modes.

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

In portable mode, data goes to `<launcher directory>/LauncherData`, and ROM paths are stored with the `{{PORTABLE}}` marker.

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

### Version 1.5.0

- Added **11 thumbnail aspect ratios** (Steam portrait, PSP, GBA, NDS, square, wide, 16:9 banner, Steam Big Picture, 3:1 marquee) plus **custom ratios** (width + ratio) per platform.
- Aspect ratios now work in **every shelf mode** — including grid, detailed list, spotlight, and the details panel.
- Added **platform renaming** (✎) and **suggestions for 30 popular platforms** with automatic extensions, color, aspect ratio, and scraper mappings.
- Added a **PC platform**: manually add `.exe` / `.AppImage` / `.sh` files, scan a folder, manage the PC game list, and remove entries.
- Added PC game launching through **Wine**, **Wine-GE**, and **Proton-GE** (with automatic detection), and direct `.exe` launching on Windows.
- Added **automatic Proton-GE / Wine-GE downloads** from GitHub with a progress bar plus **winetricks** (with automatic script download).
- Added **WINEPREFIX**, environment variables, runner path, and **per-game overrides** for PC platforms.
- Added ScreenScraper/TheGamesDB mappings for new platforms when a preset is selected or the name is changed.
- Extended platform removal cleanup to include PC games and hidden entries.

### Version 1.4.0

- Added **portable mode (USB drive)**: data in `LauncherData`, a `portable.flag` file, config/statistics/covers copied when enabling and disabling, and an app relaunch.
- Added **portable ROM paths** (`{{PORTABLE}}`) — the library keeps working after changing computers or drive letters.
- Added **`R`** (random game) and **`F`** (favorites) shortcuts.
- Added an **`Open game folder`** button in the details modal.
- Added **library health checks** (missing folders, empty files, duplicates).
- Added **per-game launch arguments** (`config.gameArgs`), appended after platform arguments.
- Added **`gamelist.xml` import** from EmulationStation (title, description, genres, year, developer, rating, covers).
- Added a **Statistics** tab (total playtime, top 5, playtime by platform, favorites).
- Extended ScreenScraper support with **fanart**, **wheel**, and **video**.
- Added a **trailer player** in game details and fanart backgrounds on the shelf.
- Added a **local, typographic cover placeholder** (`assets/cover-placeholder.svg`) for games without artwork and for images that fail to load.
- Fixed the settings tab being reset on hash changes and the `hidden` attribute on buttons.

### Version 1.3.0

- Added **favorite games** (star on the shelf and in the details modal).
- Added **library sorting**: default, recently played, favorites, A–Z, playtime.
- Added **game statistics**: total playtime, launch count, and last played date.
- Added **random game** (dice button in the top bar).
- Added **attract mode** — a screensaver that cycles through games when idle.
- Added **backup export and import** for configuration and statistics.
- Added **quick letter/digit jump** in the library.
- Added 4 new shelf modes (detailed list, spotlight, fullscreen covers, platform frame) — 9 modes in total.
- Added game descriptions in detailed views and the modal, including bilingual PL/EN descriptions.
- Extended metadata fetching with ScreenScraper.fr (covers, descriptions, genres, year) and a connection test.
- Added a “Fill missing covers” button on the shelf and optional auto-fetch on startup.
- Introduced a consistent set of **SVG icons** (top bar, shelf modes, action buttons, settings, games manager).
- Added a complete **PL/EN** interface translation.
- Fixed select visibility (`color-scheme` for every theme) and minor styling issues.

### Planned / future ideas

- **First-run setup wizard** — choose a system, pick the ROM folder, and auto-detect emulators (PPSSPP, DuckStation, RetroArch, PCSX2).
- **Library filters** — genre, year, player count, rating.
- **Collections / playlists** — custom themed shelves (e.g. “Weekend”, “Co-op”).
- **Gamepad mapping editor** — assign custom buttons to actions.
- **Richer media** — marquees, platform logos on shelves, per-platform wallpapers.
- **Charts and history** — playtime over time and most-launched platforms.
- **Improved trailers** — local caching, spotlight autoplay, and background muting.
- **Automatic updates** and signed packages.

### Version 1.2.0

- Added a graphical theme system — four full UI skins:
  - **Wii** — a light, glossy Wii Menu style theme,
  - **Nintendo Switch** — a dark theme with a red accent (`#e60012`),
  - **PlayStation 3 (XMB)** — a deep navy theme with a wave and a light band,
  - **Xbox** — a dark theme with a green accent (`#107c10`).
- The theme is selected in Settings → General (with live preview) and stored in the configuration.

### Version 1.1.0

- Fixed window focus after launching an emulator (launcher minimizes and restores after the emulator closes).
- Added scanning of files in subfolders.
- Added the ability to rename a specific game.
- Added a grid layout to the views.
- Added a keyboard/gamepad shortcut to return to the menu.

[⬆ Back to top](#retro-launcher)
