/* ------------------------------ TUTORIAL -------------------------------- */
/* Passo a passo no mapa DOCAS. Cada passo ensina uma ação do personagem e só avança quando o jogador a faz. ENTER (ou o botão PULAR) pula o passo. */
const tk = id => keyName(KEYS[id]);
function tutSpot(r, a0) {
  for (let i = 0; i < 24; i++) { const a = a0 + i * .52, x = player.x + Math.cos(a) * r, y = player.y + Math.sin(a) * r; if (x > 60 && y > 60 && x < WW - 60 && y < WH - 60 && !inCrate(x, y, 36)) return { x, y }; }
  return freeSpot(r * .6, player);
}
function tutDummy() {   // boneco de treino: parado, olha para o jogador e nunca morre
  const T = TUT; if (T.dummy && !T.dummy.dead) { if (Math.hypot(T.dummy.x - player.x, T.dummy.y - player.y) > 520) Object.assign(T.dummy, tutSpot(280, player.angle)); return; }
  const b = { pal: CHARS[(cfg.char + 1) % CHARS.length], pid: 1, team: 1 }; spawnBot(b); Object.assign(b, tutSpot(230, player.angle)); b.dummy = true; bots.push(b); T.dummy = b;
}
function tutGun() { if (!player.weapon) { const w = WEAPONS.glock; pickups.length = 0; giveWeapon(player, 'glock', w.mag, w.reserve); } }
function tutWall() {   // ponto da parede mais próxima
  let best = null, bd = 1e9; for (const c of crates) { const x = clamp(player.x, c.x, c.x + c.w), y = clamp(player.y, c.y, c.y + c.h), d = Math.hypot(x - player.x, y - player.y); if (d < bd) { bd = d; best = { x, y, label: 'PAREDE' }; } }
  return best;
}
const tutNearPk = () => { let b = null, bd = 1e9; for (const p of pickups) { const d = Math.hypot(p.x - player.x, p.y - player.y); if (d < bd) { bd = d; b = { x: p.x, y: p.y, label: 'ARMA' }; } } return b; };
const tutDum = T => T.dummy && !T.dummy.dead ? { x: T.dummy.x, y: T.dummy.y, label: 'ALVO' } : null;
const TUT_STEPS = [
  { t: 'MOVER', goal: 420, ok: 'ÓTIMO! É assim que você anda.', val: c => c.dist,
    tx: () => TOUCH ? 'Arraste o dedo no lado ESQUERDO da tela (joystick azul) para andar pelo mapa.' : `Ande pelo mapa com ${tk('up')} ${tk('left')} ${tk('down')} ${tk('right')} ou com as setas do teclado.` },
  { t: 'MIRAR', goal: 5, ok: 'ISSO! O personagem sempre olha para a mira.', val: c => c.turn,
    tx: () => TOUCH ? 'Arraste o dedo no lado DIREITO (joystick rosa): o personagem olha para onde você arrasta. Gire em volta de si.' : 'Mexa o mouse: o personagem olha para a mira (a cruz na tela). Gire a mira ao redor dele.' },
  { t: 'SOCAR', goal: 3, count: 1, ok: 'BOA! No 3º soco seguido o golpe é FORTE.', val: c => c.hitP, setup: tutDummy, mark: tutDum,
    tx: () => (TOUCH ? 'Chegue perto do boneco marcado e toque no lado direito da tela' : 'Chegue perto do boneco marcado e clique com o botão esquerdo') + ' para socar. Acerte 3 socos seguidos: o 3º é o mais forte.' },
  { t: 'PEGAR ARMA', goal: 1, ok: 'ARMADO! A munição aparece no canto inferior direito.', val: () => player.weapon ? 1 : 0, setup: () => { pickups.length = 0; const p = tutSpot(150, player.angle + 1.2), w = WEAPONS.glock; pickups.push({ x: p.x, y: p.y, key: 'glock', mag: w.mag, reserve: w.reserve, t: 0 }); }, mark: tutNearPk,
    tx: () => `Vá até a arma marcada no chão e ${TOUCH ? 'toque no botão E' : 'aperte ' + tk('interact')} para pegar.` },
  { t: 'ATIRAR', goal: 3, count: 1, ok: 'TIROS CERTEIROS!', val: c => c.hitS, setup: () => { tutGun(); tutDummy(); }, mark: tutDum,
    tx: () => `Mire no boneco e ${TOUCH ? 'segure o toque no lado direito' : 'clique (segure para atirar sem parar)'}. Acerte 3 tiros.` },
  { t: 'RECARREGAR', goal: 1, ok: 'RECARREGADO! O anel amarelo na mira mostra o tempo.', val: c => c.rel, setup: () => { tutGun(); player.mag = Math.min(player.mag, 4); },
    tx: () => `Pente quase vazio! ${TOUCH ? 'Toque em R' : 'Aperte ' + tk('reload')} para recarregar. Enquanto recarrega você não consegue atirar.` },
  { t: 'ARREMESSAR', goal: 1, ok: 'NOCAUTE! Quem leva a arma na cara cai por alguns segundos.', val: c => c.thrHit, setup: () => { tutGun(); tutDummy(); }, mark: T => player.weapon ? tutDum(T) : tutNearPk(),
    tx: () => `${TOUCH ? 'Toque em G' : 'Aperte ' + tk('throw') + ' ou o botão DIREITO do mouse'} para arremessar a arma girando. Acerte o boneco! Errou? Pegue a arma de volta (${tk('interact')}) e tente de novo.` },
  { t: 'COBERTURA', goal: 1, ok: 'EM COBERTURA! Seu corpo fica menor e mais difícil de acertar.', val: c => c.cover, setup: () => tutGun(), mark: tutWall,
    tx: () => `Chegue bem perto de um contêiner ou caixote e ${TOUCH ? 'toque em C' : 'aperte ' + tk('cover')} para se encostar na parede. Mova-se ao longo dela; afastar-se sai da cobertura.` },
  { t: 'ESPIAR E ATIRAR', goal: 1, ok: 'PERFEITO! Espiar dá tiro 100% preciso, mas você fica exposto.', val: c => c.peek, setup: () => { tutGun(); tutDummy(); }, mark: tutDum,
    tx: () => `Em cobertura, o clique atira às cegas (impreciso). ${TOUCH ? 'Segure o botão M' : 'Segure o botão DIREITO do mouse'} para espiar e atire no boneco. Se não houver ângulo, chegue mais perto da quina.` },
  { t: 'DERROTE O BOT', goal: 1, ok: 'VITÓRIA!', val: (c, T) => T.boss && T.boss.dead ? 1 : 0, mark: T => T.boss && !T.boss.dead ? { x: T.boss.x, y: T.boss.y, label: 'BOT' } : null,
    setup: T => { tutGun(); bots = bots.filter(b => false); T.dummy = null; const b = { pal: CHARS[(cfg.char + 2) % CHARS.length], pid: 1, team: 1 }; spawnBot(b); bots.push(b); T.boss = b; for (let i = 0; i < 3; i++) { const k = WKEYS[Math.random() * WKEYS.length | 0], p = freeSpot(), w = WEAPONS[k]; pickups.push({ x: p.x, y: p.y, key: k, mag: w.mag, reserve: w.reserve, t: rnd(0, 6) }); } },
    tx: () => 'Prova final: use tudo o que aprendeu e derrube o bot (nível FÁCIL). Se a sua vida zerar, ela enche de novo: no tutorial você não morre.' },
];
function startTutorial() {
  soloSetup = false; bgSetup = false;
  const sm = cfg.map, sd = TUT ? TUT.diff : cfg.diff; cfg.map = 0; cfg.diff = 0; startGame(true); cfg.map = sm;   // mapa DOCAS, bots no nível fácil
  pickups.length = 0; pickupTimer = 1e9;
  TUT = { i: 0, t: 0, ok: false, okT: 0, fin: false, dummy: null, boss: null, diff: sd, heal: 0, skip: null, px: player.x, py: player.y, pa: player.angle, wasCover: false, prl: 0,
    c: { dist: 0, turn: 0, hitP: 0, hitS: 0, shots: 0, peek: 0, thr: 0, thrHit: 0, rel: 0, cover: 0 } };
  TUT.b = { ...TUT.c };
}
function tutEnd() { if (TUT) { cfg.diff = TUT.diff; TUT = null; } }
function tutNext() {
  const T = TUT; T.i++; T.ok = false; T.t = 0;
  if (T.i >= TUT_STEPS.length) { T.fin = true; sfxHorn(); setState('tutend'); return; }
  T.b = { ...T.c }; const s = TUT_STEPS[T.i]; if (s.setup) s.setup(T);
}
function tutSkip() { if (TUT && !TUT.fin) tutNext(); }
function tutHit(x, y) { const r = TUT && TUT.skip; if (r && x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) { tutSkip(); return true; } return false; }
function tutDamage(t, dmg, src) {
  const T = TUT;
  if (t.dummy) { if (src && src.isPlayer) { if (player.weapon) T.c.hitS++; else T.c.hitP++; } if (t.hp - dmg <= 5) t.hp = t.maxHp + dmg; }   // boneco nunca cai
  else if (t.isPlayer && t.hp - dmg <= 1) { t.hp = t.maxHp + dmg; T.heal = 3; }   // jogador nunca morre
}
function tutUpdate(dt) {
  const T = TUT; if (!T || T.fin) return; const c = T.c; T.t += dt; T.heal = Math.max(0, T.heal - dt);
  c.dist += Math.hypot(player.x - T.px, player.y - T.py); T.px = player.x; T.py = player.y;
  c.turn += Math.abs(angDiff(player.angle, T.pa)); T.pa = player.angle;
  if (player.cover && !T.wasCover) c.cover++; T.wasCover = !!player.cover;
  if (T.prl > 0 && player.reloadT <= 0 && player.weapon) c.rel++; T.prl = player.reloadT;
  if (T.ok) { T.okT += dt; if (T.okT > 1.4) tutNext(); return; }
  const s = TUT_STEPS[T.i], b = T.b, v = s.val(Object.fromEntries(Object.keys(c).map(k => [k, c[k] - b[k]])), T);
  if (v >= s.goal) { T.ok = true; T.okT = 0; sfxBeep(880, .12); }
}
function tutMark(wx, wy, label, W, H) {
  const sx = (wx - cam.x) * ZOOM, sy = (wy - cam.y) * ZOOM, t = menuT, Y = '#ffd23f';
  if (sx > 30 && sx < W - 30 && sy > 30 && sy < H - 30) {
    const r = 34 + Math.sin(t * 5) * 4; ctx.strokeStyle = Y; ctx.fillStyle = Y; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 30; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    const ay = sy - r - 14 - Math.abs(Math.sin(t * 4)) * 6; ctx.beginPath(); ctx.moveTo(sx, ay + 10); ctx.lineTo(sx - 8, ay - 4); ctx.lineTo(sx + 8, ay - 4); ctx.closePath(); ctx.fill();
    if (label) txt(label, sx, ay - 16, 12, Y, 'center');
  } else {
    const a = Math.atan2(sy - H / 2, sx - W / 2), ex = clamp(sx, 30, W - 30), ey = clamp(sy, 30, H - 30);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = Y; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-9, -10); ctx.lineTo(-9, 10); ctx.closePath(); ctx.fill(); ctx.restore();
    if (label) txt(label, ex - Math.cos(a) * 34, ey - Math.sin(a) * 34, 11, Y, 'center');
  }
}
function drawTutorial() {
  const T = TUT, W = innerWidth, H = innerHeight, s = TUT_STEPS[T.i]; if (!s || T.fin) return;
  const INK = '#e7e4d3', GRN = '#8fd6a4', c = T.c, b = T.b, v = Math.min(s.goal, s.val(Object.fromEntries(Object.keys(c).map(k => [k, c[k] - b[k]])), T));
  if (!T.ok) { const m = s.mark && s.mark(T); if (m) tutMark(m.x, m.y, m.label, W, H); }
  const pw = Math.min(560, W - 24), px = (W - pw) / 2, py = W >= 900 ? 12 : 96, lines = wrapLines(T.ok ? s.ok : s.tx(), pw - 36, 13), ph = 100 + lines.length * 18;
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 16); ctx.fillStyle = 'rgba(8,8,12,.78)'; ctx.fill(); ctx.strokeStyle = T.ok ? GRN : 'rgba(231,228,211,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
  txt(`TUTORIAL · PASSO ${T.i + 1}/${TUT_STEPS.length}`, px + 18, py + 22, 11, '#8a8a96', 'left');
  const sk = { x: px + pw - 112, y: py + 8, w: 98, h: 26 }; T.skip = sk; const hv = input.mx > sk.x && input.mx < sk.x + sk.w && input.my > sk.y && input.my < sk.y + sk.h;
  ctx.beginPath(); ctx.roundRect(sk.x, sk.y, sk.w, sk.h, 13); ctx.fillStyle = hv ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.05)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.stroke();
  txt(TOUCH ? 'PULAR' : 'PULAR [ENTER]', sk.x + sk.w / 2, sk.y + 14, 10, INK, 'center');
  txt(s.t, px + 18, py + 52, 22, T.ok ? GRN : INK, 'left');
  lines.forEach((l, i) => txt(l, px + 18, py + 78 + i * 18, 13, T.ok ? GRN : 'rgba(231,228,211,.9)', 'left'));
  const by = py + ph - 20, bw = pw - 36 - (s.count ? 50 : 0), f = T.ok ? 1 : v / s.goal;
  ctx.beginPath(); ctx.roundRect(px + 18, by, bw, 8, 4); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill();
  if (f > 0) { ctx.beginPath(); ctx.roundRect(px + 18, by, Math.max(8, bw * f), 8, 4); ctx.fillStyle = T.ok ? GRN : '#ffd23f'; ctx.fill(); }
  if (s.count) txt(`${Math.min(v, s.goal)}/${s.goal}`, px + pw - 18, by + 4, 13, INK, 'right');
  if (T.heal > 0) txt('SUA VIDA ENCHEU DE NOVO · NO TUTORIAL VOCÊ NÃO MORRE', W / 2, H - 150, 13, '#ffd23f', 'center');
}
function drawTutEnd() {
  const ms = clamp(innerHeight / 560, .55, 1), IW = innerWidth / ms, IH = innerHeight / ms, cx = IW / 2, INK = '#e7e4d3', MUTE = '#8a8a96';
  ctx.fillStyle = 'rgba(8,8,12,.85)'; ctx.fillRect(0, 0, innerWidth, innerHeight); ctx.save(); ctx.scale(ms, ms);
  const y0 = Math.max(16, (IH - 330) / 2);
  txt('TUTORIAL CONCLUÍDO', cx, y0 + 20, clamp(IW / 16, 18, 30), '#8fd6a4', 'center');
  wrapLines('Você já sabe mover, mirar, socar, pegar armas, atirar, recarregar, arremessar e usar cobertura. Agora é só entrar numa partida.', Math.min(560, IW - 40), 13).forEach((l, i) => txt(l, cx, y0 + 66 + i * 20, 13, MUTE, 'center'));
  button('JOGAR', cx - 130, y0 + 150, 260, 52, () => setState('modes'), 'primary');
  button('REPETIR TUTORIAL', cx - 130, y0 + 212, 260, 44, startTutorial);
  button('MENU', cx - 130, y0 + 266, 260, 44, () => setState('menu'));
  ctx.restore();
}

/* --------------------------- TREINAMENTO: TREINAMENTO | BOTS ------------ */
function drawTrain(t) {
  const ms = uiScale(), IW = innerWidth / ms, IH = innerHeight / ms, cx = IW / 2, MUTE = '#8a8a96', INK = '#e7e4d3';
  const ent = scrEnter('train'); ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, innerWidth, innerHeight); lobbyBg(IW, IH, ms, 1, ent, 'lamps');
  ctx.save(); ctx.scale(ms, ms);
  const k = ctx.getTransform().a / (RES), gap = 18;
  const cw = Math.min(230, (IW - 40 - gap) / 2), ch = Math.min(cw * 1.5, IH - 220), totW = cw * 2 + gap, x0 = cx - totW / 2;
  const ts = clamp(Math.min(IW / 14, IH / 14), 20, 34), y0 = Math.max(14, (IH - (ts + 28 + ch + 28 + 44)) / 2);
  scrHead('TREINAMENTO', cx, y0 + ts / 2, ts, IW, ent); ctx.globalAlpha = ent(.2);
  const y = y0 + ts + 28;
  [['SOLITÁRIO', () => { soloSetup = true; setState('setup'); }], ['BOTS', () => { soloSetup = false; botsSetup = true; cfg.team = cfg.team > 0 ? cfg.team : 1; saveCfg(); setState('setup'); }]].forEach(([label, fn], i) => {   // mesmo estilo dos cartões de mapa
    const x = x0 + i * (cw + gap), hov = input.mx > x * k && input.mx < (x + cw) * k && input.my > y * k && input.my < (y + ch) * k;
    const gr = ctx.createLinearGradient(x, y, x, y + ch); gr.addColorStop(0, hov ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.05)'); gr.addColorStop(1, hov ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.012)');   // mesmo fundo dos cartões 1v1..4v4
    ctx.beginPath(); ctx.roundRect(x + .5, y + .5, cw - 1, ch - 1, 18); ctx.fillStyle = gr; ctx.fill();
    ctx.strokeStyle = hov ? INK : 'rgba(255,255,255,.14)'; ctx.lineWidth = hov ? 2 : 1; ctx.stroke();
    txt(label, x + cw / 2, y + ch / 2 + 1, clamp(cw / 10, 14, 22), hov ? INK : 'rgba(231,228,211,.8)', 'center');
    ui.push({ x: x * k, y: y * k, w: cw * k, h: ch * k, fn });
  });
  cornerBtn('VOLTAR', -1, IW, IH, () => setState('menu'));
  ctx.restore();
}

/* --------------------------- ESCOLHER MODO (1v1 ... 4v4) ---------------- */
/* PERSONALIZADA -> ENTRAR e TUTORIAL -> TREINO: ao segurar o mouse sobre o cartão, a barrinha enche (~2 s) e o botão troca */
const FLIP = { c: { p: 0, m: 0 }, t: { p: 0, m: 0 }, t0: 0 };
function drawModes(t) {
  const ms = uiScale(), IW = innerWidth / ms, IH = innerHeight / ms, cx = IW / 2, MUTE = '#8a8a96', INK = '#e7e4d3', GRN = '#8fd6a4', RED = '#ff7a6b', ent = scrEnter('modes');
  ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, innerWidth, innerHeight); lobbyBg(IW, IH, ms, 1, ent, 'pass');
  ctx.save(); ctx.scale(ms, ms);
  const k = ctx.getTransform().a / (RES), g = 12, bh = 34;
  const ts = clamp(Math.min(IW / 14, IH / 14), 20, 34), ext = clamp(IH * .045, 14, 34), availH = IH - (ts + 28) - 70 - 2 * ext;
  const W = Math.max(320, Math.min(IW - 32, 1040, availH * 2.15)), H = W / 2.15, x0 = cx - W / 2, y0 = Math.max(14, (IH - 56 - (ts + 28 + H + 2 * ext)) / 2), y = y0 + ts + 28 + ext;
  const ls = v => { try { ctx.letterSpacing = v + 'px'; } catch (e) {} };
  const eT = ent(0); ctx.globalAlpha = eT; ls(Math.round(ts * .2)); txt('ESCOLHER MODO', cx + ts * .1, y0 + ts / 2 - (1 - eT) * 22, ts, INK, 'center'); ls(0);
  { const lw = Math.min(W, ts * 11) * ent(.25); ctx.strokeStyle = 'rgba(231,228,211,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - lw / 2, y0 + ts + 12.5); ctx.lineTo(cx + lw / 2, y0 + ts + 12.5); ctx.stroke(); }
  ctx.globalAlpha = ent(.2);   // o resto da tela aparece em seguida
  let tip = null;
  const TIPS = { c: 'Sala personalizada: todas as opções liberadas (modo, pontos, bots, tempo, armas e dificuldade). Todos contra todos.', j: 'Entrar na sala de um amigo usando o código de 4 dígitos.', tr: 'Treinamento solitário ou contra bots.', soon: 'Em breve.', bg: 'Campo de batalha: sala com todas as opções liberadas. Todos entram para lutar uns contra os outros, cada um por si. A partida começa quando todos estiverem prontos.', tut: 'Tutorial: aprenda a jogar passo a passo (mover, mirar, socar, armas, cobertura e arremesso).' };
  for (let q = 1; q <= 4; q++) TIPS[q] = `Clássico · 3 MIN · ${q > 1 ? `você + ${q - 1} aliado${q > 2 ? 's' : ''}` : 'você'} contra ${q} inimigo${q > 1 ? 's' : ''}. Amigos online entram em times opostos.`;
  const over = (x, yy, w, h) => input.mx > x * k && input.mx < (x + w) * k && input.my > yy * k && input.my < (yy + h) * k;
  const frame = (x, yy, w, h, hov, r) => btnShape(x, yy, w, h, hov, false, Math.min(10, h * .12 + 5));
  const go = q => () => { soloSetup = false; cfg.team = q; saveCfg(); setState('setup'); };
  const mode = (q, x, yy, w, h) => {   // cartão de partida: número grande + times (verde = seu time, vermelho = inimigos)
    const hov = over(x, yy, w, h); frame(x, yy, w, h, hov, 18);
    const big = clamp(Math.min(w * .3, h * .38), 22, 64); ls(Math.round(big * .06));
    txt(q + 'v' + q, x + w / 2, yy + h / 2, big, hov ? INK : 'rgba(231,228,211,.8)', 'center'); ls(0);
    if (hov) tip = TIPS[q]; ui.push({ x: x * k, y: yy * k, w: w * k, h: h * k, fn: go(q) });
  };
  const pill = (label, x, yy, w, h, fn, tp) => {
    const hov = over(x, yy, w, h); frame(x, yy, w, h, hov, Math.min(h / 2, 22));
    ls(3); const fz = clamp(h * .34, 12, 20); txt(label, x + w / 2, yy + h / 2 + 1, fz, hov ? INK : 'rgba(231,228,211,.8)', 'center'); ls(0);
    if (hov) tip = tp; ui.push({ x: x * k, y: yy * k, w: w * k, h: h * k, fn });
  };
  const soon = (label, x, yy, w, h) => {   // cartão bloqueado: tracejado, listras e etiqueta EM BREVE
    const hov = over(x, yy, w, h); ctx.save(); ctx.beginPath(); ctx.roundRect(x + .5, yy + .5, w - 1, h - 1, 10); ctx.fillStyle = 'rgba(255,255,255,.02)'; ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1; for (let i = -h; i < w; i += 14) { ctx.beginPath(); ctx.moveTo(x + i, yy + h); ctx.lineTo(x + i + h, yy); ctx.stroke(); } ctx.restore();
    ctx.beginPath(); ctx.roundRect(x + .5, yy + .5, w - 1, h - 1, 10); ctx.setLineDash([6, 6]); ctx.strokeStyle = hov ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.16)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.roundRect(x + w - 88, yy + 14, 72, 22, 11); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.stroke(); txt('EM BREVE', x + w - 52, yy + 26, 10, MUTE, 'center');
    ls(2); txt(label, x + 20, yy + h - 28, clamp(w / 20, 14, 22), 'rgba(138,138,150,.9)', 'left'); ls(0);
    if (hov) tip = TIPS.soon;
  };
  const card = (label, sub, x, yy, w, h, fn, tp, kind) => {   // cartão grande ativo (CAMPO DE BATALHA / TUTORIAL)
    const hov = over(x, yy, w, h); frame(x, yy, w, h, hov, 18);
    const ix = x + w - 46, iy = yy + 46, r = 17; ctx.strokeStyle = hov ? INK : 'rgba(231,228,211,.5)'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy, r, 0, TAU);
    if (kind === 'bg') { ctx.save(); ctx.translate(ix, iy); ctx.rotate(-Math.PI / 4); ctx.scale(.95, .95); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.roundRect(-21, -8, 25, 16, 2); ctx.moveTo(-14, -8); ctx.lineTo(-14, 8); ctx.moveTo(4, -8); ctx.quadraticCurveTo(16, -7, 22, 0); ctx.quadraticCurveTo(16, 7, 4, 8); ctx.stroke(); ctx.restore(); }   // bala
    else { ctx.stroke(); ctx.beginPath(); ctx.moveTo(ix - 5, iy - 8); ctx.lineTo(ix + 9, iy); ctx.lineTo(ix - 5, iy + 8); ctx.closePath(); ctx.fill(); }
    ls(2); txt(label, x + 20, yy + h - 46, clamp(w / 20, 14, 22), hov ? INK : 'rgba(231,228,211,.85)', 'left'); ls(0);
    txt(sub, x + 20, yy + h - 22, clamp(w / 34, 9, 12), MUTE, 'left');
    if (hov) tip = tp; ui.push({ x: x * k, y: yy * k, w: w * k, h: h * k, fn });
  };
  const bar = (label, x, yy, w, h, fn, isSoon) => {
    if (!isSoon) { button(label, x, yy, w, h, fn); if (over(x, yy, w, h)) tip = label === 'ENTRAR' ? TIPS.j : label === 'TREINO' ? TIPS.tr : null; return; }
    ctx.beginPath(); ctx.roundRect(x + .5, yy + .5, w - 1, h - 1, Math.min(12, h * .28)); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    txt(label, x + w / 2, yy + h / 2 - 6, 14, MUTE, 'center'); txt('EM BREVE', x + w / 2, yy + h / 2 + 11, 9, '#5c5c68', 'center'); if (over(x, yy, w, h)) tip = TIPS.soon;
  };
  // --- medidas (proporções do esboço): esquerda = grade de partidas; direita = dois cartões grandes
  const gh = H - bh - g, gR = clamp(W * .045, 24, 46), WL = (W - gR) * .55, WR = W - gR - WL, wa = (WL - g) * .55, wb = WL - g - wa, xb = x0 + wa + g, xr = x0 + WL + gR;
  const ph = clamp(gh * .13, 38, 56), rem = gh - ph - 2 * g, h1 = rem * .6, h3 = rem * .4, h2 = (gh - g) * .4, h4 = gh - g - h2;
  const now = performance.now(); if (!FLIP.t0 || now - FLIP.t0 > 300) { FLIP.c = { p: 0, m: 0 }; FLIP.t = { p: 0, m: 0 }; }
  const dt = Math.min(.1, (now - (FLIP.t0 || now)) / 1000); FLIP.t0 = now;
  const step = (f, hov) => { if (hov) { f.p += dt / 2.2; if (f.p >= 1) { f.m = 1 - f.m; f.p = 0; } } else if (f.m) { f.m = 0; f.p = 0; } else f.p = Math.max(0, f.p - dt / .35); };   // enche -> troca -> enche de novo -> volta (loop enquanto o mouse estiver em cima)
  const join = () => { netReset(); NET.err = ''; JOIN = ''; setState('join'); };
  const tab = (label, x, yy, w, active, prog, fn, tp) => {   // aba pequena: barrinha fina em cima e o nome embaixo
    const hov = over(x, yy, w, bh - 4);
    ctx.beginPath(); ctx.roundRect(x, yy, w, 4, 2); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fill();
    if (prog > 0) { ctx.beginPath(); ctx.roundRect(x, yy, Math.max(4, w * prog), 4, 2); ctx.fillStyle = INK; ctx.fill(); }
    const fs = clamp(w / (label.length * .75), 7, 11); ls(fs >= 10 ? 1.5 : .5); txt(label, x + w / 2, yy + 19, fs, active || hov ? INK : MUTE, 'center'); ls(0);
    if (fn) ui.push({ x: x * k, y: yy * k, w: w * k, h: (bh - 4) * k, fn });
    if (hov && tp) tip = tp;
  };
  // esquerda: grade de partidas + pílula PERSONALIZADA (vira ENTRAR) + abas
  const pyy = y + h1 + h3 + 2 * g;
  step(FLIP.c, over(x0, pyy, wa, ph));
  mode(1, x0, y, wa, h1); mode(3, x0, y + h1 + g, wa, h3);
  pill(FLIP.c.m ? 'ENTRAR' : 'PERSONALIZADA', x0, pyy, wa, ph, FLIP.c.m ? join : go(0), FLIP.c.m ? TIPS.j : TIPS.c);
  mode(2, xb, y, wb, h2); mode(4, xb, y + h2 + g, wb, h4);
  // direita: CAMPO DE BATALHA e TUTORIAL (vira TREINO), começam acima do 2v2 e terminam abaixo do 4v4
  const gtot = gh + 2 * ext, hb = (gtot - g) * .5, ty0 = y - ext + hb + g, th0 = gtot - g - hb;
  card('CAMPO DE BATALHA', 'TODOS CONTRA TODOS', xr, y - ext, WR, hb, () => { soloSetup = false; bgSetup = true; cfg.team = 0; saveCfg(); setState('setup'); }, TIPS.bg, 'bg');
  step(FLIP.t, over(xr, ty0, WR, th0));
  if (!FLIP.t.m) card('TUTORIAL', 'APRENDA A JOGAR', xr, ty0, WR, th0, startTutorial, TIPS.tut, 'tut');
  else { frame(xr, ty0, WR, th0, true); drawTargetIcon(xr + WR - 46, ty0 + 46, INK); ls(2); txt('TREINO', xr + 20, ty0 + th0 - 46, clamp(WR / 20, 14, 22), INK, 'left'); ls(0); txt('SOZINHO OU CONTRA BOTS', xr + 20, ty0 + th0 - 22, clamp(WR / 34, 9, 12), MUTE, 'left'); tip = TIPS.tr; ui.push({ x: xr * k, y: ty0 * k, w: WR * k, h: th0 * k, fn: () => setState('train') }); }
  // abas embaixo dos cartões
  const by = y + gh + g, byr = y + gh + ext + g, gt = 8, bw = (wa - gt) / 2, bw2 = (WR - g) / 2;   // abas da esquerda: só sob a pílula, menores e mais juntas
  tab('PERSONALIZADA', x0, by, bw, !FLIP.c.m, FLIP.c.m ? 0 : FLIP.c.p, go(0), TIPS.c);
  tab('ENTRAR', x0 + bw + gt, by, bw, !!FLIP.c.m, FLIP.c.m ? FLIP.c.p : 0, join, TIPS.j);
  tab('TUTORIAL', xr, byr, bw2, !FLIP.t.m, FLIP.t.m ? 0 : FLIP.t.p, startTutorial, TIPS.tut);
  tab('TREINO', xr + bw2 + g, byr, bw2, !!FLIP.t.m, FLIP.t.m ? FLIP.t.p : 0, () => setState('train'), TIPS.tr);
  cornerBtn('VOLTAR', -1, IW, IH, () => setState('menu'));
  ctx.globalAlpha = 1;
  if (tip) {   // balão perto do mouse com a descrição do modo
    const lines = wrapLines(tip, Math.min(300, IW - 40), 12), bw3 = Math.min(320, IW - 20), bh2 = lines.length * 18 + 18;
    const tx = clamp(input.mx / ms + 16, 10, IW - bw3 - 10), ty = clamp(input.my / ms > IH * .5 ? input.my / ms - bh2 - 16 : input.my / ms + 20, 10, IH - bh2 - 10);   // na metade de baixo o balão sobe, para não cobrir a barrinha
    ctx.beginPath(); ctx.roundRect(tx + .5, ty + .5, bw3 - 1, bh2 - 1, 10); ctx.fillStyle = 'rgba(13,13,17,.96)'; ctx.fill(); ctx.strokeStyle = 'rgba(231,228,211,.6)'; ctx.lineWidth = 1; ctx.stroke();
    lines.forEach((l, i) => txt(l, tx + 12, ty + 18 + i * 18, 12, INK, 'left'));
  }
  ctx.restore();
}

/* --------------------------- SELEÇÃO DE MAPA ---------------------------- */
function drawMapPreview(mp, x, y, w, h) {   // miniatura desenhada a partir do layout real do mapa
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.clip();
  ctx.fillStyle = mp ? mp.f1 : '#14141a'; ctx.fillRect(x, y, w, h);
  if (mp) for (const [a, b, c, d, k, v] of mp.L) { ctx.fillStyle = MINI_COL(k, v); ctx.fillRect(x + a * w, y + b * h, Math.max(2, c * w), Math.max(2, d * h)); }
  ctx.restore();
}
function drawMaps(t) {
  const ms = uiScale(), IW = innerWidth / ms, IH = innerHeight / ms, cx = IW / 2, MUTE = '#8a8a96', INK = '#e7e4d3';
  const ent = scrEnter('maps'); ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, innerWidth, innerHeight); lobbyBg(IW, IH, ms, 1, ent, 'blinds');
  ctx.save(); ctx.scale(ms, ms);
  const k = ctx.getTransform().a / (RES), n = MAPS.length + 1, gap = 14, cw = Math.min(210, (IW - 40 - gap * (n - 1)) / n), ch = cw * 1.2;
  const ts = clamp(Math.min(IW / 14, IH / 14), 20, 34), y0 = Math.max(14, (IH - (ts + 28 + ch + 22 + 64 + 16 + 52 + 12 + 44)) / 2);
  scrHead('ESCOLHER MAPA', cx, y0 + ts / 2, ts, IW, ent); ctx.globalAlpha = ent(.2);
  const y = y0 + ts + 28, x0 = cx - (n * cw + (n - 1) * gap) / 2;
  for (let i = 0; i < n; i++) {
    const sel = cfg.map === i, mp = MAPS[i], x = x0 + i * (cw + gap), hov = input.mx > x * k && input.mx < (x + cw) * k && input.my > y * k && input.my < (y + ch) * k;
    ctx.beginPath(); ctx.roundRect(x + .5, y + .5, cw - 1, ch - 1, 16); ctx.fillStyle = sel ? 'rgba(255,255,255,.08)' : hov ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.03)'; ctx.fill();
    ctx.strokeStyle = sel ? INK : hov ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.14)'; ctx.lineWidth = sel ? 2 : 1; ctx.stroke();
    const pw = cw - 20, ph = pw * .62;
    drawMapPreview(mp, x + 10, y + 10, pw, ph);
    if (!mp) txt('?', x + cw / 2, y + 10 + ph / 2 + 2, ph * .7, INK, 'center');
    txt(mp ? mp.name : 'ALEATÓRIO', x + cw / 2, y + ph + 36, clamp(cw / 10, 12, 18), sel ? INK : MUTE, 'center');
    txt(mp ? mp.sub : 'SORTEIA UM MAPA', x + cw / 2, y + ph + 58, clamp(cw / 20, 8, 10), '#5c5c68', 'center');
    if (mp) { ctx.beginPath(); ctx.roundRect(x + cw / 2 - 16, y + ph + 74, 32, 4, 2); ctx.fillStyle = sel ? mp.accent : 'rgba(255,255,255,.12)'; ctx.fill(); }
    ui.push({ x: x * k, y: y * k, w: cw * k, h: ch * k, fn: () => { cfg.map = i; saveCfg(); } });
  }
  const desc = cfg.map < MAPS.length ? MAPS[cfg.map].desc() : 'Um dos três mapas é sorteado no início de cada partida. Quem joga de novo pode cair em outro.';
  let yy = y + ch + 22;
  for (const l of wrapLines(desc, Math.min(600, IW - 40), 12)) { txt(l, cx, yy, 12, MUTE, 'center'); yy += 18; }
  yy = Math.max(yy, y + ch + 22 + 54) + 16;
  cornerBtn('CONTINUAR', 1, IW, IH, () => { saveCfg(); setState('setup'); }, 'primary');
  cornerBtn('VOLTAR', -1, IW, IH, () => setState('modes'));
  ctx.restore();
}

/* ------------------------- HUD DA PARTIDA (relógio, placar) ------------- */
function drawMatchHUD() {
  if (!M || training || !player) return;
  const W = innerWidth, H = innerHeight, t = menuT, INK = '#e7e4d3', MUTE = 'rgba(255,255,255,.6)';
  const left = Math.ceil(M.left), low = M.phase === 'fight' && M.left <= 10;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.roundRect(W / 2 - 62, 12, 124, 40, 14); ctx.fill();
  txt(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, W / 2, 33, 26, low && Math.floor(t * 4) % 2 ? '#ff5a5a' : INK, 'center');
  txt(`RODADA ${M.round}  ·  ${M.target ? 'META ' + M.target + ' PTS' : 'INFINITO'}`, W / 2, 66, 12, MUTE, 'center');
  if (player.dead && M.phase === 'fight') txt('ELIMINADO · ESPECTANDO ATÉ A RODADA ACABAR', W / 2, H - 120, 16, '#ff7a6b', 'center');
  if (M.phase === 'map') {   // nome do mapa, antes da contagem
    const mp = MAPS[M.map], T = M.phaseT, a = clamp(T / .35, 0, 1) * clamp((MAP_INTRO - T) / .4, 0, 1), s = easeOutExpo(clamp(T / .8, 0, 1));
    ctx.fillStyle = `rgba(0,0,0,${.6 * a})`; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = a;
    const fs = clamp(Math.min(W / (mp.name.length * .9), H * .17), 34, 130), ls = fs * .16, cy = H / 2;
    try { ctx.letterSpacing = '8px'; } catch (e) {}
    txt('MAPA', W / 2 + 4, cy - fs * .85, 16, MUTE, 'center');
    try { ctx.letterSpacing = ls + 'px'; } catch (e) {}
    txt(mp.name, W / 2 + ls / 2 + (1 - s) * 60, cy, fs, '#fff', 'center');
    try { ctx.letterSpacing = '0px'; } catch (e) {}
    const bw = Math.min(W * .5, fs * mp.name.length * .62) * s;
    ctx.beginPath(); ctx.roundRect(W / 2 - bw / 2, cy + fs * .62, bw, 5, 3); ctx.fillStyle = mp.accent; ctx.fill();
    try { ctx.letterSpacing = '3px'; } catch (e) {}
    txt(mp.sub, W / 2 + 1, cy + fs * .62 + 32, 16, INK, 'center');
    try { ctx.letterSpacing = '0px'; } catch (e) {}
    wrapLines(mp.tip(), Math.min(W - 40, 620), 13).forEach((l, i) => txt(l, W / 2, cy + fs * .62 + 62 + i * 19, 13, MUTE, 'center'));
    ctx.globalAlpha = 1;
  }
  if (M.phase === 'count') {   // contagem 3 - 2 - 1
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
    const n = 3 - Math.floor(M.phaseT), f = M.phaseT % 1, sz = clamp(Math.min(W, H) * .42, 110, 320) * (1.3 - .3 * easeOutExpo(Math.min(1, f * 3)));
    txt(`RODADA ${M.round}`, W / 2, H / 2 - clamp(Math.min(W, H) * .3, 80, 190), 22, MUTE, 'center');
    ctx.globalAlpha = 1 - Math.pow(f, 3) * .85; txt(String(Math.max(1, n)), W / 2, H / 2, sz, '#fff', 'center'); ctx.globalAlpha = 1;
  }
  if (M.phase === 'fight' && M.flashT > 0) {   // começou: aviso suave (aparece e some devagar), sem piscar a tela
    const k = M.flashT, e = easeInOut(clamp((1 - k) / .22, 0, 1)) * easeInOut(clamp(k / .45, 0, 1)), fs = clamp(W / 9, 36, 110), bh = fs * 1.7;
    const bg = ctx.createLinearGradient(0, H / 2 - bh / 2, 0, H / 2 + bh / 2); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(.5, `rgba(0,0,0,${.38 * e})`); bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, H / 2 - bh / 2, W, bh);
    ctx.globalAlpha = e; try { ctx.letterSpacing = (fs * .12) + 'px'; } catch (er) {}
    txt('COMEÇOU!', W / 2 + fs * .06, H / 2 - fs * .08, fs * (.94 + .06 * e), INK, 'center');
    try { ctx.letterSpacing = '0px'; } catch (er) {}
    const lw = Math.min(W * .5, fs * 6) * e; ctx.fillStyle = 'rgba(231,228,211,.55)'; ctx.fillRect(W / 2 - lw / 2, H / 2 + fs * .5, lw, 2);
    ctx.globalAlpha = 1;
  }
  if (M.phase === 'rend' && M.last) {
    ctx.fillStyle = `rgba(0,0,0,${.5 * clamp(M.phaseT * 3, 0, 1)})`; ctx.fillRect(0, 0, W, H);
    const w = M.last.w;
    txt(w ? (M.team ? (M.last.wt === 0 ? 'SEU TIME VENCEU A RODADA' : 'TIME INIMIGO VENCEU A RODADA') : `${fname(w)} VENCEU A RODADA`) : 'EMPATE NA RODADA', W / 2, H / 2 - 16, clamp(W / 26, 18, 40), INK, 'center');
    txt(M.last.why, W / 2, H / 2 + 22, 14, MUTE, 'center');
    if (w) txt('+1 PONTO', W / 2, H / 2 + 48, 16, '#8fd6a4', 'center');
  }
}
function drawMatchEnd() {
  const ms = clamp(innerHeight / 560, .55, 1), IW = innerWidth / ms, IH = innerHeight / ms, cx = IW / 2, INK = '#e7e4d3', MUTE = '#8a8a96';
  ctx.fillStyle = 'rgba(8,8,12,.85)'; ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.save(); ctx.scale(ms, ms);
  const rows = M.team ? [['SEU TIME', M.sc[0], true], ['INIMIGOS', M.sc[1], false]] : allF().map(f => [fname(f), M.sc[f.team], f.isPlayer]);
  rows.sort((a, b) => b[1] - a[1]); const order = rows, top = rows[0];
  const y0 = Math.max(16, (IH - (130 + order.length * 24 + 170)) / 2);
  txt('PARTIDA ENCERRADA', cx, y0 + 20, 30, INK, 'center');
  txt(M.team ? (top[2] ? 'SEU TIME VENCEU' : 'TIME INIMIGO VENCEU') : `${top[0]} VENCEU`, cx, y0 + 62, 18, top[2] ? '#8fd6a4' : '#e08a8a', 'center');
  let y = y0 + 104;
  order.forEach((f, i) => { txt(`${i + 1}. ${f[0]}`, cx - 130, y, 14, f[2] ? INK : MUTE, 'left'); txt(String(f[1]), cx + 130, y, 14, f[2] ? INK : MUTE, 'right'); y += 24; });
  y += 14;
  if (NET.cl) txt('AGUARDANDO O ANFITRIÃO...', cx, y + 26, 14, MUTE, 'center'); else button('JOGAR DE NOVO', cx - 130, y, 260, 52, startMatch, 'primary');
  if (!NET.online) button('CONFIGURAR', cx - 130, y + 62, 260, 44, () => setState('setup'));
  button('MENU', cx - 130, y + (NET.online ? 62 : 114), 260, 44, () => setState('menu'));
  ctx.restore();
}

