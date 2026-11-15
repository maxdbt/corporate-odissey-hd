# Sviluppo e pubblicazione

## Requisiti e installazione

Il workflow GitHub usa Node.js 22. Serve npm e un browser; il gioco non richiede un servizio applicativo separato.

```powershell
cd E:\Repos\max\corporate-odyssey
npm ci
npm run dev
```

`npm ci` usa il lockfile. Aggiornare dipendenze e lockfile è un'operazione distinta dalla semplice installazione.

| Comando | Risultato |
| --- | --- |
| `npm start` | Equivalente allo sviluppo |
| `npm run dev` | Vite, porta configurata 8080, apertura browser, accesso di rete con `--host` |
| `npm run build` | Build statica e PWA nella cartella ignorata `dist` |
| `npm run preview` | Anteprima della build; leggere l'indirizzo stampato da Vite |

Per lavorare solo in locale, avviare Vite con host `127.0.0.1`. Per provare dal telefono, lo script standard espone il server sulla rete: usare l'indirizzo Network mostrato da Vite, con computer e telefono sulla stessa rete raggiungibile. Le funzioni che richiedono un contesto sicuro, come il service worker, vanno provate in un ambiente HTTPS appropriato o sul localhost del dispositivo.

## Controlli attuali

| Azione | Tastiera | Touch |
| --- | --- | --- |
| Movimento | Frecce o WASD | Joystick a sinistra |
| Scale e accovacciamento | Su / giù | Direzione verticale del joystick |
| Salto e doppio salto | Spazio o Z | SALTA |
| Corsa | X | Tenere SCIVOLA |
| Scivolata | Giù + X in movimento | Premere SCIVOLA |
| Attacco con dispositivo | C o Q | ATTACCA |
| Cambio arma | V o E | Toccare l'icona dell'arma |
| Briefing | I | Pulsante i |
| Pausa | P | Pulsante II |
| Uscita dalla partita | Esc | Opzioni dei menu |
| Audio durante la partita | M | Opzioni dell'interfaccia |

Il menu consente la selezione del personaggio e degli scenari. Il fullscreen è disponibile tramite il comando nel menu e nella pausa, se il browser lo supporta; nella pausa è associato anche a F. Il comportamento PC richiesto per il porting HD è specificato nel [prompt dedicato](PROMPT_PORTING_LIVELLO_1.md).

## Parametri di sviluppo

- Il primo livello usa normalmente il tema HD. `?graphics=classic` ripristina la presentazione originale per il confronto.
- `?controls=touch` e `?controls=keyboard` forzano l'interfaccia del tema HD durante le prove. Senza parametro, la scelta è automatica; la simulazione non sostituisce un telefono fisico.

- `?mobile=1` forza il pannello di benvenuto mobile nel menu; non emula l'intero dispositivo, il DPR o il tipo di puntatore.
- `?level=N` viene letto da `GameScene.init()` una sola volta per caricamento di pagina. N è l'indice da zero di `LEVELS`; la query agisce quando GameScene viene avviata, non salta automaticamente il menu. Usare soltanto indici di livelli gestiti da GameScene, non di scene statiche.
- `TRIP_STAGES_IN_MENU` in `constants.js` abilita la selezione delle tappe della trasferta; nella baseline è `false`.
- `window.__game` espone l'istanza Phaser per il debug locale.
- La fisica Arcade ha `debug: false` in `main.js`.

## Modifica dei contenuti

### Livelli

Partire da `src/levels/level1_1.js` e dai commenti di `LevelBuilder.js`. Le coordinate della mappa sono logiche; le colonne del terreno sono espresse in tile da 32 unità, mentre scrivanie, oggetti e zone usano coordinate del mondo.

Per aggiungere un livello, aggiornare insieme `LEVEL_META` in `constants.js`, gli import e l'array in `levels/index.js`, il briefing e, se necessario, il routing di `Trip.js`. L'ordine di metadati e dati deve coincidere.

### Entità e grafica

Un nuovo nemico deve essere registrato nella factory e usare i gruppi della scena. Configurare il body dopo l'aggiunta al gruppo, perché l'aggiunta può reimpostarne le opzioni. Usare le chiavi condivise di texture e animazioni e mantenere distinti sprite e geometria fisica.

La grafica di base viene generata da `BootScene` e `src/gfx`; gli sfondi da `Backgrounds.js`. Il [contratto di architettura](ARCHITECTURE.md) dettaglia metodi, eventi e payload.

### Quiz

`src/data/quizzes.js` contiene i quiz e la selezione per ambientazione. `QuizScene` invia gli effetti a `GameScene.applyEffects()`. Le modifiche alla salute o alle risorse devono passare attraverso gli helper di `GameState` quando previsti.

## Build e pubblicazione

Il workflow `.github/workflows/deploy.yml` parte quando viene pubblicata una **GitHub Release** oppure manualmente con **Run workflow**. Un normale push su main non avvia il deploy.

La pipeline esegue checkout, configurazione Node.js 22, `npm ci`, `npm run build`, caricamento di `dist` e deploy su GitHub Pages. Richiede Pages configurato per GitHub Actions. `base: './'` mantiene relativi gli URL della build.

La versione visualizzata o registrata è `package.json.version`, passata al codice come `__APP_VERSION__`. La creazione di un tag, da sola, non sincronizza il campo nel package.

## PWA e aggiornamenti

La PWA usa manifest fullscreen e orientamento landscape. Il service worker viene registrato dopo l'avvio del gioco e conserva gli asset previsti dalla configurazione. Una nuova versione propone il banner «NUOVA VERSIONE - AGGIORNA»; il ricaricamento avviene quando il giocatore lo attiva.

Il server di sviluppo non abilita il service worker. Per una prova locale:

```powershell
npm run build
npm run preview
```

Controllare una prima visita online, una visita offline successiva, l'installazione quando proposta dal browser e l'aggiornamento tra due build. L'icona di installazione dipende dalle capacità e condizioni del browser.

## Verifica prima di una modifica grafica

1. Eseguire la build e aprire il primo livello.
2. Provare camminata, salto, doppio salto, corsa, scivolata, tiro e cambio arma.
3. Verificare piattaforme attraversabili, pozze, danni, checkpoint, quiz e porta della festa.
4. Provare pausa, ritorno al menu, ripartenza e uscita dal livello.
5. Ripetere su desktop con mouse e tastiera e su telefono con multitouch.
6. Verificare resize, orientamento, fullscreen e caricamento offline della build.

Una simulazione del viewport verifica il layout; una misura delle prestazioni mobili richiede un dispositivo fisico.

## Controlli automatici e asset HD

```powershell
node --test tests/hd-assets.test.js tests/last-mail.test.js
```

Gli atlanti JSON sono già nel repository e non richiedono Python durante l'avvio o la build. Dopo un aggiornamento delle immagini, `scripts/build-hd-atlases.py` rigenera i metadati usando Pillow, senza modificare i pixel delle immagini. `scripts/create-concept-pdf.py` rigenera le cinque tavole per il cliente con ReportLab, Pillow, pypdf e i font Segoe UI di Windows.
