import Phaser from 'phaser';
import { PEDALO_CHAPTERS, PEDALO_DISTANCE } from './new/PedaloEscape.js';
import { clamp } from './new/physics.js';
import { audio } from '../systems/Audio8bit.js';
import { toggleFullscreen } from '../systems/Screen.js';

const FONT = 'Segoe UI, Arial, sans-serif';
const INK = 0x082c38, GOLD = 0xffdd8d;

export function preloadPedalo(scene) {
  const base = import.meta.env.BASE_URL + 'assets/';
  for (const [key, directory, file] of [
    ['hd-bonus-vehicles', 'hd-minigames', 'vehicles'], ['hd-bonus-details', 'hd-minigames', 'details'],
    ['hd-world-equipment', 'hd-worlds', 'equipment'], ['hd-summer-props', 'hd-summer', 'summer-props']
  ]) if (!scene.textures.exists(key)) scene.load.atlas(key, base + directory + '/' + file + '.png', base + directory + '/' + file + '.json');
  if (!scene.textures.exists('hd-bonus-cove')) scene.load.image('hd-bonus-cove', base + 'hd-minigames/cove.png');
}

// Dedicated full-screen presentation, sharing the existing bonus lifecycle and rewards.
export default class PedaloPresentation {
  constructor(scene) {
    this.scene = scene;
    scene.background.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.surface = scene.add.graphics().setDepth(-5);
    this.fx = scene.add.graphics().setDepth(40);
    this.hud = scene.add.graphics().setDepth(601);
    this.lastEvent = 0; this.round = null; this.pointer = null;
    this.energyText = this.text('', 11, '#d1f4ec');
    this.progressText = this.text('', 10, '#c4e9e7');
    this.scoreText = this.text('', 15, '#ffdfa1');
    this.help = this.text('', 10, '#e0f1e8');
    this.toast = this.text('', 17, '#fff0ba').setOrigin(.5);
    this.chapterText = this.text('', 25, '#ffffff').setOrigin(.5);
  }

  text(value, size, color) {
    return this.scene.add.text(0, 0, value, { fontFamily: FONT, fontSize: size,
      fontStyle: 'bold', color, stroke: '#08303d', strokeThickness: 2 }).setDepth(605);
  }

  layout() {
    const s = this.scene, w = s.w;
    this.w = w; this.touch = s.viewport.metrics.touch;
    this.playerY = this.touch ? 308 : 325;
    this.left = w * .12; this.routeWidth = w * .76;
    s.s = 1; s.ox = 0; s.oy = 0;
    s.board.setPosition(0, 0).setScale(1); s.overlay.setPosition(0, 0).setScale(1);
    s.hudShade.height = 61; s.hudShade.setFillStyle(INK, .94);
    s.shade.setFillStyle(0x063f4d, .02);
    s.title.setPosition(16, 9).setFontSize(w < 750 ? 14 : 17);
    s.status.setPosition(16, 34).setFontSize(10).setWordWrapWidth(230);
    s.message.setVisible(false);
    s.buttons.splice(0).forEach(button => button.destroy());
    s.button(s.preview ? 'GIOCHI' : 'TORNA', w - 127, 29, 65, () => s.leave(false));
    s.button('Ⅱ', w - 68, 29, 36, () => s.pause());
    s.button('⛶', w - 24, 29, 36, toggleFullscreen);
    if (this.touch) {
      s.button('←', 44, 413, 62, null, 'left');
      s.button('→', 112, 413, 62, null, 'right');
      s.button('SCATTO', w - 168, 413, 104, null, 'boost');
      s.button('OMBRELLO', w - 57, 413, 104, null, 'shield');
    }
    this.energyText.setPosition(18, this.touch ? 352 : 387);
    this.progressText.setPosition(w * .36, 13);
    this.scoreText.setPosition(w - 175, 18).setOrigin(1, 0);
    this.help.setText(this.touch ? 'Trascina sul mare per sterzare' : '← → / A D · STERZA     SPAZIO · SCATTO     E · OMBRELLO     ↓ · FRENO')
      .setOrigin(.5).setPosition(w / 2, this.touch ? 375 : 430);
    this.toast.setPosition(w / 2, 96);
    this.chapterText.setPosition(w / 2, 150);
  }

  x(value) { return this.left + value / 900 * this.routeWidth; }
  y(z) { return this.playerY - (z - this.scene.round.progress) / 520 * (this.playerY - 70); }
  image(name, key, frame, x, y, width, height, angle = 0, depth = 10, alpha = 1) {
    return this.scene.image('pedalo-' + name, key, frame, x, y, width, height, angle, depth, alpha);
  }

  controls(input) {
    if (input.x) this.pointer = null;
    if (this.pointer?.isDown) {
      const target = clamp((this.pointer.worldX - this.left) / this.routeWidth * 900, 42, 858);
      input.x = clamp((target - this.scene.round.x) * .035 - this.scene.round.vx * .018, -1, 1);
    }
    return input;
  }

  pointerDown(pointer) {
    if (pointer.worldY > 64 && pointer.worldY < 375) this.pointer = pointer;
  }

  draw() {
    const s = this.scene, r = s.round, t = r.elapsed, w = this.w;
    if (this.round !== r) { this.round = r; this.lastEvent = 0; }
    const g = this.surface.clear(), fx = this.fx.clear(), hud = this.hud.clear();
    const ratio = Math.min(1, r.progress / PEDALO_DISTANCE);
    s.background.setPosition(0, -45 + ratio * 45).setDisplaySize(w, 495);
    // Slow shore parallax, moving sun glints and local wake rings share scene time: pause freezes all of them.
    for (let i = 0; i < 60; i++) {
      const x = this.left + ((i * 137.17) % this.routeWidth);
      const y = 65 + ((i * 71 + r.progress * .4) % 385);
      const a = .06 + .09 * (1 + Math.sin(t * 2 + i)) / 2;
      g.lineStyle(i % 3 ? 1 : 2, 0xd9fff1, a).beginPath();
      g.moveTo(x - 15, y + 2).lineTo(x, y - 2).lineTo(x + 17, y + 1).strokePath();
    }
    for (const [i, wave] of r.waves.entries()) {
      const y = this.y(wave.z); if (y < 64 || y > 450 || wave.used) continue;
      const x = this.x(wave.x), width = 250 / 900 * this.routeWidth;
      g.fillStyle(0x77e8df, .2).fillEllipse(x, y, width, 24);
      for (let n = 0; n < 3; n++) g.lineStyle(2, 0xe8fff5, .4 + n * .12)
        .beginPath().moveTo(x - width / 2, y + n * 6).lineTo(x, y - 7 + n * 6).lineTo(x + width / 2, y + n * 6).strokePath();
      s.label('wave' + i, 'SCATTO = SALTO', x, y - 20, 10, '#ddfff1');
    }
    for (const [i, rock] of r.rocks.entries()) {
      const y = this.y(rock.z); if (y < 35 || y > 490) continue;
      const x = this.x(rock.x), width = rock.r * 2.4 / 900 * this.routeWidth;
      g.lineStyle(2, 0xd0fff1, .45).strokeEllipse(x, y + 8, width * 1.15, width * .68);
      this.image('rock' + i, 'hd-bonus-details', 'rock', x, y, width, width * .8, (i % 3 - 1) * 12, 8);
    }
    for (const [i, pickup] of r.pickups.entries()) {
      if (pickup.taken || pickup.missed) continue;
      const y = this.y(pickup.z); if (y < 65 || y > 440) continue;
      const x = this.x(pickup.x), bob = Math.sin(t * 3 + i) * 3;
      g.fillStyle(pickup.type === 'drink' ? 0x98ffdc : GOLD, .16).fillCircle(x, y, 23);
      g.lineStyle(1.5, pickup.type === 'drink' ? 0xaaffdf : GOLD, .7).strokeCircle(x, y, 19 + Math.sin(t * 4 + i));
      if (pickup.type === 'leave') this.image('leave' + i, 'hd-props', 'vacation', x, y + bob, 28, 28, Math.sin(t + i) * 5, 12);
      else {
        g.fillStyle(0xf6fbef, .96).fillRoundedRect(x - 8, y - 12 + bob, 16, 24, 4);
        g.fillStyle(0xf4ce57).fillRoundedRect(x - 6, y - 3 + bob, 12, 13, 3);
        g.lineStyle(2, 0xffffff).lineBetween(x + 2, y - 2 + bob, x + 6, y - 20 + bob);
        g.fillStyle(0xb6de72).fillCircle(x - 7, y - 8 + bob, 6);
        g.lineStyle(1, 0xf9f2a7).strokeCircle(x - 7, y - 8 + bob, 4);
      }
    }

    const x = this.x(r.x), air = Math.sin(r.airTime / r.airDuration * Math.PI), y = this.playerY - air * 38;
    this.wake(g, x, this.playerY + 38, r.vx, t, r.boosting ? 1.5 : 1, r.airTime > 0 ? .15 : .65);
    g.fillStyle(0x052b38, .23).fillEllipse(x + air * 12, this.playerY + 12, 63 + air * 15, 55 - air * 18);
    const flashing = t - r.hitAt < 1.2 && Math.floor(t * 14) % 2;
    this.image('boat', 'hd-bonus-vehicles', 'pedalo', x, y + Math.sin(t * 7) * 1.6,
      72 * (1 + air * .12), 104 * (1 + air * .12), r.vx * .045 + Math.sin(t * 7) * .8, 25, flashing ? .42 : 1);
    if (r.shield) {
      this.image('umbrella', 'hd-world-equipment', 'parasol', x, y - 12, 92, 84, Math.sin(t * 4) * 4, 30);
      fx.lineStyle(2, 0xabffe4, .65).strokeEllipse(x, y, 108, 112);
    }
    if (r.progress > 850) {
      const bx = this.x(r.bossX), by = Math.min(410, this.playerY + 90) + Math.sin(t * 5) * 4;
      this.wake(g, bx, by + 35, Math.cos(t) * 40, t + 2, 1.2, .5);
      this.image('boss', 'hd-bonus-vehicles', 'jetski', bx, by, 50, 87, (x - bx) * .06, 17);
      if (r.bossAttack) {
        const warningX = this.x(r.bossAttack.x), remaining = r.bossAttack.at - t;
        g.fillStyle(0xffb25c, .13 + Math.sin(t * 14) * .04).fillRoundedRect(warningX - 65 / 900 * this.routeWidth, this.playerY - 40, 130 / 900 * this.routeWidth, 125, 14);
        fx.lineStyle(2, 0xffd29a, .9).strokeCircle(warningX, this.playerY, 22 + Math.max(0, remaining) * 12);
        s.label('boss-call', '«SOLO CINQUE MINUTI!»', bx, by - 57, 11, '#ffdeb1');
        this.image('mail', 'hd-summer-props', 'mail', warningX, by - (1 - remaining / 1.65) * (by - this.playerY), 27, 22, t * 100, 20);
      }
    }
    if (r.drone && r.drone.at - t < 2.2) {
      const dx = this.x(r.drone.x), remaining = Math.max(0, r.drone.at - t);
      fx.lineStyle(2.5, 0xffaf78, .9).strokeEllipse(dx, this.playerY, 144 / 900 * this.routeWidth, 66);
      fx.lineStyle(1, 0xffffff, .65).strokeCircle(dx, this.playerY, 8 + remaining * 12);
      const dy = 105 + Math.sin(t * 6) * 3;
      this.image('drone', 'hd-bonus-details', 'drone', dx, dy, 81, 70, Math.sin(t * 9) * 3, 31);
      for (const side of [-1, 1]) fx.lineStyle(1.5, 0xe3f8f1, .6).strokeEllipse(dx + side * 27, dy - 11, 24 + Math.sin(t * 55) * 3, 7);
      s.label('drone-warning', 'CONSEGNA URGENTE!', dx, 155, 10, '#ffdeb8');
    }
    if (ratio > .86) {
      const dockY = 76 + (ratio - .86) / .14 * 150;
      g.fillStyle(0xf4df9e, .65).fillEllipse(w / 2, dockY - 45, this.routeWidth * .8, 100);
      s.label('finish', 'CALETTA OFFLINE', w / 2, dockY - 20, 19, '#fff7ca');
      s.label('signal', 'NESSUN SEGNALE  ✓', w / 2, dockY + 3, 10, '#cdfff0');
    }

    for (const event of r.events) {
      const age = t - event.at;
      if (event.id > this.lastEvent) {
        if (s.phase === 'play') {
          const sound = { pickup: 'coin', near: 'perfect', jump: 'jump', block: 'powerup', hit: 'splash', chapter: 'powerup' }[event.type];
          if (sound) audio.sfx(sound);
          if (event.type === 'hit') s.cameras.main.shake(160, .003);
        }
        this.lastEvent = event.id;
      }
      if (age > 1.25) continue;
      const ex = this.x(event.x);
      if (event.type !== 'chapter') {
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * Math.PI * 2, radius = age * 65;
          fx.fillStyle(event.type === 'pickup' ? GOLD : 0xe8fff5, Math.max(0, 1 - age / 1.25))
            .fillCircle(ex + Math.cos(a) * radius, this.playerY + Math.sin(a) * radius * .55 - age * 12, 3 - age);
        }
        if (event.value) s.label('score-' + event.id, '+' + event.value, ex, this.playerY - 65 - age * 25, 15, '#ffec9e');
      }
    }
    const recent = [...r.events].reverse().find(event => event.text && event.type !== 'chapter' && t - event.at < 1.8);
    this.toast.setText(recent?.text || '').setVisible(s.phase === 'play' && !!recent).setAlpha(recent ? Math.min(1, (1.8 - (t - recent.at)) * 2) : 0);
    const chapter = [...r.events].reverse().find(event => event.type === 'chapter' && t - event.at < 2.4);
    this.chapterText.setText(chapter?.text || '').setVisible(s.phase === 'play' && !!chapter);

    const energyY = this.touch ? 370 : 409;
    hud.fillStyle(INK, .88).fillRoundedRect(12, energyY - 27, 153, 42, 9);
    hud.fillStyle(0x345761).fillRoundedRect(20, energyY, 134, 5, 2);
    hud.fillStyle(r.energy < 25 ? 0xffb976 : 0x8eead4).fillRoundedRect(20, energyY, Math.max(1, 134 * r.energy / 100), 5, 2);
    this.energyText.setText((r.boosting ? 'SCATTO' : r.shield ? 'OMBRELLO' : 'ENERGIA') + '  ' + Math.ceil(r.energy) + '%');
    const barX = w * .36, barW = Math.max(100, w - barX - 270);
    hud.fillStyle(0x315661).fillRoundedRect(barX, 39, barW, 5, 2);
    hud.fillStyle(0x8eecd3).fillRoundedRect(barX, 39, Math.max(1, barW * ratio), 5, 2);
    for (let i = 1; i < 3; i++) hud.fillStyle(0xffffff, .8).fillCircle(barX + barW * PEDALO_CHAPTERS[i].from / PEDALO_DISTANCE, 41, 3);
    this.progressText.setText(PEDALO_CHAPTERS[r.chapter].title + ' · ' + Math.floor(ratio * 100) + '%');
    this.scoreText.setText(String(r.score).padStart(5, '0') + (r.combo >= 3 ? '  ×' + (1 + Math.floor(r.combo / 3)) : ''));
    s.status.setText('SCAFO  ' + '♥ '.repeat(Math.max(0, r.lives)) + '♡ '.repeat(4 - Math.max(0, r.lives)));
    s.message.setVisible(false);
    this.help.setVisible(s.phase === 'play');
  }

  wake(g, x, y, vx, time, strength, alpha) {
    for (let i = 0; i < 14; i++) {
      const p = ((time * 1.7 + i / 14) % 1), spread = 15 + p * 27 * strength;
      g.lineStyle(1.5 + (1 - p) * 2, 0xe7fff4, alpha * (1 - p));
      g.beginPath().moveTo(x - spread - vx * p * .12, y + p * 65)
        .lineTo(x - spread + 5 - vx * p * .12, y + p * 65 - 4).strokePath();
      g.beginPath().moveTo(x + spread - vx * p * .12, y + p * 65)
        .lineTo(x + spread - 5 - vx * p * .12, y + p * 65 - 4).strokePath();
    }
  }

  modal() {
    const s = this.scene, r = s.round;
    s.modals.splice(0).forEach(obj => obj.destroy());
    if (s.phase === 'play') return;
    const add = obj => { s.modals.push(obj); return obj; }, width = Math.min(650, this.w - 38), cx = this.w / 2;
    add(s.add.rectangle(cx, 225, this.w, 450, 0x032936, .5).setDepth(1000).setInteractive());
    const card = add(s.add.graphics().setDepth(1001));
    card.fillStyle(INK, .96).fillRoundedRect(cx - width / 2, 72, width, 332, 20)
      .lineStyle(1.5, GOLD, .8).strokeRoundedRect(cx - width / 2, 72, width, 332, 20);
    const text = (value, y, size, color = '#fff1d2') => add(s.add.text(cx, y, value, {
      fontFamily: FONT, fontSize: size, fontStyle: 'bold', color, align: 'center',
      wordWrap: { width: width - 55 }, lineSpacing: 5
    }).setOrigin(.5).setDepth(1002));
    text(s.phase === 'intro' ? 'BONUS ESTATE  /  FUGA IN PEDALÒ' : s.phase === 'paused' ? 'UN ATTIMO DI RELAX' : r.won ? 'CONNESSIONE PERSA. FERIE TROVATE.' : 'IL LAVORO TI HA RAGGIUNTO', 101, 11, '#8be0cc');
    text(s.phase === 'intro' ? 'Fuori ufficio. Sul serio.' : s.phase === 'paused' ? 'La call può aspettare.' : r.won ? 'Finalmente offline!' : 'Ancora una pedalata?', 141, 28);
    if (s.phase === 'intro') {
      text('Scappa dal capo e raggiungi la caletta senza campo.', 185, 15);
      text('Raccogli bibite per lo scatto. Sulle onde, decolli.\nL’ombrellone respinge le consegne urgenti.\nEvita gli scogli e sfiora i pericoli per fare combo.', 240, 13);
    } else if (s.phase === 'paused') text('Mare, inseguimento e timer sono fermi.\nRiprendi quando vuoi.', 220, 16);
    else {
      text(r.score + ' PUNTI  ·  COMBO ×' + (1 + Math.floor(r.bestCombo / 3)), 188, 20, '#ffdd8d');
      text(r.collected + ' raccolte   ·   ' + r.jumps + ' salti   ·   ' + r.blocks + ' call respinte\n' + r.message, 237, 13);
    }
    s.modalAction = s.phase === 'intro' ? () => { s.phase = 'play'; s.input.keyboard?.resetKeys(); s.drawModal(); }
      : s.phase === 'paused' ? () => s.pause() : () => s.leave(r.won);
    s.button(s.phase === 'intro' ? 'STACCA LA SPINA  →' : s.phase === 'paused' ? 'RIPRENDI' : s.preview ? 'TUTTI I GIOCHI' : 'TORNA ALLO STAGE', cx, 308, 240, s.modalAction, null, true);
    if (s.phase === 'result') s.button('RIPROVA', cx, 363, 170, () => s.restartRound(), null, true);
    else s.button(s.preview ? 'TUTTI I GIOCHI' : 'TORNA ALLO STAGE', cx, 363, 220, () => s.leave(false), null, true);
  }

  destroy() { this.pointer = null; }
}
