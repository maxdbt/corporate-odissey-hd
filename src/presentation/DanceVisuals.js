export const DANCE_FRAME_COUNT = 12;
export const DANCE_COLLEAGUES = ['capo', 'stagista', 'contabile', 'sistemista', 'marketing'];

// Integral of the rhythm game's 110 -> 128 BPM ramp over its 25-second song.
// Derived from song time, so pausing never lets the dancers drift away from the notes.
export function danceBeatAt(seconds) {
  const t = Math.max(0, Math.min(25, seconds));
  return (110 * t + .5 * (18 / 25) * t * t) / 60;
}

export function danceFrameAt(beat, offset = 0) {
  return ((Math.floor((beat + offset) * 6) % DANCE_FRAME_COUNT) + DANCE_FRAME_COUNT) % DANCE_FRAME_COUNT;
}

export function colleagueDanceSpec(source) {
  const dance = source.visualDance;
  if (!dance || !DANCE_COLLEAGUES.includes(dance.character)) return null;
  return { texture: 'hd-' + dance.character + '-dance',
    frame: dance.character + '_dance' + (danceFrameAt(dance.beat, dance.offset || 0) + 1),
    height: source.hdHeight || 132, flipX: false };
}
