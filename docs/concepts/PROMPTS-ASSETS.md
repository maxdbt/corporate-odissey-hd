# Prompt degli asset del porting HD

Riferimento unico: `riferimento-approvato.png`. Strumento: ImageGen integrato. Gli atlanti sono immagini separate dal level design; le celle vengono registrate nel manifest del tema.

La revisione che riallinea proporzioni e densità della scena aggiunge l'atlante `office-dressing`: [prompt completo e asset](PROMPT-ARREDI-CONCEPT.md).

## office-background

```text
Use case: stylized-concept. Asset type: reusable seamless horizontal 2D side-scroller background layer for the approved game. Reference image: style guide only. Match the attached APPROVED Corporate Odyssey gameplay image exactly in art direction: warm amber Christmas office lighting, realistic walnut / beige / metal office materials, blue snowy winter city, detailed polished hand-drawn 2D animation characters with expressive adult faces and clean contours. This is a production game asset, not a concept screen. No pixel art, no low-poly, no clay, no noir, no device frame, no HUD, no text captions, no watermark.
Create an EMPTY office architectural backdrop in a wide landscape composition about 2:1: ceiling strip, warm beige walls, evenly spaced dark-framed large windows looking onto a realistic snowy blue-hour Italian city, tasteful Christmas garlands with warm tiny lights and red bows, wall sconces and hanging rectangular amber ceiling lamps. A few filing cabinets and rear workstations are part of the far background, subtle and low contrast. Bottom 20 percent is a simple continuous dark warm red carpet / office baseboard surface, with no deep perspective, providing neutral background below the playable floor. Windows have realistic blue winter depth; warm indoor light is baked into the picture.
Absolutely no people, no playable desks/platforms, no foreground Christmas trees, no collectibles, no paper flying, no gameplay doors, no UI or controls. Interior and materials should look like the reference. Orthographic side-on elevation, not an isometric room; repeatable architectural bays, left and right edges end in visually matching beige wall columns for horizontal tiling. The entire picture is sharp except a little atmospheric softness in the city outside. No huge empty white margins. This is the fixed scenery behind separately animated characters and separately placed interactable furniture.
```

## office-props

```text
Use case: stylized-concept. Asset type: production sprite atlas on genuine transparent background. Reference image: exact rendering and palette guide. Match the attached APPROVED Corporate Odyssey gameplay image exactly in art direction: warm amber Christmas office lighting, realistic walnut / beige / metal office materials, blue snowy winter city, detailed polished hand-drawn 2D animation characters with expressive adult faces and clean contours. This is a production game asset, not a concept screen. No pixel art, no low-poly, no clay, no noir, no device frame, no HUD, no text captions, no watermark.
Create a precise 4 COLUMN by 4 ROW grid of SIXTEEN separate 2D side-view game objects, evenly centered, one object per equal cell, generous transparent padding between cells, no objects touching another cell. Ideally 2048 by 2048 pixels, every cell square and identical. No grid lines and NO labels. Transparent background between all objects and inside empty gaps. All objects in the approved realistic painted game style, clear right-angle platform top edges and crisp contours.
Read order from top left:
ROW 1: (1) a full walnut office desk with drawers, front/side-on view, clear horizontal desktop, small papers and warm lamp; (2) decorated Christmas tree with glowing warm lights, red ornaments and a few presents at its base; (3) a leafy realistic office plant in terracotta pot; (4) tall grey metal filing cabinet with drawers and folders on top.
ROW 2: (5) malfunctioning modern photocopier, warning lamp, no flying paper outside its cell; (6) warm walnut Christmas party double door with small windows, warm party light and small garland over lintel, blank sign panel for a runtime label; (7) simple walnut office exit door with frosted glass, no text; (8) straight metal-and-wood maintenance ladder, viewed fully front on.
ROW 3: (9) detailed small white espresso cup on saucer with coffee; (10) open slim dark-grey laptop facing toward a player holding it, readable blue screen glow, no brand; (11) a single thick luminous GOLD EURO coin with euro symbol; (12) a pale green meal voucher ticket with a simple fork-and-knife pictogram, no words.
ROW 4: (13) vacation token depicting a little tropical palm and umbrella on a golden round badge; (14) luminous gold five-pointed promotion star with tasteful aura; (15) realistic office water cooler with blue water jug; (16) ONE RECTANGULAR cross-section platform/floor block: warm red carpet top edge, dark burgundy upholstered/fabric side, crisp horizontal parallel edges, designed to repeat seamlessly left-right, not a perspective floor.
Keep the background truly transparent. Every isolated object is wholly contained in its own cell. No characters, no extra props, no title, no text except the euro symbol.
```

## characters

```text
Use case: stylized-concept. Asset type: production character sprite sheet, genuine transparent background. Reference image: identity and drawing style reference. Match the attached APPROVED Corporate Odyssey gameplay image exactly in art direction: warm amber Christmas office lighting, realistic walnut / beige / metal office materials, blue snowy winter city, detailed polished hand-drawn 2D animation characters with expressive adult faces and clean contours. This is a production game asset, not a concept screen. No pixel art, no low-poly, no clay, no noir, no device frame, no HUD, no text captions, no watermark.
Create an EXACT 4 COLUMN by 4 ROW grid of SIXTEEN full-body isolated 2D animation cels, centered one character per square equal cell. All frames are orthographic right-facing side-view platformer sprites, whole body visible, stable adult proportions, consistent face, clothes and dimensions for each character across frames. Generous transparent gap between cells. Ideally 2048x2048. No titles, no grid lines, no captions. NO laptop or other held props: the game attaches the equipment separately.
First TWO rows: JACK, the male employee from the reference, clean expressive handsome face, swept brown hair, white shirt with rolled sleeves, loosened red tie, dark tailored trousers, black shoes.
ROW 1: Jack relaxed upright idle facing right; Jack run stride A right foot forward; Jack run stride B left foot forward; Jack jumping with knees slightly tucked and arms out.
ROW 2: Jack crouching low; Jack sliding forward very low with one leg extended; Jack climbing a ladder with hands above shoulder level (no ladder); Jack recoiling from damage.
Last TWO rows: WENDY, the established female office employee: adult woman with shoulder-length dark brown hair, teal tailored blazer, white blouse, dark pencil skirt, dark practical shoes, same polished illustrated realistic 2D cartoon rendering as Jack.
ROW 3: Wendy relaxed upright idle facing right; Wendy run stride A right foot forward; Wendy run stride B left foot forward; Wendy jumping with knees slightly tucked.
ROW 4: Wendy crouching low; Wendy sliding forward very low with one leg extended; Wendy climbing a ladder (no ladder); Wendy recoiling from damage.
No character extends beyond its cell. Same scale for both running frames of each character, keep feet baseline consistent within cells. Do not draw ground, shadows, scenery or anything behind the characters. Must be genuinely transparent.
```

## office-enemies

```text
Use case: stylized-concept. Asset type: production enemy and projectile sprite atlas, genuine transparent background. Reference image: rendering and character design guide. Match the attached APPROVED Corporate Odyssey gameplay image exactly in art direction: warm amber Christmas office lighting, realistic walnut / beige / metal office materials, blue snowy winter city, detailed polished hand-drawn 2D animation characters with expressive adult faces and clean contours. This is a production game asset, not a concept screen. No pixel art, no low-poly, no clay, no noir, no device frame, no HUD, no text captions, no watermark.
Create an exact 4 COLUMN by 3 ROW grid of TWELVE distinct isolated 2D game sprites, one per equal square cell, centered with generous transparent padding. No grid lines, no captions, no scenery, no shadows on the background. Right-facing profile or readable three-quarter-side view compatible with a strictly side-scrolling 2D platformer. Crisp polished painted/cartoon style matching the approved image.
ROW 1: (1) talkative adult office colleague wearing glasses and a grey-beige jacket, gesturing with a raised finger, walking pose A; (2) SAME identical talkative colleague, walking pose B with opposite stride; (3) portly festive colleague from approved reference, pink rolled-sleeve shirt, dark trousers, moustache, red Santa hat, holding green spumante bottle up, dance pose A; (4) SAME festive colleague dancing pose B.
ROW 2: (5) angry corporate client in dark red suit with phone in hand, expressive irritated face, cropped squat full-body office-game silhouette; (6) small comical dark purple computer bug creature with six legs and bright cyan eyes, mechanical but not scary; (7) floating anthropomorphic conference-call headset with microphone, polished dark grey and purple, readable flying hazard; (8) anthropomorphic alarm-clock office enemy with little running legs, dark grey case and red hands.
ROW 3: (9) lively purple video-call icon creature with tiny legs, generic call silhouette, no brand text; (10) single curled white paper sheet with a few grey lines; (11) a triangular slice of panettone cake with raisins; (12) a compact glowing orange red flame projectile with a clear bright core.
Keep characters consistent with the approved illustration. Every object fully inside its cell, truly transparent gaps, no decorative speech text. Do not add any other sprites.
```

## jack-motion

```text
Use case: stylized-concept. Production 2D character animation sprite atlas. Match the attached approved gameplay image and existing character sheet EXACTLY in character identity, facial design, clothing, linework and warm light. JACK: adult man with swept brown hair, white rolled-sleeve shirt, loose red tie, dark tailored trousers and black shoes. This is the SAME character, no redesign. High quality expressive hand-drawn 2D animation, clean outlines, realistic folded cloth and detailed adult face. No pixel art, no clay, no 3D look.
Generate an EXACT 4 COLUMN by 3 ROW grid, twelve full-body animation cels, one per equal square cell, ideal 2048x1536. EVERY CHARACTER FACES RIGHT. Genuine completely transparent background, no ground or shadows, no labels, no captions, no grid marks. Each sprite is wholly inside its cell with clear transparent margins; never overlap into another cell. Consistent body/head size and feet baseline, camera and lighting locked.
ROW 1 and ROW 2 together form an EIGHT-FRAME COMPLETE RUN CYCLE in correct chronological order:
1 contact right foot forward and left foot back; 2 down/compression with right knee bending; 3 passing phase left leg passes under hips and right leg supporting; 4 up phase right leg pushes off, left knee forward; 5 opposite contact left foot forward, right foot back; 6 down/compression left knee bending; 7 passing phase right leg passes under hips and left leg supports; 8 up phase left leg pushes off, right knee forward. Clear anatomically believable opposite arm swing, tie and cloth follow movement. Each frame must be different and flow into the next and back to frame 1, same identity and proportions.
ROW 3: (9) calm standing idle pose with hands relaxed; (10) same idle with tiny breathing shift and subtle relaxed expression; (11) attack pose right arm extended as if firing a small device, but no device drawn; (12) soft landing pose knees bent after jump, keeping full body visible.
Use the existing character sheet only for identity; create new carefully differentiated movement frames. No laptop, no scenery, no extra characters, no background color: real alpha transparency.
```

## wendy-motion

```text
Use case: stylized-concept. Production 2D character animation sprite atlas. Match the attached approved gameplay image and existing character sheet EXACTLY in character identity, facial design, clothing, linework and warm light. WENDY: adult woman with shoulder-length dark brown hair, teal tailored blazer, white blouse, dark pencil skirt, dark practical shoes. This is the SAME character, no redesign. High quality expressive hand-drawn 2D animation, clean outlines, realistic folded cloth and detailed adult face. No pixel art, no clay, no 3D look.
Generate an EXACT 4 COLUMN by 3 ROW grid, twelve full-body animation cels, one per equal square cell, ideal 2048x1536. EVERY CHARACTER FACES RIGHT. Genuine completely transparent background, no ground or shadows, no labels, no captions, no grid marks. Each sprite is wholly inside its cell with clear transparent margins; never overlap into another cell. Consistent body/head size and feet baseline, camera and lighting locked.
ROW 1 and ROW 2 together form an EIGHT-FRAME COMPLETE RUN CYCLE in correct chronological order:
1 contact right foot forward and left foot back; 2 down/compression with right knee bending; 3 passing phase left leg passes under hips and right leg supporting; 4 up phase right leg pushes off, left knee forward; 5 opposite contact left foot forward, right foot back; 6 down/compression left knee bending; 7 passing phase right leg passes under hips and left leg supports; 8 up phase left leg pushes off, right knee forward. Clear anatomically believable opposite arm swing, tie and cloth follow movement. Each frame must be different and flow into the next and back to frame 1, same identity and proportions.
ROW 3: (9) calm standing idle pose with hands relaxed; (10) same idle with tiny breathing shift and subtle relaxed expression; (11) attack pose right arm extended as if firing a small device, but no device drawn; (12) soft landing pose knees bent after jump, keeping full body visible.
Use the existing character sheet only for identity; create new carefully differentiated movement frames. No laptop, no scenery, no extra characters, no background color: real alpha transparency.
```

## spumante

```text
Use case: stylized-concept. Production isolated 2D game hazard asset matching the attached approved Corporate Odyssey office image exactly. A realistic green glass spumante bottle lying on its side at the left, gold foil neck pointing right, with a small creamy paper label, and a wide shallow puddle of sparkling golden champagne spreading right along the same horizontal floor line. Painterly realistic materials, warm amber reflections, delicate bright bubbles and a subtle wet edge, crisp game-ready silhouette. Strictly side-on view, very shallow horizontal perspective compatible with a 2D platformer, wide flat composition about 4:1 for the object bounds. The liquid must read as a thin puddle on a platform, not a lake or a tall fountain. Genuine transparent background around bottle and liquid, no ground or floor or room, no shadows outside the cutout, no people, no text or UI, no other objects. Detailed high resolution, absolutely no pixel art. Draw only the isolated lying bottle and puddle as one reusable game sprite.
```

## Trasparenza dell'atlante dei nemici

Input conservato in `source-office-enemies.png`. Il risultato con alpha corretto è `public/assets/hd-office/office-enemies-cutout.png`; il ritaglio è stato eseguito con ImageGen.

```text
Use case: background-extraction. Edit target: the attached office-enemy atlas. Remove ONLY the off-white background and its background shadows, producing real full alpha transparency between all twelve isolated sprites. Preserve the exact 4-column by 3-row layout, sprite positions, proportions, identities, paint detail, contours and colors. Do not redraw, move, resize or add any sprite. Preserve white paper and white shirt areas within the objects. No checkerboard baked into the image, no white halo or colored fringe. Output must have a genuinely transparent background, clean game-ready cutout silhouettes.
```
