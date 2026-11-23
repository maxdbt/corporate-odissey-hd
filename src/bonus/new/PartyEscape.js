import {Round,clamp,distance,moveCircle,occluded} from './physics.js';
import {PARTY_CAST} from './PartyCast.js';
export const PARTY_ROOM={width:1600,height:900,top:440,bottom:850};
export const PARTY_ITEMS={coat:{x:235,y:615},keys:{x:850,y:815},exit:{x:1480,y:460}};
const remarks=['Solo cinque minuti!','Hai visto la mia mail?','Prima un brindisi!','Facciamo una foto!','Ti presento il direttore.','Un ultimo aggiornamento…'];
export default class PartyEscape extends Round {
 constructor(){
  super();this.hero={x:135,y:745,facing:1,walk:0};this.alert=0;this.coat=false;this.keys=false;this.distractions=4;this.beacon=null;this.hidden=false;this.blocking=0;
  this.tables=[{x:600,y:630,w:100,h:32},{x:940,y:500,w:100,h:30},{x:1180,y:650,w:100,h:32},{x:820,y:757,w:60,h:24,small:true}];
  this.covers=[{x:350,y:575},{x:805,y:735},{x:1260,y:780}];
  this.obstacles=[...this.tables,...this.covers.map(p=>({x:p.x-23,y:p.y-14,w:46,h:28})),{x:0,y:440,w:195,h:115}];
  const homes=[[450,480],[530,495],[590,475],[820,455],[900,480],[1070,455],[1130,490],[1350,480],
   [1400,520],[350,660],[430,600],[510,660],[750,600],[830,570],[945,640],[1040,580],
   [1140,650],[1340,620],[520,770],[680,780],[890,740],[1050,790],[1150,780],[1410,740]];
  this.guards=Array.from({length:24},(_,i)=>{
   const [x,y]=homes[i];
   return {id:i,x,y,home:{x,y},a:i%2?0:Math.PI,kind:PARTY_CAST[i],chaser:i%4===1,director:i%8===4,walk:i,move:false,talking:false,remark:remarks[i%remarks.length]};
  });
  this.message='Cappotto al guardaroba, chiavi al tavolino in fondo: poi la porta a destra.';
 }
 action(){
  if(!this.active||!this.distractions)return false;this.distractions--;
  this.beacon={x:clamp(this.hero.x-this.hero.facing*190,100,1500),y:clamp(this.hero.y-80,470,800),until:this.elapsed+6};
  this.message='Squilla il telefono! I colleghi si voltano: passa adesso.';this.revision++;return true;
 }
 solidMove(person,dx,dy,r=19){
  moveCircle(person,dx,dy,this.obstacles,1600,900,r);
  person.x=clamp(person.x,75,1525);person.y=clamp(person.y,PARTY_ROOM.top+r,PARTY_ROOM.bottom-r);
 }
 step(dt,input){
  const h=this.hero;this.hidden=!!input.shield&&this.covers.some(c=>distance(c,h)<64);
  let seen=false;const activeBeacon=this.beacon&&this.elapsed<this.beacon.until;
  for(const p of this.guards){
   const near=distance(p,h),distracted=activeBeacon&&distance(p,this.beacon)<410;
   let target={x:p.home.x+Math.sin(this.elapsed*.62+p.id*1.7)*88,y:p.home.y+Math.cos(this.elapsed*.49+p.id)*40};
   p.talking=!distracted&&!this.hidden&&near<74;
   if(distracted)target={x:this.beacon.x+Math.cos(p.id)*70,y:this.beacon.y+Math.sin(p.id)*50};
   else if(p.chaser&&!this.hidden&&near<160)target=h;
   const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy),speed=distracted?75:p.chaser&&near<160?65:45;
   const before={x:p.x,y:p.y};
   p.previous={x:p.x,y:p.y,walk:p.walk};
   if(d>(p.talking?44:3)){p.a=Math.atan2(dy,dx);this.solidMove(p,dx/d*speed*dt,dy/d*speed*dt,16);}
   // The crowd cannot walk through the player or collapse into one stacked sprite.
   if(distance(p,h)<35||this.guards.some(o=>o!==p&&distance(o,p)<32)){p.x=before.x;p.y=before.y;}
   const travelled=distance(before,p);p.move=travelled>.03;if(p.move)p.walk+=travelled*12/50;
   if(p.director&&!distracted&&!this.hidden&&near<175&&!occluded(p,h,this.obstacles)){
    const a=Math.atan2(h.y-p.y,h.x-p.x),diff=Math.atan2(Math.sin(a-p.a),Math.cos(a-p.a));if(Math.abs(diff)<.8)seen=true;
   }
  }
  const n=Math.max(1,Math.hypot(input.x||0,input.y||0)),speed=this.hidden?0:155;
  const dx=(input.x||0)*speed*dt/n,dy=(input.y||0)*speed*dt/n,before={x:h.x,y:h.y};
  h.previous={x:h.x,y:h.y,walk:h.walk};
  const collides=()=>this.guards.some(p=>distance(p,h)<35);
  this.solidMove(h,dx,0);if(collides())h.x=before.x;
  const saved=h.y;this.solidMove(h,0,dy);if(collides())h.y=saved;
  const travelled=distance(before,h);this.moving=travelled>.03;if(this.moving){h.walk+=travelled*12/100;if(Math.abs(dx)>.01)h.facing=Math.sign(dx);}
  this.blocking=this.hidden?0:this.guards.filter(p=>distance(p,h)<51&&!(activeBeacon&&distance(p,this.beacon)<410)).length;
  if(this.blocking)this.message=this.guards.find(p=>distance(p,h)<51)?.remark+' · Aggira il gruppo o usa DISTRAI.';
  this.alert=clamp(this.alert+(this.hidden?-38:this.blocking?18+this.blocking*3:seen?9:-24)*dt,0,100);
  if(distance(h,PARTY_ITEMS.coat)<38&&!this.coat){this.coat=true;this.message='Cappotto indossato. Le chiavi sono al tavolino in fondo alla sala.';this.revision++;}
  if(distance(h,PARTY_ITEMS.keys)<38&&!this.keys){this.keys=true;this.message='Chiavi recuperate. Raggiungi la porta a destra!';this.revision++;}
  if(this.alert>=100)this.end(false,'Ti hanno trattenuto per il discorso del direttore. Riprova usando i passaggi liberi.');
  if(this.coat&&this.keys&&distance(h,PARTY_ITEMS.exit)<48)this.end(true,'Cappotto, chiavi e libertà: festa aziendale superata!');
  if(this.elapsed>150)this.end(false,'Troppi convenevoli: il direttore ha ricominciato il discorso.');
 }
}
