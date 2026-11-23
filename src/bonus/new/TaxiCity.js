import map from '../../../public/assets/hd-city-taxi/rome-map.json' with {type:'json'};
import {createTrafficSignals} from './TaxiSignals.js';
export {lightGreen,signalState} from './TaxiSignals.js';

export const CITY_MAP=map;
export const CITY_WIDTH=map.meta.width,CITY_HEIGHT=map.meta.height,CITY_SIZE=Math.max(CITY_WIDTH,CITY_HEIGHT);
export const UNITS_PER_METRE=map.meta.unitsPerMetre,TRAFFIC_COUNT=24,WALKER_COUNT=48,TAXI_TIME_LIMIT=420;
export const ROADS=map.roads.map((r,index)=>({...r,index,points:r.nodes.map(id=>({id,x:map.nodes[id][0],y:map.nodes[id][1]}))}));
const cellSize=160,grid=new Map();
export const ROAD_SEGMENTS=[];
for(const road of ROADS)for(let i=1;i<road.points.length;i++){
 const a=road.points[i-1],b=road.points[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(length<.1)continue;
 const segment={a,b,length,road,half:road.width/2};ROAD_SEGMENTS.push(segment);
 const margin=segment.half+24;
 for(let x=Math.floor((Math.min(a.x,b.x)-margin)/cellSize);x<=Math.floor((Math.max(a.x,b.x)+margin)/cellSize);x++)
 for(let y=Math.floor((Math.min(a.y,b.y)-margin)/cellSize);y<=Math.floor((Math.max(a.y,b.y)+margin)/cellSize);y++){
  const key=x+','+y;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(segment);
 }
}
export function projectOnSegment(x,y,s){
 const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,t=Math.max(0,Math.min(1,((x-s.a.x)*dx+(y-s.a.y)*dy)/(s.length*s.length)));
 const px=s.a.x+dx*t,py=s.a.y+dy*t;return {x:px,y:py,t,distance:Math.hypot(x-px,y-py),segment:s};
}
export function nearestRoad(x,y,{drive=true,name=''}={}){
 let best=null;
 const scan=segments=>{for(const s of segments){if(drive&&!s.road.drive||name&&!s.road.name.includes(name))continue;const p=projectOnSegment(x,y,s);if(!best||p.distance<best.distance)best=p;}};
 if(!name){const cx=Math.floor(x/cellSize),cy=Math.floor(y/cellSize),local=new Set();for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const s of grid.get((cx+dx)+','+(cy+dy))||[])local.add(s);scan(local);if(best?.distance<cellSize)return best;}
 scan(ROAD_SEGMENTS);return best;
}
export function onCityRoad(x,y,r=0){
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<20+r||y<20+r||x>CITY_WIDTH-20-r||y>CITY_HEIGHT-20-r)return false;
 return (grid.get(Math.floor(x/cellSize)+','+Math.floor(y/cellSize))||[]).some(s=>s.road.drive&&projectOnSegment(x,y,s).distance<=s.half-r);
}
export function streetAt(x,y){
 let best=null;for(const s of grid.get(Math.floor(x/cellSize)+','+Math.floor(y/cellSize))||[]){if(!s.road.drive)continue;const p=projectOnSegment(x,y,s);if(!best||p.distance<best.distance)best=p;}
 return best?.segment.road.name||'EUR';
}
function makeGraph(walking=false,directed=false){
 const graph=new Map();
 const add=(a,b,s)=>{if(!graph.has(a.id))graph.set(a.id,[]);graph.get(a.id).push({to:b.id,length:s.length,road:s.road});};
 for(const s of ROAD_SEGMENTS){if(walking?!s.road.walk:!s.road.drive)continue;
  if(!directed||s.road.oneway!==-1)add(s.a,s.b,s);
  if(!directed||s.road.oneway!==1)add(s.b,s.a,s);
 }return graph;
}
export const DRIVE_GRAPH=makeGraph(),TRAFFIC_GRAPH=makeGraph(false,true),WALK_GRAPH=makeGraph(true);
function largestComponent(graph){
 const visited=new Set();let biggest=new Set();
 for(const id of graph.keys())if(!visited.has(id)){
  const group=new Set([id]),todo=[id];visited.add(id);
  for(let i=0;i<todo.length;i++)for(const edge of graph.get(todo[i])||[])if(!visited.has(edge.to)){visited.add(edge.to);group.add(edge.to);todo.push(edge.to);}
  if(group.size>biggest.size)biggest=group;
 }return biggest;
}
const driveComponent=largestComponent(DRIVE_GRAPH),walkComponent=largestComponent(WALK_GRAPH);
export function nodePoint(id){const p=map.nodes[id];return {id,x:p[0],y:p[1]};}
function closestNode(point,graph,component){
 let best=null,distance=Infinity;
 for(const id of component){if(!graph.has(id))continue;const p=nodePoint(id),d=Math.hypot(p.x-point.x,p.y-point.y);if(d<distance){distance=d;best=id;}}
 return best;
}
// A binary heap keeps routing independent of the size of the OSM extract.
class Heap {
 constructor(){this.items=[];}
 push(value){const a=this.items;a.push(value);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p].cost<=value.cost)break;a[i]=a[p];i=p;}a[i]=value;}
 pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].cost<a[c].cost)c++;if(a[c].cost>=last.cost)break;a[i]=a[c];i=c;}a[i]=last;}return first;}
}
export function shortestPath(start,end,graph=DRIVE_GRAPH){
 const heap=new Heap(),costs=new Map([[start,0]]),previous=new Map();heap.push({id:start,cost:0});
 while(heap.items.length){const current=heap.pop();if(current.cost!==costs.get(current.id))continue;
  if(current.id===end){const path=[end];while(path[0]!==start)path.unshift(previous.get(path[0]));return path;}
  for(const edge of graph.get(current.id)||[]){const cost=current.cost+edge.length;if(cost<(costs.get(edge.to)??Infinity)){costs.set(edge.to,cost);previous.set(edge.to,current.id);heap.push({id:edge.to,cost});}}
 }return [];
}
export function drivingRoute(from,to){
 const start=closestNode(from,DRIVE_GRAPH,driveComponent),end=closestNode(to,DRIVE_GRAPH,driveComponent);
 return shortestPath(start,end).map(nodePoint);
}
function address(landmark,street,title,hint){
 const place=map.landmarks.find(p=>p.name===landmark),p=nearestRoad(...place.point,{name:street});
 const node=closestNode(p,DRIVE_GRAPH,driveComponent);return {...nodePoint(node),name:title,hint,street:p.segment.road.name};
}
export const ADDRESSES=[
 address('Palazzo dei Congressi','Kennedy','Palazzo dei Congressi','Appuntamento in Piazza John Kennedy'),
 address('Palazzo della Civiltà Italiana','Civiltà del Lavoro','Palazzo della Civiltà Italiana','Il cliente ha cambiato sede: Viale della Civiltà del Lavoro')
];
const spawn=address('Laghetto dell’EUR','America','Partenza dal laghetto','');
const spawnEdge=DRIVE_GRAPH.get(spawn.id)[0],spawnNext=nodePoint(spawnEdge.to);
export const TAXI_SPAWN={x:spawn.x,y:spawn.y,angle:Math.atan2(spawnNext.y-spawn.y,spawnNext.x-spawn.x),speed:0};
export const {signals:SIGNALS,stopAtSignal}=createTrafficSignals(ROADS,map.signals);

function routePoints(ids,graph,walking){
 return ids.map((id,i)=>{
  const p=nodePoint(id),q=nodePoint(ids[(i+1)%ids.length]),edge=graph.get(id)?.find(e=>e.to===q.id);
  const d=Math.hypot(q.x-p.x,q.y-p.y)||1,offset=walking?(edge?.road.drive?edge.road.width/2+6:3):Math.min(11,(edge?.road.width||54)/5);
  return {...p,x:p.x-(q.y-p.y)/d*offset,y:p.y+(q.x-p.x)/d*offset};
 });
}
function createActors(count,walking){
 const graph=walking?WALK_GRAPH:TRAFFIC_GRAPH,component=walking?walkComponent:driveComponent;
 const candidates=[...component].filter(id=>(graph.get(id)?.length||0)>0)
  .sort((a,b)=>Math.hypot(nodePoint(a).x-spawn.x,nodePoint(a).y-spawn.y)-Math.hypot(nodePoint(b).x-spawn.x,nodePoint(b).y-spawn.y));
 const actors=[];
 for(let attempt=0;actors.length<count&&attempt<800;attempt++){
  const pool=actors.length<count/3?Math.min(500,candidates.length):candidates.length;
  const a=candidates[(attempt*137+31)%pool],point=nodePoint(a);
  const nearby=candidates.filter(id=>{const p=nodePoint(id),d=Math.hypot(p.x-point.x,p.y-point.y);return d>180&&d<(walking?650:1400);});
  const b=nearby[(attempt*29)%nearby.length];if(b===undefined)continue;
  const there=shortestPath(a,b,graph),back=shortestPath(b,a,graph);if(there.length<2||back.length<2)continue;
  const ids=[...there,...back.slice(1,-1)],path=routePoints(ids,graph,walking),p=path[0],q=path[1];
  if(!walking&&actors.some(other=>Math.hypot(other.x-p.x,other.y-p.y)<75))continue;
  actors.push({id:actors.length,path,next:1,x:p.x,y:p.y,angle:Math.atan2(q.y-p.y,q.x-p.x),speed:walking?20+actors.length%5*2:55+actors.length%5*7,moving:true,walk:0});
 }
 if(actors.length!==count)throw new Error('OSM map has insufficient connected routes for city population');
 return actors;
}
let trafficTemplate,walkerTemplate;
const cloneActors=actors=>actors.map(a=>({...a,path:a.path}));
export function createTraffic(){trafficTemplate??=createActors(TRAFFIC_COUNT,false);return cloneActors(trafficTemplate);}
export function createWalkers(){walkerTemplate??=createActors(WALKER_COUNT,true);return cloneActors(walkerTemplate);}
