# Audio di Corporate Odyssey

Revisione locale del 23 novembre 2026. Musica originale sintetizzata con Web Audio, effetti brevi e mix moderato. Nessun servizio esterno, chiave API o download di campioni richiesto dai nuovi temi. Le battute registrate di Last Mail restano negli asset esistenti.

[Indice](README.md) · [Architettura](ARCHITECTURE.md) · [Sviluppo](DEVELOPMENT.md)

Stato della consegna audio: integrato nel gioco locale e incluso nella build, con una pagina d’ascolto separata per confrontare i suoni. L’avvio normale del gioco crea `GameAudioDirector` in `src/main.js`; non occorre aprire l’anteprima per attivare i nuovi temi. Nessun commit o push effettuato per questa revisione. Il documento non attesta l’aggiornamento del sito pubblico. Le [introduzioni video](INTRODUZIONI_ANIMATE.md) hanno un percorso di produzione e un mix separati.

## Integrazione nel gioco

Aprire la pagina principale del server Vite e iniziare una partita. Il primo clic, tocco o comando da tastiera sblocca l’audio in tutte le scene, compresi i bonus aperti direttamente. Se un briefing è ancora in pausa, lo sblocco prepara il dispositivo mantenendo l’uscita silenziosa; la riproduzione riprende quando la pausa termina.

| Situazione | Comportamento integrato |
| --- | --- |
| Ingresso nei 19 stage, incluse le scene statiche | Tema del livello e breve jingle; un riavvio ripropone il jingle, il ritorno dal bonus no |
| Boss e promozione temporanea | Cambio di tema in base allo scontro o al potenziamento, poi ritorno al tema dello stage |
| Movimento e mezzi | Passi, atterraggio, scivolata, nuoto, salita/discesa, motore o zoccoli, con limiti alle ripetizioni |
| Salute, timer e squali | Segnali brevi al passaggio delle soglie o all’ingresso nella zona vicina |
| Bagno | Tema dedicato, apertura della porta e suono di mostro, sciacquone o portale secondo l’esito |
| Bonus generici | Arrangiamento dello stage, punti/errori, valvole e singoli passi delle sequenze di memoria |
| Carrozza del silenzio | Squillo all’avvio della prova e al cambio di telefono, rispettando il limite di ripetizione |
| Spiaggia, ricavi e golf | Temi dedicati o arrangiamento del relativo stage, mantenendo gli eventi di gioco esistenti |
| Last Mail | Effetti e battute sul contesto condiviso; pausa e muto rispettati anche al ritorno alla campagna |

L’integrazione aggiunge suoni agli eventi del gioco senza cambiare collisioni, difficoltà, premi o grafica. Gli input globali servono a sbloccare l’audio e non sostituiscono i comandi delle scene.

## Ascolto rapido

Avvia `npm run dev` dalla radice del progetto e apri `/audio-preview.html` all’indirizzo indicato da Vite. La pagina permette di confrontare temi, jingle ed effetti, regolare il mix dell’anteprima e scaricare una sequenza WAV. Non modifica salvataggi o preferenze del gioco e non viene inclusa nella build di produzione.

| Cosa provare | Dove aprirlo sul server locale |
| --- | --- |
| Partita con musica ed effetti già integrati | Pagina principale `/` |
| Confronto fra temi, jingle ed effetti | `/audio-preview.html` |
| Sblocco e squilli del bonus telefonico | `/?bonus=phones`, poi INIZIA o Invio |
| Suono del mostro del bagno | In sviluppo: `/?bonus=toilet&inspectMonster`, poi aprire la porta centrale |

Usare l’indirizzo effettivo stampato da Vite: la porta può cambiare se quella predefinita è occupata. Per il gioco costruito con `npm run build`, avviare `npm run preview` e aprire la pagina principale; musica ed effetti fanno parte della build, mentre la pagina di confronto resta uno strumento di sviluppo.

Premere **Ascolta** per il tema scelto oppure **Solo jingle** per il motivo d’ingresso. Il primo gesto sblocca l’audio del browser. **Crea anteprima WAV e verifica** abilita il player e il download al termine del rendering. La pagina richiede il server di sviluppo; aprire direttamente il file HTML o usare la sola build di produzione non è il percorso di ascolto previsto.

È disponibile anche [l’anteprima WAV di 38,8 secondi](audio/anteprima-audio.wav): Natale, estate, ghiacciaio, mare, Mega-Direttore, poi salto, moneta, salita sul mezzo, nuoto, squalo, mostro del bagno e vittoria. È un rendering dello stesso sintetizzatore usato dal gioco, ai volumi predefiniti; non una registrazione della partita.

## Temi per livello

Ogni livello ha una melodia propria, un tempo e un timbro scelti per l’ambientazione. Le frasi lasciano spazio agli effetti; il breve jingle d’ingresso riprende le prime quattro note. Non viene ripetuto semplicemente uscendo da una pausa o tornando da un bonus.

| Livello | Tema | Carattere |
| --- | --- | --- |
| 1-1 Natale in ufficio | Campanelli dopo le sei | Campanelli morbidi, 108 BPM |
| 1-2 Estate d’Inferno | Ventilatore in levare | Pizzicato sincopato, 116 BPM |
| 2-1 Pausa pranzo | Vassoio swing | Percussioni melodiche, 104 BPM |
| 3-1 Riunione | Ordine del giorno | Marimba e piccoli accenti, 110 BPM |
| 4-1 Destinazione | Rotta da definire | Piano leggero, 94 BPM |
| 4-2 Il mezzo | Valigia pronta | Pizzicato brillante, 112 BPM |
| 4-3 Aeroporto | Gate 24 | Suoni cristallini, 118 BPM |
| 4-4 Stazione | Binario dispari | Marimba ritmica, 120 BPM |
| 4-5 Aereo | Sopra le nuvole | Timbri ariosi, 82 BPM |
| 4-6 Treno | Paesaggio in corsa | Piano sincopato, 106 BPM |
| 4-7 Deserto | Oasi fuori sede | Pizzicato in minore armonica, 98 BPM |
| 4-8 Ghiacciaio | Cristalli e scadenze | Cristalli e accompagnamento tenue, 88 BPM |
| 4-9 Mare | Ufficio sommerso | Timbri acquatici e scala pentatonica, 78 BPM |
| 4-10 Cliente | Clausole in sospeso | Piano in minore, 101 BPM |
| 5-1 Finance | Saldo in movimento | Percussioni melodiche, 121 BPM |
| 5-2 Risorse umane | Sorriso obbligatorio | Piano in maggiore, 102 BPM |
| 5-3 Segreteria | Agenda incrociata | Marimba incalzante, 126 BPM |
| 5-4 Attico | Il prezzo della poltrona | Timbro ad ancia sintetico, 96 BPM |
| 5-5 Tetto | Ultimo piano | Finale più energico, 132 BPM |

Il catalogo comprende 50 partiture: 19 principali, 19 arrangiamenti alleggeriti per i bonus, 6 boss e 6 situazioni speciali. Gli arrangiamenti bonus eliminano pad e batteria, riducono il volume e rallentano leggermente. Spiaggia e ricavi usano i propri temi; il golf usa l’arrangiamento dell’attico. Party, ascensore, finale e Last Mail conservano la regia delle proprie sequenze. In Last Mail lo spazio sonoro resta dedicato a effetti e battute.

I boss cambiano tema fra cliente, Mega-Direttore, tetto e i tre super consulenti di deserto, ghiacciaio e mare.

## Effetti e regole di mix

Il catalogo include 45 effetti, compatibili con le chiamate esistenti. Saltare, raccogliere, sparare, subire danni e ottenere premi hanno inviluppi più morbidi. I nuovi segnali contestuali comprendono passi su pavimento/sabbia/ghiaccio, atterraggio, scivolata, nuoto, squalo vicino, salita/discesa dai mezzi, motore o zoccoli, porta del bagno, mostro, sciacquone e portale. Nei bonus sono osservati punti, errori, avvio e rinnovo delle sfide telefoniche, passi corretti delle sequenze di memoria e cambi delle valvole. Non si aggiunge un suono a ogni elemento animato.

- Mix iniziale: generale 65%, musica 32%, effetti 64%, voci 85%. Sono guadagni di canale, non percentuali di volume percepito.
- Intervalli specifici per effetto e almeno 45 ms fra effetti dello stesso gruppo.
- Massimo 9 richieste ordinarie al secondo; danni e avvisi critici superano questo limite ma rispettano intervalli e limiti di polifonia.
- Passi distanziati di almeno 320 ms, nuoto ogni secondo, motore ogni 2,2 secondi durante il movimento. Nessun motore costante in sottofondo.
- Salute a 25 o meno e ultimi 30 secondi producono un avviso al passaggio della soglia. Lo squalo segnala l’ingresso nella zona vicina, con almeno 6,5 secondi fra richiami.
- Musica attenuata durante i dialoghi e brevemente durante eventi importanti; compressore sul bus finale.
- Pause di gioco e scheda nascosta sospendono il contesto audio condiviso. Riprendere non riproduce una coda di eventi arretrati.
- I nodi terminati vengono scollegati. La musica programma soltanto i prossimi 180 ms; il sintetizzatore principale limita le proprie sorgenti a 96 durante la riproduzione dal vivo. Le clip vocali di Last Mail sono gestite separatamente sul contesto condiviso.
- Muto e livelli vengono conservati in `corporate-audio-v2` nel localStorage. Le voci di Last Mail condividono contesto, pausa e bus generale; uscire dal bonus non chiude l’audio del resto del gioco.

## Struttura e manutenzione

| File | Responsabilità |
| --- | --- |
| `src/audio/AudioCatalog.js` | Partiture, motivi d’ingresso, timbri e definizioni degli effetti |
| `src/audio/SoundEngine.js` | Sintesi, scheduler, bus, attenuazione, limiti e preferenze |
| `src/audio/GameAudioDirector.js` | Selezione dei temi e osservazione delle situazioni; non modifica fisica, ricompense o progressione |
| `src/systems/Audio8bit.js` | Ingresso compatibile con `audio.music`, `sfx`, `note`, `unlock`, `toggleMute` |
| `src/systems/LastMailAudio.js` | Battute registrate e piccoli effetti del bonus natalizio, sul contesto condiviso |
| `audio-preview.html`, `src/audio/AudioPreview.js` | Ascolto e rendering offline, solo sviluppo |
| `tests/audio.test.js` | Copertura, limiti, scheduler, pausa, instradamento e transizioni |

Per aggiungere un tema si modifica il catalogo e la relativa selezione nel direttore. Per un nuovo effetto si definiscono `sounds`, `gap` ed eventualmente `group`, `priority` e `duck`; le scene possono continuare a chiamare `audio.sfx(nome)`. Evitare chiamate per ogni fotogramma e non creare nuovi AudioContext nelle scene.

### API per scene e interfacce

Importare il singleton da `src/systems/Audio8bit.js`, usando il percorso relativo alla propria scena. Il nome storico del file serve a mantenere compatibili gli import.

| Chiamata | Uso |
| --- | --- |
| `audio.unlock()` | Sblocca il contesto su clic, tocco o tasto; durante una pausa lo prepara con l’uscita silenziosa e conserva la sospensione |
| `audio.music('level')` | Seleziona il tema del livello corrente; accetta anche ID espliciti come `4-9` |
| `audio.music('boss')` | Seleziona il boss in base a livello e percorso della trasferta |
| `audio.stopMusic()` | Ferma la musica con una breve dissolvenza |
| `audio.sfx('coin')` | Richiede un effetto rispettando limiti e muto; restituisce se la richiesta è stata accettata |
| `audio.jingle('1-2')` | Richiede il motivo d’ingresso; normalmente se ne occupa il direttore |
| `audio.note('E6', 0.25, 'triangle', 0.3)` | Una nota sul bus musica, per le sequenze gestite dalle scene |
| `audio.setVolume('music', 0.32)` | Imposta un guadagno tra 0 e 1; bus ammessi: `master`, `music`, `effects`, `voices` |
| `audio.toggleMute()` | Inverte il muto e restituisce il nuovo stato |
| `audio.setPaused(true, 'game')` | Aggiunge un motivo di pausa; passare `false` con lo stesso motivo per rimuoverlo |
| `audio.subscribe(callback)` | Osserva le preferenze e restituisce la funzione per rimuovere l’ascoltatore |

Il direttore gestisce i motivi di pausa `game` e `hidden` e gli eventi globali `pointerdown`, `pointerup`, `touchend` e `keydown` per lo sblocco. Gli ascoltatori vengono rimossi alla distruzione del direttore. La pausa viene applicata al primo `poststep` successivo, senza attendere il campionamento degli effetti ogni 70 ms. L’indicatore di sviluppo `data-audio-state` sul canvas mostra `track`, `scene`, `paused`, `context`, `muted`, `voices`, `effects`, `lastEffect` e `limited`: `voices` conta le sorgenti del sintetizzatore, `effects` le richieste di effetti accettate e `lastEffect` l’ultima accettata. Le battute registrate sono gestite separatamente.

### Se non si sente l’audio

Avviare con un gesto dell’utente, verificare che gioco e scheda siano attivi, disattivare il muto tramite M o il comando della scena e controllare il volume del dispositivo. Nell’anteprima verificare anche i tre cursori. La disponibilità di Web Audio è necessaria alla riproduzione; la partita continua se il browser non riesce a inizializzarlo. Le preferenze del gioco sono associate all’origine del sito, quindi porte o indirizzi diversi possono avere impostazioni diverse.

## Verifiche

`node --test tests/audio.test.js` comprende 13 test: temi distinti per tutti i livelli, limitazione delle ripetizioni, priorità dei danni, pulizia dei nodi, pause sovrapposte, pause senza ritardo, cambio boss, bonus, mancata ripetizione dei jingle al ritorno dal bonus, ripristino dopo riavvio, sblocco dai bonus diretti, sblocco silenzioso durante il briefing, rimozione degli ascoltatori e segnali sulle transizioni. La simulazione dello scheduler copre due minuti e un salto temporale a 1.000 secondi.

Il controllo Web Audio dell’anteprima ha renderizzato 50 temi/varianti e 45 effetti: 95 controlli, nessun risultato silenzioso o saturato, picco massimo 0,152 su 1 con il mix predefinito. Per i cinque temi nel medley sono verificati i primi sei secondi; gli altri sono renderizzati per un ciclo completo. Il controllo misura i segnali separatamente, non ogni possibile combinazione durante una partita e non la qualità percepita su tutti gli altoparlanti.

### Esito del collaudo del 23 novembre 2026

Risultati dell’ultima verifica dell’integrazione, eseguita prima di questo aggiornamento documentale:

| Verifica | Risultato registrato |
| --- | --- |
| `node --test tests/*.test.js` | 47 test superati, nessun fallimento |
| `node --test tests/audio.test.js` | 13 test audio superati, inclusi anche nella suite generale |
| `npm run build` | Build e generazione del service worker completate |
| Bonus telefonico aperto direttamente su Chrome desktop | Dopo Invio: tema `bonus-4-6`, contesto `running`, effetto `phone` accettato |
| Comparsa del mostro del bagno su Chrome desktop | Tema `bathroom`, effetto `monster` accettato, nessun errore di console rilevato |
| Pausa del bagno | `paused: true` e contesto `suspended` |
| Avvio normale dal menu | `MenuScene` con tema `menu` e contesto `running` nella sessione già sbloccata |

Le precedenti prove browser hanno verificato anche riproduzione, pausa, rendering dell’anteprima e selezione del tema marino. Il contatore `lastEffect` conferma che il motore ha accettato un evento; non sostituisce l’ascolto o una misura del volume percepito sul dispositivo.

La prova su un telefono fisico resta da eseguire, in particolare per sblocco al tocco, ritorno dall’app in background e ascolto su altoparlante e cuffie. Questi risultati attestano la versione locale verificata e non una pubblicazione online.
