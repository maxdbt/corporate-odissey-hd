// Presentation-only virtual controls. The returned state follows InputController's existing contract.
export default class TouchControls {
  constructor(scene, metrics) {
    this.scene = scene;
    this.metrics = metrics;
    this.graphics = scene.add.graphics().setDepth(30);
    this.labels = ['SALTA', 'ATTACCA', 'SCIVOLA'].map((text) => scene.add.text(0, 0, text, {
      fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '9px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5).setDepth(31));
    this.prev = {};
    this.visible = true;
    this.relayout();
  }

  relayout() {
    const { width, height } = this.metrics;
    const right = this.metrics.safe?.right || 0;
    const bottom = this.metrics.safe?.bottom || 0;
    this.buttons = [
      { action: 'jump', x: width - 55, y: height - 55, r: 40, color: 0x387a55 },
      { action: 'attack', x: width - 215, y: height - 52, r: 35, color: 0x8a4247 },
      { action: 'slide', x: width - 138, y: height - 52, r: 35, color: 0x45505e }
    ];
    this.buttons.forEach((b) => { b.x -= right; b.y -= bottom; });
    this.buttons.forEach((b, i) => this.labels[i].setPosition(b.x, b.y + 13).setResolution(this.metrics.scale));
    this.reset();
  }

  setVisible(visible) {
    if (this.visible !== visible) this.reset();
    this.visible = visible;
    this.graphics.setVisible(visible);
    this.labels.forEach((label) => label.setVisible(visible));
  }

  reset() { this.stick = null; this.prev = {}; this.state = {}; this.switchLatched = false; }
  latchSwitchWeapon() { this.switchLatched = true; }
  getState() { return this.state || {}; }

  update() {
    if (!this.visible) { this.state = {}; return; }
    const { width, height } = this.metrics;
    const pointers = this.scene.input.manager.pointers.filter((p) => p.isDown);
    const density = this.metrics.scale;
    const held = { left: false, right: false, up: false, down: false, jump: false, attack: false, slide: false };
    const point = (p) => ({ x: p.x / density, y: p.y / density });
    if (this.stick && !pointers.some((p) => p.id === this.stick.id)) this.stick = null;
    if (!this.stick) {
      const p = pointers.find((p) => p.downX / density < width * 0.45 && p.downY / density > 66);
      if (p) {
        this.stick = { id: p.id, x: Math.max(48 + (this.metrics.safe?.left || 0), p.downX / density),
          y: Math.max(112, Math.min(height - 46 - (this.metrics.safe?.bottom || 0), p.downY / density)) };
      }
    }
    let knobX = 0, knobY = 0;
    if (this.stick) {
      const p = pointers.find((p) => p.id === this.stick.id);
      const pos = point(p);
      let dx = pos.x - this.stick.x, dy = pos.y - this.stick.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 43) {
        this.stick.x += dx * (1 - 43 / distance);
        this.stick.y += dy * (1 - 43 / distance);
        dx *= 43 / distance; dy *= 43 / distance;
      }
      if (distance > 10) {
        held.left = dx < -11; held.right = dx > 11;
        held.up = dy < -20; held.down = dy > 24;
      }
      knobX = dx; knobY = dy;
    }
    for (const p of pointers) {
      if (p.id === this.stick?.id) continue;
      const pos = point(p);
      for (const b of this.buttons) {
        if (Math.hypot(pos.x - b.x, pos.y - b.y) < b.r + 6) held[b.action] = true;
      }
    }
    this.state = { ...held, run: held.slide,
      jumpPressed: held.jump && !this.prev.jump,
      attackPressed: held.attack && !this.prev.attack,
      slidePressed: held.slide && !this.prev.slide,
      switchWeaponPressed: !!this.switchLatched };
    this.switchLatched = false;
    this.prev = held;

    const g = this.graphics.clear();
    const sx = this.stick?.x ?? 75 + (this.metrics.safe?.left || 0);
    const sy = this.stick?.y ?? height - 65 - (this.metrics.safe?.bottom || 0);
    g.fillStyle(0x16202a, 0.28).fillCircle(sx, sy, 43);
    g.lineStyle(1.4, 0xf7f4ec, 0.4).strokeCircle(sx, sy, 43);
    g.fillStyle(0xf8f3e9, 0.25).fillCircle(sx + knobX, sy + knobY, 18);
    g.lineStyle(1, 0xffffff, 0.45).strokeCircle(sx + knobX, sy + knobY, 18);
    g.fillStyle(0xffffff, 0.48);
    g.fillTriangle(sx - 5, sy - 32, sx + 5, sy - 32, sx, sy - 39);
    g.fillTriangle(sx - 5, sy + 32, sx + 5, sy + 32, sx, sy + 39);
    g.fillTriangle(sx - 32, sy - 5, sx - 32, sy + 5, sx - 39, sy);
    g.fillTriangle(sx + 32, sy - 5, sx + 32, sy + 5, sx + 39, sy);
    for (const b of this.buttons) {
      g.fillStyle(b.color, held[b.action] ? 0.84 : 0.52).fillCircle(b.x, b.y, b.r);
      g.lineStyle(1.5, 0xffffff, held[b.action] ? 1 : 0.55).strokeCircle(b.x, b.y, b.r);
      g.lineStyle(1.8, 0xffffff, 0.94);
      if (b.action === 'attack') {
        g.strokeRoundedRect(b.x - 12, b.y - 17, 20, 14, 1);
        g.lineBetween(b.x - 16, b.y, b.x + 11, b.y);
        g.lineBetween(b.x - 12, b.y - 3, b.x - 16, b.y);
        g.lineBetween(b.x + 8, b.y - 3, b.x + 11, b.y);
        g.lineBetween(b.x + 13, b.y - 13, b.x + 19, b.y - 17);
        g.lineBetween(b.x + 14, b.y - 9, b.x + 21, b.y - 9);
        g.lineBetween(b.x + 13, b.y - 5, b.x + 18, b.y - 2);
      } else if (b.action === 'jump') {
        g.fillStyle(0xffffff, 0.96).fillCircle(b.x + 7, b.y - 24, 4);
        g.lineStyle(4, 0xffffff, 0.96).lineBetween(b.x + 3, b.y - 17, b.x - 3, b.y - 7);
        g.lineBetween(b.x + 3, b.y - 17, b.x + 14, b.y - 13).lineBetween(b.x + 14, b.y - 13, b.x + 18, b.y - 19);
        g.lineBetween(b.x + 3, b.y - 17, b.x - 8, b.y - 18).lineBetween(b.x - 8, b.y - 18, b.x - 13, b.y - 11);
        g.lineBetween(b.x - 3, b.y - 7, b.x + 7, b.y - 3).lineBetween(b.x + 7, b.y - 3, b.x + 3, b.y + 3);
        g.lineBetween(b.x - 3, b.y - 7, b.x - 9, b.y).lineBetween(b.x - 9, b.y, b.x - 18, b.y + 3);
      } else {
        g.fillStyle(0xffffff, 0.96).fillCircle(b.x + 10, b.y - 18, 4);
        g.lineStyle(4, 0xffffff, 0.96).lineBetween(b.x + 6, b.y - 12, b.x - 5, b.y - 4);
        g.lineBetween(b.x + 6, b.y - 12, b.x + 9, b.y - 3).lineBetween(b.x + 9, b.y - 3, b.x + 20, b.y);
        g.lineBetween(b.x - 5, b.y - 4, b.x - 19, b.y).lineBetween(b.x - 5, b.y - 4, b.x + 2, b.y);
        g.lineStyle(1.2, 0xffffff, 0.7).lineBetween(b.x - 21, b.y - 7, b.x - 11, b.y - 7)
          .lineBetween(b.x - 24, b.y - 12, b.x - 14, b.y - 12);
      }
    }
  }

  destroy() { this.graphics.destroy(); this.labels.forEach((label) => label.destroy()); this.reset(); }
}
