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


function getAspectVars(aspect) {
  switch (aspect) {
    case 'psp':
      return { width: 180, ratio: '0.62 / 1' };
    case 'square':
      return { width: 180, ratio: '1 / 1' };
    case 'wide':
      return { width: 180, ratio: '0.78 / 1' };
          case 'bigpic':
      return { width: 220, ratio: '920 / 430' };
    case 'standard':
    default:
      return { width: 180, ratio: '0.70 / 1' };
  }
}
