# Prompt degli asset del porting estivo

Creati il 22 novembre 2026 con **ImageGen integrato**, usando come riferimenti i concept approvati. Nessuna API esterna o generazione via CLI. I PNG originali, compresa la trasparenza, sono conservati in `public/assets/hd-summer/`; lo script `scripts/build-hd-atlases.py` legge il canale alpha per produrre solo i metadati JSON, senza ritoccare i pixel.

## summer-background

Riferimento: `06-estate-inferno.png`.

```text
Create a production background plate for the SAME 2D game shown in this approved reference. Preserve exactly its beautifully detailed painterly realistic office materials, crisp illustrated style, lighting quality and Milan skyline. Wide 16:9, 2048x1152 if possible. ONLY the architectural back layer: full wall height from ceiling down to skirting board, ceiling 0-14%, huge tall windows 18-64% with venetian blinds and sunny Milan/Duomo outside, beige plaster pillars and wall sconces, amber sunlight crossing walnut built-in LOW cabinets below windows, subtle decorative plants on those cabinets. Floor begins at exactly 78% image height with red carpet, lower22% carpet continuing to bottom. Broadside flat 2D side scrolling architecture, no perspective vanishing corridor. Left and right edges match repeating architectural rhythm for horizontal tiling. Abundant fine details, warm afternoon summer light, no Christmas decorations. CRITICAL remove ALL HUD, text overlays, controls, characters, coins, tickets, enemies, free-standing desks, front-layer copier, gameplay platforms, doors and air conditioners. These are separate game objects. Keep back-wall cabinets, warm summer window blinds, distant skyline, framed small beach poster with no lettering, sconce shadows. Do not simplify into vectors or pixel art. This is a clean environment plate for a moving game, not a game screenshot.
```

## beach-background

Riferimento: `07-ferie-ma-non-troppo.png`.

```text
Derive a production clean background plate from this APPROVED beach game concept. Match EXACTLY the rich detailed illustrative realism, Amalfi coastal village, turquoise sparkling sea, blue sky, leafy lemon branches framing upper left, red-white parasols and striped loungers toward left/right shore, sunlit sand and layered soft foreground. Wide16:9 2048x1152 if possible. Remove ALL HUD, interface, text overlays, player, floating mail envelopes, their trails and shadows. Remove footprints or dust from the character. Keep absolutely no characters. Composition adapted for actual game: sea horizon at40%, waterline at62%, continuous CLEAR horizontal sandy running lane between68% and81% with actor ground at79%; loungers BEHIND that lane at63%, grass/ropes/towel/suitcase/cocktail/ticket decorative details confined to bottom15% or far outeredges, never obstructing running lane. Keep sky center clear for falling mail. Preserve fine realistic sand, water, buildings, umbrella fabric and rich color quality. Full bleed with no borders, no writing, no UI, no arrows. This is the reusable beach environment in the same 2D game, not a screenshot.
```

## summer-props.png

Riferimenti: entrambi i concept approvati. `transparent_background: true`.

```text
Production game sprite atlas, TRUE TRANSPARENT background, same detailed painterly 2D illustration as reference. 1536x1024 landscape, exactly a regular grid 4 COLUMNS x 2 ROWS, generous empty gutters around each standalone object, NEVER touching other cells or canvas boundary. Eight objects, one centered in each equal cell: row1 col1 white wall-mounted air conditioner with icy blue frost/icicles (no spray outside cell); row1 col2 brass desk fan with circular fine cage and three blades, full base; row1 col3 glossy golden plane boarding pass with dark airplane silhouette (no words); row1 col4 closed office EXIT door framed walnut, dark glass reflecting blue sun, small plaque exactly 'USCITA' at top. Row2 col1 cream golden paper envelope, subtle dimensional folds, small red circular badge '1' upperright; row2 col2 red outlined cream urgent envelope, red circular exclamation badge upperright, word 'URGENTE' on front; row2 col3 stocky cartoon male colleague identical visual style, pink shirt dark pants scarf around neck, clutching folders, shivering posture, FULL BODY facingLEFT, black shoes on bottom; row2 col4 open vintage brown leather suitcase with striped orange towel and straw hat. Uniform crisp fine edges; match realistic objects with expressive outlined character exactly. Isolated cutout sprites, straight-on side-view game assets, NO floor, NO backdrop, NO gridlines, NO sheet labels, NO extraneous objects. No broad glow that touches cell borders. Maintain entirely transparent empty gutters.
```

## office-cold.png

Variante dell'asset `office-background.png`, mantenendo l'architettura registrata per la transizione caldo/freddo.

```text
Edit ONLY the lighting, temperature and surface frost of this clean 2D office environment plate. Preserve its EXACT window geometry, cabinets, pillars, blinds, wallpaper, skyline, floor boundary and positions. This is a matching cold variant for a game crossfade: all objects must stay registered pixel-for-pixel. Turn the office into the extreme air-conditioning blue part of the approved Estate d'Inferno concept: cool cyan-blue lighting, thin crystalline frost on window loweredges and blind slats, little icicles below cabinet ledges and patches of pale frost on skirting and carpet. Outside Milan remains sunny but cold blue throughglass. Keep rich detailed illustrated realism and readable materials. Same16:9 dimensions. No characters, no machines, no added desks, no text, no HUD, no particles. Simply the same architectural layer cooled with elegant icyblue light and delicate frost, not snowbound nor dark night.
```
