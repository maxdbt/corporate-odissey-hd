# Introduzioni animate dei cinque mondi

Aggiornamento: **23 novembre 2026**.

Sono integrati localmente **dieci filmati da 15 secondi: un’introduzione per ciascuno dei cinque mondi, nelle versioni Jack e Wendy**. La scelta del personaggio determina sia il protagonista visibile sia la voce italiana. I filmati mantengono lo stile illustrato del concept approvato, con fondali dipinti dettagliati.

**Ambito concordato: soltanto i cinque mondi principali.** Le introduzioni non descrivono né modificano i bonus, oggetto di una revisione separata. Le 19 tappe della campagna, comprese scelte e tratte alternative, non generano 19 interruzioni cinematografiche.

## Catalogo attivo

| Mondo | Introduzione | Tappe coperte | Produzione |
| --- | --- | --- | --- |
| 1 | L’Open Space | 1-1 e 1-2 | Nuova scena nell’ufficio natalizio: il presunto giorno tranquillo diventa una prova di sopravvivenza |
| 2 | La Mensa | 2-1 | Pranzo servito «al volo»; Jack esistente, Wendy nuova |
| 3 | Il Limbo dei Post-it | 3-1 | Una breve call si riempie di modifiche; Jack esistente, Wendy nuova |
| 4 | La Trasferta | 4-1–4-10 | Il capo presenta le sedi; nessuna destinazione o mezzo viene scelto dal filmato |
| 5 | Il Piano degli Executive | 5-1–5-5 | Nuovo arrivo ai piani alti, incontro con la receptionist e ascensore |

L’apertura rappresenta il mondo nel suo complesso, anche quando dal menu viene avviata direttamente una tappa interna. L’Open Space usa la cornice natalizia del primo scenario; non cambia filmato passando a Estate d’Inferno.

Le vecchie clip **Estate d’Inferno** e **Il Mezzo** restano nell’archivio di produzione. Non vengono riprodotte automaticamente e non fanno parte del pacchetto attivo. I relativi bozzetti con Wendy sono conservati, senza generare ulteriori intro per queste tappe.

## Comportamento nel gioco

- Il menu avvia l’introduzione del mondo e del personaggio scelti; la scena giocabile parte solo alla fine o premendo **Salta**.
- Una clip conclusa o saltata viene ricordata per la coppia mondo/personaggio nella partita corrente. Tappe successive dello stesso mondo, rientri dai bonus e tentativi dal checkpoint non la ripetono.
- **Nuova partita** azzera questa memoria. **Rivedi intro** nel menu mostra il filmato del mondo/personaggio selezionati e torna al menu senza iniziare o modificare la partita.
- Durante il filmato non vengono inizializzati timer, fisica o spese della scena di destinazione. La musica del gioco è sospesa; si ascoltano dialoghi e ambiente del video.
- Controlli: pausa/ripresa, audio, sottotitoli italiani, qualità e schermo intero dove supportato. **Esc** salta; **P** pausa; **M** audio; **C** sottotitoli; **F** fullscreen.
- Cambiare scheda o perdere il focus mette in pausa il video; la ripresa richiede un’azione del giocatore.
- Se il browser impedisce l’avvio con audio, appare **Riproduci**. Su mobile il video resta inline.
- Un errore Full HD prova il 720p. Se anche questo manca, **Continua** permette di giocare. Un caricamento lento lascia sempre disponibile **Salta**.

Gli stati «visto» non vengono salvati permanentemente tra sessioni. La preferenza sottotitoli è locale al browser; il silenziamento usa l’impostazione audio del gioco.

## File distribuiti

Il runtime usa esclusivamente file nel repository, sotto [public/assets/intro](../public/assets/intro/). Non servono chiavi AI, account Runway o URL remoti firmati sul dispositivo del giocatore.

Ogni cartella contiene:

- **intro-1080p.mp4**: H.264, 1920×1080, 24 fps, AAC mono 48 kHz;
- **intro-mobile-720p.mp4**: H.264, 1280×720, AAC;
- **poster.jpg**: anteprima durante il caricamento;
- **italiano.vtt**: tre battute con tempi specifici della variante.

| Mondo | Jack — master | Wendy — master |
| --- | --- | --- |
| Open Space | [Video](../public/assets/intro/world-1/man/intro-1080p.mp4) | [Video](../public/assets/intro/world-1/woman/intro-1080p.mp4) |
| Mensa | [Video](../public/assets/intro/world-2/man/intro-1080p.mp4) | [Video](../public/assets/intro/world-2/woman/intro-1080p.mp4) |
| Riunione | [Video](../public/assets/intro/world-3/man/intro-1080p.mp4) | [Video](../public/assets/intro/world-3/woman/intro-1080p.mp4) |
| Trasferta | [Video](../public/assets/intro/world-4/man/intro-1080p.mp4) | [Video](../public/assets/intro/world-4/woman/intro-1080p.mp4) |
| Executive | [Video](../public/assets/intro/world-5/man/intro-1080p.mp4) | [Video](../public/assets/intro/world-5/woman/intro-1080p.mp4) |

Il [manifest](../public/assets/intro/manifest.json) contiene dimensioni e SHA-256 dei 40 file. Il pacchetto completo pesa circa **95,8 MB**, comprese entrambe le qualità e i protagonisti: non viene scaricato tutto all’avvio.

La qualità iniziale è 720p su dispositivi touch, viewport sotto 1000 px o connessioni con risparmio dati/2G; altrimenti Full HD. Viene richiesto soltanto il filmato corrente. I video hanno faststart.

La PWA esclude **tutta la cartella assets/intro** dal precache, anche poster e sottotitoli. Non è prevista una cache offline dedicata ai video: se il file manca, **Continua** consente di giocare. La cache HTTP ordinaria del browser resta indipendente.

## Collegamento al codice

- [IntroCatalog.js](../src/cinematics/IntroCatalog.js): cinque mondi, varianti man/woman, qualità e decisione di ingresso.
- [Trip.js](../src/systems/Trip.js): startLevel usa il catalogo; goNext conserva le diramazioni esistenti.
- [WorldIntroScene.js](../src/scenes/WorldIntroScene.js): ingresso unico, uscita protetta da chiamate duplicate e ripristino della scena corretta.
- [IntroView.js](../src/cinematics/IntroView.js) e [intro.css](../src/cinematics/intro.css): video DOM sopra Phaser, controlli, focus, caricamento ed errori.
- [GameState.js](../src/state/GameState.js): seenWorldIntros, azzerato dalla nuova partita.
- [MenuScene.js](../src/scenes/MenuScene.js): **Rivedi intro**, rispettando la selezione corrente.
- [GameAudioDirector.js](../src/audio/GameAudioDirector.js): priorità della scena introduttiva e sospensione dell’audio di gioco.
- [vite.config.js](../vite.config.js): esclusione dal precache.

Il passaggio al livello conserva scena e dati di destinazione; non sceglie trasporto o sede, non cambia budget e non consuma in anticipo i modificatori del livello. Una semplice anteprima dal menu non marca la clip come vista.

## Dialoghi

Stesso testo nelle due versioni; cambiano protagonista, voce, recitazione e tempi dei sottotitoli.

| Mondo | Protagonista | Interlocutore | Protagonista |
| --- | --- | --- | --- |
| Open Space | «Un altro giorno tranquillo in ufficio.» | Capo: «Certo. Solo qualche piccolo imprevisto.» | «Perfetto. Attivo la modalità sopravvivenza.» |
| Mensa | «Finalmente una pausa pranzo tranquilla.» | Cuoco: «Primo, secondo, contorno... al volo!» | «Qui anche il pranzo è una corsa.» |
| Riunione | «La riunione dura cinque minuti, giusto?» | Cliente: «Solo due modifiche. Anzi... altre venti.» | «Perfetto. Mi serve una scala di priorità.» |
| Trasferta | «Il cliente è vicino, vero?» | Capo: «Certo. Devi solo scegliere la sede.» | «Allora preparo una valigia di pazienza.» |
| Executive | «Quaranta piani. Quanto manca alla vetta?» | Receptionist: «Cinque prove. Il direttore la aspetta.» | «Spero almeno che l’ascensore funzioni.» |

## Voci e produzione

Il mix finale usa registrazioni originali ElevenLabs ed effetti ambientali separati. Le voci sono allineate senza cambiare altezza o velocità; l’audio sintetizzato dal modello video non viene usato nel master finale.

| Personaggio | Voce italiana | ID |
| --- | --- | --- |
| Jack | Alberto Arte — Bright and Expressive | HQ7Ez220YT02q2IAnVFl |
| Wendy | Alice — Expressive | yqYUuLveKQAg3xn3wYbI |
| Capo | Adriatico — Warm Italian Narrator | covxL85MSd0uUrktE45z |
| Cuoco | Alberto | dQgfccebCEXfELidhNvw |
| Cliente | Alessandro — Stoic, Breathy & Steady | PSp7S6ST9fDNXDwEzX0m |
| Receptionist | Alessandra — Elegant and Versatile | Ap2b3ZnSIW7h0QbBbxCq |

Ogni episodio comprende tre scene da cinque secondi. Produzione: ImageGen integrato per le immagini, Runway seedance-2.5 per l’animazione, eleven_v4 per il parlato e mirelo-sfx-2 per l’ambiente. Questi strumenti non sono dipendenze del gioco.

Wendy deriva dal suo sprite: capelli castani mossi, orecchini dorati, giacca verde petrolio, camicia bianca e gonna scura. Gli interlocutori mantengono identità e voce fra le versioni.

## Sorgenti e ricostruzione locale

Le sorgenti di lavorazione rimangono esterne al repository:

- [Nuova produzione](../../corporate-odyssey-media/world-intros-2026-11-23/plan.json): cartelle 01-man, 01-woman, 02-woman, 03-woman, 04-woman, 05-man, 05-woman.
- [Produzione precedente](../../corporate-odyssey-media/introduzioni-02-05-2026-11-23/storyboards.json): fornisce i tre master di Jack riutilizzati per Mensa, Riunione e Trasferta.
- [Pilota Estate](../../corporate-odyssey-media/estate-intro-pilot-2026-11-23/index.html): archivio aggiuntivo, escluso dall’ingresso dei mondi.

Ogni nuova cartella conserva production.json, keyframe.png, tre video sorgente, tre battute, ambiente, mix WAV, allineamento, SRT/VTT, master, versione mobile e versione con sottotitoli impressi. I file task-*.json conservano le richieste effettivamente inviate; i file di correzione documentano le revisioni.

Gli URL firmati nei metadati possono scadere. I file scaricati restano le sorgenti locali; i metadati remoti non vengono distribuiti nell’area pubblica del gioco.

Da **E:\Repos\max\corporate-odyssey-media\world-intros-2026-11-23**:

~~~powershell
python prepare_assets.py
python fetch_completed.py
python analyze_dialogue.py
python render_intros.py
python verify_final.py
python export_game_assets.py
~~~

Servono Python 3.12, numpy, imageio-ffmpeg e faster-whisper; il modello small deve essere già nella cache locale. Gli script non avviano nuove generazioni remote. Analisi/render/verifica saltano gli episodi con report già presente: per una revisione archiviare il report e le sorgenti precedenti prima di ricostruire.

L’esportazione copia solo le consegne completate e aggiorna il manifest. Non pubblica, non esegue commit e non effettua push.

## Verifica

[Test automatici](../tests/world-intros.test.js): mondi e protagonisti, conservazione di destinazione e risorse, checkpoint, memoria delle intro viste, qualità mobile, priorità audio e presenza dei media/sottotitoli.

~~~powershell
node --test tests/world-intros.test.js tests/audio.test.js
npm run build
~~~

La produzione conserva report di decodifica, durata, picchi audio e trascrizione approssimativa (render-complete.json e final-verification.json), oltre ai contatti di fotogrammi review.jpg. I master durano 15 secondi; il padding AAC porta l’audio decodificato a circa 15,019 secondi.

Collaudo di questa consegna: **20 test automatici superati e build Vite/PWA riuscita**. Il [report browser](../../corporate-odyssey-media/world-intros-2026-11-23/browser-integration-report.json) copre tutte le dieci varianti, fine naturale, salto, anteprima dal menu, passaggio tra mondi, mancata ripetizione nelle diramazioni, pausa, audio, sottotitoli, cambio qualità, perdita di focus, autoplay negato ed errore dei media. Verificato anche il layout touch 844×390 e la rotazione a 390×844, senza errori JavaScript rilevati.

Verifica dell'integrazione nel progetto principale, ripetuta il 23 novembre 2026: i 20 test mirati passano anche sul repository corrente; una nuova build Vite/PWA include tutte le dieci varianti. Dimensioni e SHA-256 dei 40 file coincidono con il manifest sia in `public` sia nella build; il service worker non li include nel precache. La build di verifica è in `../corporate-odyssey-media/world-intros-2026-11-23/build-project-integration`, per non sovrascrivere altre anteprime locali. Non è necessario copiare codice o media dall'anteprima al progetto: sono già integrati nel repository.

Verifica della consegna completa del 23 novembre 2026: **72 test superati** con `node --test tests/*.test.js` e build Vite/PWA riuscita, comprendendo menu, nuovi minigiochi e introduzioni. Dimensioni e SHA-256 dei 40 media coincidono con il manifest sia nei sorgenti sia in `dist`; i filmati restano esclusi dal precache. Git conserva i byte dei sottotitoli VTT senza conversione delle terminazioni di riga, per mantenere validi gli hash anche dopo un nuovo checkout.

La trascrizione automatica non certifica ogni parola o la precisione labiale. L’emulazione mobile non sostituisce un collaudo su iPhone/Android fisici. La pubblicazione del sito resta un’operazione separata dal commit e dal push dei sorgenti su GitHub.

## Riferimenti

- [Indice](README.md).
- [Architettura e ciclo di vita delle intro](ARCHITECTURE.md#introduzioni-dei-mondi--integrazione-locale-del-23-novembre-2026).
- [Sviluppo e manutenzione dei filmati](DEVELOPMENT.md#introduzioni-animate-dei-cinque-mondi).
- [Stato della campagna](CAMPAGNA_HD_STATO.md).
- [Campagna e diramazioni](PORTING_CAMPAGNA_HD.md).
