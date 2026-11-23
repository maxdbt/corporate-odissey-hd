import test from 'node:test';
import assert from 'node:assert/strict';
import { menuWorlds, chooseMenuLevel, bonusDestination } from '../src/menu/MenuModel.js';

const levels=[
 {id:'1-1',world:'Office'}, {id:'1-2',world:'Office'}, {id:'2-1',world:'Canteen'},
 {id:'4-1',world:'Travel',trip:true}, {id:'4-3',world:'Travel',trip:true},
 {id:'5-1',world:'Executive',climb:true}, {id:'5-4',world:'Executive',climb:true}
];
test('chapter selection keeps both office seasons without bypassing travel or climb choices',()=>{
 const worlds=menuWorlds(levels);
 assert.deepEqual(worlds.map(w=>w.levels.map(l=>l.id)),[['1-1','1-2'],['2-1'],['4-1'],['5-1']]);
 assert.equal(chooseMenuLevel(worlds,1).id,'1-2');
 assert.equal(chooseMenuLevel(worlds,5).id,'5-1');
 assert.equal(chooseMenuLevel(worlds,4).id,'1-1');
 assert.equal(chooseMenuLevel(worlds,NaN).id,'1-1');
});
test('debug branch selection retains original indices rather than filtered positions',()=>{
 const worlds=menuWorlds(levels,true);
 assert.equal(chooseMenuLevel(worlds,4).id,'4-3');
 assert.equal(chooseMenuLevel(worlds,6).id,'5-4');
 assert.equal(levels[0].index,undefined);
});
test('golf uses the dedicated scene when registered and remains compatible with the shipped catalog',()=>{
 assert.equal(bonusDestination({id:'golf'},name=>name==='DirectorMinigolfScene'),'DirectorMinigolfScene');
 assert.equal(bonusDestination({id:'golf'},()=>false),'StageBonusScene');
 assert.equal(bonusDestination({id:'pedalo'},()=>true),'StageBonusScene');
 assert.equal(bonusDestination({id:'last-mail'},()=>true),'LastMailScene');
 assert.equal(bonusDestination({id:'taxi'},()=>true),'CityTaxiScene');
 assert.equal(bonusDestination({id:'taxi'},()=>false),'StageBonusScene');
});
