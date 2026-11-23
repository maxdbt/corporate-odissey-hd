import {Round,clamp} from './physics.js';
export default class PedaloEscape extends Round {
 constructor(){super();this.x=450;this.vx=0;this.progress=0;this.energy=100;this.lives=4;this.hitAt=-10;this.bossX=450;this.shield=false;this.drone=null;
  this.rocks=Array.from({length:15},(_,i)=>({x:[450,230,680,350,580][i%5],z:260+i*195,r:42+(i%3)*9}));
 }
 step(dt,input){
  this.shield=!!input.shield&&this.energy>1;const boost=!!input.boost&&this.energy>1&&!this.shield;
  this.energy=clamp(this.energy+(boost?-27:this.shield?-12:13)*dt,0,100);
  const current=Math.sin(this.progress/230)*32;
  this.vx+=((input.x||0)*220+current-this.vx*2.3)*dt;this.x=clamp(this.x+this.vx*dt,35,865);
  this.speed=boost?150:(input.y||0)>0?35:80;this.progress+=this.speed*dt;
  this.bossX+=(this.x-this.bossX)*dt*.65;
  if(!this.drone&&this.progress>900)this.drone={x:this.x,z:this.progress+150,at:this.elapsed+2};
  if(this.drone&&this.elapsed>this.drone.at){
   if(!this.shield&&Math.abs(this.x-this.drone.x)<70)this.hit();
   this.drone={x:this.x,z:this.progress+180,at:this.elapsed+6};
  }
  if(this.rocks.some(r=>Math.abs(r.z-this.progress)<45&&Math.abs(r.x-this.x)<r.r+20))this.hit();
  if(this.progress>1700&&!boost&&!this.shield&&Math.abs(this.x-this.bossX)<28&&Math.sin(this.elapsed*1.1)>.92)this.hit();
  if(this.progress>=3300)this.end(true,'Caletta raggiunta. Qui il lavoro non prende!');
  if(this.elapsed>95)this.end(false,'Il capo ti ha raggiunto prima della caletta.');
 }
 hit(){if(!this.active||this.elapsed-this.hitAt<1.5)return;this.hitAt=this.elapsed;this.lives--;this.vx*=-.5;this.message='Urto! Cambia rotta o apri l’ombrellone contro il drone.';if(this.lives<=0)this.end(false,'Il pedalò deve rientrare al pontile.');}
}
