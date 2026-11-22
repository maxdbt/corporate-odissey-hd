import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { ASSET_PACKS, THEME_PACKS } from '../src/presentation/AssetPacks.js';
import { summerTheme } from '../src/presentation/themes/summer.js';
import level from '../src/levels/level1_2.js';
import { BEACH_RULES, beachReward } from '../src/systems/BeachRules.js';

const root = new URL('../public/assets/', import.meta.url);
const atlas = (directory, file) => JSON.parse(readFileSync(new URL(directory + '/' + file, root)));

test('summer can load independently of the beach; every manifest asset exists within mobile/PWA budgets', () => {
  assert.ok(THEME_PACKS[level.visualTheme].includes('summer'));
  assert.ok(THEME_PACKS[level.visualTheme].includes('summerProps'));
  assert.ok(!THEME_PACKS[level.visualTheme].includes('beach'));
  assert.ok(!ASSET_PACKS.summer.assets.some(([key]) => key === 'hd-beach'));
  for (const pack of Object.values(ASSET_PACKS)) for (const [, file, json] of pack.assets) {
    const path = new URL(pack.directory + '/' + file, root), png = readFileSync(path);
    assert.equal(png.toString('ascii', 1, 4), 'PNG');
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    assert.ok(width <= 4096 && height <= 4096, file);
    assert.ok(statSync(path).size < 5 * 1024 * 1024, file);
    if (!json) continue;
    assert.equal(png[25], 6, 'sprites must keep alpha');
    const data = atlas(pack.directory, json);
    assert.equal(data.meta.image, file);
    for (const [name, { frame: f }] of Object.entries(data.frames)) {
      assert.ok(f.w > 0 && f.h > 0 && f.x >= 0 && f.y >= 0 && f.x + f.w <= width && f.y + f.h <= height, name);
    }
  }
});

test('every summer skin, dressing prop and beach envelope resolves to an actual frame', () => {
  const frames = {
    'hd-props': atlas('hd-office', 'office-props.json').frames,
    'hd-summer-props': atlas('hd-summer', 'summer-props.json').frames
  };
  for (const [key, [frame, , texture = 'hd-props']] of Object.entries(summerTheme.props)) {
    assert.ok(frames[texture][frame], key + ' -> ' + frame);
  }
  for (const [frame] of level.art.summerProps) assert.ok(frames['hd-summer-props'][frame]);
  for (const frame of ['mail', 'urgentMail', 'aircon', 'coldColleague', 'planeTicket', 'exitDoor']) {
    assert.ok(frames['hd-summer-props'][frame], frame);
  }
  const dressing = atlas('hd-office', 'office-dressing.json').frames;
  for (const [frame] of level.art.dressing) assert.ok(dressing[frame]);
});

test('beach rewards preserve completed seconds, three lives and the 25-second ceiling', () => {
  assert.equal(BEACH_RULES.lives, 3);
  assert.equal(BEACH_RULES.duration, 25);
  for (const [time, hp, stressDown] of [[0, 0, 0], [0.99, 0, 0], [1, 4, 1], [12.9, 48, 12], [24.99, 96, 24], [25, 100, 25], [1000, 100, 25], [-1, 0, 0]]) {
    assert.deepEqual(beachReward(time), { hp, stressDown });
  }
});
