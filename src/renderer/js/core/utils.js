// Funkcje pomocnicze niezależne od DOM.
function normalizeGameName(name) {
  return String(name || "")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[_\.]+/g, " ")
    .replace(/\([^)]+\)/g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/:\d+$/g, "")
    .replace(/[-–—]\s*(USA|EUR|PAL|NTSC).*$/i, "")
    .replace(/\b(v\d+(\.\d+)*)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^disney\s+/i, "")
    .replace(/^dreamworks\s+/i, "")
    .replace(/^DreamWorks\s+/i, "")
    .replace(/\b(HD|Remastered|Collection|Deluxe|Definitive)\b/gi, "")
    .trim();
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function validatePathExists(path) { return typeof path === 'string' && path.trim().length > 0; }
function parseArgString(raw) {
  return raw
    ? (raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || []).map(p => p.replace(/^"|"$/g, '').replace(/^'|'$/g, ''))
    : [];
}
function mod(n, m) { return ((n % m) + m) % m; }

// Proporcje miniatur okładek. `ratio` to szerokość / wysokość.
// `width` to bazowa szerokość kafelka w px (tryby siatki i tak skalują).
const ASPECT_PRESETS = {
  standard: { width: 180, ratio: 0.70, labelKey: 'standard' },
  portrait: { width: 180, ratio: 2 / 3, labelKey: 'aspectPortrait' },
  steam: { width: 180, ratio: 2 / 3, labelKey: 'aspectSteam' },
  psp: { width: 180, ratio: 0.62, labelKey: 'pspNarrow' },
  gba: { width: 180, ratio: 0.68, labelKey: 'aspectGba' },
  nds: { width: 180, ratio: 0.78, labelKey: 'aspectNds' },
  wide: { width: 180, ratio: 0.78, labelKey: 'wide' },
  square: { width: 180, ratio: 1, labelKey: 'square' },
  banner: { width: 240, ratio: 16 / 9, labelKey: 'aspectBanner' },
  bigpic: { width: 220, ratio: 920 / 430, labelKey: 'steamBigPicture' },
  marquee: { width: 260, ratio: 3, labelKey: 'aspectMarquee' }
};

const ASPECT_ORDER = [
  'standard', 'portrait', 'steam', 'psp', 'gba', 'nds', 'square',
  'wide', 'banner', 'bigpic', 'marquee', 'custom'
];

function getAspectVars(aspect, custom) {
  if (aspect === 'custom') {
    const width = Math.min(600, Math.max(80, Number(custom?.width) || 180));
    const ratio = Math.min(6, Math.max(0.25, Number(custom?.ratio) || 0.72));
    return {
      width,
      ratio: `${ratio} / 1`,
      ratioNumber: ratio,
      custom: true
    };
  }

  const preset = ASPECT_PRESETS[aspect] || ASPECT_PRESETS.standard;
  return {
    width: preset.width,
    ratio: `${preset.ratio} / 1`,
    ratioNumber: preset.ratio
  };
}

function getAspectLabelKey(aspect) {
  if (aspect === 'custom') return 'aspectCustom';
  return ASPECT_PRESETS[aspect]?.labelKey || 'standard';
}

// Stabilny identyfikator gry PC oparty na pełnej ścieżce pliku.
// (FNV-1a — wystarczający do kluczy w configu, nie do bezpieczeństwa.)
function pcGameId(filePath) {
  const text = String(filePath || '');
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return 'pc-' + hash.toString(16).padStart(8, '0');
}

// Parsowanie zmiennych środowiskowych z pola tekstowego (linia = KEY=VALUE).
function parseEnvLines(raw) {
  const out = {};
  String(raw || '')
    .split(/[\n;]+/)
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      const eq = line.indexOf('=');
      if (eq <= 0) return;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim();
      if (key) out[key] = value;
    });
  return out;
}

