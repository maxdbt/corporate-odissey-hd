import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { LEVELS } from '../levels/index.js';
import { GameState } from '../state/GameState.js';
import { preloadAssetPacks, assetPacksReady, useHdFiltering } from './AssetRegistry.js';
import { THEME_PACKS } from './AssetPacks.js';
import { worldThemes } from './themes/worlds.js';
import ActorSkin from './ActorSkin.js';
import ViewportController from './ViewportController.js';
import { setupStaticCamera } from '../utils/view.js';
import { BONUS_BY_STAGE } from '../bonus/StageBonusCatalog.js';
import { openStageBonus } from '../bonus/StageBonusAccess.js';
import { toggleFullscreen } from '../systems/Screen.js';
import { advanceLocomotion, npcMotionSpec, entityMotionSpec, HERO_FRAME_COUNT } from './MotionCatalog.js';

const enabled=()=>new URLSearchParams(window.location.search).get('graphics')!=='classic';
const font='Segoe UI, Arial, sans-serif';

// An adapter around the existing scenes: their event queues, choices, combat and rewards stay authoritative.
export function installStagePresentation(scene, options={}) {
 const originalPreload=scene.preload,originalCreate=scene.create;
 const theme=()=> (typeof options.world==='function'?options.world(scene):options.world)||LEVELS[scene.levelIndex]?.visualTheme?.replace(/-hd$/,'')||'travel';
 scene.preload=function(){
  originalPreload?.call(this);
  if(enabled())preloadAssetPacks(this,[...(THEME_PACKS[theme()+'-hd']||[]),...(options.extraPacks||[])]);
 };
 for(const name of options.drawMethods||[]){
  const original=scene[name];
  if(!original)continue;
  scene[name]=function(...args){
   const before=new Set(this.children.list);
   const result=original.apply(this,args);
   if(this.hdStage){
    for(const obj of this.children.list)if(!before.has(obj)&&obj.type==='Graphics')obj.setVisible(false);
    for(const keep of options.keepGraphics||[])this[keep]?.setVisible(true);
   }
   return result;
  };
 }
 scene.create=function(){
  const packs=THEME_PACKS[theme()+'-hd'];
  this.hdStage=enabled()&&assetPacksReady(this,packs)?new StaticStagePresentation(this,theme(),options):null;
  originalCreate.call(this);
  this.hdStage?.start();
 };
}

class StaticStagePresentation {
 constructor(scene,world,options){
  this.scene=scene;this.world=world;this.options=options;this.theme=worldThemes[world+'-hd'];this.skins=new Map();
  useHdFiltering(scene);
  const parent=scene.scene.get('GameScene')?.presentation?.viewport;
  this.sharedViewport=parent&&scene.scene.isPaused('GameScene')?parent:null;
  this.viewport=this.sharedViewport||new ViewportController(scene,{zoom:1});
  this.background=scene.add.image(GAME_WIDTH/2,GAME_HEIGHT/2,'hd-world-'+world).setDisplaySize(GAME_WIDTH,GAME_HEIGHT).setDepth(-100);
  this.onPost=(_,delta)=>this.update(delta);
  this.onResize=()=>setupStaticCamera(scene);
 }
 start(){
  const s=this.scene,key=s.sys.settings.key;
  setupStaticCamera(s);
  if(this.options.hideFirstGraphic)s.children.list.find(o=>o.type==='Graphics')?.setVisible(false);
  if(key==='RevenueScene'&&s.ship){
   for(const obj of s.ship.list)obj.setVisible(false);
   const ship=s.add.image(0,0,'hd-world-objects','ship').setDisplaySize(67,43);
   s.ship.add(ship);
  }
  if(key==='JourneyScene'){
   // Match the new side-on cabin; original animation objects still drive expressions and movement.
   const player=s.player; if(player){player.setY(337);s.tweens.killTweensOf(player);}
   if(s.neighbour){s.neighbour.setY(337);s.tweens.killTweensOf(s.neighbour);}
   for(const obj of s.children.list)if(obj.texture?.key.startsWith('pax_')){obj.setY(337);s.tweens.killTweensOf(obj);}
   for(const obj of s.children.list)if(obj.type==='Text'&&obj.text==='WC')obj.setVisible(false);
   s.bubbleAt={x:GAME_WIDTH*.36,y:210};
  }
  const bonus=BONUS_BY_STAGE[LEVELS[s.levelIndex]?.id];
  if(bonus&&this.options.bonus!==false){
   this.bonusButton=s.add.text(GAME_WIDTH-18,GAME_HEIGHT-22,'✦ '+bonus.title,{
    fontFamily:font,fontSize:'12px',fontStyle:'bold',color:'#ffe4a6',backgroundColor:'#102737',padding:{x:12,y:8}
   }).setOrigin(1,.5).setDepth(56).setInteractive({useHandCursor:true}).on('pointerdown',()=>openStageBonus(s));
  }
  if(this.options.chrome!==false)this.fullscreen=s.add.text(GAME_WIDTH-18,54,'⛶',{fontFamily:font,fontSize:'24px',color:'#fff',backgroundColor:'#102737',padding:{x:6,y:2}})
   .setOrigin(1,.5).setDepth(56).setInteractive({useHandCursor:true}).on('pointerdown',toggleFullscreen);
  if(this.options.pause!==false){
   const pause=()=>{
    if(!s.scene.isActive()||performance.now()-(s.resumedAt||0)<250)return;
    s.input.keyboard?.resetKeys();s.scene.pause();s.scene.launch('StagePauseScene',{caller:key});s.scene.bringToTop('StagePauseScene');
   };
   this.pauseKey=ev=>{if(!ev.repeat&&['p','P'].includes(ev.key))pause();};
   s.input.keyboard?.on('keydown',this.pauseKey);
   this.onBlur=pause;s.game.events.on(Phaser.Core.Events.BLUR,this.onBlur);
   s.add.text(GAME_WIDTH-65,54,'Ⅱ',{fontFamily:font,fontSize:'24px',color:'#fff',backgroundColor:'#102737',padding:{x:6,y:2}})
    .setOrigin(1,.5).setDepth(56).setInteractive({useHandCursor:true}).on('pointerdown',pause);
  }
  s.events.on(Phaser.Scenes.Events.POST_UPDATE,this.onPost);
  this.viewport.scene.events.on('presentation-resize',this.onResize);
  s.events.once('shutdown',()=>this.destroy());
  this.update(0);
 }
 resolve(source){
  const key=source.texture?.key;
  if(key?.startsWith('pax_')&&this.scene.textures.exists('hd-world-passengers')){
   return (skin,delta)=>entityMotionSpec(this.scene,source,skin,delta,118)||({texture:'hd-world-passengers',frame:source.texture.key.slice(4).replace(/[12]$/,''),height:118});
  }
  if(key?.startsWith('man_')||key?.startsWith('woman_')){
   const char=key.includes('woman')?'woman':'man';
   return (skin,delta)=>{
    const moving=source.anims?.isPlaying;
    if(moving&&skin)return {texture:'hd-'+(char==='woman'?'wendy':'jack')+'-locomotion',frame:char+'_move'+(advanceLocomotion(skin,source,delta,100,HERO_FRAME_COUNT)+1),height:source===this.scene.player?92:65};
    return {texture:'hd-'+(char==='woman'?'wendy':'jack')+'-motion',frame:char+'_'+(moving?'run'+(Math.floor(this.scene.time.now/90)%8+1):'idle1'),height:source===this.scene.player?92:65};
   };
  }
  if(key==='rev_r'||key==='rev_c'||key==='rev_cx')return()=>({texture:'hd-world-objects',frame:source.texture.key==='rev_r'?'revenue':'cost',height:36,width:36});
  const p=this.theme.props[key],e=this.theme.enemies[key];
  if(p&&this.scene.textures.exists(p[2]||'hd-props'))return(skin,delta)=>entityMotionSpec(this.scene,source,skin,delta,p[1])||({texture:p[2]||'hd-props',frame:p[0],height:p[1],...p[3]});
  if(e)return(skin,delta)=>entityMotionSpec(this.scene,source,skin,delta,e[1])||npcMotionSpec(this.scene,source,skin,delta,e[1])||({texture:e[2]?.texture||'hd-enemies',frame:e[0],height:e[1],...e[2]});
  return null;
 }
 update(delta){
  const s=this.scene;
  const visit=obj=>{
   if(obj.type==='Text'&&!obj.hdStyled){obj.setStyle({fontFamily:font,strokeThickness:Math.min(1.2,obj.style.strokeThickness)}).setResolution(this.viewport.metrics.scale);obj.hdStyled=true;}
   if(obj.type==='Container'){obj.list.forEach(visit);return;}
   if(!obj.texture||obj.texture.key.startsWith('hd-')||this.skins.has(obj))return;
   const resolver=this.resolve(obj);
   if(!resolver)return;
   if(obj.parentContainer){
    // Decorative sprites inside a moving container retain its transform and visibility.
    const spec=resolver();
    // Packing refreshes the original texture on each choice. Keep its original
    // dimensions so repeating that swap cannot shrink an already-HD slot icon.
    obj.hdOriginalSize ||= {w:obj.displayWidth,h:obj.displayHeight};
    const {w,h}=obj.hdOriginalSize;
    obj.setTexture(spec.texture,spec.frame).setDisplaySize(w,h);
   }else this.skins.set(obj,new ActorSkin(s,obj,(skin,delta)=>(this.resolve(obj)||resolver)(skin,delta)));
  };
  [...s.children.list].forEach(visit);
  for(const [source,skin]of this.skins){if(!source.scene||!skin.source){skin.destroy();this.skins.delete(source);}else skin.sync(delta);}
  if(this.bonusButton){const config=BONUS_BY_STAGE[LEVELS[s.levelIndex]?.id];this.bonusButton.setAlpha(GameState.stageBonusAttempts?.[config.id] ? .4 : 1);}
  if(import.meta.env.DEV)s.game.canvas.dataset.staticStage=JSON.stringify({scene:s.sys.settings.key,world:this.world,level:LEVELS[s.levelIndex]?.id,skins:this.skins.size,phase:s.phase||null});
 }
 destroy(){
  const s=this.scene;s.events.off(Phaser.Scenes.Events.POST_UPDATE,this.onPost);
  s.input.keyboard?.off('keydown',this.pauseKey);s.game.events.off(Phaser.Core.Events.BLUR,this.onBlur);
  if(s.scene.isActive('StagePauseScene')&&s.scene.get('StagePauseScene').caller===s.sys.settings.key)s.scene.stop('StagePauseScene');
  this.viewport.scene?.events.off('presentation-resize',this.onResize);
  for(const skin of this.skins.values())skin.destroy();this.skins.clear();
  if(!this.sharedViewport)this.viewport.destroy();
  delete s.game.canvas.dataset.staticStage;s.hdStage=null;
 }
}
