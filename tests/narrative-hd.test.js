import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { narrativeHeroSpec, stageBackdrop } from '../src/presentation/NarrativeVisuals.js';
import { LEVELS } from '../src/levels/index.js';
import { ASSET_PACKS } from '../src/presentation/AssetPacks.js';

const frames = Object.fromEntries(['characters', 'jack-motion', 'wendy-motion', 'jack-locomotion', 'wendy-locomotion'].map(name =>
  ['hd-' + name, JSON.parse(readFileSync(new URL('../public/assets/hd-office/' + name + '.json', import.meta.url))).frames]));

test('narrative poses retain their meaning and resolve to existing HD frames for both heroes', () => {
  for (const character of ['man', 'woman']) for (const pose of ['idle','walk1','walk2','jump','crouch','slide','hurt','sleep','climb1','climb2','tired1','tired2']) {
    const spec = narrativeHeroSpec({ texture: { key: character + '_' + pose } }, {}, 16, 900);
    assert.ok(frames[spec.texture]?.[spec.frame], character + ':' + pose);
    if (['jump','crouch','slide','hurt'].includes(pose)) assert.equal(spec.frame, character + '_' + pose);
    if (pose === 'sleep') assert.equal(spec.frame, character + '_slide');
  }
  assert.equal(narrativeHeroSpec({ texture: { key: 'throne_empty' } }, {}, 16, 0), null);
});

test('narrative walking crosses all 16 frames through movement and stops with the actor', () => {
  const source = { texture: { key: 'woman_walk1' }, anims: { isPlaying: true }, x: 0 };
  const skin = {}, seen = new Set();
  for (let step = 0; step < 32; step++) {
    source.x = step * 6.25;
    const spec = narrativeHeroSpec(source, skin, 17, step * 17);
    seen.add(spec.frame); assert.ok(frames[spec.texture][spec.frame]);
  }
  assert.equal(seen.size, 16);
  const stopped = narrativeHeroSpec(source, skin, 17, 600).frame;
  assert.equal(narrativeHeroSpec(source, skin, 0, 1600).frame, stopped);
});

test('burnout retains the setting of every main stage without loading unrelated animation packs', () => {
  for (const stage of LEVELS) {
    const spec = stageBackdrop(stage.id);
    if (!spec.packs.length) { assert.equal(stage.id, '1-1'); continue; }
    assert.equal(spec.packs.length, 1);
    assert.ok(spec.packs.flatMap(name => ASSET_PACKS[name].assets).some(([key]) => key === spec.texture));
    for (const name of spec.packs) for (const [, image] of ASSET_PACKS[name].assets) {
      assert.ok(existsSync(new URL('../public/assets/' + ASSET_PACKS[name].directory + '/' + image, import.meta.url)));
    }
  }
});
