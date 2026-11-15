// Pure rules for the POV bonus. Rendering and audio live outside this module.
export const LAST_MAIL_SECONDS = 45;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const TASKS = [
  ['mail', 'URGENTE', 'Una piccola modifica…'],
  ['file', 'PER IERI', 'Definitivo_v12_finale.pdf'],
  ['call', 'SOLO 5 MINUTI?', 'Il capo ti sta chiamando'],
  ['mail', 'ULTIMISSIMA COSA', 'Poi ti lascio andare. Giuro.']
];

export class LastMailRound {
  constructor({ stress = 15, random = Math.random } = {}) {
    this.random = random;
    this.phase = 'intro';
    this.elapsed = 0;
    this.stress = clamp(stress, 0, 95);
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.resolved = 0;
    this.collected = 0;
    this.missed = 0;
    this.coffeeLeft = 1;
    this.cards = [];
    this.serial = 0;
    this.nextSpawn = 0.25;
    this.rewardClaimed = false;
  }

  get remaining() { return Math.max(0, LAST_MAIL_SECONDS - this.elapsed); }
  get multiplier() { return Math.min(4, 1 + Math.floor(this.combo / 5)); }
  start() { if (this.phase === 'intro') this.phase = 'play'; }
  pause() { if (this.phase === 'play') this.phase = 'paused'; }
  resume() { if (this.phase === 'paused') this.phase = 'play'; }

  spawn() {
    const id = ++this.serial;
    const vacation = id % 6 === 4;
    const task = TASKS[(id - 1) % TASKS.length];
    // Three lanes prevent unreadable stacks; the golden card has its own clear label.
    const lane = (id - 1) % 3;
    const card = {
      id, kind: vacation ? 'vacation' : task[0],
      title: vacation ? 'FERIE APPROVATE' : task[1],
      detail: vacation ? 'Raccogli il lasciapassare' : task[2],
      lane, x: [0.23, 0.5, 0.77][lane], age: 0,
      life: 5.4 - 1.25 * this.elapsed / LAST_MAIL_SECONDS,
      tilt: (this.random() - 0.5) * 10
    };
    this.cards.push(card);
    return card;
  }

  tick(seconds) {
    if (this.phase !== 'play' || !Number.isFinite(seconds) || seconds <= 0) return [];
    const dt = Math.min(seconds, 0.1); // Never punish a suspended tab with a burst of missed mail.
    const events = [];
    this.elapsed = Math.min(LAST_MAIL_SECONDS, this.elapsed + dt);
    for (const card of [...this.cards]) {
      card.age += dt;
      if (card.age >= card.life) {
        this.cards = this.cards.filter((c) => c !== card);
        this.combo = 0;
        if (card.kind !== 'vacation') {
          this.missed++;
          this.stress = clamp(this.stress + 14, 0, 100);
        }
        events.push({ type: 'miss', card });
      }
    }
    if (this.stress >= 100) this.finish(false);
    else if (this.elapsed >= LAST_MAIL_SECONDS) this.finish(this.collected > 0);
    else if (this.elapsed >= this.nextSpawn && this.cards.length < 6) {
      events.push({ type: 'spawn', card: this.spawn() });
      this.nextSpawn = this.elapsed + 1.15 - 0.3 * this.elapsed / LAST_MAIL_SECONDS;
    }
    return events;
  }

  hit(id) {
    if (this.phase !== 'play') return null;
    const card = this.cards.find((c) => c.id === id);
    if (!card) return null;
    this.cards = this.cards.filter((c) => c !== card);
    if (card.kind === 'vacation') {
      this.collected++;
      this.score += 40;
      this.stress = clamp(this.stress - 8, 0, 100);
    } else {
      this.resolved++;
      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.score += 10 * this.multiplier;
      this.stress = clamp(this.stress - 2, 0, 100);
    }
    return { type: card.kind === 'vacation' ? 'collect' : 'stamp', card };
  }

  coffee() {
    if (this.phase !== 'play' || this.coffeeLeft === 0) return false;
    this.coffeeLeft = 0;
    this.stress = clamp(this.stress - 30, 0, 100);
    return true;
  }

  finish(won) {
    if (!['play', 'paused'].includes(this.phase)) return;
    this.phase = 'result';
    this.won = !!won;
    this.cards = [];
  }

  claimReward() {
    if (this.phase !== 'result' || this.rewardClaimed) return null;
    this.rewardClaimed = true;
    return { vacationDays: this.won ? 1 : 0, stress: this.won ? -20 : 10,
      euro: this.won ? Math.floor(this.score / 50) : 0 };
  }
}
