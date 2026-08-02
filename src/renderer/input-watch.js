let latched = false;
let rafId = null;
let running = false;
let connectedIndex = null;

function getFirstGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  if (connectedIndex !== null && pads[connectedIndex] && pads[connectedIndex].connected) {
    return pads[connectedIndex];
  }

  for (const gp of pads) {
    if (gp && gp.connected) {
      connectedIndex = gp.index;
      return gp;
    }
  }

  connectedIndex = null;
  return null;
}

function isStopComboPressed(gp) {
  if (!gp) return false;

  const l3 = !!gp.buttons?.[10]?.pressed;
  const r3 = !!gp.buttons?.[11]?.pressed;
  const lb = !!gp.buttons?.[4]?.pressed;
  const rb = !!gp.buttons?.[5]?.pressed;

  return l3 && r3 && lb && rb;
}

async function poll() {
  const gp = getFirstGamepad();
  const pressed = isStopComboPressed(gp);

if (pressed && !latched) {
  latched = true;
  window.watchAPI?.stopLastGame?.().catch(() => {});
}

  if (!pressed) latched = false;

  rafId = requestAnimationFrame(poll);
}

function startLoop() {
  if (running) return;
  running = true;
  rafId = requestAnimationFrame(poll);
}

window.addEventListener('gamepadconnected', (e) => {
  connectedIndex = e.gamepad.index;
  startLoop();
});

window.addEventListener('gamepaddisconnected', (e) => {
  if (connectedIndex === e.gamepad.index) {
    connectedIndex = null;
    latched = false;
  }
});

startLoop();