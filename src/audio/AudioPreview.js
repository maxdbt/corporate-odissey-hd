import { TRACKS, EFFECTS } from './AudioCatalog.js';
import { SoundEngine } from './SoundEngine.js';

const audio=new SoundEngine({persist:false}),el=id=>document.getElementById(id);
for(const [id,track]of Object.entries(TRACKS))el('track').add(new Option(track.title,id));
const status=()=>{el('status').textContent=`${audio.currentTrack?TRACKS[audio.currentTrack].title:'Musica ferma'} · ${audio.paused?'in pausa':audio.muted?'silenziato':'audio attivo'} · ${audio.voices.size} voci · ${audio.stats.limited} ripetizioni limitate`;};
async function unlock(){audio.unlock();if(audio.ctx?.state==='suspended'&&!audio.paused)await audio.ctx.resume();}
el('play').onclick=async()=>{audio.setPaused(false);await unlock();audio.music(el('track').value);status();};
el('jingle').onclick=async()=>{await unlock();audio.jingle(el('track').value);status();};
el('pause').onclick=()=>{audio.setPaused(!audio.paused);el('pause').textContent=audio.paused?'Riprendi':'Pausa';status();};
el('stop').onclick=()=>{audio.stopMusic();status();};
el('mute').onclick=()=>{audio.toggleMute();el('mute').textContent=audio.muted?'Riattiva audio':'Silenzia';status();};
for(const id of ['master','music','effects'])el(id).oninput=()=>audio.setVolume(id,el(id).value/100);
const labels={jump:'Salto',coin:'Moneta',hurt:'Danno',powerup:'Potenziamento',checkpoint:'Checkpoint',victory:'Vittoria',step:'Passi',slide:'Scivolata',swim:'Nuoto',shark:'Squalo vicino',mount:'Sali sul mezzo',dismount:'Scendi',motor:'Motore',hoof:'Cammello',monster:'Mostro del bagno',flush:'Sciacquone',portal:'Portale',lowHealth:'Salute bassa',timeWarning:'Ultimi secondi',phone:'Telefono',valve:'Valvola',clink:'Tazzina'};
for(const [name,label]of Object.entries(labels)){const b=document.createElement('button');b.textContent=label;b.onclick=async()=>{await unlock();audio.sfx(name);status();};el('sound-buttons').append(b);}
document.addEventListener('visibilitychange',()=>audio.setPaused(document.hidden,'hidden'));
window.addEventListener('pagehide',()=>audio.destroy());

function measure(buffer){let peak=0,sum=0;const data=buffer.getChannelData(0);for(const v of data){peak=Math.max(peak,Math.abs(v));sum+=v*v;}return {peak,rms:Math.sqrt(sum/data.length)};}
async function renderTrack(id,seconds){
 const context=new OfflineAudioContext(1,Math.ceil(seconds*22050),22050);
 const engine=new SoundEngine({createContext:()=>context,persist:false,live:false,offline:true});engine._ensure();
 const track=TRACKS[id],beat=60/track.bpm,out=context.createGain();out.connect(engine.musicGain);
 out.gain.setValueAtTime(0,0);out.gain.linearRampToValueAtTime(1,.08);out.gain.setValueAtTime(1,Math.max(.1,seconds-.45));out.gain.linearRampToValueAtTime(0,seconds-.02);
 for(const event of track.events)if(event.at*beat<seconds-.3)engine._instrument(event,.02+event.at*beat,beat,out,'preview');
 return context.startRendering();
}
async function renderEffects(){
 const names=['jump','coin','mount','swim','shark','monster','victory'],duration=names.length*1.2+.4;
 const context=new OfflineAudioContext(1,Math.ceil(duration*22050),22050),engine=new SoundEngine({createContext:()=>context,persist:false,live:false,offline:true});engine._ensure();
 names.forEach((name,i)=>engine.scheduleEffect(name,.15+i*1.2));return context.startRendering();
}
function wav(buffers){
 const count=buffers.reduce((n,b)=>n+b.length,0),array=new ArrayBuffer(44+count*2),view=new DataView(array);
 const str=(at,s)=>[...s].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));
 str(0,'RIFF');view.setUint32(4,36+count*2,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,22050,true);view.setUint32(28,44100,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,count*2,true);
 let at=44;for(const buffer of buffers)for(const v of buffer.getChannelData(0)){view.setInt16(at,Math.round(Math.max(-1,Math.min(1,v))*32767),true);at+=2;}
 return new Blob([array],{type:'audio/wav'});
}
let previewUrl;
el('render').onclick=async()=>{
 el('render').disabled=true;audio.stopMusic();el('render-status').textContent='Rendering e verifica…';
 try{
  const report=[],buffers=[];
  for(const [id,track]of Object.entries(TRACKS)){
   const selected=['1-1','1-2','4-9','4-8','boss-ceo'].includes(id),seconds=selected?6:track.beats*60/track.bpm+1;
   const buffer=await renderTrack(id,seconds),metrics=measure(buffer);
   report.push({id,...metrics});if(selected)buffers.push(buffer);
  }
  // Verify each effect independently, including cues outside the listening selection.
  for(const name of Object.keys(EFFECTS)){
   const c=new OfflineAudioContext(1,22050*3,22050),a=new SoundEngine({createContext:()=>c,persist:false,live:false,offline:true});a._ensure();a.scheduleEffect(name,.05);
   report.push({id:name,...measure(await c.startRendering())});
  }
  buffers.push(await renderEffects());
  if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(wav(buffers));
  el('sample').src=previewUrl;el('sample').hidden=false;el('download').href=previewUrl;el('download').hidden=false;
  const issues=report.filter(r=>r.peak>=.99||r.rms<.00001||!Number.isFinite(r.peak));
  el('render-status').textContent=`${report.length} verifiche · ${issues.length} problemi · picco massimo ${Math.max(...report.map(r=>r.peak)).toFixed(3)} / 1 · anteprima ${buffers.reduce((n,b)=>n+b.duration,0).toFixed(1)} secondi`;
  el('audit').textContent=report.map(r=>`${r.id.padEnd(15)} picco ${r.peak.toFixed(4)} · RMS ${r.rms.toFixed(4)}`).join('\n');
 }catch(error){el('render-status').textContent='Errore nel rendering: '+error.message;}
 finally{el('render').disabled=false;}
};
