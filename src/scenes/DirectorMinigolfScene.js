import Phaser from 'phaser';
import { GameState } from '../state/GameState.js';
import { preloadAssetPacks, useHdFiltering } from '../presentation/AssetRegistry.js';
import ViewportController from '../presentation/ViewportController.js';
import { toggleFullscreen } from '../systems/Screen.js';
import { audio } from '../systems/Audio8bit.js';
import { awardStageBonus } from '../bonus/StageBonusRewards.js';
import MinigolfRound from '../bonus/minigolf/MinigolfRound.js';
import { COURSES, ROOM, BALL_RADIUS } from '../bonus/minigolf/courses.js';
import { createProjection } from '../bonus/minigolf/projection.js';

const GOLD = 0xe6c58b, INK = 0x10202c;
const font = 'Segoe UI, Arial, sans-serif';

export default class DirectorMinigolfScene extends Phaser.Scene {
  constructor() { super('DirectorMinigolfScene'); }
  init(data = {}) {
    this.preview = !!data.preview; this.caller = data.caller || 'GameScene';
    this.leaving = false; this.phase = 'intro'; this.angle = -.5; this.power = .45;
    this.drag = null; this.roomNodes = []; this.uiNodes = []; this.modalNodes = [];
    this.round = new MinigolfRound(); this.toastUntil = 0;
  }
  preload() {
    preloadAssetPacks(this, ['worldShared', 'world-director']);
    const base=import.meta.env.BASE_URL+'assets/hd-minigolf/';
    if(!this.textures.exists('hd-minigolf-furniture'))this.load.atlas('hd-minigolf-furniture',base+'furniture.png',base+'furniture.json');
    if(!this.textures.exists('hd-minigolf-parquet'))this.load.image('hd-minigolf-parquet',base+'parquet.png');
  }
  create() {
    useHdFiltering(this);
    for(const key of ['hd-minigolf-furniture','hd-minigolf-parquet'])this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.prepareFloorTexture();
    this.parentScene = this.preview ? null : this.scene.get(this.caller);
    this.uiWasActive = this.scene.isActive('UIScene');
    if (this.uiWasActive) { this.scene.pause('UIScene'); this.scene.setVisible(false, 'UIScene'); }
    this.sharedViewport = this.parentScene?.presentation?.viewport || this.parentScene?.hdStage?.viewport;
    this.viewport = this.sharedViewport || new ViewportController(this, { zoom: 1 });
    this.background = this.add.image(0, 0, 'hd-world-director').setOrigin(0).setDepth(-20);
    this.backShade = this.add.rectangle(0, 0, 1, 450, 0x07121c, .42).setOrigin(0).setDepth(-19);
    this.aimGraphics = this.add.graphics().setDepth(500);
    this.ballShadow = this.add.graphics(); this.ballGraphics = this.add.graphics();
    this.powerGraphics = this.add.graphics().setDepth(602);
    this.keys = this.input.keyboard?.addKeys('LEFT,RIGHT,UP,DOWN');
    this.onKey = event => this.key(event);
    this.onDown = pointer => this.pointerDown(pointer);
    this.onMove = pointer => this.pointerMove(pointer);
    this.onUp = pointer => this.pointerUp(pointer);
    this.onCancel = () => { this.drag = null; };
    this.onBlur = () => { if (this.phase === 'play') this.pause(); };
    this.onResize = () => { this.drag = null; this.layout(); };
    this.input.keyboard?.on('keydown', this.onKey);
    this.input.keyboard?.addCapture(['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);
    this.input.on('pointerdown', this.onDown);
    this.input.on('pointermove', this.onMove);
    this.input.on('pointerup', this.onUp);
    this.input.on('pointerupoutside', this.onCancel);
    this.input.on('gameout', this.onCancel);
    this.game.events.on(Phaser.Core.Events.BLUR, this.onBlur);
    this.viewport.scene.events.on('presentation-resize', this.onResize);
    this.events.once('shutdown', this.cleanup, this);
    this.resetAim(); this.layout();
  }
  text(x, y, value, size = 13, color = '#fff5df', origin = 0) {
    return this.add.text(x, y, value, { fontFamily: font, fontSize: size, color,
      fontStyle: 'normal', lineSpacing: 4 }).setOrigin(origin, .5).setDepth(603);
  }
  button(label, x, y, action, width = 90, modal = false, accent = false) {
    const container = this.add.container(x, y).setDepth(modal ? 1004 : 604);
    const height = this.viewport.metrics.touch ? 50 : 36;
    const shape = this.add.graphics().fillStyle(accent ? 0xd7b578 : INK, .98)
      .fillRoundedRect(-width / 2, -height / 2, width, height, 7)
      .lineStyle(1, GOLD, .65).strokeRoundedRect(-width / 2, -height / 2, width, height, 7);
    const text = this.text(0, 0, label, 12, accent ? '#18242c' : '#f6e6c3', .5).setFontStyle('bold');
    const hit = this.add.rectangle(0, 0, width, height, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (pointer, x, y, event) => { event.stopPropagation(); this.drag = null; audio.unlock(); action(); });
    hit.on('pointerover', () => container.setAlpha(.86));
    hit.on('pointerout', () => container.setAlpha(1));
    container.add([shape, text, hit]);
    (modal ? this.modalNodes : this.uiNodes).push(container); return container;
  }
  clear(nodes) { nodes.splice(0).forEach(node => node.destroy()); }
  layout() {
    if (!this.background) return;
    this.w = this.viewport.metrics.width; this.viewport.setupUiCamera(this);
    this.projection = createProjection(this.w);
    this.background.setDisplaySize(this.w, 450); this.backShade.width = this.w;
    this.drawRoom(); this.drawUi(); this.drawModal(); this.renderBall();
  }
  polygon(graphics, coordinates, color, z = 0, alpha = 1, outline = null) {
    const points = coordinates.map(([x, y]) => this.projection.toScreen(x, y, z));
    graphics.fillStyle(color, alpha).fillPoints(points, true);
    if (outline !== null) graphics.lineStyle(.65, outline, .65).strokePoints(points, true);
    return points;
  }
  planeRect(g, x, y, width, height, color, z = 0, alpha = 1, outline = null) {
    return this.polygon(g, [[x,y],[x+width,y],[x+width,y+height],[x,y+height]], color, z, alpha, outline);
  }
  box(g, x, y, width, height, z, top = 0x86502b, side = 0x40291f) {
    const floor = [[x,y],[x+width,y],[x+width,y+height],[x,y+height]].map(([a,b]) => this.projection.toScreen(a,b));
    const roof = [[x,y],[x+width,y],[x+width,y+height],[x,y+height]].map(([a,b]) => this.projection.toScreen(a,b,z));
    g.fillStyle(0x050b0d,.22).fillPoints(floor.map(p => ({ x:p.x+8, y:p.y+5 })), true);
    g.fillStyle(side).fillPoints([floor[2],floor[3],roof[3],roof[2]],true);
    g.fillStyle(0x35241e).fillPoints([floor[1],floor[2],roof[2],roof[1]],true);
    g.fillStyle(top).fillPoints(roof,true).lineStyle(1,GOLD,.6).strokePoints(roof,true);
    return roof;
  }
  roomGraphic(depth = 1) { const g = this.add.graphics().setDepth(depth); this.roomNodes.push(g); return g; }
  prepareFloorTexture() {
    if(this.textures.exists('hd-minigolf-floor-projected'))return;
    // Project the material once, on the GPU upload boundary. No per-frame canvas work or extra renderer dependency.
    const texture=this.textures.createCanvas('hd-minigolf-floor-projected',2280,650);
    const ctx=texture.context;
    ctx.setTransform(2,0,.64,1.16,0,0);
    ctx.drawImage(this.textures.get('hd-minigolf-parquet').getSourceImage(),0,0,960,560);
    texture.refresh().setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
  decoration(atlas, frame, x, y, width, height, z = 0) {
    const p = this.projection.toScreen(x,y,z), s = this.projection.scale;
    const image = this.add.image(p.x,p.y,atlas,frame).setOrigin(.5,1).setDisplaySize(width*s,height*s).setDepth(100+y*.1);
    this.roomNodes.push(image); return image;
  }
  drawRoom() {
    this.clear(this.roomNodes);
    const base=this.roomGraphic(),floor=this.roomGraphic(2),s=this.projection.scale,c=this.round.course;
    const corners=this.planeRect(base,-18,-18,ROOM.width+36,ROOM.height+36,0x151c20,-22);
    base.fillStyle(0x000000,.25).fillPoints(corners.map(p=>({x:p.x+12,y:p.y+15})),true);
    const origin=this.projection.toScreen(0,0);
    const parquet=this.add.image(origin.x,origin.y,'hd-minigolf-floor-projected').setOrigin(0)
      .setDisplaySize(1140*s,325*s).setTint(0xdac6a5).setDepth(1.5);this.roomNodes.push(parquet);
    // Inlaid border and solid room rails, visually aligned with the ball's collision bounds.
    this.planeRect(floor,10,10,940,540,0,0,0,GOLD);
    this.box(floor,-12,-12,984,12,14,0xcea875,0x62462b);
    this.box(floor,-12,0,12,560,14,0xcea875,0x62462b);
    this.box(floor,960,0,12,560,14,0xcea875,0x62462b);
    const nearRail=this.roomGraphic(158);this.box(nearRail,-12,560,984,12,14,0xc9a275,0x60422c);
    for(const zone of c.surfaces) {
      if(zone.type==='rug') {
        this.planeRect(floor,zone.x,zone.y,zone.width,zone.height,0x244c40,1,1,0xd9b87f);
        this.planeRect(floor,zone.x+7,zone.y+7,zone.width-14,zone.height-14,0,1,0,0x9cbb92);
        for(let n=14;n<zone.height-10;n+=12){
          const a=this.projection.toScreen(zone.x+10,zone.y+n),b=this.projection.toScreen(zone.x+zone.width-10,zone.y+n);
          floor.lineStyle(.6,0x9bc4a5,.14).lineBetween(a.x,a.y,b.x,b.y);
        }
      }else if(zone.type==='ramp'){
        this.planeRect(floor,zone.x,zone.y,zone.width,zone.height,0xc49b64,2,1,0xf3d3a1);
        for(let n=20;n<zone.width-15;n+=24){
          const a=this.projection.toScreen(zone.x+n,zone.y+zone.height/2,3);
          floor.lineStyle(2,0x725630,.65).lineBetween(a.x-6*s,a.y-7*s,a.x+4*s,a.y).lineBetween(a.x+4*s,a.y,a.x-6*s,a.y+7*s);
        }
      }else if(zone.type==='coffee'){
        const p=this.projection.toScreen(zone.x,zone.y);
        floor.fillStyle(0x29180c,.85).fillEllipse(p.x,p.y,zone.radius*2.3*s,zone.radius*1.15*s)
          .lineStyle(2,0xb87736,.75).strokeEllipse(p.x,p.y,zone.radius*2.3*s,zone.radius*1.15*s)
          .fillStyle(0xd6a970,.35).fillEllipse(p.x-8*s,p.y-5*s,30*s,8*s);
        this.decoration('hd-world-objects','coffee',zone.x+54,zone.y+15,40,40);
      }
    }
    for(const object of c.solids)this.drawFurniture(object);
    // HD artwork dresses the perimeter; solid play geometry is always visible inside the room.
    this.decoration('hd-world-executive-props','sofa',615,-4,150,45);
    this.decoration('hd-world-objects','trophy',820,-4,30,40);
    const start=this.projection.toScreen(c.start.x,c.start.y);
    floor.lineStyle(1.5,0xf2dcac,.8).strokeEllipse(start.x,start.y,48*s,28*s);
    const cup=this.projection.toScreen(c.cup.x,c.cup.y);
    floor.fillStyle(0x091813).fillEllipse(cup.x,cup.y,c.cup.radius*2*s,c.cup.radius*1.16*s)
      .lineStyle(1.6,0xc8b679).strokeEllipse(cup.x,cup.y,c.cup.radius*2*s,c.cup.radius*1.16*s);
    const flag=this.roomGraphic(100+c.cup.y*.1);
    flag.lineStyle(2*s,0xeddcbe).lineBetween(cup.x,cup.y,cup.x,cup.y-68*s)
      .fillStyle(0xd4513e).fillTriangle(cup.x,cup.y-68*s,cup.x+34*s,cup.y-58*s,cup.x,cup.y-47*s);
    const number=this.text(cup.x+9*s,cup.y-58*s,String(this.round.holeIndex+1),10,'#ffffff');
    number.setDepth(100+c.cup.y*.1+.1);this.roomNodes.push(number);
  }
  drawFurniture(o) {
    const s=this.projection.scale, g=this.roomGraphic(100+(o.y+(o.height||o.radius))*.1);
    // The generated sprites have alpha and an elevated camera; their footprints remain the model's solids.
    if(this.textures.exists('hd-minigolf-furniture')){
      let x,y,width,height;
      if(o.radius){
        const p=this.projection.toScreen(o.x,o.y+o.radius*.35);x=p.x;y=p.y;
        width=o.radius*2.9*s;height=(o.height3d+o.radius*2.8)*s;
        g.fillStyle(0x000000,.23).fillEllipse(x+5*s,y,o.radius*2.4*s,o.radius*1.25*s);
      }else{
        const p=this.projection.toScreen(o.x+o.width/2-o.height*.16,o.y+o.height);x=p.x;y=p.y;
        width=(o.width+o.height*.32)*s;height=(o.height*.58+o.height3d)*s;
        this.planeRect(g,o.x+7,o.y+7,o.width,o.height,0x000000,0,.2);
      }
      const prop=this.add.image(x,y,'hd-minigolf-furniture',o.type).setOrigin(.5,1).setDisplaySize(width,height).setDepth(g.depth+.1);
      this.roomNodes.push(prop);return;
    }
    if(o.type==='planter'){
      const p=this.projection.toScreen(o.x,o.y),r=o.radius*s,z=o.height3d*s;
      g.fillStyle(0x000000,.2).fillEllipse(p.x+10*s,p.y+5*s,r*2.4,r*1.3)
        .fillStyle(0x644e35).fillRect(p.x-r,p.y-z,r*2,z)
        .fillStyle(0x9c8355).fillEllipse(p.x,p.y,r*2,r*.9)
        .fillStyle(0xba9e68).fillEllipse(p.x,p.y-z,r*2,r*.9)
        .fillStyle(0x2b291b).fillEllipse(p.x,p.y-z,r*1.75,r*.7);
      for(let i=0;i<14;i++){
        const a=i*2.399,reach=(20+i%4*7)*s;
        const ex=p.x+Math.cos(a)*reach,ey=p.y-z-15*s+Math.sin(a)*reach*.55;
        g.lineStyle(1.5*s,0x537540).lineBetween(p.x,p.y-z,ex,ey)
          .fillStyle([0x466c39,0x718f45,0x8da353,0x315b35][i%4])
          .fillEllipse(ex,ey,26*s,11*s);
      }
      return;
    }
    if(o.type==='books'){
      for(let n=0;n<3;n++)this.box(g,o.x+n*3,o.y+n*3,o.width-n*4,o.height-n*3,(n+1)*o.height3d/3,[0x734d45,0x2e5960,0x765329][n],0xd6cbb0);
      this.planeRect(g,o.x+15,o.y+10,o.width-28,3,GOLD,o.height3d+1);
      return;
    }
    this.box(g,o.x,o.y,o.width,o.height,o.height3d,o.type==='desk'?0xa17145:0x784e30,0x4d3025);
    if(o.type==='desk'){
      this.planeRect(g,o.x+25,o.y+25,o.width-50,o.height-50,0x234a42,o.height3d+.5,1,GOLD);
      this.planeRect(g,o.x+38,o.y+35,48,34,0xf0e6ca,o.height3d+1);
      for(let i=0;i<3;i++)this.planeRect(g,o.x+44,o.y+43+i*5,32,1,0xa99a80,o.height3d+1.1);
      const coffee=this.projection.toScreen(o.x+o.width-40,o.y+30,o.height3d+3);
      g.fillStyle(0xeee3c9).fillEllipse(coffee.x,coffee.y,17*s,9*s).fillStyle(0x382319).fillEllipse(coffee.x,coffee.y-2*s,10*s,5*s);
      const a=this.projection.toScreen(o.x+20,o.y+o.height,o.height3d/2),b=this.projection.toScreen(o.x+o.width-20,o.y+o.height,o.height3d/2);
      g.lineStyle(2*s,GOLD,.7).lineBetween(a.x,a.y,b.x,b.y);
    }else{
      // Files arranged across the cabinet top reinforce the solid obstacle's exact footprint.
      for(let i=12;i<o.height-8;i+=18){
        this.planeRect(g,o.x+9,o.y+i,o.width-18,13,[0x587161,0x81584a,0xc3a370][Math.floor(i/18)%3],o.height3d+1);
        this.planeRect(g,o.x+19,o.y+i+3,o.width-38,2,GOLD,o.height3d+1.5);
      }
    }
  }
  drawUi() {
    this.clear(this.uiNodes);
    const bars=this.add.graphics().setDepth(600).fillStyle(INK,.96).fillRect(0,0,this.w,53).fillRect(0,390,this.w,60)
      .lineStyle(1,GOLD,.45).lineBetween(0,53,this.w,53).lineBetween(0,390,this.w,390);
    this.uiNodes.push(bars);
    this.uiNodes.push(this.text(20,14,'IL GOLF DEL DIRETTORE',14,'#f4ddaf').setFontStyle('bold'));
    this.holeText=this.text(20,36,'',11,'#acc4bc');this.uiNodes.push(this.holeText);
    this.scoreText=this.text(this.w-134,26,'',12,'#f8e8c6',1);this.uiNodes.push(this.scoreText);
    this.button('Ⅱ',this.w-93,26,()=>this.pause(),40);
    this.button('⛶',this.w-41,26,()=>toggleFullscreen(),40);
    this.button('TORNA',55,420,()=>this.leave(false),84);
    this.button('RECUPERA +1',166,420,()=>{if(this.phase==='play'&&this.round.recover())this.resetAim();},124);
    this.powerX=Math.max(252,this.w/2-60);this.powerWidth=Math.min(190,this.w-430);
    this.powerText=this.text(this.powerX,402,'',10,'#c4d7ca');this.uiNodes.push(this.powerText);
    const slider=this.add.rectangle(this.powerX+this.powerWidth/2,424,this.powerWidth+20,36,0,0).setInteractive({useHandCursor:true}).setDepth(604);
    slider.on('pointerdown',(p,x,y,event)=>{
      event.stopPropagation();if(this.phase!=='play'||this.round.phase!=='aim')return;
      this.drag={id:p.id,type:'power'};this.setPointerPower(p);
    });this.uiNodes.push(slider);
    this.shootButton=this.button('TIRA',this.w-64,420,()=>this.shoot(),96,false,true);
    this.helpText=this.text(this.w/2,371,'',11,'#fff0d6',.5).setDepth(600)
      .setBackgroundColor('#10202cdd').setPadding(10,5);this.uiNodes.push(this.helpText);
    this.helpText.setText(this.viewport.metrics.touch?'Tocca per mirare · regola la forza · TIRA':'Clic per mirare · trascina dalla pallina per tirare · frecce / SPAZIO');
    this.updateHud();
  }
  updateHud() {
    const r=this.round,c=r.course;
    this.holeText?.setText('BUCA '+(r.holeIndex+1)+' / '+r.courses.length+'  ·  '+c.name+'  ·  PAR '+c.par);
    this.scoreText?.setText('COLPI '+r.strokes+' / '+c.maxStrokes+'   |   TOTALE '+r.totalStrokes);
    this.powerText?.setText('FORZA  '+Math.round(this.power*100)+'%');
    this.powerGraphics.clear().fillStyle(0x34474c).fillRoundedRect(this.powerX,420,this.powerWidth,8,4)
      .fillStyle(GOLD).fillRoundedRect(this.powerX,420,Math.max(4,this.powerWidth*this.power),8,4)
      .fillStyle(0xfff0d1).fillCircle(this.powerX+this.powerWidth*this.power,424,6);
    this.shootButton?.setAlpha(this.phase==='play'&&r.phase==='aim'?1:.4);
  }
  drawModal() {
    this.clear(this.modalNodes);
    if(this.phase==='play')return;
    const r=this.round,c=r.course,w=Math.min(480,this.w-40),x=this.w/2;
    const shade=this.add.rectangle(this.w/2,225,this.w,450,0x030c12,.55).setDepth(1000).setInteractive();
    shade.on('pointerdown',(p,lx,ly,event)=>event.stopPropagation());this.modalNodes.push(shade);
    const card=this.add.graphics().setDepth(1001).fillStyle(0x10252c,.98).fillRoundedRect(x-w/2,82,w,276,16)
      .lineStyle(1,GOLD,.8).strokeRoundedRect(x-w/2,82,w,276,16);this.modalNodes.push(card);
    let title,description,label,action;
    if(this.phase==='intro'){
      title='L’ufficio è il tuo campo.';
      description='Tre buche tra parquet, scrivanie e tappeti.\nScegli direzione e forza: ogni rimbalzo conta.\n\nTrascina indietro dalla pallina e rilascia,\noppure tocca il campo, regola la forza e premi TIRA.\n\n'+c.tip;
      label='ENTRA NELL’ATTICO';action=()=>{audio.unlock();this.phase='play';this.drawModal();};
    }else if(this.phase==='pause'){
      title='Una pausa dalla pausa.';description='Pallina ferma, colpi conservati.\n\nFrecce ← →: direzione · ↑ ↓: forza\nSPAZIO: tira · R: recupera (+1 colpo)\nP / ESC: pausa · F: schermo intero';
      label='RIPRENDI';action=()=>this.pause();
    }else if(r.finished){
      title=r.won?'Il direttore offre il caffè.':'Il direttore reclama l’ufficio.';
      const par=r.courses.reduce((sum,h)=>sum+h.par,0);
      description=r.won?'Tutte le '+r.courses.length+' buche completate.\n'+r.totalStrokes+' colpi · Par '+par+'\n\n'+(this.preview?'Prova libera: nessuna modifica alla campagna.':'Premio: +10 salute · −10 stress · +15 €'):
        'Hai raggiunto il limite di colpi di questa buca.\n\nPuoi proseguire la storia senza penalità.';
      label=this.preview?'GIOCA ANCORA':'TORNA AL LIVELLO';action=()=>this.preview?this.restartRound():this.leave(r.won);
    }else{
      title='In buca!';description=c.name+'\n'+r.strokes+' colpi · Par '+c.par+'\n\nProssima: '+r.courses[r.holeIndex+1].name+'\n'+r.courses[r.holeIndex+1].tip;
      label='PROSSIMA BUCA';action=()=>{r.nextHole();this.phase='play';this.resetAim();this.layout();};
    }
    const heading=this.text(x,115,title,22,'#f3d49a',.5).setFontStyle('bold').setDepth(1002);
    const body=this.text(x,213,description,13,'#d7e4de',.5).setAlign('center').setWordWrapWidth(w-40).setDepth(1002);
    this.modalNodes.push(heading,body);
    this.modalAction=action;this.button(label,x,319,action,230,true,true);
    if(this.phase==='pause'||this.phase==='intro')this.button('TORNA',this.w-56,420,()=>this.leave(false),86,true);
    if(this.phase==='result'&&this.preview)this.button('MENU',this.w-56,420,()=>this.leave(false),86,true);
  }
  restartRound(){this.round=new MinigolfRound();this.phase='play';this.resetAim();this.layout();}
  resetAim(){const b=this.round.ball,c=this.round.course.cup;this.angle=Math.atan2(c.y-b.y,c.x-b.x);this.power=.45;this.drag=null;}
  pointerPosition(pointer){return this.cameras.main.getWorldPoint(pointer.x,pointer.y);}
  setPointerPower(pointer){const p=this.pointerPosition(pointer);this.power=Phaser.Math.Clamp((p.x-this.powerX)/this.powerWidth,.04,1);}
  pointerDown(pointer){
    if(this.phase!=='play'||this.round.phase!=='aim'||this.drag)return;
    const screen=this.pointerPosition(pointer),point=this.projection.toFloor(screen.x,screen.y),ball=this.round.ball;
    if(screen.y<54||screen.y>355||point.x<0||point.x>ROOM.width||point.y<0||point.y>ROOM.height)return;
    const origin=this.projection.toScreen(ball.x,ball.y);
    if(Math.hypot(screen.x-origin.x,screen.y-origin.y)<28){
      this.drag={id:pointer.id,type:'shot',start:point,moved:false};
    }else this.angle=Math.atan2(point.y-ball.y,point.x-ball.x);
  }
  pointerMove(pointer){
    if(!this.drag||pointer.id!==this.drag.id||this.phase!=='play')return;
    if(this.drag.type==='power'){this.setPointerPower(pointer);return;}
    const screen=this.pointerPosition(pointer),p=this.projection.toFloor(screen.x,screen.y);
    const dx=this.drag.start.x-p.x,dy=this.drag.start.y-p.y,distance=Math.hypot(dx,dy);
    if(distance>10){this.drag.moved=true;this.angle=Math.atan2(dy,dx);this.power=Phaser.Math.Clamp(distance/260,.04,1);}
  }
  pointerUp(pointer){
    if(!this.drag||pointer.id!==this.drag.id)return;
    const fire=this.drag.type==='shot'&&this.drag.moved;this.drag=null;if(fire)this.shoot();
  }
  key(event){
    if(event.repeat)return;const key=event.key.toLowerCase();
    if(key==='f'){toggleFullscreen();return;}
    if(key==='p'||key==='escape'){this.pause();return;}
    if(this.phase!=='play'){if(key==='enter'||key===' ')this.modalAction?.();return;}
    if(key===' '||key==='enter')this.shoot();
    if(key==='r'&&this.round.recover())this.resetAim();
  }
  shoot(){if(this.phase==='play'&&this.round.shoot(this.angle,this.power)){audio.unlock();this.drag=null;}}
  pause(){
    if(!['play','pause'].includes(this.phase))return;
    const paused=this.phase==='play';this.phase=paused?'pause':'play';this.round.setPaused(paused);
    this.drag=null;this.input.keyboard?.resetKeys();this.drawModal();
  }
  renderBall(){
    if(!this.projection)return;
    const r=this.round,b=r.ball,p=this.projection.toScreen(b.x,b.y),s=this.projection.scale;
    this.ballShadow.clear().setDepth(100+b.y*.1).fillStyle(0x000000,.35).fillEllipse(p.x+3*s,p.y+3*s,22*s,10*s);
    this.ballGraphics.clear().setDepth(100+b.y*.1+.2);
    this.aimGraphics.clear();
    if(r.phase==='complete')return;
    if(r.phase==='aim'&&this.phase==='play'){
      this.aimGraphics.lineStyle(1.2,GOLD,.6).strokeEllipse(p.x,p.y,40*s,24*s);
      for(const [i,point] of r.predict(this.angle,this.power).entries()){
        const v=this.projection.toScreen(point.x,point.y);
        this.aimGraphics.fillStyle(GOLD,Math.max(.2,1-i*.055)).fillCircle(v.x,v.y,2.2);
      }
      const end=this.projection.toScreen(b.x-Math.cos(this.angle)*(20+this.power*75),b.y-Math.sin(this.angle)*(20+this.power*75));
      this.aimGraphics.lineStyle(3,0xb88a52,.85).lineBetween(end.x,end.y,p.x-Math.cos(this.angle)*14*s,p.y-Math.sin(this.angle)*8*s);
    }
    if(r.moving)for(const [i,t]of r.trail.entries()){
      const q=this.projection.toScreen(t.x,t.y);this.aimGraphics.fillStyle(0xffe1a2,i/r.trail.length*.2).fillCircle(q.x,q.y,3*s);
    }
    this.ballGraphics.fillStyle(0xc9d3cd).fillCircle(p.x,p.y-4*s,BALL_RADIUS*s)
      .fillStyle(0xfffdf0).fillCircle(p.x-1.5*s,p.y-6*s,BALL_RADIUS*s*.8)
      .lineStyle(1.2*s,0x98713f).lineBetween(p.x-4*s,p.y-5*s,p.x+4*s,p.y-3*s)
      .fillStyle(0xffffff).fillCircle(p.x-3*s,p.y-8*s,2*s);
  }
  update(_,delta){
    if(!this.holeText)return;
    const r=this.round;
    if(this.phase==='play'){
      if(r.phase==='aim'&&!this.drag){
        const dt=Math.min(delta/1000,.1);
        this.angle+=((this.keys?.RIGHT.isDown?1:0)-(this.keys?.LEFT.isDown?1:0))*1.6*dt;
        this.power=Phaser.Math.Clamp(this.power+((this.keys?.UP.isDown?1:0)-(this.keys?.DOWN.isDown?1:0))*.45*dt,.04,1);
      }
      r.update(delta/1000);
      for(const event of r.drainEvents()){
        if(event==='shot')audio.sfx('hat');
        if(event==='impact'&&r.elapsed-(this.lastImpact||0)>.12){audio.sfx('select');this.lastImpact=r.elapsed;}
        if(event==='cup'){audio.sfx('perfect');this.phase='result';this.drawModal();}
        if(event==='limit'){this.phase='result';this.drawModal();}
        if(event==='recovery'){audio.sfx('splash');this.helpText.setText('Pallina recuperata · +1 colpo');this.toastUntil=this.time.now+2300;this.resetAim();}
      }
    }
    this.updateHud();this.renderBall();
    if(this.toastUntil&&this.time.now>this.toastUntil){this.toastUntil=0;this.helpText.setText(this.round.course.tip);}
    if(import.meta.env.DEV)this.game.canvas.dataset.minigolf=JSON.stringify({phase:this.phase,hole:r.holeIndex+1,ball:{x:r.ball.x,y:r.ball.y},moving:r.moving,strokes:r.strokes,preview:this.preview,paused:r.paused});
  }
  leave(apply){
    if(this.leaving)return;this.leaving=true;
    if(!this.preview&&apply&&this.round.won)awardStageBonus(GameState,'golf',this.round.reward());
    if(this.preview){this.scene.start('BonusHubScene');return;}
    if(this.parentScene?.sys&&this.scene.isPaused(this.caller)){
      this.parentScene.resumedAt=performance.now();this.parentScene.input.keyboard?.resetKeys();this.parentScene.inputCtl?.reset?.();this.scene.resume(this.caller);
    }
    this.scene.stop();
  }
  cleanup(){
    this.input.keyboard?.off('keydown',this.onKey);
    this.input.off('pointerdown',this.onDown);this.input.off('pointermove',this.onMove);this.input.off('pointerup',this.onUp);
    this.input.off('pointerupoutside',this.onCancel);this.input.off('gameout',this.onCancel);
    this.game.events.off(Phaser.Core.Events.BLUR,this.onBlur);
    this.viewport?.scene?.events.off('presentation-resize',this.onResize);
    if(!this.sharedViewport)this.viewport?.destroy();
    if(this.uiWasActive&&this.scene.isPaused('UIScene')){this.scene.resume('UIScene');this.scene.setVisible(true,'UIScene');}
    delete this.game.canvas.dataset.minigolf;
  }
}
