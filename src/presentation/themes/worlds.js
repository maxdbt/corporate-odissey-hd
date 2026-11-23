import { officeTheme } from './office.js';
import { WORLD_KEYS, WORLD_FLOORS, OUTDOOR_WORLDS } from '../WorldCatalog.js';

const props = { ...officeTheme.props };
const enemies = { ...officeTheme.enemies };
enemies.teams_meteor = ['teamsicon', 32];
const prop = (keys, frame, height, atlas = 'objects', extra = {}) => keys.split(' ').forEach(k => {
  props[k] = [frame, height, `hd-world-${atlas}`, extra];
});
const cast = (keys, frame, height = 43) => keys.split(' ').forEach(k => {
  enemies[k] = [frame, height, { texture: 'hd-world-cast' }];
});
cast('cook1 cook2 chef1 chef2', 'cook', 46);
cast('chief1 chief2 chief guardian1 guardian2', 'chief', 48);
cast('thief1 thief2 moocher1 moocher2', 'thief');
cast('activist1 activist2', 'activist');
cast('dog1 dog2', 'dog', 26);
cast('penguin1 penguin2', 'penguin', 28);
cast('penguin_slide', 'penguinSlide', 20);
cast('snowman', 'snowman', 43);
cast('jelly1 jelly2', 'jellyfish', 28);
cast('shark1 shark2', 'shark', 28);
cast('yesman1 yesman2', 'yesman');
cast('strategist1 strategist2 consultant1 consultant2', 'strategist');
cast('secretary1 secretary2', 'secretary');
cast('boss_client boss_client_hurt', 'bossClient', 78);
cast('boss_ceo boss_ceo_hurt ceo_standing', 'bossCEO', 80);
enemies.ceo_standing=['stand',80,{texture:'hd-world-ceo-motion'}];
cast('hostess', 'hostess', 55);
cast('pax_chatty1 pax_chatty2 pax_reader pax_music pax_sleeper', 'yesman', 64);
cast('eater_a1 eater_a2 eater_b1 eater_b2 eater_c1 eater_c2', 'chief', 29);
prop('canteen_table', 'table', 34, 'furniture', { width: 80 });
prop('counter', 'counter', 56, 'furniture', { width: 96 });
prop('bench', 'bench', 22, 'furniture', { width: 64 });
prop('cassa', 'checkout', 56, 'furniture');
prop('postit_yellow postit_orange postit_green', 'postit', 12, 'furniture', { width: 44 });
prop('gate_desk petition shelf', 'counter', 48, 'furniture');
prop('gate_door exec_gate exec_elevator', 'gate', 76, 'furniture');
prop('tray', 'tray', 14, 'furniture');
prop('dish_primo', 'pasta', 17);
prop('dish_secondo', 'steak', 17);
prop('dish_contorno', 'salad', 17);
prop('dish_dolce mystery_dish', 'cake', 17);
prop('budget ticket_passport', 'passport', 17);
prop('upgrade miles vip_badge', 'boardingPass', 17);
prop('drop_strike feedback q4folder excel', 'folder', 18);
prop('df_perfume df_choco df_watch', 'bag', 18);
prop('water', 'coffee', 16);
prop('wings_item camel_wing', 'wings', 23, 'equipment');
prop('train_door', 'train', 66, 'equipment');
prop('cactus', 'cactus', 43, 'nature');
prop('stalactite', 'icicle', 30, 'nature');
prop('seaweed', 'coral', 38, 'nature');
prop('kiosk food_stand', 'market', 70, 'nature');
prop('hut', 'hut', 75, 'nature');
prop('reef_bar', 'reefBar', 75, 'nature');
prop('office mirage', 'office', 100, 'nature');
prop('mine', 'mine', 25, 'nature');
prop('camel', 'camel', 48, 'nature');
prop('snowmobile', 'snowmobile', 37, 'nature');
prop('submarine', 'submarine', 55, 'nature');
prop('seahorse', 'seahorse', 58, 'nature');
for (const [key, frame, h] of [['moto','motorcycle',38],['taxi','taxi',45],['husky_sled','sled',40],
  ['skis','skis',10],['fins','fins',15],['mask','mask',15],['umbrella_open','parasol',24]]) prop(key,frame,h,'equipment');
props.lux_plant = ['plant', 64];
props.beach_flag = ['vacation', 26];
props.mail = ['mail', 14, 'hd-summer-props'];
props.p_email = ['mail', 12, 'hd-summer-props'];
for(const [keys,frame,height] of [
 ['throne_empty','throne',88],['helicopter','helicopter',64],['rotor','rotor',10],['roof_ac','ac',36],
 ['antenna','antenna',96],['fin_screens fin_board board poster_sorridi poster_sinergia','screen',50],
 ['fin_safe','safe',48],['reception','reception',44],['law_shelf','library',72],['justice_scale','scales',56],
 ['exec_sofa','sofa',32],['gold_canopy','parachute',60]
]) prop(keys,frame,height,'executive-props');
prop('stock_cert ppt_slide', 'folder', 18);
prop('gold_pack gold_bag','bag',22);
prop('service_door','gate',84,'furniture');
prop('roof_rail','bench',20,'furniture');
prop('helipad','metal',10,'furniture',{width:160});
props.desk=['desk',40];
props.whiteboard=['noticeboard',50,'hd-dressing'];
props.gold_frame=['screen',40,'hd-world-executive-props'];
props.trolley=['counter',42,'hd-world-furniture'];
for(const food of ['panino','cannelloni','dunette','cioccolata','grappa','fonduta','sushi','alghe','paranza'])prop('food_'+food,food,68,'food');
prop('wet_sign','wetSign',22,'food');
prop('wc_toilet','toilet',76,'food');
prop('mirror_ball','disco',45,'food');
for(const id of ['laptop','charger','phone','earbuds','antacid','toothpaste','toothbrush','underwear','banana','umbrella','toiletpaper','notebook','sleepmask','idcard','adapter','cards','suit','dates','swimsuit','jacket']){
  for(const key of ['trip_'+id,'trip_'+id+'_man','trip_'+id+'_woman'])prop(key,id,29,'inventory',{maxWidth:32});
}
for (const [keys, frame, height] of [
  ['client_pharaoh','pharaoh',100],['client_penguin','penguinCEO',94],['client_mermaid','mermaid',98],
  ['boss_mummy1 boss_mummy2','mummy',92],['boss_bear1 boss_bear2','bear',94],['boss_octopus1 boss_octopus2','octopus',90],
  ['cons_egypt1 cons_egypt2','egyptian',64],['cons_coat1 cons_coat2','winter',64],['cons_diver1 cons_diver2','diver',64],
  ['curse_orb','orb',22],['fish_padulo','fish',22],['crab','crab',20]
]) keys.split(' ').forEach(k => { enemies[k] = [frame, height, {texture:'hd-world-clients'}]; });

export const worldThemes = Object.fromEntries(WORLD_KEYS.map(world => [`${world}-hd`, {
  ...officeTheme, id: `${world}-hd`, world, background: `hd-world-${world}`, props, enemies,
  floor: WORLD_FLOORS[world] || 'wood', outdoor: OUTDOOR_WORLDS.includes(world)
}]));
export const sharedWorldTheme = worldThemes['canteen-hd'];
