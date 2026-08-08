// Audio, gamepad, fullscreen i inicjalizacja aplikacji.

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
}

function toggleFullscreen() {
  if (window.launcherAPI?.toggleFullscreen) {
    return window.launcherAPI.toggleFullscreen();
  }

  const el = document.documentElement;
  if (!document.fullscreenElement) {
    const req =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;

    if (req) return req.call(el).catch?.(() => {});
  } else {
    const exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.mozCancelFullScreen ||
      document.msExitFullscreen;

    if (exit) return exit.call(document).catch?.(() => {});
  }
}

const addPlatformForm = document.getElementById('addPlatformForm');
const newPlatformName = document.getElementById('newPlatformName');
const newPlatformExts = document.getElementById('newPlatformExts');
const newPlatformColor = document.getElementById('newPlatformColor');
const newPlatformAspect = document.getElementById('newPlatformAspect');

addPlatformForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const label = newPlatformName?.value.trim();
  if (!label) return;

  const key = slugify(label) || ('platform' + Date.now());
  if (config.platforms.some(p => p.key === key)) {
    showToast('Platforma o tym identyfikatorze już istnieje', true);
    return;
  }

  const extsRaw = newPlatformExts?.value.trim() || '';
  const extensions = extsRaw
    ? extsRaw.split(',').map(x => x.trim()).filter(Boolean).map(x => (x.startsWith('.') ? x : '.' + x))
    : [];

  config.platforms.push({
    key,
    label,
    color: newPlatformColor?.value || '#38e0ff',
    icon: DEFAULT_PLATFORM_ICON,
    extensions,
    aspect: newPlatformAspect?.value || 'standard'
  });

  if (newPlatformName) newPlatformName.value = '';
  if (newPlatformExts) newPlatformExts.value = '';
  if (newPlatformAspect) newPlatformAspect.value = 'standard';

  await saveStoredConfig();
  renderSettings();
  renderTabs();
  showToast('Dodano platformę: ' + label);
});

document.getElementById('saveBtn')?.addEventListener('click', async () => {
  await saveStoredConfig();
  await refreshLibrary();
  showToast('Zapisano ustawienia ✔');
});

document.getElementById('resetBtn')?.addEventListener('click', async () => {
  config.romFolders = {};
  config.emulators = {};
  config.launchArgs = {};
  await saveStoredConfig();
  renderSettings();
  await refreshLibrary();
});

document.getElementById('fullscreenBtn')?.addEventListener('click', toggleFullscreen);

document.getElementById('platformDropdownBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('platformDropdown')?.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('platformDropdown');
  if (dropdown && !dropdown.contains(e.target)) closeDropdown();
});

function setShelfViewMode(mode) {
  const allowed = ['flat', 'arc', 'stack', 'cascade', 'grid'];
  if (!allowed.includes(mode)) return;
  if (viewMode === mode) return;

  viewMode = mode;

  if (!config.uiState || typeof config.uiState !== 'object') {
    config.uiState = {};
  }

  config.uiState.shelfViewMode = mode;

  document.querySelectorAll('.vm-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  document.querySelector('.shelf-stage')?.classList.toggle('cascade-bg', mode === 'cascade');

  saveStoredConfig();
  renderShelf();
  sfxTab();
}

function cycleShelfViewMode(step) {
  const modes = ['flat', 'arc', 'stack', 'cascade', 'grid'];
  const currentIndex = Math.max(0, modes.indexOf(viewMode));
  const nextIndex = mod(currentIndex + step, modes.length);
  setShelfViewMode(modes[nextIndex]);
}

document.querySelectorAll('.vm-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setShelfViewMode(btn.dataset.mode);
  });
});

playBtn?.addEventListener('click', () => {
  const g = filtered[current];
  if (g) launchGame(g);
});

detailsBtn?.addEventListener('click', () => {
  const g = filtered[current];
  if (g) openDetails(g);
});

document.getElementById('closeBtn')?.addEventListener('click', () => {
  overlay?.classList.remove('open');
});

overlay?.addEventListener('click', (e) => {
  if (e.target === overlay) overlay.classList.remove('open');
});

document.getElementById('modalPlayBtn')?.addEventListener('click', () => {
  if (overlay?.currentGame) launchGame(overlay.currentGame);
  overlay?.classList.remove('open');
});

document.getElementById('modalCoverBtn')?.addEventListener('click', () => {
  if (overlay?.currentGame) {
    overlay.classList.remove('open');
    openManualCoverEditorForGame(overlay.currentGame);
  }
});

searchInput?.addEventListener('input', refreshLibrary);

document.getElementById('navHome')?.addEventListener('click', () => switchToPage('home'));

document.getElementById('navSettings')?.addEventListener('click', () => {
  switchToPage('settings');
  activateSettingsSubtab('general');
});

document.getElementById('settings-close-btn')?.addEventListener('click', () => switchToPage('home'));

document.querySelectorAll('.settings-subtab').forEach(t => {
  t.addEventListener('click', () => activateSettingsSubtab(t.dataset.subtab));
});

window.addEventListener('hashchange', () => {
  const page = location.hash.replace('#', '') || 'home';
  if (page === 'settings') {
    switchToPage('settings');
    activateSettingsSubtab('general');
  } else {
    switchToPage('home');
  }
});

window.addEventListener('keydown', (e) => {
  const settingsActive = !settingsPanel.hidden;

  if (e.key === 'F11') {
    e.preventDefault();
    toggleFullscreen();
  }

  if (e.key === 'Escape') {
    if (overlay.classList.contains('open')) overlay.classList.remove('open');
    else if (settingsActive) switchToPage('home');
  }

  if (settingsActive) return;

  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') prev();

  if (e.key === 'Enter') {
    const g = filtered[current];
    if (g) launchGame(g);
  }
});

async function init() {
  await loadStoredConfig();
  ensurePresetEmulators();

  viewMode = config.uiState?.shelfViewMode || 'flat';

  renderTabs();
  renderSettings();

  document.querySelectorAll('.vm-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === viewMode);
  });

  document.querySelector('.shelf-stage')?.classList.toggle('cascade-bg', viewMode === 'cascade');

  if (config.uiState?.fullscreenOnLaunch) {
    const tryFullscreen = () => {
      if (!document.fullscreenElement) {
        const el = document.documentElement;
        const req =
          el.requestFullscreen ||
          el.webkitRequestFullscreen ||
          el.mozRequestFullScreen ||
          el.msRequestFullscreen;
        if (req) req.call(el).catch?.(() => {});
      }
    };

    setTimeout(tryFullscreen, 500);
    setTimeout(tryFullscreen, 1500);
  }

  await refreshLibrary();

  if (location.hash === '#settings') {
    switchToPage('settings');
    activateSettingsSubtab('general');
  } else {
    switchToPage('home');
  }
}
// ---------- Obsługa pada (Gamepad API) ----------
let gamepadIndex = null;
let gamepadLoopActive = false;
let stopComboLatched = false;

const gpState = {
  lastMove: 0,
  lastAction: 0,
  lastAxisX: 0,
  lastAxisY: 0,
  lastButtons: {},
  pdIndex: 0,
  settingsIndex: 0,
  modalIndex: 0,
  stickXActive: false,
  stickXDir: 0
};

const GP_MOVE_COOLDOWN = 220;
const GP_ACTION_COOLDOWN = 320;
const GP_DEADZONE = 0.45;

function isSettingsActive() {
  return settingsPanel ? !settingsPanel.hidden : false;
}

function isTextEditingElement(el) {
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

function getVisibleFocusable(root) {
  if (!root) return [];
  const selectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  return [...root.querySelectorAll(selectors)].filter(el => {
    if (!el) return false;
    if (el.hidden) return false;
    if (el.closest('[hidden]')) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return true;
  });
}

function getSettingsFocusable() {
  if (!isSettingsActive()) return [];
  const panel = document.querySelector('.settings-subpanel.active') || settingsPanel;
  const subtabs = [...document.querySelectorAll('.settings-subtab')];
  const panelItems = getVisibleFocusable(panel);
  const merged = [...subtabs, ...panelItems];
  return merged.filter((el, idx) => merged.indexOf(el) === idx);
}

function getModalFocusable() {
  if (!overlay?.classList.contains('open')) return [];
  const modalCard = overlay.querySelector('.modal-card');
  return getVisibleFocusable(modalCard);
}

function focusByIndex(items, index) {
  if (!items.length) return 0;
  const safeIndex = mod(index, items.length);
  const el = items[safeIndex];
  el?.focus?.({ preventScroll: false });
  el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  return safeIndex;
}

function pressElement(el) {
  if (!el) return;
  const tag = (el.tagName || '').toLowerCase();

  if (tag === 'button') {
    el.click();
    return;
  }

  if (tag === 'select' || tag === 'input' || tag === 'textarea') {
    el.focus();
    el.click?.();
    return;
  }

  el.click?.();
}

function justPressedButton(gp, index) {
  const pressed = !!gp.buttons[index]?.pressed;
  const prev = !!gpState.lastButtons[index];
  gpState.lastButtons[index] = pressed;
  return pressed && !prev;
}

function axisPressed(axisValue, direction, axisKey) {
  const prev = gpState[axisKey] || 0;
  gpState[axisKey] = axisValue;

  if (direction === 'negative') {
    return axisValue < -GP_DEADZONE && prev >= -GP_DEADZONE;
  }

  if (direction === 'positive') {
    return axisValue > GP_DEADZONE && prev <= GP_DEADZONE;
  }

  return false;
}

function readHorizontalStickNavigation(gp, now) {
  const x = gp.axes[0] || 0;
  const absX = Math.abs(x);

  if (absX < GP_DEADZONE) {
    gpState.stickXActive = false;
    gpState.stickXDir = 0;
    return 0;
  }

  const dir = x < 0 ? -1 : 1;

  if (!gpState.stickXActive || gpState.stickXDir !== dir) {
    gpState.stickXActive = true;
    gpState.stickXDir = dir;
    gpState.lastMove = now;
    return dir;
  }

  if (now - gpState.lastMove > GP_MOVE_COOLDOWN) {
    gpState.lastMove = now;
    return dir;
  }

  return 0;
}

function moveSettingsFocus(step) {
  const items = getSettingsFocusable();
  if (!items.length) return;
  gpState.settingsIndex = focusByIndex(items, gpState.settingsIndex + step);
}

function moveModalFocus(step) {
  const items = getModalFocusable();
  if (!items.length) return;
  gpState.modalIndex = focusByIndex(items, gpState.modalIndex + step);
}

function switchSettingsSubtab(step) {
  const tabs = [...document.querySelectorAll('.settings-subtab')];
  if (!tabs.length) return;

  let idx = tabs.findIndex(t => t.classList.contains('active'));
  if (idx < 0) idx = 0;

  const nextIdx = mod(idx + step, tabs.length);
  tabs[nextIdx]?.click();

  setTimeout(() => {
    gpState.settingsIndex = 0;
    const items = getSettingsFocusable();
    focusByIndex(items, 0);
  }, 30);
}

function isStopComboPressed(gp) {
  if (!gp) return false;

  const l3 = !!gp.buttons?.[10]?.pressed;
  const x = !!gp.buttons?.[2]?.pressed;

  return l3 && x;
}


async function handleStopCombo(gp) {
  const pressed = isStopComboPressed(gp);

  if (pressed && !stopComboLatched) {
    stopComboLatched = true;
    if (window.launcherAPI?.stopLastGame) {
      const res = await window.launcherAPI.stopLastGame();
      if (res?.ok) showToast('Zamykam emulator', false);
      else showToast('Nie udało się zamknąć emulatora', true);
    }
  }

  if (!pressed) {
    stopComboLatched = false;
  }
}

function handleModalGamepad(gp, now) {
  const items = getModalFocusable();
  if (items.length && !items.includes(document.activeElement)) {
    gpState.modalIndex = focusByIndex(items, gpState.modalIndex);
  }

  const up = justPressedButton(gp, 12) || axisPressed(gp.axes[1] || 0, 'negative', 'lastAxisY');
  const down = justPressedButton(gp, 13) || axisPressed(gp.axes[1] || 0, 'positive', 'lastAxisY');
  const a = justPressedButton(gp, 0);
  const b = justPressedButton(gp, 1);
  const start = justPressedButton(gp, 9);

  if (up && now - gpState.lastMove > GP_MOVE_COOLDOWN) {
    moveModalFocus(-1);
    sfxHover();
    gpState.lastMove = now;
    return;
  }

  if (down && now - gpState.lastMove > GP_MOVE_COOLDOWN) {
    moveModalFocus(1);
    sfxHover();
    gpState.lastMove = now;
    return;
  }

  if (a && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    const target = items[gpState.modalIndex] || document.activeElement;
    pressElement(target);
    sfxSelect();
    gpState.lastAction = now;
    return;
  }

  if ((b || start) && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    overlay.classList.remove('open');
    sfxBack();
    gpState.lastAction = now;
  }
}

function handleSettingsGamepad(gp, now) {
  const items = getSettingsFocusable();
  if (items.length && !items.includes(document.activeElement)) {
    gpState.settingsIndex = focusByIndex(items, gpState.settingsIndex);
  }

  const up = justPressedButton(gp, 12) || axisPressed(gp.axes[1] || 0, 'negative', 'lastAxisY');
  const down = justPressedButton(gp, 13) || axisPressed(gp.axes[1] || 0, 'positive', 'lastAxisY');
  const left = justPressedButton(gp, 14) || axisPressed(gp.axes[0] || 0, 'negative', 'lastAxisX');
  const right = justPressedButton(gp, 15) || axisPressed(gp.axes[0] || 0, 'positive', 'lastAxisX');
  const a = justPressedButton(gp, 0);
  const b = justPressedButton(gp, 1);
  const lb = justPressedButton(gp, 4);
  const rb = justPressedButton(gp, 5);
  const start = justPressedButton(gp, 9);

  const activeEl = document.activeElement;
  const editing = isTextEditingElement(activeEl);

  if (!editing && up && now - gpState.lastMove > GP_MOVE_COOLDOWN) {
    moveSettingsFocus(-1);
    sfxHover();
    gpState.lastMove = now;
    return;
  }

  if (!editing && down && now - gpState.lastMove > GP_MOVE_COOLDOWN) {
    moveSettingsFocus(1);
    sfxHover();
    gpState.lastMove = now;
    return;
  }

  if (!editing && (lb || left) && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    switchSettingsSubtab(-1);
    sfxTab();
    gpState.lastAction = now;
    return;
  }

  if (!editing && (rb || right) && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    switchSettingsSubtab(1);
    sfxTab();
    gpState.lastAction = now;
    return;
  }

  if (a && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    pressElement(activeEl && items.includes(activeEl) ? activeEl : items[gpState.settingsIndex]);
    sfxSelect();
    gpState.lastAction = now;
    return;
  }

  if ((b || start) && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    switchToPage('home');
    document.getElementById('navSettings')?.classList.remove('active-view');
    sfxBack();
    gpState.lastAction = now;
  }
}

function handleDropdownGamepad(gp, now) {
  const items = Array.from(document.querySelectorAll('.pd-item'));
  if (!items.length) {
    closeDropdown();
    return true;
  }

  if (!Number.isInteger(gpState.pdIndex)) gpState.pdIndex = 0;

  const up = justPressedButton(gp, 12) || axisPressed(gp.axes[1] || 0, 'negative', 'lastAxisY');
  const down = justPressedButton(gp, 13) || axisPressed(gp.axes[1] || 0, 'positive', 'lastAxisY');
  const a = justPressedButton(gp, 0);
  const b = justPressedButton(gp, 1);
  const start = justPressedButton(gp, 9);

  if (up && now - gpState.lastMove > GP_MOVE_COOLDOWN) {
    gpState.pdIndex = mod(gpState.pdIndex - 1, items.length);
    items.forEach((it, i) => it.classList.toggle('pd-focus', i === gpState.pdIndex));
    items[gpState.pdIndex]?.scrollIntoView({ block: 'nearest' });
    sfxHover();
    gpState.lastMove = now;
    return true;
  }

  if (down && now - gpState.lastMove > GP_MOVE_COOLDOWN) {
    gpState.pdIndex = mod(gpState.pdIndex + 1, items.length);
    items.forEach((it, i) => it.classList.toggle('pd-focus', i === gpState.pdIndex));
    items[gpState.pdIndex]?.scrollIntoView({ block: 'nearest' });
    sfxHover();
    gpState.lastMove = now;
    return true;
  }

  if (a && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    items[gpState.pdIndex]?.click();
    gpState.pdIndex = 0;
    sfxSelect();
    gpState.lastAction = now;
    return true;
  }

  if ((b || start) && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    closeDropdown();
    gpState.pdIndex = 0;
    sfxBack();
    gpState.lastAction = now;
    return true;
  }

  return true;
}

function handleLibraryGamepad(gp, now) {
  const dpadLeft = justPressedButton(gp, 14);
  const dpadRight = justPressedButton(gp, 15);
  const stickHorizontal = readHorizontalStickNavigation(gp, now);

  const left = dpadLeft || stickHorizontal === -1;
  const right = dpadRight || stickHorizontal === 1;

  const up = justPressedButton(gp, 12) || axisPressed(gp.axes[1] || 0, 'negative', 'lastAxisY');
  const a = justPressedButton(gp, 0);
  const y = justPressedButton(gp, 3);
  const start = justPressedButton(gp, 9);
  const lb = justPressedButton(gp, 4);
  const rb = justPressedButton(gp, 5);
  const lt = justPressedButton(gp, 6);
  const rt = justPressedButton(gp, 7);

  if (left) {
    prev();
    return;
  }

  if (right) {
    next();
    return;
  }

  if ((lb || rb) && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    const plats = usedPlatforms();
    const keys = ['all', ...plats.map(p => p.key)];
    const activeIdx = keys.indexOf(activePlatform);
    let newIdx = activeIdx;

    if (lb) newIdx = mod(activeIdx - 1, keys.length);
    if (rb) newIdx = mod(activeIdx + 1, keys.length);

    const newKey = keys[newIdx];
    if (newKey === 'all') {
      applyFilter('all', document.querySelector('.tab[data-platform="all"]'));
    } else {
      applyFilter(newKey, null);
    }

    gpState.lastAction = now;
    return;
  }

  if ((lt || rt) && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    if (lt) cycleShelfViewMode(-1);
    if (rt) cycleShelfViewMode(1);
    gpState.lastAction = now;
    return;
  }

  if (up && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    document.getElementById('platformDropdown')?.classList.add('open');
    gpState.pdIndex = 0;
    sfxTab();
    gpState.lastAction = now;
    return;
  }

  if (a && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    const g = filtered[current];
    if (g) launchGame(g);
    gpState.lastAction = now;
    return;
  }

  if (y && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    const g = filtered[current];
    if (g) openDetails(g);
    gpState.modalIndex = 0;
    gpState.lastAction = now;
    return;
  }

  if (start && now - gpState.lastAction > GP_ACTION_COOLDOWN) {
    switchToPage('settings');
    document.getElementById('navSettings')?.classList.add('active-view');

    setTimeout(() => {
      const items = getSettingsFocusable();
      gpState.settingsIndex = focusByIndex(items, 0);
    }, 30);

    gpState.lastAction = now;
  }
}

function handleGamepadInput(gp) {
  const now = performance.now();

  if (overlay.classList.contains('open')) {
    handleModalGamepad(gp, now);
    return;
  }

  if (isSettingsActive()) {
    handleSettingsGamepad(gp, now);
    return;
  }

  const dropdownEl = document.getElementById('platformDropdown');
  if (dropdownEl?.classList.contains('open')) {
    handleDropdownGamepad(gp, now);
    return;
  }

  handleLibraryGamepad(gp, now);
}

function gamepadLoop() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = gamepadIndex !== null ? pads[gamepadIndex] : null;
  if (gp && gp.connected) {
    handleStopCombo(gp);
    handleGamepadInput(gp);
  }

  requestAnimationFrame(gamepadLoop);
}

function checkExistingGamepads() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of pads) {
    if (gp && gp.connected) {
      gamepadIndex = gp.index;
      document.getElementById('gamepadIndicator')?.classList.add('connected');

      if (!gamepadLoopActive) {
        gamepadLoopActive = true;
        requestAnimationFrame(gamepadLoop);
      }
      break;
    }
  }
}

window.addEventListener('gamepadconnected', (e) => {
  gamepadIndex = e.gamepad.index;
  document.getElementById('gamepadIndicator')?.classList.add('connected');
  showToast('Pad podłączony: ' + e.gamepad.id);

  if (!gamepadLoopActive) {
    gamepadLoopActive = true;
    requestAnimationFrame(gamepadLoop);
  }
});

window.addEventListener('gamepaddisconnected', (e) => {
  if (gamepadIndex === e.gamepad.index) {
    gamepadIndex = null;
    stopComboLatched = false;
    document.getElementById('gamepadIndicator')?.classList.remove('connected');
    showToast('Pad odłączony', true);
  }
});

checkExistingGamepads();

// ---------- System audio: tylko efekty UI ----------
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const actx = new AudioCtx();

const masterGain = actx.createGain();
masterGain.gain.value = 0.35;
masterGain.connect(actx.destination);

const sfxGain = actx.createGain();
sfxGain.gain.value = 0.6;
sfxGain.connect(masterGain);

let isMuted = false;

function resumeAudio() {
  if (actx.state === 'suspended') actx.resume();
}
window.addEventListener('click', resumeAudio, { once: true });
window.addEventListener('keydown', resumeAudio, { once: true });

function playTone(freq, duration, type, gainVal, delay) {
  if (isMuted) return;

  const t0 = actx.currentTime + (delay || 0);
  const osc = actx.createOscillator();
  const gain = actx.createGain();

  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainVal || 0.25, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function sfxHover() {
  playTone(880, 0.08, 'sine', 0.12);
}

function sfxMove() {
  playTone(660, 0.12, 'triangle', 0.18);
  playTone(990, 0.1, 'sine', 0.08, 0.02);
}

function sfxSelect() {
  playTone(523.25, 0.15, 'sine', 0.22);
  playTone(783.99, 0.18, 'sine', 0.16, 0.05);
}

function sfxBack() {
  playTone(392, 0.14, 'triangle', 0.16);
}

function sfxLaunch() {
  playTone(440, 0.1, 'sine', 0.2);
  playTone(554.37, 0.1, 'sine', 0.18, 0.08);
  playTone(659.25, 0.16, 'sine', 0.2, 0.16);
}

function sfxTab() {
  playTone(740, 0.1, 'square', 0.06);
}

function sfxPlatform() {
  playTone(330, 0.10, 'square', 0.14);
  playTone(523.25, 0.12, 'sine', 0.10, 0.03);
}

function applyFilter(platform, tabEl) {
  if (platform === activePlatform) return;

  activePlatform = platform;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  if (tabEl) {
    tabEl.classList.add('active');
    moveHighlight(tabEl);
  } else {
    document.getElementById('tabHighlight').style.width = '0px';
  }

  renderPlatformDropdown();
  shelf.classList.add('switching');
  shelfInfo.classList.add('switching');
  sfxPlatform();

  setTimeout(() => {
    filtered = platform === 'all' ? games : games.filter(g => g.platform === platform);
    current = 0;
    renderShelf();
    shelf.classList.remove('switching');
    shelfInfo.classList.remove('switching');
  }, 260);
}





init();