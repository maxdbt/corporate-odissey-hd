import { GameState } from '../state/GameState.js';
import { WEAPON_LABEL } from '../config/constants.js';

const FONT = 'Segoe UI, Arial, sans-serif';
const textStyle = (size = 12, color = '#f5f3ee') => ({
  fontFamily: FONT, fontSize: size + 'px', fontStyle: 'bold', color
});
const STATUS = { drunk: 'UBRIACO', stuck: 'BLOCCATO', promotion: 'PROMOZIONE', raise: 'BONUS x2',
  invuln: 'PROTETTO', cold: 'RAFFREDDATO', frozen: 'CONGELATO', asleep: 'SONNO', shield: 'SCUDO' };

export default class HdHUD {
  constructor(scene, metrics, actions) {
    this.scene = scene;
    this.metrics = metrics;
    this.actions = actions;
    this.root = scene.add.container(0, 0).setDepth(10);
    this.panel = scene.add.graphics(); this.bars = scene.add.graphics();
    this.root.add([this.panel, this.bars]);
    const make = (text, size, color) => {
      const t = scene.add.text(0, 0, text, textStyle(size, color));
      this.root.add(t); return t;
    };
    const texture = scene.textures.get('hd-characters');
    for (const character of ['man', 'woman']) {
      const name = character + '_portrait';
      if (!texture.has(name)) {
        const f = texture.get(character + '_idle');
        const size = Math.round(f.cutHeight * 0.32);
        texture.add(name, 0, Math.round(f.cutX + f.cutWidth / 2 - size / 2), f.cutY, size, size);
      }
    }
    this.portrait = scene.add.image(27, 23, 'hd-characters', GameState.character + '_portrait').setDisplaySize(37, 39);
    this.root.add(this.portrait);
    this.hpLabel = make('SALUTE', 12);
    this.stressLabel = make('STRESS', 12);
    this.hpValue = make('100', 13).setOrigin(1, 0);
    this.stressValue = make('0', 13).setOrigin(1, 0);
    this.title = make('NATALE IN UFFICIO', 13).setOrigin(0.5, 0);
    this.timer = make('5:00', 19).setOrigin(0.5, 0);
    this.coin = scene.add.image(0, 20, 'hd-props', 'euro').setDisplaySize(19, 19);
    this.vacation = scene.add.image(0, 20, 'hd-props', 'vacation').setDisplaySize(21, 21);
    this.root.add([this.coin, this.vacation]);
    this.euro = make('0', 17); this.ferie = make('0', 15); this.ferieLabel = make('FERIE', 8, '#d4d0ca');
    this.buttons = [
      ['i', actions.brief, 'Briefing'],
      ['⛶', actions.fullscreen, 'Schermo intero'],
      ['Ⅱ', actions.pause, 'Pausa']
    ].map(([label, action]) => {
      const box = scene.add.rectangle(0, 23, 25, 31, 0x101722, 0.7)
        .setStrokeStyle(1.2, 0xe2e6ef, 0.85).setInteractive({ useHandCursor: true }).on('pointerup', action);
      const text = make(label, 18).setOrigin(0.5);
      this.root.add(box); return { box, text };
    });
    this.weaponBox = scene.add.rectangle(80, 59, 144, 18, 0x101722, 0.70)
      .setStrokeStyle(0.6, 0xc2ab83, 0.45).setInteractive({ useHandCursor: true }).on('pointerdown', actions.weapon);
    this.weaponText = scene.add.text(15, 59, '', textStyle(8, '#e9e1cf')).setOrigin(0, 0.5);
    this.statusText = scene.add.text(0, 69, '', textStyle(10, '#ffdf93')).setOrigin(0.5);
    this.root.add([this.weaponBox, this.weaponText, this.statusText]);
    this.banner = scene.add.container(0, 98).setDepth(50).setVisible(false);
    this.bannerPanel = scene.add.graphics();
    this.bannerText = scene.add.text(0, 0, '', { ...textStyle(17), align: 'center', wordWrap: { width: 600 } }).setOrigin(0.5);
    this.banner.add([this.bannerPanel, this.bannerText]);
    this.root.add(this.banner);
    this.layout();
  }

  layout() {
    this.root.list.forEach((child) => { if (child.type === 'Text') child.setResolution(this.metrics.scale); });
    this.bannerText.setResolution(this.metrics.scale);
    const safe = this.metrics.safe || {};
    const left = safe.left || 0, right = safe.right || 0, top = safe.top || 0;
    const w = this.metrics.width - left - right;
    this.root.setPosition(left, top);
    const p = this.panel.clear();
    p.fillStyle(0x080e1b, 0.98).fillRect(-left, -top, this.metrics.width, 45 + top);
    p.lineStyle(0.8, 0xd3c6bc, 0.8).lineBetween(0, 45, w, 45);
    p.fillStyle(0x2c4058).fillRoundedRect(7, 3, 40, 39, 5);
    p.lineStyle(1, 0xe2e3df, 0.9).strokeRoundedRect(7, 3, 40, 39, 5);
    const compact = w < 760;
    this.barX = compact ? 127 : 153;
    this.barWidth = compact ? 94 : 130;
    const statX = compact ? 55 : 69;
    this.hpLabel.setPosition(statX, 5).setFontSize(compact ? 10 : 12);
    this.stressLabel.setPosition(statX, 25).setFontSize(compact ? 10 : 12);
    this.hpValue.setPosition(this.barX - 9, 4); this.stressValue.setPosition(this.barX - 9, 24);
    const titleX = compact ? w * 0.51 : w * 0.52;
    p.lineStyle(0.7, 0x7b9caf, 0.65).lineBetween(this.barX + this.barWidth + 28, 8, this.barX + this.barWidth + 28, 36)
      .lineBetween(w - 267, 8, w - 267, 36);
    this.title.setPosition(titleX, 3).setFontSize(compact ? 9 : 13);
    this.timer.setPosition(titleX, 20);
    this.coin.setPosition(w - 226, 22); this.euro.setPosition(w - 211, 10);
    this.vacation.setPosition(w - 159, 18); this.ferie.setPosition(w - 143, 8);
    this.ferieLabel.setPosition(w - 169, 32);
    this.buttons.forEach((b, i) => { const x = w - 85 + i * 31; b.box.setPosition(x, 23); b.text.setPosition(x, 23); });
    this.statusText.setPosition(w / 2, 58);
    this.banner.setPosition(w / 2, 107);
    const bw = Math.min(630, w - 100);
    this.bannerPanel.clear().fillStyle(0x101c29, 0.94).fillRoundedRect(-bw / 2, -33, bw, 66, 8)
      .lineStyle(1, 0xdcc295, 0.7).strokeRoundedRect(-bw / 2, -33, bw, 66, 8);
    this.bannerText.setWordWrapWidth(bw - 24);
  }

  update(data) {
    const g = this.bars.clear();
    for (const [y, value, color] of [[9, data.hp, 0x22d77c], [29, data.stress, 0xf5746d]]) {
      const x = this.barX, width = this.barWidth;
      g.fillStyle(0x20283b).fillRoundedRect(x, y, width, 10, 3);
      if (value > 0) {
        const fill = Math.max(2, (width - 2) * value / 100);
        g.fillStyle(color).fillRoundedRect(x + 1, y + 1, fill, 8, 2);
        g.fillStyle(0xffffff, 0.48).fillRoundedRect(x + 2, y + 1, Math.max(1, fill - 2), 2, 1);
      }
      g.lineStyle(0.8, 0xe2e9ec, 0.85).strokeRoundedRect(x, y, width, 10, 3);
    }
    const set = (t, value) => { value = String(value); if (t.text !== value) t.setText(value); };
    set(this.hpValue, Math.round(data.hp)); set(this.stressValue, Math.round(data.stress));
    set(this.euro, data.euro); set(this.ferie, data.vacationDays);
    set(this.title, (data.levelName || '').toUpperCase());
    const seconds = data.timeLeft || 0;
    set(this.timer, Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'));
    this.timer.setColor(seconds < 30 ? '#ff8f82' : '#ffffff');
    set(this.weaponText, data.device ? WEAPON_LABEL[data.weapon] + '  ·  V/E CAMBIA' : 'TROVA UN LAPTOP');
    set(this.statusText, data.stress >= 100 ? 'PANICO · COMANDI INVERTITI' :
      (data.statuses || []).filter((x) => x.name !== 'invuln').map((x) => STATUS[x.name] || x.name.toUpperCase()).join('  ·  '));
    if (this.banner.visible && this.scene.time.now > this.bannerUntil) this.banner.setVisible(false);
    if (this.fogUntil) this.root.setAlpha(this.scene.time.now < this.fogUntil ? 0.5 : 1);
  }

  message(text, color = '#ffffff', ms = 2000) {
    this.bannerText.setText(text).setColor(color);
    this.banner.setVisible(true); this.bannerUntil = this.scene.time.now + ms;
  }
  fog(ms) { this.fogUntil = this.scene.time.now + ms; }
  bossBar(name, ratio) {
    if (ratio !== null) this.message(name + '  ' + Math.round(ratio * 100) + '%', '#ffaaa1', 600);
  }
  teamsCall(ms) { this.message('CHIAMATA TEAMS…', '#d5c8ff', ms); }
  destroy() { this.root.destroy(); }
}
