import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { officeTheme } from '../src/presentation/themes/office.js';
import firstLevel from '../src/levels/level1_1.js';

const root = new URL('../public/assets/hd-office/', import.meta.url);
const atlas = (file) => JSON.parse(readFileSync(new URL(file, root), 'utf8'));

test('all theme objects and enemies resolve to real atlas frames', () => {
  const props = atlas('office-props.json').frames;
  const enemies = atlas('office-enemies.json').frames;
  const dressing = atlas('office-dressing.json').frames;
  for (const [key, [frame]] of Object.entries(officeTheme.props)) assert.ok(props[frame], key + ' -> ' + frame);
  for (const [key, [frame]] of Object.entries(officeTheme.enemies)) assert.ok(enemies[frame], key + ' -> ' + frame);
  for (const [frame] of firstLevel.art.dressing) assert.ok(dressing[frame], 'scenery -> ' + frame);
  for (const frame of ['foregroundPlant', 'foregroundDesk', 'wallDesk']) assert.ok(dressing[frame], frame);
});

test('both characters have eight run frames and all gameplay poses', () => {
  const base = atlas('characters.json').frames;
  for (const [character, file] of [['man', 'jack-motion.json'], ['woman', 'wendy-motion.json']]) {
    const motion = atlas(file).frames;
    for (let i = 1; i <= 8; i++) assert.ok(motion[character + '_run' + i]);
    for (const pose of ['idle1', 'idle2', 'attack', 'land']) assert.ok(motion[character + '_' + pose]);
    for (const pose of ['idle', 'walk1', 'walk2', 'jump', 'crouch', 'slide', 'climb', 'hurt']) assert.ok(base[character + '_' + pose]);
  }
});

test('atlas crops stay inside their PNG and each image fits the PWA per-file cache limit', () => {
  for (const file of ['office-props.json', 'characters.json', 'jack-motion.json', 'wendy-motion.json', 'office-enemies.json', 'spumante.json', 'office-dressing.json']) {
    const data = atlas(file);
    const imageUrl = new URL(data.meta.image, root);
    const png = readFileSync(imageUrl);
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    assert.equal(png.toString('ascii', 1, 4), 'PNG');
    assert.equal(png[25], 6, data.meta.image + ' must retain RGBA transparency');
    assert.ok(width <= 4096 && height <= 4096);
    assert.ok(statSync(fileURLToPath(imageUrl)).size < 5 * 1024 * 1024);
    for (const [name, { frame, sourceSize, spriteSourceSize }] of Object.entries(data.frames)) {
      assert.ok(frame.w > 0 && frame.h > 0, name);
      assert.ok(frame.x >= 0 && frame.y >= 0 && frame.x + frame.w <= width && frame.y + frame.h <= height, name);
      assert.ok(spriteSourceSize.x + frame.w <= sourceSize.w && spriteSourceSize.y + frame.h <= sourceSize.h, name);
    }
  }
});
