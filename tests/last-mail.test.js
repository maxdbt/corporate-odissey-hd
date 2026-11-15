import test from 'node:test';
import assert from 'node:assert/strict';
import { LastMailRound } from '../src/systems/LastMailRound.js';

function play(round, strategy = () => {}) {
  round.start();
  for (let step = 0; step < 460 && round.phase === 'play'; step++) {
    round.tick(0.1);
    strategy(round);
  }
  return round;
}

test('surviving a full shift and collecting leave wins once, with a bounded reward', () => {
  const r = play(new LastMailRound({ random: () => 0.5 }), (round) => {
    for (const card of [...round.cards]) round.hit(card.id);
  });
  assert.equal(r.phase, 'result');
  assert.equal(r.remaining, 0);
  assert.equal(r.won, true);
  assert.ok(r.collected >= 1 && r.resolved >= 20);
  assert.ok(r.multiplier <= 4);
  assert.deepEqual(r.claimReward(), { vacationDays: 1, stress: -20, euro: Math.floor(r.score / 50) });
  assert.equal(r.claimReward(), null);
  const score = r.score;
  r.start(); r.resume(); r.tick(1); r.hit(1);
  assert.equal(r.score, score);
  assert.equal(r.phase, 'result');
});

test('the golden leave pass is required even if all work requests are handled', () => {
  const r = play(new LastMailRound(), (round) => {
    for (const card of [...round.cards]) if (card.kind !== 'vacation') round.hit(card.id);
  });
  assert.equal(r.remaining, 0);
  assert.equal(r.won, false);
  assert.equal(r.stress, 0);
  assert.deepEqual(r.claimReward(), { vacationDays: 0, stress: 10, euro: 0 });
});

test('ignored requests cause burnout before the clock expires', () => {
  const r = play(new LastMailRound());
  assert.equal(r.won, false);
  assert.equal(r.stress, 100);
  assert.ok(r.remaining > 0);
  assert.equal(r.cards.length, 0);
});

test('pause freezes deadlines, score and coffee, then resumes the same round', () => {
  const r = new LastMailRound();
  r.start();
  for (let i = 0; i < 10; i++) r.tick(0.1);
  const id = r.cards[0].id;
  r.pause();
  const elapsed = r.elapsed, age = r.cards[0].age;
  for (let i = 0; i < 100; i++) r.tick(0.1);
  assert.equal(r.elapsed, elapsed);
  assert.equal(r.cards[0].age, age);
  assert.equal(r.hit(id), null);
  assert.equal(r.coffee(), false);
  assert.equal(r.claimReward(), null);
  r.resume();
  assert.equal(r.hit(id).type, 'stamp');
  assert.equal(r.hit(id), null);
  assert.equal(r.resolved, 1);
});

test('coffee is usable once and stress cannot become negative', () => {
  const r = new LastMailRound({ stress: 55 });
  assert.equal(r.coffee(), false);
  r.start();
  assert.equal(r.coffee(), true);
  assert.equal(r.stress, 25);
  assert.equal(r.coffee(), false);
  assert.equal(r.stress, 25);
  const fresh = new LastMailRound({ stress: 15 });
  fresh.start(); fresh.coffee();
  assert.equal(fresh.stress, 0);
});

test('suspended-tab deltas cannot instantly expire a shift or a request', () => {
  const r = new LastMailRound();
  r.start(); r.tick(300);
  assert.equal(r.elapsed, 0.1);
  r.tick(NaN); r.tick(-1); r.tick(Infinity);
  assert.equal(r.elapsed, 0.1);
  assert.equal(r.phase, 'play');
});
