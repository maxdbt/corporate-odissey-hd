import {Round,clamp} from './physics.js';
export const MEETING_CARDS=[
 {id:'focus',name:'Vai al punto',cost:1,text:'+2 progresso. Una divagazione attiva riduce l’effetto.'},
 {id:'delegate',name:'Assegna',cost:1,text:'Nomina un responsabile e avanza di 1.'},
 {id:'decide',name:'Decidi',cost:2,text:'+3 progresso con responsabile, altrimenti solo +1.'},
 {id:'park',name:'Fuori agenda',cost:1,text:'Annulla la prossima intenzione e riduce la pressione.'},
 {id:'clarify',name:'Chiarisci',cost:1,text:'Elimina le divagazioni, riduce le richieste extra e avanza di 1.'},
 {id:'break',name:'Pausa caffè',cost:0,text:'Recupera 2 energia e riduce la pressione.'}
];
export const INTENTIONS=['Divagazione','Richiesta extra','Urgenza','Confusione','Collaborazione'];
export default class MeetingCards extends Round {
 constructor(){super();this.agenda=['Budget','Consegna','Responsabilità'].map(name=>({name,progress:0,goal:6,assigned:false}));this.selected=0;this.turn=0;this.energy=4;this.pressure=0;this.digressions=0;this.lastCard=null;}
 get intention(){return INTENTIONS[this.turn%INTENTIONS.length];}
 play(id,target=this.selected){
  if(!this.active)return false;const c=MEETING_CARDS.find(c=>c.id===id),a=this.agenda[target];
  if(!c||!a||this.energy<c.cost||this.lastCard===id){this.message='Energia insufficiente o carta appena usata: varia la strategia.';return false;}
  this.energy-=c.cost;this.selected=target;let blocked=false;
  if(id==='focus')a.progress+=Math.max(1,2-this.digressions);
  if(id==='delegate'){a.assigned=true;a.progress++;}
  if(id==='decide')a.progress+=a.assigned?3:1;
  if(id==='park'){blocked=true;this.pressure=Math.max(0,this.pressure-2);}
  if(id==='clarify'){this.digressions=0;a.goal=Math.max(6,a.goal-1);a.progress++;}
  if(id==='break'){this.energy+=2;this.pressure=Math.max(0,this.pressure-1);}
  a.progress=Math.min(a.goal,a.progress);
  if(this.agenda.every(a=>a.assigned&&a.progress>=a.goal)){this.end(true,'Tre decisioni, tre responsabili. La call è chiusa!');return true;}
  if(!blocked){switch(this.turn%5){case 0:this.digressions=Math.min(2,this.digressions+1);break;case 1:if(a.progress<a.goal)a.goal=Math.min(8,a.goal+1);break;case 2:this.pressure+=2;break;case 3:a.progress=Math.max(0,a.progress-1);break;case 4:this.energy++;}}
  this.turn++;this.pressure+=.4;this.energy=clamp(this.energy+1,0,5);this.lastCard=id;this.revision++;
  this.message='Prossimo intervento: '+this.intention;
  if(this.turn>=24||this.pressure>=10)this.end(false,'La riunione si è allungata oltre il consentito.');return true;
 }
}
