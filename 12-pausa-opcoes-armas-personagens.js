/* ------------------------------ PAUSA E OPÇÕES -------------------------- */
function drawPause() {
  const ms = uiScale(), IW = innerWidth / ms, IH = innerHeight / ms, cx = IW / 2;
  ctx.fillStyle = 'rgba(6,6,10,.74)'; ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.save(); ctx.scale(ms, ms);
  const y0 = IH / 2 - 96;   // só três botões, sem nenhum texto
  button('CONTINUAR', cx - 130, y0, 260, 52, () => setState('play'), 'primary');
  button('OPÇÕES', cx - 130, y0 + 66, 260, 48, () => { optBack = 'pause'; optScroll = 0; setState('options'); });
  button('SAIR', cx - 130, y0 + 126, 260, 48, () => setState('menu'));
  ctx.restore();
}
let optScroll = 0;   // rolagem da tela OPÇÕES (igual à da ATUALIZAÇÃO)
function drawOptions(t) {
  const ms = uiScale(), W = innerWidth / ms, H = innerHeight / ms, cx = W / 2, MUTE = '#8a8a96', INK = '#e7e4d3';
  const ent = scrEnter('options');
  ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, innerWidth, innerHeight); lobbyBg(W, H, ms, 1, ent, 'lamps');   // mesmo fundo do menu
  ctx.save(); ctx.scale(ms, ms);
  const colW = Math.min(620, W - 32), x0 = cx - colW / 2, top = 84, bot = H - 84, pad = 20, rowH = 44, kh = 36, KW = clamp(colW * .3, 100, 150), cx2 = x0 + colW - pad - KW;
  const SECT = { key: '#8fd6a4', fix: '#e7c27a', aud: '#8ab4e0' };
  // 1) monta a lista: um cartão por seção, linhas dentro dele (y relativo ao início da lista)
  const ops = [], cards = []; let y = 0;
  const fixed = [['ATIRAR / SOCAR', 'CLIQUE ESQ.'], ['ARREMESSAR / ESPIAR', 'CLIQUE DIR.'], ['MIRAR', 'MOUSE'], ['PAUSAR / VOLTAR', 'ESC']];
  const sfxTick = () => { audioChanged(); };   // o clique do botão já dá o retorno sonoro (no volume novo)
  const card = (title, col, sub, rows) => {
    const y1 = y; y += pad;
    ops.push({ k: 'label', y, label: title, col }); y += 26;
    if (sub) { ops.push({ k: 'sub', y, sub }); y += 22; }
    for (const r of rows) { ops.push(Object.assign({ y }, r)); y += r.h || rowH; }
    y += pad - 6; cards.push({ y: y1, h: y - y1 }); y += 16;
  };
  card('TECLADO', SECT.key, null, [
    { k: 'hint', h: 24 },
    ...KEYDEFS.map(([id, label]) => ({ k: 'key', id, label })),
    { k: 'reset', h: 54 },
  ]);
  card('MOUSE E SISTEMA (FIXOS)', SECT.fix, null, fixed.map(([label, val]) => ({ k: 'fix', label, val })));
  card('ÁUDIO', SECT.aud, null, [
    { k: 'aud', label: 'VOLUME DA MÚSICA', val: () => cfg.musicVol * 10 + '%', dec: () => { cfg.musicVol = clamp(cfg.musicVol - 1, 0, 10); audioChanged(); }, inc: () => { cfg.musicVol = clamp(cfg.musicVol + 1, 0, 10); audioChanged(); } },
    { k: 'aud', label: 'VOLUME DOS EFEITOS', val: () => cfg.sfxVol * 10 + '%', dec: () => { cfg.sfxVol = clamp(cfg.sfxVol - 1, 0, 10); sfxTick(); }, inc: () => { cfg.sfxVol = clamp(cfg.sfxVol + 1, 0, 10); sfxTick(); } },
    { k: 'aud', label: 'MÚSICA DA PARTIDA', val: () => cfg.music ? cfg.music + ' · ' + TRACKS[cfg.music - 1].name : 'ALEATÓRIA', dec: () => { cfg.music = (cfg.music + 5) % 6; audioChanged(); }, inc: () => { cfg.music = (cfg.music + 1) % 6; audioChanged(); } },
  ]);
  ops.push({ k: 'note', y: y - 4 }); y += 28;
  const maxS = Math.max(0, y - (bot - top)); optScroll = clamp(optScroll, 0, maxS);
  scrHead('OPÇÕES', cx, 36, clamp(Math.min(W / 14, H / 14), 20, 32), W, ent); ctx.globalAlpha = ent(.2);   // o resto da tela aparece em seguida
  // 2) desenha dentro da área rolável; os botões só recebem toque na parte que aparece
  const kk = ctx.getTransform().a / RES, oy = top - optScroll;
  const sbtn = (label, x, yy, w, h, fn, style) => {   // botão rolável: recorta a área de toque para a janela visível
    const n = ui.length; button(label, x, yy, w, h, fn, style);
    const u = ui[n]; if (!u) return; const t0 = Math.max(u.y, top * kk), t1 = Math.min(u.y + u.h, bot * kk);
    if (t1 <= t0) ui.splice(n, 1); else { u.y = t0; u.h = t1 - t0; }
  };
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, bot - top); ctx.clip();
  for (const c of cards) { ctx.beginPath(); ctx.roundRect(x0 + .5, c.y + oy + .5, colW - 1, c.h - 1, 18); const gr = ctx.createLinearGradient(0, c.y + oy, 0, c.y + oy + c.h); gr.addColorStop(0, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(255,255,255,.012)'); ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke(); }   // mesmo fundo dos cartões da ATUALIZAÇÃO
  for (const o of ops) {
    const yy = o.y + oy, mid = yy + kh / 2;
    if (yy > bot + 4 || yy + rowH < top - 4) continue;   // fora da janela
    if (o.k === 'label') { ctx.beginPath(); ctx.roundRect(x0 + pad, yy + 5, 8, 8, 4); ctx.fillStyle = o.col; ctx.fill(); txt(o.label, x0 + pad + 16, yy + 10, 12, o.col, 'left'); }
    else if (o.k === 'hint') txt(bindCapture ? 'Aperte a nova tecla...  (Esc cancela)' : 'Clique numa tecla para trocar. Se repetir, as duas ações trocam de lugar.', x0 + pad, yy + 8, 11, bindCapture ? '#ffd23f' : '#5c5c68', 'left');
    else if (o.k === 'key') {
      txt(o.label, x0 + pad, mid, 13, INK, 'left');
      const on = bindCapture === o.id;
      sbtn(on ? 'PRESSIONE...' : keyName(KEYS[o.id]), cx2, yy, KW, kh, () => { bindCapture = o.id; }, on ? 'primary' : undefined);
    } else if (o.k === 'reset') sbtn('RESTAURAR PADRÃO', cx - 115, yy + 6, 230, 40, () => { KEYDEFS.forEach(([id,, d]) => KEYS[id] = d); try { localStorage.setItem('oc_keys', JSON.stringify(KEYS)); } catch (e) {} bindCapture = null; });
    else if (o.k === 'fix') {
      txt(o.label, x0 + pad, mid, 13, 'rgba(231,228,211,.6)', 'left');
      ctx.beginPath(); ctx.roundRect(cx2 + .5, yy + .5, KW - 1, kh - 1, Math.min(12, kh * .28)); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.stroke();
      txt(o.val, cx2 + KW / 2, mid + 1, 13, 'rgba(231,228,211,.5)', 'center');
    } else if (o.k === 'aud') {
      const AW = clamp(colW * .5, 190, 270), ax = x0 + colW - pad - AW;
      txt(o.label, x0 + pad, mid, 13, INK, 'left');
      sbtn('<', ax, yy, 40, kh, o.dec); txt(o.val(), ax + AW / 2, mid + 1, 12, INK, 'center'); sbtn('>', ax + AW - 40, yy, 40, kh, o.inc);
    } else if (o.k === 'note') txt('As setas do teclado também movem o personagem.', cx, yy + 8, 11, '#5c5c68', 'center');
  }
  ctx.restore();
  if (maxS > 0) { const th = Math.max(30, (bot - top) * (bot - top) / y), ty = top + (bot - top - th) * (optScroll / maxS); ctx.beginPath(); ctx.roundRect(x0 + colW + 8, ty, 4, th, 2); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill(); }
  cornerBtn('VOLTAR', -1, W, H, () => setState(optBack));
  ctx.restore();
}
function wrapTxt(s, x, y, maxW, lh, size, color) {
  ctx.font = `bold ${size}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.shadowBlur = 0;
  let line = '', yy = y;
  for (const word of s.split(' ')) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = word; yy += lh; } else line = test;
  }
  ctx.fillText(line, x, yy); return yy;
}
/* Tela ARMAS: faixa de retângulos deitados embaixo (o do meio é o selecionado; começa NEUTRO) com a silhueta branca de cada arma.
   Ao parar numa arma: aura da cor dela, a arma sobe do retângulo e depois vai com a luz para a esquerda; as estatísticas aparecem à direita. */
const wrapN = (k, n) => ((k % n) + n) % n, easeOut3 = u => 1 - Math.pow(1 - u, 3), easeIO3 = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
function drawAura(x, y, r, col, t, a, noSp) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  for (let L = 0; L < 3; L++) {   // três camadas de luz com a borda ondulando
    const r0 = r * (1 - L * .16), g = ctx.createRadialGradient(x, y, r0 * .08, x, y, r0 * 1.15);
    g.addColorStop(0, col + '66'); g.addColorStop(.4, col + '33'); g.addColorStop(.75, col + '00');
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const an = i / 72 * TAU, k = 1 + .06 * Math.sin(an * 5 + t * 2.1 + L * 2) + .045 * Math.sin(an * 9 - t * 3.3 + L) + .03 * Math.sin(an * 14 + t * 4.7 + L * 3);
      const px = x + Math.cos(an) * r0 * k, py = y + Math.sin(an) * r0 * k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  }
  if (!noSp) for (let i = 0; i < 12; i++) {   // faíscas de luz subindo
    const ph = (t * .32 + i / 12) % 1, px = x + Math.sin(i * 12.9 + 1.3) * r * .75, py = y + r * .7 - ph * r * 1.5;
    ctx.globalAlpha = a * (1 - ph) * .8; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, 2.4 * (1 - ph) + .6, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function silAt(q, x, y, sc, col) {   // silhueta da arma centralizada em (x, y)
  const S = q.sil; ctx.save(); ctx.fillStyle = col; ctx.translate(x - S.w * sc / 2, y - S.h * sc / 2); ctx.scale(sc, sc); S.draw(); ctx.restore();
}
function drawBeam(bx, fy, hw, a, t) {   // feixe de luz que cai do alto e termina numa poça de luz no chão, em (bx, fy); hw = meia largura na base
  if (a <= 0) return;
  const INKC = '231,228,211', top = -10, ht = fy - top, h0 = 5 + hw * .1;
  ctx.save();
  for (let L = 0; L < 3; L++) {   // três camadas: cada uma mais estreita e mais forte
    const kk = 1 - L * .28, gr = ctx.createLinearGradient(0, top, 0, fy);
    gr.addColorStop(0, `rgba(${INKC},0)`); gr.addColorStop(.4, `rgba(${INKC},${.03 * (L + 1)})`); gr.addColorStop(1, `rgba(${INKC},${.07 * (L + 1)})`);
    const w = hw * kk * (1 + .02 * Math.sin(t * 1.7 + L));
    ctx.globalAlpha = a; ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(bx - h0 * kk, top); ctx.lineTo(bx + h0 * kk, top); ctx.lineTo(bx + w, fy); ctx.ellipse(bx, fy, w, w * .2, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
  }
  ctx.save(); ctx.translate(bx, fy); ctx.scale(1, .2);   // poça de luz no chão
  const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, hw * 1.15); pg.addColorStop(0, `rgba(${INKC},.3)`); pg.addColorStop(.6, `rgba(${INKC},.09)`); pg.addColorStop(1, `rgba(${INKC},0)`);
  ctx.globalAlpha = a; ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, hw * 1.15, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = `rgb(${INKC})`;   // poeira flutuando dentro do feixe
  for (let i = 0; i < 16; i++) {
    const sd = i * 53.7, fr = v => v - Math.floor(v), ph = (t * (.05 + .05 * fr(sd * 1.7)) + fr(sd * 3.1)) % 1, wy = h0 + (hw - h0) * ph;
    ctx.globalAlpha = a * .55 * Math.sin(Math.PI * ph); ctx.fillRect(bx + (fr(sd * 5.3) * 2 - 1) * wy * .9 + Math.sin(t * .8 + sd) * 4, top + ht * ph, 1.6, 1.6);
  }
  ctx.restore();
}
function drawPicker(t, o) {
  const S0 = o.st;
  const ms = uiScale(), W = innerWidth / ms, H = innerHeight / ms, cx = W / 2, N = o.N, wide = W > 820;
  const dt = clamp(t - S0.last, 0, .05); S0.last = t;
  const ent = scrEnter(o.title);
  ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, innerWidth, innerHeight); lobbyBg(W, H, ms, 1, ent, 'none');   // mesmo fundo do menu, sem luz de ambiente (o feixe é da própria tela)
  ctx.save(); ctx.scale(ms, ms);
  // animação da faixa e controle do tempo da arma selecionada
  S0.p += (S0.idx - S0.p) * (1 - Math.exp(-13 * dt)); if (Math.abs(S0.idx - S0.p) < .004) S0.p = S0.idx;
  const cur = wrapN(S0.idx, N);
  if (S0.sI == null) S0.sI = S0.idx;   // ao abrir a tela, sem som
  if (S0.idx !== S0.sI) { if (S0.sk) S0.sk = 0; else sfxScroll(S0.idx > S0.sI ? 1 : -1); S0.sI = S0.idx; }   // rolar a barra (roda, setas): tique; o clique numa aba já tem o som de botão
  if (cur !== S0.prev) { if (S0.prev > 0 && S0.selT > 0) S0.out = { k: S0.prev, T: S0.selT, life: .16 }; S0.prev = cur; S0.selT = 0; S0.sf = 0; }
  if (cur > 0 && Math.abs(S0.idx - S0.p) < .35) S0.selT += dt;   // a animação começa quando a faixa assenta
  if (cur > 0) {   // sons do aparecimento da peça, no mesmo ritmo da animação (luz, subida, encaixe, estatísticas)
    const T = S0.selT, w = o.title === 'ARMAS', f = S0.sf | 0;
    if (!(f & 1) && T > .1) { S0.sf = f | 1; sfxPickBeam(); }
    else if (!(f & 2) && T > .55) { S0.sf = f | 2; sfxPickRise(w); }
    else if (!(f & 4) && T > 1.0) { S0.sf = f | 4; sfxPickSettle(); }
    else if (!(f & 8) && T > 1.5) { S0.sf = f | 8; sfxPickPanel(); }
  }
  if (S0.out) { S0.out.life -= dt; if (S0.out.life <= 0) S0.out = null; }
  scrHead(o.title, cx, 36, clamp(Math.min(W / 14, H / 14), 20, 32), W, ent);
  // medidas
  const sp = clamp(W / 7.4, 64, 150), sw = sp - 12, sh = clamp(sw * .56, 40, 84), stripY = H - 76 - sh / 2, top = 84, bot = stripY - sh / 2 - 26;
  const R = wide ? clamp(Math.min((bot - top) / 2, W * .21), 70, 200) : clamp(Math.min(W * .28, (bot - top) * .17), 44, 100);
  const endX = wide ? W * .34 : cx, endY = wide ? (top + bot) / 2 : top + R + 4;
  const g = { W, H, wide, cx, endX, endY, top, bot, R, sw, sh, stripY };
  const show = (it, T, A) => {
    const ac = '#e7e4d3';   // sem cor própria de cada peça: a luz é sempre a mesma, como no resto do jogo
    const bm = easeOut3(clamp((T - .1) / .5, 0, 1)), up = easeOut3(clamp((T - .55) / .4, 0, 1)), sl = easeIO3(clamp((T - 1.0) / .6, 0, 1));
    const px = cx + (endX - cx) * sl, py = stripY + (endY - stripY) * up + Math.sin(t * 2) * 3 * sl;
    // o feixe cai do alto sobre o retângulo escolhido e acompanha a peça até o lugar final, onde forma uma poça de luz no chão
    drawBeam(px, py + (-sh * .5 + (R * (o.floorK || .6) + sh * .5) * up), (sw * .7 + (R * (o.auraK || 1) * .5 - sw * .7) * up) * (.4 + .6 * bm), A * bm, t);
    if (up > 0) o.hero(it, px, py, up, g, A, ac);
    // estatísticas (lado direito)
    const pa = easeOut3(clamp((T - 1.5) / .45, 0, 1)); if (pa <= 0) return;
    o.panel(it, (wide ? W * .54 : 24) + (1 - pa) * 40, wide ? W * .41 : W - 48, pa, A, g);
  };
  if (S0.out) show(S0.out.k, S0.out.T, Math.max(0, S0.out.life / .16));
  if (cur > 0 && S0.selT > 0) show(cur, S0.selT, 1);
  // faixa de retângulos deitados (as pontas ficam cortadas)
  const half = Math.min(3 * sp - sw * .1, W / 2), eS = ent(.3), rise = (1 - eS) * 18;   // a faixa sobe e aparece na entrada da tela
  ctx.save(); ctx.translate(0, rise); ctx.beginPath(); ctx.rect(cx - half, stripY - sh, half * 2, sh * 2); ctx.clip();
  for (let k = Math.floor(S0.p) - 4; k <= Math.floor(S0.p) + 5; k++) {
    const rel = k - S0.p, ar = Math.abs(rel); if (ar > 3.6) continue;
    const it = wrapN(k, N), q = it ? o.accent(it) : null, x = cx + rel * sp, c = clamp(1 - ar, 0, 1), s = 1 + .1 * c, w2 = sw * s, h2 = sh * s;
    const hov = input.mx / ms > x - sw / 2 && input.mx / ms < x + sw / 2 && input.my / ms - rise > stripY - sh / 2 && input.my / ms - rise < stripY + sh / 2;
    ctx.save(); ctx.globalAlpha = clamp(1.15 - ar * .12, .35, 1) * eS;
    ctx.beginPath(); ctx.roundRect(x - w2 / 2 + .5, stripY - h2 / 2 + .5, w2 - 1, h2 - 1, 12);
    const gr = ctx.createLinearGradient(0, stripY - h2 / 2, 0, stripY + h2 / 2); gr.addColorStop(0, hov ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.05)'); gr.addColorStop(1, hov ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.012)');   // mesmo fundo dos cartões 1v1..4v4
    ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = hov ? '#e7e4d3' : 'rgba(255,255,255,.14)'; ctx.lineWidth = hov ? 2 : 1; ctx.stroke();
    if (q && c > 0) { ctx.save(); ctx.globalAlpha *= c; ctx.fillStyle = 'rgba(231,228,211,.12)'; ctx.fill(); ctx.strokeStyle = '#e7e4d3'; ctx.stroke(); ctx.restore(); }
    if (it && !(o.liftIcon && it === cur && S0.selT > .55)) o.icon(it, x, stripY, w2, h2);   // a arma que sobe sai do retângulo: ele fica vazio
    ctx.restore();
    if (ar <= 3) ui.push({ x: (x - sw / 2) * ms, y: (stripY - sh / 2 + rise) * ms, w: sw * ms, h: sh * ms, fn: () => { S0.idx = k; S0.sk = 1; } });
  }
  ctx.restore();
  ctx.globalAlpha = ent(.4); cornerBtn('VOLTAR', -1, W, H, () => setState('menu'));
  ctx.globalAlpha = ent(.6); txt(TOUCH ? o.hintT : o.hint, cx, H - 18, 12, 'rgba(255,255,255,.4)', 'center'); ctx.globalAlpha = 1;
  ctx.restore();
}

const weaponHero = (it, px, py, up, g, A, ac) => {
  const q = WEAPONS[WKEYS[it - 1]], S = q.sil, { sw, sh, R } = g;
  const sc0 = Math.min(sw * 1.1 * .72 / S.w, sh * 1.1 * .62 / S.h), tw = Math.min(R * 1.55 * S.hudW / 170, R * 1.9), sc1 = Math.min(tw / S.w, R * 1.3 / S.h);
  ctx.save(); ctx.globalAlpha = A;   // sem brilho neon em volta da arma
  silAt(q, px, py, sc0 + (sc1 - sc0) * up, '#ffffff'); ctx.restore();
};
const weaponPanel = (it, rx, rw, pa, A, g) => {
  const q = WEAPONS[WKEYS[it - 1]], { W, wide, top, bot, endY, R } = g; let y = endY + R + 30;
    const mx = f => Math.max(...WKEYS.map(z => f(WEAPONS[z])));
    const stats = q.melee ? [
      ['DANO', String(q.dmg), q.dmg / mx(z => z.dmg)],
      ['CADÊNCIA', (1 / q.rate).toFixed(1) + ' golpes/s', (1 / q.rate) / mx(z => 1 / z.rate)],
      ['ALCANCE', q.range + ' px', q.range / mx(z => z.range || 0)],
    ] : [
      ['DANO', q.pellets > 1 ? q.dmg + ' x ' + q.pellets : String(q.dmg), q.dmg * q.pellets / mx(z => z.dmg * (z.pellets || 1))],
      ['CADÊNCIA', (1 / q.rate).toFixed(1) + ' tiros/s', (1 / q.rate) / mx(z => 1 / z.rate)],
      ['PENTE', q.mag + ' + ' + q.reserve, q.mag / mx(z => z.mag)],
      ['ALCANCE', Math.round(q.speed * q.life) + ' px', q.speed * q.life / mx(z => z.speed * z.life)],
      ['PRECISÃO', Math.max(0, Math.round((1 - q.spread / .1) * 100)) + '%', clamp(1 - q.spread / .1, .05, 1)],
      ['RECARGA', q.reload.toFixed(1) + 's', clamp(1 - q.reload / 3, .05, 1)],
    ];
    // centraliza o bloco de texto na altura da arma (tela larga)
    const dSz = wide ? 14 : 12, dLh = wide ? 22 : 18; ctx.font = `bold ${dSz}px "Courier New", monospace`;
    let lines = 1, cl = ''; for (const wd of q.desc.split(' ')) { const tt = cl ? cl + ' ' + wd : wd; if (ctx.measureText(tt).width > rw && cl) { lines++; cl = wd; } else cl = tt; }
    const fixed = (wide ? 102 : 76) + (lines - 1) * dLh + (wide ? 44 : 30);
    let step = 34;
    if (wide) { step = clamp((bot + 18 - (top + 28) - fixed) / (stats.length - 1), 18, 34); y = Math.max(top + 28, endY - (fixed + (stats.length - 1) * step) / 2); }
    ctx.save(); ctx.globalAlpha = A * pa;
    txt(q.model, rx, y, wide ? clamp(W / 40, 24, 38) : 24, '#e7e4d3', 'left');
    txt(q.melee ? q.cal : 'Calibre ' + q.cal, rx, y + (wide ? 40 : 28), wide ? 18 : 15, '#e7e4d3', 'left');
    txt(q.kind || 'ARMA', rx, y + (wide ? 66 : 50), 13, 'rgba(255,255,255,.55)', 'left');
    y = wrapTxt(q.desc, rx, y + (wide ? 102 : 76), rw, wide ? 22 : 18, wide ? 14 : 12, 'rgba(255,255,255,.82)') + (wide ? 44 : 30);
    const bw = clamp(rw - 270, 100, 260); if (!wide) step = clamp((bot + 18 - y) / stats.length, 18, 34);
    for (const [label, val, pct] of stats) {
      txt(label, rx, y, 13, '#fff', 'left');
      ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.roundRect(rx + 120, y - 6, bw, 12, 6); ctx.fill();
      ctx.fillStyle = '#e7e4d3'; ctx.beginPath(); ctx.roundRect(rx + 120, y - 6, Math.max(bw * clamp(pct, .03, 1) * pa, 12), 12, 6); ctx.fill();
      txt(val, rx + 120 + bw + 12, y, 12, '#e7e4d3', 'left'); y += step;
    }
    ctx.restore();
};
const INFO = { idx: 0, p: 0, selT: 0, last: 0, prev: 0, out: null };
const resetPicker = st => { st.idx = 0; st.p = 0; st.selT = 0; st.prev = 0; st.out = null; st.sI = null; st.sf = 0; st.sk = 0; };
const drawInfo = t => drawPicker(t, { st: INFO, N: WKEYS.length + 1, title: 'ARMAS', liftIcon: true, auraK: 1.5, floorK: .5, hero: weaponHero, panel: weaponPanel,
  hint: 'Roda do mouse, setas ← → ou clique trocam de arma | Esc volta', hintT: 'Toque nos retângulos para trocar de arma',
  accent: it => WEAPONS[WKEYS[it - 1]].accent,
  icon: (it, x, y, w, h) => { const q = WEAPONS[WKEYS[it - 1]], S = q.sil; silAt(q, x, y, Math.min(w * .72 / S.w, h * .62 / S.h), '#ffffff'); } });
/* ------------------------- PERSONAGENS ---------------------------------- */
const bE = (x, y, rx, ry, f, st, lw = 2) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); if (f) { ctx.fillStyle = f; ctx.fill(); } if (st) { ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.stroke(); } };
const bP = (pts, f, st, lw = 2) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (f) { ctx.fillStyle = f; ctx.fill(); } if (st) { ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.stroke(); } };
const bL = (pts, c, lw) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.stroke(); };
/* Busto de frente, da cintura para cima. Origem: centro da cintura (y negativo = para cima) */
function drawBust(P) {
  if (P.spr) { const im = DETSPR.portrait; if (im.complete && im.naturalWidth) { const h = 275, w = h * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, -w / 2, -h + 12, w, h); } return; }   // personagem com foto: desenha a foto grande no lugar do busto
  const b = P.bulk || 1, sk = P.skin, K = 'rgba(0,0,0,.78)', id = P.id, R = [-1, 1];
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.save(); ctx.scale(b, 1);
  for (const s of R) {   // braços
    const A = [[s * 80, -122], [s * 91, -14]]; bL(A, K, 37); bL(A, P.bare ? sk : P.jacket, 33); bE(s * 91, -12, 16, 17, P.glove || sk, K);
    if (id === 'vargo') bL([[s * 84, -100], [s * 88, -82], [s * 80, -64], [s * 90, -46]], '#15151a', 3);
    if (id === 'kain') { bL([[s * 88, -52], [s * 91, -26]], '#25252a', 34); for (let i = 0; i < 3; i++) bE(s * 89, -48 + i * 9, 2.2, 2.2, '#c9ccd4'); }
    if (id === 'viuva') bL([[s * 86, -40], [s * 96, -40]], '#c9a227', 5);
  }
  ctx.beginPath(); ctx.moveTo(-60, 4); ctx.lineTo(-66, -80); ctx.quadraticCurveTo(-92, -110, -78, -132); ctx.quadraticCurveTo(-60, -146, -22, -150); ctx.lineTo(22, -150);
  ctx.quadraticCurveTo(60, -146, 78, -132); ctx.quadraticCurveTo(92, -110, 66, -80); ctx.lineTo(60, 4); ctx.closePath();
  ctx.fillStyle = id === 'kain' ? sk : P.jacket; ctx.fill(); ctx.strokeStyle = K; ctx.lineWidth = 2.5; ctx.stroke();
  if (id === 'vargo') bP([[-24, -150], [24, -150], [0, -104]], sk, K);
  if (id === 'kain') for (const s of R) { bP([[s * 60, 4], [s * 66, -80], [s * 78, -132], [s * 60, -146], [s * 24, -150], [s * 10, -100], [s * 12, 4]], P.jacket, K); for (let i = 0; i < 7; i++) bE(s * 14, -10 - i * 14, 2.4, 2.4, '#c9ccd4'); }
  if (id === 'nox') for (const s of R) bL([[s * 7, -142], [s * 9, -112]], '#d8d8de', 2);
  if (id === 'viuva') { bP([[-24, -150], [0, -100], [24, -150], [0, -136]], P.jDark, K); for (const y of [-92, -66, -40]) bE(0, y, 3.2, 3.2, '#c9a227', K, 1); }
  if (id === 'serra') {
    bL([[-50, -146], [40, -30]], '#2c3320', 9); bL([[50, -146], [-40, -30]], '#2c3320', 9); bP([[-6, -92], [6, -92], [6, -80], [-6, -80]], '#8b8f6a', K, 1.5);
    for (const s of R) { ctx.beginPath(); ctx.roundRect(s > 0 ? 18 : -50, -52, 32, 26, 4); ctx.fillStyle = '#3b4428'; ctx.fill(); ctx.stroke(); bE(s * 78, -130, 18, 10, '#3b4428', K); }
  }
  if (!['vargo', 'nox', 'kain', 'viuva', 'serra'].includes(id)) for (const s of R) bL([[s * 30, -148], [s * 26, -10]], P.stripe, 4);   // listras da jaqueta dos personagens provisórios
  ctx.beginPath(); ctx.roundRect(-16 * (id === 'vargo' ? 1.2 : 1), -172, 32 * (id === 'vargo' ? 1.2 : 1), 42, 8); ctx.fillStyle = P.skinD; ctx.fill();
  ctx.restore();
  const hx = -60 / 60;  // (cabeça sem escala lateral)
  if (id === 'viuva') for (const s of R) bP([[s * 56, -140], [s * 30, -178], [s * 12, -148]], P.jDark, K);
  if (id === 'nox') { bE(0, -196, 46, 50, P.jacket, K, 2.5); bE(0, -190, 36, 42, '#050508'); }
  if (id === 'kain') { bL([[-18, -152], [18, -152]], '#222', 9); for (let i = -2; i <= 2; i++) bP([[i * 8 - 3, -156], [i * 8, -168], [i * 8 + 3, -156]], '#c9ccd4', K, 1); }
  if (id !== 'nox') { for (const s of R) bE(s * 30, -190, 5, 9, P.skinD, K, 1.5); bE(0, -192, id === 'vargo' ? 32 : 29, 37, sk, K); }
  if (id === 'vargo') {
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -192, 32, 37, 0, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(25,18,14,.62)'; ctx.fillRect(-40, -172, 80, 60); ctx.restore();
    for (const s of R) { bL([[s * 25, -206], [s * 6, -198]], '#1c1410', 7); bE(s * 14, -196, 6, 3, '#e8e2d0'); bE(s * 13, -196, 2.4, 2.4, '#111'); }
    bL([[-22, -216], [-9, -178]], '#8e3a3a', 3); for (const t of [.15, .4, .65, .9]) { const x = -22 + 13 * t, y = -216 + 38 * t; bL([[x - 4, y - 1], [x + 4, y + 1]], '#8e3a3a', 1.6); }
    bL([[0, -196], [-4, -181], [4, -181]], '#5a3a28', 2.5);
    ctx.beginPath(); ctx.roundRect(-13, -170, 26, 8, 3); ctx.fillStyle = '#e0dac8'; ctx.fill(); ctx.strokeStyle = K; ctx.lineWidth = 1.5; ctx.stroke(); for (let i = -2; i <= 2; i++) bL([[i * 5, -170], [i * 5, -162]], K, 1);
  } else if (id === 'nox') {
    ctx.beginPath(); ctx.roundRect(-25, -201, 50, 14, 7); ctx.fillStyle = '#b98a6c'; ctx.fill();
    ctx.save(); ctx.shadowColor = '#ff2b2b'; ctx.shadowBlur = 12; for (const s of R) bE(s * 11, -194, 5.5, 3.4, '#ff3030'); ctx.restore();
    for (const s of R) { bE(s * 11, -194, 1.6, 3, '#220000'); bL([[s * 24, -207], [s * 4, -198]], '#0b0b0e', 4.5); }
    bL([[-13, -168], [13, -168]], '#6b6b78', 1.8); for (let i = -2; i <= 2; i++) bL([[i * 5, -171], [i * 5, -165]], '#6b6b78', 1.4);
  } else if (id === 'kain') {
    for (const s of R) bE(s * 26, -196, 6, 18, 'rgba(60,20,20,.35)');
    bE(0, -214, 12, 6, P.hair, K, 1.5); for (let i = 0; i < 5; i++) { const x = -16 + i * 8; bP([[x - 5, -214], [x + (i - 2) * 2, -262 + Math.abs(i - 2) * 10], [x + 5, -214]], P.hair, K); }
    for (const s of R) { bL([[s * 24, -206], [s * 5, -198]], '#401010', 5); bE(s * 13, -196, 6.5, 3.8, '#f1e8d8', P.accent, 1.5); bE(s * 13, -196, 2.4, 2.4, '#111'); bE(s * 31, -182, 4, 4, null, '#c9ccd4', 1.6); }
    bE(0, -181, 3.2, 3.2, null, '#c9ccd4', 1.6); ctx.beginPath(); ctx.roundRect(-14, -173, 28, 9, 3); ctx.fillStyle = '#f1ece0'; ctx.fill(); ctx.strokeStyle = K; ctx.lineWidth = 1.5; ctx.stroke(); bL([[-14, -168], [14, -168]], K, 1.2); bE(-9, -161, 2.6, 2.6, null, '#c9ccd4', 1.6);
  } else if (id === 'viuva') {
    ctx.beginPath(); ctx.ellipse(0, -208, 31, 27, 0, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = P.hair; ctx.fill(); for (const s of R) bL([[s * 29, -205], [s * 31, -178]], P.hair, 6);
    bL([[-4, -234], [-12, -210]], '#2d2630', 1.5);
    bE(-12, -194, 9, 7, '#08080a', K, 1.5); bL([[-30, -212], [-12, -194]], '#08080a', 3); bL([[-12, -194], [28, -222]], '#08080a', 3);
    bE(13, -195, 6, 3.4, '#e8eef0'); bE(13, -195, 2.2, 2.4, '#5d7c92'); bL([[4, -199], [24, -207]], '#0e0b0f', 3.2);
    bL([[14, -178], [25, -165]], '#a05a5a', 2); bL([[0, -194], [-3, -181], [3, -180]], P.skinD, 2); bL([[-9, -163], [0, -167], [9, -163]], '#a3162f', 3.6); bE(31, -184, 2.5, 5, '#c9a227');
  } else if (id === 'serra') {
    bE(0, -178, 27, 29, '#32352f', K); ctx.beginPath(); ctx.ellipse(0, -205, 35, 31, 0, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = P.hair; ctx.fill(); ctx.strokeStyle = K; ctx.lineWidth = 2; ctx.stroke(); bL([[-35, -205], [35, -205]], '#1b2014', 4);
    for (const s of R) { bE(s * 13, -194, 11, 10, '#15170f', K); bE(s * 13, -194, 8, 7, '#7fe0d0'); bE(s * 13, -194, 3, 3, '#0a2a26'); bE(s * 11, -198, 3, 2, '#e9fffa'); bL([[s * 3, -196], [s * 23, -206]], '#15170f', 5); bL([[s * 28, -186], [s * 33, -168]], '#1b2014', 3); }
    bE(0, -166, 12, 10, '#6b6f66', K); for (const y of [-169, -163]) bL([[-8, y], [8, y]], '#222', 2);
  } else {   // rosto genérico dos personagens provisórios
    if (P.head === 'mohawk') for (let i = 0; i < 5; i++) { const x = -16 + i * 8; bP([[x - 5, -214], [x + (i - 2) * 2, -258 + Math.abs(i - 2) * 10], [x + 5, -214]], P.hair, K); }
    else if (P.head !== 'bald') { ctx.beginPath(); ctx.ellipse(0, -208, 31, 27, 0, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = P.hair; ctx.fill(); ctx.strokeStyle = K; ctx.lineWidth = 2; ctx.stroke(); for (const s of R) bL([[s * 29, -205], [s * 31, -184]], P.hair, 6); }
    for (const s of R) { bL([[s * 24, -207], [s * 5, -199]], P.head === 'bald' ? '#1c1410' : P.hair, 6); bE(s * 13, -196, 6.5, 3.8, '#f1e8d8'); bE(s * 13, -196, 2.4, 2.4, '#111'); }
    bL([[0, -196], [-4, -181], [4, -181]], P.skinD, 2.5); bL([[-9, -166], [0, -162], [9, -166]], '#6a2a2a', 3.4);
    if (P.head === 'bald' && P.beard) { ctx.save(); ctx.beginPath(); ctx.ellipse(0, -192, 29, 37, 0, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(26,20,16,.55)'; ctx.fillRect(-40, -172, 80, 60); ctx.restore(); }
  }
}
/* Imagem pronta do busto de cada personagem (colorida e toda branca), com a base já esmaecida na cintura.
   O busto é desenhado uma vez numa tela escondida (trocando o ctx por um instante) e guardado em P._img. */
const BK = 1.5, BW = 560, BH = 420, BY = 390;   // escala da captura, tamanho da tela escondida e linha da cintura (em pixels da captura)
function makeCharImg(P) {
  if (P.spr && !(DETSPR.portrait.complete && DETSPR.portrait.naturalWidth)) return;   // foto ainda carregando: tenta de novo no próximo quadro
  const c = document.createElement('canvas'); c.width = BW; c.height = BH;
  const real = ctx; ctx = c.getContext('2d');
  try { ctx.save(); ctx.translate(BW / 2, BY); ctx.scale(BK, BK); drawBust(P); ctx.restore(); } finally { ctx = real; }
  const x = c.getContext('2d'), d = x.getImageData(0, 0, BW, BH), px = d.data, fade = P.spr ? 0 : 50 * BK;   // a foto do corpo inteiro não esmaece na cintura
  for (let yy = 0; yy < BH && fade; yy++) {
    const m = yy >= BY ? 0 : yy > BY - fade ? (BY - yy) / fade : 1;
    for (let xx = 0; xx < BW; xx++) { const i = (yy * BW + xx) * 4 + 3; px[i] = px[i] * m; }
  }
  x.putImageData(d, 0, 0);
  const w = document.createElement('canvas'); w.width = BW; w.height = BH; const wx = w.getContext('2d');
  wx.drawImage(c, 0, 0); wx.globalCompositeOperation = 'source-in'; wx.fillStyle = '#ffffff'; wx.fillRect(0, 0, BW, BH);
  P._img = { c, w };
}
/* desenha o busto com a cintura em (x, base) e a escala s (1 = tamanho natural do desenho) */
const bustAt = (P, which, x, base, s, alpha) => { if (alpha <= 0 || !P._img) return; const k = s / BK; ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(P._img[which], x - BW / 2 * k, base - BY * k, BW * k, BH * k); ctx.restore(); };
const BUST_H = 255;   // altura do busto (da cintura ao topo da cabeça), em unidades do desenho
const charHero = (it, px, py, up, g, A, ac) => {
  const P = CHARS[it - 1], sF = Math.min(g.bot - g.top - 30, g.R * 1.75) / BUST_H, sS = g.sh * .8 / BUST_H, s = sS + (sF - sS) * up;
  const base = py + BUST_H * s / 2;
  ctx.save(); ctx.shadowBlur = 0;
  bustAt(P, 'w', px, base, s, A * (1 - clamp(up * 1.5 - .1, 0, 1)));   // sai do retângulo branco e ganha cor
  ctx.shadowBlur = 0; bustAt(P, 'c', px, base, s, A * clamp(up * 1.5 - .1, 0, 1)); ctx.restore();
};
const charPanel = (it, rx, rw, pa, A, g) => {
  const P = CHARS[it - 1], { W, wide, top, bot, endY, R } = g; let y = endY + R + 30;
  const dSz = 14, dLh = 22; ctx.font = `bold ${dSz}px "Courier New", monospace`;
  let lines = 1, cl = ''; for (const wd of P.bio.split(' ')) { const tt = cl ? cl + ' ' + wd : wd; if (ctx.measureText(tt).width > rw && cl) { lines++; cl = wd; } else cl = tt; }
  const fixed = 66 + (lines - 1) * dLh + 28 + 32 + 24;   // nome, apelido, biografia, estilo
  let step = 34;
  if (wide) { step = clamp((bot + 18 - (top + 28) - fixed) / (CSTATS.length - 1), 18, 34); y = Math.max(top + 28, endY - (fixed + (CSTATS.length - 1) * step) / 2); }
  ctx.save(); ctx.globalAlpha = A * pa;
  txt(P.name, rx, y, wide ? clamp(W / 40, 24, 38) : 24, '#e7e4d3', 'left'); txt(P.alias, rx, y + (wide ? 32 : 28), 14, '#e7e4d3', 'left');
  const bioEnd = wrapTxt(P.bio, rx, y + (wide ? 66 : 54), rw, wide ? 22 : 18, wide ? 14 : 12, 'rgba(255,255,255,.82)');
  let sy = bioEnd + 28;
  txt('ESTILO: ' + P.style, rx, sy, 13, 'rgba(231,228,211,.6)', 'left'); sy += 24;
  txt('MÃO DOMINANTE: ' + (P.hand === 'L' ? 'CANHOTO (ESQUERDA)' : 'DESTRO (DIREITA)'), rx, sy, 13, '#e7e4d3', 'left'); sy += 32;
  const abw = clamp(rw - 270, 100, 260); if (!wide) step = clamp((bot + 18 - sy) / CSTATS.length, 18, 34);
  for (const q of CSTATS) {
    const r = P.st[q.k];
    txt(q.label, rx, sy, 13, '#fff', 'left');
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.roundRect(rx + 120, sy - 6, abw, 12, 6); ctx.fill();
    ctx.fillStyle = '#e7e4d3'; ctx.beginPath(); ctx.roundRect(rx + 120, sy - 6, Math.max(abw * clamp(r / 10, .03, 1) * pa, 12), 12, 6); ctx.fill();
    txt(q.txt(q.m(r)), rx + 120 + abw + 12, sy, 12, '#e7e4d3', 'left'); sy += step;
  }
  ctx.restore();
};
const CHP = { idx: 0, p: 0, selT: 0, last: 0, prev: 0, out: null };
function drawChars(t) {
  for (const P of CHARS) if (!P._img) makeCharImg(P);
  drawPicker(t, { st: CHP, N: CHARS.length + 1, title: 'PERSONAGENS', floorK: .85, auraK: 1.1, hero: charHero, panel: charPanel,
    hint: 'Roda do mouse, setas ← → ou clique trocam de personagem | Esc volta', hintT: 'Toque nos retângulos para trocar de personagem',
    accent: it => CHARS[it - 1].accent,
    icon: (it, x, y, w, h) => { const s = Math.min(h * .8 / BUST_H, w * .42 / 150); bustAt(CHARS[it - 1], 'w', x, y + BUST_H * s / 2, s, 1); } });
}
