# Corporate Odyssey — proposte per il menu

Data: 23 novembre 2026. Prototipo navigabile, separato dalla scena di gioco. Dopo la revisione l'utente ha autorizzato commit e push su `max-hd/main` (`maxdbt/corporate-odissey-hd`). La consegna Git non pubblica il sito.

## Aprire il prototipo

Con il server locale attivo: <http://127.0.0.1:8084/corporate-odyssey/docs/menu-20261123/>.

Per riavviarlo da PowerShell:

```powershell
python -m http.server 8084 --bind 127.0.0.1 --directory E:\Repos\max
```

La cartella del server include il repository e l'adiacente `corporate-odyssey-media`, necessaria soltanto per il filmato pilota. Il prototipo legge sprite, catalogo bonus e motore audio locali; non richiede un build e non modifica il salvataggio o le preferenze del gioco. Per aprirlo usare HTTP, non `file://`.

## Tre direzioni artistiche

| Proposta | Idea | Punto forte | Attenzione in produzione |
| --- | --- | --- | --- |
| **01 — Ufficio cinematografico, consigliata** | Jack e Wendy in primo piano, notte blu e luci calde, ufficio ricco di dettagli come nelle introduzioni. Menu leggibile sulla fascia sinistra. | Continuità immediata fra menu, filmati e gioco; protagonista e pulsante Gioca ben riconoscibili. | Preparare tagli distinti del fondale per verticale e orizzontale. Piccoli movimenti ambientali senza distrarre dai pulsanti. |
| **02 — Il palazzo della carriera** | Sede aziendale in sezione, con i cinque mondi organizzati per piani. | Trasmette l'obiettivo della scalata; ottima base per la selezione dei capitoli. | Le diramazioni della trasferta richiedono una mappa dedicata. Non trasformare il fondale in una serie di bersagli minuscoli da toccare. |
| **03 — La scrivania impossibile** | Pelle, cartelline, caffè e luce dorata; pulsanti simili a dossier. | Più ironica e materiale, coerente con la satira aziendale. | Le cartelline mantengono etichette esplicite e contrasto; gli oggetti decorativi non diventano comandi da indovinare. |

Proposta di sintesi: **01 come menu principale**, il linguaggio della **02 per Capitoli**, alcuni dettagli della **03 per schede e briefing**. Una sola struttura di navigazione e gli stessi componenti per tutte le ambientazioni.

I tre fondali sono stati generati con il tool integrato ImageGen, usando i keyframe di Natale con Jack e Wendy delle nuove introduzioni. Testi, pulsanti e anteprime sono HTML/canvas reali sovrapposti, non testo disegnato nel fondale. Prompt completi e riferimenti: [prompts.json](prompts.json).

## Organizzazione delle funzioni

| Voce | Contenuto e comportamento |
| --- | --- |
| Gioca | Scelta protagonista → riepilogo personaggio/capitolo → conferma di avvio. Nel prototipo l'ultimo pulsante apre soltanto una spiegazione. |
| Capitoli | Cinque mondi, con nomi e contesto dei livelli. Nel gioco definitivo, accesso ai singoli scenari già disponibili e alle diramazioni della trasferta. |
| Minigiochi | Catalogo corrente da `StageBonusCatalog.js`, con regole e comandi specifici. Comprende anche il golf. Separare le prove libere dalle ricompense ottenute durante la campagna. |
| Filmati | Galleria delle introduzioni disponibili, con avvio esplicito e sottotitoli. Il prototipo riproduce il pilota di Estate d'Inferno con Jack, indicandolo chiaramente. |
| Comandi | PC/Touch, categorie Movimento/Azioni/Interfaccia, anteprima animata e istruzioni specifiche dei minigiochi. |
| Opzioni | Volume generale, musica, effetti, voci; riduzione movimento; schermo intero; installazione PWA quando supportata. In integrazione aggiungere sottotitoli e ripristino preferenze. |

Audio, schermo intero e protagonista sono raggiungibili dalla barra superiore. Comandi e Opzioni restano anche nel footer. Su schermi orizzontali bassi Opzioni viene tolto soltanto dalla duplicazione nel gruppo centrale: il pulsante nel footer rimane.

Non introdurre un pulsante **Continua** finché non esiste un contratto affidabile di salvataggio e ripresa. Lo stato attuale della partita è in memoria e l'avvio di una nuova partita lo reimposta. Una futura voce Nuova partita dovrà confermare l'eventuale sovrascrittura.

## Selezione del personaggio

- Jack e Wendy hanno una scheda con nome, ruolo e sprite reale; il protagonista selezionato cammina, l'altro mantiene la posa di riposo.
- Evidenziazione tramite bordo, etichetta e pulsante di conferma, senza affidarsi soltanto al colore.
- La scelta non avvia la partita: ripetere il tocco su una scheda non produce avvii accidentali.
- Nessuna statistica inventata, differenza di potenza o blocco dei personaggi. Stesse abilità e campagna.
- La scelta aggiorna tutte le anteprime dei comandi e il riepilogo di avvio.
- Il pulsante Guarda i movimenti apre direttamente la guida del protagonista scelto.

## Comandi con anteprima a destra

Su desktop e telefono orizzontale, elenco a sinistra e dimostrazione a destra. Su telefono verticale l'anteprima passa sopra l'elenco: resta vicina ai tab PC/Touch e non richiede due colonne troppo strette.

Le categorie separano camminata, corsa, salto, doppio salto, accovacciata, scivolata, scale e nuoto da attacco/cambio arma e dai comandi dell'interfaccia. Ogni riga presenta azione, tasto o gesto touch, descrizione e animazione coerente. Sono presenti pausa della demo e riduzione movimento. Il canvas è focalizzabile: frecce/WASD, X, Spazio/Z, C/Q e V/E cambiano l'esempio mostrato.

I tasti sono ricavati dall'InputController e dalle scene attuali: frecce/WASD, Spazio/Z, X, giù+X, C/Q, V/E, P, I, M, Esc. Su touch: levetta, SALTA, SCIVOLA (tenuto per correre), ATTACCA e pulsanti contestuali. Non promettere rimappatura o gamepad finché non implementati.

### Cosa è realmente animato qui

- Camminata/corsa: atlanti locomotion esistenti, **16 fotogrammi** per protagonista; la corsa cambia il ritmo.
- Nuoto: atlanti dive-swim esistenti, **12 fotogrammi**, con costume e attrezzatura da sub.
- Salti, accovacciata, scivolata, scale e attacco: pose disponibili con traiettorie dimostrative. Non sono nuovi cicli completi né una simulazione della fisica di gioco.
- Pausa, obiettivo, audio e uscita: personaggio di riferimento con indicazione del comando; non inventare un gesto del personaggio per un'azione dell'interfaccia.

Nell'integrazione conviene condividere definizioni di input e animazioni con il gioco, evitando una seconda implementazione che possa divergere. La preview deve riprodurre il movimento in un ambiente isolato, senza modificare progressi, salute o inventario.

## Mobile, prestazioni e accessibilità

Fondale illustrato con pochi strati, sprite locali e piccoli effetti ambientali. Evitare video Full HD in loop permanente: la clip viene caricata e riprodotta su richiesta. Nella versione finale generare varianti WebP/AVIF e dimensioni adeguate al dispositivo; le PNG di questo studio sono sorgenti di concept, non un pacchetto mobile ottimizzato.

Caricare gli atlanti al primo uso e riusarli; fermare le animazioni quando la schermata non è visibile. Rispettare Riduci movimento, con possibilità di riprendere manualmente. Il prototipo limita il rapporto pixel del canvas a 2. La riduzione movimento congela le demo, mentre Pausa anteprima è una scelta separata.

Progettare bersagli touch principali da almeno 44 px, con preferenza per 48–52 px dove possibile, focus visibile e testi leggibili. Il layout verticale può scorrere; nel gioco orizzontale mantenere sempre raggiungibili indietro, conferma e opzioni. Schermo intero si attiva su gesto dell'utente; i controlli touch di gameplay non devono occupare lo schermo PC. Le istruzioni touch vanno mostrate in base al tipo di input, senza rendere inaccessibile la scheda alternativa.

## Stato e integrazione successiva

Questo è uno studio navigabile da valutare: non sostituisce `MenuScene`, non avvia livelli o bonus e non pubblica il gioco. Le schede Capitoli riassumono i mondi; l'integrazione deve conservare anche la scelta degli scenari attualmente disponibile. La galleria finale dovrà usare il manifest aggiornato dei filmati per mondo e protagonista: qui è dimostrato soltanto il pilota, senza duplicare un catalogo in evoluzione.

Le modifiche sono isolate in questa cartella, per non interferire con il lavoro contemporaneo su minigiochi e introduzioni. Gli screenshot e la verifica manuale del prototipo sono raccolti in [VERIFICA.md](VERIFICA.md).

Il catalogo bonus è letto dalla versione del codice disponibile: la revisione locale mostrava otto nuove attività, mentre il catalogo già committato ne contiene sedici. Il prototipo supporta entrambi i formati (`genre` oppure `mode`) senza includere nella consegna il lavoro sui minigiochi ancora in corso. Il video pilota resta un media locale opzionale nella cartella adiacente, non incluso in questo commit.
