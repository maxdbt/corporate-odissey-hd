import Phaser from 'phaser';
import TaxiDrive from '../bonus/new/TaxiDrive.js';
import {CITY_MAP,CITY_WIDTH,CITY_HEIGHT,UNITS_PER_METRE,TAXI_TIME_LIMIT,SIGNALS,TRAFFIC_COUNT,WALKER_COUNT,drivingRoute,streetAt,signalState} from '../bonus/new/TaxiCity.js';
import RomeCityRenderer from '../presentation/RomeCityRenderer.js';
import {BONUS_BY_ID} from '../bonus/StageBonusCatalog.js';
import {awardStageBonus} from '../bonus/StageBonusRewards.js';
import {GameState} from '../state/GameState.js';
import ViewportController from '../presentation/ViewportController.js';
import {toggleFullscreen} from '../systems/Screen.js';
import {audio} from '../systems/Audio8bit.js';

const GOLD=0xf5c665,INK=0x112b38,FONT='Segoe UI, Arial, sans-serif';
export default class CityTaxiScene extends Phaser.Scene {
 constructor(){super('CityTaxiScene');}
 init(data={}){
  this.config=BONUS_BY_ID.taxi;this.preview=!!data.preview;this.caller=data.caller||'DestinationScene';
  this.levelIndex=data.levelIndex;this.phase='intro';this.leaving=false;this.held=new Map();this.ui=[];this.modal=[];
 }
 preload(){
  const base=import.meta.env.BASE_URL+'assets/';
  for(const name of ['buildings','props','pedestrians','eur-buildings'])if(!this.textures.exists('city-'+name))this.load.atlas('city-'+name,base+'hd-city-taxi/'+name+'.png',base+'hd-city-taxi/'+name+'.json');
  if(!this.textures.exists('hd-bonus-vehicles'))this.load.atlas('hd-bonus-vehicles',base+'hd-minigames/vehicles.png',base+'hd-minigames/vehicles.json');
 }
 create(){
  for(const k of ['city-buildings','city-props','city-pedestrians','city-eur-buildings','hd-bonus-vehicles'])this.textures.get(k).setFilter(Phaser.Textures.FilterMode.LINEAR);
  this.round=new TaxiDrive();this.parentScene=this.preview?null:this.scene.get(this.caller);
  this.uiWasActive=this.scene.isActive('UIScene');if(this.uiWasActive){this.scene.pause('UIScene');this.scene.setVisible(false,'UIScene');}
  this.sharedViewport=this.parentScene?.presentation?.viewport||this.parentScene?.hdStage?.viewport;
  this.viewport=this.sharedViewport||new ViewportController(this,{zoom:1});
  this.world=this.add.container();this.world.setDepth(0);this.makeCity();
  this.trafficSprites=this.round.traffic.map((t,i)=>this.art('hd-bonus-vehicles',['car','van','wagon'][i%3],t.x,t.y,24,46));
  this.walkerSprites=this.round.walkers.map((p,i)=>this.art('city-pedestrians','walk0',p.x,p.y,13,25).setTint([0xffffff,0xdce6d4,0xe1d6cd,0xc7ddeb][i%4]));
  this.carShadow=this.add.ellipse(0,0,29,51,0x000000,.28);this.world.add(this.carShadow);
  this.taxi=this.art('hd-bonus-vehicles','taxi',0,0,27,50);this.effects=this.add.graphics();this.world.add(this.effects);
  this.route=[];this.routeAt=null;this.routeStop=-1;
  this.cam={x:this.round.car.x,y:this.round.car.y};this.keys=this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,SPACE');
  this.keyHandler=e=>this.key(e);this.cancel=()=>{this.held.clear();this.input.keyboard.resetKeys();};
  this.blur=()=>{if(this.phase==='play')this.pause();};this.resize=()=>{this.cancel();this.layout();};
  this.input.keyboard.on('keydown',this.keyHandler);this.input.keyboard.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
  this.input.on('pointerup',p=>this.held.delete(p.id));this.input.on('pointerupoutside',this.cancel);this.input.on('gameout',this.cancel);
  this.game.events.on(Phaser.Core.Events.BLUR,this.blur);this.viewport.scene.events.on('presentation-resize',this.resize);
  this.events.once('shutdown',this.cleanup,this);this.layout();
 }
 art(key,frame,x,y,w,h,rotation=0){const o=this.add.image(x,y,key,frame).setDisplaySize(w,h).setRotation(rotation);this.world.add(o);return o;}
 text(text,x,y,size=13,color='#f8efdc',origin=0){return this.add.text(x,y,text,{fontFamily:FONT,fontSize:size,color,stroke:'#11232d',strokeThickness:1}).setOrigin(origin);}
 makeCity(){this.cityRenderer=new RomeCityRenderer(this,this.world);}
 addUI(o){o.setDepth(100);this.ui.push(o);return o;}
 button(label,x,y,w,fn,hold=null,modal=false){
  const c=this.add.container(x,y).setDepth(modal?202:102),h=this.viewport.metrics.touch?43:30;
  const bg=this.add.rectangle(0,0,w,h,INK,.85).setStrokeStyle(1,GOLD,.65).setInteractive({useHandCursor:true});
  c.add([bg,this.text(label,0,0,12,'#ffe3a5',.5)]);
  bg.on('pointerdown',(p,a,b,e)=>{e.stopPropagation();audio.unlock();if(hold&&this.phase==='play')this.held.set(p.id,hold);else fn?.();});
  bg.on('pointerup',p=>this.held.delete(p.id));bg.on('pointerout',p=>this.held.delete(p.id));(modal?this.modal:this.ui).push(c);return c;
 }
 layout(){
  this.w=this.viewport.metrics.width;this.touch=this.viewport.metrics.touch;this.viewport.setupUiCamera(this);
  this.ui.splice(0).forEach(o=>o.destroy());
  this.addUI(this.add.rectangle(0,0,this.w,62,INK,.91).setOrigin(0));
  this.addUI(this.text('L’INDIRIZZO GIUSTO · ROMA EUR',15,9,17,'#ffe4aa'));
  this.objective=this.addUI(this.text('',15,34,12));
  this.stats=this.addUI(this.text('',this.w-96,12,11)).setOrigin(1,0);
  this.button('Ⅱ',this.w-64,20,32,()=>this.pause());this.button('⛶',this.w-23,20,32,toggleFullscreen);
  this.message=this.addUI(this.text('',this.w/2,77,12,'#fff1cb',.5)).setWordWrapWidth(this.touch?this.w-240:this.w-60).setAlign('center').setBackgroundColor('#112b38cc').setPadding(8,4);
  this.minimap=this.addUI(this.add.image(0,0,this.cityRenderer.overviewKey).setOrigin(0));
  this.mapGraphics=this.addUI(this.add.graphics());
  this.button('MAPPA · M',54,this.touch?107:430,92,()=>this.toggleMap());
  this.button(this.preview?'GIOCHI':'TORNA',this.w-46,430,82,()=>this.leave());
  if(this.touch){
   this.button('↶',40,377,59,null,'left');this.button('↷',110,377,59,null,'right');
   this.button('GAS ↑',this.w-42,319,74,null,'up');this.button('FRENO',this.w-42,371,74,null,'brake');
   this.button('RETRO',this.w-126,371,76,null,'down');this.button('ARRIVO',this.w-128,319,80,()=>this.arrive());
  }else{
   this.addUI(this.text('WASD / FRECCE · guida     SPAZIO · freno     E · arrivo',this.w/2,419,11,'#fff4dc',.5)).setBackgroundColor('#112b38cc').setPadding(6,5);
  }
  this.attribution=this.addUI(this.text('© OpenStreetMap contributors · ODbL',this.w/2,449,9,'#f4ebd7',.5)).setOrigin(.5,1).setDepth(210).setBackgroundColor('#112b38e6').setPadding(4,1).setInteractive({useHandCursor:true});
  this.attribution.on('pointerdown',()=>window.open(CITY_MAP.meta.copyrightUrl,'_blank','noopener,noreferrer'));
  this.positionCity(1);this.drawModal();
 }
 key(e){
  if(e.repeat)return;const k=e.key.toLowerCase();if(k==='f'){toggleFullscreen();return;}
  if(k==='m'){this.toggleMap();return;}if(k==='escape'||k==='p'){this.pause();return;}
  if(k==='enter'&&this.phase==='intro'){this.start();return;}
  if(k==='enter'&&this.phase==='paused'){this.pause();return;}
  if(this.phase==='play'&&k==='e')this.arrive();
 }
 controls(){const k=this.keys,h=[...this.held.values()];return {
  x:Number(k.RIGHT.isDown||k.D.isDown||h.includes('right'))-Number(k.LEFT.isDown||k.A.isDown||h.includes('left')),
  y:Number(k.DOWN.isDown||k.S.isDown||h.includes('down'))-Number(k.UP.isDown||k.W.isDown||h.includes('up')),
  shield:k.SPACE.isDown||h.includes('brake')};}
 start(freeRide=false){this.round.freeRide=freeRide;this.phase='play';this.round.paused=false;this.cancel();this.drawModal();}
 arrive(){if(this.phase!=='play')return;const before=this.round.stop;if(this.round.action()){audio.sfx(this.round.won?'perfect':'correct');if(this.round.stop!==before)this.messageAt=this.round.elapsed;}}
 pause(){if(!['play','paused','map'].includes(this.phase))return;this.phase=this.phase==='play'?'paused':'play';this.round.paused=this.phase!=='play';this.cancel();this.drawModal();}
 toggleMap(){if(!['play','map'].includes(this.phase))return;this.phase=this.phase==='map'?'play':'map';this.round.paused=this.phase==='map';this.cancel();this.drawModal();}
 drawModal(){
  this.modal.splice(0).forEach(o=>o.destroy());if(this.phase==='play')return;
  this.modal.push(this.add.rectangle(0,0,this.w,450,0x061923,.88).setOrigin(0).setDepth(200).setInteractive());
  const title=this.phase==='intro'?'Roma EUR, dal laghetto ai grandi viali.':this.phase==='map'?'ROMA · EUR E LAGHETTO':this.phase==='paused'?'PAUSA':this.round.won?'CLIENTE TROVATO':'UN ALTRO TENTATIVO?';
  const heading=this.text(title,this.w/2,92,25,'#ffe1a1',.5).setDepth(201);this.modal.push(heading);
  if(this.phase==='map'){
   const size=Math.min(260*CITY_WIDTH/CITY_HEIGHT,this.w-80),x=this.w/2-size/2,y=119;
   const image=this.add.image(x,y,this.cityRenderer.overviewKey).setOrigin(0).setDisplaySize(size,size*CITY_HEIGHT/CITY_WIDTH).setDepth(201);this.modal.push(image);
   const m=this.add.graphics().setDepth(202);this.modal.push(m);this.drawMap(m,x,y,size,true);
   this.button('TORNA ALLA GUIDA',this.w/2,416,220,()=>this.toggleMap(),null,true);return;
  }
  const body=this.phase==='intro'?`Parti dal laghetto: il cliente ti aspetta al Palazzo dei Congressi.\nMappa OpenStreetMap · ${TRAFFIC_COUNT} veicoli · ${WALKER_COUNT} pedoni animati.\nSegui il percorso dorato. Hai sette minuti.\n\nFrecce / WASD: guida · SPAZIO: freno · E: arrivo\nSu telefono usa i pedali e i pulsanti di sterzo.`:this.phase==='paused'?'Taxi, traffico e appuntamento sono fermi.':this.round.message;
  this.modal.push(this.text(body,this.w/2,200,15,'#e1e9e3',.5).setAlign('center').setWordWrapWidth(this.w-90).setLineSpacing(6).setDepth(201));
  this.button(this.phase==='intro'?'PARTI':this.phase==='paused'?'RIPRENDI':'TORNA',this.w/2,315,230,()=>this.phase==='intro'?this.start():this.phase==='paused'?this.pause():this.leave(),null,true);
  if(this.preview&&this.phase==='intro')this.button('ESPLORA SENZA TIMER',this.w/2,366,230,()=>this.start(true),null,true);
  else if(this.phase==='result')this.button('RIPROVA',this.w/2,366,200,()=>{this.round=new TaxiDrive();this.cam={...this.round.car};this.start();},null,true);
  this.button('ESCI',this.w/2,415,100,()=>this.leave(),null,true);
 }
 positionCity(dt){
  const c=this.round.car,z=this.touch?1.05:1.15,halfX=this.w/(2*z),halfY=450/(2*z);
  const aimX=Phaser.Math.Clamp(c.x+Math.cos(c.angle)*Math.abs(c.speed)*.35,halfX,CITY_WIDTH-halfX),aimY=Phaser.Math.Clamp(c.y+Math.sin(c.angle)*Math.abs(c.speed)*.35,halfY,CITY_HEIGHT-halfY);
  const blend=1-Math.exp(-7*dt);this.cam.x+=(aimX-this.cam.x)*blend;this.cam.y+=(aimY-this.cam.y)*blend;
  this.world.setScale(z).setPosition(this.w/2-this.cam.x*z,240-this.cam.y*z);
  this.cityRenderer.update(this.cam,this.w,480,z);
 }
 drawMap(g,x,y,size,large=false){
  const s=size/CITY_WIDTH,height=CITY_HEIGHT*s;g.lineStyle(1,GOLD,.9).strokeRoundedRect(x-2,y-2,size+4,height+4,3);
  g.lineStyle(large?2.5:1.5,GOLD,.9);if(this.route.length){g.beginPath();this.route.forEach((p,i)=>i?g.lineTo(x+p.x*s,y+p.y*s):g.moveTo(x+p.x*s,y+p.y*s));g.strokePath();}
  for(const l of CITY_MAP.landmarks){g.fillStyle(0xe3c392,.65).fillCircle(x+l.point[0]*s,y+l.point[1]*s,large?2.5:1);
   if(large){const label=this.text(l.name.replace('Palazzo della ','').replace('Palazzo dei ','').replace('Palazzo dello ',''),x+l.point[0]*s,y+l.point[1]*s-7,9,'#fff4d8',.5).setDepth(203);this.modal.push(label);}}
  const d=this.round.destination,c=this.round.car;g.lineStyle(2,GOLD).strokeCircle(x+d.x*s,y+d.y*s,6).fillStyle(GOLD).fillCircle(x+d.x*s,y+d.y*s,3);
  g.fillStyle(0xffffff).fillTriangle(x+c.x*s+Math.cos(c.angle)*6,y+c.y*s+Math.sin(c.angle)*6,x+c.x*s+Math.cos(c.angle+2.4)*4,y+c.y*s+Math.sin(c.angle+2.4)*4,x+c.x*s+Math.cos(c.angle-2.4)*4,y+c.y*s+Math.sin(c.angle-2.4)*4);
 }
 update(_,ms){
  if(!this.round)return;const r=this.round,c=r.car,dt=Math.min(ms/1000,.1);
  if(this.phase==='play'){r.update(dt,this.controls());if(r.finished){this.phase='result';this.cancel();this.drawModal();}}
  if(!this.routeAt||this.routeStop!==r.stop||Math.hypot(c.x-this.routeAt.x,c.y-this.routeAt.y)>110){this.route=drivingRoute(c,r.destination);this.routeAt={x:c.x,y:c.y};this.routeStop=r.stop;}
  this.positionCity(this.phase==='play'?dt:1);
  this.taxi.setPosition(c.x,c.y).setRotation(c.angle+Math.PI/2).setAlpha(r.elapsed-r.hitAt<.35?.55:1);
  this.carShadow.setPosition(c.x+4,c.y+7).setRotation(c.angle+Math.PI/2);
  r.traffic.forEach((t,i)=>this.trafficSprites[i].setPosition(t.x,t.y).setRotation(t.angle+Math.PI/2));
  r.walkers.forEach((p,i)=>this.walkerSprites[i].setPosition(p.x,p.y).setFrame('walk'+Math.floor(p.walk%12)).setRotation(p.angle+Math.PI/2));
  const g=this.effects;g.clear();const dest=r.destination;
  g.lineStyle(3,GOLD,.9).strokeRoundedRect(dest.x-50,dest.y-26,100,52,10).fillStyle(GOLD,.14).fillRoundedRect(dest.x-50,dest.y-26,100,52,10);
  const bob=Math.sin(r.elapsed*3)*5;g.fillStyle(GOLD).fillCircle(dest.x,dest.y-58+bob,14).fillTriangle(dest.x-9,dest.y-50+bob,dest.x+9,dest.y-50+bob,dest.x,dest.y-30+bob).fillStyle(INK).fillCircle(dest.x,dest.y-60+bob,5);
  for(const s of SIGNALS){
   if(Math.abs(s.x-this.cam.x)>this.w/2+120||Math.abs(s.y-this.cam.y)>350)continue;
   const state=signalState(r.elapsed,s.axis,s.offset),px=s.poleX,py=s.poleY;
   g.lineStyle(3,0xeee9d4,.9).lineBetween(s.x+s.nx*s.laneMin,s.y+s.ny*s.laneMin,s.x+s.nx*s.laneMax,s.y+s.ny*s.laneMax);
   g.lineStyle(3,0x59635c).lineBetween(px,py+3,px,py+15);
   g.fillStyle(0x182c2b).fillRoundedRect(px-5,py-12,10,26,3).lineStyle(1,0xc9c4a5,.7).strokeRoundedRect(px-5,py-12,10,26,3);
   for(const [index,colour] of [0xff594d,0xffc75b,0x68f19b].entries()){
    const active=index===(state==='red'?0:state==='amber'?1:2);
    if(active)g.fillStyle(colour,.15).fillCircle(px,py-7+index*8,7);
    g.fillStyle(active?colour:0x35423a).fillCircle(px,py-7+index*8,3);
   }
  }
  if(this.controls().shield&&Math.abs(c.speed)>3){const bx=c.x-Math.cos(c.angle)*27,by=c.y-Math.sin(c.angle)*27;g.fillStyle(0xff573f,.9).fillCircle(bx,by,5);}
  this.objective.setText((r.stop?'NUOVA SEDE · ':'PRIMA TAPPA · ')+dest.name+'  ·  '+Math.round(Math.hypot(dest.x-c.x,dest.y-c.y)/UNITS_PER_METRE)+' m');
  const remaining=Math.max(0,TAXI_TIME_LIMIT-Math.floor(r.elapsed));this.stats.setText((r.freeRide?'GUIDA LIBERA':Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'))+'   '+Math.round(Math.abs(c.speed)*.25)+' km/h   TAXI '+r.health+'%');
  this.message.setText(r.waitingAtLight?'SEMAFORO · Aspetta il verde, poi riparti.':r.message).setVisible(this.phase==='play');this.mapGraphics.clear();
  this.minimap.setVisible(this.phase==='play');if(this.phase==='play'){const size=this.touch?100:145,x=this.touch?this.w-116:17,y=this.touch?90:275;this.minimap.setPosition(x,y).setDisplaySize(size,size*CITY_HEIGHT/CITY_WIDTH);this.drawMap(this.mapGraphics,x,y,size);}
  if(import.meta.env.DEV)this.game.canvas.dataset.cityTaxi=JSON.stringify({phase:this.phase,x:Math.round(c.x),y:Math.round(c.y),camera:{x:Math.round(this.cam.x),y:Math.round(this.cam.y)},speed:Math.round(c.speed),stop:r.stop,health:r.health,elapsed:r.elapsed,paused:r.paused,touch:this.touch,preview:this.preview,traffic:r.traffic.length,pedestrians:r.walkers.length,street:streetAt(c.x,c.y),sectors:this.cityRenderer.cache.size,source:'OpenStreetMap'});
 }
 leave(){
  if(this.leaving)return;this.leaving=true;
  if(!this.preview&&this.round.won)awardStageBonus(GameState,'taxi',this.round.reward());
  if(this.preview){this.scene.start('BonusHubScene');return;}
  if(this.scene.isPaused(this.caller)){this.parentScene.resumedAt=performance.now();this.parentScene.input.keyboard?.resetKeys();this.scene.resume(this.caller);}this.scene.stop();
 }
 cleanup(){
  this.cityRenderer?.destroy();
  this.input.keyboard.off('keydown',this.keyHandler);this.input.off('pointerupoutside',this.cancel);this.input.off('gameout',this.cancel);
  this.game.events.off(Phaser.Core.Events.BLUR,this.blur);this.viewport.scene.events.off('presentation-resize',this.resize);
  if(!this.sharedViewport)this.viewport.destroy();if(this.uiWasActive&&this.scene.isPaused('UIScene')){this.scene.resume('UIScene');this.scene.setVisible(true,'UIScene');}
  delete this.game.canvas.dataset.cityTaxi;
 }
}
