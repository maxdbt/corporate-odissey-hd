// Optional activities: no stage exit, quest item or story branch is replaced.
const entries = [
 ['2-1','tray','Il vassoio impossibile','balance','canteen','tray','furniture',35,25,'Bilancia con ← → o tieni premuti i due pulsanti. Mantieni il vassoio al centro mentre arrivano i piatti.'],
 ['3-1','call','Questa call poteva essere una mail','rhythm','meeting','microphone','furniture',35,8,'Premi PARLA solo quando il cursore entra nella fascia verde. Durante gli altri interventi resta in silenzio.'],
 ['4-1','address',"L’indirizzo giusto",'choices','travel','passport','objects',40,5,'Leggi il dossier e abbina la targa alla sede e al civico corretti. Tocca una scheda oppure usa 1, 2, 3.'],
 ['4-2','expenses','Nota spese express','choices','travel','folder','objects',40,8,'Smista le ricevute: viaggio, pasti o duplicato. Le copie non vanno rimborsate due volte.'],
 ['4-3','luggage','Quel bagaglio è mio!','choices','airport','bag','objects',35,7,'Il nastro porta tre bagagli. Confronta nome e numero con la tua etichetta, poi scegli la valigia giusta.'],
 ['4-4','rails','Binario fantasma','route','station','train','equipment',40,3,'Ruota gli scambi per allineare il percorso al binario indicato. Premi PARTENZA quando la linea è continua.'],
 ['4-5','coffee','Turbolenza creativa','balance','plane','coffee','objects',30,22,'Compensa le turbolenze con ← →. Il segnale anticipa la direzione della scossa: evita di rovesciare la tazzina.'],
 ['4-6','phones','Carrozza del silenzio','signals','train','phone','objects',35,9,'Trova il telefono che sta squillando, poi toccalo o premi il numero corrispondente prima che disturbi la carrozza.'],
 ['4-7','mirage','Fata Morgana S.r.l.','memory','desert','office','nature',40,3,'Osserva le caselle illuminate; quando scompaiono ripercorri la strada nell’ordine giusto. Le altre oasi sono miraggi.'],
 ['4-8','heater','Riunione sottozero','circuit','glacier','heater','equipment',40,3,'Ruota le sezioni del circuito finché tutti i collegamenti sono orizzontali, poi accendi il riscaldamento.'],
 ['4-9','valves','Connessione profonda','valves','sea','valve','equipment',40,3,'Regola le tre valvole sui valori indicati per portare ossigeno alla sala. Hai 18 mosse per ogni impianto.'],
 ['4-10','scope','Lo scope invisibile','choices','client','folder','objects',40,6,'Confronta accordo e nuova richiesta. Seleziona la voce aggiunta dal cliente, prima di firmare.'],
 ['5-2','gestures','Team building obbligatorio','memory','hr','trophy','objects',40,3,'Osserva la sequenza di gesti dei colleghi e ripetila nello stesso ordine. Ogni giro aggiunge un gesto.'],
 ['5-3','calendar','Agenda blindata','choices','secretary','calendar','equipment',40,6,'Leggi gli impegni già fissati e la durata richiesta. Prenota uno spazio libero senza sovrapposizioni.'],
 ['5-4','golf','Il golf del direttore','golf','director','golf','equipment',40,3,'Regola la forza: premi TIRA quando l’indicatore attraversa la fascia verde. Hai cinque palline per centrare tre cestini.'],
 ['5-5','flight','Fuori ufficio, finalmente','flight','roof','paperPlane','objects',35,7,'Guida l’aeroplanino con ↑ ↓ o i pulsanti verticali e attraversa gli anelli evitando i bordi.']
];
export const STAGE_BONUSES = entries.map(([stage,id,title,mode,world,frame,atlas,duration,goal,instructions]) =>
 Object.freeze({stage,id,title,mode,world,frame,atlas,duration,goal,instructions,reward:{hp:10,stress:10,euro:15}}));
export const BONUS_BY_STAGE = Object.fromEntries(STAGE_BONUSES.map(b=>[b.stage,b]));
export const BONUS_BY_ID = Object.fromEntries(STAGE_BONUSES.map(b=>[b.id,b]));
export const EXISTING_BONUSES = {'1-1':'last-mail','1-2':'beach','5-1':'revenue'};
