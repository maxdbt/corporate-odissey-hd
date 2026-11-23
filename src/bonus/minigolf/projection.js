// Oblique room projection and its inverse: touch aiming uses floor coordinates, not screen angles.
export function createProjection(width, height = 450) {
  const scale = Math.min((width - 74) / 1140, (height - 150) / 390);
  const ox = (width - 1139.2 * scale) / 2;
  const oy = 93;
  return {
    scale,
    toScreen(x, y, z = 0) { return { x: ox + (x + y * .32) * scale, y: oy + (y * .58 - z) * scale }; },
    toFloor(x, y) { const fy = (y - oy) / (.58 * scale); return { x: (x - ox) / scale - fy * .32, y: fy }; },
  };
}
