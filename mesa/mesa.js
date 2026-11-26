/* ÓRALE PADRE · QR de mesa (cliente): carta, pedir a cocina, ver la cuenta,
   llamar al camarero, pedir la cuenta y pagar con el móvil.
   URL del QR: /mesa/?l=<local>&m=<mesa>&k=<código de la mesa>. El servidor
   comprueba el código en cada llamada (mesa_qr, pedir_en_mesa, avisar_mesa…). */
(function () {
  'use strict';
  const { api, DEMO, partesMadrid, indexar, precioLinea, mensajeError, euros } = window.OP;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ss = (k, v) => { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k)); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } };

  const q = new URLSearchParams(location.search);
  // Vuelta de Stripe: la URL sólo trae ?pedido=<token>&pago=ok|cancelado; la mesa se guardó antes de salir.
  const vuelta = q.get('pago') && q.get('pedido') ? ss('op-mesa-pago') : null;
  const M = vuelta ? vuelta.mesa : { l: q.get('l'), m: q.get('m'), k: q.get('k') };
  if (DEMO) $('#aviso-demo').hidden = false;

  let info = null, carta, idx, agotados = new Set(), carrito = [];
  const CLAVE = 'op-mesa-carrito-' + (M && M.l) + '-' + (M && M.m);
  try { carrito = JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { carrito = []; }
  const guardaCarrito = () => { try { localStorage.setItem(CLAVE, JSON.stringify(carrito)); } catch (e) {} };

  function error(t) { $('#m-app').hidden = true; $('#m-error').hidden = false; $('#m-error-txt').textContent = t; $('#barra-carrito').hidden = true; }
  let tOk = null;
  function ok(t) { const e = $('#m-ok'); e.textContent = t; e.hidden = false; clearTimeout(tOk); tOk = setTimeout(() => { e.hidden = true; }, 7000); }

  if (!M || !M.l || !M.m || !M.k) { error('Este enlace no es de ninguna mesa. Escanea el QR que hay en tu mesa o pregunta al camarero.'); return; }
  arrancar();

  async function arrancar() {
    try {
      [info, carta, agotados] = await Promise.all([api.mesaQR(M.l, M.m, M.k), api.carta(M.l), api.agotados(M.l)]);
    } catch (ex) { error(mensajeError(ex)); return; }
    idx = indexar(carta);
    carrito = carrito.filter(l => idx.prod.has(l.producto));
    $('#m-mesa').textContent = info.mesa; $('#m-local').textContent = info.local_nombre;
    document.title = `${info.mesa} · ${info.local_nombre}`;
    $('#m-app').hidden = false;
    pintaCarta(); pintaCuenta(); pintaBarra();
    if (!info.pedidos) { $('#m-nota').hidden = false; $('#m-nota').textContent = 'Mira la carta y, cuando quieras pedir, llama al camarero con el botón de arriba.'; }
    if (vuelta) volverDePago();
    setInterval(refresca, 20000);
  }
  async function refresca() { try { info = await api.mesaQR(M.l, M.m, M.k); pintaCuenta(); } catch (e) { /* sin red: se reintenta */ } }

  /* ── Pestañas ── */
  function tab(t) {
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('activa', b.dataset.tab === t));
    $('#v-carta').hidden = t !== 'carta'; $('#v-cuenta').hidden = t !== 'cuenta';
    window.scrollTo(0, 0);
  }
  document.querySelector('.pestanas').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { tab(b.dataset.tab); if (b.dataset.tab === 'cuenta') refresca(); } });

  /* ── Carta (precios de sala) ── */
  const vale = p => p && !p.oculto && p.solo !== 'recoger';
  const precio = p => Number.isInteger(p.precio_local) ? p.precio_local : p.precio;
  function pintaCarta() {
    const hoy = partesMadrid(new Date()).dow;
    const cats = carta.categorias.filter(c => !c.oculta && c.solo !== 'recoger' && c.productos.some(id => vale(idx.prod.get(id))) && (!c.dias || c.dias.includes(hoy)));
    $('#cats').innerHTML = cats.map(c => `<a href="#c-${c.clave}">${esc(c.nombre)}</a>`).join('');
    $('#carta').innerHTML = cats.map(c => `<section class="cat" id="c-${c.clave}"><h2>${esc(c.nombre)}</h2>
      ${c.productos.map(id => idx.prod.get(id)).filter(vale).map(tarjeta).join('')}</section>`).join('');
  }
  function tarjeta(p) {
    const ag = p.agotado || agotados.has(p.id);
    return `<button class="prod" type="button" data-prod="${p.id}" ${ag ? 'disabled' : ''} ${info.pedidos ? '' : 'aria-disabled="true"'}>
      <div><h3>${esc(p.nombre)}</h3>${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
        <div class="precio">${euros(precio(p))}${ag ? '<span class="etq">Agotado</span>' : ''}</div></div>
      <div class="prod-foto ${p.foto ? '' : 'vacia'}">${p.foto ? `<img src="${esc(p.foto)}" alt="" loading="lazy" width="104" height="104">` : ''}
        ${ag || !info.pedidos ? '' : '<span class="prod-mas" aria-hidden="true">+</span>'}</div></button>`;
  }
  $('#carta').addEventListener('click', e => {
    const b = e.target.closest('[data-prod]'); if (!b || b.disabled) return;
    if (!info.pedidos) { ok('Para pedir, llama al camarero con el botón de arriba.'); return; }
    abreProducto(b.dataset.prod);
  });

  /* ── Ficha de producto ── */
  const hoja = $('#hoja-producto'); let actual = null;
  function abreProducto(id, editar = null) {
    const p = idx.prod.get(id);
    const base = editar != null ? carrito[editar] : { producto: id, cantidad: 1, opciones: [], nota: '' };
    actual = { ...base, opciones: [...base.opciones], editar };
    $('#hp-nombre').textContent = p.nombre; $('#hp-desc').textContent = p.desc || '';
    $('#hp-alerg').textContent = (p.alergenos || []).length ? 'Alérgenos: ' + p.alergenos.join(', ') + '.' : '';
    const f = $('#hp-foto'); f.hidden = !p.foto; if (p.foto) f.src = p.foto;
    $('#hp-nota').value = actual.nota || '';
    $('#hp-grupos').innerHTML = p.grupos.map(gid => {
      const g = idx.grupos.get(gid); const uno = g.max === 1;
      const regla = g.min >= 1 ? (uno ? 'Obligatorio' : `Elige ${g.min}${g.max > g.min ? ' a ' + g.max : ''}`) : (uno ? 'Opcional' : `Hasta ${g.max}`);
      return `<div class="grupo" data-grupo="${gid}"><div class="grupo-cab"><h3>${esc(g.nombre)}</h3><span class="${g.min ? 'oblig' : ''}">${regla}</span></div>
        ${g.opciones.map(o => `<label class="opcion"><input type="${uno ? 'radio' : 'checkbox'}" name="g-${gid}" value="${o.id}" ${actual.opciones.includes(o.id) ? 'checked' : ''}>
          <span>${esc(o.nombre)}</span>${o.precio ? `<b>+${euros(o.precio)}</b>` : ''}</label>`).join('')}</div>`;
    }).join('');
    hoja.querySelector('.hoja-cuerpo').scrollTop = 0;
    $('#hp-anadir').firstChild.textContent = editar != null ? 'Guardar · ' : 'Añadir · ';
    refrescaFicha(); hoja.showModal();
  }
  const leeOpciones = () => [...hoja.querySelectorAll('#hp-grupos input:checked')].map(i => i.value);
  function refrescaFicha() {
    actual.opciones = leeOpciones();
    hoja.querySelectorAll('.grupo').forEach(gEl => {
      const g = idx.grupos.get(gEl.dataset.grupo); if (g.max === 1) return;
      const n = gEl.querySelectorAll('input:checked').length;
      gEl.querySelectorAll('input:not(:checked)').forEach(i => { i.disabled = n >= g.max; });
    });
    $('#hp-cant').textContent = actual.cantidad;
    $('#hp-precio').textContent = euros(precioLinea(idx, actual, true) * actual.cantidad);
  }
  hoja.addEventListener('change', e => { if (e.target.matches('#hp-grupos input')) { e.target.closest('.grupo').classList.remove('falta'); refrescaFicha(); } });
  $('#hp-menos').onclick = () => { actual.cantidad = Math.max(1, actual.cantidad - 1); refrescaFicha(); };
  $('#hp-mas').onclick = () => { actual.cantidad = Math.min(20, actual.cantidad + 1); refrescaFicha(); };
  $('#hp-anadir').onclick = () => {
    actual.opciones = leeOpciones(); actual.nota = $('#hp-nota').value.trim();
    const p = idx.prod.get(actual.producto);
    const falta = p.grupos.map(gid => idx.grupos.get(gid)).find(g => actual.opciones.filter(o => g.opciones.some(x => x.id === o)).length < g.min);
    if (falta) { const el = hoja.querySelector(`[data-grupo="${falta.id}"]`); el.classList.add('falta'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const linea = { producto: actual.producto, cantidad: actual.cantidad, opciones: actual.opciones, nota: actual.nota };
    if (actual.editar != null) carrito[actual.editar] = linea;
    else {
      const igual = carrito.find(l => l.producto === linea.producto && l.nota === linea.nota && l.opciones.slice().sort().join() === linea.opciones.slice().sort().join());
      if (igual) igual.cantidad = Math.min(20, igual.cantidad + linea.cantidad); else carrito.push(linea);
    }
    guardaCarrito(); pintaBarra(); hoja.close();
    if (actual.editar != null) pintaCarrito();
  };

  /* ── Pedido ── */
  const total = () => carrito.reduce((s, l) => s + precioLinea(idx, l, true) * l.cantidad, 0);
  function pintaBarra() {
    const n = carrito.reduce((s, l) => s + l.cantidad, 0);
    $('#barra-carrito').hidden = n === 0 || !info || !info.pedidos;
    $('#bc-n').textContent = n; $('#bc-total').textContent = euros(total());
  }
  const hc = $('#hoja-carrito');
  $('#barra-carrito').onclick = () => { pintaCarrito(); $('#hc-error').hidden = true; try { $('#hc-nombre').value = $('#hc-nombre').value || localStorage.getItem('op-mesa-nombre') || ''; } catch (e) {} hc.showModal(); };
  $('#hc-cerrar').onclick = () => hc.close();
  const nombreOpciones = l => l.opciones.map(oid => { for (const g of idx.grupos.values()) { const o = g.opciones.find(x => x.id === oid); if (o) return o.nombre; } return ''; }).filter(Boolean);
  function pintaCarrito() {
    if (!carrito.length) { hc.close(); return; }
    $('#hc-lineas').innerHTML = carrito.map((l, i) => { const p = idx.prod.get(l.producto); const extra = nombreOpciones(l);
      return `<li class="linea"><div class="linea-cant"><button type="button" data-mas="${i}" aria-label="Uno más">+</button><output>${l.cantidad}</output><button type="button" data-menos="${i}" aria-label="Uno menos">−</button></div>
        <div><strong>${esc(p.nombre)}</strong>${extra.length ? `<small>${esc(extra.join(' · '))}</small>` : ''}${l.nota ? `<small>“${esc(l.nota)}”</small>` : ''}
        <small><a href="#" data-editar="${i}">Cambiar</a></small></div><span class="imp">${euros(precioLinea(idx, l, true) * l.cantidad)}</span></li>`; }).join('');
    $('#hc-total').textContent = euros(total());
  }
  $('#hc-lineas').addEventListener('click', e => {
    const t = e.target;
    if (t.dataset.mas) carrito[t.dataset.mas].cantidad = Math.min(20, carrito[t.dataset.mas].cantidad + 1);
    else if (t.dataset.menos) { const l = carrito[t.dataset.menos]; l.cantidad--; if (l.cantidad < 1) carrito.splice(t.dataset.menos, 1); }
    else if (t.dataset.editar) { e.preventDefault(); abreProducto(carrito[t.dataset.editar].producto, +t.dataset.editar); return; }
    else return;
    guardaCarrito(); pintaBarra(); pintaCarrito();
  });
  $('#hc-enviar').onclick = async () => {
    const btn = $('#hc-enviar'); btn.disabled = true; $('#hc-error').hidden = true;
    const nombre = $('#hc-nombre').value.trim(); try { localStorage.setItem('op-mesa-nombre', nombre); } catch (e) {}
    try {
      const r = await api.pedirEnMesa(M.l, M.m, M.k, carrito.map(({ producto, cantidad, opciones, nota }) => ({ producto, cantidad, opciones, nota })), $('#hc-notas').value.trim(), nombre);
      carrito = []; guardaCarrito(); pintaBarra(); $('#hc-notas').value = ''; hc.close();
      ok(`¡Marchando! Tu pedido #${r.numero} (${euros(r.total)}) ya está en cocina.`);
      await refresca(); tab('cuenta');
    } catch (ex) { $('#hc-error').textContent = mensajeError(ex); $('#hc-error').hidden = false; }
    finally { btn.disabled = false; }
  };

  /* ── Cuenta de la mesa ── */
  const EST = { nuevo: 'En cocina', preparando: 'Preparando', listo: 'Listo', entregado: 'Servido' };
  const pendiente = () => (info.cuenta ? info.cuenta.lineas : []).reduce((s, l) => s + l.unitario * l.cantidad, 0);
  function pintaCuenta() {
    const c = info.cuenta; const tot = pendiente();
    $('#t-cuenta').textContent = tot ? `Mi cuenta · ${euros(tot)}` : 'Mi cuenta';
    $('#c-comandas').innerHTML = c ? c.comandas.map(x => `<span class="${x.estado === 'listo' || x.estado === 'entregado' ? 'listo' : ''}">#${x.numero} · ${EST[x.estado] || x.estado}</span>`).join('') : '';
    $('#c-lineas').innerHTML = c && c.lineas.length ? c.lineas.map(l => `<li><span><b>${l.cantidad}×</b> ${esc(l.nombre)}${(l.opciones || []).map(o => `<small>+ ${esc(o.nombre)}</small>`).join('')}${l.dto ? `<small>${l.dto === 100 ? 'Invitación de la casa' : 'Descuento ' + l.dto + ' %'}</small>` : ''}</span><span>${euros(l.unitario * l.cantidad)}</span></li>`).join('')
      : '<li><span>Todavía no hay nada en la cuenta de esta mesa.</span></li>';
    $('#c-total').textContent = euros(tot);
    $('#b-pagar').hidden = !(info.pago_online && tot > 0);
    $('#b-cuenta').disabled = !tot;
  }

  /* ── Llamar al camarero / pedir la cuenta ── */
  async function avisar(tipo, btn) {
    btn.disabled = true;
    try { await api.avisarMesa(M.l, M.m, M.k, tipo); ok(tipo === 'cuenta' ? '🧾 Hemos avisado: ahora te traen la cuenta.' : '🙋 Hemos avisado al camarero: ya viene.'); }
    catch (ex) { ok(mensajeError(ex)); }
    setTimeout(() => { btn.disabled = tipo === 'cuenta' ? !pendiente() : false; }, 30000);
  }
  $('#b-camarero').onclick = e => avisar('camarero', e.currentTarget);
  $('#b-cuenta').onclick = e => avisar('cuenta', e.currentTarget);

  /* ── Pagar con el móvil (Stripe) ── */
  const hg = $('#hoja-pagar'); let propModo = 'p0';
  const propina = () => { const t = pendiente(); return propModo === 'p5' ? Math.round(t * 0.05 / 10) * 10 : propModo === 'p10' ? Math.round(t * 0.10 / 10) * 10 : propModo === 'red' ? (Math.ceil(t / 100) * 100 - t || 100) : 0; };
  function pintaPagar() {
    const t = pendiente(); const red = Math.ceil(t / 100) * 100 - t || 100;
    $('#hg-importe').textContent = euros(t);
    $('#hg-propinas').innerHTML = [['p0', 'Sin propina'], ['red', `Redondear (+${euros(red)})`], ['p5', '5 %'], ['p10', '10 %']]
      .map(([k, x]) => `<button type="button" data-p="${k}" class="${k === propModo ? 'sel' : ''}">${x}</button>`).join('');
    $('#hg-total').textContent = euros(t + propina()); $('#hg-ok').textContent = 'Pagar ' + euros(t + propina());
  }
  $('#hg-propinas').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) { propModo = b.dataset.p; pintaPagar(); } });
  $('#b-pagar').onclick = async () => { await refresca(); if (!pendiente()) return; propModo = 'p0'; $('#hg-error').hidden = true; pintaPagar(); hg.showModal(); };
  $('#hg-cerrar').onclick = () => hg.close();
  $('#hg-ok').onclick = async () => {
    const btn = $('#hg-ok'); btn.disabled = true; $('#hg-error').hidden = true;
    try {
      const r = await api.prepararPagoMesa(M.l, M.m, M.k, propina(), $('#hg-email').value.trim());
      ss('op-mesa-pago', { mesa: M, token: r.token });
      location.href = await api.iniciarPago(r.token, location.origin + location.pathname);
    } catch (ex) { $('#hg-error').textContent = mensajeError(ex); $('#hg-error').hidden = false; btn.disabled = false; }
  };
  async function volverDePago() {
    history.replaceState(null, '', `${location.pathname}?l=${encodeURIComponent(M.l)}&m=${encodeURIComponent(M.m)}&k=${encodeURIComponent(M.k)}`);
    if (q.get('pago') !== 'ok') { ok('No se ha completado el pago. Puedes intentarlo otra vez o pagar al camarero.'); tab('cuenta'); return; }
    tab('cuenta'); ok('Comprobando el pago…');
    for (let i = 0; i < 12; i++) {
      let e = null; try { e = await api.estadoPagoMesa(vuelta.token); } catch (x) { /* reintenta */ }
      if (e && e.estado === 'pagado') {
        ss('op-mesa-pago', null); await refresca();
        $('#m-ok').hidden = false; clearTimeout(tOk);
        $('#m-ok').innerHTML = `✓ ¡Pagado! Gracias, padre. ${e.ticket ? `<a href="/opinion/?t=${encodeURIComponent(e.ticket)}">Ver ticket y valorarnos</a>` : ''}`;
        return;
      }
      if (e && e.estado === 'error') { ok('El pago ha llegado pero la cuenta había cambiado. Avisa al camarero: te lo devolvemos o lo arreglamos en el momento.'); return; }
      await new Promise(r => setTimeout(r, 2500));
    }
    ok('El pago tarda en confirmarse. Si te han cobrado, enséñaselo al camarero.');
  }
})();
