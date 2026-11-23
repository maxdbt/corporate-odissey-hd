# Taxi — EUR, geometria OSM e monumenti HD

23 novembre 2026. Direzione approvata: Roma EUR, laghetto compreso; strade e marciapiedi leggibili; almeno 20 veicoli e 10 pedoni. Implementati 24 veicoli e 48 pedoni. Dettagli tecnici e licenza: [documentazione del taxi](../TAXI_CITTA_HD.md).

## Asset dei monumenti

Generazione tramite ImageGen integrato. L'immagine prodotta è un PNG RGBA **1254 × 1254**, circa 2,18 MB, con quattro celle 627 × 627. Il prompt richiedeva 2048 × 2048, ma il file effettivamente restituito e utilizzato misura 1254 × 1254. Nessun ridimensionamento o ritocco dell'immagine è stato applicato.

- [PNG](../../public/assets/hd-city-taxi/eur-buildings.png)
- [Atlas](../../public/assets/hd-city-taxi/eur-buildings.json)
- Frame: `civilta`, `congressi`, `sport`, `office`.

I tre monumenti sono inseriti nelle posizioni OSM. Gli altri edifici sono disegnati da `CityBuildings.js` seguendo le proprie sagome, cortili, orientamento, piani/altezza quando presenti: il frame `office` rimane disponibile ma non viene stirato su ogni palazzo.

## Prompt usato

> Use case: stylized-concept. Asset type: production building sprite atlas for Corporate Odyssey, a richly illustrated HD 2D overhead driving game in Rome EUR. Create a square 2048x2048 image with EXACTLY FOUR separate complete building sprites in an exact 2 by 2 grid of equal square cells, every object fully contained in its cell with 50 pixels transparent padding. TOP LEFT: Palazzo della Civiltà Italiana in Rome EUR, recognizable white travertine square block with six rows of repeated arches on visible façades, flat square roof. TOP RIGHT: Palazzo dei Congressi in Rome EUR, broad low white travertine rationalist congress building with long portico and central shallow square vaulted dome. BOTTOM LEFT: Palazzo dello Sport in Rome EUR, recognizable large circular low sports arena with a ribbed shallow white dome and glass base. BOTTOM RIGHT: a representative elegant EUR office building, clean white stone facade, dark teal window bands, flat roof with subtle roof details, no brand. Camera MUST be near-vertical top-down orthographic, roofs dominant, only a short SOUTH facade visible, north up, no isometric diagonal rotation. All four must share camera and light direction. Style: premium smooth hand-painted game illustration, realistic materials and small architectural details, warm Roman afternoon highlights, soft rich shadows within each object, white ivory stone and teal glass, dimensional roof edges, crisp silhouettes, natural proportions. Keep the building footprint readable at mobile size. Transparent background outside the objects, genuine alpha. No streets, no ground plane, no gardens, no people, no vehicles, no text, no labels, no logos, no cell borders, no UI. Not pixel art, not low-poly, not a map screenshot.
