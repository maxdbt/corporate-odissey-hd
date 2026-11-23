import Phaser from 'phaser';
import TaxiDrive from '../bonus/new/TaxiDrive.js';
import {CITY_SIZE,STREETS,CITY_NAMES,ADDRESSES,ROADWORKS,lightGreen} from '../bonus/new/TaxiCity.js';
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
  for(const name of ['buildings','props','pedestrians'])if(!this.textures.exists('city-'+name))this.load.atlas('city-'+name,base+'hd-city-taxi/'+name+'.png',base+'hd-city-taxi/'+name+'.json');
  if(!this.textures.exists('hd-bonus-vehicles'))this.load.atlas('hd-bonus-vehicles',base+'hd-minigames/vehicles.png',base+'hd-minigames/vehicles.json');
 }
 create(){
  for(const k of ['city-buildings','city-props','city-pedestrians','hd-bonus-vehicles'])this.textures.get(k).setFilter(Phaser.Textures.FilterMode.LINEAR);
  this.round=new TaxiDrive();this.parentScene=this.preview?null:this.scene.get(this.caller);
  this.uiWasActive=this.scene.isActive('UIScene');if(this.uiWasActive){this.scene.pause('UIScene');this.scene.setVisible(false,'UIScene');}
  this.sharedViewport=this.parentScene?.presentation?.viewport||this.parentScene?.hdStage?.viewport;
  this.viewport=this.sharedViewport||new ViewportController(this,{zoom:1});
  this.world=this.add.container();this.world.setDepth(0);this.makeCity();
  this.trafficSprites=this.round.traffic.map((t,i)=>this.art('hd-bonus-vehicles',['car','van','wagon'][i%3],t.x,t.y,32,62));
  this.walkerSprites=this.round.walkers.map((p,i)=>this.art('city-pedestrians','walk0',p.x,p.y,19,36).setTint([0xffffff,0xdce6d4,0xe1d6cd][i%3]));
  this.carShadow=this.add.ellipse(0,0,39,70,0x000000,.28);this.world.add(this.carShadow);
  this.taxi=this.art('hd-bonus-vehicles','taxi',0,0,36,69);this.effects=this.add.graphics();this.world.add(this.effects);
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
 makeTexture(key,color,stone=false){
  if(this.textures.exists(key))return;const t=this.textures.createCanvas(key,128,128),c=t.context;
  c.fillStyle=color;c.fillRect(0,0,128,128);let seed=431;
  for(let i=0;i<1600;i++){seed=(seed*16807)%2147483647;const x=seed%128;seed=(seed*16807)%2147483647;const y=seed%128;
   c.fillStyle=i%2?'rgba(255,255,255,.045)':'rgba(0,0,0,.065)';c.fillRect(x,y,1+(i%3),1);}
  if(stone){c.strokeStyle='rgba(60,50,40,.20)';for(let y=0;y<128;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(128,y);c.stroke();for(let x=(y%64?16:0);x<128;x+=32)c.strokeRect(x,y,32,32);}}
  t.refresh();
 }
 makeCity(){
  this.makeTexture('city-asphalt','#555956');this.makeTexture('city-paving','#c4b9a3',true);
  const paving=this.add.tileSprite(CITY_SIZE/2,CITY_SIZE/2,CITY_SIZE,CITY_SIZE,'city-paving');this.world.add(paving);
  for(const v of STREETS){
   this.world.add(this.add.tileSprite(v,CITY_SIZE/2,164,CITY_SIZE,'city-asphalt'));
   this.world.add(this.add.tileSprite(CITY_SIZE/2,v,CITY_SIZE,164,'city-asphalt'));
  }
  const g=this.add.graphics();this.world.add(g);
  for(const v of STREETS){
   for(let p=25;p<CITY_SIZE;p+=35)if(!STREETS.some(n=>Math.abs(n-p)<105)){
    g.fillStyle(0xf0e3bc,.65).fillRect(v-1,p,2,17).fillRect(p,v-1,17,2);
   }
   for(let n=0;n<3;n++){
    const from=STREETS[n]+100,to=STREETS[n+1]-100;
    g.lineStyle(3,0xe8dcc3,.9).lineBetween(v-84,from,v-84,to).lineBetween(v+84,from,v+84,to)
     .lineBetween(from,v-84,to,v-84).lineBetween(from,v+84,to,v+84);
   }
  }
  for(const x of STREETS)for(const y of STREETS){
   for(let i=0;i<8;i++)for(const side of [-1,1]){
    g.fillStyle(0xf0edda,.8).fillRect(x-65+i*18,y+side*105-14,11,28).fillRect(x+side*105-14,y-65+i*18,28,11);
   }
  }
  for(let col=0;col<3;col++)for(let row=0;row<3;row++){
   const x=STREETS[col]+360,y=STREETS[row]+360,park=col===1&&row===1;
   g.fillStyle(0x383d2d,.16).fillRoundedRect(x-239,y-220,500,480,18);
   const frame=col===0&&row===0||col===2&&row===1?'office':['palazzo','cafe','apartments'][(col+row*2)%3];
   this.art(park?'city-props':'city-buildings',park?'park':frame,x,y,515,515);
   if(!park&&frame==='cafe')this.art('city-props','terrace',x-174,y+235,103,95);
   const plate=this.text(park?'GIARDINI VERDI':col===0&&row===0?'MILANO 12 · RECEPTION':col===2&&row===1?'VERDI 8 · NUOVA SEDE':'',x,y+280,14,'#373c33',.5);this.world.add(plate);
   for(const side of [-1,1])for(let n=0;n<3;n++){
    const tx=x-200+n*200,ty=y+side*272;
    g.fillStyle(0x293a29,.2).fillEllipse(tx+11,ty+13,80,50);this.art('city-props','tree',tx,ty,80,85);
    if(n!==1)this.art('hd-bonus-vehicles',n?'wagon':'car',x+side*265,y-170+n*175,28,54,Math.PI*(side<0?1:0));
   }
   this.art('city-props','busstop',x+90,y+274,110,63);
  }
  for(let i=0;i<4;i++){
   const name=this.text(CITY_NAMES[i],480,STREETS[i]-18,15,'#e5e3d7');this.world.add(name);
  }
  for(const o of ROADWORKS){
   g.fillStyle(0x716046).fillRect(o.x,o.y,o.w,o.h);
   for(let x=o.x;x<o.x+o.w;x+=28){g.fillStyle(0xed9c39).fillTriangle(x,o.y-6,x-6,o.y+8,x+6,o.y+8);g.lineStyle(4,0xf7efe0).lineBetween(x-5,o.y+9,x+8,o.y+25);}
   const sign=this.text('LAVORI',o.x+o.w/2,o.y+25,12,'#fff2c5',.5);this.world.add(sign);
  }
  // Warm late-afternoon atmosphere is in the painted materials; no full-scene blur.
 }
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
  this.addUI(this.text('L’INDIRIZZO GIUSTO',15,9,17,'#ffe4aa'));
  this.objective=this.addUI(this.text('',15,34,12));
  this.stats=this.addUI(this.text('',this.w-96,12,11)).setOrigin(1,0);
  this.button('Ⅱ',this.w-64,20,32,()=>this.pause());this.button('⛶',this.w-23,20,32,toggleFullscreen);
  this.message=this.addUI(this.text('',this.w/2,77,12,'#fff1cb',.5)).setWordWrapWidth(this.touch?this.w-240:this.w-60).setAlign('center').setBackgroundColor('#112b38cc').setPadding(8,4);
  this.mapGraphics=this.addUI(this.add.graphics());
  this.button('MAPPA · M',54,this.touch?107:430,92,()=>this.toggleMap());
  this.button(this.preview?'GIOCHI':'TORNA',this.w-46,430,82,()=>this.leave());
  if(this.touch){
   this.button('↶',40,377,59,null,'left');this.button('↷',110,377,59,null,'right');
   this.button('GAS ↑',this.w-42,319,74,null,'up');this.button('FRENO',this.w-42,371,74,null,'brake');
   this.button('RETRO',this.w-126,371,76,null,'down');this.button('ARRIVO',this.w-128,319,80,()=>this.arrive());
  }else{
   this.addUI(this.text('WASD / FRECCE · guida     SPAZIO · freno     E · arrivo',this.w/2,431,11,'#fff4dc',.5)).setBackgroundColor('#112b38cc').setPadding(6,5);
  }
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
  const title=this.phase==='intro'?'La città è tutta da guidare.':this.phase==='map'?'MAPPA DELLA CITTÀ':this.phase==='paused'?'PAUSA':this.round.won?'CLIENTE TROVATO':'UN ALTRO TENTATIVO?';
  const heading=this.text(title,this.w/2,92,25,'#ffe1a1',.5).setDepth(201);this.modal.push(heading);
  if(this.phase==='map'){
   const m=this.add.graphics().setDepth(201);this.modal.push(m);this.drawMap(m,this.w/2-130,125,260);
   this.button('TORNA ALLA GUIDA',this.w/2,416,220,()=>this.toggleMap(),null,true);return;
  }
  const body=this.phase==='intro'?'Piazza Milano 12: il cliente ti aspetta alla vecchia reception.\nEsplora le strade, segui la minimappa e cerca il civico dorato.\n\nFrecce / WASD: guida · SPAZIO: freno · E: arrivo\nSu telefono usa i pedali e i pulsanti di sterzo.':this.phase==='paused'?'Taxi, traffico e appuntamento sono fermi.':this.round.message;
  this.modal.push(this.text(body,this.w/2,200,15,'#e1e9e3',.5).setAlign('center').setWordWrapWidth(this.w-90).setLineSpacing(6).setDepth(201));
  this.button(this.phase==='intro'?'PARTI':this.phase==='paused'?'RIPRENDI':'TORNA',this.w/2,315,230,()=>this.phase==='intro'?this.start():this.phase==='paused'?this.pause():this.leave(),null,true);
  if(this.preview&&this.phase==='intro')this.button('ESPLORA SENZA TIMER',this.w/2,366,230,()=>this.start(true),null,true);
  else if(this.phase==='result')this.button('RIPROVA',this.w/2,366,200,()=>{this.round=new TaxiDrive();this.cam={...this.round.car};this.start();},null,true);
  this.button('ESCI',this.w/2,415,100,()=>this.leave(),null,true);
 }
 positionCity(dt){
  const c=this.round.car,z=this.touch?.74:.85,halfX=this.w/(2*z),halfY=450/(2*z);
  const aimX=Phaser.Math.Clamp(c.x+Math.cos(c.angle)*Math.abs(c.speed)*.35,halfX,CITY_SIZE-halfX),aimY=Phaser.Math.Clamp(c.y+Math.sin(c.angle)*Math.abs(c.speed)*.35,halfY,CITY_SIZE-halfY);
  const blend=1-Math.exp(-7*dt);this.cam.x+=(aimX-this.cam.x)*blend;this.cam.y+=(aimY-this.cam.y)*blend;
  this.world.setScale(z).setPosition(this.w/2-this.cam.x*z,240-this.cam.y*z);
 }
 drawMap(g,x,y,size){
  const s=size/CITY_SIZE;g.fillStyle(INK,.93).fillRoundedRect(x-7,y-7,size+14,size+14,8).lineStyle(1,GOLD,.8).strokeRoundedRect(x-7,y-7,size+14,size+14,8);
  g.lineStyle(Math.max(2,164*s),0x708781,.9);for(const v of STREETS)g.lineBetween(x+v*s,y,x+v*s,y+size).lineBetween(x,y+v*s,x+size,y+v*s);
  g.fillStyle(0x3c805d).fillRect(x+1010*s,y+1010*s,500*s,500*s);
  const d=this.round.destination,c=this.round.car;g.lineStyle(2,GOLD).strokeCircle(x+d.x*s,y+d.y*s,6).fillStyle(GOLD).fillCircle(x+d.x*s,y+d.y*s,3);
  g.fillStyle(0xffffff).fillTriangle(x+c.x*s+Math.cos(c.angle)*6,y+c.y*s+Math.sin(c.angle)*6,x+c.x*s+Math.cos(c.angle+2.4)*4,y+c.y*s+Math.sin(c.angle+2.4)*4,x+c.x*s+Math.cos(c.angle-2.4)*4,y+c.y*s+Math.sin(c.angle-2.4)*4);
 }
 update(_,ms){
  if(!this.round)return;const r=this.round,c=r.car,dt=Math.min(ms/1000,.1);
  if(this.phase==='play'){r.update(dt,this.controls());if(r.finished){this.phase='result';this.cancel();this.drawModal();}}
  this.positionCity(this.phase==='play'?dt:1);
  this.taxi.setPosition(c.x,c.y).setRotation(c.angle+Math.PI/2).setAlpha(r.elapsed-r.hitAt<.35?.55:1);
  this.carShadow.setPosition(c.x+4,c.y+7).setRotation(c.angle+Math.PI/2);
  r.traffic.forEach((t,i)=>this.trafficSprites[i].setPosition(t.x,t.y).setRotation(t.angle+Math.PI/2));
  r.walkers.forEach((p,i)=>this.walkerSprites[i].setPosition(p.x,p.y).setFrame('walk'+Math.floor(p.walk%12)).setRotation(p.angle+Math.PI/2));
  const g=this.effects;g.clear();const dest=r.destination;
  g.lineStyle(3,GOLD,.9).strokeRoundedRect(dest.x-50,dest.y-26,100,52,10).fillStyle(GOLD,.14).fillRoundedRect(dest.x-50,dest.y-26,100,52,10);
  const bob=Math.sin(r.elapsed*3)*5;g.fillStyle(GOLD).fillCircle(dest.x,dest.y-58+bob,14).fillTriangle(dest.x-9,dest.y-50+bob,dest.x+9,dest.y-50+bob,dest.x,dest.y-30+bob).fillStyle(INK).fillCircle(dest.x,dest.y-60+bob,5);
  for(const x of STREETS)for(const y of STREETS)for(const axis of ['x','y']){
   const px=x+(axis==='x'?-94:94),py=y-94;
   g.fillStyle(0x27332e).fillRoundedRect(px-5,py-11,10,24,3).fillStyle(lightGreen(r.elapsed,axis)?0x6dea95:0xf2745f).fillCircle(px,py+(lightGreen(r.elapsed,axis)?5:-5),3);
  }
  if(this.controls().shield&&Math.abs(c.speed)>3){const bx=c.x-Math.cos(c.angle)*27,by=c.y-Math.sin(c.angle)*27;g.fillStyle(0xff573f,.9).fillCircle(bx,by,5);}
  this.objective.setText((r.stop?'NUOVA SEDE · ':'PRIMA TAPPA · ')+dest.name+'  ·  '+Math.round(Math.hypot(dest.x-c.x,dest.y-c.y)/4)+' m');
  const remaining=Math.max(0,240-Math.floor(r.elapsed));this.stats.setText((r.freeRide?'GUIDA LIBERA':Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'))+'   '+Math.round(Math.abs(c.speed)*.25)+' km/h   TAXI '+r.health+'%');
  this.message.setText(r.message).setVisible(this.phase==='play');this.mapGraphics.clear();
  if(this.phase==='play')this.drawMap(this.mapGraphics,this.touch?this.w-102:17,this.touch?87:287,this.touch?82:115);
  if(import.meta.env.DEV)this.game.canvas.dataset.cityTaxi=JSON.stringify({phase:this.phase,x:Math.round(c.x),y:Math.round(c.y),camera:{x:Math.round(this.cam.x),y:Math.round(this.cam.y)},speed:Math.round(c.speed),stop:r.stop,health:r.health,elapsed:r.elapsed,paused:r.paused,touch:this.touch,preview:this.preview});
 }
 leave(){
  if(this.leaving)return;this.leaving=true;
  if(!this.preview&&this.round.won)awardStageBonus(GameState,'taxi',this.round.reward());
  if(this.preview){this.scene.start('BonusHubScene');return;}
  if(this.scene.isPaused(this.caller)){this.parentScene.resumedAt=performance.now();this.parentScene.input.keyboard?.resetKeys();this.scene.resume(this.caller);}this.scene.stop();
 }
 cleanup(){
  this.input.keyboard.off('keydown',this.keyHandler);this.input.off('pointerupoutside',this.cancel);this.input.off('gameout',this.cancel);
  this.game.events.off(Phaser.Core.Events.BLUR,this.blur);this.viewport.scene.events.off('presentation-resize',this.resize);
  if(!this.sharedViewport)this.viewport.destroy();if(this.uiWasActive&&this.scene.isPaused('UIScene')){this.scene.resume('UIScene');this.scene.setVisible(true,'UIScene');}
  delete this.game.canvas.dataset.cityTaxi;
 }
}
