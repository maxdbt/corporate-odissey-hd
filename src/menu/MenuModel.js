export const CHARACTER_NAMES={man:'Jack',woman:'Wendy'};
export const MENU_ACTIONS=[
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

export function menuWorlds(levels,showBranches=false){
 const worlds=[];
 levels.forEach((level,index)=>{
  if(!showBranches&&((level.trip&&level.id!=='4-1')||(level.climb&&level.id!=='5-1')))return;
  let group=worlds.find(w=>w.name===level.world);
  if(!group){group={name:level.world,id:level.id.split('-')[0],levels:[]};worlds.push(group);}
  group.levels.push({...level,index});
 });
 return worlds;
}
export function chooseMenuLevel(worlds,index){
 return worlds.flatMap(w=>w.levels).find(l=>l.index===index)||worlds[0]?.levels[0]||null;
}
export function bonusDestination(bonus,hasScene){
 if(bonus.id==='golf'&&hasScene('DirectorMinigolfScene'))return 'DirectorMinigolfScene';
 if(bonus.id==='taxi'&&hasScene('CityTaxiScene'))return 'CityTaxiScene';
 return 'StageBonusScene';
}
