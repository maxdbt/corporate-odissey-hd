import { advanceLocomotion } from './MotionCatalog.js';

export const RIDE_FRAME_COUNT=12;
export const RIDE_SKINS={
 camel:{height:74},moto:{height:55},taxi:{height:40},husky:{height:55,originX:.25},
 snowmobile:{height:55},skis:{height:53},submarine:{height:47},seahorse:{height:65}
};
export function mountedTexture(player){
 const m=player?.mount;
 if(!m||m.type==='fins')return null;
 return 'hd-ride-'+(m.type==='camel'&&m.turbo&&!player.onGround?'camel-flying':m.type);
}
export function mountedPose(scene,player,skin,delta){
 const m=player.mount,config=RIDE_SKINS[m?.type],texture=mountedTexture(player);
 if(!config||!scene.textures.exists(texture))return null;
 const water=['seahorse','submarine'].includes(m.type);
 const flying=m.type==='camel'&&m.turbo&&!player.onGround;
 const index=water||flying?Math.floor(player.clock/90)%RIDE_FRAME_COUNT:
  advanceLocomotion(skin,player,delta,110,RIDE_FRAME_COUNT);
 const originX=config.originX??.5;
 return {texture,frame:player.character+(index+1),height:config.height,originX:player.facing<0?1-originX:originX,originY:1,
  offsetY:Number.isFinite(player.body?.bottom)?player.body.bottom-player.y:m.cfg.lift,flipX:player.facing<0};
}
export function hasMountedSkin(scene,player){
 if(player?.mount?.type==='fins')return scene.textures.exists('hd-jack-dive-swim')&&scene.textures.exists('hd-wendy-dive-swim');
 const texture=mountedTexture(player);return !!texture&&scene.textures.exists(texture);
}
export function isMountedAttachment(player,source){
 const m=player?.mount;return !!m&&[m.sprite,m.head,m.wings].includes(source);
}
