import { audio } from './Audio8bit.js';

const base = `${import.meta.env.BASE_URL}assets/last-mail/`;
export const LAST_MAIL_LINES = {
  stamp: { text: 'Aò! Se ne riparla a gennaio!', file: 'a-gennaio.mp3' },
  win: { text: "Daje! Mo’ basta! Sto in ferie!", file: 'sto-in-ferie.mp3' },
  miss: { text: 'Ma quale urgente! È Natale!', file: 'e-natale.mp3' },
  coffee: { text: "Aò! Una tazzina e me ripiglio! Va’, famme fa’ un caffè!", file: 'caffe.mp3' }
};

// Recorded ElevenLabs lines + lightweight synthesized foley. No runtime API calls or keys.
export default class LastMailAudio {
  constructor() {
    this.voices = true;
    this.nextVoice = 0;
    this.voiceEpoch = 0;
    this.buffers = new Map();
    this.unsubscribe = audio.subscribe(() => { if (audio.muted) this.stopVoices(); });
    // All speech uses the context unlocked by START, including automatic win/miss lines on mobile.
    this.clips = Object.fromEntries(Object.entries(LAST_MAIL_LINES).map(([key, line]) =>
      [key, fetch(base + line.file).then((response) => response.ok ? response.arrayBuffer() : null).catch(() => null)]));
  }

  unlock() {
    audio.unlock();
    if (!this.context) {
      if (audio.ctx) {
        try {
          this.context = audio.ctx;
          this.output = this.context.createGain();
          this.output.gain.value = 0.3;
          this.output.connect(audio.sfxGain);
        } catch { /* The game remains playable with subtitles if audio is unavailable. */ }
      }
    }
  }

  tone(freq, duration, type = 'sine', gain = 0.35, delay = 0) {
    if (!this.context || audio.muted || audio.paused) return;
    const c = this.context;
    const t = c.currentTime + delay;
    const osc = c.createOscillator();
    const envelope = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(50, freq * 0.55), t + duration);
    envelope.gain.setValueAtTime(gain, t);
    envelope.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(envelope); envelope.connect(this.output);
    osc.start(t); osc.stop(t + duration + 0.01);
    osc.onended = () => { osc.disconnect(); envelope.disconnect(); };
  }

  paper() {
    if (!this.context || audio.muted || audio.paused) return;
    const c = this.context;
    const buffer = c.createBuffer(1, Math.floor(c.sampleRate * 0.12), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.12;
    const node = c.createBufferSource(); node.buffer = buffer;
    node.connect(this.output); node.start(); node.onended = () => node.disconnect();
  }

  effect(kind) {
    if (kind === 'stamp') { this.tone(130, 0.12, 'triangle', 0.8); this.paper(); }
    if (kind === 'spawn') this.paper();
    if (kind === 'collect' || kind === 'win') {
      [660, 880, 1100].forEach((f, i) => this.tone(f, 0.2, 'sine', 0.4, i * 0.075));
    }
    if (kind === 'miss') this.tone(180, 0.25, 'triangle', 0.3);
    if (kind === 'coffee') { this.tone(420, 0.18); this.tone(620, 0.2, 'sine', 0.35, 0.12); }
  }

  say(key, force = false) {
    const line = LAST_MAIL_LINES[key];
    if (!line || (!force && performance.now() < this.nextVoice)) return null;
    this.nextVoice = performance.now() + 7000;
    this.stopVoices();
    if (this.voices && !audio.muted) {
      this.playLine(key, this.voiceEpoch);
    }
    return line.text;
  }

  async playLine(key, epoch) {
    try {
      const context = this.context;
      if (!context) return;
      if (!this.buffers.has(key)) {
        const data = await this.clips[key];
        if (!data || context.state === 'closed') return;
        this.buffers.set(key, await context.decodeAudioData(data.slice(0)));
      }
      if (epoch !== this.voiceEpoch || !this.voices || audio.muted || context.state === 'closed') return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      gain.gain.value = 0.8;
      source.buffer = this.buffers.get(key);
      source.connect(gain); gain.connect(audio.voiceGain);
      audio.duck(0.25, source.buffer.duration);
      this.voiceSource = source;
      source.onended = () => { source.disconnect(); gain.disconnect(); if (this.voiceSource === source) this.voiceSource = null; };
      source.start();
    } catch { /* Keep the synchronized subtitle if a clip cannot be decoded. */ }
  }

  stopVoices() {
    this.voiceEpoch++;
    try { this.voiceSource?.stop(); } catch { /* Already ended. */ }
    this.voiceSource = null;
  }
  setMuted() {
    this.stopVoices();
  }
  destroy() {
    this.stopVoices();
    this.buffers.clear();
    this.unsubscribe?.();
    this.output?.disconnect();
    this.context = null;
  }
}
