import { BONUS_BY_STAGE } from './StageBonusCatalog.js';
import { GameState } from '../state/GameState.js';
import { LEVELS } from '../levels/index.js';
import { DEPTH } from '../config/constants.js';

export function openStageBonus(scene) {
  const config = BONUS_BY_STAGE[LEVELS[scene.levelIndex]?.id];
  GameState.stageBonusAttempts ||= {};
  if (!config || GameState.stageBonusAttempts[config.id] || !scene.scene.isActive() || scene.ended || scene.done) return false;
  GameState.stageBonusAttempts[config.id] = true;
  scene.player?.body?.setVelocity(0, 0);
  scene.input.keyboard?.resetKeys(); scene.inputCtl?.reset?.();
  scene.scene.pause();
  scene.scene.launch('StageBonusScene', { bonus: config.id, caller: scene.sys.settings.key, levelIndex: scene.levelIndex });
  scene.scene.bringToTop('StageBonusScene');
  return true;
}

export default class StageBonusPortal {
  constructor(scene) {
    this.scene = scene; this.config = BONUS_BY_STAGE[scene.level.id]; this.prevUp = true;
    if (!this.config) return;
    // Entry platforms are safe in every original level; bosses and mandatory gates stay untouched.
    this.x = Math.min(scene.level.start[0] + 150, 290); this.y = scene.level.start[1];
    const hd = scene.textures.exists('hd-world-' + this.config.atlas);
    this.icon = scene.add.image(this.x, this.y, hd ? 'hd-world-' + this.config.atlas : 'terminal', hd ? this.config.frame : undefined)
      .setOrigin(.5,1).setDisplaySize(32,30).setDepth(DEPTH.ITEMS).setInteractive({useHandCursor:true});
    this.label = scene.add.text(this.x,this.y-34,'BONUS',{fontFamily:'Segoe UI, Arial',fontSize:'7px',fontStyle:'bold',color:'#ffe3a5',stroke:'#091423',strokeThickness:2})
      .setOrigin(.5,1).setDepth(DEPTH.FX);
    this.hint = scene.add.text(this.x,this.y-49,'↑ / TOCCA',{fontFamily:'Segoe UI, Arial',fontSize:'7px',color:'#fff',stroke:'#091423',strokeThickness:2})
      .setOrigin(.5).setDepth(DEPTH.FX).setVisible(false);
    this.icon.on('pointerdown',()=>{if(this.near())openStageBonus(scene);});
  }
  near(){const p=this.scene.player;return p && Math.abs(p.x-this.x)<90 && Math.abs(p.y-this.y)<75;}
  update(input){
    if(!this.config)return;
    const used=GameState.stageBonusAttempts?.[this.config.id],near=this.near();
    this.icon.setAlpha(used ? .35 : 1);this.label.setText(used?'PAUSA FINITA':'BONUS');
    this.hint.setVisible(!!near&&!used);
    if(near&&input.up&&!this.prevUp)openStageBonus(this.scene);
    this.prevUp=input.up;
  }
}
