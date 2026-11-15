import Phaser from 'phaser';

export const HD_ASSETS = [
  ['hd-office', 'office-background.png'],
  ['hd-props', 'office-props.png', 'office-props.json'],
  ['hd-characters', 'characters.png', 'characters.json'],
  ['hd-jack-motion', 'jack-motion.png', 'jack-motion.json'],
  ['hd-wendy-motion', 'wendy-motion.png', 'wendy-motion.json'],
  ['hd-enemies', 'office-enemies-cutout.png', 'office-enemies.json'],
  ['hd-spumante', 'spumante.png', 'spumante.json'],
  ['hd-dressing', 'office-dressing.png', 'office-dressing.json']
];

export function preloadHdAssets(scene) {
  const base = import.meta.env.BASE_URL + 'assets/hd-office/';
  for (const [key, image, atlas] of HD_ASSETS) {
    if (atlas) scene.load.atlas(key, base + image, base + atlas);
    else scene.load.image(key, base + image);
  }
}

export function hdAssetsReady(scene) {
  return HD_ASSETS.every(([key]) => scene.textures.exists(key));
}

export function useHdFiltering(scene) {
  for (const [key] of HD_ASSETS) {
    if (scene.textures.exists(key)) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
