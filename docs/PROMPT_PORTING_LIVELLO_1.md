# Prompt per il porting grafico del primo livello

Questo prompt è pronto da usare in una sessione di sviluppo con accesso al repository. Lo stile scelto è esclusivamente quello dell'immagine allegata dall'utente, conservata in `docs/concepts/riferimento-approvato.png`. Allegare anche questa immagine se si usa il prompt fuori dal repository.

---

Agisci come sviluppatore senior di giochi 2D per browser e responsabile della direzione artistica. Realizza il porting grafico giocabile del primo livello di **Corporate Odyssey**, usando il repository esistente e il riferimento visivo concordato.

## Obiettivo e riferimento vincolante

Lavora nel progetto `E:\Repos\max\corporate-odyssey`. Trasforma il livello **1-1 Natale in Ufficio** dalla grafica procedurale 8-bit alla grafica HD della tavola:

`E:\Repos\max\corporate-odyssey\docs\concepts\riferimento-approvato.png`

Apri e osserva realmente l'immagine prima di progettare gli asset. Questa tavola è il riferimento vincolante. Riproducine il linguaggio visivo: personaggi 2D illustrati, espressioni e proporzioni, materiali realistici dell'ufficio, legno e metallo, luci natalizie calde, riflessi controllati, finestre sulla città invernale blu, atmosfera accogliente e satirica, HUD scuro pulito e tipografia leggibile.

Le altre tavole presenti in `docs/concepts` sono alternative scartate per questa implementazione. Evita contaminazioni con fumetto a inchiostro, diorama stop-motion, noir, pixel art o uno stile 3D generico. Mantieni la prospettiva laterale da platform 2D; la profondità deriva dai piani scenici.

Consegna un vero livello giocabile nel browser, con asset, animazioni, collisioni, input e interfaccia funzionanti. La tavola completa serve da riferimento artistico: non deve diventare una singola immagine del gioco con personaggi o pulsanti incorporati.

## Studia il progetto prima di modificarlo

Leggi eventuali istruzioni del repository e almeno:

- `docs/ARCHITECTURE.md`, `docs/ANALYSIS.md`, `docs/ART_DIRECTION.md`;
- `package.json`, `vite.config.js`, `src/main.js`, `style.css`;
- `src/config/constants.js`, `src/utils/view.js`, `src/state/GameState.js`;
- `src/levels/level1_1.js`, `src/levels/helpers.js`, `src/systems/LevelBuilder.js`;
- `src/scenes/BootScene.js`, `src/scenes/GameScene.js`, `src/scenes/UIScene.js`;
- `src/entities/Player.js`, `src/entities/EnemyFactory.js`;
- `src/systems/Backgrounds.js`, `src/systems/InputController.js`, `src/systems/Screen.js`;
- `src/ui/HUD.js`, `src/ui/TouchControls.js`, `src/gfx`.

La baseline analizzata usa JavaScript ES modules, Phaser 3.90, Vite 6.4.4 e vite-plugin-pwa 2.0.0. Conserva questo stack e riusa l'architettura; verifica le versioni effettive del checkout prima di lavorare.

## Ambito e gameplay da conservare

Il porting riguarda il primo livello e i componenti condivisi necessari per renderlo bene su PC e telefono. Conserva le API e i comportamenti richiesti dagli altri livelli.

La fonte del level design è `src/levels/level1_1.js`: larghezza 5600 unità logiche, altezza 450, superficie del pavimento a y 386, partenza `[80, 386]`, uscita `[5500, 386]`, timer 300 secondi. Conserva distribuzione e funzione di terreno, buchi, piattaforme, scrivanie, scala, terminale, oggetti, nemici, pozze e porta della festa. La composizione artistica del concept non è una nuova mappa da copiare letteralmente.

Mantieni movimento, doppio salto, corsa, accovacciamento, scivolata, scale, danni, stress, inversione dei comandi in panico, bonus, checkpoint, tiro e cambio arma. Conserva il quiz, l'apertura di PartyScene, il burnout e il passaggio al livello successivo.

Gestisci entrambi i personaggi selezionabili: Jack e Wendy. Rinnova le loro texture per il primo livello nello stesso stile della tavola. Le dimensioni delle immagini HD non devono modificare involontariamente velocità, gravità, hitbox, distanze di salto o attivazione delle zone.

## Asset e costruzione della scena

### Componenti riutilizzabili e progressione narrativa

Considera la storia completa: open space natalizio e poi estivo, mensa, sala riunioni, trasferte e salita ai piani executive. Implementa ora soltanto il primo stage. Separa i comportamenti di gioco dalle skin grafiche e raggruppa gli asset per famiglia e tema, così personaggi, monete, arredi, armi e HUD potranno essere riusati senza duplicare la logica. Il tema estivo deve poter sostituire decorazioni e illuminazione; mensa, trasferta ed executive devono poter adottare altri ambienti mantenendo gli stessi contratti. Costruisci astrazioni piccole e già utilizzate dal primo livello, evitando un nuovo framework o il restyling anticipato degli altri stage.

Lavora soltanto nel repository locale. Non eseguire push, deploy o altre modifiche sul repository remoto.

Crea asset separati, coerenti con la tavola, realmente caricati dal gioco:

1. Fondale esterno con città invernale, finestre e neve; piano interno con pareti, luci, arredi e decorazioni; dettagli di profondità non interattivi.
2. Terreno modulare con bordo chiaramente calpestabile, scrivanie e piattaforme con superfici leggibili, scala, armadi, fotocopiatrice, piante, albero e porta della festa.
3. Sprite animati dei personaggi, con almeno idle, corsa/camminata, salto, caduta, accovacciamento, scivolata, scala, attacco e danno; includi gli stati visivi necessari alle meccaniche presenti.
4. Asset e animazioni dei nemici effettivamente presenti nel livello, comprese icone Teams, colleghi, fotocopiatrice, armadio, bug, cliente, conf call e «un minuto».
5. Euro, buoni pasto, caffè, laptop, ferie, aumento, promozione, proiettili e feedback delle cinque armi disponibili.
6. Pozze di spumante e relativi effetti, fogli e piccoli effetti di raccolta o impatto.
7. HUD, icone e comandi disegnati come elementi indipendenti.

Prepara un inventario degli asset con chiave, percorso, dimensioni, scala logica e uso. Usa nomi stabili e texture ad alta definizione; preferisci atlanti e moduli riutilizzabili. Per i ritagli serve trasparenza reale. Mantieni separati elementi decorativi e collider: la sagoma visiva e l'area fisica devono essere coerenti.

Usa il generatore di immagini disponibile per gli asset raster che lo richiedono, rispettando il riferimento. Verifica i risultati e la coerenza tra personaggi e ambienti. Non presentare una schermata completa generata come se fosse un livello implementato. Evita sostituti geometrici spartani nelle parti principali consegnate.

Applica il nuovo pacchetto grafico al primo livello mediante chiavi o temi dedicati. Conserva la compatibilità degli altri livelli e dei minigiochi quando condividono texture o interfacce. I minigiochi completi e i mondi successivi non richiedono un restyling integrale in questa iterazione.

## Resa visiva e leggibilità

Riprendi la qualità del riferimento: superfici credibili, luci morbide già disegnate, lampade ambrate, contrasti blu fuori dalle finestre, monete dorate, personaggi nitidi e leggibili. Limita dettagli e contrasti nei piani lontani per dare risalto al gioco.

Le superfici utilizzabili e i pericoli devono essere immediatamente riconoscibili. Gli arredi decorativi non devono apparire come ostacoli attraversabili per errore. Non basare l'identificazione di un pericolo solo sul colore.

Usa parallax leggero e ombre dipinte, senza una scena 3D in tempo reale. Piccoli effetti di neve, carta e raccolta devono avere un numero massimo di particelle e non coprire personaggi o salti.

Rimuovi per il percorso HD il filtraggio da pixel art: controlla sia la configurazione Phaser sia le regole CSS del canvas. Mantieni nitidi sprite e testo senza upscaling sfocato. Gli altri livelli devono continuare a essere visualizzati correttamente.

## PC e schermo intero

Su PC con mouse e tastiera:

- nascondi joystick e pulsanti SALTA, SCIVOLA e ATTACCA, comprese le rispettive aree di input;
- lascia il campo di gioco libero, senza una fascia vuota riservata ai pulsanti mobili;
- mantieni HUD, pausa, audio e accesso allo schermo intero;
- conserva frecce/WASD per muoversi, Spazio/Z per saltare, X per correre, Giù+X per scivolare, C/Q per attaccare, V/E per cambiare arma, I per briefing, P per pausa e M per audio;
- aggiungi o rendi coerente un comando fullscreen cliccabile e il tasto F durante il gioco.

Distingui il canvas che occupa la finestra dal fullscreen del browser. Fai usare tutta l'area disponibile al canvas, senza deformare il gioco o tagliare HUD e piattaforme. L'ingresso nel vero fullscreen deve usare l'API del browser a partire dal clic o tasto dell'utente; non dichiararlo attivo se la richiesta viene rifiutata. Gestisci l'uscita con Esc e gli eventi fullscreenchange senza aprire contemporaneamente il menu di uscita. Se l'API non è disponibile, il gioco deve restare utilizzabile nella finestra.

Gestisci resize, passaggio finestra/fullscreen, DPR e formati 16:9, 16:10 e ultrawide. Mostra più o meno mondo in modo controllato, con limiti di camera coerenti. Non deformare gli asset e non assegnare un vantaggio incontrollato al campo visivo dei monitor larghi.

## Mobile e dispositivi ibridi

Su smartphone e tablet con input touch:

- usa l'orientamento orizzontale e un messaggio di rotazione quando serve;
- mostra joystick a sinistra e tre azioni a destra nello stile del riferimento;
- supporta movimento, salto e tiro contemporanei con multitouch;
- mantieni la semantica di SCIVOLA: pressione per scivolare, mantenimento per correre;
- consenti il cambio arma dall'icona e l'accesso a briefing e pausa;
- usa aree di tocco di almeno circa 44-48 pixel CSS, con spaziatura verificata sul display;
- rispetta notch, safe area e barre del browser, usando le dimensioni effettive del contenitore e la viewport dinamica;
- evita sovrapposizioni tra comandi, HUD, personaggio e principali pericoli.

Definisci una sola politica per scegliere l'interfaccia di input. Nella baseline UIScene usa `device.input.touch`, mentre zoom e layout usano `pointer: coarse`: questa incoerenza può mostrare pulsanti su un PC. Non usare la sola presenza di capacità touch per classificare il dispositivo.

Combina le caratteristiche del puntatore principale con il tipo di input usato; se utile, offri una scelta automatica/tastiera/touch nelle impostazioni. Su un portatile touch con mouse o tastiera i pulsanti devono poter sparire. Evita oscillazioni continue dell'interfaccia e azzera correttamente input mantenuti quando cambia modalità o si apre un overlay.

Fullscreen e blocco dell'orientamento sono facoltativi e dipendono dal supporto del browser: gestisci i rifiuti senza errori. Verifica Safari/iOS e Chrome/Android sui dispositivi effettivamente disponibili, dichiarando separatamente le prove reali e quelle simulate.

## Risoluzione e prestazioni

Obiettivo: resa HD fluida su uno smartphone recente e su un PC moderno, con target di 60 fps da misurare. Non promettere 60 fps su un telefono non provato.

Mantieni la simulazione nelle coordinate logiche esistenti e separala dalla risoluzione dei texture e del canvas. Progetta il rendering in base a dimensioni reali del display, DPR e budget grafico; non renderizzare automaticamente alla massima risoluzione fisica di ogni telefono. Usa un limite configurabile e una qualità ridotta per gli effetti opzionali.

Evita un unico fondale gigantesco lungo quanto tutto il livello. Suddividi e riutilizza segmenti, carica gli asset necessari e non aggiornare ogni frame ciò che è statico. Preferisci atlanti entro dimensioni sostenibili, pochi livelli di trasparenza e illuminazione dipinta. Considera la memoria decompressa delle texture, non solo i kilobyte dei file.

Prima riduci particelle, sovrapposizioni e risoluzione del rendering; preserva leggibilità, input e collisioni. Documenta dimensioni scaricate, tempo di caricamento, risoluzione effettiva e misure frame-time sul dispositivo provato. Ripeti la prova dopo alcuni minuti di gioco, non soltanto nella schermata iniziale.

## Integrazione e qualità del codice

Riusa GameState, gli eventi e i metodi pubblici esistenti. Modifica in modo mirato BootScene, il tema xmas, le entità, LevelBuilder, HUD, controlli e gestione della viewport secondo necessità. Mantieni l'interfaccia fuori dagli effetti della camera di gioco.

Durante pause, perdita di focus, resize e cambi di modalità azzera input e puntatori attivi. Pulisci listener, tween e risorse temporanee allo shutdown. Evita modifiche globali che alterino gli altri livelli per ottenere il solo risultato del primo.

Se introduci WebP, atlanti JSON o altri formati, aggiorna il caricamento e la configurazione PWA per includere le risorse necessarie al primo livello offline. Considera il limite per file del precache e il peso totale; non aumentare i limiti senza un piano. Conserva il consenso all'aggiornamento della PWA, che evita ricaricamenti durante una partita.

Non aggiungere backend o librerie pesanti per il restyling. Conserva i file di lavoro dell'utente. Procedi fino a una versione concreta, avviata e verificabile nel browser.

## Criteri di accettazione

Il lavoro è completo quando:

1. Dal menu si entra nel livello 1-1 e si può giocare fino all'uscita con la grafica concordata.
2. Fondali, personaggi, oggetti, HUD e animazioni sono separati e coerenti con il riferimento; nessuna schermata statica finge la partita.
3. Il level design e tutte le interazioni elencate sopra funzionano, comprese porta della festa, quiz, checkpoint e ripartenza.
4. Su PC sono assenti i controlli touch e l'area di gioco sfrutta finestra e fullscreen senza deformazioni.
5. Su mobile orizzontale funzionano multitouch, safe area, leggibilità e cambio di orientamento.
6. Il resize non perde la partita, non lascia input bloccati e non sposta la geometria rispetto ai collider.
7. `npm run build` riesce e le risorse HD vengono incluse correttamente nella build e nel percorso offline previsto.
8. Non compaiono nuovi errori nella console durante avvio, partita, overlay, restart e uscita.
9. Le misure di prestazione distinguono dispositivo reale, viewport simulata e aspetti ancora da provare.

Verifica almeno desktop 1366×768 e 1920×1080, un monitor largo e viewport mobili orizzontali come 844×390 e 932×430 CSS pixel. Queste viewport non sostituiscono una prova su hardware fisico.

Consegna codice e asset nel repository, aggiorna la documentazione con i comandi di avvio e allega schermate reali della versione PC senza controlli touch e della versione mobile. Riporta cosa funziona, le verifiche eseguite e gli eventuali limiti residui.
