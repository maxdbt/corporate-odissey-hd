// Story order remains in LEVEL_META. Visuals are selected independently of collision and quest data.
export const WORLD_BY_STAGE = {
  '2-1': 'canteen', '3-1': 'meeting', '4-1': 'travel', '4-2': 'travel',
  '4-3': 'airport', '4-4': 'station', '4-5': 'plane', '4-6': 'train',
  '4-7': 'desert', '4-8': 'glacier', '4-9': 'sea', '4-10': 'client',
  '5-1': 'finance', '5-2': 'hr', '5-3': 'secretary', '5-4': 'director', '5-5': 'roof'
};
export const WORLD_KEYS = [...new Set(Object.values(WORLD_BY_STAGE)), 'space', 'party', 'toilet'];
export const WORLD_FLOORS = {
  canteen: 'marble', meeting: 'wood', airport: 'marble', station: 'marble',
  desert: 'sand', glacier: 'ice', sea: 'seabed', finance: 'marble', hr: 'wood',
  secretary: 'wood', director: 'marble', roof: 'metal'
};
export const OUTDOOR_WORLDS = ['desert', 'glacier', 'sea', 'roof'];
