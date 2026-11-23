// Pure rules for the desk bonus. No DOM, audio or campaign state.
export const LAST_MAIL_SECONDS = 60;
export const MAIL_ACTIONS = Object.freeze({close:'CHIUDI ORA', defer:'A GENNAIO', trash:'CESTINO'});
export const MAIL_TASKS = [
  {sender:'AMMINISTRAZIONE',title:'Firma prima della chiusura',detail:'La consegna è già pronta. Manca la tua firma entro le 18 di oggi.',answer:'close',why:'La firma sblocca una consegna di oggi.'},
  {sender:'IL CAPO',title:'URGENTISSIMO: colore del logo',detail:'Serve per la presentazione del 15 gennaio. Possiamo guardarci adesso?',answer:'defer',why:'La presentazione è a gennaio: può aspettare.'},
  {sender:'PREMI AZIENDALI???',title:'Hai vinto una crociera!',detail:'Mittente sconosciuto. Invia la password aziendale per ritirare il premio.',answer:'trash',why:'È spam: nessuna password, nessun premio.'},
  {sender:'MAGAZZINO',title:'Il corriere è alla porta',detail:'Conferma il codice del pacco: il ritiro di oggi chiude alle 18.',answer:'close',why:'Il corriere sta aspettando una conferma reale.'},
  {sender:'MARKETING',title:'Brainstorming super veloce',detail:'Idee per la campagna di febbraio. La riunione è fissata il 12 gennaio.',answer:'defer',why:'La riunione è già fissata dopo le ferie.'},
  {sender:'RISPOSTA A TUTTI',title:'Re: Re: Re: Buone feste',detail:'Grazie! Anche a voi! · Nessuna richiesta o allegato da gestire.',answer:'trash',why:'Una catena di saluti non è una pratica.'},
  {sender:'CLIENTE',title:'Conferma ricevuta',detail:'Il pagamento di oggi è arrivato. Invia la ricevuta già pronta entro le 18.',answer:'close',why:'La ricevuta pronta chiude la pratica di oggi.'},
  {sender:'IL CAPO',title:'Solo cinque minuti!',detail:'Vorrei discutere gli obiettivi di marzo. Nessuna scadenza oggi.',answer:'defer',why:'Gli obiettivi di marzo possono aspettare gennaio.'},
  {sender:'ARCHIVIO',title:'Copia della copia',detail:'Duplicato della ricevuta già archiviata. Non serve alcuna risposta.',answer:'trash',why:'È un doppione: libera la scrivania.'},
  {sender:'RECEPTION',title:'Consegna delle chiavi',detail:'Il custode sta chiudendo. Conferma ora che le chiavi sono in reception.',answer:'close',why:'La conferma serve alla chiusura dell’ufficio.'},
  {sender:'IL CAPO',title:'Ultimissima cosa, giuro',detail:'Un preventivo per febbraio. Il cliente rientra il 9 gennaio.',answer:'defer',why:'Il cliente rientra a gennaio, come te.'},
  {sender:'NEWSLETTER',title:'Sconto toner, solo oggi!',detail:'Pubblicità automatica. Non hai ordinato nulla e il toner è pieno.',answer:'trash',why:'È pubblicità, non una scadenza di lavoro.'}
];
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export class LastMailRound {
  constructor({stress=15,random=Math.random}={}) {
    this.phase='intro'; this.objective='sort'; this.elapsed=0; this.stress=clamp(stress,0,95);
    this.score=0; this.combo=0; this.bestCombo=0; this.resolved=0; this.collected=0;
    this.urgentDone=0; this.errors=0; this.missed=0; this.coffeeLeft=1;
    this.cards=[]; this.serial=0; this.nextSpawn=0; this.selected=null;
    this.deck=[...MAIL_TASKS];
    // Three readable examples first; later requests vary instead of a repeatable 1-2-3 pattern.
    for(let i=this.deck.length-1;i>3;i--){const j=3+Math.floor(clamp(random(),0,.999999)*(i-2));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];}
    this.autoReply=false; this.computerOff=false; this.rewardClaimed=false; this.message='Leggi la scadenza, non la parola «urgente».';
  }
  get remaining(){return Math.max(0,LAST_MAIL_SECONDS-this.elapsed);}
  get multiplier(){return Math.min(4,1+Math.floor(this.combo/3));}
  get paused(){return this.phase==='paused';}
  get current(){return this.cards.find(c=>c.id===this.selected)||null;}
  start(){if(this.phase==='intro')this.phase='play';}
  pause(){if(this.phase==='play')this.phase='paused';}
  resume(){if(this.phase==='paused')this.phase='play';}
  select(id){if(this.phase!=='play'||!this.cards.some(c=>c.id===id))return false;this.selected=id;return true;}
  spawn(){
    if(this.serial>=MAIL_TASKS.length)return null;
    const card={...this.deck[this.serial],id:++this.serial,age:0,life:18};
    this.cards.push(card);if(this.selected===null)this.selected=card.id;return card;
  }
  tick(seconds){
    if(this.phase!=='play'||!Number.isFinite(seconds)||seconds<=0)return [];
    const dt=Math.min(seconds,.1),events=[];
    this.elapsed=Math.min(LAST_MAIL_SECONDS,this.elapsed+dt);
    for(const card of [...this.cards]){
      card.age+=dt;
      if(card.age>=card.life){
        this.remove(card.id);this.missed++;this.combo=0;
        this.stress=clamp(this.stress+(card.answer==='close'?22:12),0,100);
        this.message='Richiesta lasciata scadere: '+card.title;events.push({type:'miss',card});
      }
    }
    if(this.stress>=100)this.finish(false,'Troppe pratiche irrisolte. Il capo ti trattiene.');
    else if(this.remaining<=0)this.finish(false,this.objective==='sort'?'Sono le 18: la scrivania non è pronta.':'Manca l’ultimo passo: risposta automatica e PC spento.');
    else if(this.objective==='sort'){
      if(this.serial<MAIL_TASKS.length&&this.elapsed>=this.nextSpawn&&this.cards.length<3){
        events.push({type:'spawn',card:this.spawn()});this.nextSpawn=this.elapsed+(this.serial<6?4:3);
      }
      this.checkDesk();
    }
    return events;
  }
  remove(id){this.cards=this.cards.filter(c=>c.id!==id);if(this.selected===id)this.selected=this.cards[0]?.id??null;}
  decide(id,action){
    if(this.phase!=='play'||this.objective!=='sort'||!MAIL_ACTIONS[action])return null;
    const card=this.cards.find(c=>c.id===id);if(!card)return null;
    this.remove(id);const correct=card.answer===action;
    if(correct){
      this.resolved++;if(action==='close')this.urgentDone++;
      this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);
      this.score+=(action==='close'?35:25)*this.multiplier;this.stress=clamp(this.stress-3,0,100);
      this.message=card.why;
    }else{
      this.errors++;this.combo=0;this.stress=clamp(this.stress+(card.answer==='close'?22:12),0,100);
      this.message='Serviva «'+MAIL_ACTIONS[card.answer]+'». '+card.why;
    }
    if(this.stress>=100)this.finish(false,'Hai rimandato anche le vere urgenze. Ferie rinviate.');
    else this.checkDesk();
    return {type:correct?'sorted':'wrong',card,action,correct,message:this.message};
  }
  checkDesk(){
    if(this.phase!=='play'||this.serial<MAIL_TASKS.length||this.cards.length)return;
    if(this.urgentDone<3||this.resolved<9){this.finish(false,'Servono almeno 3 urgenze chiuse e 9 richieste gestite correttamente.');return;}
    if(this.objective==='sort'){this.collected=1;this.objective='autoreply';this.message='Ferie approvate! Attiva la risposta automatica.';}
  }
  complete(action){
    if(this.phase!=='play')return false;
    if(action==='autoreply'&&this.objective==='autoreply'){
      this.autoReply=true;this.objective='shutdown';this.message='«Sono in ferie. Torno a gennaio.» Ora spegni il PC.';return true;
    }
    if(action==='shutdown'&&this.objective==='shutdown'){
      this.computerOff=true;this.score+=150;this.finish(true,'Posta sistemata. Risposta automatica attiva. PC spento. Buone ferie!');return true;
    }
    return false;
  }
  coffee(){if(this.phase!=='play'||!this.coffeeLeft)return false;this.coffeeLeft--;this.stress=clamp(this.stress-25,0,100);return true;}
  finish(won,message){if(!['play','paused'].includes(this.phase))return;this.phase='result';this.won=!!won;this.message=message;this.cards=[];this.selected=null;}
  claimReward(){
    if(this.phase!=='result'||this.rewardClaimed)return null;this.rewardClaimed=true;
    return {vacationDays:this.won?1:0,stress:this.won?-20:10,euro:this.won?Math.min(30,Math.floor(this.score/50)):0};
  }
}
