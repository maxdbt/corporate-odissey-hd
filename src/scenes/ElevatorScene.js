import Phaser from 'phaser';
import { FONT, GAME_WIDTH, GAME_HEIGHT, playerTex } from '../config/constants.js';
import { GameState } from '../state/GameState.js';
import { LEVELS } from '../levels/index.js';
import { audio } from '../systems/Audio8bit.js';
import { setupStaticCamera } from '../utils/view.js';
import { goNext, nextIndex } from '../systems/Trip.js';
import { installStagePresentation } from '../presentation/StaticStagePresentation.js';

const style = (size, color = '#ffffff', extra = {}) => ({
  fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color, stroke: '#000000', strokeThickness: 4, ...extra
});

// Floor number of each Mondo 5 level (the display counts up between them).
const FLOORS = { '5-1': 40, '5-2': 45, '5-3': 49, '5-4': 50, '5-5': 51 };
// What you glimpse on the way up (one random line per ride).
const GAGS = [
  'Piano 46: Ufficio Bonus (accesso negato)',
  'Piano 47: Sala Relax (mai usata)',
  'Piano 48: Archivio Promesse Non Mantenute',
  'Piano 43: Ufficio Sinergie',
  'Piano 44: Palestra Executive'
];

// Mondo 5: elevator ride between two floors. Doors close, muzak, the floor counter climbs, DING, doors open.
export default class ElevatorScene extends Phaser.Scene {
  constructor() {
    super('ElevatorScene');
    installStagePresentation(this, { world: 'director', packs: ['elevator'], background: 'hd-elevator', backgroundFit: 'stretch',
      heroHeight: 176, bonus: false, pause: false, chrome: false, onResize: scene => scene.renderDoors() });
  }

  init(data) {
    this.levelIndex = data?.levelIndex ?? 0;
    this.done = false;
    this.leaving = false;
    this.floorTween = null;
    this.preview = !!data?.preview;
  }

  create() {
    if (this.hdStage) this.createHd(); else this.createClassic();
  }

  createHd() {
    setupStaticCamera(this);
    const cx = GAME_WIDTH / 2;
    const from = FLOORS[LEVELS[this.levelIndex]?.id] ?? 40;
    const next = LEVELS[nextIndex(this.levelIndex)];
    const to = FLOORS[next?.id] ?? from + 1;
    this.toFloor = to;
    const font = (size, color = '#f6e7ca') => ({ fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: size + 'px', color });
    this.arrow = this.add.text(cx - 30, 58, '↑', font(24, '#f4c77c')).setOrigin(.5);
    this.counter = this.add.text(cx + 12, 58, String(from), { ...font(27), fontStyle: 'bold' }).setOrigin(.5);
    this.tweens.add({ targets: this.arrow, alpha: .35, duration: 700, yoyo: true, repeat: -1 });

    const panel = this.add.graphics().fillStyle(0x091a25, .88).fillRoundedRect(32, 127, 234, 177, 14);
    panel.lineStyle(1, 0xdbb77b, .7).strokeRoundedRect(32, 127, 234, 177, 14);
    this.add.text(49, 145, 'IL PIANO DEGLI EXECUTIVE', { ...font(10, '#d7b47c'), fontStyle: 'bold' });
    this.add.text(49, 174, 'Si sale di livello.', { ...font(23), fontStyle: 'bold' });
    this.add.text(49, 214, 'PROSSIMA FERMATA', font(9, '#adc4cc'));
    this.add.text(49, 235, next?.name || 'Il piano successivo', {
      ...font(17), fontStyle: 'bold', wordWrap: { width: 198 }, lineSpacing: 3
    });
    this.add.ellipse(cx + 65, 377, 115, 16, 0x05090d, .32);
    this.player = this.add.image(cx + 65, 378, playerTex(GameState.character, 'idle')).setOrigin(.5, 1).setDepth(5);
    this.tweens.add({ targets: this.player, y: 376, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.add.rectangle(cx, 422, 2000, 56, 0x09141f, .9);
    this.gag = this.add.text(28, 413, Phaser.Utils.Array.GetRandom(GAGS), {
      ...font(11, '#decaa9'), wordWrap: { width: GAME_WIDTH - 275 }
    });
    this.skipLabel = this.add.text(GAME_WIDTH - 24, 422, 'SALTA  →', {
      ...font(13), fontStyle: 'bold', backgroundColor: '#29404d', padding: { x: 18, y: 10 }
    }).setOrigin(1, .5).setInteractive({ useHandCursor: true });

    // Smooth metallic door surfaces are rendered at high resolution, independently of the cabin art.
    const key = 'hd-elevator-metal';
    if (!this.textures.exists(key)) {
      const texture = this.textures.createCanvas(key, 512, 1024);
      const ctx = texture.context, gradient = ctx.createLinearGradient(0, 0, 512, 0);
      for (const [at, color] of [[0,'#353b40'],[.14,'#90938f'],[.36,'#d9d8c9'],[.52,'#9c9c94'],[.82,'#50585b'],[1,'#242e35']]) gradient.addColorStop(at, color);
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 1024);
      for (let y = 0; y < 1024; y += 3) { ctx.fillStyle = y % 2 ? '#ffffff08' : '#00000009'; ctx.fillRect(0, y, 512, 1); }
      ctx.strokeStyle = '#c9a96d'; ctx.lineWidth = 5; ctx.strokeRect(10, 14, 492, 996);
      ctx.strokeStyle = '#ffffff30'; ctx.lineWidth = 2; ctx.strokeRect(25, 30, 462, 964);
      texture.refresh(); texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    this.doorL = this.add.image(0, 0, key).setOrigin(0).setDepth(80);
    this.doorR = this.add.image(0, 0, key).setOrigin(1, 0).setFlipX(true).setDepth(80);
    this.doorSlide = { open: 1 };
    this.renderDoors();
    this.animateDoors(0, 500, 350, () => this.ride(from, to));
    this.bindSkip();
    this.cameras.main.fadeIn(250);
  }

  renderDoors() {
    if (!this.doorSlide || !this.doorL?.scene || !this.hdStage) return;
    const span = Math.max(GAME_WIDTH, this.hdStage.viewport.metrics.width), cx = GAME_WIDTH / 2;
    this.doorL.setDisplaySize(span / 2, GAME_HEIGHT).setX(cx - span / 2 - span / 2 * this.doorSlide.open);
    this.doorR.setDisplaySize(span / 2, GAME_HEIGHT).setX(cx + span / 2 + span / 2 * this.doorSlide.open);
  }

  animateDoors(open, duration, delay = 0, onComplete) {
    this.tweens.killTweensOf(this.doorSlide);
    this.tweens.add({ targets: this.doorSlide, open, duration, delay, ease: 'Quad.InOut',
      onUpdate: () => this.renderDoors(), onComplete });
  }

  bindSkip() {
    const skip = event => { if (event?.repeat) return; if (this.done && this.preview) this.depart(); else this.arrive(); };
    this.input.on('pointerdown', skip);
    this.input.keyboard?.on('keydown-ENTER', skip);
    this.input.keyboard?.on('keydown-SPACE', skip);
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', skip);
      this.input.keyboard?.off('keydown-ENTER', skip);
      this.input.keyboard?.off('keydown-SPACE', skip);
    });
  }

  createClassic() {
    setupStaticCamera(this);
    const from = FLOORS[LEVELS[this.levelIndex]?.id] ?? 40;
    const next = LEVELS[nextIndex(this.levelIndex)];
    const to = FLOORS[next?.id] ?? from + 1;
    this.toFloor = to;
    const cx = GAME_WIDTH / 2;

    // Cabin: gold walls, mirror panels, carpet.
    const g = this.add.graphics();
    g.fillStyle(0x9c7a12).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0xc9a227).fillRect(60, 30, GAME_WIDTH - 120, 360);
    for (let x = 90; x < GAME_WIDTH - 90; x += 160) {
      g.fillStyle(0x6b4a12).fillRect(x, 120, 140, 230);
      g.fillStyle(0xb8c8d8).fillRect(x + 6, 126, 128, 218);
      g.fillStyle(0xffffff, 0.35).fillRect(x + 16, 136, 30, 80);
    }
    g.fillStyle(0x8a0a14).fillRect(0, 380, GAME_WIDTH, GAME_HEIGHT - 380);
    g.fillStyle(0xe8c547).fillRect(60, 376, GAME_WIDTH - 120, 6);
    // Floor display.
    g.fillStyle(0x111111).fillRect(cx - 70, 44, 140, 56);
    g.lineStyle(3, 0xe8c547).strokeRect(cx - 70, 44, 140, 56);
    this.arrow = this.add.text(cx - 46, 72, '▲', style(20, '#ff8020', { strokeThickness: 0 })).setOrigin(0.5);
    this.counter = this.add.text(cx + 14, 72, String(from), style(30, '#ff8020', { strokeThickness: 0 })).setOrigin(0.5);
    this.tweens.add({ targets: this.arrow, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });

    const spr = this.add.image(cx, 380, playerTex(GameState.character, 'idle')).setOrigin(0.5, 1).setScale(3);
    this.tweens.add({ targets: spr, y: 377, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    this.add.text(cx, 118, `PROSSIMO PIANO: ${(next?.name || '').toUpperCase()}`, style(14, '#ffffff')).setOrigin(0.5);
    const gag = this.add.text(cx, 412, Phaser.Utils.Array.GetRandom(GAGS), style(11, '#ffe680')).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: gag, alpha: 1, delay: 900, duration: 400 });
    this.add.text(cx, 436, 'INVIO o TOCCA per saltare', style(9, '#cccccc', { strokeThickness: 3 })).setOrigin(0.5);

    // Doors: they open at the start and close, then reopen on arrival.
    this.doorL = this.add.rectangle(0, 0, cx, GAME_HEIGHT, 0xb8bcc8).setOrigin(0).setStrokeStyle(3, 0x5a5a66);
    this.doorR = this.add.rectangle(GAME_WIDTH, 0, cx, GAME_HEIGHT, 0xb8bcc8).setOrigin(1, 0).setStrokeStyle(3, 0x5a5a66);
    this.doorL.x = -cx;
    this.doorR.x = GAME_WIDTH + cx;
    this.tweens.add({ targets: this.doorL, x: 0, duration: 500, delay: 200, ease: 'Quad.InOut' });
    this.tweens.add({ targets: this.doorR, x: GAME_WIDTH, duration: 500, delay: 200, ease: 'Quad.InOut',
      onComplete: () => this.ride(from, to) });

    this.bindSkip();
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  // Doors closed: reopen on the cabin interior and climb.
  ride(from, to) {
    if (this.done) return;
    audio.music('elevator');
    const cx = GAME_WIDTH / 2;
    if (this.hdStage) this.animateDoors(1, 500);
    else {
      this.tweens.add({ targets: this.doorL, x: -cx, duration: 500, ease: 'Quad.InOut' });
      this.tweens.add({ targets: this.doorR, x: GAME_WIDTH + cx, duration: 500, ease: 'Quad.InOut' });
    }
    this.cameras.main.shake(3200, 0.0015);
    const steps = Math.max(1, to - from);
    this.floorTween = this.tweens.addCounter({
      from, to, duration: 3000, delay: 300,
      onUpdate: (tw) => this.counter.setText(String(Math.floor(tw.getValue()))),
      onComplete: () => this.time.delayedCall(Math.min(400, 100 * steps), () => this.arrive())
    });
  }

  arrive() {
    if (this.done) return;
    this.done = true;
    this.floorTween?.stop();
    this.counter.setText(String(this.toFloor));
    this.tweens.killTweensOf(this.arrow);
    this.arrow.setAlpha(1);
    if (this.hdStage) {
      this.animateDoors(1, 350);
    }
    this.skipLabel?.setText(this.preview ? 'CONTINUA  →' : 'PIANO RAGGIUNTO');
    audio.stopMusic();
    audio.note('E6', 0.25, 'triangle', 0.6);
    this.time.delayedCall(260, () => audio.note('C6', 0.5, 'triangle', 0.6));
    this.arrow.setText('●');
    if (!this.preview) this.time.delayedCall(700, () => this.depart());
  }

  depart() {
    if (this.leaving) return;
    this.leaving = true;
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => goNext(this, this.levelIndex));
  }
}
