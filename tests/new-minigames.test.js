import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBonusRound,ROUND_TYPES} from '../src/bonus/new/index.js';
import {STAGE_BONUSES,BONUSES_BY_STAGE} from '../src/bonus/StageBonusCatalog.js';
import {PARKING_LAYOUTS,parkingCells} from '../src/bonus/new/ParkingPuzzle.js';
import {PACKING_ITEMS,rotatedCells} from '../src/bonus/new/PackingPuzzle.js';
import {distance,clamp,overlap} from '../src/bonus/new/physics.js';
import {PARTY_ITEMS} from '../src/bonus/new/PartyEscape.js';

test('only eight new games are published, two Christmas pauses are separated and old routes are retired',()=>{
 assert.deepEqual(STAGE_BONUSES.map(b=>b.id),['party','parking','pedalo','tray','call','taxi','packing','golf']);
 assert.equal(BONUSES_BY_STAGE['1-1'].length,2);assert.ok(BONUSES_BY_STAGE['1-1'][1].x-BONUSES_BY_STAGE['1-1'][0].x>2000);
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),boot=readFileSync(new URL('../src/scenes/BootScene.js',import.meta.url),'utf8');
 for(const name of ['BeachScene','LastMailScene','RevenueScene','ToiletScene']){assert.ok(!main.includes('import '+name));assert.ok(!boot.includes("scene.start('"+name));}
});

test('all seven new models freeze on pause, bound suspended-tab time, reject actions after completion and award only a win',()=>{
 for(const id of Object.keys(ROUND_TYPES)){
  const r=createBonusRound(id);r.update(.1);r.paused=true;const frozen=JSON.stringify(r);r.update(100,{x:1,y:1,boost:true});
  r.action?.();r.play?.('focus');r.move?.('you',1);r.place?.('laptop',0,0);r.close?.();assert.equal(JSON.stringify(r),frozen,id);
  r.paused=false;const before=r.elapsed;r.update(60);assert.ok(r.elapsed-before<=.101,id);
  r.end(false,'end');const final=JSON.stringify(r);r.update(60);r.action?.();r.play?.('focus');r.move?.('you',1);r.close?.();assert.equal(JSON.stringify(r),final,id);assert.equal(r.reward().euro,0);
 }
});

function solveParking(initial){
 const queue=[{cars:initial,path:[]}],seen=new Set();
 for(let i=0;i<queue.length;i++){
  const {cars,path}=queue[i];const key=cars.map(c=>c[c.axis]).join(',');if(seen.has(key))continue;seen.add(key);
  const own=cars.find(c=>c.id==='you');if(own.x===4)return [...path,['you',1]];
  for(const car of cars)for(const dir of [-1,1]){
   const next=structuredClone(cars),c=next.find(c=>c.id===car.id);c[c.axis]+=dir;
   const cells=parkingCells(c),others=new Set(next.filter(o=>o!==c).flatMap(parkingCells).map(p=>p.join(',')));
   if(cells.some(([x,y])=>x<0||x>=6||y<0||y>=6||others.has(x+','+y)))continue;
   queue.push({cars:next,path:[...path,[car.id,dir]]});
  }
 }
 return null;
}
test('all three parking layouts have real collision-respecting solutions and undo restores a move',()=>{
 const r=createBonusRound('parking');
 for(const [index,layout]of PARKING_LAYOUTS.entries()){const path=solveParking(layout);assert.ok(path,'unsolvable parking '+index);for(const [id,delta]of path)assert.ok(r.move(id,delta));}
 assert.ok(r.won);assert.equal(r.reward().euro,15);
 const u=createBonusRound('parking'),before=JSON.stringify(u.cars);assert.ok(u.move('a',1));assert.ok(u.undo());assert.equal(JSON.stringify(u.cars),before);
 assert.equal(u.move('you',2),false);assert.equal(u.move('bogus',1),false);
});

function pack(r,index=0){
 if(index===PACKING_ITEMS.length)return true;const item=PACKING_ITEMS[index];
 for(let rotation=0;rotation<4;rotation++)for(let y=0;y<4;y++)for(let x=0;x<7;x++){
  if(!r.canPlace(item.id,x,y,rotation))continue;
  r.place(item.id,x,y,rotation);if(pack(r,index+1))return true;r.remove(item.id);
 }return false;
}
test('both suitcases are packable using rotations without overlap or heavy objects in the fragile compartment',()=>{
 const r=createBonusRound('packing');assert.equal(r.place('charger',0,0),false);assert.equal(r.place('laptop',3,0),false);
 for(let n=0;n<2;n++){assert.ok(pack(r),'unsolvable suitcase '+n);assert.equal(Object.keys(r.placed).length,7);r.close();}
 assert.ok(r.won);assert.deepEqual(rotatedCells(PACKING_ITEMS[0],4),PACKING_ITEMS[0].cells);
});

// Plan footpaths around the current furniture and crowd; the simulation still
// receives only ordinary direction/distraction input, never teleports or pickups.
function partyPath(r,goal){
 const size=24,point=(x,y)=>({x:75+x*size,y:459+y*size}),key=(x,y)=>x+','+y;
 const start={x:Math.round((r.hero.x-75)/size),y:Math.round((r.hero.y-459)/size),cost:0,path:[]},open=[start],seen=new Map();
 for(let count=0;open.length&&count<2200;count++){
  open.sort((a,b)=>a.score-b.score);const n=open.shift(),p=point(n.x,n.y),id=key(n.x,n.y);
  if(seen.has(id)&&seen.get(id)<=n.cost)continue;seen.set(id,n.cost);
  if(distance(p,goal)<30)return [...n.path,p];
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=n.x+dx,y=n.y+dy,q=point(x,y);
   if(q.x<75||q.x>1525||q.y<459||q.y>831||r.obstacles.some(o=>overlap(q.x,q.y,20,o))||r.guards.some(g=>distance(q,g)<44))continue;
   const cost=n.cost+Math.hypot(dx,dy)*size;
   if(seen.has(key(x,y))&&seen.get(key(x,y))<=cost)continue;
   open.push({x,y,cost,score:cost+distance(q,goal),path:[...n.path,p]});
  }
 }return [];
}
test('party can be escaped through navigation, pickups and distractions at 30 and 120 Hz',()=>{
 for(const fps of [30,120]){
  const r=createBonusRound('party');let path=[];
  for(let frame=0;frame<fps*100&&!r.finished;frame++){
   const goal=!r.coat?PARTY_ITEMS.coat:!r.keys?PARTY_ITEMS.keys:PARTY_ITEMS.exit;
   if(frame%Math.round(fps/5)===0||!path.length)path=partyPath(r,goal);
   while(path.length&&distance(r.hero,path[0])<14)path.shift();
   const target=path[0]||r.hero,d=distance(r.hero,target);
   if(r.alert>12&&(!r.beacon||r.elapsed>r.beacon.until))r.action();
   r.update(1/fps,{x:(target.x-r.hero.x)/Math.max(1,d),y:(target.y-r.hero.y)/Math.max(1,d)});
  }
  assert.ok(r.won,JSON.stringify({fps,hero:r.hero,alert:r.alert,coat:r.coat,keys:r.keys,message:r.message}));
 }
});

test('pedalo can evade reefs and work deliveries while managing energy',()=>{
 for(const fps of [30,120]){
  const r=createBonusRound('pedalo');
  for(let f=0;f<fps*90&&!r.finished;f++){
   const ahead=r.rocks.filter(o=>o.z>r.progress-60&&o.z<r.progress+240);
   const target=[90,270,450,630,810].filter(x=>ahead.every(o=>Math.abs(o.x-x)>o.r+70)).sort((a,b)=>Math.abs(a-r.x)-Math.abs(b-r.x))[0]??90;
   const shield=(!!r.drone&&r.drone.at-r.elapsed<.8&&Math.abs(r.x-r.drone.x)<80)||(r.progress>1700&&Math.abs(r.x-r.bossX)<35&&Math.sin(r.elapsed*1.1)>.7);
   r.update(1/fps,{x:clamp((target-r.x)*.035-r.vx*.018,-1,1),boost:r.energy>35,shield});
  }
  assert.ok(r.won,JSON.stringify({fps,p:r.progress,lives:r.lives,message:r.message}));
 }
});

test('tray can reach the tables with controlled steering and enough food; collisions spill coffee',()=>{
 const r=createBonusRound('tray');
 for(let f=0;f<60*90&&!r.finished;f++){
  const next=r.obstacles.find(o=>!o.passed&&o.z-r.distance<65),target=next?(next.lane<=0?.8:-.8):r.lane;
  r.update(1/60,{x:clamp((target-r.lane)*2-r.velocity*1.3,-.7,.7),shield:!!next});
 }
 assert.ok(r.won,JSON.stringify({message:r.message,coffee:r.coffee,dishes:r.dishes}));
 const loss=createBonusRound('tray');for(let i=0;i<1800&&!loss.finished;i++)loss.update(1/60,{boost:true});assert.ok(loss.coffee<100);
});

test('meeting supports a full tactical win and applies energy, assignment, cooldown and intentions',()=>{
 const r=createBonusRound('call');assert.equal(r.play('bogus'),false);
 for(let turn=0;turn<24&&!r.finished;turn++){
  const target=r.agenda.findIndex(a=>!a.assigned||a.progress<a.goal),a=r.agenda[target];
  let card=(r.intention==='Urgenza'||r.pressure>6)&&r.lastCard!=='park'?'park':!a.assigned?'delegate':r.digressions&&r.lastCard!=='clarify'?'clarify':r.energy>=2&&r.lastCard!=='decide'?'decide':'focus';
  if(card===r.lastCard)card='break';r.play(card,target);
 }
 assert.ok(r.won,JSON.stringify(r));
 const q=createBonusRound('call');q.play('focus');const before=q.turn;assert.equal(q.play('focus'),false);assert.equal(q.turn,before);
});

function drive(r,point){
 for(let i=0;i<60*25&&!r.finished;i++){
  const d=distance(r.car,point);if(d<14&&Math.abs(r.car.speed)<25)return true;
  const target=Math.atan2(point.y-r.car.y,point.x-r.car.x),err=Math.atan2(Math.sin(target-r.car.angle),Math.cos(target-r.car.angle));
  const desired=d<45?Math.max(12,d*.7):80;
  r.update(1/60,{x:clamp(err*2,-1,1),y:Math.abs(err)<1.4&&r.car.speed<desired?-1:0,shield:r.car.speed>desired+5});
 }return false;
}
test('taxi follows roads, stops at the first address and reaches the changed entrance',()=>{
 const r=createBonusRound('taxi');assert.equal(r.action(),false);
 for(const point of [{x:210,y:1650},{x:210,y:930},{x:690,y:930}])assert.ok(drive(r,point),JSON.stringify({car:r.car,health:r.health,message:r.message}));
 assert.ok(r.action());assert.equal(r.stop,1);
 for(const point of [{x:870,y:930},{x:870,y:1650},{x:1990,y:1650}])assert.ok(drive(r,point),JSON.stringify({car:r.car,health:r.health,message:r.message}));
 assert.ok(r.action());assert.ok(r.won,JSON.stringify(r));
});

test('new HD backgrounds and atlases fit their images and texture budgets',()=>{
 const base=new URL('../public/assets/hd-minigames/',import.meta.url);
 for(const name of ['vehicles','details','tray','parking','cove']){
  const png=readFileSync(new URL(name+'.png',base)),w=png.readUInt32BE(16),h=png.readUInt32BE(20);
  assert.ok(png.length<5*1024*1024,name);assert.ok(w<=2048&&h<=2048,name);
  if(['vehicles','details','tray'].includes(name)){
   const atlas=JSON.parse(readFileSync(new URL(name+'.json',base)));
   for(const {frame:f}of Object.values(atlas.frames))assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=w&&f.y+f.h<=h,name);
  }
 }
});
