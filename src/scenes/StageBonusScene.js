import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/constants.js';
import { LEVELS } from '../levels/index.js';
import { GameState } from '../state/GameState.js';
import { preloadAssetPacks, useHdFiltering } from '../presentation/AssetRegistry.js';
import ViewportController from '../presentation/ViewportController.js';
import { toggleFullscreen } from '../systems/Screen.js';
import { BONUS_BY_ID, BONUS_BY_STAGE } from '../bonus/StageBonusCatalog.js';
import StageBonusRound from '../bonus/StageBonusRound.js';
import { awardStageBonus } from '../bonus/StageBonusRewards.js';

const font='Segoe UI, Arial, sans-serif';
export default class StageBonusScene extends Phaser.Scene {
 constructor(){super('StageBonusScene');}
 init(data={}){
  this.config=BONUS_BY_ID[data.bonus] || BONUS_BY_STAGE[LEVELS[data.levelIndex]?.id];
  this.caller=data.caller||'GameScene'; this.preview=!!data.preview;this.leaving=false;
  this.phase='intro'; this.control=0; this.nodes=[]; this.lastRevision=-1;
 }
 preload(){if(this.config)preloadAssetPacks(this,['worldShared','world-'+this.config.world]);}
 create(){
  if(!this.config){this.scene.start('MenuScene');return;}
  useHdFiltering(this);
  this.parentScene=this.scene.get(this.caller);
  this.uiWasActive=this.scene.isActive('UIScene');
  if(this.uiWasActive){this.scene.pause('UIScene');this.scene.setVisible(false,'UIScene');}
  this.sharedViewport=this.parentScene?.presentation?.viewport||this.parentScene?.hdStage?.viewport;
  this.viewport=this.sharedViewport||new ViewportController(this,{zoom:1});
  this.round=new StageBonusRound(this.config);
  this.background=this.add.image(0,0,'hd-world-'+this.config.world).setOrigin(0).setDepth(-10);
  this.shade=this.add.rectangle(0,0,1,GAME_HEIGHT,0x061322,.28).setOrigin(0).setDepth(-9);
  this.panel=this.add.graphics();
  this.hud=this.add.text(20,16,'',{fontFamily:font,fontSize:'15px',fontStyle:'bold',color:'#fff'}).setDepth(20);
  this.status=this.add.text(0,74,'',{fontFamily:font,fontSize:'15px',color:'#fff',align:'center'}).setOrigin(.5,0).setDepth(20);
  this.info=this.add.text(0,109,'',{fontFamily:font,fontSize:'15px',color:'#e9e8dc',align:'center',wordWrap:{width:600}}).setOrigin(.5,0).setDepth(20);
  this.object=this.add.image(0,0,'hd-world-'+this.config.atlas,this.config.frame).setDepth(3);
  this.hero=this.add.image(0,401,'hd-'+(GameState.character==='woman'?'wendy':'jack')+'-motion',(GameState.character||'man')+'_idle1').setOrigin(.5,1).setDisplaySize(100,120).setDepth(2);
  this.diagram=this.add.graphics().setDepth(4);
  this.pauseButton=this.button('Ⅱ',()=>this.togglePause(),52);
  this.fullButton=this.button('⛶',()=>toggleFullscreen(),52);
  this.leaveButton=this.button('TORNA',()=>this.leave(false),74);
  this.layout();
  this.onResize=()=>{this.layout();this.lastRevision=-1;if(this.phase!=='play'||this.round.paused)this.drawCard();};
  this.viewport.scene.events.on('presentation-resize',this.onResize);
  this.keys=this.input.keyboard?.addKeys('LEFT,RIGHT,UP,DOWN');
  this.onKey=ev=>{
   if(ev.repeat)return;
   if(ev.key==='p'||ev.key==='P'||ev.key==='Escape'){this.togglePause();return;}
   if(ev.key==='f'||ev.key==='F'){toggleFullscreen();return;}
   if(this.phase!=='play'){if(['Enter',' '].includes(ev.key))this.advance();return;}
   if(this.round.paused){if(['Enter',' '].includes(ev.key))this.advance();return;}
   if(this.time.now<(this.acceptActionsAt||0))return;
   if(ev.key>='1'&&ev.key<='9')this.round.act(+ev.key-1);
   else if(['Enter',' '].includes(ev.key))this.round.act(['route','circuit','valves'].includes(this.config.mode)?3:0);
  };
  this.input.keyboard?.on('keydown',this.onKey);
  this.input.on('pointerup',()=>{this.control=0;});
  this.input.on('gameout',()=>{this.control=0;});
  this.onBlur=()=>{if(this.phase==='play'&&!this.round.paused)this.togglePause();};
  this.game.events.on(Phaser.Core.Events.BLUR,this.onBlur);
  this.events.once('shutdown',this.cleanup,this);
  this.drawCard();
 }
 text(x,y,value,size=14,color='#fff'){
  return this.add.text(x,y,value,{fontFamily:font,fontSize:size+'px',fontStyle:'600',color,align:'center'}).setOrigin(.5).setDepth(12);
 }
 button(label,fn,width=180){
  const c=this.add.container(0,0).setDepth(30);
  const touch=this.viewport.metrics.touch;
  const bg=this.add.rectangle(0,0,width,touch?52:38,0x173444,.95).setStrokeStyle(1.5,0xc5ab73).setInteractive({useHandCursor:true});
  const txt=this.text(0,0,label,touch?14:13).setWordWrapWidth(width-12); c.add([bg,txt]);bg.on('pointerdown',()=>fn());return c;
 }
 layout(){
  this.w=this.viewport.metrics.width;this.viewport.setupUiCamera(this);
  this.background.setDisplaySize(this.w,GAME_HEIGHT);this.shade.width=this.w;
  this.hero.x=Math.max(52,this.w/2-345);
  this.pauseButton.setPosition(this.w-111,24);this.fullButton.setPosition(this.w-54,24);
  this.leaveButton.setPosition(48,425);
  this.status.x=this.w/2;this.info.x=this.w/2;
  this.hud.setWordWrapWidth(this.w-180);
  this.panel.clear().fillStyle(0x081825,.93).fillRect(0,0,this.w,52)
   .fillStyle(0x071727,.88).fillRoundedRect(Math.max(20,this.w/2-310),94,Math.min(620,this.w-40),295,16)
   .lineStyle(1,0xbca77c,.7).strokeRoundedRect(Math.max(20,this.w/2-310),94,Math.min(620,this.w-40),295,16);
  this.object.setPosition(this.w/2,243).setDisplaySize(150,110);
 }
 clearNodes(){this.nodes.forEach(n=>n.destroy());this.nodes=[];this.diagram.clear();}
 addButton(label,x,y,fn,width){const b=this.button(label,fn,width);b.setPosition(x,y);this.nodes.push(b);return b;}
 drawCard(){
  this.clearNodes();this.object.setVisible(true).setPosition(this.w/2,222).setDisplaySize(130,100);
  const won=this.round.won,r=this.round.reward();
  this.status.setText(this.phase==='intro'?'UNA PAUSA DAL LAVORO':this.round.paused?'PAUSA':won?'PROVA SUPERATA':'IL LAVORO PUÒ ASPETTARE');
  this.info.setText(this.phase==='intro'?this.config.instructions:
   this.round.paused?'Il tempo è fermo. Riprendi quando vuoi.':
   (won?'Salute +'+r.hp+' · Stress −'+r.stress+' · Bonus '+r.euro+' €':'Nessuna penalità: puoi continuare il livello.'));
  this.info.setWordWrapWidth(Math.min(560,this.w-100));
  this.nodes.push(this.text(this.w/2,306,this.phase==='intro'?'Premio: +10 salute · −10 stress · +15 €':this.preview?'ANTEPRIMA · nessun premio alla campagna':'',13,'#ebd19c'));
  this.addButton(this.phase==='intro'?'INIZIA':this.round.paused?'RIPRENDI':'CONTINUA',this.w/2,351,()=>this.advance(),200);
 }
 advance(){
  if(this.phase==='intro'){this.phase='play';this.acceptActionsAt=this.time.now+220;this.lastRevision=-1;this.control=0;this.input.keyboard?.resetKeys();}
  else if(this.round.paused)this.togglePause();
  else if(this.phase==='result')this.leave(true);
 }
 togglePause(){
  if(this.phase!=='play')return;
  this.round.paused=!this.round.paused;this.control=0;this.input.keyboard?.resetKeys();
  if(this.round.paused)this.drawCard();else this.lastRevision=-1;
 }
 drawPlay(){
  this.clearNodes();const r=this.round,c=this.config,cx=this.w/2;
  this.info.setText(r.prompt|| (c.id==='coffee'?'Compensa la turbolenza annunciata':'Tieni il vassoio in equilibrio'));
  this.info.setWordWrapWidth(Math.min(560,this.w-80));
  this.status.setText('');
  this.object.setVisible(['balance','golf','flight','rhythm'].includes(c.mode));
  if(c.mode==='rhythm')this.object.setPosition(cx,198).setDisplaySize(66,83);
  if(c.mode==='choices'){
   r.options.forEach((label,i)=>{
    const x=cx+(i-1)*185;
    if(c.id==='luggage'){const bag=this.add.image(x,230,'hd-world-objects','bag').setDisplaySize(90,80).setDepth(10);this.nodes.push(bag);}
    this.addButton((i+1)+'. '+label,x,c.id==='luggage'?309:270,()=>r.act(i),175);
   });
  } else if(c.mode==='memory'){
   const count=c.id==='mirage'?9:4;
   for(let i=0;i<count;i++){
    const cols=c.id==='mirage'?3:4,x=cx+(i%cols-(cols-1)/2)*116,y=c.id==='mirage'?208+Math.floor(i/cols)*52:264;
    this.addButton(c.id==='mirage'?String(i+1):['SALUTO','OK','STOP','BRAVO'][i],x,y,()=>r.act(i),102);
    if(c.id==='gestures'){
     const actor=this.add.image(x,226,'hd-characters',(GameState.character||'man')+'_'+['idle','jump','hurt','walk1'][i])
      .setOrigin(.5,1).setDisplaySize(65,87).setDepth(10);this.nodes.push(actor);
    }
   }
  } else if(c.mode==='signals'){
   for(let i=0;i<6;i++){
    const x=cx+(i%3-1)*150,y=212+Math.floor(i/3)*101;
    const im=this.add.image(x,y,'hd-world-objects','phone').setDisplaySize(30,48).setDepth(11);this.nodes.push(im);
    this.addButton(String(i+1),x,y+36,()=>r.act(i),94);
   }
  } else if(['route','circuit','valves'].includes(c.mode)){
   r.switches.forEach((v,i)=>{
    const x=cx+(i-1)*150;
    this.nodes.push(this.text(x,192,c.mode==='valves'?'OBIETTIVO '+r.target[i]:c.mode==='route'?'BINARIO '+(r.target[i]+1):'ORIZZONTALE',12,'#f4cf82'));
    this.addButton(c.mode==='valves'?String(v):['━','╱','╲'][v],x,264,()=>r.act(i),112);
    if(c.mode==='valves'){
     const valve=this.add.image(x,225,'hd-world-equipment','valve').setDisplaySize(55,55).setAngle(v*72).setDepth(10);this.nodes.push(valve);
    }
   });
   this.addButton(c.mode==='route'?'PARTENZA':c.mode==='circuit'?'ACCENDI':'CONNETTI',cx,344,()=>r.act(3),210);
  } else if(c.mode==='rhythm'||c.mode==='golf'){
   this.addButton(c.mode==='rhythm'?'PARLA':'TIRA',cx,345,()=>r.act(),180);
  }
  if(c.mode==='balance'||c.mode==='flight'){
   const vertical=c.mode==='flight';
   [[-1,vertical?'↑':'←'],[1,vertical?'↓':'→']].forEach(([dir,label],i)=>{
    const b=this.addButton(label,cx+(i?130:-130),350,()=>{},90);
    b.list[0].on('pointerdown',()=>{this.control=dir;});
    b.list[0].on('pointerup',()=>{this.control=0;});
    b.list[0].on('pointerout',()=>{this.control=0;});
    // These are the sole bonus controls; no platform attack/jump overlay is shown.
   });
  }
  this.lastRevision=r.revision;
 }
 update(_,delta){
  if(!this.round)return;
  const r=this.round,c=this.config,cx=this.w/2;
  if(this.phase==='play'&&!r.paused){
   const control=this.control|| (c.mode==='flight'?(this.keys?.DOWN.isDown?1:0)-(this.keys?.UP.isDown?1:0):(this.keys?.RIGHT.isDown?1:0)-(this.keys?.LEFT.isDown?1:0));
   r.update(delta/1000,control);
   if(r.finished){this.phase='result';this.drawCard();}
   else{
    if(this.lastRevision!==r.revision)this.drawPlay();
    this.diagram.clear();
    if(c.mode==='balance'){
     this.object.setPosition(cx+r.tilt*60,240).setAngle(r.tilt*24).setDisplaySize(c.id==='tray'?240:100,c.id==='tray'?85:100);
     this.diagram.lineStyle(4,0x395569).lineBetween(cx-150,298,cx+150,298).lineStyle(8,0x7ee0b4).lineBetween(cx-60,298,cx+60,298)
      .fillStyle(0xffd27c).fillCircle(cx+r.tilt*150,298,7);
     this.status.setText((r.wind>0?'SCOSSA A DESTRA →':'← SCOSSA A SINISTRA')+' · '+r.score+'/'+c.goal+' s');
    } else if(c.mode==='rhythm'||c.mode==='golf'){
     const value=c.mode==='rhythm'?r.phase:r.power,a=c.mode==='rhythm'?.60:r.targetPower-.105,b=c.mode==='rhythm'?.85:r.targetPower+.105;
     this.diagram.fillStyle(0x31495e).fillRoundedRect(cx-240,250,480,24,8).fillStyle(0x6cd7a9).fillRect(cx-240+a*480,250,(b-a)*480,24)
      .fillStyle(0xffe2a1).fillCircle(cx-240+value*480,262,9);
     if(c.mode==='golf')this.object.setPosition(cx+180,192).setDisplaySize(100,65);
     if(c.mode==='golf'&&r.lastShot&&r.elapsed-r.lastShot.at<1.1){
      const t=(r.elapsed-r.lastShot.at)/1.1,range=r.lastShot.hit?380:Math.max(120,520*r.lastShot.power);
      this.diagram.fillStyle(0xf7efda).fillCircle(cx-200+t*range,205-Math.sin(t*Math.PI)*95,7);
     }
    } else if(c.mode==='signals'){
     const x=cx+(r.answer%3-1)*150,y=212+Math.floor(r.answer/3)*101;
     this.diagram.lineStyle(3,0xffd77a,.5+Math.sin(r.elapsed*18)*.4).strokeCircle(x,y,33);
    } else if(c.mode==='memory'){
     const showing=r.elapsed<r.showUntil,seq=r.sequence;
     this.status.setText(showing?'OSSERVA: '+seq.map(i=>i+1).join(' → '):'RIPETI · '+r.cursor+'/'+seq.length);
     if(showing){const i=seq[Math.min(seq.length-1,Math.floor((2.4-(r.showUntil-r.elapsed))/2.4*seq.length))],cols=c.id==='mirage'?3:4;
      const x=cx+(i%cols-(cols-1)/2)*116,y=c.id==='mirage'?208+Math.floor(i/cols)*52:264;
      this.diagram.lineStyle(4,0xffd47d).strokeRoundedRect(x-54,y-22,108,44,7);}
    } else if(c.mode==='flight'){
     const x=cx-240+r.gateX*480,y=165+r.gate*135;
     this.diagram.lineStyle(7,0xffdb8d).strokeEllipse(x,y,30,70);
     this.object.setPosition(cx-154,165+r.position*135).setDisplaySize(90,48);
    } else if(['route','circuit','valves'].includes(c.mode)){
     this.status.setText('Mosse disponibili: '+r.moves);
     r.switches.forEach((v,i)=>{
      const x=cx+(i-1)*150,correct=v===r.target[i];
      this.diagram.lineStyle(5,correct?0x7cdcb2:0xb68c62).lineBetween(x-60,307,x+60,307+(c.mode==='route'?(v-r.target[i])*8:0));
     });
    }
   }
  }
  this.hud.setText(c.title+'\n'+Math.max(0,Math.ceil(c.duration-r.elapsed))+' s  ·  '+r.score+'/'+c.goal+'  ·  '+ '♥'.repeat(Math.max(0,r.lives)));
  if(import.meta.env.DEV)this.game.canvas.dataset.stageBonus=JSON.stringify({id:c.id,phase:this.phase,elapsed:r.elapsed,paused:r.paused,score:r.score,lives:r.lives,preview:this.preview});
 }
 leave(apply){
  if(this.leaving)return;this.leaving=true;
  if(!this.preview&&apply)awardStageBonus(GameState,this.config.id,this.round.reward());
  if(this.preview){this.scene.start('MenuScene');return;}
  const parent=this.parentScene;
  if(parent?.sys&&this.scene.isPaused(this.caller)){
   parent.resumedAt=performance.now();parent.input.keyboard?.resetKeys();parent.inputCtl?.reset?.();
   this.scene.resume(this.caller);
  }
  this.scene.stop();
 }
 cleanup(){
  this.input.keyboard?.off('keydown',this.onKey);
  this.game.events.off(Phaser.Core.Events.BLUR,this.onBlur);
  this.viewport?.scene?.events.off('presentation-resize',this.onResize);
  if(!this.sharedViewport)this.viewport?.destroy();
  if(this.uiWasActive&&this.scene.isPaused('UIScene')){this.scene.resume('UIScene');this.scene.setVisible(true,'UIScene');}
  delete this.game.canvas.dataset.stageBonus;
 }
}
