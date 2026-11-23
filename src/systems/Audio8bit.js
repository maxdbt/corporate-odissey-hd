// Compatibility entry point for the original scenes and entities.
import { GameState } from '../state/GameState.js';
import { SoundEngine } from '../audio/SoundEngine.js';
import { stageTrack, bossTrack } from '../audio/AudioCatalog.js';
export const audio = new SoundEngine({resolveTrack:name=>{
 const stage=stageTrack(GameState.levelIndex);
 return name==='level'?stage:name==='boss'?bossTrack(stage,GameState.trip?.leg):name;
}});
export default audio;
