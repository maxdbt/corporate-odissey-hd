import Phaser from 'phaser';

// Keeps the original Arcade sprite and animation state intact. Only its rendering is replaced.
// Camera filtering, rather than visible=false, preserves the entity's own visibility / hit-flash logic.
export default class ActorSkin {
  constructor(scene, source, resolve) {
    this.scene = scene;
    this.source = source;
    this.resolve = resolve;
    this.phase = 0;
    const spec = resolve(this, 0);
    this.initialScaleX = spec.referenceScaleX ?? (source.scaleX || 1);
    this.initialScaleY = spec.referenceScaleY ?? (source.scaleY || 1);
    this.image = scene.add.image(source.x, source.y, spec.texture, spec.frame);
    if (source.input) {
      this.image.setInteractive({ useHandCursor: true }).on('pointerdown', (...args) => {
        if (source.input?.enabled) source.emit('pointerdown', ...args);
      });
    }
    scene.cameras.main.ignore(source);
    source.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    this.sync(0);
  }

  sync(delta) {
    const s = this.source;
    if (!s?.scene || !this.image?.scene) return;
    const spec = this.resolve(this, delta);
    const v = this.image;
    if (v.texture.key !== spec.texture || v.frame.name !== spec.frame) v.setTexture(spec.texture, spec.frame);
    const frame = v.frame;
    const height = spec.height;
    const width = spec.width ?? height * frame.realWidth / frame.realHeight;
    v.setDisplaySize(width * Math.abs(s.scaleX / this.initialScaleX), height * Math.abs(s.scaleY / this.initialScaleY));
    v.setOrigin(spec.originX ?? s.originX, spec.originY ?? s.originY);
    v.setPosition(s.x + (spec.offsetX || 0), s.y + (spec.offsetY || 0));
    v.setRotation(s.rotation + (spec.rotation || 0)).setFlip(s.flipX, s.flipY);
    v.setAlpha(s.alpha).setVisible(s.visible && s.active).setDepth(s.depth + 0.01);
    if (v.input) v.input.enabled = !!s.input?.enabled;
    if (s.isTinted) {
      if (s.tintFill) v.setTintFill(s.tintTopLeft);
      else v.setTint(s.tintTopLeft, s.tintTopRight, s.tintBottomLeft, s.tintBottomRight);
    } else v.clearTint();
    if (spec.coinSpin) v.scaleX *= 0.35 + 0.65 * Math.abs(Math.cos(this.scene.time.now / 300));
  }

  destroy() {
    this.image?.destroy();
    this.image = null;
    this.source?.off(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    this.source = null;
  }
}
