import styles from './menu.css?inline';
import { CHARACTER_NAMES as names, MENU_ACTIONS as actions, menuWorlds, chooseMenuLevel, bonusDestination } from './MenuModel.js';
import { createCharacterPreviews } from './CharacterPreviews.js';
import { LEVEL_META, TRIP_STAGES_IN_MENU } from '../config/constants.js';
import { MENU_BONUSES } from '../bonus/MenuBonusCatalog.js';
import { GameState } from '../state/GameState.js';
import { startLevel } from '../systems/Trip.js';
import { audio } from '../systems/Audio8bit.js';
import { inputMode } from '../systems/InputMode.js';
import { screenInfo, toggleFullscreen, isFullscreen } from '../systems/Screen.js';
import { install, onInstallChange } from '../systems/Pwa.js';

const session = { character: null, level: 0 };
const prefKey = 'corporate-menu-preferences-v1';
const asset = path => import.meta.env.BASE_URL + path;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const worldCopy = {
 '1': 'Due stagioni. Le stesse scadenze.', '2': 'Il pranzo arriva al volo. Letteralmente.',
 '3': 'Una call da cinque minuti. Venti modifiche.', '4': 'Scegli il viaggio. Raggiungi il cliente.', '5': 'La cima è vicina. Il capo, anche.'
};

export function createGameMenu(scene) { return new GameMenu(scene); }

class GameMenu {
 constructor(scene) {
  this.scene = scene;
  this.worlds = menuWorlds(LEVEL_META, TRIP_STAGES_IN_MENU);
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem(prefKey) || '{}') || {}; } catch { /* Private storage is optional. */ }
  this.state = { screen:'home', character:session.character || GameState.character || 'man', level:chooseMenuLevel(this.worlds,session.level)?.index || 0,
   platform:inputMode.touch?'touch':'pc', category:'move', action:'walk', paused:false,
   reduced:typeof preferences.reduced==='boolean'?preferences.reduced:matchMedia('(prefers-reduced-motion:reduce)').matches, busy:false };
  this.abort = new AbortController();
  this.hasScene = name => !!scene.scene.manager.keys[name];
  this.canInstall = false;
  this.intros = null;
  this.container = document.getElementById('game-container');
  this.oldInert = this.container?.inert;
  if(this.container)this.container.inert = true;
  this.touchStyles=[document.documentElement,document.body].map(node=>[node,node.style.touchAction]);
  for(const [node]of this.touchStyles)node.style.touchAction='auto';
  this.host = document.createElement('section');
  this.host.className = 'corporate-game-menu';
  this.host.setAttribute('aria-label','Menu di Corporate Odyssey');
  this.root = this.host.attachShadow({mode:'open'});
  this.root.innerHTML = `<style>${styles}</style><main id="game"><div class="backdrop"></div><div class="shade"></div>
   <header class="game-header"><button class="wordmark" data-screen="home" aria-label="Menu principale">CO<span>◆</span></button><div id="breadcrumb"></div>
   <div class="utilities"><button data-action="audio" id="audio-toggle"></button><button data-action="fullscreen" aria-label="Schermo intero" ${screenInfo.canFullscreen?'':'hidden'}>⛶</button><button data-screen="characters" id="profile"></button></div></header>
   <div id="content"></div><footer class="game-footer"><span id="footer-hint"></span><button data-screen="controls">Comandi</button><button data-screen="options">Opzioni</button></footer></main>
   <dialog id="notice" aria-labelledby="notice-title"><h2 id="notice-title"></h2><p id="notice-copy"></p><div id="notice-extra"></div><form method="dialog"><button>Chiudi</button></form></dialog>`;
  this.$ = selector => this.root.querySelector(selector);
  this.game = this.$('#game'); this.content = this.$('#content');
  this.game.style.setProperty('--office-art',`url("${asset('assets/menu/office.webp')}")`);
  this.game.style.setProperty('--career-art',`url("${asset('assets/menu/career.webp')}")`);
  document.body.appendChild(this.host);
  this.previews = createCharacterPreviews(this.host,this.state.reduced);
  this.listen(this.root,'click',event=>this.click(event));
  this.listen(this.root,'input',event=>this.change(event));
  this.listen(this.root,'keydown',event=>this.key(event));
  this.listen(this.$('#notice'),'close',()=>{this.$('#notice-extra').innerHTML='';this.restoreDialogFocus?.focus({preventScroll:true});});
  this.listen(document,'fullscreenchange',()=>this.header());
  this.unsubscribeAudio = audio.subscribe(()=>this.header());
  this.unsubscribeInstall = onInstallChange(can=>{this.canInstall=can;if(this.state.screen==='options')this.render('options',false);});
  this.onPause = ()=>{this.host.hidden=true;};
  this.onResume = ()=>{this.host.hidden=false;this.state.busy=false;audio.music('menu');this.root.querySelector('h1')?.focus({preventScroll:true});};
  scene.events.on('pause',this.onPause);scene.events.on('resume',this.onResume);
  scene.events.once('shutdown',()=>this.destroy());
  audio.music('menu');
  this.render('home');
  if(this.hasScene('WorldIntroScene'))this.loadIntros();
 }

 listen(target,type,fn) { target.addEventListener(type,fn,{signal:this.abort.signal}); }
 level() { return chooseMenuLevel(this.worlds,this.state.level); }
 heading(eyebrow,title,copy='') {
  return `<div class="page-title"><button class="back" data-action="back">← Indietro</button><div><div class="eyebrow">${eyebrow}</div><h1 tabindex="-1">${title}</h1>${copy?`<p>${copy}</p>`:''}</div></div>`;
 }
 header() {
  if(this.destroyed)return;
  const s=this.state;
  this.$('#profile').textContent=names[s.character]+' · Cambia';
  this.$('#audio-toggle').textContent=audio.muted?'Audio off':'Audio on';
  this.$('#audio-toggle').setAttribute('aria-pressed',String(!audio.muted));
  this.$('#breadcrumb').textContent=({home:'CORPORATE ODYSSEY',characters:'SCEGLI CHI SARAI',chapters:'LA TUA CARRIERA',controls:'IMPARA GIOCANDO',bonuses:'LE PAUSE IMPOSSIBILI',films:'LE STORIE DELL’UFFICIO',options:'COME VUOI GIOCARE',ready:'PRONTO PER IL TURNO'})[s.screen];
  this.$('#footer-hint').textContent=s.platform==='touch'?'Tocca una voce per esplorare':'Tab per navigare · Esc per tornare';
  this.game.dataset.screen=s.screen;this.game.dataset.character=s.character;
  this.game.className=(s.screen==='home'?'screen-home':'screen-panel')+(s.reduced?' reduced':'');
  this.$('[data-action="fullscreen"]').setAttribute('aria-pressed',String(isFullscreen()));
 }
 render(screen=this.state.screen,focus=true) {
  if(this.destroyed)return;
  const s=this.state,scroll=screen===s.screen?this.$('.commands')?.scrollTop||0:0;
  s.screen=screen;session.character=s.character;session.level=s.level;
  this.previews.clear();this.header();
  if(screen==='home')this.content.innerHTML=`<section class="home"><div class="eyebrow">Una carriera. Mille imprevisti.</div><h1 tabindex="-1">CORPORATE<span>ODYSSEY</span></h1><p class="tagline">Sopravvivi all’ufficio.<br>Conquista la tua pausa.</p>
   <nav class="home-nav" aria-label="Menu principale"><button class="primary" data-screen="characters">GIOCA <small>Inizia la campagna</small></button><button data-screen="chapters">Capitoli <small>Esplora i mondi</small></button><button data-screen="bonuses">Minigiochi <small>Una pausa diversa</small></button><button data-screen="films">Filmati <small>Le storie</small></button><button data-screen="controls">Comandi <small>Guarda e impara</small></button><button data-screen="options">Opzioni <small>Audio e schermo</small></button></nav></section>`;
  if(screen==='characters') {
   this.content.innerHTML=`<section class="page">${this.heading('Il tuo prossimo turno','Chi entra in ufficio?','Scegli il protagonista, poi conferma. Stesse abilità e stessi comandi.')}<div class="character-layout"><div class="character-cards">${['man','woman'].map(c=>`<button class="character-card" data-character="${c}" aria-label="Scegli ${names[c]}" aria-pressed="${s.character===c}"><span class="choice-status">${s.character===c?'SELEZIONATO':'SCEGLI'}</span><canvas data-preview-character="${c}" aria-label="${names[c]} in movimento"></canvas><h2>${names[c]}</h2><p>${c==='man'?'Digital Specialist':'Digital Manager'}</p></button>`).join('')}</div>
    <div class="character-detail"><div class="eyebrow">Il tuo prossimo protagonista</div><h2>${names[s.character]}</h2><p>${s.character==='man'?'Cravatta allentata, laptop sotto braccio. Jack è pronto a difendere l’ultima ora di libertà.':'Un’agenda piena e la risposta sempre pronta. Wendy sa che la vera promozione è uscire in orario.'}</p><div class="chips"><span>Stesse abilità</span><span>Stessa campagna</span><span>Look dedicato</span></div><button class="primary" data-screen="ready">Gioca con ${names[s.character]}</button><button class="text-button" data-screen="controls">Guarda i movimenti</button></div></div></section>`;
   this.root.querySelectorAll('[data-preview-character]').forEach(canvas=>this.previews.add(canvas,canvas.dataset.previewCharacter,canvas.dataset.previewCharacter===s.character?'walk':'idle',true));
  }
  if(screen==='chapters')this.content.innerHTML=`<section class="page">${this.heading('Cinque mondi, una carriera','Scegli il capitolo','Dall’open space al tetto. Ogni piano ha i suoi imprevisti.')}<div class="chapter-layout"><div class="career-art" role="img" aria-label="I cinque piani della carriera aziendale"></div><div class="world-list">${this.worlds.map(w=>`<section class="world-card"><small>MONDO ${w.id}</small><h2>${escape(w.name.replace(/^Mondo \d+: /,''))}</h2><p>${worldCopy[w.id]}</p><div class="scenario-list">${w.levels.map(l=>`<button data-level="${l.index}" aria-pressed="${s.level===l.index}"><span>${l.id}</span> ${escape((!TRIP_STAGES_IN_MENU&&l.menuName)||l.name)}</button>`).join('')}</div>${w.id==='4'?'<p class="world-hint">Destinazione e mezzo si scelgono durante la trasferta.</p>':''}</section>`).join('')}</div></div></section>`;
  if(screen==='ready') {
   const level=this.level();
   this.content.innerHTML=`<section class="page">${this.heading('Tutto pronto','Il tuo prossimo turno','Controlla la scelta e comincia la tua carriera.')}<div class="ready-layout"><div class="preview"><canvas id="ready-preview" aria-label="${names[s.character]} pronto"></canvas></div><div class="character-detail"><div class="eyebrow">${names[s.character]} · STAGE ${level.id}</div><h2>${escape(level.name)}</h2><p>${worldCopy[level.id.split('-')[0]]}</p><button class="primary" data-action="start">Inizia il turno</button><div class="choices"><button data-screen="characters">Cambia personaggio</button><button data-screen="chapters">Cambia capitolo</button></div><p class="context-note">${inputMode.touch?'Usa la levetta a sinistra e i pulsanti a destra.':'Frecce o WASD per muoverti · Spazio per saltare.'}</p></div></div></section>`;
   this.previews.add(this.$('#ready-preview'),s.character,'idle',true);
  }
  if(screen==='controls') {
   const action=actions.find(a=>a[0]===s.action);
   this.content.innerHTML=`<section class="page">${this.heading('Manuale di sopravvivenza','Comandi, in movimento.','Seleziona un’azione per vedere il personaggio eseguirla.')}<div class="controls-layout"><div class="command-selector"><div class="tabs" role="tablist" aria-label="Dispositivo"><button role="tab" aria-selected="${s.platform==='pc'}" data-platform="pc">PC · Tastiera</button><button role="tab" aria-selected="${s.platform==='touch'}" data-platform="touch">Telefono · Touch</button></div><div class="categories">${[['move','Movimento'],['action','Azioni'],['interface','Interfaccia']].map(([id,label])=>`<button data-category="${id}" aria-pressed="${s.category===id}">${label}</button>`).join('')}</div><div class="commands" aria-label="Azioni disponibili">${actions.filter(a=>a[5]===s.category).map(a=>`<button class="command" data-move="${a[0]}" aria-pressed="${s.action===a[0]}"><strong>${a[1]}</strong><span>${a[s.platform==='pc'?2:3]}</span></button>`).join('')}</div><p class="context-note">Ogni minigioco ha regole e comandi nella propria scheda.</p><div class="small-controls"><button data-screen="bonuses">Comandi dei minigiochi</button><button data-action="preview-pause">${s.paused?'Riprendi':'Ferma'} anteprima</button></div></div><section class="preview" aria-label="Dimostrazione del comando"><div class="preview-head"><strong>${names[s.character].toUpperCase()} · ANTEPRIMA</strong><button data-character="${s.character==='man'?'woman':'man'}">Usa ${names[s.character==='man'?'woman':'man']}</button></div><canvas id="movement-preview" tabindex="0" aria-label="Anteprima animata: ${action[1]}. Seleziona qui per provare i tasti."></canvas><div class="preview-description"><h2>${action[1]}</h2><p>${action[4]}</p><div class="sample-key">${action[s.platform==='pc'?2:3]}</div>${s.reduced?'<p class="motion-note">Movimento ridotto attivo nelle Opzioni.</p>':''}</div></section></div></section>`;
   this.$('.commands').scrollTop=scroll;
   this.previews.add(this.$('#movement-preview'),s.character,s.action);
  }
  if(screen==='bonuses')this.content.innerHTML=`<section class="page">${this.heading('Le pause impossibili','Scegli un minigioco','Prova libera: le ricompense si guadagnano durante la campagna.')}<div class="cards-grid">${MENU_BONUSES.map(b=>`<button class="entry-card" data-bonus="${escape(b.id)}"><small>${escape(b.genre||'PAUSA AZIENDALE')} · ${b.stage}</small><h2>${escape(b.title)}</h2><p>Regole, comandi e avvio</p></button>`).join('')}${this.hasScene('PartyScene')?'<button class="entry-card" data-action="dance"><small>RITMO · NATALE</small><h2>Gara di ballo di Natale</h2><p>Segui le frecce con Jack o Wendy</p></button>':''}${!this.hasScene('BonusHubScene')&&this.hasScene('BeachScene')?'<button class="entry-card" data-legacy="BeachScene"><small>BONUS · 1-2</small><h2>Ferie, ma non troppo</h2><p>La pausa al mare</p></button>':''}${!this.hasScene('BonusHubScene')&&this.hasScene('LastMailScene')?'<button class="entry-card" data-legacy="LastMailScene"><small>BONUS · 1-1</small><h2>L’ultima mail</h2><p>La casella non dorme mai</p></button>':''}</div></section>`;
  if(screen==='films')this.content.innerHTML=`<section class="page">${this.heading('Le storie dell’ufficio','Sala proiezioni',`Le introduzioni di ${names[s.character]}. Scegli un filmato per rivederlo.`)}<div class="cards-grid film-grid">${this.availableIntros().map(w=>`<button class="film-card" data-film="${w.id}-1"><img loading="lazy" src="${asset(`assets/intro/world-${w.id}/${s.character}/poster.jpg`)}" alt=""/><span><small>MONDO ${w.id} · ${names[s.character]}</small><strong>${escape(w.name.replace(/^Mondo \d+: /,''))}</strong><span>Guarda l’introduzione · 15 secondi</span></span></button>`).join('')||`<p class="empty" role="status">${this.intros===null&&this.hasScene('WorldIntroScene')?'Caricamento delle introduzioni…':'Non ci sono ancora filmati disponibili per questo personaggio.'}</p>`}</div><button class="text-button" data-screen="characters">Cambia protagonista</button></section>`;
  if(screen==='options')this.content.innerHTML=`<section class="page">${this.heading('Il gioco, a modo tuo','Opzioni','Le preferenze vengono conservate su questo dispositivo.')}<div class="option-layout"><section class="option-box"><h2>Audio</h2>${[['master','Generale'],['music','Musica'],['effects','Effetti'],['voices','Voci']].map(([bus,label])=>`<label class="volume"><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(audio.settings[bus]*100)}" data-volume="${bus}" aria-label="Volume ${label}"><output>${Math.round(audio.settings[bus]*100)}%</output></label>`).join('')}<button data-action="audio">${audio.muted?'Attiva':'Silenzia'} l’audio</button></section><section class="option-box"><h2>Schermo e accessibilità</h2><label class="toggle-row">Riduci movimento del menu<input type="checkbox" data-setting="reduced" ${s.reduced?'checked':''}></label>${screenInfo.canFullscreen?'<div class="toggle-row"><span>Schermo intero</span><button data-action="fullscreen">Apri / chiudi</button></div>':''}${this.canInstall?'<div class="toggle-row"><span>Gioca anche come app</span><button data-action="install">Installa</button></div>':screenInfo.isIOS&&!screenInfo.standalone?'<p class="context-note">Su iPhone e iPad: Condividi → Aggiungi a Home per giocare come app.</p>':'<p class="context-note">L’opzione Installa apparirà quando disponibile nel browser.</p>'}<p class="context-note">I sottotitoli italiani si attivano con CC nel lettore dei filmati.</p><button class="text-button" data-screen="controls">Apri la guida ai comandi</button></section></div></section>`;
  if(focus)this.content.querySelector('h1')?.focus({preventScroll:true});
 }

 async loadIntros() {
  try { const response=await fetch(asset('assets/intro/manifest.json'),{signal:this.abort.signal});if(!response.ok)throw Error('Unavailable');this.intros=await response.json(); }
  catch { if(this.destroyed)return;this.intros={entries:[]}; }
  if(!this.destroyed&&this.state.screen==='films')this.render('films',false);
 }
 availableIntros() {
  if(!this.hasScene('WorldIntroScene'))return [];
  return this.worlds.filter(w=>this.intros?.entries?.some(e=>String(e.world)===w.id&&e.character===this.state.character&&e.files?.some(f=>f.name==='intro-mobile-720p.mp4')));
 }
 notice(title,copy,extra='') {
  this.restoreDialogFocus=this.root.activeElement;
  this.$('#notice-title').textContent=title;this.$('#notice-copy').textContent=copy;this.$('#notice-extra').innerHTML=extra;
  this.$('#notice').showModal();
 }
 click(event) {
  const b=event.target.closest('button');if(!b||this.state.busy)return;
  audio.unlock();audio.sfx('select');
  const s=this.state,d=b.dataset;
  if(d.screen)this.render(d.screen);
  if(d.character) {s.character=d.character;this.render(s.screen,false);(this.$(`[data-character="${s.character}"]`)||this.$('.preview-head button'))?.focus({preventScroll:true});}
  if(d.platform){s.platform=d.platform;this.render('controls',false);this.$(`[data-platform="${d.platform}"]`).focus({preventScroll:true});}
  if(d.category){s.category=d.category;s.action=actions.find(a=>a[5]===s.category)[0];this.render('controls',false);this.$(`[data-category="${d.category}"]`).focus({preventScroll:true});}
  if(d.move){s.action=d.move;this.render('controls',false);this.$(`[data-move="${d.move}"]`).focus({preventScroll:true});}
  if(d.level!==undefined){s.level=chooseMenuLevel(this.worlds,+d.level).index;this.render('ready');}
  if(d.bonus){const bonus=MENU_BONUSES.find(v=>v.id===d.bonus);if(bonus)this.notice(bonus.title,bonus.instructions,`<p class="context-note">Prova libera con ${names[s.character]}. Nessun premio assegnato alla campagna.</p><button class="primary" data-start-bonus="${escape(bonus.id)}">Gioca al minigioco</button>`);}
  if(d.action==='dance')this.notice('Gara di ballo di Natale','Segui le frecce per 25 secondi: premi FRECCE o WASD quando raggiungono la linea. Su telefono tocca le quattro zone in basso. P mette in pausa.',`<p class="context-note">Prova libera con ${names[s.character]}.</p><button class="primary" data-action="start-dance">Gioca alla gara</button>`);
  if(d.action==='start-dance'){GameState.character=s.character;this.leave('PartyScene',{preview:true});}
  if(d.startBonus){const bonus=MENU_BONUSES.find(v=>v.id===d.startBonus);if(bonus)this.openBonus(bonus);}
  if(d.legacy&&['BeachScene','LastMailScene'].includes(d.legacy)){GameState.character=s.character;this.leave(d.legacy,{preview:true});}
  if(d.film&&this.availableIntros().some(w=>d.film===w.id+'-1')){this.scene.scene.pause();this.scene.scene.launch('WorldIntroScene',{stageId:d.film,character:s.character,preview:true});}
  if(d.action==='back')this.render(s.screen==='ready'?'characters':'home');
  if(d.action==='start'){s.busy=true;audio.sfx('powerup');audio.stopMusic();GameState.newGame(s.character);GameState.runFrom=this.level().id;this.root.querySelectorAll('button').forEach(button=>button.disabled=true);startLevel(this.scene,s.level);}
  if(d.action==='preview-pause'){s.paused=!s.paused;this.previews.pause(s.paused);b.textContent=(s.paused?'Riprendi':'Ferma')+' anteprima';}
  if(d.action==='audio'){audio.toggleMute();if(s.screen==='options')this.render('options',false);}
  if(d.action==='fullscreen')toggleFullscreen();
  if(d.action==='install')install();
 }
 openBonus(bonus) { GameState.character=this.state.character;this.leave(bonusDestination(bonus,this.hasScene),{bonus:bonus.id,preview:true}); }
 leave(name,data) { if(!this.hasScene(name))return;this.state.busy=true;this.$('#notice').close();this.scene.scene.start(name,data); }
 change(event) {
  const target=event.target;
  if(target.dataset.volume){audio.setVolume(target.dataset.volume,+target.value/100);target.nextElementSibling.textContent=target.value+'%';}
  if(target.dataset.setting==='reduced') {this.state.reduced=target.checked;this.previews.reduce(target.checked);this.header();try{localStorage.setItem(prefKey,JSON.stringify({reduced:target.checked}));}catch{/* Optional persistence. */}}
 }
 key(event) {
  if(this.host.hidden||this.state.busy)return;
  event.stopPropagation();
  if(this.$('#notice').open)return;
  if(event.key==='Escape'){event.preventDefault();this.render(this.state.screen==='ready'?'characters':'home');return;}
  if(['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;
  if(event.target.getAttribute('role')==='tab'&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
   event.preventDefault();this.state.platform=['ArrowLeft','Home'].includes(event.key)?'pc':'touch';this.render('controls',false);this.$(`[data-platform="${this.state.platform}"]`).focus({preventScroll:true});return;
  }
  if(event.key.toLowerCase()==='m'){event.preventDefault();audio.unlock();audio.toggleMute();return;}
  if(event.target.id==='movement-preview') {
   const key=event.key.toLowerCase(),map={arrowleft:'walk',arrowright:'walk',a:'walk',d:'walk',x:'run',' ':'jump',z:'jump',arrowdown:'crouch',s:'crouch',arrowup:'climb',w:'climb',c:'attack',q:'attack',v:'weapon',e:'weapon'};
   let move=map[key];if(move){event.preventDefault();if(move==='jump'){if(performance.now()-(this.lastJump||0)<450)move='double';this.lastJump=performance.now();}this.state.action=move;this.state.category=actions.find(a=>a[0]===move)[5];this.render('controls',false);this.$('#movement-preview').focus({preventScroll:true});}return;
  }
  if(this.state.screen==='characters'&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();this.state.character=event.key==='ArrowLeft'?'man':'woman';this.render('characters',false);this.$(`[data-character="${this.state.character}"]`).focus({preventScroll:true});}
  else if(this.state.screen==='home'&&event.key==='Enter'&&event.target.tagName!=='BUTTON'){event.preventDefault();this.render('characters');}
 }
 destroy() {
  if(this.destroyed)return;this.destroyed=true;
  this.abort.abort();this.unsubscribeAudio?.();this.unsubscribeInstall?.();this.previews.destroy();
  this.scene.events.off('pause',this.onPause);this.scene.events.off('resume',this.onResume);
  this.host.remove();if(this.container)this.container.inert=this.oldInert;
  for(const [node,value]of this.touchStyles)node.style.touchAction=value;
 }
}
