import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, TEX } from '../config/constants.js';
import { GameState } from '../state/GameState.js';
import { hdAssetsReady, useHdFiltering } from './AssetRegistry.js';
import { officeTheme } from './themes/office.js';
import ViewportController from './ViewportController.js';
import ActorSkin from './ActorSkin.js';
import OfficeDressing from './OfficeDressing.js';

export function createPresentation(scene, level) {
  const classic = new URLSearchParams(window.location.search).get('graphics') === 'classic';
  return level.visualTheme === 'office-hd' && !classic && hdAssetsReady(scene)
    ? new OfficePresentation(scene, level) : null;
}

export default class OfficePresentation {
  constructor(scene, level) {
    this.scene = scene;
    this.level = level;
    this.theme = officeTheme;
    this.skins = new Map();
    useHdFiltering(scene);
    if (!scene.textures.exists('hd-code')) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x123e37, 0.85).fillRoundedRect(1, 1, 126, 62, 18);
      g.lineStyle(3, 0x9affd5, 0.8).strokeRoundedRect(2, 2, 124, 60, 18);
      g.lineStyle(6, 0xd1ffe9).lineBetween(43, 17, 25, 32).lineBetween(25, 32, 43, 47)
        .lineBetween(85, 17, 103, 32).lineBetween(103, 32, 85, 47).lineBetween(72, 13, 57, 51);
      g.generateTexture('hd-code', 128, 64); g.destroy();
      scene.textures.get('hd-code').setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    this.viewport = new ViewportController(scene);
    this.onPostUpdate = (time, delta) => this.update(delta);
  }

  drawBackground() {
    const s = this.scene;
    const texture = s.textures.get('hd-office').getSourceImage();
    this.background = s.add.tileSprite(0, 0, 1000, GAME_HEIGHT, 'hd-office')
      .setOrigin(0).setDepth(DEPTH.BG);
    this.backgroundSourceHeight = texture.height;
    const floor = GAME_HEIGHT - 64;
    for (let i = 1; i < this.level.ground.length; i++) {
      const left = (this.level.ground[i - 1][1] + 1) * 32;
      const right = this.level.ground[i][0] * 32;
      if (right > left) s.add.rectangle(left, floor, right - left, 64, 0x080b12, 0.96)
        .setOrigin(0).setDepth(DEPTH.PLATFORMS - 1);
    }
    this.dressing = new OfficeDressing(s, this.level);
  }

  prop(frame, x, y, height, depth = DEPTH.DECOR, originX = 0.5, originY = 1) {
    const image = this.scene.add.image(x, y, 'hd-props', frame).setOrigin(originX, originY).setDepth(depth);
    image.setDisplaySize(height * image.frame.realWidth / image.frame.realHeight, height);
    return image;
  }

  drawSolid(x, y, w, h) {
    const s = this.scene;
    s.add.rectangle(x, y, w, h, 0x49272b).setOrigin(0).setDepth(DEPTH.PLATFORMS);
    const frame = s.textures.getFrame('hd-props', 'floor');
    const texture = s.textures.get('hd-props');
    if (!texture.has('floorEdge')) {
      texture.add('floorEdge', 0, frame.cutX, frame.cutY, frame.cutWidth, 48);
      texture.add('floorFace', 0, frame.cutX, frame.cutY + 48, frame.cutWidth, frame.cutHeight - 48);
    }
    const edge = Math.min(7, h);
    s.add.tileSprite(x, y, w, edge, 'hd-props', 'floorEdge').setOrigin(0).setDepth(DEPTH.PLATFORMS + 0.1)
      .setTileScale(96 / frame.realWidth, edge / 48);
    if (h > edge) s.add.tileSprite(x, y + edge, w, h - edge, 'hd-props', 'floorFace').setOrigin(0).setDepth(DEPTH.PLATFORMS + 0.1)
      .setTileScale(96 / frame.realWidth, (h - edge) / (frame.cutHeight - 48));
    s.add.rectangle(x, y, w, 0.65, 0xf0c49c, 0.8).setOrigin(0).setDepth(DEPTH.PLATFORMS + 0.2);
    return true;
  }

  drawDesk(x, y) {
    if (y < GAME_HEIGHT - 100) {
      // Elevated desks are mounted to the wall, not miniature tables floating in air.
      const image = this.scene.add.image(x, y, 'hd-dressing', 'wallDesk').setOrigin(0)
        .setDepth(DEPTH.PLATFORMS);
      const height = 64 * image.frame.realHeight / image.frame.realWidth;
      image.setDisplaySize(64, height).setY(y - height * 0.58);
      return true;
    }
    const frame = this.scene.textures.getFrame('hd-props', 'desk');
    const width = 64;
    const height = width * frame.realHeight / frame.realWidth;
    // The lamp is above the physical desktop. Only the desktop surface remains the one-way collider.
    this.scene.add.image(x, y - height * 0.45, 'hd-props', 'desk').setOrigin(0)
      .setDisplaySize(width, height).setDepth(DEPTH.PLATFORMS);
    return true;
  }

  drawPlatform(x, y, w) {
    const s = this.scene;
    const frame = s.textures.getFrame('hd-props', 'floor');
    s.add.tileSprite(x, y, w, 15, 'hd-props', 'floor').setOrigin(0)
      .setTileScale(96 / frame.realWidth, 15 / frame.realHeight).setDepth(DEPTH.PLATFORMS);
    s.add.rectangle(x, y, w, 1.5, 0xffd891).setOrigin(0).setDepth(DEPTH.PLATFORMS + 0.1);
    return true;
  }

  drawLadder(x, top, bottom) {
    const ladder = this.scene.add.tileSprite(x, top, 20, bottom - top, 'hd-props', 'ladder')
      .setOrigin(0.5, 0).setDepth(DEPTH.DECOR + 1);
    const f = ladder.frame;
    ladder.setTileScale(20 / f.realWidth);
    return true;
  }

  drawDecor(texture, x, y) {
    if (texture === TEX.XMAS_TREE && x === 200 && this.level.art?.entryTreeX !== undefined) x = this.level.art.entryTreeX;
    const spec = this.theme.props[texture];
    if (spec) { this.prop(spec[0], x, y, spec[1]); return true; }
    if (texture === TEX.WHITEBOARD) {
      const g = this.scene.add.graphics().setDepth(DEPTH.DECOR);
      g.fillStyle(0x3c2922, 0.4).fillRoundedRect(x - 28, y - 36, 59, 38, 2);
      g.fillStyle(0xe6dfd2).fillRoundedRect(x - 30, y - 40, 60, 38, 2);
      g.lineStyle(1.5, 0x938776).strokeRoundedRect(x - 30, y - 40, 60, 38, 2);
      g.lineStyle(1, 0x48637a, 0.6);
      for (let n = 0; n < 3; n++) g.lineBetween(x - 22, y - 32 + n * 8, x + 13 - n * 4, y - 32 + n * 8);
      return true;
    }
    return false;
  }

  drawPuddle(x, y, w) {
    const s = this.scene;
    const puddle = s.add.image(x + w / 2, y + 1, 'hd-spumante', 'puddle').setOrigin(0.5, 1)
      .setDepth(DEPTH.DECOR + 1);
    const pw = w;
    puddle.setDisplaySize(pw, pw * puddle.frame.realHeight / puddle.frame.realWidth);
    const colleague = s.add.image(x + w + 20, y, 'hd-enemies', 'party1').setOrigin(0.5, 1)
      .setDisplaySize(42, 47).setFlipX(true).setDepth(DEPTH.DECOR + 2);
    s.tweens.add({ targets: colleague, angle: { from: -2, to: 2 }, duration: 700, yoyo: true, repeat: -1 });
    s.add.particles(x + w + 2, y - 31, TEX.FX_PX, {
      speedX: { min: -95, max: -55 }, speedY: { min: -72, max: -38 }, gravityY: 170,
      lifespan: 700, frequency: 100, maxAliveParticles: 10,
      scale: { start: 0.8, end: 0.2 }, alpha: { start: 0.9, end: 0 }, tint: [0xffdf89, 0xffffff]
    }).setDepth(DEPTH.DECOR + 3);
    return true;
  }

  start() {
    const bonus = this.scene.lastMailTerminal;
    if (bonus) {
      bonus.sign.setText("L'ULTIMA MAIL").setY(bonus.y - 20)
        .setStyle({ fontFamily: this.theme.font, fontSize: '6px', color: '#d8f5e4', strokeThickness: 1 });
      bonus.prompt.setY(bonus.y - 31).setStyle({ fontFamily: this.theme.font, fontSize: '5.5px', strokeThickness: 1 });
    }
    this.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.onPostUpdate);
    this.update(0);
  }

  playerFrame(skin, delta) {
    const p = skin.source;
    const c = p.character;
    const motion = c === 'woman' ? 'hd-wendy-motion' : 'hd-jack-motion';
    let frame = c + '_idle1', texture = motion;
    const grounded = p.onGround;
    if (grounded && skin.wasGrounded === false) skin.landedAt = p.clock;
    skin.wasGrounded = grounded;
    const pose = p.currentPose;
    if (pose === 'hurt' || pose === 'crouch' || pose === 'slide' || pose === 'jump' || pose?.startsWith('climb') || pose === 'sleep') {
      texture = 'hd-characters';
      frame = c + '_' + (pose.startsWith('climb') ? 'climb' : pose === 'sleep' ? 'slide' : pose);
    } else if (GameState.device && p.nextFireAt - p.clock > 120) {
      frame = c + '_attack';
    } else if (grounded && Math.abs(p.body.velocity.x) > 15) {
      const rate = Math.abs(p.body.velocity.x) > 220 ? 16 : 10;
      skin.phase += Math.min(delta, 80) * rate / 1000;
      frame = c + '_run' + (Math.floor(skin.phase) % 8 + 1);
    } else if (p.clock - (skin.landedAt || -1000) < 95) frame = c + '_land';
    else if (p.clock % 4500 > 4380) frame = c + '_idle2';
    return { texture, frame, height: 46 };
  }

  resolve(source) {
    if (source === this.scene.player) return (skin, delta) => this.playerFrame(skin, delta);
    const key = source.texture?.key;
    if (key === 'copier' || key === 'cabinet') {
      const height = key === 'copier' ? 40 : 53;
      return () => ({ texture: 'hd-props', frame: key, height });
    }
    if (key === 'terminal') return () => ({ texture: 'hd-props', frame: 'laptop',
      height: source === this.scene.lastMailTerminal?.computer ? 16 : 22 });
    if (key === 'p_www') return () => ({ texture: 'hd-code', frame: '__BASE', height: 14 });
    const props = this.theme.props[key];
    if (props) {
      return () => {
        const now = this.theme.props[source.texture?.key] || props;
        return { texture: 'hd-props', frame: now[0], height: now[1], coinSpin: source.kind === 'euro' };
      };
    }
    const enemy = this.theme.enemies[key];
    if (enemy) return () => {
      const current = this.theme.enemies[source.texture?.key] || enemy;
      return { texture: 'hd-enemies', frame: current[0], height: current[1], ...current[2] };
    };
    return null;
  }

  update(delta) {
    const s = this.scene;
    const cam = s.cameras.main;
    if (this.background) {
      const width = cam.width / cam.zoom, height = cam.height / cam.zoom;
      const left = cam.scrollX + cam.width * 0.5 * (1 - 1 / cam.zoom);
      const top = cam.scrollY + cam.height * 0.5 * (1 - 1 / cam.zoom);
      const tileScale = height / this.backgroundSourceHeight;
      this.background.setPosition(left, top).setSize(width + 1, height + 1).setTileScale(tileScale);
      this.background.tilePositionX = left * 0.35 / tileScale;
      this.dressing.update(left, top, width, height);
    }
    // The display list has only a few hundred objects. New bullets get a skin on the same rendered frame.
    for (const object of [...s.children.list]) {
      if (object.type === 'Text' && !object.hdStyled) {
        object.setStyle({ fontFamily: this.theme.font, strokeThickness: Math.min(2, object.style.strokeThickness) })
          .setResolution(this.viewport.metrics.scale);
        object.hdStyled = true;
      }
      if (!object.texture || this.skins.has(object) || object.texture.key.startsWith('hd-')) continue;
      const resolve = this.resolve(object);
      if (resolve) this.skins.set(object, new ActorSkin(s, object, resolve));
    }
    for (const [source, skin] of this.skins) {
      if (!source.scene || !skin.source) { skin.destroy(); this.skins.delete(source); }
      else skin.sync(delta);
    }
    const player = s.player;
    if (player) {
      if (!this.playerShadow) this.playerShadow = s.add.ellipse(0, 0, 22, 3.5, 0x1b1119, 0.28).setDepth(DEPTH.PLATFORMS + 1);
      // A checkpoint fallback is not a real surface: do not draw a shadow over a pit.
      let ground = Infinity;
      for (const group of [s.platforms, s.oneWay]) {
        for (const object of group.getChildren()) {
          const b = object.body;
          if (player.x >= b.left && player.x <= b.right && b.top >= player.y - 4) ground = Math.min(ground, b.top);
        }
      }
      if (!Number.isFinite(ground)) ground = player.y + 1000;
      const distance = Math.max(0, ground - player.y);
      this.playerShadow.setPosition(player.x, ground + 0.7).setScale(Math.max(0.4, 1 - distance / 220))
        .setAlpha(Math.max(0, 0.28 - distance / 500)).setVisible(player.visible && player.y <= ground + 4);
    }
    if (player && GameState.device) {
      if (!this.deviceVisual) this.deviceVisual = this.prop('laptop', player.x, player.y, 12, DEPTH.PLAYER + 2);
      this.deviceVisual.setPosition(player.x + player.facing * 13, player.y - (player.isSliding ? 3 : 16))
        .setFlipX(player.facing < 0).setAlpha(player.alpha).setVisible(player.visible && !player.isClimbing);
    } else this.deviceVisual?.setVisible(false);
    if (import.meta.env.DEV && s.time.now > (this.nextDiagnosticAt || 0)) {
      this.nextDiagnosticAt = s.time.now + 200;
      const p = s.player;
      s.game.canvas.dataset.hdDiagnostics = JSON.stringify({
        level: this.level.id, hp: GameState.hp, stress: GameState.stress, ended: s.ended,
        player: p ? { x: p.x, y: p.y, pose: p.currentPose, grounded: p.onGround } : null,
        frame: this.skins.get(p)?.image?.frame?.name, skins: this.skins.size,
        anchors: s.enemies.getChildren().filter((e) => e.kind === 'copier' || e.kind === 'cabinet')
          .map((e) => ({ kind: e.kind, x: e.x, y: e.y })),
        viewport: this.viewport.metrics, fps: Math.round(s.game.loop.actualFps)
      });
    }
  }

  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.onPostUpdate);
    for (const skin of this.skins.values()) skin.destroy();
    this.skins.clear();
    this.viewport.destroy();
    this.scene = null;
  }
}
