# Animazioni HD, creature e mezzi

Aggiornamento del 23 novembre 2026. Le immagini mantengono lo stile 2D illustrato approvato, con contorni morbidi, ombre dipinte e trasparenza. Il rendering sostituisce gli sprite originali senza cambiare le collisioni, il costo dei mezzi o i danni.

## Conteggi e copertura

| Famiglia | Fotogrammi | Comportamento |
| --- | --- | --- |
| Jack e Wendy a piedi | 16 ciascuno | Locomozione legata alla distanza percorsa |
| Ballo di Natale: Jack, Wendy e cinque colleghi distinti | 12 ciascuno | Coreografie dedicate sul posto, sincronizzate al brano; [revisione e collaudo](REVISIONE_SCENE_HD.md) |
| Jack e Wendy in mare | 12 ciascuno | Nuoto con costume, bombola, maschera e pinne |
| Otto archetipi di colleghi | 12 ciascuno | Sei pose e sei nuovi intermedi, intercalati |
| Squali, meduse, pinguini, cani, pupazzi di neve, pesci, granchi | 12 per ciclo | Coda, pinne, tentacoli, zampe e gesti |
| Cuochi, hostess, consulenti, passeggeri e commensali | 12 per ciclo | Cammino, digitazione, lettura, gesti, respirazione e pasto |
| Boss | 24 per forma | 12 di movimento/gesti e 12 aggiuntivi di azione e recupero |
| Mostro del bagno | 12 | Anticipazione, bocca aperta, morso, masticazione e soddisfazione |
| Personaggio a bordo | 12 per mezzo e per protagonista | Composizione unica con posa coerente del pilota/passeggero |

I numeri indicano fotogrammi disegnati, non dodici azioni differenti. Le pose istantanee del protagonista (ferita, salto, accovacciamento) restano stati separati; muri, scrivanie e oggetti inanimati non ricevono un ciclo di cammino.

## Boss

Il Cliente dall'Inferno e il Mega-Direttore attivano l'atlante aggiuntivo all'inizio del loro schema di attacco. Mummia, orso e polpo della negoziazione lo attivano quando lanciano l'attacco. Il direttore conserva forme in piedi e seduta. Faraone, pinguino e sirena alternano i propri gesti di dialogo.

`beginBossAction(source, at, duration)` registra un segnale visivo. `entityMotionSpec` seleziona e completa la sequenza, poi ritorna al ciclo base. Il tempo è quello della scena: la pausa ferma anche i frame. La temporizzazione della fisica resta autoritativa.

## Mezzi e sovrapposizioni

`MountSkins.js` risolve una sola composizione animata di mezzo e personaggio per dromedario, moto, taxi, slitta con husky, motoslitta, sci, sottomarino e cavalluccio marino. Il dromedario turbo ha un atlante di volo con ali; pinne e maschera usano direttamente il ciclo del sub.

Finché la composizione è disponibile, il livello di presentazione nasconde le immagini accessorie originali del mezzo, della maschera e delle ali: non vengono disegnate sopra il personaggio a piedi. I mezzi parcheggiati restano visibili. La discesa o caduta ripristina la normale rappresentazione del protagonista e il mezzo abbandonato segue il suo effetto originale.

L'ancora della slitta segue la posizione del conducente anche quando si cambia direzione. La base della composizione segue il fondo del corpo fisico; `mount.cfg.lift` è il ripiego prima che il corpo sia disponibile. I metadati degli atlanti dei mezzi rimuovono i margini trasparenti comuni, mantenendo scala e appoggio costanti senza modificare i PNG.

Nel mare i due protagonisti indossano sempre attrezzatura subacquea. Il costume messo in valigia conserva il vantaggio di velocità; in sua assenza il testo parla di attrezzatura di scorta.

## Architettura e riuso

- `MotionCatalog.js`: alias delle texture originali, cicli delle entità, orientamento dell'illustrazione, segnali dei boss e avanzamento per distanza.
- `MountSkins.js`: composizioni a bordo, frame, orientamento, ancore e riconoscimento degli accessori da nascondere.
- `ActorSkin.js`: rappresentazione HD che segue trasformazione, tinta, visibilità e distruzione dell'entità originale.
- `OfficePresentation.js`: protagonisti, creature, boss e mezzi nei livelli platform.
- `StaticStagePresentation.js`: scene di viaggio, dialoghi e negoziazione, con gli stessi cataloghi.
- `AssetPacks.js` e `AssetRegistry.js`: caricamento per ambientazione e rilascio dei pacchetti temporanei; una scena padre in pausa conserva i propri asset.
- `scripts/hd-motion-sheets.json`: ordine dei personaggi nelle nuove griglie 6×4.
- `scripts/build-hd-atlases.py`: legge alpha e scrive JSON Phaser. I PNG originali restano invariati.

## Aggiungere un ciclo

1. Produrre pose realmente diverse nello stile approvato, con scala, piede e margini costanti. Usare alpha trasparente e verificare gli aloni su un fondale scuro.
2. Copiare il PNG in `public/assets/hd-worlds` e registrare i nomi in `scripts/hd-motion-sheets.json`. Due personaggi: dodici pose ciascuno, prime due righe e ultime due righe.
3. Eseguire `python scripts/build-hd-atlases.py`.
4. Aggiungere alias e tipo di riproduzione in `MotionCatalog.js`, oppure il mezzo in `MountSkins.js`.
5. Registrare il pacchetto solo nei temi che lo usano. Verificare anche i proiettili animati e le scene statiche.
6. Eseguire i test, la build e una prova reale di movimento, pausa, inversione e cambio scena.

Non moltiplicare immagini identiche per raggiungere il conteggio. Il ciclo di locomozione usa la distanza e non avanza quando un ostacolo blocca il personaggio; il nuoto e i gesti usano il tempo della scena.

## Asset, prestazioni e PWA

Gli atlanti sono caricati per livello; i nuovi pacchetti pesanti sono temporanei e vengono liberati quando nessuna scena attiva o sospesa li usa. Le immagini dei mondi non fanno parte del precache iniziale: vengono scaricate alla visita. I controlli verificano PNG RGBA, dimensioni entro 4096 px e file sotto 5 MiB.

La PWA mantiene in cache solo una parte dei mondi visitati: la presenza di tutti i livelli online non implica che l'intera campagna sia disponibile offline senza download.

## Prompt e collaudo

I prompt e i percorsi finali sono in [PROMPTS-ANIMAZIONI-HD.md](concepts/PROMPTS-ANIMAZIONI-HD.md). Il catalogo degli asset e i test sono il riferimento per i conteggi effettivi.

Il collaudo dell'aggiornamento include test automatici di selezione dei frame, avanzamento, pausa, azioni dei boss e composizioni dei mezzi, più prove browser di mare, noleggio, bagno, personaggi e boss. I risultati finali sono registrati nel resoconto di pubblicazione. Non è una misura delle prestazioni su telefono fisico.

## Collaudo del 23 novembre 2026

- 25 test automatici superati, compresi scelta dei 12/16/24 frame, pausa, discesa dai mezzi, soppressione degli accessori e allineamento al corpo fisico.
- Build Vite di produzione riuscita; 134 moduli e 44 risorse nel precache iniziale.
- Browser desktop 1280×720: Wendy sul cavalluccio, inversione di direzione, pausa/ripresa, sottomarino con pilota dentro, taxi con passeggero, Jack sulla slitta con husky e movimento del Mega-Direttore.
- Browser 844×390 con controlli touch: noleggio tramite tocco e composizione del cavalluccio; HUD e comandi presenti.
- Mostro del bagno: ciclo illustrato, apertura della porta, morso e risultato verificati nel browser durante la lavorazione.
- Nessun errore console nel controllo della scena marina. I test verificano anche la copertura di squali, meduse, passeggeri, boss e tutti i mezzi.

Prova visiva: [cavalluccio HD](qa/seahorse-hd-20261123.jpg). Il collaudo è mirato alle modifiche, non una nuova partita completa di tutti i livelli né una misura su telefono fisico.

La consegna è stata preparata nel worktree `E:/Repos/max/corporate-odyssey-animation-release`, dal commit `89a24de`, per non includere modifiche separate ad audio e minigolf ancora presenti nella cartella principale.
