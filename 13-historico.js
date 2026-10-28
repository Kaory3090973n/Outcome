/* ------------------------- HISTÓRICO DE ATUALIZAÇÕES -------------------- */
/* A CADA ATUALIZAÇÃO: SUBSTITUIR a única entrada desta lista pela nova (n = número da atualização, v = versão beta). Não acumular histórico: fica só a última.
   Versão 0.MEIO.ÚLTIMO: atualização com recurso/mecânica nova sobe o do meio e zera o último (0.4.0 -> 0.5.0);
   atualização só de correção ou ajuste pequeno sobe o último (0.4.0 -> 0.4.1). A atualização 1 foi a 0.1.0.
   Só inclua as chaves criado/modificado/removido que tiverem itens (nunca escreva "nada foi ..."; a tela omite o que não existe).
   O lobby mostra só UPDATES[0].v (o número, sem "BETA") no canto inferior direito e a tela ATUALIZAÇÃO mostra só a última. */
const UPDATES = [
  { n: 106, v: '0.54.1', title: 'Detetive com 16 direções',
    modificado: [
      'O corpo do Detetive agora tem 16 direções (de 22,5° em 22,5°) em vez de 8, então a virada ao mirar fica bem mais suave.',
    ] },
];
function wrapLines(text, maxW, size) {
  ctx.font = `bold ${size}px "Courier New", monospace`; const out = []; let line = '';
  for (const word of text.split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t; }
  out.push(line); return out;
}
function drawLog(t) {
  const ms = uiScale(), W = innerWidth / ms, H = innerHeight / ms, cx = W / 2;
  const ent = scrEnter('log');
  ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, innerWidth, innerHeight); lobbyBg(W, H, ms, 1, ent, 'pass');   // mesmo fundo do menu
  ctx.save(); ctx.scale(ms, ms);
  const colW = Math.min(760, W - 32), x0 = cx - colW / 2, top = 84, bot = H - 84, pad = 20, LH = 19, FS = 13, inner = colW - pad * 2 - 16;
  const SECT = [['criado', 'CRIADO', '#8fd6a4'], ['modificado', 'MODIFICADO', '#e7c27a'], ['removido', 'REMOVIDO', '#e08a8a']];
  const ops = [], cards = []; let y = 0;
  for (const u of UPDATES) {
    const y1 = y; y += pad;
    ops.push({ k: 'head', y, u }); y += 52;
    for (const [key, label, col] of SECT) {
      if (!u[key] || !u[key].length) continue;   // só mostra o que mudou: seção vazia ou ausente não aparece
      ops.push({ k: 'label', y, label, col }); y += 24;
      for (const it of u[key]) { const ls = wrapLines(it, inner, FS); ops.push({ k: 'item', y, ls, col }); y += ls.length * LH + 6; }
      y += 8;
    }
    y += pad - 8; cards.push({ y: y1, h: y - y1 }); y += 16;
  }
  const maxS = Math.max(0, y - (bot - top)); logScroll = clamp(logScroll, 0, maxS);
  scrHead('ATUALIZAÇÃO', cx, 36, clamp(Math.min(W / 14, H / 14), 20, 32), W, ent); ctx.globalAlpha = ent(.2);   // o resto da tela aparece em seguida
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, bot - top); ctx.clip(); ctx.translate(0, top - logScroll);
  for (const c of cards) { ctx.beginPath(); ctx.roundRect(x0 + .5, c.y + .5, colW - 1, c.h - 1, 18); const gr = ctx.createLinearGradient(0, c.y, 0, c.y + c.h); gr.addColorStop(0, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(255,255,255,.012)'); ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke(); }   // mesmo fundo dos cartões 1v1..4v4
  for (const o of ops) {
    if (o.k === 'head') { txt('Atualização ' + o.u.n, x0 + pad, o.y + 12, 18, '#e7e4d3', 'left'); txt('v' + o.u.v, x0 + colW - pad, o.y + 12, 13, '#8a8a96', 'right'); txt(o.u.title, x0 + pad, o.y + 38, 13, '#8a8a96', 'left'); }
    else if (o.k === 'label') { ctx.beginPath(); ctx.roundRect(x0 + pad, o.y + 3, 8, 8, 4); ctx.fillStyle = o.col; ctx.fill(); txt(o.label, x0 + pad + 16, o.y + 8, 11, o.col, 'left'); }
    else o.ls.forEach((l, i) => { if (i === 0) txt('•', x0 + pad, o.y + 8, FS, o.col, 'left'); txt(l, x0 + pad + 16, o.y + 8 + i * LH, FS, 'rgba(231,228,211,.85)', 'left'); });
  }
  ctx.restore();
  if (maxS > 0) { const th = Math.max(30, (bot - top) * (bot - top) / y), ty = top + (bot - top - th) * (logScroll / maxS); ctx.beginPath(); ctx.roundRect(x0 + colW + 8, ty, 4, th, 2); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill(); }
  cornerBtn('VOLTAR', -1, W, H, () => setState('menu'));
  ctx.restore();
}
function drawDead() {
  ctx.fillStyle = 'rgba(30,0,10,.6)'; ctx.fillRect(0, 0, innerWidth, innerHeight);
  const cx = innerWidth / 2, cy = innerHeight / 2;
  txt('VOCÊ MORREU', cx, cy - 90, clamp(innerWidth / 12, 32, 64), '#e7e4d3', 'center');
  txt(`ABATES: ${kills}`, cx, cy - 36, 20, '#8a8a96', 'center');
  button('JOGAR DE NOVO', cx - 130, cy + 4, 260, 52, () => startGame(training), 'primary');
  button('MENU', cx - 130, cy + 70, 260, 44, () => setState('menu'), '#00e5ff');
}

/* ------------------------------ ONLINE (WebRTC via PeerJS) ------------------ */
