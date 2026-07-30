# Retro Launcher

Retro Launcher to desktopowy launcher gier retro inspirowany trybem Steam Big Picture. Aplikacja działa w Electronie, obsługuje pada, pełny ekran, bibliotekę ROM-ów dla wielu platform, ręczne i automatyczne okładki oraz trwały zapis konfiguracji emulatorów na dysku.

## Co potrafi

- Przegląda bibliotekę gier w widoku kanapy, z nawigacją klawiaturą i padem.
- Obsługuje wiele platform jednocześnie, każdą z własnym folderem ROM-ów, emulatorem i argumentami startowymi.
- Uruchamia gry przez skonfigurowane emulatory.
- Pozwala testować polecenie uruchomieniowe emulatora z poziomu ustawień.
- Pobiera okładki i opisy z SteamGridDB po wpisaniu klucza API.
- Pozwala ręcznie ustawić okładkę gry przez URL albo plik lokalny.
- Zapamiętuje ustawienia użytkownika, platformy, ścieżki ROM-ów, emulatory, argumenty, okładki i preferencje widoku.
- Obsługuje pełny ekran przy starcie oraz przełączanie fullscreen w trakcie pracy.
- Ma efekty dźwiękowe UI, animowane tło i obsługę kilku trybów widoku półki z grami.
- Działa z bezpiecznym mostkiem preload/IPС między rendererem a main process.

## Dla kogo

Projekt jest przeznaczony dla osób, które chcą mieć jeden interfejs do uruchamiania gier retro z różnych emulatorów, najlepiej z poziomu kanapy, kontrolera albo mini-PC pod telewizorem.

## Wymagania

- Node.js i npm.
- Zainstalowane emulatory, z których launcher będzie korzystał.
- ROM-y zapisane w folderach przypisanych do konkretnych platform.
- Opcjonalnie klucz API SteamGridDB, jeśli mają działać automatyczne okładki i opisy.

## Instalacja

```bash
npm install
```

## Uruchomienie

```bash
npm start
```

## Szybki start

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

## Jak działa konfiguracja platform

Każda platforma może mieć własny zestaw ustawień:

- nazwę i identyfikator,
- kolor wyróżnienia,
- listę rozszerzeń ROM-ów,
- folder z ROM-ami,
- emulator lub komendę uruchomieniową,
- domyślne argumenty,
- preferowany format okładki.

Dzięki temu można osobno skonfigurować np. PSP, PS2, PS1, SNES, DS albo inne systemy.

## Okładki i metadane

Launcher wspiera dwa sposoby zarządzania grafikami:

### Automatyczne

Po wpisaniu klucza SteamGridDB API można pobierać:

- okładki,
- opisy,
- dodatkowe dane dla gier.

Pobieranie można wykonać dla jednej platformy albo dla wszystkich naraz.

### Ręczne

Dla każdej gry można ręcznie ustawić okładkę przez:

- adres URL,
- lokalny plik z dysku.

Można też usunąć ręczną okładkę i wrócić do automatycznej.

## Obsługa pada

Launcher jest przygotowany do używania kontrolera jako głównej metody nawigacji.

- Lewo/prawo, D-pad lub analog: przełączanie gier.
- Góra: otwarcie listy platform.
- LB / RB: szybka zmiana platformy.
- LT / RT: zmiana trybu widoku półki.
- A: uruchomienie gry albo zatwierdzenie wyboru.
- Y: otwarcie szczegółów gry.
- B: powrót lub zamknięcie aktywnego panelu.
- Start: otwarcie ustawień.

## Klawiatura

- `Strzałka w lewo` / `Strzałka w prawo`: przełączanie gier.
- `Enter`: uruchomienie wybranej gry.
- `Esc`: zamknięcie modala albo powrót z ustawień.
- `F11` lub `Alt+Enter`: przełączenie pełnego ekranu.

## Gdzie zapisują się ustawienia

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

## Testowanie emulatora

W ustawieniach każdej platformy można użyć przycisku `Testuj`, aby sprawdzić, czy polecenie emulatora uruchamia się poprawnie. To ułatwia diagnozowanie problemów zanim użytkownik spróbuje uruchomić konkretną grę.

## Flatpak i Linux

Przy uruchamianiu w Flatpaku niektóre emulatory lub foldery spoza sandboxa mogą wymagać dodatkowych uprawnień. Jeśli emulator działa na hoście, a launcher jest zamknięty w sandboxie, może być potrzebne uruchamianie przez `flatpak-spawn --host` albo nadanie dostępu do systemu plików.

## Budowanie paczek

Przykładowe komendy:

```bash
npm run dist
npm run dist:linux
npm run dist:win
```

Uwagi:

- Linux zwykle korzysta z zestawu ikon PNG dla `deb` i `AppImage`.
- Windows najlepiej budować z ikoną `.ico`.
- Build dla Windows uruchamiany z Linuxa może wymagać Wine lub budowania na Windowsie.

## Struktura projektu

```text
src/
  main/main.js       - proces główny Electron: okna, IPC, dialogi, uruchamianie emulatorów
  preload/preload.js - bezpieczny mostek API do renderera
  renderer/          - interfejs użytkownika: HTML, CSS i logika UI
```

## Najczęstszy scenariusz użycia

1. Dodanie platformy, na przykład PSP.
2. Wskazanie folderu z ROM-ami.
3. Ustawienie emulatora, na przykład PPSSPP.
4. Opcjonalne ustawienie argumentów typu fullscreen.
5. Pobranie okładek z API albo ręczne podpięcie grafik.
6. Nawigacja po bibliotece z poziomu pada.
7. Uruchamianie gier z jednego, spójnego interfejsu.

## Rozwiązywanie problemów

### Emulator się nie uruchamia

Sprawdź:

- czy ścieżka lub komenda emulatora jest poprawna,
- czy emulator uruchamia się ręcznie poza launcherem,
- czy argumenty startowe są poprawne,
- czy przycisk `Testuj` działa dla danej platformy.

### Nie widać okładki

Sprawdź:

- czy URL jest poprawny,
- czy lokalny plik istnieje,
- czy aplikacja ma dostęp do pliku,
- czy dla Linux/Flatpak nie brakuje uprawnień do odczytu plików.

### Nie działa wybór pliku lub emulatora

Sprawdź, czy preload i IPC są poprawnie podłączone oraz czy renderer korzysta z metod wystawionych przez `window.launcherAPI`.

## Status projektu

Projekt rozwija launcher typu couch-gaming UI dla emulatorów i bibliotek ROM-ów, z naciskiem na prostą obsługę, sterowanie padem i szybkie uruchamianie gier.