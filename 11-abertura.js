/* ------------------------------ ABERTURA -------------------------------- */
/* Fase 1 (antes do clique): um chapéu de feltro preto flutuando e girando no escuro, com o aviso para começar embaixo.
   Fase 2 (depois do clique, T = segundos desde o clique): a mão de um homem (só silhueta, rosto na sombra) para o chapéu, coloca na cabeça
   e ele olha de leve para a tela e dá 5 tiros. Cada tiro deixa rachaduras no vidro; no fim o vidro quebra exatamente pelas rachaduras
   e o menu aparece. Qualquer toque/tecla depois do clique pula. */
const IC = document.createElement('canvas'), ictx = IC.getContext('2d');
const SHOTS = [{ t: 3.95, fx: .5, fy: .5 }, { t: 4.3, fx: .3, fy: .62 }, { t: 4.6, fx: .7, fy: .36 }, { t: 4.85, fx: .22, fy: .3 }, { t: 5.1, fx: .62, fy: .7 }], BREAK_T = 5.75, INTRO_END = 8.0;
const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const HAT0 = performance.now(), hatClock = () => (performance.now() - HAT0) / 1000; let HATC = 0, HATY = 0, HATD = 1;   // HATC = relógio do chapéu no clique | HATY = giro em que ele para | HATD = duração da freada
function skipIntro() { introT = 0; MENU_LAST = -1e9; setState('menu'); }   // MENU_LAST = -1e9: força o menu a recomeçar a animação de entrada do zero

/* Trincas de cada tiro (fração da diagonal): raios que vão até a borda da tela + anéis em volta do furo */
const CRACKS = SHOTS.map(() => ({
  rays: Array.from({ length: 13 }, (_, i) => { let off = 0; const a = i / 13 * TAU + rnd(-.2, .2), L = rnd(1.0, 1.35), pts = []; for (let k = 1; k <= 8; k++) { off += rnd(-.02, .02); pts.push([L * k / 8, off]); } return { a, pts, br: Math.random() < .6 ? { k: 1 + (Math.random() * 3 | 0), a: rnd(-.9, .9), l: rnd(.08, .2) } : null }; }),
  rings: [.03, .07, .13, .22, .34].map((r, n) => ({ r, on: Array.from({ length: 18 }, () => n < 2 || Math.random() < .7), j: Array.from({ length: 18 }, () => rnd(-.18, .18)) })),
}));

/* ---- Chapéu de feltro em 3D: malha de quadriláteros com normais suaves, girada e pintada de trás para frente ---- */
const HAT = (() => {
  const Q = [], N = 72, ez = 1.1, Hc = .92, Rb = 1.72;
  const crownR = (f, ph) => 1 - .1 * f * f - .15 * f * f * Math.cos(ph) * Math.cos(ph);       // afunila no topo (igual na frente e atrás: simétrico a cada 180°)
  const topY = (x, z) => Hc + .05 - .17 * Math.exp(-Math.pow(x / .45, 2));                       // vinco no meio do topo
  const wall = (f, ph, yTop, dr = 0) => { const r = crownR(f, ph) + dr; return [r * Math.sin(ph), f * yTop, r * ez * Math.cos(ph)]; };
  const yTopOf = ph => { const r = crownR(1, ph); return topY(r * Math.sin(ph), r * ez * Math.cos(ph)); };
  const top = (s, ph) => { const r = crownR(1, ph), x = s * r * Math.sin(ph), z = s * r * ez * Math.cos(ph); return [x, topY(x, z), z]; };
  const brim = (u, ph, dy) => { const r = 1 + u * (Rb - 1); return [r * Math.sin(ph), -.09 * u * u * Math.cos(2 * ph) + dy, r * ez * Math.cos(ph)]; };
  const add = (v, k, t) => Q.push({ v, k, t });   // k = tipo (orienta a normal) | t = classe de cor
  for (let i = 0; i < N; i++) {
    const p0 = i / N * TAU, p1 = (i + 1) / N * TAU, y0 = yTopOf(p0), y1 = yTopOf(p1);
    const K = 9; for (let j = 0; j < K; j++) { const f0 = j / K, f1 = (j + 1) / K, bd = j === 1 || j === 2 ? .02 : 0; add([wall(f0, p0, y0, bd), wall(f0, p1, y1, bd), wall(f1, p1, y1, bd), wall(f1, p0, y0, bd)], 'w', bd ? 'g' : 'f'); }   // j 1 e 2 = faixa preta (fita) em volta da copa
    const S = 7; for (let j = 0; j < S; j++) { const s0 = 1 - j / S, s1 = 1 - (j + 1) / S; add([top(s0, p0), top(s0, p1), top(s1, p1), top(s1, p0)], 't', 'f'); }
    const B = 8; for (let j = 0; j < B; j++) { const u0 = j / B, u1 = (j + 1) / B; add([brim(u0, p0, .02), brim(u0, p1, .02), brim(u1, p1, .02), brim(u1, p0, .02)], 't', 'f'); add([brim(u0, p0, -.035), brim(u0, p1, -.035), brim(u1, p1, -.035), brim(u1, p0, -.035)], 'b', 'u'); }
    add([brim(1, p0, .02), brim(1, p1, .02), brim(1, p1, -.035), brim(1, p0, -.035)], 'w', 'f');
  }
  const key = (p, t) => t + p.map(x => x.toFixed(3)).join(','), acc = new Map();
  for (const q of Q) {   // normal de cada face, orientada para fora, somada nos vértices vizinhos (sombreado liso, sem facetas)
    const [a, b, , d] = q.v, e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const cx = (q.v[0][0] + q.v[2][0]) / 2, cz = (q.v[0][2] + q.v[2][2]) / 2, out = q.k === 'w' ? n[0] * cx + n[2] * cz : q.k === 't' ? n[1] : -n[1];
    if (out < 0) n = n.map(x => -x); const l = Math.hypot(...n) || 1; q.fn = n.map(x => x / l);
    for (const p of q.v) { const k = key(p, q.t), s = acc.get(k) || [0, 0, 0]; s[0] += q.fn[0]; s[1] += q.fn[1]; s[2] += q.fn[2]; acc.set(k, s); }
  }
  for (const q of Q) { const s = [0, 0, 0]; for (const p of q.v) { const a = acc.get(key(p, q.t)); s[0] += a[0]; s[1] += a[1]; s[2] += a[2]; } const l = Math.hypot(...s) || 1; q.n = s.map(x => x / l); }
  return Q;
})();
/* Chapéu otimizado: a malha é copiada uma vez para vetores numéricos, a ordenação usa um vetor de chaves nativo (sem objetos novos por quadro)
   e as cores prontas são reaproveitadas. O desenho final é idêntico ao da versão anterior. */
let HATP = null; const HCOL = [];
function hatPrep() {
  const n = HAT.length, V = new Float64Array(n * 12), N = new Float64Array(n * 3), T = new Uint8Array(n);
  HAT.forEach((q, i) => { for (let v = 0; v < 4; v++) for (let k = 0; k < 3; k++) V[i * 12 + v * 3 + k] = q.v[v][k]; for (let k = 0; k < 3; k++) N[i * 3 + k] = q.n[k]; T[i] = q.t === 'u' ? 1 : q.t === 'g' ? 2 : 0; });
  return HATP = { n, V, N, T, SX: new Float64Array(n * 4), SY: new Float64Array(n * 4), KC: new Int32Array(n), keys: new Float64Array(n) };
}
function drawHat(c, cx, cy, hs, yaw, pitch, roll, a) {
  const P = HATP || hatPrep(), { n, V, N, T, SX, SY, KC, keys } = P;
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  const L0 = -.45, L1 = .7, L2 = .55, ll = Math.hypot(L0, L1, L2), lx = L0 / ll, ly = L1 / ll, lz = L2 / ll, hz = lz + 1, hl = Math.hypot(lx, ly, hz);
  let m = 0;
  for (let i = 0; i < n; i++) {
    const a0 = N[i * 3], a1 = N[i * 3 + 1], a2 = N[i * 3 + 2];
    const nx1 = a0 * cyw + a2 * syw, nz1 = -a0 * syw + a2 * cyw, ny2 = a1 * cp - nz1 * sp, nz2 = a1 * sp + nz1 * cp;
    if (nz2 < -.05) continue;   // face de costas: não aparece
    const nx = nx1 * cr - ny2 * sr, ny = nx1 * sr + ny2 * cr, nz = Math.max(0, nz2);
    let dz = 0;
    for (let v = 0; v < 4; v++) {
      const x = V[i * 12 + v * 3], y = V[i * 12 + v * 3 + 1], z = V[i * 12 + v * 3 + 2];
      const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      SX[m * 4 + v] = cx + (x1 * cr - y2 * sr) * hs; SY[m * 4 + v] = cy - (x1 * sr + y2 * cr) * hs; dz += z2;
    }
    const dif = Math.max(0, nx * lx + ny * ly + nz * lz), rim = Math.pow(1 - nz, 2.4), sp2 = Math.pow(Math.max(0, (nx * lx + ny * ly + nz * hz) / hl), 30), t = T[i];
    const k = t === 1 ? 3 + 8 * dif : t === 2 ? 2 + 12 * dif + 30 * rim + 9 * sp2 : 4 + 22 * dif + 24 * rim + 40 * sp2;   // preto de feltro / fita da faixa / parte de baixo da aba
    const ki = k | 0, bb = ((k + 1.5) | 0) - ki, ci = ki * 2 + (bb - 1);
    if (!HCOL[ci]) HCOL[ci] = `rgb(${ki},${ki},${ki + bb})`;
    KC[m] = ci; keys[m] = Math.floor((dz / 4 + 8) * 1e6) * 4096 + m; m++;
  }
  const ks = keys.subarray(0, m); ks.sort();
  c.save(); c.globalAlpha = a; c.lineJoin = 'round'; c.lineWidth = .9;
  let lastC = -1;
  for (let q = 0; q < m; q++) {
    const j = ks[q] % 4096, ci = KC[j];
    if (ci !== lastC) { c.fillStyle = c.strokeStyle = HCOL[ci]; lastC = ci; }
    c.beginPath(); c.moveTo(SX[j * 4], SY[j * 4]); c.lineTo(SX[j * 4 + 1], SY[j * 4 + 1]); c.lineTo(SX[j * 4 + 2], SY[j * 4 + 2]); c.lineTo(SX[j * 4 + 3], SY[j * 4 + 3]); c.closePath(); c.fill(); c.stroke();
  }
  c.restore();
}

/* Fundo da abertura (antes do clique) pronto numa imagem só: o fundo com os feixes de luz e a vinheta ficam guardados e só são redesenhados se a tela mudar de tamanho */
let PRE = null;
function preBg(W, H, d) {
  const key = W + 'x' + H + 'x' + d; if (PRE && PRE.key === key) return PRE;
  const mk = () => { const cv = document.createElement('canvas'); cv.width = Math.round(W * d); cv.height = Math.round(H * d); const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return [cv, c]; };
  const [bg, c] = mk(), S = Math.min(W / 800, H / 600);
  c.fillStyle = '#020203'; c.fillRect(0, 0, W, H); c.save(); c.translate(W / 2, H / 2); c.scale(S, S); c.translate(-400, -300);
  const sp = c.createRadialGradient(400, 250, 20, 400, 250, 430); sp.addColorStop(0, 'rgba(255,255,255,.17)'); sp.addColorStop(.55, 'rgba(255,255,255,.05)'); sp.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sp; c.fillRect(-400, -300, 1600, 1200);
  const cone = c.createLinearGradient(0, -100, 0, 640); cone.addColorStop(0, 'rgba(255,255,255,.08)'); cone.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = cone; c.beginPath(); c.moveTo(340, -100); c.lineTo(460, -100); c.lineTo(700, 640); c.lineTo(100, 640); c.closePath(); c.fill();
  c.restore();
  const [vg, v] = mk(), g = v.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .78); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.8)'); v.fillStyle = g; v.fillRect(0, 0, W, H);
  return PRE = { key, bg, vg, S };
}

/* ---- O homem: só silhueta (como no filme noir), com luz de contorno; rosto sempre na sombra. Tudo em 800 x 600. ---- */
const RIM = 'rgba(165,172,190,.5)';
function drawMan(c, a, eyeA, t) {
  if (a <= 0) return;
  c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.lineJoin = 'round';
  const fog = c.createRadialGradient(400, 330, 30, 400, 330, 330); fog.addColorStop(0, 'rgba(255,255,255,.10)'); fog.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = fog; c.fillRect(0, 0, 800, 600);
  // casaco longo, ombros largos
  const coat = c.createLinearGradient(0, 430, 0, 640); coat.addColorStop(0, '#09090b'); coat.addColorStop(1, '#040405');
  c.fillStyle = coat; c.strokeStyle = RIM; c.lineWidth = 2.2; c.shadowColor = 'rgba(190,198,220,.35)'; c.shadowBlur = 9;
  c.beginPath(); c.moveTo(70, 650); c.bezierCurveTo(70, 560, 84, 500, 150, 470); c.bezierCurveTo(210, 446, 300, 440, 372, 424); c.lineTo(428, 424); c.bezierCurveTo(500, 440, 590, 446, 650, 470); c.bezierCurveTo(716, 500, 730, 560, 730, 650); c.closePath(); c.fill(); c.stroke();
  c.shadowBlur = 0;
  // pescoço e cabeça (rosto todo na sombra)
  c.fillStyle = '#050506'; c.beginPath(); c.moveTo(368, 380); c.lineTo(432, 380); c.lineTo(440, 436); c.lineTo(360, 436); c.closePath(); c.fill();
  c.fillStyle = '#030304'; c.strokeStyle = 'rgba(165,172,190,.22)'; c.lineWidth = 2; c.beginPath(); c.ellipse(400, 332, 54, 66, 0, 0, TAU); c.fill(); c.stroke();
  // camisa e gravata aparecem pouco, na penumbra
  c.fillStyle = 'rgba(190,192,200,.5)'; c.beginPath(); c.moveTo(366, 428); c.lineTo(400, 498); c.lineTo(434, 428); c.lineTo(420, 420); c.lineTo(400, 446); c.lineTo(380, 420); c.closePath(); c.fill();
  c.fillStyle = '#0b0b0e'; c.beginPath(); c.moveTo(393, 448); c.lineTo(407, 448); c.lineTo(414, 540); c.lineTo(400, 560); c.lineTo(386, 540); c.closePath(); c.fill();
  // lapelas
  c.fillStyle = '#0a0a0d'; c.strokeStyle = 'rgba(150,158,178,.4)'; c.lineWidth = 2;
  for (const m of [-1, 1]) { c.beginPath(); c.moveTo(400 + m * 8, 500); c.lineTo(400 + m * 40, 432); c.lineTo(400 + m * 100, 450); c.lineTo(400 + m * 64, 610); c.lineTo(400 + m * 20, 640); c.closePath(); c.fill(); c.stroke(); }
  c.fillStyle = 'rgba(150,158,178,.45)'; for (const yy of [560, 604]) { c.beginPath(); c.arc(394, yy, 3.2, 0, TAU); c.fill(); }
  // cigarro: só a brasa ilumina um pouquinho o queixo
  const em = .55 + .45 * Math.sin(t * 3.1), eg = c.createRadialGradient(448, 366, 0, 448, 366, 46); eg.addColorStop(0, `rgba(255,150,70,${.28 * em})`); eg.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = eg; c.beginPath(); c.arc(448, 366, 46, 0, TAU); c.fill();
  c.save(); c.translate(412, 372); c.rotate(-.12); c.fillStyle = 'rgba(210,210,214,.55)'; c.fillRect(0, -2, 34, 4); c.fillStyle = `rgba(255,140,60,${.5 + .5 * em})`; c.beginPath(); c.arc(35, 0, 3, 0, TAU); c.fill(); c.restore();
  // olhar sutil para a tela: dois brilhos fracos sob a aba
  if (eyeA > 0) { c.globalAlpha = a * eyeA * .75; c.fillStyle = '#d8d8dc'; for (const m of [-1, 1]) { c.beginPath(); c.ellipse(400 + m * 19, 322, 6.5, 2.2, 0, 0, TAU); c.fill(); } c.globalAlpha = a; }
  c.restore();
}
function drawSleeve(c, x, y, ang, grip) {   // braço de casaco vindo de fora da tela (silhueta com luz de contorno) e mão que segura a aba
  c.save(); c.translate(x, y); c.rotate(ang); c.lineCap = 'round'; c.lineJoin = 'round';
  c.fillStyle = '#060608'; c.strokeStyle = RIM; c.lineWidth = 2.2; c.beginPath(); c.moveTo(60, -50); c.lineTo(900, -84); c.lineTo(900, 118); c.lineTo(60, 58); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(190,192,200,.55)'; c.beginPath(); c.roundRect(42, -54, 28, 116, 5); c.fill();
  const hg = c.createLinearGradient(-60, -40, 40, 50); hg.addColorStop(0, '#26272d'); hg.addColorStop(1, '#0a0a0c'); c.fillStyle = hg; c.strokeStyle = 'rgba(165,172,190,.55)'; c.lineWidth = 2;
  c.beginPath(); c.roundRect(-34, -42, 78, 86, 26); c.fill(); c.stroke();
  [[-62, -38], [-70, -14], [-68, 10], [-58, 32]].forEach(([fx, fy], i) => { const cl = grip * 16; c.beginPath(); c.roundRect(fx + cl * .6, fy - 9 + i * .5, 52 - cl, 19, 9); c.fill(); c.stroke(); });
  c.beginPath(); c.roundRect(-30, -62, 56, 22, 10); c.fill(); c.stroke();
  c.restore();
}
function drawGunFront(c, x, y, k, flash) {   // pistola vista de frente, apontada para quem olha, com a mão em silhueta
  c.save(); c.translate(x, y); c.scale(k, k); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 2.6;
  const hg = c.createLinearGradient(-90, 0, 90, 0); hg.addColorStop(0, '#0b0b0d'); hg.addColorStop(.5, '#26272d'); hg.addColorStop(1, '#0b0b0d');
  c.fillStyle = hg; c.strokeStyle = 'rgba(165,172,190,.5)';
  c.beginPath(); c.roundRect(-92, 30, 44, 130, 22); c.fill(); c.stroke(); c.beginPath(); c.roundRect(48, 30, 44, 130, 22); c.fill(); c.stroke();
  for (let i = 0; i < 3; i++) { c.beginPath(); c.roundRect(-64 + i * 3, 74 + i * 33, 128 - i * 6, 31, 15); c.fill(); c.stroke(); }
  c.fillStyle = '#17181c'; c.beginPath(); c.roundRect(-30, 26, 60, 50, 10); c.fill(); c.stroke();
  c.strokeStyle = '#050506'; c.lineWidth = 6; c.beginPath(); c.ellipse(0, 64, 20, 13, 0, 0, TAU); c.stroke();
  const sl = c.createLinearGradient(-50, 0, 50, 0); sl.addColorStop(0, '#3a3b42'); sl.addColorStop(.3, '#a8a9b2'); sl.addColorStop(1, '#2a2b31');
  c.fillStyle = sl; c.strokeStyle = '#08080a'; c.lineWidth = 2.6; c.beginPath(); c.roundRect(-50, -74, 100, 108, 16); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.roundRect(-42, -68, 84, 8, 4); c.fill();
  c.fillStyle = '#d6d6da'; c.beginPath(); c.roundRect(-6, -92, 12, 20, 3); c.fill(); c.stroke();
  c.fillStyle = '#26272c'; c.beginPath(); c.arc(0, -14, 24, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = '#0c0c0e'; c.beginPath(); c.arc(0, -14, 16, 0, TAU); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(0, -14, 11, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2; c.beginPath(); c.arc(0, -14, 20, .5, 1.8); c.stroke();
  if (flash > 0) {
    const R = 60 * (2.6 + 3 * flash), g = c.createRadialGradient(0, -14, 0, 0, -14, R); g.addColorStop(0, `rgba(255,255,255,${flash})`); g.addColorStop(.35, `rgba(255,236,190,${flash * .6})`); g.addColorStop(1, 'rgba(255,220,150,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, -14, R, 0, TAU); c.fill();
    c.fillStyle = `rgba(255,255,255,${flash})`; for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + .3, L = 60 * (3 + 3 * flash); c.beginPath(); c.moveTo(Math.cos(a - .1) * 30, -14 + Math.sin(a - .1) * 30); c.lineTo(Math.cos(a) * L, -14 + Math.sin(a) * L); c.lineTo(Math.cos(a + .1) * 30, -14 + Math.sin(a + .1) * 30); c.closePath(); c.fill(); }
  }
  c.restore();
}

/* ---- Cena completa. T < 0: antes do clique (só o chapéu). T >= 0: tempo desde o clique. ---- */
function introScene(c, T, W, H) {
  const HC = hatClock(), pre = T < 0, t = Math.max(T, 0);
  c.fillStyle = '#020203'; c.fillRect(0, 0, W, H);
  let kick = 0, flash = 0;
  for (const s of SHOTS) { const q = T - s.t; if (q >= 0 && q < .6) kick = Math.max(kick, Math.exp(-q * 9)); if (q >= 0 && q < .12) flash = Math.max(flash, 1 - q / .12); }
  const S = Math.min(W / 800, H / 600) * (1 + .05 * kick);
  c.save(); c.translate(W / 2 + rnd(-1, 1) * kick * 10, H / 2 + rnd(-1, 1) * kick * 8); c.scale(S, S); c.translate(-400, -300);
  const sp = c.createRadialGradient(400, 250, 20, 400, 250, 430); sp.addColorStop(0, 'rgba(255,255,255,.17)'); sp.addColorStop(.55, 'rgba(255,255,255,.05)'); sp.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sp; c.fillRect(-400, -300, 1600, 1200);
  const cone = c.createLinearGradient(0, -100, 0, 640); cone.addColorStop(0, 'rgba(255,255,255,.08)'); cone.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = cone; c.beginPath(); c.moveTo(340, -100); c.lineTo(460, -100); c.lineTo(700, 640); c.lineTo(100, 640); c.closePath(); c.fill();
  // chapéu: flutua e gira; ao ser pego, o giro freia e para de frente, a mão leva até a cabeça e ele assenta (sem girar)
  const y0 = 1.15 * HATC, floatK = 1 - sstep(1, 1.25, t), bob = Math.sin(HC * 1.7) * 14 * floatK;
  let yaw;
  if (pre) yaw = 1.15 * HC;
  else { const u = clamp(t / HATD, 0, 1), h10 = u * u * u - 2 * u * u + u, h01 = -2 * u * u * u + 3 * u * u; yaw = y0 + h10 * 1.15 * HATD + h01 * (HATY - y0); }   // Hermite: sai da velocidade atual e chega parado
  const carry = easeInOut(clamp((t - 1.25) / .85, 0, 1)), drop = clamp((t - 2.1) / .25, 0, 1), dropE = 1 - Math.pow(1 - drop, 3) + Math.sin(drop * Math.PI) * .12;
  const ax = 400, ay = 262 + bob, bx = 580, by = 390, ex = 400, ey = 244;
  let hx = (1 - carry) * (1 - carry) * ax + 2 * (1 - carry) * carry * bx + carry * carry * ex, hy = (1 - carry) * (1 - carry) * ay + 2 * (1 - carry) * carry * by + carry * carry * ey;
  hy += (292 - 244) * dropE - 9 * sstep(3.1, 3.5, t);   // assenta na testa; no olhar, a aba sobe um pouquinho
  const pitch = (.5 + .08 * Math.sin(HC * 1.3) * floatK) * (1 - carry) + (.15 - .1 * sstep(3.1, 3.5, t)) * carry, roll = Math.sin(HC * 1.1) * .13 * floatK * (1 - carry), hs = (112 - 42 * carry) * .78;
  const manA = sstep(.9, 2.2, t), eyeA = sstep(3.1, 3.6, t);
  if (!pre) drawMan(c, manA, eyeA, t);
  drawHat(c, hx, hy, hs, yaw, pitch, roll, 1);
  const hin = easeInOut(clamp((t - .3) / .9, 0, 1)), hout = easeInOut(clamp((t - 2.35) / .55, 0, 1));
  if (!pre && t > .25 && hout < 1) {   // mão: entra, segura a aba, leva o chapéu, empurra na cabeça e sai
    const gx = hx + 128 * (hs / 112) + 8, gy = hy + 30, px = (1 - hin) * 1000 + hin * gx + hout * 700, py = (1 - hin) * 700 + hin * gy + hout * 520;
    drawSleeve(c, px, py, .42 + .1 * hout, sstep(1.1, 1.3, t) * (1 - hout * .8));
  }
  const gu = easeInOut(clamp((t - 3.2) / .55, 0, 1));
  if (!pre && gu > 0) drawGunFront(c, 400, 760 - 220 * gu + 6 * kick, 1.1 + .35 * kick, flash);
  c.restore();
  const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.8)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  return flash;
}

/* ---- Rachaduras do vidro (e o mesmo desenho em traço grosso, que serve de molde para os cacos) ---- */
function drawCracks(c, T, W, H, mask) {
  const D = Math.hypot(W, H);
  SHOTS.forEach((s, i) => {
    if (!mask && T < s.t) return;
    const g = mask ? 1 : easeOutExpo(clamp((T - s.t) / .3, 0, 1)), x = s.fx * W, y = s.fy * H, cr = CRACKS[i];
    const line = pts => { c.beginPath(); pts.forEach((p, n) => n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); };
    for (const pass of (mask ? [1] : [0, 1])) {
      c.strokeStyle = mask ? '#fff' : pass ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.6)'; c.lineWidth = mask ? 4.4 : pass ? 1.2 : 2.8; const o = pass ? 0 : 1.5;
      for (const k of cr.rays) {
        const ca = Math.cos(k.a), sa = Math.sin(k.a), P = (l, off) => [x + (ca * l - sa * off) * D * g + o, y + (sa * l + ca * off) * D * g + o];
        const all = [P(.012, 0), ...k.pts.map(p => P(p[0], p[1]))];
        if (mask) line(all); else { line(all.slice(0, 5)); c.globalAlpha = .55; line(all.slice(4)); c.globalAlpha = 1; }   // longe do furo a trinca fica mais fraca
        if (k.br) { const b = k.pts[k.br.k], ba = k.a + k.br.a, bc = Math.cos(ba), bs = Math.sin(ba), st = P(b[0], b[1]); line([st, [st[0] + bc * k.br.l * D * g, st[1] + bs * k.br.l * D * g], [st[0] + bc * k.br.l * 1.7 * D * g, st[1] + bs * k.br.l * 1.7 * D * g + 6]]); }
      }
      for (const rg of cr.rings) {
        if (g < rg.r / .3) continue;
        for (let n = 0; n < 18; n++) if (rg.on[n]) { const a0 = n / 18 * TAU, a1 = (n + 1) / 18 * TAU, r0 = rg.r * D * (1 + rg.j[n]), r1 = rg.r * D * (1 + rg.j[(n + 1) % 18]); line([[x + Math.cos(a0) * r0 + o, y + Math.sin(a0) * r0 + o], [x + Math.cos(a1) * r1 + o, y + Math.sin(a1) * r1 + o]]); }
      }
    }
    if (!mask) { c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x, y, 11 * Math.min(1, g * 3), 0, TAU); c.fill(); }
  });
}
/* Cacos: o molde das rachaduras é desenhado em baixa resolução e cada região fechada entre elas vira um pedaço de vidro */
let SHARD = null;
function buildShards(W, H, snap, d) {
  const q = Math.min(.5, 520 / Math.max(W, H)), w = Math.ceil(W * q), h = Math.ceil(H * q), cm = document.createElement('canvas'); cm.width = w; cm.height = h;
  const cc = cm.getContext('2d'); cc.setTransform(q, 0, 0, q, 0, 0); drawCracks(cc, 0, W, H, true);
  const px = cc.getImageData(0, 0, w, h).data, lab = new Int32Array(w * h).fill(-1), crack = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) crack[i] = px[i * 4 + 3] > 60 ? 1 : 0;
  let n = 0; const stack = new Int32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (crack[i] || lab[i] >= 0) continue;
    let sp = 0; stack[sp++] = i; lab[i] = n;
    while (sp) { const p = stack[--sp], x = p % w, y = (p - x) / w; if (x > 0 && !crack[p - 1] && lab[p - 1] < 0) { lab[p - 1] = n; stack[sp++] = p - 1; } if (x < w - 1 && !crack[p + 1] && lab[p + 1] < 0) { lab[p + 1] = n; stack[sp++] = p + 1; } if (y > 0 && !crack[p - w] && lab[p - w] < 0) { lab[p - w] = n; stack[sp++] = p - w; } if (y < h - 1 && !crack[p + w] && lab[p + w] < 0) { lab[p + w] = n; stack[sp++] = p + w; } }
    n++;
  }
  for (let pass = 0; pass < 3; pass++) { const cp = lab.slice(); for (let p = 0; p < w * h; p++) if (cp[p] < 0) { const x = p % w; const c1 = x > 0 ? cp[p - 1] : -1, c2 = x < w - 1 ? cp[p + 1] : -1, c3 = p >= w ? cp[p - w] : -1, c4 = p < w * (h - 1) ? cp[p + w] : -1; lab[p] = Math.max(c1, c2, c3, c4); } }   // as próprias trincas passam a fazer parte dos cacos vizinhos
  const sh = Array.from({ length: n }, () => ({ x0: 1e9, y0: 1e9, x1: -1, y1: -1, sx: 0, sy: 0, a: 0 }));
  for (let p = 0; p < w * h; p++) { const L = lab[p]; if (L < 0) continue; const x = p % w, y = (p - x) / w, s = sh[L]; if (x < s.x0) s.x0 = x; if (y < s.y0) s.y0 = y; if (x > s.x1) s.x1 = x; if (y > s.y1) s.y1 = y; s.sx += x; s.sy += y; s.a++; }
  const last = SHOTS.map(s => [s.fx * W, s.fy * H]), D = Math.hypot(W, H), out = [];
  sh.forEach((s, id) => {
    if (s.a < 4) return;
    const cx = s.sx / s.a / q, cy = s.sy / s.a / q; let dm = 1e9; for (const [ix, iy] of last) dm = Math.min(dm, Math.hypot(cx - ix, cy - iy));
    out.push({ id, q, x0: s.x0 / q, y0: s.y0 / q, w: (s.x1 - s.x0 + 1) / q, h: (s.y1 - s.y0 + 1) / q, lx: s.x0, ly: s.y0, lw: s.x1 - s.x0 + 1, lh: s.y1 - s.y0 + 1, cx, cy, ax: (cx - W / 2) / W, dl: dm / D * .55 + rnd(0, .08), vr: rnd(-3, 3), vx: rnd(-.05, .05), cv: null });
  });
  SHARD = { W, H, d, snap, lab, w, list: out, built: 0 };
}
function shardCanvas(s, S) {   // recorta da imagem congelada só os pixels desta região
  const d = S.d, cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(s.w * d)); cv.height = Math.max(1, Math.round(s.h * d)); const c = cv.getContext('2d');
  c.drawImage(S.snap, s.x0 * d, s.y0 * d, s.w * d, s.h * d, 0, 0, cv.width, cv.height);
  const m = document.createElement('canvas'); m.width = s.lw; m.height = s.lh; const mc = m.getContext('2d'), im = mc.createImageData(s.lw, s.lh);
  for (let y = 0; y < s.lh; y++) for (let x = 0; x < s.lw; x++) if (S.lab[(s.ly + y) * S.w + s.lx + x] === s.id) im.data[(y * s.lw + x) * 4 + 3] = 255;
  mc.putImageData(im, 0, 0); c.globalCompositeOperation = 'destination-in'; c.imageSmoothingEnabled = true; c.drawImage(m, 0, 0, s.lw, s.lh, 0, 0, cv.width, cv.height);
  s.cv = cv;
}
const introSfx = { riser: false, shot: [false, false, false, false, false], brk: false };
function drawIntro(T) {
  const W = innerWidth, H = innerHeight, d = RES;
  if (IC.width !== canvas.width || IC.height !== canvas.height) { IC.width = canvas.width; IC.height = canvas.height; SHARD = null; }
  if (introGate) {   // antes do clique: chapéu flutuando e girando (o clique também libera o som do navegador)
    const PB = preBg(W, H, d), HC = hatClock(); ctx.drawImage(PB.bg, 0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(PB.S, PB.S); ctx.translate(-400, -300);
    drawHat(ctx, 400, 262 + Math.sin(HC * 1.7) * 14, 112 * .78, 1.15 * HC, .5 + .08 * Math.sin(HC * 1.3), Math.sin(HC * 1.1) * .13, 1);
    ctx.restore(); ctx.drawImage(PB.vg, 0, 0, W, H);
    const pulse = .55 + .35 * Math.sin(performance.now() / 320), by = H - clamp(H * .11, 50, 90);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 8;
    txt(TOUCH ? 'TOQUE PARA COMEÇAR' : 'CLIQUE PARA COMEÇAR', W / 2, by, clamp(W / 38, 12, 19), `rgba(255,255,255,${pulse})`, 'center');
    ctx.strokeStyle = `rgba(255,255,255,${pulse * .7})`; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const ay = by + 26 + Math.sin(performance.now() / 320) * 3;
    ctx.beginPath(); ctx.moveTo(W / 2 - 7, ay); ctx.lineTo(W / 2, ay + 6); ctx.lineTo(W / 2 + 7, ay); ctx.stroke(); ctx.restore();
    return;
  }
  /* Depois do clique: só o chapéu. Ele gira cada vez mais rápido, sobe e voa para cima da tela enquanto o menu aparece por trás, crescendo de leve. */
  {
    const OUT = 1.6, u = clamp(T / OUT, 0, 1), e = u * u * (3 - 2 * u);
    if (T >= OUT) { skipIntro(); return; }
    if (ac && !introSfx.riser) { introSfx.riser = true; try { sfxHat(); } catch (er) {} }
    const PB = preBg(W, H, d), fo = 1 - sstep(.05, .95, u);   // o fundo e a luz da abertura vão sumindo devagar enquanto o menu aparece por cima
    ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = fo; ctx.drawImage(PB.bg, 0, 0, W, H); ctx.globalAlpha = 1;
    // o menu NÃO é desenhado por trás do chapéu: ele só começa depois que o chapéu passa, e aí faz a mesma animação de entrada (título, linha e botões subindo em sequência) de quando se volta ao menu
    ctx.globalAlpha = fo; ctx.drawImage(PB.vg, 0, 0, W, H); ctx.globalAlpha = 1;
    const HC = hatClock(), S = Math.min(W / 800, H / 600);
    ictx.setTransform(d, 0, 0, d, 0, 0); ictx.clearRect(0, 0, W, H);
    ictx.save(); ictx.translate(W / 2, H / 2); ictx.scale(S, S); ictx.translate(-400, -300);
    const bob = Math.sin(HC * 1.7) * 14 * (1 - u), yaw = 1.15 * HC + 16 * u * u * u, hs = 112 * .78 + 780 * e * e, hy = 262 + bob - 70 * e;
    drawHat(ictx, 400, hy, hs, yaw, .5 + .5 * e, Math.sin(HC * 1.1) * .13 * (1 - u), 1 - sstep(.5, 1, u));
    ictx.restore();
    ctx.save(); ctx.globalAlpha = 1 - sstep(.55, 1, u); ctx.drawImage(IC, 0, 0, W, H); ctx.restore();
    return;
  }
  if (ac) {
    if (!introSfx.riser && T > 2.9) { introSfx.riser = true; sfxRiser(1.0); }
    SHOTS.forEach((sh, i) => { if (T >= sh.t && !introSfx.shot[i]) { introSfx.shot[i] = true; sfxShot(); sfxGlass(); } });
    if (T >= BREAK_T && !introSfx.brk) { introSfx.brk = true; sfxGlass(); setTimeout(sfxGlass, 90); setTimeout(sfxGlass, 220); setTimeout(sfxGlass, 380); }
  }
  if (T >= INTRO_END) { skipIntro(); return; }
  const lastT = SHOTS[SHOTS.length - 1].t, frozen = T >= lastT + .5;   // depois do último tiro a imagem congela e vira os cacos
  ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, W, H);
  if (T >= SHOTS[0].t) { drawMenu(T); ui = []; }   // o menu aparece por trás dos furos e, depois, do vidro quebrado
  let flash = 0;
  if (!frozen) {
    ictx.setTransform(d, 0, 0, d, 0, 0); ictx.globalCompositeOperation = 'source-over'; ictx.clearRect(0, 0, W, H);
    flash = introScene(ictx, T, W, H); drawCracks(ictx, T, W, H);
    ictx.globalCompositeOperation = 'destination-out'; ictx.fillStyle = '#000'; for (const s of SHOTS) if (T >= s.t) { ictx.beginPath(); ictx.arc(s.fx * W, s.fy * H, 3 + 3 * easeOutExpo(clamp((T - s.t) / .2, 0, 1)), 0, TAU); ictx.fill(); } ictx.globalCompositeOperation = 'source-over';
    ctx.drawImage(IC, 0, 0, W, H);
  } else {
    if (!SHARD || SHARD.W !== W || SHARD.H !== H) { const snap = document.createElement('canvas'); snap.width = IC.width; snap.height = IC.height; snap.getContext('2d').drawImage(IC, 0, 0); buildShards(W, H, snap, d); }
    const S = SHARD;
    if (T < BREAK_T) { ctx.drawImage(S.snap, 0, 0, W, H); for (let n = 0; n < 50 && S.built < S.list.length; n++) shardCanvas(S.list[S.built++], S); }   // prepara os cacos aos poucos, sem travar
    else {
      const u = T - BREAK_T;
      for (let i = S.built; i < S.list.length; i++) shardCanvas(S.list[i], S); S.built = S.list.length;
      for (const s of S.list) {
        const q = Math.max(0, u - s.dl); if (q <= 0) { ctx.drawImage(s.cv, s.x0, s.y0, s.w, s.h); continue; }
        const al = 1 - sstep(.5, 1.5, q); if (al <= 0) continue;
        const dx = (s.ax * 70 + s.vx * W) * q, dy = (1.4 * q * q + .12 * q) * H * .9;
        ctx.save(); ctx.globalAlpha = al; ctx.translate(s.cx + dx, s.cy + dy); ctx.rotate(s.vr * q * .6); ctx.drawImage(s.cv, s.x0 - s.cx, s.y0 - s.cy, s.w, s.h); ctx.restore();
      }
    }
  }
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * .75})`; ctx.fillRect(0, 0, W, H); }
  if (T < SHOTS[0].t) txt(TOUCH ? 'toque para pular' : 'clique ou aperte uma tecla para pular', W / 2, H - 22, 11, 'rgba(255,255,255,.3)', 'center');
}

