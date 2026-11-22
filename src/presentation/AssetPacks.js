import { WORLD_KEYS } from './WorldCatalog.js';
// Data-only manifests can be validated without starting Phaser or a browser.
export const ASSET_PACKS = {
  summer: {
    directory: 'hd-summer',
    assets: [['hd-summer-office', 'office-background.png'], ['hd-summer-cold', 'office-cold.png']]
  },
  summerProps: { directory: 'hd-summer', assets: [['hd-summer-props', 'summer-props.png', 'summer-props.json']] },
  beach: { directory: 'hd-summer', assets: [['hd-beach', 'beach-background.png']] }
};
export const THEME_PACKS = { 'summer-hd': ['summer', 'summerProps'] };
ASSET_PACKS.worldShared = { directory: 'hd-worlds', assets: ['furniture', 'cast', 'nature', 'objects', 'equipment', 'clients', 'executive-props', 'food']
  .map(name => [`hd-world-${name}`, `${name}.png`, `${name}.json`]) };
for (const world of WORLD_KEYS) {
  ASSET_PACKS['world-' + world] = { directory: 'hd-worlds', assets: [[`hd-world-${world}`, `${world}.png`]] };
  THEME_PACKS[world + '-hd'] = ['worldShared', 'summerProps', 'world-' + world];
}
ASSET_PACKS.inventory = { directory:'hd-worlds', assets:[['hd-world-inventory','inventory.png','inventory.json']] };
THEME_PACKS['travel-hd'].push('inventory');
for(const world of ['airport','station','desert','glacier','sea','client'])THEME_PACKS[world+'-hd'].push('inventory');
ASSET_PACKS.passengers = { directory:'hd-worlds', assets:[['hd-world-passengers','passengers.png','passengers.json']] };
for(const world of ['plane','train'])THEME_PACKS[world+'-hd'].push('passengers');
ASSET_PACKS.ceoMotion = { directory:'hd-worlds', assets:[['hd-world-ceo-motion','ceo-motion.png','ceo-motion.json']] };
for(const world of ['director','roof','party'])THEME_PACKS[world+'-hd'].push('ceoMotion');
ASSET_PACKS.swim = { directory:'hd-worlds', assets:[['hd-world-swim','swim.png','swim.json']] };
THEME_PACKS['sea-hd'].push('swim');
