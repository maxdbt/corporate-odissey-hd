import Phaser from 'phaser';
import {BONUS_BY_ID} from '../bonus/StageBonusCatalog.js';
import {createBonusRound} from '../bonus/new/index.js';
import {PACKING_ITEMS,rotatedCells} from '../bonus/new/PackingPuzzle.js';
import {parkingCells} from '../bonus/new/ParkingPuzzle.js';
import {MEETING_CARDS} from '../bonus/new/MeetingCards.js';
import {clamp,distance} from '../bonus/new/physics.js';
import {GameState} from '../state/GameState.js';
import {awardStageBonus} from '../bonus/StageBonusRewards.js';
import ViewportController from '../presentation/ViewportController.js';
import {preloadAssetPacks,useHdFiltering} from '../presentation/AssetRegistry.js';
import {audio} from '../systems/Audio8bit.js';
import {toggleFullscreen} from '../systems/Screen.js';
import PedaloPresentation, {preloadPedalo} from '../bonus/PedaloPresentation.js';

const GOLD=0xe6c58b,WHITE=0xf7efdf,INK=0x10232d;
const font='Segoe UI, Arial, sans-serif';
export default class StageBonusScene extends Phaser.Scene {
 constructor(key='StageBonusScene'){super(key);}
 init(data={}){this.launchData=data;this.config=BONUS_BY_ID[data.bonus];this.preview=!!data.preview;this.caller=data.caller||'GameScene';this.phase='intro';this.leaving=false;this.sprites=new Map();this.labels=new Map();this.buttons=[];this.modals=[];this.held=new Map();this.hits=[];this.drag=null;this.target=null;this.pedalo=null;}
 preload(){
  if(!this.config||['taxi','party'].includes(this.config.id))return;
  if(this.config.id==='pedalo'){preloadPedalo(this);return;}
  preloadAssetPacks(this,['worldShared','inventory','world-'+this.config.world,...(this.config.id==='party'?['officeMotion','execMotion','motion-ceo']:[]),...(this.config.id==='tray'?['office-support']:[])]);
  const base=import.meta.env.BASE_URL+'assets/hd-minigames/';
  if(['parking','pedalo','taxi'].includes(this.config.id)&&!this.textures.exists('hd-bonus-vehicles'))this.load.atlas('hd-bonus-vehicles',base+'vehicles.png',base+'vehicles.json');
  if(['party','parking','pedalo'].includes(this.config.id)&&!this.textures.exists('hd-bonus-details'))this.load.atlas('hd-bonus-details',base+'details.png',base+'details.json');
  if(this.config.id==='tray'&&!this.textures.exists('hd-bonus-tray'))this.load.atlas('hd-bonus-tray',base+'tray.png',base+'tray.json');
  for(const name of ['parking','cove'])if(!this.textures.exists('hd-bonus-'+name)&&this.config.id===({parking:'parking',cove:'pedalo'}[name]))this.load.image('hd-bonus-'+name,base+name+'.png');
 }
 create(){
  if(!this.config){this.scene.start('BonusHubScene');return;}
  if(this.config.id==='golf'){this.scene.start('DirectorMinigolfScene',this.launchData);return;}
  if(this.config.id==='taxi'){this.scene.start('CityTaxiScene',this.launchData);return;}
  if(this.config.id==='party'&&this.sys.settings.key==='StageBonusScene'){this.scene.start('PartyEscapeScene',this.launchData);return;}
  this.round=createBonusRound(this.config.id);useHdFiltering(this);
  for(const key of ['hd-bonus-vehicles','hd-bonus-details','hd-bonus-tray'])if(this.textures.exists(key))this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  this.parentScene=this.preview?null:this.scene.get(this.caller);this.uiWasActive=this.scene.isActive('UIScene');
  if(this.uiWasActive){this.scene.pause('UIScene');this.scene.setVisible(false,'UIScene');}
  this.sharedViewport=this.parentScene?.presentation?.viewport||this.parentScene?.hdStage?.viewport;
  this.viewport=this.sharedViewport||new ViewportController(this,{zoom:1});
  const backdrop={parking:'hd-bonus-parking',pedalo:'hd-bonus-cove',party:'hd-party-room'}[this.config.id]||'hd-world-'+this.config.world;
  this.background=this.add.image(0,0,backdrop).setOrigin(0).setDepth(-10);
  this.shade=this.add.rectangle(0,0,1,450,0x07141c,this.config.id==='pedalo'?.06:.25).setOrigin(0).setDepth(-9);
  this.hudShade=this.add.rectangle(0,0,1,77,INK,.92).setOrigin(0).setDepth(599);
  this.board=this.add.graphics().setDepth(1);this.overlay=this.add.graphics().setDepth(50);
  this.title=this.add.text(18,12,this.config.title,{fontFamily:font,fontSize:18,fontStyle:'bold',color:'#ffe5af'}).setDepth(600);
  this.status=this.add.text(18,39,'',{fontFamily:font,fontSize:12,color:'#fff2dc'}).setDepth(600);
  this.message=this.add.text(18,59,'',{fontFamily:font,fontSize:10,color:'#bfe1df'}).setDepth(600);
  this.keys=this.input.keyboard?.addKeys('LEFT,RIGHT,UP,DOWN,W,A,S,D,SPACE,E');
  this.onKey=e=>this.key(e);this.onDown=p=>this.pointerDown(p);this.onUp=p=>this.pointerUp(p);this.onCancel=()=>{this.held.clear();this.drag=null;if(this.pedalo)this.pedalo.pointer=null;};
  this.onBlur=()=>{if(this.phase==='play')this.pause();};this.onResize=()=>{this.onCancel();this.layout();};
  this.input.keyboard?.on('keydown',this.onKey);this.input.keyboard?.addCapture(['SPACE','UP','DOWN','LEFT','RIGHT']);
  this.input.on('pointerdown',this.onDown);this.input.on('pointerup',this.onUp);this.input.on('pointerupoutside',this.onCancel);this.input.on('gameout',this.onCancel);
  this.game.events.on(Phaser.Core.Events.BLUR,this.onBlur);this.viewport.scene.events.on('presentation-resize',this.onResize);this.events.once('shutdown',this.cleanup,this);
  if(this.config.id==='pedalo')this.pedalo=new PedaloPresentation(this);
  this.layout();
 }
 button(label,x,y,w,fn,hold=null,modal=false){
  const c=this.add.container(x,y).setDepth(modal?1002:700),h=this.viewport.metrics.touch?50:38;
  const bg=this.add.rectangle(0,0,w,h,INK,.97).setStrokeStyle(1,GOLD,.8).setInteractive({useHandCursor:true});
  const txt=this.add.text(0,0,label,{fontFamily:font,fontSize:12,fontStyle:'bold',color:'#ffe6b3',align:'center'}).setOrigin(.5);
  c.add([bg,txt]);bg.on('pointerdown',(p,a,b,e)=>{e.stopPropagation();audio.unlock();if(hold&&this.phase==='play')this.held.set(p.id,hold);else fn?.();});
  bg.on('pointerup',p=>this.held.delete(p.id));bg.on('pointerout',p=>this.held.delete(p.id));(modal?this.modals:this.buttons).push(c);return c;
 }
 layout(){
  this.w=this.viewport.metrics.width;this.viewport.setupUiCamera(this);this.background.setDisplaySize(this.w,450);this.shade.width=this.w;
  this.hudShade.width=this.w;
  if(this.pedalo){this.pedalo.layout();this.draw();this.drawModal();return;}
  this.s=Math.min((this.w-30)/900,300/480);this.ox=(this.w-900*this.s)/2;this.oy=82;
  this.board.setPosition(this.ox,this.oy).setScale(this.s);this.overlay.setPosition(this.ox,this.oy).setScale(this.s);
  this.title.setFontSize(this.w<750?15:18);this.status.setWordWrapWidth(this.w-36);this.message.setWordWrapWidth(this.w-36);
  this.buttons.splice(0).forEach(o=>o.destroy());
  this.button('Ⅱ',this.w-71,22,36,()=>this.pause());this.button('⛶',this.w-26,22,36,toggleFullscreen);
  this.button(this.preview?'GIOCHI':'TORNA',46,425,80,()=>this.leave(false));
  const id=this.config.id,y=425;
  if(['party','pedalo','tray','taxi'].includes(id)){
   const directional=id==='party'||id==='taxi';
   const labels=directional?[['←','left'],['↓','down'],['↑','up'],['→','right']]:[['←','left'],['→','right']];
   labels.forEach(([label,hold],i)=>this.button(label,119+i*46,y,42,null,hold));
   const primary={party:'DISTRAI',pedalo:'SCATTO',tray:'VELOCE',taxi:'ARRIVO'}[id];
   this.button(primary,this.w-180,y,106,()=>this.round.action?.(),['pedalo','tray'].includes(id)?'boost':null);
   this.button({party:'NASCONDI',pedalo:'OMBRELLO',tray:'RALLENTA',taxi:'FRENO'}[id],this.w-65,y,110,null,'shield');
  }else if(id==='parking')this.button('ANNULLA · Z',this.w-95,y,155,()=>this.round.undo());
  else if(id==='packing'){this.button('RUOTA · R',this.w-240,y,130,()=>this.round.rotate());this.button('CHIUDI VALIGIA',this.w-82,y,155,()=>this.round.close());}
  else this.button('1–6: CARTE · ← →: AGENDA',this.w/2,y,295,()=>{});
  this.draw();this.drawModal();
 }
 image(name,key,frame,x,y,w,h,angle=0,depth=10,alpha=1){
  let im=this.sprites.get(name);if(!im){im=this.add.image(0,0,key,frame);this.sprites.set(name,im);}
  if(im.texture.key!==key||im.frame.name!==frame)im.setTexture(key,frame);
  im.setVisible(true).setPosition(this.ox+x*this.s,this.oy+y*this.s).setDisplaySize(w*this.s,h*this.s).setAngle(angle).setDepth(depth).setAlpha(alpha);return im;
 }
 label(name,text,x,y,size=20,color='#fff0d6',width=0){
  let t=this.labels.get(name);if(!t){t=this.add.text(0,0,'',{fontFamily:font,fontSize:size,color,align:'center',stroke:'#10202a',strokeThickness:1});this.labels.set(name,t);}
  t.setVisible(true).setText(text).setPosition(this.ox+x*this.s,this.oy+y*this.s).setOrigin(.5).setFontSize(size*this.s).setColor(color).setDepth(55);
  if(width)t.setWordWrapWidth(width*this.s);return t;
 }
 rect(x,y,w,h,color=INK,alpha=.9,r=8){this.board.fillStyle(color,alpha).fillRoundedRect(x,y,w,h,r).lineStyle(1,GOLD,.4).strokeRoundedRect(x,y,w,h,r);}
 hit(x,y,w,h,fn){this.hits.push({x,y,w,h,fn});}
 draw(){
  if(!this.round)return;this.hits=[];this.board.clear();this.overlay.clear();for(const im of this.sprites.values())im.setVisible(false);for(const t of this.labels.values())t.setVisible(false);
  this['draw_'+this.config.id]();this.message.setText(this.round.message);
 }
 draw_parking(){
  const r=this.round,g=this.board,cell=70,x0=200,y0=16;
  this.rect(175,0,475,460,0x26333b,.72);this.rect(625,16+r.cars[0].y*70,250,70,0x735d3e,.5);
  for(let x=0;x<=6;x++)g.lineStyle(2,0xd4d1b5,.5).lineBetween(x0+x*cell,y0,x0+x*cell,y0+420);
  for(let y=0;y<=6;y++)g.lineStyle(2,0xd4d1b5,.5).lineBetween(x0,y0+y*cell,x0+420,y0+y*cell);
  const target=r.cars.find(c=>c.id==='you');this.label('exit','USCITA →',744,y0+target.y*cell+35,24);
  for(const [i,c]of r.cars.entries()){
   const horizontal=c.axis==='x',w=(horizontal?c.n:1)*cell,h=(horizontal?1:c.n)*cell,x=x0+c.x*cell,y=y0+c.y*cell;
   if(r.selected===c.id)g.lineStyle(4,GOLD).strokeRoundedRect(x+2,y+2,w-4,h-4,8);
   this.image('car'+c.id,c.n===3?'hd-bonus-details':'hd-bonus-vehicles',c.id==='you'?'car':c.n===3?'bus':['wagon','taxi'][i%2],x+w/2,y+h/2,(horizontal?h:w)-12,(horizontal?w:h)-12,horizontal?90:0);
   this.hit(x,y,w,h,()=>{r.selected=c.id;this.drag={id:c.id,axis:c.axis,start:this.downWorld[c.axis]};});
  }
  this.label('parkingnote','Trascina le auto\nlungo il loro asse',87,200,22,'#e8d4b1',160);
  this.status.setText(`Parcheggio ${r.level+1}/3  ·  Mosse ${r.moves}  ·  Frecce: sposta il veicolo selezionato`);
 }
 draw_packing(){
  const r=this.round,g=this.board,cell=67,x0=340,y0=65;
  this.rect(x0-18,y0-18,7*cell+36,4*cell+36,0x6a422b,.96,25);
  for(let y=0;y<4;y++)for(let x=0;x<7;x++){
   const blocked=r.blocked.some(([a,b])=>a===x&&b===y);
   this.rect(x0+x*cell,y0+y*cell,cell-2,cell-2,blocked?0x342a24:x<3?0x345d65:0x493a2d,.94,4);
   this.hit(x0+x*cell,y0+y*cell,cell,cell,()=>{
    const old=Object.entries(r.placed).find(([id,p])=>rotatedCells(PACKING_ITEMS.find(i=>i.id===id),p.rotation).some(([a,b])=>p.x+a===x&&p.y+b===y));
    if(old){r.selected=old[0];r.rotation=old[1].rotation;r.remove(old[0]);}else r.place(r.selected,x,y);
   });
  }
  PACKING_ITEMS.forEach((item,i)=>{
   const y=28+i*61,placed=r.placed[item.id],selected=r.selected===item.id;
   this.rect(10,y-25,290,55,selected?0x5d533d:INK,.93);
   this.image('item'+item.id,'hd-world-inventory',item.id,43,y,46,46,0,10,placed?.4:1);
   this.label('itemlabel'+i,item.name+(placed?' ✓':''),183,y,20,selected?'#ffe19e':'#fff0d6',220);
   this.hit(10,y-25,290,55,()=>{r.selected=item.id;r.rotation=0;r.revision++;});
   if(placed){const cells=rotatedCells(item,placed.rotation),minX=x0+placed.x*cell,minY=y0+placed.y*cell;
    for(const [a,b]of cells)this.rect(minX+a*cell+3,minY+b*cell+3,cell-8,cell-8,item.kind==='fragile'?0x71a5a5:item.kind==='heavy'?0xb9834c:0x79846a,.75,5);
    const w=(Math.max(...cells.map(c=>c[0]))+1)*cell,h=(Math.max(...cells.map(c=>c[1]))+1)*cell;
    this.image('packed'+item.id,'hd-world-inventory',item.id,minX+w/2,minY+h/2,Math.min(92,w-8),Math.min(92,h-8),placed.rotation*90,20);
   }
  });
  this.label('zone','IMBOTTITO · FRAGILI      |      PESANTI / VESTITI',x0+235,28,18);
  const selected=PACKING_ITEMS.find(i=>i.id===r.selected),shape=rotatedCells(selected,r.rotation);
  shape.forEach(([x,y])=>this.rect(430+x*25,385+y*25,23,23,GOLD,.8,3));
  this.label('shape','Forma da inserire',650,414,20);
  this.status.setText(`Valigia ${r.level+1}/2  ·  ${Object.keys(r.placed).length}/7 oggetti  ·  ${selected.name} · rotazione ${r.rotation*90}°`);
 }
 draw_pedalo(){
  return this.pedalo.draw();
 }
 draw_tray(){
  const r=this.round,g=this.board;
  g.fillStyle(0x152e34,.5).fillPoints([{x:300,y:0},{x:600,y:0},{x:900,y:470},{x:0,y:470}],true);
  for(let i=0;i<12;i++){const q=((r.distance*.015+i/12)%1);const y=q*q*480;g.lineStyle(2,0xe3d0aa,.22).lineBetween(300-y*.62,y,600+y*.62,y);}
  for(const [i,o]of r.obstacles.entries()){
   const ahead=o.z-r.distance;if(ahead<0||ahead>170)continue;
   const t=1-ahead/170,scale=.2+t*.9,lane=o.lane+(o.kind===1?Math.sin(r.elapsed*1.1)*.25:0),x=450+(lane-r.lane)*310*scale,y=30+t*t*290;
   this.image('obstacle'+i,o.kind===1?'hd-office-support':'hd-world-furniture',o.kind===1?'cook'+(Math.floor(r.elapsed*12)%12+1):o.kind===2?'counter':'bench',x,y,150*scale,190*scale,0,10+t*10);
  }
  const cx=450+r.lane*25,cy=360+Math.sin(r.elapsed*r.speed*.12)*2;
  this.image('tray','hd-bonus-tray','tray',cx,cy,600,180,r.tilt*40,30);
  for(const d of r.dishes)if(d.alive)this.image('dish'+d.id,'hd-world-objects',d.id,cx+d.x*235,cy-18+d.y*90,130,90,r.tilt*32,31);
  this.label('destination','TAVOLI →',450,18,23);
  this.status.setText(`Percorso ${Math.min(100,Math.floor(r.distance/8.5))}%  ·  Piatti ${r.dishes.filter(d=>d.alive).length}/3  ·  Caffè ${Math.ceil(r.coffee)}%`);
 }
 draw_call(){
  const r=this.round;
  r.agenda.forEach((a,i)=>{
   const x=12+i*298;this.rect(x,0,282,123,i===r.selected?0x5c5136:INK,.96);
   this.label('agenda'+i,a.name+'\n'+a.progress+'/'+a.goal+'  ·  '+(a.assigned?'Responsabile ✓':'Da assegnare'),x+141,61,25,'#ffe5b6',260);
   this.hit(x,0,282,123,()=>{r.selected=i;});
  });
  MEETING_CARDS.forEach((c,i)=>{
   const x=12+(i%3)*298,y=140+Math.floor(i/3)*156,enabled=r.energy>=c.cost&&r.lastCard!==c.id;
   this.rect(x,y,282,142,enabled?0x224b52:0x232b32,.98);
   this.label('cardtitle'+i,`${i+1}. ${c.name} · ${c.cost} ⚡`,x+141,y+25,24,enabled?'#ffdf9b':'#9aabac',265);
   this.label('cardbody'+i,c.text,x+141,y+87,21,enabled?'#f6eddb':'#9aabac',253);
   this.hit(x,y,282,142,()=>r.play(c.id));
  });
  this.status.setText(`Turno ${r.turn+1}/24  ·  Energia ${r.energy}/5  ·  Pressione ${r.pressure.toFixed(1)}/10  ·  Prossimo: ${r.intention}`);
 }
 worldPoint(pointer){return {x:(pointer.worldX-this.ox)/this.s,y:(pointer.worldY-this.oy)/this.s};}
 pointerDown(p){
  if(this.phase!=='play'||this.round.paused)return;const q=this.worldPoint(p);this.downWorld=q;
  if(this.pedalo){this.pedalo.pointerDown(p);return;}
  const hit=this.hits.find(h=>q.x>=h.x&&q.x<h.x+h.w&&q.y>=h.y&&q.y<h.y+h.h);if(hit){hit.fn();return;}
  if(this.config.id==='party'&&q.x>=0&&q.x<=900&&q.y>=0&&q.y<=480)this.target=q;
 }
 pointerUp(p){
  this.held.delete(p.id);
  if(this.drag&&this.phase==='play'&&!this.round.paused){const q=this.worldPoint(p);this.round.move(this.drag.id,Math.round((q[this.drag.axis]-this.drag.start)/70));}
  this.drag=null;
 }
 key(e){
  if(e.repeat)return;const k=e.key.toLowerCase();
  if(k==='p'||k==='escape'){this.pause();return;}if(k==='f'){toggleFullscreen();return;}
  if(this.phase!=='play'){if(k==='enter'||k===' ')this.modalAction?.();return;}
  const r=this.round,id=this.config.id;
  if(id==='parking'){const c=r.cars.find(c=>c.id===r.selected);if(k==='z')r.undo();else if(c&&['arrowleft','arrowright','arrowup','arrowdown'].includes(k))r.move(c.id,['arrowleft','arrowup'].includes(k)?-1:1);}
  else if(id==='packing'){if(k==='r')r.rotate();else if(k==='enter')r.close();else if(k>='1'&&k<='7'){r.selected=PACKING_ITEMS[+k-1].id;r.rotation=0;}}
  else if(id==='call'){if(k>='1'&&k<='6')r.play(MEETING_CARDS[+k-1].id);else if(k==='arrowleft')r.selected=(r.selected+2)%3;else if(k==='arrowright')r.selected=(r.selected+1)%3;}
  else if(k===' '||k==='enter')r.action?.();
 }
 controls(){
  const k=this.keys,h=[...this.held.values()];let x=Number(k?.RIGHT.isDown||k?.D.isDown||h.includes('right'))-Number(k?.LEFT.isDown||k?.A.isDown||h.includes('left'));
  let y=Number(k?.DOWN.isDown||k?.S.isDown||h.includes('down'))-Number(k?.UP.isDown||k?.W.isDown||h.includes('up'));
  if(x||y)this.target=null;
  if(this.config.id==='party'&&this.target){const p=this.round.hero,d=distance(p,this.target);if(d>8){x=(this.target.x-p.x)/d;y=(this.target.y-p.y)/d;}else this.target=null;}
  const input={x,y,boost:!!k?.SPACE.isDown||h.includes('boost'),shield:!!k?.E.isDown||h.includes('shield')};
  return this.pedalo?this.pedalo.controls(input):input;
 }
 pause(){
  if(this.phase==='intro'||this.phase==='result')return;
  this.onCancel();this.target=null;this.input.keyboard?.resetKeys();
  this.phase=this.phase==='paused'?'play':'paused';this.round.paused=this.phase==='paused';this.drawModal();
 }
 drawModal(){
  if(this.pedalo){this.pedalo.modal();return;}
  this.modals.splice(0).forEach(o=>o.destroy());if(this.phase==='play')return;
  const dim=this.add.rectangle(0,0,this.w,450,0x03111a,.84).setOrigin(0).setDepth(1000).setInteractive();this.modals.push(dim);
  const r=this.round,title=this.phase==='intro'?this.config.title:this.phase==='paused'?'PAUSA':r.won?'OBIETTIVO COMPLETATO':'RIPROVIAMO?';
  const body=this.phase==='intro'?this.config.instructions:this.phase==='paused'?'La partita è ferma.':r.message;
  const t=this.add.text(this.w/2,135,title,{fontFamily:font,fontSize:24,fontStyle:'bold',color:'#ffe2a4',align:'center',wordWrap:{width:this.w-100}}).setOrigin(.5).setDepth(1001);
  const b=this.add.text(this.w/2,218,body,{fontFamily:font,fontSize:16,color:'#f5ecda',align:'center',lineSpacing:7,wordWrap:{width:Math.min(650,this.w-90)}}).setOrigin(.5).setDepth(1001);this.modals.push(t,b);
  this.modalAction=this.phase==='intro'?()=>{this.phase='play';this.input.keyboard?.resetKeys();this.drawModal();}:this.phase==='paused'?()=>this.pause():()=>this.leave(r.won);
  this.button(this.phase==='intro'?'INIZIA':this.phase==='paused'?'RIPRENDI':this.preview?'TUTTI I GIOCHI':'TORNA ALLO STAGE',this.w/2,320,220,this.modalAction,null,true);
  if(this.phase==='result')this.button('RIPROVA',this.w/2,370,150,()=>this.restartRound(),null,true);
  else this.button(this.preview?'TUTTI I GIOCHI':'TORNA ALLO STAGE',this.w/2,374,220,()=>this.leave(false),null,true);
 }
 restartRound(){this.round=createBonusRound(this.config.id);this.phase='play';this.onCancel();this.target=null;this.drawModal();}
 update(_,delta){
  if(!this.round)return;
  if(this.phase==='play'){this.round.update(delta/1000,this.controls());if(this.round.finished){this.phase='result';this.onCancel();audio.sfx(this.round.won?'perfect':'miss');this.drawModal();}}
  this.draw();
  if(import.meta.env.DEV)this.game.canvas.dataset.stageBonus=JSON.stringify({id:this.config.id,phase:this.phase,elapsed:this.round.elapsed,paused:this.round.paused,won:this.round.won,preview:this.preview});
 }
 leave(apply){
  if(this.leaving)return;this.leaving=true;
  if(!this.preview&&apply&&this.round.won)awardStageBonus(GameState,this.config.id,this.round.reward());
  if(this.preview){this.scene.start('BonusHubScene');return;}
  if(this.parentScene?.sys&&this.scene.isPaused(this.caller)){this.parentScene.resumedAt=performance.now();this.parentScene.input.keyboard?.resetKeys();this.parentScene.inputCtl?.reset?.();this.scene.resume(this.caller);}
  this.scene.stop();
 }
 cleanup(){
  this.pedalo?.destroy();
  this.input.keyboard?.off('keydown',this.onKey);this.input.off('pointerdown',this.onDown);this.input.off('pointerup',this.onUp);this.input.off('pointerupoutside',this.onCancel);this.input.off('gameout',this.onCancel);
  this.game.events.off(Phaser.Core.Events.BLUR,this.onBlur);this.viewport?.scene?.events.off('presentation-resize',this.onResize);
  if(!this.sharedViewport)this.viewport?.destroy();
  if(this.uiWasActive&&this.scene.isPaused('UIScene')){this.scene.resume('UIScene');this.scene.setVisible(true,'UIScene');}
  delete this.game.canvas.dataset.stageBonus;
 }
}
