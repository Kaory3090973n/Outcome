/* Ícone do site: o mesmo chapéu de feltro que fica em cima do O do título (logoHat), desenhado numa tela escondida. */
(function () {
  function hatIcon(N) {
    const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
    const s = N * .94 / 110; g.save(); g.translate(N / 2, N / 2 + 11.5 * s); g.scale(s, s);   // fundo transparente: só o chapéu, reto
    logoHat(g, '#0d0d11', '#e7e4d3', true); g.restore(); return c.toDataURL('image/png');
  }
  try {
    const i32 = hatIcon(64), i180 = hatIcon(180), i192 = hatIcon(192), i512 = hatIcon(512);
    const add = (rel, href, sizes) => { const l = document.createElement('link'); l.rel = rel; l.href = href; if (sizes) l.sizes = sizes; document.head.appendChild(l); };
    document.querySelectorAll('link[rel~="icon"]').forEach(l => l.remove());
    add('icon', i32, '64x64'); add('apple-touch-icon', i180, '180x180');
    const old = document.querySelector('link[rel="manifest"]');
    if (old) {   // refaz o manifesto já com o ícone do chapéu
      const m = { name: 'OUTCOME', short_name: 'OUTCOME', start_url: location.href.split('#')[0], scope: location.href.replace(/[^\/]*$/, ''), display: 'fullscreen', orientation: 'landscape', background_color: '#0d0a14', theme_color: '#0d0a14',
        icons: [{ src: i192, sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: i512, sizes: '512x512', type: 'image/png', purpose: 'any' }] };
      old.href = URL.createObjectURL(new Blob([JSON.stringify(m)], { type: 'application/manifest+json' }));
    }
  } catch (e) {}
})();
