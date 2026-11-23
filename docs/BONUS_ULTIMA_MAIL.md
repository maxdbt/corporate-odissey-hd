# Bonus POV — L’ultima mail

Bonus giocabile in prima persona, ambientato nell’ufficio natalizio del concept approvato. È il 24 dicembre, ore 17:59: il dipendente vuole andare in ferie, mentre continuano ad arrivare richieste «urgenti». Il gesto centrale è timbrarle **A GENNAIO**. Il tono è satirico: difendere il proprio tempo, evitare il burnout, concedersi un caffè.

## Accesso

- Anteprima libera: avviare il progetto e aprire `/?bonus=last-mail`.
- Menu: pulsante **BONUS POV — L’ULTIMA MAIL**.
- Campagna: PC verde sulla prima scrivania di **Natale in Ufficio**, coordinate logiche `(332, 360)`. Avvicinarsi e premere SU, oppure toccare il computer. Disponibile una volta per tentativo del livello.

L’anteprima non modifica lo stato della campagna. La pubblicazione usa una copia separata in `E:\Repos\max\corporate-odyssey-last-mail-public`, con la propria identità Sites. Il repository principale non viene committato o inviato al remoto dalla pubblicazione.

## Regole

Il turno dura 45 secondi di simulazione. Le richieste arrivano su tre corsie; un clic, un tocco o il tasto della corsia le respinge. Le richieste ignorate aggiungono 14 stress; quelle timbrate tolgono 2 stress e aumentano combo e punti. Il moltiplicatore massimo è ×4.

Occorre raccogliere almeno un biglietto dorato **FERIE APPROVATE** e arrivare alla fine con stress inferiore a 100. Il biglietto vale 40 punti e toglie 8 stress. Il caffè si può usare una volta e toglie 30 stress.

Nella campagna, la vittoria concede un giorno di ferie, un checkpoint presso il giocatore, −20 stress e un euro ogni 50 punti. La sconfitta aggiunge 10 stress. Questi esiti sono applicati una sola volta; lo stress interno del minigioco non viene trasferito direttamente alla campagna. Uscire prima del risultato non concede premi e consuma comunque il tentativo.

## Comandi e adattamento

| Azione | PC | Telefono |
| --- | --- | --- |
| Timbrare / raccogliere | Clic oppure 1, 2, 3 | Tocco sulla richiesta |
| Caffè | Spazio | Pulsante CAFFÈ |
| Pausa / ripresa | P oppure Esc | Pulsante pausa |
| Schermo intero | F oppure icona | Icona, quando supportata dal browser |
| Audio | M oppure icona | Icona |
| Battute vocali | Pulsante V nell’HUD | Pulsante V nell’HUD |

Il bonus occupa l’intera finestra. Su PC il pulsante touch del caffè è nascosto; lo schermo intero richiede un gesto dell’utente e il supporto del browser. Sul telefono si gioca in orizzontale: ruotare in verticale mette in pausa. Cambio scheda, perdita del focus e pagina nascosta interrompono il turno. Le finestre hanno focus da tastiera, pulsanti con etichette e battute sottotitolate. `?touch=1` forza il layout touch per le verifiche su desktop; non simula un vero dispositivo.

## Grafica e animazione

- Fondale illustrato realistico in WebP, 1672 × 941, con ufficio, neve, sala feste, scrivania e caffè.
- Mano con timbro: atlas trasparente 2 × 2, quattro pose distinte — riposo, preparazione, impatto, recupero. Sequenza circa 240 ms.
- Carte animate con posizione, scala e rotazione per suggerire l’avvicinamento; timbro sul foglio e dissolvenza della richiesta risolta.
- HUD e testo HTML/CSS nitidi alla risoluzione della finestra. Il bonus non eredita il filtro pixel art del canvas del platform.
- Circa 583 kB per i due asset grafici, circa 231 kB per le quattro battute. Nessun video in background e nessuna API generativa durante il gioco.

## Audio

Voce sintetica **Chad**, giovane maschile, modello **Eleven v3**, lingua italiana, velocità 1,08. Interpretazione eccitata con tag `[excited]`; le espressioni romanesche sono nel copione. Non è una clonazione della voce dell’utente. Le quattro clip MP3 sono locali, accompagnate da effetti Web Audio per carta, timbro, raccolta e caffè.

| Evento | File | Battuta |
| --- | --- | --- |
| Timbro | `a-gennaio.mp3` | Aò! Se ne riparla a gennaio! |
| Vittoria | `sto-in-ferie.mp3` | Daje! Mo’ basta! Sto in ferie! |
| Richiesta persa | `e-natale.mp3` | Ma quale urgente! È Natale! |
| Caffè | `caffe.mp3` | Aò! Una tazzina e me ripiglio! Va’, famme fa’ un caffè! |

Un intervallo minimo limita la ripetizione delle battute; caffè ed esito hanno priorità. L’audio viene sbloccato dal pulsante di avvio e le clip automatiche usano lo stesso AudioContext anche su mobile. È possibile disattivare tutto l’audio o solo le voci. Se una clip non è disponibile, il gioco continua con i sottotitoli.

Nella [revisione audio locale del 23 novembre 2026](AUDIO.md), il contesto è condiviso con il resto del gioco: carta e timbro passano dal bus effetti, le battute dal bus voci, entrambi soggetti al volume generale e al muto. La pausa del bonus sospende anche l’audio. Uscire interrompe le battute e scollega l’uscita del bonus, mantenendo disponibile il contesto per la campagna. Le quattro registrazioni e i sottotitoli restano quelli esistenti.

## Struttura

- `src/scenes/LastMailScene.js`: ciclo di vita Phaser, pausa/ripresa della campagna e premi.
- `src/systems/LastMailRound.js`: regole indipendenti da grafica e audio.
- `src/systems/LastMailTerminal.js`: computer nel primo livello.
- `src/systems/LastMailAudio.js`: clip vocali ed effetti.
- `src/ui/LastMailView.js` e `last-mail.css`: scena DOM, interazioni e animazioni.
- `public/assets/last-mail/`: asset definitivi.
- `tests/last-mail.test.js`: vittoria, requisito ferie, burnout, pausa, caffè, doppie interazioni e premi ripetuti.

## Verifica

Eseguire `node --test tests/last-mail.test.js` e `npm run build`. I file WebP e MP3 sono inclusi nella cache della PWA. La verifica nel browser comprende layout desktop e viewport 844 × 390 / 390 × 844, timbro con clic e tastiera, caffè, pausa, rotazione e uscita. Le viewport non sostituiscono una prova prestazionale su telefono fisico; non è attestato un frame rate su hardware mobile.
