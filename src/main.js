import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY, RENDER_SCALE } from './config/constants.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import WorldIntroScene from './scenes/WorldIntroScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import QuizScene from './scenes/QuizScene.js';
import BriefScene from './scenes/BriefScene.js';
import PauseScene from './scenes/PauseScene.js';
import QuitScene from './scenes/QuitScene.js';
import PackingScene from './scenes/PackingScene.js';
import DestinationScene from './scenes/DestinationScene.js';
import TransportScene from './scenes/TransportScene.js';
import JourneyScene from './scenes/JourneyScene.js';
import RentalScene from './scenes/RentalScene.js';
import FoodScene from './scenes/FoodScene.js';
import NegotiationScene from './scenes/NegotiationScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';
import PartyScene from './scenes/PartyScene.js';
import ElevatorScene from './scenes/ElevatorScene.js';
import StageBonusScene from './scenes/StageBonusScene.js';
import BonusHubScene from './scenes/BonusHubScene.js';
import DirectorMinigolfScene from './scenes/DirectorMinigolfScene.js';
import CityTaxiScene from './scenes/CityTaxiScene.js';
import PartyEscapeScene from './scenes/PartyEscapeScene.js';
import StagePauseScene from './scenes/StagePauseScene.js';
import LastMailScene from './scenes/LastMailScene.js';
import './systems/Screen.js';
import { startPwa } from './systems/Pwa.js';
import { GameAudioDirector } from './audio/GameAudioDirector.js';
import { audio } from './systems/Audio8bit.js';
import { GameState } from './state/GameState.js';

// Render every Text at the canvas scale so it stays crisp under the camera zoom.
const addText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (...args) {
  return addText.apply(this, args).setResolution(RENDER_SCALE);
};

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH * RENDER_SCALE,
  height: GAME_HEIGHT * RENDER_SCALE,
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: GRAVITY }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: { activePointers: 4 },
  scene: [BootScene, MenuScene, WorldIntroScene, BonusHubScene, CityTaxiScene, PartyEscapeScene, GameScene, UIScene, QuizScene, BriefScene, PauseScene, QuitScene, RentalScene, FoodScene, DestinationScene, PackingScene, TransportScene, JourneyScene, NegotiationScene, PartyScene, StageBonusScene, DirectorMinigolfScene, StagePauseScene, LastMailScene, ElevatorScene, GameOverScene, VictoryScene]
};

window.__game = new Phaser.Game(config);
new GameAudioDirector(window.__game, audio, GameState);
window.__game.events.once(Phaser.Core.Events.READY, () => setTimeout(startPwa, 2000));
