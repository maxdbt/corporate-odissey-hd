import { stageTrack, bossTrack } from './AudioCatalog.js';

const key=s=>s.sys.settings.key;
const pauses=['PauseScene','StagePauseScene','QuitScene','BriefScene'];
const priority=['GameOverScene','VictoryScene','LastMailScene','PartyScene','DirectorMinigolfScene','StageBonusScene','ToiletScene','BeachScene','RevenueScene','ElevatorScene','NegotiationScene','JourneyScene','PackingScene','TransportScene','DestinationScene','GameScene','MenuScene'];

// Read-only scene observation keeps graphics, collisions, rewards and progression independent.
export function selectAudioState(scenes,state){
 const active=new Map(scenes.filter(s=>s.sys.isActive()).map(s=>[key(s),s]));
 const available=new Map(scenes.filter(s=>s.sys.isActive()||s.sys.isPaused()).map(s=>[key(s),s]));
 const chosen=priority.find(name=>active.has(name))||priority.find(name=>available.has(name));
 const scene=available.get(chosen);if(!scene)return null;
 const stage=scene.config?.stage||stageTrack(scene.levelIndex??state.levelIndex);
 const paused=pauses.some(name=>active.has(name))||!!scene.roundPaused||!!scene.round?.paused;
 const dialogue=['FoodScene','RentalScene','QuizScene'].some(name=>active.has(name));
 let track=stage,external=false;
 if(['VictoryScene','PartyScene','LastMailScene','ElevatorScene'].includes(chosen))external=true;
 else if(chosen==='GameOverScene'||(chosen==='GameScene'&&scene.ended))track=null;
 else if(chosen==='MenuScene')track='menu';
 else if(chosen==='ToiletScene')track='bathroom';
 else if(chosen==='BeachScene')track='island';
 else if(chosen==='RevenueScene')track='space';
 else if(chosen==='StageBonusScene')track='bonus-'+stage;
 else if(chosen==='DirectorMinigolfScene')track='bonus-5-4';
 else if(chosen==='GameScene'&&scene.player?.hasStatus?.('promotion'))track='promotion';
 else if((chosen==='GameScene'&&scene.bossActive)||(chosen==='NegotiationScene'&&scene.phase==='boss'))track=bossTrack(stage,state.trip?.leg);
 return {scene,key:chosen,stage,track,external,paused,dialogue};
}

export class GameAudioDirector {
 constructor(game,audio,state,{inputTarget=globalThis.document}={}){
  this.game=game;this.audio=audio;this.state=state;this.previous=new WeakMap();this.announced=new WeakMap();this.current=null;this.nextUpdate=0;
  this.update=this.update.bind(this);game.events.on('poststep',this.update);
  this.inputTarget=inputTarget;
  this.onGesture=event=>{if(!event.repeat)audio.unlock();};
  this.gestures=['pointerdown','pointerup','touchend','keydown'];
  this.gestureOptions={capture:true,passive:true};
  for(const type of this.gestures)inputTarget?.addEventListener(type,this.onGesture,this.gestureOptions);
  this.onVisibility=()=>audio.setPaused(!!inputTarget?.hidden,'hidden');
  inputTarget?.addEventListener('visibilitychange',this.onVisibility);
  this.onVisibility();game.events.once('destroy',()=>this.destroy());
 }
 update(time=0){
  const a=this.audio,selection=selectAudioState(this.game.scene.getScenes(false),this.state);if(!selection)return;
  const {scene,key:sceneKey,track,stage,external,paused,dialogue}=selection;
  a.setPaused(paused,'game');a.setDialogue(dialogue);
  if(!external){if(track)a.music(track);else if(a.currentTrack)a.stopMusic();}
  const changed=this.current?.scene!==scene||this.current?.stage!==stage;
  if(changed){
   this.previous.delete(scene);this.pendingJingle=null;
   if(!external&&track&&sceneKey!=='MenuScene'&&this.announced.get(scene)!==stage){
    this.pendingJingle=track;this.announced.set(scene,stage);
    scene.events?.once('shutdown',()=>{
     this.announced.delete(scene);this.previous.delete(scene);
     if(this.current?.scene===scene){this.current=null;this.pendingJingle=null;}
    });
   }
  }
  this.current=selection;
  if(!paused&&!dialogue){
   if(this.pendingJingle&&a.ctx?.state==='running'){a.jingle(this.pendingJingle);this.pendingJingle=null;}
   if(time>=this.nextUpdate){this.observe(scene,sceneKey,stage);this.nextUpdate=time+70;}
  }
  if(import.meta.env?.DEV&&this.game.canvas)this.game.canvas.dataset.audioState=JSON.stringify({track:a.currentTrack,scene:sceneKey,paused:a.paused,context:a.ctx?.state,muted:a.muted,voices:a.voices.size,effects:a.stats.played,lastEffect:a.stats.lastEffect,limited:a.stats.limited});
 }
 observe(scene,sceneKey,stage){
  const a=this.audio,p=scene.player,old=this.previous.get(scene),now=scene.time?.now||0;
  const next={phase:scene.phase,mount:p?.mount?.type,grounded:p?.onGround,vy:p?.body?.velocity?.y||0,slide:p?.isSliding,
   hp:this.state.hp,time:scene.timeLeft,score:scene.round?.score,lives:scene.round?.lives,revision:scene.round?.revision,
   nearShark:false,nextFoot:old?.nextFoot||0,nextMotor:old?.nextMotor||0,nextSwim:old?.nextSwim||0};
  if(sceneKey==='GameScene'&&p&&!scene.ended){
   const speed=Math.abs(p.body?.velocity?.x||0),moving=speed>30;
   next.nearShark=!!scene.enemies?.getChildren().some(e=>e.active&&!e.dead&&e.kind==='shark'&&Math.abs(e.x-p.x)<160&&Math.abs(e.y-p.y)<100);
   if(old){
    if(next.mount!==old.mount)a.sfx(next.mount?'mount':'dismount');
    if(!old.grounded&&next.grounded&&old.vy>100&&!next.mount&&stage!=='4-9')a.sfx('land');
    if(next.slide&&!old.slide)a.sfx('slide');
    if(next.hp<=25&&old.hp>25)a.sfx('lowHealth');
    if(next.time<=30&&old.time>30)a.sfx('timeWarning');
    if(next.nearShark&&!old.nearShark)a.sfx('shark');
   }
   if(stage==='4-9'&&!['submarine','seahorse'].includes(next.mount)&&(moving||Math.abs(next.vy)>50)&&now>=next.nextSwim){a.sfx('swim');next.nextSwim=now+1000;}
   else if(next.grounded&&moving&&!next.mount&&!next.slide&&now>=next.nextFoot){
    a.sfx(stage==='4-7'?'sandStep':stage==='4-8'?'iceStep':'step');next.nextFoot=now+Math.max(320,650-speed);
   }
   if(next.mount&&moving&&now>=next.nextMotor){
    const name=next.mount==='camel'?'hoof':['taxi','moto','snowmobile','submarine'].includes(next.mount)?'motor':null;
    if(name)a.sfx(name);next.nextMotor=now+(name==='hoof'?550:2200);
   }
  }
  if(old&&sceneKey==='ToiletScene'&&next.phase==='reveal'&&old.phase!=='reveal'){
   a.sfx('door');const outcome=scene.behind?.[scene.sel];
   // Use scene time so the delayed cue respects the same pause as the reveal.
   scene.time.delayedCall(430,()=>a.sfx(outcome==='monster'?'monster':outcome==='hole'?'portal':'flush'));
  }
  if(old&&sceneKey==='StageBonusScene'&&scene.phase==='play'){
   if(next.lives<old.lives)a.sfx('miss');
   else if(next.score>old.score)a.sfx(scene.config.mode==='balance'?'clink':'correct');
   else if(next.revision!==old.revision){
    if(['valves','circuit','route'].includes(scene.config.mode))a.sfx('valve');
    else if(scene.config.mode==='memory')a.sfx('select');
   }
   if(scene.config.id==='phones'&&(old.phase!=='play'||next.revision!==old.revision))a.sfx('phone');
  }
  if(old&&sceneKey==='StageBonusScene'&&next.phase==='result'&&old.phase!=='result')a.sfx(scene.round.won?'victory':'miss');
  this.previous.set(scene,next);
 }
 destroy(){
  this.game.events.off('poststep',this.update);this.inputTarget?.removeEventListener('visibilitychange',this.onVisibility);
  for(const type of this.gestures)this.inputTarget?.removeEventListener(type,this.onGesture,this.gestureOptions);
  this.audio.setPaused(false,'game');this.audio.setPaused(false,'hidden');
 }
}
