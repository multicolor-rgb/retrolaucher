// Referencje do elementów DOM oraz podstawowy stan widoku.
const shelf = document.getElementById('shelf');
const shelfViewport = document.getElementById('shelfViewport');
const shelfInfo = document.getElementById('shelfInfo');
const bgBlur = document.getElementById('bgBlur');
const bgGradient = document.getElementById('bgGradient');
const bgGradientNext = document.getElementById('bgGradientNext');
const titleEl = document.getElementById('gameTitle');
const platEl = document.getElementById('plat');
const platTag = document.getElementById('plat');
const ratingMini = document.getElementById('ratingMini');
const playBtn = document.getElementById('playBtn');
const detailsBtn = document.getElementById('detailsBtn');
const tabsContainer = document.getElementById('tabsContainer');
const tabHighlight = document.getElementById('tabHighlight');
const searchInput = document.getElementById('search');
const overlay = document.getElementById('overlay');
const platformBlocks = document.getElementById('platformBlocks');
const settingsPanel = document.getElementById('settings-panel');

const colorCache = {};

// Każdy obrazek okładki, który nie wczyta się (404, uszkodzony plik),
// dostaje lokalny placeholder zamiast złamanej ikonki.
document.addEventListener('error', (event) => {
  const el = event.target;
  if (!el || el.tagName !== 'IMG') return;
  if (el.dataset.coverFallback === '1') return;

  el.dataset.coverFallback = '1';
  const failedSrc = String(el.getAttribute('src') || el.src || '');
  el.classList.add('is-placeholder');
  el.src = COVER_PLACEHOLDER;
  if (failedSrc) console.warn('Nie udało się wczytać obrazka:', failedSrc);
}, true);

// Zwraca markup ikony z SVG sprite'a (index.html → #i-*).
// Używane w dynamicznie budowanym HTML (listy, przyciski, pigułki).
function svgIcon(id, extraClass = '') {
  const cls = ['icon', extraClass].filter(Boolean).join(' ');
  return `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
}

function getDominantColor(src, cb) {
  if (!src) {
    cb({ r: 20, g: 22, b: 30 });
    return;
  }

  if (colorCache[src]) {
    cb(colorCache[src]);
    return;
  }

  const img = new Image();
  img.crossOrigin = 'Anonymous';

  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const w = canvas.width = 32;
      const h = canvas.height = 32;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0, w, h);

      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0, g = 0, b = 0, count = 0;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }

      const result = {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
      };

      colorCache[src] = result;
      cb(result);
    } catch (e) {
      cb({ r: 20, g: 22, b: 30 });
    }
  };

  img.onerror = () => cb({ r: 20, g: 22, b: 30 });
  img.src = src;
}

let gradientSwapTimer = null;
let lastGradientCss = '';

function applyGradient(rgb) {
  const { r, g, b } = rgb;
  const c1 = `rgb(${r},${g},${b})`;
  const c2 = `rgb(${Math.round(r * 0.4)},${Math.round(g * 0.4)},${Math.round(b * 0.5)})`;
  const gradient = `linear-gradient(135deg, ${c1} 0%, ${c2} 55%, #05060a 100%)`;

  // Crossfade zamiast skoku koloru: nowa warstwa wjeżdża opacity, po czym
  // staje się warstwą bazową. Tło nie „mignie” przy każdej zmianie gry.
  if (gradient !== lastGradientCss) {
    lastGradientCss = gradient;

    if (bgGradientNext) {
      bgGradientNext.style.background = gradient;
      void bgGradientNext.offsetWidth;
      bgGradientNext.classList.add('is-visible');

      clearTimeout(gradientSwapTimer);
      gradientSwapTimer = setTimeout(() => {
        bgGradient.style.background = gradient;
        bgGradientNext.classList.remove('is-visible');
      }, 540);
    } else {
      bgGradient.style.background = gradient;
    }
  }

  platTag.style.background = `rgba(${r},${g},${b},0.35)`;
  playBtn.style.background = c1;
  playBtn.style.color = (r + g + b) / 3 > 150 ? '#05060a' : '#fff';
}