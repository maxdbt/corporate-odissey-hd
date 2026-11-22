import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { GameState } from '../state/GameState.js';
import { inputMode } from '../systems/InputMode.js';
import { toggleFullscreen } from '../systems/Screen.js';
import { BEACH_RULES } from '../systems/BeachRules.js';
import { useHdFiltering } from './AssetRegistry.js';
import ViewportController from './ViewportController.js';
import ActorSkin from './ActorSkin.js';
import { ensurePortraits } from './CharacterPortraits.js';

const font = 'Segoe UI, Arial, sans-serif';

export default class BeachPresentation {
  constructor(scene) {
    this.scene = scene;
    const parent = scene.scene.get('GameScene');
    this.parent = parent?.presentation ? parent : null;
    this.ownsViewport = !this.parent;
    this.viewport = this.parent?.presentation.viewport || new ViewportController(scene, { zoom: 1 });
    this.metrics = this.viewport.metrics;
    this.mailSkins = new Map();
    useHdFiltering(scene);
    ensurePortraits(scene);
    this.background = scene.add.image(0, 0, 'hd-beach').setOrigin(0).setDepth(-10);
    this.sparkles = scene.add.graphics().setDepth(-9);
    this.shadow = scene.add.ellipse(0, 0, 39, 5, 0x704827, 0.24).setDepth(3);
    this.panel = scene.add.graphics().setDepth(20);
    this.hearts = scene.add.graphics().setDepth(21);
    this.portrait = scene.add.image(27, 23, 'hd-characters', (GameState.character || 'man') + '_portrait')
      .setDisplaySize(37, 39).setDepth(21);
    this.title = this.text('FERIE, MA NON TROPPO', 15).setOrigin(0.5, 0);
    this.timer = this.text('0 / 25 s', 20).setOrigin(0.5, 0);
    this.reward = this.text('SALUTE +0%', 17, '#a9ffa5').setOrigin(1, 0.5);
    this.pauseButton = scene.add.rectangle(0, 23, 31, 31, 0x172338, 0.9).setDepth(22)
      .setStrokeStyle(1.4, 0xe6ecf7).setInteractive({ useHandCursor: true })
      .on('pointerdown', (_p, _x, _y, event) => { event.stopPropagation(); scene.togglePause(); });
    this.pauseText = this.text('Ⅱ', 19).setOrigin(0.5).setDepth(23);
    this.fullscreenButton = scene.add.rectangle(0, 23, 25, 31, 0x172338, 0.9).setDepth(22)
      .setStrokeStyle(1, 0xa9bbcf).setInteractive({ useHandCursor: true })
      .on('pointerdown', (_p, _x, _y, event) => { event.stopPropagation(); toggleFullscreen(); });
    this.fullscreenText = this.text('⛶', 18).setOrigin(0.5).setDepth(23);
    this.controls = scene.add.graphics().setDepth(25);
    this.hint = this.text('← → / A D  MUOVI     P  PAUSA     F  SCHERMO INTERO', 8, '#fff8e9')
      .setOrigin(0.5).setDepth(25).setShadow(0, 1, '#573b23', 3);
    this.card = scene.add.graphics().setDepth(40);
    this.cardTitle = this.text('', 22).setOrigin(0.5).setDepth(41);
    this.cardBody = this.text('', 13, '#e3edf3').setOrigin(0.5).setAlign('center').setLineSpacing(7).setDepth(41);
    this.cardHint = this.text('', 10, '#a9eddb').setOrigin(0.5).setDepth(41);
    this.onResize = () => this.layout();
    (this.parent || scene).events.on('presentation-resize', this.onResize);
    this.offMode = inputMode.subscribe(() => this.layout());
    this.onPostUpdate = (_time, delta) => this.update(delta);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.onPostUpdate);
    this.layout();
  }

  text(value, size, color = '#f5f5f3') {
    return this.scene.add.text(0, 0, value, { fontFamily: font, fontSize: size + 'px', fontStyle: 'bold', color })
      .setDepth(21).setResolution(this.metrics.scale);
  }

  // Rendering alone maps the original 800x450 simulation into the composition.
  mapX(x) { return 24 + x / GAME_WIDTH * (this.metrics.width - 48); }
  mapY(y) { return 18 + y / BEACH_RULES.feetY * 321; }

  layout() {
    const { width: w, height: h, scale, safe = {} } = this.metrics;
    this.scene.cameras.main.setOrigin(0, 0).setZoom(scale).setScroll(0, 0).setRotation(0)
      .setSize(Math.round(w * scale), Math.round(h * scale)).setRoundPixels(false);
    this.background.setDisplaySize(w, h);
    const l = safe.left || 0, r = safe.right || 0, t = safe.top || 0;
    this.panel.clear().fillStyle(0x080e1b, 0.99).fillRect(0, 0, w, 45 + t)
      .lineStyle(0.8, 0xd3c6bc).lineBetween(0, 45 + t, w, 45 + t)
      .fillStyle(0x2c4058).fillRoundedRect(l + 7, t + 3, 40, 39, 5)
      .lineStyle(1, 0xe3e5e4).strokeRoundedRect(l + 7, t + 3, 40, 39, 5);
    this.portrait.setPosition(l + 27, t + 23);
    this.title.setPosition(w * 0.50, t + 2).setFontSize(w < 760 ? 12 : 15);
    this.timer.setPosition(w * 0.50, t + 20);
    this.reward.setPosition(w - r - 90, t + 23).setFontSize(w < 760 ? 13 : 17);
    this.pauseButton.setPosition(w - r - 25, t + 23); this.pauseText.setPosition(w - r - 25, t + 23);
    this.fullscreenButton.setPosition(w - r - 62, t + 23); this.fullscreenText.setPosition(w - r - 62, t + 23);
    this.hint.setPosition(w / 2, h - 13 - (safe.bottom || 0)).setVisible(!inputMode.touch);
    this.buttons = [{ x: l + 61, y: h - 48 - (safe.bottom || 0), dir: -1 },
      { x: w - r - 61, y: h - 48 - (safe.bottom || 0), dir: 1 }];
    for (const o of this.scene.children.list) if (o.type === 'Text') o.setResolution(scale);
    this.drawControls(); this.refreshHud();
  }

  attachPlayer(player) {
    this.playerSkin = new ActorSkin(this.scene, player, (skin, delta) => {
      const c = GameState.character || 'man';
      const moving = this.scene.moveDir && this.scene.phase === 'play' && !this.scene.roundPaused;
      if (moving) skin.phase += Math.min(delta, 80) * 12 / 1000;
      return { texture: c === 'woman' ? 'hd-wendy-motion' : 'hd-jack-motion',
        frame: c + (moving ? '_run' + (Math.floor(skin.phase) % 8 + 1) : '_idle1'), height: 104,
        offsetX: this.mapX(player.x) - player.x, offsetY: this.mapY(player.y) - player.y };
    });
    this.laptop = this.scene.add.image(0, 0, 'hd-props', 'laptop').setDisplaySize(28, 22).setDepth(5.1);
  }

  attachMail(mail, urgent) {
    mail.urgent = urgent;
    const skin = new ActorSkin(this.scene, mail, () => ({ texture: 'hd-summer-props',
      frame: urgent ? 'urgentMail' : 'mail', height: urgent ? 34 : 29,
      offsetX: this.mapX(mail.x) - mail.x, offsetY: this.mapY(mail.y) - mail.y,
      rotation: Math.sin(mail.wobble || 0) * 0.13 }));
    this.mailSkins.set(mail, skin);
  }

  direction() {
    if (!inputMode.touch || this.scene.roundPaused) return 0;
    let direction = 0;
    for (const p of this.scene.input.manager.pointers) {
      if (!p.isDown) continue;
      const x = p.x / this.metrics.scale, y = p.y / this.metrics.scale;
      for (const b of this.buttons) if (Math.hypot(x - b.x, y - b.y) <= 47) direction += b.dir;
    }
    return Math.sign(direction);
  }

  drawControls() {
    const g = this.controls.clear();
    if (!inputMode.touch) return;
    const active = this.direction();
    for (const b of this.buttons) {
      g.fillStyle(active === b.dir ? 0xc6ac77 : 0x344450, active === b.dir ? 0.7 : 0.42).fillCircle(b.x, b.y, 37)
        .lineStyle(1.5, 0xfff8e9, 0.85).strokeCircle(b.x, b.y, 37)
        .lineStyle(5, 0xffffff, 0.95).lineBetween(b.x - 13, b.y, b.x + 13, b.y)
        .lineBetween(b.x + b.dir * 13, b.y, b.x - b.dir * 2, b.y - 13)
        .lineBetween(b.x + b.dir * 13, b.y, b.x - b.dir * 2, b.y + 13);
    }
  }

  refreshHud() {
    const s = this.scene, g = this.hearts.clear();
    const { safe = {} } = this.metrics;
    for (let i = 0; i < BEACH_RULES.lives; i++) {
      const x = (safe.left || 0) + 75 + i * 30, y = (safe.top || 0) + 23;
      const alive = i < s.lives;
      g.fillStyle(alive ? 0xf44336 : 0x3b4656).fillCircle(x - 5, y - 4, 7).fillCircle(x + 5, y - 4, 7)
        .fillTriangle(x - 12, y - 2, x + 12, y - 2, x, y + 13);
      if (alive) g.lineStyle(1.5, 0xffb894).lineBetween(x - 9, y - 7, x - 5, y - 9);
    }
    this.timer.setText(Math.min(25, Math.floor(s.elapsed)) + ' / 25 s');
    this.reward.setText('SALUTE +' + s.reward() + '%');
    this.pauseText.setText(s.roundPaused ? '▶' : 'Ⅱ');
  }

  update(delta) {
    const s = this.scene;
    this.playerSkin?.sync(s.roundPaused ? 0 : delta);
    const p = s.player;
    if (p) {
      const x = this.mapX(p.x), y = this.mapY(p.y);
      this.shadow.setPosition(x, y + 1);
      this.laptop?.setPosition(x + (p.flipX ? 9 : -9), y - 42).setFlipX(p.flipX).setAlpha(p.alpha);
    }
    const g = this.sparkles.clear();
    const t = s.roundPaused ? this.lastTime || 0 : (this.lastTime = s.time.now);
    for (let i = 0; i < 34; i++) {
      const alpha = Math.max(0, Math.sin(t / 700 + i * 2.3)) * 0.6;
      g.lineStyle(0.6, 0xe5fdff, alpha).lineBetween((i * 97) % this.metrics.width, 192 + (i * 17) % 65,
        (i * 97) % this.metrics.width + 3, 192 + (i * 17) % 65);
    }
    for (const [mail, skin] of this.mailSkins) {
      if (!mail.scene) { skin.destroy(); this.mailSkins.delete(mail); continue; }
      skin.sync(delta);
      const x = this.mapX(mail.x), y = this.mapY(mail.y);
      g.lineStyle(mail.urgent ? 2 : 1, mail.urgent ? 0xff8277 : 0xfff5d2, 0.45)
        .lineBetween(x - 4, y - 21, x - 7, y - 47).lineBetween(x + 5, y - 22, x + 2, y - 57);
    }
    this.drawControls();
    const card = s.roundPaused ? 'pause' : s.phase;
    const show = card !== 'play';
    for (const obj of [this.card, this.cardTitle, this.cardBody, this.cardHint]) obj.setVisible(show);
    if (show) {
      const cx = this.metrics.width / 2, cy = 190;
      this.card.clear().fillStyle(0x0b1929, 0.94).fillRoundedRect(cx - 236, cy - 73, 472, 146, 12)
        .lineStyle(1, 0xe6c68f, 0.8).strokeRoundedRect(cx - 236, cy - 73, 472, 146, 12);
      this.cardTitle.setPosition(cx, cy - 43); this.cardBody.setPosition(cx, cy + 3); this.cardHint.setPosition(cx, cy + 51);
      if (card === 'pause') {
        this.cardTitle.setText('PAUSA'); this.cardBody.setText('Anche le mail possono aspettare.');
        this.cardHint.setText('P / ESC oppure ▶ per riprendere');
      } else if (card === 'intro') {
        this.cardTitle.setText('FERIE, MA NON TROPPO');
        this.cardBody.setText('Schiva le mail di lavoro per 25 secondi.\nTre vite. Ogni secondo recuperi salute mentale.');
        this.cardHint.setText(inputMode.touch ? 'TIENI PREMUTE LE FRECCE PER MUOVERTI' : 'FRECCE / A D PER MUOVERTI');
      } else {
        this.cardTitle.setText(s.survived ? 'VACANZA PERFETTA!' : 'TI RIVOGLIONO IN UFFICIO');
        this.cardBody.setText(`Hai resistito ${Math.min(25, Math.floor(s.elapsed))} secondi\nSALUTE +${s.result.hp}%    STRESS −${s.result.stressDown}%`);
        this.cardHint.setText(s.preview ? 'INVIO / TOCCA PER TORNARE AL MENU · ANTEPRIMA' : 'INVIO / TOCCA PER TORNARE IN UFFICIO');
      }
    }
    if (import.meta.env.DEV) s.game.canvas.dataset.beachDiagnostics = JSON.stringify({
      phase: s.phase, paused: s.roundPaused, preview: s.preview, elapsed: s.elapsed, lives: s.lives,
      playerX: p?.x, mails: s.mails.length, reward: s.reward(), touch: inputMode.touch,
      character: GameState.character, width: this.metrics.width
    });
  }

  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.onPostUpdate);
    (this.parent || this.scene).events.off('presentation-resize', this.onResize);
    this.offMode();
    this.playerSkin?.destroy();
    for (const skin of this.mailSkins.values()) skin.destroy();
    this.mailSkins.clear();
    delete this.scene.game.canvas.dataset.beachDiagnostics;
    if (this.ownsViewport) this.viewport.destroy();
  }
}
