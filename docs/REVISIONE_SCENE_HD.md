# Scene di raccordo e ballo HD

Aggiornamento locale del **23 novembre 2026**, successivo al commit `c938316`. Corregge scene che conservavano fondali, interfacce o pose della versione originale anche con la grafica HD selezionata.

## Correzioni individuate

| Scena | Prima | Adesso |
| --- | --- | --- |
| Ascensore del mondo 5 | Cabina a rettangoli, protagonista pixel | Fondale illustrato in legno e ottone, porte metalliche scorrevoli, protagonista HD, indicatore piano e prossima fermata |
| Burnout / Game Over | Sfondo rosso uniforme e sprite pixel | Fondale dello stage appena giocato, pannello coerente con il menu, posa HD e pulsanti leggibili |
| Cibo tossico | Bagno disegnato a blocchi | Bagno illustrato esistente, porta occupata animata e conto alla rovescia |
| Allucinazione del cibo | Fasce piatte e icone che tornavano pixel nei contenitori | Luci morbide e sprite HD anche nei contenitori animati; corretto l'alias Teams |
| Briefing di missione | Foglio rétro | Dossier blu e ottone, obiettivo in evidenza e consigli su due colonne quando necessario |
| Quiz e risultati | Cornici CRT, scanline e bordi pesanti | Pannelli arrotondati, selezione chiara e testo con ritorno a capo |
| Ballo di Natale | Protagonisti piccoli, due pose e colleghi con movimento da corsa | Jack/Wendy grandi, 12 pose dedicate ciascuno, cinque colleghi distinti con 12 pose di danza ciascuno |
| Gag finali del ballo | Direttore troppo piccolo, piccoli oggetti pixel | Dimensioni del direttore corrette, note musicali, bicchiere e cotechino con bordi morbidi |
| Collega grigio e Cliente dall'Inferno | Pose ferme al termine del movimento; scala iniziale schiacciata usata come riferimento dal Cliente | Dodici nuovi gesti per il collega fermo; riferimento 1:1 per la scala; Cliente animato anche da fermo e durante lo sparo |

Gli sfondi già illustrati delle scene di viaggio, scelta destinazione, negoziazione e finale restano parte della presentazione condivisa. L'audit automatico controlla i riferimenti HD dei 19 stage; il collaudo visivo è mirato alle scene indicate sotto, non una partita completa della campagna. La modalità esplicita `?graphics=classic` conserva la grafica originale. La pausa a foglio di calcolo resta una gag intenzionale.

## Ballo del primo livello

La consegna riguarda la **gara con le frecce**, come confermato dall'utente. È disponibile come prova libera dal menu **Minigiochi → Gara di ballo di Natale**. “Fuga dalla festa aziendale”, con cappotto e chiavi, conserva i propri personaggi e regole.

- Jack e Wendy: altezza nominale **210 unità di gioco**, rispetto alle 92 precedenti.
- Cinque colleghi con silhouette e abiti diversi: capo reparto, stagista, contabile, sistemista e marketing.
- Coreografie dedicate: disco, spalle e battimani, twist, robot e salsa sul posto. Nessun ciclo di locomozione usato per i colleghi della festa.
- **84 fotogrammi disegnati** in totale: 12 × 7 personaggi. Ogni PNG è una griglia 3 × 4 con alpha, non dodici copie dello stesso disegno.
- Il tempo della danza deriva dal tempo del brano. Sei pose per battito, dodici pose per ciclo di due battiti, con piccoli sfasamenti fra i colleghi.
- Movimento secondario continuo di busto e ginocchia, appoggio dei piedi allineato dai metadati degli atlanti.
- Quattro corsie e gli stessi comandi: frecce/WASD o tocco sulle zone in basso. Pausa e schermo intero sono a sinistra delle corsie.
- Punteggi, finestre di precisione, durata di 25 secondi, premi e conseguenze restano quelli della prova originale.

## File e riuso

`DanceVisuals.js` descrive il cast e risolve i fotogrammi; `DancePresentation.js` crea i simboli nitidi delle corsie e i piccoli oggetti delle gag. `NarrativeVisuals.js` conserva il significato delle pose originali: cammino, salto, ferita, scivolata e riposo.

`ActorSkin.js` segue ora anche personaggi dentro contenitori, comprese visibilità, posizione, maschera e distruzione. Le dimensioni delle icone nei contenitori rimangono limitate al loro spazio; un attore con `hdHeight` esplicito usa invece la sua dimensione di scena. `StaticStagePresentation.js` permette sfondi e pacchetti specifici senza caricare interi mondi per una sola immagine.

Gli asset sono in:
- `public/assets/hd-interludes/elevator.webp`: 1672 × 941, circa 187 KiB.
- `public/assets/hd-dance/*-dance.png`: sette fogli da 1086 × 1448, circa 9.55 MiB complessivi.
- I JSON accanto ai PNG sono rigenerabili con `python scripts/pack_dance_art.py`; lo script non modifica i pixel.

Generazione con **ImageGen integrato**, nessuna API/CLI esterna. Prompt completi: [ascensore](concepts/PROMPT-ASCENSORE-HD.md), [Jack e Wendy](concepts/PROMPTS-BALLO-HD.md), [cinque colleghi](concepts/PROMPTS-COLLEGHI-BALLO-HD.md).

Il primo collega in grigio ha inoltre un nuovo atlante `public/assets/hd-worlds/talker-gestures.png`: dodici gesti di conversazione, con piedi allineati e dimensioni costanti. Passa al ciclo di cammino solo quando si sposta. [Prompt del collega](concepts/PROMPT-COLLEGA-GESTI-HD.md).

Nel Cliente dall'Inferno la scala iniziale verticale è 0,05 per l'emersione dalla scrivania. Il renderer animato perdeva il riferimento 1 già presente nel catalogo statico e usava 0,05 come denominatore: a scala 1 il personaggio diventava alto 700 unità anziché 35. Il riferimento ora è esplicito anche per gli atlanti animati; i dodici gesti da fermo e dodici fotogrammi d'attacco seguono il tempo della scena. Collisioni, proiettili e tempi degli attacchi restano invariati.

I pacchetti del ballo e dell'ascensore vengono caricati quando servono e rilasciati quando nessuna scena li usa. Sono esclusi dal precache iniziale della PWA. Ogni immagine resta sotto 5 MiB e 4096 px; i sette fogli del ballo decodificati occupano circa 42 MiB, oltre agli altri asset della scena.

## Verifiche

- **81 test automatici superati**, inclusi i 12 fotogrammi di ciascun ballerino, cinque atlanti distinti per i colleghi, appoggio dei piedi, scelta delle pose, temporizzazione a 30/60/120 aggiornamenti al secondo, scala del Cliente e passaggio cammino/gesti del collega grigio.
- Build Vite di produzione completata; 154 moduli, 46 risorse nel precache.
- Browser desktop 1280 × 720 e mobile orizzontale 844 × 390.
- Ascensore: apertura e chiusura, ridimensionamento senza porte residue ai bordi, arrivo al piano 45 e ingresso reale in Risorse Umane.
- Ballo: Jack/Wendy, animazioni di tutti i colleghi, tastiera e zone cliccabili equivalenti alle zone touch, pausa/ripresa allo stesso punto, fine del brano e rientro al menu nell'anteprima.
- Quiz del terminale: apertura durante il primo stage, scelta B, applicazione dell'esito e ritorno al gioco.
- Briefing del mare: tutti e sei i consigli visibili senza sovrapposizioni.
- Nemici del primo stage: collega grigio a 40 unità nominali e Cliente emerso a 35 durante l’attacco; verificati nel browser tramite immagine e diagnostica del canvas. Prove: `gray-colleague-hd.jpg` e `client-height-fixed.jpg`.
- Bagno del cibo, allucinazione, burnout e ripartenza: grafica HD verificata.
- Viaggio in aereo: passeggeri e pannello degli eventi verificati dopo la modifica ai contenitori.
- Nessun errore console nei caricamenti finali delle scene controllate. Durante la generazione degli asset il reload automatico aveva registrato richieste transitorie a file non ancora pronti; i file e gli atlanti sono presenti nella consegna.

Screenshot del gioco in `docs/screenshots/`: `dance-hd-desktop.jpg`, `dance-hd-mobile.jpg`, `elevator-hd-desktop.jpg`, `elevator-hd-mobile.jpg`, `briefing-hd-mobile.jpg`, `quiz-hd-mobile.jpg`, `food-toilet-hd-mobile.jpg`, `burnout-hd-mobile.jpg`.

Il viewport mobile è simulato: multitouch fisico, consumo energetico e prestazioni sostenute su telefono non sono misurati. Le altre chat stanno modificando taxi e pedalò: il collaudo di questa consegna usa una copia isolata della base `c938316` con queste sole modifiche.

## Integrazione nella cartella principale

Modifiche riportate in `E:\Repos\max\corporate-odyssey`, preservando le revisioni parallele di taxi, pedalò e L’ultima mail. Il menu contiene sia la nuova gara sia gli altri minigiochi. Dopo l’integrazione: **93 test superati**, build di produzione completata (165 moduli, 46 risorse nel precache). Verificato nel browser l’avvio reale da Minigiochi → Gara di ballo di Natale, senza errori console dopo il caricamento finale.

La versione integrata è raggiungibile su **http://127.0.0.1:8090/**; anteprima diretta della gara: **http://127.0.0.1:8090/?scene=dance**. Il server 8091 conserva la verifica isolata.

## Anteprime locali

Server di questa revisione: **http://127.0.0.1:8091/**, dalla cartella `corporate-odyssey-scene-audit-20261123`.

Le scorciatoie seguenti esistono solo in modalità sviluppo:
- `?scene=dance` oppure `?scene=dance&character=woman`.
- `?scene=dance&outcome=wine`: gag del vino, senza premi.
- `?scene=elevator&level=14`: cabina in attesa di Continua; aggiungere `autoplay=1` per il passaggio automatico.
- `?scene=food-toxic`, `?scene=food-trip`, `?scene=burnout&level=14`.
- `?level=12&skipIntro=1`: briefing del mare.

Nessuna pubblicazione Sites in questa revisione.
