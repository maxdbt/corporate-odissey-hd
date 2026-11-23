import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DANCE_COLLEAGUES, DANCE_FRAME_COUNT, danceBeatAt, danceFrameAt, colleagueDanceSpec } from '../src/presentation/DanceVisuals.js';
import { narrativeHeroSpec } from '../src/presentation/NarrativeVisuals.js';
import { ASSET_PACKS } from '../src/presentation/AssetPacks.js';

const atlases = Object.fromEntries(ASSET_PACKS.dance.assets.map(([key, , json]) =>
  [key, JSON.parse(readFileSync(new URL('../public/assets/hd-dance/' + json, import.meta.url)))]));

test('each of seven dancers has twelve dedicated frames with a fixed foot anchor', () => {
  assert.equal(Object.keys(atlases).length, 7);
  for (const [key, atlas] of Object.entries(atlases)) {
    const frames = Object.values(atlas.frames);
    assert.equal(frames.length, DANCE_FRAME_COUNT, key);
    assert.equal(new Set(frames.map(f => `${f.frame.x},${f.frame.y}`)).size, DANCE_FRAME_COUNT);
    const size = frames[0].sourceSize;
    for (const frame of frames) {
      assert.deepEqual(frame.sourceSize, size);
      assert.equal(frame.spriteSourceSize.y + frame.spriteSourceSize.h, size.h, key);
      assert.ok(frame.frame.x + frame.frame.w <= atlas.meta.size.w);
      assert.ok(frame.frame.y + frame.frame.h <= atlas.meta.size.h);
    }
  }
});

test('stationary colleagues dance through twelve frames in distinct atlases, never locomotion', () => {
  const textures = new Set();
  for (const character of DANCE_COLLEAGUES) {
    const seen = new Set();
    for (let i = 0; i < 12; i++) {
      const spec = colleagueDanceSpec({ x: 0, visualDance: { character, beat: (i + .1) / 6 }, hdHeight: 137 });
      textures.add(spec.texture); seen.add(spec.frame);
      assert.ok(atlases[spec.texture].frames[spec.frame]);
      assert.equal(spec.height, 137); assert.equal(spec.flipX, false);
    }
    assert.equal(seen.size, 12);
  }
  assert.equal(textures.size, 5);
  assert.equal(colleagueDanceSpec({}), null);
});

test('both heroes use dance poses even when gameplay briefly sets a walking reaction', () => {
  for (const character of ['man', 'woman']) {
    const seen = new Set();
    for (let i = 0; i < 12; i++) {
      const spec = narrativeHeroSpec({ texture: { key: character + '_walk1' }, visualDance: { beat: (i + .1) / 6 } }, {}, 16, 900, 210);
      assert.ok(atlases[spec.texture].frames[spec.frame]);
      assert.equal(spec.height, 210); seen.add(spec.frame);
    }
    assert.equal(seen.size, 12);
  }
});

test('dance follows song time independent of frame rate and freezes when song time is paused', () => {
  assert.equal(danceBeatAt(-3), 0);
  assert.ok(Math.abs(danceBeatAt(25) - 49.583333333333336) < 1e-9);
  for (const fps of [30, 60, 120]) {
    let songTime = 0;
    for (let i = 0; i < fps * 10; i++) songTime += 1 / fps;
    assert.equal(danceFrameAt(danceBeatAt(songTime)), danceFrameAt(danceBeatAt(10)));
  }
  const pausedSongTime = 12.35;
  const pose = danceFrameAt(danceBeatAt(pausedSongTime));
  for (let i = 0; i < 120; i++) assert.equal(danceFrameAt(danceBeatAt(pausedSongTime)), pose);
});
