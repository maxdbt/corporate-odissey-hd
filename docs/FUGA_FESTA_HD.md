# Fuga dalla festa aziendale — salone e folla

23 novembre 2026. Revisione richiesta dopo il taxi HD: vista ravvicinata a tre quarti, salone illustrato a schermo pieno e personaggi proporzionati. Implementa il [concept approvato](concepts/FESTA-FOLLA-APPROVATO.png) con un nuovo fondale senza figure statiche, arredi separati e personaggi dipinti con proporzioni adulte. La sala è visibile nel suo insieme sui display larghi; su quelli stretti la camera accompagna il protagonista.

- **24 colleghi** attraversano la sala; sei cercano di raggiungere il giocatore, tre sorvegliano il passaggio. Corpi, tavoli e vasi impediscono di attraversarli; i colleghi non si sovrappongono fra loro. Le battute indicano quando un collega cerca di trattenerlo.
- Recuperare cappotto e chiavi e raggiungere la porta entro 150 secondi. Cappotto al guardaroba sinistro (235, 615), chiavi sul tavolino in basso al centro (850, 815), uscita in alto a destra (1480, 460): ogni coppia dista oltre 600 unità. Restare bloccati aumenta l'indicatore «Trattenuto»; al 100% il tentativo termina.
- Quattro distrazioni con un telefono allontanano i colleghi vicini per sei secondi. La distrazione non neutralizza chi si trova dall'altra parte della sala. Nascondersi presso le piante fa diminuire l'attenzione.
- **24 identità diverse**, una per collega: volti, capelli, corporature e abiti propri. Ogni ospite ha dodici pose; Jack e Wendy hanno dodici pose sia in abiti da festa sia con il cappotto: 28 fogli, **336 fotogrammi**. Raccogliere il cappotto cambia subito l'abito visibile del protagonista, anche durante la camminata.
- Movimento interpolato fra i passi della simulazione; avanzamento delle dodici pose legato alla distanza percorsa. I piedi sono allineati tramite metadati misurati sugli sprite. Le illustrazioni restano nitide senza sovrapporre due fotogrammi, evitando scie su volti e arti. Da fermi rimangono respiro e piccoli spostamenti del peso. La profondità segue la posizione dei piedi.
- PC: frecce/WASD o clic sul pavimento, SPAZIO distrazione, E nascondersi. La pulsantiera di movimento è nascosta. Touch: frecce, DISTRAI e NASCONDI; restano pausa e schermo intero.

Asset e prompt: [salone e prima serie](concepts/PROMPTS-FESTA-FOLLA.md), [cast completo e cappotti](concepts/PROMPTS-FESTA-PERSONAGGI.md). Generati con imagegen integrato, conservati in `public/assets/hd-party-escape/`: 30 PNG originali entro 2048 pixel e 5 MB per immagine; il gioco carica le copie WebP, **10,64 MiB complessivi**, solo all’ingresso. Asset esclusi dal precache iniziale PWA. `scripts/pack_party_art.py` codifica le immagini senza ridisegni o ridimensionamenti e misura gli ancoraggi. Il concept è solo documentazione.

Implementazione: `PartyEscapeScene` riusa il ciclo di vita di `StageBonusScene`; regole e collisioni sono in `src/bonus/new/PartyEscape.js`. Accesso dalla raccolta e dallo stage 1-1, con premio una volta sola e ripresa della campagna.

Verifica: percorso completo con comandi normali a 30 e 120 Hz; test di movimento della folla, identità distinte, inseguimento, collisione, distrazione locale, nascondiglio, distanza fra gli obiettivi, cappotto persistente e pausa dell'animazione. Layout Chrome desktop e touch a 844 × 390, senza errori nella console durante le prove. Non è una prova su telefono fisico; il bilanciamento va valutato giocando.

[Prova locale](http://127.0.0.1:8098/?bonus=party) · [Schermata PC](screenshots/party-crowd-pc.jpg) · [Schermata mobile](screenshots/party-crowd-mobile.jpg)
