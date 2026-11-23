import { COURSES, ROOM, BALL_RADIUS, MAX_SHOT_SPEED, FIXED_STEP, GOLF_REWARD, surfaceContains } from './courses.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Resolve circle/furniture contacts, including a ball caught inside a rectangle corner.
function collide(ball, obstacle) {
  let dx, dy, overlap;
  if (obstacle.radius) {
    dx = ball.x - obstacle.x; dy = ball.y - obstacle.y;
    const distance = Math.hypot(dx, dy), reach = BALL_RADIUS + obstacle.radius;
    if (distance >= reach) return false;
    overlap = reach - distance;
    if (distance < 0.00001) { dx = 1; dy = 0; } else { dx /= distance; dy /= distance; }
  } else {
    const nearX = clamp(ball.x, obstacle.x, obstacle.x + obstacle.width);
    const nearY = clamp(ball.y, obstacle.y, obstacle.y + obstacle.height);
    dx = ball.x - nearX; dy = ball.y - nearY;
    const distance = Math.hypot(dx, dy);
    if (distance >= BALL_RADIUS) return false;
    if (distance < 0.00001) {
      const faces = [
        [ball.x - obstacle.x, -1, 0], [obstacle.x + obstacle.width - ball.x, 1, 0],
        [ball.y - obstacle.y, 0, -1], [obstacle.y + obstacle.height - ball.y, 0, 1],
      ].sort((a, b) => a[0] - b[0]);
      overlap = BALL_RADIUS + faces[0][0]; dx = faces[0][1]; dy = faces[0][2];
    } else { overlap = BALL_RADIUS - distance; dx /= distance; dy /= distance; }
  }
  ball.x += dx * (overlap + 0.01); ball.y += dy * (overlap + 0.01);
  const normalSpeed = ball.vx * dx + ball.vy * dy;
  if (normalSpeed < 0) { ball.vx -= 1.78 * normalSpeed * dx; ball.vy -= 1.78 * normalSpeed * dy; }
  return normalSpeed < -5;
}

export function stepBall(ball, course, dt = FIXED_STEP) {
  const surface = course.surfaces.find(s => surfaceContains(s, ball));
  const speed = Math.hypot(ball.vx, ball.vy);
  const drag = surface?.type === 'rug' ? 265 : 88;
  const remaining = Math.max(0, speed - drag * dt);
  if (speed) { ball.vx *= remaining / speed; ball.vy *= remaining / speed; }
  if (surface?.type === 'ramp' && speed > 0) {
    ball.vx += surface.ax * dt; ball.vy += surface.ay * dt;
  }
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  let impact = false;
  for (const [axis, velocity, limit] of [['x', 'vx', ROOM.width], ['y', 'vy', ROOM.height]]) {
    if (ball[axis] < BALL_RADIUS) {
      ball[axis] = BALL_RADIUS; ball[velocity] = Math.abs(ball[velocity]) * .78; impact = true;
    } else if (ball[axis] > limit - BALL_RADIUS) {
      ball[axis] = limit - BALL_RADIUS; ball[velocity] = -Math.abs(ball[velocity]) * .78; impact = true;
    }
  }
  for (const obstacle of course.solids) impact = collide(ball, obstacle) || impact;
  const currentSpeed = Math.hypot(ball.vx, ball.vy);
  const holeDistance = Math.hypot(ball.x - course.cup.x, ball.y - course.cup.y);
  if (holeDistance < course.cup.radius && currentSpeed < 155) return 'cup';
  if (course.surfaces.some(s => s.type === 'coffee' && surfaceContains(s, ball))) return 'coffee';
  if (currentSpeed < 4) { ball.vx = 0; ball.vy = 0; }
  return impact ? 'impact' : null;
}

export default class MinigolfRound {
  constructor(courses = COURSES) {
    this.courses = courses; this.holeIndex = 0; this.scores = [];
    this.paused = false; this.finished = false; this.won = false; this.elapsed = 0;
    this.events = []; this.loadHole();
  }
  get course() { return this.courses[this.holeIndex]; }
  get totalStrokes() { return this.scores.reduce((sum, n) => sum + n, 0) + (this.phase === 'complete' ? 0 : this.strokes); }
  get moving() { return this.phase === 'rolling'; }
  loadHole() {
    this.strokes = 0; this.phase = 'aim'; this.accumulator = 0; this.rollTime = 0;
    this.ball = { ...this.course.start, vx: 0, vy: 0 };
    this.lastLie = { ...this.course.start }; this.trail = [];
  }
  shoot(angle, power) {
    if (this.paused || this.finished || this.phase !== 'aim' || !Number.isFinite(angle) || !Number.isFinite(power)) return false;
    if (power < .025) return false;
    this.lastLie = { x: this.ball.x, y: this.ball.y };
    const speed = MAX_SHOT_SPEED * clamp(power, .025, 1);
    this.ball.vx = Math.cos(angle) * speed; this.ball.vy = Math.sin(angle) * speed;
    this.strokes++; this.rollTime = 0; this.accumulator = 0; this.phase = 'rolling'; this.trail = [];
    this.events.push('shot'); return true;
  }
  update(delta) {
    if (this.paused || this.finished || !Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .1); this.elapsed += dt;
    if (!this.moving) return;
    this.accumulator += dt;
    while (this.accumulator + 1e-9 >= FIXED_STEP && this.moving) {
      this.accumulator -= FIXED_STEP; this.rollTime += FIXED_STEP;
      const result = stepBall(this.ball, this.course);
      if (result === 'cup') {
        this.ball = { ...this.course.cup, vx: 0, vy: 0 };
        this.scores.push(this.strokes); this.phase = 'complete'; this.events.push('cup');
        if (this.holeIndex === this.courses.length - 1) { this.finished = true; this.won = true; }
      } else if (result === 'coffee') { this.recover(true); }
      else {
        if (result === 'impact') this.events.push('impact');
        if (!this.ball.vx && !this.ball.vy || this.rollTime > 20) {
          this.ball.vx = 0; this.ball.vy = 0; this.phase = 'aim';
          this.checkLimit(); this.events.push('rest');
        }
      }
    }
    if (this.moving) {
      this.trail.push({ x: this.ball.x, y: this.ball.y });
      if (this.trail.length > 24) this.trail.shift();
    }
  }
  checkLimit() {
    if (this.strokes >= this.course.maxStrokes) { this.finished = true; this.won = false; this.phase = 'result'; this.events.push('limit'); }
  }
  recover(hazard = false) {
    if (this.paused || this.finished || this.phase === 'complete' || !hazard && this.phase !== 'aim') return false;
    this.strokes++; this.ball = { ...this.lastLie, vx: 0, vy: 0 };
    this.phase = 'aim'; this.trail = []; this.accumulator = 0;
    this.events.push('recovery'); this.checkLimit(); return true;
  }
  nextHole() {
    if (this.paused || this.finished || this.phase !== 'complete') return false;
    this.holeIndex++; this.loadHole(); this.events.push('next'); return true;
  }
  setPaused(paused) { if (!this.finished) this.paused = !!paused; }
  drainEvents() { return this.events.splice(0); }
  reward() { return this.finished && this.won ? { ...GOLF_REWARD } : { hp: 0, stress: 0, euro: 0 }; }
  // A short dotted prediction uses the identical physics, but never mutates the round.
  predict(angle, power) {
    const ball = { ...this.ball, vx: Math.cos(angle) * MAX_SHOT_SPEED * power, vy: Math.sin(angle) * MAX_SHOT_SPEED * power };
    const points = [];
    for (let i = 0; i < 100; i++) {
      const result = stepBall(ball, this.course);
      if (i % 8 === 0) points.push({ x: ball.x, y: ball.y });
      if (result === 'cup' || result === 'coffee' || !ball.vx && !ball.vy) break;
    }
    return points;
  }
}
