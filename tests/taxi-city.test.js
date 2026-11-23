import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import TaxiDrive from '../src/bonus/new/TaxiDrive.js';
import {CITY_SIZE,onCityRoad,lightGreen} from '../src/bonus/new/TaxiCity.js';

test('city is scrollable and driving cannot cross buildings, works or map edges',()=>{
 assert.ok(CITY_SIZE>2000);assert.equal(onCityRoad(540,540),false);assert.equal(onCityRoad(1250,870),false);assert.equal(onCityRoad(-1,180),false);
 const r=new TaxiDrive();r.car={x:210,y:540,angle:0,speed:240};for(let i=0;i<100;i++)r.update(1/60,{y:-1});assert.ok(r.car.x<260);assert.ok(r.health<100);
});
test('city traffic, walkers and signals move and pause together; free driving has no countdown',()=>{
 const r=new TaxiDrive({freeRide:true}),before=JSON.stringify(r.traffic),walk=r.walkers[0].walk;
 for(let i=0;i<60;i++)r.update(1/60);assert.notEqual(JSON.stringify(r.traffic),before);assert.ok(r.walkers[0].walk>walk);
 assert.equal(lightGreen(4,'x'),true);assert.equal(lightGreen(4,'y'),false);assert.equal(lightGreen(14,'y'),true);
 r.paused=true;const frozen=JSON.stringify(r);r.update(999);assert.equal(JSON.stringify(r),frozen);
 r.paused=false;r.elapsed=241;r.update(1/60);assert.equal(r.finished,false);
 const timed=new TaxiDrive();timed.elapsed=241;timed.update(1/60);assert.ok(timed.finished&&!timed.won);
});
test('city HD atlases have genuine alpha, in-bounds frames and bounded mobile textures',()=>{
 for(const name of ['buildings','props','pedestrians']){
  const base=new URL('../public/assets/hd-city-taxi/',import.meta.url),png=readFileSync(new URL(name+'.png',base)),atlas=JSON.parse(readFileSync(new URL(name+'.json',base)));
  const w=png.readUInt32BE(16),h=png.readUInt32BE(20);assert.ok(w<=2048&&h<=2048);assert.ok(png.length<5*1024*1024);assert.equal(png[25],6);
  for(const {frame:f} of Object.values(atlas.frames))assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=w&&f.y+f.h<=h);
  if(name==='pedestrians')assert.equal(Object.keys(atlas.frames).length,12);
 }
});
