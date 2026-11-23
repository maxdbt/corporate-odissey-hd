// Only the eight approved redesigns are reachable. Legacy files are retained as source history.
const entries=[
 ['party','1-1','Fuga dalla festa aziendale','party','phone','objects',1985,'Fuga tra la folla','Recupera cappotto e chiavi e raggiungi l’uscita, fra 24 colleghi che occupano i passaggi. Frecce/WASD o tocco muovono; E nasconde vicino alle piante; SPAZIO distrae quattro volte. Aggira i chiacchieroni!'],
 ['parking','1-1','Parcheggio del 24 dicembre','travel','taxi','equipment',5200,'Incastri','Libera l’auto rossa in tre parcheggi. Trascina i veicoli lungo il loro asse, oppure selezionali e usa le frecce. Spingi l’auto oltre l’uscita a destra. Z annulla.'],
 ['pedalo','1-2','Ferie, ma non troppo','sea','parasol','equipment',null,'Fuga in pedalò','Raggiungi la caletta senza campo. ← → sterza, ↓ rallenta; SPAZIO accelera consumando energia, E apre l’ombrellone contro drone e capo. Evita gli scogli.'],
 ['tray','2-1','Il vassoio impossibile','canteen','tray','furniture',4800,'Fisica in prima persona','Porta almeno due piatti e il 30% del caffè al tavolo. ← → scegli il percorso; SPAZIO cammina veloce, E rallenta. Le sterzate brusche fanno scivolare le stoviglie.'],
 ['call','3-1','Questa call poteva essere una mail','meeting','microphone','furniture',1800,'Duello di carte','Chiudi tre punti dell’agenda e assegna un responsabile a ciascuno. Leggi l’intenzione avversaria, scegli il punto e gioca una carta. Le carte consumano energia e non puoi ripetere quella appena usata.'],
 ['taxi','4-1','L’indirizzo giusto','travel','taxi','equipment',null,'Città esplorabile','Guida nella città HD: frecce/WASD, SPAZIO frena, E conferma l’arrivo. M apre la mappa. Trova Piazza Milano 12, poi la nuova sede in Via Verdi 8. In anteprima puoi esplorare senza timer.'],
 ['packing','4-2','Valigia impossibile','travel','bag','objects',null,'Incastri e rotazioni','Scegli un oggetto sul tavolo, ruotalo con R e tocca una casella per riporlo. Fragili a sinistra, pesanti a destra. Tocca un oggetto riposto per recuperarlo. Chiudi entrambe le valigie.'],
 ['golf','5-4','Il golf del direttore','director','trophy','objects',1460,'Minigolf','Tre buche nell’attico: scegli mira e potenza, sfrutta sponde e rampe, evita il caffè. Trascina dalla pallina o usa frecce e SPAZIO.']
];
export const STAGE_BONUSES=entries.map(([id,stage,title,world,frame,atlas,x,genre,instructions])=>Object.freeze({id,stage,title,world,frame,atlas,x,genre,instructions,mode:id==='golf'?'minigolf':id,duration:0,goal:id==='golf'?3:1,reward:{hp:10,stress:10,euro:15}}));
export const BONUS_BY_ID=Object.fromEntries(STAGE_BONUSES.map(b=>[b.id,b]));
export const BONUSES_BY_STAGE=Object.fromEntries([...new Set(STAGE_BONUSES.map(b=>b.stage))].map(stage=>[stage,STAGE_BONUSES.filter(b=>b.stage===stage)]));
export const BONUS_BY_STAGE=Object.fromEntries(Object.entries(BONUSES_BY_STAGE).map(([stage,bonuses])=>[stage,bonuses[0]]));
export const EXISTING_BONUSES={};
