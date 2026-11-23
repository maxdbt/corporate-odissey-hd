import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import TaxiDrive from '../src/bonus/new/TaxiDrive.js';
import {CITY_MAP,CITY_WIDTH,CITY_HEIGHT,TAXI_SPAWN,TAXI_TIME_LIMIT,ROAD_SEGMENTS,ADDRESSES,DRIVE_GRAPH,TRAFFIC_GRAPH,SIGNALS,onCityRoad,lightGreen,signalState,stopAtSignal,drivingRoute,createTraffic,createWalkers} from '../src/bonus/new/TaxiCity.js';
import {createTrafficSignals} from '../src/bonus/new/TaxiSignals.js';
import {buildingStyle} from '../src/presentation/CityBuildings.js';

test('Rome map has reproducible OSM provenance, a larger area and connected real destinations',()=>{
 assert.equal(CITY_MAP.meta.source,'OpenStreetMap');assert.equal(CITY_MAP.meta.license,'ODbL-1.0');assert.ok(CITY_MAP.meta.snapshot);
 assert.ok(CITY_WIDTH*CITY_HEIGHT>6*2520*2520);assert.ok(CITY_MAP.buildings.length>1000);
 for(const name of ['Palazzo dei Congressi','Palazzo della Civiltà Italiana','Laghetto dell’EUR','Palazzo dello Sport'])assert.ok(CITY_MAP.landmarks.some(l=>l.name===name));
 const lake=CITY_MAP.water.find(w=>w.id===2426553);assert.ok(lake&&lake.points.length>100);assert.deepEqual(lake.points[0],lake.points.at(-1));
 for(const [from,to] of [[TAXI_SPAWN,ADDRESSES[0]],[ADDRESSES[0],ADDRESSES[1]]]){
  const route=drivingRoute(from,to);assert.ok(route.length>20);
  for(let i=1;i<route.length;i++)assert.ok(DRIVE_GRAPH.get(route[i-1].id).some(e=>e.to===route[i].id));
 }
});

test('signals retain OSM provenance, curb placement and mutually exclusive crossing phases',()=>{
 assert.ok(CITY_MAP.signals.length>50);assert.ok(SIGNALS.length>50);
 for(const s of SIGNALS){
  assert.ok(CITY_MAP.signals.some(raw=>raw.id===s.osmId));
  assert.ok(Math.abs(Math.hypot(s.poleX-s.x,s.poleY-s.y)-(s.half+10))<.01);
  for(let time=0;time<52;time+=.5)assert.ok(!(lightGreen(time,'x',s.offset)&&lightGreen(time,'y',s.offset)));
 }
 assert.equal(signalState(9.5,'x'),'amber');assert.equal(signalState(11.5,'x'),'red');assert.equal(signalState(11.5,'y'),'red');
});

test('taxi waits behind a real EUR stop line at red, resumes at green and can clear a crossed line',()=>{
 const s=SIGNALS.find(s=>s.osmId===428171149&&s.axis==='x'&&s.ux>0),point=along=>({x:s.x+s.ux*along+s.nx*11,y:s.y+s.uy*along+s.ny*11});
 for(const fps of [30,120]){
  const r=new TaxiDrive({freeRide:true});r.traffic=[];r.elapsed=(14-s.offset+26)%26;
  r.car={...point(-45),angle:Math.atan2(s.uy,s.ux),speed:100};
  for(let i=0;i<fps*2;i++)r.update(1/fps,{y:-1});
  const distance=(r.car.x-s.x)*s.ux+(r.car.y-s.y)*s.uy;
  assert.ok(Math.abs(distance+26)<.1,'front bumper must stay behind the line');assert.equal(r.car.speed,0);assert.ok(r.waitingAtLight);assert.equal(r.health,100);
  r.elapsed=(2-s.offset+26)%26;
  for(let i=0;i<fps/2;i++)r.update(1/fps,{y:-1});
  assert.ok(r.car.speed>20);assert.ok((r.car.x-s.x)*s.ux+(r.car.y-s.y)*s.uy>distance+10);
 }
 const time=(14-s.offset+26)%26;
 assert.equal(stopAtSignal(point(5),point(20),time).fraction,1,'already crossing vehicles must clear the junction');
 assert.equal(stopAtSignal(point(-30),point(-70),time).fraction,1,'reverse away from a red light must remain possible');
});

test('NPCs stop at the same red line, queue without overlap and restart',()=>{
 const s=SIGNALS.find(s=>s.osmId===428171149&&s.axis==='x'&&s.ux>0),point=along=>({x:s.x+s.ux*along+s.nx*11,y:s.y+s.uy*along+s.ny*11});
 const r=new TaxiDrive({freeRide:true});r.elapsed=(14-s.offset+26)%26;r.car={x:0,y:0,angle:0,speed:0};
 r.traffic=[-60,-135].map((along,id)=>({id,...point(along),angle:Math.atan2(s.uy,s.ux),speed:80,next:0,path:[point(150),point(-150)],moving:true}));
 for(let i=0;i<120;i++)r.update(1/60);
 const first=r.traffic[0],second=r.traffic[1],at={x:first.x,y:first.y};
 assert.ok(Math.abs((first.x-s.x)*s.ux+(first.y-s.y)*s.uy+24)<.1);assert.equal(first.moving,false);assert.ok(Math.hypot(first.x-second.x,first.y-second.y)>55);
 r.elapsed=(2-s.offset+26)%26;for(let i=0;i<60;i++)r.update(1/60);
 assert.ok(Math.hypot(first.x-at.x,first.y-at.y)>50);
});

test('OSM forward/backward tags apply signals only to the mapped approach',()=>{
 const road={id:1,drive:true,oneway:0,width:60,points:[{id:1,x:100,y:100},{id:2,x:200,y:100},{id:3,x:300,y:100}]};
 const {signals,stopAtSignal:stop}=createTrafficSignals([road],[{id:2,direction:'forward'}]);
 assert.equal(signals.length,1);assert.equal(signals[0].ux,1);
 assert.ok(stop({x:100,y:110},{x:200,y:110},14).fraction<1);
 assert.equal(stop({x:260,y:90},{x:160,y:90},14).fraction,1);
});

test('building presentation uses real mapped floors, heights and roof information where available',()=>{
 assert.ok(CITY_MAP.buildings.filter(b=>b.levels||b.height).length>300);
 assert.equal(buildingStyle({id:1,kind:'office',levels:8}).levels,8);
 assert.equal(buildingStyle({id:1,kind:'office',height:20,levels:8}).metres,20);
 const roof=buildingStyle({id:2,kind:'house',roofShape:'hipped',roofColour:'#ab6543'});assert.ok(roof.tiled);assert.equal(roof.roof,'#ab6543');
});

test('driving stays within the actual street corridors and cannot enter map borders',()=>{
 assert.equal(onCityRoad(-1,180),false);assert.equal(onCityRoad(CITY_WIDTH+1,500),false);assert.equal(onCityRoad(500,CITY_HEIGHT+1),false);
 const r=new TaxiDrive();assert.ok(r.onRoad(r.car.x,r.car.y));
 const segment=ROAD_SEGMENTS.find(s=>s.road.drive&&s.length>180&&s.road.width<70);
 const mx=(segment.a.x+segment.b.x)/2,my=(segment.a.y+segment.b.y)/2;
 r.car={x:mx,y:my,angle:Math.atan2(segment.b.y-segment.a.y,segment.b.x-segment.a.x)+Math.PI/2,speed:200};
 for(let i=0;i<90;i++){r.update(1/60,{y:-1});assert.ok(r.onRoad(r.car.x,r.car.y));}
 assert.ok(r.health<100);
});

test('24 vehicles and 48 animated pedestrians use complete routes and independent retry state',()=>{
 const traffic=createTraffic(),walkers=createWalkers();assert.equal(traffic.length,24);assert.equal(walkers.length,48);
 for(const t of traffic){assert.ok(t.path.length>3);for(let i=0;i<t.path.length;i++){
  const a=t.path[i],b=t.path[(i+1)%t.path.length];assert.ok(TRAFFIC_GRAPH.get(a.id)?.some(e=>e.to===b.id),'NPC must obey the directed OSM graph');
  for(let f=0;f<=1;f+=.2)assert.ok(onCityRoad(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,8),'traffic must remain on a driveable road');
 }}
 const again=createTraffic();traffic[0].x+=100;assert.notEqual(again[0].x,traffic[0].x);
});
test('city traffic, walkers and signals move and pause together; free driving has no countdown',()=>{
 const r=new TaxiDrive({freeRide:true}),before=JSON.stringify(r.traffic),walk=r.walkers[0].walk;
 for(let i=0;i<60;i++)r.update(1/60);assert.notEqual(JSON.stringify(r.traffic),before);assert.ok(r.walkers[0].walk>walk);
 assert.equal(lightGreen(4,'x'),true);assert.equal(lightGreen(4,'y'),false);assert.equal(lightGreen(14,'y'),true);
 r.paused=true;const frozen=JSON.stringify(r);r.update(999);assert.equal(JSON.stringify(r),frozen);
 r.paused=false;r.elapsed=TAXI_TIME_LIMIT+1;r.update(1/60);assert.equal(r.finished,false);
 const timed=new TaxiDrive();timed.elapsed=TAXI_TIME_LIMIT+1;timed.update(1/60);assert.ok(timed.finished&&!timed.won);
});
test('city HD atlases have genuine alpha, in-bounds frames and bounded mobile textures',()=>{
 for(const name of ['buildings','props','pedestrians','eur-buildings']){
  const base=new URL('../public/assets/hd-city-taxi/',import.meta.url),png=readFileSync(new URL(name+'.png',base)),atlas=JSON.parse(readFileSync(new URL(name+'.json',base)));
  const w=png.readUInt32BE(16),h=png.readUInt32BE(20);assert.ok(w<=2048&&h<=2048);assert.ok(png.length<5*1024*1024);assert.equal(png[25],6);
  for(const {frame:f} of Object.values(atlas.frames))assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=w&&f.y+f.h<=h);
  if(name==='pedestrians')assert.equal(Object.keys(atlas.frames).length,12);
 }
});
