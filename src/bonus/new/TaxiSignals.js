// OSM supplies positions/directions. Phases are coordinated arcade timings, not live traffic data.
export function signalState(time,axis,offset=0){
 const phase=((time+offset)%26+26)%26,start=axis==='x'?0:13,t=(phase-start+26)%26;
 return t<9?'green':t<11?'amber':'red';
}
export const lightGreen=(time,axis,offset=0)=>signalState(time,axis,offset)==='green';

export function createTrafficSignals(roads,source){
 const attached=new Map();
 for(const r of roads.filter(r=>r.drive))for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(length<.1)continue;
  for(const [p,q,forward] of [[b,a,true],[a,b,false]]){
   if(!attached.has(p.id))attached.set(p.id,[]);
   attached.get(p.id).push({p,q,forward,road:r,length});
  }
 }
 const junctions=[...attached].filter(([,edges])=>new Set(edges.map(e=>e.q.id)).size>=3).map(([id,edges])=>({id,...edges[0].p}));
 const groups=[],signals=[];
 for(const raw of source||[]){
  const edges=attached.get(raw.id);if(!edges)continue; // Footway-only poles do not control cars.
  const p=edges[0].p;
  let center=junctions.filter(j=>Math.hypot(j.x-p.x,j.y-p.y)<230).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||p;
  let group=groups.find(g=>Math.hypot(g.x-center.x,g.y-center.y)<180);
  if(!group){group={...center,index:groups.length};groups.push(group);}
  const intersection=new Set(edges.map(e=>e.q.id)).size>=3;
  for(const e of edges){
   if(e.road.oneway===(e.forward?-1:1))continue;
   if(raw.direction==='forward'&&!e.forward||raw.direction==='backward'&&e.forward)continue;
   const ux=(p.x-e.q.x)/e.length,uy=(p.y-e.q.y)/e.length;
   if(/^\d+(\.\d+)?$/.test(raw.direction)){const angle=(Number(raw.direction)-90)*Math.PI/180;if(ux*Math.cos(angle)+uy*Math.sin(angle)<.5)continue;}
   const setback=intersection?Math.max(...edges.map(a=>a.road.width/2))+18:10;
   const x=p.x-ux*setback,y=p.y-uy*setback,nx=-uy,ny=ux,half=e.road.width/2;
   if(signals.some(s=>s.osmId===raw.id&&s.ux*ux+s.uy*uy>.96))continue;
   signals.push({id:signals.length,osmId:raw.id,roadId:e.road.id,x,y,ux,uy,nx,ny,half,
    poleX:x+nx*(half+10),poleY:y+ny*(half+10),axis:Math.abs(ux)>Math.abs(uy)?'x':'y',offset:group.index*3,group:group.index,
    laneMin:e.road.oneway?-half+3:0,laneMax:half-3});
  }
 }
 const cells=new Map(),cellSize=200;
 for(const s of signals)for(let x=Math.floor((s.x-s.half-65)/cellSize);x<=Math.floor((s.x+s.half+65)/cellSize);x++)
 for(let y=Math.floor((s.y-s.half-65)/cellSize);y<=Math.floor((s.y+s.half+65)/cellSize);y++){
  const key=x+','+y;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(s);
 }
 function stopAtSignal(from,to,time,radius=26){
  const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);let fraction=1,signal=null;
  if(length<1e-9)return {fraction,signal};
  const candidates=new Set();for(const p of [from,to])for(const s of cells.get(Math.floor(p.x/cellSize)+','+Math.floor(p.y/cellSize))||[])candidates.add(s);
  for(const s of candidates){
   const progress=dx*s.ux+dy*s.uy;if(progress/length<.35||signalState(time,s.axis,s.offset)==='green')continue;
   const before=(from.x-s.x)*s.ux+(from.y-s.y)*s.uy+radius,after=before+progress;
   // Vehicles already beyond the stop line can clear the intersection.
   if(before>.5||after<0)continue;
   const f=Math.max(0,-before/progress),lateral=(from.x+dx*f-s.x)*s.nx+(from.y+dy*f-s.y)*s.ny;
   if(Math.abs(lateral)>s.half+5)continue;
   if(f<=fraction){fraction=f;signal=s;}
  }
  return {fraction,signal};
 }
 return {signals,stopAtSignal};
}
