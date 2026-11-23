import { advanceLocomotion, HERO_FRAME_COUNT } from './MotionCatalog.js';
import { WORLD_BY_STAGE } from './WorldCatalog.js';
import { danceFrameAt } from './DanceVisuals.js';

// Presentation only: no campaign state, timers or collision geometry is changed here.
export function stageBackdrop(stageId) {
  if (stageId === '1-1') return { texture: 'hd-office', packs: [] };
  if (stageId === '1-2') return { texture: 'hd-summer-office', packs: ['summer'] };
  const world = WORLD_BY_STAGE[stageId] || 'director';
  return { texture: 'hd-world-' + world, packs: ['world-' + world] };
}

export function narrativeHeroSpec(source, skin, delta, now, height = 92) {
  const match = /^(man|woman)_(.+)$/.exec(source.texture?.key || '');
  if (!match) return null;
  const [, character, pose] = match;
  const motion = 'hd-' + (character === 'woman' ? 'wendy' : 'jack');
  if (source.visualDance) return { texture: motion + '-dance',
    frame: character + '_dance' + (danceFrameAt(source.visualDance.beat, source.visualDance.offset || 0) + 1), height };
  if (source.anims?.isPlaying && /^walk/.test(pose)) {
    return { texture: motion + '-locomotion', frame: character + '_move' +
      (advanceLocomotion(skin, source, delta, 100, HERO_FRAME_COUNT) + 1), height };
  }
  if (pose === 'idle' || /^tired/.test(pose)) {
    return { texture: motion + '-motion', frame: character + '_idle' + (Math.floor(now / 650) % 2 + 1), height };
  }
  const frame = pose === 'sleep' ? 'slide' : /^climb/.test(pose) ? 'climb'
    : ['walk1', 'walk2', 'jump', 'crouch', 'slide', 'hurt'].includes(pose) ? pose : 'idle';
  return { texture: 'hd-characters', frame: character + '_' + frame, height,
    ...(['slide', 'sleep', 'crouch'].includes(pose) ? { maxWidth: height * 1.15 } : {}) };
}
