import { GAME_WIDTH, GAME_HEIGHT, RENDER_SCALE } from '../config/constants.js';
import { inputMode } from '../systems/InputMode.js';
import { setupStaticCamera } from '../utils/view.js';

// Changes presentation resolution only; physics stays in the original logical world.
export default class ViewportController {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = options;
    this.baseSize = { width: GAME_WIDTH * RENDER_SCALE, height: GAME_HEIGHT * RENDER_SCALE };
    this.metrics = { width: GAME_WIDTH, height: GAME_HEIGHT, scale: RENDER_SCALE, touch: inputMode.touch };
    this.safeAreaProbe = document.createElement('div');
    this.safeAreaProbe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(this.safeAreaProbe);
    this.onResize = () => {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => this.apply());
    };
    this.offMode = inputMode.subscribe(() => {
      scene.input.keyboard?.resetKeys();
      scene.inputCtl?.reset?.();
      this.apply();
    });
    window.addEventListener('resize', this.onResize);
    window.visualViewport?.addEventListener('resize', this.onResize);
    document.addEventListener('fullscreenchange', this.onResize);
    this.apply();
  }

  apply() {
    const scene = this.scene;
    if (!scene?.sys || !scene.game?.canvas) return;
    const box = scene.game.canvas.parentElement.getBoundingClientRect();
    const ratio = box.width / Math.max(1, box.height);
    const density = Math.min(inputMode.touch ? 2.5 : 3,
      Math.max(2, Math.round(box.height * (window.devicePixelRatio || 1) / GAME_HEIGHT * 4) / 4));
    // Landscape fills ordinary phone / desktop viewports. Extremely wide screens keep a bounded FOV.
    const width = Math.round(Math.max(640, Math.min(1600, GAME_HEIGHT * ratio)));
    const css = getComputedStyle(this.safeAreaProbe);
    const logicalPerCss = GAME_HEIGHT / Math.max(1, box.height);
    const safe = Object.fromEntries(['Top', 'Right', 'Bottom', 'Left'].map((side) => [side.toLowerCase(),
      (parseFloat(css['padding' + side]) || 0) * logicalPerCss]));
    Object.assign(this.metrics, { width, height: GAME_HEIGHT, scale: density, touch: inputMode.touch, safe,
      fullscreen: !!(document.fullscreenElement || document.webkitFullscreenElement) });
    const rasterWidth = Math.round(width * density), rasterHeight = Math.round(GAME_HEIGHT * density);
    if (scene.scale.gameSize.width !== rasterWidth || scene.scale.gameSize.height !== rasterHeight) {
      scene.scale.setGameSize(rasterWidth, rasterHeight);
    }
    scene.game.canvas.classList.add('hd-rendering');
    const cam = scene.cameras.main;
    cam.setSize(rasterWidth, rasterHeight);
    // The approved composition gives actors and furniture the same scale as the room.
    // A wide, distant camera made even the HD sprites read as miniatures.
    const normalZoom = this.options.zoom || 1.95;
    this.zoom = Math.max(normalZoom, width / 1120);
    scene.camZoom = density * this.zoom;
    if (!scene.bossActive && !scene.player?.isDizzy?.()) cam.setZoom(scene.camZoom);
    if (scene.level?.width) cam.setBounds(0, 0, scene.level.width, GAME_HEIGHT);
    for (const active of scene.scene.manager.getScenes(true)) {
      if (active !== scene && active.sys.settings.key !== 'UIScene') setupStaticCamera(active);
    }
    scene.events.emit('presentation-resize', this.metrics);
  }

  setupUiCamera(ui) {
    ui.cameras.main.setOrigin(0, 0).setZoom(this.metrics.scale).setScroll(0, 0).setRotation(0)
      .setSize(Math.round(this.metrics.width * this.metrics.scale), Math.round(GAME_HEIGHT * this.metrics.scale));
  }

  destroy() {
    cancelAnimationFrame(this.resizeFrame);
    window.removeEventListener('resize', this.onResize);
    window.visualViewport?.removeEventListener('resize', this.onResize);
    document.removeEventListener('fullscreenchange', this.onResize);
    this.offMode();
    this.safeAreaProbe.remove();
    delete this.scene.game.canvas.dataset.hdDiagnostics;
    this.scene.game.canvas.classList.remove('hd-rendering');
    this.scene.scale.setGameSize(this.baseSize.width, this.baseSize.height);
    this.scene = null;
  }
}
