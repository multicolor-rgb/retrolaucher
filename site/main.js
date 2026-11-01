/* Retro Launcher — site behaviour & i18n */
(function () {
  'use strict';

  var i18n = {
    en: {
      'a11y.skip': 'Skip to content',
      'nav.new': "What's new",
      'nav.themes': 'Themes',
      'nav.gallery': 'Screenshots',
      'nav.features': 'Features',
      'nav.download': 'Download',
      'cta.download': 'Download',

      'hero.badge': 'v2.1.0 · rebuilt on Tauri 2',
      'hero.title1': 'Your retro library.',
      'hero.title2': 'One beautiful home.',
      'hero.text': 'Retro Launcher brings your ROMs, emulators and cover art together in a pad-first interface made for the couch. Rebuilt on Tauri 2 — smaller, faster and lighter than ever.',
      'hero.cta': 'Download free',
      'hero.github': 'View on GitHub',
      'hero.chip.pad': 'Gamepad ready',
      'hero.window': 'Library',
      'hero.covers': 'Covers',
      'hero.combo': 'Stop combo',

      'new.eyebrow': "What's new in 2.x",
      'new.title': 'A lighter launcher with a whole new wardrobe',
      'new.text': 'The move from Electron to Tauri 2 made the app dramatically smaller and faster. On top of that: four console-inspired themes, a proper file manager and a native gamepad watchdog.',
      'new.tauri.title': 'Native Tauri 2 core',
      'new.tauri.text': 'Rust backend instead of a bundled browser engine. The same interface, a fraction of the footprint.',
      'new.tauri.stat': '3.4 MB .deb · ~3× less RAM',
      'new.themes.title': 'Four console themes',
      'new.themes.text': 'PS3, Wii, Xbox and Switch-inspired skins. Every screen, button and accent follows the selected theme.',
      'new.themes.stat': 'PS3 · Wii · Xbox · Switch',
      'new.manager.title': 'Games manager',
      'new.manager.text': 'Search, multi-select and bulk-edit your library. Rename, move or remove entries without leaving the launcher.',
      'new.manager.stat': 'Bulk editing & search',
      'new.watchdog.title': 'Gamepad watchdog',
      'new.watchdog.text': 'A native Rust watcher listens for the stop combo and closes the game instantly — even in fullscreen.',

      'themes.eyebrow': 'Make it yours',
      'themes.title': 'Dress it like your console',
      'themes.text': 'Pick a theme in Settings and the entire interface follows — colours, shapes and accent glow. Try them below.',
      'themes.play': 'Play',
      'themes.details': 'Details',
      'themes.hint': 'Theme preview is drawn in CSS. The real app uses the same palettes across every view.',

      'gallery.eyebrow': 'Screenshots',
      'gallery.title': 'A look inside',
      'gallery.text': 'Cover flow, platform browsing, game details and settings — click any shot to enlarge.',
      'gallery.shot1': 'Library',
      'gallery.shot1.text': 'Cover flow made for the couch.',
      'gallery.shot2': 'Game details',
      'gallery.shot2.text': 'Artwork, platform and rating.',
      'gallery.shot3': 'Platforms',
      'gallery.shot3.text': 'One library, many systems.',
      'gallery.shot4': 'Settings',
      'gallery.shot4.text': 'Themes, covers and emulator setup.',

      'features.eyebrow': 'Features',
      'features.title': 'Everything for a couch session',
      'features.text': 'Set up each platform once, then browse and launch with a gamepad. No terminal, no scattered config files.',
      'features.library.title': 'Library & cover flow',
      'features.library.text': 'Browse your collection with a smooth cover flow, search, filters and instant game details.',
      'features.platforms.title': 'Multi-platform by design',
      'features.platforms.text': 'Each platform gets its own ROM folder, emulator binary and launch arguments. Add as many as you like.',
      'features.covers.title': 'Covers & metadata',
      'features.covers.text': 'Fetch artwork from SteamGridDB automatically or point to your own file or URL.',
      'features.stats.title': 'Favourites & stats',
      'features.stats.text': 'Favourites, recently played games and playtime counters kept locally.',
      'features.pad.title': 'Gamepad first',
      'features.pad.text': 'Navigate, launch and quit with a controller. Keyboard shortcuts work everywhere too.',
      'features.fullscreen.title': 'Fullscreen big picture',
      'features.fullscreen.text': 'Start straight into fullscreen and keep it that way while you play. One launcher, zero desktop clutter.',
      'features.import.title': 'Import & portable mode',
      'features.import.text': 'Bring libraries over from EmulationStation, test emulator commands, and run everything from a USB stick.',

      'download.eyebrow': 'Download',
      'download.title': 'Get Retro Launcher 2.1',
      'download.text': 'Free and open source. Pick the package for your system — your existing configuration stays intact.',
      'download.latest': 'latest release',
      'download.yourSystem': 'Your system',
      'download.win.title': 'Installer (.exe)',
      'download.win.text': 'NSIS installer for Windows 10 and 11. WebView2 is installed automatically if your system needs it.',
      'download.win.cta': 'Download for Windows',
      'download.deb.title': 'Package (.deb)',
      'download.deb.text': 'Native package with system integration, desktop entry and dependencies handled by apt.',
      'download.deb.cta': 'Download .deb',
      'download.appimage.title': 'Portable (.AppImage)',
      'download.appimage.text': 'One file, no installation. Ideal for testing or keeping the launcher on a USB drive.',
      'download.appimage.tag': 'portable',
      'download.appimage.cta': 'Download AppImage',
      'download.note': 'Your configuration and playtime are stored in <code>~/.config/retro-launcher</code> (or the Windows equivalent) and are preserved when upgrading from 1.x. Need another build? Check the <a href="https://github.com/multicolor-rgb/retrolaucher/releases" target="_blank" rel="noopener">releases page</a>.',

      'faq.eyebrow': 'FAQ',
      'faq.title': 'Good to know',
      'faq.q1': 'Will I lose my configuration when upgrading from 1.x?',
      'faq.a1': 'No. The data path is unchanged, so platforms, covers and playtime carry over automatically.',
      'faq.q2': 'What are the system requirements?',
      'faq.a2': 'Windows 10 or 11 with WebView2 (the installer handles it). On Linux you need a GTK3 desktop and webkit2gtk 4.1 — the .deb package pulls those in for you.',
      'faq.q3': 'Do I need a gamepad to use it?',
      'faq.a3': 'Not at all. Everything works with a keyboard and mouse; the controller layout is there for couch play.',
      'faq.q4': 'Where do the covers come from?',
      'faq.a4': 'SteamGridDB provides automatic artwork. You can also set a custom local file or image URL for any game.',
      'faq.q5': 'Is it really free?',
      'faq.a5': 'Yes — MIT licensed and free to use. If you want to support development, there is a Ko-fi link in the footer.',
      'faq.q6': 'Can I run it from a USB stick?',
      'faq.a6': 'Yes. Use the AppImage together with portable mode and the launcher keeps its config next to the executable.',

      'footer.tagline': 'Pad-first retro gaming, built with Tauri 2.',
      'footer.releases': 'Releases',
      'footer.issues': 'Report an issue',
      'footer.license': 'MIT License',
      'footer.coffee': 'Buy me a coffee'
    },

    pl: {
      'a11y.skip': 'Przejdź do treści',
      'nav.new': 'Co nowego',
      'nav.themes': 'Motywy',
      'nav.gallery': 'Screenshoty',
      'nav.features': 'Funkcje',
      'nav.download': 'Pobierz',
      'cta.download': 'Pobierz',

      'hero.badge': 'v2.1.0 · nowy silnik Tauri 2',
      'hero.title1': 'Twoja biblioteka retro.',
      'hero.title2': 'Jedno piękne miejsce.',
      'hero.text': 'Retro Launcher łączy ROM-y, emulatory i okładki w interfejsie stworzonym pod pada i kanapę. Przepisany na Tauri 2 — mniejszy, szybszy i lżejszy niż kiedykolwiek.',
      'hero.cta': 'Pobierz za darmo',
      'hero.github': 'Zobacz na GitHubie',
      'hero.chip.pad': 'Gotowy na pada',
      'hero.window': 'Biblioteka',
      'hero.covers': 'Okładki',
      'hero.combo': 'Kombinacja stop',

      'new.eyebrow': 'Co nowego w 2.x',
      'new.title': 'Lżejszy launcher w zupełnie nowej szacie',
      'new.text': 'Przejście z Electrona na Tauri 2 sprawiło, że aplikacja jest znacznie mniejsza i szybsza. Do tego cztery motywy inspirowane konsolami, porządny manager plików i natywny watchdog pada.',
      'new.tauri.title': 'Natywny rdzeń Tauri 2',
      'new.tauri.text': 'Backend w Rust zamiast wbudowanej przeglądarki. Ten sam interfejs przy ułamku rozmiaru.',
      'new.tauri.stat': '3.4 MB .deb · ~3× mniej RAM',
      'new.themes.title': 'Cztery motywy konsol',
      'new.themes.text': 'Skórki inspirowane PS3, Wii, Xbox i Switch. Każdy ekran, przycisk i akcent podąża za wybranym motywem.',
      'new.themes.stat': 'PS3 · Wii · Xbox · Switch',
      'new.manager.title': 'Manager plików',
      'new.manager.text': 'Szukaj, zaznaczaj wiele pozycji i edytuj bibliotekę hurtowo. Zmieniaj nazwy, przenoś i usuwaj bez wychodzenia z launchera.',
      'new.manager.stat': 'Masowa edycja i wyszukiwanie',
      'new.watchdog.title': 'Watchdog pada',
      'new.watchdog.text': 'Natywny mechanizm w Rust nasłuchuje kombinacji stop i natychmiast zamyka grę — także w pełnym ekranie.',

      'themes.eyebrow': 'Dopasuj do siebie',
      'themes.title': 'Ubierz go jak swoją konsolę',
      'themes.text': 'Wybierz motyw w Ustawieniach, a cały interfejs pójdzie za nim — kolory, kształty i poświata akcentu. Przetestuj poniżej.',
      'themes.play': 'Uruchom',
      'themes.details': 'Szczegóły',
      'themes.hint': 'Podgląd motywu jest rysowany w CSS. Prawdziwa aplikacja używa tych samych palet w każdym widoku.',

      'gallery.eyebrow': 'Screenshoty',
      'gallery.title': 'Zajrzyj do środka',
      'gallery.text': 'Cover flow, przeglądanie platform, szczegóły gry i ustawienia — kliknij zdjęcie, aby powiększyć.',
      'gallery.shot1': 'Biblioteka',
      'gallery.shot1.text': 'Cover flow stworzony pod kanapę.',
      'gallery.shot2': 'Szczegóły gry',
      'gallery.shot2.text': 'Okładka, platforma i ocena.',
      'gallery.shot3': 'Platformy',
      'gallery.shot3.text': 'Jedna biblioteka, wiele systemów.',
      'gallery.shot4': 'Ustawienia',
      'gallery.shot4.text': 'Motywy, okładki i konfiguracja emulatorów.',

      'features.eyebrow': 'Funkcje',
      'features.title': 'Wszystko na sesję z kanapy',
      'features.text': 'Skonfiguruj każdą platformę raz, a potem przeglądaj i uruchamiaj gry padem. Bez terminala i porozrzucanych plików konfiguracji.',
      'features.library.title': 'Biblioteka i cover flow',
      'features.library.text': 'Przeglądaj kolekcję w płynnym cover flow, z wyszukiwaniem, filtrami i natychmiastowymi szczegółami gry.',
      'features.platforms.title': 'Wiele platform w standardzie',
      'features.platforms.text': 'Każda platforma ma własny folder ROM-ów, binarkę emulatora i argumenty startowe. Dodawaj ich dowolną liczbę.',
      'features.covers.title': 'Okładki i metadane',
      'features.covers.text': 'Pobieraj grafiki automatycznie ze SteamGridDB albo wskaż własny plik lub URL.',
      'features.stats.title': 'Ulubione i statystyki',
      'features.stats.text': 'Ulubione, ostatnio grane gry i licznik czasu gry trzymane lokalnie.',
      'features.pad.title': 'Najpierw pad',
      'features.pad.text': 'Nawiguj, uruchamiaj i wychodź padem. Skróty klawiaturowe też działają wszędzie.',
      'features.fullscreen.title': 'Pełny ekran jak big picture',
      'features.fullscreen.text': 'Startuj prosto w pełny ekran i zostań w nim podczas gry. Jeden launcher, zero bałaganu na pulpicie.',
      'features.import.title': 'Import i tryb przenośny',
      'features.import.text': 'Przenieś biblioteki z EmulationStation, testuj polecenia emulatorów i uruchamiaj wszystko z pendrive’a.',

      'download.eyebrow': 'Pobieranie',
      'download.title': 'Pobierz Retro Launcher 2.1',
      'download.text': 'Darmowy i otwarty. Wybierz pakiet dla swojego systemu — obecna konfiguracja pozostanie nietknięta.',
      'download.latest': 'najnowsze wydanie',
      'download.yourSystem': 'Twój system',
      'download.win.title': 'Instalator (.exe)',
      'download.win.text': 'Instalator NSIS dla Windows 10 i 11. WebView2 doinstaluje się automatycznie, jeśli system go potrzebuje.',
      'download.win.cta': 'Pobierz dla Windows',
      'download.deb.title': 'Pakiet (.deb)',
      'download.deb.text': 'Natywny pakiet z integracją systemową, wpisem w menu i zależnościami obsłużonymi przez apt.',
      'download.deb.cta': 'Pobierz .deb',
      'download.appimage.title': 'Przenośny (.AppImage)',
      'download.appimage.text': 'Jeden plik, bez instalacji. Idealny do testów albo trzymania launchera na pendrive.',
      'download.appimage.tag': 'przenośny',
      'download.appimage.cta': 'Pobierz AppImage',
      'download.note': 'Konfiguracja i czas gry są zapisywane w <code>~/.config/retro-launcher</code> (lub odpowiedniku na Windows) i pozostają zachowane przy aktualizacji z 1.x. Potrzebujesz innego builda? Zajrzyj na <a href="https://github.com/multicolor-rgb/retrolaucher/releases" target="_blank" rel="noopener">stronę wydań</a>.',

      'faq.eyebrow': 'FAQ',
      'faq.title': 'Warto wiedzieć',
      'faq.q1': 'Czy stracę konfigurację przy aktualizacji z 1.x?',
      'faq.a1': 'Nie. Ścieżka danych się nie zmieniła, więc platformy, okładki i czas gry przeniosą się automatycznie.',
      'faq.q2': 'Jakie są wymagania systemowe?',
      'faq.a2': 'Windows 10 lub 11 z WebView2 (instalator załatwia to sam). Na Linuksie potrzebny jest pulpit GTK3 i webkit2gtk 4.1 — pakiet .deb dociągnie je za Ciebie.',
      'faq.q3': 'Czy potrzebuję pada?',
      'faq.a3': 'Wcale nie. Wszystko działa z klawiaturą i myszą; układ pod pada jest dla grania z kanapy.',
      'faq.q4': 'Skąd pochodzą okładki?',
      'faq.a4': 'Grafiki pobiera automatycznie SteamGridDB. Możesz też ustawić własny plik lokalny lub URL obrazka dla dowolnej gry.',
      'faq.q5': 'Czy to naprawdę darmowe?',
      'faq.a5': 'Tak — licencja MIT i darmowe użytkowanie. Jeśli chcesz wesprzeć rozwój, w stopce jest link do Ko-fi.',
      'faq.q6': 'Czy uruchomię go z pendrive’a?',
      'faq.a6': 'Tak. Użyj AppImage razem z trybem przenośnym, a launcher będzie trzymał konfigurację obok pliku wykonywalnego.',

      'footer.tagline': 'Retro granie pod pada, zbudowane na Tauri 2.',
      'footer.releases': 'Wydania',
      'footer.issues': 'Zgłoś problem',
      'footer.license': 'Licencja MIT',
      'footer.coffee': 'Kup mi kawę'
    }
  };

  var root = document.documentElement;
  var storageKey = 'retro-launcher-lang';
  var currentLang = 'en';

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

    if (lightbox && lightbox.classList.contains('is-open')) updateLightboxCaption();
    updateDocumentTitle(lang);
  }

  function updateDocumentTitle(lang) {
    document.title = lang === 'pl'
      ? 'Retro Launcher 2.1 — Twoja biblioteka retro w jednym miejscu'
      : 'Retro Launcher 2.1 — Your retro library, one beautiful home';
  }

  var savedLang = 'en';
  try { savedLang = localStorage.getItem(storageKey) || (navigator.language || 'en').slice(0, 2); } catch (e) { /* ignore */ }
  applyLanguage(savedLang === 'pl' ? 'pl' : 'en');

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLanguage(btn.getAttribute('data-lang')); });
  });

  /* ---------- Header ---------- */
  var header = document.getElementById('siteHeader');
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
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

  /* ---------- Theme tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.theme-tab'));
  var mock = document.getElementById('themeMock');
  var themeNames = { ps3: 'PS3', wii: 'Wii', xbox: 'Xbox', switch: 'Switch' };

  function selectTheme(theme, focusTab) {
    if (!mock) return;
    mock.setAttribute('data-theme', theme);
    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-theme') === theme;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) {
        mock.setAttribute('aria-labelledby', tab.id);
        if (focusTab) tab.focus();
      }
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { selectTheme(tab.getAttribute('data-theme'), false); });
    tab.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      selectTheme(tabs[next].getAttribute('data-theme'), true);
      tabs[next].tabIndex = 0;
    });
  });

  selectTheme('ps3', false);

  /* ---------- Gallery lightbox ---------- */  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxTitle = document.getElementById('lightboxTitle');
  var lightboxCounter = document.getElementById('lightboxCounter');
  var lightboxClose = document.getElementById('lightboxClose');
  var lightboxPrev = document.getElementById('lightboxPrev');
  var lightboxNext = document.getElementById('lightboxNext');
  var currentShot = 0;
  var lastFocused = null;

  function captionFor(shot) {
    var key = currentLang === 'pl' ? 'data-caption-pl' : 'data-caption-en';
    return shot.getAttribute(key) || '';
  }

  function updateLightboxCaption() {
    if (!shots[currentShot]) return;
    lightboxTitle.textContent = captionFor(shots[currentShot]);
    lightboxCounter.textContent = (currentShot + 1) + ' / ' + shots.length;
  }

  function showShot(index) {
    if (!shots.length) return;
    currentShot = (index + shots.length) % shots.length;
    var shot = shots[currentShot];
    var full = shot.getAttribute('data-full');
    var img = shot.querySelector('img');
    lightboxImg.src = full;
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
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  shots.forEach(function (shot, index) {
    shot.addEventListener('click', function () { openLightbox(index); });
  });

  if (lightbox) {
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', function () { showShot(currentShot - 1); });
    if (lightboxNext) lightboxNext.addEventListener('click', function () { showShot(currentShot + 1); });
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (event) {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') { closeLightbox(); return; }
      if (event.key === 'ArrowLeft') { showShot(currentShot - 1); return; }
      if (event.key === 'ArrowRight') { showShot(currentShot + 1); return; }
      if (event.key === 'Tab') {
        var focusable = lightbox.querySelectorAll('button');
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------- Copy buttons ---------- */
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy') || '';
      var done = function () {
        btn.classList.add('is-copied');
        setTimeout(function () { btn.classList.remove('is-copied'); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { /* ignore */ });
      } else {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
        document.body.removeChild(area);
      }
    });
  });

  /* ---------- OS detection ---------- */
  var platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  var ua = navigator.userAgent || '';
  var isWindows = /Win/i.test(platform) || /Windows/i.test(ua);
  var isLinux = /Linux|X11/i.test(platform) || (/Linux/i.test(ua) && !/Android/i.test(ua));
  var recommended = null;
  if (isWindows) recommended = document.querySelector('.download-card[data-os="windows"]');
  if (isLinux) recommended = document.querySelector('.download-card[data-os="linux"]');
  if (recommended) recommended.classList.add('download-card--recommended');

  /* ---------- Reveal on scroll ---------- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentElement ? Array.prototype.slice.call(el.parentElement.children) : [];
        var index = siblings.indexOf(el);
        el.style.transitionDelay = Math.min(index, 4) * 70 + 'ms';
        el.classList.add('is-visible');
        observer.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
