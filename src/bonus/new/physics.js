export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const overlap=(x,y,r,o)=>x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h;
export function moveCircle(p,dx,dy,obstacles,w=900,h=480,r=13){
 const x=clamp(p.x+dx,r,w-r);if(!obstacles.some(o=>overlap(x,p.y,r,o)))p.x=x;
 const y=clamp(p.y+dy,r,h-r);if(!obstacles.some(o=>overlap(p.x,y,r,o)))p.y=y;
}
export function occluded(a,b,obstacles){
 const n=Math.ceil(distance(a,b)/8);
 for(let i=1;i<n;i++)if(obstacles.some(o=>overlap(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,0,o)))return true;
 return false;
}
export class Round {
 constructor(){this.elapsed=0;this.paused=false;this.finished=false;this.won=false;this.revision=0;this.message='';this.accumulator=0;}
 update(seconds,input={}){
  if(this.paused||this.finished||!Number.isFinite(seconds)||seconds<=0)return;
  this.accumulator+=Math.min(.1,seconds);
  while(this.accumulator+1e-9>=1/60&&!this.finished){this.accumulator-=1/60;this.elapsed+=1/60;this.step(1/60,input);}
 }
 step(){}
 get active(){return !this.paused&&!this.finished;}
 end(won,message){if(!this.active)return;this.finished=true;this.won=won;this.message=message;this.revision++;}
 reward(){return this.won?{hp:10,stress:10,euro:15}:{hp:0,stress:0,euro:0};}
}
