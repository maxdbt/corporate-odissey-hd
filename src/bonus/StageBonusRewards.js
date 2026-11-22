// One attempt per stage per run, including retries/checkpoints. Preview never calls this module.
export function awardStageBonus(state, id, reward) {
  state.stageBonusRewards ||= {};
  if (state.stageBonusRewards[id]) return false;
  state.stageBonusRewards[id] = true;
  state.addHp(reward.hp); state.addStress(-reward.stress);
  // Fixed, bounded reward: it does not trigger the separate 100-coin heal mechanic.
  state.euro += reward.euro;
  return true;
}
