import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENTITY_MOTIONS, NPC_MOTIONS, entityMotionSpec, npcMotionSpec, interleavedFrame, monsterFrame, advanceLocomotion, beginBossAction } from '../src/presentation/MotionCatalog.js';
import { ASSET_PACKS, THEME_PACKS } from '../src/presentation/AssetPacks.js';
import { RIDE_SKINS, mountedPose, mountedTexture, hasMountedSkin, isMountedAttachment } from '../src/presentation/MountSkins.js';
const frames={};
for(const pack of Object.values(ASSET_PACKS))for(const [key,,json]of pack.assets)if(json)frames[key]=JSON.parse(readFileSync(new URL('../public/assets/'+pack.directory+'/'+json,import.meta.url))).frames;
const scene={time:{now:0},textures:{exists:key=>!!frames[key]}};
const source=key=>({texture:{key},x:0,y:0,flipX:false,body:{velocity:{x:0}}});

test('every animated creature has 12 distinct atlas regions and bosses have 24',()=>{
 for(const [name,sheet,,, ,action]of ENTITY_MOTIONS){
  const regions=[];
  for(const atlas of [sheet,action].filter(Boolean))for(let i=1;i<=12;i++){
   const f=frames['hd-'+atlas]?.[name+i];assert.ok(f,name+i);
   regions.push(atlas+JSON.stringify(f.frame));
  }
  assert.equal(new Set(regions).size,action?24:12,name);
 }
 for(const [name,group]of NPC_MOTIONS){
  const poses=Array.from({length:12},(_,i)=>interleavedFrame('hd-'+group+'-npc',name,i));
  assert.equal(new Set(poses.map(p=>p.texture+'/'+p.frame)).size,12);
  poses.forEach(p=>assert.ok(frames[p.texture][p.frame]));
 }
 for(let i=0;i<12;i++){const p=monsterFrame(i);assert.ok(frames[p.texture][p.frame]);}
});

test('locomotion follows actual travel, freezes at walls and bounds teleports',()=>{
 const s=source('talker1'),skin={};
 assert.equal(advanceLocomotion(skin,s,16,100,16),0);
 for(let i=0;i<30;i++)assert.equal(advanceLocomotion(skin,s,16,100,16),0);
 const reached=new Set();
 for(let i=0;i<32;i++){s.x+=6.25;reached.add(advanceLocomotion(skin,s,16,100,16));}
 assert.equal(reached.size,16);
 const before=skin.motionPhase;s.x+=10000;advanceLocomotion(skin,s,16,100,16);
 assert.ok(skin.motionPhase-before<2);
});

test('swimming creatures traverse all frames and freeze when scene time pauses',()=>{
 for(const key of ['shark1','jelly1','seahorse','fish_padulo']){
  const s=source(key),skin={},seen=new Set();
  for(let i=0;i<12;i++){scene.time.now=i*95;seen.add(entityMotionSpec(scene,s,skin,16,30).frame);}
  assert.equal(seen.size,12,key);
  const paused=entityMotionSpec(scene,s,skin,16,30);
  assert.deepEqual(entityMotionSpec(scene,s,skin,10000,30),paused);
 }
});

test('boss attacks play all 12 action frames then return to movement without affecting physics',()=>{
 for(const [name,sheet,keys,,,action]of ENTITY_MOTIONS.filter(m=>m[5]&&m[3]!=='dialogue')){
  const s=source(keys.split(' ')[0]),skin={};beginBossAction(s,100,1200);
  const originalBody=JSON.stringify(s.body),seen=new Set();
  for(let i=0;i<12;i++){scene.time.now=100+i*100;const pose=entityMotionSpec(scene,s,skin,16,80);assert.equal(pose.texture,'hd-'+action);seen.add(pose.frame);}
  assert.equal(seen.size,12,name);scene.time.now=1300;
  assert.equal(entityMotionSpec(scene,s,skin,16,80).texture,'hd-'+sheet);
  assert.equal(JSON.stringify(s.body),originalBody);
 }
});

test('sea, boss and passenger scenes explicitly load their animation packs',()=>{
 for(const [theme,packs]of Object.entries({
  'sea-hd':['fauna-sea','divers','motion-mounts'],
  'meeting-hd':['motion-angry','motion-angry-action'],
  'roof-hd':['motion-ceo','motion-ceo-action'],
  'client-hd':['motion-beasts-action','motion-ocean-action','motion-consultants','motion-diver-slide'],
  'plane-hd':['motion-passengers-work','motion-passengers-talk','motion-passengers-rest'],
  'glacier-hd':['fauna-land','fauna-misc','motion-diver-slide']
 }))for(const pack of packs)assert.ok(THEME_PACKS[theme].includes(pack),theme+'/'+pack);
 assert.ok(!THEME_PACKS['office-hd'].includes('fauna-sea'));
 assert.ok(ASSET_PACKS['fauna-sea'].transient);
});

test('every vehicle uses 12 integrated rider frames per character and releases its attachments on dismount',()=>{
 for(const type of [...Object.keys(RIDE_SKINS),'camel-flying'])for(const character of ['man','woman']){
  const texture='hd-ride-'+type;
  for(let i=1;i<=12;i++)assert.ok(frames[texture]?.[character+i],texture+'/'+character+i);
  const p={...source('man_idle'),character,clock:0,facing:1,onGround:type!=='camel-flying',
   mount:{type:type==='camel-flying'?'camel':type,turbo:type==='camel-flying',cfg:{lift:14},sprite:{},head:{},wings:{}}};
  const physics=JSON.stringify(p.body),skin={},pose=mountedPose(scene,p,skin,16);
  assert.equal(pose.texture,texture);assert.ok(hasMountedSkin(scene,p));
  assert.ok(isMountedAttachment(p,p.mount.sprite));assert.ok(isMountedAttachment(p,p.mount.head));
  assert.ok(!isMountedAttachment(p,{}),'parked vehicles must remain visible');
  p.body.bottom=386;p.y=372;
  assert.equal(mountedPose(scene,p,skin,16).offsetY,14,'art must follow the actual collision floor');
  delete p.body.bottom;
  p.facing=-1;assert.equal(mountedPose(scene,p,skin,16).flipX,true);
  if(type==='husky')assert.equal(mountedPose(scene,p,skin,16).originX,.75);
  p.mount=null;
  assert.equal(mountedTexture(p),null);assert.equal(mountedPose(scene,p,skin,16),null);
  assert.equal(hasMountedSkin(scene,p),false);assert.equal(isMountedAttachment(p,{}),false);
  assert.equal(JSON.stringify(p.body),physics);
 }
});

test('fins use the diver animation and suppress the old mask and fin overlays',()=>{
 const p={mount:{type:'fins',sprite:{},head:{}}};
 assert.equal(mountedTexture(p),null);assert.ok(hasMountedSkin(scene,p));
 assert.ok(isMountedAttachment(p,p.mount.head));
});
