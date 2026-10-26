/* ------------------------------ DESENHO ------------------------------- */
function txt(s, x, y, size, color, align = 'left', glow = 0) {
  ctx.font = `bold ${size}px "Courier New", monospace`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0; ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.shadowBlur = 0;
}
const DEF_THEME = { f1: '#14141a', f2: '#17171e', grid: 'rgba(255,255,255,.035)', edge: 'rgba(255,255,255,.1)', T: 64 };
function drawFloor() {
  const th = curMap || DEF_THEME, T = th.T || 64, x0 = Math.floor(cam.x / T) * T, y0 = Math.floor(cam.y / T) * T, x1 = Math.min(WW, cam.x + VW + T), y1 = Math.min(WH, cam.y + VH + T);
  for (let y = y0; y < y1; y += T) for (let x = x0; x < x1; x += T) {
    ctx.fillStyle = ((x + y) / T) % 2 ? th.f1 : th.f2; ctx.fillRect(x, y, T, T);
  }
  ctx.strokeStyle = th.grid; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = x0; x < x1; x += T) { ctx.moveTo(x + .5, y0); ctx.lineTo(x + .5, y1); }
  for (let y = y0; y < y1; y += T) { ctx.moveTo(x0, y + .5); ctx.lineTo(x1, y + .5); }
  ctx.stroke();
  ctx.strokeStyle = th.edge; ctx.lineWidth = 2; ctx.strokeRect(8, 8, WW - 16, WH - 16);
  if (curMap && curMap.deco) drawMapLayer(curMap);   // piso, escadas e relevo do mapa (pré-renderizados)
}

/* ---- visual de cada tipo de obstáculo (vista de cima) ---- */
const CONT_COLS = [['#7a3328', '#5c261e'], ['#27506b', '#1d3d52'], ['#37603f', '#294a30'], ['#8c6f26', '#6b541c'], ['#5d4570', '#463455'], ['#6a6d75', '#4f5258']];
const crateShadow = c => castShadow(c, TALL[c.k] ? 1.6 : .5);   // cover alto: sombra longa; cover baixo: sombra curta
function boxStyle(c, pal) {   // caixote com X: pal = [base, interior, diagonais, borda, parafusos]
  crateShadow(c);
  ctx.fillStyle = pal[0]; ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.fillStyle = pal[1]; ctx.fillRect(c.x + 5, c.y + 5, c.w - 10, c.h - 10);
  ctx.strokeStyle = pal[2]; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(c.x + 5, c.y + 5); ctx.lineTo(c.x + c.w - 5, c.y + c.h - 5);
  ctx.moveTo(c.x + c.w - 5, c.y + 5); ctx.lineTo(c.x + 5, c.y + c.h - 5); ctx.stroke();
  ctx.strokeStyle = pal[3]; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, 3);
  ctx.fillStyle = pal[4]; for (const [bx, by] of [[3, 3], [c.w - 7, 3], [3, c.h - 7], [c.w - 7, c.h - 7]]) ctx.fillRect(c.x + bx, c.y + by, 4, 4);
}
const hazard = (c, col, gap = 16) => {   // listras diagonais de aviso dentro do retângulo
  ctx.save(); ctx.beginPath(); ctx.rect(c.x, c.y, c.w, c.h); ctx.clip(); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath();
  for (let i = -c.h; i < c.w; i += gap) { ctx.moveTo(c.x + i, c.y + c.h); ctx.lineTo(c.x + i + c.h, c.y); }
  ctx.stroke(); ctx.restore();
};
const DRAW_KIND = {
  box(c) { boxStyle(c, ['#23232c', '#2a2a35', '#3a3a48', '#5a5a6c', '#6c6c80']); },
  wood(c) { boxStyle(c, ['#33261a', '#4a3825', '#2a1f14', '#7a5c3c', '#8a6a44']); },
  cont(c) {   // contentor metálico ondulado
    crateShadow(c);
    const [a, b] = CONT_COLS[c.v % CONT_COLS.length], hor = c.w >= c.h;
    ctx.fillStyle = b; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = a; ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 2; ctx.beginPath();
    if (hor) for (let x = c.x + 12; x < c.x + c.w - 14; x += 10) { ctx.moveTo(x, c.y + 4); ctx.lineTo(x, c.y + c.h - 4); }
    else for (let y = c.y + 12; y < c.y + c.h - 14; y += 10) { ctx.moveTo(c.x + 4, y); ctx.lineTo(c.x + c.w - 4, y); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.1)'; if (hor) ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, 3); else ctx.fillRect(c.x + 3, c.y + 3, 3, c.h - 6);
    ctx.fillStyle = 'rgba(0,0,0,.38)'; if (hor) ctx.fillRect(c.x + c.w - 10, c.y + 3, 7, c.h - 6); else ctx.fillRect(c.x + 3, c.y + c.h - 10, c.w - 6, 7);
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  },
  crane(c) {   // base/perna de guindaste
    crateShadow(c);
    ctx.fillStyle = '#6f5714'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#b8932a'; ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    hazard({ x: c.x + 4, y: c.y + 4, w: c.w - 8, h: c.h - 8 }, 'rgba(20,16,6,.55)');
    ctx.strokeStyle = '#3a2f10'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c.x + 6, c.y + c.h / 2); ctx.lineTo(c.x + c.w - 6, c.y + c.h / 2); ctx.moveTo(c.x + c.w / 2, c.y + 6); ctx.lineTo(c.x + c.w / 2, c.y + c.h - 6); ctx.stroke();
    ctx.fillStyle = '#2a2208'; ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, Math.min(c.w, c.h) * .2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#e0c25a'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  },
  wall(c) {   // prédio visto de cima, com pichação na borda
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(c.x + 7, c.y + 8, c.w, c.h);
    ctx.fillStyle = '#231e26'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = c.v % 2 ? '#302833' : '#2b242e'; ctx.fillRect(c.x + 7, c.y + 7, c.w - 14, c.h - 14);
    ctx.strokeStyle = '#4a3d4c'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    const r = k => ((c.seed * 9301 + k * 49297) % 233280) / 233280;   // aleatório fixo por prédio
    for (let i = 0; i < 3; i++) {   // caixas e tubos no telhado
      const w = 30 + r(i) * 40, h = 22 + r(i + 5) * 30, x = c.x + 20 + r(i + 9) * Math.max(1, c.w - w - 40), y = c.y + 20 + r(i + 13) * Math.max(1, c.h - h - 40);
      ctx.fillStyle = '#3a303d'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#463b49'; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    }
    const cols = ['#d6457a', '#3fc1d6', '#e0b33d', '#7be06b']; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 4;
    for (let i = 0; i < 2; i++) {   // tags de spray junto às paredes
      const bx = c.x + 18 + r(i + 20) * Math.max(1, c.w - 90), by = c.y + c.h - 12;
      ctx.strokeStyle = cols[(c.seed + i) % 4]; ctx.globalAlpha = .8; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + 12, by - 12, bx + 24, by); ctx.quadraticCurveTo(bx + 36, by + 8, bx + 48, by - 4); ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.lineCap = 'butt';
  },
  dump(c) {   // contentor de lixo
    crateShadow(c);
    ctx.fillStyle = '#16291f'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#244434'; ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.fillStyle = '#2f5a45'; ctx.fillRect(c.x + 6, c.y + 6, c.w / 2 - 8, c.h - 12); ctx.fillStyle = '#2a4f3c'; ctx.fillRect(c.x + c.w / 2 + 2, c.y + 6, c.w / 2 - 8, c.h - 12);
    ctx.fillStyle = '#10201a'; ctx.fillRect(c.x + c.w / 2 - 1, c.y + 3, 2, c.h - 6);
    ctx.strokeStyle = '#5b8f77'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  },
  fire(c) {   // escada de incêndio
    crateShadow(c);
    ctx.fillStyle = '#1d1e25'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#555866'; ctx.lineWidth = 2; ctx.beginPath();
    if (c.h >= c.w) for (let y = c.y + 5; y < c.y + c.h - 2; y += 7) { ctx.moveTo(c.x + 3, y); ctx.lineTo(c.x + c.w - 3, y); }
    else for (let x = c.x + 5; x < c.x + c.w - 2; x += 7) { ctx.moveTo(x, c.y + 3); ctx.lineTo(x, c.y + c.h - 3); }
    ctx.stroke();
    ctx.strokeStyle = '#7b7e8e'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    ctx.fillStyle = '#33353f'; if (c.h >= c.w) ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, 12); else ctx.fillRect(c.x + 2, c.y + 2, 12, c.h - 4);
  },
  bin(c) {   // lixeira pequena
    crateShadow(c);
    ctx.fillStyle = '#2d3038'; ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 6); ctx.fill();
    ctx.fillStyle = '#434752'; ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, Math.min(c.w, c.h) * .36, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#6a6e7c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2, 6); ctx.stroke();
  },
  ac(c) {   // central de ar-condicionado com ventoinha girando
    crateShadow(c);
    ctx.fillStyle = '#2b2e36'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#3b3f49'; ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    const n = c.w > c.h * 1.5 ? 2 : 1, cw = c.w / n, rad = Math.min(cw, c.h) * .36;
    for (let i = 0; i < n; i++) {
      const fx = c.x + cw * (i + .5), fy = c.y + c.h / 2;
      ctx.fillStyle = '#16171c'; ctx.beginPath(); ctx.arc(fx, fy, rad, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#4a4e5a'; ctx.lineWidth = 3; ctx.beginPath();
      for (let b = 0; b < 3; b++) { const a = menuT * 7 + b * TAU / 3 + i; ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(a) * rad * .88, fy + Math.sin(a) * rad * .88); }
      ctx.stroke();
      ctx.strokeStyle = '#6b6f7e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(fx, fy, rad, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(fx, fy, rad * .45, 0, TAU); ctx.stroke();
    }
    ctx.strokeStyle = '#6b6f7e'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  },
  vent(c) {   // caixa de ventilação
    crateShadow(c);
    ctx.fillStyle = '#2f323b'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#13141a'; ctx.lineWidth = 2; ctx.beginPath();
    for (let y = c.y + 8; y < c.y + c.h - 4; y += 6) { ctx.moveTo(c.x + 5, y); ctx.lineTo(c.x + c.w - 5, y); }
    ctx.stroke();
    ctx.strokeStyle = '#6b6f7e'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  },
  tank(c) {   // caixa de água
    crateShadow(c);
    ctx.fillStyle = '#2e333d'; ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 14); ctx.fill();
    ctx.strokeStyle = '#424856'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = c.x + 14; x < c.x + c.w - 8; x += 14) { ctx.moveTo(x, c.y + 5); ctx.lineTo(x, c.y + c.h - 5); } ctx.stroke();
    ctx.fillStyle = '#4a5160'; ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, Math.min(c.w, c.h) * .14, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#6f7688'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2, 14); ctx.stroke();
  },
  pipe(c) {   // tubulação baixa
    crateShadow(c);
    ctx.fillStyle = '#3f4350'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#5b6072'; ctx.fillRect(c.x, c.y + 3, c.w, 4);
    ctx.fillStyle = '#2a2d37'; for (let x = c.x + 30; x < c.x + c.w - 10; x += 60) ctx.fillRect(x, c.y, 8, c.h);
    ctx.strokeStyle = '#7a7f92'; ctx.lineWidth = 1.5; ctx.strokeRect(c.x + .5, c.y + .5, c.w - 1, c.h - 1);
  },
  shed(c) {   // casa de máquinas
    crateShadow(c);
    ctx.fillStyle = '#23252d'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#323541'; ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
    ctx.fillStyle = '#1a1b21'; ctx.fillRect(c.x + c.w * .3, c.y + c.h - 14, c.w * .4, 9);
    ctx.fillStyle = '#e0b33d'; ctx.fillRect(c.x + c.w - 14, c.y + 9, 5, 5);
    ctx.strokeStyle = '#60647a'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  },
};
function drawCrates() {
  for (const c of crates) {
    if (c.x > cam.x + VW + 12 || c.x + c.w < cam.x - 12 || c.y > cam.y + VH + 12 || c.y + c.h < cam.y - 12) continue;   // fora da tela
    (DRAW_KIND[c.k] || DRAW_KIND.box)(c);
  }
  ctx.fillStyle = 'rgba(165,220,235,.55)'; for (const p of glassShards) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.beginPath(); ctx.moveTo(-p.s, 0); ctx.lineTo(p.s * .6, -p.s * .5); ctx.lineTo(p.s * .3, p.s * .6); ctx.closePath(); ctx.fill(); ctx.restore(); }   // cacos de vidro no chão
}

/* ------------------------------ MAPAS --------------------------------- */
/* L = obstáculos [x, y, w, h, tipo, variação], tudo em fração da largura (x, w) e da altura (y, h) do mundo.
   COVER BAIXO (LOWC: muretas, balcões, sofás, caixotes, lixeiras): bloqueia tiros de longe, mas quem está colado/em cobertura atira por cima.
   COVER ALTO (contêineres, dutos, paredes, estruturas): bloqueia tiros e a visão por completo.
   deco(g, H) = piso e relevo fixos (pré-renderizados uma vez em tela escondida); over(t) = camada animada por cima dos lutadores (fumaça, faíscas, holofotes, ponte rolante, névoa).
   pad = margem andável até a borda do mundo. */
const puddle = (x, y, rx, ry, col) => {
  const k = x + ',' + y + ',' + WW; if (!pools.has(k)) { const m = col.match(/[\d.]+/g); pools.set(k, { x: x * WW, y: y * WH, rx, ry, rgb: m[0] + ',' + m[1] + ',' + m[2] }); }
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x * WW, y * WH, rx, ry, 0, 0, TAU); ctx.fill(); };

const TALL = { cont: 1, ctop: 1, wall: 1, hwall: 1, crane: 1, ac: 1, vent: 1, tank: 1, shed: 1, duct: 1, fire: 1, lamp: 1, glass: 1 };
function castShadow(c, h) {   // sombra projetada: quanto mais alto o obstáculo, mais longa
  const dx = h * 7, dy = h * 9;
  ctx.fillStyle = 'rgba(0,0,0,' + (.24 + Math.min(h, 2) * .08).toFixed(2) + ')';
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y); ctx.lineTo(c.x + c.w + dx, c.y + dy); ctx.lineTo(c.x + c.w + dx, c.y + c.h + dy); ctx.lineTo(c.x + dx, c.y + c.h + dy); ctx.lineTo(c.x, c.y + c.h); ctx.closePath(); ctx.fill();
}

/* ---- ferramentas de desenho do piso (rodam numa tela escondida: g) ---- */
const seeded = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
function concreteG(g, x, y, w, h, R, a) {   // concreto: mancha, rachaduras e grão
  g.fillStyle = `rgba(150,155,170,${a})`; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(0,0,0,.26)'; g.lineWidth = 1.2;
  for (let i = 0, n = Math.max(2, w * h / 80000); i < n; i++) { let px = x + R() * w, py = y + R() * h; g.beginPath(); g.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (R() - .5) * 46; py += (R() - .3) * 30; g.lineTo(px, py); } g.stroke(); }
  for (let i = 0, n = w * h / 900; i < n; i++) { g.fillStyle = R() < .5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.09)'; g.fillRect(x + R() * w, y + R() * h, 2, 2); }
}
function gratingG(g, x, y, w, h) {   // piso metálico oco (grade): furos escuros entre as barras
  g.fillStyle = '#292c35'; g.fillRect(x, y, w, h);
  g.fillStyle = '#07080b'; for (let yy = y + 3; yy < y + h - 7; yy += 9) for (let xx = x + 3; xx < x + w - 7; xx += 9) g.fillRect(xx, yy, 6, 6);
  g.fillStyle = 'rgba(190,200,220,.10)'; for (let xx = x + 3; xx < x + w - 7; xx += 36) g.fillRect(xx - 3, y, 2, h);
  g.strokeStyle = 'rgba(160,170,190,.30)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
}
function tilesG(g, x, y, w, h, s) {   // azulejos
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  for (let yy = 0; yy * s < h; yy++) for (let xx = 0; xx * s < w; xx++) { g.fillStyle = (xx + yy) % 2 ? '#1b2530' : '#212d39'; g.fillRect(x + xx * s, y + yy * s, s, s); }
  g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2; g.beginPath(); for (let xx = 0; xx <= w; xx += s) { g.moveTo(x + xx, y); g.lineTo(x + xx, y + h); } for (let yy = 0; yy <= h; yy += s) { g.moveTo(x, y + yy); g.lineTo(x + w, y + yy); } g.stroke();
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, 'rgba(255,255,255,.07)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.04)'); g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.restore();
}
function grassG(g, cx, cy, r, R) {   // grama sintética do heliponto
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
  g.fillStyle = '#17231e'; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  for (let i = 0; i * 34 < r * 2; i++) if (i % 2) { g.fillStyle = 'rgba(255,255,255,.022)'; g.fillRect(cx - r, cy - r + i * 34, r * 2, 34); }
  g.lineWidth = 1.2; for (let i = 0, n = r * r * .05; i < n; i++) { g.strokeStyle = R() < .5 ? 'rgba(86,132,108,.30)' : 'rgba(38,66,52,.45)'; const px = cx + (R() * 2 - 1) * r, py = cy + (R() * 2 - 1) * r, a = -1.2 + R() * .6; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * 6, py + Math.sin(a) * 6); g.stroke(); }
  g.restore();
}
function oilG(g, x, y, rx, ry) {   // poça de óleo: escura com reflexo iridescente
  g.save(); g.translate(x, y); g.scale(1, ry / rx);
  let gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(6,6,10,.78)'); gr.addColorStop(1, 'rgba(6,6,10,.12)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill();
  g.beginPath(); g.arc(0, 0, rx * .98, 0, TAU); g.clip();
  g.fillStyle = 'rgba(130,70,170,.15)'; g.beginPath(); g.arc(-rx * .25, -rx * .15, rx * .6, 0, TAU); g.fill();
  g.fillStyle = 'rgba(60,170,160,.13)'; g.beginPath(); g.arc(rx * .25, rx * .1, rx * .5, 0, TAU); g.fill();
  g.restore();
}
function stairsG(g, x, y, w, h, dir, n, rails) {   // escada vista de cima: dir = para onde ela SOBE (r, l, u, d)
  const hor = dir === 'l' || dir === 'r', fwd = dir === 'r' || dir === 'd', L = hor ? w : h, st = L / n;
  g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x + 7, y + 9, w, h);   // sombra projetada no chão
  for (let i = 0; i < n; i++) {
    const hg = (fwd ? i : n - 1 - i) / Math.max(1, n - 1), a0 = i * st, rx = hor ? x + a0 : x, ry = hor ? y : y + a0, rw = hor ? st : w, rh = hor ? h : st;
    g.fillStyle = `hsl(232 8% ${14 + hg * 12}%)`; g.fillRect(rx, ry, rw, rh);
    g.fillStyle = 'rgba(0,0,0,.5)'; const lo = fwd ? 0 : st - 2; if (hor) g.fillRect(rx + lo, ry, 2, rh); else g.fillRect(rx, ry + lo, rw, 2);   // espelho do degrau (sombra)
    g.fillStyle = 'rgba(255,255,255,.13)'; const hi = fwd ? st - 1 : 0; if (hor) g.fillRect(rx + hi, ry, 1, rh); else g.fillRect(rx, ry + hi, rw, 1);   // quina iluminada
  }
  const gr = hor ? g.createLinearGradient(fwd ? x : x + w, 0, fwd ? x + w : x, 0) : g.createLinearGradient(0, fwd ? y : y + h, 0, fwd ? y + h : y);
  gr.addColorStop(0, 'rgba(0,0,0,.34)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, w, h);   // base do desnível mais escura
  if (rails !== false) { g.strokeStyle = 'rgba(150,160,185,.45)'; g.lineWidth = 2; g.beginPath(); if (hor) { g.moveTo(x, y + 1); g.lineTo(x + w, y + 1); g.moveTo(x, y + h - 1); g.lineTo(x + w, y + h - 1); } else { g.moveTo(x + 1, y); g.lineTo(x + 1, y + h); g.moveTo(x + w - 1, y); g.lineTo(x + w - 1, y + h); } g.stroke(); }
  g.restore();
}
function hazardG(g, x, y, w, h, col) {   // faixa de aviso diagonal
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.strokeStyle = col; g.lineWidth = 7; g.beginPath();
  for (let i = -h; i < w; i += 18) { g.moveTo(x + i, y + h); g.lineTo(x + i + h, y); } g.stroke(); g.restore();
}
function trashG(g, cx, cy, sx, sy, R) {   // lixo acumulado numa quina
  for (let i = 0, n = 6 + Math.floor(R() * 5); i < n; i++) {
    const px = cx + sx * (4 + R() * 36), py = cy + sy * (4 + R() * 36), t = R();
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(px + 2, py + 3, 9, 6, 0, 0, TAU); g.fill();
    if (t < .4) { const r = 6 + R() * 5; g.fillStyle = 'rgba(17,19,25,.95)'; g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1.5; g.beginPath(); g.arc(px - 1, py - 1, r * .6, 3.4, 4.8); g.stroke(); }
    else if (t < .7) { g.save(); g.translate(px, py); g.rotate(R() * 3); g.fillStyle = '#3a342f'; g.fillRect(-8, -5, 16, 10); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.strokeRect(-8, -5, 16, 10); g.restore(); }
    else if (t < .88) { g.fillStyle = 'rgba(90,165,155,.75)'; g.beginPath(); g.arc(px, py, 2.6, 0, TAU); g.fill(); }
    else { g.save(); g.translate(px, py); g.rotate(R() * 3); g.fillStyle = 'rgba(220,215,200,.45)'; g.fillRect(-5, -3, 10, 6); g.restore(); }
  }
}
/* tela escondida com o piso fixo do mapa (refeita só quando o mapa ou o tamanho da tela muda) */
const MAPCACHE = {};
function mapLayer(mp) {
  const cs = Math.min(clamp(ZOOM * RES, 1, 2), Math.sqrt(1.1e7 / (WW * WH))), key = mp.id + '|' + WW + '|' + WH + '|' + cs.toFixed(2);
  let m = MAPCACHE[mp.id];
  if (!m || m.key !== key) {
    for (const k in MAPCACHE) delete MAPCACHE[k];   // guarda só o mapa atual (memória)
    const cv = document.createElement('canvas'); cv.width = Math.ceil(WW * cs); cv.height = Math.ceil(WH * cs);
    const g = cv.getContext('2d'), P = [], R = seeded(mp.id.length * 7919 + 13); g.scale(cs, cs);
    const pool = (x, y, rx, ry, col) => {   // poça d'água: registrada para o jogo (mistura com sangue) e desenhada no piso
      const mm = col.match(/[\d.]+/g); P.push({ k: x + ',' + y + ',' + WW, x: x * WW, y: y * WH, rx, ry, rgb: mm[0] + ',' + mm[1] + ',' + mm[2] });
      g.fillStyle = col; g.beginPath(); g.ellipse(x * WW, y * WH, rx, ry, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(200,225,255,.10)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x * WW, y * WH, rx * .94, ry * .92, 0, 0, TAU); g.stroke(); };
    mp.deco(g, { W: WW, Ht: WH, R, pool });
    m = MAPCACHE[mp.id] = { key, cv, P, cs };
  }
  return m;
}
function drawMapLayer(mp) {
  const m = mapLayer(mp), cs = m.cs, sx = Math.max(0, Math.floor(cam.x)), sy = Math.max(0, Math.floor(cam.y)), sw = Math.min(WW - sx, VW + 3), sh = Math.min(WH - sy, VH + 3);
  if (sw > 0 && sh > 0) ctx.drawImage(m.cv, sx * cs, sy * cs, sw * cs, sh * cs, sx, sy, sw, sh);
  for (const p of m.P) if (!pools.has(p.k)) pools.set(p.k, p);
}
const inView = (x, y, r) => x > cam.x - r && x < cam.x + VW + r && y > cam.y - r && y < cam.y + VH + r;
const lightG = (x, y, r, rgb, a) => { const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
function beam(x, y, ang, len, half, rgb, a) {   // cone de holofote
  const gr = ctx.createLinearGradient(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang - half) * len, y + Math.sin(ang - half) * len); ctx.lineTo(x + Math.cos(ang + half) * len, y + Math.sin(ang + half) * len); ctx.closePath(); ctx.fill();
}

