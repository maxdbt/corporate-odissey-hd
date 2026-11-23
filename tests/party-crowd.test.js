import test from 'node:test';
import assert from 'node:assert/strict';
import PartyEscape,{PARTY_ITEMS} from '../src/bonus/new/PartyEscape.js';
import {PARTY_CAST,PARTY_HEROES} from '../src/bonus/new/PartyCast.js';
import {partyPose,partyFrames} from '../src/bonus/new/PartyMotion.js';
import {createHash} from 'node:crypto';
import {distance} from '../src/bonus/new/physics.js';
import {readFileSync} from 'node:fs';

test('party has a moving crowd of 24 with six colleagues who seek the player',()=>{
 const r=new PartyEscape(),start=r.guards.map(p=>({...p}));
 assert.equal(r.guards.length,24);assert.equal(r.guards.filter(p=>p.chaser).length,6);
 assert.equal(new Set(r.guards.map(p=>p.kind)).size,24);
 for(let i=0;i<60;i++)r.update(1/60);
 assert.ok(r.guards.filter((p,i)=>distance(p,start[i])>1).length>=18);
 const p=r.guards.find(p=>p.chaser);r.hero={x:p.x-110,y:p.y,walk:0,facing:1};
 const before=distance(p,r.hero);r.update(.1);assert.ok(distance(p,r.hero)<before);
});

test('a colleague physically blocks the player and nearby distractions or cover release attention',()=>{
 const r=new PartyEscape();r.guards=[{...r.guards[0],x:175,y:745,home:{x:175,y:721}}];
 r.update(.1,{x:1});assert.ok(r.hero.x<145);assert.ok(distance(r.hero,r.guards[0])>=35);assert.ok(r.alert>0);
 // A phone at the other end of the room must not disable this colleague.
 r.beacon={x:1500,y:600,until:r.elapsed+6};const before=r.alert;r.update(.1);assert.ok(r.alert>before);
 assert.ok(r.action());assert.equal(r.distractions,3);r.update(.1);assert.equal(r.blocking,0);
 r.hero={...r.hero,...r.covers[0]};r.alert=50;r.update(.1,{shield:true});assert.ok(r.hidden);assert.ok(r.alert<50);
});

test('coat, keys and exit require crossing the room and the coat stays equipped',()=>{
 const items=Object.values(PARTY_ITEMS);
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)assert.ok(distance(items[i],items[j])>600);
 const r=new PartyEscape();r.hero={...r.hero,x:PARTY_ITEMS.coat.x,y:PARTY_ITEMS.coat.y+40};
 r.update(.1,{y:-1});assert.equal(r.coat,true);assert.equal(r.keys,false);assert.equal(r.finished,false);
 r.update(.1,{y:1});assert.equal(r.coat,true);
});

test('rendering interpolates motion across a cycle boundary and pause freezes animation',()=>{
 const p={x:110,y:80,walk:12.1,previous:{x:100,y:60,walk:11.9}};
 assert.deepEqual(partyPose(p,.5),{x:105,y:70,walk:12});
 assert.deepEqual(partyFrames(11.75),[{frame:12,weight:.25},{frame:1,weight:.75}]);
 const r=new PartyEscape();r.update(.1,{x:1});r.paused=true;
 const snapshot=JSON.stringify([r.hero,r.guards,r.elapsed]);r.update(.1,{x:1});
 assert.equal(JSON.stringify([r.hero,r.guards,r.elapsed]),snapshot);
});

test('approved party art has 336 anchored animation cells and fits mobile texture/cache budgets',()=>{
 const root=new URL('../public/assets/hd-party-escape/',import.meta.url);
 const actors=[...PARTY_CAST.map(id=>'guest-'+id),...PARTY_HEROES],hashes=new Set();
 const motion=JSON.parse(readFileSync(new URL('motion.json',root)));let total=0;
 assert.equal(actors.length,28);
 for(const name of ['room','props',...actors]){
  const png=readFileSync(new URL(name+'.png',root)),w=png.readUInt32BE(16),h=png.readUInt32BE(20);
  assert.ok(w<=2048&&h<=2048,name);assert.ok(png.length<5*1024*1024,name);
  const webp=readFileSync(new URL(name+'.webp',root));assert.equal(webp.toString('ascii',8,12),'WEBP');total+=webp.length;
  if(name==='room')continue;
  assert.equal(png[25],6,name+' must have an alpha channel');
  const atlas=JSON.parse(readFileSync(new URL(name+'.json',root)));
  assert.equal(Object.keys(atlas.frames).length,name==='props'?6:12);
  for(const {frame:f}of Object.values(atlas.frames))assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=w&&f.y+f.h<=h,name);
  if(name==='props')continue;
  hashes.add(createHash('sha256').update(png).digest('hex'));assert.equal(motion[name].length,12);
  for(const anchor of motion[name])assert.ok(anchor.x>.1&&anchor.x<.9&&anchor.y>.5&&anchor.y<=1&&anchor.scale>=1&&anchor.scale<2,name);
 }
 assert.equal(hashes.size,28,'every guest and each coat variant has its own artwork');
 assert.ok(total<14*1024*1024,'room and all actors must stay below 14 MiB over the network');
});
