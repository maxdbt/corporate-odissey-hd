import Phaser from 'phaser';
import {STAGE_BONUSES} from '../bonus/StageBonusCatalog.js';
import ViewportController from '../presentation/ViewportController.js';
import {preloadAssetPacks,useHdFiltering} from '../presentation/AssetRegistry.js';
import {audio} from '../systems/Audio8bit.js';
export default class BonusHubScene extends Phaser.Scene {
 constructor(){super('BonusHubScene');}
 preload(){preloadAssetPacks(this,['worldShared','world-director']);}
 create(){
  useHdFiltering(this);this.viewport=new ViewportController(this,{zoom:1});this.nodes=[];this.selected=0;
  this.onResize=()=>this.layout();this.viewport.scene.events.on('presentation-resize',this.onResize);
  this.onKey=e=>{if(e.repeat)return;const key=e.key;if(key>='1'&&key<='8')this.open(STAGE_BONUSES[+key-1]);else if(key==='Escape')this.scene.start('MenuScene');};
  this.input.keyboard?.on('keydown',this.onKey);this.events.once('shutdown',()=>{this.input.keyboard?.off('keydown',this.onKey);this.viewport.scene.events.off('presentation-resize',this.onResize);this.viewport.destroy();});this.layout();
 }
 open(b){audio.unlock();this.scene.start(b.id==='golf'?'DirectorMinigolfScene':b.id==='taxi'?'CityTaxiScene':'StageBonusScene',{bonus:b.id,preview:true});}
 layout(){
  this.nodes.splice(0).forEach(n=>n.destroy());this.viewport.setupUiCamera(this);const w=this.viewport.metrics.width,add=n=>{this.nodes.push(n);return n;};
  add(this.add.image(w/2,225,'hd-world-director').setDisplaySize(w,450));add(this.add.rectangle(0,0,w,450,0x071923,.68).setOrigin(0));
  add(this.add.text(w/2,23,'LE PAUSE IMPOSSIBILI',{fontFamily:'Segoe UI, Arial',fontSize:24,fontStyle:'bold',color:'#ffe4aa'}).setOrigin(.5));
  add(this.add.text(w/2,54,'Otto giochi diversi · scegli una pausa',{fontFamily:'Segoe UI, Arial',fontSize:13,color:'#d8e6e2'}).setOrigin(.5));
  const cw=Math.min(430,(w-48)/2),gap=16,left=(w-(cw*2+gap))/2;
  STAGE_BONUSES.forEach((b,i)=>{
   const x=left+(i%2)*(cw+gap),y=83+Math.floor(i/2)*78;
   const box=add(this.add.rectangle(x,y,cw,66,0x102a36,.95).setOrigin(0).setStrokeStyle(1,0xc6aa72,.65).setInteractive({useHandCursor:true}));box.on('pointerdown',()=>this.open(b));box.on('pointerover',()=>box.setFillStyle(0x284b53,.99));box.on('pointerout',()=>box.setFillStyle(0x102a36,.95));
   add(this.add.image(x+35,y+33,'hd-world-'+b.atlas,b.frame).setDisplaySize(43,43));
   add(this.add.text(x+67,y+12,`${i+1}. ${b.title}`,{fontFamily:'Segoe UI, Arial',fontSize:w<750?12:14,fontStyle:'bold',color:'#ffe5b2',wordWrap:{width:cw-78}}));
   add(this.add.text(x+67,y+46,`${b.genre}  ·  Stage ${b.stage}`,{fontFamily:'Segoe UI, Arial',fontSize:11,color:'#b4d8d5'}));
  });
  add(this.add.text(w/2,422,'← TORNA ALLA CAMPAGNA',{fontFamily:'Segoe UI, Arial',fontSize:14,color:'#ffe4aa',backgroundColor:'#102a36',padding:{x:18,y:9}}).setOrigin(.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.scene.start('MenuScene')));
 }
}
