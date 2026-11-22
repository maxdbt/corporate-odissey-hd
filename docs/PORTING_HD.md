# Porting HD del primo livello

Il livello **1-1 Natale in Ufficio** usa il tema `office-hd`, nello stile del [riferimento approvato](concepts/riferimento-approvato.png). Il porting non cambia la versione del package e non richiede servizi esterni durante l'esecuzione. La [pubblicazione su ChatGPT Sites](PUBBLICAZIONE_SITES.md) usa una copia separata della build e non modifica il repository GitHub.

## Avvio e controlli

```powershell
npm ci
npm run dev
```

Selezionare il primo scenario dal menu e avviare Jack o Wendy. Il menu conserva il tema originale. Anche 1-2 è stato successivamente convertito: vedi [Estate d'Inferno e Ferie, ma non troppo](PORTING_ESTATE.md); gli altri stage conservano il tema originale.

Su PC sono attivi tastiera, HUD e pausa; joystick e azioni mobili sono nascosti. **F** attiva lo schermo intero se disponibile; **Esc** ne consente l'uscita senza aprire nello stesso gesto il menu di abbandono. Il fullscreen resta un'azione del browser avviata dall'utente.

Su telefono l'interfaccia touch appare automaticamente con il puntatore adatto o quando viene usato il tocco. Un portatile dotato di touchscreen mantiene l'interfaccia da tastiera finché non usa il tocco. Il cambio di input pulisce i comandi mantenuti.

Per confronti e verifiche:

| Parametro | Uso |
| --- | --- |
| `?graphics=classic` | Primo stage con la presentazione originale |
| `?controls=keyboard` | Interfaccia HD da tastiera forzata |
| `?controls=touch` | Interfaccia HD touch forzata, utile per il layout |
| Nessun parametro | Presentazione HD e input automatico |

## Architettura riutilizzabile

| Modulo | Responsabilità |
| --- | --- |
| `presentation/AssetRegistry.js` | Caricamento di immagini e atlanti, verifica disponibilità e filtro lineare |
| `presentation/themes/office.js` | Catalogo delle skin e delle dimensioni visive, senza coordinate del livello |
| `presentation/ActorSkin.js` | Sprite visivo sincronizzato con un'entità fisica esistente |
| `presentation/OfficePresentation.js` | Tema dell'ufficio, fondale, superfici, oggetti, pozze e scelta dei frame |
| `presentation/OfficeDressing.js` | Arredi posteriori e primo piano con parallax, separati dalla geometria giocabile |
| `presentation/ViewportController.js` | Dimensioni del canvas, camera, densità, safe area e resize |
| `presentation/HdHUD.js` | HUD moderno attraverso i metodi pubblici usati da UIScene |
| `presentation/TouchControls.js` | Joystick e azioni che producono lo stesso stato di InputController |
| `systems/InputMode.js` | Politica comune per puntatore, tastiera e transizioni |

Il livello seleziona il tema con `visualTheme: 'office-hd'`. Le coordinate restano in `levels/level1_1.js`: le skin non contengono una seconda copia della mappa.

`LevelBuilder` conserva i collider e delega al tema le parti visive. `ActorSkin` lascia attive fisica, AI e animazioni del vecchio sprite; lo esclude dal rendering della camera e mostra un'immagine HD sincronizzata. Copia posizione, origine, direzione, trasparenza, tint e distruzione. Le interazioni puntatore dei terminali vengono inoltrate allo stesso oggetto di gioco.

I sistemi di salute, stress, quiz, checkpoint, armi, festa e progressione restano quelli del gioco. Le altre modifiche locali relative al bonus L'ultima mail sono conservate.

Durante il collaudo sono state corrette due entità fisse della baseline: fotocopiatrici e armadi avevano gravità attiva insieme al body immovibile e attraversavano il terreno. Ora conservano la posizione prevista dalla mappa. Il tema dichiara inoltre il riferimento di scala del cliente che compare dalla scrivania, evitando che la sua scala iniziale compressa ingrandisca la skin durante l'animazione.

## Animazioni

Ogni personaggio dispone di **20 frame**: otto pose generali nell'atlante comune e dodici nel proprio atlante di movimento.

- La corsa usa un ciclo di **8 frame**, a 10 frame/s durante la camminata e 16 durante la corsa.
- Riposo, ammiccamento, attacco e atterraggio hanno frame dedicati.
- Salto, accovacciamento, scivolata, scala e danno usano le pose dell'atlante comune.
- La fase dell'animazione è separata dal movimento fisico: aumentare i frame non modifica velocità o salto.

Le animazioni del tema si basano sul clock di scena, quindi rispettano la pausa. Le celle dei personaggi mantengono la dimensione originale nel manifest per limitare variazioni di scala tra pose.

## Asset e resa

Le immagini sono in `public/assets/hd-office`; le relative specifiche sono in [PROMPTS-ASSETS.md](concepts/PROMPTS-ASSETS.md) e nel [prompt degli arredi aggiuntivi](concepts/PROMPT-ARREDI-CONCEPT.md). Sono asset distinti: fondale, arredi, personaggi, nemici, animazioni e pozza di spumante.

Il fondale occupa il campo della camera e scorre orizzontalmente con parallax. Gli arredi giocabili, la geometria, gli oggetti e i personaggi rimangono indipendenti. Ombre e luci principali sono dipinte negli asset. I buchi del pavimento hanno una separazione scura per rendere visibili le cadute.

Gli atlanti derivano dalle immagini originali attraverso `scripts/build-hd-atlases.py`: lo script legge il canale alpha e scrive solo rettangoli e metadati JSON. I pixel non vengono ricampionati. Il progetto contiene già i manifest pronti per Phaser.

### Revisione delle proporzioni rispetto al concept

La prima integrazione aveva personaggi e oggetti troppo piccoli rispetto al fondale. La camera ora usa uno zoom di base **1,95** su PC e mobile, con anticipo nella direzione del movimento. La skin del protagonista misura 46 unità logiche: a 1600×900 la sagoma in piedi è circa 170 pixel, vicina al riferimento, anziché una miniatura sullo sfondo.

L'atlante `office-dressing` aggiunge sei elementi ricavati dallo stesso riferimento: postazione arredata, documenti e scatole, bacheca, scrivania sfocata in primo piano, pianta sfocata e ripiano attrezzato. Le posizioni degli arredi sono in `level.art.dressing`; non creano collider. Le scrivanie alte usano ripiani con staffe. Il pavimento separa bordo e fascia verticale per evitare una cornice sproporzionata. Il primo piano resta sotto il percorso, senza coprire le buche.

L'HUD segue le proporzioni del concept con valori prima delle barre, riflessi sulle barre e fascia superiore più compatta. I comandi mobili sono disposti sulla stessa riga, sotto il percorso. La porta della festa e le etichette dei terminali sono dimensionate per la nuova camera. Il primo albero è riposizionato solo nella composizione visiva; oggetti interattivi, progressione e collisioni conservano le coordinate precedenti.

La classe CSS `hd-rendering` applica il filtro appropriato al canvas del tema HD. Viene rimossa quando il primo livello termina o viene abbandonato. Le texture classiche non vengono sostituite globalmente.

## Risoluzione e prestazioni

La simulazione conserva l'altezza logica 450. Il canvas segue la forma del contenitore; larghezza logica e zoom vengono adattati senza cambiare la mappa. La camera limita l'aumento del campo visivo sui display molto larghi.

La densità del rendering dipende da altezza effettiva e DPR, con limite **3 su PC** e **2,5 in modalità touch**. Non equivale alla massima risoluzione fisica di ogni display. HUD e controlli vengono riposizionati durante resize, cambi di input e fullscreen; la safe area deriva dalle variabili CSS del dispositivo.

Gli asset HD occupano circa **11,1 MB** su disco. Il precache della build locale include anche il motore e gli altri asset del progetto. Ogni PNG è sotto il limite di 5 MiB per file configurato per Workbox. La build include i manifest JSON nel precache.

## Verifiche effettuate

- Build di produzione e generazione PWA riuscite.
- Nove test superati: tre sui contratti degli atlanti HD e sei sul minigioco già presente nelle altre modifiche locali.
- Avvio del primo stage, briefing, movimento, salto, pausa e ritorno al menu.
- Lettura di più frame di corsa di Jack e Wendy durante movimento reale.
- Prova desktop a 1366×768, resize a 1920×1080 e fullscreen reale.
- Attivazione fullscreen con F e uscita con Esc, conservando lo stato.
- Interfaccia mobile a 932×430 con salto attivato dal pulsante virtuale.
- Avvio dello stage 1-2 dopo il tema HD, con rimozione della classe e delle skin HD.
- Nessun errore o avviso nei log raccolti durante queste prove.
- Confronto prima/dopo durante lo scorrimento: le cinque fotocopiatrici/armadi mantengono le coordinate previste, compresa y 386, dopo la correzione della gravità.

La diagnostica di sviluppo ha mostrato circa **60 fps nell'ambiente browser di prova**. Non è una misura di un telefono fisico. Restano da collaudare hardware Android/iOS, multitouch reale, sessioni prolungate e installazione/offline sui dispositivi di destinazione.

La revisione delle proporzioni è verificata a **1600×900** e **932×430**: avvio, movimento, salto, scorrimento e salto dal pulsante mobile. La diagnostica ha mostrato 60–61 fps; nessun nuovo errore nei log dell'ultima prova. Build PWA e nove test superati dopo le modifiche. Le nuove catture [PC](screenshots/livello-1-concept-pc.jpg) e [mobile simulato](screenshots/livello-1-concept-mobile.jpg) provengono dal gioco in esecuzione. Le precedenti catture PC, mobile e fullscreen rimangono archiviate per confronto.

## Estensione agli stage successivi

Per l'ufficio estivo, riusare personaggi, animazioni, oggetti, input e HUD, sostituendo fondale e decorazioni con un tema separato. Per mensa, sala riunioni, trasferte ed executive, conservare gli stessi contratti e aggiungere cataloghi di ambiente ed entità coerenti con la storia.

Non è necessario duplicare Player o GameScene per cambiare aspetto. Il nuovo tema può condividere AssetRegistry, ActorSkin e i componenti dell'interfaccia, mentre le meccaniche specifiche restano nei sistemi esistenti.


## Aggiornamento: campagna completa

Il 22 novembre 2026 il porting è stato esteso localmente a tutti i 19 stage e ai bonus dedicati. I numeri di dimensioni e test sopra descrivono la prima iterazione del solo ufficio. Per lo stato attuale leggere [PORTING_CAMPAGNA_HD.md](PORTING_CAMPAGNA_HD.md). La consegna Git della campagna completa è stata successivamente autorizzata su `max-hd/main`; il deploy resta separato.
