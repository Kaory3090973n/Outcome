function playerIntent(dt) {
  if (state === 'pause') return { mx: 0, my: 0, aim: player.angle, fire: false, punch: false, reload: false, throw: false };   // menu aberto: personagem parado
  const k = input.keys;
  let mx = (k[KEYS.right] || k.ArrowRight ? 1 : 0) - (k[KEYS.left] || k.ArrowLeft ? 1 : 0);
  let my = (k[KEYS.down] || k.ArrowDown ? 1 : 0) - (k[KEYS.up] || k.ArrowUp ? 1 : 0);
  if (touch.move.id !== null) { mx += touch.move.dx; my += touch.move.dy; }
  input.buffer = Math.max(0, input.buffer - dt);
  const w = player.weapon && WEAPONS[player.weapon];
  return { mx, my, aim: TOUCH ? touch.ang : Math.atan2(input.my / ZOOM + cam.y - player.y, input.mx / ZOOM + cam.x - player.x),
    fire: !!w && !w.knuckle && (input.down || input.buffer > 0), punch: (!w || w.knuckle) && input.buffer > 0, reload: input.reloadReq, throw: input.throwReq, slide: input.slideReq, holster: input.holsterReq };   // armas: segurar atira | sem arma: só clique
}

function botIntent(b, dt) {
  const d = DIFFS[cfg.diff];
  b.tgtT -= dt;
  if (b.tgtT <= 0 || !b.tgt || b.tgt.dead) {   // escolhe o lutador vivo mais próximo (jogador ou outro bot)
    b.tgtT = rnd(.8, 1.6); b.tgt = null; let bd = 1e9;
    for (const o of allF()) if (o !== b && !o.dead && o.team !== b.team) { const q = Math.hypot(o.x - b.x, o.y - b.y); if (q < bd) { bd = q; b.tgt = o; } }
  }
  const none = !b.tgt, p = b.tgt || b, dx = p.x - b.x, dy = p.y - b.y, dist = Math.hypot(dx, dy) || 1;
  const it = { mx: 0, my: 0, aim: b.angle, fire: false, punch: false, reload: false };
  // Mira suave com erro aleatório (bots não são aimbots)
  b.biasT -= dt; if (b.biasT <= 0) { b.aimBias = rnd(-d.err, d.err); b.biasT = rnd(.4, 1); }
  const target = none ? b.angle + .01 : Math.atan2(dy, dx) + b.aimBias, da = angDiff(target, b.angle);
  b.angle += clamp(da, -d.turn * dt, d.turn * dt); it.aim = b.angle;
  b.strafeT -= dt; if (b.strafeT <= 0) { b.strafe *= -1; b.strafeT = rnd(1.2, 3); }
  const tx = dx / dist, ty = dy / dist, sx = -ty * b.strafe, sy = tx * b.strafe;
  if (none) return it;

  if (!b.weapon) {
    // Sem arma: vai até a arma mais próxima; senão parte pro soco
    let best = null, bd = 1e9;
    for (const pk of pickups) { const q = Math.hypot(pk.x - b.x, pk.y - b.y); if (q < bd) { bd = q; best = pk; } }
    if (best) {
      const ax = best.x - b.x, ay = best.y - b.y, ad = Math.hypot(ax, ay) || 1; it.mx = ax / ad; it.my = ay / ad;
      if (ad < 24) { giveWeapon(b, best.key, best.mag, best.reserve); pickups.splice(pickups.indexOf(best), 1); }
    } else if (dist > 36) { it.mx = tx + sx * .3; it.my = ty + sy * .3; }
    if (dist < 50) it.punch = true;
  } else if (WEAPONS[b.weapon].knuckle) {
    it.mx = tx + sx * .25; it.my = ty + sy * .25; it.punch = dist < 50;
  } else if (WEAPONS[b.weapon].melee) {
    it.mx = tx + sx * .25; it.my = ty + sy * .25; it.fire = dist < WEAPONS[b.weapon].range + 16;
  } else {
    const w = WEAPONS[b.weapon];
    if (dist > w.pref + 50) { it.mx = tx + sx * .4; it.my = ty + sy * .4; }
    else if (dist < w.pref - 70) { it.mx = -tx + sx * .5; it.my = -ty + sy * .5; }
    else { it.mx = sx; it.my = sy; }
    b.burstT -= dt;
    if (b.burstT <= 0) { b.burstOn = !b.burstOn; b.burstT = b.burstOn ? rnd(.5, 1.1) * d.burst : rnd(.5, 1) / d.burst; }
    it.fire = b.burstOn && dist < 650 && Math.abs(da) < .28;
    if (b.mag === 0 && b.reserve > 0) it.reload = true;
    if (b.mag === 0 && b.reserve === 0) it.throw = Math.abs(da) < .5;   // arma vazia: arremessa no alvo
  }
  // Anti-travamento: se tentou andar e não saiu do lugar, contorna lateralmente
  if (b.detourT > 0) { b.detourT -= dt; it.mx = sx; it.my = sy; }
  else if (Math.hypot(it.mx, it.my) > .5 && Math.hypot(b.vx, b.vy) < 35) { b.stuckT += dt; if (b.stuckT > .4) { b.detourT = .8; b.strafe *= -1; b.stuckT = 0; } }
  else b.stuckT = 0;
  return it;
}

/* ------------------------------ ATUALIZAÇÃO --------------------------- */
function updateBullets(dt) {
  btClock += dt;
  for (const b of bullets) {
    const steps = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 10));
    for (let s = 0; s < steps && b.life > 0; s++) {
      b.x += b.vx * dt / steps; b.y += b.vy * dt / steps; b.tr.pts.push({ x: b.x, y: b.y, t: btClock });
      if (b.x < 0 || b.y < 0 || b.x > WW || b.y > WH) { b.life = 0; break; }
      const hc = shotHit(b.x, b.y, b.owner);
      if (hc) {
        if (hc.k === 'glass') glassHit(hc, b.x, b.y);
        b.life = 0; for (let i = 0; i < 4; i++) { const a = Math.atan2(-b.vy, -b.vx) + rnd(-1, 1); sparks.push({ x: b.x, y: b.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, life: .7 }); }
        break;
      }
      for (const f of allF())
        if (!f.dead && !iframes(f) && f !== b.owner && f.team !== b.owner.team && Math.hypot(f.x - b.x, f.y - b.y) < hitR(f) && !(f.cover && f.peekK < .5 && b.vx * f.cover.nx + b.vy * f.cover.ny > 0 && !(f.cover.c && LOWC[f.cover.c.k] && nearC(b.owner, f.cover.c)))) {   // protegido de tiros vindos do outro lado da parede
          damage(f, b.dmg * (b.owner.isPlayer || b.owner.remote ? 1 : DIFFS[cfg.diff].dmg), Math.atan2(b.vy, b.vx), b.owner, 'gun');
          b.life = 0; break;
        }
    }
    b.life -= dt;
  }
  bullets = bullets.filter(b => b.life > 0);
  btrails = btrails.filter(r => btClock - r.pts[r.pts.length - 1].t < BTRAIL_LIFE);   // rastro some quando o último ponto já desapareceu
}

/* ---------------------------- COBERTURA (Q) ---------------------------- */
/* Parede mais próxima (caixotes e bordas). Devolve a normal (aponta para longe da parede) e a folga até ela. */
function nearestWall(f, pad) {
  let best = null, bg = pad;
  const take = (g, nx, ny, c) => { if (g < bg) { bg = g; best = { nx, ny, gap: Math.max(g, 0), c }; } };
  for (const c of crates) {
    const cx = clamp(f.x, c.x, c.x + c.w), cy = clamp(f.y, c.y, c.y + c.h), dx = f.x - cx, dy = f.y - cy, d = Math.hypot(dx, dy);
    if (d > .001) take(d - f.r, Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0, Math.abs(dx) > Math.abs(dy) ? 0 : Math.sign(dy), c);
  }
  const P = (curMap && curMap.pad) || 20; take(f.x - P, 1, 0); take(WW - P - f.x, -1, 0); take(f.y - P, 0, 1); take(WH - P - f.y, 0, -1);
  return best;
}
/* Hitbox: encolhida pela metade enquanto está protegido (em cobertura e sem espiar) */
const hitR = f => f.cover && f.peekK < .5 ? f.r * .5 : f.r;
/* Posição de onde a arma consegue atirar: desliza pela parede até a quina mais próxima da direção da mira */
function coverOrigin(f, w, aim, reach) {
  const tx = -w.ny, ty = w.nx, sg = Math.cos(aim) * tx + Math.sin(aim) * ty >= 0 ? 1 : -1, ca = Math.cos(aim), sa = Math.sin(aim);
  for (let k = 0; k <= reach; k += 6) {
    const ox = f.x + tx * sg * k, oy = f.y + ty * sg * k; let ok = !inCrate(ox, oy);
    for (let q = 8; ok && q <= 56; q += 8) if (inSolid(ox + ca * q, oy + sa * q)) ok = false;   // cover baixo não atrapalha a mira
    if (ok) return { x: tx * sg * k, y: ty * sg * k };
  }
  return null;
}
function updateCover(f, it, dt) {
  f.coverBlock = false;
  if (f.stun > 0 || f.stag > 0 || f.micro > 0 || f.dead) f.cover = null;
  else if (f.remote ? f.coverReq : input.coverReq) { const w = f.cover ? null : nearestWall(f, 12); if (w) { f.x -= w.nx * w.gap; f.y -= w.ny * w.gap; } f.cover = w; }   // gruda na parede
  f.isCovered = !!f.cover;
  if (!f.cover) { f.peekK = approach(f.peekK, 0, dt * 8); f.coverOff = { x: 0, y: 0 }; return; }
  const w = nearestWall(f, 16);
  if (!w || it.mx * w.nx + it.my * w.ny > .6) { f.cover = null; f.isCovered = false; f.coverOff = { x: 0, y: 0 }; return; }   // parede acabou ou se afastou
  f.cover = w;
  const tx = -w.ny, ty = w.nx, m = it.mx * tx + it.my * ty, exposed = f.remote ? f.rin.pk : (input.peek || Object.values(touch.btn).includes('M'));
  it.mx = tx * m * .75 - w.nx * .2; it.my = ty * m * .75 - w.ny * .2;   // só anda ao longo da parede
  f.peekK = approach(f.peekK, exposed ? 1 : 0, dt * 8); f.leanS = Math.cos(it.aim) * tx + Math.sin(it.aim) * ty >= 0 ? 1 : -1;
  const org = coverOrigin(f, w, it.aim, exposed ? 70 : 44);   // tiro cego: só a arma sai pela quina | espiar: sai mais
  f.coverOff = org || { x: 0, y: 0 };
  if (!org) { it.fire = false; it.punch = false; f.coverBlock = true; }
}

function updatePlay(dt) {
  if (!player.dead) {
    // Pegar / largar arma
    player.near = null; let bd = 46;
    for (const pk of pickups) { const q = Math.hypot(pk.x - player.x, pk.y - player.y); if (q < bd) { bd = q; player.near = pk; } }
    if (input.interact && player.near && !(player.stag > 0)) {
      const pk = player.near; unholster(player);   // pegando outra arma, saca a guardada primeiro
      if (player.weapon === pk.key) { player.reserve += pk.mag + pk.reserve; }   // mesma arma: soma munição
      else { dropWeapon(player); giveWeapon(player, pk.key, pk.mag, pk.reserve); }
      pickups.splice(pickups.indexOf(pk), 1);
    }
    { const it = playerIntent(dt); updateCover(player, it, dt); updateFighter(player, dt, it); }
  }
  input.interact = input.throwReq = input.reloadReq = input.coverReq = input.slideReq = input.holsterReq = false;
  for (const b of bots) {
    if (b.dead) continue;   // ninguém renasce: quem cai só volta na próxima rodada
    if (b.remote) { remoteStep(b, dt); continue; }
    updateFighter(b, dt, b.stun > 0 ? {} : b.dummy ? { mx: 0, my: 0, aim: Math.atan2(player.y - b.y, player.x - b.x), fire: false, punch: false, reload: false, throw: false } : botIntent(b, dt));
  }
  updateBullets(dt); updateThrown(dt); updateBlood(dt);
  if (training) {   // solitário: munição infinita
    const pw = player.weapon && WEAPONS[player.weapon]; if (pw && !pw.melee && player.reserve < pw.reserve) player.reserve = pw.reserve;
  }

  if (TUT) pickupTimer = 1e9;
  pickupTimer -= dt;
  if (pickupTimer <= 0) { pickupTimer = LOOTS[cfg.loot].every; if (pickups.length < lootCap(cfg.loot, bots.length + 1)) { const k = WKEYS[Math.random() * WKEYS.length | 0], p = lootSpot(), w = WEAPONS[k]; pickups.push({ x: p.x, y: p.y, key: k, mag: w.mag, reserve: w.reserve, t: 0 }); } }

  shake = Math.max(0, shake - dt * 40); dmgFlash = Math.max(0, dmgFlash - dt);
  for (const t of trail) t.life -= dt * 9; trail = trail.filter(t => t.life > 0);
  for (const r of rings) { r.life -= dt * 6; r.r += dt * 140; } rings = rings.filter(r => r.life > 0);
  for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .9; s.vy *= .9; s.life -= dt * 5; } sparks = sparks.filter(s => s.life > 0);
  for (const c of casings) { c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= .92; c.vy *= .92; c.rot += c.vr * dt; c.vr *= .94; c.life -= dt; } casings = casings.filter(c => c.life > 0);
  if (cmbT > 0) { cmbT -= dt; if (cmbT <= 0) cmbN = 0; } cmbPop = Math.max(0, cmbPop - dt * 2.6); cmbAge += dt;
  if (killT >= 0) { killT += dt; if (killT > KILL_DUR) killT = -1; }
  if (TUT) tutUpdate(dt);
}

