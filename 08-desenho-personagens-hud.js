const MINI_COL = (k, v) => (k === 'cont' || k === 'ctop') ? CONT_COLS[v % CONT_COLS.length][0] : ({ wood: '#7a5c3c', crane: '#b8932a', wall: '#4a3d4c', dump: '#3a6a50', fire: '#7b7e8e', bin: '#6a6e7c', ac: '#6b6f7e', vent: '#6b6f7e', tank: '#6f7688', pipe: '#8a8da0', shed: '#60647a', lowwall: '#7e8190', counter: '#5a4c63', lcrate: '#59606c', sofa: '#6a3f58', hwall: '#6a6d80', glass: '#4a8da0', duct: '#8a8fa4', lamp: '#e7e4d3' })[k] || '#666';
function drawPickups(t) {
  for (const pk of pickups) {
    const w = WEAPONS[pk.key], bob = Math.sin(t * 3 + pk.t) * 2, pulse = .5 + .5 * Math.sin(t * 4 + pk.t);
    const B = sideBox(w), ps = w.len / B.w,   // no chão: mesmo tamanho que na mão e no ar
          ang = Math.sin(pk.t * 7.1) * .5 - .1;
    ctx.save(); ctx.translate(pk.x, pk.y);
    ctx.fillStyle = `rgba(255,214,90,${(.07 + .07 * pulse).toFixed(3)})`; ctx.beginPath(); ctx.arc(0, 0, 22 + pulse * 3, 0, TAU); ctx.fill();   // halo: ajuda a achar a arma no chão
    ctx.strokeStyle = `rgba(255,214,90,${(.22 + .25 * pulse).toFixed(3)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 16 + pulse * 2, 0, TAU); ctx.stroke();
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.beginPath(); ctx.ellipse(2, B.h * ps * .5 + 1, B.w * ps * .5, 4.5 * ps, 0, 0, TAU); ctx.fill();   // sombra no chão
    ctx.scale(ps, ps); drawSide(w);
    ctx.restore();
  }
}

/* Cabeça vista de cima (origem = centro da cabeça, olhando para +x) e acessórios de ombro de cada personagem */
function drawHeadTop(P) {
  const h = P.head; ctx.lineWidth = 1.5; ctx.strokeStyle = '#000';
  const cir = (x, y, r, c) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = c; ctx.fill(); ctx.stroke(); };
  if (h !== 'hood') for (const s of [-1, 1]) cir(0, s * 9, 2.6, P.skin);
  cir(0, 0, 9.6, P.skin);
  if (h === 'hood') { cir(-1, 0, 11.6, P.hair); cir(7, 0, 6, '#050508'); for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(8.6, s * 2.6, 1.3, 0, TAU); ctx.fillStyle = '#ff2b2b'; ctx.fill(); } return; }
  ctx.beginPath(); ctx.ellipse(9.2, 0, 2.4, 1.8, 0, 0, TAU); ctx.fillStyle = P.skin; ctx.fill();
  if (h === 'bald') {
    ctx.fillStyle = P.beard; ctx.beginPath(); ctx.arc(0, 0, 9.6, -1.15, 1.15); ctx.arc(2.5, 0, 7.2, 1.15, -1.15, true); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9b3b3b'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(6, 3); ctx.stroke();
  } else if (h === 'mohawk') { for (let i = 0; i < 5; i++) cir(-7 + i * 3.6, 0, 3.1, P.hair); for (const s of [-1, 1]) cir(0, s * 11.8, 1.3, '#ccd'); }
  else if (h === 'slick') { cir(-1.8, 0, 8.6, P.hair); cir(-10, 0, 3.8, P.hair); }
  else if (h === 'gas') {
    cir(-1.8, 0, 8.6, P.hair); cir(6, 0, 6.2, '#33372f'); for (const s of [-1, 1]) cir(6.8, s * 3.4, 2.4, '#7fe0d0');
    ctx.beginPath(); ctx.roundRect(9.5, -2.6, 5, 5.2, 1.5); ctx.fillStyle = '#6b6f66'; ctx.fill(); ctx.stroke();
  }
}
function drawPads(P) {
  if (!P.pads) return; ctx.lineWidth = 1.2; ctx.strokeStyle = '#000';
  for (const s of [-1, 1]) {
    if (P.pads === 'spikes') for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 4 - 2.2, s * 14); ctx.lineTo(i * 4 - 1, s * 23); ctx.lineTo(i * 4 + 2.2, s * 14); ctx.fillStyle = '#c9ccd4'; ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.roundRect(-5, s > 0 ? 11 : -19, 10, 8, 3); ctx.fillStyle = '#3b4428'; ctx.fill(); ctx.stroke(); }
  }
}

/* Braço de 2 segmentos (o comprimento se adapta, então nunca "desconecta") */
function drawArm(f, sx, sy, F, side, k = .52, hold = false, straight = false) {   // k: quanto o braço se dobra (.52 normal, .505 quase reto)
  const dx = F.x - sx, dy = F.y - sy, d = Math.max(Math.hypot(dx, dy), .001);
  const L = Math.max(10, d * k), h = straight ? 0 : Math.sqrt(Math.max(L * L - d * d / 4, 0));   // straight: sem dobra no cotovelo
  const ex = sx + dx / 2 + (-dy / d) * side * h, ey = sy + dy / 2 + (dx / d) * side * h;
  const seg = (ax, ay, bx, by, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); };
  const W1 = straight ? 8.5 : 9.5, W2 = straight ? 6.5 : 7.5, W3 = straight ? 8.5 : 8, W4 = straight ? 6.5 : 6;   // braço reto: mesma grossura do ombro à mão (sem degrau que parece dobra)
  seg(sx, sy, ex, ey, W1, (f.pal.bare ? f.pal.skinD : f.pal.jDark));
  const hp = handPath(F, Math.atan2(F.y - ey, F.x - ex), Math.max(F.ext || 0, 0), side, hold);
  // contorno só em volta do antebraço + mão juntos: primeiro tudo em tom escuro, depois o preenchimento por cima apaga a borda da emenda
  seg(ex, ey, F.x, F.y, W3, f.pal.skinD); ctx.strokeStyle = f.pal.skinD; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke(hp);
  seg(sx, sy, ex, ey, W2, (f.pal.bare ? f.pal.skin : f.pal.jacket));
  seg(ex, ey, F.x, F.y, W4, f.pal.skin); ctx.fillStyle = f.pal.skin; ctx.fill(hp);
}
function handPath(F, a, ext, side, hold) {   // punho fechado visto de cima (como numa mão segurando um cabo): fino no pulso, mais largo nos dedos; o cano sai pela frente
  const k = 1 + ext * .22, c = Math.cos(a), s = Math.sin(a), P = new Path2D();
  const pt = (x, y) => [F.x + (x * c - y * s) * k, F.y + (x * s + y * c) * k];
  const pt2 = (x, y) => pt(x, y * side);   // espelha para a mão esquerda/direita (o polegar fica do lado do corpo)
  if (!hold) {   // mão livre (soco/solta): punho fechado de lado, com o polegar sobre os dedos e a fileira de nós dos dedos na frente
    P.moveTo(...pt2(-9, -2.8));
    const c = (x1, y1, x2, y2, x3, y3) => P.bezierCurveTo(...pt2(x1, y1), ...pt2(x2, y2), ...pt2(x3, y3));
    c(-5, -3.2, -2.5, -5.4, 1, -6); c(3.6, -6.5, 6, -5.8, 6.8, -3.4); c(7.4, -1.2, 7.4, 1.6, 6.8, 3.4); c(6.2, 5.4, 4.4, 6, 2, 5.8); c(-2, 5.4, -5, 3.4, -9, 2.8);
    return P;
  }
  P.moveTo(...pt(-9, -3));
  const b = (x1, y1, x2, y2, x3, y3) => P.bezierCurveTo(...pt(x1, y1), ...pt(x2, y2), ...pt(x3, y3));
  b(-5, -3.2, -3, -4.9, 1.5, -4.9); b(3.8, -4.9, 5, -3.7, 5, -2); b(5, -.8, 5, .8, 5, 2); b(5, 3.7, 3.8, 4.9, 1.5, 4.9); b(-3, 4.9, -5, 3.2, -9, 3);
  return P;
}

/* Personagem caído (nocaute) + estrelinhas girando */
function drawStars(x, y, t) {
  for (let i = 0; i < 3; i++) {
    const a = t * 5 + i * TAU / 3, sx = x + Math.cos(a) * 16, sy = y - 20 + Math.sin(a) * 6;
    ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 2.2 : 5, b = k / 10 * TAU - Math.PI / 2; ctx.lineTo(sx + Math.cos(b) * r, sy + Math.sin(b) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}
function drawKnocked(f) {
  const ax = f.angle + Math.PI + f.fallDir * .5, t = menuT, pal = f.pal;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(f.x + 3, f.y + 5, 34, 15, ax, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(ax);
  ctx.globalAlpha = f.stun < .5 ? .65 + .35 * Math.sin(t * 45) : 1;   // pisca quando está quase levantando
  ctx.lineCap = 'round'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
  for (const s of [-1, 1]) {   // pernas e sapatos
    ctx.fillStyle = '#1c1830'; ctx.beginPath(); ctx.ellipse(-27, s * 5.5, 13, 4.6, s * .12, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0c0a14'; ctx.beginPath(); ctx.ellipse(-39, s * 6.5, 5.5, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
  }
  for (const s of [-1, 1]) {   // braços jogados para os lados
    const seg = (ax_, ay_, bx, by, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(ax_, ay_); ctx.lineTo(bx, by); ctx.stroke(); };
    seg(4, s * 11, 0, s * 19, 9.5, pal.bare ? pal.skinD : pal.jDark); seg(0, s * 19, -9, s * 24, 8, pal.skinD);
    seg(4, s * 11, 0, s * 19, 7.5, pal.bare ? pal.skin : pal.jacket); seg(0, s * 19, -9, s * 24, 6, pal.skin);
    ctx.beginPath(); ctx.arc(-9, s * 24, 5, 0, TAU); ctx.fillStyle = pal.skin; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#f4f1ea'; ctx.stroke();
  }
  ctx.fillStyle = pal.jacket; ctx.strokeStyle = pal.jDark; ctx.lineWidth = 2.5;   // tronco
  ctx.beginPath(); ctx.ellipse(-3, 0, 14, 12.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = pal.stripe; ctx.fillRect(-4, -12, 2.5, 24);
  ctx.save(); ctx.translate(15, 0); drawHeadTop(pal); ctx.restore();
  ctx.strokeStyle = '#2a1d18'; ctx.lineWidth = 1.4; ctx.beginPath();               // olhos fechados (X)
  for (const s of [-1, 1]) { ctx.moveTo(10.5, s * 3.2 - 1.4); ctx.lineTo(13.3, s * 3.2 + 1.4); ctx.moveTo(10.5, s * 3.2 + 1.4); ctx.lineTo(13.3, s * 3.2 - 1.4); }
  ctx.stroke();
  ctx.restore(); ctx.globalAlpha = 1;
  if (f.hitFlash > 0) { ctx.fillStyle = `rgba(255,255,255,${f.hitFlash * 5})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, 26, 15, ax, 0, TAU); ctx.fill(); }
  drawStars(f.x + Math.cos(ax) * 15, f.y + Math.sin(ax) * 15 + 6, t);
  ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(f.x - 19, f.y + 26, 38, 6);       // tempo de nocaute restante
  ctx.fillStyle = '#e7e4d3'; ctx.fillRect(f.x - 18, f.y + 27, 36 * clamp(f.stun / f.stunMax, 0, 1), 4);
  if (!f.isPlayer && f.hp < f.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(f.x - 18, f.y - 32, 36, 6);
    ctx.fillStyle = '#ff3b5c'; ctx.fillRect(f.x - 17, f.y - 31, 34 * f.hp / f.maxHp, 4);
  }
}
/* Armas arremessadas em voo */
function drawThrown() {
  for (const t of thrown) {
    const w = WEAPONS[t.key], sp = Math.hypot(t.vx, t.vy);
    if (sp > 150) {
      ctx.strokeStyle = `rgba(231,228,211,${Math.min(sp / 900, .5)})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(t.x - t.vx * .035, t.y - t.vy * .035); ctx.lineTo(t.x, t.y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(t.x + 2, t.y + 7, 15, 5, 0, 0, TAU); ctx.fill();
    if (w.knuckle) { const k = w.len / sideBox(w).w; ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot); ctx.scale(k, k); drawSide(w); ctx.restore(); continue; }   // soco-inglês: mesmo desenho e tamanho do chão
    const mn = Math.min(...w.parts.map(q => q[0])), mx = Math.max(...w.parts.map(q => q[0] + q[2]));
    ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot); if (w.vis) ctx.scale(w.vis, w.vis); ctx.translate(-(mn + mx) / 2, 0); drawWeapon(w); ctx.restore();
  }
}

/* Rasteira: o personagem escorrega no chão, meio deitado de costas, uma perna esticada à frente e a outra dobrada, com poeira levantando atrás */
function drawSlide(f) {
  const pal = f.pal, sa = (f.slideDx || f.slideDy) ? Math.atan2(f.slideDy, f.slideDx) : Math.atan2(f.vy, f.vx), pr = 1 - clamp(f.slideT / SLIDE.dur, 0, 1);   // sem slideDx (convidado online) usa a velocidade
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(f.x + 3, f.y + 5, 36, 15, sa, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(sa); if (lefty(f)) ctx.scale(1, -1); ctx.lineCap = 'round';
  const fade = clamp(f.slideT / .2, 0, 1);
  for (let i = 0; i < 7; i++) {   // poeira levantada pelo atrito com o chão
    const u = i / 6, a = .26 * (1 - u) * fade; if (a <= .01) continue;
    ctx.fillStyle = `rgba(150,140,125,${a})`; ctx.beginPath(); ctx.arc(-24 - u * 62, Math.sin(i * 2.7 + f.slideT * 9) * (4 + u * 9), 5 + u * 11, 0, TAU); ctx.fill();
  }
  const seg = (x1, y1, x2, y2, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const lift = 1 + .06 * Math.sin(pr * Math.PI);
  seg(1, -6, 11, -13, 10, '#000'); seg(11, -13, 22, -7, 9, '#000'); seg(1, -6, 11, -13, 8, '#1c1830'); seg(11, -13, 22, -7, 7, '#1c1830');   // perna de trás dobrada, joelho para fora
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.fillStyle = '#0c0a14'; ctx.beginPath(); ctx.ellipse(25, -6, 5.5, 4, .3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1c1830'; ctx.beginPath(); ctx.ellipse(17, 5, 15 * lift, 4.8, .06, 0, TAU); ctx.fill(); ctx.stroke();   // perna da frente esticada
  ctx.fillStyle = '#0c0a14'; ctx.beginPath(); ctx.ellipse(33 * lift, 5.5, 6, 4.4, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = pal.jacket; ctx.strokeStyle = pal.jDark; ctx.lineWidth = 2.5;   // tronco inclinado para trás
  ctx.beginPath(); ctx.ellipse(-6, 0, 12.5, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = pal.stripe; ctx.fillRect(-7.5, -13, 2.5, 26);
  const dk = pal.bare ? pal.skinD : pal.jDark, lt = pal.bare ? pal.skin : pal.jacket;
  seg(-2, -11, -12, -20, 9.5, dk); seg(-12, -20, -22, -23, 8, pal.skinD); seg(-2, -11, -12, -20, 7.5, lt); seg(-12, -20, -22, -23, 6, pal.skin);   // braço de trás apoiado no chão
  const slHand = (x, y, a, side, hold) => { const hp = handPath({ x, y }, a, 0, side, hold); ctx.lineJoin = 'round'; ctx.strokeStyle = pal.skinD; ctx.lineWidth = 2.6; ctx.stroke(hp); ctx.fillStyle = pal.skin; ctx.fill(hp); };   // mesma mão do personagem em pé (sem a bola branca)
  slHand(-22, -23, Math.atan2(-3, -10), -1, false);
  seg(-2, 11, 6, 16, 9.5, dk); seg(6, 16, 12, 15, 8, pal.skinD); seg(-2, 11, 6, 16, 7.5, lt); seg(6, 16, 12, 15, 6, pal.skin);   // braço da frente, perto do corpo
  const w = f.weapon && WEAPONS[f.weapon];
  if (w && w.parts && !w.knuckle) { const mn = Math.min(...w.parts.map(q => q[0])), mx = Math.max(...w.parts.map(q => q[0] + q[2])); ctx.save(); ctx.translate(14, 15); if (w.vis) ctx.scale(w.vis, w.vis); ctx.translate(-(mn + mx) / 2, 0); drawWeapon(w); ctx.restore(); }
  slHand(12, 15, Math.atan2(-1, 6), 1, !!w);
  ctx.save(); ctx.translate(-20, 0); drawHeadTop(pal); ctx.restore();   // cabeça mais atrás
  ctx.restore();
  if (f.isPlayer && f.slideCd > 0 && !f.dead) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(f.x - 14, f.y + 26, 28, 3); ctx.fillStyle = 'rgba(231,228,211,.75)'; ctx.fillRect(f.x - 14, f.y + 26, 28 * (1 - f.slideCd / (f.slideCdMax || SLIDE.cd)), 3); }
  if (!f.isPlayer && f.hp < f.maxHp) { ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(f.x - 18, f.y - 32, 36, 6); ctx.fillStyle = '#ff3b5c'; ctx.fillRect(f.x - 17, f.y - 31, 34 * f.hp / f.maxHp, 4); }
}
function drawFighter(f) {
  if (f.stun > 0) { drawKnocked(f); return; }
  if (f.slideT > 0) { drawSlide(f); return; }   // rasteira
  ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.beginPath(); ctx.ellipse(f.x + 4, f.y + 6, 20, 17, f.angle, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(f.x, f.y); if (f.cover) ctx.translate(-f.cover.ny * f.leanS * f.peekK * 9, f.cover.nx * f.leanS * f.peekK * 9); ctx.rotate(f.angle); if (f.cover) { const q = 1 - .1 * (1 - f.peekK); ctx.scale(q, q); }
  const sp = Math.min(Math.hypot(f.vx, f.vy) / C.moveSpeed, 1), ph = f.walk;
  const d = f.cover ? angDiff(Math.atan2(f.cover.ny, f.cover.nx), f.angle) * (1 - f.peekK) : 0;   // corpo de costas para a parede
  ctx.save(); ctx.rotate(d);

  // Pés: passos largos, o pé da frente "pisa" e o de trás levanta
  for (const s of [-1, 1]) {
    const a = ph + (s > 0 ? Math.PI : 0), step = Math.sin(a) * 12 * sp, up = Math.max(0, Math.cos(a)) * sp;
    ctx.fillStyle = '#0c0a14'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(step - 1, s * 7.5, 7 + up * 1.8, 4.2 + up * .8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  }

  // Tronco: balança com a passada e gira ao socar
  ctx.save(); ctx.rotate(f.twist + Math.sin(ph) * .16 * sp); ctx.scale(1 + Math.abs(Math.sin(ph)) * .05 * sp, 1);
  ctx.fillStyle = f.pal.jacket; ctx.strokeStyle = f.pal.jDark; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(-1, 0, 9, 17.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = f.pal.stripe; ctx.fillRect(-4, -17, 2.5, 34); drawPads(f.pal);
  ctx.restore(); ctx.restore();

  // Arma + braços
  const ct = Math.cos(f.twist), sn = Math.sin(f.twist);
  const lox = f.cover ? f.coverOff.x * Math.cos(f.angle) + f.coverOff.y * Math.sin(f.angle) : 0, loy = f.cover ? -f.coverOff.x * Math.sin(f.angle) + f.coverOff.y * Math.cos(f.angle) : 0;
  const shoulder = side => { const x = -sn * C.shoulder * side, y = ct * C.shoulder * side, cd = Math.cos(d), sd = Math.sin(d); return [x * cd - y * sd - lox, x * sd + y * cd - loy]; };
  ctx.save(); ctx.translate(lox, loy);   // braços e arma saem pela quina; os ombros ficam no corpo
  if (f.weapon && !WEAPONS[f.weapon].knuckle) {
    const w = WEAPONS[f.weapon], me = w.melee ? meleeExt(f) : 0, ox = (w.melee ? 3 + 17 * me : holdX(w)) - f.kick, bob = Math.sin(ph * 2) * .6 * sp, L = lefty(f);   // canhoto: a arma e os braços são espelhados
    const rot = w.melee ? swingRot(f) : 0, cr = Math.cos(rot), sr = Math.sin(rot);
    const vs = w.vis || 1, gp = g => ({ x: ox + (g[0] * cr - g[1] * sr) * vs, y: L ? bob - (g[0] * sr + g[1] * cr) * vs : bob + (g[0] * sr + g[1] * cr) * vs });
    if (w.melee && f.swing > .12 && f.swing < .7) {   // rastro do golpe
      ctx.save(); if (L) ctx.scale(1, -1);
      ctx.strokeStyle = `rgba(231,228,211,${(1 - (f.swing - .12) / .58) * .6})`; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, 48 * (w.vis || 1), -1.5, rot); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.translate(ox, bob); if (L) ctx.scale(1, -1); ctx.rotate(rot); if (w.vis) ctx.scale(w.vis, w.vis); drawWeapon(w); ctx.restore();
    const [lx, ly] = shoulder(-1), [rx, ry] = shoulder(1);
    if (w.melee) { const mk = .52 - .02 * clamp(me, 0, 1), st = me > .8; drawArm(f, lx, ly, gp(L ? w.gripR : w.gripL), -1, mk, true, st); drawArm(f, rx, ry, gp(L ? w.gripL : w.gripR), 1, mk, true, st); }
    else if (L) {
      drawArm(f, rx, ry, fistLocal(f, 'right'), 1);       // mão direita (não dominante) solta ao lado do corpo
      drawArm(f, lx, ly, gp(w.gripR), -1, .5, true, true);   // braço esquerdo esticado, segurando e apontando a arma
    } else {
      drawArm(f, lx, ly, fistLocal(f, 'left'), -1);       // mão esquerda solta ao lado do corpo
      drawArm(f, rx, ry, gp(w.gripR), 1, .5, true, true);           // braço direito esticado (reto de verdade), saindo do ombro e segurando a arma
    }
    if (f.flash > 0 && !w.melee) {  // Clarão do disparo (menor com silenciador)
      ctx.save(); ctx.translate(ox + w.muzzle, 0); ctx.rotate(rnd(-.3, .3)); const k = w.supp ? .45 : 1; ctx.scale(k, k);
      ctx.fillStyle = '#fff3b0'; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : rnd(9, 15), a = i / 10 * TAU; ctx.lineTo(Math.cos(a) * r + 4, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ff9a1c'; ctx.beginPath(); ctx.arc(4, 0, 4, 0, TAU); ctx.fill(); ctx.restore();
    }
  } else {
    const order = f.punch.left.t >= 0 && f.punch.right.t < 0 ? ['right', 'left'] : ['left', 'right'];
    for (const hand of order) { const s = hand === 'left' ? -1 : 1, [sx, sy] = shoulder(s), F = fistLocal(f, hand); drawArm(f, sx, sy, F, s);
      if (f.weapon && WEAPONS[f.weapon].knuckle && hand === domHand(f)) {   // soco-inglês: latão nos nós dos dedos (só na mão dominante)
        const a = Math.atan2(F.y - sy, F.x - sx), k = 1 + Math.max(F.ext || 0, 0) * .22;
        ctx.save(); ctx.translate(F.x, F.y); ctx.rotate(a); ctx.scale(k, k); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,.85)';
        WEAPONS.knuckles.handArt(f.pal.skin);
        ctx.restore();
      }
    }
  }

  ctx.restore();
  // Cabeça (com leve balanço)
  ctx.save(); ctx.rotate(d + f.twist * .45); ctx.translate(1 + Math.sin(ph * 2) * .8 * sp, 0);
  drawHeadTop(f.pal);
  ctx.restore(); ctx.restore();

  if (f.isPlayer && f.slideCd > 0 && !f.dead) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(f.x - 14, f.y + 26, 28, 3); ctx.fillStyle = 'rgba(231,228,211,.75)'; ctx.fillRect(f.x - 14, f.y + 26, 28 * (1 - f.slideCd / (f.slideCdMax || SLIDE.cd)), 3); }   // recarga do deslize
  if (f.hitFlash > 0) { ctx.fillStyle = `rgba(255,255,255,${f.hitFlash * 5})`; ctx.beginPath(); ctx.arc(f.x, f.y, 17, 0, TAU); ctx.fill(); }
  if (f.stag > 0 || f.micro > 0) drawStars(f.x, f.y + 4, menuT);   // atordoado pela batida
  if (!f.isPlayer && f.hp < f.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(f.x - 18, f.y - 32, 36, 6);
    ctx.fillStyle = '#ff3b5c'; ctx.fillRect(f.x - 17, f.y - 31, 34 * f.hp / f.maxHp, 4);
  }
}

function drawFx() {
  ctx.lineCap = 'round';
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1], b = trail[i]; if (Math.hypot(a.x - b.x, a.y - b.y) > 60) continue;
    ctx.strokeStyle = (b.heavy ? 'rgba(255,200,90,' : 'rgba(255,255,255,') + b.life * .5 + ')';
    ctx.lineWidth = 9 * b.life; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (const c of casings) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.globalAlpha = Math.min(c.life * 2, 1);
    ctx.fillStyle = c.big ? '#d94a3a' : '#e8c15a'; ctx.fillRect(-2, -1, c.big ? 5 : 4, c.big ? 2.6 : 2); ctx.restore();
  }
  ctx.lineCap = 'butt';   // pontas retas: com pontas redondas os segmentos semitransparentes se sobrepunham e formavam bolinhas
  for (const r of btrails) {   // rastro contínuo: cada ponto fica mais transparente e fino com o tempo
    const P = r.pts;
    for (let i = 1; i < P.length; i++) {
      const k = 1 - (btClock - P[i].t) / BTRAIL_LIFE; if (k <= 0) continue;
      ctx.strokeStyle = `rgba(255,255,255,${(k * k * .75).toFixed(3)})`; ctx.lineWidth = .8 + 2.4 * k;
      ctx.beginPath(); ctx.moveTo(P[i - 1].x, P[i - 1].y); ctx.lineTo(P[i].x, P[i].y); ctx.stroke();
    }
  }
  for (const b of bullets) {   // bala branca
    const m = 0.012; ctx.lineCap = 'round'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(b.x - b.vx * m, b.y - b.vy * m); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (const r of rings) { ctx.strokeStyle = (r.heavy ? 'rgba(255,190,70,' : 'rgba(255,255,255,') + r.life * .8 + ')'; ctx.lineWidth = 3 * r.life; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (r.heavy ? 1.4 : 1), 0, TAU); ctx.stroke(); }
  ctx.lineWidth = 2;
  for (const s of sparks) { ctx.strokeStyle = `rgba(255,${200 + 40 * s.life | 0},120,${s.life})`; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * .04, s.y - s.vy * .04); ctx.stroke(); }
  // Brilho dos disparos no chão
  ctx.globalCompositeOperation = 'lighter';
  for (const f of allF()) if (!f.dead && f.flash > 0) {
    const m = toWorld(f, 30, 0), g = ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, 90);
    g.addColorStop(0, 'rgba(255,190,90,.35)'); g.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = g; ctx.fillRect(m.x - 90, m.y - 90, 180, 180);
  }
  ctx.globalCompositeOperation = 'source-over';
}

/* -------- PAINEL SUPERIOR DIREITO: FPS e MS (tempo de cada quadro) + placar, tudo em branco -------- */
const PERF = { fps: 0, ms: 0, acc: 0, n: 0 };
function perfTick(ms) { PERF.acc += ms; PERF.n++; if (PERF.acc >= 500) { PERF.ms = PERF.acc / PERF.n; PERF.fps = 1000 / PERF.ms; PERF.acc = PERF.n = 0;
    if (typeof state !== 'undefined' && state === 'play' && !document.hidden && PERF.fps < 45 && RES > RES_MIN) { if (++_slow >= 3) { _slow = 0; RES = Math.max(RES_MIN, RES * 0.8); applyRes(); } } else _slow = 0; } }
function drawTopRight() {
  if (!player) return;
  const W = innerWidth, pw = 190, R = W - (TOUCH ? 76 : 16), x = R - pw, pad = 13, inMatch = M && !training, rows = [{ k: 'perf', h: 22 }];
  if (inMatch) {
    rows.push({ k: 'sep', h: 10 });
    if (M.team) { rows.push({ k: 'score', label: 'SEU TIME', v: M.sc[0], col: '#8fd6a4', h: 24 }, { k: 'score', label: 'INIMIGOS', v: M.sc[1], col: '#ff7a6b', h: 24 }, { k: 'sep', h: 10 }); for (const f of allF()) rows.push({ k: 'name', f, h: 18 }); }
    else for (const f of allF()) rows.push({ k: 'ffa', f, h: 19 });
  }
  const total = rows.reduce((a, r) => a + r.h, 0) + pad * 2 - 6;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.roundRect(x, 12, pw, total, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x + .5, 12.5, pw - 1, total - 1, 14); ctx.stroke();
  const dot = (cx, cy, col, a) => { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; };
  let y = 12 + pad - 3;
  for (const r of rows) {
    const cy = y + r.h / 2 + 1, xl = x + pad, xr = x + pw - pad;
    if (r.k === 'perf') { txt(PERF.fps ? `${Math.round(PERF.fps)} FPS` : '-- FPS', xl, cy, 12, '#fff', 'left'); txt(PERF.ms ? `${PERF.ms.toFixed(1)} MS` : '-- MS', xr, cy, 12, '#fff', 'right'); }
    else if (r.k === 'sep') { ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(xl, y + r.h / 2, pw - pad * 2, 1); }
    else if (r.k === 'score') { dot(xl + 4, cy, r.col, 1); txt(r.label, xl + 16, cy, 13, '#fff', 'left'); txt(String(r.v), xr, cy, 18, '#fff', 'right'); }
    else if (r.k === 'name') { const f = r.f; dot(xl + 4, cy, f.team === player.team ? '#8fd6a4' : '#ff7a6b', f.dead ? .3 : 1); txt(fname(f), xl + 16, cy, 11, f.dead ? 'rgba(255,255,255,.35)' : '#fff', 'left'); }
    else { const f = r.f; txt(fname(f), xl, cy, 12, f.dead ? 'rgba(255,255,255,.35)' : f.isPlayer ? '#fff' : 'rgba(255,255,255,.8)', 'left'); txt(String(M.sc[f.team]), xr, cy, 13, f.dead ? 'rgba(255,255,255,.35)' : '#fff', 'right'); }
    y += r.h;
  }
}
/* Marcador de combo (branco, com o número de acertos seguidos) e animação de abate (caveira vermelha) no centro, embaixo, na altura da arma */
function drawComboMark(cx, cy, u) {
  const RED = '#ff2b2b', DK = '#140000';
  if (killT >= 0) {   // abate: caveira vermelha com anéis girando e pulsando (o branco não aparece)
    const t = killT, a = t < 1.3 ? 1 : clamp(1 - (t - 1.3) / .5, 0, 1), pop = easeOutExpo(clamp(t / .3, 0, 1)), sc = 1 + .7 * (1 - pop);
    const sx = t < .25 ? Math.sin(t * 90) * (1 - t / .25) * .03 : 0;   // tremidinha no impacto
    ctx.save(); ctx.translate(cx + sx * u, cy); ctx.scale(u * sc, u * sc); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha = a * .62; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();   // fundo escuro, como na referência
    ctx.globalAlpha = a; ctx.shadowColor = RED; ctx.shadowBlur = 12; ctx.strokeStyle = RED; ctx.fillStyle = RED;
    ctx.lineWidth = .055; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.stroke();                              // anel externo
    ctx.save(); ctx.rotate(t * 1.1); ctx.lineWidth = .03; ctx.setLineDash([.28, .16]); ctx.beginPath(); ctx.arc(0, 0, .86, 0, TAU); ctx.stroke(); ctx.restore();   // anel tracejado girando
    for (let k = 0; k < 2; k++) { const w = (t * 1.3 + k * .5) % 1; ctx.globalAlpha = a * (1 - w) * .75; ctx.lineWidth = .022; ctx.beginPath(); ctx.arc(0, 0, .4 + w * .5, 0, TAU); ctx.stroke(); }   // ondas saindo da caveira
    if (t < .5) { const q = t / .5; ctx.globalAlpha = (1 - q) * .9; ctx.strokeStyle = '#ffb3a8'; ctx.lineWidth = .07 * (1 - q) + .01; ctx.beginPath(); ctx.arc(0, 0, 1 + q * .9, 0, TAU); ctx.stroke(); ctx.strokeStyle = RED; }   // onda de choque do abate
    ctx.globalAlpha = a; ctx.lineWidth = .05;
    for (let k = 0; k < 4; k++) {   // quatro raios cruzados, com a ponta cortando o anel
      const an = Math.PI / 4 + k * Math.PI / 2, c = Math.cos(an), s2 = Math.sin(an), l = 1.12 + .06 * Math.sin(t * 8 + k);
      ctx.beginPath(); ctx.moveTo(c * .52, s2 * .52); ctx.lineTo(c * l, s2 * l); ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.fillStyle = RED;
    ctx.beginPath(); ctx.moveTo(0, -.44);   // caveira: crânio + bochechas + mandíbula num contorno só
    ctx.bezierCurveTo(.26, -.44, .44, -.28, .42, -.06); ctx.bezierCurveTo(.41, .06, .32, .12, .28, .2); ctx.lineTo(.25, .36); ctx.quadraticCurveTo(.24, .43, .16, .43);
    ctx.lineTo(-.16, .43); ctx.quadraticCurveTo(-.24, .43, -.25, .36); ctx.lineTo(-.28, .2); ctx.bezierCurveTo(-.32, .12, -.41, .06, -.42, -.06); ctx.bezierCurveTo(-.44, -.28, -.26, -.44, 0, -.44);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = DK;
    for (const m of [-1, 1]) { ctx.beginPath(); ctx.moveTo(m * .05, .02); ctx.lineTo(m * .38, -.12); ctx.lineTo(m * .36, .07); ctx.quadraticCurveTo(m * .3, .17, m * .2, .15); ctx.lineTo(m * .08, .1); ctx.closePath(); ctx.fill(); }   // olhos bravos
    ctx.beginPath(); ctx.moveTo(0, .12); ctx.lineTo(-.055, .26); ctx.lineTo(.055, .26); ctx.closePath(); ctx.fill();   // nariz
    ctx.strokeStyle = DK; ctx.lineWidth = .03; ctx.beginPath(); ctx.moveTo(-.2, .32); ctx.lineTo(.2, .32); for (const x of [-.12, -.04, .04, .12]) { ctx.moveTo(x, .32); ctx.lineTo(x, .43); } ctx.stroke();   // dentes
    ctx.restore(); return;
  }
  if (cmbN < 1) return;
  const a = cmbT < .5 ? clamp(cmbT / .5, 0, 1) : 1, pop = Math.sin(clamp(cmbPop, 0, 1) * Math.PI / 2), age = easeOutExpo(clamp(cmbAge / .3, 0, 1));
  const sc = (.55 + .45 * age) * (1 + .2 * pop), q = 1 - clamp(cmbPop, 0, 1);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(u * sc, u * sc); ctx.lineCap = 'round'; ctx.strokeStyle = '#fff';
  ctx.globalAlpha = a * .12; ctx.lineWidth = .045; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.stroke();                                   // trilho do tempo
  ctx.globalAlpha = a; ctx.lineWidth = .06; ctx.beginPath(); ctx.arc(0, 0, 1, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(cmbT / 4, 0, 1)); ctx.stroke();   // arco que esvazia com o tempo
  ctx.save(); ctx.rotate(cmbAge * .9); ctx.globalAlpha = a * .7; ctx.lineWidth = .03; ctx.setLineDash([.22, .2]); ctx.beginPath(); ctx.arc(0, 0, .74, 0, TAU); ctx.stroke(); ctx.restore();   // anel interno girando
  if (cmbPop > 0) { ctx.globalAlpha = a * (1 - q); ctx.lineWidth = .05 * (1 - q) + .01; ctx.beginPath(); ctx.arc(0, 0, 1 + q * .7, 0, TAU); ctx.stroke(); }   // onda a cada acerto
  ctx.restore();
  ctx.globalAlpha = a; txt(String(cmbN), cx, cy + 2 - pop * u * .06, u * (cmbN > 9 ? .62 : .8) * (1 + .3 * pop) * (.6 + .4 * age), '#fff', 'center'); ctx.globalAlpha = 1;
}
function drawHUD(t) {
  const W = innerWidth, H = innerHeight;
  if (player.stun > 0 && !player.dead) {   // aviso de nocaute
    ctx.fillStyle = `rgba(10,5,25,${.2 + .1 * Math.sin(t * 8)})`; ctx.fillRect(0, 0, W, H);
    txt('ATORDOADO', W / 2, H - 96, 22, '#e7e4d3', 'center');
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.roundRect(W / 2 - 100, H - 74, 200, 12, 6); ctx.fill();
    ctx.fillStyle = '#e7e4d3'; ctx.beginPath(); ctx.roundRect(W / 2 - 98, H - 72, 196 * clamp(player.stun / player.stunMax, 0, 1), 8, 4); ctx.fill();
  }
  // Vida
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect(16, 16, 232, 22, 11); ctx.fill();
  const pct = clamp(player.hp / player.maxHp, 0, 1);
  if (pct > 0) { ctx.fillStyle = pct > .5 ? '#4cf08a' : pct > .25 ? '#ffd23f' : '#ff3b5c'; ctx.beginPath(); ctx.roundRect(20, 20, 224 * pct, 14, 7); ctx.fill(); }
  txt(`HP ${Math.ceil(player.hp)}`, 24, 27, 13, '#fff', 'left');
  if (TUT) { /* o tutorial tem o próprio painel */ } else if (training) { txt('MODO SOLITÁRIO', 18, 56, 18, '#e7e4d3', 'left'); txt('Sem bots  ·  munição infinita', 18, 80, 12, 'rgba(255,255,255,.6)', 'left'); }
  else { txt(`ABATES ${kills}`, 18, 56, 18, '#e7e4d3', 'left'); txt(`BOTS VIVOS ${bots.filter(b => !b.dead).length}/${bots.length}`, 18, 80, 14, 'rgba(255,255,255,.6)', 'left'); }

  // Arma selecionada (estilo Kusan): bala, munição, nome e silhueta (proporção das capturas do jogo)
  const CREAM = '#e7e4d3', HK = clamp(W / 2560 * 1.35, .6, 1.05), R = W - 76 * HK;   // margem da borda direita
  if (player.weapon) {
    const w = WEAPONS[player.weapon], S = w.sil;
    const sc = S.vertical ? S.hudH * HK / S.h : Math.min(({ cleaver: 230, butterfly: 230, sledge: 300, wrench: 280, bottle: 260, pocket: 280, crowbar: 300, sawed: 270 }[player.weapon] || 185) * HK / S.w, W * .42 / S.w), sw = S.w * sc, sh = S.h * sc, sy = H - 46 * HK - sh;   // margem da borda de baixo
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 8; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    drawSilhouette(w, R - sw, sy, sc, !S.vertical);
    ctx.fillStyle = CREAM; ctx.font = `700 ${32 * HK}px "Arial Rounded MT Bold","Trebuchet MS",Arial,sans-serif`;
    if (!w.melee) ctx.fillText(w.name, R, sy - 20 * HK);   // armas brancas: sem nome
    if (!w.melee) {
      ctx.globalAlpha = player.reloadT > 0 ? .4 : 1;
      const rs = '/' + player.reserve, ms = String(player.mag), ay = sy - 74 * HK;
      ctx.font = `300 ${34 * HK}px "Segoe UI","Helvetica Neue",Arial,sans-serif`; ctx.fillStyle = 'rgba(231,228,211,.6)';
      const rw = ctx.measureText(rs).width; ctx.fillText(rs, R, ay);
      ctx.font = `300 ${78 * HK}px "Segoe UI","Helvetica Neue",Arial,sans-serif`; ctx.fillStyle = player.mag === 0 ? '#ff7a6b' : CREAM;
      const mw = ctx.measureText(ms).width; ctx.fillText(ms, R - rw - 6 * HK, ay);
      // ícone da bala (inclinado)
      ctx.save(); ctx.translate(R - rw - mw - 50 * HK, sy - 100 * HK); ctx.scale(HK, HK); ctx.rotate(-Math.PI / 4); ctx.fillStyle = CREAM;
      ctx.beginPath(); ctx.roundRect(-14, -4.5, 20, 9, 1.5); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5, -4.5); ctx.lineTo(15, 0); ctx.lineTo(5, 4.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-14, -1, 20, 1.4); ctx.restore();
    }
    ctx.restore();
  }
  if (!player.dead) drawComboMark(W / 2, H - 46 * HK - 46 * HK, 46 * HK);
  if (player.near && !player.dead) {  // Aviso de pegar arma (coordenadas do mundo -> tela)
    const w = WEAPONS[player.near.key], px = (player.near.x - cam.x) * ZOOM, py = (player.near.y - cam.y) * ZOOM;
    txt(`[${keyName(KEYS.interact)}] PEGAR ${w.model}`, px, py - 56, 13, w.accent, 'center', 8);
    if (!w.melee) txt(`${player.near.mag} / ${player.near.reserve}`, px, py - 41, 11, '#fff', 'center');
  }

  if (!player.dead && player.hk) txt(`ARMA GUARDADA  ·  [${keyName(KEYS.holster)}] SACAR ${WEAPONS[player.hk].model}`, W / 2, TOUCH ? H - 100 : H - 62, 12, '#8a8a96', 'center');
  if (!player.dead && player.cover) {
    txt('EM COBERTURA', W / 2, H - 120, 18, '#8fd6a4', 'center');
    txt(player.coverBlock ? 'Sem ângulo: chegue mais perto da quina' : player.peekK > .5 ? 'EXPOSTO: tiro 100% preciso, mas você leva dano normal' : `Clique: tiro cego  ·  Botão dir.: espiar  ·  ${keyName(KEYS.cover)} ou afastar: sai`, W / 2, H - 98, 12, player.coverBlock ? '#ff6b6b' : player.peekK > .5 ? '#ffd23f' : 'rgba(255,255,255,.6)', 'center');
  } else if (!player.dead && player.stun <= 0 && nearestWall(player, 12)) txt(`[${keyName(KEYS.cover)}] COBERTURA`, (player.x - cam.x) * ZOOM, (player.y - cam.y) * ZOOM - 46, 12, '#8fd6a4', 'center');
  for (const b of bots) if (!b.dead && b.team !== player.team) {   // setas nas bordas apontando para bots fora da tela
    const sx = (b.x - cam.x) * ZOOM, sy = (b.y - cam.y) * ZOOM; if (sx > 0 && sx < W && sy > 0 && sy < H) continue;
    ctx.save(); ctx.translate(clamp(sx, 24, W - 24), clamp(sy, 24, H - 24)); ctx.rotate(Math.atan2(sy - H / 2, sx - W / 2)); ctx.fillStyle = 'rgba(255,59,92,.8)';
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -7); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  if (!player.dead && !player.weapon && !TUT) {   // desarmado: setas amarelas nas bordas para as 3 armas mais próximas fora da tela
    for (const pk of pickups.map(q => ({ q, d: Math.hypot(q.x - player.x, q.y - player.y) })).sort((a, b) => a.d - b.d).slice(0, 3).map(o => o.q)) {
      const sx = (pk.x - cam.x) * ZOOM, sy = (pk.y - cam.y) * ZOOM; if (sx > 0 && sx < W && sy > 0 && sy < H) continue;
      ctx.save(); ctx.translate(clamp(sx, 24, W - 24), clamp(sy, 24, H - 24)); ctx.rotate(Math.atan2(sy - H / 2, sx - W / 2)); ctx.fillStyle = 'rgba(255,214,90,.9)';
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -7); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  // Mira (e anel de recarga)
  const { mx: x, my: y } = TOUCH ? { mx: (player.x - cam.x) * ZOOM + Math.cos(touch.ang) * 130, my: (player.y - cam.y) * ZOOM + Math.sin(touch.ang) * 130 } : input;
  ctx.strokeStyle = player.coverBlock ? '#ff6b6b' : '#e7e4d3'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU);
  ctx.moveTo(x - 15, y); ctx.lineTo(x - 5, y); ctx.moveTo(x + 5, y); ctx.lineTo(x + 15, y);
  ctx.moveTo(x, y - 15); ctx.lineTo(x, y - 5); ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 15); ctx.stroke();
  if (player.reloadT > 0) { ctx.strokeStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, y, 18, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - player.reloadT / player.reloadMax)); ctx.stroke(); }
  ctx.shadowBlur = 0;
  if (dmgFlash > 0) { ctx.fillStyle = `rgba(255,30,60,${dmgFlash * .5})`; ctx.fillRect(0, 0, W, H); }
  drawTopRight(); drawMatchHUD(); if (TUT) drawTutorial();
  if (TOUCH && state === 'play') drawTouch();
}

