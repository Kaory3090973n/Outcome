/* ---------------------------- FIGHTERS -------------------------------- */
function makeFighter(o) {
  return Object.assign({
    x: 0, y: 0, vx: 0, vy: 0, angle: 0, hp: 100, maxHp: 100, speed: C.moveSpeed, r: C.r, punchDmg: C.punchDamage, mAgi: 1, mAim: 1, mRel: 1, mTgh: 1,
    cover: null, isCovered: false, peekK: 0, leanS: 1, coverOff: { x: 0, y: 0 }, coverBlock: false, stun: 0, stunMax: 1, fallDir: 1, throwCd: 0, emptyT: 0, slideT: 0, slideCd: 0, slideDx: 0, slideDy: 0, slideX: 0, stag: 0, micro: 0, slideHits: null, slideCdMax: .9, holst: null, hk: null, drawT: 0,
    swing: -1, swingHits: new Set(), weapon: null, mag: 0, reserve: 0, fireCd: 0, reloadT: 0, reloadMax: 1, kick: 0, flash: 0, hitFlash: 0,
    twist: 0, walk: 0, combo: 0, comboTimer: 0, cooldown: 0, nextHand: 'left', dead: false, isPlayer: false,
    punch: { left: { t: -1 }, right: { t: -1 } },
  }, o);
}
const giveWeapon = (f, key, mag, reserve) => { f.weapon = key; f.mag = mag; f.reserve = reserve; f.reloadT = 0; f.swing = -1; f.fireCd = .15; };
/* Sacar / guardar a arma (tecla Q): guardada, a arma some das mãos (soco normal); sacar leva um instante antes de poder atirar */
function unholster(f, delay) { if (!f.holst) return; const h = f.holst; f.holst = null; f.hk = null; giveWeapon(f, h.key, h.mag, h.reserve); f.drawT = delay || 0; }
function toggleHolster(f) {
  if (f.dead || f.stun > 0 || f.slideT > 0) return;
  if (f.holst) { unholster(f, .3); sfxHolster(); }
  else if (f.weapon) { f.holst = { key: f.weapon, mag: f.mag, reserve: f.reserve }; f.hk = f.weapon; f.weapon = null; f.mag = f.reserve = 0; f.reloadT = 0; f.swing = -1; f.drawT = 0; sfxHolster(); }
}
function dropWeapon(f) {
  if (f.weapon && (WEAPONS[f.weapon].melee || f.mag + f.reserve > 0))
    pickups.push({ x: f.x + rnd(-8, 8), y: f.y + rnd(-8, 8), key: f.weapon, mag: f.mag, reserve: f.reserve, t: rnd(0, 6) });
  f.weapon = null; f.reloadT = 0; f.swing = -1;
}
const inCrate = (x, y, p = 0) => crates.some(c => x > c.x - p && x < c.x + c.w + p && y > c.y - p && y < c.y + c.h + p);
function freeSpot(minDist = 0, from = null) {
  for (let i = 0; i < 60; i++) {
    const x = rnd(50, WW - 50), y = rnd(50, WH - 50);
    if (!inCrate(x, y, 30) && (!from || Math.hypot(x - from.x, y - from.y) > minDist)) return { x, y };
  }
  return { x: 60, y: 60 };
}
function lootSpot() {   // espalha o loot: sorteia vários pontos e fica com o mais longe das armas que já estão no chão
  let best = null, bd = -1;
  for (let i = 0; i < 14; i++) { const p = freeSpot(); let m = 1e9; for (const q of pickups) m = Math.min(m, Math.hypot(q.x - p.x, q.y - p.y)); if (m > bd) { bd = m; best = p; } }
  return best;
}
const holdX = w => C.holdReach - w.gripR[0] * (w.vis || 1);   // x (local) da origem da arma: a mão direita fica em holdReach
const toWorld = (f, lx, ly) => { const c = Math.cos(f.angle), s = Math.sin(f.angle); return { x: f.x + lx*c - ly*s, y: f.y + lx*s + ly*c }; };

function spawnBot(b) {
  const d = DIFFS[cfg.diff]; let p = null;
  if (b.team === player.team) for (let i = 0; i < 60 && !p; i++) {   // aliado nasce perto do jogador
    const a = rnd(0, TAU), r = rnd(50, 140), x = player.x + Math.cos(a) * r, y = player.y + Math.sin(a) * r;
    if (x > 50 && y > 50 && x < WW - 50 && y < WH - 50 && !inCrate(x, y, 30)) p = { x, y };
  }
  if (!p) p = freeSpot(380, player);
  Object.assign(b, makeFighter({ x: p.x, y: p.y, hp: d.hp, maxHp: d.hp, speed: d.speed * rnd(.92, 1.08), punchDmg: 10,
    pal: b.pal, respawnT: 0, strafe: Math.random() < .5 ? 1 : -1,
    strafeT: rnd(1, 3), burstT: rnd(.3, 1), burstOn: false, aimBias: 0, biasT: 0, stuckT: 0, detourT: 0, angle: rnd(0, TAU), tgt: null, tgtT: 0 }));
  applyChar(b);
}

function updateCam() {   // câmera presa ao personagem (para só nas bordas do mapa); eliminado = acompanha um bot vivo
  let t = player; if (player.dead) { const a = bots.find(b => !b.dead && b.team === player.team) || bots.find(b => !b.dead); if (a) t = a; }
  const tx = clamp(t.x - VW / 2, 0, Math.max(0, WW - VW)), ty = clamp(t.y - VH / 2, 0, Math.max(0, WH - VH));
  if (player.dead) { cam.x += (tx - cam.x) * .08; cam.y += (ty - cam.y) * .08; } else { cam.x = tx; cam.y = ty; }
}
function startGame(tr, keepKills) {
  training = tr === true; trainT = 0; if (training) { curMap = MAPS[cfg.map >= MAPS.length ? Math.floor(Math.random() * MAPS.length) : cfg.map]; buildCrates(); }   // solitário: mapa escolhido (ALEATÓRIO sorteia)
  if (training) { M = null; matchTrack = cfg.music ? cfg.music - 1 : pickTrack(); }
  decals = []; puddles = []; prints = []; pools.clear(); thrown = []; bullets = []; pickups = []; casings = []; trail = []; btrails = []; rings = []; sparks = []; if (curMap) buildCrates(); if (!keepKills) kills = 0; dmgFlash = 0; cmbN = cmbT = cmbPop = 0; killT = -1;
  const c = freeSpot();
  const sp = curMap ? curMap.spawn : [.5, .4];
  player = makeFighter({ x: WW * sp[0], y: WH * sp[1], isPlayer: true, pid: 0,
    pal: CHARS[cfg.char], team: 0 });
  if (inCrate(player.x, player.y, 30)) Object.assign(player, freeSpot());
  applyChar(player);
  bots = [];
  const hum = [cfg.char, ...(NET.online ? NET.guests.map(g => g.char) : [])]; let pool = [...new Set([...(NET.others || []), ...CHARS.map((_, i) => i)])].filter(i => !hum.includes(i)); if (!pool.length) pool = CHARS.map((_, i) => i);   // bots usam os personagens que nenhum jogador escolheu
  const tm = !training && M && M.team;   // partida por times: os primeiros (n-1) bots são aliados do jogador
  for (let i = 0; !training && i < nBots(); i++) { const b = { pal: CHARS[pool[i % pool.length]], pid: i + 1, team: tm ? (i < M.room - 1 ? 0 : 1) : i + 1 }; spawnBot(b); bots.push(b); }
  {   // quantidade de loot escolhida na configuração (pouca / média / muita), também no solitário
    const L = LOOTS[cfg.loot], nf = bots.length + 1, total = lootInit(cfg.loot, nf), ks = WKEYS.slice().sort(() => Math.random() - .5);
    let i = 0;
    const add = (x, y) => { const k = ks[i++ % ks.length], w = WEAPONS[k]; pickups.push({ x, y, key: k, mag: w.mag, reserve: w.reserve, t: rnd(0, 6) }); };
    if (L.near) for (const f of allF()) {   // uma arma ao alcance de cada lutador, para ninguém largar de mãos vazias
      for (let tries = 0; tries < 14; tries++) { const a = rnd(0, TAU), d = rnd(70, 150), x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d; if (x > 50 && x < WW - 50 && y > 50 && y < WH - 50 && !inCrate(x, y, 30)) { add(x, y); break; } }
    }
    while (i < total) { const q = lootSpot(); add(q.x, q.y); }
    pickupTimer = L.every;
  }
  assignRemotes(); touch.ang = 0; updateCam(); setState('play');
}
/* ------------------------------ PARTIDA ------------------------------- */
function startMatch() {
  soloSetup = false; if (NET.online) NET.mid++;
  try { localStorage.setItem('oc_cfg', JSON.stringify(cfg)); } catch (e) {}
  const mi = cfg.map >= MAPS.length ? Math.floor(Math.random() * MAPS.length) : cfg.map; curMap = MAPS[mi]; buildCrates();   // ALEATÓRIO sorteia a cada partida
  const pre = cfg.team > 0, bt = pre && cfg.bt;   // bt = BOTS do treinamento (aceita infinito e tempo livres)
  // predefinido (1v1..4v4): clássico, 3 minutos, times
  M = { round: 0, map: mi, room: cfg.team, team: pre, sc: new Array(pre ? 2 : nBots() + 1).fill(0), target: ((pre && !bt) || cfg.mode === 0) ? PTS[cfg.pts] : 0, time: pre && !bt ? 180 : TIMES[cfg.time], phase: 'count', phaseT: 0, left: 0, flashT: 0, last: null };
  kills = 0; matchTrack = cfg.music ? cfg.music - 1 : pickTrack(); nextRound();
}
function nextRound() { M.round++; startGame(false, true); M.phase = M.round === 1 ? 'map' : 'count'; M.mapSfx = false; M.phaseT = 0; M.left = M.time; M.flashT = 0; M.last = null; M.beep = -1; }
const fname = f => f.pal.name + (f.isPlayer ? ' (VOCÊ)' : '');
function endRound(alive) {
  let w = null, why = '', wt = -1;
  const ts = [...new Set(alive.map(f => f.team))];
  if (ts.length === 1) { wt = ts[0]; w = alive.find(f => f.team === wt); why = M.team ? 'ÚLTIMO TIME EM PÉ' : 'ÚLTIMO EM PÉ'; }
  else if (!ts.length) why = 'TODOS CAÍRAM';
  else if (M.team) {   // tempo esgotado: vence o time com mais vida somada
    const hp = t => alive.filter(f => f.team === t).reduce((a, f) => a + f.hp, 0), a = hp(0), b = hp(1);
    if (Math.abs(a - b) > .01) { wt = a > b ? 0 : 1; w = alive.find(f => f.team === wt); why = 'TEMPO ESGOTADO: MAIOR VIDA DO TIME'; } else why = 'TEMPO ESGOTADO: VIDA IGUAL';
  } else {   // tempo esgotado: vence quem tiver mais vida
    alive.sort((a, b) => b.hp - a.hp);
    if (alive[0].hp - alive[1].hp > .01) { w = alive[0]; wt = w.team; why = 'TEMPO ESGOTADO: MAIOR VIDA'; } else why = 'TEMPO ESGOTADO: VIDA IGUAL';
  }
  if (wt >= 0) M.sc[wt]++;
  M.last = { w, wt, why }; M.phase = 'rend'; M.phaseT = 0;
}
const MAP_INTRO = 2.8;   // duração (s) da apresentação do nome do mapa
function stepMatch(dt) {   // devolve o dt da simulação (-1 = congelada)
  M.phaseT += dt; M.flashT = Math.max(0, M.flashT - dt);
  if (M.phase === 'map') {   // nome do mapa antes da contagem (só na 1ª rodada da partida)
    if (!M.mapSfx) { M.mapSfx = true; sfxBeep(330, .18); }
    if (M.phaseT >= MAP_INTRO) { M.phase = 'count'; M.phaseT = 0; M.beep = -1; }
    return -1;
  }
  if (M.phase === 'count') {
    const n = Math.floor(M.phaseT); if (n !== M.beep && n < 3) { M.beep = n; sfxBeep(n === 2 ? 880 : 660, .13); }   // bipes 3, 2, 1
    if (M.phaseT >= 3) { M.phase = 'fight'; M.phaseT = 0; M.flashT = 1; sfxHorn(); }
    return -1;
  }
  if (M.phase === 'fight') {
    M.left -= dt; const alive = allF().filter(f => !f.dead);
    if (new Set(alive.map(f => f.team)).size <= 1 || M.left <= 0) { M.left = Math.max(0, M.left); endRound(alive); }
    return dt;
  }
  if (M.phase === 'rend') {
    if (M.phaseT > 3.4) { if (M.target && Math.max(...M.sc) >= M.target) { M.phase = 'mend'; setState('mend'); } else nextRound(); return -1; }
    return dt * .25;   // câmera lenta no fim da rodada
  }
  return -1;
}
function setState(s) { if ((state === 'setup' && s !== 'room') || (s === 'setup' && state !== 'room')) cfg.roomName = '';   // o nome da sala não fica guardado ao sair da configuração
  nameFocus = false; nameErr = false; if (s === 'modes' || s === 'menu' || s === 'train') bgSetup = botsSetup = false; if (TUT && !['play', 'pause', 'options', 'tutend'].includes(s)) tutEnd(); state = s; if (s === 'menu') netReset(); if (s === 'room' || s === 'join' || s === 'menu' || s === 'setup' || s === 'maps' || s === 'modes' || s === 'train') M = null; canvas.style.cursor = s === 'play' ? 'none' : 'default'; input.down = false; input.peek = false; resetTouch(); }

/* ------------------------------ COMBATE ------------------------------- */
function tryPunch(f) {
  if (f.cooldown > 0) return;
  if (f.isPlayer) input.buffer = 0; else if (f.remote) f.rbuf = 0;   // soco exige um clique novo
  let hand = f.nextHand;
  if (f.weapon && WEAPONS[f.weapon].knuckle) {   // soco-inglês: alterna as mãos, mas ~70% dos socos saem da mão dominante (a do soco-inglês); nunca 2 seguidos da outra mão
    const dom = domHand(f), oth = dom === 'left' ? 'right' : 'left';
    hand = (f.lastHand === oth || Math.random() < .7) ? dom : oth;
  }
  f.lastHand = hand;
  const p = f.punch[hand];

  f.combo = f.comboTimer > 0 ? f.combo + 1 : 1; f.comboTimer = C.comboWindow;
  p.t = 0; p.heavy = f.combo % 3 === 0; p.fx = false; p.landed = false;
  f.nextHand = hand === 'left' ? 'right' : 'left';
  f.cooldown = p.heavy ? C.punchCooldown * 1.5 : C.punchCooldown;
  const lg = p.heavy ? C.heavyLunge : C.lunge;
  f.vx += Math.cos(f.angle) * lg; f.vy += Math.sin(f.angle) * lg;
}
function punchExt(t) {
  const W = .12, S = .30, H = .40;
  if (t < W) return -.18 * (t / W);
  if (t < S) return -.18 + 1.18 * easeOutExpo((t - W) / (S - W));
  if (t < H) return 1;
  return 1 - easeInOut((t - H) / (1 - H));
}
function fistLocal(f, hand) {
  const side = hand === 'left' ? -1 : 1, p = f.punch[hand];
  const ext = p.t < 0 ? 0 : punchExt(p.t), reach = p.heavy ? C.heavyReach : C.reach;
  const sp = Math.min(Math.hypot(f.vx, f.vy) / C.moveSpeed, 1);
  const swing = p.t < 0 ? -Math.sin(f.walk + (side > 0 ? Math.PI : 0)) * 6 * sp : 0; // braços balançam ao andar
  return { x: 11 + reach * ext + swing, y: side * 13 * (1 - .9 * Math.max(ext, 0)), ext };
}
/* Extensão do braço no golpe corpo a corpo: em repouso o braço fica encolhido (segurando junto ao corpo); ao bater, recua um pouco e estica até o fim do braço */
function meleeExt(f) {
  const t = f.swing; if (t < 0) return 0;
  if (t < .18) return -.2 * (t / .18);
  if (t < .5) return -.2 + 1.2 * easeOutExpo((t - .18) / .32);
  return 1 - easeInOut((t - .5) / .5);
}
/* Rotação do machado: arma recuada -> preparo -> corte rápido -> retorno */
function swingRot(f) {
  const t = f.swing, rest = -.8;
  if (t < 0) return rest;
  if (t < .18) return rest - .6 * (t / .18);
  if (t < .5) return -1.4 + 2.6 * easeOutExpo((t - .18) / .32);
  return 1.2 + (rest - 1.2) * easeInOut((t - .5) / .5);
}
/* Mão dominante: cada personagem é destro ('R') ou canhoto ('L'). Na vida real cerca de 1 em cada 10 pessoas é canhota; entre os 8 personagens, 1 é canhoto.
   A mão dominante segura a arma (o desenho e o braço espelham para canhotos) e o soco-inglês. */
const lefty = f => !!(f.pal && f.pal.hand === 'L'), domHand = f => lefty(f) ? 'left' : 'right';
const enemiesOf = f => allF().filter(o => o !== f && !o.dead && o.team !== f.team);   // inimigos (aliados não levam dano)

function damage(t, dmg, ang, src, kind) {
  if (t.dead) return;
  if (TUT) tutDamage(t, dmg, src);
  if (src && src.isPlayer && !t.isPlayer && src.team !== t.team) { if (cmbN === 0) cmbAge = 0; cmbN++; cmbT = 4; cmbPop = 1; }   // acerto do jogador soma no combo
  if (t.isPlayer) { cmbN = 0; cmbT = 0; }   // levou dano: o combo some
  t.hp -= dmg; t.hitFlash = .1;
  t.vx += Math.cos(ang) * 90 * t.mTgh; t.vy += Math.sin(ang) * 90 * t.mTgh;
  for (let i = 0; i < 3; i++) addDecal(t.x + rnd(-10, 10) + Math.cos(ang) * 10, t.y + rnd(-10, 10) + Math.sin(ang) * 10, rnd(2, 5));
  if (t.isPlayer) { dmgFlash = .45; shake = Math.max(shake, 5); }
  if (t.hp <= 0) kill(t, src); else if (kind) bleedHit(t, kind, src);
}
/* ------------------------- SANGRAMENTO, POÇAS E PEGADAS ------------------------- */
/* Cada tipo de golpe sangra de um jeito: ping = intervalo entre pingos (s), dur = duração (s), dps = vida perdida por segundo,
   r0/r1 = tamanho do pingo, sev = gravidade (um sangramento mais grave não é trocado por um mais leve), cap = raio máximo da poça,
   gate = só sangra de verdade com vida abaixo dessa fração (hemorragia interna). */
const BLEED = {
  gun:   { ping: .4, dur: 4, dps: 1.2, r0: 2,   r1: 3.6, sev: 2, cap: 15 },              // pistola / tiro direto: médio
  cut:   { ping: .2, dur: 6, dps: 2.6, r0: 3,   r1: 6.5, sev: 3, cap: 28 },              // arma branca cortante: brutal, pingo maior
  blunt: { ping: .8, dur: 6, dps: .8,  r0: 2,   r1: 3.4, sev: 1, cap: 11, gate: .3 },    // arma branca de impacto: interno, só com vida < 30%
  fist:  { ping: .6, dur: 3, dps: 0,   r0: 1.6, r1: 2.6, sev: 0, cap: 7 },               // soco: só pinga após 3+ socos seguidos, sem perda de vida
};
const CUT_W = { cleaver: 1, pocket: 1, butterfly: 1, bottle: 1 }, BLUNT_W = { crowbar: 1, wrench: 1, sledge: 1, knuckles: 1 };
const weaponKind = k => CUT_W[k] ? 'cut' : BLUNT_W[k] ? 'blunt' : 'fist';
const POOL_BIG = 10;   // raio a partir do qual uma poça de sangue encharca a sola
function bleedHit(t, kind, src) {
  if (t.dummy || t.dead) return;
  if (kind === 'fist') { t.fistT = 3; t.fistN = (t.fistN || 0) + 1; if (t.fistN < 3) return; }   // soco: precisa de 3+ seguidos
  const B = BLEED[kind], cur = t.bleed;
  if (cur && BLEED[cur.kind].sev > B.sev) return;
  if (cur && cur.kind === kind) { cur.t = Math.max(cur.t, B.dur); cur.src = src; }
  else t.bleed = { kind, t: B.dur, ping: 0, src };
}
const stopBleed = f => { f.bleed = null; };   // gancho para a futura Bandagem
function bleedPing(f, B, kind) {
  const r = rnd(B.r0, B.r1) * (kind === 'cut' && Math.random() < .35 ? 1.5 : 1);   // cortes às vezes soltam um pingo maior
  if ((f.still || 0) > 1.5) {   // parado há mais de 1,5 s: os pingos se fundem na mesma posição e a poça cresce
    let p = puddles.find(q => q.owner === f && Math.hypot(q.x - f.x, q.y - f.y) < 13);
    if (!p) {
      p = { x: f.x, y: f.y, r: 3 + r * .6, cap: B.cap, owner: f, lobes: Array.from({ length: 4 }, () => ({ a: rnd(0, TAU), d: rnd(.2, .55), k: rnd(.55, .85) })) };
      puddles.push(p); if (puddles.length > 40) puddles.shift();
    }
    p.cap = Math.max(p.cap, B.cap);
    p.r = Math.min(p.cap, p.r + (.3 + B.sev * .3) * (1 + Math.min(f.still - 1.5, 6) * .2));   // mais tempo parado + ferida mais grave = poça maior
    return;
  }
  addDecal(f.x + rnd(-3, 3), f.y + rnd(-3, 3), r);
}
function updateBlood(dt) {
  for (const f of allF()) {
    if (!f || f.dead) continue;
    const spd = Math.hypot(f.vx, f.vy);
    f.still = spd < 25 ? (f.still || 0) + dt : 0;
    if (f.fistT > 0) { f.fistT -= dt; if (f.fistT <= 0) f.fistN = 0; }
    const b = f.bleed;
    if (b) {
      const B = BLEED[b.kind]; b.t -= dt;
      if (!B.gate || f.hp < f.maxHp * B.gate) {
        if (B.dps) { f.hp -= B.dps * dt; if (f.hp <= 0) { f.bleed = null; kill(f, b.src); continue; } }
        b.ping -= dt; if (b.ping <= 0) { b.ping += B.ping; bleedPing(f, B, b.kind); }
      }
      if (b.t <= 0) f.bleed = null;
    }
    footSteps(f, dt, spd);
  }
}
/* Pegadas: poça grande (sangue acumulado ou água) encharca a sola = 5 a 7 pegadas que vão esmaecendo até sumir.
   Sangue pouco líquido sujou só de leve = 1 ou 2 pegadas fracas. */
function footSteps(f, dt, spd) {
  const ft = f.ft || (f.ft = { kind: null, tot: 0, k: 0, big: false, rgb: '', cool: 0, d: 0, side: 1 });
  ft.cool = Math.max(0, ft.cool - dt);
  if (f.slideT <= 0) {
    let big = null;
    for (const p of puddles) if (p.r >= POOL_BIG && Math.hypot(f.x - p.x, f.y - p.y) < p.r) { big = { kind: 'blood', rgb: '120,8,28' }; break; }
    if (!big) for (const w of pools.values()) { const dx = (f.x - w.x) / w.rx, dy = (f.y - w.y) / w.ry; if (dx * dx + dy * dy < 1) { big = { kind: 'water', rgb: w.rgb }; break; } }
    if (big) {
      if (ft.k >= ft.tot || !ft.big || ft.kind !== big.kind) { ft.kind = big.kind; ft.rgb = big.rgb; ft.big = true; ft.tot = 5 + (Math.random() * 3 | 0); }
      ft.k = 0;   // enquanto pisa na poça a sola continua encharcada
    } else if (ft.k >= ft.tot && ft.cool <= 0 && spd > 40) {
      for (const d of decals) if (Math.hypot(f.x - d.x, f.y - d.y) < d.r + 5) { ft.kind = 'blood'; ft.rgb = '120,8,28'; ft.big = false; ft.tot = 1 + (Math.random() * 2 | 0); ft.k = 0; ft.cool = .6; break; }
    }
  }
  if (f.slideT > 0 || spd < 40) return;
  ft.d += spd * dt;
  if (ft.d < 17) return;
  ft.d -= 17; ft.side = -ft.side;
  if (ft.k >= ft.tot) return;
  const ang = Math.atan2(f.vy, f.vx), base = ft.kind === 'water' ? .5 : ft.big ? .8 : .3;
  const al = base * Math.pow(1 - ft.k / ft.tot, 1.25);   // 1ª pegada forte, última quase some
  prints.push({ x: f.x + Math.cos(ang + 1.5708) * 5 * ft.side - Math.cos(ang) * 3, y: f.y + Math.sin(ang + 1.5708) * 5 * ft.side - Math.sin(ang) * 3, rot: ang, a: al, rgb: ft.rgb });
  if (prints.length > 320) prints.shift();
  ft.k++;
}
function drawBlood() {
  const x0 = cam.x - 40, y0 = cam.y - 40, x1 = cam.x + VW + 40, y1 = cam.y + VH + 40;
  for (const p of puddles) {
    if (p.x < x0 || p.y < y0 || p.x > x1 || p.y > y1) continue;
    ctx.fillStyle = 'rgba(105,6,24,.9)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU);
    for (const l of p.lobes) { const lx = p.x + Math.cos(l.a) * p.r * l.d, ly = p.y + Math.sin(l.a) * p.r * l.d, lr = p.r * l.k; ctx.moveTo(lx + lr, ly); ctx.arc(lx, ly, lr, 0, TAU); }
    ctx.fill();
    ctx.fillStyle = 'rgba(190,24,48,.32)'; ctx.beginPath(); ctx.arc(p.x - p.r * .15, p.y - p.r * .2, p.r * .5, 0, TAU); ctx.fill();
    if (p.r >= POOL_BIG) { ctx.fillStyle = 'rgba(255,205,215,.2)'; ctx.beginPath(); ctx.ellipse(p.x - p.r * .3, p.y - p.r * .4, p.r * .2, p.r * .1, -.5, 0, TAU); ctx.fill(); }   // brilho de líquido
  }
  for (const s of prints) {
    if (s.x < x0 || s.y < y0 || s.x > x1 || s.y > y1) continue;
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.fillStyle = `rgba(${s.rgb},${s.a.toFixed(3)})`;
    ctx.beginPath(); ctx.ellipse(1.5, 0, 5, 3.1, 0, 0, TAU); ctx.fill();   // sola
    ctx.beginPath(); ctx.ellipse(-5, 0, 2.5, 2.3, 0, 0, TAU); ctx.fill();   // calcanhar
    ctx.restore();
  }
}
function addDecal(x, y, r) { decals.push({ x, y, r, a: rnd(.35, .7) }); if (decals.length > 360) decals.shift(); }
function kill(f, src) {
  f.dead = true; f.hp = 0;
  for (let i = 0; i < 12; i++) addDecal(f.x + rnd(-18, 18), f.y + rnd(-18, 18), rnd(3, 9));
  unholster(f); dropWeapon(f);
  if (f.isPlayer) { if (training || !M) setState('dead'); shake = 10; }   // em partida: fica eliminado e espectando até a rodada acabar
  else { f.respawnT = 4; if (src && src.isPlayer) { kills++; killT = 0; cmbN = 0; cmbT = 0; } }   // abate: aparece a caveira vermelha e o combo some
}

function shoot(f, w) {
  if (TUT && f.isPlayer) { TUT.c.shots++; if (f.cover && f.peekK > .5) TUT.c.peek++; }
  f.fireCd = w.rate; f.mag--; f.kick = w.kick; f.flash = .06;
  sfxGun(f.weapon, f.isPlayer || !player ? 1 : clamp(1 - Math.hypot(f.x - player.x, f.y - player.y) / 900, .15, 1));   // som próprio de cada arma (mais baixo se o atirador está longe)
  if (NET.online && NET.host) NET.ev.push(['s', f.weapon, Math.round(f.x), Math.round(f.y)]);
  const m = toWorld(f, holdX(w) + w.muzzle, 0); m.x += f.coverOff.x; m.y += f.coverOff.y;
  for (let i = 0; i < w.pellets; i++) {
    const sp = (f.cover ? (f.peekK > .5 ? 0 : w.spread + .1) : w.spread) * f.mAim, a = f.angle + rnd(-sp, sp);   // espiando: 100% de precisão | tiro cego: dispersão extra
    if (!sweepShot(f, a, m, w)) { const tr = { pts: [{ x: m.x, y: m.y, t: btClock }] }; btrails.push(tr); bullets.push({ id: ++NETBID, x: m.x, y: m.y, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed, dmg: w.dmg, owner: f, life: w.life, tr }); }
  }
  const e = toWorld(f, holdX(w) + 8, lefty(f) ? -5 : 5);
  casings.push({ x: e.x, y: e.y, vx: Math.cos(f.angle + (lefty(f) ? -1.5 : 1.5)) * rnd(60, 130), vy: Math.sin(f.angle + (lefty(f) ? -1.5 : 1.5)) * rnd(60, 130), rot: rnd(0, TAU), vr: rnd(-15, 15), life: .9, big: w.pellets > 1 });
  f.vx -= Math.cos(f.angle) * w.kick * 6; f.vy -= Math.sin(f.angle) * w.kick * 6;
  if (f.isPlayer) { shake = Math.max(shake, w.kick * .7); input.buffer = 0; } else if (f.remote) f.rbuf = 0;
  if (f.mag === 0 && f.reserve > 0) { f.reloadT = f.reloadMax = w.reload * f.mRel; }
}

/* Tiro à queima-roupa: o cano fica longe do corpo, então confere o trecho corpo -> cano antes de criar a bala */
function sweepShot(f, a, m, w) {
  const sx = f.x + f.coverOff.x, sy = f.y + f.coverOff.y, n = Math.ceil(Math.hypot(m.x - sx, m.y - sy) / 6);
  for (let i = 1; i <= n; i++) {
    const x = sx + (m.x - sx) * i / n, y = sy + (m.y - sy) * i / n;
    const hc = shotHit(x, y, f); if (hc) { if (hc.k === 'glass') glassHit(hc, x, y); return true; }
    for (const e of enemiesOf(f)) if (!iframes(e) && Math.hypot(e.x - x, e.y - y) < hitR(e)) { damage(e, w.dmg * (f.isPlayer || f.remote ? 1 : DIFFS[cfg.diff].dmg), a, f, 'gun'); return true; }
  }
  return false;
}
/* Arremesso: a arma sai girando; quem for atingido fica nocauteado por um tempo */
function throwWeapon(f) {
  if (TUT && f.isPlayer) TUT.c.thr++;
  const a = f.angle;
  thrown.push({ x: f.x + Math.cos(a) * 22, y: f.y + Math.sin(a) * 22,
    vx: Math.cos(a) * C.throwSpeed + f.vx * .3, vy: Math.sin(a) * C.throwSpeed + f.vy * .3,
    rot: a, spin: (Math.random() < .5 ? -1 : 1) * 24, key: f.weapon, mag: f.mag, reserve: f.reserve,
    owner: f, hits: new Set(), done: false });
  f.weapon = null; f.reloadT = 0; f.swing = -1; f.kick = 0; f.throwCd = .3;
  f.vx -= Math.cos(a) * 70; f.vy -= Math.sin(a) * 70;           // pequeno recuo do arremesso
  if (f.isPlayer) shake = Math.max(shake, 2.5);
}
function landThrown(t) {
  t.done = true;
  if (WEAPONS[t.key].melee || t.mag + t.reserve > 0)
    pickups.push({ x: t.x, y: t.y, key: t.key, mag: t.mag, reserve: t.reserve, t: rnd(0, 6) });   // vira item no chão
  else for (let i = 0; i < 4; i++) sparks.push({ x: t.x, y: t.y, vx: rnd(-90, 90), vy: rnd(-90, 90), life: .6 });   // arma vazia some
}
function hitByThrown(t, f) {
  if (TUT && f.dummy && t.owner.isPlayer) TUT.c.thrHit++;
  t.hits.add(f);
  const a = Math.atan2(t.vy, t.vx);
  f.stun = f.stunMax = C.throwStun * f.mTgh; f.fallDir = Math.random() < .5 ? -1 : 1; f.hitFlash = .12;
  f.vx += Math.cos(a) * 240; f.vy += Math.sin(a) * 240;
  rings.push({ x: f.x, y: f.y, r: 8, life: 1, heavy: true });
  for (let i = 0; i < 8; i++) { const b = a + rnd(-.9, .9), sp = rnd(160, 380); sparks.push({ x: f.x, y: f.y, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp, life: 1 }); }
  if (f.isPlayer) { shake = Math.max(shake, 9); dmgFlash = .3; }
  else if (t.owner.isPlayer) { shake = Math.max(shake, 6); hitStop = .06; }
  t.vx = -t.vx * .3 + rnd(-70, 70); t.vy = -t.vy * .3 + rnd(-70, 70);   // ricocheteia
}
function updateThrown(dt) {
  for (const t of thrown) {
    const steps = Math.max(1, Math.ceil(Math.hypot(t.vx, t.vy) * dt / 8));
    for (let s = 0; s < steps; s++) {
      const nx = t.x + t.vx * dt / steps, ny = t.y + t.vy * dt / steps;
      if (nx < 14 || ny < 14 || nx > WW - 14 || ny > WH - 14 || inCrate(nx, ny)) { t.vx = t.vy = 0; break; }   // bateu: cai
      t.x = nx; t.y = ny;
      if (Math.hypot(t.vx, t.vy) > C.throwMinHit)
        for (const f of allF())
          if (!f.dead && f !== t.owner && f.team !== t.owner.team && !t.hits.has(f) && Math.hypot(f.x - t.x, f.y - t.y) < f.r + 7) { hitByThrown(t, f); break; }
    }
    const sp = Math.hypot(t.vx, t.vy), k = Math.exp(-C.throwDrag * dt);
    t.vx *= k; t.vy *= k; t.rot += t.spin * dt * Math.min(sp / 300, 1);
    if (sp < 90) landThrown(t);
  }
  thrown = thrown.filter(t => !t.done);
}

function updateFighter(f, dt, it) {
  f.cooldown = Math.max(0, f.cooldown - dt); f.comboTimer = Math.max(0, f.comboTimer - dt);
  if (!f.comboTimer) f.combo = 0;
  f.kick = Math.max(0, f.kick - dt * 70); f.flash = Math.max(0, f.flash - dt); f.hitFlash = Math.max(0, f.hitFlash - dt);
  if (f.stun > 0) {   // nocauteado: sem controle até se recuperar
    f.stun -= dt; it = { mx: 0, my: 0, aim: f.angle, fire: false, punch: false, reload: false, throw: false };
    f.punch.left.t = f.punch.right.t = -1; f.swing = -1; f.reloadT = 0; f.twist = 0; f.slideT = 0; f.slideX = 0;
  }
  if (f.stag > 0) {   // atordoado pela batida do deslize: paralisado e totalmente exposto (sem andar, mirar, atirar, socar, recarregar ou deslizar)
    f.stag -= dt; it = { mx: 0, my: 0, aim: f.angle, fire: false, punch: false, reload: false, throw: false, slide: false, holster: false };
    f.punch.left.t = f.punch.right.t = -1; f.swing = -1; f.reloadT = 0; f.twist = 0; f.slideT = 0; f.slideX = 0;
    if (f.stag <= 0) f.stag = 0;
  }
  if (f.micro > 0) {   // desequilíbrio: levou uma trombada de deslize; por um instante não ataca, não recarrega nem se move (mira livre)
    f.micro = Math.max(0, f.micro - dt); it = Object.assign({}, it, { mx: 0, my: 0, fire: false, punch: false, reload: false, throw: false, slide: false });
    f.punch.left.t = f.punch.right.t = -1; f.swing = -1; f.reloadT = 0; f.twist = 0;
  }
  // Deslize tático: correndo + tecla = desliza em linha reta; ao acabar, só levanta quando sair de dentro de obstáculo baixo
  if (!(f.stag > 0)) f.slideCd = Math.max(0, f.slideCd - dt);   // depois de bater, a recarga só começa quando o atordoamento acaba
  if (f.slideT > 0) {
    f.slideT -= dt;
    if (f.slideT <= 0) {
      if (f.slideX > 0 && overLow(f)) { f.slideT = .05; f.slideX -= .05; }
      else { f.slideT = 0; f.slideX = 0; const sv = Math.hypot(f.vx, f.vy); if (sv > f.speed) { f.vx *= f.speed / sv; f.vy *= f.speed / sv; } }
    }
  }
  if (it.holster) toggleHolster(f);
  f.drawT = Math.max(0, f.drawT - dt);
  if (f.drawT > 0) it = Object.assign({}, it, { fire: false, reload: false });   // sacando a arma: ainda não dá para atirar
  if (it.slide && f.slideT <= 0 && f.slideCd <= 0 && f.stun <= 0 && !f.dead) {
    let dx = it.mx, dy = it.my, l = Math.hypot(dx, dy);
    if (l < .3) { dx = f.vx; dy = f.vy; l = Math.hypot(dx, dy); if (l < f.speed * .4) l = 0; }   // só desliza se estiver correndo
    if (l > 0) {   // só dá para deslizar para a frente ou nas diagonais da frente (±45°): para trás e para os lados não
      const rel = angDiff(Math.atan2(dy, dx), f.angle);
      if (Math.abs(rel) > Math.PI * .375) l = 0;   // mais de 67,5° fora da frente (lado ou trás): bloqueado
      else { const q = Math.round(rel / (Math.PI / 4)) * (Math.PI / 4) + f.angle; dx = Math.cos(q); dy = Math.sin(q); l = 1; }   // encaixa em frente / diagonal esquerda / diagonal direita
    }
    if (l > 0) {
      f.slideT = SLIDE.dur; f.slideCd = f.slideCdMax = SLIDE.cd; f.slideHits = new Set(); f.slideX = .35; f.slideDx = dx / l; f.slideDy = dy / l;
      if (f.cover) { f.cover = null; f.isCovered = false; f.coverOff = { x: 0, y: 0 }; f.peekK = 0; }   // sai da cobertura
      if (f.isPlayer) { shake = Math.max(shake, 3); input.buffer = 0; }
      if (f.isPlayer || !player || Math.hypot(f.x - player.x, f.y - player.y) < 700) sfxSlide();
    }
  }
  if (f.slideT > 0) it = Object.assign({}, it, { fire: false, punch: false, throw: false, reload: false });   // deslizando: sem atirar, socar ou arremessar
  f.throwCd = Math.max(0, f.throwCd - dt);
  f.angle = it.aim;

  // Movimento
  let { mx, my } = it; const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
  if (f.slideT > 0) { const q = .45 + .55 * clamp(f.slideT / SLIDE.dur, 0, 1); f.vx = f.slideDx * SLIDE.speed * q; f.vy = f.slideDy * SLIDE.speed * q; }   // direção travada, desacelerando
  else {
    f.vx = approach(f.vx, mx * f.speed, (mx ? C.accel : C.friction) * f.mAgi * dt);
    f.vy = approach(f.vy, my * f.speed, (my ? C.accel : C.friction) * f.mAgi * dt);
  }
  f.x += f.vx * dt; f.y += f.vy * dt;
  f.walk += Math.hypot(f.vx, f.vy) * dt * .065;     // fase da caminhada
  collide(f);

  if (it.throw && f.weapon && f.throwCd <= 0) throwWeapon(f);   // arremessar a arma

  // Arma / soco
  if (f.weapon && !WEAPONS[f.weapon].knuckle) {
    const w = WEAPONS[f.weapon]; f.fireCd = Math.max(0, f.fireCd - dt);
    if (w.melee) {   // Machado: golpe em arco
      if (f.swing >= 0) {
        f.swing += dt / w.swingDur;
        if (f.swing > .25 && f.swing < .7)
          for (const e of enemiesOf(f)) {
            if (e.dead || f.swingHits.has(e)) continue;
            const dx = e.x - f.x, dy = e.y - f.y, d = Math.hypot(dx, dy);
            if (d < w.range + e.r && Math.abs(angDiff(Math.atan2(dy, dx), f.angle)) < 1) {
              f.swingHits.add(e); const a = Math.atan2(dy, dx);
              if (f.isPlayer) { hitStop = .07; shake = Math.max(shake, 8); }
              for (let i = 0; i < 8; i++) { const sp = rnd(160, 420), b = a + rnd(-.8, .8); sparks.push({ x: e.x - Math.cos(a) * 10, y: e.y - Math.sin(a) * 10, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp, life: 1 }); }
              e.vx += Math.cos(a) * 260; e.vy += Math.sin(a) * 260;
              damage(e, w.dmg, a, f, weaponKind(f.weapon));
            }
          }
        if (f.swing >= 1) f.swing = -1;
      }
      if (it.fire && f.fireCd <= 0 && f.swing < 0) {
        f.swing = 0; f.swingHits.clear(); f.fireCd = w.rate; sfxSwing();
        f.vx += Math.cos(f.angle) * 140; f.vy += Math.sin(f.angle) * 140;
      }
    } else {
      if (f.reloadT > 0) { f.reloadT -= dt; if (f.reloadT <= 0) { const n = Math.min(w.mag - f.mag, f.reserve); f.mag += n; f.reserve -= n; } }
      else if (it.reload && f.mag < w.mag && f.reserve > 0) f.reloadT = f.reloadMax = w.reload * f.mRel;
      else if (it.fire && f.fireCd <= 0) { if (f.mag > 0) shoot(f, w); else if (f.reserve > 0) f.reloadT = f.reloadMax = w.reload * f.mRel; }
      if (!f.isPlayer && !f.remote && !f.mag && !f.reserve && f.reloadT <= 0) { f.emptyT += dt; if (f.emptyT > .7) f.weapon = null; } else f.emptyT = 0;
    }
  } else if (it.punch) tryPunch(f);

  // Animação e acerto dos socos
  let tw = 0;
  if (f.weapon && !WEAPONS[f.weapon].melee) tw = lefty(f) ? .36 : -.36;   // ao mirar, o ombro direito vai à frente
  for (const hand of ['left', 'right']) {
    const p = f.punch[hand]; if (p.t < 0) continue;
    p.t += dt / C.punchDuration;
    if (p.t < .75) tw = (hand === 'left' ? 1 : -1) * (p.heavy ? .75 : .5);
    const fl = fistLocal(f, hand), w = toWorld(f, fl.x, fl.y);
    if (fl.ext > .4) trail.push({ x: w.x, y: w.y, life: 1, heavy: p.heavy });
    if (!p.fx && p.t >= .3) {
      p.fx = true; if (f.isPlayer) shake = Math.max(shake, p.heavy ? 7 : 3.5);
      rings.push({ x: w.x, y: w.y, r: 6, life: 1, heavy: p.heavy });
    }
    if (p.t >= .2 && p.t <= .44 && !p.landed)
      for (const e of enemiesOf(f))
        if (!e.dead && Math.hypot(e.x - w.x, e.y - w.y) < e.r + C.hitRadius * (p.heavy ? 1.4 : 1)) {
          p.landed = true; if (f.isPlayer) hitStop = .05;
          for (let i = 0; i < (p.heavy ? 9 : 5); i++) { const a = f.angle + rnd(-.7, .7), s = rnd(160, 400); sparks.push({ x: w.x, y: w.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1 }); }
          damage(e, (f.weapon && WEAPONS[f.weapon].knuckle && hand === domHand(f) ? Math.max(f.punchDmg * WEAPONS[f.weapon].punchMul, WEAPONS[f.weapon].dmg) : f.punchDmg) * (p.heavy ? 1.5 : 1), f.angle, f, (f.weapon && WEAPONS[f.weapon].knuckle && hand === domHand(f)) ? 'blunt' : 'fist'); break;
        }
    if (p.t >= 1) p.t = -1;
  }
  f.twist += (tw - f.twist) * (1 - Math.exp(-dt * 28));
}

/* Colisão com caixotes, bordas e outros lutadores */
/* Batida do deslize: ao bater com força numa estrutura (caixote ou borda do mapa) o personagem para de vez, treme a tela, e fica atordoado
   de 0,8 s (mais resistente) a 1,0 s (menos resistente) sem poder fazer nada. A recarga do deslize só começa depois, e leva o dobro do tempo
   (de 1,4 s nos ágeis a 2,1 s nos pesados). Os dois tempos variam com os atributos RESISTÊNCIA e AGILIDADE do personagem. */
function slideCrash(f) {
  const st = k => (f.pal && f.pal.st && f.pal.st[k]) || 5;
  const dx = f.slideDx, dy = f.slideDy;
  f.slideT = 0; f.slideX = 0; f.vx = -dx * 90; f.vy = -dy * 90;   // para na hora e é jogado um pouco para trás
  f.stag = 1 - (st('tgh') - 1) / 9 * .2;
  f.slideCdMax = f.slideCd = SLIDE.cd * 2 * (1 - (st('agi') - 5) * .06);
  f.punch.left.t = f.punch.right.t = -1; f.swing = -1; f.reloadT = 0; f.hitFlash = .12;
  const near = f.isPlayer || !player || Math.hypot(f.x - player.x, f.y - player.y) < 700;
  if (near) { sfxCrash(); shake = Math.max(shake, f.isPlayer ? 14 : 7); }
  for (let i = 0; i < 9; i++) { const a = Math.atan2(-dy, -dx) + rnd(-1.2, 1.2), sp = rnd(70, 220); sparks.push({ x: f.x + dx * f.r, y: f.y + dy * f.r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .6 }); }
}
/* Trombada do deslize: acertar um inimigo deslizando causa um micro-atordoamento de 0,5 a 0,7 s, que interrompe a recarga, o soco, o golpe ou o tiro dele.
   Não causa dano, e cada deslize só desequilibra o mesmo inimigo uma vez. */
function slideBump(f, o) {
  f.slideHits.add(o);
  o.micro = rnd(.5, .7); o.reloadT = 0; o.swing = -1; o.punch.left.t = o.punch.right.t = -1; o.twist = 0; o.fireCd = Math.max(o.fireCd, .3); o.hitFlash = .1;
  o.vx += f.slideDx * 120; o.vy += f.slideDy * 120;   // um empurrãozinho no sentido do deslize
  if (f.isPlayer || o.isPlayer) { shake = Math.max(shake, 6); sfxBump(); }
}
function collide(f) {
  const sl = f.slideT > 0 && !(NET.online && !NET.host); let crash = false;   // só quem manda na partida decide a batida
  const ox = f.x, oy = f.y;
  const PD = (curMap && curMap.pad) || 20; f.x = clamp(f.x, PD, WW - PD); f.y = clamp(f.y, PD, WH - PD);
  if (sl && ((f.x - ox) * f.slideDx < -.2 || (f.y - oy) * f.slideDy < -.2)) crash = true;   // bateu na borda do mapa
  for (const c of crates) {
    if (f.slideT > 0 && LOW[c.k]) continue;   // deslizando: passa por baixo/por cima dos obstáculos baixos
    const cx = clamp(f.x, c.x, c.x + c.w), cy = clamp(f.y, c.y, c.y + c.h);
    let dx = f.x - cx, dy = f.y - cy, d = Math.hypot(dx, dy);
    if (d < f.r) {
      if (sl && (d <= .001 || (dx / d) * f.slideDx + (dy / d) * f.slideDy < -.35)) crash = true;   // bateu de frente na estrutura
      if (d > .001) { f.x += dx / d * (f.r - d); f.y += dy / d * (f.r - d); }
      else { const m = [f.x - c.x, c.x + c.w - f.x, f.y - c.y, c.y + c.h - f.y], i = m.indexOf(Math.min(...m));
        if (i === 0) f.x = c.x - f.r; else if (i === 1) f.x = c.x + c.w + f.r; else if (i === 2) f.y = c.y - f.r; else f.y = c.y + c.h + f.r; }
    }
  }
  if (crash && !f.dead) slideCrash(f);
  for (const o of allF()) {
    if (o === f || o.dead) continue;
    const dx = f.x - o.x, dy = f.y - o.y, d = Math.hypot(dx, dy);
    if (sl && d < f.r * 2 + 4 && o.team !== f.team && o.slideT <= 0 && !iframes(o) && f.slideHits && !f.slideHits.has(o)) slideBump(f, o);   // trombada do deslize
    if (d < f.r * 2 && d > .001) { const push = (f.r * 2 - d) / 2; f.x += dx / d * push; f.y += dy / d * push; }
  }
}

/* ------------------------------ INTENÇÕES ----------------------------- */
