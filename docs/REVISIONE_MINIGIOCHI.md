# Revisione dei minigiochi — 23 novembre 2026

Sono giocabili **otto attività della campagna**. La raccolta si apre dal menu principale o con `?bonus=all`. Il successivo rifacimento di [L’ultima mail](BONUS_ULTIMA_MAIL.md) aggiunge una nona voce alla raccolta, disponibile in prova libera anche con `?bonus=last-mail`: tre destinazioni per le richieste e due azioni finali per andare in ferie. Gli altri vecchi bonus restano esclusi dalla raccolta e dagli ingressi della campagna; i rispettivi indirizzi rimandano alla raccolta.

**Revisione successiva del taxi:** L'indirizzo giusto usa [Roma EUR da OpenStreetMap](TAXI_CITTA_HD.md), laghetto compreso, con 24 veicoli, 48 passanti, sagome reali degli edifici e semafori che fermano il taxi e gli NPC. Camera al seguito, mappa e modalità senza timer sostituiscono il precedente tabellone.

**Revisione locale del pedalò:** [Ferie, ma non troppo](FERIE_PEDALO_ARCADE.md) ora occupa tutto lo schermo, con tre fasi della fuga, onde per saltare gli scogli, raccolte, combo e attacchi annunciati. La relativa consegna è un commit locale; non comprende un nuovo push o una pubblicazione.

Commit e push Git richiesti dall’utente sul repository HD. La pubblicazione del sito Sites resta separata da questa revisione.

## Attività e collocazione narrativa

| Minigioco | Regole implementate | Accesso nella campagna | Anteprima |
| --- | --- | --- | --- |
| Fuga dalla festa aziendale | Salone HD a schermo pieno, 24 colleghi con collisioni, sei inseguitori, cappotto e chiavi, piante per nascondersi e quattro distrazioni. [Dettagli](FUGA_FESTA_HD.md). | 1-1, x=1985: dopo il primo tratto platform. | `?bonus=party` |
| Parcheggio del 24 dicembre | Tre parcheggi: veicoli vincolati al proprio asse, collisioni, uscita dell'auto rossa e annullamento delle mosse. | 1-1, x=5200: verso l'uscita, separato dalla prima pausa. | `?bonus=parking` |
| Ferie, ma non troppo — Fuga in pedalò | Mare HD a schermo pieno, tre fasi, scatto sulle onde per saltare gli scogli, bibite, combo, ombrellone e attacchi annunciati di drone e capo. [Dettagli e verifiche](FERIE_PEDALO_ARCADE.md). | 1-2, tramite il biglietto ferie volante. | `?bonus=pedalo` |
| Il vassoio impossibile | Percorso in prima persona con stoviglie indipendenti, inerzia, caffè che si versa e ostacoli da aggirare. Accelerare aumenta il rischio. | 2-1, x=4800; richiede il pasto completo e non sostituisce il pagamento. | `?bonus=tray` |
| Questa call poteva essere una mail | Sei carte tattiche, intenzioni avversarie visibili, energia e pressione. Chiudere tre punti dell'agenda e assegnare i responsabili. | 3-1, x=1800: prima della conclusione dello stage. | `?bonus=call` |
| L'indirizzo giusto | Taxi nell'EUR: laghetto, Palazzo dei Congressi e Palazzo della Civiltà Italiana. Strade/edifici OSM, semafori, 24 veicoli e 48 pedoni. Sette minuti o esplorazione libera. | 4-1, pulsante nella scena della destinazione. | `?bonus=taxi` |
| Valigia impossibile | Sette oggetti, rotazioni, rimozione e due valigie. Fragili e pesanti in comparti distinti; la maniglia occupa spazio. | 4-2, scelta del trasporto, dopo gli acquisti obbligatori della preparazione 4-1. | `?bonus=packing` |
| Il golf del direttore | Tre stanze a tre quarti, mira e potenza libere, urti su mobili e sponde, attrito, tappeti, rampe e penalità del caffè. 8/10/10 colpi per buca. | 5-4, x=1460: prima del checkpoint e del direttore a x=1720. | `?bonus=golf` |

Gli ingressi sono opzionali e non saltano gli obiettivi della storia. Gli stage senza una nuova attività non espongono i vecchi bonus. La scena della festa usata nel finale della storia resta per quel finale; il vecchio ingresso al bonus ballo è rimosso.

## Controlli, pausa e premi

- Movimento: frecce o WASD; pulsanti touch. Ogni introduzione spiega azione, difesa e freno.
- Pedalò: frecce/A-D, Spazio per scatto e salti, E per ombrellone, giù/S per frenare; su touch frecce o trascinamento sul mare, SCATTO e OMBRELLO. I comandi di movimento a schermo sono nascosti su desktop.
- Parcheggio: trascinare un veicolo lungo il suo asse; selezione e frecce disponibili; Z annulla.
- Valigia: scegliere un oggetto, ruotare con R o pulsante, toccare la griglia per posarlo; toccare un oggetto posato per rimuoverlo.
- Call: scegliere punto dell'agenda e carta; tasti 1–6 come alternativa al tocco.
- Golf: trascinare indietro dalla pallina e rilasciare; alternativa con mira, forza e TIRA.
- P/ESC o pulsante pausa; perdita del focus mette in pausa; F/pulsante fullscreen. TORNA rientra nello stage o nella raccolta.
- La campagna è sospesa durante il bonus. Timer, nemici e controlli riprendono al rientro. Un tentativo per attività in ogni partita.
- Vittoria: +10 salute, −10 stress, +15 euro una sola volta. Abbandono e sconfitta non premiano. Le anteprime non modificano la campagna.

## Grafica e architettura

Fondali e oggetti HD, personaggi animati, texture caricate all'apertura dell'attività. Nuovi asset: veicoli, scogli, drone, chiavi, vassoio vuoto, parcheggio natalizio e caletta mediterranea. Immagini escluse dal precaricamento iniziale PWA.

- `src/bonus/new/`: sette modelli indipendenti da Phaser, simulazione a passo fisso, regole e vittoria.
- `src/bonus/minigolf/`: fisica, geometria e proiezione del golf.
- `StageBonusScene`: presentazione condivisa, input e risultato; `PartyEscapeScene`: salone affollato; `CityTaxiScene`: città esplorabile; `DirectorMinigolfScene`: golf.
- `PedaloPresentation`: visuale, HUD ed effetti dedicati al pedalò, integrati nel ciclo di vita di `StageBonusScene`.
- `BonusHubScene`: raccolta; catalogo, accessi e premi condivisi.
- I moduli storici non registrati restano solo come sorgenti; non sono offerti al giocatore.
- [Prompt e asset nuovi](concepts/PROMPTS-NUOVI-MINIGIOCHI.md); [prompt del golf](concepts/PROMPTS-MINIGOLF.md).

## Verifica

Suite della revisione isolata: **65 test superati**. Soluzioni reali per i tre parcheggi e le due valigie; vittorie tramite comandi per festa, pedalò, vassoio, call e taxi; tre buche del golf completate con tiri normali. Verificati pausa, limiti temporali, premio singolo, collisioni, distanza degli obiettivi e limiti degli atlas.

Chrome: aperte e controllate le otto attività; movimento, trascinamento, carte, rotazioni; rientro dal bonus festa alla campagna. Layout mobile controllato a 844 × 390: non equivale a una prova su telefono fisico.

Build iniziale Vite/PWA completata in una cartella temporanea esterna al repository. Anteprima attiva durante quella consegna: [raccolta locale](http://127.0.0.1:8098/?bonus=all). Il server precedente sulla porta 8092 è stato arrestato. In quella build erano verificati anche i nuovi asset e il reindirizzamento del vecchio link L'ultima mail alla raccolta; il successivo rifacimento ha ripristinato l'apertura diretta, come descritto in [BONUS_ULTIMA_MAIL.md](BONUS_ULTIMA_MAIL.md). Nessun errore nella console delle schermate controllate.

Schermate reali: [raccolta](screenshots/new-bonus-hub.jpg), [parcheggio](screenshots/new-parking.jpg), [pedalò](screenshots/new-pedalo.jpg), [vassoio](screenshots/new-tray.jpg).

La verifica non certifica il bilanciamento finale né una partita completa su tutti gli stage. È la versione giocabile da provare insieme prima di ulteriori rifiniture.
