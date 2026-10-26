/* Sala de 4 dígitos: o anfitrião registra o ID "outcome-game-XXXX" e os outros se conectam a ele. Funciona no GitHub Pages (sem servidor próprio). */
const PFX = 'outcome-game-';
function netReset() { try { if (NET.peer) NET.peer.destroy(); } catch (e) {} const hadW = !!NET.world;
  Object.assign(NET, { peer: null, conns: {}, host: false, code: '', players: [], me: null, msg: '', busy: false, snap: null, others: null, copied: false,
    online: false, cl: false, ci: 0, all: [], guests: [], rin: {}, ev: [], mid: 0, acc: 0, ia: 0, rd: -1, lb: 0, aim: 0, myTeam: 0, pick: null, world: null, sel: null, cnt: { clk: 0, it: 0, th: 0, rl: 0, cv: 0, sl: 0, hs: 0 } });
  if (hadW) resize();   // volta ao tamanho de mundo da própria tela
}
const netSend = (c, m) => { try { if (c && c.open) c.send(m); } catch (e) {} };
const netAll = m => { for (const id in NET.conns) netSend(NET.conns[id], m); };
const roomSync = () => netAll({ t: 'room', players: NET.players, snap: NET.snap });
function netAbort(err) { netReset(); NET.err = err; setState('join'); }
function leaveRoom() { const h = NET.host; netReset(); setState(h ? 'setup' : 'modes'); }
function createRoom() {
  cfg.bt = botsSetup ? 1 : 0; netReset(); Object.assign(NET, { bgT: 0, host: true, err: '', msg: 'CRIANDO SALA...', busy: true, me: 'host', cap: cfg.team > 0 ? cfg.team * 2 : 8,
    snap: { team: cfg.team, mode: cfg.mode, pts: cfg.pts, time: cfg.time, loot: cfg.loot, diff: cfg.diff, bots: cfg.bots, bg: bgSetup ? 1 : 0, rn: (cfg.roomName || '').trim().slice(0, 16) }, players: [{ id: 'host', char: cfg.char, ready: false, team: -1 }] });
  setState('room');
  if (typeof Peer === 'undefined') { NET.err = 'SEM CONEXÃO COM O SERVIDOR ONLINE'; NET.busy = false; return; }
  openRoom(0);
}
function openRoom(tries) {
  const code = String(Math.floor(Math.random() * 10000)).padStart(4, '0'); let p;
  try { p = new Peer(PFX + code); } catch (e) { NET.err = 'FALHA AO CRIAR A SALA'; NET.busy = false; return; }
  NET.peer = p;
  p.on('open', () => { if (NET.peer !== p) return; NET.code = code; NET.busy = false; NET.msg = ''; });
  p.on('error', e => { if (NET.peer !== p) return; if (e.type === 'unavailable-id' && tries < 8) { try { p.destroy(); } catch (x) {} openRoom(tries + 1); } else { NET.err = 'ERRO DE CONEXÃO (' + e.type + ')'; NET.busy = false; } });
  p.on('connection', c => { c.on('data', m => hostRecv(c, m)); c.on('close', () => hostDrop(c.peer)); });
}
function hostRecv(c, m) {
  if (!m || typeof m !== 'object') return; const id = c.peer;
  if (m.t === 'hello') {
    if ((NET.sel || NET.online) && !NET.players.some(p => p.id === id)) { netSend(c, { t: 'busy' }); setTimeout(() => { try { c.close(); } catch (e) {} }, 300); return; }
    if (NET.players.length >= NET.cap && !NET.players.some(p => p.id === id)) { netSend(c, { t: 'full' }); setTimeout(() => { try { c.close(); } catch (e) {} }, 300); return; }
    NET.conns[id] = c; if (!NET.players.some(p => p.id === id)) NET.players.push({ id, char: clamp(+m.char | 0, 0, CHARS.length - 1), ready: false, team: -1 });
    roomSync();
  } else if (m.t === 'ready') { const p = NET.players.find(q => q.id === id); if (p && (!(NET.snap && NET.snap.team > 0) || p.team >= 0)) { p.ready = !!m.v; roomSync(); } }
  else if (m.t === 'team') setTeamOf(id, m.v | 0);
  else if (m.t === 'swap') swapTeams(id, String(m.with));
  else if (m.t === 'vote') selVote(id, m.v);
  else if (m.t === 'pick') selPick(id, m.c);
  else if (m.t === 'in' && NET.rin[id]) { const r = NET.rin[id], c = v => clamp(+v || 0, -2, 2); Object.assign(r, { mx: c(m.mx), my: c(m.my), aim: +m.aim || 0, down: !!m.down, pk: !!m.pk, clk: m.clk | 0, it: m.it | 0, th: m.th | 0, rl: m.rl | 0, cv: m.cv | 0, sl: m.sl | 0, hs: m.hs | 0 }); }
}
function hostDrop(id) { delete NET.conns[id]; NET.players = NET.players.filter(p => p.id !== id); if (NET.sel) selDrop(id); if (NET.online) { NET.guests = NET.guests.filter(g => g.id !== id); for (const b of bots) if (b.cid === id) b.remote = false; } roomSync(); }   // quem sai no meio da partida vira bot
function kickPlayer(id) { const c = NET.conns[id]; if (c) { netSend(c, { t: 'kick' }); setTimeout(() => { try { c.close(); } catch (e) {} }, 300); } hostDrop(id); }
function joinRoom(code) {
  netReset(); Object.assign(NET, { err: '', msg: 'CONECTANDO...', busy: true, code });
  if (typeof Peer === 'undefined') { NET.err = 'SEM CONEXÃO COM O SERVIDOR ONLINE'; NET.busy = false; return; }
  let p, opened = false; try { p = new Peer(); } catch (e) { NET.err = 'FALHA AO CONECTAR'; NET.busy = false; return; }
  NET.peer = p;
  const fail = s => { if (opened || NET.peer !== p) return; netReset(); NET.err = s; };
  const to = setTimeout(() => fail('SALA NÃO ENCONTRADA'), 9000);
  p.on('error', e => { clearTimeout(to); fail(e.type === 'peer-unavailable' ? 'SALA NÃO ENCONTRADA' : 'ERRO DE CONEXÃO'); });
  p.on('open', id => {
    NET.me = id; const c = p.connect(PFX + code, { reliable: true }); NET.conns.host = c;
    c.on('open', () => { clearTimeout(to); opened = true; netSend(c, { t: 'hello', char: cfg.char }); });
    c.on('data', clientRecv);
    c.on('close', () => { if (NET.peer === p) netAbort('O ANFITRIÃO FECHOU A SALA'); });
  });
}
function clientRecv(m) {
  if (!m) return;
  if (m.t === 'room') { NET.players = m.players; NET.snap = m.snap; NET.msg = ''; NET.busy = false; if (state === 'join') setState('room'); }
  else if (m.t === 'kick') netAbort('VOCÊ FOI REMOVIDO DA SALA');
  else if (m.t === 'full') netAbort('SALA CHEIA');
  else if (m.t === 'busy') netAbort('PARTIDA EM ANDAMENTO');
  else if (m.t === 'sel') { if (!NET.online) { NET.sel = m.s; if (state !== 'pick') setState('pick'); } }
  else if (m.t === 'start') startOnline(m);
  else if (m.t === 's') applySnap(m);
}
/* Salas predefinidas (1v1..4v4): cada jogador escolhe um lado (0 = verde, 1 = vermelho). Quem entra começa sem time. */
const teamCount = t => NET.players.filter(p => p.team === t).length;
function setTeamOf(id, t) {   // anfitrião: coloca o jogador numa vaga livre do time
  const p = NET.players.find(q => q.id === id); if (!p || !NET.snap || NET.snap.team <= 0 || (t !== 0 && t !== 1) || p.team === t || teamCount(t) >= NET.snap.team) return;
  p.team = t; p.ready = false; roomSync();
}
function swapTeams(a, b) {   // anfitrião: dois jogadores de times opostos trocam de lado
  const pa = NET.players.find(q => q.id === a), pb = NET.players.find(q => q.id === b);
  if (!pa || !pb || !(pa.team >= 0) || !(pb.team >= 0) || pa.team === pb.team) return;
  const t = pa.team; pa.team = pb.team; pb.team = t; pa.ready = pb.ready = false; roomSync();
}
function chooseTeam(t) { NET.pick = null; if (NET.host) setTeamOf('host', t); else netSend(NET.conns.host, { t: 'team', v: t }); }
function requestSwap(id) { NET.pick = null; if (NET.host) swapTeams('host', id); else netSend(NET.conns.host, { t: 'swap', with: id }); }
function toggleReady() {
  const me = NET.players.find(p => p.id === NET.me); if (!me) return;
  if (NET.snap && NET.snap.team > 0 && !(me.team >= 0)) return;   // sem time não dá para ficar pronto
  if (NET.host) { me.ready = !me.ready; roomSync(); } else netSend(NET.conns.host, { t: 'ready', v: !me.ready });
}
function bgStatus() {   // texto de estado do lobby do CAMPO DE BATALHA
  const s = NET.snap || {}, n = NET.players.length, rc = NET.players.filter(p => p.ready).length;
  if (s.cd > 0) return { t: 'COMEÇANDO EM ' + s.cd + '...', c: '#8fd6a4' };
  if (n + (s.bots || 0) < 2) return { t: 'PRECISA DE PELO MENOS 2 LUTADORES', c: '#ffd23f' };
  return { t: `AGUARDANDO TODOS FICAREM PRONTOS (${rc}/${n})`, c: '#8a8a96' };
}
function bgTick(dt) {   // anfitrião: todos prontos -> contagem de 3 s -> seleção de mapa e personagem
  if (!NET.host || !NET.snap || !NET.snap.bg || NET.sel || NET.online || NET.err || NET.busy) return;
  const n = NET.players.length, ok = n > 0 && NET.players.every(p => p.ready) && n + (NET.snap.bots || 0) >= 2;
  if (!ok) { if (NET.bgT) { NET.bgT = 0; NET.snap.cd = 0; roomSync(); } return; }
  if (!NET.bgT) NET.bgT = 3;
  NET.bgT -= dt; const cd = Math.max(0, Math.ceil(NET.bgT));
  if (NET.bgT <= 0) { NET.bgT = 0; NET.snap.cd = 0; startRoom(); return; }
  if (NET.snap.cd !== cd) { NET.snap.cd = cd; roomSync(); }
}
function startRoom() {
  if (!NET.host || !NET.players.length || !NET.players.every(p => p.ready && (NET.snap.team <= 0 || p.team >= 0))) return;
  selStart();   // mapa e personagem agora são escolhidos por todos, depois que a sala começa
}
function startOnline(m) {   // todos entram na mesma partida: o anfitrião simula, os convidados recebem o jogo pela rede
  Object.assign(cfg, m.snap); cfg.map = m.map; soloSetup = false; training = false;
  { const mi0 = m.ids.indexOf(NET.me); if (mi0 >= 0 && m.chars[mi0] >= 0) cfg.char = m.chars[mi0]; }   // personagem que você escolheu na seleção
  NET.online = true; NET.mid = 0; NET.ci = Math.max(0, m.ids.indexOf(NET.me));
  const ht = m.teams ? m.teams[m.ids.indexOf('host')] : 0;   // o time do anfitrião vira o time 0 da simulação
  NET.guests = m.ids.map((id, i) => ({ id, char: m.chars[i], ci: i, st: m.teams && cfg.team > 0 ? (m.teams[i] === ht ? 0 : 1) : null })).filter(g => g.id !== 'host');
  if (NET.host) { NET.rin = {}; NET.guests.forEach(g => NET.rin[g.id] = { mx: 0, my: 0, aim: 0, down: false, pk: false, clk: 0, it: 0, th: 0, rl: 0, cv: 0, sl: 0, hs: 0 }); startMatch(); return; }
  NET.cl = true; NET.world = m.world; WW = m.world.w; WH = m.world.h; curMap = MAPS[m.map]; buildCrates();
  M = { round: 0, map: m.map, room: cfg.team, team: cfg.team > 0, sc: [0, 0], target: 0, time: 0, phase: '', phaseT: 0, left: 0, flashT: 0, last: null, beep: -1 };
  decals = []; puddles = []; prints = []; pools.clear(); thrown = []; bullets = []; pickups = []; casings = []; trail = []; btrails = []; rings = []; sparks = []; kills = 0; dmgFlash = 0; shake = 0;
  matchTrack = cfg.music ? cfg.music - 1 : pickTrack();
  player = makeFighter({ isPlayer: true, pal: CHARS[cfg.char], x: WW / 2, y: WH / 2 }); player.tx = player.x; player.ty = player.y; player.ta = 0; bots = []; NET.all = [player]; NET.rd = -1;
  touch.ang = 0; updateCam(); setState('play');
}
/* ---- SELEÇÃO ANTES DA PARTIDA: votação de mapa e escolha de personagem (o anfitrião decide; todos clicam) ---- */
const SEL_MAP_T = 12, SEL_CHAR_T = 25, ROLL_T = 2.6, SLOTS = Array.from({ length: 27 }, (_, q) => { const i = q < 13 ? q : q - 1; return q === 13 ? -1 : i < CHARS.length ? i : -2; })   /* 26 vagas de personagem + o aleatório no meio; -2 = vaga vazia */, PCOL = ['#8fd6a4', '#ff7a6b', '#7ac7ff', '#ffd23f', '#d79bff', '#ffa24d', '#5de0d0', '#f48fb1'];
const MSLOTS = Array.from({ length: 27 }, (_, q) => { const i = q < 13 ? q : q - 1; return q === 13 ? -1 : i < MAPS.length ? i : -2; });   // mesma grade do personagem: 26 vagas de mapa + o aleatório no meio; -2 = vaga vazia
const pname = id => id === 'host' ? 'ANFITRIÃO' : 'JOGADOR ' + (Math.max(1, NET.players.findIndex(q => q.id === id)) + 1);
const pcol = id => { const p = NET.players.find(q => q.id === id); if (NET.snap && NET.snap.team > 0 && p && p.team >= 0) return p.team ? '#ff7a6b' : '#8fd6a4'; return PCOL[Math.max(0, NET.players.findIndex(q => q.id === id)) % PCOL.length]; };
const pickAvail = s => { const t = Object.values(s.conf); return CHARS.map((_, i) => i).filter(i => !t.includes(i)); };
const selPack = () => { const s = NET.sel; return { ph: s.ph, t: +s.t.toFixed(2), dur: s.dur, votes: s.votes, marks: s.marks, conf: s.conf, ids: s.ids, map: s.map, mr: s.mr, roll: s.roll ? { who: s.roll.who, cur: s.roll.cur, done: s.roll.done } : 0 }; };
const selSync = () => { if (NET.sel && NET.host) netAll({ t: 'sel', s: selPack() }); };
function selStart() {   // anfitrião: abre a votação de mapa para todos da sala
  NET.sel = { ph: 'map', t: 0, dur: SEL_MAP_T, votes: {}, marks: {}, conf: {}, ids: NET.players.map(p => p.id), map: -1, mr: false, roll: 0, acc: 0 };
  setState('pick'); selSync();
}
function selVote(id, v) { const s = NET.sel; if (!s || s.ph !== 'map' || !s.ids.includes(id)) return; v |= 0; if (v < 0 || v > MAPS.length) return; s.votes[id] = v; selSync(); }
function selPick(id, c) {   // 1º clique marca, 2º clique no mesmo confirma; personagem confirmado fica bloqueado para os outros
  const s = NET.sel; if (!s || s.ph !== 'char' || !s.ids.includes(id) || s.conf[id] !== undefined) return;
  c |= 0; if (c < -1 || c >= CHARS.length) return;
  if (c >= 0 && Object.values(s.conf).includes(c)) return;
  if (s.marks[id] === c) { s.conf[id] = c; delete s.marks[id]; if (c >= 0) for (const k in s.marks) if (s.marks[k] === c) delete s.marks[k]; }
  else s.marks[id] = c;
  selSync();
}
function selDrop(id) {   // quem sai no meio da seleção deixa de contar
  const s = NET.sel; if (!s) return;
  s.ids = s.ids.filter(x => x !== id); delete s.votes[id]; delete s.marks[id]; delete s.conf[id];
  if (s.ph === 'roll' && s.roll && s.roll.who === id) rollNext();
  selSync();
}
function selMapDone() {   // maioria decide; sem votos ou ALEATÓRIO na frente = sorteio; empate sorteia entre os empatados
  const s = NET.sel, c = new Array(MAPS.length + 1).fill(0); for (const id of s.ids) if (s.votes[id] !== undefined) c[s.votes[id]]++;
  const mx = Math.max(...c), top = mx ? c.map((n, i) => n === mx ? i : -1).filter(i => i >= 0) : [MAPS.length], w = top[Math.floor(Math.random() * top.length)];
  s.mr = w >= MAPS.length; s.map = s.mr ? Math.floor(Math.random() * MAPS.length) : w;
  s.ph = 'mapres'; s.t = 0; s.dur = 2.4; selSync();
}
function selCharDone() {   // acabou o tempo (ou todos confirmaram): o marcado vale; sem marca livre vira aleatório
  const s = NET.sel;
  for (const id of s.ids) if (s.conf[id] === undefined) { const m = s.marks[id]; s.conf[id] = m >= 0 && !Object.values(s.conf).includes(m) ? m : -1; }
  s.marks = {}; rollNext();
}
function rollNext() {   // sorteia, um de cada vez, quem pediu ALEATÓRIO
  const s = NET.sel, who = s.ids.find(id => s.conf[id] === -1);
  if (!who) { s.ph = 'final'; s.t = 0; s.dur = 1.6; s.roll = 0; selSync(); return; }
  const av = pickAvail(s); if (!av.length) { s.conf[who] = 0; rollNext(); return; }
  const target = av[Math.floor(Math.random() * av.length)];
  s.ph = 'roll'; s.t = 0; s.dur = ROLL_T + .8; s.roll = { who, av, target, L: av.length * 2 + av.indexOf(target) + 1, cur: av[0], done: false }; selSync();
}
function selFinish() {
  const s = NET.sel, ids = NET.players.map(p => p.id).filter(id => s.ids.includes(id)), used = Object.values(s.conf);
  for (const id of ids) if (!(s.conf[id] >= 0)) { const av = CHARS.map((_, i) => i).filter(i => !used.includes(i)), c = av.length ? av[Math.floor(Math.random() * av.length)] : 0; s.conf[id] = c; used.push(c); }
  const m = { t: 'start', snap: NET.snap, map: s.map, world: { w: WW, h: WH }, ids, chars: ids.map(id => s.conf[id]), teams: ids.map(id => NET.players.find(p => p.id === id).team) };
  NET.sel = null; netAll(m); startOnline(m);
}
function selStep(dt) {
  const s = NET.sel; if (!s) return;
  s.t += dt; s.acc += dt;
  if (s.ph === 'map') { if (s.t >= s.dur || (s.ids.length && s.ids.every(id => s.votes[id] !== undefined))) selMapDone(); }
  else if (s.ph === 'mapres') { if (s.t >= s.dur) { s.ph = 'char'; s.t = 0; s.dur = SEL_CHAR_T; selSync(); } }
  else if (s.ph === 'char') { if (s.t >= s.dur || (s.ids.length && s.ids.every(id => s.conf[id] !== undefined))) selCharDone(); }
  else if (s.ph === 'roll') {
    const r = s.roll;
    if (!r) rollNext();
    else { const p = Math.min(1, s.t / ROLL_T), e = 1 - Math.pow(1 - p, 3), i = Math.min(r.L - 1, Math.floor(e * r.L)); r.cur = r.av[i % r.av.length]; r.done = p >= 1; if (s.t >= ROLL_T + .8) { s.conf[r.who] = r.target; rollNext(); } }
  }
  else if (s.ph === 'final') { if (s.t >= s.dur) { selFinish(); return; } }
  if (NET.sel === s && s.acc >= .066) { s.acc = 0; selSync(); }
}
const mapClick = v => { if (NET.host) selVote('host', v); else netSend(NET.conns.host, { t: 'vote', v }); };
const charClick = c => { if (NET.host) selPick('host', c); else netSend(NET.conns.host, { t: 'pick', c }); };
function drawPick(t) {
  const s = NET.sel, ms = uiScale(), IW = innerWidth / ms, IH = innerHeight / ms, cx = IW / 2, MUTE = '#8a8a96', INK = '#e7e4d3';
  const ent = scrEnter('pick'); ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, innerWidth, innerHeight); lobbyBg(IW, IH, ms, 1, ent, 'lamps');
  if (!s) return;
  ctx.save(); ctx.scale(ms, ms);
  const k = ctx.getTransform().a / (RES), me = NET.me || 'host', mapPh = s.ph === 'map' || s.ph === 'mapres', timed = s.ph === 'map' || s.ph === 'char';
  const over = (x, y, w, h) => input.mx > x * k && input.mx < (x + w) * k && input.my > y * k && input.my < (y + h) * k;
  if (s.roll && s.roll.cur !== NET.lastCur) { NET.lastCur = s.roll.cur; sfxBeep(480 + s.roll.cur * 45, .05); } else if (!s.roll) NET.lastCur = -2;
  const ts = clamp(Math.min(IW / 16, IH / 16), 18, 30);
  try { ctx.letterSpacing = Math.round(ts * .2) + 'px'; } catch (e) {}
  txt(mapPh ? 'ESCOLHER MAPA' : 'ESCOLHER PERSONAGEM', cx + ts * .1, 30, ts, INK, 'center');
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  const frac = timed ? clamp(1 - s.t / s.dur, 0, 1) : 0, low = timed && s.dur - s.t < 5;
  ctx.beginPath(); ctx.roundRect(cx - 110, 58, 220, 6, 3); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill();
  if (frac > 0) { ctx.beginPath(); ctx.roundRect(cx - 110, 58, Math.max(6, 220 * frac), 6, 3); ctx.fillStyle = low ? '#ff7a6b' : INK; ctx.fill(); }
  if (timed) txt(String(Math.max(0, Math.ceil(s.dur - s.t))), cx + 128, 62, 16, low ? '#ff7a6b' : INK, 'left');
  let hint;
  if (s.ph === 'map') hint = s.votes[me] === undefined ? 'VOTE EM UM MAPA · A MAIORIA DECIDE · SEM VOTOS OU ALEATÓRIO NA FRENTE = MAPA SORTEADO' : 'VOTO ENVIADO · VOCÊ PODE TROCAR ATÉ TODOS VOTAREM OU O TEMPO ACABAR';
  else if (s.ph === 'mapres') hint = (s.mr ? 'MAPA SORTEADO: ' : 'MAPA ESCOLHIDO: ') + MAPS[s.map].name;
  else if (s.ph === 'char') hint = s.conf[me] === undefined ? 'CLIQUE UMA VEZ PARA MARCAR E DUAS PARA CONFIRMAR · MAPA: ' + MAPS[s.map].name : 'PERSONAGEM CONFIRMADO · AGUARDANDO OS OUTROS...';
  else if (s.ph === 'roll') hint = 'SORTEANDO PERSONAGEM...';
  else hint = 'PREPARANDO A PARTIDA...';
  wrapLines(hint, Math.min(IW - 40, 760), 12).forEach((l, i) => txt(l, cx, 86 + i * 16, 12, MUTE, 'center'));
  const COLS = 9, ROWS = 3, gap = 8; let T = clamp(Math.min(120, (IW - 40 - gap * (COLS - 1)) / COLS), 40, 120); const TH = Math.min(T * .72, (IH * .4 - gap * (ROWS - 1)) / ROWS); T = Math.min(T, TH * 1.7); const gx0 = cx - (COLS * T + (COLS - 1) * gap) / 2, gy = IH - 84 - (ROWS * TH + (ROWS - 1) * gap), tpos = q => ({ x: gx0 + (q % COLS) * (T + gap), y: gy + Math.floor(q / COLS) * (TH + gap) });   // mesma grade para MAPA e PERSONAGEM
  const soonTile = (x, y) => {   // vaga vazia: só o rabisco do cartão TUTORIAL (listras + borda tracejada); o texto EM BREVE só aparece com o mouse em cima
    const hv = over(x, y, T, TH);
    ctx.save(); ctx.beginPath(); ctx.roundRect(x + .5, y + .5, T - 1, TH - 1, 10); ctx.fillStyle = 'rgba(255,255,255,.02)'; ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1; for (let i = -TH; i < T; i += 14) { ctx.beginPath(); ctx.moveTo(x + i, y + TH); ctx.lineTo(x + i + TH, y); ctx.stroke(); } ctx.restore();
    ctx.beginPath(); ctx.roundRect(x + .5, y + .5, T - 1, TH - 1, 10); ctx.setLineDash([6, 6]); ctx.strokeStyle = hv ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.16)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    if (hv) txt('EM BREVE', x + T / 2, y + TH / 2, clamp(T / 10, 8, 12), MUTE, 'center');
  };
  const RI = MAPS.length, GS = mapPh ? MSLOTS : SLOTS;
  const voters = (i, x, y) => s.ids.filter(id => s.votes[id] === i).slice(0, 8).forEach((id, j) => { ctx.beginPath(); ctx.arc(x + j * 13, y, 5.5, 0, TAU); ctx.fillStyle = pcol(id); ctx.fill(); if (id === me) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); } });
  const canMe = mapPh ? s.ph === 'map' : s.ph === 'char' && s.conf[me] === undefined, takenBy = c => c >= 0 ? s.ids.find(id => s.conf[id] === c) : undefined;
  let hovC = -2; if (canMe) GS.forEach((c, q) => { const o = tpos(q); if (c >= 0 && takenBy(c) === undefined && over(o.x, o.y, T, TH)) hovC = c; });
  const myP = NET.players.find(p => p.id === me), teamRoom = NET.snap && NET.snap.team > 0 && myP && myP.team >= 0;
  const rank = id => id === me ? 0 : teamRoom && (NET.players.find(p => p.id === id) || {}).team === myP.team ? 1 : 2, ord = [...s.ids].sort((a, b) => rank(a) - rank(b)), nn = Math.max(1, ord.length);
  const top = 124, bot = gy - 16, PNL = !mapPh && IW >= 560, PW = PNL ? clamp(IW * .29, 200, 330) : 0, AW = IW - PW;   // PNL: faixa à esquerda (do lado do seu time) com as características do personagem
  const sc = clamp(Math.min(AW / nn * .78 / 215, (bot - top - 54) / 275), .3, 1.3), base = bot - 54, sw = AW / nn;
  ord.forEach((id, j) => {   // em cima: a escolha de cada jogador (você à esquerda)
    const sx = PW + sw * (j + .5);
    if (mapPh) {   // MAPA: miniatura grande do mapa votado, no lugar do busto
      const vt = s.votes[id], v = id === me && hovC >= 0 ? hovC : vt, P = v >= 0 && v < RI ? MAPS[v] : null, col = pcol(id);
      const status = id === me && hovC >= 0 ? 'PRÉVIA' : vt === undefined ? 'ESCOLHENDO...' : vt === RI ? 'ALEATÓRIO' : 'VOTOU';
      const ph0 = Math.min(clamp(sw * .8, 90, 340) * .62, base - top - 8), pw = ph0 / .62, px = sx - pw / 2, py = base - 8 - ph0 + Math.sin(t * 1.6 + j) * 1.5;
      ctx.save(); ctx.beginPath(); ctx.rect(sx - sw / 2, top - 10, sw, bot - top + 10); ctx.clip();
      if (P) {
        const g = ctx.createRadialGradient(sx, py + ph0 / 2, 10, sx, py + ph0 / 2, Math.max(pw, ph0)); g.addColorStop(0, P.accent + '3a'); g.addColorStop(1, P.accent + '00'); ctx.fillStyle = g; ctx.fillRect(sx - sw / 2, top - 10, sw, bot - top + 10);
        drawMapPreview(P, px, py, pw, ph0); ctx.beginPath(); ctx.roundRect(px + .5, py + .5, pw - 1, ph0 - 1, 12); ctx.strokeStyle = P.accent; ctx.lineWidth = 2; ctx.stroke();
      } else { ctx.beginPath(); ctx.roundRect(px + .5, py + .5, pw - 1, ph0 - 1, 12); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke(); txt('?', sx, py + ph0 / 2 + 2, ph0 * .6, 'rgba(255,255,255,.1)', 'center'); }
      txt(P ? P.name : vt === RI ? 'ALEATÓRIO' : '???', sx, base + 18, clamp(20 * sc + 4, 13, 24), P ? P.accent : MUTE, 'center');
      txt(pname(id) + (id === me ? ' (VOCÊ)' : ''), sx, base + 36, 11, col, 'center');
      txt(status, sx, base + 50, 10, 'rgba(231,228,211,.55)', 'center');
      ctx.restore(); return;
    }
    const cf = s.conf[id], mk = s.marks[id], rolling = !!s.roll && s.roll.who === id;
    const c = rolling ? s.roll.cur : cf !== undefined ? cf : id === me && hovC >= 0 ? hovC : mk !== undefined ? mk : -2, P = c >= 0 ? CHARS[c] : null, col = pcol(id);
    const status = rolling ? 'SORTEANDO...' : cf >= 0 ? 'ESCOLHIDO' : (cf === -1 || mk === -1) ? 'ALEATÓRIO' : id === me && hovC >= 0 ? 'PRÉVIA' : mk >= 0 ? 'MARCADO' : 'ESCOLHENDO...';
    ctx.save(); ctx.beginPath(); ctx.rect(sx - sw / 2, top - 10, sw, bot - top + 10); ctx.clip();
    if (P) {
      const g = ctx.createRadialGradient(sx, base - 150 * sc, 10, sx, base - 150 * sc, 230 * sc); g.addColorStop(0, P.accent + '3a'); g.addColorStop(1, P.accent + '00'); ctx.fillStyle = g; ctx.fillRect(sx - sw / 2, top - 10, sw, bot - top + 10);
      ctx.save(); ctx.translate(sx, base + Math.sin(t * 1.6 + j) * 1.5); ctx.scale(sc, sc); drawBust(P); ctx.restore();
      const fd = ctx.createLinearGradient(0, base - 50 * sc, 0, base); fd.addColorStop(0, 'rgba(13,13,17,0)'); fd.addColorStop(1, '#0d0d11'); ctx.fillStyle = fd; ctx.fillRect(sx - sw / 2, base - 50 * sc, sw, 50 * sc + 1);
    } else txt('?', sx, base - 130 * sc, 110 * sc, 'rgba(255,255,255,.1)', 'center');
    txt(P ? P.name : (cf === -1 || mk === -1) ? 'ALEATÓRIO' : '???', sx, base + 18, clamp(20 * sc + 4, 13, 24), P ? P.accent : MUTE, 'center');
    txt(pname(id) + (id === me ? ' (VOCÊ)' : ''), sx, base + 36, 11, col, 'center');
    txt(status, sx, base + 50, 10, 'rgba(231,228,211,.55)', 'center');
    ctx.restore();
  });
  if (PNL) {   // características do personagem em foco (mouse em cima, 1 clique ou já confirmado), igual à tela PERSONAGENS
    const fc = hovC >= 0 ? hovC : (s.marks[me] >= 0 ? s.marks[me] : (s.conf[me] >= 0 ? s.conf[me] : -1)), P = fc >= 0 ? CHARS[fc] : null, px = 18, pw = PW - 30;
    ctx.save(); ctx.beginPath(); ctx.roundRect(px - 8, top - 14, pw + 16, bot - top + 18, 12); ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1; ctx.stroke(); ctx.clip();
    if (!P) { wrapLines('PASSE O MOUSE OU TOQUE EM UM PERSONAGEM PARA VER AS CARACTERÍSTICAS', pw, 11).forEach((l, i) => txt(l, px + pw / 2, top + (bot - top) / 2 - 8 + i * 16, 11, MUTE, 'center')); }
    else {
      const avail = bot - top - 8, many = avail < 330, bsz = many ? 11 : 13, dSz = many ? 11 : 12, dLh = many ? 15 : 18;
      let y = top + 6; txt(P.name, px, y + 8, clamp(PW / 11, 20, 28), INK, 'left'); txt(P.alias, px, y + 32, 12, INK, 'left'); y += 54;
      ctx.font = `bold ${dSz}px "Courier New", monospace`;
      const nStat = CSTATS.length, statH = nStat * (many ? 17 : 21), lineW = ws => { let n = 1, c = ''; for (const w of ws.split(' ')) { const t2 = c ? c + ' ' + w : w; if (ctx.measureText(t2).width > pw && c) { n++; c = w; } else c = t2; } return n; };
      const showBio = top + 6 + 54 + lineW(P.bio) * dLh + 40 + statH < bot - 6;
      if (showBio) y = wrapTxt(P.bio, px, y + 4, pw, dLh, dSz, 'rgba(255,255,255,.82)') + 22;
      txt('ESTILO: ' + P.style, px, y, 11, 'rgba(231,228,211,.6)', 'left'); y += 18;
      txt('MÃO: ' + (P.hand === 'L' ? 'CANHOTO (ESQ.)' : 'DESTRO (DIR.)'), px, y, 11, INK, 'left'); y += 24;
      const step = clamp((bot - 8 - y) / nStat, 15, 24), lw0 = many ? 92 : 104, abw = clamp(pw - lw0 - 4, 40, 160), showTxt = pw - lw0 - abw > 56;
      for (const q of CSTATS) {
        const r = P.st[q.k];
        txt(q.label, px, y, 10.5, '#fff', 'left');
        ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.roundRect(px + lw0, y - 5, abw, 10, 5); ctx.fill();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(px + lw0, y - 5, Math.max(abw * clamp(r / 10, .03, 1), 10), 10, 5); ctx.fill();
        if (showTxt) txt(q.txt(q.m(r)), px + lw0 + abw + 8, y, 10, INK, 'left');
        y += step;
      }
    }
    ctx.restore();
  }
  GS.forEach((c, q) => {   // grade de baixo (26 vagas + aleatório no meio): igual para mapa e personagem
    const { x, y } = tpos(q);
    if (c === -2) { soonTile(x, y); return; }
    if (mapPh) {   // MAPA: um clique vota (dá para trocar o voto até o fim)
      const v = c >= 0 ? c : RI, mp = c >= 0 ? MAPS[c] : null, res = s.ph === 'mapres', win = res && (c >= 0 ? !s.mr && c === s.map : s.mr), mine = s.votes[me] === v, hov = canMe && over(x, y, T, TH);
      ctx.globalAlpha = res && !win ? .35 : 1;
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, T, TH, 10); ctx.clip(); ctx.fillStyle = '#16161d'; ctx.fillRect(x, y, T, TH);
      if (mp) drawMapPreview(mp, x, y, T, TH - 16); else txt('?', x + T / 2, y + (TH - 16) / 2 + 2, T * .55, hov || mine ? INK : MUTE, 'center');
      ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(x, y + TH - 16, T, 16);
      txt(mp ? mp.name : 'ALEATÓRIO', x + T / 2, y + TH - 8, clamp(T / 9, 7, 10), mine || win ? INK : 'rgba(231,228,211,.85)', 'center'); ctx.restore();
      ctx.beginPath(); ctx.roundRect(x + .5, y + .5, T - 1, TH - 1, 10); ctx.strokeStyle = win ? (mp ? mp.accent : INK) : mine ? INK : hov ? 'rgba(231,228,211,.75)' : 'rgba(255,255,255,.18)'; ctx.lineWidth = win || mine ? 3 : hov ? 2 : 1; ctx.stroke();
      voters(v, x + 10, y + 10); ctx.globalAlpha = 1;
      if (canMe) ui.push({ x: x * k, y: y * k, w: T * k, h: TH * k, fn: () => { mapClick(v); } });
      return;
    }
    const owner = takenBy(c), isMine = canMe && s.marks[me] === c, canPick = canMe && owner === undefined, hov = canPick && over(x, y, T, TH), rc = !!s.roll && c >= 0 && s.roll.cur === c;
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, T, TH, 10); ctx.clip();
    ctx.fillStyle = rc ? '#2a2a34' : '#16161d'; ctx.fillRect(x, y, T, TH);
    if (c >= 0) { const sf = (TH - 16) / 130; ctx.save(); ctx.beginPath(); ctx.rect(x, y, T, TH - 16); ctx.clip(); ctx.translate(x + T / 2, y + (TH - 16) / 2 + 190 * sf); ctx.scale(sf, sf); drawBust(CHARS[c]); ctx.restore(); }
    else txt('?', x + T / 2, y + (TH - 16) / 2 + 2, T * .55, hov || isMine ? INK : MUTE, 'center');
    if (owner !== undefined) { ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.fillRect(x, y, T, TH - 16); }
    ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(x, y + TH - 16, T, 16);
    txt(isMine ? 'CONFIRMAR' : c >= 0 ? CHARS[c].name : 'ALEATÓRIO', x + T / 2, y + TH - 8, clamp(T / 9, 7, 10), isMine ? INK : 'rgba(231,228,211,.85)', 'center');
    ctx.restore();
    ctx.beginPath(); ctx.roundRect(x + .5, y + .5, T - 1, TH - 1, 10);
    ctx.strokeStyle = rc ? pcol(s.roll.who) : owner !== undefined ? pcol(owner) : isMine ? INK : hov ? 'rgba(231,228,211,.75)' : 'rgba(255,255,255,.18)'; ctx.lineWidth = rc || isMine || owner !== undefined ? 3 : hov ? 2 : 1; ctx.stroke();
    if (owner !== undefined) txt(owner === me ? 'VOCÊ' : owner === 'host' ? 'ANF.' : pname(owner).replace('JOGADOR ', 'J'), x + T / 2, y + (TH - 16) / 2, clamp(T / 7, 9, 13), pcol(owner), 'center');
    let dj = 0; if (s.ph === 'char') for (const id of s.ids) if (id !== me && s.conf[id] === undefined && s.marks[id] === c) { ctx.beginPath(); ctx.arc(x + T - 10 - dj * 11, y + 10, 4.5, 0, TAU); ctx.fillStyle = pcol(id); ctx.fill(); dj++; }
    if (canPick) ui.push({ x: x * k, y: y * k, w: T * k, h: TH * k, fn: () => { charClick(c); } });
  });
  cornerBtn('SAIR', -1, IW, IH, () => setState('menu'));
  ctx.restore();
}
function addDigit(d) { if (!NET.busy && JOIN.length < 4) { JOIN += d; NET.err = ''; } }
function doJoin() { if (JOIN.length === 4 && !NET.busy) joinRoom(JOIN); }

/* ---- PARTIDA ONLINE: o anfitrião simula tudo; os convidados mandam os controles e desenham o que o anfitrião envia (30x por segundo) ---- */
const FK = ['x', 'y', 'vx', 'vy', 'angle', 'hp', 'maxHp', 'stun', 'stunMax', 'fallDir', 'weapon', 'mag', 'reserve', 'reloadT', 'reloadMax', 'kick', 'flash', 'hitFlash', 'twist', 'walk', 'swing', 'peekK', 'leanS', 'coverBlock', 'team', 'dead', 'slideT', 'stag', 'micro', 'hk'];
const rn = v => typeof v === 'number' ? Math.round(v * 100) / 100 : v;
/* ANFITRIÃO: lutador controlado por um amigo (usa os controles recebidos no lugar da IA do bot) */
function remoteStep(b, dt) {
  const r = b.rin, L = b.rl || (b.rl = { clk: r.clk, it: r.it, th: r.th, rl: r.rl, cv: r.cv, sl: r.sl, hs: r.hs });
  if (r.clk !== L.clk) { L.clk = r.clk; b.rbuf = .15; }
  const act = r.it !== L.it, thr = r.th !== L.th, rel = r.rl !== L.rl; if (r.cv !== L.cv) { L.cv = r.cv; b.coverReq = true; } if (r.sl !== L.sl) { L.sl = r.sl; b.slideReq = true; } if (r.hs !== L.hs) { L.hs = r.hs; b.holsterReq = true; }
  L.it = r.it; L.th = r.th; L.rl = r.rl; b.rbuf = Math.max(0, (b.rbuf || 0) - dt);
  if (act) {
    let best = null, bd = 46; for (const pk of pickups) { const q = Math.hypot(pk.x - b.x, pk.y - b.y); if (q < bd) { bd = q; best = pk; } }
    if (best) { unholster(b); if (b.weapon === best.key) b.reserve += best.mag + best.reserve; else { dropWeapon(b); giveWeapon(b, best.key, best.mag, best.reserve); } pickups.splice(pickups.indexOf(best), 1); }
  }
  const w = b.weapon && WEAPONS[b.weapon], it = { mx: r.mx, my: r.my, aim: r.aim, fire: !!w && !w.knuckle && (r.down || b.rbuf > 0), punch: (!w || w.knuckle) && b.rbuf > 0, reload: rel, throw: thr, slide: !!b.slideReq, holster: !!b.holsterReq };
  updateCover(b, it, dt); b.coverReq = false; b.slideReq = false; b.holsterReq = false; updateFighter(b, dt, it);
}
function assignRemotes() {   // a cada rodada, cada amigo assume um lutador (em times, os amigos ficam em times opostos)
  if (!(NET.host && NET.online) || training) return; const used = new Set();
  NET.guests.forEach((g, k) => {
    const want = M && M.team ? (g.st !== null && g.st !== undefined ? g.st : (k + 1) % 2) : null;   // time escolhido na sala
    const b = bots.find(x => !used.has(x) && (want === null || x.team === want)) || bots.find(x => !used.has(x)); if (!b) return; used.add(b);
    Object.assign(b, { remote: true, cid: g.id, ci: g.ci, pal: CHARS[g.char], hp: 100, maxHp: 100, speed: C.moveSpeed, punchDmg: C.punchDamage, rin: NET.rin[g.id], rl: null, rbuf: 0, coverReq: false }); applyChar(b);
  });
}
function netSnap() {
  const all = allF().slice();
  return { t: 's', rd: NET.mid * 1000 + M.round, st: state === 'mend' ? 'mend' : 'play',
    o: all.map(f => f.isPlayer ? 0 : f.remote ? f.ci : -1), c: all.map(f => CHARS.indexOf(f.pal)),
    f: all.map(f => [...FK.map(k => rn(f[k])), rn(f.punch.left.t), f.punch.left.heavy ? 1 : 0, rn(f.punch.right.t), f.punch.right.heavy ? 1 : 0, f.cover ? [f.cover.nx, f.cover.ny] : 0, rn(f.coverOff.x), rn(f.coverOff.y)]),
    b: bullets.map(b => [b.id, rn(b.x), rn(b.y), rn(b.vx), rn(b.vy)]),
    th: thrown.map(t => [rn(t.x), rn(t.y), rn(t.vx), rn(t.vy), rn(t.rot), t.key, t.spin]),
    pk: pickups.map(p => [rn(p.x), rn(p.y), p.key, p.mag, p.reserve, rn(p.t)]),
    m: [M.round, M.phase, rn(M.phaseT), rn(M.left), M.sc, M.target, M.last ? [all.indexOf(M.last.w), M.last.wt, M.last.why] : 0], ev: NET.ev };
}
function netTick(dt) {
  if (!NET.online || !NET.host || !M) return;
  NET.acc += dt; if (NET.acc < 1 / 30) return; NET.acc = 0;
  const S = netSnap(); NET.ev = []; netAll(S);
}
/* CONVIDADO: reconstrói os lutadores quando começa a rodada e depois só aplica o que o anfitrião mandou */
function cliBuild(S) {
  const newRound = S.rd !== NET.rd; NET.rd = S.rd; const mi = Math.max(0, S.o.indexOf(NET.ci));
  NET.all = S.f.map((v, i) => { const f = makeFighter({ isPlayer: i === mi, pal: CHARS[S.c[i]] }); applyF(f, v, true); return f; });
  player = NET.all[mi]; bots = NET.all.filter(f => f !== player);
  if (newRound) { decals = []; puddles = []; prints = []; pools.clear(); thrown = []; bullets = []; pickups = []; casings = []; trail = []; btrails = []; rings = []; sparks = []; buildCrates(); }
  updateCam();
}
function applyF(f, v, init) {
  const n = FK.length, hp0 = f.hp, dead0 = f.dead;
  FK.forEach((k, i) => {
    if (k === 'x') f.tx = v[i]; else if (k === 'y') f.ty = v[i]; else if (k === 'angle') f.ta = v[i];
    else if (k === 'team') f.team = M.team ? (v[i] === NET.myTeam ? 0 : 1) : v[i];
    else if (k !== 'walk' || init) f[k] = v[i];
  });
  if (init) { f.x = f.tx; f.y = f.ty; f.angle = f.ta; }
  f.punch.left.t = v[n]; f.punch.left.heavy = !!v[n + 1]; f.punch.right.t = v[n + 2]; f.punch.right.heavy = !!v[n + 3];
  f.cover = v[n + 4] ? { nx: v[n + 4][0], ny: v[n + 4][1], gap: 0 } : null; f.isCovered = !!f.cover; f.coverOff = { x: v[n + 5], y: v[n + 6] };
  if (init) return;
  if (f.hp < hp0 - .01) {   // levou dano: sangue e faíscas (e tela vermelha se for você)
    for (let i = 0; i < 3; i++) addDecal(f.x + rnd(-10, 10), f.y + rnd(-10, 10), rnd(2, 5));
    for (let i = 0; i < 5; i++) { const a = rnd(0, TAU), s = rnd(120, 300); sparks.push({ x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1 }); }
    if (f.isPlayer) { dmgFlash = .45; shake = Math.max(shake, 5); }
  }
  if (f.dead && !dead0) { for (let i = 0; i < 12; i++) addDecal(f.x + rnd(-18, 18), f.y + rnd(-18, 18), rnd(3, 9)); if (f.isPlayer) shake = 10; }
}
function applySnap(S) {
  if (!NET.cl || !M) return;
  NET.myTeam = S.f[Math.max(0, S.o.indexOf(NET.ci))][FK.indexOf('team')];
  if (S.rd !== NET.rd || S.f.length !== NET.all.length) cliBuild(S);
  S.f.forEach((v, i) => applyF(NET.all[i], v, false));
  const old = new Map(bullets.map(b => [b.id, b]));
  bullets = S.b.map(([id, x, y, vx, vy]) => { let b = old.get(id); if (!b) { const tr = { pts: [{ x, y, t: btClock }] }; btrails.push(tr); b = { id, tr, life: 9 }; } b.x = x; b.y = y; b.vx = vx; b.vy = vy; return b; });
  thrown = S.th.map(([x, y, vx, vy, rot, key, spin]) => ({ x, y, vx, vy, rot, key, spin }));
  pickups = S.pk.map(([x, y, key, mag, reserve, t]) => ({ x, y, key, mag, reserve, t }));
  const [round, ph, pt, left, sc, tg, last] = S.m, prev = M.phase;
  if (ph !== prev) { if (ph === 'map') sfxBeep(330, .18); if (ph === 'count') M.beep = -1; if (ph === 'fight') { M.flashT = 1; sfxHorn(); } }
  Object.assign(M, { round, phase: ph, phaseT: pt, left, target: tg, sc: M.team ? [sc[NET.myTeam], sc[1 - NET.myTeam]] : sc,
    last: last ? { w: NET.all[last[0]] || null, wt: M.team && last[1] >= 0 ? (last[1] === NET.myTeam ? 0 : 1) : last[1], why: last[2] } : null });
  for (const e of S.ev) if (e[0] === 's') sfxGun(e[1], clamp(1 - Math.hypot(e[2] - player.x, e[3] - player.y) / 900, .15, 1));
  if (S.st === 'mend' && state === 'play') setState('mend'); else if (S.st !== 'mend' && state === 'mend') setState('play');
}
function netSendInput(dt) {
  NET.ia += dt; if (NET.ia < 1 / 30) return; NET.ia = 0;
  const k = input.keys, idle = state !== 'play';
  let mx = (k[KEYS.right] || k.ArrowRight ? 1 : 0) - (k[KEYS.left] || k.ArrowLeft ? 1 : 0), my = (k[KEYS.down] || k.ArrowDown ? 1 : 0) - (k[KEYS.up] || k.ArrowUp ? 1 : 0);
  if (touch.move.id !== null) { mx += touch.move.dx; my += touch.move.dy; }
  netSend(NET.conns.host, { t: 'in', mx: idle ? 0 : +mx.toFixed(2), my: idle ? 0 : +my.toFixed(2), aim: +NET.aim.toFixed(3), down: !idle && !!input.down,
    pk: !idle && (!!input.peek || Object.values(touch.btn).includes('M')), ...NET.cnt });
}
function clientStep(dt) {
  btClock += dt; input.buffer = Math.max(0, input.buffer - dt);
  if (state === 'play') {   // ações de um toque viram contadores (não se perdem entre um pacote e outro)
    if (input.buffer > NET.lb + .05) NET.cnt.clk++;
    if (input.interact) NET.cnt.it++; if (input.throwReq) NET.cnt.th++; if (input.reloadReq) NET.cnt.rl++; if (input.coverReq) NET.cnt.cv++; if (input.slideReq) NET.cnt.sl++; if (input.holsterReq) NET.cnt.hs++;
  }
  NET.lb = input.buffer; input.interact = input.throwReq = input.reloadReq = input.coverReq = input.slideReq = input.holsterReq = false;
  const k = 1 - Math.exp(-dt * 22);
  for (const f of NET.all) {
    f.x += (f.tx - f.x) * k; f.y += (f.ty - f.y) * k; f.angle += angDiff(f.ta, f.angle) * k; f.walk += Math.hypot(f.vx, f.vy) * dt * .065;
    f.kick = Math.max(0, f.kick - dt * 70); f.flash = Math.max(0, f.flash - dt); f.hitFlash = Math.max(0, f.hitFlash - dt);
    for (const h of ['left', 'right']) { const p = f.punch[h]; if (p.t < 0) continue; p.t += dt / C.punchDuration; if (p.t >= 1) p.t = -1; else { const fl = fistLocal(f, h); if (fl.ext > .4) { const w = toWorld(f, fl.x, fl.y); trail.push({ x: w.x, y: w.y, life: 1, heavy: p.heavy }); } } }
  }
  if (!player.dead && player.stun <= 0) player.angle = NET.aim = TOUCH ? touch.ang : Math.atan2(input.my / ZOOM + cam.y - player.y, input.mx / ZOOM + cam.x - player.x);
  netSendInput(dt);
  for (const b of bullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.tr.pts.push({ x: b.x, y: b.y, t: btClock }); }
  btrails = btrails.filter(r => btClock - r.pts[r.pts.length - 1].t < BTRAIL_LIFE);
  for (const t of thrown) { const sp = Math.hypot(t.vx, t.vy), d = Math.exp(-C.throwDrag * dt); t.x += t.vx * dt; t.y += t.vy * dt; t.vx *= d; t.vy *= d; t.rot += t.spin * dt * Math.min(sp / 300, 1); }
  player.near = null; let bd = 46; for (const pk of pickups) { const q = Math.hypot(pk.x - player.x, pk.y - player.y); if (q < bd) { bd = q; player.near = pk; } }
  M.phaseT += dt; M.flashT = Math.max(0, M.flashT - dt); if (M.phase === 'fight') M.left = Math.max(0, M.left - dt);
  if (M.phase === 'count') { const n = Math.floor(M.phaseT); if (n !== M.beep && n < 3) { M.beep = n; sfxBeep(n === 2 ? 880 : 660, .13); } }
  shake = Math.max(0, shake - dt * 40); dmgFlash = Math.max(0, dmgFlash - dt);
  for (const t of trail) t.life -= dt * 9; trail = trail.filter(t => t.life > 0);
  for (const r of rings) { r.life -= dt * 6; r.r += dt * 140; } rings = rings.filter(r => r.life > 0);
  for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .9; s.vy *= .9; s.life -= dt * 5; } sparks = sparks.filter(s => s.life > 0);
}

function drawRoom(t) {
  const ms = uiScale(), IW = innerWidth / ms, IH = innerHeight / ms, cx = IW / 2, MUTE = '#8a8a96', INK = '#e7e4d3', GREEN = '#8fd6a4';
  const ent = scrEnter('room'); ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, innerWidth, innerHeight); lobbyBg(IW, IH, ms, 1, ent, 'lamps'); ctx.save(); ctx.scale(ms, ms);
  const k = ctx.getTransform().a / (RES), pw = Math.min(IW - 40, 460), px = cx - pw / 2, rh = 38, rg = 5, cap = NET.cap || 8, snap = NET.snap || {};
  const me = NET.players.find(p => p.id === NET.me), n = NET.players.length, rc = NET.players.filter(p => p.ready).length, all = n > 0 && rc === n && !NET.err;
  const teamRoom = snap.team > 0, rowsH = teamRoom ? 34 + 28 + snap.team * (rh + rg) + 28 : cap * (rh + rg);
  let y = Math.max(10, (IH - (30 + 22 + 84 + rowsH + 10 + ((NET.host && !snap.bg) ? 3 : 2) * 58 + (snap.bg ? 34 : 0))) / 2);
  const rtl = (snap.rn || 'SALA').toUpperCase(), rfs = clamp((IW - 30) / (rtl.length * .8), 14, 30);
  try { ctx.letterSpacing = Math.round(rfs * .2) + 'px'; } catch (e) {}
  txt(rtl, cx + rfs * .1, y + 15, rfs, INK, 'center'); try { ctx.letterSpacing = '0px'; } catch (e) {}
  txt(snap.team > 0 ? `PARTIDA ${snap.team}v${snap.team}` : snap.bg ? 'CAMPO DE BATALHA · TODOS CONTRA TODOS' + (snap.bots ? ` · ${snap.bots} BOTS` : '') : 'SALA PERSONALIZADA', cx, y + 42, 12, MUTE, 'center'); y += 58;
  if (NET.err) txt(NET.err, cx, y + 28, 16, '#ff6b6b', 'center');
  else if (NET.busy || !NET.code) txt(NET.msg || '...', cx, y + 28, 16, MUTE, 'center');
  else { try { ctx.letterSpacing = '14px'; } catch (e) {} txt(NET.code, cx + 7, y + 26, 54, INK, 'center'); try { ctx.letterSpacing = '0px'; } catch (e) {}
    txt(NET.copied ? 'CÓDIGO COPIADO!' : 'CÓDIGO DA SALA · TOQUE PARA COPIAR', cx, y + 62, 11, NET.copied ? GREEN : MUTE, 'center');
    ui.push({ x: (cx - 150) * k, y: y * k, w: 300 * k, h: 70 * k, fn: () => { try { navigator.clipboard.writeText(NET.code); NET.copied = true; } catch (e) {} } }); }
  y += 84;
  if (teamRoom) {   // dois times lado a lado, afastados: verde à esquerda, vermelho à direita
    const n2 = snap.team, gap = 70, cw = Math.min(300, (IW - 30 - gap) / 2), cols = [cx - gap / 2 - cw, cx + gap / 2], TC = ['#8fd6a4', '#ff7a6b'], TN = ['TIME VERDE', 'TIME VERMELHO'];
    if (me && !(me.team >= 0) && !NET.err) txt('ENTRE EM UM TIME PARA JOGAR', cx, y + 12, 15, '#ffd23f', 'center');
    y += 34;
    for (let t2 = 0; t2 < 2; t2++) {
      const x0 = cols[t2], mem = NET.players.filter(q => q.team === t2), col = TC[t2];
      try { ctx.letterSpacing = '3px'; } catch (e) {} txt(TN[t2], x0 + 4, y + 8, 12, col, 'left'); try { ctx.letterSpacing = '0px'; } catch (e) {}
      txt(`${mem.length}/${n2}`, x0 + cw - 4, y + 8, 12, col, 'right');
      ctx.fillStyle = col; ctx.fillRect(x0, y + 20, cw, 2);
      for (let i = 0; i < n2; i++) {
        const q = mem[i], ry = y + 28 + i * (rh + rg), tint = 'rgba(255,255,255,.03)';
        ctx.beginPath(); ctx.roundRect(x0 + .5, ry + .5, cw - 1, rh - 1, 10); ctx.fillStyle = tint; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke();
        if (!q) {
          if (me && me.team !== t2 && !NET.err) button('+ ENTRAR NO TIME', x0 + 6, ry + 5, cw - 12, rh - 10, () => chooseTeam(t2));
          else txt('VAGA', x0 + 14, ry + rh / 2 + 1, 12, '#4a4a56', 'left');
          continue;
        }
        const isMe = q.id === NET.me, canKick = NET.host && q.id !== 'host', canSwap = !!me && me.team >= 0 && q.team !== me.team && !isMe && !NET.err;
        let rx = x0 + cw - 8;
        if (canKick) { button('EXPULSAR', rx - 72, ry + 5, 72, rh - 10, () => kickPlayer(q.id)); rx -= 78; }
        if (canSwap && NET.pick === q.id) button('TROCAR LADO', rx - 104, ry + 5, 104, rh - 10, () => requestSwap(q.id), 'primary');
        else txt(q.ready ? 'PRONTO' : 'AGUARDANDO', rx, ry + rh / 2 + 1, 11, q.ready ? col : MUTE, 'right');
        txt(pname(q.id) + (isMe ? ' (VOCÊ)' : ''), x0 + 14, ry + rh / 2 + 1, 13, INK, 'left');
        if (canSwap) ui.push({ x: (x0) * k, y: ry * k, w: cw * k, h: rh * k, fn: () => { NET.pick = NET.pick === q.id ? null : q.id; } });   // clique na pessoa do outro time: mostra TROCAR LADO
      }
    }
    y += 28 + n2 * (rh + rg);
    const un = NET.players.filter(q => !(q.team >= 0)).map(q => pname(q.id) + (q.id === NET.me ? ' (VOCÊ)' : ''));
    if (un.length) txt('SEM TIME: ' + un.join('  ·  '), cx, y + 8, 12, MUTE, 'center');
    y += 28;
  }
  for (let i = 0; i < cap && !teamRoom; i++) {
    const p = NET.players[i], ry = y + i * (rh + rg);
    ctx.beginPath(); ctx.roundRect(px + .5, ry + .5, pw - 1, rh - 1, 10); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill(); ctx.strokeStyle = p && p.ready ? 'rgba(143,214,164,.6)' : 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke();
    if (!p) { txt('AGUARDANDO JOGADOR...', px + 14, ry + rh / 2 + 1, 12, '#4a4a56', 'left'); continue; }
    const canKick = NET.host && p.id !== 'host';
    txt(pname(p.id) + (p.id === NET.me ? '  (VOCÊ)' : ''), px + 14, ry + rh / 2 + 1, 14, INK, 'left');
    txt(p.ready ? 'PRONTO' : 'AGUARDANDO', px + pw - (canKick ? 98 : 14), ry + rh / 2 + 1, 12, p.ready ? GREEN : MUTE, 'right');
    if (canKick) button('EXPULSAR', px + pw - 90, ry + 5, 82, rh - 10, () => kickPlayer(p.id));
  }
  y += (teamRoom ? 0 : rowsH) + 10; const bw = Math.min(300, pw);
  if (snap.bg) { const st = bgStatus(); txt(st.t, cx, y + 12, 13, st.c, 'center'); y += 34; }
  else if (NET.host) { button('INICIAR PARTIDA', cx - bw / 2, y, bw, 50, startRoom, all ? 'primary' : undefined); y += 58; }
  if (!NET.err && me && (!teamRoom || me.team >= 0)) { button(me.ready ? 'CANCELAR PRONTO' : 'PRONTO', cx - bw / 2, y, bw, 50, toggleReady, me.ready ? undefined : 'primary'); y += 58; }
  button('SAIR DA SALA', cx - bw / 2, y, bw, 50, leaveRoom);
  ctx.restore();
}
const JOIN_ARM = new Image(); JOIN_ARM.src = 'data:image/webp;base64,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';   // braço de sobretudo + luva + relógio (arte do autor); o mostrador é limpo e o código é desenhado por cima
function drawJoin(t) {
  const ms = uiScale(), IW = innerWidth / ms, IH = innerHeight / ms, MUTE = '#8a8a96', INK = '#e7e4d3';
  const ent = scrEnter('join'); ctx.fillStyle = '#070707'; ctx.fillRect(0, 0, innerWidth, innerHeight); ctx.save(); ctx.scale(ms, ms);
  const Rf = clamp(Math.min(IW * .58 / 5.3, IH * .34), 64, 190), s = Rf / 132, wx = IW * .42, cy = IH / 2 + 6, eA = ent(0), eB = ent(.25);
  if (JOIN_ARM.complete && JOIN_ARM.naturalWidth) { ctx.globalAlpha = eA; ctx.drawImage(JOIN_ARM, wx - 751 * s - (1 - eA) * 80, cy - 479 * s, 1448 * s, 1086 * s); ctx.globalAlpha = 1; }
  // código dentro do relógio (medidas tiradas da arte: centro do mostrador em wx, cy)
  ctx.globalAlpha = eB;
  const sS = 32 * s;
  for (let i = 0; i < 4; i++) { const x = wx + (i - 1.5) * 38 * s - sS / 2, y = cy - 88 * s - sS / 2; ctx.beginPath(); ctx.roundRect(x + .5, y + .5, sS - 1, sS - 1, 6 * s); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill(); ctx.strokeStyle = i === JOIN.length ? INK : 'rgba(255,255,255,.2)'; ctx.lineWidth = i === JOIN.length ? 2 : 1; ctx.stroke(); if (JOIN[i]) txt(JOIN[i], x + sS / 2, y + sS / 2 + 1, 21 * s, INK, 'center'); }
  const stTxt = NET.err || (NET.busy ? NET.msg : 'CÓDIGO DE 4 DÍGITOS'); txt(stTxt, wx, cy - 58 * s, Math.min(9.5 * s, 300 * s / Math.max(12, stTxt.length)), NET.err ? '#ff6b6b' : MUTE, 'center');
  const kw = 60 * s, kh = 33 * s, keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'APAGAR', '0', 'ENTRAR'];
  keys.forEach((kk, i) => { const x = wx + ((i % 3) - 1) * 67 * s - kw / 2, yy = cy + (-29.5 + Math.floor(i / 3) * 37.5) * s - kh / 2;
    button(kk, x, yy, kw, kh, kk === 'APAGAR' ? () => { JOIN = JOIN.slice(0, -1); } : kk === 'ENTRAR' ? doJoin : () => addDigit(kk), kk === 'ENTRAR' && JOIN.length === 4 && !NET.busy ? 'primary' : undefined); });
  ctx.globalAlpha = 1;
  scrHead('ENTRAR NA SALA', IW / 2, 24, 22, IW, ent);
  cornerBtn('VOLTAR', -1, IW, IH, () => { netReset(); setState('modes'); });
  ctx.restore();
}

