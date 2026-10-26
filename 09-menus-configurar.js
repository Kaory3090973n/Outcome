/* ------------------------------ MENUS --------------------------------- */
/* Forma dos botões (base: o desenho de referência): cantos de raio pequeno, fundo escuro com leve degradê, borda fina clara, um segundo fio por dentro
   e, ao passar o mouse, a borda esquenta para um dourado discreto. Usada no menu, na escolha de modo e em todos os botões do jogo. */
function btnShape(x, y, w, h, hov, pri, r) {
  r = r === undefined ? Math.min(10, h * .2) : r; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.roundRect(x + .5, y + .5, w - 1, h - 1, r);
  if (pri) { ctx.fillStyle = hov ? '#ffffff' : '#e7e4d3'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = hov ? 'rgba(222,190,125,.95)' : 'rgba(255,255,255,.4)'; ctx.stroke(); return; }
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, hov ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.055)'); g.addColorStop(1, hov ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.015)');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = hov ? 'rgba(222,190,125,.95)' : 'rgba(231,228,211,.26)'; ctx.stroke();
  if (w > 12 && h > 12) { ctx.beginPath(); ctx.roundRect(x + 2.5, y + 2.5, w - 5, h - 5, Math.max(2, r - 2)); ctx.strokeStyle = hov ? 'rgba(222,190,125,.18)' : 'rgba(255,255,255,.05)'; ctx.stroke(); }
}
/* Balão de ajuda: passando o mouse num botão aparece uma explicação perto do cursor. Os textos padrão ficam em BTN_TIPS (pelo nome do botão);
   qualquer tela também pode passar o seu próprio texto (7º parâmetro de button() ou direto em TIPNOW). Desenhado por último, no fim de cada quadro. */
let TIPNOW = null;
const BTN_TIPS = {
  'JOGAR': 'Escolha como jogar: partidas 1v1 a 4v4, sala personalizada, campo de batalha, treino ou tutorial.',
  'ARMAS': 'Veja todas as armas do jogo, como cada uma funciona e os números de cada uma.',
  'PERSONAGENS': 'Conheça cada personagem: história, estilo de luta e atributos como velocidade, vida e força.',
  'ATUALIZAÇÃO': 'Lista de tudo o que mudou em cada versão do jogo.',
  'OPÇÕES': 'Teclas, volume da música e dos efeitos e outras configurações.',
  'REPETIR TUTORIAL': 'Faz o passo a passo de novo: mover, mirar, socar, armas, cobertura e arremesso.',
  'CONTINUAR': 'Volta para a partida.',
  'SAIR': 'Sai desta tela e volta para o menu principal.',
  'MENU': 'Volta para o menu principal.',
  'VOLTAR': 'Volta para a tela anterior.',
  'JOGAR DE NOVO': 'Começa outra partida logo em seguida.',
  'CONFIGURAR': 'Volta para a tela de configuração para mudar as regras antes de jogar de novo.',
  'RESTAURAR PADRÃO': 'Volta todas as teclas para o padrão do jogo.',
  'EXPULSAR': 'Tira este jogador da sala.',
  'TROCAR LADO': 'Troca você de time com este jogador.',
  'INICIAR PARTIDA': 'Começa a partida para todos da sala. Só libera quando todos estiverem prontos.',
  'SAIR DA SALA': 'Sai da sala. Quem criou volta para a configuração; quem entrou volta para a escolha de modo.',
  'CRIAR SALA': 'Cria a sala com estas regras. Os amigos entram com o código de 4 dígitos e o mapa é votado depois que todos entrarem.',
  'COMEÇAR': 'Começa o treino solitário. O personagem é sorteado.',
};
function flushTip() {
  const tp = TIPNOW; TIPNOW = null; if (!tp || TOUCH) return;
  const W = innerWidth, H = innerHeight, d = RES;
  ctx.save(); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  const lines = wrapLines(tp, Math.min(300, W - 40), 12), bw = Math.min(320, W - 20), bh = lines.length * 18 + 18;
  const tx = clamp(input.mx + 16, 10, W - bw - 10), ty = clamp(input.my > H * .5 ? input.my - bh - 16 : input.my + 20, 10, H - bh - 10);   // na metade de baixo o balão sobe
  ctx.beginPath(); ctx.roundRect(tx + .5, ty + .5, bw - 1, bh - 1, 10); ctx.fillStyle = 'rgba(13,13,17,.96)'; ctx.fill(); ctx.strokeStyle = 'rgba(231,228,211,.6)'; ctx.lineWidth = 1; ctx.stroke();
  lines.forEach((l, i) => txt(l, tx + 12, ty + 18 + i * 18, 12, '#e7e4d3', 'left'));
  ctx.restore();
}
function button(label, x, y, w, h, fn, style, tip) {   // style === 'primary' -> preenchido; senão só contorno | tip = texto do balão de ajuda (opcional)
  const k = ctx.getTransform().a / (RES);   // botões funcionam também com o menu encolhido
  const hov = input.mx > x * k && input.mx < (x + w) * k && input.my > y * k && input.my < (y + h) * k, pri = style === 'primary';
  ctx.shadowBlur = 0;
  if (hov && !TOUCH && state !== 'intro') hoverTick(label);
  if (hov) { const tp = tip || BTN_TIPS[label]; if (tp) TIPNOW = tp; }
  btnShape(x, y, w, h, hov, pri);
  txt(label, x + w / 2, y + h / 2 + 1, Math.min(h * .4, 20), pri ? '#0d0d11' : '#e7e4d3', 'center');
  ui.push({ x: x * k, y: y * k, w: w * k, h: h * k, fn, pri });
}
/* VOLTAR no canto inferior esquerdo (side = -1) e CONTINUAR no canto inferior direito (side = 1), em todas as telas */
function cornerBtn(label, side, W, H, fn, style) {
  const w = clamp(W * .16, 104, 170), h = 44, m = 16;
  button(label, side < 0 ? m : W - m - w, H - m - h, w, h, fn, style);
}
/* Fundo do lobby guardado numa imagem só (luz de holofote atrás do título + vinheta escura); só é refeito se a tela mudar de tamanho */
let MBEAM = null;
function menuBeam(IW, IH) {   // feixe de luz vindo de cima (como o da abertura), guardado numa imagem; o topo se estende para cima da tela para nunca aparecer a ponta
  const key = (IW | 0) + 'x' + (IH | 0); if (MBEAM && MBEAM.key === key) return MBEAM;
  const Lb = Math.ceil(Math.max(IW, IH) * 1.3), A = 420, w = Math.ceil(Lb * .8), bm = document.createElement('canvas'); bm.width = w; bm.height = Lb + A; const c = bm.getContext('2d');
  try { c.filter = 'blur(10px)'; } catch (e) {}
  const g = c.createLinearGradient(0, A, 0, A + Lb); g.addColorStop(0, 'rgba(231,228,211,.2)'); g.addColorStop(.55, 'rgba(231,228,211,.07)'); g.addColorStop(1, 'rgba(231,228,211,0)'); c.fillStyle = g;
  c.beginPath(); c.moveTo(w / 2 - Lb * .045, 0); c.lineTo(w / 2 + Lb * .045, 0); c.lineTo(w / 2 + Lb * .045, A); c.lineTo(w / 2 + Lb * .34, A + Lb); c.lineTo(w / 2 - Lb * .34, A + Lb); c.lineTo(w / 2 - Lb * .045, A); c.closePath(); c.fill();
  return MBEAM = { key, bm, A, w };
}
let MBG = null, MENU_T0 = 0, MENU_LAST = -1e9;
function menuBg(cxp, cyp, W, H, d) {
  const key = [cxp | 0, cyp | 0, W, H, d].join(); if (MBG && MBG.key === key) return MBG.cv;
  const cv = document.createElement('canvas'); cv.width = Math.round(W * d); cv.height = Math.round(H * d); const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
  const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.75)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  MBG = { key, cv }; return cv;
}
/* Fundo comum do menu e da escolha de modo: grade deslizando, poeira, feixe de luz balançando e bordas escuras */
let MBL = null;
function blindsImg(IW, IH) {   // mancha de luz atravessando uma persiana: listras inclinadas com as bordas esmaecidas, guardada numa imagem
  const key = (IW | 0) + 'x' + (IH | 0); if (MBL && MBL.key === key) return MBL;
  const D = Math.ceil(Math.hypot(IW, IH) * .8), P = 84, Hh = D + P * 2, cv = document.createElement('canvas'); cv.width = D; cv.height = Hh; const c = cv.getContext('2d');
  c.fillStyle = 'rgba(231,228,211,.13)'; for (let y = 0; y < Hh; y += P) c.fillRect(0, y, D, P * .44);
  c.globalCompositeOperation = 'destination-in'; const g = c.createRadialGradient(D / 2, Hh / 2, D * .05, D / 2, Hh / 2, D * .5); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.6, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, D, Hh);
  return MBL = { key, cv, D, Hh, P };
}
function lobbyBg(IW, IH, ms, baseA, ent, style) {
  const sec = performance.now() / 1000, INK = '#e7e4d3', d = RES;
  ctx.save(); ctx.scale(ms, ms);
  const T = 64, off = (sec * 7) % T; ctx.strokeStyle = 'rgba(255,255,255,.03)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = -off; x < IW + T; x += T) { ctx.moveTo(Math.round(x) + .5, 0); ctx.lineTo(Math.round(x) + .5, IH); }
  for (let y = -off; y < IH + T; y += T) { ctx.moveTo(0, Math.round(y) + .5); ctx.lineTo(IW, Math.round(y) + .5); }
  ctx.stroke();
  ctx.fillStyle = INK;
  for (let n = 0; n < 26; n++) {
    const sd = n * 97.13, fr = v => v - Math.floor(v), px = fr(Math.sin(sd) * 43758.5) * IW + Math.sin(sec * .3 + sd) * 14, spd = 6 + fr(sd * 7.1) * 12, py = IH - ((sec * spd + fr(sd * 3.7) * IH) % IH);
    ctx.globalAlpha = baseA * (.05 + .12 * fr(sd * 5.3)) * Math.sin(Math.PI * py / IH) * ent(.2); ctx.fillRect(px, py, 1 + (n % 3 === 0), 1 + (n % 3 === 0));
  }
  ctx.globalAlpha = baseA; ctx.restore();
  if (style === 'blinds') {   // luz de persiana: listras inclinadas que deslizam bem devagar, com uma leve falha de energia de vez em quando
    const BL = blindsImg(IW, IH), drift = (sec * 5) % BL.P, fl = 1 - .35 * Math.pow(Math.max(0, Math.sin(sec * 2.3) * Math.sin(sec * 5.7)), 6);
    ctx.save(); ctx.scale(ms, ms); ctx.globalAlpha = baseA * ent(0) * (.85 + .15 * Math.sin(sec * .9)) * fl;
    ctx.translate(IW * .7, IH * .34); ctx.rotate(-.5); ctx.drawImage(BL.cv, -BL.D / 2, -BL.Hh / 2 + drift - BL.P / 2); ctx.restore(); ctx.globalAlpha = baseA;
  } else if (style === 'lamps') {   // duas lâmpadas penduradas por fios de tamanhos diferentes, balançando fora de compasso, com cone de luz e uma leve falha de energia
    ctx.save(); ctx.scale(ms, ms);
    [{ x: .2, cord: .11, ph: 0, a: 1 }, { x: .88, cord: .08, ph: 2.2, a: .85 }].forEach(Lp => {
      const ang = Math.sin(sec * .5 + Lp.ph) * .07, fl = 1 - .45 * Math.pow(Math.max(0, Math.sin(sec * 3.1 + Lp.ph) * Math.sin(sec * 7.3 + Lp.ph * 2)), 6), cy = IH * Lp.cord, ext = IH * 1.05;
      ctx.save(); ctx.translate(IW * Lp.x, -4); ctx.rotate(ang); ctx.globalAlpha = baseA * ent(0) * Lp.a;
      ctx.strokeStyle = 'rgba(231,228,211,.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, cy); ctx.stroke();
      const gc = ctx.createLinearGradient(0, cy + 26, 0, cy + 26 + ext); gc.addColorStop(0, 'rgba(231,228,211,' + (.2 * fl) + ')'); gc.addColorStop(.6, 'rgba(231,228,211,' + (.06 * fl) + ')'); gc.addColorStop(1, 'rgba(231,228,211,0)');
      ctx.fillStyle = gc; ctx.beginPath(); ctx.moveTo(-17, cy + 26); ctx.lineTo(17, cy + 26); ctx.lineTo(ext * .5, cy + 26 + ext); ctx.lineTo(-ext * .5, cy + 26 + ext); ctx.closePath(); ctx.fill();
      const gg = ctx.createRadialGradient(0, cy + 24, 0, 0, cy + 24, 70); gg.addColorStop(0, 'rgba(231,228,211,' + (.4 * fl) + ')'); gg.addColorStop(1, 'rgba(231,228,211,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, cy + 24, 70, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(231,228,211,.55)'; ctx.beginPath(); ctx.moveTo(-9, cy + 8); ctx.lineTo(9, cy + 8); ctx.lineTo(21, cy + 26); ctx.lineTo(-21, cy + 26); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    ctx.restore(); ctx.globalAlpha = baseA;
  } else if (style === 'none') {   // sem luz de ambiente (a tela tem a sua própria luz)
  } else {   // luz: um feixe que balança devagar de um lado para o outro, passando por cima do título
    const MB = menuBeam(IW, IH), ang = Math.sin(sec * .4) * .3, ax = IW / 2 + Math.sin(sec * .23 + 1) * IW * .1;
    ctx.save(); ctx.scale(ms, ms); ctx.globalAlpha = baseA * ent(0) * (.85 + .15 * Math.sin(sec * 1.3));
    ctx.translate(ax, -12); ctx.rotate(-ang); ctx.drawImage(MB.bm, -MB.w / 2, -MB.A);
    ctx.restore(); ctx.globalAlpha = baseA;
  }
  ctx.drawImage(menuBg(0, 0, innerWidth, innerHeight, d), 0, 0, innerWidth, innerHeight);   // escurece as bordas
}
const SCR = {};
function scrEnter(key) {   // entrada animada: recomeça sempre que a tela volta a aparecer
  const n = performance.now(), o = SCR[key] || (SCR[key] = { t0: n, last: -1e9 }); if (n - o.last > 300) o.t0 = n; o.last = n;
  const el = (n - o.t0) / 1000; return dl => easeOutExpo(clamp((el - dl) / .7, 0, 1));
}
function scrHead(text, cx, cy, ts, W, ent) {   // título no estilo do lobby e do ESCOLHER MODO: letras espaçadas, desce e aparece, e uma linha fina se abre embaixo
  const ls = v => { try { ctx.letterSpacing = v + 'px'; } catch (e) {} }, eT = ent(0), a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * eT; ls(Math.round(ts * .2)); txt(text, cx + ts * .1, cy - (1 - eT) * 22, ts, '#e7e4d3', 'center'); ls(0);
  const lw = Math.min(W, ts * 11) * ent(.25), ly = Math.round(cy + ts / 2 + 12) + .5; ctx.strokeStyle = 'rgba(231,228,211,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - lw / 2, ly); ctx.lineTo(cx + lw / 2, ly); ctx.stroke();
  ctx.globalAlpha = a0;
}
/* Logo OUTCOME desenhado à mão: letras de traço grosso com irregularidades feitas à mão, sombra deslocada e um fio fino por dentro (estilo cartaz noir),
   e um chapéu de feltro assentado, meio de lado, em cima do primeiro O. Cada letra entra uma depois da outra e o chapéu cai por último. */
const LOGO_WORD = 'OUTCOME', LOGO_WD = { O: 60, U: 60, T: 60, C: 58, M: 60, E: 52 }, LOGO_GAP = 18, LOGO_HAT = 40, LOGO_TOTAL = [...LOGO_WORD].reduce((a, ch) => a + LOGO_WD[ch], 0) + LOGO_GAP * 6;
function logoLetter(c, ch, sd) {
  const j = n => ((Math.sin((n + sd * 7.7) * 12.9898) * 43758.5453) % 1) * 1.6;   // pequena irregularidade fixa de cada ponto
  c.beginPath();
  if (ch === 'O') c.ellipse(30 + j(1), 45 + j(2), 22 + j(3), 38 + j(4), j(5) * .03, 0, TAU);
  else if (ch === 'U') { c.moveTo(8 + j(1), 4 + j(2)); c.lineTo(8 + j(3), 58); c.bezierCurveTo(8 + j(4), 94, 52 + j(5), 94, 52 + j(6), 58); c.lineTo(52 + j(7), 4 + j(8)); }
  else if (ch === 'T') { c.moveTo(j(1), 6 + j(2)); c.lineTo(60 + j(3), 6 + j(4)); c.moveTo(30 + j(5), 6); c.lineTo(30 + j(6), 90 + j(7)); }
  else if (ch === 'C') c.ellipse(34 + j(1), 45 + j(2), 24, 38 + j(3), 0, -Math.PI * .3, Math.PI * .3, true);
  else if (ch === 'M') { c.moveTo(6 + j(1), 90); c.lineTo(6 + j(2), 6 + j(3)); c.lineTo(30 + j(4), 58); c.lineTo(54 + j(5), 6 + j(6)); c.lineTo(54 + j(7), 90); }
  else { c.moveTo(50 + j(1), 6 + j(2)); c.lineTo(8 + j(3), 6); c.lineTo(8 + j(4), 90 + j(5)); c.lineTo(50 + j(6), 90 + j(7)); c.moveTo(8, 48 + j(8)); c.lineTo(40 + j(9), 48 + j(10)); }
}
function logoHat(c, ink, bg, edge) {   // chapéu de feltro (origem = centro do topo do O; y negativo = para cima)
  const crown = () => { c.beginPath(); c.moveTo(-28, 0); c.lineTo(-26, -24); c.quadraticCurveTo(-20, -35, -12, -34); c.quadraticCurveTo(-5, -33, 0, -26); c.quadraticCurveTo(5, -33, 12, -34); c.quadraticCurveTo(20, -35, 26, -24); c.lineTo(28, 0); c.closePath(); };
  c.fillStyle = ink; c.beginPath(); c.ellipse(0, 2, 52, 10, 0, 0, TAU); c.fill(); crown(); c.fill();
  if (edge) { c.strokeStyle = bg; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath(); c.ellipse(0, 2, 52, 10, 0, 0, TAU); c.stroke(); crown(); c.stroke(); c.fillStyle = ink; c.beginPath(); c.ellipse(0, 3, 49, 7.5, 0, .02 * Math.PI, .98 * Math.PI); c.fill(); }   // borda branca em volta do chapéu
  c.fillStyle = bg; c.beginPath(); c.moveTo(-27.4, -6); c.lineTo(27.4, -6); c.lineTo(26.6, -15); c.lineTo(-26.6, -15); c.closePath(); c.fill();   // faixa preta do chapéu
  c.strokeStyle = bg; c.lineWidth = 1.8; c.beginPath(); c.ellipse(0, 2, 52, 10, 0, .08 * Math.PI, .92 * Math.PI); c.stroke();   // aba: fio de sombra na frente
  crown(); c.lineWidth = 1.4; c.stroke();
}
function drawLogo(c, cx, top, w, baseA, ent) {
  const s = w / LOGO_TOTAL, INK = '#e7e4d3', BG = '#020203', WOB = [2, -3, 1, -2, 3, -1, 2]; let x = cx - w / 2, hatX = 0;
  c.save(); c.lineJoin = 'miter'; c.miterLimit = 3; c.lineCap = 'butt';
  [...LOGO_WORD].forEach((ch, i) => {
    const e = ent(.02 + i * .07), wd = LOGO_WD[ch];
    c.globalAlpha = baseA * e; c.save(); c.translate(x, top + LOGO_HAT * s - (1 - e) * 24); c.scale(s, s);
    c.translate(wd / 2, 45); c.rotate(((i % 2) ? 1 : -1) * .016 + (i === 3 ? .02 : 0)); c.translate(-wd / 2, -45 + WOB[i]);   // cada letra um pouco torta
    c.save(); c.translate(4, 4); c.strokeStyle = 'rgba(231,228,211,.16)'; c.lineWidth = 13; logoLetter(c, ch, i + 1); c.stroke(); c.restore();   // sombra deslocada
    c.strokeStyle = INK; c.lineWidth = 13; logoLetter(c, ch, i + 1); c.stroke();
    c.strokeStyle = BG; c.lineWidth = 2.2; c.stroke();   // fio fino por dentro do traço
    c.restore(); if (i === 0) hatX = x + 30 * s; x += (wd + LOGO_GAP) * s;
  });
  const eh = ent(.62); c.globalAlpha = baseA * eh; c.save(); c.translate(hatX, top + LOGO_HAT * s + 6 * s - (1 - eh) * 46 * s); c.scale(s, s); c.rotate(-.12 + (1 - eh) * -.5);
  c.save(); c.translate(4, 4); c.globalAlpha = baseA * eh * .5; logoHat(c, 'rgba(231,228,211,.2)', 'rgba(0,0,0,0)'); c.restore(); c.globalAlpha = baseA * eh; logoHat(c, INK, BG); c.restore();
  c.restore();
}
function drawMenu(t) {
  const baseA = ctx.globalAlpha, ms = uiScale(), IW = innerWidth / ms, IH = innerHeight / ms, d = RES;
  const nowMs = performance.now(); if (nowMs - MENU_LAST > 300) MENU_T0 = nowMs; MENU_LAST = nowMs;   // a entrada animada recomeça sempre que o lobby reaparece
  const el = (nowMs - MENU_T0) / 1000, ent = dl => easeOutExpo(clamp((el - dl) / .7, 0, 1)), sec = nowMs / 1000;
  ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, innerWidth, innerHeight);
  const cx = IW / 2, MUTE = '#8a8a96', INK = '#e7e4d3', BW = 540, LW = 214, GP = 8, RW = (BW - LW - 2 * GP) / 2, bx = cx - BW / 2, RH = 56;
  // o título cresce até a tinta das letras ocupar exatamente a largura do conjunto de botões (canto a canto)
  ctx.font = 'bold 100px "Courier New", monospace'; ctx.textAlign = 'left'; try { ctx.letterSpacing = '0px'; } catch (e) {}
  const mm = ctx.measureText('OUTCOME'), aL = mm.actualBoundingBoxLeft || 0, ink = mm.actualBoundingBoxRight !== undefined ? aL + mm.actualBoundingBoxRight : mm.width, ts = BW / (ink / 100 + 6 * .22);
  const y0 = Math.max(32, (IH - (ts + 192)) / 2);
  lobbyBg(IW, IH, ms, baseA, ent);
  ctx.save(); ctx.scale(ms, ms);
  const k = ctx.getTransform().a / d;   // escala para a área de clique (igual à dos botões)
  // título: desce e aparece; uma linha fina se abre embaixo
  const eT = ent(0); ctx.globalAlpha = baseA * eT;
  try { ctx.letterSpacing = (ts * .22) + 'px'; } catch (e) {}
  const tx0 = bx + aL * ts / 100, ty0 = y0 + ts / 2 - (1 - eT) * 22;
  txt('OUTCOME', tx0, ty0, ts, INK, 'left');
  { // chapéu de feltro assentado, meio de lado, em cima do primeiro O (cai por último)
    const mo = ctx.measureText('O'), wO = (mo.actualBoundingBoxLeft || 0) + (mo.actualBoundingBoxRight || ts * .5), xO = tx0 - (mo.actualBoundingBoxLeft || 0) + wO / 2, topO = ty0 - (mo.actualBoundingBoxAscent || ts * .35);
    const hs = wO * 1.35 / 104, eh = ent(.62);
    ctx.save(); ctx.translate(xO, topO + 9 * hs - (1 - eh) * 46 * hs); ctx.scale(hs, hs); ctx.rotate(-.12 + (1 - eh) * -.5); ctx.globalAlpha = baseA * eh;
    logoHat(ctx, '#0d0d11', INK, true); ctx.restore();   // chapéu escuro com a borda branca, bem encostado no O ctx.globalAlpha = baseA * eT;
  }
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  const lw = BW * ent(.25); ctx.strokeStyle = 'rgba(231,228,211,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - lw / 2, y0 + ts + 22.5); ctx.lineTo(cx + lw / 2, y0 + ts + 22.5); ctx.stroke();
  let y = y0 + ts + 48;
  // bloco JOGAR alto à esquerda (destaque) e grade 2x2 à direita; cada botão sobe e aparece em sequência
  const B = (n, fn) => { const e = ent(.3 + n * .08); ctx.globalAlpha = baseA * e; fn((1 - e) * 18); ctx.globalAlpha = baseA; };
  const x1 = bx + LW + GP, x2 = x1 + RW + GP, H2 = RH * 2 + GP;
  B(0, o => {
    const yy = y + o, hov = input.mx > bx * k && input.mx < (bx + LW) * k && input.my > yy * k && input.my < (yy + H2) * k; btnShape(bx, yy, LW, H2, hov, true);
    const ix = bx + LW - 36, iy = yy + 36, r = 14; ctx.strokeStyle = '#0d0d11'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy, r, 0, TAU);
    ctx.moveTo(ix - r - 6, iy); ctx.lineTo(ix - 5, iy); ctx.moveTo(ix + 5, iy); ctx.lineTo(ix + r + 6, iy); ctx.moveTo(ix, iy - r - 6); ctx.lineTo(ix, iy - 5); ctx.moveTo(ix, iy + 5); ctx.lineTo(ix, iy + r + 6); ctx.stroke();
    try { ctx.letterSpacing = '3px'; } catch (e) {} txt('JOGAR', bx + 20, yy + H2 - 28, 28, '#0d0d11', 'left'); try { ctx.letterSpacing = '0px'; } catch (e) {}
    ui.push({ x: bx * k, y: yy * k, w: LW * k, h: H2 * k, fn: () => setState('modes') });
  });
  B(1, o => button('ARMAS', x1, y + o, RW, RH, () => { resetPicker(INFO); setState('info'); }));
  B(2, o => button('PERSONAGENS', x2, y + o, RW, RH, () => { resetPicker(CHP); setState('chars'); }));
  B(3, o => button('ATUALIZAÇÃO', x1, y + RH + GP + o, RW, RH, () => { logScroll = 0; setState('log'); }));
  B(4, o => button('OPÇÕES', x2, y + RH + GP + o, RW, RH, () => { optBack = 'menu'; optScroll = 0; setState('options'); }));
  ctx.globalAlpha = baseA * ent(.8); txt(UPDATES[0].v, IW - 20, IH - 18, 12, MUTE, 'right'); ctx.globalAlpha = baseA;   // contador de versão (só no lobby)
  ctx.restore();
}

/* --------------------------- CONFIGURAR PARTIDA ------------------------- */
/* ------------- CONFIGURAÇÃO DOS MODOS PREDEFINIDOS (1v1..4v4) ----------- */
function chevBtn(x, y, s, dir, fn, k) {   // botão quadrado arredondado com seta < ou >
  const hov = input.mx > x * k && input.mx < (x + s) * k && input.my > y * k && input.my < (y + s) * k;
  ctx.beginPath(); ctx.roundRect(x + .5, y + .5, s - 1, s - 1, Math.min(14, s * .28)); ctx.fillStyle = hov ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,0)'; ctx.fill();
  ctx.strokeStyle = hov ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.28)'; ctx.lineWidth = 1; ctx.stroke();
  const mx = x + s / 2, my = y + s / 2, a = s * .11;
  ctx.strokeStyle = '#e7e4d3'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(mx - dir * a, my - a * 1.5); ctx.lineTo(mx + dir * a, my); ctx.lineTo(mx - dir * a, my + a * 1.5); ctx.stroke();
  ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  ui.push({ x: x * k, y: y * k, w: s * k, h: s * k, fn });
}
function drawSetupPre() {
  const ms = uiScale(), IW = innerWidth / ms, IH = innerHeight / ms, cx = IW / 2, MUTE = '#8a8a96', DIM = '#5c5c68', INK = '#e7e4d3', GRN = '#8fd6a4', RED = '#ff7a6b', solo = soloSetup, n = cfg.team, pre = n > 0 && !solo, N = MAPS.length + 1;
  const ent = scrEnter('setup'); ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, innerWidth, innerHeight); lobbyBg(IW, IH, ms, 1, ent, 'lamps');
  ctx.save(); ctx.scale(ms, ms);
  const k = ctx.getTransform().a / (RES), cyc = (v, m, d) => (v + d + m) % m, ls = v => { try { ctx.letterSpacing = v + 'px'; } catch (e) {} };
  const over = (x, y, w, h) => input.mx > x * k && input.mx < (x + w) * k && input.my > y * k && input.my < (y + h) * k;
  const cyc2 = cyc, fmt = sec => sec >= 60 ? (sec / 60) + ' MIN' + (sec % 60 ? ' ' + sec % 60 + 'S' : '') : sec + ' S';
  const diffR = ['DIFICULDADE', DIFFS[cfg.diff].name, () => cfg.diff = Math.max(0, cfg.diff - 1), () => cfg.diff = Math.min(2, cfg.diff + 1)];
  const lootR = ['ARMAS', LOOTS[cfg.loot].name + ' · ' + lootInit(cfg.loot, solo ? 1 : nBots() + 1), () => cfg.loot = cyc2(cfg.loot, LOOTS.length, -1), () => cfg.loot = cyc2(cfg.loot, LOOTS.length, 1)];
  if (!bgSetup && cfg.bots < 1) cfg.bots = 1;
  const modeRow = ['MODO', n + 'v' + n, () => cfg.team = cfg.team <= 1 ? 4 : cfg.team - 1, () => cfg.team = cfg.team >= 4 ? 1 : cfg.team + 1];   // BOTS: formato da partida   // só o campo de batalha aceita 0 bots
  const rows = solo ? [lootR] : botsSetup ? [modeRow, ['ESTILO', MODES[cfg.mode], () => cfg.mode = cyc2(cfg.mode, 2, -1), () => cfg.mode = cyc2(cfg.mode, 2, 1)],
    ['PONTOS', cfg.mode ? '∞' : String(PTS[cfg.pts]), cfg.mode ? null : () => cfg.pts = cyc2(cfg.pts, PTS.length, -1), cfg.mode ? null : () => cfg.pts = cyc2(cfg.pts, PTS.length, 1)],
    ['TEMPO', fmt(TIMES[cfg.time]), () => cfg.time = cyc2(cfg.time, TIMES.length, -1), () => cfg.time = cyc2(cfg.time, TIMES.length, 1)], lootR, diffR] : pre ? [   // solitário: só armas | predefinido: pontos, armas e dificuldade (o mapa fica no painel)
    ['PONTOS', String(PTS[cfg.pts]), () => cfg.pts = cyc2(cfg.pts, PTS.length, -1), () => cfg.pts = cyc2(cfg.pts, PTS.length, 1)],
    lootR, diffR,
  ] : [   // sala personalizada: tudo liberado
    ['MODO', MODES[cfg.mode], () => cfg.mode = cyc2(cfg.mode, 2, -1), () => cfg.mode = cyc2(cfg.mode, 2, 1)],
    ['PONTOS', cfg.mode ? '∞' : String(PTS[cfg.pts]), cfg.mode ? null : () => cfg.pts = cyc2(cfg.pts, PTS.length, -1), cfg.mode ? null : () => cfg.pts = cyc2(cfg.pts, PTS.length, 1)],
    diffR,
    ['BOTS', String(cfg.bots), () => cfg.bots = Math.max(bgSetup ? 0 : 1, cfg.bots - 1), () => cfg.bots = Math.min(8, cfg.bots + 1)],
    ['TEMPO', fmt(TIMES[cfg.time]), () => cfg.time = cyc2(cfg.time, TIMES.length, -1), () => cfg.time = cyc2(cfg.time, TIMES.length, 1)],
    lootR,
  ];
  const R = rows.length, custom = !pre || botsSetup;
  /* Modelo da tela (mesmo jeito do ESCOLHER MODO): um cartão grande com a ficha da sala/partida (nome, quem joga e resumo das regras, que muda ao vivo)
     ao lado de uma lista de linhas em moldura de botão, cada uma com o nome à esquerda e < valor > à direita. Em telas estreitas o cartão vai em cima. */
  const tot = Math.min(IW - 32, solo ? 640 : 980), wide = !solo && IW >= 820, gx = cx - tot / 2, rh = R > 4 ? (wide ? 46 : 40) : 52, rgMin = wide ? 10 : 8, rowsMin = R * rh + (R - 1) * rgMin;
  const lw = wide ? Math.round(tot * .42) : tot, rw = wide ? tot - lw - 20 : tot;
  const f = clamp((tot - 110) / 398, .6, 1), selW = 150 * f, selH = 104 * f, sdW = 108 * f, sdH = 76 * f, ph = solo ? Math.round(46 + selH + 74) : 0;
  const cardH = solo ? ph : wide ? Math.max(rowsMin, 300) : 150, colH = wide ? cardH : cardH + 20 + rowsMin;
  const bgNote = bgSetup && !solo ? 22 : 0, ts = clamp(Math.min(IW / 14, IH / 14), 22, 38);
  const contH = ts + 34 + colH + bgNote + 22 + 56, y0 = Math.max(14, (IH - contH) / 2 - 6), ty = y0 + ts + 34;
  const TIPR = {
    MODO: botsSetup ? 'Formato da partida: quantos jogadores em cada time, de 1v1 até 4v4.' : 'Clássico: vence quem chegar primeiro à meta de pontos. Infinito: as rodadas não acabam, só o placar sobe.',
    ESTILO: 'Clássico: vence quem chegar primeiro à meta de pontos. Infinito: as rodadas não acabam, só o placar sobe.',
    PONTOS: 'Meta da partida: vence quem chegar primeiro a esse número de pontos (1 ponto por rodada). No modo infinito não existe meta.',
    DIFICULDADE: 'Define o quanto os bots são fortes: vida, velocidade e mira. Fácil: 50 de vida. Normal: 70. Difícil: 90.',
    BOTS: 'Quantidade de bots na sala, além de você e dos amigos que entrarem. ' + (bgSetup ? 'Pode ser zero.' : 'O mínimo é 1.'),
    TEMPO: 'Duração de cada rodada. Se o tempo acabar, vence quem estiver com mais vida.',
    ARMAS: 'Quantidade de armas espalhadas pelo mapa e de quanto em quanto tempo elas reaparecem. O número ao lado é quantas já começam no chão.',
  };
  scrHead(solo ? 'SOLITÁRIO' : pre ? `PARTIDA ${n}v${n}` : bgSetup ? 'CAMPO DE BATALHA' : 'SALA PERSONALIZADA', cx, y0 + ts / 2, ts, IW, ent); ctx.globalAlpha = ent(.2);
  const lab = (t, x, y) => { ls(3); txt(t, x, y, 10.5, MUTE, 'left'); ls(0); };
  if (solo) {   // MAPA (só no SOLITÁRIO): carrossel dentro de um cartão
    const px = gx, py = ty, pw = tot, pcx = px + pw / 2;
    ctx.beginPath(); ctx.roundRect(px + .5, py + .5, pw - 1, ph - 1, 16); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke();
    if (over(px, py, pw, ph)) TIPNOW = 'Escolha o mapa do treino. ALEATÓRIO sorteia um mapa novo a cada partida.';
    ls(3); txt('MAPA', pcx + 1, py + 28, 20, INK, 'center'); ls(0);
  const cyT = py + 46 + (ph - 84 - (selH + 28)) / 2 + selH / 2, sel = cfg.map, pick = i => { cfg.map = i; saveCfg(); };
  const thumb = (i, x, y, w, h, on) => {
    const mp = MAPS[i]; ctx.globalAlpha = on ? 1 : .6; drawMapPreview(mp, x, y, w, h);
    if (!mp) txt('?', x + w / 2, y + h / 2 + 2, h * .6, INK, 'center');
    ctx.beginPath(); ctx.roundRect(x + .5, y + .5, w - 1, h - 1, 12); ctx.strokeStyle = on ? INK : 'rgba(255,255,255,.25)'; ctx.lineWidth = on ? 2.5 : 1.5; ctx.stroke(); ctx.globalAlpha = 1;
    txt(mp ? mp.name : 'ALEATÓRIO', x + w / 2, y + h + (on ? 20 : 16), on ? 15 : 12, on ? INK : MUTE, 'center');
    if (!on) ui.push({ x: x * k, y: y * k, w: w * k, h: (h + 26) * k, fn: () => pick(i) });
  };
  const li = cyc(sel, N, -1), ri = cyc(sel, N, 1);
  thumb(li, pcx - selW / 2 - 16 * f - sdW, cyT - sdH / 2, sdW, sdH, false);
  thumb(ri, pcx + selW / 2 + 16 * f, cyT - sdH / 2, sdW, sdH, false);
  thumb(sel, pcx - selW / 2, cyT - selH / 2, selW, selH, true);
  chevBtn(px + 12, cyT - 20, 40, -1, () => pick(li), k); chevBtn(px + pw - 52, cyT - 20, 40, 1, () => pick(ri), k);
  { const dy = py + ph - 20, sp = 30, dx0 = pcx - (N - 1) * sp / 2;
    for (let i = 0; i < N; i++) { const dx = dx0 + i * sp; ctx.beginPath(); ctx.arc(dx, dy, 5.5, 0, TAU); if (i === sel) { ctx.fillStyle = INK; ctx.fill(); } else { ctx.strokeStyle = 'rgba(231,228,211,.7)'; ctx.lineWidth = 1.5; ctx.stroke(); }
      ui.push({ x: (dx - 14) * k, y: (dy - 14) * k, w: 28 * k, h: 28 * k, fn: () => pick(i) }); } }
  } else {   // ficha da sala
    const pad = 20, lx = gx, fx = lx + pad, fw = lw - pad * 2, fy = ty + pad + 22, fh = 44, rn = cfg.roomName || '', bad = nameErr && !rn.trim();
    btnShape(lx, ty, lw, cardH, false, false, 18);
    lab('NOME DA SALA', fx, ty + pad + 6);
    ctx.beginPath(); ctx.roundRect(fx + .5, fy + .5, fw - 1, fh - 1, 12); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill(); ctx.strokeStyle = bad ? '#ff6b6b' : nameFocus ? INK : 'rgba(231,228,211,.26)'; ctx.lineWidth = nameFocus || bad ? 2 : 1; ctx.stroke();
    txt(rn || 'SALA', fx + 16, fy + fh / 2 + 1, 17, rn ? INK : DIM, 'left');
    if (nameFocus && Math.floor(menuT * 2) % 2 === 0) { ctx.font = 'bold 17px "Courier New", monospace'; const cw2 = ctx.measureText(rn).width; ctx.fillStyle = INK; ctx.fillRect(fx + 18 + cw2, fy + 11, 2, fh - 22); }
    if (bad) txt('ESCREVA UM NOME', fx + fw - 14, fy + fh / 2 + 1, 10, '#ff6b6b', 'right'); else if (!rn && !nameFocus) txt(TOUCH ? 'TOQUE PARA ESCOLHER' : 'CLIQUE E DIGITE', fx + fw - 14, fy + fh / 2 + 1, 10, DIM, 'right');
    if (over(fx, fy, fw, fh)) TIPNOW = 'Nome da sala. É o nome que os amigos veem dentro do lobby. Precisa de um nome para criar a sala.';
    ui.push({ x: fx * k, y: fy * k, w: fw * k, h: fh * k, fn: () => { if (TOUCH) { const v = prompt('Nome da sala (até 16 letras)', cfg.roomName || ''); if (v !== null) { cfg.roomName = v.slice(0, 16); nameErr = false; } } else nameFocus = true; } });
    const fmt2 = sec => sec >= 60 ? (sec / 60) + ' MIN' + (sec % 60 ? ' ' + sec % 60 + 'S' : '') : sec + ' S';
    const sum = custom ? [cfg.mode ? 'INFINITO · SEM META DE PONTOS' : `CLÁSSICO · PRIMEIRO A ${PTS[cfg.pts]} PONTOS`, fmt2(TIMES[cfg.time]) + ' POR RODADA'] : [`PRIMEIRO A ${PTS[cfg.pts]} PONTOS`, 'RODADAS DE 3 MIN'];
    sum.push(`ARMAS ${LOOTS[cfg.loot].name} · BOTS ${DIFFS[cfg.diff].name}`);
    if (wide) {   // quem joga (bolinhas) e resumo das regras
      let yy = fy + fh + 30; lab('JOGADORES', fx, yy); yy += 26;
      const dot = (x, c, mine) => { ctx.beginPath(); ctx.arc(x, yy, 7, 0, TAU); ctx.fillStyle = c; ctx.fill(); if (mine) { ctx.beginPath(); ctx.arc(x, yy, 11, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); } };
      let dx = fx + 11, cap;
      if (pre) { for (let i = 0; i < n; i++) { dot(dx, GRN, i === 0); dx += 24; } ls(2); txt('VS', dx + 2, yy + 1, 11, MUTE, 'left'); ls(0); dx += 38; for (let i = 0; i < n; i++) { dot(dx, RED, false); dx += 24; } cap = `SEU TIME (${n}) CONTRA ${n} INIMIGO${n > 1 ? 'S' : ''}`; }
      else { const tn = Math.min(9, 1 + cfg.bots); for (let i = 0; i < tn; i++) { dot(dx, i ? 'rgba(231,228,211,.5)' : INK, i === 0); dx += 24; } cap = bgSetup ? 'VOCÊ + BOTS + AMIGOS · CADA UM POR SI' : `VOCÊ + ${cfg.bots} BOT${cfg.bots > 1 ? 'S' : ''} + AMIGOS`; }
      txt(cap, fx, yy + 28, 10.5, MUTE, 'left');
      if (over(fx, yy - 14, fw, 50)) TIPNOW = 'Quem vai jogar: você, os bots e os amigos que entrarem na sala pelo código.';
      yy += 62; lab('RESUMO', fx, yy); yy += 24;
      sum.forEach((l, i) => txt(l, fx, yy + i * 22, 13, i < 2 ? INK : 'rgba(231,228,211,.6)', 'left'));
    } else { sum.slice(0, 2).forEach((l, i) => txt(l, fx, fy + fh + 26 + i * 22, 13, INK, 'left')); }
  }
  // linhas de regras: nome à esquerda, < valor > à direita (as regras fixas aparecem apagadas)
  const rg = wide && R > 1 ? clamp((cardH - R * rh) / (R - 1), rgMin, 22) : rgMin, rowsH = R * rh + (R - 1) * rg;
  const rx = wide ? gx + lw + 20 : gx, ry0 = wide ? ty + (cardH - rowsH) / 2 : ty + cardH + 20;
  rows.forEach(([label, val, prev, next], i) => {
    const y = ry0 + i * (rh + rg), hov = over(rx, y, rw, rh), s = rh - 14, vw = clamp(rw * .36, 96, 168), bx2 = rx + rw - 8 - s, bx1 = bx2 - vw - s, vx = (bx1 + s + bx2) / 2;
    btnShape(rx, y, rw, rh, hov, false, 12);
    ls(2); txt(label, rx + 18, y + rh / 2 + 1, 12, hov ? INK : 'rgba(231,228,211,.78)', 'left'); ls(0);
    if (prev) { chevBtn(bx1, y + 7, s, -1, prev, k); chevBtn(bx2, y + 7, s, 1, next, k); }
    txt(val, vx, y + rh / 2 + 1, Math.max(10, Math.min(18, vw / (val.length * .62))), prev ? INK : MUTE, 'center');
    if (hov && TIPR[label]) TIPNOW = TIPR[label];
  });
  const by = ty + colH + bgNote + 22;
  if (bgNote) txt('Todos contra todos: a partida começa quando todos da sala estiverem prontos.', cx, ty + colH + 14, 11, DIM, 'center');
  const bw = Math.min(tot, 340), okName = solo || (cfg.roomName || '').trim();
  button(solo ? 'COMEÇAR' : 'CRIAR SALA', cx - bw / 2, by, bw, 56, startSetup, okName ? 'primary' : undefined, okName ? undefined : 'Escreva um nome para a sala antes de criar.');
  cornerBtn('VOLTAR', -1, IW, IH, () => setState(solo || botsSetup ? 'train' : 'modes'));
  ctx.restore();
}

const startSetup = () => { if (!soloSetup && !(cfg.roomName || '').trim()) { nameErr = true; if (!TOUCH) nameFocus = true; return; }   // sala sem nome não é criada
  saveCfg(); if (soloSetup) { cfg.char = Math.floor(Math.random() * CHARS.length); startGame(true); } else createRoom(); };   // solitário: personagem sorteado
function drawSetup(t) { drawSetupPre(); }   // predefinidos e sala personalizada usam a mesma tela (muda só a lista de opções)


function drawTargetIcon(x, y, col) {   // alvo simples: 2 anéis + centro
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 17, 0, TAU); ctx.moveTo(x + 9.5, y); ctx.arc(x, y, 9.5, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TAU); ctx.fill(); ctx.restore();
}
