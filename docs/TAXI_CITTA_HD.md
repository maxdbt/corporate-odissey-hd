# L'indirizzo giusto — città HD

23 novembre 2026. Prima versione giocabile della città inventata, sviluppata dopo l'approvazione del [concept](concepts/TAXI-CITTA-APPROVATO.png). Non usa OpenStreetMap.

La città misura 2520 × 2520 unità, con nove isolati, parco, caffè, palazzi residenziali e due sedi. La camera segue il taxi; diciotto auto reagiscono ai semafori e trentasei passanti camminano con dodici fotogrammi. Collisioni con limiti stradali, cantiere e traffico. Gli arredi sui marciapiedi sono decorativi, fuori dalla carreggiata percorribile.

Missione: raggiungere Piazza Milano 12, fermarsi e confermare l'arrivo; il cliente indica quindi Via Verdi 8. Quattro minuti a disposizione. In anteprima è disponibile anche **Esplora senza timer**. La modalità libera toglie il timer, non i danni al taxi.

Controlli PC: frecce/WASD, SPAZIO freno, E arrivo, M mappa, P/ESC pausa, F fullscreen. Pedali e sterzo compaiono con input touch; PC utilizza lo schermo senza pulsantiera di guida. Anteprima diretta: `?bonus=taxi`. L'accesso nella campagna rimane nel 4-1 e conserva il premio una sola volta.

Implementazione: `CityTaxiScene.js`, `TaxiDrive.js`, `TaxiCity.js`. Asset caricati all'ingresso, esclusi dal precaricamento iniziale PWA. I PNG originali restano invariati; gli atlas JSON indicano i ritagli.

Verifica della revisione minigiochi: 65 test passati, inclusa una missione completa con guida, traffico e due indirizzi. Controllati collisioni, pausa, segnali, modalità senza timer e limiti delle texture. È una prima versione da provare: geometria delle strade regolare, traffico semplificato, nessuna simulazione completa di città.

## Asset e prompt

Build locale verificata: [prova diretta del taxi](http://127.0.0.1:8098/?bonus=taxi). In Chrome controllati guida con tastiera, scorrimento della camera, acceleratore e freno con pulsanti a 844 × 390; nessun errore nella console durante queste prove. Non è una prova su telefono fisico. Commit e push Git richiesti dall’utente; pubblicazione Sites separata.

[Schermata PC](screenshots/taxi-city-pc.jpg) · [Schermata mobile](screenshots/taxi-city-mobile.jpg)

Generazione tramite imagegen integrato. File in `public/assets/hd-city-taxi/`.

### buildings

[PNG](../public/assets/hd-city-taxi/buildings.png) · [Atlas](../public/assets/hd-city-taxi/buildings.json)

> Use case: stylized-concept. Production sprite atlas for the approved Corporate Odyssey Italian city driving game: premium richly detailed painted HD illustration, warm afternoon, terracotta and sandstone with teal glass. EXACTLY FOUR separate complete building compounds, 2 columns by 2 rows, equal square cells in a 2048x2048 square transparent canvas. Camera near-vertical overhead orthographic, small front facade visible on SOUTH side, roofs dominant, consistent with overhead 2D GTA-like city navigation but NOT pixel art. Each building entirely contained in its quadrant with generous 60px transparent margins, no cell borders. Top left: Milanese cream stucco U-shaped residential palazzo enclosing a lush inner courtyard, complex terracotta tiled roof, dormers and chimneys, south facade balconies. Top right: elegant large modern corporate headquarters, teal glass, rooftop HVAC and skylights, clearly legible south entrance canopy and little entrance steps. Bottom left: charming corner stone palazzo containing a cafe, weathered red roof, awnings, windows, cafe doorway along south facade. Bottom right: two connected ornate warm ochre apartment buildings with terracotta roofs and a narrow inner garden, roof terraces and plants. Rich materials, architectural details, realistic sunlit edges, game-ready clear silhouettes. Transparent outside building compounds, NO streets or ground plane extending outside footprints, no cars, no pedestrians, no text, no labels, no perspective horizon. Genuine alpha transparency.

### props

[PNG](../public/assets/hd-city-taxi/props.png) · [Atlas](../public/assets/hd-city-taxi/props.json)

> Use case: stylized-concept. Production environment props for a premium HD hand-painted 2D Italian city driving game. Square 2048x2048 canvas, EXACTLY FOUR isolated objects arranged in a 2x2 equal-cell atlas with transparent background and generous margins. Near-vertical overhead orthographic camera, roof/top dominant, slight southern faces visible. Warm afternoon lighting, realistic rich materials, smooth illustration matching a detailed Milan city game. TOP LEFT: a complete compact square urban garden island, stone perimeter, winding cream gravel paths, central circular turquoise fountain with little statue, green lawns, benches and varied trees, entire island inside its cell. TOP RIGHT: a single large lush rounded plane-tree canopy seen from overhead, warm sunlit varied green leaves, softly visible small trunk, nothing else. BOTTOM LEFT: outdoor cafe terrace grouping, four round tables and chairs under TWO ivory umbrellas, small flower planters, no people, no underlying background. BOTTOM RIGHT: a long elegant glass-roofed bus shelter with metal supports, bench and route display, seen from directly above, no text. All four complete and separate, genuine transparent background outside the objects, no grid lines, no UI, no cars, no pixel art.

### pedestrians

[PNG](../public/assets/hd-city-taxi/pedestrians.png) · [Atlas](../public/assets/hd-city-taxi/pedestrians.json)

> Use case: stylized-concept. Game animation sprite sheet: EXACTLY TWELVE animation frames of ONE same adult office pedestrian walking north (toward top of image), strict directly overhead camera with head shoulders arms and shoes seen from above. Grid exactly SIX COLUMNS and TWO ROWS, equal cells on 1536x1024 transparent canvas; each frame fully centered in its own cell with generous transparent margins. Navy blazer, light blue shirt, tan trousers, brown hair, small messenger bag. The twelve successive poses form one complete fluid walking cycle with clearly alternating extended feet and counter-swinging arms, left and right foot plants and passing poses. Consistent person, proportions, scale and top-down orientation across all frames. High quality painted HD game art, realistic detail, crisp smooth edges, warm sunlight, no pixel art, no text, no labels, no backgrounds, no grid lines, no ground shadows. Frame order left-to-right, top row then bottom row. Genuine transparency.
