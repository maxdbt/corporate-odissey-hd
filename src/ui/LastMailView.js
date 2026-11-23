import { LAST_MAIL_SECONDS, MAIL_ACTIONS } from '../systems/LastMailRound.js';
import { audio } from '../systems/Audio8bit.js';
import { screenInfo, toggleFullscreen } from '../systems/Screen.js';
import './last-mail.css';

const asset = (name) => import.meta.env.BASE_URL + 'assets/last-mail/' + name;
const icons = {
  stamp: '<path d="M8 16h16v5H8zM12 16v-5c-4-7 12-7 8 0v5M5 25h22"/>',
  coffee: '<path d="M6 12h16v9a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6zM22 13h3a4 4 0 0 1 0 8h-3M11 3c-4 4 4 4 0 7M18 3c-4 4 4 4 0 7"/>',
  mail: '<rect x="3" y="7" width="26" height="19" rx="2"/><path d="m4 9 12 9L28 9"/>',
  file: '<path d="M7 3h13l6 6v21H7zM19 3v8h7M11 17h11M11 22h8"/>',
  call: '<path d="M9 4 4 8c0 10 11 21 21 21l4-5-7-5-4 4-9-9 4-4z"/>',
  vacation: '<path d="M7 28h19M18 27l3-18M21 9Q9-3 4 10q8-4 17-1M21 9Q25-2 31 7q-6-1-10 2M21 9Q13 9 11 17q5-4 10-8"/>',
  pause: '<path d="M11 6v20M21 6v20"/>',
  screen: '<path d="M12 4H4v8M20 4h8v8M4 20v8h8M28 20v8h-8"/>',
  sound: '<path d="m4 13 7 0 8-7v22l-8-7H4zM23 11q8 6 0 12"/>',
  clock: '<circle cx="16" cy="18" r="11"/><path d="M12 2h8M16 7v11l5 3"/>'
};
const icon = (name) => '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + icons[name] + '</svg>';

export default class LastMailView {
  constructor(round,sound,{preview=false,onExit,onRetry,onReward}) {
    Object.assign(this,{round,sound,preview,onExit,onRetry,onReward});
    this.abort=new AbortController();this.nodes=new Map();this.timers=new Set();
    this.originalFocus=document.activeElement;this.stampAge=99;this.loaded=false;this.resultShown=false;this.letterKey='';
    this.root=document.createElement('section');this.root.className='last-mail';
    this.root.setAttribute('aria-label','L’ultima mail: ultimo minuto prima delle ferie');
    this.root.dataset.touch=String(matchMedia('(pointer: coarse)').matches||new URLSearchParams(location.search).get('controls')==='touch'||new URLSearchParams(location.search).get('touch')==='1');
    this.root.dataset.phase='intro';this.root.dataset.modal='true';
    this.root.innerHTML='<div class="lm-office"></div><div class="lm-shade"></div>'+
      '<header class="lm-hud"><div><span class="lm-eyebrow">24 DICEMBRE · ORE 17:59</span><h1>L’ultima mail</h1></div>'+
      '<div class="lm-timer"><small>PRIMA DELLE FERIE</small><strong data-value="time">01:00</strong></div>'+
      '<div class="lm-stress"><span>STRESS <b data-value="stress">15</b>%</span><div><i></i></div></div>'+
      '<div class="lm-score"><strong data-value="score">0000</strong><small>COMBO <b data-value="combo">×1</b></small></div>'+
      '<nav class="lm-tools" aria-label="Comandi del bonus"><button data-action="fullscreen" aria-label="Schermo intero">'+icon('screen')+'</button><button data-action="mute" aria-label="Disattiva audio">'+icon('sound')+'</button><button data-action="voice" aria-label="Disattiva battute vocali">V</button><button data-action="pause" aria-label="Pausa">'+icon('pause')+'</button></nav></header>'+
      '<div class="lm-progress"><i></i></div>'+
      '<aside class="lm-inbox"><span class="lm-eyebrow">POSTA IN ARRIVO</span><div class="lm-cards" aria-label="Richieste sulla scrivania"></div><p class="lm-inbox-note">Seleziona un foglio.<br>Leggi la scadenza, poi decidi.</p></aside>'+
      '<article class="lm-letter" tabindex="0" aria-label="Richiesta selezionata"></article>'+
      '<aside class="lm-checklist"><span class="lm-eyebrow">PRIMA DI USCIRE</span><h2>La tua libertà.</h2><p data-value="urgent"></p><p data-value="handled"></p><p data-value="permit"></p><p data-value="reply"></p><p data-value="shutdown"></p><button data-action="coffee">'+icon('coffee')+' CAFFÈ <b data-value="coffee">1</b></button><small>Una tazzina: −25 stress</small></aside>'+
      '<div class="lm-stamp-hand" aria-hidden="true"></div><div class="lm-imprint" aria-hidden="true"></div>'+
      '<div class="lm-feedback" role="status" aria-live="polite">Leggi la scadenza, non la parola «urgente».</div>'+
      '<footer class="lm-bottom"><div class="lm-trays" aria-label="Destinazioni della richiesta">'+
      '<button data-sort="close"><kbd>1</kbd><strong>CHIUDI ORA</strong><small>Serve entro oggi</small></button>'+
      '<button data-sort="defer"><kbd>2</kbd><strong>A GENNAIO</strong><small>Può aspettare</small></button>'+
      '<button data-sort="trash"><kbd>3</kbd><strong>CESTINO</strong><small>Spam e doppioni</small></button></div>'+
      '<div class="lm-hint">Scegli un foglio, poi 1 · 2 · 3 o un timbro · Puoi anche trascinarlo · ← → cambia foglio · Spazio: caffè</div></footer>'+
      '<div class="lm-modal"><div class="lm-panel" role="dialog" aria-modal="true" aria-labelledby="lm-panel-title"></div></div>'+
      '<div class="lm-rotate"><strong>Ruota il telefono ↻</strong><p>La scrivania ti aspetta in orizzontale. Il tempo è fermo.</p></div>';
    document.body.appendChild(this.root);
    this.root.querySelector('.lm-office').style.backgroundImage='url("'+asset('office.webp')+'")';
    this.root.querySelector('.lm-stamp-hand').style.backgroundImage='url("'+asset('stamp-frames.webp')+'")';
    this.panel=this.root.querySelector('.lm-panel');this.layer=this.root.querySelector('.lm-cards');this.letter=this.root.querySelector('.lm-letter');
    this.listen(this.root,'click',e=>{
      const card=e.target.closest('[data-card]'),sort=e.target.closest('[data-sort]'),action=e.target.closest('[data-action]');
      if(card){this.round.select(Number(card.dataset.card));this.refresh();}
      else if(sort)this.decide(sort.dataset.sort);
      else if(action)this.action(action.dataset.action);
    });
    this.listen(this.letter,'pointerdown',e=>{
      if(e.button!==0||this.round.phase!=='play'||!this.round.current)return;
      this.drag={id:this.round.selected,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
      this.letter.setPointerCapture(e.pointerId);
    });
    this.listen(this.letter,'pointermove',e=>{
      if(!this.drag||e.pointerId!==this.drag.pointer)return;
      const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;
      if(Math.hypot(dx,dy)>8)this.drag.moved=true;
      if(this.drag.moved){this.letter.style.transform='translate('+dx+'px,'+dy+'px) rotate('+(dx*.025)+'deg)';this.letter.classList.add('lm-dragging');}
    });
    this.listen(this.letter,'pointerup',e=>{
      if(!this.drag)return;const drag=this.drag;this.cancelDrag();
      if(drag.moved){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-sort]');if(target)this.decide(target.dataset.sort,drag.id);}
    });
    this.listen(this.letter,'pointercancel',()=>this.cancelDrag());
    this.listen(window,'keydown',e=>this.key(e),true);
    this.listen(window,'blur',()=>this.pause());
    this.listen(document,'visibilitychange',()=>{if(document.hidden)this.pause();});
    this.listen(window,'resize',()=>this.checkOrientation());
    this.listen(window,'pagehide',()=>this.pause());
    this.showIntro();this.assetsReady();this.refresh();
  }
  listen(target,name,fn,capture=false){target.addEventListener(name,fn,{signal:this.abort.signal,capture});}
  later(fn,ms){const id=setTimeout(()=>{this.timers.delete(id);if(this.root.isConnected)fn();},ms);this.timers.add(id);}
  cancelDrag(){this.drag=null;this.letter.style.transform='';this.letter.classList.remove('lm-dragging');}
  async assetsReady(){
    const load=file=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=asset(file);});
    try{
      await Promise.all([load('office.webp'),load('stamp-frames.webp')]);if(!this.root.isConnected)return;
      this.loaded=true;const b=this.panel.querySelector('[data-action="start"]');if(b){b.disabled=false;b.textContent='SISTEMA L’ULTIMA POSTA';b.focus();}
    }catch{const b=this.panel.querySelector('[data-action="start"]');if(b){b.disabled=false;b.dataset.action='reload';b.textContent='RICARICA LE IMMAGINI';}}
  }
  showIntro(){
    this.modal('<span class="lm-eyebrow">UN MINUTO. POI BASTA.</span><h2 id="lm-panel-title">Le ferie si difendono.</h2>'+
      '<p>La borsa è pronta. Restano 12 richieste.<br>Non sono tutte urgenti: leggi prima di timbrare.</p>'+
      '<div class="lm-instructions"><div><b>01 · CHIUDI ORA</b><span>Scadenze reali di oggi.</span></div><div><b>02 · A GENNAIO</b><span>Richieste che possono aspettare.</span></div><div><b>03 · CESTINO</b><span>Spam, doppioni e catene di saluti.</span></div></div>'+
      '<p class="lm-goal">Gestisci bene almeno <b>9 richieste</b>, di cui <b>3 urgenze</b>.<br>Poi attiva la risposta automatica e spegni il PC.</p>'+
      '<button class="lm-primary" data-action="start" disabled>PREPARO LA SCRIVANIA…</button><button class="lm-link" data-action="exit">TORNA AI MINIGIOCHI</button>'+
      '<small>Tocca un foglio e scegli il timbro, oppure trascinalo.<br>Tastiera: 1 / 2 / 3 per i timbri · Spazio per il caffè.</small>');
  }
  modal(html){this.root.dataset.modal='true';this.panel.innerHTML=html;this.panel.querySelector('button:not(:disabled)')?.focus();}
  hideModal(){this.root.dataset.modal='false';this.root.tabIndex=-1;this.root.focus({preventScroll:true});}
  action(action){
    if(action==='start'&&this.loaded&&this.round.phase==='intro'&&!this.checkOrientation()){this.sound.unlock();this.round.start();this.hideModal();}
    if(action==='reload'){this.showIntro();this.assetsReady();}
    if(action==='pause')this.pause();
    if(action==='resume'&&!this.checkOrientation()){this.round.resume();this.hideModal();this.sound.unlock();}
    if(action==='coffee'&&this.round.coffee()){this.sound.unlock();this.sound.effect('coffee');this.feedback(this.sound.say('coffee',true)||'Caffè: −25 stress.');}
    if(action==='autoreply'||action==='shutdown'){
      if(this.round.complete(action)){this.sound.effect('collect');this.feedback(this.round.message);this.letterKey='';}
    }
    if(action==='fullscreen')toggleFullscreen();
    if(action==='mute'){audio.toggleMute();this.sound.setMuted();this.root.querySelector('[data-action="mute"]').setAttribute('aria-label',audio.muted?'Attiva audio':'Disattiva audio');}
    if(action==='voice'){this.sound.voices=!this.sound.voices;this.sound.stopVoices();this.root.querySelector('[data-action="voice"]').setAttribute('aria-label',this.sound.voices?'Disattiva battute vocali':'Attiva battute vocali');}
    if(action==='retry'&&this.preview)this.onRetry();
    if(action==='exit')this.onExit();
    this.refresh();
  }
  key(e){
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const k=e.key.toLowerCase();
    if(k==='tab'){
      const scope=this.root.dataset.modal==='true'?this.panel:this.root;
      const list=[...scope.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(b=>b.getClientRects().length);
      if(list.length&&((!e.shiftKey&&document.activeElement===list.at(-1))||(e.shiftKey&&document.activeElement===list[0]))){e.preventDefault();(e.shiftKey?list.at(-1):list[0]).focus();}
      return;
    }
    if(!['1','2','3','arrowleft','arrowright',' ','enter','p','escape','f','m'].includes(k))return;
    if(k==='enter'&&e.target.tagName==='BUTTON')return;
    e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
    if(k==='f')this.action('fullscreen');
    else if(k==='m')this.action('mute');
    else if(k==='p'||k==='escape')this.round.paused?this.action('resume'):this.pause();
    else if(this.round.phase==='intro'&&(k==='enter'||k===' '))this.action('start');
    else if(this.round.phase==='play'){
      if(k===' ')this.action('coffee');
      if(['1','2','3'].includes(k))this.decide(['close','defer','trash'][Number(k)-1]);
      if(k==='enter'&&this.round.objective!=='sort')this.action(this.round.objective);
      if(k==='arrowleft'||k==='arrowright'){
        const cards=this.round.cards,i=cards.findIndex(c=>c.id===this.round.selected);
        if(cards.length)this.round.select(cards[(i+(k==='arrowleft'?-1:1)+cards.length)%cards.length].id);
      }
    }
    this.refresh();
  }
  checkOrientation(){const portrait=this.root.dataset.touch==='true'&&innerHeight>innerWidth;this.root.dataset.portrait=String(portrait);if(portrait)this.pause();return portrait;}
  pause(){
    if(this.round.phase!=='play')return;
    this.cancelDrag();this.round.pause();this.sound.stopVoices();this.refresh();
    this.modal('<span class="lm-eyebrow">IL CAPO PUÒ ASPETTARE</span><h2 id="lm-panel-title">Un attimo di respiro.</h2><p>Timer, richieste e scadenze sono fermi.</p><button class="lm-primary" data-action="resume">RIPRENDI</button><button class="lm-link" data-action="exit">ESCI DAL BONUS</button>');
  }
  decide(action,id=this.round.selected){
    const result=this.round.decide(id,action);if(!result)return;
    this.cancelDrag();this.sound.unlock();this.sound.effect(result.correct?'stamp':'miss');
    if(result.correct&&action==='defer')this.sound.say('stamp');
    this.stampAge=0;
    const mark=this.root.querySelector('.lm-imprint');mark.textContent=result.correct?MAIL_ACTIONS[action]:'DA RIVEDERE';
    mark.classList.toggle('lm-wrong',!result.correct);
    this.feedback(result.message,!result.correct);this.refresh();
  }
  feedback(text,wrong=false){const node=this.root.querySelector('.lm-feedback');node.textContent=text;node.classList.toggle('lm-wrong',wrong);}
  renderLetter(){
    const r=this.round,card=r.current,key=r.objective+':'+(card?.id||0);
    if(key===this.letterKey)return;this.letterKey=key;
    this.letter.classList.toggle('lm-monitor',r.objective!=='sort');
    if(r.objective==='autoreply')this.letter.innerHTML='<span class="lm-eyebrow">FERIE APPROVATE ✓</span><h2>Fuori ufficio.</h2><p class="lm-mail-body">«Sono in ferie. Torno a gennaio.<br>Risponderò al mio rientro.»</p><button class="lm-primary" data-action="autoreply">ATTIVA RISPOSTA AUTOMATICA</button>';
    else if(r.objective==='shutdown')this.letter.innerHTML='<span class="lm-eyebrow">RISPOSTA AUTOMATICA ATTIVA ✓</span><h2>Chiudi tutto.</h2><p class="lm-mail-body">La borsa è pronta. Il lavoro può aspettare.</p><button class="lm-primary" data-action="shutdown">SPEGNI IL PC · ⏻</button>';
    else if(card)this.letter.innerHTML='<div class="lm-paper-top"><span>DA: '+card.sender+'</span><span>POSTA '+card.id+'/12</span></div><h2>'+card.title+'</h2><p class="lm-mail-body">'+card.detail+'</p><div class="lm-paper-bottom"><span>Leggi · scegli · timbra</span><span class="lm-deadline"></span></div><div class="lm-paper-timer"><i></i></div>';
    else this.letter.innerHTML='<span class="lm-eyebrow">SCRIVANIA LIBERA</span><h2>Un momento di pace.</h2><p class="lm-mail-body">Arriverà ancora qualcosa.<br>Il capo non ha ancora preso la borsa.</p>';
  }
  showResult(){
    if(this.resultShown)return;this.resultShown=true;const r=this.round;
    this.onReward(r.claimReward());this.sound.effect(r.won?'win':'miss');if(r.won)this.sound.say('win',true);
    this.modal('<span class="lm-eyebrow">'+(r.won?'PC SPENTO · FERIE INIZIATE':'IL TURNO È FINITO')+'</span><h2 id="lm-panel-title">'+(r.won?'Ci vediamo a gennaio.':'L’ultima mail… era davvero l’ultima?')+'</h2><p>'+r.message+'</p>'+
      '<div class="lm-result-stats"><div><strong>'+r.score+'</strong><span>PUNTI</span></div><div><strong>'+r.resolved+'/12</strong><span>SCELTE CORRETTE</span></div><div><strong>'+r.errors+'</strong><span>ERRORI</span></div></div>'+
      '<p class="lm-goal">'+(this.preview?'Prova libera · nessuna modifica alla campagna.':r.won?'+1 FERIE · CHECKPOINT · −20 STRESS':'+10 stress · Ritorno alla campagna.')+'</p>'+
      (this.preview?'<button class="lm-primary" data-action="retry">UN ALTRO TURNO</button>':'')+'<button class="lm-link" data-action="exit">TORNA '+(this.preview?'AI MINIGIOCHI':'IN UFFICIO')+'</button>');
  }
  refresh(){
    const r=this.round;this.root.dataset.phase=r.phase;this.root.dataset.objective=r.objective;
    if(this.drag&&!r.cards.some(c=>c.id===this.drag.id))this.cancelDrag();
    const seconds=Math.ceil(r.remaining),v={
      time:String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0'),stress:Math.round(r.stress),
      score:String(r.score).padStart(4,'0'),combo:'×'+r.multiplier,coffee:r.coffeeLeft,
      urgent:(r.urgentDone>=3?'✓ ':'○ ')+'Urgenze chiuse '+Math.min(3,r.urgentDone)+'/3',
      handled:(r.resolved>=9?'✓ ':'○ ')+'Scelte corrette '+Math.min(9,r.resolved)+'/9',
      permit:(r.collected?'✓ ':'○ ')+'Ferie approvate',reply:(r.autoReply?'✓ ':'○ ')+'Risposta automatica',
      shutdown:(r.computerOff?'✓ ':'○ ')+'PC spento'};
    for(const [key,value] of Object.entries(v)){const node=this.root.querySelector('[data-value="'+key+'"]');if(node.textContent!==String(value))node.textContent=value;}
    this.root.querySelector('.lm-stress i').style.width=r.stress+'%';
    this.root.querySelector('.lm-progress i').style.transform='scaleX('+r.remaining/LAST_MAIL_SECONDS+')';
    this.root.classList.toggle('lm-danger',r.stress>=75);
    this.root.querySelector('[data-action="coffee"]').disabled=!r.coffeeLeft||r.phase!=='play';
    this.root.querySelector('[data-action="pause"]').disabled=r.phase!=='play';
    this.root.querySelector('[data-action="fullscreen"]').hidden=!screenInfo.canFullscreen;
    this.root.querySelectorAll('[data-sort]').forEach(b=>b.disabled=r.phase!=='play'||!r.current);
    const ids=new Set(r.cards.map(c=>c.id));
    for(const [id,node] of this.nodes)if(!ids.has(id)){node.remove();this.nodes.delete(id);}
    for(const card of r.cards){
      let node=this.nodes.get(card.id);
      if(!node){node=document.createElement('button');node.dataset.card=card.id;node.className='lm-card';node.innerHTML='<small>'+card.sender+'</small><strong>'+card.title+'</strong>';this.layer.appendChild(node);this.nodes.set(card.id,node);}
      node.setAttribute('aria-pressed',String(card.id===r.selected));node.disabled=r.phase!=='play';
      node.classList.toggle('lm-near',card.age/card.life>.75);
    }
    this.renderLetter();
    if(r.current){
      this.letter.querySelector('.lm-deadline').textContent=Math.ceil(r.current.life-r.current.age)+'s prima che si accumuli';
      this.letter.querySelector('.lm-paper-timer i').style.width=(1-r.current.age/r.current.life)*100+'%';
    }
    if(r.phase==='result')this.showResult();
  }
  update(delta){
    if(!this.root.isConnected)return;
    const events=this.round.tick(delta/1000);
    for(const event of events){this.sound.effect(event.type==='spawn'?'spawn':'miss');if(event.type==='miss')this.feedback('Scaduta: '+event.card.title,true);}
    if(this.round.phase==='play'){
      this.stampAge+=Math.min(delta,100)/1000;
      const frame=this.stampAge<.10?1:this.stampAge<.2?2:this.stampAge<.35?3:0;
      const hand=this.root.querySelector('.lm-stamp-hand');
      hand.style.backgroundPosition=(frame%2?'100%':'0%')+' '+(frame>=2?'100%':'0%');
      const movement=this.stampAge<.5?Math.sin(this.stampAge/.5*Math.PI):0;
      hand.style.transform='translateY('+(movement*-32)+'px) rotate('+(movement*-9)+'deg) scale('+(1+movement*.05)+')';
      this.root.querySelector('.lm-imprint').style.opacity=this.stampAge>.12&&this.stampAge<1?String(Math.min(1,(1-this.stampAge)*2)):0;
    }
    this.refresh();
  }
  destroy(){this.abort.abort();this.timers.forEach(clearTimeout);this.root.remove();this.originalFocus?.isConnected&&this.originalFocus.focus?.({preventScroll:true});}
}
