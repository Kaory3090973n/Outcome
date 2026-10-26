/* ------------------------------ INPUT --------------------------------- */
addEventListener('keydown', e => {
  if (bindCapture) {   // OPÇÕES: esperando a nova tecla (Esc cancela)
    e.preventDefault(); if (e.code !== 'Escape') setKey(bindCapture, e.code); bindCapture = null; return;
  }
  if (state === 'setup' && nameFocus) {   // digitando o nome da sala
    cfg.roomName = cfg.roomName || '';
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { nameErr = false; if (cfg.roomName.length < 16) cfg.roomName += e.key; e.preventDefault(); return; }
    if (e.code === 'Backspace') { cfg.roomName = cfg.roomName.slice(0, -1); e.preventDefault(); return; }
  }
  input.keys[e.code] = true;
  if (e.code === KEYS.hit) showHit = !showHit;
  if (e.code === KEYS.reload) input.reloadReq = true;
  if (e.code === KEYS.interact) input.interact = true;
  if (e.code === KEYS.cover) input.coverReq = true;
  if (e.code === KEYS.slide && !e.repeat && state === 'play') input.slideReq = true;   // deslize tático
  if (e.code === KEYS.holster && !e.repeat && state === 'play') input.holsterReq = true;   // sacar / guardar a arma
  if (e.code === KEYS.throw) input.throwReq = true;
  if (state === 'intro') { introClick(); return; }
  if (state === 'room' || state === 'join') {   // sala online / digitar código
    if (e.code === 'Escape') { if (state === 'room') leaveRoom(); else { netReset(); setState('modes'); } return; }
    if (state === 'join') { const d = /^(Digit|Numpad)\d$/.test(e.code) ? e.code.slice(-1) : ''; if (d) addDigit(d); else if (e.code === 'Backspace') JOIN = JOIN.slice(0, -1); else if (e.code === 'Enter' || e.code === 'NumpadEnter') doJoin(); }
    return;
  }
  if (e.code === 'Enter' && state === 'play' && TUT) tutSkip();   // pula o passo do tutorial
  if (e.code === 'Escape') { if (state === 'play') setState('pause'); else if (state === 'pause') setState('play'); else if (state === 'options') setState(optBack); else if (state !== 'menu') setState('menu'); }   // Esc: pausa / continua / volta
  if (e.code === 'Enter') { if (state === 'menu') setState('modes'); else if (state === 'maps') { saveCfg(); setState('setup'); } else if (state === 'setup') startSetup(); else if (state === 'mend') startMatch(); else if (state === 'dead') startGame(training); else if (state === 'tutend') setState('modes'); }
  if (state === 'log') { if (e.code === 'ArrowDown' || e.code === 'PageDown') logScroll += 70; if (e.code === 'ArrowUp' || e.code === 'PageUp') logScroll -= 70; }
  if (state === 'options') { if (e.code === 'ArrowDown' || e.code === 'PageDown') optScroll += 70; if (e.code === 'ArrowUp' || e.code === 'PageUp') optScroll -= 70; }
  if (state === 'info' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) INFO.idx += e.code === 'ArrowRight' ? 1 : -1;
  if (state === 'maps' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) { const n = MAPS.length + 1; cfg.map = (cfg.map + (e.code === 'ArrowRight' ? 1 : n - 1)) % n; saveCfg(); }
  if (state === 'chars' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) CHP.idx += e.code === 'ArrowRight' ? 1 : -1;
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
addEventListener('keyup', e => input.keys[e.code] = false);
canvas.addEventListener('mousemove', e => { input.mx = e.clientX; input.my = e.clientY; });
canvas.addEventListener('mousedown', e => {
  if (state === 'intro') { introClick(); return; }
  if (e.button === 2 && state === 'play') { if (player && player.cover) input.peek = true; else input.throwReq = true; return; }   // botão direito = arremessar a arma
  if (e.button !== 0) return;
  if (state === 'play' && TUT && tutHit(e.clientX, e.clientY)) return;
  if (state === 'play') { input.down = true; input.buffer = .15; }
  else { bindCapture = null; nameFocus = false; for (const b of ui) if (input.mx > b.x && input.mx < b.x + b.w && input.my > b.y && input.my < b.y + b.h) { uiHit(b); break; } }
});
addEventListener('mouseup', e => { if (e.button === 0) input.down = false; if (e.button === 2) input.peek = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
let wheelAcc = 0;
canvas.addEventListener('wheel', e => {
  if (state === 'log') { logScroll += e.deltaY; e.preventDefault(); }
  else if (state === 'options') { optScroll += e.deltaY; e.preventDefault(); }
  else if (state === 'info' || state === 'chars') {   // rolar o mouse nas telas ARMAS e PERSONAGENS troca o item (clicar nas abas e as setas também funcionam)
    e.preventDefault(); wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) >= 40) {
      const n = state === 'info' ? WKEYS.length : CHARS.length, d = wheelAcc > 0 ? 1 : n - 1;
      (state === 'info' ? INFO : CHP).idx += wheelAcc > 0 ? 1 : -1;
      wheelAcc = 0;
    }
  }
}, { passive: false });

/* ------------------------------ TOUCH (celular) ----------------------- */
function resetTouch() { touch.move.id = touch.aim.id = null; touch.move.dx = touch.move.dy = 0; touch.btn = {}; input.down = false; }
function touchLayout() {
  const W = innerWidth, H = innerHeight, s = clamp(Math.min(W, H) / 420, .8, 1.2);
  const btns = ['E', 'R', 'G', 'Q', 'C', 'M', 'S'].map((k, i) => ({ k, x: W / 2 + (i - 3) * 70 * s, y: H - 46 * s, r: 30 * s }));
  btns.push({ k: 'II', x: W - 34 * s, y: 34 * s, r: 22 * s });
  return { s, btns, stick: 62 * s };
}
function clickUI(x, y) { for (const b of ui) if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) { uiHit(b); break; } }
function onTouchStart(t) {
  if (state === 'intro') { introClick(); return; }
  input.mx = t.clientX; input.my = t.clientY;
  if (state !== 'play') { touch.drag = t.identifier; touch.lastY = t.clientY; bindCapture = null; nameFocus = false; clickUI(t.clientX, t.clientY); return; }
  if (TUT && tutHit(t.clientX, t.clientY)) return;
  const L = touchLayout();
  for (const b of L.btns) if (Math.hypot(t.clientX - b.x, t.clientY - b.y) < b.r + 8) {
    touch.btn[t.identifier] = b.k;
    if (b.k === 'E') input.interact = true; else if (b.k === 'R') input.reloadReq = true; else if (b.k === 'G') input.throwReq = true; else if (b.k === 'Q') input.holsterReq = true; else if (b.k === 'C') input.coverReq = true; else if (b.k === 'S') input.slideReq = true; else if (b.k === 'II') setState('pause');
    return;
  }
  if (t.clientX < innerWidth * .5) {
    if (touch.move.id === null) Object.assign(touch.move, { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY, dx: 0, dy: 0 });
  } else if (touch.aim.id === null) {
    Object.assign(touch.aim, { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY });
    input.down = true; input.buffer = .15;   // com arma: segura e atira | sem arma: este toque é o soco
  }
}
function onTouchMove(t) {
  if (state === 'log' && t.identifier === touch.drag) { logScroll -= (t.clientY - touch.lastY) / uiScale(); touch.lastY = t.clientY; return; }
  if (state === 'options' && t.identifier === touch.drag) { optScroll -= (t.clientY - touch.lastY) / uiScale(); touch.lastY = t.clientY; return; }
  if (t.identifier === touch.move.id) {
    const m = touch.move, R = touchLayout().stick; let dx = t.clientX - m.ox, dy = t.clientY - m.oy; const d = Math.hypot(dx, dy);
    if (d > R) { m.ox += dx / d * (d - R); m.oy += dy / d * (d - R); dx = t.clientX - m.ox; dy = t.clientY - m.oy; }   // base segue o dedo
    m.x = t.clientX; m.y = t.clientY; m.dx = dx / R; m.dy = dy / R;
    const l = Math.hypot(m.dx, m.dy); if (l < .15) m.dx = m.dy = 0;
  } else if (t.identifier === touch.aim.id) {
    const a = touch.aim, R = touchLayout().stick; let dx = t.clientX - a.ox, dy = t.clientY - a.oy; const d = Math.hypot(dx, dy);
    if (d > R) { a.ox += dx / d * (d - R); a.oy += dy / d * (d - R); dx = t.clientX - a.ox; dy = t.clientY - a.oy; }
    a.x = t.clientX; a.y = t.clientY;
    if (Math.hypot(dx, dy) > 10) touch.ang = Math.atan2(dy, dx);
  }
}
function onTouchEnd(t) {
  if (t.identifier === touch.move.id) { touch.move.id = null; touch.move.dx = touch.move.dy = 0; }
  if (t.identifier === touch.aim.id) { touch.aim.id = null; input.down = false; }
  delete touch.btn[t.identifier];
}
let fsTried = false;
function tryFullscreen() {
  if (fsTried) return; fsTried = true;
  try { const r = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen; if (r) { const p = r.call(document.documentElement); if (p && p.catch) p.catch(() => {}); } } catch (e) {}
  try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
}
canvas.addEventListener('touchstart', e => { e.preventDefault(); if (state === 'play') tryFullscreen(); for (const t of e.changedTouches) onTouchStart(t); }, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) onTouchMove(t); }, { passive: false });
const tEnd = e => { e.preventDefault(); for (const t of e.changedTouches) onTouchEnd(t); };
canvas.addEventListener('touchend', tEnd, { passive: false }); canvas.addEventListener('touchcancel', tEnd, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());

function drawTouch() {
  const L = touchLayout(), s = L.s;
  const stick = (st, col, label) => {
    const R = L.stick;
    ctx.globalAlpha = st.id !== null ? .55 : .22;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(st.id !== null ? st.ox : label.x, st.id !== null ? st.oy : label.y, R, 0, TAU); ctx.fill();
    ctx.globalAlpha = st.id !== null ? .9 : .35; ctx.fillStyle = col; ctx.beginPath();
    ctx.arc(st.id !== null ? st.x : label.x, st.id !== null ? st.y : label.y, R * .42, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  };
  stick(touch.move, '#00e5ff', { x: 110 * s + 20, y: innerHeight - 110 * s });
  stick(touch.aim, '#ff2d95', { x: innerWidth - 110 * s - 20, y: innerHeight - 110 * s });
  for (const b of L.btns) {
    const down = Object.values(touch.btn).includes(b.k), glow = b.k === 'E' && player.near;
    ctx.globalAlpha = down ? .85 : .5; ctx.fillStyle = glow ? '#39ff88' : 'rgba(10,5,20,.85)';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = glow ? '#39ff88' : '#fff'; ctx.stroke(); ctx.globalAlpha = 1;
    txt(b.k, b.x, b.y + 1, b.r * .75, glow ? '#0d0a14' : '#fff', 'center');
  }
}

addEventListener('blur', () => { input.keys = {}; input.down = false; resetTouch(); });

let _fa = [], _fp = null, _fb = null, _fl = -1;
function allF() { if (_fp !== player || _fb !== bots || _fl !== bots.length) { _fp = player; _fb = bots; _fl = bots.length; _fa = [player, ...bots]; } return _fa; }
function applyRes() { canvas.width = innerWidth * RES; canvas.height = innerHeight * RES; ctx.setTransform(RES, 0, 0, RES, 0, 0); }
function resize() {
  const d = RES;
  canvas.width = innerWidth * d; canvas.height = innerHeight * d;
  canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';   // sem isso, telas de alta densidade (celular) ampliam e cortam o jogo
  ctx.setTransform(d, 0, 0, d, 0, 0);
  vignette = ctx.createRadialGradient(innerWidth/2, innerHeight/2, innerHeight*.25, innerWidth/2, innerHeight/2, Math.max(innerWidth, innerHeight)*.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(5,5,10,.4)');
  const s = document.createElement('canvas'); s.width = 4; s.height = 4;
  const g = s.getContext('2d'); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 0, 4, 1);
  scan = ctx.createPattern(s, 'repeat');
  ZOOM = TOUCH ? clamp(innerHeight / 380, 1, 1.6) : clamp(Math.max(innerWidth / VIEW_W, innerHeight / VIEW_H), .3, 5);   // PC: mesma área visível em telas pequenas e grandes
  const fogIn = TOUCH ? Math.min(innerWidth, innerHeight) * .28 : VIEW_H * ZOOM * .28, fogOut = TOUCH ? Math.max(innerWidth, innerHeight) * .55 : VIEW_W * ZOOM * .55;   // o campo de visão também acompanha a área fixa
  fog = ctx.createRadialGradient(0, 0, fogIn, 0, 0, fogOut);   // campo de visão limitado ao redor do personagem
  fog.addColorStop(0, 'rgba(4,4,8,0)'); fog.addColorStop(1, 'rgba(4,4,8,.88)');
  VW = innerWidth / ZOOM; VH = innerHeight / ZOOM; WW = TOUCH ? VW * MAPK : VIEW_W * MAPK; WH = TOUCH ? VH * MAPK : VIEW_H * MAPK; if (NET.world) { WW = NET.world.w; WH = NET.world.h; }
  buildCrates();
}
let curMap = null;   // mapa da partida em andamento (null = layout original do treinamento)
function buildCrates() {
  const W = WW, H = WH;
  if (!curMap) {   // layout original: [x%, y%, w, h] com w/h relativos à menor dimensão
    const m = TOUCH ? Math.min(VW, VH) : VIEW_H;
    crates = [[.2,.24,.14,.09],[.68,.2,.2,.08],[.46,.48,.1,.1],[.14,.68,.2,.08],[.74,.64,.08,.2],[.4,.8,.12,.07],[.1,.08,.1,.07],[.3,.46,.07,.12],[.56,.1,.12,.06],[.86,.42,.07,.14],[.9,.84,.08,.1],[.28,.9,.14,.06],[.62,.74,.1,.08],[.08,.46,.08,.1],[.52,.3,.08,.08],[.8,.1,.06,.12]]
      .map(([a, b, c, d]) => ({ x: a * W, y: b * H, w: c * m, h: d * m, k: 'box', v: 0, seed: 0 }));
    return;
  }
  // mapas novos: [x, y, w, h, tipo, variação] tudo em fração da largura/altura do mundo
  glassShards = [];
  crates = curMap.L.map(([a, b, c, d, k, v], i) => ({ x: a * W, y: b * H, w: c * W, h: d * H, k, v: v || 0, seed: i + 1, hp: k === 'glass' ? 2 : 0 }));
}
addEventListener('resize', resize); resize();

