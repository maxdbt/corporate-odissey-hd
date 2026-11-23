const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const colours=['#d9d8ce','#e4ddc9','#c5cdc9','#d5ccb8'];
const validColour=value=>typeof value==='string'&&/^(#[\da-f]{3,8}|ivory|white|beige|grey|gray|brown|red|silver)$/i.test(value);
function outline(c,b,dy=0){
 c.beginPath();for(const points of [b.points,...(b.holes||[])]){points.forEach(([x,y],i)=>i?c.lineTo(x,y+dy):c.moveTo(x,y+dy));c.closePath();}
}
export function buildingStyle(b){
 const seed=Math.abs(b.id),residential=['apartments','residential','house','detached'].includes(b.kind);
 const metres=b.height??(b.levels?b.levels*3.2:residential?13:18),levels=b.levels??Math.max(1,Math.round(metres/3.2));
 const tiled=['gabled','hipped','pyramidal'].includes(b.roofShape)||!b.roofShape&&residential&&seed%3===0;
 return {metres,levels,depth:clamp(metres*.72,7,32),tiled,seed,
  roof:validColour(b.roofColour)?b.roofColour:tiled?'#b98262':colours[seed%colours.length],
  wall:validColour(b.colour)?b.colour:seed%3?'#d2c5a9':'#becbc6'};
}
// Retain OSM footprints/courtyards. Height is compressed for a readable overhead driving view.
export function drawBuilding(c,b,atlas){
 const box=b.bounds,w=box.maxX-box.minX,h=box.maxY-box.minY;if(w<3||h<3)return;
 const style=buildingStyle(b),depth=Math.min(style.depth,Math.min(w,h)*.35),cx=(box.minX+box.maxX)/2,cy=(box.minY+box.maxY)/2;
 c.save();c.translate(8,12);outline(c,b);c.fillStyle='rgba(29,39,36,.25)';c.fill('evenodd');c.restore();
 // Walls have real footprint edges, separate floors and window bays.
 for(const points of [b.points,...(b.holes||[])])for(let i=1;i<points.length;i++){
  const a=points[i-1],d=points[i],len=Math.hypot(d[0]-a[0],d[1]-a[1]);if(len<4)continue;
  c.save();c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(d[0],d[1]);c.lineTo(d[0],d[1]-depth);c.lineTo(a[0],a[1]-depth);c.closePath();
  const wall=c.createLinearGradient(a[0],a[1]-depth,d[0],d[1]);wall.addColorStop(0,style.wall);wall.addColorStop(1,'#78847c');c.fillStyle=wall;c.fill();c.clip();
  c.transform((d[0]-a[0])/len,(d[1]-a[1])/len,0,1,a[0],a[1]-depth);
  const floors=Math.min(5,Math.max(1,Math.round(style.levels))),floorHeight=depth/floors;
  for(let floor=0;floor<floors;floor++)for(let at=6;at<len-4;at+=11){
   const x=at,y=floor*floorHeight+1;
   c.fillStyle=(Math.floor(at)+floor+style.seed)%5===0?'#bdcbbb':'#365c62';c.fillRect(x-2.5,y,5,Math.max(1,floorHeight-2));
   c.fillStyle='rgba(239,248,221,.55)';c.fillRect(x-2.5,y,4,1);
  }
  c.strokeStyle='rgba(246,235,210,.4)';c.lineWidth=.7;for(let floor=1;floor<floors;floor++){c.beginPath();c.moveTo(0,floor*floorHeight);c.lineTo(len,floor*floorHeight);c.stroke();}c.restore();
 }
 c.save();c.translate(0,-depth);outline(c,b);c.fillStyle=style.roof;c.fill('evenodd');c.strokeStyle='#7f8a7e';c.lineWidth=3;c.stroke();c.clip('evenodd');
 let angle=0,longest=0;for(let i=1;i<b.points.length;i++){const a=b.points[i-1],d=b.points[i],len=Math.hypot(d[0]-a[0],d[1]-a[1]);if(len>longest){longest=len;angle=Math.atan2(d[1]-a[1],d[0]-a[0]);}}
 c.save();c.translate(cx,cy);c.rotate(angle);const span=Math.hypot(w,h);
 // Roof details follow the building's own orientation instead of stretching a repeated sprite.
 c.lineWidth=style.tiled?.7:1;c.strokeStyle=style.tiled?'rgba(111,64,45,.32)':'rgba(113,127,118,.18)';
 for(let y=-span;y<span;y+=style.tiled?5:22){c.beginPath();c.moveTo(-span,y);c.lineTo(span,y);c.stroke();}
 if(!style.tiled&&w>55&&h>55){
  for(let i=0;i<Math.min(8,Math.floor(w*h/8500)+1);i++){
   const x=((style.seed*(i+7)*17)%1000/1000-.5)*w*.65,y=((style.seed*(i+3)*31)%1000/1000-.5)*h*.65;
   c.fillStyle='rgba(41,55,52,.2)';c.fillRect(x+3,y+4,16,11);c.fillStyle='#aebcb5';c.fillRect(x,y,16,11);
   c.fillStyle=i%2?'#547e83':'#7d8c84';c.fillRect(x+2,y+2,12,7);c.strokeStyle='#d7e0d4';c.strokeRect(x+.5,y+.5,15,10);
  }
  if(w>100&&h>65){
   c.fillStyle='rgba(37,57,52,.15)';c.fillRect(-24,-13,53,29);c.fillStyle='#c5d0c6';c.fillRect(-26,-16,50,26);
   const glass=c.createLinearGradient(-24,-14,22,8);glass.addColorStop(0,'#9dbfc0');glass.addColorStop(1,'#3d686f');c.fillStyle=glass;c.fillRect(-23,-13,44,20);
   c.strokeStyle='#d8e2d4';c.lineWidth=1.2;for(let col=-23;col<=21;col+=11){c.beginPath();c.moveTo(col,-13);c.lineTo(col,7);c.stroke();}
   c.beginPath();c.moveTo(-23,-3);c.lineTo(21,-3);c.stroke();
  }
 }
 c.restore();
 const glow=c.createLinearGradient(box.minX,box.minY,box.maxX,box.maxY);glow.addColorStop(0,'rgba(255,248,214,.25)');glow.addColorStop(1,'rgba(51,69,63,.18)');c.fillStyle=glow;c.fillRect(box.minX,box.minY,w,h);
 // Bespoke illustrated monuments remain distinct from ordinary offices and homes.
 if(b.art){const f=atlas.get(b.art),size=Math.min(w,h)*1.18;c.drawImage(f.source.image,f.cutX,f.cutY,f.cutWidth,f.cutHeight,cx-size/2,cy-size/2,size,size);}
 c.restore();c.save();c.translate(0,-depth);outline(c,b);c.strokeStyle='rgba(255,244,208,.8)';c.lineWidth=1.2;c.stroke();c.restore();
}
