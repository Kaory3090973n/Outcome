/* ---------------------------- GAME LOOP ------------------------------- */
let last = performance.now();
function loop(now) {
  perfTick(now - last); let dt = Math.min((now - last) / 1000, .05); last = now; ui = []; if (!HOVF) HOVK = null; HOVF = false; const rdt = dt;
  updateMusic();
  if (state === 'intro') { if (!introGate) introT += dt; drawIntro(introT); }
  else if (state === 'train') { menuT += dt; drawTrain(menuT); }
  else if (state === 'modes') { menuT += dt; drawModes(menuT); }
  else if (state === 'maps') { menuT += dt; drawMaps(menuT); }
  else if (state === 'setup') { menuT += dt; drawSetup(menuT); }
  else if (state === 'pick') { menuT += dt; if (NET.host) selStep(rdt); else if (NET.sel) NET.sel.t = Math.min(NET.sel.dur, NET.sel.t + rdt); drawPick(menuT); }
  else if (state === 'room') { menuT += dt; bgTick(rdt); drawRoom(menuT); }
  else if (state === 'join') { menuT += dt; drawJoin(menuT); }
  else if (state === 'options') { menuT += dt; drawOptions(menuT); }
  else if (state === 'menu') { menuT += dt; drawMenu(menuT); }
  else if (state === 'info') { menuT += dt; drawInfo(menuT); }
  else if (state === 'log') { menuT += dt; drawLog(menuT); }
  else if (state === 'chars') { menuT += dt; drawChars(menuT); }
  else {
    menuT += dt;
    if (hitStop > 0) { hitStop -= dt; dt = 0; }   // hit stop no impacto do soco
    if (NET.cl) clientStep(rdt);
    else {
    let frozen = (state === 'pause' || state === 'tutend') && (!NET.online || (NET.host && !NET.guests.length));   // pausado: tudo congelado (só com bots: online com outra pessoa a partida não para)
    if (!frozen && M && !training) { const r = stepMatch(dt); if (r < 0) frozen = true; else dt = r; }   // contagem, rodadas e relógio
    if (frozen) { input.interact = input.throwReq = input.reloadReq = input.coverReq = input.slideReq = input.holsterReq = input.down = false; } else updatePlay(dt);
    }
    updateCam(); netTick(rdt);
    ctx.save();
    ctx.scale(ZOOM, ZOOM);
    if (shake > 0) ctx.translate(rnd(-.5, .5) * shake, rnd(-.5, .5) * shake);
    ctx.translate(-cam.x, -cam.y);
    drawFloor();
    for (const d of decals) { ctx.fillStyle = `rgba(150,10,35,${d.a})`; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill(); }
    drawBlood();
    drawPickups(menuT); drawCrates();
    if (M && M.team) for (const f of allF()) if (!f.dead) {   // anel no chão: verde = seu time, vermelho = inimigo
      ctx.strokeStyle = f.team === player.team ? 'rgba(143,214,164,.85)' : 'rgba(255,90,90,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 24, 0, TAU); ctx.stroke();
    }
    for (const b of bots) if (!b.dead) drawFighter(b);
    if (!player.dead) drawFighter(player);
    drawThrown(); drawFx();
    if (curMap && curMap.over) curMap.over(menuT);   // camada elevada: ponte rolante, fumaça, faíscas, holofotes, névoa
    if (showHit) for (const f of allF()) for (const h of ['left', 'right']) {
      const p = f.punch[h]; if (f.dead || p.t < .2 || p.t > .44) continue;
      const fl = fistLocal(f, h), w = toWorld(f, fl.x, fl.y); ctx.strokeStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(w.x, w.y, C.hitRadius, 0, TAU); ctx.stroke();
    }
    ctx.restore();
    // sem vinheta nem névoa escura ao redor do personagem: o mapa inteiro aparece claro; um leve clareamento deixa o piso mais visível
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(0, 0, innerWidth, innerHeight); ctx.restore();
    drawHUD(menuT);
    if (state === 'dead') drawDead();
    if (state === 'pause') drawPause();
    if (state === 'tutend') drawTutEnd();
    if (state === 'mend' && M) drawMatchEnd();
  }
  if (TOUCH && state === 'play' && innerHeight > innerWidth) {   // pede para girar o celular
    ctx.fillStyle = 'rgba(8,4,18,.92)'; ctx.fillRect(0, 0, innerWidth, innerHeight);
    txt('GIRE O CELULAR', innerWidth / 2, innerHeight / 2 - 12, Math.min(26, innerWidth / 12), '#e7e4d3', 'center');
    txt('(modo paisagem)', innerWidth / 2, innerHeight / 2 + 22, 14, '#8a8a96', 'center');
  }
  flushTip();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

