/* ------------------------------ ESTADO -------------------------------- */
const MODES = ['CLÁSSICO', 'INFINITO'], PTS = [3, 5, 7, 10, 15], TIMES = [30, 60, 90, 120, 180];
const LOOTS = [{ name: 'POUCA', per: .7, perF: .3, near: false, every: 14 }, { name: 'MÉDIA', per: 1.4, perF: .7, near: true, every: 8 }, { name: 'MUITA', per: 3, perF: 1.5, near: true, every: 3.5 }];   // loot: por "tela" de mapa (MAPK²) + por lutador; near = uma arma ao alcance de cada lutador na largada; every = reposição (s)
const lootInit = (i, nf) => Math.round(MAPK * MAPK * LOOTS[i].per + nf * LOOTS[i].perF);   // armas no chão na largada (nf = nº de lutadores)
const lootCap = (i, nf) => Math.round(lootInit(i, nf) * 1.4) + 2;                              // máximo de armas no chão   // loot: armas iniciais, máximo no mapa e intervalo de novas armas (s)
let state = 'intro', cfg = { bots: 4, diff: 1, char: 0, mode: 0, pts: 1, time: 2, loot: 1, musicVol: 7, sfxVol: 8, music: 0 }, training = false, chIdx = 0, trainT = 0;
let M = null, introT = 0;
const NET = { peer: null, conns: {}, host: false, code: '', players: [], me: null, msg: '', err: '', busy: false, snap: null, others: null, cap: 8, copied: false }; let JOIN = '', NETBID = 0;   // estado do modo online
/* Teclas personalizáveis (tela OPÇÕES). As setas continuam movendo o personagem como alternativa. */
const KEYDEFS = [['up', 'MOVER PARA CIMA', 'KeyW'], ['down', 'MOVER PARA BAIXO', 'KeyS'], ['left', 'MOVER PARA ESQUERDA', 'KeyA'], ['right', 'MOVER PARA DIREITA', 'KeyD'],
  ['interact', 'PEGAR ARMA', 'KeyE'], ['reload', 'RECARREGAR', 'KeyR'], ['cover', 'COBERTURA', 'KeyC'], ['throw', 'ARREMESSAR ARMA', 'KeyG'], ['hit', 'MOSTRAR HITBOX', 'KeyH'], ['slide', 'DESLIZAR', 'Space'], ['holster', 'SACAR / GUARDAR ARMA', 'KeyQ']];
const KEYS = {}; KEYDEFS.forEach(([id,, def]) => KEYS[id] = def);
try {
  const sv = JSON.parse(localStorage.getItem('oc_keys') || '{}'); for (const [id] of KEYDEFS) if (typeof sv[id] === 'string' && sv[id]) KEYS[id] = sv[id];
  if (sv.holster === undefined) for (const [id,, d] of KEYDEFS) if (id !== 'holster' && KEYS[id] === KEYS.holster) KEYS[id] = d;   // Q passou a sacar/guardar a arma: quem usava Q volta à tecla padrão (a cobertura agora é C)
} catch (e) {}
let bindCapture = null, optBack = 'menu';   // bindCapture = ação esperando a nova tecla; optBack = para onde VOLTAR leva (lobby ou pausa)
const keyName = c => c.startsWith('Key') ? c.slice(3) : c.startsWith('Digit') ? c.slice(5) : ({ ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Space: 'ESPAÇO', ShiftLeft: 'SHIFT ESQ.', ShiftRight: 'SHIFT DIR.', ControlLeft: 'CTRL ESQ.', ControlRight: 'CTRL DIR.', AltLeft: 'ALT ESQ.', AltRight: 'ALT DIR.', Tab: 'TAB', Enter: 'ENTER', Backspace: 'BACKSPACE', CapsLock: 'CAPS' }[c] || c.replace(/^Numpad/, 'NUM ').toUpperCase());
function setKey(id, code) {   // se a tecla já era de outra ação, as duas trocam de lugar
  const other = KEYDEFS.find(([o]) => o !== id && KEYS[o] === code);
  if (other) KEYS[other[0]] = KEYS[id];
  KEYS[id] = code; try { localStorage.setItem('oc_keys', JSON.stringify(KEYS)); } catch (e) {}
}

/* ------------------------------ ÁUDIO ---------------------------------- */
/* Tudo sintetizado com Web Audio (sem arquivos): efeitos da abertura/contagem e 6 músicas (5 de partida + 1 de lobby). */
const AC = window.AudioContext || window.webkitAudioContext;
let ac = null, musicBus = null, sfxBus = null, noiseBuf = null, introGate = true, matchTrack = 0;
const mu = { want: undefined, cur: null, duck: 1 };
const vol = v => Math.pow(v / 10, 1.6), mtof = n => 440 * Math.pow(2, (n - 69) / 12);
function initAudio() {
  if (ac || !AC) return;
  try {
    ac = new AC();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; comp.connect(ac.destination);
    musicBus = ac.createGain(); sfxBus = ac.createGain(); musicBus.connect(comp); sfxBus.connect(comp);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyVolumes();
  } catch (e) { ac = null; }
}
function applyVolumes() { if (!ac) return; musicBus.gain.setTargetAtTime(.5 * vol(cfg.musicVol) * mu.duck, ac.currentTime, .05); sfxBus.gain.setTargetAtTime(.9 * vol(cfg.sfxVol), ac.currentTime, .05); }
function unlockAudio() { initAudio(); if (ac && ac.state !== 'running') { try { ac.resume(); } catch (e) {} } }
function audioChanged() { saveCfg(); if (cfg.music) matchTrack = cfg.music - 1; applyVolumes(); }
function introClick() { unlockAudio(); if (introGate) { introGate = false; introT = 0; HATC = hatClock(); const y0 = 1.15 * HATC; HATY = Math.ceil((y0 + .5) / Math.PI) * Math.PI; HATD = clamp((HATY - y0) / 1.6, .7, 1.2); } else skipIntro(); }
initAudio();

function env(g, t, a, peak, d) { g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
function noiseSrc(t, dur) { const n = ac.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.start(t, Math.random()); n.stop(t + dur); return n; }
function nz(out, t, dur, type, freq, peak, atk, dec, sweepTo) {   // rajada de ruído filtrada
  const n = noiseSrc(t, dur), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = type; f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dec); env(g, t, atk, peak, dec); n.connect(f); f.connect(g); g.connect(out); return g;
}
function tone(out, t, type, f0, f1, dur, peak, atk, dec) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, atk, peak, dec); o.connect(g); g.connect(out); o.start(t); o.stop(t + Math.max(dur, atk + dec) + .05);
}
function sfxShot() {   // tiro: estouro + estalo + corpo grave + eco
  if (!ac) return; const t = ac.currentTime + .005, out = sfxBus;
  const g = nz(out, t, .7, 'lowpass', 5000, 1, .002, .5, 260);
  nz(out, t, .15, 'highpass', 2500, .8, .001, .07);
  tone(out, t, 'sine', 170, 38, .3, 1, .002, .38);
  const d = ac.createDelay(); d.delayTime.value = .13; const dg = ac.createGain(); dg.gain.value = .3; g.connect(d); d.connect(dg); dg.connect(out);
}
function sfxGlass() {   // vidro trincando
  if (!ac) return; const t = ac.currentTime + .01;
  nz(sfxBus, t, .2, 'highpass', 6000, .35, .001, .12);
  for (let i = 0; i < 7; i++) tone(sfxBus, t + Math.random() * .14, 'sine', 2400 + Math.random() * 3800, 0, .3, .1, .001, .26);
}
function sfxRiser(dur) {   // tensão subindo antes dos tiros
  if (!ac) return; const t = ac.currentTime + .02, n = noiseSrc(t, dur + .1), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(200, t); f.frequency.exponentialRampToValueAtTime(3000, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.4, t + dur); g.gain.linearRampToValueAtTime(.0001, t + dur + .08); n.connect(f); f.connect(g); g.connect(sfxBus);
  const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(55, t); o.frequency.exponentialRampToValueAtTime(260, t + dur); og.gain.setValueAtTime(.0001, t); og.gain.linearRampToValueAtTime(.12, t + dur); og.gain.linearRampToValueAtTime(.0001, t + dur + .08); o.connect(og); og.connect(sfxBus); o.start(t); o.stop(t + dur + .15);
}
function sfxHat() {   // chapéu puxado e lançado: pegada de feltro, depois o tecido girando no ar (pulsos cada vez mais rápidos, som subindo) e o estalo da aba
  if (!ac) return; const t = ac.currentTime + .01, out = sfxBus, T0 = t + .12, D = 1.4;
  tone(out, t, 'sine', 170, 62, .16, .32, .004, .14);                 // pegada abafada na copa
  nz(out, t, .24, 'lowpass', 1300, .16, .01, .18, 500);               // feltro roçando na mão
  nz(out, t + .02, .24, 'bandpass', 2400, .1, .02, .18, 1200);        // fiapos do tecido
  const n = noiseSrc(T0, D + .05), f = ac.createBiquadFilter(), env = ac.createGain(), mod = ac.createGain(), lfo = ac.createOscillator(), ld = ac.createGain();
  f.type = 'bandpass'; f.Q.value = 1.1; f.frequency.setValueAtTime(380, T0); f.frequency.exponentialRampToValueAtTime(3000, T0 + D);   // sobe como quem se afasta para cima
  env.gain.setValueAtTime(.0001, T0); env.gain.linearRampToValueAtTime(.42, T0 + D * .6); env.gain.exponentialRampToValueAtTime(.0001, T0 + D);
  mod.gain.value = .55; ld.gain.value = .45; lfo.type = 'sine'; lfo.frequency.setValueAtTime(5, T0); lfo.frequency.exponentialRampToValueAtTime(17, T0 + D);   // o giro do chapéu acelera
  lfo.connect(ld); ld.connect(mod.gain); n.connect(f); f.connect(mod); mod.connect(env); env.connect(out); lfo.start(T0); lfo.stop(T0 + D + .05);
  nz(out, T0 + D * .55, .12, 'highpass', 3500, .09, .003, .08);       // aba estalando
}
function sfxBeep(freq, len) { if (!ac) return; tone(sfxBus, ac.currentTime + .005, 'square', freq, 0, len || .12, .18, .003, len || .12); }
function sfxHorn() { if (!ac) return; const t = ac.currentTime + .005; [220, 330, 440].forEach(f => tone(sfxBus, t, 'sawtooth', f, 0, .5, .2, .005, .5)); nz(sfxBus, t, .4, 'highpass', 3000, .25, .002, .25); }

/* ---- SOM DE TIRO DE CADA ARMA ---- */
/* nDur/nFreq/nPeak/nDec/nSweep = estouro (ruído grave) | crackF/crack/crackDec = estalo agudo
   f0/f1/tDur/tPeak/tDec = corpo grave (soco no peito) | mid = [f0, f1, nível] timbre médio
   echo/echoG = eco da sala | click = atraso do clique mecânico | vol = volume geral da arma */
const GUN_SND = {
  python: { vol: 1,    nDur: .9,  nFreq: 4200, nPeak: 1,   nDec: .65, nSweep: 220, crackF: 2200, crack: .9,  crackDec: .09, f0: 150, f1: 34,  tDur: .38, tPeak: 1,    tDec: .45, mid: [320, 90, .4],  echo: .16, echoG: .35, click: .004 },   // revólver .357: estrondo grave e longo
  beretta: { vol: .85, nDur: .32, nFreq: 6800, nPeak: .75, nDec: .2,  nSweep: 800, crackF: 3400, crack: .85, crackDec: .045, f0: 260, f1: 90,  tDur: .14, tPeak: .5,  tDec: .14, mid: [800, 230, .28], echo: .08, echoG: .15, click: .003 },   // 9mm firme e seca
  sawed:  { vol: 1.1,  nDur: 1.0, nFreq: 3000, nPeak: 1.1,  nDec: .8,  nSweep: 140, crackF: 1500, crack: 1.1,  crackDec: .1,   f0: 110, f1: 28,  tDur: .5,  tPeak: 1.15, tDec: .55, mid: [220, 60, .5],   echo: .2,  echoG: .4,  click: .006 },   // calibre 12: estrondo largo e grave
  glock:  { vol: .8,   nDur: .28, nFreq: 7500, nPeak: .7,  nDec: .16, nSweep: 900, crackF: 3800, crack: .8,  crackDec: .04, f0: 280, f1: 100, tDur: .12, tPeak: .45,  tDec: .12, mid: [900, 260, .25], echo: .07, echoG: .12, click: .002 },  // 9mm compacta: estalo curto e agudo
  m1911:  { vol: .95,  nDur: .6,  nFreq: 4800, nPeak: .95, nDec: .4,  nSweep: 300, crackF: 2600, crack: .85, crackDec: .07, f0: 190, f1: 50,  tDur: .26, tPeak: .85,  tDec: .3,  mid: [450, 120, .35], echo: .12, echoG: .25, click: .004 },  // .45 ACP: pancada média e pesada
  deagle: { vol: 1.05, nDur: 1.3, nFreq: 3600, nPeak: 1.1, nDec: 1,   nSweep: 160, crackF: 1800, crack: 1.1, crackDec: .12, f0: 120, f1: 26,  tDur: .55, tPeak: 1.15, tDec: .7,  mid: [260, 70, .5],  echo: .22, echoG: .42, click: .005 },  // .50 AE: canhão, com cauda longa
};
function sfxGun(key, k) {   // k = volume relativo (1 = perto, menor = tiro distante)
  if (!ac || ac.state !== 'running') return;
  const p = GUN_SND[key]; if (!p) return;
  const t = ac.currentTime + .003, out = ac.createGain(); out.gain.value = (k == null ? 1 : k) * p.vol; out.connect(sfxBus);
  const g = nz(out, t, p.nDur, 'lowpass', p.nFreq, p.nPeak, .002, p.nDec, p.nSweep);          // estouro
  nz(out, t, p.crackDec + .08, 'highpass', p.crackF, p.crack, .001, p.crackDec);              // estalo
  tone(out, t, 'sine', p.f0, p.f1, p.tDur, p.tPeak, .002, p.tDec);                            // corpo grave
  tone(out, t, 'triangle', p.mid[0], p.mid[1], .12, p.mid[2], .001, .1);                      // timbre médio
  tone(out, t + p.click, 'square', 1800, 900, .03, .05, .001, .03);                           // clique mecânico
  const d = ac.createDelay(), dg = ac.createGain(), lp = ac.createBiquadFilter();             // eco
  d.delayTime.value = p.echo; dg.gain.value = p.echoG; lp.type = 'lowpass'; lp.frequency.value = 1800;
  g.connect(d); d.connect(lp); lp.connect(dg); dg.connect(out);
}

function sfxSwing() {   // golpe de arma branca: assobio do ar + pancada surda
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .003;
  nz(sfxBus, t, .22, 'highpass', 1800, .22, .02, .14); tone(sfxBus, t + .1, 'sine', 150, 55, .16, .45, .002, .12);
}

function sfxHolster() {   // clique curto de sacar/guardar a arma
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .003;
  tone(sfxBus, t, 'square', 900, 500, .05, .12, .001, .04); tone(sfxBus, t + .06, 'square', 500, 300, .05, .1, .001, .04);
}
function sfxBump() {   // trombada: pancada curta e seca
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .002;
  tone(sfxBus, t, 'sine', 170, 60, .16, .6, .002, .14); nz(sfxBus, t, .1, 'lowpass', 1800, .5, .001, .08, 300);
}
function sfxCrash() {   // batida pesada do deslize na estrutura: baque grave + estalo de impacto + ruído surdo
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .002;
  tone(sfxBus, t, 'sine', 120, 34, .45, 1, .002, .42); tone(sfxBus, t, 'triangle', 220, 60, .25, .55, .001, .22);
  nz(sfxBus, t, .3, 'lowpass', 1400, .9, .001, .25, 120); nz(sfxBus, t, .08, 'highpass', 2500, .35, .001, .06);
}
function sfxSlide() {   // deslize: rajada de ar rasteira
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .003;
  nz(sfxBus, t, .3, 'bandpass', 700, .2, .02, .2); tone(sfxBus, t, 'sine', 180, 70, .22, .25, .002, .15);
}

/* ---- SOM DE BOTÃO (menus) ---- */
/* Clique seco de trava de arma: estalo metálico + "toc" grave abafado (feltro/madeira) + fio de ressonância. Cada clique varia um pouco o tom (não cansa).
   kind 1 = botão principal (COMEÇAR, INICIAR...): mais pesado, com um segundo "clack" de ferrolho | kind 0 = botão comum */
const UI_HOVER = true;   // false = sem o tiquezinho ao passar o mouse
function sfxClick(kind) {
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .002, v = 1 + (Math.random() - .5) * .07, p = kind ? 1 : 0;
  nz(sfxBus, t, .05, 'highpass', 3200 * v, .26, .0005, .028);                          // estalo: metal contra metal
  tone(sfxBus, t, 'square', 1500 * v, 700 * v, .03, .06, .0005, .022);                 // dente da trava
  tone(sfxBus, t + .012, 'sine', (p ? 170 : 215) * v, 70, .1, p ? .55 : .42, .001, .09);   // toc grave abafado
  tone(sfxBus, t + .03, 'triangle', 2300 * v, 0, .14, .03, .001, .11);                 // brilho metálico que se apaga
  if (p) { const t2 = t + .07; nz(sfxBus, t2, .04, 'highpass', 2600, .2, .0005, .022); tone(sfxBus, t2, 'sine', 140 * v, 60, .09, .4, .001, .08); }   // ferrolho fechando
}
function sfxHover() {   // passar o mouse: tique bem baixinho
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .002;
  nz(sfxBus, t, .02, 'highpass', 5000, .05, .0005, .012); tone(sfxBus, t, 'sine', 1900, 1500, .02, .02, .0005, .014);
}
/* sons das telas ARMAS e PERSONAGENS: tique ao rolar a barra, e a sequência de quando a peça escolhida aparece (luz, subida, encaixe, estatísticas) */
function sfxScroll(dir) {   // barra de seleção: tique de catraca (mais agudo ao avançar, mais grave ao voltar)
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .002, f = (dir > 0 ? 1 : .82) * (1 + (Math.random() - .5) * .05);
  nz(sfxBus, t, .03, 'highpass', 4200 * f, .16, .0005, .018);
  tone(sfxBus, t, 'square', 1250 * f, 800 * f, .03, .05, .0005, .022);
  tone(sfxBus, t + .008, 'sine', 330 * f, 190 * f, .07, .3, .001, .06);
}
function sfxPickBeam() {   // a luz cai sobre o retângulo escolhido: zumbido subindo com chiado
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .002;
  tone(sfxBus, t, 'sawtooth', 90, 340, .45, .05, .08, .4); tone(sfxBus, t, 'sine', 220, 880, .4, .07, .06, .34); nz(sfxBus, t, .4, 'bandpass', 900, .07, .06, .34, 3200);
}
function sfxPickRise(w) {   // a peça sobe do retângulo: arma = saque metálico; personagem = pancada surda com brilho
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .002;
  if (w) { sfxHolster(); nz(sfxBus, t + .05, .05, 'highpass', 3600, .18, .0005, .03); tone(sfxBus, t + .06, 'triangle', 2600, 0, .3, .05, .001, .26); }
  else { tone(sfxBus, t, 'sine', 170, 70, .16, .45, .002, .14); nz(sfxBus, t, .12, 'bandpass', 1800, .1, .002, .1, 600); tone(sfxBus, t + .03, 'triangle', 1900, 0, .2, .04, .001, .17); }
}
function sfxPickSettle() {   // a peça encaixa no lugar: baque suave e brilho que se apaga
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .002;
  tone(sfxBus, t, 'sine', 125, 55, .16, .4, .002, .14); nz(sfxBus, t, .05, 'lowpass', 900, .12, .001, .04);
  tone(sfxBus, t + .02, 'sine', 1760, 0, .3, .04, .002, .26); tone(sfxBus, t + .06, 'sine', 2349, 0, .28, .03, .002, .24);
}
function sfxPickPanel() {   // as estatísticas aparecem: dois tiques
  if (!ac || ac.state !== 'running') return; const t = ac.currentTime + .002;
  for (let i = 0; i < 2; i++) { nz(sfxBus, t + i * .07, .02, 'highpass', 5200, .08, .0005, .014); tone(sfxBus, t + i * .07, 'sine', 1300 + i * 380, 1000 + i * 380, .04, .06, .0005, .03); }
}
let HOVK = null, HOVF = false;
function hoverTick(key) { HOVF = true; if (HOVK !== key) { HOVK = key; if (UI_HOVER) sfxHover(); } }
function uiHit(b) { b.fn(); sfxClick(b.pri); }   // todo clique em botão/aba/item de menu passa por aqui (mouse e toque)

/* música: cada faixa é um conjunto de padrões de 16 passos tocados em loop (bpm, escala, bateria, baixo e melodia) */
const SC = { min: [0, 2, 3, 5, 7, 8, 10], phr: [0, 1, 3, 5, 7, 8, 10], hmin: [0, 2, 3, 5, 7, 8, 11], dor: [0, 2, 3, 5, 7, 9, 10], pdom: [0, 1, 4, 5, 7, 8, 10] };
const dn = (sc, d) => sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7), N = null;
const TRACKS = [
  { name: 'ASFALTO', bpm: 168, root: 33, sc: SC.min, prog: [0, 8, 10, 7], kick: 'x...x...x...x.x.', snare: '....x.......x...', hat: 'xXxXxXxXxXxXxXxo', bass: 'x.xxx.xxx.xxx.x.', bassWave: 'sawtooth', leadWave: 'sawtooth',
    lead: [[7, N, 7, 9, N, 11, 9, 7, N, 7, 9, 11, 12, 11, 9, N], [9, N, 9, 11, N, 12, 11, 9, N, 9, 11, 12, 14, 12, 11, 9]] },
  { name: 'SANGUE FRIO', bpm: 176, root: 40, sc: SC.phr, prog: [0, 1, 0, -2], kick: 'x..x..x.x..x..x.', snare: '....x..g....x..g', hat: 'x.x.xXx.x.x.xXxo', bass: 'xx.xx.xxxx.xx.xx', bassWave: 'square', leadWave: 'sawtooth',
    lead: [[12, N, N, 11, N, N, 8, N, 12, N, N, 11, N, 13, 12, N], [12, N, 11, N, 8, N, 7, N, 8, N, 11, N, 12, 13, 12, 11]] },
  { name: 'CORRIDA CEGA', bpm: 184, root: 38, sc: SC.hmin, prog: [0, 0, -2, -4], kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'XxxxXxxxXxxxXxxo', bass: 'xoxoxoxoxoxoxoxo', bassWave: 'square', leadWave: 'square',
    lead: [[0, 2, 4, 7, 4, 2, 0, 2, 0, 2, 4, 7, 9, 7, 4, 2], [0, 3, 5, 7, 5, 3, 0, 3, 2, 4, 6, 9, 6, 4, 2, 4]] },
  { name: 'ÚLTIMA RODADA', bpm: 160, root: 43, sc: SC.dor, prog: [0, 0, 5, 3], kick: 'x.x...x.x.x...x.', snare: '....x.......x..x', hat: 'x.x.x.x.x.x.x.xo', bass: 'x..x..x.x..x..x.', bassWave: 'sawtooth', leadWave: 'square',
    lead: [[N, N, 7, N, N, 7, N, 9, N, N, 7, N, 12, N, 11, N], [N, N, 9, N, N, 9, N, 11, N, N, 9, N, 14, N, 12, N]] },
  { name: 'ESTILHAÇO', bpm: 192, root: 36, sc: SC.pdom, prog: [0, 1, 0, 8], kick: 'x.xxx.x.x.xxx.x.', snare: '....x.......x..x', hat: 'XxxxXxxxXxxxXxxx', bass: 'xxxoxxxoxxxoxxxo', bassWave: 'sawtooth', leadWave: 'sawtooth',
    lead: [[12, 11, 9, 8, 7, 8, 9, 11, 12, 11, 9, 8, 7, 5, 4, 5], [14, 12, 11, 9, 8, 9, 11, 12, 14, 12, 11, 9, 8, 7, 8, 9]] },
];
// lobby: grave, lento e tenso (batida de coração, drone, notas sombrias da escala frígia e um acorde dissonante)
const LOBBY = { name: 'SALA DE ESPERA', bpm: 88, root: 33, sc: SC.phr, prog: [0, 0, 1, -1], kick: 'x.x.............', snare: '................', hat: 'x.......x.......', bass: 'x...............', bassLen: 15, bassCut: 380, bassWave: 'sawtooth',
  leadWave: 'triangle', leadLvl: .17, leadLen: 7, lo: 12, pad: true, padNotes: [0, 1, 6], padOct: 12, padLvl: .07, calm: true,
  lead: [[0, N, N, N, N, N, N, N, 1, N, N, N, N, N, N, N], [N, N, N, N, 3, N, N, N, N, N, N, N, 1, N, 0, N], [0, N, N, N, N, N, 4, N, N, N, N, N, 3, N, N, N], [N, N, N, N, 1, N, N, N, N, N, N, N, N, N, N, N]] };
function vKick(c, t) { tone(c.out, t, 'sine', 160, 42, .13, .95, .002, .24); }
function vSnare(c, t, gh) { const k = gh ? .35 : 1; nz(c.out, t, .3, 'bandpass', 1900, .55 * k, .002, .17); tone(c.out, t, 'triangle', 200, 0, .1, .35 * k, .002, .1); }
function vHat(c, t, open, acc) { nz(c.out, t, .35, 'highpass', 7500, acc ? .2 : .11, .001, open ? .16 : .04); }
function vBass(c, t, f, len, wave, cut) {
  const o = ac.createOscillator(), sub = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain(); o.type = wave; o.frequency.value = f; sub.type = 'sine'; sub.frequency.value = f;
  fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut || 1500, t); fl.frequency.exponentialRampToValueAtTime(260, t + len); env(g, t, .004, .34, len);
  o.connect(fl); sub.connect(fl); fl.connect(g); g.connect(c.out); o.start(t); sub.start(t); o.stop(t + len + .05); sub.stop(t + len + .05);
}
function vLead(c, t, f, len, wave, lvl) {
  const fl = ac.createBiquadFilter(), g = ac.createGain(); fl.type = 'lowpass'; fl.frequency.value = 3200; env(g, t, .004, lvl, len); fl.connect(g); g.connect(c.out);
  for (const dt of [-9, 9]) { const o = ac.createOscillator(); o.type = wave; o.frequency.value = f; o.detune.value = dt; o.connect(fl); o.start(t); o.stop(t + len + .05); }
}
function vPad(c, t, notes, len, lvl) {
  const fl = ac.createBiquadFilter(), g = ac.createGain(); fl.type = 'lowpass'; fl.frequency.value = 1100; fl.connect(g); g.connect(c.out);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(lvl || .05, t + .3); g.gain.linearRampToValueAtTime(.0001, t + len);
  for (const n of notes) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(n); o.connect(fl); o.start(t); o.stop(t + len + .05); }
}
function scheduleStep(c, step, t) {
  const tr = c.tr, s = step % 16, bar = Math.floor(step / 16), r = tr.prog[bar % 4], sd = 60 / tr.bpm / 4, fill = bar % 4 === 3 && s >= 12 && !tr.calm;
  if (tr.kick[s] === 'x' && !(fill && s >= 14)) vKick(c, t);
  if (tr.snare[s] === 'x' || fill) vSnare(c, t, false); else if (tr.snare[s] === 'g') vSnare(c, t, true);
  const h = tr.hat[s]; if (h !== '.') vHat(c, t, h === 'o', h === 'X');
  const b = tr.bass[s]; if (b !== '.') vBass(c, t, mtof(tr.root + r + (b === 'o' ? 12 : 0)), sd * (tr.bassLen || 1.7), tr.bassWave, tr.bassCut);
  const d = tr.lead[bar % tr.lead.length][s]; if (d != null && (bar % 8 !== 7 || tr.calm)) vLead(c, t, mtof(tr.root + r + (tr.lo || 24) + dn(tr.sc, d)), sd * (tr.leadLen || 1.3), tr.leadWave, tr.leadLvl || .1);
  if (tr.pad && s === 0) vPad(c, t, (tr.padNotes || [0, tr.sc[2], tr.sc[4]]).map(x => tr.root + (tr.padOct == null ? 24 : tr.padOct) + r + x), sd * 16, tr.padLvl);
}
function musicSwitch(w) {
  const now = ac.currentTime;
  if (mu.cur) { const old = mu.cur; old.out.gain.cancelScheduledValues(now); old.out.gain.setTargetAtTime(0, now, .12); clearInterval(old.timer); setTimeout(() => { try { old.out.disconnect(); } catch (e) {} }, 1500); mu.cur = null; }
  if (!w) return;
  const tr = w === 'lobby' ? LOBBY : TRACKS[+w.slice(1)], out = ac.createGain(); out.gain.value = .0001; out.connect(musicBus); out.gain.setTargetAtTime(1, now, .2);
  const c = { tr, out, step: 0, next: now + .1, timer: null };
  c.timer = setInterval(() => {
    if (ac.state !== 'running') { c.next = Math.max(c.next, ac.currentTime + .05); return; }
    while (c.next < ac.currentTime + .18) { scheduleStep(c, c.step, c.next); c.next += 60 / tr.bpm / 4; c.step++; }
  }, 30);
  mu.cur = c;
}
function pickTrack() { let k; do { k = Math.floor(Math.random() * TRACKS.length); } while (k === matchTrack && TRACKS.length > 1); return k; }
function updateMusic() {   // lobby e telas: música de lobby · partida: faixa da partida (abaixa o volume na pausa) · abertura: sem música
  if (!ac || ac.state !== 'running') return;
  const paused = state === 'pause' || (state === 'options' && optBack === 'pause'), inMatch = paused || state === 'play' || state === 'mend' || state === 'dead';
  const w = state === 'intro' ? null : inMatch ? 'm' + matchTrack : 'lobby';
  if (w !== mu.want) { mu.want = w; musicSwitch(w); }
  const dk = paused ? .35 : 1; if (dk !== mu.duck) { mu.duck = dk; applyVolumes(); }
}

const moveHint = () => keyName(KEYS.up) + keyName(KEYS.left) + keyName(KEYS.down) + keyName(KEYS.right);   // M = partida em andamento (rodadas, placar, relógio); introT = relógio da abertura
try { cfg.char = Math.min(+localStorage.getItem('wc_char') || 0, 7); chIdx = cfg.char; } catch (e) {}
try { Object.assign(cfg, JSON.parse(localStorage.getItem('oc_cfg') || '{}')); } catch (e) {}
cfg.bots = clamp(+cfg.bots || 4, 1, 8); cfg.diff = clamp(+cfg.diff || 0, 0, 2); cfg.mode = cfg.mode ? 1 : 0;
cfg.pts = clamp(+cfg.pts || 0, 0, PTS.length - 1); cfg.time = clamp(+cfg.time || 0, 0, TIMES.length - 1); cfg.loot = clamp(+cfg.loot || 0, 0, LOOTS.length - 1);
cfg.musicVol = clamp(isFinite(cfg.musicVol) ? Math.round(cfg.musicVol) : 7, 0, 10); cfg.sfxVol = clamp(isFinite(cfg.sfxVol) ? Math.round(cfg.sfxVol) : 8, 0, 10); cfg.music = clamp(isFinite(cfg.music) ? Math.round(cfg.music) : 0, 0, 5); cfg.char = clamp(cfg.char, 0, 7); cfg.map = clamp(isFinite(cfg.map) ? Math.round(cfg.map) : 3, 0, 3);   // map: 0-2 = mapa fixo, 3 = aleatório
cfg.team = clamp(+cfg.team || 0, 0, 4);   // 0 = sala personalizada (todos contra todos); 1..4 = 1v1..4v4 (times)
const nBots = () => cfg.team > 0 ? cfg.team * 2 - 1 : cfg.bots + (NET.online ? NET.guests.length : 0);   // 1v1: 1 bot | 2v2: 3 bots | 3v3: 5 | 4v4: 7
let bgSetup = false, TUT = null, botsSetup = false, nameFocus = false, nameErr = false;   // bgSetup = tela de configuração do CAMPO DE BATALHA | TUT = tutorial em andamento
let soloSetup = false;   // true = a tela de configuração é a do SOLITÁRIO (só mapa e armas)
const saveCfg = () => { try { localStorage.setItem('oc_cfg', JSON.stringify(cfg)); } catch (e) {} };
const VIEW_W = 1200, VIEW_H = 675;   // área do mapa que TODO jogador de PC enxerga (em unidades), em qualquer tamanho de tela
let ZOOM = 1.4;              // zoom do mapa/personagens (PC: calculado para a visão ser igual; celular: se adapta à altura da tela)
const TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const touch = { move: { id: null, ox: 0, oy: 0, x: 0, y: 0, dx: 0, dy: 0 }, aim: { id: null, ox: 0, oy: 0, x: 0, y: 0 }, ang: 0, btn: {} };
const uiScale = () => clamp(Math.min(innerHeight / 640, innerWidth / 560), .5, 1);   // menus se encolhem em telas pequenas
let VW = 0, VH = 0, WW = 0, WH = 0, logScroll = 0;   // tamanho do mundo (em unidades) e arma selecionada na tela de info
let player, bots = [], bullets = [], pickups = [], decals = [], casings = [], crates = [];
let puddles = [], prints = [];   // poças de sangue acumulado e pegadas (sangue / água)
const pools = new Map();         // poças de água do mapa (registradas pelo desenho do cenário)
let trail = [], rings = [], sparks = [], thrown = [], btrails = [], btClock = 0;   // btrails: rastros das balas (somem aos poucos)
let shake = 0, hitStop = 0, dmgFlash = 0, kills = 0, pickupTimer = 8, showHit = false, menuT = 0;
let ui = [], vignette, scan, fog;
let cmbN = 0, cmbT = 0, cmbPop = 0, cmbAge = 0, killT = -1;   // combo de acertos (branco) e animação de abate (vermelho)
const KILL_DUR = 1.8;
const BTRAIL_LIFE = .45;   // tempo (s) que cada ponto do rastro da bala leva para sumir
const MAPK = 2.2, cam = { x: 0, y: 0 };   // mapa = MAPK x a área visível; cam = canto superior esquerdo da câmera (em unidades do mundo)
const input = { keys: {}, mx: 0, my: 0, down: false, buffer: 0, reloadReq: false, interact: false, throwReq: false, coverReq: false, slideReq: false, holsterReq: false, peek: false };
const CHARS = [
  { id: 'detetive', name: 'DETETIVE', alias: 'O HOMEM DO CIGARRO', spr: true, skin: '#e8b48a', skinD: '#b07e58', jacket: '#26262e', jDark: '#0b0b10', stripe: '#26262e', hair: '#14141a', accent: '#e8a33d', glove: '#14141a', head: 'fedora', pads: null,
    style: 'ATIRADOR CALCULISTA', st: { spd: 5, agi: 6, hp: 5, tgh: 5, str: 4, aim: 8, rel: 7 },
    bio: 'Trabalha sozinho, de capa e chapéu, com um cigarro sempre aceso e a pistola sempre carregada. Fala pouco, observa tudo e só puxa o gatilho depois de ter certeza. Quando a cidade vira um caso sem solução, é para ele que ligam.' },
];
if (!(cfg.char >= 0 && cfg.char < CHARS.length)) cfg.char = 0;   // config antiga com personagem que não existe mais
/* ATRIBUTOS DOS PERSONAGENS: cada personagem tem uma nota de 1 a 10 em cada atributo (st). A MESMA tabela vale para o jogo (m = multiplicador)
   e para a tela PERSONAGENS (barra = nota, texto = efeito real). Nota 5 = igual ao padrão. */
const sgn = v => (v < 0 ? '-' : '+') + Math.abs(Math.round(v * 100)) + '%';
const CSTATS = [
  { k: 'spd', label: 'VELOCIDADE',  m: r => 1 + (r - 5) * .05, txt: m => Math.round(C.moveSpeed * m) + ' px/s' },
  { k: 'agi', label: 'AGILIDADE',   m: r => 1 + (r - 5) * .08, txt: m => sgn(m - 1) + ' resposta' },   // arranque e freada
  { k: 'hp',  label: 'VIDA',        m: r => 1 + (r - 5) * .05, txt: m => Math.round(100 * m) + ' HP' },
  { k: 'tgh', label: 'RESISTÊNCIA', m: r => 1 - (r - 5) * .07, txt: m => (C.throwStun * m).toFixed(1) + 's nocaute' },   // menos tempo caído e menos empurrão
  { k: 'str', label: 'FORÇA',       m: r => 1 + (r - 5) * .05, txt: m => Math.round(C.punchDamage * m) + ' por soco' },
  { k: 'aim', label: 'CONTROLE',    m: r => 1 - (r - 5) * .06, txt: m => sgn(m - 1) + ' dispersão' },   // mira firme = tiro mais certeiro
  { k: 'rel', label: 'RECARGA',     m: r => 1 - (r - 5) * .06, txt: m => sgn(m - 1) + ' tempo' },
];
function applyChar(f) {   // aplica os atributos do personagem (f.pal.st) no lutador recém-criado
  const st = f.pal && f.pal.st; if (!st) return;
  const m = k => CSTATS.find(q => q.k === k).m(st[k]);
  f.speed = Math.round(f.speed * m('spd')); f.maxHp = Math.round(f.maxHp * m('hp')); f.hp = f.maxHp; f.punchDmg *= m('str');
  f.mAgi = m('agi'); f.mAim = m('aim'); f.mRel = m('rel'); f.mTgh = m('tgh');
}

