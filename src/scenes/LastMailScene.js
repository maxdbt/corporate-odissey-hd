import Phaser from 'phaser';
import { GameState } from '../state/GameState.js';
import { audio } from '../systems/Audio8bit.js';
import { LastMailRound } from '../systems/LastMailRound.js';
import LastMailAudio from '../systems/LastMailAudio.js';
import LastMailView from '../ui/LastMailView.js';

// Phaser owns lifecycle and game progression; a DOM layer provides crisp, responsive HD artwork.
export default class LastMailScene extends Phaser.Scene {
  constructor() { super('LastMailScene'); }

  init({ preview = false } = {}) {
    this.preview = preview;
    this.leaving = false;
    this.applied = false;
  }

  create() {
    this.uiWasActive = this.scene.isActive('UIScene');
    if (this.uiWasActive) {
      this.scene.pause('UIScene');
      this.scene.setVisible(false, 'UIScene');
    }
    audio.stopMusic();
    this.round = new LastMailRound({ stress: this.preview ? 15 : GameState.stress });
    this.foley = new LastMailAudio();
    this.view = new LastMailView(this.round, this.foley, {
      hp: this.preview ? 100 : GameState.hp,
      preview: this.preview,
      onExit: () => this.finish(),
      onRetry: () => this.scene.restart({ preview: true }),
      onReward: (reward) => this.applyReward(reward)
    });
    this.view.checkOrientation();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  update(time, delta) { this.view?.update(delta); }

  applyReward(reward) {
    if (!reward || this.applied || this.preview) return;
    this.applied = true;
    GameState.addStress(reward.stress);
    if (reward.euro) GameState.addBonus('euro', reward.euro);
    if (reward.vacationDays) {
      GameState.vacationDays += reward.vacationDays;
      const gs = this.scene.get('GameScene');
      if (gs?.player?.body) {
        const x = gs.player.x;
        const y = gs.surfaceBelow(x, gs.player.body.bottom - 2);
        GameState.checkpoint = { levelIndex: gs.levelIndex, x, y };
        gs.placeFlag(x, y);
      }
    }
  }

  finish() {
    if (this.leaving) return;
    this.leaving = true;
    if (this.preview) {
      this.scene.start('BonusHubScene');
      return;
    }
    const gs = this.scene.get('GameScene');
    this.scene.resume('GameScene');
    if (this.uiWasActive) {
      this.scene.setVisible(true, 'UIScene');
      this.scene.resume('UIScene');
    }
    gs?.input?.keyboard?.resetKeys();
    gs?.player?.applyStatus('invuln', 1200);
    audio.music('level');
    if (this.round.won) gs?.ui?.message?.('FUORI UFFICIO! +1 FERIE · CHECKPOINT', '#9dffb0', 2200);
    this.scene.stop();
  }

  cleanup() {
    this.view?.destroy(); this.view = null;
    this.foley?.destroy(); this.foley = null;
  }
}
