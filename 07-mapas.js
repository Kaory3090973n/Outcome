/* ---- obstáculos novos (e os reformados) ---- */
Object.assign(DRAW_KIND, {
  lowwall(c) {   // mureta / barreira de concreto (v=1: jardineira)
    crateShadow(c); ctx.fillStyle = '#3f414c'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#585a68'; ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    if (c.v === 1) { ctx.fillStyle = '#1f2b25'; ctx.fillRect(c.x + 5, c.y + 5, c.w - 10, c.h - 10); ctx.fillStyle = '#34503f'; for (let x = c.x + 12; x < c.x + c.w - 8; x += 17) { ctx.beginPath(); ctx.arc(x, c.y + c.h / 2, Math.min(7, c.h * .3), 0, TAU); ctx.fill(); } }
    else { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); const hor = c.w >= c.h; if (hor) for (let x = c.x + 44; x < c.x + c.w - 10; x += 44) { ctx.moveTo(x, c.y + 2); ctx.lineTo(x, c.y + c.h - 2); } else for (let y = c.y + 44; y < c.y + c.h - 10; y += 44) { ctx.moveTo(c.x + 2, y); ctx.lineTo(c.x + c.w - 2, y); } ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, 2); }
    ctx.strokeStyle = 'rgba(190,195,215,.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(c.x + .5, c.y + .5, c.w - 1, c.h - 1);
  },
  counter(c) {   // balcão do lounge
    crateShadow(c); ctx.fillStyle = '#211c27'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#352c3d'; ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, 3);
    const hor = c.w >= c.h, cols = ['rgba(90,170,160,.75)', 'rgba(220,170,80,.7)', 'rgba(170,80,100,.7)'];
    for (let i = 0, n = Math.floor((hor ? c.w : c.h) / 18); i < n; i++) { ctx.fillStyle = cols[i % 3]; ctx.beginPath(); ctx.arc(hor ? c.x + 12 + i * 18 : c.x + c.w * .5, hor ? c.y + c.h * .5 : c.y + 12 + i * 18, 3, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(63,193,214,.7)'; ctx.lineWidth = 2; ctx.beginPath(); if (hor) { ctx.moveTo(c.x + 2, c.y + c.h - 2); ctx.lineTo(c.x + c.w - 2, c.y + c.h - 2); } else { ctx.moveTo(c.x + 2, c.y + 2); ctx.lineTo(c.x + 2, c.y + c.h - 2); } ctx.stroke();   // linha de neon
    ctx.strokeStyle = '#5a4c63'; ctx.lineWidth = 1.5; ctx.strokeRect(c.x + .5, c.y + .5, c.w - 1, c.h - 1);
  },
  lcrate(c) {   // caixote / mesinha baixa
    crateShadow(c); const pal = [['#2a2e35', '#383d47'], ['#352c27', '#473a32'], ['#262d33', '#323c46']][c.v % 3];
    ctx.fillStyle = pal[0]; ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 3); ctx.fill();
    ctx.fillStyle = pal[1]; ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c.x + c.w / 2, c.y + 3); ctx.lineTo(c.x + c.w / 2, c.y + c.h - 3); ctx.moveTo(c.x + 3, c.y + c.h / 2); ctx.lineTo(c.x + c.w - 3, c.y + c.h / 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, 2);
    ctx.strokeStyle = 'rgba(180,185,200,.3)'; ctx.lineWidth = 1.5; ctx.strokeRect(c.x + .5, c.y + .5, c.w - 1, c.h - 1);
  },
  sofa(c) {   // sofá do lounge
    crateShadow(c); const hor = c.w >= c.h, col = c.v % 2 ? '#2e3140' : '#43283a';
    ctx.fillStyle = '#17161c'; ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 9); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6, 7); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.32)'; if (hor) ctx.fillRect(c.x + 5, c.y + 4, c.w - 10, c.h * .26); else ctx.fillRect(c.x + 4, c.y + 5, c.w * .26, c.h - 10);   // encosto
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); const n = Math.max(2, Math.round((hor ? c.w : c.h) / 56)); for (let i = 1; i < n; i++) { if (hor) { ctx.moveTo(c.x + c.w * i / n, c.y + c.h * .3); ctx.lineTo(c.x + c.w * i / n, c.y + c.h - 4); } else { ctx.moveTo(c.x + c.w * .3, c.y + c.h * i / n); ctx.lineTo(c.x + c.w - 4, c.y + c.h * i / n); } } ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.roundRect(c.x + 3, c.y + 3, c.w - 6, 3, 2); ctx.fill();
  },
  hwall(c) {   // parede / tapume alto de concreto
    crateShadow(c); ctx.fillStyle = '#1c1d24'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#2b2d37'; ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(c.x + c.w - 7, c.y + 3, 4, c.h - 6); ctx.fillRect(c.x + 3, c.y + c.h - 7, c.w - 6, 4);
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, 2);
    ctx.strokeStyle = '#6a6d80'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    ctx.strokeStyle = 'rgba(214,69,122,.55)'; ctx.lineWidth = 2; ctx.beginPath(); if (c.h >= c.w) { ctx.moveTo(c.x + 1, c.y + 4); ctx.lineTo(c.x + 1, c.y + c.h - 4); } else { ctx.moveTo(c.x + 4, c.y + 1); ctx.lineTo(c.x + c.w - 4, c.y + 1); } ctx.stroke();
  },
  glass(c) {   // vidraça tática (quebra com 2 tiros)
    ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(c.x + 4, c.y + 5, c.w, c.h);
    ctx.fillStyle = 'rgba(120,200,220,.16)'; ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = 'rgba(160,220,235,.55)'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2; ctx.beginPath(); const hor = c.w >= c.h; for (const o of [.25, .5]) { if (hor) { ctx.moveTo(c.x + c.w * o, c.y + c.h); ctx.lineTo(c.x + c.w * o + c.h, c.y); } else { ctx.moveTo(c.x, c.y + c.h * o + c.w); ctx.lineTo(c.x + c.w, c.y + c.h * o); } } ctx.stroke();
    ctx.fillStyle = '#4a4b5c'; if (hor) { ctx.fillRect(c.x, c.y, 5, c.h); ctx.fillRect(c.x + c.w - 5, c.y, 5, c.h); } else { ctx.fillRect(c.x, c.y, c.w, 5); ctx.fillRect(c.x, c.y + c.h - 5, c.w, 5); }
    if (c.hp < 2) {   // trincado
      const r = k => ((c.seed * 9301 + k * 49297) % 233280) / 233280, px = c.x + c.w * (.3 + r(1) * .4), py = c.y + c.h * (.3 + r(2) * .4);
      ctx.strokeStyle = 'rgba(235,245,250,.8)'; ctx.lineWidth = 1.3; ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + r(i + 3), l = 14 + r(i + 9) * 26; ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l * (c.w >= c.h ? 1 : 1)); } ctx.stroke();
    }
  },
  duct(c) {   // duto gigante de ventilação
    crateShadow(c); const hor = c.w >= c.h;
    ctx.fillStyle = '#15161c'; ctx.fillRect(c.x, c.y, c.w, c.h);
    const gr = hor ? ctx.createLinearGradient(0, c.y, 0, c.y + c.h) : ctx.createLinearGradient(c.x, 0, c.x + c.w, 0);
    gr.addColorStop(0, '#2a2d37'); gr.addColorStop(.35, '#4a4e5c'); gr.addColorStop(.7, '#333640'); gr.addColorStop(1, '#1c1d24'); ctx.fillStyle = gr; ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 3; ctx.beginPath();
    if (hor) for (let x = c.x + 40; x < c.x + c.w - 14; x += 64) { ctx.moveTo(x, c.y + 2); ctx.lineTo(x, c.y + c.h - 2); } else for (let y = c.y + 40; y < c.y + c.h - 14; y += 64) { ctx.moveTo(c.x + 2, y); ctx.lineTo(c.x + c.w - 2, y); }
    ctx.stroke(); ctx.fillStyle = '#80869a'; for (let i = 40; i < (hor ? c.w : c.h) - 14; i += 64) for (const s of [.2, .8]) { ctx.beginPath(); ctx.arc(hor ? c.x + i + 5 : c.x + c.w * s, hor ? c.y + c.h * s : c.y + i + 5, 1.8, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#6b6f7e'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  },
  lamp(c) {   // poste de holofote
    crateShadow(c); const cx = c.x + c.w / 2, cy = c.y + c.h / 2, r = Math.min(c.w, c.h) / 2;
    ctx.fillStyle = '#17181e'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5a5e70'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#e7e4d3'; ctx.beginPath(); ctx.arc(cx, cy, r * .42, 0, TAU); ctx.fill();
  },
  ctop(c) {   // pilha de contêineres (2 de altura): sombra longa e topo com reforços
    castShadow(c, 2.7); DRAW_KIND.cont(Object.assign({}, c, { k: 'cont' }));
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2; ctx.strokeRect(c.x + 5, c.y + 5, c.w - 10, c.h - 10);
    ctx.fillStyle = '#14151a'; for (const [a, b] of [[4, 4], [c.w - 14, 4], [4, c.h - 14], [c.w - 14, c.h - 14]]) ctx.fillRect(c.x + a, c.y + b, 10, 10);
  },
  fire(c) {   // escada de incêndio: plataforma de grade, lance de degraus com sombra e escada dobrável recolhida
    ctx.save(); ctx.translate(c.x, c.y); const vert = c.h >= c.w; if (!vert) ctx.transform(0, 1, 1, 0, 0, 0);
    const W = vert ? c.w : c.h, L = vert ? c.h : c.w, pl = Math.min(L * .26, 46), fold = Math.min(L * .2, 34);
    ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.fillRect(7, 9, W, L);   // sombra longa (estrutura alta)
    ctx.fillStyle = '#1b1c23'; ctx.fillRect(0, 0, W, L);
    ctx.fillStyle = '#2a2d36'; ctx.fillRect(2, 2, W - 4, pl); ctx.fillStyle = '#07080b'; for (let y = 5; y < pl - 3; y += 7) for (let x = 5; x < W - 7; x += 7) ctx.fillRect(x, y, 4, 4);   // plataforma de grade
    const n = Math.max(4, Math.floor((L - pl - fold) / 7)), st = (L - pl - fold) / n;
    for (let i = 0; i < n; i++) { ctx.fillStyle = `hsl(232 8% ${13 + i / n * 11}%)`; ctx.fillRect(2, pl + i * st, W - 4, st); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(2, pl + i * st + st - 1.5, W - 4, 1.5); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(2, pl + i * st, W - 4, 1); }
    const gr = ctx.createLinearGradient(0, pl, 0, pl + n * st); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.4)'); ctx.fillStyle = gr; ctx.fillRect(2, pl, W - 4, n * st);
    const y0 = L - fold; ctx.strokeStyle = '#6a6e7e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(3, y0); ctx.lineTo(3, L - 1); ctx.moveTo(W - 3, y0); ctx.lineTo(W - 3, L - 1); for (let y = y0 + 4; y < L - 3; y += 4.5) { ctx.moveTo(3, y); ctx.lineTo(W - 3, y); } ctx.stroke();   // escada dobrável recolhida
    ctx.fillStyle = '#8a8ea0'; ctx.beginPath(); ctx.arc(3, y0, 2.2, 0, TAU); ctx.arc(W - 3, y0, 2.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7b7e8e'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, W - 2, L - 2); ctx.restore();
  },
});
{ const _wall = DRAW_KIND.wall, _crane = DRAW_KIND.crane;
  DRAW_KIND.wall = c => { _wall(c); ctx.strokeStyle = ['rgba(214,69,122,.6)', 'rgba(63,193,214,.5)', 'rgba(224,179,61,.45)', 'rgba(214,69,122,.5)'][c.seed % 4]; ctx.lineWidth = 2; ctx.beginPath(); if (c.seed % 2) { ctx.moveTo(c.x + 6, c.y + c.h - 3); ctx.lineTo(c.x + c.w - 6, c.y + c.h - 3); } else { ctx.moveTo(c.x + 3, c.y + 6); ctx.lineTo(c.x + 3, c.y + c.h - 6); } ctx.stroke(); }; }   // linha de neon na fachada

/* ---- mapas ---- */
const MAPS = [
  { id: 'docas', name: 'DOCAS', sub: 'ESTALEIRO · PORTO', accent: '#e0b33d', spawn: [.5, .4], pad: 20,
    f1: '#0f1318', f2: '#12161c', grid: 'rgba(255,255,255,.028)', edge: 'rgba(224,179,61,.28)', T: 64,
    tip: () => 'Pilhas de contêineres em L bloqueiam tiros e visão; muretas e caixotes baixos deixam atirar por cima (' + keyName(KEYS.cover) + ' para se encostar).',
    desc: () => 'Zona industrial do porto com pilhas de contêineres em L formando um labirinto, ponte rolante elevada cruzando o pátio, poças de água salgada e holofotes varrendo a neblina marítima. Contêineres são cover alto: bloqueiam tiros e visão. Muretas de concreto e caixotes são cover baixo: de perto, dá para atirar por cima. Use a cobertura (' + keyName(KEYS.cover) + ') e espreite pelas pontas.',
    L: [
      [.07, .13, .14, .055, 'ctop', 0], [.07, .13, .028, .19, 'ctop', 4], [.79, .13, .14, .055, 'ctop', 3], [.902, .13, .028, .19, 'ctop', 1],
      [.07, .795, .14, .055, 'ctop', 2], [.07, .66, .028, .19, 'ctop', 5], [.79, .795, .14, .055, 'ctop', 1], [.902, .66, .028, .19, 'ctop', 0],
      [.26, .36, .12, .055, 'cont', 2], [.26, .36, .028, .16, 'cont', 5], [.62, .685, .12, .055, 'cont', 4], [.712, .58, .028, .16, 'cont', 0],
      [.62, .24, .12, .055, 'cont', 3], [.62, .24, .028, .16, 'cont', 1], [.26, .74, .12, .055, 'cont', 0], [.352, .60, .028, .195, 'cont', 2],
      [.41, .47, .18, .055, 'cont', 3],
      [.40, .08, .028, .17, 'cont', 2], [.572, .08, .028, .17, 'cont', 5], [.40, .75, .028, .17, 'cont', 0], [.572, .75, .028, .17, 'cont', 3],
      [.16, .47, .04, .07, 'crane'], [.80, .47, .04, .07, 'crane'],
      [.46, .20, .08, .022, 'lowwall'], [.46, .80, .08, .022, 'lowwall'], [.30, .20, .07, .022, 'lowwall'], [.63, .14, .07, .022, 'lowwall'], [.30, .86, .07, .022, 'lowwall'], [.63, .86, .07, .022, 'lowwall'],
      [.20, .28, .026, .045, 'lcrate', 0], [.15, .62, .026, .045, 'lcrate', 1], [.69, .33, .026, .045, 'lcrate', 2], [.80, .64, .026, .045, 'lcrate', 0], [.49, .30, .026, .045, 'lcrate', 1], [.49, .66, .026, .045, 'lcrate', 2],
      [.33, .11, .014, .025, 'lamp'], [.66, .11, .014, .025, 'lamp'], [.33, .89, .014, .025, 'lamp'], [.66, .89, .014, .025, 'lamp'],
    ],
    deco(g, { W, Ht, R, pool }) {
      const X = f => f * W, Y = f => f * Ht;
      for (const [a, b, c, d] of [[.02, .04, .30, .22], [.36, .05, .30, .20], [.70, .04, .28, .24], [.02, .70, .30, .26], [.36, .76, .30, .20], [.70, .70, .28, .26], [.26, .34, .48, .30]]) concreteG(g, X(a), Y(b), X(c), Y(d), R, .05);   // concreto rachado
      gratingG(g, X(.115), Y(.43), X(.13), Y(.16)); gratingG(g, X(.755), Y(.43), X(.13), Y(.16));   // piso metálico oco sob os guindastes
      for (const f of [.18, .82]) { g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = Y(.08); y < Y(.92); y += 15) g.fillRect(X(f) - 16, y, 32, 5); g.fillStyle = 'rgba(150,160,175,.38)'; g.fillRect(X(f) - 9, Y(.08), 3, Y(.84)); g.fillRect(X(f) + 6, Y(.08), 3, Y(.84)); }   // trilhos da ponte rolante
      g.save(); g.globalAlpha = .45; hazardG(g, X(.16) - 10, Y(.47) - 10, X(.04) + 20, Y(.07) + 20, '#6b5a22'); g.fillStyle = '#0f1318'; g.fillRect(X(.16), Y(.47), X(.04), Y(.07)); g.restore();
      g.strokeStyle = 'rgba(224,179,61,.2)'; g.lineWidth = 4; g.setLineDash([22, 18]); g.beginPath(); g.moveTo(X(.5), Y(.08)); g.lineTo(X(.5), Y(.92)); g.stroke(); g.setLineDash([]);   // faixa amarela do pátio
      g.fillStyle = 'rgba(224,179,61,.07)'; g.font = '800 54px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BAIA 07', X(.5), Y(.36)); g.fillText('BAIA 12', X(.5), Y(.62));
      const sea = g.createLinearGradient(0, 0, 0, 44); sea.addColorStop(0, '#07101a'); sea.addColorStop(1, '#101c2a'); g.fillStyle = sea; g.fillRect(0, 0, W, 40);   // mar ao norte
      g.strokeStyle = 'rgba(150,185,215,.14)'; g.lineWidth = 1.5; for (let i = 0; i < 90; i++) { const x = R() * W, y = 6 + R() * 28; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 9, y - 3, x + 18, y); g.stroke(); }
      g.fillStyle = '#3a3d48'; g.fillRect(0, 40, W, 4); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(0, 40, W, 1);
      for (let x = 70; x < W; x += 150) { g.fillStyle = '#16171d'; g.beginPath(); g.arc(x, 54, 8, 0, TAU); g.fill(); g.strokeStyle = '#555a6a'; g.lineWidth = 2; g.stroke(); }   // cabeços de amarração
      stairsG(g, X(.455), 26, X(.09), 74, 'd', 7);   // escada de acesso ao cais
      stairsG(g, X(.125), Y(.475), X(.035), Y(.055), 'r', 6); stairsG(g, X(.84), Y(.475), X(.035), Y(.055), 'l', 6);   // escadas até os guindastes
      pool(.30, .50, 78, 28, 'rgba(90,130,170,.10)'); pool(.68, .42, 96, 32, 'rgba(90,130,170,.10)'); pool(.52, .78, 86, 30, 'rgba(90,130,170,.09)'); pool(.20, .25, 66, 24, 'rgba(90,130,170,.09)'); pool(.76, .80, 74, 26, 'rgba(90,130,170,.09)'); pool(.30, .66, 60, 22, 'rgba(90,130,170,.08)');
      oilG(g, X(.56), Y(.62), 64, 22); oilG(g, X(.22), Y(.45), 52, 18); oilG(g, X(.74), Y(.20), 46, 16);
      g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2; for (const [fx, fy] of [[.34, .55], [.66, .30], [.50, .88]]) { g.fillStyle = '#0a0b0e'; g.fillRect(X(fx), Y(fy), 44, 22); g.strokeRect(X(fx) + 1, Y(fy) + 1, 42, 20); g.beginPath(); for (let x = 8; x < 44; x += 7) { g.moveTo(X(fx) + x, Y(fy) + 2); g.lineTo(X(fx) + x, Y(fy) + 20); } g.stroke(); }   // bueiros de grade
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(X(.20) + 24, Y(.497) + 38, X(.60), 34);   // sombra da ponte rolante no chão
    },
    over(t) {
      const by = WH * .497, lx = WW * .20, rx = WW * .80;
      for (let i = 0; i < 5; i++) {   // neblina marítima à deriva
        const bx = ((i * 700 + t * (13 + i * 3)) % (WW + 900)) - 450, bY = WH * (.12 + i * .19) + Math.sin(t * .2 + i) * 40; if (inView(bx, bY, 420)) lightG(bx, bY, 420, '165,185,205', .075);
      }
      let li = 0;
      for (const c of crates) if (c.k === 'lamp') {   // holofotes varrendo o pátio
        const cx = c.x + c.w / 2, cy = c.y + c.h / 2, ang = (cy < WH / 2 ? Math.PI / 2 : -Math.PI / 2) + Math.sin(t * .45 + li * 1.7) * .95; li++;
        if (!inView(cx, cy, 620)) continue; ctx.save(); ctx.globalCompositeOperation = 'lighter'; beam(cx, cy, ang, 560, .16, '225,235,255', .16); lightG(cx, cy, 84, '225,235,255', .3); ctx.restore();
      }
      if (rx > cam.x - 80 && lx < cam.x + VW + 80 && by + 150 > cam.y && by - 60 < cam.y + VH) {   // ponte rolante elevada
        ctx.save(); ctx.globalAlpha = .93; ctx.fillStyle = '#34332d'; ctx.fillRect(lx, by, rx - lx, 28); ctx.fillStyle = '#6b6340'; ctx.fillRect(lx, by + 3, rx - lx, 8); ctx.fillRect(lx, by + 17, rx - lx, 8);
        ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = lx; x < rx - 16; x += 32) { ctx.moveTo(x, by + 11); ctx.lineTo(x + 16, by + 17); ctx.lineTo(x + 32, by + 11); } ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(lx, by, rx - lx, 2);
        for (const x of [lx - 8, rx - 36]) { ctx.fillStyle = '#4b4630'; ctx.fillRect(x, by - 18, 44, 64); ctx.strokeStyle = '#9b8a46'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, by - 17, 42, 62); }
        const tx = lx + 90 + (rx - lx - 180) * (.5 + .5 * Math.sin(t * .16)), sw = Math.sin(t * 1.1) * 5, cl = 78 + Math.sin(t * .5) * 12;
        ctx.fillStyle = '#7a6d36'; ctx.fillRect(tx - 36, by - 12, 72, 52); ctx.strokeStyle = '#2a2610'; ctx.lineWidth = 2; ctx.strokeRect(tx - 35, by - 11, 70, 50);
        ctx.strokeStyle = '#15160f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(tx - 12, by + 40); ctx.lineTo(tx - 12 + sw, by + 40 + cl); ctx.moveTo(tx + 12, by + 40); ctx.lineTo(tx + 12 + sw, by + 40 + cl); ctx.stroke();
        ctx.fillStyle = CONT_COLS[2][0]; ctx.fillRect(tx - 30 + sw, by + 40 + cl, 60, 26); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeRect(tx - 30 + sw, by + 40 + cl, 60, 26); ctx.restore();
      }
    } },
  { id: 'beco', name: 'BECO', sub: 'RUA SECUNDÁRIA URBANA', accent: '#d6457a', spawn: [.5, .48], pad: 20,
    f1: '#0e0d13', f2: '#111017', grid: 'rgba(255,255,255,.02)', edge: 'rgba(214,69,122,.26)', T: 64,
    mh: [[.50, .46], [.3175, .50], [.6825, .46], [.3175, .28], [.6825, .76]],
    wires: [[.29, .18, .345, .18, 26], [.655, .70, .71, .70, 26], [.20, .40, .215, .56, 20], [.76, .40, .77, .56, 20], [.42, .40, .43, .56, 20], [.58, .40, .57, .56, 20]],
    tip: () => 'Prédios e tapumes são cover alto; lixeiras e muretas são cover baixo: colado nelas, você atira por cima (' + keyName(KEYS.cover) + ').',
    desc: () => 'Ruas estreitas de uma metrópole escura: escadas de incêndio dobráveis nas fachadas, lixo acumulado nas quinas, vapor saindo dos bueiros e fios elétricos soltando faíscas. Prédios e tapumes são cover alto e bloqueiam tiros e visão; lixeiras e muretas são cover baixo, com tiro por cima de perto. Ideal para alternar socos potentes e tiros de pistola sem muito espaço para fugir.',
    L: [
      [.05, .06, .11, .34, 'wall', 0], [.19, .06, .10, .34, 'wall', 1], [.345, .06, .13, .34, 'wall', 2], [.52, .06, .135, .34, 'wall', 3], [.71, .06, .10, .34, 'wall', 0], [.84, .06, .11, .34, 'wall', 1],
      [.05, .56, .10, .38, 'wall', 1], [.18, .56, .11, .38, 'wall', 0], [.345, .56, .12, .38, 'wall', 3], [.50, .56, .155, .38, 'wall', 2], [.71, .56, .11, .38, 'wall', 1], [.85, .56, .10, .38, 'wall', 0],
      [.29, .12, .02, .12, 'fire'], [.325, .27, .02, .12, 'fire'], [.655, .12, .02, .12, 'fire'], [.69, .27, .02, .12, 'fire'],
      [.29, .64, .02, .12, 'fire'], [.325, .78, .02, .12, 'fire'], [.655, .66, .02, .12, 'fire'], [.69, .80, .02, .12, 'fire'],
      [.22, .40, .04, .045, 'dump'], [.40, .515, .04, .045, 'dump'], [.76, .40, .04, .045, 'dump'], [.58, .515, .04, .045, 'dump'], [.10, .515, .04, .045, 'dump'],
      [.45, .44, .018, .03, 'bin'], [.62, .44, .018, .03, 'bin'], [.30, .50, .018, .03, 'bin'], [.88, .48, .018, .03, 'bin'], [.12, .43, .018, .03, 'bin'],
      [.40, .43, .05, .018, 'lowwall'], [.55, .52, .05, .018, 'lowwall'], [.14, .44, .045, .018, 'lowwall'], [.80, .51, .05, .018, 'lowwall'],
      [.465, .415, .012, .07, 'hwall'], [.523, .50, .012, .06, 'hwall'],
    ],
    deco(g, { W, Ht, R, pool }) {
      const X = f => f * W, Y = f => f * Ht;
      for (let i = 0, n = W * Ht / 320; i < n; i++) { g.fillStyle = R() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.14)'; g.fillRect(R() * W, R() * Ht, 1.5 + R() * 2, 1.5 + R() * 2); }   // asfalto granulado
      concreteG(g, 0, Y(.40), W, Y(.16), R, .03);
      for (const c of crates) if (c.k === 'wall') {   // calçadas com meio-fio e juntas
        const p = 38; g.fillStyle = 'rgba(128,128,146,.085)'; g.fillRect(c.x - p, c.y - p, c.w + p * 2, c.h + p * 2);
        g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 2; g.strokeRect(c.x - p + 1, c.y - p + 1, c.w + p * 2 - 2, c.h + p * 2 - 2);
        g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 1; g.beginPath(); for (let x = c.x - p + 26; x < c.x + c.w + p; x += 26) { g.moveTo(x, c.y - p); g.lineTo(x, c.y); g.moveTo(x, c.y + c.h); g.lineTo(x, c.y + c.h + p); } g.stroke();
      }
      g.strokeStyle = 'rgba(220,200,120,.2)'; g.lineWidth = 4; g.setLineDash([26, 22]); g.beginPath(); g.moveTo(0, Y(.48)); g.lineTo(W, Y(.48)); g.moveTo(X(.3175), 0); g.lineTo(X(.3175), Ht); g.moveTo(X(.6825), 0); g.lineTo(X(.6825), Ht); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(231,228,211,.10)'; for (const fx of [.255, .745]) for (let k = 0; k < 6; k++) g.fillRect(X(fx) + k * 22, Y(.43), 12, Y(.10));   // faixas de pedestre
      pool(.42, .47, 84, 22, 'rgba(60,200,220,.09)'); pool(.70, .50, 74, 20, 'rgba(220,60,160,.09)'); pool(.32, .22, 22, 64, 'rgba(60,200,220,.07)'); pool(.68, .76, 24, 74, 'rgba(220,60,160,.07)'); pool(.15, .48, 62, 18, 'rgba(60,200,220,.07)'); pool(.88, .47, 50, 16, 'rgba(60,200,220,.07)');
      oilG(g, X(.60), Y(.53), 54, 17); oilG(g, X(.25), Y(.46), 46, 15);
      for (const [mx, my] of this.mh) { const px = X(mx), py = Y(my); g.fillStyle = '#07070b'; g.beginPath(); g.arc(px, py, 20, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.13)'; g.lineWidth = 3; g.beginPath(); g.arc(px, py, 20, 0, TAU); g.stroke(); g.lineWidth = 1.5; g.beginPath(); for (let k = -12; k <= 12; k += 6) { g.moveTo(px + k, py - Math.sqrt(400 - k * k) + 3); g.lineTo(px + k, py + Math.sqrt(400 - k * k) - 3); } g.stroke(); }   // bueiros
      for (const c of crates) if (c.k === 'wall') for (const [cx, cy, sx, sy] of [[c.x, c.y, -1, -1], [c.x + c.w, c.y, 1, -1], [c.x, c.y + c.h, -1, 1], [c.x + c.w, c.y + c.h, 1, 1]]) if (R() > .42 && cx > 30 && cx < W - 30 && cy > 30 && cy < Ht - 30) trashG(g, cx, cy, sx, sy, R);   // lixo nas quinas
      g.save(); g.globalCompositeOperation = 'lighter';   // reflexo de neon no asfalto molhado
      for (const [nx, ny, col] of [[.29, .40, '214,69,122'], [.71, .56, '63,193,214'], [.52, .40, '224,179,61'], [.345, .56, '214,69,122']]) { const gr = g.createRadialGradient(X(nx), Y(ny), 0, X(nx), Y(ny), 170); gr.addColorStop(0, `rgba(${col},.12)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(X(nx) - 170, Y(ny) - 170, 340, 340); }
      g.restore();
      g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 2; for (const [a, b, c, d, s] of this.wires) { g.beginPath(); g.moveTo(X(a) + 8, Y(b) + 14); g.quadraticCurveTo((X(a) + X(c)) / 2 + 8, (Y(b) + Y(d)) / 2 + s * 2 + 14, X(c) + 8, Y(d) + 14); g.stroke(); }   // sombra dos fios
    },
    over(t) {
      for (const [mx, my] of this.mh) {   // vapor dos bueiros
        const px = mx * WW, py = my * WH; if (!inView(px, py, 140)) continue;
        for (let i = 0; i < 7; i++) { const ph = (t * .3 + i / 7 + mx * 3) % 1, a = (1 - ph) * .17 * Math.min(1, ph * 6); ctx.fillStyle = `rgba(185,198,214,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(px + Math.sin(t * .9 + i * 2 + mx * 9) * (6 + ph * 26), py - ph * 100, 10 + ph * 36, 0, TAU); ctx.fill(); }
      }
      ctx.lineCap = 'round';
      this.wires.forEach(([a, b, c, d, s], i) => {   // fios pendurados com faíscas
        const x1 = a * WW, y1 = b * WH, x2 = c * WW, y2 = d * WH, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + s * 2; if (!inView(cx, cy, 200)) return;
        ctx.strokeStyle = 'rgba(8,8,12,.92)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
        const h = Math.sin(Math.floor(t * 9) * 12.9898 + i * 78.233) * 43758.5453, fr = h - Math.floor(h);
        if (fr < .24) {
          const u = .35 + fr * 1.2, px = (1 - u) * (1 - u) * x1 + 2 * u * (1 - u) * cx + u * u * x2, py = (1 - u) * (1 - u) * y1 + 2 * u * (1 - u) * cy + u * u * y2;
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; lightG(px, py, 34, '120,220,255', .5); ctx.restore();
          ctx.strokeStyle = 'rgba(210,248,255,.95)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = fr * 80 + k * 1.05, l = 8 + ((k * 37 + Math.floor(t * 9) * 11) % 14); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(an) * l, py + Math.sin(an) * l * .8 + 4); } ctx.stroke();
          ctx.fillStyle = 'rgba(255,225,150,.9)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(px + (k - 1) * 7, py + 10 + k * 7 + fr * 30, 1.6, 0, TAU); ctx.fill(); }   // fagulhas caindo
        }
      });
      ctx.lineCap = 'butt';
    } },
  { id: 'cobertura', name: 'COBERTURA', sub: 'TELHADO · TERRAÇO', accent: '#3fc1d6', spawn: [.5, .4], pad: 54,
    f1: '#12131a', f2: '#15161e', grid: 'rgba(255,255,255,.035)', edge: 'rgba(0,0,0,0)', T: 96,
    tip: () => 'Dutos e estruturas são cover alto; muretas, sofás e balcões são baixos. As vidraças do lounge quebram com 2 tiros (' + keyName(KEYS.cover) + ' para se encostar).',
    desc: () => 'O topo de um arranha-céu: heliponto elevado com grama sintética e holofotes, dutos gigantes de ventilação, centrais de ar-condicionado e um lounge VIP externo com vidraças táticas que quebram com 2 tiros. Ao fundo, a cidade iluminada entre a névoa. Dutos e estruturas são cover alto; muretas, sofás e balcões são cover baixo. Errar a esquiva ou a cobertura (' + keyName(KEYS.cover) + ') deixa você exposto.',
    L: [
      [.10, .14, .07, .10, 'ac'], [.10, .74, .07, .10, 'ac'], [.83, .74, .07, .10, 'ac'], [.30, .48, .045, .07, 'ac'], [.74, .42, .07, .10, 'ac'],
      [.62, .20, .025, .04, 'vent'], [.36, .20, .025, .04, 'vent'], [.30, .70, .025, .04, 'vent'], [.66, .66, .025, .04, 'vent'], [.46, .14, .04, .05, 'vent'], [.52, .82, .04, .05, 'vent'],
      [.19, .38, .05, .09, 'tank'], [.77, .56, .05, .09, 'tank'], [.05, .42, .05, .12, 'shed'], [.90, .40, .05, .12, 'shed'],
      [.32, .10, .11, .022, 'pipe'], [.54, .76, .12, .022, 'pipe'],
      [.10, .30, .24, .05, 'duct'], [.84, .54, .045, .18, 'duct'], [.12, .60, .20, .05, 'duct'],
      [.22, .52, .07, .022, 'lowwall', 0], [.68, .72, .08, .022, 'lowwall', 0], [.42, .88, .07, .022, 'lowwall', 1], [.52, .22, .07, .022, 'lowwall', 1],
      [.398, .32, .014, .025, 'lamp'], [.588, .32, .014, .025, 'lamp'], [.398, .655, .014, .025, 'lamp'], [.588, .655, .014, .025, 'lamp'],
      [.676, .11, .007, .15, 'glass'], [.69, .335, .15, .012, 'glass'], [.88, .335, .06, .012, 'glass'],
      [.70, .13, .08, .045, 'sofa', 0], [.82, .13, .08, .045, 'sofa', 1], [.86, .21, .05, .12, 'counter'], [.76, .22, .035, .06, 'lcrate', 2], [.70, .27, .05, .025, 'lowwall', 1],
    ],
    deco(g, { W, Ht, R, pool }) {
      const X = f => f * W, Y = f => f * Ht, pad = 54, cx = W / 2, cy = Ht / 2, Rh = Math.min(W, Ht) * .15;
      for (const [a, b, c, d] of [[.04, .06, .30, .26], [.36, .06, .28, .22], [.04, .62, .30, .30], [.66, .64, .30, .30], [.30, .36, .40, .30]]) concreteG(g, X(a), Y(b), X(c), Y(d), R, .045);
      gratingG(g, X(.08), Y(.57), X(.26), Y(.12)); gratingG(g, X(.79), Y(.50), X(.15), Y(.28));   // piso metálico oco das áreas técnicas
      for (const c of crates) if (c.k === 'ac' || c.k === 'tank') { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(c.x - 8, c.y - 8, c.w + 16, c.h + 16); }
      pool(.24, .50, 52, 18, 'rgba(90,130,170,.09)'); pool(.40, .80, 60, 20, 'rgba(90,130,170,.08)'); pool(.88, .64, 46, 16, 'rgba(90,130,170,.08)');   // poças dos drenos
      oilG(g, X(.15), Y(.58), 38, 14);
      g.strokeStyle = 'rgba(224,179,61,.2)'; g.lineWidth = 3; g.setLineDash([20, 16]); g.strokeRect(pad + 24, pad + 24, W - 2 * pad - 48, Ht - 2 * pad - 48); g.setLineDash([]);
      tilesG(g, X(.665), Y(.095), X(.28), Y(.255), 44);   // lounge VIP: azulejos
      g.fillStyle = 'rgba(120,50,70,.24)'; g.beginPath(); g.roundRect(X(.69), Y(.115), X(.17), Y(.15), 12); g.fill(); g.strokeStyle = 'rgba(190,120,140,.25)'; g.lineWidth = 2; g.stroke();   // tapete bordô lavado
      g.strokeStyle = 'rgba(63,193,214,.5)'; g.lineWidth = 2; g.strokeRect(X(.665), Y(.095), X(.28), Y(.255));   // linha de neon do lounge
      g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(cx + 10, cy + 14, Rh + 14, 0, TAU); g.fill();   // heliponto elevado: sombra, parede lateral e topo
      g.fillStyle = '#15161c'; g.beginPath(); g.arc(cx, cy, Rh + 12, 0, TAU); g.fill(); g.strokeStyle = '#4a4b5c'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#23242d'; g.beginPath(); g.arc(cx, cy, Rh + 5, 0, TAU); g.fill();
      grassG(g, cx, cy, Rh, R);
      g.strokeStyle = 'rgba(231,228,211,.42)'; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, Rh - 6, 0, TAU); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, Rh * .84, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(231,228,211,.4)'; g.font = `800 ${Rh * 1.1}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', cx, cy + 4);
      stairsG(g, cx - 62, cy - Rh - 70, 124, 62, 'd', 6); stairsG(g, cx - 62, cy + Rh + 8, 124, 62, 'u', 6); stairsG(g, cx - Rh - 70, cy - 62, 62, 124, 'r', 6); stairsG(g, cx + Rh + 8, cy - 62, 62, 124, 'l', 6);   // escadas do heliponto
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.fillStyle = '#0d0e12'; g.beginPath(); g.arc(cx + Math.cos(a) * (Rh + 16), cy + Math.sin(a) * (Rh + 16), 5.5, 0, TAU); g.fill(); }   // luzes de borda (base)
      // ---- vista da cidade iluminada ao fundo, com a mureta e o guarda-corpo de vidro ----
      for (let side = 0; side < 4; side++) {
        const vert = side > 1, len = vert ? Ht : W; g.save();
        if (side === 0) g.translate(0, 0); else if (side === 1) { g.translate(W, Ht); g.rotate(Math.PI); } else if (side === 2) { g.translate(0, Ht); g.rotate(-Math.PI / 2); } else { g.translate(W, 0); g.rotate(Math.PI / 2); }
        const L = side > 1 ? Ht : W; g.fillStyle = '#05050a'; g.fillRect(0, 0, L, pad);
        for (let x = 0; x < L; x += 14 + R() * 30) { const w = 12 + R() * 34, h = 10 + R() * (pad - 20); g.fillStyle = `rgb(${12 + R() * 8 | 0},${13 + R() * 8 | 0},${24 + R() * 10 | 0})`; g.fillRect(x, 0, w, h); for (let k = 0, n = w * h / 70; k < n; k++) { const q = R(); g.fillStyle = q < .6 ? 'rgba(255,200,120,.8)' : q < .9 ? 'rgba(120,210,235,.75)' : 'rgba(225,95,150,.8)'; g.fillRect(x + 2 + R() * (w - 4), 2 + R() * Math.max(1, h - 4), 1.5, 1.5); } }
        g.strokeStyle = 'rgba(255,170,90,.2)'; g.lineWidth = 2; g.beginPath(); for (let x = 40; x < L; x += 130 + R() * 90) { g.moveTo(x, 0); g.lineTo(x, pad); } g.stroke();
        const fg = g.createLinearGradient(0, 0, 0, pad); fg.addColorStop(0, 'rgba(125,135,165,.06)'); fg.addColorStop(1, 'rgba(125,135,165,.36)'); g.fillStyle = fg; g.fillRect(0, 0, L, pad);   // névoa
        g.fillStyle = '#23242d'; g.fillRect(0, pad - 16, L, 16); g.fillStyle = '#4a4b5c'; g.fillRect(0, pad - 16, L, 2); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, pad - 3, L, 3);   // mureta do terraço
        g.strokeStyle = 'rgba(130,205,225,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, pad - 9); g.lineTo(L, pad - 9); g.stroke(); g.fillStyle = 'rgba(190,200,215,.5)'; for (let x = 20; x < L; x += 70) g.fillRect(x, pad - 12, 3, 8);   // guarda-corpo de vidro
        const sg = g.createLinearGradient(0, pad, 0, pad + 20); sg.addColorStop(0, 'rgba(0,0,0,.34)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(0, pad, L, 20);
        g.restore();
      }
    },
    over(t) {
      const cx = WW / 2, cy = WH / 2, Rh = Math.min(WW, WH) * .15;
      if (inView(cx, cy, Rh + 60)) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, on = Math.floor(t * 2) % 2 === i % 2, x = cx + Math.cos(a) * (Rh + 16), y = cy + Math.sin(a) * (Rh + 16); ctx.fillStyle = on ? 'rgba(255,190,70,.9)' : 'rgba(255,190,70,.22)'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; lightG(x, y, 26, '255,190,70', .35); ctx.restore(); } }
      for (const c of crates) if (c.k === 'lamp') {   // holofotes perimetrais do heliponto
        const x = c.x + c.w / 2, y = c.y + c.h / 2; if (!inView(x, y, 320)) continue;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; beam(x, y, Math.atan2(cy - y, cx - x), Rh * 1.9, .2, '235,240,255', .13); lightG(x, y, 70, '235,240,255', .3); ctx.restore();
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';   // luzes da cidade piscando ao fundo
      for (let i = 0; i < 26; i++) { const u = (i * 0.6180339) % 1, v = (i * .3819) % 1, side = i % 4, px = side < 2 ? u * WW : (side === 2 ? 22 : WW - 22), py = side < 2 ? (side === 0 ? 16 : WH - 16) : v * WH, a = .35 + .35 * Math.sin(t * 2.4 + i * 1.7); if (inView(px, py, 20)) lightG(px, py, 14, i % 3 ? '255,200,120' : '120,210,235', a * .5); }
      ctx.restore();
      for (let i = 0; i < 6; i++) {   // névoa deslizando sobre a cidade
        const b = ((i * 560 + t * (16 + i * 2)) % (WW + 700)) - 350; for (const [x, y] of [[b, 30], [WW - b, WH - 30]]) if (inView(x, y, 340)) { ctx.save(); ctx.translate(x, y); ctx.scale(1, .22); lightG(0, 0, 340, '150,160,190', .2); ctx.restore(); }
        const by = ((i * 360 + t * (14 + i * 2)) % (WH + 500)) - 250; for (const [x, y] of [[30, by], [WW - 30, WH - by]]) if (inView(x, y, 340)) { ctx.save(); ctx.translate(x, y); ctx.scale(.22, 1); lightG(0, 0, 340, '150,160,190', .2); ctx.restore(); }
      }
    } },
];
