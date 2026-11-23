import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { STAGE_IDS, STAGE_TRACKS, TRACKS, EFFECTS, bossTrack, noteFrequency } from '../src/audio/AudioCatalog.js';
import { SoundEngine } from '../src/audio/SoundEngine.js';
import { GameAudioDirector, selectAudioState } from '../src/audio/GameAudioDirector.js';

class Param {
 constructor(){this.value=1;this.events=[];}
 cancelScheduledValues(t){this.events=this.events.filter(e=>e.t<t);}
 setValueAtTime(v,t){this.value=v;this.events.push({v,t});}
 setTargetAtTime(v,t){this.events.push({v,t});}
 linearRampToValueAtTime(v,t){this.events.push({v,t});}
 exponentialRampToValueAtTime(v,t){this.events.push({v,t});}
}
class Node {
 constructor(ctx){this.ctx=ctx;for(const k of ['gain','frequency','Q','threshold','knee','ratio','attack','release'])this[k]=new Param();}
 connect(){} disconnect(){this.disconnected=true;}
 start(t=0){this.startAt=t;this.ctx.sources.push(this);}
 stop(t=0){this.stopAt=t;}
}
class Context {
 constructor(){this.currentTime=0;this.state='running';this.sampleRate=8000;this.destination={};this.sources=[];}
 createGain(){return new Node(this);} createOscillator(){return new Node(this);}
 createBufferSource(){return new Node(this);} createBiquadFilter(){return new Node(this);}
 createDynamicsCompressor(){return new Node(this);}
 createBuffer(c,n){const data=new Float32Array(n);return{getChannelData:()=>data};}
 suspend(){this.state='suspended';return Promise.resolve();}
 resume(){this.state='running';return Promise.resolve();}
 close(){this.state='closed';return Promise.resolve();}
 advance(t){this.currentTime=t;for(const n of this.sources)if(!n.ended&&n.stopAt<=t){n.ended=true;n.onended?.();}}
}
const setup=(options={})=>{const c=new Context();const a=new SoundEngine({createContext:()=>c,persist:false,live:false,...options});a.unlock();return {a,c};};
const scene=(name,props={},active=true)=>({sys:{settings:{key:name},isActive:()=>active,isPaused:()=>!active},...props});

test('all 19 stages have distinct melodies, short entrance motifs and bonus arrangements',()=>{
 assert.equal(STAGE_IDS.length,19);
 const melodies=new Set();
 for(const id of STAGE_IDS){
  const score=STAGE_TRACKS[id];assert.ok(score);assert.equal(score.jingle.length,4);
  melodies.add(JSON.stringify(score.events.filter(e=>e.instrument===score.instrument).map(e=>[e.at,e.midi])));
  assert.ok(TRACKS['bonus-'+id]);
 }
 assert.equal(melodies.size,19);
 for(const score of Object.values(TRACKS))for(const e of score.events){
  assert.ok(e.at>=0&&e.at<score.beats);assert.ok(e.duration>0&&e.gain>0&&e.gain<=1);
  if(!e.drum)assert.ok(noteFrequency(e.midi)>0);
 }
 assert.equal(noteFrequency('A4'),440);assert.equal(noteFrequency('-'),0);
 assert.equal(new Set(['desert','glacier','sea'].map(leg=>bossTrack('4-10',leg))).size,3);
});

test('ordinary sound spam is limited while critical health feedback remains audible',()=>{
 const {a,c}=setup();assert.equal(a.sfx('coin'),true);assert.equal(a.sfx('coin'),false);
 for(let i=1;i<9;i++){c.advance(i*.09);assert.equal(a.sfx('coin'),true);}
 c.advance(.82);assert.equal(a.sfx('select'),false);assert.equal(a.sfx('hurt'),true);
 assert.equal(a.stats.played,10);assert.equal(a.stats.limited,2);
 c.advance(2);assert.equal(a.sfx('coin'),true);assert.ok(a.voices.size<10);
});

test('mute and multiple pause reasons suppress effects and preserve the shared context',()=>{
 const {a,c}=setup();a.live=true;
 a.setPaused(true,'game');a.setPaused(true,'hidden');assert.equal(c.state,'suspended');
 a.setPaused(false,'game');assert.equal(c.state,'suspended');assert.equal(a.sfx('jump'),false);
 a.setPaused(false,'hidden');assert.equal(c.state,'running');
 a.toggleMute();assert.equal(a.sfx('jump'),false);a.toggleMute();assert.equal(a.sfx('jump'),true);
 a.setVolume('music',4);assert.equal(a.settings.music,1);a.setVolume('effects',-2);assert.equal(a.settings.effects,0);
 a.destroy();assert.equal(c.state,'closed');
});

test('scheduler stays bounded over long sessions and never replays a throttled backlog',()=>{
 const {a,c}=setup();a.music('4-9');const gain=a.trackGain;a.music('4-9');assert.equal(a.trackGain,gain);
 for(let t=.06;t<120;t+=.06){c.advance(t);a._scheduleAhead();}
 assert.ok(a.stats.peakVoices<40,`${a.stats.peakVoices} voices`);
 const before=c.sources.length;c.advance(1000);a._scheduleAhead();assert.ok(c.sources.length-before<20);
 const old=[...a.voices];a.music('boss-sea');assert.equal(a.currentTrack,'boss-sea');
 assert.ok(old.every(v=>v.source.stopAt<=c.currentTime+.1));
 a.stopMusic();c.advance(1002);assert.equal(a.voices.size,0);
});

test('stage, sea bosses, promotions, bonuses and overlay pauses select the intended score',()=>{
 const game=scene('GameScene',{levelIndex:12}),state={levelIndex:12,trip:{leg:'sea'}};
 assert.equal(selectAudioState([game],state).track,'4-9');
 assert.equal(selectAudioState([scene('NegotiationScene',{phase:'boss'})],{...state,levelIndex:13}).track,'boss-sea');
 assert.equal(selectAudioState([scene('GameScene',{player:{hasStatus:()=>true}})],state).track,'promotion');
 assert.equal(selectAudioState([scene('StageBonusScene',{config:{stage:'1-2'}})],state).track,'bonus-1-2');
 assert.equal(selectAudioState([scene('DirectorMinigolfScene',{round:{paused:true}})],state).paused,true);
 assert.equal(selectAudioState([scene('DirectorMinigolfScene')],state).track,'bonus-5-4');
 const paused=scene('GameScene',{levelIndex:12},false);
 assert.equal(selectAudioState([paused,scene('BriefScene')],state).paused,true);
 assert.equal(selectAudioState([paused,scene('FoodScene')],state).dialogue,true);
 assert.equal(selectAudioState([game,scene('LastMailScene')],state).external,true);
});

test('returning from a bonus does not repeat the stage entrance jingle',()=>{
 const {a}=setup(),played=[];a.jingle=id=>played.push(id);
 const stage=scene('GameScene',{levelIndex:1}),bonus=scene('BeachScene');let scenes=[stage];
 const game={scene:{getScenes:()=>scenes},events:{on(){},off(){},once(){}}};
 const d=new GameAudioDirector(game,a,{levelIndex:1});d.update(100);
 scenes=[bonus];d.update(200);scenes=[stage];d.update(300);
 assert.deepEqual(played,['1-2','island']);d.destroy();a.destroy();
});

test('situational cues fire on transitions, not every frame',()=>{
 const calls=[],state={hp:100},d=Object.create(GameAudioDirector.prototype);
 d.audio={sfx:n=>calls.push(n)};d.state=state;d.previous=new WeakMap();
 const player={body:{velocity:{x:0,y:0}},onGround:true,mount:null};
 const s={player,time:{now:0},timeLeft:100,enemies:{getChildren:()=>[]}};
 d.observe(s,'GameScene','4-9');state.hp=20;s.timeLeft=29;player.mount={type:'seahorse'};
 d.observe(s,'GameScene','4-9');d.observe(s,'GameScene','4-9');
 assert.deepEqual(calls,['mount','lowHealth','timeWarning']);
});

test('pause is applied on the next frame without waiting for the foley polling interval',()=>{
 const {a,c}=setup();a.live=true;
 const stage=scene('GameScene',{levelIndex:0});let scenes=[stage];
 const game={scene:{getScenes:()=>scenes},events:{on(){},off(){},once(){}}};
 const d=new GameAudioDirector(game,a,{levelIndex:0});d.update(100);
 scenes=[scene('GameScene',{},false),scene('PauseScene')];d.update(116);
 assert.equal(c.state,'suspended');scenes=[stage];d.update(132);assert.equal(c.state,'running');
 d.destroy();a.destroy();
});

test('every defined effect schedules finite envelopes and nodes are released',()=>{
 for(const [name,effect]of Object.entries(EFFECTS)){
  const {a,c}=setup();assert.equal(a.sfx(name),true,name);assert.ok(c.sources.length>0,name);
  assert.ok(effect.gap>=0);
  for(const node of c.sources){assert.ok(Number.isFinite(node.stopAt));assert.ok(node.stopAt>node.startAt);}
  c.advance(3);assert.equal(a.voices.size,0,name);
 }
});

test('directly opened bonuses unlock on touch or keyboard and remove gesture listeners on destroy',()=>{
 const {a,c}=setup();c.state='suspended';
 const input=new EventTarget(),bonus=scene('StageBonusScene',{config:{stage:'4-9',id:'valves'},phase:'intro'});
 const game={scene:{getScenes:()=>[bonus]},events:new EventEmitter()};
 const d=new GameAudioDirector(game,a,{levelIndex:0},{inputTarget:input});d.update(100);
 assert.equal(a.currentTrack,'bonus-4-9');assert.equal(c.state,'suspended');
 input.dispatchEvent(new Event('pointerup'));assert.equal(c.state,'running');
 c.state='suspended';input.dispatchEvent(new Event('keydown'));assert.equal(c.state,'running');
 d.destroy();c.state='suspended';input.dispatchEvent(new Event('pointerup'));assert.equal(c.state,'suspended');a.destroy();
});

test('a paused briefing can unlock silently in the user gesture then resume normally',async()=>{
 const {a,c}=setup();a.live=true;a.setPaused(true,'game');
 assert.equal(c.state,'suspended');a.unlock();
 assert.equal(c.state,'running');assert.equal(a.pauseGate.gain.value,0);assert.equal(a.sfx('coin'),false);
 await Promise.resolve();assert.equal(c.state,'suspended');
 a.setPaused(false,'game');assert.equal(c.state,'running');assert.equal(a.pauseGate.gain.value,1);a.destroy();
});

test('restarting the same scene clears audio observations and restores its entrance motif',()=>{
 const {a,c}=setup(),played=[];a.jingle=id=>played.push(id);
 const stage=scene('GameScene',{levelIndex:1,events:new EventEmitter()});
 const game={scene:{getScenes:()=>[stage]},events:new EventEmitter()};
 const d=new GameAudioDirector(game,a,{levelIndex:1});d.update(100);
 stage.events.emit('shutdown');c.advance(3);d.update(3100);
 assert.deepEqual(played,['1-2','1-2']);d.destroy();a.destroy();
});

test('telephone challenges ring on entry and renewal; memory steps give discrete feedback',()=>{
 const calls=[],d=Object.create(GameAudioDirector.prototype);d.audio={sfx:n=>calls.push(n)};d.state={};d.previous=new WeakMap();
 const s={phase:'intro',time:{now:0},config:{id:'phones',mode:'signals'},round:{score:0,lives:3,revision:1}};
 d.observe(s,'StageBonusScene','4-6');s.phase='play';d.observe(s,'StageBonusScene','4-6');
 s.round.score++;s.round.revision++;d.observe(s,'StageBonusScene','4-6');d.observe(s,'StageBonusScene','4-6');
 assert.deepEqual(calls,['phone','correct','phone']);
 calls.length=0;s.config={id:'gestures',mode:'memory'};s.round.revision++;d.observe(s,'StageBonusScene','5-2');
 assert.deepEqual(calls,['select']);
});
