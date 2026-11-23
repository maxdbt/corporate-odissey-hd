# Asset del minigolf — 23 novembre 2026

Generazione con lo strumento integrato **imagegen**, senza CLI o credenziali API. Due immagini nuove, integrate nella scena giocabile; gli asset precedenti restano invariati.

- `public/assets/hd-minigolf/furniture.png`: atlas 1536×1024 RGBA, sei arredi. La trasparenza generata è conservata; `furniture.json` definisce i ritagli senza riscrivere il PNG.
- `public/assets/hd-minigolf/parquet.png`: materiale del pavimento. La scena lo proietta una sola volta su una texture Canvas e la riusa durante il gioco.
- Fondale dell'attico, divano e trofeo: asset HD esistenti.

## Prompt arredi

```text
Use case: stylized-concept. Production sprite sheet for an illustrated premium 2D office minigolf videogame, NOT a screenshot or concept presentation. Exactly 3 columns by 2 rows, six isolated furniture sprites on genuine transparent background, landscape 1536x1024 canvas, each sprite contained in its own equal 512x512 cell, ample transparent padding, no grid, no text, no labels. Consistent rich painterly semi-realistic 2D style, refined walnut wood grain, warm amber lighting from upper left, ivory highlights, brass, dark green leather, subtle ambient occlusion, crisp high resolution, not vector flat shapes, not pixel art, not plastic toy low-poly. Camera: elevated three-quarter OBLIQUE game view, front and rear long edges horizontal, depth edges slope down and right, vertical edges vertical. You see substantial top surfaces and the front faces; parallel lines, no vanishing perspective. Each object stands isolated, NO floor or background. Row 1 left: a wide luxurious solid walnut pedestal office desk with leather writing mat, one cream sheet of paper and a small coffee cup, body filled by drawers almost to floor, no chair. Row 1 middle: compact low stack of three oversized worn leather-bound books, green, burgundy and tan, with creamy page edges and gold spine trim. Row 1 right: lush broad-leaf green office plant in a round brass planter with realistic soil. Row 2 left: long narrow low walnut filing cabinet with brass handles, looking down on folders on top; its LONG dimension runs in the depth direction down-right. Row 2 middle: flat dark green rectangular wool putting rug with a fine golden edge, viewed from same elevated oblique camera, no ball, flag or hole. Row 2 right: a low wide ramp improvised from a polished walnut plank resting on two books; brass trim, clear sloped top surface, oriented left to right and rising slightly at left, no ball. All six sprites fully visible and separated, same rendering style and camera, alpha transparent beyond each object's silhouette. No extra items, no frames, no scenery, no people, no baked checkerboard.
```

Parametro: `transparent_background: true`.

## Prompt parquet

```text
Use case: stylized-concept. A production 2D game MATERIAL TEXTURE, not a room scene. Completely straight orthographic OVERHEAD view of an entire rectangular polished honey-walnut parquet floor, rich small staggered wooden planks, subtle realistic wood grain, soft amber afternoon illumination and restrained warm highlights, premium hand-painted semi-realistic illustrated videogame material matching luxurious Italian office furniture. Fill the whole image edge to edge with wood flooring. Flat material plane with no perspective distortion. Landscape 3:2, 1536x1024. Uniform usable floor, no furniture, walls, rug, holes, ball, borders, props, symbols, writing or interface. Natural tonal variation, finely rendered tactile wood surface and delicate joints. Avoid vector outlines, pixel art, plastic, exaggerated gloss, hard shadows and blown-out light patches.
```

Parametro: `transparent_background: false`.
