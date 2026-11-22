import { DEPTH, GAME_HEIGHT } from '../config/constants.js';

// Level zones own gameplay; this class only supplies their art and bounded effects.
export default class SummerAtmosphere {
  constructor(scene, level) {
    this.scene = scene;
    this.effects = [];
    this.coldLayers = [];
    for (const [frame, x, y, height] of level.art?.summerProps || []) this.prop(frame, x, y, height);
    if (!scene.textures.exists('hd-mist')) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      for (let r = 24; r > 0; r--) g.fillStyle(0xffffff, 0.012).fillCircle(24, 24, r);
      g.generateTexture('hd-mist', 48, 48); g.destroy();
    }
  }

  prop(frame, x, y, height, depth = DEPTH.DECOR + 1) {
    const image = this.scene.add.image(x, y, 'hd-summer-props', frame).setOrigin(0.5, 1).setDepth(depth);
    return image.setDisplaySize(height * image.frame.realWidth / image.frame.realHeight, height);
  }

  drawZone(z) {
    if (!['heat', 'cold'].includes(z.type)) return false;
    const s = this.scene, cold = z.type === 'cold', floor = GAME_HEIGHT - 64;
    if (cold) {
      const slices = [[z.x + 16, z.w - 32, 1]];
      for (let n = 0; n < 4; n++) {
        slices.push([z.x + n * 4, 4, (n + 1) / 5], [z.x + z.w - (n + 1) * 4, 4, (n + 1) / 5]);
      }
      for (const [x, width, alpha] of slices) {
        const image = s.add.tileSprite(x, 0, width, GAME_HEIGHT, 'hd-summer-cold')
          .setOrigin(0).setAlpha(alpha).setDepth(DEPTH.BG + 0.1);
        this.coldLayers.push({ image, x, width });
      }
    }
    const color = cold ? 0x64cfff : 0xffa044;
    const wash = s.add.graphics().setDepth(DEPTH.DECOR - 0.5);
    // Feather the boundary, while keeping the exact hazard extent legible.
    for (let n = 0; n < 16; n++) {
      wash.fillStyle(color, 0.012).fillRect(z.x + n * 2, 0, z.w - n * 4, floor);
    }
    const edge = s.add.graphics().setDepth(DEPTH.PLATFORMS + 0.5);
    edge.fillStyle(color, 0.35).fillRect(z.x, floor + 1, z.w, 2);
    const emitters = [];
    for (let x = z.x + 55; x < z.x + z.w - 20; x += 155) {
      if (cold) this.prop('aircon', x, 269, 28, DEPTH.DECOR);
      const emitter = s.add.particles(x, cold ? 265 : floor - 3, 'hd-mist', {
        speedX: cold ? { min: -65, max: -32 } : { min: -4, max: 8 },
        speedY: cold ? { min: 30, max: 55 } : { min: -32, max: -12 },
        lifespan: cold ? 1600 : 1400, frequency: cold ? 180 : 280, maxAliveParticles: 12,
        scaleX: { start: cold ? 0.35 : 0.12, end: cold ? 1.2 : 0.5 },
        scaleY: { start: 0.1, end: 0.5 }, alpha: { start: 0.24, end: 0 }, tint: color
      }).setDepth(DEPTH.ZONES);
      emitters.push(emitter);
    }
    if (cold) {
      const colleague = this.prop('coldColleague', z.x + z.w * 0.78, floor, 46, DEPTH.DECOR);
      s.tweens.add({ targets: colleague, x: colleague.x + 0.5, duration: 90, yoyo: true, repeat: -1 });
    }
    const label = s.add.text(z.x + 15, 278, cold ? 'ARIA POLARE' : 'CALDO TORRIDO', {
      fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '6px', fontStyle: 'bold',
      color: cold ? '#d3f7ff' : '#ffe2ab', backgroundColor: cold ? '#19455d' : '#754729', padding: { x: 4, y: 2 }
    }).setDepth(DEPTH.DECOR);
    this.effects.push({ zone: z, wash, edge, label, emitters });
    return true;
  }

  update(time, left, width, top, height, scale) {
    for (const layer of this.coldLayers) {
      layer.image.setY(top).setSize(layer.width, height + 1).setTileScale(scale);
      layer.image.tilePositionX = (left * 0.35 + layer.x - left) / scale;
      layer.image.setVisible(layer.x < left + width && layer.x + layer.width > left);
    }
    for (const { zone, wash, emitters } of this.effects) {
      const visible = zone.x < left + width + 100 && zone.x + zone.w > left - 100;
      wash.setVisible(visible).setAlpha(0.9 + Math.sin(time / 1800) * 0.1);
      for (const emitter of emitters) emitter.emitting = visible;
    }
  }
}
