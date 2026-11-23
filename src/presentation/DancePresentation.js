import Phaser from 'phaser';

// Crisp scalable rhythm symbols; the hit zones and timing still belong to PartyScene.
export function ensureDanceUi(scene) {
  for (const [key, outline] of [['hd-dance-arrow', false], ['hd-dance-target', true]]) {
    if (scene.textures.exists(key)) continue;
    const texture = scene.textures.createCanvas(key, 128, 128), ctx = texture.context;
    ctx.lineJoin = 'round'; ctx.lineWidth = outline ? 6 : 4;
    ctx.strokeStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = outline ? 8 : 12;
    ctx.beginPath();
    for (const [i, [x, y]] of [[64,16],[110,61],[84,61],[84,110],[44,110],[44,61],[18,61]].entries()) {
      if (!i) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    if (!outline) {
      const gradient = ctx.createLinearGradient(0,16,0,110);
      gradient.addColorStop(0,'#ffffff'); gradient.addColorStop(1,'#b9c9df');
      ctx.fillStyle = gradient; ctx.fill();
    }
    ctx.stroke(); texture.refresh(); texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
  const draw = (key, width, height, paint) => {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, width, height);
    paint(texture.context); texture.refresh(); texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  };
  draw('hd-dance-note', 80, 112, ctx => {
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(24,86,20,14,-.3,0,Math.PI*2); ctx.fill();
    ctx.lineWidth=9; ctx.lineCap='round'; ctx.strokeStyle='#fff';
    ctx.beginPath(); ctx.moveTo(40,83); ctx.lineTo(40,14); ctx.bezierCurveTo(43,20,69,20,66,42); ctx.stroke();
  });
  draw('hd-dance-glass', 88, 144, ctx => {
    ctx.strokeStyle='#e8faff'; ctx.lineWidth=4; ctx.fillStyle='#b52e50';
    ctx.beginPath(); ctx.moveTo(15,37); ctx.lineTo(73,37); ctx.bezierCurveTo(72,85,16,85,15,37); ctx.fill();
    ctx.fillStyle='#cbeeff22'; ctx.beginPath(); ctx.moveTo(12,10); ctx.lineTo(76,10);
    ctx.bezierCurveTo(86,90,2,90,12,10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(44,73); ctx.lineTo(44,125); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(44,129,28,6,0,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22,18); ctx.lineTo(23,43); ctx.stroke();
  });
  draw('hd-dance-cotechino', 240, 96, ctx => {
    const gradient=ctx.createLinearGradient(0,18,0,77);
    gradient.addColorStop(0,'#d77c67'); gradient.addColorStop(.36,'#a93f3d'); gradient.addColorStop(1,'#5d2025');
    ctx.fillStyle=gradient; ctx.strokeStyle='#47202a'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.roundRect(17,18,206,60,27); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='#e5c098'; ctx.lineWidth=3;
    for(const x of [40,80,120,160,200]) {ctx.beginPath();ctx.ellipse(x,48,8,29,0,-1.4,1.4);ctx.stroke();}
    ctx.beginPath();ctx.moveTo(20,48);ctx.lineTo(5,36);ctx.moveTo(20,48);ctx.lineTo(5,60);
    ctx.moveTo(220,48);ctx.lineTo(235,36);ctx.moveTo(220,48);ctx.lineTo(235,60);ctx.stroke();
  });
}
