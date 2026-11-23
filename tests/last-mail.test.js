import test from 'node:test';
import assert from 'node:assert/strict';
import {LastMailRound,MAIL_TASKS} from '../src/systems/LastMailRound.js';
import {MENU_BONUSES} from '../src/bonus/MenuBonusCatalog.js';
import {STAGE_BONUSES} from '../src/bonus/StageBonusCatalog.js';

function sortDesk(fps=60,strategy=card=>card.answer) {
  const r=new LastMailRound();r.start();
  for(let n=0;n<fps*65&&r.phase==='play'&&r.objective==='sort';n++){
    r.tick(1/fps);
    for(const card of [...r.cards]){const action=strategy(card);if(action)r.decide(card.id,action);}
    assert.ok(r.cards.length<=3);
  }
  return r;
}
test('real choices reach the two explicit exit steps consistently at 30, 60 and 120 Hz',()=>{
  const times=[];
  for(const fps of [30,60,120]){
    const r=sortDesk(fps);times.push(r.elapsed);
    assert.equal(r.phase,'play');assert.equal(r.objective,'autoreply');assert.equal(r.collected,1);
    assert.equal(r.resolved,12);assert.equal(r.urgentDone,4);assert.equal(r.claimReward(),null);
    assert.equal(r.complete('shutdown'),false);
    assert.equal(r.complete('autoreply'),true);assert.equal(r.complete('autoreply'),false);
    assert.equal(r.complete('shutdown'),true);assert.equal(r.won,true);
    assert.deepEqual(r.claimReward(),{vacationDays:1,stress:-20,euro:Math.min(30,Math.floor(r.score/50))});
    assert.equal(r.claimReward(),null);
    const end=JSON.stringify(r);r.tick(20);r.decide(1,'close');r.complete('shutdown');r.coffee();r.start();r.resume();
    assert.equal(JSON.stringify(r),end);
  }
  assert.ok(Math.max(...times)-Math.min(...times)<.5);
});
test('stamping every request A GENNAIO cannot win; wrong urgent choices cost more',()=>{
  const r=sortDesk(60,()=> 'defer');assert.equal(r.won,false);assert.ok(r.errors>0);assert.equal(r.urgentDone,0);
  const q=new LastMailRound();q.start();q.tick(.1);
  const first=q.current;assert.equal(first.answer,'close');
  assert.equal(q.decide(first.id,'defer').correct,false);assert.equal(q.stress,37);
  assert.equal(q.decide(first.id,'close'),null);assert.equal(q.urgentDone,0);
  q.spawn();const deferred=q.current;q.decide(deferred.id,'trash');assert.equal(q.stress,49);
});
test('selection does not resolve requests, pause freezes sort and final steps, and coffee is single-use',()=>{
  const r=new LastMailRound({stress:55});r.start();r.tick(.1);
  const id=r.current.id;r.select(id);assert.equal(r.resolved,0);
  r.pause();const snapshot=JSON.stringify(r);
  r.tick(300);r.decide(id,'close');r.select(id);r.coffee();r.complete('autoreply');
  assert.equal(JSON.stringify(r),snapshot);r.resume();
  assert.equal(r.coffee(),true);assert.equal(r.stress,30);assert.equal(r.coffee(),false);
  assert.equal(r.decide(id,'close').correct,true);
  const final=sortDesk();final.pause();assert.equal(final.complete('autoreply'),false);
  final.resume();assert.equal(final.complete('autoreply'),true);
});
test('ignoring mail loses, suspended deltas are bounded and final shutdown still has a deadline',()=>{
  const r=sortDesk(60,()=>null);assert.equal(r.phase,'result');assert.equal(r.won,false);assert.ok(r.missed>0);
  const q=new LastMailRound();q.start();q.tick(300);assert.equal(q.elapsed,.1);
  q.tick(NaN);q.tick(-1);q.tick(Infinity);assert.equal(q.elapsed,.1);
  const late=sortDesk();while(late.phase==='play')late.tick(.1);
  assert.equal(late.won,false);assert.equal(late.computerOff,false);
});
test('one genuine urgency may be mistaken, but two cannot unlock the permit',()=>{
  let wrong=0;const one=sortDesk(60,c=>c.answer==='close'&&wrong++<1?'defer':c.answer);
  assert.equal(one.objective,'autoreply');assert.equal(one.urgentDone,3);assert.equal(one.errors,1);
  wrong=0;const two=sortDesk(60,c=>c.answer==='close'&&wrong++<2?'defer':c.answer);
  assert.equal(two.won,false);assert.equal(two.collected,0);
});
test('restored menu bonus is distinct from the call cards and adds no implicit campaign entrance',()=>{
  assert.equal(MENU_BONUSES.length,STAGE_BONUSES.length+1);
  assert.ok(MENU_BONUSES.some(b=>b.id==='call'));
  const mail=MENU_BONUSES.find(b=>b.id==='last-mail');
  assert.equal(mail.freePlayOnly,true);assert.ok(!STAGE_BONUSES.includes(mail));
  assert.equal(MAIL_TASKS.filter(c=>c.answer==='close').length,4);
});
