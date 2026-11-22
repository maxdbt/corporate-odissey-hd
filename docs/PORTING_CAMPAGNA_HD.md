# Porting HD dell’intera campagna

Implementazione locale del **22 novembre 2026**, in `E:\Repos\max\corporate-odyssey`. Copre tutti i **19 stage**, le scene della trasferta, gli scontri executive e il finale. Ogni stage ha un bonus dedicato: **16 nuovi**, oltre a L’ultima mail, Ferie, ma non troppo e Caccia ai ricavi. Dopo il completamento locale l’utente ha autorizzato commit e push su `max-hd/main`, repository `maxdbt/corporate-odissey-hd`. Il workflow Pages è manuale: il push non pubblica il sito e non aggiorna Sites.

## Ambienti e storia

| Stage | Presentazione |
| --- | --- |
| 1-1 Natale in Ufficio | Tema natalizio HD esistente, mantenuto. |
| 1-2 Estate d’Inferno | Ufficio caldo con zone fredde, condizionatori e bonus spiaggia. |
| 2-1 La Pausa Pranzo | Mensa illustrata, cuochi, vassoio e portate; HUD del pasto. |
| 3-1 Il Limbo dei Post-it | Sala riunioni, arredi e piattaforme dedicate. |
| 4-1 Il Cliente Lontano | Scelta della sede, piccoli indizi sull’ambiente e inventario illustrato. |
| 4-2 Il Mezzo | Aereo/treno illustrati, costi e budget originali. |
| 4-3 L’Aeroporto | Terminal, gate, valigie, personale e animali. |
| 4-4 La Stazione | Stazione, treno e ostacoli di viaggio. |
| 4-5 Il Volo | Cabina e passeggeri seduti, eventi e risposte conservati. |
| 4-6 Il Treno | Carrozza panoramica e passeggeri dedicati. |
| 4-7 Il Deserto | Canyon, sabbia, vento, chioschi e mezzi. |
| 4-8 Il Ghiacciaio | Ghiaccio, rifugi, neve, pinguini e mezzi. |
| 4-9 Il Mare | Uffici subacquei, coralli, fauna e mezzi. |
| 4-10 Il Cliente | Incontro, richieste, consulenti e combattimenti specifici della destinazione. |
| 5-1 Finance | Ufficio executive e Caccia ai ricavi spaziale. |
| 5-2 Risorse Umane | Ricevimento, sala formazione e personale. |
| 5-3 La Segreteria | Ufficio, agenda, reception e badge. |
| 5-4 L’Attico | Biblioteca executive, trono e Mega-Direttore nelle diverse fasi. |
| 5-5 Il Tetto | Skyline, eliporto, impianti, elicottero e scontro finale. |

Le diramazioni restano quelle di `Trip.js`: sede → valigia → mezzo → aeroporto/stazione → volo/treno → ambiente scelto → cliente → Finance → scalata. Gli stage alternativi non diventano una sequenza obbligatoria. Restano i requisiti del pasto, gli oggetti dimenticati, budget, noleggi, cibo, checkpoint, badge VIP e scelte finali CEO/Caraibi. PartyScene, ToiletScene e FoodScene hanno un adattamento grafico, senza sostituire le prove originali.

## Struttura riutilizzabile

- `WorldCatalog` associa stage, fondali e materiali; `themes/worlds` associa i vecchi identificatori a frame HD.
- `OfficePresentation`, `ActorSkin`, `WorldDressing` e `WorldAtmosphere` separano rendering e simulazione. Le collisioni e le entità originali restano autorevoli.
- `StaticStagePresentation` adatta scene di scelte, inventario, viaggio, cliente, attività secondarie, menu e finale. Mantiene aggiornate anche le immagini nei contenitori, senza ridurle a ogni cambio di texture.
- `AssetPacks` descrive i caricamenti; `AssetRegistry` conserva i pacchetti delle scene sospese e libera i fondali non più usati al caricamento successivo.
- `StageBonusCatalog/Round/Scene/Access/Rewards` separano dati, regole, interfaccia, pausa e premio. Vedi [regole dei bonus](BONUS_PER_LIVELLO.md).

I protagonisti mantengono otto frame di corsa, pose di azione e attacco; entrambi hanno quattro nuovi frame di nuoto. I passeggeri hanno immagini sedute; il Mega-Direttore distingue trono, posizione in piedi, corsa e attacco. I fondali scorrono con parallax; nei nuovi mondi i pannelli alternati speculari evitano lo stacco fra due estremità diverse. Illuminazione e materiali sono prevalentemente dipinti; gli effetti ambientali hanno un numero limitato di particelle.

## Desktop e mobile

Il gioco utilizza lo spazio del browser in orizzontale. Su PC i comandi touch rimangono nascosti; sono disponibili tastiera, mouse e fullscreen. Su touch compaiono solo i controlli pertinenti alla scena. HUD, pulsanti e scene bonus si ridimensionano; pausa e perdita di focus sospendono il gioco. La densità del canvas resta limitata a 3 su PC e 2,5 in modalità touch. Il formato verticale viene letterboxed: la composizione prevista è landscape.

I fondali non si caricano tutti insieme. Il service worker precache esclude `hd-worlds`; quelle risorse entrano in una cache runtime di massimo 32 richieste per 30 giorni. L’offline è quindi limitato alle risorse ancora presenti in cache: **non è garantita l’intera campagna al primo avvio offline**. I PNG e gli atlas sono inclusi nel checkout; non servono servizi esterni per giocare. Le dimensioni compresse non equivalgono alla memoria GPU delle texture decodificate.

## Avvio e verifiche locali

Server di questa sessione: [http://127.0.0.1:8080](http://127.0.0.1:8080), limitato al loopback. Per avviarlo manualmente:

```powershell
npm run dev -- --host 127.0.0.1
node --test tests/*.test.js
npm run build
```

In sviluppo `?level=N` usa l’indice zero-based del catalogo (0–18) e instrada anche le scene statiche. `?character=woman` seleziona Wendy; `?controls=touch` forza i comandi per QA. `?inspectX=...` sposta soltanto l’ingresso di prova di GameScene; `?ending` apre il finale. Questi ingressi di stage/finale sono esclusi dalla build di produzione. `?bonus=ID` apre un’anteprima senza premio; gli ID sono in StageBonusCatalog, più `last-mail`, `beach` e `revenue`.

Esempi: [Mensa](http://127.0.0.1:8080/?level=2), [Ghiacciaio](http://127.0.0.1:8080/?level=11), [Tetto](http://127.0.0.1:8080/?level=18), [Agenda](http://127.0.0.1:8080/?bonus=calendar), [Ricavi](http://127.0.0.1:8080/?bonus=revenue).

## Collaudo e limiti

- **18 test automatici superati** (`node --test tests/*.test.js`); build di produzione riuscita (`npm run build`, 132 moduli, 40 risorse precache, 23.142,57 KiB). Copertura: temi e bonus dei 19 stage; esistenza dei frame; tutte le 16 nuove attività vincibili su 12 semi; pausa, limiti temporali, errori e premi una sola volta; regressioni delle animazioni e dei bonus precedenti.
- Prove browser: avvio dei nuovi stage, passaggio sede → valigia → mezzo → aeroporto con Wendy, passeggeri di aereo/treno, incontro col cliente, boss nell’attico e sul tetto, tutte le anteprime dei nuovi bonus e i due finali fino alle statistiche. Verificati anche ingresso nella festa, prova del bagno e rientro dal chiosco e dal bagno con gli effetti previsti.
- Rientro dal bonus della Mensa: stessa scena/posizione e tempo conservato; pausa prolungata verificata anche cambiando scheda.
- Mobile simulato 844×390: HUD, salto/nuoto da pulsante, bonus Agenda e selezione touch; ridimensionamento verticale/orizzontale della pausa.
- Le catture provengono dal canvas reale; i concept in `docs/concepts` restano tavole illustrative. Nei campioni della diagnostica desktop si sono osservati circa 54–61 fps, senza una misura su telefono fisico.

Non è stata eseguita una partita integrale di ogni diramazione e combinazione casuale. Restano da misurare prestazioni, temperatura e memoria su hardware Android/iOS, multitouch fisico, sessioni prolungate e installazione PWA/offline reale. Questi limiti del collaudo non indicano stage lasciati al tema originale.

## Materiale grafico

Le tavole aggiunte sono [Mensa e riunioni](concepts/08-mensa-riunioni.png), [Trasferta](concepts/09-trasferta.png), [Ambienti estremi](concepts/10-ambienti-estremi.png), [Executive](concepts/11-executive.png). La versione `11-executive-bozza.png` resta come archivio: la tavola corretta conserva il bonus spaziale di Finance e i nomi Attico/Tetto. Tutti i prompt sono in [PROMPTS-CAMPAGNA-HD.md](concepts/PROMPTS-CAMPAGNA-HD.md).

I nuovi asset sono in `public/assets/hd-worlds`. `scripts/build-hd-atlases.py` legge alpha e scrive solo metadati JSON, incluse le righe non uniformi di cast, inventario e cibo; non modifica i pixel degli originali.


## Catture del gioco reale

- [Mare e nuoto di Wendy, mobile simulato](screenshots/mare-mobile.jpg)
- [Agenda, mobile simulato](screenshots/agenda-bonus-mobile.jpg)
- [Caccia ai ricavi, desktop](screenshots/ricavi-pc.jpg)
- [Boss sul tetto, desktop](screenshots/tetto-boss-pc.jpg)
- [Scelta del finale, desktop](screenshots/finale-scelta-pc.jpg)
