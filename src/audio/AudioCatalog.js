// Original, compact scores. Durations use beats; no samples, downloads or service keys.
export const STAGE_IDS = ['1-1','1-2','2-1','3-1','4-1','4-2','4-3','4-4','4-5','4-6','4-7','4-8','4-9','4-10','5-1','5-2','5-3','5-4','5-5'];
const scales = { major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10], dorian:[0,2,3,5,7,9,10], harmonic:[0,2,3,5,7,8,11], pentatonic:[0,2,4,7,9] };
const note = (root, degree, scale) => degree < 0 ? null : root + scale[degree % scale.length] + 12*Math.floor(degree/scale.length);
const rhythm = {
 even:[.5,.5,1,1,.5,.5,1,3], sync:[.75,.25,1,.5,.5,1,1,3],
 airy:[1,1,.5,1.5,1,1,1,1], march:[.5,.5,.5,.5,1,1,1,3]
};

function score(title,bpm,root,mode,instrument,motif,groove='even',energy=.5) {
 const scale=scales[mode], r=rhythm[groove], events=[];
 const progression=[0,mode==='major'?3:5,4,0];
 for(let phrase=0;phrase<4;phrase++){
  let beat=phrase*8;
  motif.forEach((degree,i)=>{
   // The second half answers the first, leaving space at phrase endings.
   const d=phrase===2&&i<4&&degree>=0?degree+2:degree;
   const pitch=note(root,d,scale);
   if(pitch!==null)events.push({at:beat,duration:Math.min(r[i]*.78,1.15),midi:pitch,instrument,gain:.29});
   beat+=r[i];
  });
  const base=note(root-24,progression[phrase],scale);
  for(let b=0;b<8;b+=2)events.push({at:phrase*8+b,duration:1.2,midi:base+(b===6?7:0),instrument:'bass',gain:.32});
  // Low, soft sustained harmony; sparse percussion never goes through the effects bus.
  for(const interval of [0,mode==='major'?4:3,7])events.push({at:phrase*8,duration:6.8,midi:base+12+interval,instrument:'pad',gain:.045});
  if(energy>.3)for(const b of [0,4])events.push({at:phrase*8+b,duration:.15,drum:'kick',gain:.13*energy});
  if(energy>.6)for(const b of [2,6])events.push({at:phrase*8+b,duration:.06,drum:'brush',gain:.07*energy});
 }
 return {title,bpm,beats:32,root,mode,instrument,events:events.sort((a,b)=>a.at-b.at),jingle:motif.filter(n=>n>=0).slice(0,4).map(d=>note(root,d,scale))};
}

// Every stage has its own melody, harmony, tempo and orchestration.
export const STAGE_TRACKS = {
 '1-1':score('Natale in ufficio · Campanelli dopo le sei',108,74,'major','bell',[2,4,7,6,4,2,1,0],'even',.45),
 '1-2':score('Estate d’inferno · Ventilatore in levare',116,69,'dorian','pluck',[0,2,4,5,4,2,6,4],'sync',.7),
 '2-1':score('Pausa pranzo · Vassoio swing',104,65,'major','mallet',[2,5,4,1,3,2,1,0],'sync',.45),
 '3-1':score('Il limbo dei Post-it · Ordine del giorno',110,62,'minor','marimba',[0,4,3,1,0,2,1,-1],'march',.55),
 '4-1':score('Il cliente lontano · Rotta da definire',94,67,'major','piano',[0,1,4,2,5,4,2,1],'airy',.2),
 '4-2':score('Il mezzo · Valigia pronta',112,72,'major','pluck',[4,2,0,1,3,5,4,-1],'sync',.45),
 '4-3':score('Aeroporto · Gate 24',118,71,'dorian','glass',[0,2,5,4,6,5,2,0],'even',.65),
 '4-4':score('Stazione · Binario dispari',120,64,'minor','marimba',[0,0,4,3,2,4,1,0],'march',.72),
 '4-5':score('Il volo · Sopra le nuvole',82,74,'major','glass',[4,6,7,4,2,1,2,-1],'airy',.12),
 '4-6':score('Il treno · Paesaggio in corsa',106,67,'dorian','piano',[0,2,3,4,2,1,5,4],'sync',.6),
 '4-7':score('Deserto · Oasi fuori sede',98,64,'harmonic','pluck',[0,1,2,4,5,4,6,4],'sync',.5),
 '4-8':score('Ghiacciaio · Cristalli e scadenze',88,71,'minor','glass',[7,4,5,2,3,1,2,0],'airy',.2),
 '4-9':score('Mare · Ufficio sommerso',78,69,'pentatonic','water',[0,2,4,3,2,1,3,-1],'airy',.1),
 '4-10':score('Il cliente · Clausole in sospeso',101,66,'minor','piano',[0,3,2,4,1,3,2,0],'sync',.45),
 '5-1':score('Finance · Saldo in movimento',121,62,'dorian','mallet',[0,4,2,5,3,6,4,2],'sync',.7),
 '5-2':score('Risorse umane · Sorriso obbligatorio',102,70,'major','piano',[2,1,4,3,5,2,6,4],'even',.4),
 '5-3':score('Segreteria · Agenda incrociata',126,68,'minor','marimba',[0,2,1,4,3,2,5,4],'march',.72),
 '5-4':score('Attico · Il prezzo della poltrona',96,60,'harmonic','reed',[0,4,6,5,4,3,1,0],'airy',.6),
 '5-5':score('Tetto · Ultimo piano',132,62,'minor','reed',[0,2,4,7,6,4,5,4],'march',.85)
};
export const TRACKS = {
 ...STAGE_TRACKS,
 menu:score('Corporate Odyssey',106,67,'major','piano',[0,2,4,6,5,4,2,0],'sync',.4),
 elevator:score('Ascensore · Attendere prego',84,65,'major','piano',[2,1,0,5,4,2,1,-1],'airy',.1),
 island:score('Ferie · Fuori ufficio',100,72,'pentatonic','mallet',[2,4,3,2,1,2,0,-1],'sync',.4),
 space:score('Caccia ai ricavi',128,69,'minor','glass',[0,2,4,7,6,4,2,-1],'even',.7),
 promotion:score('Promozione temporanea',142,72,'major','mallet',[0,2,4,7,6,4,5,7],'march',.7),
 bathroom:score('Tre porte e un imprevisto',86,60,'minor','marimba',[0,-1,1,4,2,-1,1,-1],'airy',.1),
 'boss-client':score('Cliente fuori scope',138,57,'harmonic','reed',[0,0,2,3,4,2,1,0],'march',.85),
 'boss-ceo':score('Il Mega-Direttore',132,60,'minor','reed',[0,4,3,2,0,6,5,4],'march',.85),
 'boss-roof':score('Buonuscita sul tetto',148,62,'harmonic','reed',[0,2,4,7,6,5,4,6],'march',.9),
 'boss-desert':score('Super consulente · Mummia',130,64,'harmonic','pluck',[0,1,4,2,5,6,4,0],'march',.75),
 'boss-glacier':score('Super consulente · Orso',124,59,'minor','marimba',[0,4,0,2,3,5,4,1],'march',.8),
 'boss-sea':score('Super consulente · Polpo',128,57,'dorian','water',[0,3,4,6,5,3,2,0],'sync',.7)
};
export function stageTrack(index){return STAGE_IDS[index]||'1-1';}
for(const [stage,data]of Object.entries(STAGE_TRACKS))TRACKS['bonus-'+stage]={...data,title:data.title+' · Pausa',bpm:Math.round(data.bpm*.92),
 events:data.events.filter(e=>!e.drum&&e.instrument!=='pad').map(e=>({...e,gain:e.gain*.72,instrument:e.instrument==='bass'?'bass':'mallet'}))};
export function bossTrack(stage,leg){return stage==='5-5'?'boss-roof':stage==='5-4'?'boss-ceo':stage==='4-10'?'boss-'+(['desert','glacier','sea'].includes(leg)?leg:'desert'):'boss-client';}

export function noteFrequency(value) {
 if(value==null||value==='-')return 0;
 if(typeof value==='number')return 440*2**((value-69)/12);
 const m=/^([A-G])(#?)(\d)$/.exec(value);if(!m)return 0;
 return noteFrequency(({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]])+(m[2]?1:0)+(+m[3]+1)*12);
}

const tone=(f,to,duration,gain=.3,type='sine',at=0)=>({f,to,duration,gain,type,at});
const noise=(duration,gain=.2,filter=1200,at=0)=>({noise:true,duration,gain,filter,at});
const chime=(notes,step=.095,gain=.22)=>notes.map((m,i)=>tone(noteFrequency(m),0,.23,gain,'sine',i*step));
export const EFFECTS = {
 jump:{gap:110,group:'move',sounds:[tone(240,470,.12,.18,'triangle')]},
 doublejump:{gap:140,group:'move',sounds:[tone(350,760,.13,.16,'sine'),noise(.07,.035,1600)]},
 coin:{gap:85,group:'reward',sounds:chime([83,88],.055,.2)},
 hurt:{gap:260,priority:2,duck:.45,sounds:[tone(180,65,.22,.27,'triangle'),noise(.1,.13,900)]},
 stomp:{gap:95,group:'impact',sounds:[tone(155,52,.11,.29,'sine'),noise(.04,.08,700)]},
 shoot:{gap:105,group:'shot',sounds:[tone(920,320,.07,.12,'triangle'),noise(.035,.04,2200)]},
 powerup:{gap:600,priority:1,duck:.7,sounds:chime([72,76,79,84],.075,.2)},
 explosion:{gap:200,group:'impact',priority:1,duck:.6,sounds:[noise(.32,.2,780),tone(125,35,.26,.3)]},
 quiz:{gap:800,sounds:chime([74,78],.12,.13)},
 select:{gap:70,group:'ui',sounds:[tone(660,560,.045,.12)]},
 gameover:{gap:1600,priority:3,duck:.25,sounds:chime([67,65,63,60],.22,.23)},
 victory:{gap:1300,priority:3,duck:.3,sounds:chime([72,76,79,84],.14,.25)},
 freeze:{gap:650,sounds:[tone(1700,650,.3,.08),noise(.16,.04,2700)]},
 sneeze:{gap:1100,sounds:[noise(.16,.13,1500,.1),tone(220,400,.1,.09,'triangle')]},
 splash:{gap:280,group:'water',sounds:[noise(.18,.12,900),tone(280,110,.14,.09)]},
 alarm:{gap:1600,priority:2,duck:.65,sounds:[tone(660,740,.14,.13,'triangle'),tone(660,740,.14,.13,'triangle',.24)]},
 bossHit:{gap:140,group:'impact',priority:2,duck:.6,sounds:[tone(140,45,.18,.3,'triangle'),noise(.08,.12,1000)]},
 checkpoint:{gap:1200,priority:2,duck:.6,sounds:chime([67,72,76,79],.1,.22)},
 kick:{gap:75,group:'rhythm',sounds:[tone(125,42,.13,.35)]},
 hat:{gap:75,group:'rhythm',sounds:[noise(.03,.055,6500)]},
 perfect:{gap:90,sounds:chime([84,91],.055,.15)},
 miss:{gap:220,sounds:[tone(190,140,.11,.14,'triangle')]},
 cheer:{gap:1300,priority:1,sounds:[noise(.45,.09,1700),...chime([72,76,79,84],.11,.16)]},
 step:{gap:290,group:'foley',sounds:[noise(.045,.045,800),tone(110,75,.04,.045)]},
 sandStep:{gap:350,group:'foley',sounds:[noise(.08,.04,1100)]},
 iceStep:{gap:350,group:'foley',sounds:[noise(.05,.04,2100),tone(1150,850,.045,.025)]},
 land:{gap:200,group:'foley',sounds:[noise(.07,.075,700),tone(115,65,.08,.1)]},
 slide:{gap:700,group:'foley',sounds:[noise(.24,.07,1300)]},
 swim:{gap:850,group:'water',sounds:[tone(260,510,.12,.065),tone(360,170,.12,.05,'sine',.11),noise(.13,.025,650)]},
 shark:{gap:6500,priority:1,sounds:[tone(86,70,.26,.11),tone(110,82,.25,.08,'sine',.32)]},
 lowHealth:{gap:9000,priority:2,duck:.55,sounds:[tone(220,180,.14,.13),tone(220,180,.14,.1,'sine',.28)]},
 timeWarning:{gap:15000,priority:2,duck:.5,sounds:chime([81,81,76],.13,.14)},
 mount:{gap:900,priority:1,sounds:[noise(.08,.04,800),...chime([60,67,72],.09,.14)]},
 dismount:{gap:800,sounds:[noise(.14,.07,800),tone(180,90,.12,.1)]},
 motor:{gap:1800,group:'vehicle',sounds:[tone(62,75,.32,.035,'triangle'),noise(.24,.025,300)]},
 hoof:{gap:420,group:'vehicle',sounds:[tone(180,95,.045,.07),noise(.035,.035,1200),tone(150,80,.04,.05,'sine',.1)]},
 door:{gap:900,sounds:[noise(.2,.07,550),tone(180,110,.22,.055,'triangle')]},
 monster:{gap:1800,priority:2,duck:.4,sounds:[tone(110,45,.55,.2,'triangle'),tone(157,65,.45,.1,'sine',.08),noise(.32,.08,450,.1)]},
 flush:{gap:1400,sounds:[noise(.6,.12,650),tone(180,70,.4,.07)]},
 portal:{gap:1400,sounds:[tone(260,90,.6,.11),tone(390,130,.55,.07,'sine',.08)]},
 correct:{gap:180,group:'reward',sounds:chime([76,79],.065,.14)},
 phone:{gap:2500,sounds:[tone(700,740,.09,.08),tone(920,950,.09,.06,'sine',.12)]},
 clink:{gap:400,group:'foley',sounds:[tone(1450,1400,.09,.055),tone(2190,2100,.07,.025)]},
 valve:{gap:200,group:'ui',sounds:[noise(.07,.05,1600),tone(320,260,.065,.055)]},
 wing:{gap:400,group:'foley',sounds:[noise(.12,.055,1100)]}
};
