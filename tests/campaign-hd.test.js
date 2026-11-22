import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVELS } from '../src/levels/index.js';
import { worldThemes } from '../src/presentation/themes/worlds.js';
import { ASSET_PACKS, THEME_PACKS } from '../src/presentation/AssetPacks.js';
import { STAGE_BONUSES, EXISTING_BONUSES, BONUS_BY_STAGE } from '../src/bonus/StageBonusCatalog.js';
import StageBonusRound from '../src/bonus/StageBonusRound.js';
import { awardStageBonus } from '../src/bonus/StageBonusRewards.js';
import { GameState } from '../src/state/GameState.js';
const seeded = seed => () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);

test('all 19 stages have an HD theme and exactly one dedicated bonus',()=>{
 assert.equal(LEVELS.length,19);
 for(const stage of LEVELS){
  assert.ok(stage.visualTheme,stage.id);
  assert.equal(Number(!!EXISTING_BONUSES[stage.id])+Number(!!BONUS_BY_STAGE[stage.id]),1,stage.id);
  if(worldThemes[stage.visualTheme])assert.ok(THEME_PACKS[stage.visualTheme].includes('worldShared'));
 }
 assert.equal(STAGE_BONUSES.length,16);
 assert.equal(new Set(STAGE_BONUSES.map(b=>b.id)).size,16);
});

test('all new world and bonus skins resolve to actual atlas frames',()=>{
 const frames={
  'hd-dressing':JSON.parse(readFileSync(new URL('../public/assets/hd-office/office-dressing.json',import.meta.url))).frames,
  'hd-props':JSON.parse(readFileSync(new URL('../public/assets/hd-office/office-props.json',import.meta.url))).frames,
  'hd-enemies':JSON.parse(readFileSync(new URL('../public/assets/hd-office/office-enemies.json',import.meta.url))).frames
 };
 for(const pack of Object.values(ASSET_PACKS))for(const[key,,json]of pack.assets)if(json){
  frames[key]=JSON.parse(readFileSync(new URL('../public/assets/'+pack.directory+'/'+json,import.meta.url))).frames;
 }
 for(const theme of Object.values(worldThemes)){
  for(const [key,spec]of Object.entries(theme.props))assert.ok(frames[spec[2]||'hd-props']?.[spec[0]],key);
  for(const [key,spec]of Object.entries(theme.enemies))assert.ok(frames[spec[2]?.texture||'hd-enemies']?.[spec[0]],key);
 }
 for(const b of STAGE_BONUSES)assert.ok(frames['hd-world-'+b.atlas]?.[b.frame],b.id);
});

function solve(round){
 const mode=round.config.mode, dt=1/60;
 for(let frame=0;frame<3600&&!round.finished;frame++){
  let control=0;
  if(mode==='balance')control=Math.max(-1,Math.min(1,-round.tilt*3-round.velocity*2-(round.wind||0)*.24));
  if(mode==='flight')control=Math.sign(round.gate-round.position);
  round.update(dt,control);
  if(mode==='choices'||mode==='signals')round.act(round.answer);
  else if(mode==='memory'&&round.elapsed>=round.showUntil)round.act(round.sequence[round.cursor]);
  else if(['route','circuit','valves'].includes(mode)){
   const wrong=round.switches.findIndex((v,i)=>v!==round.target[i]);round.act(wrong<0?3:wrong);
  }else if(mode==='rhythm'&&round.phase>.66)round.act();
  else if(mode==='golf'&&Math.abs(round.power-round.targetPower)<.07)round.act();
 }
 return round;
}
test('each of the 16 activities is winnable using its public controls across multiple seeds',()=>{
 for(const config of STAGE_BONUSES)for(let seed=1;seed<=12;seed++){
  const round=solve(new StageBonusRound(config,seeded(seed)));
  assert.ok(round.finished&&round.won,config.id+' seed '+seed+' score '+round.score);
  assert.equal(round.score,config.goal);
  assert.ok(round.elapsed<=config.duration);
  assert.deepEqual(round.reward(),config.reward);
 }
});

test('pause freezes every mode; large deltas are bounded; completed results are immutable',()=>{
 for(const config of STAGE_BONUSES){
  const r=new StageBonusRound(config,seeded(20));r.update(.1);r.paused=true;
  const snapshot=JSON.stringify(r);
  r.update(60,1);r.act(0);assert.equal(JSON.stringify(r),snapshot,config.id);
  r.paused=false;const before=r.elapsed;r.update(600,0);assert.ok(r.elapsed-before<=.10001);
  r.end(false);const ended=JSON.stringify(r);r.act(0);r.update(20);r.end(true);
  assert.equal(JSON.stringify(r),ended);assert.deepEqual(r.reward(),{hp:0,stress:0,euro:0});
 }
});

test('wrong answers, ignored calls and missed phones can lose, without penalizing the campaign',()=>{
 for(const id of ['address','call','phones']){
  const config=STAGE_BONUSES.find(b=>b.id===id),r=new StageBonusRound(config,seeded(5));
  if(id==='address')for(let i=0;i<3;i++)r.act((r.answer+1)%3);
  else for(let i=0;i<1000&&!r.finished;i++)r.update(.1);
  assert.ok(r.finished&&!r.won,id);assert.equal(r.lives,0);
 }
});

test('awards apply once, are bounded and reset only for a new run',()=>{
 GameState.newGame('woman');GameState.hp=80;GameState.stress=30;GameState.bonusProgress=98;
 const reward={hp:10,stress:10,euro:15};
 assert.equal(awardStageBonus(GameState,'tray',reward),true);
 assert.equal(awardStageBonus(GameState,'tray',reward),false);
 assert.deepEqual([GameState.hp,GameState.stress,GameState.euro,GameState.bonusProgress],[90,20,15,98]);
 GameState.beginLevel(2);assert.equal(awardStageBonus(GameState,'tray',reward),false);
 GameState.newGame('man');assert.equal(awardStageBonus(GameState,'tray',reward),true);
});
