import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import MinigolfRound, { stepBall } from '../src/bonus/minigolf/MinigolfRound.js';
import { COURSES, ROOM, BALL_RADIUS, MAX_SHOT_SPEED } from '../src/bonus/minigolf/courses.js';
import { createProjection } from '../src/bonus/minigolf/projection.js';
import { BONUS_BY_ID } from '../src/bonus/StageBonusCatalog.js';
import { awardStageBonus } from '../src/bonus/StageBonusRewards.js';

function roll(round, fps = 60) {
  for (let i=0;i<fps*22&&round.moving;i++)round.update(1/fps);
  assert.equal(round.moving,false,'ball must eventually stop');
}
function aimAt(round, target) {
  const angle=Math.atan2(target.y-round.ball.y,target.x-round.ball.x);
  let best={distance:Infinity,power:.1};
  // Search only shot strength. All actual movement and completion use the public shoot/update API.
  for(let n=3;n<=100;n++){
    const power=n/100,ball={...round.ball,vx:Math.cos(angle)*MAX_SHOT_SPEED*power,vy:Math.sin(angle)*MAX_SHOT_SPEED*power};
    let result;
    for(let step=0;step<2400;step++){
      result=stepBall(ball,round.course);
      if(result==='cup'||result==='coffee'||!ball.vx&&!ball.vy)break;
    }
    if(result==='coffee')continue;
    const distance=result==='cup'?0:Math.hypot(ball.x-target.x,ball.y-target.y);
    if(distance<best.distance)best={distance,power};
  }
  return {angle,power:best.power};
}

test('three furnished courses are completable through normal strokes at mobile and desktop frame rates',()=>{
  const routes=[
    [{x:570,y:435},{x:570,y:120},COURSES[0].cup],
    [{x:115,y:440},{x:380,y:440},{x:725,y:440},COURSES[1].cup],
    [{x:130,y:530},{x:900,y:530},{x:900,y:105},COURSES[2].cup],
  ];
  for(const fps of [30,120]){
    const r=new MinigolfRound();
    for(let hole=0;hole<3;hole++){
      for(const target of routes[hole]){
        if(r.phase==='complete')break;
        const shot=aimAt(r,target);assert.ok(r.shoot(shot.angle,shot.power));roll(r,fps);
      }
      // A final gentle putt covers numeric differences in where the preceding shot stopped.
      for(let n=0;n<2&&r.phase==='aim';n++){const shot=aimAt(r,r.course.cup);r.shoot(shot.angle,shot.power);roll(r,fps);}
      assert.equal(r.phase,'complete',`hole ${hole+1} at ${fps}fps: ${JSON.stringify(r.ball)}`);
      if(hole<2)assert.ok(r.nextHole());
    }
    assert.ok(r.finished&&r.won);assert.equal(r.scores.length,3);
    assert.ok(r.totalStrokes<=16);assert.deepEqual(r.reward(),{hp:10,stress:10,euro:15});
  }
});

test('fast shots collide with furniture and boundaries without crossing their solid footprint',()=>{
  const c={...COURSES[0],surfaces:[],solids:[{x:300,y:0,width:20,height:560}]};
  const b={x:270,y:200,vx:660,vy:0};
  for(let i=0;i<20;i++)stepBall(b,c);
  assert.ok(b.x<300-BALL_RADIUS);assert.ok(b.vx<0);
  const edge={x:ROOM.width-10,y:300,vx:660,vy:0};stepBall(edge,c);
  assert.ok(edge.x<=ROOM.width-BALL_RADIUS);assert.ok(edge.vx<0);
});

test('rugs brake more than parquet; ramps exert a directional force',()=>{
  const base={...COURSES[0],cup:{x:900,y:500,radius:18},solids:[],surfaces:[]};
  const rug={...base,surfaces:[{type:'rug',x:0,y:0,width:960,height:560}]};
  const ramp={...base,surfaces:[{type:'ramp',x:0,y:0,width:960,height:560,ax:125,ay:-35}]};
  const balls=[base,rug,ramp].map(()=>({x:100,y:250,vx:200,vy:0}));
  for(let i=0;i<60;i++)[base,rug,ramp].forEach((c,n)=>stepBall(balls[n],c));
  assert.ok(balls[1].x<balls[0].x);assert.ok(balls[2].x>balls[0].x);assert.ok(balls[2].y<250);
});

test('cup requires controlled speed and coffee returns to the last lie with one extra stroke',()=>{
  const c={...COURSES[0],solids:[],surfaces:[],cup:{x:300,y:200,radius:18}};
  assert.equal(stepBall({x:300,y:200,vx:600,vy:0},c),null);
  assert.equal(stepBall({x:300,y:200,vx:40,vy:0},c),'cup');
  const hazard={...c,start:{x:100,y:200},surfaces:[{type:'coffee',x:170,y:200,radius:30}]};
  const r=new MinigolfRound([hazard]);r.shoot(0,.4);roll(r);
  assert.equal(r.strokes,2);assert.equal(r.phase,'aim');assert.equal(r.ball.x,100);assert.equal(r.ball.y,200);
  assert.ok(r.drainEvents().includes('recovery'));
});

test('pause, invalid input and predictions never change a round or award a prize',()=>{
  const r=new MinigolfRound();r.shoot(-.3,.7);r.update(.1);r.setPaused(true);
  const saved=JSON.stringify(r);r.update(100);r.shoot(0,1);r.recover();r.nextHole();r.predict(1,.5);
  assert.equal(JSON.stringify(r),saved);assert.deepEqual(r.reward(),{hp:0,stress:0,euro:0});
  r.setPaused(false);r.update(10);assert.ok(r.elapsed<=.20001);
  const fresh=new MinigolfRound();
  for(const [angle,power]of [[NaN,.5],[0,Infinity],[0,-1],[0,0]])assert.equal(fresh.shoot(angle,power),false);
  fresh.update(NaN);fresh.update(-10);assert.equal(fresh.elapsed,0);assert.equal(fresh.strokes,0);
});

test('last permitted stroke may win; exhausting strokes loses and completed games are immutable',()=>{
  const course={...COURSES[0],maxStrokes:1,start:{x:100,y:200},cup:{x:130,y:200,radius:18},solids:[],surfaces:[]};
  const won=new MinigolfRound([course]);won.shoot(0,.13);roll(won);assert.ok(won.won);
  const lost=new MinigolfRound([course]);lost.shoot(Math.PI,.05);roll(lost);assert.ok(lost.finished&&!lost.won);
  for(const r of [won,lost]){const snapshot=JSON.stringify(r);r.shoot(0,1);r.recover();r.nextHole();r.update(5);assert.equal(JSON.stringify(r),snapshot);}
});

test('projection round trips preserve finger/mouse aim across mobile, tablet and desktop sizes',()=>{
  for(const width of [640,800,1000,1600]){
    const p=createProjection(width);
    for(const v of [{x:0,y:0},{x:960,y:560},{x:125,y:435},{x:840,y:105}]){
      const screen=p.toScreen(v.x,v.y),floor=p.toFloor(screen.x,screen.y);
      assert.ok(Math.abs(floor.x-v.x)<1e-9);assert.ok(Math.abs(floor.y-v.y)<1e-9);
      assert.ok(screen.x>=0&&screen.x<=width);assert.ok(screen.y>53&&screen.y<355);
    }
  }
});

test('campaign selects the physical golf and awards its reward only once',()=>{
  assert.equal(BONUS_BY_ID.golf.mode,'minigolf');assert.equal(BONUS_BY_ID.golf.duration,0);
  const state={hp:80,stress:25,euro:0,addHp(n){this.hp+=n;},addStress(n){this.stress+=n;}};
  const reward={hp:10,stress:10,euro:15};
  assert.equal(awardStageBonus(state,'golf',reward),true);assert.equal(awardStageBonus(state,'golf',reward),false);
  assert.deepEqual([state.hp,state.stress,state.euro],[90,15,15]);
});

test('HD furniture frames stay within their atlas and the artwork fits mobile cache budgets',()=>{
  const root=new URL('../public/assets/hd-minigolf/',import.meta.url);
  const atlas=JSON.parse(readFileSync(new URL('furniture.json',root)));
  for(const file of ['furniture.png','parquet.png']){
    const path=new URL(file,root),png=readFileSync(path);
    assert.ok(statSync(path).size<5*1024*1024,file);
    assert.ok(png.readUInt32BE(16)<=2048&&png.readUInt32BE(20)<=2048,file);
  }
  for(const [name,{frame:f}]of Object.entries(atlas.frames)){
    assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=1536&&f.y+f.h<=1024,name);
  }
  for(const c of COURSES)for(const o of c.solids)assert.ok(atlas.frames[o.type],o.type);
});
