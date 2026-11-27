/* ÓRALE PADRE · carta digital (la del QR de mesa)
   www.oralepadre.com/carta/?local=tomares — sólo para ver: lee la carta
   en directo (lo que se cambia en el admin sale aquí al momento). Enseña
   lo que se vende en el local (no lo que es "sólo para recoger"). */
(function () {
  'use strict';
  const { api, euros, partesMadrid, indexar } = window.OP;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const q = new URLSearchParams(location.search);
  const LOCAL = q.get('local');
  const demo = location.search.includes('demo') ? '&demo' : '';

  arrancar();
  async function arrancar() {
    let propios = [];
    try { propios = await api.localesConPedidos(); } catch (e) {}
    if (!LOCAL || !propios.some(l => l.id === LOCAL)) {
      $('#vista-carta').hidden = true; $('#vista-elegir').hidden = false;
      $('#elegir').innerHTML = propios.length ? propios.map(l => `<p><a class="btn" style="display:block;text-decoration:none;text-align:center" href="?local=${esc(l.id)}${demo}">${esc(l.nombre.replace(/^Órale Padre\s*/, ''))}</a></p>`).join('')
        : '<p>Ahora mismo no podemos cargar la carta. <a href="/">Ver la web</a></p>';
      return;
    }
    try {
      const [local, carta, agotados] = await Promise.all([api.local(LOCAL), api.carta(LOCAL), api.agotados(LOCAL).catch(() => new Set())]);
      pinta(local, carta, agotados);
    } catch (e) { $('#carta').innerHTML = '<p class="error">No hemos podido cargar la carta. Prueba otra vez en un momento.</p>'; }
  }

  function pinta(local, carta, agotados) {
    const nombre = local.nombre.replace(/^Órale Padre\s*/, '');
    $('#nombre-local').textContent = nombre; document.title = `Carta · Órale Padre ${nombre}`;
    const idx = indexar(carta); const hoy = partesMadrid(new Date()).dow;
    const vale = p => p && !p.oculto && p.solo !== 'recoger';
    // Las categorías "destacadas" (admin → Carta → ★ Destacada) van primero, en grande y con fotos.
    const cats = carta.categorias.filter(c => !c.oculta && c.solo !== 'recoger' && c.productos.some(id => vale(idx.prod.get(id))))
      .map((c, i) => ({ c, i })).sort((a, b) => (b.c.destacada ? 1 : 0) - (a.c.destacada ? 1 : 0) || a.i - b.i).map(x => x.c);
    $('#cats').innerHTML = cats.map(c => `<a href="#c-${esc(c.clave)}" class="${c.destacada ? 'dest' : ''}">${c.destacada ? '★ ' : ''}${esc(c.nombre)}</a>`).join('');
    $('#carta').innerHTML = cats.map(c => {
      const noHoy = c.dias && !c.dias.includes(hoy);
      if (c.destacada) return `<section class="cat destacada" id="c-${esc(c.clave)}"><p class="dest-etq">★ La especialidad de ${esc(nombre)}</p><h2>${esc(c.nombre)}</h2>
        ${c.dias ? `<p class="cat-nota">${noHoy ? 'Sólo' : 'Hoy sí: sólo'} los ${c.dias.map(d => DIAS[d - 1]).join(', ').replace(/, ([^,]*)$/, ' y $1')}.</p>` : ''}
        <div class="dest-grid">${c.productos.map(id => idx.prod.get(id)).filter(vale).map(p => grande(p, agotados.has(p.id) || p.agotado)).join('')}</div></section>`;
      return `<section class="cat" id="c-${esc(c.clave)}"><h2>${esc(c.nombre)}</h2>
        ${c.dias ? `<p class="cat-nota">${noHoy ? 'Sólo' : 'Hoy sí: sólo'} los ${c.dias.map(d => DIAS[d - 1]).join(', ').replace(/, ([^,]*)$/, ' y $1')}.</p>` : ''}
        ${c.productos.map(id => idx.prod.get(id)).filter(vale).map(p => tarjeta(p, idx, agotados.has(p.id) || p.agotado)).join('')}</section>`;
    }).join('') || '<p>La carta está vacía ahora mismo.</p>';
    const pedir = local.acepta_pedidos ? `<a class="btn" href="/pedir/?local=${esc(LOCAL)}${demo}">Pedir para recoger</a>` : '';
    $('#pie').innerHTML = `<p>Precios con IVA incluido. Pregunta al equipo por los alérgenos si tienes cualquier duda.</p>
      ${pedir}<a class="btn" style="background:var(--tinta)" href="/opinion/?local=${esc(LOCAL)}&o=qr${demo}">¿Qué tal? Valóranos</a>`;
    vigila();
  }

  // Tarjeta grande (categoría destacada): foto arriba, nombre y precio bien visibles.
  function grande(p, ag) {
    return `<div class="dest-prod" ${ag ? 'style="opacity:.55"' : ''}>
      ${p.foto ? `<img src="${esc(p.foto)}" alt="${esc(p.nombre)}" loading="lazy" data-zoom>` : '<div class="dest-sin"></div>'}
      <div class="dest-txt"><h3>${esc(p.nombre)}</h3>${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
        <div class="precio">${euros(Number.isInteger(p.precio_local) ? p.precio_local : p.precio)}${ag ? '<span class="etq">Agotado</span>' : ''}</div></div>
    </div>`;
  }
  function tarjeta(p, idx, ag) {
    const extras = p.grupos.map(g => idx.grupos.get(g)).filter(Boolean).filter(g => g.opciones && g.opciones.length)
      .map(g => `${esc(g.nombre)}: ${g.opciones.slice(0, 6).map(o => esc(o.nombre) + (o.precio ? ' (+' + euros(o.precio) + ')' : '')).join(', ')}${g.opciones.length > 6 ? '…' : ''}`);
    return `<div class="prod" ${ag ? 'style="opacity:.55"' : ''}>
      <div>
        <h3>${esc(p.nombre)}</h3>
        ${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
        ${extras.length ? `<p class="extras">${extras.join('<br>')}</p>` : ''}
        <div class="precio">${euros(Number.isInteger(p.precio_local) ? p.precio_local : p.precio)}${ag ? '<span class="etq">Agotado</span>' : ''}</div>
        ${p.alergenos && p.alergenos.length ? `<small class="alerg">Alérgenos: ${esc(p.alergenos.join(', '))}</small>` : ''}
      </div>
      <div class="prod-foto ${p.foto ? '' : 'vacia'}">${p.foto ? `<img src="${esc(p.foto)}" alt="${esc(p.nombre)}" loading="lazy" width="104" height="104" data-zoom>` : ''}</div>
    </div>`;
  }

  $('#carta').addEventListener('click', e => { const i = e.target.closest('[data-zoom]'); if (!i) return; $('#foto-img').src = i.src; $('#foto-img').alt = i.alt; $('#foto-grande').showModal(); });
  $('#foto-grande').addEventListener('click', () => $('#foto-grande').close());

  function vigila() {
    const links = [...document.querySelectorAll('#cats a')];
    const io = new IntersectionObserver(ents => ents.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle('activa', a.getAttribute('href') === '#' + en.target.id));
      const a = links.find(x => x.classList.contains('activa')); if (a) a.scrollIntoView({ block: 'nearest', inline: 'center' });
    }), { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.cat').forEach(s => io.observe(s));
  }
})();
