import { DEPTH, TEX } from '../config/constants.js';

// Bounded ambient effects; the authoritative zone still controls physics and equipment checks.
export default class WorldAtmosphere {
  constructor(scene){this.scene=scene;this.zones=[];}
  drawZone(z){
    if(!['heat','cold','wind','water'].includes(z.type))return false;
    const s=this.scene,water=z.type==='water'||z.current,cold=z.type==='cold'||z.storm;
    const tint=water?0x91e1ed:cold?0xecfaff:0xffd08b;
    const emitter=s.add.particles(0,0,TEX.FX_PX,{
      x:{min:z.x,max:z.x+z.w},y:{min:z.y,max:z.y+z.h},
      speedX:z.type==='wind'?{min:-150,max:-80}:{min:-6,max:6},
      speedY:water?{min:-35,max:-15}:cold?{min:10,max:25}:{min:-20,max:-8},
      lifespan:1600,frequency:100,maxAliveParticles:22,tint,
      scale:{start:water?1.2:.8,end:.15},alpha:{start:.45,end:0}
    }).setDepth(DEPTH.FX);
    if(z.type==='water')s.add.rectangle(z.x,z.y,z.w,z.h,0x278aa0,.055).setOrigin(0).setDepth(DEPTH.WATER);
    if(z.storm||z.current){
      z.emitters=[emitter];z.veil=s.add.rectangle(z.x,z.y,z.w,z.h,water?0x184e7a:0x8eb9ca,.13)
        .setOrigin(0).setDepth(DEPTH.FX-1).setVisible(false);emitter.stop();
    }
    this.zones.push({zone:z,emitter});return true;
  }
  update(time,left,width){
    for(const{zone:z,emitter:e}of this.zones){
      const visible=z.x+z.w>left-50&&z.x<left+width+50;
      e.emitting=visible&&(!(z.storm||z.current)||z.inside);
    }
  }
}
