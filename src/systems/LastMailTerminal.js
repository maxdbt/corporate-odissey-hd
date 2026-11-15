import { DEPTH, TEX } from '../config/constants.js';
import { audio } from './Audio8bit.js';

// Optional desk computer, once per level attempt. Existing quiz terminals keep their behavior.
export default class LastMailTerminal {
  constructor(scene, x, y) {
    this.scene = scene; this.x = x; this.y = y;
    this.used = false; this.prevUp = true;
    this.computer = scene.add.image(x, y, TEX.TERMINAL).setOrigin(0.5, 1)
      .setDepth(DEPTH.ITEMS).setTint(0x8cffcf).setInteractive({ useHandCursor: true });
    const style = { fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#9dffce',
      stroke: '#000000', strokeThickness: 3, align: 'center' };
    this.sign = scene.add.text(x, y - 48, "BONUS POV\nL'ULTIMA MAIL", style).setOrigin(0.5, 1).setDepth(DEPTH.FX);
    this.prompt = scene.add.text(x, y - 78, 'SU / TOCCA IL PC', { ...style, color: '#fff4bf' })
      .setOrigin(0.5).setDepth(DEPTH.FX).setVisible(false);
    this.computer.on('pointerdown', () => this.open());
  }

  near() {
    const p = this.scene.player;
    return p?.body && Math.abs(p.x - this.x) < 100 && Math.abs(p.body.bottom - this.y) < 75;
  }

  open() {
    const s = this.scene;
    if (this.used || !this.near() || !s.scene.isActive() || s.ended ||
        performance.now() - (s.resumedAt || 0) < 250) return;
    this.used = true;
    this.prompt.setVisible(false);
    this.sign.setText('FUORI UFFICIO').setColor('#a5a5a5');
    this.computer.clearTint().setAlpha(0.6).disableInteractive();
    s.player.body.setVelocity(0, 0);
    audio.unlock(); audio.sfx('quiz');
    s.openOverlay('LastMailScene');
  }

  update(input) {
    const near = this.near();
    this.prompt.setVisible(!!near && !this.used);
    if (near && input.up && !this.prevUp) this.open();
    this.prevUp = input.up;
  }
}
