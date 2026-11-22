export function ensurePortraits(scene) {
  const texture = scene.textures.get('hd-characters');
  for (const character of ['man', 'woman']) {
    const name = character + '_portrait';
    if (texture.has(name)) continue;
    const f = texture.get(character + '_idle');
    const size = Math.round(f.cutHeight * 0.32);
    texture.add(name, 0, Math.round(f.cutX + f.cutWidth / 2 - size / 2), f.cutY, size, size);
  }
}
