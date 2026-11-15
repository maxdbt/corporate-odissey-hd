// One application-wide policy, shared by the camera, HUD and controls.
// A touchscreen-capable laptop is still a keyboard device until touch is actually used.
const coarse = window.matchMedia('(pointer: coarse) and (hover: none)');
const requested = new URLSearchParams(window.location.search).get('controls');
const forced = requested === 'touch' || requested === 'keyboard' ? requested : null;
let mode = forced || (coarse.matches ? 'touch' : 'keyboard');
const listeners = new Set();
let lastFullscreenExit = -Infinity;

function setMode(next) {
  if (forced) return;
  if (mode === next) return;
  mode = next;
  listeners.forEach((fn) => fn(next));
}
window.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch' || event.pointerType === 'pen') setMode('touch');
  else if (event.pointerType === 'mouse') setMode('keyboard');
}, { capture: true, passive: true });
window.addEventListener('keydown', (event) => {
  if (!event.ctrlKey && !event.metaKey && /^(Arrow|[wasdzxcqvepi mf]| |Enter|Escape)/i.test(event.key)) setMode('keyboard');
}, { capture: true });
coarse.addEventListener('change', () => setMode(coarse.matches ? 'touch' : 'keyboard'));
['fullscreenchange', 'webkitfullscreenchange'].forEach((name) => document.addEventListener(name, () => {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) lastFullscreenExit = performance.now();
}));

export const inputMode = {
  get current() { return mode; },
  get touch() { return mode === 'touch'; },
  get recentlyExitedFullscreen() { return performance.now() - lastFullscreenExit < 400; },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
};
