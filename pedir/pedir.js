/* ÓRALE PADRE · pedir para recoger (cliente) */
(function () {
  'use strict';
  const { api, DEMO, franjas, hhmm, partesMadrid, indexar, precioLinea, mensajeError, euros } = window.OP;
  let LOCAL = new URLSearchParams(location.search).get('local') || (() => { try { return localStorage.getItem('op-pedir-local'); } catch (e) { return null; } })() || 'tomares';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CLAVE_CARRITO = 'op-carrito-' + LOCAL;
  const CLAVE_CLIENTE = 'op-cliente';

  let carta, idx, local, agotados = new Set(), carrito = [];
  try { carrito = JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || []; } catch (e) { carrito = []; }
  const guardaCarrito = () => { try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)); } catch (e) {} };

  if (DEMO) $('#aviso-demo').hidden = false;

  /* ── Arranque ── */
  const token = new URLSearchParams(location.search).get('pedido');
  if (token) { verPedido(token); } else { cargar(); }

  async function cargar() {
    // Locales que aceptan pedidos ahora mismo: si hay varios, el cliente elige.
    try {
      const ls = (await api.localesConPedidos()).filter(l => l.acepta_pedidos);
      if (ls.length && !ls.some(l => l.id === LOCAL)) LOCAL = ls[0].id;
      if (ls.length > 1) {
        const sel = $('#sel-local'); sel.hidden = false; $('#nombre-local').hidden = true;
        sel.innerHTML = ls.map(l => `<option value="${l.id}">${esc(l.nombre.replace(/^Órale Padre\s*/, ''))}</option>`).join('');
        sel.value = LOCAL;
        sel.onchange = () => { try { localStorage.setItem('op-pedir-local', sel.value); } catch (e) {} location.search = '?local=' + sel.value + (DEMO && location.search.includes('demo') ? '&demo' : ''); };
      }
    } catch (e) { /* sin lista: seguimos con el local por defecto */ }
    try {
      [carta, local, agotados] = await Promise.all([api.carta(LOCAL), api.local(LOCAL), api.agotados(LOCAL)]);
    } catch (e) {
      $('#carta').innerHTML = '<p class="error">No hemos podido cargar la carta. Recarga la página o llámanos.</p>';
      return;
    }
    idx = indexar(carta);
    $('#nombre-local').textContent = local.nombre.replace(/^Órale Padre\s*/, '') || local.nombre;
    // Fuera del carrito lo que ya no existe en la carta.
    carrito = carrito.filter(l => idx.prod.has(l.producto));
    pintaEstado(); pintaCarta(); pintaBarra(); pintaPagos();
  }
  function pintaPagos() {
    const online = !!local.pago_online, enLocal = local.pago_local !== false;
    $('#op-stripe').hidden = !online; $('#op-local').hidden = !enLocal;
    const marcado = online && !enLocal ? 'stripe' : 'local';
    const r = document.querySelector(`[name=pago][value=${marcado}]`); if (r) r.checked = true;
    actualizaEmail();
  }
  function actualizaEmail() { $('#hc-email-l').hidden = (document.querySelector('[name=pago]:checked') || {}).value !== 'stripe'; }
  document.addEventListener('change', e => { if (e.target.name === 'pago') { actualizaEmail(); $('#hc-enviar').textContent = e.target.value === 'stripe' ? 'Pagar y hacer pedido' : 'Hacer pedido'; } });

  function abierto() { return local.acepta_pedidos && franjas(local).length > 0; }

  function pintaEstado() {
    const el = $('#estado-local'); el.hidden = false;
    if (!local.acepta_pedidos) { el.textContent = 'Pausado'; el.className = 'estado-local cerrado'; }
    else if (!franjas(local).length) { el.textContent = 'Cerrado hoy'; el.className = 'estado-local cerrado'; }
    else { el.textContent = 'Abierto'; el.className = 'estado-local'; }
  }

  /* ── Carta ── */
  function pintaCarta() {
    const hoy = partesMadrid(new Date()).dow;
    const cats = carta.categorias.filter(c => !c.oculta && c.productos.some(id => idx.prod.get(id) && !idx.prod.get(id).oculto) && (!c.dias || c.dias.includes(hoy)));
    $('#cats').innerHTML = cats.map(c => `<a href="#c-${c.clave}">${esc(c.nombre)}</a>`).join('');
    $('#carta').innerHTML = cats.map(c => `
      <section class="cat" id="c-${c.clave}">
        <h2>${esc(c.nombre)}</h2>
        ${c.dias ? `<p class="cat-nota">Solo hoy y los ${diasTxt(c.dias)}.</p>` : ''}
        ${c.productos.map(id => idx.prod.get(id)).filter(p => p && !p.oculto).map(tarjeta).join('')}
      </section>`).join('');
    $('#carta').addEventListener('click', e => {
      const b = e.target.closest('[data-prod]'); if (b && !b.disabled) abreProducto(b.dataset.prod);
    });
    vigilaCategorias();
  }
  function diasTxt(d) {
    const n = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];
    const l = d.map(x => n[x]); return l.length > 1 ? l.slice(0, -1).join(', ') + ' y ' + l.at(-1) : l[0];
  }
  function tarjeta(p) {
    const ag = p.agotado || agotados.has(p.id);
    return `<button class="prod" type="button" data-prod="${p.id}" ${ag ? 'disabled' : ''}>
      <div>
        <h3>${esc(p.nombre)}</h3>
        ${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
        <div class="precio">${euros(p.precio)}${ag ? '<span class="etq">Agotado</span>' : ''}</div>
      </div>
      <div class="prod-foto ${p.foto ? '' : 'vacia'}">
        ${p.foto ? `<img src="${esc(p.foto)}" alt="" loading="lazy" width="104" height="104">` : ''}
        ${ag ? '' : '<span class="prod-mas" aria-hidden="true">+</span>'}
      </div>
    </button>`;
  }
  function vigilaCategorias() {
    const links = [...document.querySelectorAll('#cats a')];
    const io = new IntersectionObserver(ents => {
      ents.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => {
          const on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('activa', on);
          if (on) a.scrollIntoView({ block: 'nearest', inline: 'center' });
        });
      });
    }, { rootMargin: '-130px 0px -65% 0px' });
    document.querySelectorAll('.cat').forEach(s => io.observe(s));
  }

  /* ── Ficha de producto ── */
  const hoja = $('#hoja-producto');
  let actual = null;
  function abreProducto(id, editar = null) {
    if (!abierto()) { alert('Ahora mismo no aceptamos pedidos online. Vuelve en nuestro horario.'); return; }
    const p = idx.prod.get(id);
    const base = editar != null ? carrito[editar] : { producto: id, cantidad: 1, opciones: [], nota: '' };
    actual = { ...base, opciones: [...base.opciones], editar };
    $('#hp-nombre').textContent = p.nombre;
    $('#hp-desc').textContent = p.desc || '';
    $('#hp-alerg').textContent = p.alergenos.length ? 'Alérgenos: ' + p.alergenos.join(', ') + '.' : '';
    const f = $('#hp-foto'); f.hidden = !p.foto; if (p.foto) f.src = p.foto;
    $('#hp-nota').value = actual.nota || '';
    $('#hp-grupos').innerHTML = p.grupos.map(gid => {
      const g = idx.grupos.get(gid); const uno = g.max === 1;
      const regla = g.min >= 1 ? (uno ? 'Obligatorio' : `Elige ${g.min}${g.max > g.min ? ' a ' + g.max : ''}`) : (uno ? 'Opcional' : `Hasta ${g.max}`);
      return `<div class="grupo" data-grupo="${gid}">
        <div class="grupo-cab"><h3>${esc(g.nombre)}</h3><span class="${g.min ? 'oblig' : ''}">${regla}</span></div>
        ${g.opciones.map(o => `<label class="opcion">
          <input type="${uno ? 'radio' : 'checkbox'}" name="g-${gid}" value="${o.id}" ${actual.opciones.includes(o.id) ? 'checked' : ''}>
          <span>${esc(o.nombre)}</span>${o.precio ? `<b>+${euros(o.precio)}</b>` : ''}</label>`).join('')}
      </div>`;
    }).join('');
    hoja.querySelector('.hoja-cuerpo').scrollTop = 0;
    $('#hp-anadir').firstChild.textContent = editar != null ? 'Guardar · ' : 'Añadir · ';
    refrescaFicha();
    hoja.showModal();
  }
  function leeOpciones() {
    return [...hoja.querySelectorAll('#hp-grupos input:checked')].map(i => i.value);
  }
  function refrescaFicha() {
    actual.opciones = leeOpciones();
    // Respeta el máximo de cada grupo de casillas.
    hoja.querySelectorAll('.grupo').forEach(gEl => {
      const g = idx.grupos.get(gEl.dataset.grupo); if (g.max === 1) return;
      const n = gEl.querySelectorAll('input:checked').length;
      gEl.querySelectorAll('input:not(:checked)').forEach(i => { i.disabled = n >= g.max; });
    });
    $('#hp-cant').textContent = actual.cantidad;
    $('#hp-precio').textContent = euros(precioLinea(idx, actual) * actual.cantidad);
  }
  hoja.addEventListener('change', e => { if (e.target.matches('#hp-grupos input')) { e.target.closest('.grupo').classList.remove('falta'); refrescaFicha(); } });
  $('#hp-menos').onclick = () => { actual.cantidad = Math.max(1, actual.cantidad - 1); refrescaFicha(); };
  $('#hp-mas').onclick = () => { actual.cantidad = Math.min(20, actual.cantidad + 1); refrescaFicha(); };
  $('#hp-anadir').onclick = () => {
    actual.opciones = leeOpciones();
    actual.nota = $('#hp-nota').value.trim();
    const p = idx.prod.get(actual.producto);
    const falta = p.grupos.map(gid => idx.grupos.get(gid))
      .find(g => actual.opciones.filter(o => g.opciones.some(x => x.id === o)).length < g.min);
    if (falta) {
      const el = hoja.querySelector(`[data-grupo="${falta.id}"]`); el.classList.add('falta');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
    }
    const linea = { producto: actual.producto, cantidad: actual.cantidad, opciones: actual.opciones, nota: actual.nota };
    if (actual.editar != null) carrito[actual.editar] = linea;
    else {
      // Si es idéntico a algo ya en el carrito, suma cantidad.
      const igual = carrito.find(l => l.producto === linea.producto && l.nota === linea.nota &&
        l.opciones.slice().sort().join() === linea.opciones.slice().sort().join());
      if (igual) igual.cantidad = Math.min(20, igual.cantidad + linea.cantidad); else carrito.push(linea);
    }
    guardaCarrito(); pintaBarra(); hoja.close();
    if (actual.editar != null) pintaCarrito();
  };

  /* ── Carrito ── */
  const total = () => carrito.reduce((s, l) => s + precioLinea(idx, l) * l.cantidad, 0);
  function pintaBarra() {
    const n = carrito.reduce((s, l) => s + l.cantidad, 0);
    $('#barra-carrito').hidden = n === 0;
    $('#bc-n').textContent = n; $('#bc-total').textContent = euros(total());
  }
  const hc = $('#hoja-carrito');
  $('#barra-carrito').onclick = () => { pintaCarrito(); rellenaHoras(); rellenaCliente(); $('#hc-error').hidden = true; hc.showModal(); };
  $('#hc-cerrar').onclick = () => hc.close();
  function nombreOpciones(l) {
    return l.opciones.map(oid => { for (const g of idx.grupos.values()) { const o = g.opciones.find(x => x.id === oid); if (o) return o.nombre; } return ''; }).filter(Boolean);
  }
  function pintaCarrito() {
    if (!carrito.length) { hc.close(); return; }
    $('#hc-lineas').innerHTML = carrito.map((l, i) => {
      const p = idx.prod.get(l.producto); const extra = nombreOpciones(l);
      return `<li class="linea">
        <div class="linea-cant"><button type="button" data-mas="${i}" aria-label="Uno más">+</button><output>${l.cantidad}</output><button type="button" data-menos="${i}" aria-label="Uno menos">−</button></div>
        <div><strong>${esc(p.nombre)}</strong>
          ${extra.length ? `<small>${esc(extra.join(' · '))}</small>` : ''}
          ${l.nota ? `<small>“${esc(l.nota)}”</small>` : ''}
          <small><a href="#" data-editar="${i}">Cambiar</a></small></div>
        <span class="imp">${euros(precioLinea(idx, l) * l.cantidad)}</span></li>`;
    }).join('');
    $('#hc-total').textContent = euros(total());
  }
  $('#hc-lineas').addEventListener('click', e => {
    const t = e.target;
    if (t.dataset.mas) { carrito[t.dataset.mas].cantidad = Math.min(20, carrito[t.dataset.mas].cantidad + 1); }
    else if (t.dataset.menos) { const l = carrito[t.dataset.menos]; l.cantidad--; if (l.cantidad < 1) carrito.splice(t.dataset.menos, 1); }
    else if (t.dataset.editar) { e.preventDefault(); abreProducto(carrito[t.dataset.editar].producto, +t.dataset.editar); return; }
    else return;
    guardaCarrito(); pintaBarra(); pintaCarrito();
  });

  function rellenaHoras() {
    const sel = $('#hc-hora'); const prev = sel.value; const fs = franjas(local);
    sel.innerHTML = fs.map((d, i) => `<option value="${d.toISOString()}">${i === 0 ? 'Lo antes posible · ' : ''}${hhmm(d)}</option>`).join('');
    if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
    $('#hc-hora-ayuda').textContent = fs.length ? `Tardamos unos ${local.minutos_prep} minutos en prepararlo.` : 'Hoy ya no quedan horas de recogida.';
    $('#hc-enviar').disabled = !fs.length;
  }
  function rellenaCliente() {
    try { const c = JSON.parse(localStorage.getItem(CLAVE_CLIENTE)) || {};
      if (!$('#hc-nombre').value) $('#hc-nombre').value = c.nombre || '';
      if (!$('#hc-tel').value) $('#hc-tel').value = c.tel || '';
      if (!$('#hc-email').value) $('#hc-email').value = c.email || ''; } catch (e) {}
  }

  $('#form-pedido').addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#hc-error'); err.hidden = true;
    const nombre = $('#hc-nombre').value.trim(); const tel = $('#hc-tel').value.trim();
    if (nombre.length < 2) return muestra('Dinos tu nombre para cantarlo en barra.', '#hc-nombre');
    if (tel.replace(/[^0-9]/g, '').length < 9) return muestra('Revisa el teléfono.', '#hc-tel');
    if (!$('#hc-hora').value) return muestra('Elige una hora de recogida.', '#hc-hora');
    const btn = $('#hc-enviar'); btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      const pago = document.querySelector('[name=pago]:checked').value; const email = $('#hc-email').value.trim();
      const r = await api.crearPedido({ local: LOCAL, nombre, tel, recogida: $('#hc-hora').value,
        pago, email, notas: $('#hc-notas').value.trim(), lineas: carrito });
      try { localStorage.setItem(CLAVE_CLIENTE, JSON.stringify({ nombre, tel, email })); } catch (e) {}
      carrito = []; guardaCarrito();
      if (pago === 'stripe') { btn.textContent = 'Abriendo el pago…'; location.href = await api.iniciarPago(r.token, location.origin + location.pathname); return; }
      location.href = location.pathname + '?pedido=' + encodeURIComponent(r.token) + (DEMO && location.search.includes('demo') ? '&demo' : '');
    } catch (ex) {
      muestra(mensajeError(ex)); btn.disabled = false; btn.textContent = 'Hacer pedido';
      // La carta pudo cambiar (agotado, hora…): refrescamos lo necesario.
      try { agotados = await api.agotados(LOCAL); local = await api.local(LOCAL); rellenaHoras(); } catch (e2) {}
    }
    function muestra(t, foco) { err.textContent = t; err.hidden = false; if (foco) $(foco).focus(); else err.scrollIntoView({ block: 'center' }); }
  });

  /* ── Seguimiento ── */
  const ESTADOS = {
    pendiente_pago: ['Falta el pago', 'Tu pedido está guardado, pero no llega a cocina hasta que se complete el pago.'],
    nuevo: ['Pedido recibido', 'Lo hemos recibido. En cuanto la cocina lo vea, empieza a prepararlo.'],
    preparando: ['En la plancha', 'Estamos preparando tu pedido.'],
    listo: ['¡Listo para recoger!', 'Pasa por el local y di tu número en barra.'],
    entregado: ['Entregado', '¡Que aproveche, padre!'],
    cancelado: ['Pedido cancelado', 'Llámanos si tienes cualquier duda.'],
  };
  const PASOS = ['nuevo', 'preparando', 'listo', 'entregado'];
  async function verPedido(tk) {
    $('#vista-carta').hidden = true; $('#vista-pedido').hidden = false;
    const pinta = p => {
      if (!p) { $('#seguimiento').innerHTML = '<p class="error">No encontramos ese pedido.</p><p><a href="./">Volver a la carta</a></p>'; return; }
      const [tit, txt] = ESTADOS[p.estado] || ESTADOS.nuevo; const i = PASOS.indexOf(p.estado);
      const volvioSinPagar = new URLSearchParams(location.search).get('pago') === 'cancelado' && p.estado === 'pendiente_pago';
      const pagoTxt = p.pagado ? (p.pago_metodo === 'stripe' ? 'Pagado online' : 'Pagado') : 'Pago en el local';
      document.title = `Pedido ${p.numero} · ${tit} · Órale Padre`;
      $('#seguimiento').innerHTML = `
        <p class="seg-k">Tu número</p>
        <div class="seg-num">${p.numero}</div>
        <h1 class="seg-estado">${esc(tit)}</h1>
        <p>${esc(txt)}${p.estado === 'cancelado' && p.motivo_cancel ? ' Motivo: ' + esc(p.motivo_cancel) : ''}</p>
        ${volvioSinPagar ? '<p class="error">No se ha completado el pago. Puedes intentarlo otra vez.</p>' : ''}
        ${p.estado === 'pendiente_pago' ? '<p><button class="btn" type="button" id="seg-pagar">Pagar ahora</button></p>' : ''}
        ${p.estado !== 'cancelado' && p.estado !== 'pendiente_pago' ? `<ol class="pasos">${PASOS.map((s, j) => `<li class="${j <= i ? 'hecho' : ''}">${['Recibido', 'Preparando', 'Listo', 'Recogido'][j]}</li>`).join('')}</ol>` : ''}
        <div class="seg-caja">
          <p class="seg-k">Recogida</p>
          <p style="margin:2px 0 12px"><strong>${hhmm(new Date(p.recogida))}</strong> en ${esc(p.local)}${p.direccion ? ' · ' + esc(p.direccion) : ''}</p>
          <ul>${p.lineas.map(l => `<li><span>${l.cantidad}× ${esc(l.nombre)}
            ${l.opciones.length ? `<small>${esc(l.opciones.map(o => o.nombre).join(' · '))}</small>` : ''}
            ${l.nota ? `<small>“${esc(l.nota)}”</small>` : ''}</span><span>${euros(l.unitario * l.cantidad)}</span></li>`).join('')}
            <li class="seg-total"><span>Total · ${pagoTxt}</span><span>${euros(p.total)}</span></li></ul>
        </div>
        <div class="seg-acciones">
          ${p.telefono ? `<a class="btn btn-sec" href="tel:${esc(p.telefono.replace(/\s/g, ''))}">Llamar al local</a>` : ''}
          <a class="btn btn-sec" href="./${DEMO && location.search.includes('demo') ? '?demo' : ''}">Hacer otro pedido</a>
        </div>`;
    };
    $('#seguimiento').addEventListener('click', async e => {
      if (e.target.id !== 'seg-pagar') return; e.target.disabled = true; e.target.textContent = 'Abriendo el pago…';
      try { location.href = await api.iniciarPago(tk, location.origin + location.pathname); }
      catch (ex) { e.target.disabled = false; e.target.textContent = 'Pagar ahora'; alert(mensajeError(ex)); }
    });
    try { pinta(await api.estadoPedido(tk)); } catch (e) { pinta(null); }
    api.seguirPedido(tk, pinta);
  }
})();
