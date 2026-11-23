import {Round} from './physics.js';
export const PARKING_LAYOUTS=[
 [{id:'you',x:0,y:2,n:2,axis:'x'}, {id:'a',x:2,y:1,n:3,axis:'y'},{id:'b',x:4,y:0,n:3,axis:'y'},{id:'c',x:0,y:4,n:2,axis:'x'},{id:'d',x:3,y:5,n:2,axis:'x'},{id:'e',x:0,y:0,n:2,axis:'x'}],
 [{id:'you',x:0,y:3,n:2,axis:'x'}, {id:'a',x:2,y:2,n:3,axis:'y'},{id:'b',x:4,y:2,n:2,axis:'y'},{id:'c',x:1,y:0,n:3,axis:'x'},{id:'d',x:3,y:5,n:3,axis:'x'},{id:'e',x:5,y:0,n:2,axis:'y'}],
 [{id:'you',x:0,y:2,n:2,axis:'x'}, {id:'a',x:2,y:0,n:3,axis:'y'},{id:'b',x:3,y:1,n:3,axis:'y'},{id:'c',x:4,y:2,n:2,axis:'y'},{id:'d',x:0,y:4,n:2,axis:'x'},{id:'e',x:3,y:5,n:2,axis:'x'}]
];
export function parkingCells(car){return Array.from({length:car.n},(_,i)=>[car.x+(car.axis==='x'?i:0),car.y+(car.axis==='y'?i:0)]);}
export default class ParkingPuzzle extends Round {
 constructor(){super();this.level=0;this.moves=0;this.history=[];this.load();}
 load(){this.cars=structuredClone(PARKING_LAYOUTS[this.level]);this.selected='you';this.history=[];this.revision++;}
 move(id,delta){
  if(!this.active||!Number.isInteger(delta)||!delta)return false;
  const car=this.cars.find(c=>c.id===id);if(!car)return false;
  const dir=Math.sign(delta),occupied=new Set(this.cars.filter(c=>c!==car).flatMap(parkingCells).map(p=>p.join(',')));
  let amount=0,escaped=false;
  for(let i=1;i<=Math.min(6,Math.abs(delta));i++){
   const candidate={...car,[car.axis]:car[car.axis]+dir*i};
   if(car.id==='you'&&candidate.x>4&&dir>0){escaped=true;amount=i;break;}
   const cells=parkingCells(candidate);
   if(cells.some(([x,y])=>x<0||x>5||y<0||y>5||occupied.has(x+','+y)))break;
   amount=i;
  }
  if(!amount)return false;
  this.history.push(structuredClone(this.cars));car[car.axis]+=dir*amount;this.moves++;this.revision++;
  if(escaped){if(this.level===2)this.end(true,'Tre parcheggi liberati. A casa prima di Natale!');else{this.level++;this.load();this.message='Parcheggio successivo';}}
  return true;
 }
 undo(){if(!this.active||!this.history.length)return false;this.cars=this.history.pop();this.moves++;this.revision++;return true;}
}
