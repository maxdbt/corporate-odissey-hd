# Menu cinematografico integrato

23 novembre 2026. Evoluzione delle [tre proposte](menu-20261123/PROPOSTE.md): ufficio cinematografico come apertura, palazzo della carriera nella selezione dei capitoli. Il menu è collegato alle scene reali del gioco.

## Giocare

Avviare `npm run dev` e aprire il server indicato da Vite. La build si prepara con `npm run build`. Durante la consegna è stata predisposta anche una copia locale della build su <http://127.0.0.1:8085/>; il server deve restare attivo. Un push GitHub non aggiorna automaticamente il sito ChatGPT Sites.

**Gioca → Jack o Wendy → riepilogo → Inizia il turno** avvia davvero la campagna. La scelta della scheda non avvia una partita. **Capitoli** conserva i sei ingressi del menu precedente: Natale, Estate, Mensa, Riunione, Trasferta ed Executive. Le diramazioni del viaggio e la scalata continuano nelle scene esistenti, senza saltare la preparazione prevista.

**Minigiochi** legge il catalogo disponibile e presenta regole, comandi e avvio in prova libera. Golf e taxi usano le rispettive scene dedicate quando registrate; gli altri bonus passano per `StageBonusScene`. Sono mantenuti gli accessi ai bonus classici nelle versioni del gioco che li registrano. Le ricompense restano governate dalle scene di gioco, non dal menu.

**Filmati** mostra soltanto le introduzioni presenti nel manifest per il personaggio scelto e le riproduce mediante `WorldIntroScene`. La scena Menu viene sospesa, l'interfaccia nascosta e le animazioni ferme; alla chiusura torna la stessa galleria. Se la versione del repository non include ancora le introduzioni, la schermata ne segnala l'assenza, senza importare moduli mancanti.

## Comandi e personaggi

- Sprite reali di Jack e Wendy, con ciclo locomotion a 16 fotogrammi e nuoto a 12 fotogrammi con attrezzatura da sub.
- Comandi divisi fra Movimento, Azioni e Interfaccia, con schede PC e Touch.
- Lista a sinistra e anteprima a destra su desktop/orizzontale; disposizione in colonna su telefono verticale.
- Il personaggio scelto resta coerente fra selezione, guida, riepilogo e avvio.
- Canvas della guida focalizzabile: frecce/WASD, X, Spazio/Z, C/Q, V/E cambiano l'esempio. Due pressioni ravvicinate di salto mostrano il doppio salto. È una dimostrazione isolata: non modifica la fisica o lo stato della campagna.
- Gli altri gesti usano le pose disponibili con traiettorie dimostrative; non vengono dichiarati nuovi cicli completi di sprite.
- Pausa anteprima e riduzione movimento; i controlli dell'interfaccia mostrano un'indicazione pertinente senza inventare animazioni fisiche.

## Preferenze e dispositivi

Volume generale, musica, effetti e voci usano il motore audio condiviso e le sue preferenze persistenti. Riduci movimento del menu usa `corporate-menu-preferences-v1` e rispetta la preferenza di sistema come valore iniziale. L'impossibilità di salvare in localStorage non impedisce di giocare.

Schermo intero resta un'azione esplicita; installazione appare quando il browser rende disponibile la PWA. Su iOS è mostrato il percorso Condividi → Aggiungi a Home. I sottotitoli restano nel lettore video esistente. Non viene inventato un salvataggio di campagna: non c'è un pulsante Continua.

Il menu copre l'intero viewport; i pannelli lunghi possono scorrere. Durante la sua vita rende consentito lo scorrimento touch sugli elementi HTML e ripristina i valori precedenti all'uscita, mantenendo il controllo del gioco dopo l'avvio. Header e footer considerano le safe area del dispositivo.

## Struttura e riuso

| File | Responsabilità |
| --- | --- |
| `src/menu/GameMenu.js` | Navigazione, collegamento alle scene, cataloghi, preferenze e ciclo di vita. |
| `src/menu/MenuModel.js` | Raggruppamento dei capitoli, selezione valida degli ingressi e definizioni dei comandi. |
| `src/menu/CharacterPreviews.js` | Lettura degli atlanti del gioco, animazione delle anteprime e cleanup. |
| `src/menu/menu.css` | Layout adattabile isolato nello Shadow DOM; non modifica gli stili del gameplay. |
| `public/assets/menu/office.webp` | Fondale Cinema, 248.944 byte. |
| `public/assets/menu/career.webp` | Fondale Palazzo, 344.244 byte. |

I fondali derivano dalle PNG approvate e sono stati codificati in WebP mantenendo le dimensioni originali. Le PNG e i prompt restano nello studio di progetto. Niente video in loop come fondale.

`MenuScene` mantiene una modalità diagnostica `?menu=classic`. Nel percorso normale istanzia il nuovo menu senza caricare il fondale di viaggio del vecchio menu. Lo shutdown rimuove DOM, listener, animazioni e stato inert; il ritorno alla scena crea una sola nuova istanza. La pausa per un filmato conserva l'istanza e la nasconde.

## Compatibilità con le lavorazioni parallele

L'integrazione del menu non incorpora nel proprio commit i sorgenti dei nuovi minigiochi e delle introduzioni ancora in lavorazione. Usa il catalogo e le scene effettivamente disponibili: la build locale completa può mostrare gli otto nuovi bonus e le dieci introduzioni, mentre un checkout precedente conserva il catalogo classico. La risoluzione delle scene dedicate è verificata prima dell'avvio.

## Verifica

- Test `node --test tests/menu.test.js`: ingressi dei mondi, conservazione degli indici originali, debug delle diramazioni e instradamento ai bonus dedicati.
- Build Vite/PWA prodotta senza errori.
- Browser: menu, selezione di Wendy, guida e nuoto, scelta dello stage 1-2, introduzione, briefing, movimento, pausa e ritorno al menu.
- Galleria delle cinque introduzioni di Wendy, apertura della Mensa, Salta e ritorno alla stessa galleria; una sola istanza del menu.
- Avvio del golf dalla scheda, uscita verso il catalogo bonus e ritorno al menu.
- Layout verificato a 1280×800, 844×390 e 390×844; nessuna eccedenza orizzontale nel menu verticale. Simulazione browser, non prova su telefono fisico.

Screenshot del gioco: [apertura](menu-20261123/game-home.jpg), [comandi](menu-20261123/game-controls.jpg), [mobile](menu-20261123/game-mobile.jpg).
