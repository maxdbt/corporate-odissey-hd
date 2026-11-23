import {Round,clamp,distance} from './physics.js';
import {ADDRESSES,TAXI_SPAWN,TAXI_TIME_LIMIT,onCityRoad,stopAtSignal,createTraffic,createWalkers} from './TaxiCity.js';
export default class TaxiDrive extends Round {
 constructor({freeRide=false}={}){
  super();this.freeRide=freeRide;this.car={...TAXI_SPAWN};this.health=100;this.stop=0;this.hitAt=-5;
  this.destination={...ADDRESSES[0]};this.traffic=createTraffic();this.walkers=createWalkers();this.travelled=0;
  this.message='Il cliente: «Ti aspetto al Palazzo dei Congressi, in Piazza John Kennedy!»';
 }
 onRoad(x,y){return onCityRoad(x,y,11);}
 action(){
  if(!this.active)return false;
  if(distance(this.car,this.destination)>65||Math.abs(this.car.speed)>22){this.message='Cerca il civico dorato. Accosta e fermati, poi premi E / ARRIVO.';return false;}
  if(!this.stop){this.stop=1;this.destination={...ADDRESSES[1]};this.message='«Cambio programma! Palazzo della Civiltà Italiana, sul viale della Civiltà del Lavoro.»';this.revision++;}
  else this.end(true,'Hai trovato il cliente! Parcheggio perfetto, appuntamento salvo.');return true;
 }
 step(dt,input){
  const c=this.car,throttle=clamp(-(input.y||0),-1,1),brake=!!input.shield;
  c.speed=clamp(c.speed+(brake?-c.speed*7:throttle*190-c.speed*.6)*dt,-85,245);
  if(Math.abs(c.speed)<.1)c.speed=0;
  c.angle+=(input.x||0)*2.35*dt*Math.min(1,Math.abs(c.speed)/55)*Math.sign(c.speed||1);
  const dx=Math.cos(c.angle)*c.speed*dt,dy=Math.sin(c.angle)*c.speed*dt;
  const light=stopAtSignal(c,{x:c.x+dx,y:c.y+dy},this.elapsed);
  const x=c.x+dx*light.fraction,y=c.y+dy*light.fraction;this.waitingAtLight=light.signal;
  const nose={x:x+Math.cos(c.angle)*15,y:y+Math.sin(c.angle)*15};
  if(this.onRoad(x,y)&&onCityRoad(nose.x,nose.y,9)){c.x=x;c.y=y;this.travelled+=Math.hypot(dx,dy)*light.fraction;if(light.signal)c.speed=0;}
  else{if(Math.abs(c.speed)>65)this.hit(7,'Marciapiede o vicolo pedonale: rallenta prima della curva.');c.speed*=-.23;}
  for(const t of this.traffic){
   const p=t.path[t.next],dx=p.x-t.x,dy=p.y-t.y,d=Math.hypot(dx,dy);
   if(d<2){t.next=(t.next+1)%t.path.length;continue;}
   const targetAngle=Math.atan2(dy,dx);t.angle+=Math.atan2(Math.sin(targetAngle-t.angle),Math.cos(targetAngle-t.angle))*Math.min(1,dt*9);
   const blockedBy=other=>{const ox=other.x-t.x,oy=other.y-t.y,ahead=(ox*dx+oy*dy)/d,side=Math.abs(ox*dy-oy*dx)/d;return ahead>0&&ahead<62&&side<18;};
   const step=Math.min(d,t.speed*dt),next={x:t.x+dx/d*step,y:t.y+dy/d*step},light=stopAtSignal(t,next,this.elapsed,24);
   t.moving=!blockedBy(c)&&!this.traffic.some(o=>o!==t&&blockedBy(o));
   if(t.moving){t.x+=dx/d*step*light.fraction;t.y+=dy/d*step*light.fraction;if(light.signal)t.moving=false;}
   const ox=c.x-t.x,oy=c.y-t.y;
   if(Math.abs(ox*Math.cos(t.angle)+oy*Math.sin(t.angle))<34&&Math.abs(-ox*Math.sin(t.angle)+oy*Math.cos(t.angle))<18&&Math.abs(c.speed)>28){this.hit(10,'Tamponamento: usa il freno e lascia spazio al traffico.');c.speed*=-.15;}
  }
  for(const p of this.walkers){
   const goal=p.path[p.next],dx=goal.x-p.x,dy=goal.y-p.y,d=Math.hypot(dx,dy);
   if(d<1){p.next=(p.next+1)%p.path.length;continue;}
   const turn=Math.atan2(dy,dx)-p.angle;p.angle+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*8);
   const step=Math.min(d,p.speed*dt);p.x+=dx/d*step;p.y+=dy/d*step;p.walk+=step*.42;
  }
  if(!this.freeRide&&this.elapsed>TAXI_TIME_LIMIT)this.end(false,'Appuntamento perso. Riprova oppure esplora la città senza timer.');
 }
 hit(damage,message){if(!this.active||this.elapsed-this.hitAt<1.3)return;this.hitAt=this.elapsed;this.health=Math.max(0,this.health-damage);this.message=message;if(this.health<=0)this.end(false,'Taxi fuori servizio. Rallenta agli incroci e riprova.');}
}
