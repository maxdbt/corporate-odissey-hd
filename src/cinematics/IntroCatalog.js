// One opening per world, never per bonus or travel branch.
const TITLES = ['L’Open Space', 'La Mensa', 'Il Limbo dei Post-it', 'La Trasferta', 'Il Piano degli Executive'];
export const WORLD_INTROS = Object.fromEntries(TITLES.map((title, i) => {
  const world = String(i + 1);
  const variants = Object.fromEntries(['man', 'woman'].map(character => {
    const directory = `assets/intro/world-${world}/${character}`;
    return [character, { character, duration: 15, poster: `${directory}/poster.jpg`,
      subtitles: `${directory}/italiano.vtt`, sources: { '1080p': `${directory}/intro-1080p.mp4`, '720p': `${directory}/intro-mobile-720p.mp4` } }];
  }));
  return [world, { world, title, variants }];
}));

export function introForStage(stageId, character) {
  if (!/^[1-5]-\d+$/.test(stageId || '')) return null;
  const intro = WORLD_INTROS[stageId.split('-')[0]];
  const variant = intro?.variants[character];
  return variant ? { ...intro, ...variant, seenKey: `${intro.world}:${character}` } : null;
}

export function levelEntry(level, index, data, state) {
  if (!level) return { key: 'VictoryScene', data: {} };
  const nextScene = level.scene || 'GameScene';
  const nextData = { levelIndex: index, ...data };
  const intro = introForStage(level.id, state.character);
  if (!intro || data.fromCheckpoint || data.skipIntro || state.seenWorldIntros?.[intro.seenKey]) {
    return { key: nextScene, data: nextData };
  }
  return { key: 'WorldIntroScene', data: { stageId: level.id, character: state.character, nextScene, nextData } };
}

export function introQuality({ coarse = false, saveData = false, effectiveType = '', width = 1920 } = {}) {
  return coarse || saveData || /(^|-)2g$/.test(effectiveType) || width < 1000 ? '720p' : '1080p';
}
