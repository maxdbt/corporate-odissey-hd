import Phaser from 'phaser';
import StageBonusScene from './StageBonusScene.js';
import {PARTY_ITEMS,PARTY_ROOM} from '../bonus/new/PartyEscape.js';
import {GameState} from '../state/GameState.js';
import {clamp,distance} from '../bonus/new/physics.js';
import {PARTY_CAST,PARTY_HEROES} from '../bonus/new/PartyCast.js';
import {partyPose,partyFrames} from '../bonus/new/PartyMotion.js';

const ACTORS=[...PARTY_CAST.map(id=>'guest-'+id),...PARTY_HEROES];
const GOLD=0xf3d393;

// The approved plate and transparent actors share one floor coordinate system.
// Common bonus lifecycle owns pause, input, rewards and campaign return.
export default class PartyEscapeScene extends StageBonusScene {
 constructor(){super('PartyEscapeScene');}
 init(data={}){super.init({...data,bonus:'party'});this.roomCamera=null;this.helpText=null;this.meter=null;}
 preload(){
  const base=import.meta.env.BASE_URL+'assets/hd-party-escape/';
  if(!this.textures.exists('hd-party-room'))this.load.image('hd-party-room',base+'room.webp');
  for(const name of ['props',...ACTORS])if(!this.textures.exists('hd-party-'+name))this.load.atlas('hd-party-'+name,base+name+'.webp',base+name+'.json');
  if(!this.cache.json.exists('party-motion'))this.load.json('party-motion',base+'motion.json');
 }
 create(){
  super.create();for(const name of ['room','props',...ACTORS])this.textures.get('hd-party-'+name).setFilter(Phaser.Textures.FilterMode.LINEAR);
 }
 image(name,key,frame,x,y,w,h,angle=0,depth=10,alpha=1){return super.image(name,key,frame,x,y,w,h,angle,depth/10,alpha);}
 layout(){
  super.layout();this.shade.setFillStyle(0x07141c,.015);this.hudShade.height=61;
  this.title.setPosition(15,7).setFontSize(this.w<800?15:18);
  this.status.setPosition(15,30).setFontSize(11);
  this.message.setPosition(15,46).setFontSize(10).setWordWrapWidth(this.w-30);
  if(!this.viewport.metrics.touch)this.buttons.slice(3).forEach(b=>b.setVisible(false));
  if(!this.helpText)this.helpText=this.add.text(0,0,'',{fontFamily:'Segoe UI, Arial',fontSize:10,color:'#fff0d4',backgroundColor:'#10232dcc',padding:{x:8,y:6}}).setOrigin(.5).setDepth(600);
  this.helpText.setText('FRECCE / WASD · muovi     SPAZIO · distrai     E · nasconditi').setPosition(this.w/2,428).setVisible(!this.viewport.metrics.touch);
  if(!this.meter)this.meter=this.add.graphics().setDepth(602);
 }
 pointerDown(p){
  if(this.phase!=='play'||this.round.paused)return;const q=this.worldPoint(p);
  if(q.x>75&&q.x<1525&&q.y>PARTY_ROOM.top&&q.y<PARTY_ROOM.bottom)this.target=q;
 }
 prop(name,frame,x,y,height,depth=y,alpha=1){
  const f=this.textures.getFrame('hd-party-props',frame),w=height*f.realWidth/f.realHeight;
  return this.image(name,'hd-party-props',frame,x,y-height/2,w,height,0,depth,alpha);
 }
 actor(name,atlas,person,height,phase,flip,alpha=1){
  const anchors=this.cache.json.get('party-motion')[atlas];
  // Keep painted silhouettes crisp: blending independently drawn poses creates
  // double faces/limbs. Position still interpolates at the display refresh rate.
  const [first]=partyFrames(phase+.5),anchor=anchors[first.frame-1],h=height*anchor.scale;
  const im=this.image(name,'hd-party-'+atlas,'walk'+first.frame,person.x,person.y,h/2,h,0,person.y+.5,alpha);
  im.setOrigin(flip?1-anchor.x:anchor.x,anchor.y).setPosition(this.ox+person.x*this.s,this.oy+person.y*this.s).setFlipX(flip);
 }
 draw_party(){
  const r=this.round,g=this.board,z=Math.max(this.w/1600,.54),half=this.w/(2*z);
  const aim=clamp(r.hero.x+160,half,1600-half);this.roomCamera=this.roomCamera===null?aim:this.roomCamera+(aim-this.roomCamera)*.12;
  this.s=z;this.ox=this.w/2-this.roomCamera*z;this.oy=450-900*z;
  this.board.setPosition(this.ox,this.oy).setScale(z);this.overlay.setPosition(this.ox,this.oy).setScale(z);
  this.background.setPosition(this.ox,this.oy).setDisplaySize(1600*z,900*z);
  for(const [i,o]of r.tables.entries()){
   const x=o.x+o.w/2,y=o.y+o.h;
   g.fillStyle(0x24160f,.25).fillEllipse(x,y+2,105,28);
   this.prop('table'+i,'table',x,y,o.small?110:174+(y-500)*.08);
  }
  for(const [i,p]of r.covers.entries()){
   g.fillStyle(0x1e140b,.22).fillEllipse(p.x,p.y+2,58,20);
   this.prop('plant'+i,'plant',p.x,p.y,183+(p.y-500)*.08);
  }
  this.prop('sofa-left','sofa',70,924,170,875);
  this.prop('sofa-right','sofa',1500,924,170,875);
  for(const kind of ['coat','keys'])if(!r[kind]){
   const p=PARTY_ITEMS[kind],h=kind==='coat'?148:39,bob=kind==='keys'?-118+Math.sin(r.elapsed*3)*3:0;
   g.lineStyle(2,GOLD,.75).strokeEllipse(p.x,p.y+3,68,22);
   this.prop(kind,kind,p.x,p.y-6+bob,h,p.y);
   this.label(kind+'label',kind==='coat'?'CAPPOTTO':'CHIAVI',p.x,p.y-h-24+bob,16,'#ffe3a2').setDepth(110);
  }
  if(r.coat&&r.keys){const p=PARTY_ITEMS.exit;g.lineStyle(3,GOLD,.75).strokeEllipse(p.x,p.y,80,28);this.label('exit','USCITA →',p.x,p.y-90,22,'#ffe3a2').setDepth(110);}
  let bubbles=0;
  for(const p of [...r.guards].sort((a,b)=>distance(a,r.hero)-distance(b,r.hero))){
   const pose=partyPose(p,r.paused?1:r.accumulator*60),h=194*(.79+(pose.y-440)/1000);
   const breathe=Math.sin(r.elapsed*2+p.id),phase=pose.walk+(p.move?0:breathe*(p.talking?.6:.15));
   g.fillStyle(0x251609,.25).fillEllipse(pose.x,pose.y+2,54,17);
   this.actor('guest'+p.id,'guest-'+p.kind,pose,h+(p.move?0:breathe*1.2),phase,Math.cos(p.a)<0);
   if(p.talking&&!r.hidden&&bubbles<2){
    const t=this.label('speech'+p.id,p.remark,p.x,p.y-h-12,15,'#302316',180);
    t.setDepth(120+bubbles).setBackgroundColor('#fff1dbea').setStroke('#fff1db',0).setPadding(7,4);bubbles++;
   }
  }
  const hero=partyPose(r.hero,r.paused?1:r.accumulator*60),h=194*(.79+(hero.y-440)/1000),phase=hero.walk+(r.moving?0:Math.sin(r.elapsed*2)*.12);
  g.fillStyle(0x241509,.32).fillEllipse(hero.x,hero.y+2,54,17);
  this.actor('hero','hero-'+(GameState.character==='woman'?'woman':'man')+(r.coat?'-coat':''),hero,h,phase,r.hero.facing<0,r.hidden?.5:1);
  this.overlay.fillStyle(GOLD,.95).fillTriangle(r.hero.x-7,r.hero.y-h-12,r.hero.x+7,r.hero.y-h-12,r.hero.x,r.hero.y-h-1).setDepth(115);
  if(r.beacon&&r.elapsed<r.beacon.until){const p=r.beacon;g.lineStyle(3,0x9fddf0,.8).strokeEllipse(p.x,p.y,50+Math.sin(r.elapsed*10)*10,22);this.prop('phone','phone',p.x,p.y,40,p.y+1);}
  const seconds=Math.max(0,Math.ceil(150-r.elapsed)),time=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  this.status.setText(`Cappotto ${r.coat?'✓':'—'}    Chiavi ${r.keys?'✓':'—'}    Trattenuto ${Math.ceil(r.alert)}%    Distrazioni ${r.distractions}    ${time}`);
  if(this.meter){this.meter.clear();if(this.w>900){const x=this.w-260;this.meter.fillStyle(0x20313e).fillRoundedRect(x,13,145,12,6);if(r.alert>0)this.meter.fillStyle(r.alert>65?0xe56c4e:0xcb9b50).fillRect(x+1,14,Math.min(143,r.alert*1.43),10);}}
 }
 update(time,delta){super.update(time,delta);if(import.meta.env.DEV&&this.round)this.game.canvas.dataset.party=JSON.stringify({x:Math.round(this.round.hero.x),y:Math.round(this.round.hero.y),coat:this.round.coat,keys:this.round.keys,guests:this.round.guards.length,unique:new Set(this.round.guards.map(p=>p.kind)).size});}
 cleanup(){delete this.game.canvas.dataset.party;super.cleanup();}
}
