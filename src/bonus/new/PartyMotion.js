import {clamp} from './physics.js';

// Render between fixed simulation steps, including the animation's travelled distance.
export function partyPose(person,fraction){
 const a=person.previous||person,t=clamp(fraction,0,1);
 return {x:a.x+(person.x-a.x)*t,y:a.y+(person.y-a.y)*t,walk:a.walk+(person.walk-a.walk)*t};
}
export function partyFrames(phase){
 const whole=Math.floor(phase),index=((whole%12)+12)%12,t=phase-whole;
 return [{frame:index+1,weight:1-t},{frame:(index+1)%12+1,weight:t}];
}
