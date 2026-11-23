import { SoundEngine } from '../../src/audio/SoundEngine.js';
import { STAGE_BONUSES } from '../../src/bonus/StageBonusCatalog.js';

const $=s=>document.querySelector(s), game=$('#game'), content=$('#content');
const themes={
 cinema:{name:'01 — Ufficio cinematografico',note:'La proposta consigliata: personaggi grandi e atmosfera dei filmati, una scelta principale evidente. Il fondale può cambiare con il capitolo; la posizione dei comandi resta costante.'},
 tower:{name:'02 — Il palazzo della carriera',note:'La scalata diventa il simbolo del gioco. Cinque mondi leggibili come piani del palazzo; le diramazioni della trasferta si aprono in una schermata dedicata, senza fingere una progressione lineare.'},
 desk:{name:'03 — La scrivania impossibile',note:'Cartelline, pelle e luce calda: un menu più ironico e tattile. Le etichette restano sempre visibili, senza obbligare a indovinare quali oggetti della scena si possono toccare.'}
};
const names={man:'Jack',woman:'Wendy'};
const chapters=[
 ['01','Open Space','Natale in Ufficio · Estate d’Inferno','Due stagioni. Le stesse scadenze.'],
 ['02','Mensa aziendale','La Pausa Pranzo','Il pranzo arriva al volo. Letteralmente.'],
 ['03','Sala riunioni','Il Limbo dei Post-it','Una call da cinque minuti, venti modifiche.'],
 ['04','La trasferta','Destinazione · Mezzo · Viaggio · Cliente','Treno o aereo. Deserto, ghiacciaio o mare.'],
 ['05','Piani executive','Finance · HR · Segreteria · Attico · Tetto','La cima è vicina. Il capo, anche.']
];
const actions=[
 ['walk','Cammina','← → / A D','Levetta a sinistra','Muovi la levetta o tieni una direzione per attraversare il livello.','move'],
 ['run','Corri','Direzione + X','Tieni SCIVOLA + direzione','Tieni la corsa mentre ti muovi per prendere velocità.','move'],
 ['jump','Salta','Spazio / Z','SALTA','Supera ostacoli e piattaforme. La demo mostra partenza, volo e atterraggio.','move'],
 ['double','Doppio salto','Spazio / Z due volte','SALTA due volte','Premi di nuovo durante il salto per guadagnare altezza.','move'],
 ['crouch','Accovacciati','↓ / S','Levetta in basso','Abbassati per schivare: lascia il comando per rialzarti.','move'],
 ['slide','Scivola','↓ + X in movimento','SCIVOLA in movimento','Una scivolata radente al terreno. Tieni premuto il comando touch per correre.','move'],
 ['climb','Sali le scale','↑ ↓ / W S','Levetta in alto / basso','Vicino a una scala, muoviti in verticale.','move'],
 ['swim','Nuota','Spazio / Z nel mare','SALTA nel mare','Nel mare il salto diventa una spinta verso l’alto, con costume e attrezzatura da sub.','move'],
 ['attack','Attacca','C / Q','ATTACCA','Usa il dispositivo raccolto durante il livello. La demo mostra la posa e un colpo.','action'],
 ['weapon','Cambia arma','V / E','Tocca l’icona dell’arma','Cambia fra le armi disponibili dopo aver raccolto il dispositivo.','action'],
 ['pause','Pausa','P','Pulsante II','Mette in pausa la partita. I comandi restano consultabili dal menu di pausa.','interface'],
 ['brief','Obiettivo del livello','I','Pulsante i','Riapre la comunicazione iniziale con obiettivo e pericoli del livello.','interface'],
 ['mute','Audio','M','Audio nelle opzioni','Attiva o silenzia il mix. Musica, effetti e voci mantengono regolazioni separate.','interface'],
 ['exit','Esci dalla partita','Esc','Menu di pausa','Apre il percorso di uscita. Il ritorno al menu deve richiedere conferma se interrompe una partita.','interface']
];
const state={screen:'home',theme:'cinema',character:'man',platform:matchMedia('(pointer:coarse)').matches?'touch':'pc',category:'move',action:'walk',paused:false,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,audio:false,chapter:0};
const sound=new SoundEngine({persist:false});
const views=new Map();let elapsed=0,last=performance.now();
function title(kicker,name,subtitle){return `<div class="page-title"><button class="back" data-screen="home">Indietro</button><div><div class="eyebrow">${kicker}</div><h1>${name}</h1><p>${subtitle}</p></div></div>`;}
function showNotice(name,copy){$('#notice-title').textContent=name;$('#notice-copy').textContent=copy;$('#notice').showModal();}
function updateHeader(){
 $('#profile').textContent=names[state.character]+' · Cambia';
 $('#audio-toggle').textContent=state.audio?'Audio on':'Audio off';$('#audio-toggle').setAttribute('aria-pressed',state.audio);
 $('#breadcrumb').textContent=({home:'CORPORATE ODYSSEY',characters:'SCEGLI CHI SARAI',controls:'IMPARA GIOCANDO',chapters:'LA TUA CARRIERA',bonuses:'LE PAUSE IMPOSSIBILI',films:'LE STORIE DELL’UFFICIO',options:'COME VUOI GIOCARE',ready:'PRONTO PER IL TURNO'})[state.screen];
 $('#concept-name').textContent=themes[state.theme].name;$('#concept-note').textContent=themes[state.theme].note;
 document.querySelectorAll('[data-theme]').forEach(b=>{if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',b.dataset.theme===state.theme);});
 game.dataset.theme=state.theme;game.className=state.screen==='home'?'screen-home':'screen-panel';game.classList.toggle('reduced',state.reduced);
 $('#footer-hint').textContent=state.platform==='touch'?'Tocca una voce per esplorare':state.screen==='home'?'Invio per giocare · Tab per navigare':'Esc torna indietro · Tab cambia selezione';
}
function render(screen=state.screen,{focus=true}={}){
 const listScroll=screen===state.screen?content.querySelector('.commands')?.scrollTop||0:0;
 content.querySelectorAll('video').forEach(v=>v.pause());views.clear();state.screen=screen;elapsed=0;updateHeader();
 if(screen==='home')content.innerHTML=`<section class="home"><div class="eyebrow">Una carriera. Mille imprevisti.</div><h1>CORPORATE<span>ODYSSEY</span></h1><p class="tagline">Sopravvivi all’ufficio.<br>Conquista la tua pausa.</p><nav class="home-nav" aria-label="Menu principale"><button class="primary" data-screen="characters">GIOCA <small>Inizia la campagna</small></button><button data-screen="chapters">Capitoli <small>Esplora i mondi</small></button><button data-screen="bonuses">Minigiochi <small>Una pausa diversa</small></button><button data-screen="films">Filmati <small>Le storie</small></button><button data-screen="controls">Comandi <small>Guarda e impara</small></button><button data-screen="options">Opzioni <small>Audio e schermo</small></button></nav><p class="home-status">Il tuo personaggio: <b>${names[state.character]}</b></p></section><div class="world-note">DAL PIANO TERRA AL TETTO<strong>La promozione più difficile<br>della tua vita.</strong></div>`;
 if(screen==='characters'){
  content.innerHTML=`<section class="page">${title('Il tuo prossimo turno','Chi entra in ufficio?','Scegli il protagonista, poi conferma. Stesse abilità e stessi comandi.')}<div class="character-layout"><div class="character-cards">${['man','woman'].map(c=>`<button class="character-card" data-character="${c}" aria-pressed="${state.character===c}" aria-label="Scegli ${names[c]}"><span class="choice-status">${state.character===c?'SELEZIONATO':'SCEGLI'}</span><canvas data-character-preview="${c}" aria-label="${names[c]} in movimento"></canvas><h2>${names[c]}</h2><p>${c==='man'?'Digital Specialist':'Digital Manager'}</p></button>`).join('')}</div><div class="character-detail"><div class="eyebrow">Il tuo impiegato</div><h2>${names[state.character]}</h2><p>${state.character==='man'?'Cravatta allentata, laptop sotto braccio. Jack è pronto a difendere l’ultima ora di libertà.':'Un’agenda piena e la risposta sempre pronta. Wendy sa che la vera promozione è uscire in orario.'}</p><div class="chips"><span>Stesse abilità</span><span>Stessa campagna</span><span>Look dedicato</span></div><button class="primary" data-screen="ready">Gioca con ${names[state.character]}</button><button class="text-button" data-screen="controls">Guarda i movimenti</button></div></div></section>`;
  content.querySelectorAll('canvas').forEach(c=>views.set(c,{character:c.dataset.characterPreview,mode:()=>c.dataset.characterPreview===state.character?'walk':'idle',card:true}));
 }
 if(screen==='controls'){
  const action=actions.find(a=>a[0]===state.action)||actions[0];
  content.innerHTML=`<section class="page">${title('Manuale di sopravvivenza','Comandi, in movimento.','Seleziona un’azione: l’anteprima a destra mostra cosa fa il personaggio.')}<div class="controls-layout"><div class="command-selector"><div class="tabs" role="tablist" aria-label="Dispositivo"><button role="tab" aria-selected="${state.platform==='pc'}" data-platform="pc">PC · Tastiera</button><button role="tab" aria-selected="${state.platform==='touch'}" data-platform="touch">Telefono · Touch</button></div><div class="small-controls" style="margin-bottom:10px">${[['move','Movimento'],['action','Combattimento'],['interface','Interfaccia']].map(([id,label])=>`<button data-category="${id}" aria-pressed="${state.category===id}">${label}</button>`).join('')}</div><div class="commands" aria-label="Azioni disponibili">${actions.filter(a=>a[5]===state.category).map(a=>`<button class="command" data-move="${a[0]}" aria-pressed="${state.action===a[0]}"><strong>${a[1]}</strong><span>${a[state.platform==='pc'?2:3]}</span></button>`).join('')}</div><p class="context-note">I minigiochi hanno regole dedicate: trovi i loro comandi nella scheda di ogni gioco.</p><div class="small-controls"><button data-screen="bonuses">Comandi dei minigiochi</button><button data-action="preview-pause">${state.paused?'Riprendi':'Ferma'} anteprima</button></div></div><section class="preview" aria-label="Dimostrazione del comando"><div class="preview-head"><strong>${names[state.character].toUpperCase()} · ANTEPRIMA</strong><button data-character="${state.character==='man'?'woman':'man'}">Usa ${state.character==='man'?'Wendy':'Jack'}</button></div><canvas id="movement-preview" tabindex="0" aria-label="Anteprima animata: ${action[1]}. Clicca qui e prova i tasti."></canvas><div class="preview-description"><h2>${action[1]}</h2><p>${action[4]}</p><div class="sample-key">${action[state.platform==='pc'?2:3]}</div></div></section></div></section>`;
  views.set($('#movement-preview'),{character:state.character,mode:()=>state.action,card:false});
 }
 if(screen==='chapters')content.innerHTML=`<section class="page">${title('Cinque mondi, una carriera','Scegli il capitolo','Manteniamo gli ingressi della campagna e le scelte della trasferta.')}<div class="cards-grid">${chapters.map((c,i)=>`<button class="entry-card" data-chapter="${i}"><small>MONDO ${c[0]}</small><h2>${c[1]}</h2><p>${c[3]}</p><p style="margin-top:13px;font-size:11px">${c[2]}</p></button>`).join('')}</div></section>`;
 if(screen==='bonuses')content.innerHTML=`<section class="page">${title('Le pause impossibili','Scegli un minigioco','Accesso diretto, regole e comandi nella stessa scheda.')}<div class="cards-grid">${STAGE_BONUSES.map((b,i)=>`<button class="entry-card" data-bonus="${i}"><small>${(b.genre || b.mode || 'Minigioco').toUpperCase()} · ${b.stage}</small><h2>${b.title}</h2><p>Apri regole e comandi</p></button>`).join('')}</div><p class="context-note">Il catalogo è letto dalle definizioni attuali del gioco. Le prove libere vanno distinte dai bonus che assegnano premi in campagna.</p></section>`;
 if(screen==='films')content.innerHTML=`<section class="page">${title('Le storie dell’ufficio','Sala proiezioni','I filmati si avviano su richiesta, senza interrompere il menu.')}<div class="film"><div><video controls playsinline preload="none" poster="../../../corporate-odyssey-media/estate-intro-pilot-2026-11-23/poster.jpg"><source src="../../../corporate-odyssey-media/estate-intro-pilot-2026-11-23/estate-inferno-intro-mobile-720p.mp4" type="video/mp4"><track kind="subtitles" src="../../../corporate-odyssey-media/estate-intro-pilot-2026-11-23/italiano.vtt" srclang="it" label="Italiano" default></video></div><div class="film-info"><div class="eyebrow">1-2 · Anteprima disponibile</div><h2>Estate d’Inferno</h2><p>Il primo giorno di caldo. Un solo ufficio con l’aria condizionata. Una lunga estate davanti.</p><p>Clip pilota con Jack · 15 secondi<br>Sottotitoli italiani disponibili nel lettore.</p><button data-action="film-play" class="primary">Guarda l’introduzione</button><p class="context-note">La galleria finale mostrerà solo le clip pronte per il personaggio scelto; eventuali varianti mancanti saranno indicate.</p></div></div></section>`;
 if(screen==='options')content.innerHTML=`<section class="page">${title('Il gioco, a modo tuo','Opzioni','Le regolazioni qui valgono solo per questa anteprima.')}<div class="option-layout"><section class="option-box"><h2>Audio</h2>${[['master','Generale'],['music','Musica'],['effects','Effetti'],['voices','Voci']].map(([bus,label])=>`<label class="volume"><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(sound.settings[bus]*100)}" data-volume="${bus}" aria-label="Volume ${label}"><output>${Math.round(sound.settings[bus]*100)}%</output></label>`).join('')}<button data-action="audio">${state.audio?'Silenzia':'Ascolta'} il tema del menu</button></section><section class="option-box"><h2>Schermo e leggibilità</h2><label class="toggle-row">Riduci movimento<input type="checkbox" data-setting="reduced" ${state.reduced?'checked':''}></label><div class="toggle-row"><span>Schermo intero</span><button data-action="fullscreen">Apri</button></div><div class="toggle-row"><span>Installazione del gioco</span><button data-action="install">Come funziona</button></div><button class="text-button" data-screen="controls">Apri la guida ai comandi</button><p class="context-note">Nel gioco finale: sottotitoli dei filmati, conferme di uscita e ripristino delle preferenze saranno raccolti qui.</p></section></div></section>`;
 if(screen==='ready')content.innerHTML=`<section class="page">${title('Tutto pronto','Il tuo prossimo turno','Un riepilogo breve prima di entrare nel gioco.')}<div class="character-layout"><div class="preview"><canvas id="ready-preview" style="height:310px" aria-label="${names[state.character]} pronto"></canvas></div><div class="character-detail"><div class="eyebrow">${names[state.character]} · MONDO ${chapters[state.chapter][0]}</div><h2>${chapters[state.chapter][1]}</h2><p>${chapters[state.chapter][3]}</p><button class="primary" data-action="start">Inizia il turno</button><div class="choices"><button data-screen="characters">Cambia personaggio</button><button data-screen="chapters">Cambia capitolo</button></div></div></div></section>`;
 if(screen==='ready')views.set($('#ready-preview'),{character:state.character,mode:()=> 'idle',card:true});
 content.querySelectorAll('video').forEach(v=>{v.addEventListener('play',()=>sound.setPaused(true,'video'));v.addEventListener('pause',()=>sound.setPaused(false,'video'));v.addEventListener('ended',()=>sound.setPaused(false,'video'));});
 if(screen==='controls')content.querySelector('.commands').scrollTop=listScroll;
 if(focus&&screen!=='home'){const heading=content.querySelector('h1');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});}
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;if(state.audio)sound.sfx('select');
 const focusKey=['character','platform','category','move'].find(k=>b.dataset[k]!==undefined);
 const focusValue=focusKey?b.dataset[focusKey]:null;
 if(b.dataset.theme){state.theme=b.dataset.theme;render('home',{focus:false});}
 if(b.dataset.screen)render(b.dataset.screen);
 if(b.dataset.character){state.character=b.dataset.character;render(state.screen==='home'?'characters':state.screen,{focus:false});}
 if(b.dataset.platform){state.platform=b.dataset.platform;render('controls',{focus:false});}
 if(b.dataset.category){state.category=b.dataset.category;state.action=actions.find(a=>a[5]===state.category)[0];render('controls',{focus:false});}
 if(b.dataset.move){state.action=b.dataset.move;render('controls',{focus:false});}
 if(b.dataset.chapter!==undefined){state.chapter=+b.dataset.chapter;render('ready');}
 if(b.dataset.bonus!==undefined){const item=STAGE_BONUSES[+b.dataset.bonus];showNotice(item.title,item.instructions+' Questa è la scheda dimostrativa del nuovo menu: non avvia né modifica la partita.');}
 if(b.dataset.action==='preview-pause'){state.paused=!state.paused;render('controls',{focus:false});}
 if(b.dataset.action==='start')showNotice('Percorso pronto',`${names[state.character]} · ${chapters[state.chapter][1]}. Nel menu definitivo questo pulsante avvierà la campagna. Qui stai provando la navigazione: nessuna partita è stata creata o sovrascritta.`);
 if(b.dataset.action==='audio'){state.audio=!state.audio;if(state.audio){await sound.unlock();sound.music('menu');sound.setPaused(false,'preview-muted');}else sound.setPaused(true,'preview-muted');updateHeader();if(state.screen==='options')render('options',{focus:false});}
 if(b.dataset.action==='fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else await game.requestFullscreen();}catch{showNotice('Schermo intero','Questo browser non rende disponibile lo schermo intero. Il menu resta utilizzabile nella finestra.');}}
 if(b.dataset.action==='install')showNotice('Installa il gioco','Nel menu definitivo questa voce comparirà quando l’installazione PWA è disponibile. Su iPhone e iPad saranno mostrate le istruzioni per Aggiungi a Home. Il prototipo non installa applicazioni.');
 if(b.dataset.action==='film-play')content.querySelector('video')?.play().catch(()=>showNotice('Anteprima video non disponibile','Apri il prototipo dal server locale con la cartella dei media accanto al repository.'));
 if(focusKey)content.querySelector(`[data-${focusKey}="${focusValue}"]`)?.focus({preventScroll:true});
 if(b.dataset.action==='preview-pause')content.querySelector('[data-action="preview-pause"]')?.focus({preventScroll:true});
});
document.addEventListener('input',e=>{if(e.target.dataset.volume){sound.setVolume(e.target.dataset.volume,+e.target.value/100);e.target.nextElementSibling.textContent=e.target.value+'%';}if(e.target.dataset.setting==='reduced'){state.reduced=e.target.checked;game.classList.toggle('reduced',state.reduced);}});
document.addEventListener('keydown',e=>{
 if($('#notice').open)return;
 if(e.key==='Escape'&&state.screen!=='home'){render('home');return;}
 if(e.target.id==='movement-preview'){
  const map={ArrowLeft:'walk',ArrowRight:'walk',a:'walk',d:'walk',x:'run',' ':'jump',z:'jump',ArrowDown:'crouch',s:'crouch',ArrowUp:'climb',w:'climb',c:'attack',q:'attack',v:'weapon',e:'weapon'};
  const act=map[e.key];if(act){e.preventDefault();state.action=act;state.category=actions.find(a=>a[0]===act)[5];render('controls',{focus:false});$('#movement-preview').focus();}
 }else if(e.key==='Enter'&&state.screen==='home'&&!['BUTTON','A','INPUT'].includes(e.target.tagName))render('characters');
});
document.addEventListener('visibilitychange',()=>sound.setPaused(document.hidden,'hidden'));
window.addEventListener('pagehide',()=>sound.destroy());

// Read the shipped atlas regions directly. The prototype never copies or edits sprite pixels.
const atlases=new Map();
function atlas(file,world=false){
 const path=`../../public/assets/${world?'hd-worlds':'hd-office'}/${file}`;
 if(!atlases.has(path)){const record={ready:false};atlases.set(path,record);Promise.all([fetch(path+'.json').then(r=>{if(!r.ok)throw Error(path);return r.json();}),new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=path+'.png';})]).then(([data,img])=>Object.assign(record,{ready:true,data,img})).catch(()=>record.failed=true);}
 return atlases.get(path);
}
function drawSprite(ctx,sheet,key,x,bottom,height,flip=false,angle=0){
 if(!sheet.ready)return;const info=sheet.data.frames[key];if(!info)return;
 const f=info.frame,src=info.spriteSourceSize,ss=info.sourceSize,scale=height/ss.h;
 ctx.save();ctx.translate(x,bottom);ctx.rotate(angle);ctx.scale(flip?-scale:scale,scale);
 ctx.drawImage(sheet.img,f.x,f.y,f.w,f.h,src.x-ss.w/2,src.y-ss.h,f.w,f.h);ctx.restore();
}
function draw(canvas,view,t){
 const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
 const ratio=Math.min(devicePixelRatio||1,2),w=rect.width,h=rect.height;
 if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
 const c=canvas.getContext('2d');c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,w,h);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 const char=view.character,who=char==='man'?'jack':'wendy',mode=view.mode(),fixed=state.reduced||state.paused,time=fixed?0:t,cycle=(time%2.2)/2.2;
 const floor=h-16, size=Math.min(h*.81,210);let x=w*.5,y=floor,flip=false,angle=0,sheet,key;
 c.strokeStyle='#d5b98540';c.lineWidth=1;c.beginPath();c.moveTo(w*.1,floor+1);c.lineTo(w*.9,floor+1);c.stroke();
 c.fillStyle='#0005';c.beginPath();c.ellipse(x,floor+2,size*.26,6,0,0,Math.PI*2);c.fill();
 if(['walk','run'].includes(mode)){
  sheet=atlas(who+'-locomotion');key=char+'_move'+(Math.floor(time*(mode==='run'?23:14))%16+1);
  if(!view.card){const sweep=Math.sin(time*(mode==='run'?2.4:1.2));x+=sweep*w*.22;flip=Math.cos(time*(mode==='run'?2.4:1.2))<0;}
 }else if(mode==='swim'){
  sheet=atlas(who+'-dive-swim',true);key='swim'+(Math.floor(time*12)%12+1);x+=Math.sin(time*.9)*w*.18;y-=Math.sin(time*2)*10+size*.1;
  c.fillStyle='#70dffb88';for(let i=0;i<4;i++){c.beginPath();c.arc(x+size*.3+i*8,floor-((time*50+i*27)%h),2.5,0,Math.PI*2);c.fill();}
 }else if(mode==='attack'){
  sheet=atlas(who+'-motion');key=char+(cycle<.6?'_attack':'_idle1');x-=w*.14;angle=cycle<.2?-.06:0;
  if(cycle>.2&&cycle<.8){const px=x+size*.35+(cycle-.2)*w*.7;c.strokeStyle='#ffd582';c.lineWidth=2;c.strokeRect(px,floor-size*.55,22,14);c.beginPath();c.moveTo(px,floor-size*.55);c.lineTo(px+11,floor-size*.55+8);c.lineTo(px+22,floor-size*.55);c.stroke();}
 }else{
  sheet=atlas('characters');let pose='idle';
  if(mode==='jump'||mode==='double'){pose=cycle<.12?'crouch':cycle<.82?'jump':'idle';const flight=Math.max(0,Math.sin(Math.PI*Math.min(1,Math.max(0,(cycle-.12)/.7))));y-=flight*size*.48;if(mode==='double'&&cycle>.4&&cycle<.75)y-=Math.sin((cycle-.4)/.35*Math.PI)*size*.18;}
  if(mode==='crouch')pose=cycle<.72?'crouch':'idle';
  if(mode==='slide'){pose=cycle<.7?'slide':'idle';x=w*.25+cycle*w*.5;}
  if(mode==='climb'){pose='climb';y-=Math.sin(time*1.6)*size*.18+size*.12;c.strokeStyle='#d0b78380';c.lineWidth=3;for(const dx of [-size*.2,size*.2]){c.beginPath();c.moveTo(x+dx,10);c.lineTo(x+dx,floor);c.stroke();}for(let rung=25;rung<floor;rung+=22){c.beginPath();c.moveTo(x-size*.2,rung);c.lineTo(x+size*.2,rung);c.stroke();}}
  key=char+'_'+pose;
 }
 drawSprite(c,sheet,key,x,y,size,flip,angle);
 if(['weapon','pause','brief','mute','exit'].includes(mode)){c.fillStyle='#0b1928e8';c.strokeStyle='#d6b678';c.lineWidth=1;const bw=Math.min(170,w*.5);c.fillRect(w-bw-12,10,bw,39);c.strokeRect(w-bw-12,10,bw,39);c.font='600 12px Segoe UI';c.textAlign='center';c.fillStyle='#f4d392';c.fillText(({weapon:['EMAIL','TEAMS','CAFFÈ','OROLOGIO'][Math.floor(time)%4],pause:'II  IN PAUSA',brief:'i  OBIETTIVO',mute:'AUDIO ON / OFF',exit:'TORNA AL MENU'})[mode],w-bw/2-12,35);}
 if(!sheet?.ready){c.fillStyle='#c3d0d9';c.font='13px Segoe UI';c.textAlign='center';c.fillText(sheet?.failed?'Sprite non disponibile':'Caricamento sprite…',w/2,h/2);}
 canvas.dataset.preview=JSON.stringify({character:char,action:mode,frame:key,paused:fixed,loaded:!!sheet?.ready});
}
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!state.paused&&!document.hidden)elapsed+=dt;for(const [canvas,view]of views)draw(canvas,view,elapsed);requestAnimationFrame(tick);}
render('home',{focus:false});requestAnimationFrame(tick);
