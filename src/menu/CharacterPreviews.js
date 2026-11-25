// Lightweight, isolated player for existing game atlases. Never touches game physics or run state.
export function createCharacterPreviews(host, reduced=false) {
 const state={reduced,paused:false}, views=new Map();
 let elapsed=0,last=performance.now(),raf=0,disposed=false,dirty=true;
 const atlases=new Map();
function atlas(file,world=false){
 // The office sheets ship as WebP; hd-worlds is still PNG. Keep this in step with HD_ASSETS in AssetRegistry.js.
 const path=`${import.meta.env.BASE_URL}assets/${world?'hd-worlds':'hd-office'}/${file}`,ext=world?'.png':'.webp';
 if(!atlases.has(path)){const record={ready:false};atlases.set(path,record);Promise.all([fetch(path+'.json').then(r=>{if(!r.ok)throw Error(path);return r.json();}),new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=path+ext;})]).then(([data,img])=>Object.assign(record,{ready:true,data,img})).catch(()=>record.failed=true);}
 return atlases.get(path);
}
function drawSprite(ctx,sheet,key,x,bottom,height,flip=false,angle=0){
 if(!sheet.ready)return;const info=sheet.data.frames[key];if(!info)return;
 const f=info.frame,src=info.spriteSourceSize,ss=info.sourceSize,scale=height/ss.h;
 ctx.save();ctx.translate(x,bottom);ctx.rotate(angle);ctx.scale(flip?-scale:scale,scale);
 ctx.drawImage(sheet.img,f.x,f.y,f.w,f.h,src.x-ss.w/2,src.y-ss.h,f.w,f.h);ctx.restore();
}
function draw(canvas,view,t){
 const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
 const ratio=Math.min(devicePixelRatio||1,2),w=rect.width,h=rect.height;
 if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
 const c=canvas.getContext('2d');c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,w,h);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 const char=view.character,who=char==='man'?'jack':'wendy',mode=view.mode(),fixed=state.reduced||state.paused,time=state.reduced?.42:t,cycle=(time%2.2)/2.2;
 const floor=h-16, size=Math.min(h*.81,210);let x=w*.5,y=floor,flip=false,angle=0,sheet,key;
 c.strokeStyle='#d5b98540';c.lineWidth=1;c.beginPath();c.moveTo(w*.1,floor+1);c.lineTo(w*.9,floor+1);c.stroke();
 c.fillStyle='#0005';c.beginPath();c.ellipse(x,floor+2,size*.26,6,0,0,Math.PI*2);c.fill();
 if(['walk','run'].includes(mode)){
  sheet=atlas(who+'-locomotion');key=char+'_move'+(Math.floor(time*(mode==='run'?23:14))%16+1);
  if(!view.card){const sweep=Math.sin(time*(mode==='run'?2.4:1.2));x+=sweep*w*.22;flip=Math.cos(time*(mode==='run'?2.4:1.2))<0;}
 }else if(mode==='swim'){
  sheet=atlas(who+'-dive-swim',true);key='swim'+(Math.floor(time*12)%12+1);x+=Math.sin(time*.9)*w*.18;y-=Math.sin(time*2)*10+size*.1;
  c.fillStyle='#70dffb88';for(let i=0;i<4;i++){c.beginPath();c.arc(x+size*.3+i*8,floor-((time*50+i*27)%h),2.5,0,Math.PI*2);c.fill();}
 }else if(mode==='attack'){
  sheet=atlas(who+'-motion');key=char+(cycle<.6?'_attack':'_idle1');x-=w*.14;angle=cycle<.2?-.06:0;
  if(cycle>.2&&cycle<.8){const px=x+size*.35+(cycle-.2)*w*.7;c.strokeStyle='#ffd582';c.lineWidth=2;c.strokeRect(px,floor-size*.55,22,14);c.beginPath();c.moveTo(px,floor-size*.55);c.lineTo(px+11,floor-size*.55+8);c.lineTo(px+22,floor-size*.55);c.stroke();}
 }else{
  sheet=atlas('characters');let pose='idle';
  if(mode==='jump'||mode==='double'){pose=cycle<.12?'crouch':cycle<.82?'jump':'idle';const flight=Math.max(0,Math.sin(Math.PI*Math.min(1,Math.max(0,(cycle-.12)/.7))));y-=flight*size*.48;if(mode==='double'&&cycle>.4&&cycle<.75)y-=Math.sin((cycle-.4)/.35*Math.PI)*size*.18;}
  if(mode==='crouch')pose=cycle<.72?'crouch':'idle';
  if(mode==='slide'){pose=cycle<.7?'slide':'idle';x=w*.25+cycle*w*.5;}
  if(mode==='climb'){pose='climb';y-=Math.sin(time*1.6)*size*.18+size*.12;c.strokeStyle='#d0b78380';c.lineWidth=3;for(const dx of [-size*.2,size*.2]){c.beginPath();c.moveTo(x+dx,10);c.lineTo(x+dx,floor);c.stroke();}for(let rung=25;rung<floor;rung+=22){c.beginPath();c.moveTo(x-size*.2,rung);c.lineTo(x+size*.2,rung);c.stroke();}}
  key=char+'_'+pose;
 }
 drawSprite(c,sheet,key,x,y,size,flip,angle);
 if(['weapon','pause','brief','mute','exit'].includes(mode)){c.fillStyle='#0b1928e8';c.strokeStyle='#d6b678';c.lineWidth=1;const bw=Math.min(170,w*.5);c.fillRect(w-bw-12,10,bw,39);c.strokeRect(w-bw-12,10,bw,39);c.font='600 12px Segoe UI';c.textAlign='center';c.fillStyle='#f4d392';c.fillText(({weapon:['EMAIL','TEAMS','CAFFÈ','OROLOGIO','WWW'][Math.floor(time)%5],pause:'II  IN PAUSA',brief:'i  OBIETTIVO',mute:'AUDIO ON / OFF',exit:'TORNA AL MENU'})[mode],w-bw/2-12,35);}
 if(!sheet?.ready){c.fillStyle='#c3d0d9';c.font='13px Segoe UI';c.textAlign='center';c.fillText(sheet?.failed?'Sprite non disponibile':'Caricamento sprite…',w/2,h/2);}
 canvas.dataset.preview=JSON.stringify({character:char,action:mode,frame:key,paused:fixed,loaded:!!sheet?.ready});
}

 function tick(now){
  if(disposed)return;
  const dt=Math.min((now-last)/1000,.05);last=now;
  if(!host.hidden&&!document.hidden){
   if(!state.paused&&!state.reduced)elapsed+=dt;
   if(dirty||(!state.paused&&!state.reduced))for(const [canvas,view]of views)draw(canvas,view,elapsed);
   // Keep drawing until lazy sprite loads complete, even with reduced motion enabled.
   dirty=[...views.keys()].some(c=>!JSON.parse(c.dataset.preview||'{}').loaded);
  }
  raf=requestAnimationFrame(tick);
 }
 raf=requestAnimationFrame(tick);
 const resize=()=>{dirty=true;};window.addEventListener('resize',resize);
 return {
  add(canvas,character,mode='idle',card=false){views.set(canvas,{character,mode:()=>mode,card});dirty=true;},
  clear(){views.clear();elapsed=0;dirty=true;},
  pause(value){state.paused=value;dirty=true;},
  reduce(value){state.reduced=value;dirty=true;},
  destroy(){disposed=true;cancelAnimationFrame(raf);views.clear();atlases.clear();window.removeEventListener('resize',resize);}
 };
}
