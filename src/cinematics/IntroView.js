import { introQuality } from './IntroCatalog.js';
import { screenInfo, toggleFullscreen } from '../systems/Screen.js';
import './intro.css';

const asset = path => import.meta.env.BASE_URL + path;
const preferencesKey = 'corporate-intro-preferences-v1';

export default class IntroView {
  constructor(intro, audio, onFinish) {
    this.intro = intro;
    this.audio = audio;
    this.onFinish = onFinish;
    this.abort = new AbortController();
    this.destroyed = false;
    this.generation = 0;
    this.preferences = { captions: true };
    try { Object.assign(this.preferences, JSON.parse(localStorage.getItem(preferencesKey) || '{}')); } catch {}
    this.originalFocus = document.activeElement;
    this.container = document.getElementById('game-container');
    this.wasInert = this.container?.inert;
    if (this.container) this.container.inert = true;
    this.root = document.createElement('section');
    this.root.className = 'world-intro';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', 'Introduzione: ' + intro.title);
    this.root.innerHTML = '<video playsinline webkit-playsinline preload="metadata"></video>' +
      '<header class="intro-heading"><span></span><h1></h1></header>' +
      '<div class="intro-center"><p role="status" aria-live="polite"></p><button data-action="play">Riproduci introduzione</button></div>' +
      '<footer class="intro-controls"><div class="intro-tools">' +
      '<button data-action="pause">Pausa</button><button data-action="mute"></button>' +
      '<button data-action="captions" aria-label="Sottotitoli italiani">CC</button>' +
      '<button data-action="quality" aria-label="Cambia qualità video"></button>' +
      '<button data-action="fullscreen">Schermo intero</button></div>' +
      '<button data-action="skip" class="intro-skip">SALTA <span aria-hidden="true">›</span></button></footer>';
    document.body.appendChild(this.root);
    this.video = this.root.querySelector('video');
    this.status = this.root.querySelector('[role="status"]');
    this.center = this.root.querySelector('.intro-center');
    this.playButton = this.button('play');
    this.root.querySelector('h1').textContent = intro.title;
    this.root.querySelector('.intro-heading span').textContent =
      'MONDO ' + intro.world + ' · ' + (intro.character === 'woman' ? 'WENDY' : 'JACK');
    this.video.poster = asset(intro.poster);
    this.video.disablePictureInPicture = true;
    this.video.setAttribute('aria-label', intro.title + ', dialoghi in italiano');
    this.track = document.createElement('track');
    this.track.kind = 'subtitles';
    this.track.label = 'Italiano';
    this.track.srclang = 'it';
    this.track.src = asset(intro.subtitles);
    this.track.default = true;
    this.video.appendChild(this.track);
    this.listen(this.track, 'load', () => this.refreshCaptions());
    this.listen(this.track, 'error', () => {
      this.button('captions').title = 'Sottotitoli non disponibili';
    });
    this.button('fullscreen').hidden = !screenInfo.canFullscreen;
    this.listen(this.root, 'click', event => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action) this.action(action);
    });
    this.listen(window, 'keydown', event => this.key(event), true);
    this.listen(window, 'blur', () => this.pause());
    this.listen(window, 'pagehide', () => this.pause());
    this.listen(document, 'visibilitychange', () => { if (document.hidden) this.pause(); });
    this.listen(this.video, 'playing', () => {
      if (document.hidden) { this.pause(); return; }
      this.clearLoading();
      this.center.hidden = true;
      this.button('pause').textContent = 'Pausa';
    });
    this.listen(this.video, 'pause', () => {
      this.clearLoading();
      if (!this.destroyed && !this.video.ended && !this.failed) this.showPlay('In pausa', 'Riprendi');
    });
    this.listen(this.video, 'waiting', () => this.loading());
    this.listen(this.video, 'stalled', () => this.loading());
    this.listen(this.video, 'ended', () => this.complete('ended'));
    this.listen(this.video, 'error', () => this.mediaError());
    this.unsubscribe = audio.subscribe(() => this.refreshAudio());
    this.refreshAudio();
    this.refreshCaptions();
    this.button('skip').focus({ preventScroll: true });
    const connection = navigator.connection || {};
    this.setSource(introQuality({
      coarse: matchMedia('(pointer: coarse)').matches, width: innerWidth,
      saveData: connection.saveData, effectiveType: connection.effectiveType
    }), true);
  }

  button(action) { return this.root.querySelector('[data-action="' + action + '"]'); }
  listen(target, type, callback, capture = false) {
    target.addEventListener(type, callback, { signal: this.abort.signal, capture });
  }

  setSource(quality, autoplay) {
    const at = this.video.currentTime || 0;
    const generation = ++this.generation;
    this.failed = false;
    this.quality = quality;
    this.button('quality').textContent = quality === '1080p' ? 'Full HD' : '720p';
    this.video.src = asset(this.intro.sources[quality]);
    this.video.addEventListener('loadedmetadata', () => {
      if (generation !== this.generation || this.destroyed) return;
      if (at > 0) this.video.currentTime = Math.min(at, Math.max(0, this.video.duration - 0.1));
      this.refreshCaptions();
    }, { once: true, signal: this.abort.signal });
    this.loading();
    this.video.load();
    if (autoplay) this.play();
    else this.showPlay('In pausa', 'Riprendi');
  }

  async play() {
    if (this.destroyed || this.failed) return;
    const generation = this.generation;
    this.playButton.hidden = true;
    this.loading();
    try {
      await this.video.play();
      if (!this.destroyed && (document.hidden || generation !== this.generation)) this.pause();
    } catch (error) {
      if (this.destroyed || generation !== this.generation || error.name === 'AbortError') return;
      this.clearLoading();
      if (error.name === 'NotAllowedError') this.showPlay('Tocca per avviare il filmato con audio', 'Riproduci');
      else this.mediaError();
    }
  }

  pause() {
    if (this.destroyed) return;
    this.video.pause();
    this.clearLoading();
    if (!this.failed) this.showPlay('In pausa', 'Riprendi');
  }

  loading() {
    if (this.destroyed || this.failed) return;
    this.center.hidden = false;
    this.status.textContent = 'Caricamento introduzione…';
    if (!this.loadingTimer) this.loadingTimer = setTimeout(() => {
      this.loadingTimer = null;
      if (!this.destroyed && !this.failed) {
        this.status.textContent = 'Il caricamento è lento. Puoi saltare il filmato e giocare.';
        this.playButton.hidden = false;
        this.playButton.textContent = 'Riprova';
      }
    }, 12000);
  }

  clearLoading() { clearTimeout(this.loadingTimer); this.loadingTimer = null; }
  showPlay(message, label) {
    this.center.hidden = false;
    this.status.textContent = message;
    this.playButton.hidden = false;
    this.playButton.textContent = label;
    this.button('pause').textContent = 'Riprendi';
  }

  mediaError() {
    if (this.destroyed || this.failed) return;
    this.clearLoading();
    if (this.quality === '1080p' && !this.triedFallback) {
      this.triedFallback = true;
      this.setSource('720p', true);
      return;
    }
    this.failed = true;
    this.video.pause();
    this.center.hidden = false;
    this.status.textContent = 'Filmato non disponibile. Puoi continuare a giocare.';
    this.playButton.hidden = true;
    this.button('skip').textContent = 'CONTINUA';
    this.button('pause').disabled = true;
  }

  refreshAudio() {
    this.video.muted = this.audio.muted;
    // iOS may enforce its system volume, but the mute control is still available.
    this.video.volume = this.audio.settings.master * this.audio.settings.voices;
    this.button('mute').textContent = this.audio.muted ? 'Audio spento' : 'Audio acceso';
    this.button('mute').setAttribute('aria-pressed', String(!this.audio.muted));
  }

  refreshCaptions() {
    for (const track of this.video.textTracks) {
      track.mode = this.preferences.captions ? 'showing' : 'hidden';
      for (const cue of track.cues || []) cue.line = -3;
    }
    this.button('captions').setAttribute('aria-pressed', String(this.preferences.captions));
  }

  action(action) {
    if (action === 'skip') this.complete(this.failed ? 'unavailable' : 'skip');
    else if (action === 'play' || action === 'pause') {
      if (this.video.paused) this.play(); else this.pause();
    } else if (action === 'mute') {
      this.audio.toggleMute();
    } else if (action === 'captions') {
      this.preferences.captions = !this.preferences.captions;
      this.refreshCaptions();
      try { localStorage.setItem(preferencesKey, JSON.stringify(this.preferences)); } catch {}
    } else if (action === 'quality') this.setSource(this.quality === '1080p' ? '720p' : '1080p', !this.video.paused);
    else if (action === 'fullscreen') toggleFullscreen();
  }

  key(event) {
    // Capture before Phaser so movie keys never move or start the underlying game.
    event.stopImmediatePropagation();
    if (event.key === 'Tab') {
      const buttons = [...this.root.querySelectorAll('button')].filter(b => !b.hidden && !b.disabled && b.getClientRects().length);
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      return;
    }
    if (event.repeat) { event.preventDefault(); return; }
    if (['Enter', ' '].includes(event.key) && event.target.tagName === 'BUTTON') return;
    const action = { Escape: 'skip', ' ': 'pause', Enter: 'play', p: 'pause', m: 'mute', c: 'captions', f: 'fullscreen' }[event.key] ||
      { P: 'pause', M: 'mute', C: 'captions', F: 'fullscreen' }[event.key];
    if (action) { event.preventDefault(); this.action(action); }
  }

  complete(reason) {
    if (this.destroyed || this.completed) return;
    this.completed = true;
    this.onFinish(reason);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.generation++;
    this.abort.abort();
    this.clearLoading();
    this.unsubscribe?.();
    this.video.pause();
    this.video.removeAttribute('src');
    this.track.removeAttribute('src');
    this.video.load(); // Release the decoder and cancel any remaining download.
    this.root.remove();
    if (this.container) this.container.inert = this.wasInert;
    if (this.originalFocus?.isConnected) this.originalFocus.focus({ preventScroll: true });
  }
}
