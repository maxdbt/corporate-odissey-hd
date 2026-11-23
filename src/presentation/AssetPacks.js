import { WORLD_KEYS } from './WorldCatalog.js';
import { ENTITY_MOTIONS } from './MotionCatalog.js';
import { DANCE_COLLEAGUES } from './DanceVisuals.js';
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
ASSET_PACKS.elevator = { directory: 'hd-interludes', transient: true,
  assets: [['hd-elevator', 'elevator.webp']] };
ASSET_PACKS.dance = { directory: 'hd-dance', transient: true,
  assets: ['jack', 'wendy', ...DANCE_COLLEAGUES].map(name => ['hd-' + name + '-dance', name + '-dance.png', name + '-dance.json']) };
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
ASSET_PACKS.officeMotion = { directory:'hd-worlds', assets:[
 ['hd-office-npc-motion','office-npc-motion.png','office-npc-motion.json'],
 ['hd-office-npc-between','office-npc-between.png','office-npc-between.json'],
 ['hd-office-talker-gestures','talker-gestures.png','talker-gestures.json']
] };
ASSET_PACKS.execMotion = { directory:'hd-worlds', assets:[
 ['hd-exec-npc-motion','exec-npc-motion.png','exec-npc-motion.json'],
 ['hd-exec-npc-between','exec-npc-between.png','exec-npc-between.json']
] };
THEME_PACKS['office-hd'] = ['officeMotion'];
for(const packs of Object.values(THEME_PACKS))if(!packs.includes('officeMotion'))packs.push('officeMotion');
for(const world of WORLD_KEYS)THEME_PACKS[world+'-hd'].push('execMotion');
ASSET_PACKS.divers = { directory:'hd-worlds', assets:[
 ['hd-jack-diver','jack-diver.png','jack-diver.json'],
 ['hd-wendy-diver','wendy-diver.png','wendy-diver.json'],
 ['hd-jack-dive-swim','jack-dive-swim.png','jack-dive-swim.json'],
 ['hd-wendy-dive-swim','wendy-dive-swim.png','wendy-dive-swim.json']
] };
THEME_PACKS['sea-hd'].push('divers');
ASSET_PACKS.bathroomMotion = { directory:'hd-worlds', assets:[
 ['hd-bathroom-monster','bathroom-monster.png','bathroom-monster.json'],
 ['hd-bathroom-monster-between','bathroom-monster-between.png','bathroom-monster-between.json']
] };
THEME_PACKS['toilet-hd'].push('bathroomMotion');
for(const sheet of new Set(ENTITY_MOTIONS.flatMap(m=>[m[1],m[5]].filter(Boolean)))){
 ASSET_PACKS[sheet]={directory:'hd-worlds',transient:true,assets:[['hd-'+sheet,sheet+'.png',sheet+'.json']]};
}
const motionPacks={
 'office-tech':['office','summer','meeting','airport','station','desert','glacier','finance','hr','secretary','director','roof'],
 'office-alert':['office','summer','canteen','meeting','airport','station','desert','glacier','finance','hr','secretary','director','roof'],
 'office-support':['canteen','plane','train'],
 'fauna-land':['airport','station','glacier'], 'fauna-misc':['airport','station','glacier'], 'fauna-sea':['sea'],
 'motion-ceo':['director','roof','party'], 'motion-ceo-action':['director','roof','party'],
 'motion-angry':['office','summer','meeting'], 'motion-angry-action':['office','summer','meeting'],
 'motion-beasts':['client'], 'motion-beasts-action':['client'],
 'motion-ocean-client':['client'], 'motion-ocean-action':['client'],
 'motion-client-court':['client'], 'motion-court-action':['client'],
 'motion-consultants':['client'], 'motion-sea-small':['client','sea'],
 'motion-mounts':['desert','sea'], 'motion-diver-slide':['client','glacier'],
 'motion-passengers-work':['plane','train'], 'motion-passengers-talk':['plane','train'], 'motion-passengers-rest':['plane','train'],
 'motion-diners':['canteen']
};
for(const [pack,worlds]of Object.entries(motionPacks))for(const world of worlds)THEME_PACKS[world+'-hd'].push(pack);
ASSET_PACKS.divers.transient=true;
for(const [world,types]of Object.entries({sea:['seahorse','submarine'],desert:['camel','camel-flying','moto','taxi'],glacier:['husky','snowmobile','skis']})){
 for(const type of types){
  const name='ride-'+type;
  ASSET_PACKS[name]={directory:'hd-worlds',transient:true,assets:[['hd-'+name,name+'.png',name+'.json']]};
  THEME_PACKS[world+'-hd'].push(name);
 }
}
