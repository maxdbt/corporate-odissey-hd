# Prompt per il porting HD dei livelli successivi

Prompt operativo preparato il 22 novembre 2026 sulla base del checkout locale. Riguarda i 18 stage successivi a 1-1 e le scene collegate, seguendo le diramazioni effettive del gioco. Questo documento conserva la specifica operativa. Il completamento locale successivo è documentato in PORTING_CAMPAGNA_HD.md; per regole e stato effettivi leggere quel documento e BONUS_PER_LIVELLO.md.

Il repository HD di destinazione è `https://github.com/maxdbt/corporate-odissey-hd` (con questa esatta grafia). La cartella locale mantiene il nome `E:\Repos\max\corporate-odyssey`. Se usi il prompt fuori dal repository, allega anche [il riferimento approvato](concepts/riferimento-approvato.png).

---

Agisci come sviluppatore senior di giochi 2D per browser e responsabile della direzione artistica. Estendi il porting grafico HD di **Corporate Odyssey** ai livelli successivi al primo, fino al finale. Realizza il gioco funzionante nel repository esistente, procedendo per ambienti completi e verificati.

**Stato aggiornato al 22 novembre 2026:** dopo la richiesta «concludi tutti i livelli», il porting locale copre i 19 stage e i relativi bonus. Le tavole dei nuovi ambienti sono state mostrate prima del codice. Conserva il lavoro realizzato; usa questa specifica per la manutenzione, confrontandola con PORTING_CAMPAGNA_HD.md e con le regole effettive di BONUS_PER_LIVELLO.md. Aggiornamento della consegna: l’utente ha successivamente autorizzato commit e push su `max-hd/main`; nessun deploy richiesto.

## 1. Risultato richiesto e riferimento vincolante

Lavora in `E:\Repos\max\corporate-odyssey`. Il livello **1-1 Natale in Ufficio** ha già una presentazione HD riutilizzabile: mantienilo funzionante e usa il suo lavoro come base tecnica.

Apri e osserva realmente questi file prima di progettare gli asset:

- `docs/concepts/riferimento-approvato.png`: riferimento artistico vincolante;
- `docs/screenshots/livello-1-concept-pc.jpg` e `docs/screenshots/livello-1-concept-mobile.jpg`: stato implementato con cui confrontare proporzioni e interfaccia;
- `docs/ART_DIRECTION.md` e `docs/PORTING_HD.md`: scelte già concordate e limiti delle verifiche svolte.

La qualità desiderata è quella **piena e dettagliata del concept**: platform laterale 2D, personaggi illustrati espressivi, ambienti con materiali realistici, illuminazione curata e profondità ottenuta attraverso piani separati. Le schermate attuali documentano l'implementazione; non sostituiscono il concept come obiettivo di qualità.

Conserva identità, volto, abiti e proporzioni di Jack e Wendy. Ogni nuovo ambiente deve appartenere allo stesso gioco: cambia stagione, materiali e luce secondo la storia, mantenendo il medesimo linguaggio grafico. Gli addobbi natalizi appartengono allo stage natalizio, non a tutto il gioco.

Evita pixel art ingrandita, figure schematiche, fondali vuoti, semplici rettangoli come risultato definitivo, personaggi minuscoli e combinazioni incoerenti di stili. Le altre quattro proposte grafiche in `docs/concepts` non sono riferimenti per questo incarico.

Il concept non va usato come una schermata incollata dietro al gioco. Fondali, piattaforme, oggetti, personaggi, effetti e interfaccia devono essere elementi indipendenti. Testi e valori dell'HUD devono essere renderizzati e collegati allo stato reale.

## 2. Ricognizione del progetto

Leggi le istruzioni locali e verifica lo stato Git, preservando eventuali modifiche dell'utente. Studia almeno:

- `docs/ARCHITECTURE.md`, `docs/ANALYSIS.md`, `docs/DEVELOPMENT.md`;
- `package.json`, `vite.config.js`, `src/main.js`, `style.css`;
- `src/config/constants.js`, `src/levels/index.js`, tutti i file pertinenti in `src/levels`;
- `src/data/briefs.js`, `src/data/trip.js`, `src/data/clients.js`, `src/state/GameState.js`;
- `src/scenes/GameScene.js`, `BootScene.js`, `UIScene.js` e le scene specifiche di ciascun blocco;
- `src/systems/LevelBuilder.js`, `Zones.js`, `Backgrounds.js`, `Trip.js`, `TripLevel.js`, `Canteen.js`, `InputController.js`, `InputMode.js`;
- `src/entities`, compresi nemici, boss, proiettili e veicoli dove implementati;
- `src/presentation`, `src/ui/TripUI.js` e i generatori originali in `src/gfx`;
- `tests/hd-assets.test.js`, `tests/last-mail.test.js`, `scripts/build-hd-atlases.py`.

Mantieni JavaScript, Phaser, Vite e la PWA esistenti; verifica le versioni effettive prima di intervenire. Non ricreare il progetto con un altro motore.

Produci una breve matrice iniziale: stage/scena, meccaniche da conservare, tema visivo, asset comuni, asset nuovi, verifiche necessarie. Ricava la sequenza da `LEVEL_META`, `LEVELS` e `Trip.js`, non dall'ordine alfabetico dei file.

## 3. Ambienti da convertire

Le indicazioni artistiche seguenti sono la direzione proposta per i nuovi ambienti. Obiettivi, tempi, collisioni, eventi e diramazioni rimangono quelli del codice corrente.

| Stage | Direzione grafica | Elementi di gioco da rendere chiaramente |
| --- | --- | --- |
| **1-2 — Estate d'Inferno** | Lo stesso universo dell'open space: sole intenso, città estiva, tende, ventilatori, condizionatori, piante e scrivanie arredate. Zone calde ambra e zone fredde azzurre, senza addobbi natalizi. | Caldo, gelo, acqua, biglietto aereo, nemici d'ufficio, terminale e uscita. Mantieni la leggibilità delle zone anche senza affidarti solo al colore. |
| **2-1 — La Pausa Pranzo** | Mensa credibile con acciaio, vetri, piastrelle, vassoi, pietanze, carrelli e luci da servizio. Ambiente ricco ma percorsi leggibili. | Cuochi e piatti lanciati; primo, secondo, contorno e dolce; cibo caldo/avariato; buoni pasto, capo, scrocconi, pavimento bagnato, spezzatino misterioso e cassa. |
| **3-1 — Il Limbo dei Post-it** | Sala riunioni con tavolo, vetrate, monitor, lavagne e una crescente atmosfera surreale. Post-it illustrati con carta, pieghe e ombre leggibili. | Piattaforme temporanee, segnale di imminente scomparsa, notifiche, pioggia di e-mail e boss Cliente dall'Inferno. Conserva checkpoint e configurazione dell'arena. |
| **4-1 / 4-2 — Il Cliente Lontano / Il Mezzo** | Scelte presentate con cartoline illustrate, dossier di trasferta, valigia e biglietti coerenti con l'HUD HD. | Scelta sede, preparazione della valigia tramite PackingScene, inventario, costi e selezione aereo/treno. La sede estrema deve restare una sorpresa: mostra inizialmente lo stesso edificio con piccoli indizi, come nel gioco attuale. |
| **4-3 / 4-4 — L'Aeroporto / La Stazione** | Due ambienti distinti ma della stessa famiglia: terminal vetrato, gate e duty free; stazione con pensiline, banchine e treni. Tabelloni leggibili e profondità scenica. | Scioperi, ritardi e bonus, controllo documenti, cane, merce a pagamento, borseggiatori, volontari e corretta uscita verso volo o treno. |
| **4-5 / 4-6 — Il Volo / Il Treno** | Cabina e carrozza illustrate, sedili, bagagli, finestrini con paesaggio in movimento. Composizione adatta alle scene di viaggio. | Eventi, dialoghi, scelte e risorse previsti da JourneyScene. Mantieni la funzione della scena senza trasformarla arbitrariamente in un nuovo platform. |
| **4-7 — Il Deserto** | Dune stratificate, rocce, strada, chiosco, noleggio e sede del cliente. Luce calda, polvere moderata e miraggio leggero. | Vento e sole; dromedario, moto, taxi; datteri, costi, cibo e arrivo. Il veicolo e il cavaliere devono restare visivamente agganciati durante movimento e salto. |
| **4-8 — Il Ghiacciaio** | Neve, ghiaccio stratificato, crepacci, rifugio e sede aziendale fuori luogo. Blu freddi con luci calde nei punti di sosta. | Bufera, superfici scivolose, freddo, piumino, slitta con husky, motoslitta, sci, carburante e ostacoli. Neve e foschia non devono nascondere i bordi. |
| **4-9 — Il Mare** | Fondale marino illustrato e credibile, rocce, alghe, luce filtrata, bolle e ufficio subacqueo satirico. Profondità per piani, non sfocatura sull'azione. | Nuoto, correnti, costume, sottomarino, pinne, cavalluccio, batteria, meduse, squali-consulente, mine e sushi bar. Mantieni riconoscibili sagome, proiettili e punti d'interazione. |
| **4-10 — Il Cliente** | Ufficio del cliente coerente con la destinazione raggiunta, ritratto espressivo e interfaccia di negoziazione HD. | Tutte le fasi effettive di NegotiationScene: domande, requisiti della valigia, richieste, consulenti, combattimento, risultato e conversione del budget. Non ridurla a una schermata di dialogo. |
| **5-1 / 5-2 / 5-3 — Finance / Risorse Umane / La Segreteria** | Lusso crescente: marmo, legni scuri, metallo, vetro, moquette, skyline e manifesti aziendali satirici. Variazioni riconoscibili dei tre piani su una base comune. | Consulenti con slide, Yes-Man, crolli in borsa, ascensori, accesso alla Caccia ai ricavi, badge VIP, segretaria e vetro blindato. |
| **5-4 — L'Attico** | Ufficio monumentale del Mega-Direttore, trono, grandi vetrate e skyline. Arena sgombra nella fascia di combattimento. | Boss sul trono e a piedi, segnali prima degli attacchi, cariche, salti, onde d'urto e fuga secondo la logica esistente. |
| **5-5 — Il Tetto** | Tetto al tramonto, città su più piani, impianti, piazzola ed elicottero. Illuminazione finale spettacolare ma sostenibile. | Scontro finale, vento delle pale, sacchi di buonuscita, azioni e paracadute d'oro, mantenendo gli eventi realmente implementati. |

Il Mondo 4 è ramificato: **sede → valigia → mezzo → aeroporto oppure stazione → volo oppure treno → una delle tre destinazioni → cliente → Mondo 5**. Non convertire queste alternative in una sequenza obbligatoria di tutti gli stage.

Includi nel lavoro le scene di supporto raggiunte dal percorso: `PackingScene`, `RentalScene`, `FoodScene`, `ToiletScene`, `BeachScene`, `ElevatorScene`, `RevenueScene`, oltre a briefing, quiz, pausa, game over e finale. Riusa componenti grafici comuni senza modificarne le regole. Conserva il bonus L'ultima mail e la festa già funzionanti; raccorda la loro presentazione solo dove necessario per eliminare stacchi incoerenti.

## 4. Architettura: estendere ciò che esiste

Oggi `createPresentation` in `OfficePresentation.js` seleziona soltanto `office-hd`; `AssetRegistry.js` e BootScene caricano il pacchetto dell'ufficio. Non presumere che esista già un sistema completo per tutti i temi.

Estendi queste parti con un registro di temi e manifest degli asset, in modo incrementale e usato da subito. I nomi `office-summer-hd`, `canteen-hd`, `meeting-hd`, `airport-hd`, `station-hd`, `desert-hd`, `glacier-hd`, `sea-hd`, `executive-hd` e `roof-hd` sono possibili identificatori nuovi, non API esistenti da dare per scontate.

- Condividi Jack, Wendy, animazioni, oggetti comuni, icone, HUD, input e gestione del viewport. Carica una sola copia delle risorse comuni.
- Separa ambiente, arredi, palette, illuminazione e personaggi specifici per tema. Finanza, HR, segreteria e attico devono riusare una famiglia di asset executive, con varianti locali.
- Mantieni dati di mappa e collisioni nei livelli. Posizioni degli arredi non interattivi e varianti artistiche possono stare in metadati dedicati, come `level.art`.
- Conserva `ActorSkin` come separazione fra entità fisica e rappresentazione. Estendilo dove serve per boss, veicoli, proiettili e oggetti dinamici, senza duplicare AI o Player.
- Completa i punti di integrazione mancanti in LevelBuilder: post-it, tavoli, banconi, panchine, porte e altri oggetti devono mantenere il loro body originale. I callback di scomparsa e distruzione devono aggiornare anche la skin HD.
- Le scene che non usano GameScene richiedono un'integrazione esplicita. Non basta assegnare loro `visualTheme` per considerarle convertite.
- Usa piccoli componenti comuni per pannelli, scelte, inventario, ritratti e risultati. Mantieni la presentazione dentro Phaser dove già previsto dal progetto, senza introdurre un secondo motore o un framework UI soltanto per il restyling.
- Libera listener, tween, particelle e risorse specifiche quando una scena termina. Non scaricare texture ancora utilizzate da una scena sovrapposta o dal tema successivo.
- Conserva `?graphics=classic` per il confronto e un fallback sicuro se manca un asset. Il fallback evita blocchi ma non rende completo un livello HD con elementi rimasti provvisori.

## 5. Asset, densità e animazioni

Per ciascun ambiente realizza fondale lontano, architettura intermedia, arredi, superfici giocabili e un primo piano controllato. Preferisci elementi modulari, varianti e raccordi senza giunture visibili. La ricchezza deve derivare da composizione e materiali; non riempire il percorso di decorazioni che coprono i pericoli.

Genera gli asset raster con lo strumento immagini disponibile e il riferimento approvato. Se richiesto dagli strumenti, segui la relativa skill. Richiedi sprite separati con trasparenza reale, viste laterali coerenti e illuminazione compatibile. Conserva prompt, sorgenti e manifest. Non fingere che una tavola statica sia una cattura del gioco.

Gli sprite attuali hanno 20 frame per protagonista, con 8 frame di corsa. Riutilizzali come base; migliora la fluidità con pose realmente diverse e coerenti. Punta a un ciclo di corsa da 12–16 frame se la qualità e il budget lo consentono; aggiungi transizioni leggibili per salto, caduta, atterraggio, attacco, danno, scivolata, scale e nuoto, in base agli stati effettivi. Non aumentare il conteggio duplicando immagini uguali e non degradare le animazioni esistenti.

Mantieni dimensioni del personaggio, punto d'appoggio dei piedi e centro del corpo stabili fra frame. Evita cambi di volto, tremolio del ritaglio, arti che cambiano forma, slittamento dei piedi e armi che si staccano dalle mani. Sincronizza gli effetti con gli eventi reali, senza alterare i tempi degli attacchi o il movimento fisico.

Nemici e boss devono avere preparazione, azione e recupero leggibili. Oggetti e zone pericolose devono essere riconoscibili anche su schermi piccoli e senza dipendere soltanto dal colore.

Non applicare indiscriminatamente lo zoom del primo stage a tutti gli ambienti. Mantieni personaggi grandi e leggibili, ma adatta camera e inquadratura a salti, nuoto, veicoli, autoscroll e boss. Evita tagli del boss, piattaforme d'atterraggio fuori campo e decorazioni che sembrano calpestabili pur non essendolo.

## 6. PC, mobile e prestazioni

- Browser PC: canvas che usa lo spazio disponibile, controlli touch nascosti senza lasciare una fascia vuota, tastiera, mouse e fullscreen su gesto dell'utente. Mantieni il comportamento già previsto di F ed Esc.
- Telefono: priorità al landscape, joystick e pulsanti accessibili con entrambe le mani, multitouch, safe area e notch. Mantieni visibili personaggio, ostacoli e obiettivi; adatta l'inquadratura allo spazio effettivamente utilizzabile.
- Gestisci resize, rotazione, ingresso/uscita dal fullscreen e cambio tastiera/tocco senza perdere lo stato né lasciare comandi premuti. In verticale mostra un invito chiaro a ruotare, conservando la partita.
- HUD e pannelli condividono il linguaggio del concept. Mostra i dati specifici quando servono: pasto raccolto, valigia, budget, carburante/batteria, badge e salute del boss. Nessun numero fittizio.
- Mantieni la separazione fra coordinate logiche, dimensione del canvas, zoom e densità. Parti dai limiti DPR già presenti, adattandoli soltanto sulla base di misure.
- Obiettivo: 60 fps stabili su PC e telefoni recenti. Misura frame time e rallentamenti nelle situazioni più dense; non presentare una prova su viewport mobile simulato come benchmark di un telefono fisico.
- Usa luce e ombre dipinte, parallax leggero, particelle con limiti e oggetti riutilizzati. Evita sfocature in tempo reale su tutta la scena o illuminazione dinamica costosa senza un beneficio dimostrato.
- Preferisci atlanti entro 2048×2048; ricorri a 4096 soltanto se necessario e verificato. Valuta separatamente peso del download e memoria delle texture decodificate, comprese copie, mipmap e risorse condivise.
- Definisci e documenta budget per caricamento iniziale, singolo ambiente, memoria texture e particelle. Carica i pacchetti necessari prima di entrare nelle scene, con avanzamento ed errore recuperabile; evita di decodificare tutti i mondi all'avvio.
- Adegua la PWA: il precache attuale raccoglie tutti gli asset compatibili. La crescita dei mondi non deve trasformarsi in un download iniziale indiscriminato. Documenta cosa è disponibile offline, come si scaricano i pacchetti successivi e come si gestisce una scena non ancora in cache.
- Conserva il limite corrente di 5 MiB per file del precache, oppure motiva e verifica una diversa strategia. Mantieni gli URL relativi e `import.meta.env.BASE_URL` per funzionare anche in sottocartelle.
- Il gioco finito deve funzionare senza chiamate a servizi di generazione, chiavi API o collegamenti esterni necessari al rendering.

## 7. Gameplay e narrativa da preservare

Conserva coordinate di terreno e piattaforme, hitbox, velocità, gravità, distanze di salto, timer, checkpoint, inventario, budget, costi, danni, stress, panico, armi, ricompense, dialoghi e transizioni esistenti. La nuova dimensione visiva non deve cambiare la fisica. L'aggiunta dei bonus opzionali è un'estensione espressamente richiesta: separala dal restyling, definisci accessi e nuovi premi nel design e mantieni il percorso principale giocabile senza completarli.

Mantieni il tono satirico e l'evoluzione da impiegato nell'open space alla scalata dei vertici aziendali. Non inventare nuove missioni o cambiare il finale per adattarlo agli asset. Per eventuali bug preesistenti che impediscono il collaudo, fai correzioni circoscritte, documentate e distinguibili dal restyling.

## 8. Ordine di lavoro e verifica

Procedi senza fermarti ai soli concept o a un piano:

1. **Estate d'Inferno**: mostra prima il concept del tema estivo e del bonus Ferie, ma non troppo. Per il bonus riusa BeachScene, già attivata dal biglietto aereo: 25 secondi per schivare mail e recuperare salute mentale. Procedi quindi al nuovo tema con riuso dell'ufficio, personaggi, HUD, caricamento e controlli. Usalo per verificare l'estensione dell'architettura e il passaggio 1-1 → 1-2.
2. **Mensa e riunioni**: integra oggetti specifici, interfaccia del pasto, piattaforme temporanee e primo boss.
3. **Trasferta completa**: tratta scene di scelta, valigia, entrambi i trasporti, tutte e tre le destinazioni, interazioni e cliente come un unico percorso ramificato da verificare.
4. **Piani executive e finale**: realizza i tre piani, l'attico, il tetto e le scene di collegamento.
5. **Raccordo finale**: elimina gli stacchi visivi delle scene comuni, verifica i ritorni al menu e il primo stage, rifinisci prestazioni e documentazione.

Concludi e verifica ogni blocco prima di proseguire al successivo. Non generare tutti i fondali lasciando incompleti personaggi, collisioni visive e interazioni. Usa brevi confronti con il riferimento durante lo sviluppo; procedi autonomamente sulle scelte esecutive coerenti con queste specifiche.

Per ogni blocco:

- esegui i test pertinenti e la build di produzione; nella baseline sono disponibili `node --test tests/hd-assets.test.js tests/last-mail.test.js` e `npm run build`;
- aggiungi verifiche utili per manifest e frame mancanti, selezione dei temi, ciclo di caricamento/distruzione e altri contratti effettivamente modificati;
- prova Jack e Wendy in movimento, salto, attacco e negli stati peculiari dell'ambiente; prova pausa, ripresa, morte, checkpoint, uscita e rientro;
- controlla ogni diramazione della trasferta e le transizioni fra scene statiche e platform;
- verifica desktop 1366×768 e 1920×1080, telefono landscape circa 932×430, un display più stretto, fullscreen, resize e safe area; aggiungi dispositivi fisici quando disponibili;
- raccogli screenshot reali all'ingresso, durante l'azione e nel punto più denso del blocco, con varianti desktop/mobile; controlla console e caricamenti falliti;
- misura le prestazioni in una sessione continuativa, annotando browser, dispositivo, risoluzione, qualità ed eventuali limiti.

Un livello è completato quando la presentazione è coerente e ricca come il riferimento, tutti gli elementi visibili necessari hanno asset definitivi, le interazioni restano funzionanti, non ci sono errori introdotti e il percorso si può proseguire. Valuta la resa guardando il gioco in movimento, non soltanto contando i file prodotti.

## 9. Consegna e Git

Sviluppa e verifica in locale. Per questa consegna l’utente ha autorizzato commit e push su `max-hd/main` dopo i controlli; non eseguire deploy. Conserva i remote esistenti: `max-hd` identifica il repository HD, mentre `origin` può ancora indicare il progetto originale. Non dedurre la destinazione dal solo nome della cartella e non aggiornare il repository originale per errore.

Consegna codice e asset integrati, prompt delle immagini, manifest aggiornati, schermate verificabili e documentazione in `docs`. Aggiorna `PORTING_HD.md` con i temi implementati, i punti di riuso e la strategia di caricamento/PWA. Aggiungi un riepilogo dei blocchi completati, verifiche eseguite, prestazioni misurate e prove hardware ancora mancanti. Non dichiarare completati ambienti che esistono soltanto come concept.
