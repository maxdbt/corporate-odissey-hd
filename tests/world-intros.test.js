import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { WORLD_INTROS, introForStage, introQuality, levelEntry } from '../src/cinematics/IntroCatalog.js';
import { GameState } from '../src/state/GameState.js';
import { LEVELS } from '../src/levels/index.js';
import { selectAudioState } from '../src/audio/GameAudioDirector.js';

test('five world openings have separate Jack and Wendy media, shared across branches', () => {
  assert.equal(Object.keys(WORLD_INTROS).length, 5);
  const files = new Set();
  for (const stage of LEVELS) {
    for (const character of ['man', 'woman']) {
      const clip = introForStage(stage.id, character);
      assert.equal(clip.world, stage.id.split('-')[0]);
      assert.equal(clip.character, character);
      assert.equal(clip.duration, 15);
    }
  }
  for (const world of Object.values(WORLD_INTROS)) {
    for (const clip of Object.values(world.variants)) {
      assert.ok(!files.has(clip.sources['1080p']));
      files.add(clip.sources['1080p']);
    }
  }
  assert.equal(files.size, 10);
  assert.equal(introForStage('toilet', 'man'), null);
  assert.equal(introForStage('bonus-4-1', 'woman'), null);
  assert.equal(introForStage('6-1', 'man'), null);
  assert.equal(introForStage('1-1', 'unknown'), null);
});

test('world gate preserves the destination and all run resources until the clip ends', () => {
  GameState.newGame('woman');
  GameState.hp = 72; GameState.stress = 23;
  GameState.pendingNext.enemySpeedMult = 1.15;
  GameState.trip = { transport: 'plane', leg: 'sea', budget: 140, items: ['passport'] };
  const before = JSON.stringify(GameState);
  for (const index of [0, 2, 3, 4, 5, 14]) {
    const stage = LEVELS[index];
    const route = levelEntry(stage, index, { custom: 'kept' }, GameState);
    assert.equal(route.key, 'WorldIntroScene');
    assert.equal(route.data.nextScene, stage.scene || 'GameScene');
    assert.deepEqual(route.data.nextData, { levelIndex: index, custom: 'kept' });
    assert.equal(route.data.character, 'woman');
  }
  assert.equal(JSON.stringify(GameState), before);
});

test('seen worlds do not interrupt retries, branch choices or later floors; new run resets them', () => {
  GameState.newGame('man');
  for (const world of Object.keys(WORLD_INTROS)) GameState.seenWorldIntros[world + ':man'] = true;
  for (let i = 0; i < LEVELS.length; i++) {
    assert.equal(levelEntry(LEVELS[i], i, {}, GameState).key, LEVELS[i].scene || 'GameScene');
  }
  GameState.character = 'woman';
  assert.equal(levelEntry(LEVELS[0], 0, {}, GameState).key, 'WorldIntroScene');
  GameState.newGame('man');
  assert.deepEqual(GameState.seenWorldIntros, {});
  assert.equal(levelEntry(LEVELS[0], 0, {}, GameState).key, 'WorldIntroScene');
});

test('checkpoints and explicit bypass never play an intro; victory has no media gate', () => {
  GameState.newGame('man');
  const route = levelEntry(LEVELS[1], 1, { fromCheckpoint: true }, GameState);
  assert.equal(route.key, 'GameScene');
  assert.equal(route.data.fromCheckpoint, true);
  assert.equal(levelEntry(LEVELS[1], 1, { skipIntro: true }, GameState).key, 'GameScene');
  assert.deepEqual(levelEntry(undefined, 99, {}, GameState), { key: 'VictoryScene', data: {} });
});

test('mobile, narrow viewport and limited connections use the smaller source', () => {
  assert.equal(introQuality(), '1080p');
  for (const option of [{coarse: true}, {width: 844}, {saveData: true}, {effectiveType: '2g'}, {effectiveType: 'slow-2g'}]) {
    assert.equal(introQuality(option), '720p');
  }
  assert.equal(introQuality({width: 1440, effectiveType: '4g'}), '1080p');
});

test('movie audio owns the soundtrack while gameplay and menu audio are paused', () => {
  const scene = (key, active) => ({sys: {settings: {key}, isActive: () => active, isPaused: () => !active}});
  const selection = selectAudioState([scene('MenuScene', false), scene('WorldIntroScene', true)], {levelIndex: 4});
  assert.equal(selection.key, 'WorldIntroScene');
  assert.equal(selection.paused, true);
  assert.equal(selection.external, true);
});

test('every catalog variant ships two MP4s, a poster and valid Italian subtitles', () => {
  for (const world of Object.values(WORLD_INTROS)) for (const variant of Object.values(world.variants)) {
    for (const path of [variant.poster, variant.subtitles, ...Object.values(variant.sources)]) {
      assert.ok(existsSync(new URL('../public/' + path, import.meta.url)), path);
    }
    const vtt = readFileSync(new URL('../public/' + variant.subtitles, import.meta.url), 'utf8');
    assert.ok(vtt.startsWith('WEBVTT'));
    assert.equal((vtt.match(/-->/g) || []).length, 3);
  }
});
