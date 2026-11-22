import { DEPTH, GAME_HEIGHT } from '../config/constants.js';

export default class WorldDressing {
  constructor(scene, theme){
    const natural=theme.world==='sea'?'coral':theme.world==='desert'?'cactus':theme.world==='glacier'?'ice':null;
    const specs=theme.world==='roof'?[['ac','hd-world-executive-props',54,.05],['antenna','hd-world-executive-props',70,1.05]]:
      natural?[[natural,'hd-world-nature',65,.05],[natural,'hd-world-nature',48,.94]]:
      [['foregroundPlant','hd-dressing',78,.05],['foregroundDesk','hd-dressing',60,.62],['foregroundPlant','hd-dressing',48,1.1]];
    this.items=specs.map(([frame,key,height,fraction])=>{
      const image=scene.add.image(0,0,key,frame).setOrigin(.5,1).setDepth(DEPTH.WATER+2).setTint(0xabb1b0);
      image.setDisplaySize(height*image.frame.realWidth/image.frame.realHeight,height);
      return {image,height,fraction};
    });
  }
  update(left,top,width,height){
    for(const item of this.items){
      let x=item.fraction*width-(left*.13)%(width*1.3);if(x<-.25*width)x+=width*1.3;
      item.image.setPosition(left+x,Math.max(top+height+16,GAME_HEIGHT-64+item.height+8));
    }
  }
}
