import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { setupStaticCamera } from '../utils/view.js';

// Pauses the entire source scene, including its choice timers and combat, with no duplicated simulation.
export default class StagePauseScene extends Phaser.Scene {
  constructor(){super('StagePauseScene');}
  init(data){this.caller=data.caller;this.leaving=false;}
  create(){
    const parent=this.scene.get(this.caller);
    this.overlayViewport=parent.hdStage?.viewport;
    setupStaticCamera(this);
    this.add.rectangle(GAME_WIDTH/2,GAME_HEIGHT/2,GAME_WIDTH*3,GAME_HEIGHT*3,0x061322,.8).setInteractive();
    const panel=this.add.graphics();
    panel.fillStyle(0x122a3d,.97).fillRoundedRect(GAME_WIDTH/2-220,145,440,160,16)
      .lineStyle(1.5,0xd4b77b).strokeRoundedRect(GAME_WIDTH/2-220,145,440,160,16);
    this.add.text(GAME_WIDTH/2,178,'PAUSA CAFFÈ',{fontFamily:'Segoe UI, Arial',fontSize:'26px',color:'#ffe3aa'}).setOrigin(.5);
    this.add.text(GAME_WIDTH/2,222,'Il viaggio e tutti i timer sono sospesi.',{fontFamily:'Segoe UI, Arial',fontSize:'15px',color:'#fff'}).setOrigin(.5);
    this.add.text(GAME_WIDTH/2,271,'RIPRENDI  ·  INVIO / P',{fontFamily:'Segoe UI, Arial',fontSize:'17px',color:'#9ce6c5',padding:{x:35,y:10}})
      .setOrigin(.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.resume());
    this.input.keyboard?.on('keydown',ev=>{if(['Enter',' ','p','P','Escape'].includes(ev.key))this.resume();});
  }
  resume(){
    if(this.leaving)return;this.leaving=true;
    const parent=this.scene.get(this.caller);parent.input.keyboard?.resetKeys();parent.resumedAt=performance.now();
    this.scene.resume(this.caller);this.scene.stop();
  }
}
