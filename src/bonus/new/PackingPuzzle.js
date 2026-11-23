import {Round} from './physics.js';
export const PACKING_ITEMS=[
 {id:'laptop',name:'Portatile',cells:[[0,0],[1,0],[0,1],[1,1]],kind:'fragile'},
 {id:'phone',name:'Telefono',cells:[[0,0],[0,1]],kind:'fragile'},
 {id:'adapter',name:'Adattatore',cells:[[0,0],[1,0],[1,1]],kind:'heavy'},
 {id:'charger',name:'Caricatore',cells:[[0,0],[1,0]],kind:'heavy'},
 {id:'jacket',name:'Giacca',cells:[[0,0],[1,0],[2,0],[1,1]],kind:'soft'},
 {id:'underwear',name:'Ricambio',cells:[[0,0],[1,0],[0,1]],kind:'soft'},
 {id:'umbrella',name:'Ombrello',cells:[[0,0],[0,1],[0,2]],kind:'soft'}
];
export function rotatedCells(item,rotation=0){
 let cells=item.cells.map(p=>[...p]);for(let i=0;i<rotation%4;i++)cells=cells.map(([x,y])=>[-y,x]);
 const minX=Math.min(...cells.map(c=>c[0])),minY=Math.min(...cells.map(c=>c[1]));return cells.map(([x,y])=>[x-minX,y-minY]);
}
export default class PackingPuzzle extends Round {
 constructor(){super();this.level=0;this.placed={};this.selected='laptop';this.rotation=0;this.moves=0;this.blocked=[[6,3],[5,3]];}
 canPlace(id,x,y,rotation){
  const item=PACKING_ITEMS.find(i=>i.id===id);if(!item||![x,y,rotation].every(Number.isInteger))return false;
  const occupied=new Set(this.blocked.map(p=>p.join(',')));
  for(const [other,p]of Object.entries(this.placed))if(other!==id)for(const [a,b]of rotatedCells(PACKING_ITEMS.find(i=>i.id===other),p.rotation))occupied.add((a+p.x)+','+(b+p.y));
  return rotatedCells(item,rotation).every(([a,b])=>{const cx=x+a,cy=y+b;return cx>=0&&cx<7&&cy>=0&&cy<4&&!occupied.has(cx+','+cy)&&(item.kind!=='fragile'||cx<3)&&(item.kind!=='heavy'||cx>=3);});
 }
 place(id,x,y,rotation=this.rotation){
  if(!this.active||!this.canPlace(id,x,y,rotation)){if(this.active)this.message='Non entra: ruota, sposta o rispetta il reparto imbottito.';return false;}
  this.placed[id]={x,y,rotation};this.moves++;this.revision++;this.message='Oggetto sistemato';return true;
 }
 remove(id){if(!this.active||!this.placed[id])return false;delete this.placed[id];this.revision++;return true;}
 rotate(){if(!this.active)return;this.rotation=(this.rotation+1)%4;this.revision++;}
 close(){
  if(!this.active)return false;
  if(Object.keys(this.placed).length!==PACKING_ITEMS.length){this.message='Manca qualcosa sul tavolo.';return false;}
  if(this.level===1){this.end(true,'Tutto al sicuro, nessun portatile schiacciato. Si parte!');return true;}
  this.level++;this.placed={};this.blocked=[[6,0],[6,1]];this.rotation=0;this.message='Seconda valigia: il manico occupa due caselle diverse.';this.revision++;return true;
 }
}
