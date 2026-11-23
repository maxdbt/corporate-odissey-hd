# Verifica manuale del prototipo

23 novembre 2026 — browser integrato, server HTTP locale. Controllo sintattico `node --check docs/menu-20261123/menu.js` superato. Nessuna modifica alla scena di gioco, nessun test della campagna richiesto da questo studio.

## Percorsi verificati

- Cambio fra tutte e tre le direzioni artistiche; pulsanti e testi rimangono elementi interattivi.
- Scelta Jack/Wendy: evidenziazione, cambio del nome e anteprima, conferma di avvio separata. Il focus resta sulla scheda scelta.
- Guida PC/Touch: cambio delle etichette, scelta dell'azione, memoria dello scorrimento della lista. La scelta Wendy viene mantenuta nella guida.
- Sprite locomotion caricati per entrambi, con avanzamento osservato dei fotogrammi. Nuoto Wendy caricato con costume, bombole e maschera. Pose di salto e attacco visualizzate.
- Ferma/Riprendi anteprima: stato di pausa mostrato e fotogramma congelato.
- Catalogo dei minigiochi: visualizzate tutte le otto voci attualmente definite, golf incluso.
- Filmato pilota locale: riproduzione arrivata alla fine dei 15,018 secondi, senza errore del lettore, con sottotitoli italiani caricati.
- Riduci movimento nelle opzioni: demo congelata anche dopo il passaggio alla schermata Comandi.
- Gioca → conferma protagonista → Inizia il turno: finestra dimostrativa, nessuna partita avviata.
- Nessun errore console rilevato durante la verifica finale.
- Preparazione del commit: verificata la compatibilità anche con le sedici voci del catalogo già committato, che usa `mode` anziché `genre`.

## Layout

| Viewport | Verifica |
| --- | --- |
| 1280 × 900 | Tre home, selezione personaggi e comandi con anteprima a destra. Corrette sovrapposizioni iniziali fra contenuti e footer. |
| 844 × 390 | Menu orizzontale compatto con Gioca, Capitoli, Minigiochi, Filmati, Comandi e Opzioni raggiungibili; le schermate interne scorrono nel proprio pannello. |
| 390 × 844 | Comandi in colonna, tab e categorie sopra l'anteprima; nessuna eccedenza orizzontale rilevata (larghezza documento 390 px). I contenuti lunghi scorrono. |

La verifica delle dimensioni è una simulazione nel browser desktop: non sostituisce una prova su un telefono fisico, specialmente per touch simultanei, performance, fullscreen e installazione PWA. Qui non sono stati modificati tali sottosistemi del gioco.

## Screenshot

- [Ufficio cinematografico](01-cinema.jpg)
- [Palazzo della carriera](02-palazzo.jpg)
- [Scrivania impossibile](03-scrivania.jpg)
- [Selezione personaggi](04-personaggi.jpg)
- [Comandi desktop](05-comandi.jpg)
- [Home mobile orizzontale](06-mobile-orizzontale.jpg)
- [Comandi mobile verticale](07-comandi-mobile.jpg)

Gli screenshot sono del prototipo reale; le animazioni vanno valutate nel [prototipo navigabile](http://127.0.0.1:8084/corporate-odyssey/docs/menu-20261123/).
