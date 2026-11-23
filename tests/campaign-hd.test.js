import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVELS } from '../src/levels/index.js';
import { worldThemes } from '../src/presentation/themes/worlds.js';
import { ASSET_PACKS, THEME_PACKS } from '../src/presentation/AssetPacks.js';
import { STAGE_BONUSES, EXISTING_BONUSES, BONUS_BY_STAGE } from '../src/bonus/StageBonusCatalog.js';
import { awardStageBonus } from '../src/bonus/StageBonusRewards.js';
import { GameState } from '../src/state/GameState.js';
test('all 19 main stages retain their HD themes after the bonus redesign',()=>{
 assert.equal(LEVELS.length,19);
 for(const stage of LEVELS){
  assert.ok(stage.visualTheme,stage.id);
  if(worldThemes[stage.visualTheme])assert.ok(THEME_PACKS[stage.visualTheme].includes('worldShared'));
 }
 assert.equal(STAGE_BONUSES.length,8);
 assert.equal(new Set(STAGE_BONUSES.map(b=>b.id)).size,8);
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

test('awards apply once, are bounded and reset only for a new run',()=>{
 GameState.newGame('woman');GameState.hp=80;GameState.stress=30;GameState.bonusProgress=98;
 const reward={hp:10,stress:10,euro:15};
 assert.equal(awardStageBonus(GameState,'tray',reward),true);
 assert.equal(awardStageBonus(GameState,'tray',reward),false);
 assert.deepEqual([GameState.hp,GameState.stress,GameState.euro,GameState.bonusProgress],[90,20,15,98]);
 GameState.beginLevel(2);assert.equal(awardStageBonus(GameState,'tray',reward),false);
 GameState.newGame('man');assert.equal(awardStageBonus(GameState,'tray',reward),true);
});
