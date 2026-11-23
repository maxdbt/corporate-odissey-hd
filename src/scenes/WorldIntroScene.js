import Phaser from 'phaser';
import { GameState } from '../state/GameState.js';
import { audio } from '../systems/Audio8bit.js';
import { introForStage } from '../cinematics/IntroCatalog.js';
import IntroView from '../cinematics/IntroView.js';

// The destination scene has not started: its timers, physics and resources cannot advance.
export default class WorldIntroScene extends Phaser.Scene {
  constructor() { super('WorldIntroScene'); }
  init(data = {}) { this.entry = data; this.finished = false; }
  create() {
    this.intro = introForStage(this.entry.stageId, this.entry.character);
    this.events.once('shutdown', this.cleanup, this);
    if (!this.intro) { this.finish('unavailable'); return; }
    audio.stopMusic();
    audio.setPaused(true, 'world-intro');
    this.view = new IntroView(this.intro, audio, reason => this.finish(reason));
  }
  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    if (!this.entry.preview && this.intro && ['ended', 'skip'].includes(reason)) {
      GameState.seenWorldIntros[this.intro.seenKey] = true;
    }
    this.cleanup();
    this.input.keyboard?.resetKeys();
    if (this.entry.preview) {
      this.scene.resume('MenuScene');
      this.scene.stop();
    } else {
      this.scene.start(this.entry.nextScene || 'MenuScene', this.entry.nextData || {});
    }
  }
  cleanup() {
    this.view?.destroy();
    this.view = null;
    audio.setPaused(false, 'world-intro');
  }
}
