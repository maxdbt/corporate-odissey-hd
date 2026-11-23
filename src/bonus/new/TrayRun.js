import {Round,clamp} from './physics.js';
export default class TrayRun extends Round {
 constructor(){super();this.distance=0;this.lane=0;this.velocity=0;this.speed=30;this.coffee=100;this.tilt=0;
  this.dishes=[{id:'pasta',x:-.45,y:0,v:0,alive:true},{id:'salad',x:.45,y:0,v:0,alive:true},{id:'coffee',x:0,y:-.3,v:0,alive:true}];
  this.obstacles=Array.from({length:12},(_,i)=>({z:75+i*65,lane:[0,-.7,.7,-.5,.5][i%5],kind:i%3,passed:false}));
 }
 step(dt,input){
  const before=this.velocity;this.velocity+=((input.x||0)*2.4-this.velocity*4)*dt;
  this.lane=clamp(this.lane+this.velocity*dt,-1,1);this.tilt=this.velocity*.18;
  const next=input.shield?12:input.boost?53:30,accel=(next-this.speed)*3;this.speed+=accel*dt;
  this.distance+=this.speed*dt;const sideways=(this.velocity-before)/dt;
  for(const d of this.dishes)if(d.alive){d.v+=(-sideways*.22-this.tilt*.7-d.v*1.4)*dt;d.x+=d.v*dt;if(Math.abs(d.x)>1.05)d.alive=false;}
  this.coffee=clamp(this.coffee-(Math.abs(sideways)*.65+Math.max(0,Math.abs(accel)-30)*.007)*dt,0,100);
  for(const o of this.obstacles){
   const lane=o.lane+(o.kind===1?Math.sin(this.elapsed*1.1)*.25:0);
   if(!o.passed&&this.distance>=o.z){o.passed=true;if(Math.abs(this.lane-lane)<.38){this.coffee=Math.max(0,this.coffee-23);this.dishes.forEach(d=>d.v+=(this.lane>=lane?.48:-.48));this.message='Urto: rallenta e bilancia il vassoio!';}}
  }
  const plates=this.dishes.filter(d=>d.alive).length;
  if(!plates||this.coffee<=0)this.end(false,'Pranzo rovesciato: la mensa ha vinto questo giro.');
  if(this.distance>=850)this.end(plates>=2&&this.coffee>=30,plates>=2&&this.coffee>=30?'Tavolo raggiunto con il pranzo ancora caldo!':'Al tavolo sono arrivati troppi pochi piatti.');
 }
}
