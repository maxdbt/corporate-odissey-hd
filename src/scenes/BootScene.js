import Phaser from 'phaser';
import { FONT, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { generatePlayers } from '../gfx/players.js';
import { generateEnemies } from '../gfx/enemies.js';
import { generateProjectiles } from '../gfx/projectiles.js';
import { generateItems } from '../gfx/items.js';
import { generateWorld } from '../gfx/world.js';
import { generateCanteen } from '../gfx/canteen.js';
import { generateTrip } from '../gfx/trip.js';
import { generateClients } from '../gfx/clients.js';
import { generateAnims } from '../gfx/anims.js';
import { setupStaticCamera } from '../utils/view.js';
import { preloadHdAssets } from '../presentation/AssetRegistry.js';
import { BONUS_BY_ID } from '../bonus/StageBonusCatalog.js';
import { GameState } from '../state/GameState.js';
import { startLevel } from '../systems/Trip.js';
import { LEVELS } from '../levels/index.js';

// Generates every 8-bit texture and animation in code, then opens the menu.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    setupStaticCamera(this);
    this.loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'CARICAMENTO ASSET HD…', {
      fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '20px', color: '#e8d4ae'
    }).setOrigin(0.5);
    this.load.on('progress', (value) => this.loadingText?.setText('CARICAMENTO HD  ' + Math.round(value * 100) + '%'));
    preloadHdAssets(this);
  }

  create() {
    this.loadingText?.destroy();
    this.loadingText = null;
    setupStaticCamera(this);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'CARICAMENTO...', {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#ffd800', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    // Let the loading text render one frame before the (synchronous) generation work.
    this.time.delayedCall(30, () => {
      generatePlayers(this);
      generateEnemies(this);
      generateProjectiles(this);
      generateItems(this);
      generateWorld(this);
      generateCanteen(this);
      generateTrip(this);
      generateClients(this);
      generateAnims(this);
      const bonus = new URLSearchParams(window.location.search).get('bonus');
      if (bonus === 'toilet') { this.scene.start('ToiletScene', { preview: true }); return; }
      if (BONUS_BY_ID[bonus]) { this.scene.start('StageBonusScene', { bonus, preview: true }); return; }
      if (bonus === 'revenue') { this.scene.start('RevenueScene', { preview: true }); return; }
      if (import.meta.env.DEV) {
        if (new URLSearchParams(window.location.search).has('ending')) { this.scene.start('VictoryScene'); return; }
        const requested = new URLSearchParams(window.location.search).get('level');
        const index = Number(requested);
        if (requested !== null && Number.isInteger(index) && LEVELS[index]) {
          GameState.newGame(new URLSearchParams(window.location.search).get('character') === 'woman' ? 'woman' : 'man');
          startLevel(this, index); return;
        }
      }
      const target = bonus === 'last-mail' ? 'LastMailScene' : bonus === 'beach' ? 'BeachScene' : 'MenuScene';
      this.scene.start(target, { preview: target !== 'MenuScene' });
    });
  }
}
