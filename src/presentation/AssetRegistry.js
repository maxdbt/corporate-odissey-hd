import Phaser from 'phaser';
import { ASSET_PACKS } from './AssetPacks.js';

const leases = new Map();
// A paused parent keeps its packs. Once a scene shuts down, the next load frees unused backgrounds.
function retainPacks(scene, packs) {
  const owned = new Set([...(leases.get(scene) || []), ...packs]);
  if (!leases.has(scene)) scene.events.once('shutdown', () => leases.delete(scene));
  leases.set(scene, owned);
  const needed = new Set([...leases.values()].flatMap(set => [...set]));
  for (const [name, pack] of Object.entries(ASSET_PACKS)) {
    if ((!name.startsWith('world-') && !pack.transient) || needed.has(name)) continue;
    for (const [key] of pack.assets) if (scene.textures.exists(key)) scene.textures.remove(key);
  }
}

export function preloadAssetPacks(scene, packs = []) {
  retainPacks(scene, packs);
  for (const name of packs) {
    const pack = ASSET_PACKS[name];
    const base = import.meta.env.BASE_URL + 'assets/' + pack.directory + '/';
    for (const [key, image, atlas] of pack.assets) {
      if (scene.textures.exists(key)) continue;
      if (atlas) scene.load.atlas(key, base + image, base + atlas);
      else scene.load.image(key, base + image);
    }
  }
}

export function assetPacksReady(scene, packs = []) {
  return packs.every((name) => ASSET_PACKS[name].assets.every(([key]) => scene.textures.exists(key)));
}

export const HD_ASSETS = [
  ['hd-office', 'office-background.webp'],
  ['hd-props', 'office-props.webp', 'office-props.json'],
  ['hd-characters', 'characters.webp', 'characters.json'],
  ['hd-jack-motion', 'jack-motion.webp', 'jack-motion.json'],
  ['hd-wendy-motion', 'wendy-motion.webp', 'wendy-motion.json'],
  ['hd-jack-locomotion', 'jack-locomotion.webp', 'jack-locomotion.json'],
  ['hd-wendy-locomotion', 'wendy-locomotion.webp', 'wendy-locomotion.json'],
  ['hd-enemies', 'office-enemies-cutout.webp', 'office-enemies.json'],
  ['hd-spumante', 'spumante.webp', 'spumante.json'],
  ['hd-dressing', 'office-dressing.webp', 'office-dressing.json']
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
  for (const [key] of [...HD_ASSETS, ...Object.values(ASSET_PACKS).flatMap((p) => p.assets)]) {
    if (scene.textures.exists(key)) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
