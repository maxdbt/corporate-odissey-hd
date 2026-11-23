import {CITY_MAP,CITY_WIDTH,CITY_HEIGHT,ROADS,nearestRoad} from '../bonus/new/TaxiCity.js';
import {drawBuilding} from './CityBuildings.js';

const CHUNK=512,DENSITY=2;
let serial=0;
const bounds=points=>({minX:Math.min(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxX:Math.max(...points.map(p=>p[0])),maxY:Math.max(...points.map(p=>p[1]))});
function path(c,points,close=true){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));if(close)c.closePath();}
function inside(x,y,points){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}

// Rasterize only nearby sectors; a whole-city texture would exceed mobile GPU limits.
export default class RomeCityRenderer {
 constructor(scene,container){
  this.scene=scene;this.container=container;this.prefix='rome-'+(++serial)+'-';this.cache=new Map();this.clock=0;this.sectors=new Map();
  this.roads=ROADS.map(r=>({...r,points:r.points.map(p=>[p.x,p.y])}));
  for(const [kind,features] of Object.entries({buildings:CITY_MAP.buildings,parks:CITY_MAP.parks,rivers:CITY_MAP.rivers,water:CITY_MAP.water,roads:this.roads}))
   for(const f of features){const b=bounds(f.points),pad=kind==='rivers'?230:kind==='roads'?f.width/2+30:kind==='buildings'?48:40;f.bounds=b;
    for(let x=Math.max(0,Math.floor((b.minX-pad)/CHUNK));x<=Math.min(Math.floor(CITY_WIDTH/CHUNK),Math.floor((b.maxX+pad)/CHUNK));x++)
    for(let y=Math.max(0,Math.floor((b.minY-pad)/CHUNK));y<=Math.min(Math.floor(CITY_HEIGHT/CHUNK),Math.floor((b.maxY+pad)/CHUNK));y++){
     const key=x+','+y;if(!this.sectors.has(key))this.sectors.set(key,{buildings:[],parks:[],rivers:[],water:[],roads:[]});this.sectors.get(key)[kind].push(f);
    }
   }
  this.crossings=[];
  for(const park of CITY_MAP.parks){
   const b=park.bounds;let seed=park.id%2147483647;park.trees=[];
   for(let n=0;n<Math.min(90,Math.ceil((b.maxX-b.minX)*(b.maxY-b.minY)/8000));n++){
    seed=seed*16807%2147483647;const x=b.minX+(seed%10000)/10000*(b.maxX-b.minX);seed=seed*16807%2147483647;const y=b.minY+(seed%10000)/10000*(b.maxY-b.minY);
    if(inside(x,y,park.points))park.trees.push({x,y,size:45+seed%30});
   }
  }
  for(const road of this.roads.filter(r=>r.crossing)){
   const a=road.points[0],b=road.points.at(-1),p=nearestRoad((a[0]+b[0])/2,(a[1]+b[1])/2);
   if(p&&p.distance<p.segment.half+8&&this.crossings.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>55))this.crossings.push(p);
  }
  this.overviewKey=this.prefix+'overview';this.makeOverview();
 }
 pattern(c,type){
  const tile=document.createElement('canvas');tile.width=64;tile.height=64;const t=tile.getContext('2d');
  t.fillStyle=type==='roof'?'#bd7954':type==='asphalt'?'#4b5353':type==='sidewalk'?'#d4c8ac':'#b5aa91';t.fillRect(0,0,64,64);
  let seed=713;for(let i=0;i<240;i++){seed=seed*16807%2147483647;const x=seed%64;seed=seed*16807%2147483647;
   t.fillStyle=i%2?'rgba(255,245,220,.045)':'rgba(39,46,38,.055)';t.fillRect(x,seed%64,1,1);}
  t.strokeStyle=type==='roof'?'#985d40':type==='sidewalk'?'#bcaf95':'#9c927e';t.lineWidth=.65;
  const step=type==='roof'?6:type==='sidewalk'?16:10;for(let y=0;type!=='asphalt'&&y<64;y+=step){t.beginPath();t.moveTo(0,y);t.lineTo(64,y);t.stroke();
   for(let x=(y/step%2)*step/2;x<64;x+=step*1.8){t.beginPath();t.moveTo(x,y);t.lineTo(x,y+step);t.stroke();}}
  return c.createPattern(tile,'repeat');
 }
 makeChunk(x,y){
  // One shared edge pixel avoids black seams under fractional camera zoom on mobile.
  const extent=CHUNK+1,key=this.prefix+x+'-'+y,texture=this.scene.textures.createCanvas(key,extent*DENSITY,extent*DENSITY),c=texture.context;
  c.scale(DENSITY,DENSITY);c.translate(-x*CHUNK,-y*CHUNK);c.lineJoin='round';c.lineCap='round';
  c.fillStyle=this.pattern(c,'paving');c.fillRect(x*CHUNK,y*CHUNK,extent,extent);
  const sector=this.sectors.get(x+','+y)||{buildings:[],parks:[],rivers:[],water:[],roads:[]};
  for(const p of sector.parks){path(c,p.points);c.fillStyle='#788b62';c.fill();c.strokeStyle='#acb18d';c.lineWidth=5;c.stroke();}
  const tree=this.scene.textures.get('city-props').get('tree');
  for(const park of sector.parks)for(const t of park.trees){
   if(t.x+t.size/2<x*CHUNK||t.x-t.size/2>(x+1)*CHUNK||t.y+t.size/2<y*CHUNK||t.y-t.size/2>(y+1)*CHUNK)continue;
   c.fillStyle='rgba(29,49,31,.18)';c.beginPath();c.ellipse(t.x+8,t.y+8,t.size*.44,t.size*.3,0,0,Math.PI*2);c.fill();
   c.drawImage(tree.source.image,tree.cutX,tree.cutY,tree.cutWidth,tree.cutHeight,t.x-t.size/2,t.y-t.size/2,t.size,t.size);
  }
  for(const r of sector.rivers){path(c,r.points,false);c.lineWidth=420;c.strokeStyle='#999783';c.stroke();c.lineWidth=350;c.strokeStyle='#467d80';c.stroke();c.lineWidth=300;c.strokeStyle='#659598';c.stroke();}
  for(const lake of sector.water){
   const b=lake.bounds;path(c,lake.points);c.lineWidth=16;c.strokeStyle='#e4d9bd';c.stroke();c.lineWidth=3;c.strokeStyle='#fbf0ce';c.stroke();
   const gradient=c.createLinearGradient(b.minX,b.minY,b.maxX,b.maxY);gradient.addColorStop(0,'#61a1aa');gradient.addColorStop(1,'#285d73');c.fillStyle=gradient;c.fill();
   c.save();path(c,lake.points);c.clip();c.lineWidth=1.5;c.strokeStyle='rgba(197,237,222,.22)';
   for(let yy=Math.max(y*CHUNK,b.minY);yy<Math.min((y+1)*CHUNK,b.maxY);yy+=32)for(let xx=Math.max(x*CHUNK,b.minX);xx<Math.min((x+1)*CHUNK,b.maxX);xx+=65){c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx+12,yy-3,xx+26,yy);c.stroke();}c.restore();
  }
  const atlas=this.scene.textures.get('city-eur-buildings');
  for(const b of [...sector.buildings].sort((a,b)=>a.bounds.maxY-b.bounds.maxY))drawBuilding(c,b,atlas);
  const asphalt=this.pattern(c,'asphalt'),sidewalk=this.pattern(c,'sidewalk');
  // Pedestrian paths blend into paving; only the carriageway is dark and outlined.
  for(const r of sector.roads.filter(r=>!r.drive)){path(c,r.points,false);c.lineWidth=r.kind==='pedestrian'?r.width:Math.min(12,r.width);c.strokeStyle=sidewalk;c.stroke();}
  const driving=sector.roads.filter(r=>r.drive);
  // Complete every layer before the next, so intersecting roads have continuous sidewalks.
  for(const r of driving){path(c,r.points,false);c.lineWidth=r.width+44;c.strokeStyle='#877d68';c.stroke();}
  for(const r of driving){path(c,r.points,false);c.lineWidth=r.width+40;c.strokeStyle=sidewalk;c.stroke();}
  for(const r of driving){path(c,r.points,false);c.lineWidth=r.width+5;c.strokeStyle='#f3e2bd';c.stroke();}
  for(const r of driving){path(c,r.points,false);c.lineWidth=r.width;c.strokeStyle=asphalt;c.stroke();}
  for(const r of driving.filter(r=>r.width>=76)){
   path(c,r.points,false);c.save();c.setLineDash([12,22]);c.lineWidth=1.3;c.strokeStyle='rgba(250,238,206,.55)';c.stroke();c.restore();
  }
  for(const crossing of this.crossings){
   if(crossing.x<x*CHUNK-80||crossing.x>(x+1)*CHUNK+80||crossing.y<y*CHUNK-80||crossing.y>(y+1)*CHUNK+80)continue;
   const {a,b,half,length}=crossing.segment,nx=-(b.y-a.y)/length,ny=(b.x-a.x)/length;
   c.save();c.lineCap='butt';c.setLineDash([4,5]);c.lineWidth=15;c.strokeStyle='#ede9d9';c.beginPath();c.moveTo(crossing.x-nx*(half-3),crossing.y-ny*(half-3));c.lineTo(crossing.x+nx*(half-3),crossing.y+ny*(half-3));c.stroke();c.restore();
  }
  c.font='600 10px Segoe UI, sans-serif';c.textAlign='center';c.textBaseline='middle';
  for(const r of sector.roads){if(!r.name||!r.drive||!['primary','secondary','tertiary'].includes(r.kind))continue;
   let best=null;for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!best||len>best.len)best={a,b,len};}
   if(!best||best.len<Math.max(180,r.name.length*6))continue;
   const mx=(best.a[0]+best.b[0])/2,my=(best.a[1]+best.b[1])/2;let angle=Math.atan2(best.b[1]-best.a[1],best.b[0]-best.a[0]);if(angle>Math.PI/2||angle<-Math.PI/2)angle+=Math.PI;
   c.save();c.translate(mx,my);c.rotate(angle);c.lineWidth=3;c.strokeStyle='rgba(58,62,56,.65)';c.strokeText(r.name,0,0);c.fillStyle='#f3e5c5';c.fillText(r.name,0,0);c.restore();
  }
  for(const l of CITY_MAP.landmarks){const [lx,ly]=l.point;c.font='bold 12px Segoe UI, sans-serif';const w=c.measureText(l.name).width;
   c.fillStyle='rgba(27,48,48,.88)';c.fillRect(lx-w/2-7,ly-10,w+14,22);c.strokeStyle='#deb76a';c.lineWidth=1;c.strokeRect(lx-w/2-7,ly-10,w+14,22);c.fillStyle='#ffe3a3';c.fillText(l.name,lx,ly+1);}
  texture.refresh();const sprite=this.scene.add.image(x*CHUNK,y*CHUNK,key).setOrigin(0).setDisplaySize(extent,extent);this.container.addAt(sprite,0);
  return {sprite,key,used:++this.clock};
 }
 update(camera,width,height,zoom){
  const left=Math.max(0,Math.floor((camera.x-width/2/zoom-32)/CHUNK)),right=Math.min(Math.floor(CITY_WIDTH/CHUNK),Math.floor((camera.x+width/2/zoom+32)/CHUNK));
  const top=Math.max(0,Math.floor((camera.y-height/2/zoom-32)/CHUNK)),bottom=Math.min(Math.floor(CITY_HEIGHT/CHUNK),Math.floor((camera.y+height/2/zoom+32)/CHUNK));
  const visible=new Set();for(let x=left;x<=right;x++)for(let y=top;y<=bottom;y++){
   const key=x+','+y;visible.add(key);if(!this.cache.has(key))this.cache.set(key,this.makeChunk(x,y));const chunk=this.cache.get(key);chunk.used=++this.clock;chunk.sprite.setVisible(true);
  }
  for(const [key,chunk] of this.cache)if(!visible.has(key))chunk.sprite.setVisible(false);
  const limit=Math.max(12,visible.size);for(const [key,chunk] of [...this.cache].sort((a,b)=>a[1].used-b[1].used)){
   if(this.cache.size<=limit)break;if(visible.has(key))continue;chunk.sprite.destroy();this.scene.textures.remove(chunk.key);this.cache.delete(key);
  }
 }
 makeOverview(){
  const t=this.scene.textures.createCanvas(this.overviewKey,900,Math.round(900*CITY_HEIGHT/CITY_WIDTH)),c=t.context,s=900/CITY_WIDTH;
  c.scale(s,s);c.fillStyle='#203b40';c.fillRect(0,0,CITY_WIDTH,CITY_HEIGHT);c.lineJoin='round';c.lineCap='round';
  for(const p of CITY_MAP.parks){path(c,p.points);c.fillStyle='#52775c';c.fill();}
  for(const r of CITY_MAP.rivers){path(c,r.points,false);c.lineWidth=350;c.strokeStyle='#477f91';c.stroke();}
  for(const lake of CITY_MAP.water){path(c,lake.points);c.fillStyle='#55a1b0';c.fill();}
  for(const b of CITY_MAP.buildings){path(c,b.points);c.fillStyle='#40534f';c.fill();}
  for(const r of this.roads){if(!r.drive&&r.kind!=='pedestrian')continue;path(c,r.points,false);c.lineWidth=r.drive?Math.max(17,r.width*.55):9;c.strokeStyle=r.drive?'#bcbca5':'#778b78';c.stroke();}
  t.refresh();
 }
 destroy(){for(const chunk of this.cache.values()){chunk.sprite.destroy();this.scene.textures.remove(chunk.key);}this.cache.clear();this.scene.textures.remove(this.overviewKey);}
}
