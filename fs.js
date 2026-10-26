/* ---- Tela cheia + horizontal travada (celular) ---- */
(function () {
  const gate = document.getElementById('fsGate'), btn = document.getElementById('fsBtn'), skip = document.getElementById('fsSkip'), ios = document.getElementById('fsIos');
  const touchDev = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!touchDev) return;
  const de = document.documentElement;
  const reqFs = de.requestFullscreen || de.webkitRequestFullscreen || de.msRequestFullscreen;
  const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const standalone = () => matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let skipped = false;
  const lock = () => { try { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
  const update = () => {
    const ok = isFs() || standalone() || skipped;
    gate.classList.toggle('show', !ok);
    if (!reqFs) { btn.style.display = 'none'; ios.style.display = 'block'; skip.style.display = 'inline-block'; }
    if (isFs() || standalone()) lock();
    window.dispatchEvent(new Event('resize'));
  };
  btn.addEventListener('click', () => {
    try { const p = reqFs.call(de, { navigationUI: 'hide' }); if (p && p.then) p.then(lock).catch(() => {}); else lock(); } catch (e) {}
    setTimeout(lock, 300); setTimeout(update, 400);
  });
  skip.addEventListener('click', () => { skipped = true; update(); });
  document.addEventListener('fullscreenchange', update);
  document.addEventListener('webkitfullscreenchange', update);
  addEventListener('orientationchange', () => setTimeout(update, 200));
  update();
  try {
    const m = { name: 'OUTCOME', short_name: 'OUTCOME', start_url: location.href.split('#')[0], scope: location.href.replace(/[^\/]*$/, ''), display: 'fullscreen', orientation: 'landscape', background_color: '#0d0a14', theme_color: '#0d0a14' };
    const l = document.createElement('link'); l.rel = 'manifest';
    l.href = URL.createObjectURL(new Blob([JSON.stringify(m)], { type: 'application/manifest+json' }));
    document.head.appendChild(l);
  } catch (e) {}
})();
