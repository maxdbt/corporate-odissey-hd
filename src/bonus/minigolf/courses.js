// Coordinates are on the room floor. Rendering projects this plane into an oblique view.
// Solid furniture, rugs and ramps share the same geometry as the physics simulation.
export const ROOM = Object.freeze({ width: 960, height: 560 });
export const BALL_RADIUS = 9;
export const MAX_SHOT_SPEED = 660;
export const FIXED_STEP = 1 / 120;

export const COURSES = [
  {
    name: 'Tra le scrivanie', par: 3, maxStrokes: 8,
    tip: 'Il parquet corre. Usa le sponde per aggirare la scrivania.',
    start: { x: 125, y: 435 }, cup: { x: 825, y: 120, radius: 18 },
    solids: [
      { type: 'desk', x: 340, y: 190, width: 195, height: 130, height3d: 62 },
      { type: 'books', x: 655, y: 315, width: 95, height: 55, height3d: 24 },
      { type: 'planter', x: 215, y: 125, radius: 32, height3d: 36 },
      { type: 'planter', x: 810, y: 430, radius: 35, height3d: 36 },
    ],
    surfaces: [{ type: 'rug', x: 730, y: 55, width: 170, height: 135 }],
  },
  {
    name: 'Il corridoio delle pratiche', par: 4, maxStrokes: 10,
    tip: 'Passa sotto la libreria. La rampa accelera, il tappeto frena.',
    start: { x: 115, y: 115 }, cup: { x: 835, y: 445, radius: 18 },
    solids: [
      { type: 'library', x: 280, y: 50, width: 75, height: 310, height3d: 70 },
      { type: 'desk', x: 540, y: 235, width: 180, height: 105, height3d: 62 },
      { type: 'planter', x: 800, y: 120, radius: 38, height3d: 38 },
    ],
    surfaces: [
      { type: 'rug', x: 420, y: 70, width: 270, height: 125 },
      { type: 'ramp', x: 390, y: 405, width: 175, height: 100, ax: 125, ay: 0 },
      { type: 'rug', x: 755, y: 365, width: 165, height: 140 },
    ],
  },
  {
    name: 'La buca del direttore', par: 4, maxStrokes: 10,
    tip: 'Aggira gli arredi. Nel caffè la pallina torna indietro: +1 colpo.',
    start: { x: 115, y: 445 }, cup: { x: 840, y: 105, radius: 18 },
    solids: [
      { type: 'library', x: 265, y: 95, width: 75, height: 300, height3d: 70 },
      { type: 'desk', x: 475, y: 240, width: 205, height: 105, height3d: 62 },
      { type: 'books', x: 735, y: 390, width: 110, height: 60, height3d: 26 },
      { type: 'planter', x: 570, y: 100, radius: 32, height3d: 38 },
    ],
    surfaces: [
      { type: 'coffee', x: 405, y: 140, radius: 40 },
      { type: 'ramp', x: 380, y: 420, width: 190, height: 90, ax: 110, ay: -35 },
      { type: 'rug', x: 755, y: 45, width: 160, height: 140 },
    ],
  },
];

export const GOLF_REWARD = Object.freeze({ hp: 10, stress: 10, euro: 15 });

export function surfaceContains(surface, point) {
  if (surface.radius) return Math.hypot(point.x - surface.x, point.y - surface.y) < surface.radius;
  return point.x >= surface.x && point.x <= surface.x + surface.width &&
    point.y >= surface.y && point.y <= surface.y + surface.height;
}
