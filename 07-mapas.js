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
  { id: 'cobertura', name: 'COBERTURA', sub: 'TELHADO · TERRAÇO', accent: '#3fc1d6', spawn: [.46, .56], pad: 54,
    f1: '#12131a', f2: '#15161e', grid: 'rgba(255,255,255,.035)', edge: 'rgba(0,0,0,0)', T: 96,
    tip: () => 'Dutos e estruturas são cover alto; muretas, sofás e balcões são baixos. As vidraças do lounge quebram com 2 tiros (' + keyName(KEYS.cover) + ' para se encostar).',
    desc: () => 'O topo de um arranha-céu: heliponto elevado com grama sintética e holofotes, dutos gigantes de ventilação, centrais de ar-condicionado e um lounge VIP externo com vidraças táticas que quebram com 2 tiros. Ao fundo, a cidade iluminada entre a névoa. Dutos e estruturas são cover alto; muretas, sofás e balcões são cover baixo. Errar a esquiva ou a cobertura (' + keyName(KEYS.cover) + ') deixa você exposto.',
    L: [
      [.07, .09, .07, .10, 'ac'], [.15, .09, .07, .10, 'ac'], [.78, .80, .07, .10, 'ac'], [.86, .80, .07, .10, 'ac'], [.46, .72, .05, .07, 'ac'],
      [.30, .06, .13, .14, 'shed'], [.05, .70, .06, .12, 'shed'],
      [.22, .42, .025, .04, 'vent'], [.40, .50, .025, .04, 'vent'], [.58, .60, .025, .04, 'vent'], [.34, .84, .04, .05, 'vent'], [.62, .84, .04, .05, 'vent'],
      [.28, .30, .05, .09, 'tank'], [.52, .26, .05, .09, 'tank'],
      [.46, .12, .10, .022, 'pipe'], [.20, .88, .12, .022, 'pipe'],
      [.22, .62, .20, .05, 'duct'], [.60, .44, .04, .16, 'duct'],
      [.30, .50, .07, .022, 'lowwall', 0], [.44, .62, .08, .022, 'lowwall', 1], [.70, .62, .08, .022, 'lowwall', 0], [.52, .90, .08, .022, 'lowwall', 1], [.18, .30, .07, .022, 'lowwall', 1],
      [.56, .32, .014, .025, 'lamp'], [.56, .08, .014, .025, 'lamp'], [.90, .30, .014, .025, 'lamp'], [.38, .38, .014, .025, 'lamp'], [.70, .74, .014, .025, 'lamp'],
      [.035, .36, .007, .24, 'glass'], [.035, .36, .10, .012, 'glass'], [.035, .60, .10, .012, 'glass'],
      [.955, .44, .007, .24, 'glass'], [.855, .44, .10, .012, 'glass'], [.855, .68, .10, .012, 'glass'],
      [.06, .42, .07, .04, 'sofa', 0], [.06, .54, .07, .04, 'sofa', 1], [.87, .50, .06, .04, 'sofa', 0], [.87, .62, .06, .04, 'sofa', 1], [.89, .55, .035, .05, 'lcrate', 2],
    ],
    deco(g, { W, Ht, R, pool }) {
      const X = f => f * W, Y = f => f * Ht, pad = 54, cx = W * .70, cy = Ht * .30, Rh = Math.min(W, Ht) * .13;
      for (const [a, b, c, d] of [[.04, .06, .30, .26], [.36, .06, .28, .22], [.04, .62, .30, .30], [.66, .64, .30, .30], [.30, .36, .40, .30]]) concreteG(g, X(a), Y(b), X(c), Y(d), R, .045);
      gratingG(g, X(.05), Y(.68), X(.2), Y(.16)); gratingG(g, X(.76), Y(.78), X(.2), Y(.16));   // piso metálico oco das áreas técnicas
      for (const c of crates) if (c.k === 'ac' || c.k === 'tank') { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(c.x - 8, c.y - 8, c.w + 16, c.h + 16); }
      pool(.24, .50, 52, 18, 'rgba(90,130,170,.09)'); pool(.40, .80, 60, 20, 'rgba(90,130,170,.08)'); pool(.88, .64, 46, 16, 'rgba(90,130,170,.08)');   // poças dos drenos
      oilG(g, X(.15), Y(.58), 38, 14);
      g.strokeStyle = 'rgba(224,179,61,.2)'; g.lineWidth = 3; g.setLineDash([20, 16]); g.strokeRect(pad + 24, pad + 24, W - 2 * pad - 48, Ht - 2 * pad - 48); g.setLineDash([]);
      for (const [lx, ly, lw, lh] of [[.03, .35, .12, .27], [.85, .43, .12, .27]]) {   // lounges de vidro nas bordas: azulejo, tapete e neon
        tilesG(g, X(lx), Y(ly), X(lw), Y(lh), 44);
        g.fillStyle = 'rgba(120,50,70,.24)'; g.beginPath(); g.roundRect(X(lx + .015), Y(ly + .05), X(lw - .03), Y(lh - .1), 12); g.fill();
        g.strokeStyle = 'rgba(63,193,214,.5)'; g.lineWidth = 2; g.strokeRect(X(lx), Y(ly), X(lw), Y(lh));
      }
      const oct = (r, ph) => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = ph + i / 8 * TAU; i ? g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); };
      g.fillStyle = 'rgba(0,0,0,.4)'; oct(Rh + 20, TAU / 16); g.save(); g.translate(10, 14); g.fill(); g.restore();   // heliponto octogonal elevado
      g.fillStyle = '#15161c'; oct(Rh + 12, TAU / 16); g.fill(); g.strokeStyle = '#4a4b5c'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#23242d'; oct(Rh + 5, TAU / 16); g.fill();
      g.save(); oct(Rh, TAU / 16); g.clip(); g.fillStyle = '#2b2d38'; g.fillRect(cx - Rh, cy - Rh, Rh * 2, Rh * 2); grassG(g, cx, cy, Rh, R); g.restore();
      g.strokeStyle = 'rgba(231,228,211,.42)'; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, Rh - 14, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(231,228,211,.45)'; g.font = `800 ${Rh * 1.1}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', cx, cy + 4);
      stairsG(g, cx - Rh - 70, cy - 62, 62, 124, 'r', 6); stairsG(g, cx - 62, cy + Rh + 8, 124, 62, 'u', 6); stairsG(g, cx + Rh + 8, cy - 62, 62, 124, 'l', 6);   // escadas
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
      const cx = WW * .70, cy = WH * .30, Rh = Math.min(WW, WH) * .13;
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
