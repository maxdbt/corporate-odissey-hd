// Pure rules: Phaser renders this state. Pausing never advances clocks or awards rewards.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export default class StageBonusRound {
 constructor(config, random=Math.random) {
  this.config=config; this.random=random; this.elapsed=0; this.score=0; this.lives=config.mode==='golf'?5:3;
  this.finished=false; this.won=false; this.paused=false; this.revision=0; this.feedback='';
  this.tilt=0; this.velocity=0; this.position=.5; this.power=0; this.progress=0; this.phase=0;
  this.nextChallenge();
 }
 int(n){return Math.floor(this.random()*n);}
 nextChallenge(){
  const c=this.config; this.revision++; this.phase=0; this.cursor=0; this.showUntil=this.elapsed+2.4;
  this.answer=this.int(3); this.options=[]; this.prompt=''; this.moves=18;
  if(c.mode==='memory'){
   const length=3+this.score;
   this.sequence=Array.from({length},()=>this.int(c.id==='mirage'?9:4));
   this.prompt=c.id==='mirage'?'Memorizza il percorso':'Memorizza i gesti';
  } else if(c.mode==='route'||c.mode==='circuit'){
   this.target=Array.from({length:3},()=>c.mode==='circuit'?0:this.int(3));
   this.switches=this.target.map(v=>(v+1+this.int(2))%3);
   this.prompt=c.mode==='route'?'Allinea gli scambi, poi PARTENZA':'Allinea i contatti, poi ACCENDI';
  } else if(c.mode==='valves'){
   this.target=Array.from({length:3},()=>1+this.int(4)); this.switches=[0,0,0];
   this.prompt='Porta ogni valvola al valore richiesto';
  } else if(c.mode==='signals'){
   this.answer=this.int(6); this.prompt='Quale telefono sta squillando?'; this.deadline=this.elapsed+Math.max(1.2,3-this.score*.12);
  } else if(c.mode==='rhythm'){
   this.prompt='Apri il microfono nella fascia verde'; this.hit=false;
  } else if(c.mode==='golf'){
   this.targetPower=.32+this.random()*.36; this.prompt='Centra la fascia verde, poi TIRA';
  } else if(c.mode==='flight'){
   this.gate=.2+this.random()*.6; this.gateX=1.15; this.prompt='Attraversa l’anello';
  } else if(c.mode==='choices') this.makeChoices();
 }
 makeChoices(){
  const id=this.config.id,a=this.answer,n=20+this.int(70);
  if(id==='address'){
   const sites=['SEDE A','SEDE B','SEDE C'], site=sites[this.int(3)];
   this.prompt='Appuntamento: '+site+' · Via Milano '+n;
   this.options=Array.from({length:3},(_,i)=>i===a?site+' · n. '+n:sites[(sites.indexOf(site)+i+1)%3]+' · n. '+(n+i+1));
  } else if(id==='expenses'){
   this.options=['VIAGGIO','PASTI','DUPLICATO'];
   this.prompt=[['Biglietto ferroviario','Ricevuta taxi','Carta d’imbarco'][this.int(3)],['Pranzo al bistrot','Caffè in stazione','Cena in hotel'][this.int(3)],'Ricevuta già registrata · COPIA'][a]+' · '+n+' €';
  } else if(id==='luggage'){
   const names=['ROSSI','BIANCHI','VERDI'], name=names[this.int(3)];
   this.prompt='La tua etichetta: '+name+' / '+(100+n);
   this.options=Array.from({length:3},(_,i)=>i===a?name+' / '+(100+n):names[this.int(3)]+' / '+(200+n+i));
  } else if(id==='scope'){
   const extra=['App mobile','Traduzione tedesca','Assistenza notturna','Report settimanali','Integrazione pagamenti','Logo animato'][this.score%6];
   this.prompt='ACCORDO: sito + catalogo\nNUOVA RICHIESTA: sito + catalogo + '+extra;
   this.options=['Sito','Catalogo']; this.options.splice(a,0,extra);
  } else if(id==='calendar'){
   const start=9+this.int(5);
   this.prompt='Occupato: '+start+':00–'+(start+1)+':00 e '+(start+2)+':00–'+(start+3)+':00\nServe un incontro di 60 minuti.';
   this.options=[start+':00', (start+2)+':00'];this.options.splice(a,0,(start+1)+':00');
  }
 }
 good(){
  this.score++;this.feedback='Perfetto!';
  if(this.score>=this.config.goal) this.end(true); else this.nextChallenge();
 }
 miss(){
  this.lives--;this.feedback='Riprova, con calma.';
  if(this.lives<=0)this.end(false);
 }
 act(index=0){
  if(this.finished||this.paused)return;
  const mode=this.config.mode;
  if(mode==='choices'||mode==='signals'){
   if(index===this.answer)this.good();else {this.miss();if(!this.finished)this.nextChallenge();}
  } else if(mode==='memory'){
   if(this.elapsed<this.showUntil)return;
   if(index===this.sequence[this.cursor]){
    this.cursor++;this.revision++;
    if(this.cursor===this.sequence.length)this.good();
   } else {this.miss();this.cursor=0;this.showUntil=this.elapsed+2.4;this.revision++;}
  } else if(mode==='route'||mode==='circuit'||mode==='valves'){
   if(index<3){this.switches[index]=(this.switches[index]+1)%(mode==='valves'?5:3);this.moves--;this.revision++;}
   else if(this.switches.every((v,i)=>v===this.target[i]))this.good();
   else this.miss();
   if(this.moves<=0&&!this.finished){this.miss();if(!this.finished)this.nextChallenge();}
  } else if(mode==='rhythm'){
   if(this.hit)return;this.hit=true;
   if(this.phase>=.60&&this.phase<=.85)this.good();else {this.miss();if(!this.finished)this.nextChallenge();}
  } else if(mode==='golf'){
   const hit=Math.abs(this.power-this.targetPower)<.105;
   this.lastShot={power:this.power,target:this.targetPower,hit,at:this.elapsed};
   if(hit)this.good();else {this.miss();if(!this.finished)this.nextChallenge();}
  }
 }
 update(seconds,control=0){
  if(this.finished||this.paused)return;
  const dt=clamp(Number.isFinite(seconds)?seconds:0,0,.1),mode=this.config.mode;
  this.elapsed+=dt;
  if(mode==='balance'){
   // Deterministic telegraphed impulses; continuous counter-steering controls inertia.
   const wave=Math.sin(this.elapsed*(this.config.id==='coffee'?2.2:1.45));
   this.wind=wave;
   this.velocity+=(wave*.65+control*2.7+this.tilt*.3)*dt;
   this.velocity*=Math.exp(-1.8*dt);this.tilt+=this.velocity*dt;
   if(Math.abs(this.tilt)>1){this.miss();this.tilt*=.3;this.velocity=0;}
   if(Math.abs(this.tilt)<.55)this.progress+=dt;
   this.score=Math.min(this.config.goal,Math.floor(this.progress));
   if(this.score>=this.config.goal)this.end(true);
  } else if(mode==='rhythm'){
   this.phase+=dt/.95;if(this.phase>1){this.miss();if(!this.finished)this.nextChallenge();}
  } else if(mode==='signals'&&this.elapsed>this.deadline){this.miss();if(!this.finished)this.nextChallenge();}
  else if(mode==='golf')this.power=(Math.sin(this.elapsed*2.4)+1)/2;
  else if(mode==='flight'){
   this.position=clamp(this.position+control*dt*.6+Math.sin(this.elapsed*1.7)*dt*.04,.05,.95);
   this.gateX-=dt*.38;
   if(this.gateX<=.18){if(Math.abs(this.position-this.gate)<.17)this.good();else{this.miss();if(!this.finished)this.nextChallenge();}}
  }
  if(this.elapsed>=this.config.duration&&!this.finished)this.end(this.score>=this.config.goal);
 }
 end(won){if(this.finished)return;this.finished=true;this.won=won;this.revision++;}
 reward(){return this.finished&&this.won?{...this.config.reward}:{hp:0,stress:0,euro:0};}
}
