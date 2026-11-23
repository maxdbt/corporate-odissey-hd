import test from 'node:test';
import assert from 'node:assert/strict';
import PedaloEscape, { PEDALO_DISTANCE } from '../src/bonus/new/PedaloEscape.js';
import { clamp } from '../src/bonus/new/physics.js';

test('a normal steering strategy finishes all three parts at 30, 60 and 120 Hz', () => {
  const outcomes = [];
  for (const fps of [30, 60, 120]) {
    const r = new PedaloEscape(), chapters = new Set();
    for (let f = 0; f < fps * 95 && !r.finished; f++) {
      const ahead = r.rocks.filter(o => o.z > r.progress - 60 && o.z < r.progress + 240);
      const target = [90,270,450,630,810].filter(x => ahead.every(o => Math.abs(o.x - x) > o.r + 70))
        .sort((a,b) => Math.abs(a-r.x)-Math.abs(b-r.x))[0] ?? 90;
      const threat = [r.drone, r.bossAttack].some(o => o && o.at-r.elapsed < .75 && Math.abs(r.x-o.x) < 85);
      r.update(1/fps, {x:clamp((target-r.x)*.035-r.vx*.018,-1,1), boost:r.energy>35, shield:threat});
      chapters.add(r.chapter);
      assert.ok(r.energy >= 0 && r.energy <= 100);
      assert.ok(r.events.length <= 12);
    }
    assert.equal(r.won, true, JSON.stringify({fps,progress:r.progress,lives:r.lives}));
    assert.deepEqual([...chapters], [0,1,2]);
    assert.ok(r.progress >= PEDALO_DISTANCE && r.score > 0);
    const before = JSON.stringify(r); r.update(5, {boost:true,x:1}); assert.equal(JSON.stringify(r), before);
    assert.deepEqual(r.reward(), {hp:10,stress:10,euro:15});
    outcomes.push(r.elapsed);
  }
  assert.ok(Math.max(...outcomes)-Math.min(...outcomes) < 1);
});

test('drinks refill energy and score once; pause freezes input, attacks, effects and combo', () => {
  const r = new PedaloEscape();
  r.x = r.pickups[0].x; r.progress = r.pickups[0].z - 2; r.energy = 90;
  r.update(1/60);
  assert.equal(r.collected, 1); assert.equal(r.energy, 100); assert.ok(r.score > 0);
  const score = r.score;
  for (let i=0; i<10; i++) r.update(1/60);
  assert.equal(r.score, score);
  r.paused = true; const before = JSON.stringify(r);
  r.update(100, {boost:true,shield:true,x:1}); assert.equal(JSON.stringify(r), before);
});

test('boosting into a wave jumps over a reef, while an umbrella does not protect against rocks', () => {
  const r = new PedaloEscape();
  r.x = r.waves[0].x; r.progress = r.waves[0].z - 3;
  r.rocks = [{x:r.x,z:r.waves[0].z,r:40,passed:false}];
  r.update(1/60, {boost:true});
  assert.equal(r.jumps, 1); assert.ok(r.airTime > 0); assert.equal(r.lives, 4);
  const bad = new PedaloEscape();
  bad.rocks = [{x:bad.x,z:bad.progress+1,r:40,passed:false}];
  bad.update(1/60,{shield:true}); assert.equal(bad.lives,3);
  for(let i=0;i<10;i++)bad.update(1/60,{shield:true});
  assert.equal(bad.lives,3, 'one collision cannot drain the whole hull');
});

test('telegraphed work attacks can be blocked or dodged and empty energy cannot shield', () => {
  for (const source of ['drone','bossAttack']) {
    const blocked = new PedaloEscape();
    blocked[source] = {x:450,at:.01}; blocked.update(1/60,{shield:true});
    assert.equal(blocked.lives,4); assert.equal(blocked.blocks,1); assert.ok(blocked.score>0);
    const dodged = new PedaloEscape();
    dodged[source] = {x:200,at:.01}; dodged.update(1/60);
    assert.equal(dodged.lives,4);
    const empty = new PedaloEscape(); empty.energy=0;
    empty[source] = {x:450,at:.01}; empty.update(1/60,{shield:true});
    assert.equal(empty.lives,3); assert.equal(empty.blocks,0);
  }
});

test('every course wave clears its actual downstream reef with sustained boost', () => {
  for (let i = 0; i < 4; i++) {
    const r = new PedaloEscape(), wave = r.waves[i];
    const reef = r.rocks.find(rock => rock.x === wave.x && rock.z === wave.z + 90);
    assert.ok(reef);
    r.x = wave.x; r.progress = wave.z - 70;
    // Isolate the scheduled wave/reef pair from the independent work attacks.
    r.drone = { x: 0, at: 1000 }; r.nextBossAt = 1000;
    while (r.progress < reef.z + 50) {
      r.update(1/60, {boost:true,x:clamp((wave.x-r.x)*.035-r.vx*.018,-1,1)});
      assert.equal(r.lives, 4, 'the ramp must launch before the reef, and land beyond it');
    }
    assert.equal(r.jumps, 1);
  }
});
