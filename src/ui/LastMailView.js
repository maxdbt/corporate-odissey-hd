import { LAST_MAIL_SECONDS } from '../systems/LastMailRound.js';
import { audio } from '../systems/Audio8bit.js';
import { screenInfo, toggleFullscreen } from '../systems/Screen.js';
import './last-mail.css';

const asset = (name) => import.meta.env.BASE_URL + 'assets/last-mail/' + name;
const icons = {
  stamp: '<path d="M8 16h16v5H8zM12 16v-5c-4-7 12-7 8 0v5M5 25h22"/>',
  coffee: '<path d="M6 12h16v9a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6zM22 13h3a4 4 0 0 1 0 8h-3M11 3c-4 4 4 4 0 7M18 3c-4 4 4 4 0 7"/>',
  mail: '<rect x="3" y="7" width="26" height="19" rx="2"/><path d="m4 9 12 9L28 9"/>',
  file: '<path d="M7 3h13l6 6v21H7zM19 3v8h7M11 17h11M11 22h8"/>',
  call: '<path d="M9 4 4 8c0 10 11 21 21 21l4-5-7-5-4 4-9-9 4-4z"/>',
  vacation: '<path d="M7 28h19M18 27l3-18M21 9Q9-3 4 10q8-4 17-1M21 9Q25-2 31 7q-6-1-10 2M21 9Q13 9 11 17q5-4 10-8"/>',
  pause: '<path d="M11 6v20M21 6v20"/>',
  screen: '<path d="M12 4H4v8M20 4h8v8M4 20v8h8M28 20v8h-8"/>',
  sound: '<path d="m4 13 7 0 8-7v22l-8-7H4zM23 11q8 6 0 12"/>',
  clock: '<circle cx="16" cy="18" r="11"/><path d="M12 2h8M16 7v11l5 3"/>'
};
const icon = (name) => '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + icons[name] + '</svg>';

export default class LastMailView {
  constructor(round, sound, { hp = 100, preview = false, onExit, onRetry, onReward }) {
    this.round = round;
    this.sound = sound;
    this.preview = preview;
    this.onExit = onExit;
    this.onRetry = onRetry;
    this.onReward = onReward;
    this.nodes = new Map();
    this.timers = new Set();
    this.abort = new AbortController();
    this.stampAge = Infinity;
    this.lastFrame = -1;
    this.resultShown = false;
    this.loaded = false;
    this.subtitleGeneration = 0;
    this.originalFocus = document.activeElement;
    this.root = document.createElement('section');
    this.root.className = 'last-mail';
    this.root.setAttribute('aria-label', "Bonus in prima persona: L'ultima mail");
    this.root.dataset.phase = 'intro';
    this.root.dataset.touch = String(matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).get('touch') === '1');
    this.root.innerHTML = [
      '<div class="lm-office"></div><div class="lm-shade"></div>',
      '<header class="lm-hud">',
      '<div class="lm-vitals"><span class="lm-eyebrow">CORPORATE ODYSSEY</span>',
      '<div class="lm-meter-row"><span>SALUTE</span><div class="lm-meter"><i class="lm-health"></i></div><b>' + hp + '</b></div>',
      '<div class="lm-meter-row"><span>STRESS</span><div class="lm-meter lm-stress"><i></i></div><b data-value="stress"></b></div></div>',
      '<div class="lm-heading"><span class="lm-eyebrow">BONUS POV</span><h1>L’ULTIMA MAIL</h1><span class="lm-time">' + icon('clock') + '<b data-value="time">00:45</b></span></div>',
      '<div class="lm-score"><span class="lm-eyebrow">PUNTI</span><strong data-value="score">0000</strong><span class="lm-combo">COMBO <b data-value="combo">×1</b></span></div>',
      '<nav class="lm-tools" aria-label="Impostazioni del bonus">',
      '<button data-action="fullscreen" aria-label="Schermo intero" title="Schermo intero (F)">' + icon('screen') + '</button>',
      '<button data-action="mute" aria-label="Disattiva audio" title="Audio (M)">' + icon('sound') + '</button>',
      '<button data-action="voice" aria-label="Disattiva battute vocali" title="Battute vocali">V</button>',
      '<button data-action="pause" aria-label="Pausa" title="Pausa (P)">' + icon('pause') + '</button></nav></header>',
      '<div class="lm-progress"><i></i></div>',
      '<div class="lm-cards" aria-label="Richieste in arrivo"></div>',
      '<div class="lm-stamp-hand" aria-hidden="true"></div><div class="lm-imprint" aria-hidden="true">A GENNAIO</div>',
      '<div class="lm-subtitle" role="status" aria-live="polite"></div>',
      '<div class="lm-bottom"><span class="lm-desktop-hint">CLIC / 1 · 2 · 3 <b>timbra</b> &nbsp; SPAZIO <b>caffè</b></span>',
      '<div class="lm-permit">' + icon('vacation') + '<span>FERIE<br><b data-value="permits">0</b></span></div>',
      '<button class="lm-coffee" data-action="coffee" title="Caffè: spazio">' + icon('coffee') + '<span>CAFFÈ <b>1</b></span></button></div>',
      '<div class="lm-modal"><div class="lm-panel" role="dialog" aria-modal="true" aria-labelledby="lm-panel-title"></div></div>',
      '<div class="lm-rotate"><span>↻</span><strong>Ruota il telefono</strong><p>La scrivania ti aspetta in orizzontale.</p></div>'
    ].join('');
    document.body.appendChild(this.root);
    this.root.querySelector('.lm-office').style.backgroundImage = 'url("' + asset('office.webp') + '")';
    this.root.querySelector('.lm-stamp-hand').style.backgroundImage = 'url("' + asset('stamp-frames.webp') + '")';
    this.root.querySelector('.lm-health').style.width = hp + '%';
    this.panel = this.root.querySelector('.lm-panel');
    this.layer = this.root.querySelector('.lm-cards');
    this.showIntro();
    this.listen(this.root, 'click', (event) => {
      const card = event.target.closest('[data-card]');
      if (card) { this.activate(Number(card.dataset.card)); return; }
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action) this.action(action);
    });
    this.listen(this.root, 'pointerdown', (event) => {
      if (event.pointerType === 'touch') this.root.dataset.touch = 'true';
      if (event.pointerType === 'mouse' && new URLSearchParams(location.search).get('touch') !== '1') this.root.dataset.touch = 'false';
    });
    this.listen(window, 'keydown', (e) => this.key(e), true);
    this.listen(document, 'visibilitychange', () => { if (document.hidden) this.pause(); });
    this.listen(window, 'blur', () => this.pause());
    this.listen(window, 'resize', () => this.checkOrientation());
    this.listen(window, 'pagehide', () => this.pause());
    this.assetsReady();
    this.refresh();
  }

  listen(target, name, callback, capture = false) {
    target.addEventListener(name, callback, { signal: this.abort.signal, capture });
  }

  later(fn, ms) {
    const timer = setTimeout(() => { this.timers.delete(timer); if (this.root.isConnected) fn(); }, ms);
    this.timers.add(timer);
  }

  async assetsReady() {
    const load = (file) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve; img.onerror = reject; img.src = asset(file);
    });
    try {
      await Promise.all([load('office.webp'), load('stamp-frames.webp')]);
      if (!this.root.isConnected) return;
      this.loaded = true;
      const start = this.root.querySelector('[data-action="start"]');
      if (start) { start.disabled = false; start.textContent = 'INIZIA IL TURNO'; start.focus(); }
    } catch {
      if (!this.root.isConnected) return;
      const start = this.root.querySelector('[data-action="start"]');
      if (start) { start.disabled = false; start.dataset.action = 'reload'; start.textContent = 'RICARICA LE IMMAGINI'; }
    }
  }

  showIntro() {
    this.root.dataset.modal = 'true';
    this.panel.innerHTML = '<span class="lm-eyebrow">24 DICEMBRE · ORE 17:59</span><h2 id="lm-panel-title">Solo un’ultima mail.</h2>' +
      '<p>La borsa è pronta. Il capo, purtroppo, no.<br>Resisti 45 secondi e guadagnati le ferie.</p>' +
      '<div class="lm-instructions"><div>' + icon('stamp') + '<strong>Timbra le richieste</strong><span>Clicca o tocca. Se arrivano alla scrivania, sale lo stress.</span></div>' +
      '<div>' + icon('vacation') + '<strong>Prendi le ferie</strong><span>Raccogli almeno un biglietto dorato e resta sotto 100 stress.</span></div>' +
      '<div>' + icon('coffee') + '<strong>Un caffè ti salva</strong><span>Una sola tazzina: −30 stress.<br>Spazio su PC, pulsante su mobile.</span></div></div>' +
      '<button class="lm-primary" data-action="start" disabled>PREPARO LA SCRIVANIA…</button>' +
      '<button class="lm-link" data-action="exit">' + (this.preview ? 'Vai al gioco completo' : 'Torna in ufficio') + '</button>' +
      '<small>PC: mouse o tasti 1, 2, 3 · Mobile: tocca gli oggetti<br>' +
      (this.preview ? 'Modalità libera. Il checkpoint si ottiene nella partita principale.' : 'Premio: +1 giorno di ferie, checkpoint e −20 stress.') + '</small>';
  }

  action(action) {
    if (action === 'start' && this.loaded && this.round.phase === 'intro') {
      this.sound.unlock(); this.round.start(); this.hideModal();
      this.subtitle('L’ultima mail. Poi scappo, eh!'); return;
    }
    if (action === 'reload') { this.showIntro(); this.assetsReady(); }
    if (action === 'coffee') this.coffee();
    if (action === 'pause') this.pause();
    if (action === 'resume') {
      if (this.checkOrientation()) return;
      this.round.resume(); this.hideModal(); this.sound.unlock();
    }
    if (action === 'fullscreen') toggleFullscreen();
    if (action === 'mute') {
      audio.toggleMute(); this.sound.setMuted();
      const button = this.root.querySelector('[data-action="mute"]');
      button.classList.toggle('lm-off', audio.muted);
      button.setAttribute('aria-label', audio.muted ? 'Attiva audio' : 'Disattiva audio');
    }
    if (action === 'voice') {
      this.sound.voices = !this.sound.voices; this.sound.stopVoices();
      const button = this.root.querySelector('[data-action="voice"]');
      button.classList.toggle('lm-off', !this.sound.voices);
      button.setAttribute('aria-label', this.sound.voices ? 'Disattiva battute vocali' : 'Attiva battute vocali');
    }
    if (action === 'retry' && this.preview) this.onRetry();
    if (action === 'exit') this.onExit();
  }

  key(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'tab') {
      const scope = this.root.dataset.modal === 'true' ? this.panel : this.root;
      const buttons = [...scope.querySelectorAll('button:not(:disabled)')].filter((b) => b.getClientRects().length);
      if (buttons.length && ((!event.shiftKey && document.activeElement === buttons.at(-1)) ||
          (event.shiftKey && document.activeElement === buttons[0]))) {
        event.preventDefault(); (event.shiftKey ? buttons.at(-1) : buttons[0]).focus();
      }
      return;
    }
    if (![' ', 'enter', 'escape', 'p', 'f', 'm', '1', '2', '3'].includes(key)) return;
    // A native button's Enter is already handled by its click listener.
    if (key === 'enter' && event.target.tagName === 'BUTTON') return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.repeat) return;
    if (key === 'f') this.action('fullscreen');
    else if (key === 'm') this.action('mute');
    else if (key === 'escape' || key === 'p') {
      if (this.round.phase === 'paused') this.action('resume');
      else if (this.round.phase === 'play') this.pause();
    } else if ((key === 'enter' || key === ' ') && this.round.phase === 'intro') this.action('start');
    else if (key === ' ' && this.round.phase === 'play') this.coffee();
    else if (['1', '2', '3'].includes(key) && this.round.phase === 'play') {
      const card = this.round.cards.filter((c) => c.lane === Number(key) - 1).sort((a, b) => b.age - a.age)[0];
      if (card) this.activate(card.id);
    }
  }

  checkOrientation() {
    const portrait = this.root.dataset.touch === 'true' && window.innerHeight > window.innerWidth;
    this.root.dataset.portrait = String(portrait);
    if (portrait) this.pause();
    return portrait;
  }

  pause() {
    if (this.round.phase !== 'play') return;
    this.round.pause(); this.sound.stopVoices();
    this.root.dataset.phase = 'paused'; this.root.dataset.modal = 'true';
    this.panel.innerHTML = '<span class="lm-eyebrow">NESSUNA URGENZA, PER ORA</span><h2 id="lm-panel-title">Pausa caffè.</h2>' +
      '<p>Il tempo e le richieste sono fermi.<br>Riprendi quando vuoi.</p>' +
      '<button class="lm-primary" data-action="resume">RIPRENDI</button>' +
      '<button class="lm-link" data-action="exit">Esci dal bonus</button>';
    this.panel.querySelector('button').focus();
  }

  hideModal() {
    this.root.dataset.modal = 'false';
    this.root.dataset.phase = this.round.phase;
    this.root.tabIndex = -1; this.root.focus({ preventScroll: true });
  }

  activate(id) {
    const result = this.round.hit(id);
    if (!result) return;
    this.sound.unlock();
    this.sound.effect(result.type);
    const node = this.nodes.get(id);
    if (node) {
      node.disabled = true;
      node.classList.add('lm-done');
      const mark = document.createElement('span');
      mark.className = 'lm-card-stamp';
      mark.textContent = result.type === 'collect' ? 'MIE!' : 'A GENNAIO';
      node.appendChild(mark);
      this.nodes.delete(id);
      this.later(() => node.remove(), 400);
    }
    if (result.type === 'stamp') {
      this.stampAge = 0;
      this.root.querySelector('.lm-imprint').classList.remove('lm-show');
      this.later(() => this.root.querySelector('.lm-imprint').classList.add('lm-show'), 120);
      const line = this.sound.say('stamp');
      if (line) this.subtitle(line);
    } else this.subtitle('Ferie approvate. Queste so’ mie!');
    this.refresh();
  }

  coffee() {
    if (!this.round.coffee()) return;
    this.sound.unlock(); this.sound.effect('coffee');
    this.subtitle(this.sound.say('coffee', true) || 'Una tazzina e me ripiglio!');
    this.root.classList.add('lm-caffeinated');
    this.later(() => this.root.classList.remove('lm-caffeinated'), 650);
    this.refresh();
  }

  subtitle(text) {
    const node = this.root.querySelector('.lm-subtitle');
    node.textContent = text; node.classList.add('lm-show');
    const generation = ++this.subtitleGeneration;
    this.later(() => { if (this.subtitleGeneration === generation) node.classList.remove('lm-show'); }, text?.length > 45 ? 5600 : 3200);
  }

  makeCard(card) {
    const node = document.createElement('button');
    node.className = 'lm-card lm-' + card.kind;
    node.dataset.card = card.id;
    node.setAttribute('aria-label', (card.kind === 'vacation' ? 'Raccogli ' : 'Timbra ') + card.title);
    node.innerHTML = '<span class="lm-card-top">' + icon(card.kind) + '<small>' +
      (card.kind === 'vacation' ? 'RISORSE UMANE' : card.kind === 'call' ? 'CHIAMATA IN ARRIVO' : 'POSTA IN ARRIVO') +
      '</small><kbd>' + (card.lane + 1) + '</kbd></span><strong>' + card.title + '</strong><span class="lm-card-detail">' +
      card.detail + '</span><span class="lm-card-footer">' + (card.kind === 'vacation' ? '✦ RACCOGLI' : 'TIMBRA →') + '</span>';
    this.layer.appendChild(node);
    this.nodes.set(card.id, node);
  }

  showResult() {
    if (this.resultShown) return;
    this.resultShown = true;
    const r = this.round;
    this.nodes.forEach((node) => node.remove()); this.nodes.clear();
    this.onReward(r.claimReward());
    this.sound.effect(r.won ? 'win' : 'miss');
    this.subtitle(this.sound.say(r.won ? 'win' : 'miss', true));
    this.root.dataset.phase = 'result'; this.root.dataset.modal = 'true';
    this.panel.innerHTML = '<span class="lm-eyebrow">' + (r.won ? 'RISPOSTA AUTOMATICA ATTIVATA' : 'LA POSTA PUÒ ASPETTARE') +
      '</span><h2 id="lm-panel-title">' + (r.won ? 'Fuori ufficio!' : r.stress >= 100 ? 'Troppe urgenze.' : 'Mancano le ferie!') + '</h2>' +
      '<p>' + (r.won ? 'Hai difeso il tuo tempo. Ci si vede a gennaio.' : r.stress >= 100 ? 'Il capo ha vinto questo giro. Respira e riparti.' : 'Il tempo è scaduto: raccogli anche un biglietto dorato.') + '</p>' +
      '<div class="lm-result-stats"><div><strong>' + r.score + '</strong><span>PUNTI</span></div><div><strong>' +
      r.resolved + '</strong><span>RICHIESTE RESPINTE</span></div><div><strong>' + r.collected + '</strong><span>BIGLIETTI FERIE</span></div></div>' +
      '<div class="lm-reward">' + (this.preview ? 'Modalità libera · ' : '') +
      (r.won ? (this.preview ? 'Nella partita: +1 ferie e checkpoint, −20 stress.' : '+1 FERIE · CHECKPOINT · −20 STRESS') : this.preview ? 'Riprova e tieni d’occhio lo stress.' : '+10 stress · Torni alla partita.') + '</div>' +
      (this.preview ? '<button class="lm-primary" data-action="retry">UN ALTRO TURNO</button>' : '') +
      '<button class="' + (this.preview ? 'lm-link' : 'lm-primary') + '" data-action="exit">' +
      (this.preview ? 'VAI AL GIOCO COMPLETO' : 'TORNA IN UFFICIO') + '</button>';
    this.panel.querySelector('button').focus();
  }

  refresh() {
    const r = this.round;
    const values = { stress: Math.round(r.stress), time: '00:' + String(Math.ceil(r.remaining)).padStart(2, '0'),
      score: String(r.score).padStart(4, '0'), combo: '×' + r.multiplier, permits: r.collected };
    for (const [key, value] of Object.entries(values)) {
      const node = this.root.querySelector('[data-value="' + key + '"]');
      if (node.textContent !== String(value)) node.textContent = value;
    }
    this.root.querySelector('.lm-stress i').style.width = r.stress + '%';
    this.root.querySelector('.lm-progress i').style.transform = 'scaleX(' + r.remaining / LAST_MAIL_SECONDS + ')';
    this.root.classList.toggle('lm-danger', r.stress >= 75);
    const coffee = this.root.querySelector('[data-action="coffee"]');
    coffee.disabled = !r.coffeeLeft || r.phase !== 'play';
    coffee.querySelector('b').textContent = r.coffeeLeft;
    this.root.querySelector('[data-action="pause"]').disabled = r.phase !== 'play';
    this.root.querySelector('[data-action="fullscreen"]').hidden = !screenInfo.canFullscreen;
  }

  update(delta) {
    if (!this.root.isConnected) return;
    const events = this.round.tick(delta / 1000);
    for (const event of events) {
      if (event.type === 'spawn') { this.makeCard(event.card); this.sound.effect('spawn'); }
      else {
        const node = this.nodes.get(event.card.id);
        node?.remove(); this.nodes.delete(event.card.id);
        if (event.card.kind !== 'vacation') {
          this.sound.effect('miss');
          const line = this.sound.say('miss'); if (line) this.subtitle(line);
        }
      }
    }
    if (this.round.phase === 'play') {
      this.stampAge += Math.min(delta, 100);
      const frame = this.stampAge < 70 ? 1 : this.stampAge < 155 ? 2 : this.stampAge < 240 ? 3 : 0;
      if (frame !== this.lastFrame) {
        this.lastFrame = frame;
        this.root.querySelector('.lm-stamp-hand').style.backgroundPosition = (frame % 2 ? '100%' : '0%') + ' ' + (frame >= 2 ? '100%' : '0%');
      }
      for (const card of this.round.cards) {
        const node = this.nodes.get(card.id);
        if (!node) continue;
        const p = Math.min(1, card.age / card.life);
        const x = 0.5 + (card.x - 0.5) * (0.72 + p * 0.35);
        const y = 0.25 + p * 0.39 + (card.lane === 1 ? -0.035 : 0.015);
        node.style.left = x * 100 + '%'; node.style.top = y * 100 + '%';
        node.style.transform = 'translate(-50%,-50%) scale(' + (0.72 + p * 0.48) + ') rotate(' + card.tilt + 'deg)';
        node.style.zIndex = String(10 + Math.floor(p * 100));
        node.classList.toggle('lm-near', p > 0.76);
      }
    }
    if (this.round.phase === 'result') this.showResult();
    this.refresh();
  }

  destroy() {
    this.abort.abort();
    this.timers.forEach(clearTimeout); this.timers.clear();
    this.root.remove();
    if (this.originalFocus?.isConnected) this.originalFocus.focus?.({ preventScroll: true });
  }
}
