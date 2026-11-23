import { BONUS_BY_ID, BONUS_BY_STAGE, BONUSES_BY_STAGE } from './StageBonusCatalog.js';
import { GameState } from '../state/GameState.js';
import { LEVELS } from '../levels/index.js';
import { DEPTH } from '../config/constants.js';
export function openStageBonus(scene,id){
 const stage=LEVELS[scene.levelIndex]?.id,config=id?BONUS_BY_ID[id]:BONUS_BY_STAGE[stage];
 GameState.stageBonusAttempts||={};
 if(!config||config.stage!==stage||GameState.stageBonusAttempts[config.id]||!scene.scene.isActive()||scene.ended||scene.done)return false;
 if(config.id==='tray'&&scene.canteen&&!scene.canteen.mealComplete())return false;
 if(config.id==='packing'&&!GameState.trip?.items?.length)return false;
 GameState.stageBonusAttempts[config.id]=true;
 scene.player?.body?.setVelocity(0,0);scene.input.keyboard?.resetKeys();scene.inputCtl?.reset?.();scene.scene.pause();
 const key=config.id==='golf'?'DirectorMinigolfScene':config.id==='taxi'?'CityTaxiScene':config.id==='party'?'PartyEscapeScene':'StageBonusScene';
 scene.scene.launch(key,{bonus:config.id,caller:scene.sys.settings.key,levelIndex:scene.levelIndex});scene.scene.bringToTop(key);return true;
}
export default class StageBonusPortal {
 constructor(scene){
  this.scene=scene;this.prevUp=true;this.portals=[];
  for(const config of BONUSES_BY_STAGE[scene.level.id]||[]){
   if(config.x===null)continue;
   const x=config.x,y=scene.level.start[1],hd=scene.textures.exists('hd-world-'+config.atlas);
   const icon=scene.add.image(x,y,hd?'hd-world-'+config.atlas:'terminal',hd?config.frame:undefined).setOrigin(.5,1).setDisplaySize(32,30).setDepth(DEPTH.ITEMS).setInteractive({useHandCursor:true});
   const style={fontFamily:'Segoe UI, Arial',fontSize:'8px',fontStyle:'bold',color:'#ffe3a5',stroke:'#091423',strokeThickness:2};
   const label=scene.add.text(x,y-36,config.title,style).setOrigin(.5,1).setDepth(DEPTH.FX);
   const hint=scene.add.text(x,y-52,'↑ / TOCCA',{...style,color:'#fff'}).setOrigin(.5).setDepth(DEPTH.FX).setVisible(false);
   const portal={config,x,y,icon,label,hint};this.portals.push(portal);
   icon.on('pointerdown',()=>{if(this.near(portal))openStageBonus(scene,config.id);});
  }
 }
 near(portal){const p=this.scene.player;return p&&Math.abs(p.x-portal.x)<90&&Math.abs(p.y-portal.y)<75;}
 update(input){
  for(const p of this.portals){
   const used=GameState.stageBonusAttempts?.[p.config.id],near=this.near(p);
   const locked=p.config.id==='tray'&&this.scene.canteen&&!this.scene.canteen.mealComplete();
   p.icon.setAlpha(used?.35:1);p.label.setText(used?'PAUSA FINITA':p.config.title);
   p.hint.setText(locked?'PRIMA COMPLETA IL PASTO':'↑ / TOCCA').setVisible(!!near&&!used);
   if(near&&input.up&&!this.prevUp)openStageBonus(this.scene,p.config.id);
  }
  this.prevUp=input.up;
 }
}
