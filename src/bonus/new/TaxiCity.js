export const CITY_SIZE=2520;
export const STREETS=[180,900,1620,2340];
export const ROAD_HALF=82;
export const CITY_NAMES=['Viale della Stazione','Via Verdi','Corso Milano','Viale dei Giardini'];
export const ADDRESSES=[
 {x:690,y:875,name:'Piazza Milano 12',hint:'Reception storica · quartiere Centro',building:[0,0]},
 {x:1990,y:1595,name:'Via Verdi 8',hint:'Nuova sede · ingresso sotto la pensilina',building:[2,1]}
];
export const ROADWORKS=[{x:1200,y:846,w:175,h:49}];
export function onCityRoad(x,y,r=0){
 return x>90+r&&y>90+r&&x<CITY_SIZE-90-r&&y<CITY_SIZE-90-r&&
  (STREETS.some(v=>Math.abs(x-v)<ROAD_HALF-r)||STREETS.some(v=>Math.abs(y-v)<ROAD_HALF-r))&&
  !ROADWORKS.some(o=>x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h);
}
export const lightGreen=(time,axis)=>axis==='x'?time%20<9:time%20>=10&&time%20<19;
export function trafficRoute(x1,y1,x2,y2){return [{x:x1+30,y:y1+30},{x:x2-30,y:y1+30},{x:x2-30,y:y2-30},{x:x1+30,y:y2-30}];}
export function createTraffic(){
 return Array.from({length:18},(_,i)=>{
  const row=i%3,col=Math.floor(i/3)%3,path=trafficRoute(STREETS[col],STREETS[row],STREETS[Math.min(3,col+1)],STREETS[Math.min(3,row+1)]);
  const leg=i%4,a=path[leg],b=path[(leg+1)%4],t=.16+(i%3)*.25;
  return {id:i,path,next:(leg+1)%4,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x),speed:64+i%4*9,moving:true};
 });
}
export function createWalkers(){
 return Array.from({length:36},(_,i)=>{
  const col=i%3,row=Math.floor(i/3)%3,x=STREETS[col]+105,y=STREETS[row]+105;
  const path=[{x,y},{x:x+510,y},{x:x+510,y:y+510},{x,y:y+510}],leg=i%4,a=path[leg],b=path[(leg+1)%4],t=(i%5)/5;
  return {id:i,path,next:(leg+1)%4,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x),walk:0};
 });
}
