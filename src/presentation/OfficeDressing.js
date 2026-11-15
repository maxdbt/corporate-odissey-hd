import { DEPTH, GAME_HEIGHT } from '../config/constants.js';

// Scenery is authored independently of collision geometry. Rear workstations use
// a chair and a subdued finish; traversable desks retain their bright amber edge.
export default class OfficeDressing {
  constructor(scene, level) {
    this.scene = scene;
    this.foreground = [];
    const floor = GAME_HEIGHT - 64;
    for (const [frame, x, y, height] of level.art?.dressing || []) {
      this.image(frame, x, frame === 'workstation' ? floor : y, height, DEPTH.DECOR - 1)
        .setTint(frame === 'workstation' ? 0xcfc3b4 : 0xe8dbcb);
    }
    // Small document piles tie the active printers / cabinets to the room.
    for (const [type, x, y] of level.enemies || []) {
      if (type === 'copier') this.image('paperClutter', x - 26, y, 20, DEPTH.DECOR + 1);
    }
    // The near layer stays below the playable lane, including while the camera
    // follows a jump. Only its horizontal position has extra parallax.
    for (const [frame, fraction, height, overhang] of [
      ['foregroundPlant', 0.06, 82, 20],
      ['foregroundDesk', 0.60, 67, 22],
      ['foregroundPlant', 1.10, 54, 18]
    ]) {
      const image = this.image(frame, 0, floor + 64, height, DEPTH.WATER + 2);
      this.foreground.push({ image, fraction, height, overhang });
    }
  }

  image(frame, x, y, height, depth) {
    const image = this.scene.add.image(x, y, 'hd-dressing', frame).setOrigin(0.5, 1).setDepth(depth);
    image.setDisplaySize(height * image.frame.realWidth / image.frame.realHeight, height);
    return image;
  }

  update(left, top, width, height) {
    // Keep foreground foliage below the ground line: it must never hide a pit.
    const floor = GAME_HEIGHT - 64;
    for (const item of this.foreground) {
      const drift = ((left * 0.12) % (width * 1.3) + width * 1.3) % (width * 1.3);
      let x = item.fraction * width - drift;
      if (x < -width * 0.20) x += width * 1.3;
      item.image.setPosition(left + x, Math.max(top + height + item.overhang, floor + item.height + 7));
    }
  }
}
