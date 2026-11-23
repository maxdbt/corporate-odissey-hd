// Sprite poses are data, independent of physics. Intermediate sheets contain new drawings.
export const HERO_FRAME_COUNT = 16;
export const SWIM_FRAME_COUNT = 12;
export const NPC_FRAME_COUNT = 12;
export const MONSTER_FRAME_COUNT = 12;
export const BOSS_FRAME_COUNT = 24;
// name, atlas, original keys, playback, artwork faces left, action atlas
export const ENTITY_MOTIONS = [
 ['dog','fauna-land','dog1 dog2','walk'],
 ['dogIdle','fauna-misc','dog_idle'],
 ['penguin','fauna-land','penguin1 penguin2','walk'],
 ['shark','fauna-sea','shark1 shark2'],
 ['jellyfish','fauna-sea','jelly1 jelly2'],
 ['snowman','fauna-misc','snowman','loop',true],
 ['bug','office-tech','bug1 bug2'],
 ['confcall','office-tech','confcall1 confcall2'],
 ['minute','office-alert','minute1 minute2 p_clock'],
 ['teams','office-alert','teams_icon p_teams teams_meteor'],
 ['cook','office-support','cook1 cook2 chef1 chef2','walk'],
 ['hostess','office-support','hostess','walk'],
 ['ceo','motion-ceo','ceo_standing','walk',false,'motion-ceo-action'],
 ['ceoSeated','motion-ceo','boss_ceo boss_ceo_hurt','loop',false,'motion-ceo-action'],
 ['clienthell','motion-angry','clienthell','loop',false,'motion-angry-action'],
 ['bossClient','motion-angry','boss_client boss_client_hurt','loop',false,'motion-angry-action'],
 ['mummy','motion-beasts','boss_mummy1 boss_mummy2','walk',false,'motion-beasts-action'],
 ['bear','motion-beasts','boss_bear1 boss_bear2','walk',false,'motion-beasts-action'],
 ['octopus','motion-ocean-client','boss_octopus1 boss_octopus2','loop',false,'motion-ocean-action'],
 ['mermaid','motion-ocean-client','client_mermaid','dialogue',false,'motion-ocean-action'],
 ['pharaoh','motion-client-court','client_pharaoh','dialogue',false,'motion-court-action'],
 ['penguinCEO','motion-client-court','client_penguin','dialogue',true,'motion-court-action'],
 ['egyptian','motion-consultants','cons_egypt1 cons_egypt2','walk'],
 ['winter','motion-consultants','cons_coat1 cons_coat2','walk'],
 ['fish','motion-sea-small','fish_padulo'],
 ['crab','motion-sea-small','crab','walk'],
 ['camel','motion-mounts','camel','walk'],
 ['seahorse','motion-mounts','seahorse'],
 ['diver','motion-diver-slide','cons_diver1 cons_diver2'],
 ['penguinSlide','motion-diver-slide','penguin_slide'],
 ['man','motion-passengers-work','pax_man','loop',true],
 ['woman','motion-passengers-work','pax_woman','loop',true],
 ['chatty','motion-passengers-talk','pax_chatty1 pax_chatty2','loop',true],
 ['reader','motion-passengers-talk','pax_reader','loop',true],
 ['music','motion-passengers-rest','pax_music','loop',true],
 ['sleeper','motion-passengers-rest','pax_sleeper','loop',true],
 ['dinerA','motion-diners','eater_a1 eater_a2 eater_c1 eater_c2'],
 ['dinerB','motion-diners','eater_b1 eater_b2']
];
export const ENTITY_MOTION_BY_KEY = Object.fromEntries(ENTITY_MOTIONS.flatMap(([name,sheet,keys,mode='loop',left=false,action])=>keys.split(' ').map(key=>[key,{name,sheet,mode,left,action}])));
export function beginBossAction(source, at, duration=1100, kind='attack') {
 source.visualAction={at,duration,kind};
}
export function entityMotionSpec(scene,source,skin,delta,height) {
 const d=ENTITY_MOTION_BY_KEY[source.kind==='sniffer'&&source.state==='done'?'dog_idle':source.texture?.key];
 if(!d||!scene.textures.exists('hd-'+d.sheet))return null;
 const now=scene.time.now,action=source.visualAction;
 const dialogue=d.mode==='dialogue'&&Math.floor(now/2400)%2===1;
 const active=action&&now>=action.at&&now<action.at+action.duration;
 const actionSheet=d.action&&(active||dialogue)&&scene.textures.exists('hd-'+d.action);
 let index;
 if(actionSheet&&active)index=Math.min(11,Math.floor((now-action.at)/action.duration*12));
 else if(d.mode==='walk'&&skin)index=advanceLocomotion(skin,source,delta,Math.max(28,height*1.3),12);
 else index=Math.floor(now/(dialogue?200:95)+(source.x||0)/53)%12;
 if(actionSheet&&dialogue)index=Math.floor((now%2400)/200);
 const velocity=source.body?.velocity?.x??source.sh?.vx??0;
 let faceLeft=Math.abs(velocity)>2?velocity<0:!!source.flipX;
 // These original sprites face left, whereas their new drawings face right.
 if(['bossClient','ceoSeated'].includes(d.name))faceLeft=!source.flipX;
 if(source.texture.key.startsWith('pax_'))faceLeft=!source.flipX;
 return {texture:'hd-'+(actionSheet?d.action:d.sheet),frame:d.name+(index+1),height,
  // The desk ambusher starts squashed to 5%; that is not its reference body size.
  ...(d.name==='clienthell'?{referenceScaleY:1}:{}),
  flipX:faceLeft!==d.left};
}
export const NPC_MOTIONS = [
 ['talker','office','talker1 talker2 elf_bouncer'],
 ['party','office','party1 party2'],
 ['chief','office','chief chief1 chief2 guardian1 guardian2'],
 ['thief','office','thief1 thief2 moocher1 moocher2'],
 ['activist','exec','activist1 activist2'],
 ['yesman','exec','yesman1 yesman2'],
 ['strategist','exec','strategist1 strategist2 consultant1 consultant2'],
 ['secretary','exec','secretary1 secretary2']
];
export const NPC_MOTION_BY_KEY = Object.fromEntries(NPC_MOTIONS.flatMap(([name,group,keys])=>keys.split(' ').map(key=>[key,{name,group}])));
export function interleavedFrame(prefix, name, index) {
 const n=((Math.floor(index)%12)+12)%12;
 return {texture:prefix+(n%2?'-between':'-motion'),frame:name+String(Math.floor(n/2)+1)};
}
export function monsterFrame(index) {
 const n=Math.max(0,Math.min(11,Math.floor(index)));
 return {texture:n%2?'hd-bathroom-monster-between':'hd-bathroom-monster',frame:'monster'+(Math.floor(n/2)+1)};
}
// Advance by travel distance, not wall time: no moonwalking while blocked at a wall.
export function advanceLocomotion(skin, source, delta, stride, count) {
 const previous=skin.motionX??source.x;
 skin.motionX=source.x;
 const distance=Math.min(Math.abs(source.x-previous),Math.max(0,delta)*.6);
 skin.motionPhase=(skin.motionPhase||0)+distance/stride*count;
 return Math.floor(skin.motionPhase)%count;
}
export function npcMotionSpec(scene, source, skin, delta, height) {
 const descriptor=NPC_MOTION_BY_KEY[source.texture?.key];
 if(!descriptor||!scene.textures.exists('hd-'+descriptor.group+'-npc-motion'))return null;
 // A stationary chatterbox talks with his hands, instead of freezing a running pose.
 const moved=skin?.motionX===undefined?Math.abs(source.body?.velocity?.x||0)>2:Math.abs(source.x-skin.motionX)>.01;
 const reference=source.kind==='talker'?{referenceScaleX:1,referenceScaleY:1}:{};
 if(descriptor.name==='talker'&&!moved&&scene.textures.exists('hd-office-talker-gestures')){
  if(skin)skin.motionX=source.x;
  return {texture:'hd-office-talker-gestures',frame:'talker'+(Math.floor(scene.time.now/100)%12+1),height,
   flipX:source.flipX,...reference};
 }
 const index=skin?advanceLocomotion(skin,source,delta,30,NPC_FRAME_COUNT):0;
 return {...interleavedFrame('hd-'+descriptor.group+'-npc',descriptor.name,index),height,...reference,
  flipX:source.body&&Math.abs(source.body.velocity.x)>2?source.body.velocity.x<0:source.flipX};
}
