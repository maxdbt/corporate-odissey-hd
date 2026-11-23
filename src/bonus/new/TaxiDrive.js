import {Round,clamp,distance} from './physics.js';
import {STREETS,ADDRESSES,onCityRoad,lightGreen,createTraffic,createWalkers} from './TaxiCity.js';
export const STREETS_X=STREETS,STREETS_Y=STREETS;
export default class TaxiDrive extends Round {
 constructor({freeRide=false}={}){
  super();this.freeRide=freeRide;this.car={x:210,y:2110,angle:-Math.PI/2,speed:0};this.health=100;this.stop=0;this.hitAt=-5;
  this.destination={...ADDRESSES[0]};this.traffic=createTraffic();this.walkers=createWalkers();this.travelled=0;
  this.message='Il cliente: «Piazza Milano 12, la vecchia reception. Ti aspetto lì».';
 }
 onRoad(x,y){return onCityRoad(x,y,15);}
 action(){
  if(!this.active)return false;
  if(distance(this.car,this.destination)>65||Math.abs(this.car.speed)>22){this.message='Cerca il civico dorato. Accosta e fermati, poi premi E / ARRIVO.';return false;}
  if(!this.stop){this.stop=1;this.destination={...ADDRESSES[1]};this.message='«Scusa, abbiamo traslocato! Via Verdi 8, sotto la pensilina di vetro».';this.revision++;}
  else this.end(true,'Hai trovato il cliente! Parcheggio perfetto, appuntamento salvo.');return true;
 }
 step(dt,input){
  const c=this.car,throttle=clamp(-(input.y||0),-1,1),brake=!!input.shield;
  c.speed=clamp(c.speed+(brake?-c.speed*7:throttle*190-c.speed*.6)*dt,-85,245);
  if(Math.abs(c.speed)<.1)c.speed=0;
  c.angle+=(input.x||0)*2.35*dt*Math.min(1,Math.abs(c.speed)/55)*Math.sign(c.speed||1);
  const dx=Math.cos(c.angle)*c.speed*dt,dy=Math.sin(c.angle)*c.speed*dt,x=c.x+dx,y=c.y+dy;
  const nose={x:x+Math.cos(c.angle)*17,y:y+Math.sin(c.angle)*17};
  if(this.onRoad(x,y)&&onCityRoad(nose.x,nose.y,13)){c.x=x;c.y=y;this.travelled+=Math.hypot(dx,dy);}
  else{if(Math.abs(c.speed)>65)this.hit(7,'Marciapiede o cantiere: rallenta prima della curva.');c.speed*=-.23;}
  for(const t of this.traffic){
   const p=t.path[t.next],dx=p.x-t.x,dy=p.y-t.y,d=Math.hypot(dx,dy);
   if(d<4){t.next=(t.next+1)%4;continue;}
   t.angle=Math.atan2(dy,dx);const horizontal=Math.abs(dx)>Math.abs(dy),axis=horizontal?'x':'y';
   const cross=STREETS.find(v=>{const ahead=(v-(horizontal?t.x:t.y))*Math.sign(horizontal?dx:dy);return ahead>48&&ahead<94;});
   const aheadCar=distance(t,c)<78&&((c.x-t.x)*dx+(c.y-t.y)*dy)>0;
   t.moving=!(cross!==undefined&&!lightGreen(this.elapsed,axis))&&!aheadCar;
   if(t.moving){t.x+=dx/d*Math.min(d,t.speed*dt);t.y+=dy/d*Math.min(d,t.speed*dt);}
   if(distance(c,t)<36&&Math.abs(c.speed)>28){this.hit(10,'Tamponamento: usa il freno e lascia spazio al traffico.');c.speed*=-.15;}
  }
  for(const p of this.walkers){
   const goal=p.path[p.next],dx=goal.x-p.x,dy=goal.y-p.y,d=Math.hypot(dx,dy);
   if(d<3){p.next=(p.next+1)%4;continue;}
   p.angle=Math.atan2(dy,dx);p.x+=dx/d*24*dt;p.y+=dy/d*24*dt;p.walk+=dt*11;
  }
  if(!this.freeRide&&this.elapsed>240)this.end(false,'Appuntamento perso. Riprova oppure esplora la città senza timer.');
 }
 hit(damage,message){if(!this.active||this.elapsed-this.hitAt<1.3)return;this.hitAt=this.elapsed;this.health=Math.max(0,this.health-damage);this.message=message;if(this.health<=0)this.end(false,'Taxi fuori servizio. Rallenta agli incroci e riprova.');}
}
