# L'indirizzo giusto — Roma EUR da OpenStreetMap

23 novembre 2026. La revisione sostituisce la città inventata con l'EUR e il laghetto, mantenendo la guida dall'alto e gli asset HD. Il [concept originale](concepts/TAXI-CITTA-APPROVATO.png) rimane il riferimento di stile; non rappresenta la nuova geometria.

L'estratto copre circa 3,73 × 3,45 km, EUR e collegamenti circostanti: 14.931 × 13.804 unità di gioco, 5.518 tratti stradali/pedonali e 2.546 sagome di edifici. Il perimetro del laghetto è il poligono OSM reale (131 punti). Il rettangolo comprende un margine esterno e non coincide esattamente con il confine amministrativo del quartiere. La camera segue il taxi; **24 veicoli** percorrono itinerari connessi e **48 pedoni** usano un ciclo di camminata di 12 fotogrammi.

Missione: partenza in Viale America, vicino al laghetto; prima fermata al Palazzo dei Congressi, in Piazza John Kennedy; il cliente sposta poi l'appuntamento al Palazzo della Civiltà Italiana. **Sette minuti** a disposizione. In anteprima è disponibile **Esplora senza timer**, che conserva i danni al taxi.

Controlli PC: frecce/WASD, SPAZIO freno, E arrivo, M mappa, P/ESC pausa, F fullscreen. Pedali e sterzo compaiono con input touch; PC utilizza lo schermo senza pulsantiera di guida. Anteprima diretta: `?bonus=taxi`. L'accesso nella campagna rimane nel 4-1 e conserva il premio una sola volta.

Asfalto scuro, cordoli chiari, marciapiedi continui e attraversamenti a strisce distinguono le superfici. Parchi, passeggiate e sponde sono separati dalle carreggiate. Gli edifici conservano sagome e cortili OSM; tetti, lucernari, facciate, finestre e ombre seguono l'orientamento di ciascuna sagoma. Per 385 edifici sono disponibili piani o altezza: questi dati guidano la rappresentazione, con profondità compressa per non coprire la strada. Dove mancano, si usano valori illustrativi. Materiali, finestre e vegetazione non sono rilievi fotografici.

**Semafori:** 99 punti OSM nell'estratto, di cui quelli collegati alle strade percorribili generano 127 approcci controllati. I pali sono disegnati sul bordo della carreggiata e le linee d'arresto sono orientate sulla strada. Il taxi e gli NPC si fermano prima della linea anche mantenendo premuto l'acceleratore. Verde, giallo e intervallo di rosso su entrambe le direttrici evitano verdi incrociati; le auto già oltre la linea possono liberare l'incrocio. Direzioni OSM `forward/backward` e sensi unici sono rispettati per gli approcci mappati. Raggruppamento, arretramento delle linee e tempi sono adattamenti arcade, non i tempi dei semafori reali.

Implementazione: `CityTaxiScene.js`, `TaxiDrive.js`, `TaxiCity.js`, `TaxiSignals.js`, `RomeCityRenderer.js`, `CityBuildings.js`. Il fondale è generato per settori di 512 unità, con texture 1026 × 1026 (un'unità di sovrapposizione elimina le fessure allo zoom frazionario) e cache di 12 settori o del numero minimo necessario a coprire il viewport. Gli atlas sono caricati all'ingresso; la mappa vettoriale è attualmente inclusa nel bundle JavaScript. La build segnala quindi un bundle principale di circa 3,42 MB (0,92 MB gzip): resta un possibile intervento futuro il caricamento differito della mappa.

## Dati e riproducibilità

Il database derivato pubblico è [rome-map.json](../public/assets/hd-city-taxi/rome-map.json), con [licenza e attribuzione](../public/assets/hd-city-taxi/ROME-MAP-LICENSE.txt). Dati © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL 1.0; nessuna immagine delle tile è scaricata. L'attribuzione è sempre visibile nel gioco.

- Bbox: sud 41.8145, ovest 12.4465, nord 41.8455, est 12.4915.
- Geometria principale: snapshot 2026-11-23T12:28:05Z. Semafori: API OSM map, recuperati il 23 novembre 2026.
- Script: `python scripts/import_rome_taxi.py --download`, oppure passare un estratto Overpass già salvato. Il Palazzo della Civiltà Italiana viene integrato come multipoligono se assente dalla prima risposta.
- Copia grezza locale usata: `E:\Repos\max\corporate-odyssey-eur-source-20261123.json`, esterna al repository. Il database derivato necessario al gioco è invece nel repository.

Verifica della revisione: **20 test dedicati al taxi e agli altri nuovi minigiochi**, ripetuti sulla copia isolata dei file destinati al commit. Verificati arresto/ripartenza al semaforo a 30 e 120 Hz, coda degli NPC, direzioni OSM, pausa, guida libera e completamento delle due fermate. La precedente verifica complessiva del workspace aveva superato 87 test; comprendeva anche lavorazioni parallele. Build di produzione completata. Le prove in browser sono verifiche locali, non misurazioni su telefono fisico.

## Asset e prompt

Anteprima locale della revisione EUR: [prova diretta del taxi](http://127.0.0.1:8106/?bonus=taxi). Per forzare la pulsantiera mobile: aggiungere `&controls=touch`. Revisione salvata con un commit locale dedicato al taxi, alla mappa e alla relativa documentazione. Nessun push o pubblicazione Sites.

In Chrome verificati avvio, movimento del taxi, rendering dei segnali e degli edifici, apertura/chiusura della mappa, layout PC 1920 × 945 e mobile 844 × 390 con comandi touch forzati. Nessun errore o warning nella console del browser durante queste prove. Gli arresti esatti al rosso e la ripartenza sono coperti anche dai test automatici. [Vista PC EUR](screenshots/taxi-eur-pc.jpg) · [Vista mobile EUR](screenshots/taxi-eur-mobile.jpg) · [Mappa con laghetto](screenshots/taxi-eur-map.jpg).

[Asset EUR e prompt](concepts/PROMPT-TAXI-EUR-OSM.md). Le precedenti [schermate PC](screenshots/taxi-city-pc.jpg) e [mobile](screenshots/taxi-city-mobile.jpg) documentano la città inventata e non la revisione EUR.

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
