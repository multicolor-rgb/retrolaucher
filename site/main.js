/* Retro Launcher site — language, screenshots, download helpers. */
(function () {
  'use strict';

  var i18n = {
    en: {
      'a11y.skip': 'Skip to content',
      'a11y.copy': 'Copy',
      'a11y.copied': 'Copied',
      'a11y.close': 'Close',
      'nav.new': "What's new",
      'nav.screens': 'Screenshots',
      'nav.library': 'Library',
      'nav.faq': 'FAQ',
      'nav.download': 'Download',
      'nav.menu': 'Menu',
      'cta.download': 'Download',

      'hero.title1': 'One shelf.',
      'hero.title2': 'Every ROM.',
      'hero.title3': 'Controller in hand.',
      'hero.text': 'A couch launcher for the emulators you already have. Covers, playtime and one Play button. Rebuilt on Tauri 2 — the same library, a fraction of the old app.',
      'hero.cta': 'Download free',
      'hero.github': 'GitHub',
      'hero.open': 'Open screenshot',
      'hero.capture': 'A real screen from the app',
      'hero.prev': 'Previous screenshot',
      'hero.next': 'Next screenshot',
      'hero.s1': 'Shelf',
      'hero.s2': 'Play',
      'hero.s3': 'Platform',
      'hero.s4': 'Covers',

      'facts.size': 'package, was ~90 MB',
      'facts.ram': 'RAM at launch, was ~300 MB',
      'facts.shelves': 'shelf modes',
      'facts.pad.value': 'Pad first',
      'facts.pad': 'keyboard works too',

      'new.title': 'Smaller. Your library stays.',
      'new.text': '2.1 is the Tauri port. The screen is the one you already know. The backend is Rust, and the data path did not move.',
      'new.caption': 'Electron 1.x compared with Tauri 2.1',
      'new.row.size': 'Package',
      'new.row.ram': 'RAM at launch',
      'new.row.stop': 'Quit from the pad',
      'new.row.data': 'Your library',
      'new.stop.old': 'Hidden helper window',
      'new.stop.new': 'Rust watchdog',
      'new.data.new': 'Same path',
      'new.themes.title': 'Five themes',
      'new.themes.text': 'Default, PS3, Wii, Xbox, Switch. Colours, shapes and the accent follow the one you pick in Settings.',
      'new.manager.title': 'Games manager',
      'new.manager.text': 'Search, multi-select, rename, move or remove entries without leaving the launcher.',
      'new.watchdog.title': 'Stop combo',
      'new.watchdog.text': 'L3 + R3 + LB + RB closes the game at once, including fullscreen. The watcher lives in Rust, not in a hidden window.',

      'screens.title': 'What you actually see',
      'screens.text': 'Four screens from the app. Click any of them to enlarge.',
      'screens.s1.title': 'The shelf',
      'screens.s1.text': 'Left and right on the pad. The cover sits in the middle, the name under it, Play underneath. The background takes its colour from the artwork.',
      'screens.s2.title': 'Play',
      'screens.s2.text': 'A starts the emulator you configured for that platform. Y opens details: description, rating, playtime, a trailer if one exists.',
      'screens.s3.title': 'One platform, or all of them',
      'screens.s3.text': 'LB and RB jump between systems. Or leave the filter on All and keep PS2, SNES and Game Boy on the same shelf.',
      'screens.s4.title': 'Covers, once',
      'screens.s4.text': 'Pull artwork for one platform or the whole library. SteamGridDB, IGDB and TheGamesDB — or point at your own file. It is cached locally.',

      'couch.title': 'For the couch',
      'couch.lead': 'Set each platform up once. After that the pad is enough.',
      'couch.pad.title': 'Controller',
      'couch.pad.text': 'Left and right move the shelf. Up opens platforms. LB / RB switch system, LT / RT change the shelf mode. A plays, Y opens details, B goes back, Start opens settings.',
      'couch.keys.title': 'Keyboard',
      'couch.keys.text': 'Arrows and Enter. A letter jumps to that title. R picks a random game, F toggles a favourite, F11 toggles fullscreen.',
      'couch.attract.title': 'Attract mode',
      'couch.attract.text': 'After two minutes idle the shelf keeps moving. Any key, click or pad input stops it. Turn it off in Settings.',
      'couch.shelves.title': 'Nine shelves',
      'couch.shelves.text': 'Flat, arc, Big Picture, cascade, grid, list with description, spotlight, fullscreen covers, platform frame. Eleven cover ratios, or your own.',

      'lib.title': 'For the library',
      'lib.lead': 'The part you do at the desk, so the couch stays simple.',
      'lib.platforms.title': 'Platforms',
      'lib.platforms.text': 'Thirty presets fill extensions, colour, cover ratio and scraper ids. Each system has its own ROM folder, emulator and arguments. Rename later — the id stays, so covers and stats stay.',
      'lib.art.title': 'Artwork',
      'lib.art.text': 'SteamGridDB, IGDB and TheGamesDB, in Polish and English when the source has both. A file or a URL overrides them. Missing art gets an offline placeholder.',
      'lib.stats.title': 'Playtime',
      'lib.stats.text': 'Hours, launch count, last played, favourites, sort, and a library check for missing folders, empty files and duplicates.',
      'lib.portable.title': 'USB stick',
      'lib.portable.text': 'Portable mode copies config, stats and covers into LauncherData beside the app. ROM paths are stored relative to the stick and expand to whatever letter it gets.',
      'lib.pc.title': 'PC games',
      'lib.pc.text': '.exe, .AppImage and .sh. On Linux: Wine, Wine-GE or Proton-GE, with a one-click download of the runner. Prefix and environment can be set per game.',
      'lib.import.title': 'Import',
      'lib.import.text': 'EmulationStation gamelist.xml, plus a JSON backup of config and stats. Test the emulator command from Settings before you sit down.',

      'themes.title': 'Five themes. No fake preview.',
      'themes.default': 'Default',
      'themes.text': 'Pick one in Settings and the whole interface follows. The screenshots above are the default theme — there is no drawn mock of the others here.',

      'download.title': 'Download 2.1',
      'download.text': 'Free, MIT. Pick a package. Upgrading from 1.x keeps your platforms, covers and playtime.',
      'download.yours': 'Your system',
      'download.win.title': 'Installer',
      'download.win.text': 'NSIS for Windows 10 and 11. WebView2 installs itself if it is missing.',
      'download.win.cta': 'Download for Windows',
      'download.deb.title': 'Package',
      'download.deb.text': 'Desktop entry and dependencies handled by apt. The file is small; installed, the app sits around 10–15 MB.',
      'download.deb.cta': 'Download .deb',
      'download.appimage.title': 'Portable',
      'download.appimage.text': 'One file, no install. Larger, because it carries its own runtime. Useful for a USB stick or a quick try.',
      'download.appimage.cta': 'Download AppImage',
      'download.note': 'Config and playtime live in <code>~/.config/retro-launcher</code> (or the Windows equivalent) and survive the upgrade from 1.x. Other builds and checksums are on the <a href="https://github.com/multicolor-rgb/retrolaucher/releases" target="_blank" rel="noopener">releases page</a> and in <a href="https://github.com/multicolor-rgb/retrolaucher/releases/download/rel%2F2.2.0/SHA256SUMS.txt" target="_blank" rel="noopener">SHA256SUMS.txt</a>.',

      'faq.title': 'Before you install',
      'faq.q1': 'Will I lose my configuration when upgrading from 1.x?',
      'faq.a1': 'No. The data path is unchanged, so platforms, covers and playtime carry over.',
      'faq.q2': 'What are the system requirements?',
      'faq.a2': 'Windows 10 or 11 with WebView2 — the installer fetches it if needed. On Linux, a GTK3 desktop and webkit2gtk 4.1. The .deb pulls those in.',
      'faq.q3': 'Do I need a gamepad?',
      'faq.a3': 'No. Keyboard and mouse cover everything. The pad layout is there for the couch.',
      'faq.q4': 'Where do the covers come from?',
      'faq.a4': 'SteamGridDB, IGDB and TheGamesDB, if you add the keys. You can also set a local file or an image URL per game.',
      'faq.q5': 'Is it really free?',
      'faq.a5': 'Yes. MIT licensed. There is a BuyCoffeeTo link in the footer if you want to support the work.',
      'faq.q6': 'Can I run it from a USB stick?',
      'faq.a6': 'Yes. AppImage plus portable mode keeps config, stats and covers next to the executable. Emulators stay installed on the machine.',

      'footer.tagline': 'A couch launcher for the emulators you already run.',
      'footer.releases': 'Releases',
      'footer.issues': 'Report an issue',
      'footer.license': 'MIT License',
      'footer.coffee': 'Buy me a coffee',
      'footer.privacy': 'Privacy & cookies',
      'support.label': 'Buy me a coffee',
      'support.aria': 'Support Retro Launcher on BuyCoffeeTo',
      'cookie.aria': 'Privacy and cookies',
      'cookie.title': 'No tracking cookies.',
      'cookie.text': 'This site stores only your language choice and this notice in localStorage. No ads, no analytics.',
      'cookie.more': 'Privacy & cookies',
      'cookie.ok': 'Understood',
      'konami.toast': '+30 lives'
    },

    pl: {
      'a11y.skip': 'Przejdź do treści',
      'a11y.copy': 'Kopiuj',
      'a11y.copied': 'Skopiowano',
      'a11y.close': 'Zamknij',
      'nav.new': 'Co nowego',
      'nav.screens': 'Screenshoty',
      'nav.library': 'Biblioteka',
      'nav.faq': 'FAQ',
      'nav.download': 'Pobierz',
      'nav.menu': 'Menu',
      'cta.download': 'Pobierz',

      'hero.title1': 'Jedna półka.',
      'hero.title2': 'Wszystkie ROM-y.',
      'hero.title3': 'Pad w ręku.',
      'hero.text': 'Launcher na kanapę do emulatorów, które już masz. Okładki, czas gry i jeden przycisk Uruchom. Przepisany na Tauri 2 — ta sama biblioteka, ułamek starej aplikacji.',
      'hero.cta': 'Pobierz za darmo',
      'hero.github': 'GitHub',
      'hero.open': 'Otwórz screenshot',
      'hero.capture': 'Prawdziwy ekran aplikacji',
      'hero.prev': 'Poprzedni screenshot',
      'hero.next': 'Następny screenshot',
      'hero.s1': 'Półka',
      'hero.s2': 'Uruchom',
      'hero.s3': 'Platforma',
      'hero.s4': 'Okładki',

      'facts.size': 'pakiet, było ~90 MB',
      'facts.ram': 'RAM przy starcie, było ~300 MB',
      'facts.shelves': 'trybów półki',
      'facts.pad.value': 'Najpierw pad',
      'facts.pad': 'klawiatura też działa',

      'new.title': 'Mniejszy. Biblioteka zostaje.',
      'new.text': '2.1 to port na Tauri. Ekran jest ten, który już znasz. Backend jest w Ruście, a ścieżka danych się nie ruszyła.',
      'new.caption': 'Electron 1.x wobec Tauri 2.1',
      'new.row.size': 'Pakiet',
      'new.row.ram': 'RAM przy starcie',
      'new.row.stop': 'Wyjście z pada',
      'new.row.data': 'Twoja biblioteka',
      'new.stop.old': 'Ukryte okno pomocnicze',
      'new.stop.new': 'Watchdog w Ruście',
      'new.data.new': 'Ta sama ścieżka',
      'new.themes.title': 'Pięć motywów',
      'new.themes.text': 'Domyślny, PS3, Wii, Xbox, Switch. Kolory, kształty i akcent idą za tym, który wybierzesz w Ustawieniach.',
      'new.manager.title': 'Manager gier',
      'new.manager.text': 'Szukaj, zaznaczaj wiele pozycji, zmieniaj nazwy, przenoś i usuwaj bez wychodzenia z launchera.',
      'new.watchdog.title': 'Kombinacja stop',
      'new.watchdog.text': 'L3 + R3 + LB + RB zamyka grę od razu, także w pełnym ekranie. Nasłuch jest w Ruście, nie w ukrytym oknie.',

      'screens.title': 'To, co naprawdę widzisz',
      'screens.text': 'Cztery ekrany z aplikacji. Kliknij, żeby powiększyć.',
      'screens.s1.title': 'Półka',
      'screens.s1.text': 'Lewo i prawo na padzie. Okładka na środku, tytuł pod nią, Uruchom poniżej. Tło bierze kolor z grafiki.',
      'screens.s2.title': 'Uruchom',
      'screens.s2.text': 'A odpala emulator ustawiony dla tej platformy. Y otwiera szczegóły: opis, ocenę, czas gry, zwiastun jeśli jest.',
      'screens.s3.title': 'Jedna platforma albo wszystkie',
      'screens.s3.text': 'LB i RB przeskakują między systemami. Albo zostaw filtr na Wszystkie i trzymaj PS2, SNES i Game Boya na jednej półce.',
      'screens.s4.title': 'Okładki, raz',
      'screens.s4.text': 'Pobierz grafiki dla jednej platformy albo całej biblioteki. SteamGridDB, IGDB i TheGamesDB — albo wskaż własny plik. Cache jest lokalny.',

      'couch.title': 'Na kanapę',
      'couch.lead': 'Każdą platformę ustawiasz raz. Potem wystarczy pad.',
      'couch.pad.title': 'Pad',
      'couch.pad.text': 'Lewo i prawo przesuwają półkę. Góra otwiera platformy. LB / RB zmieniają system, LT / RT tryb półki. A uruchamia, Y otwiera szczegóły, B wraca, Start otwiera ustawienia.',
      'couch.keys.title': 'Klawiatura',
      'couch.keys.text': 'Strzałki i Enter. Litera skacze do tytułu na tę literę. R losuje grę, F przełącza ulubione, F11 pełny ekran.',
      'couch.attract.title': 'Tryb atrakcji',
      'couch.attract.text': 'Po dwóch minutach bezczynności półka sama się przesuwa. Klawisz, klik albo pad to zatrzymuje. Wyłączysz to w Ustawieniach.',
      'couch.shelves.title': 'Dziewięć półek',
      'couch.shelves.text': 'Płaska, łuk, Big Picture, kaskada, siatka, lista z opisem, spotlight, pełnoekranowe okładki, ramka platformy. Jedenaście proporcji okładek albo własne.',

      'lib.title': 'Do składania biblioteki',
      'lib.lead': 'To, co robisz przy biurku, żeby na kanapie było prosto.',
      'lib.platforms.title': 'Platformy',
      'lib.platforms.text': 'Trzydzieści podpowiedzi uzupełnia rozszerzenia, kolor, proporcję okładki i mapowanie scraperów. Każdy system ma własny folder ROM-ów, emulator i argumenty. Nazwę zmienisz później — identyfikator zostaje, więc okładki i statystyki też.',
      'lib.art.title': 'Okładki',
      'lib.art.text': 'SteamGridDB, IGDB i TheGamesDB, po polsku i angielsku, gdy źródło ma obie wersje. Plik albo URL je nadpisuje. Brak grafiki dostaje lokalny placeholder.',
      'lib.stats.title': 'Czas gry',
      'lib.stats.text': 'Godziny, liczba uruchomień, ostatnia rozgrywka, ulubione, sortowanie i sprawdzenie biblioteki: brakujące foldery, puste pliki, duplikaty.',
      'lib.portable.title': 'Pendrive',
      'lib.portable.text': 'Tryb przenośny kopiuje konfigurację, statystyki i okładki do LauncherData obok aplikacji. Ścieżki ROM-ów są względne i rozwijają się do aktualnej litery dysku.',
      'lib.pc.title': 'Gry PC',
      'lib.pc.text': '.exe, .AppImage i .sh. Na Linuksie: Wine, Wine-GE albo Proton-GE, z pobraniem runnera jednym przyciskiem. Prefiks i zmienne można ustawić per gra.',
      'lib.import.title': 'Import',
      'lib.import.text': 'gamelist.xml z EmulationStation i kopia JSON konfiguracji ze statystykami. Polecenie emulatora przetestujesz w Ustawieniach, zanim usiądziesz.',

      'themes.title': 'Pięć motywów. Bez fałszywego podglądu.',
      'themes.default': 'Domyślny',
      'themes.text': 'Wybierasz jeden w Ustawieniach i cały interfejs idzie za nim. Screenshoty wyżej są z motywu domyślnego — pozostałych tu nie udaję.',

      'download.title': 'Pobierz 2.1',
      'download.text': 'Darmowy, MIT. Wybierz pakiet. Aktualizacja z 1.x zostawia platformy, okładki i czas gry.',
      'download.yours': 'Twój system',
      'download.win.title': 'Instalator',
      'download.win.text': 'NSIS dla Windows 10 i 11. WebView2 doinstaluje się sam, jeśli go brakuje.',
      'download.win.cta': 'Pobierz dla Windows',
      'download.deb.title': 'Pakiet',
      'download.deb.text': 'Wpis w menu i zależności ogarnia apt. Plik jest mały; po instalacji aplikacja ma około 10–15 MB.',
      'download.deb.cta': 'Pobierz .deb',
      'download.appimage.title': 'Przenośny',
      'download.appimage.text': 'Jeden plik, bez instalacji. Większy, bo niesie własny runtime. Dobry na pendrive albo szybki test.',
      'download.appimage.cta': 'Pobierz AppImage',
      'download.note': 'Konfiguracja i czas gry leżą w <code>~/.config/retro-launcher</code> (albo odpowiedniku na Windows) i przeżywają aktualizację z 1.x. Inne buildy i sumy są na <a href="https://github.com/multicolor-rgb/retrolaucher/releases" target="_blank" rel="noopener">stronie wydań</a> i w <a href="https://github.com/multicolor-rgb/retrolaucher/releases/download/rel%2F2.2.0/SHA256SUMS.txt" target="_blank" rel="noopener">SHA256SUMS.txt</a>.',

      'faq.title': 'Zanim zainstalujesz',
      'faq.q1': 'Czy stracę konfigurację przy aktualizacji z 1.x?',
      'faq.a1': 'Nie. Ścieżka danych się nie zmieniła, więc platformy, okładki i czas gry zostają.',
      'faq.q2': 'Jakie są wymagania?',
      'faq.a2': 'Windows 10 lub 11 z WebView2 — instalator dociągnie je w razie potrzeby. Na Linuksie pulpit GTK3 i webkit2gtk 4.1. Pakiet .deb je dociąga.',
      'faq.q3': 'Czy potrzebuję pada?',
      'faq.a3': 'Nie. Klawiatura i mysz wystarczą. Układ pada jest na kanapę.',
      'faq.q4': 'Skąd są okładki?',
      'faq.a4': 'SteamGridDB, IGDB i TheGamesDB, jeśli dodasz klucze. Możesz też wskazać plik albo URL obrazka dla konkretnej gry.',
      'faq.q5': 'Czy to naprawdę darmowe?',
      'faq.a5': 'Tak. Licencja MIT. W stopce jest link BuyCoffeeTo, jeśli chcesz wesprzeć pracę.',
      'faq.q6': 'Czy ruszy z pendrive’a?',
      'faq.a6': 'Tak. AppImage i tryb przenośny trzymają konfigurację, statystyki i okładki obok pliku. Emulatory zostają zainstalowane w systemie.',

      'footer.tagline': 'Launcher na kanapę do emulatorów, które już masz.',
      'footer.releases': 'Wydania',
      'footer.issues': 'Zgłoś problem',
      'footer.license': 'Licencja MIT',
      'footer.coffee': 'Postaw kawę',
      'footer.privacy': 'Prywatność i cookies',
      'support.label': 'Postaw kawę',
      'support.aria': 'Wesprzyj Retro Launcher na BuyCoffeeTo',
      'cookie.aria': 'Prywatność i cookies',
      'cookie.title': 'Bez cookies śledzących.',
      'cookie.text': 'Ta strona zapisuje w localStorage tylko wybór języka i tę informację. Bez reklam i analityki.',
      'cookie.more': 'Prywatność i cookies',
      'cookie.ok': 'Rozumiem',
      'konami.toast': '+30 żyć'
    }
  };

  var root = document.documentElement;
  var storageKey = 'retro-launcher-lang';
  var currentLang = 'en';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lightbox = document.getElementById('lightbox');

  function applyLanguage(lang) {
    if (!i18n[lang]) lang = 'en';
    currentLang = lang;
    root.lang = lang;
    try { localStorage.setItem(storageKey, lang); } catch (e) { /* ignore */ }

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var value = i18n[lang][el.getAttribute('data-i18n')];
      if (typeof value === 'string') el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var value = i18n[lang][el.getAttribute('data-i18n-html')];
      if (typeof value === 'string') el.innerHTML = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var value = i18n[lang][el.getAttribute('data-i18n-aria')];
      if (typeof value === 'string') el.setAttribute('aria-label', value);
    });
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === lang));
    });

    document.title = lang === 'pl'
      ? 'Retro Launcher 2.1 — Jedna półka. Wszystkie ROM-y.'
      : 'Retro Launcher 2.1 — One shelf. Every ROM.';

    if (lightbox && lightbox.classList.contains('is-open')) updateLightboxCaption();
  }

  var savedLang = 'en';
  try { savedLang = localStorage.getItem(storageKey) || 'en'; } catch (e) { /* ignore */ }
  applyLanguage(savedLang === 'pl' ? 'pl' : 'en');

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLanguage(btn.getAttribute('data-lang')); });
  });

  /* ---------- Header ---------- */

  var header = document.getElementById('siteHeader');
  window.addEventListener('scroll', function () {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }, { passive: true });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav a'));
  if ('IntersectionObserver' in window && navLinks.length) {
    var sectionSpy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    navLinks.forEach(function (link) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) sectionSpy.observe(target);
    });
  }

  var navToggle = document.querySelector('.nav-toggle');
  var mobileNav = document.getElementById('mobileNav');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      mobileNav.classList.toggle('is-open', !open);
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-open');
      });
    });
  }

  /* ---------- Hero frame ---------- */

  var stage = document.getElementById('stage');
  var stageImgs = stage ? Array.prototype.slice.call(stage.querySelectorAll('.stage__frame img')) : [];
  var stageDots = stage ? Array.prototype.slice.call(stage.querySelectorAll('.stage__dots button')) : [];
  var stageIndex = 0;
  var stageTimer = null;
  var stagePaused = false;

  function showStage(index) {
    if (!stageImgs.length) return;
    stageIndex = (index + stageImgs.length) % stageImgs.length;
    stageImgs.forEach(function (img, i) {
      img.classList.toggle('is-active', i === stageIndex);
    });
    stageDots.forEach(function (dot, i) {
      dot.setAttribute('aria-selected', i === stageIndex ? 'true' : 'false');
    });
  }

  function startStage() {
    if (reduceMotion || stageTimer || stageImgs.length < 2) return;
    stageTimer = setInterval(function () {
      if (stagePaused || document.hidden) return;
      showStage(stageIndex + 1);
    }, 6500);
  }

  if (stageImgs.length) {
    showStage(0);
    startStage();
    stage.addEventListener('mouseenter', function () { stagePaused = true; });
    stage.addEventListener('mouseleave', function () { stagePaused = false; });
    stageDots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showStage(Number(dot.getAttribute('data-slide')) || 0);
        if (stageTimer) {
          clearInterval(stageTimer);
          stageTimer = null;
          startStage();
        }
      });
    });
  }

  /* ---------- Lightbox ---------- */

  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxTitle = document.getElementById('lightboxTitle');
  var lightboxCounter = document.getElementById('lightboxCounter');
  var lightboxClose = document.getElementById('lightboxClose');
  var currentShot = 0;
  var lastFocused = null;

  function captionFor(shot) {
    return shot.getAttribute(currentLang === 'pl' ? 'data-caption-pl' : 'data-caption-en') || '';
  }

  function updateLightboxCaption() {
    if (!shots[currentShot] || !lightboxTitle) return;
    lightboxTitle.textContent = captionFor(shots[currentShot]);
    if (lightboxCounter) lightboxCounter.textContent = (currentShot + 1) + ' / ' + shots.length;
  }

  function showShot(index) {
    if (!shots.length || !lightboxImg) return;
    currentShot = (index + shots.length) % shots.length;
    var shot = shots[currentShot];
    var img = shot.querySelector('img');
    lightboxImg.src = shot.getAttribute('data-full') || (img ? img.src : '');
    lightboxImg.alt = img ? img.alt : '';
    updateLightboxCaption();
  }

  function openLightbox(index) {
    if (!lightbox) return;
    lastFocused = document.activeElement;
    showShot(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  shots.forEach(function (shot, index) {
    shot.addEventListener('click', function () { openLightbox(index); });
  });

  var stageOpen = document.getElementById('stageOpen');
  if (stageOpen) {
    stageOpen.addEventListener('click', function () { openLightbox(stageIndex); });
  }

  if (lightbox) {
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    var prev = document.getElementById('lightboxPrev');
    var next = document.getElementById('lightboxNext');
    if (prev) prev.addEventListener('click', function () { showShot(currentShot - 1); });
    if (next) next.addEventListener('click', function () { showShot(currentShot + 1); });
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (event) {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showShot(currentShot - 1);
      if (event.key === 'ArrowRight') showShot(currentShot + 1);
    });
  }

  /* ---------- Copy ---------- */

  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy') || '';
      var done = function () {
        btn.classList.add('is-copied');
        btn.textContent = i18n[currentLang]['a11y.copied'];
        setTimeout(function () {
          btn.classList.remove('is-copied');
          btn.textContent = i18n[currentLang]['a11y.copy'];
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { /* ignore */ });
      }
    });
  });

  /* ---------- OS ---------- */

  var platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  var ua = navigator.userAgent || '';
  var recommended = null;
  if (/Win/i.test(platform) || /Windows/i.test(ua)) {
    recommended = document.querySelector('.pkg[data-os="windows"]');
  } else if (/Linux|X11/i.test(platform) || (/Linux/i.test(ua) && !/Android/i.test(ua))) {
    recommended = document.querySelector('.pkg[data-os="linux"]');
  }
  if (recommended) recommended.classList.add('is-recommended');

  /* ---------- Reveal ---------- */

  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    revealItems.forEach(function (el) { observer.observe(el); });
    window.addEventListener('load', function () {
      setTimeout(function () {
        revealItems.forEach(function (el) {
          if (!el.classList.contains('is-visible') && el.getBoundingClientRect().top < 80) {
            el.classList.add('is-visible');
          }
        });
      }, 400);
    });
  }

  /* ---------- Konami, quiet ---------- */

  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var konamiIndex = 0;
  var konamiToast = document.getElementById('konamiToast');
  var konamiTimer = null;

  function blip(freq, startAt, duration) {
    try {
      var ctx = blip.ctx || (blip.ctx = new (window.AudioContext || window.webkitAudioContext)());
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var t = ctx.currentTime + (startAt || 0);
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) { /* no audio */ }
  }

  document.addEventListener('keydown', function (event) {
    if (lightbox && lightbox.classList.contains('is-open')) return;
    var key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    konamiIndex = key === konami[konamiIndex] ? konamiIndex + 1 : (key === konami[0] ? 1 : 0);
    if (konamiIndex !== konami.length) return;
    konamiIndex = 0;
    [523, 659, 784, 1047].forEach(function (f, i) { blip(f, i * 0.09, 0.14); });
    if (!konamiToast) return;
    konamiToast.hidden = false;
    if (konamiTimer) clearTimeout(konamiTimer);
    konamiTimer = setTimeout(function () { konamiToast.hidden = true; }, 2200);
  });

  /* ---------- Cookie notice (informational; no tracking cookies) ---------- */

  var cookieBar = document.getElementById('cookieBar');
  var cookieOk = document.getElementById('cookieOk');
  var cookieKey = 'retro-launcher-cookie-notice';
  var cookieSeen = false;
  try { cookieSeen = localStorage.getItem(cookieKey) === 'seen'; } catch (e) { /* ignore */ }

  if (cookieBar && !cookieSeen) {
    window.setTimeout(function () {
      cookieBar.hidden = false;
      requestAnimationFrame(function () { cookieBar.classList.add('is-visible'); });
    }, 700);
  }

  if (cookieOk && cookieBar) {
    cookieOk.addEventListener('click', function () {
      cookieBar.classList.remove('is-visible');
      cookieBar.hidden = true;
      try { localStorage.setItem(cookieKey, 'seen'); } catch (e) { /* ignore */ }
    });
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
