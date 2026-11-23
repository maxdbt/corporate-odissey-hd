import { TRACKS, EFFECTS, noteFrequency } from './AudioCatalog.js';

const DEFAULTS={master:.65,music:.32,effects:.64,voices:.85,muted:false};
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
export class SoundEngine {
 constructor({createContext,resolveTrack=name=>name,persist=true,live=true,offline=false}={}){
  this.createContext=createContext;this.resolveTrack=resolveTrack;this.persist=persist;this.live=live;this.offline=offline;
  this.settings={...DEFAULTS};this.ctx=null;this.currentTrack=null;this.musicTimer=null;
  this.voices=new Set();this.lastEffects=new Map();this.recentEffects=[];this.pauseReasons=new Set();
  this.listeners=new Set();this.stats={played:0,limited:0,peakVoices:0,lastEffect:null};
  if(persist)try{const saved=JSON.parse(globalThis.localStorage?.getItem('corporate-audio-v2')||'null');
   if(saved){for(const k of ['master','music','effects','voices'])if(Number.isFinite(saved[k]))this.settings[k]=clamp(saved[k]);this.settings.muted=!!saved.muted;}
  }catch{/* Private browsing may refuse storage. */}
 }
 get muted(){return this.settings.muted;}
 get paused(){return this.pauseReasons.size>0;}
 _ensure(){
  if(this.ctx)return this.ctx;
  try{
   const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
   if(!this.createContext&&!AC)return null;
   this.ctx=this.createContext?this.createContext():new AC();const c=this.ctx;
   this.master=c.createGain();this.compressor=c.createDynamicsCompressor();
   this.compressor.threshold.value=-10;this.compressor.knee.value=12;this.compressor.ratio.value=6;
   this.compressor.attack.value=.005;this.compressor.release.value=.16;
   // A silent gate lets a gesture unlock the device even while a briefing is paused.
   this.pauseGate=c.createGain();this.pauseGate.gain.value=this.paused?0:1;
   this.master.connect(this.pauseGate);this.pauseGate.connect(this.compressor);this.compressor.connect(c.destination);
   this.musicGain=c.createGain();this.sfxGain=c.createGain();this.voiceGain=c.createGain();this.musicDuck=c.createGain();
   this.musicGain.connect(this.musicDuck);this.musicDuck.connect(this.master);
   this.sfxGain.connect(this.master);this.voiceGain.connect(this.master);this._applyLevels(true);
   const noise=c.createBuffer(1,c.sampleRate,c.sampleRate),data=noise.getChannelData(0);
   let seed=28173;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
   this.noiseBuffer=noise;return c;
  }catch{this.ctx=null;return null;}
 }
 _applyLevels(initial=false){
  if(!this.ctx)return;const t=this.ctx.currentTime;
  for(const [bus,value]of [[this.master,this.muted?0:this.settings.master],[this.musicGain,this.settings.music],[this.sfxGain,this.settings.effects],[this.voiceGain,this.settings.voices]]){
   bus.gain.cancelScheduledValues(t);if(initial)bus.gain.setValueAtTime(value,t);else bus.gain.setTargetAtTime(value,t,.025);
  }
 }
 setVolume(bus,value){if(!['master','music','effects','voices'].includes(bus))return;this.settings[bus]=clamp(value);this._changed();}
 toggleMute(){this.settings.muted=!this.muted;this._changed();return this.muted;}
 _changed(){this._applyLevels();if(this.persist)try{globalThis.localStorage?.setItem('corporate-audio-v2',JSON.stringify(this.settings));}catch{}
  for(const fn of this.listeners)fn(this.settings);
 }
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 unlock(){
  try{
   const c=this._ensure();if(!c||c.state==='running'||c.state==='closed')return;
   // resume() must run inside the gesture, including when the overlay closes next frame.
   // The gate stays silent until all pause reasons are removed.
   c.resume()?.then(()=>{
    if(this.paused&&this.ctx===c&&c.state==='running')return c.suspend();
   }).catch(()=>{});
  }catch{}
 }
 setPaused(value,reason='game'){
  const before=this.paused;if(value)this.pauseReasons.add(reason);else this.pauseReasons.delete(reason);
  if(before===this.paused||!this.ctx||!this.live)return;
  this.pauseGate.gain.cancelScheduledValues(this.ctx.currentTime);
  this.pauseGate.gain.setValueAtTime(this.paused?0:1,this.ctx.currentTime);
  try{if(this.paused)this.ctx.suspend()?.catch(()=>{});else this.ctx.resume()?.catch(()=>{});}catch{}
 }
 _trackNode(source,gain,extras,owner,end){
  const voice={source,gain,extras,owner,end};this.voices.add(voice);this.stats.peakVoices=Math.max(this.stats.peakVoices,this.voices.size);
  source.onended=()=>{this.voices.delete(voice);source.disconnect();gain.disconnect();for(const n of extras)n.disconnect();};
 }
 _tone(type,f0,f1,start,dur,vol,dest,owner='effect',attack=.006){
  const c=this.ctx;if(!c||!Number.isFinite(f0)||f0<=0||vol<=0||dur<=0||(!this.offline&&this.voices.size>=96))return;
  const osc=c.createOscillator(),g=c.createGain();osc.type=type;osc.frequency.setValueAtTime(Math.max(20,f0),start);
  if(f1>0&&f1!==f0)osc.frequency.exponentialRampToValueAtTime(Math.max(20,f1),start+dur);
  g.gain.setValueAtTime(.00001,start);g.gain.linearRampToValueAtTime(vol,start+Math.min(attack,dur*.2));
  g.gain.exponentialRampToValueAtTime(.00001,start+dur);
  osc.connect(g);g.connect(dest);this._trackNode(osc,g,[],owner,start+dur+.02);osc.start(start);osc.stop(start+dur+.02);
 }
 _noise(start,dur,vol,filter=1200,dest=this.sfxGain,owner='effect'){
  const c=this.ctx;if(!c||(!this.offline&&this.voices.size>=96))return;
  const src=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();
  src.buffer=this.noiseBuffer;src.loop=true;f.type=filter>4500?'highpass':'lowpass';f.frequency.value=filter;f.Q.value=.35;
  g.gain.setValueAtTime(.00001,start);g.gain.linearRampToValueAtTime(vol,start+.004);g.gain.exponentialRampToValueAtTime(.00001,start+dur);
  src.connect(f);f.connect(g);g.connect(dest);this._trackNode(src,g,[f],owner,start+dur+.01);src.start(start,.19);src.stop(start+dur+.01);
 }
 _instrument(event,start,seconds,out,owner){
  if(event.drum){if(event.drum==='kick')this._tone('sine',110,42,start,.14,event.gain,out,owner);else this._noise(start,.055,event.gain,5500,out,owner);return;}
  const f=noteFrequency(event.midi),g=event.gain,d=event.duration*seconds;
  switch(event.instrument){
   case 'pad':this._tone('sine',f,0,start,d,g,out,owner,.15);break;
   case 'bass':this._tone('sine',f,0,start,d,g,out,owner,.015);this._tone('triangle',f*2,0,start,d*.45,g*.09,out,owner);break;
   case 'bell':case 'glass':case 'water':this._tone('sine',f,0,start,Math.max(.32,d),g*.7,out,owner,.008);this._tone('sine',f*(event.instrument==='water'?2:2.01),0,start,d*.5,g*.17,out,owner);break;
   case 'reed':this._tone('triangle',f,0,start,d,g*.6,out,owner,.035);this._tone('sine',f*2,0,start,d*.75,g*.13,out,owner,.04);break;
   case 'piano':this._tone('triangle',f,0,start,d,g*.55,out,owner);this._tone('sine',f*2,0,start,d*.38,g*.2,out,owner);break;
   default:this._tone('sine',f,0,start,d,g*.8,out,owner);this._tone('sine',f*(event.instrument==='marimba'?3:2),0,start,Math.min(.09,d),g*.1,out,owner);
  }
 }
 duck(amount=.55,duration=.65){
  if(!this.ctx)return;const t=this.ctx.currentTime,param=this.musicDuck.gain;
  param.cancelScheduledValues(t);param.setTargetAtTime(amount,t,.025);param.setTargetAtTime(this.dialogue ? .55 : 1,t+duration,.18);
 }
 setDialogue(value){if(this.dialogue===value)return;this.dialogue=value;if(this.ctx){const p=this.musicDuck.gain,t=this.ctx.currentTime;p.cancelScheduledValues(t);p.setTargetAtTime(value ? .55 : 1,t,.15);}}
 sfx(name){
  try{
   const e=EFFECTS[name],c=this._ensure();if(!e||!c||this.muted||this.paused||c.state!=='running')return false;
   const t=c.currentTime,key=e.group||name,last=this.lastEffects.get(name)??-Infinity,group=this.lastEffects.get('group:'+key)??-Infinity;
   this.recentEffects=this.recentEffects.filter(at=>t-at<1);
   if((t-last)*1000<e.gap||(t-group)<.045||(!(e.priority>=2)&&this.recentEffects.length>=9)||this.voices.size>80){this.stats.limited++;return false;}
   this.lastEffects.set(name,t);this.lastEffects.set('group:'+key,t);this.recentEffects.push(t);this.stats.played++;this.stats.lastEffect=name;
   if(e.duck)this.duck(e.duck,.65);this.scheduleEffect(name,t);return true;
  }catch{return false;}
 }
 // Shared by playback and the offline listening preview.
 scheduleEffect(name,start){for(const s of EFFECTS[name]?.sounds||[]){
  if(s.noise)this._noise(start+(s.at||0),s.duration,s.gain,s.filter);
  else this._tone(s.type,s.f,s.to,start+(s.at||0),s.duration,s.gain,this.sfxGain);
 }}
 jingle(stage){
  const data=TRACKS[stage],c=this._ensure();if(!data||!c||c.state!=='running'||this.paused||this.muted)return;
  const t=c.currentTime,last=this.lastEffects.get('jingle')??-Infinity;if(t-last<2)return;
  this.lastEffects.set('jingle',t);this.duck(.45,.8);
  data.jingle.forEach((m,i)=>this._instrument({midi:m,instrument:data.instrument,duration:.3,gain:.23},t+i*.13,1,this.sfxGain,'jingle'));
 }
 music(request){
  const key=TRACKS[request]?request:this.resolveTrack(request);if(!TRACKS[key])return;
  if(this.currentTrack===key&&this.trackGain)return;
  try{
   this.stopMusic();const c=this._ensure();if(!c)return;
   this.currentTrack=key;const out=c.createGain();out.gain.setValueAtTime(0,c.currentTime);out.gain.linearRampToValueAtTime(1,c.currentTime+.22);out.connect(this.musicGain);this.trackGain=out;
   this.trackStart=c.currentTime+.04;this.cursor=0;this.loop=0;
   const schedule=()=>{if(this.currentTrack!==key)return;if(c.state==='running'&&!this.paused)this._scheduleAhead();if(this.live)this.musicTimer=setTimeout(schedule,60);};schedule();
  }catch{/* Audio must never prevent gameplay. */}
 }
 _scheduleAhead(){
  const c=this.ctx,data=TRACKS[this.currentTrack];if(!data||!this.trackGain)return;
  const beat=60/data.bpm,loopDuration=data.beats*beat;
  // Skip missed time rather than replaying a backlog after a throttled tab.
  if(this.trackStart+this.loop*loopDuration+data.events[this.cursor].at*beat<c.currentTime-.12){
   const elapsed=Math.max(0,c.currentTime-this.trackStart);this.loop=Math.floor(elapsed/loopDuration);
   this.cursor=data.events.findIndex(e=>e.at*beat>=elapsed%loopDuration);if(this.cursor<0){this.cursor=0;this.loop++;}
  }
  while(true){const e=data.events[this.cursor],at=this.trackStart+this.loop*loopDuration+e.at*beat;if(at>c.currentTime+.18)break;
   if(at>=c.currentTime-.015)this._instrument(e,Math.max(c.currentTime,at),beat,this.trackGain,'music');
   this.cursor++;if(this.cursor===data.events.length){this.cursor=0;this.loop++;}
  }
 }
 note(n,dur,type='triangle',vol=.3){try{const c=this._ensure();if(!c||c.state!=='running'||this.paused||this.muted)return;
  this._tone(type==='square'?'triangle':type,noteFrequency(n),0,c.currentTime,dur,Math.min(.4,vol),this.musicGain,'music');
 }catch{}}
 stopMusic(){
  if(this.musicTimer)clearTimeout(this.musicTimer);this.musicTimer=null;this.currentTrack=null;
  if(!this.ctx)return;const t=this.ctx.currentTime;
  if(this.trackGain){const out=this.trackGain;out.gain.cancelScheduledValues(t);out.gain.setTargetAtTime(0,t,.025);
   if(this.live)setTimeout(()=>out.disconnect(),130);this.trackGain=null;}
  for(const v of this.voices)if(v.owner==='music')try{v.source.stop(t+.1);}catch{}
 }
 destroy(){this.stopMusic();for(const v of this.voices)try{v.source.stop();}catch{}this.listeners.clear();this.ctx?.close?.().catch(()=>{});}
}
