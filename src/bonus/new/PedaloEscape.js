import { Round, clamp } from './physics.js';

export const PEDALO_DISTANCE = 3600;
export const PEDALO_CHAPTERS = [
  { from: 0, title: 'FUORI UFFICIO', subtitle: 'Finalmente in ferie. O quasi.' },
  { from: 1050, title: 'SOLO UNA CALL!', subtitle: 'Il capo ha noleggiato una moto d’acqua.' },
  { from: 2450, title: 'ULTIMA TACCA', subtitle: 'La caletta senza campo è dietro gli scogli.' }
];

// Fixed-step arcade model. Rendering and bonus rewards remain independent.
export default class PedaloEscape extends Round {
  constructor() {
    super();
    this.x = 450; this.vx = 0; this.progress = 0; this.speed = 82;
    this.energy = 100; this.lives = 4; this.hitAt = -10;
    this.bossX = 450; this.bossAttack = null; this.nextBossAt = 0;
    this.shield = false; this.boosting = false; this.drone = null;
    this.airTime = 0; this.airDuration = 1.15;
    this.score = 0; this.combo = 0; this.bestCombo = 0; this.collected = 0;
    this.nearMisses = 0; this.jumps = 0; this.blocks = 0;
    this.chapter = 0; this.events = []; this.eventId = 0;
    this.message = 'Segui le bibite. Scatto sulle onde = salto!';
    this.rocks = Array.from({ length: 18 }, (_, i) => ({
      x: [450, 240, 680, 350, 580, 180][i % 6], z: 360 + i * 167,
      r: 36 + (i % 3) * 7, passed: false
    }));
    this.pickups = Array.from({ length: 17 }, (_, i) => ({
      x: [190, 670, 440, 160, 710, 450][i % 6], z: 230 + i * 190,
      type: i % 4 === 3 ? 'leave' : 'drink', taken: false, missed: false
    }));
    // A ramp precedes its reef: a full-speed jump clears the complete collision window.
    this.waves = [2, 7, 12, 16].map(i => ({ z: this.rocks[i].z - 90, x: this.rocks[i].x, used: false }));
  }

  emit(type, text, x = this.x, value = 0) {
    this.events.push({ id: ++this.eventId, type, text, x, value, at: this.elapsed });
    this.events = this.events.slice(-12);
    if (text) this.message = text;
  }

  points(amount, type, text, x = this.x) {
    this.combo = Math.min(8, this.combo + 1);
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const value = amount * (1 + Math.floor(this.combo / 3));
    this.score += value;
    this.emit(type, text, x, value);
  }

  step(dt, input) {
    const previousProgress = this.progress;
    this.shield = !!input.shield && this.energy > 1 && this.airTime <= 0;
    this.boosting = !!input.boost && this.energy > 1 && !this.shield;
    this.energy = clamp(this.energy + (this.boosting ? -25 : this.shield ? -12 : 15) * dt, 0, 100);
    const current = Math.sin(this.progress / 250) * (this.chapter ? 28 : 14);
    const steering = Number.isFinite(input.x) ? clamp(input.x, -1, 1) : 0;
    this.vx += (steering * 390 + current - this.vx * 3.25) * dt;
    this.x = clamp(this.x + this.vx * dt, 42, 858);
    if ((this.x === 42 && this.vx < 0) || (this.x === 858 && this.vx > 0)) this.vx = 0;
    const targetSpeed = this.boosting ? 164 : input.y > 0 ? 45 : this.shield ? 72 : 92;
    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 4);
    this.progress += this.speed * dt;
    this.airTime = Math.max(0, this.airTime - dt);

    const chapter = this.progress >= 2450 ? 2 : this.progress >= 1050 ? 1 : 0;
    if (chapter !== this.chapter) {
      this.chapter = chapter;
      this.emit('chapter', PEDALO_CHAPTERS[chapter].title);
    }

    for (const wave of this.waves) {
      if (!wave.used && Math.abs(wave.z - this.progress) < 27 && Math.abs(wave.x - this.x) < 125 && this.boosting) {
        wave.used = true; this.airTime = this.airDuration; this.jumps++;
        this.points(100, 'jump', 'MODALITÀ AEREO!');
      }
    }
    for (const rock of this.rocks) {
      if (Math.abs(rock.z - this.progress) < 42 && Math.abs(rock.x - this.x) < rock.r + 20 && this.airTime <= 0) this.hit('Scoglio! L’ombrellone non è un paraurti.');
      if (!this.active) return;
      if (!rock.passed && previousProgress <= rock.z + 48 && this.progress > rock.z + 48) {
        rock.passed = true;
        const clearance = Math.abs(rock.x - this.x) - rock.r - 20;
        if (clearance > 0 && clearance < 48 && this.elapsed - this.hitAt > 1.5) {
          this.nearMisses++; this.points(45, 'near', 'PER UN PELO!');
        }
      }
    }
    for (const pickup of this.pickups) {
      if (pickup.taken || pickup.missed) continue;
      if (Math.abs(pickup.z - this.progress) < 48 && Math.abs(pickup.x - this.x) < 52) {
        pickup.taken = true; this.collected++;
        this.energy = clamp(this.energy + (pickup.type === 'drink' ? 27 : 12), 0, 100);
        this.points(pickup.type === 'drink' ? 60 : 120, 'pickup', pickup.type === 'drink' ? 'PAUSA LIMONATA!' : 'FERIE APPROVATE!', pickup.x);
      } else if (this.progress > pickup.z + 60) pickup.missed = true;
    }

    this.bossX += (this.x - this.bossX) * dt * .65;
    if (!this.drone && this.progress > 1300) this.drone = { x: this.x, at: this.elapsed + 2.1 };
    if (this.drone && this.elapsed >= this.drone.at) {
      if (Math.abs(this.x - this.drone.x) < 72 && this.airTime <= 0) {
        if (this.shield) { this.blocks++; this.points(100, 'block', 'RESPINTO AL MITTENTE!'); }
        else this.hit('Il drone ti ha consegnato una scadenza.');
      }
      this.emit('splash', '', this.drone.x);
      this.drone = { x: this.x, at: this.elapsed + 5.5 };
    }
    if (!this.active) return;
    if (this.progress > 1850 && !this.bossAttack && this.elapsed >= this.nextBossAt) {
      this.bossAttack = { x: this.x, at: this.elapsed + 1.65 };
    }
    if (this.bossAttack && this.elapsed >= this.bossAttack.at) {
      if (Math.abs(this.x - this.bossAttack.x) < 65 && this.airTime <= 0) {
        if (this.shield) { this.blocks++; this.points(90, 'block', 'CALL RIFIUTATA!'); }
        else this.hit('Il capo: «Solo cinque minuti!»');
      }
      this.emit('splash', '', this.bossAttack.x);
      this.bossAttack = null; this.nextBossAt = this.elapsed + (this.chapter === 2 ? 3.8 : 5.2);
    }
    if (this.active && this.progress >= PEDALO_DISTANCE) {
      this.score += this.lives * 150 + Math.ceil(this.energy) * 2;
      this.end(true, 'Nessun segnale. Nessuna call. Finalmente ferie.');
    }
    if (this.elapsed > 95) this.end(false, 'Il capo ti ha raggiunto. La prossima volta, più scatti!');
  }

  hit(message = 'Urto! Cambia rotta.') {
    if (!this.active || this.elapsed - this.hitAt < 1.5) return;
    this.hitAt = this.elapsed; this.lives--; this.combo = 0; this.vx *= -.35;
    this.emit('hit', message);
    if (this.lives <= 0) this.end(false, 'Pedalò fuori uso. Il capo offre un passaggio… in ufficio.');
  }
}
