/* ÓRALE PADRE · dejar opinión (cliente)
   ?local=tomares (QR de mesa / ticket) · ?p=<token del pedido> (email tras el pedido) · &o=qr|ticket|email */
(function () {
  'use strict';
  const { api, DEMO, mensajeError } = window.OP;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LOCALES = { tomares: 'Tomares', 'san-luis': 'San Luis', remedios: 'Los Remedios', 'sevilla-este': 'Sevilla Este' };
  const ETIQ = ['', 'Muy mal', 'Flojo', 'Normalito', 'Muy bien', '¡Órale, padre!'];
  const q = new URLSearchParams(location.search);
  const pedido = q.get('p'), ticket = q.get('t'); let local = LOCALES[q.get('local')] ? q.get('local') : null; let nota = 0;
  const origen = ['qr', 'ticket', 'email', 'web'].includes(q.get('o')) ? q.get('o') : (pedido ? 'email' : ticket ? 'ticket' : 'web');
  if (DEMO) $('#aviso-demo').hidden = false;

  function pintaLocal() {
    $('#nombre-local').textContent = local ? 'Órale Padre ' + LOCALES[local] : 'Órale Padre';
    $('#o-locales').innerHTML = Object.entries(LOCALES).map(([id, n]) => `<button type="button" data-l="${id}" aria-pressed="${id === local}">${n}</button>`).join('');
  }
  $('#o-locales').onclick = e => { const b = e.target.closest('[data-l]'); if (!b) return; local = b.dataset.l; pintaLocal(); };
  if (!local && !pedido && !ticket) {
    $('#o-bloque-local').hidden = false;
    try { const g = localStorage.getItem('op-local'); if (LOCALES[g]) local = g; } catch (e) {}
  }
  pintaLocal();

  // Si viene del email del pedido, ya sabemos quién es y dónde ha pedido.
  if (pedido && api.estadoPedido) api.estadoPedido(pedido).then(p => {
    if (!p) return;
    if (p.nombre) $('#o-saludo').textContent = `Hola ${p.nombre}, ¿qué tal tu pedido #${p.numero}? Cuéntanos, lo leemos todo.`;
    const n = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const id = Object.keys(LOCALES).find(k => n(p.local).includes(n(LOCALES[k]).replace(/^los /, '')));
    if (id) { local = id; pintaLocal(); }
  }).catch(() => {});
  // Desde el QR del ticket de sala: sabemos local, ticket e importe.
  if (ticket && api.ticketParaValorar) api.ticketParaValorar(ticket).then(t => {
    if (!t) { $('#o-saludo').textContent = 'Este ticket ya no se puede valorar, pero cuéntanos igualmente.'; $('#o-bloque-local').hidden = false; return; }
    local = t.local; pintaLocal();
    const f = new Date(t.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    $('#o-saludo').textContent = `¿Qué tal tu visita del ${f}? (ticket ${t.ticket} · ${OP.euros(t.total)}). Lo leemos todo.`;
    if (t.mi_nota && !nota) { nota = t.mi_nota; pintaEstrellas(); }
  }).catch(() => {});
  try { const c = JSON.parse(localStorage.getItem('op-cliente')) || {}; $('#o-nombre').value = c.nombre || ''; $('#o-contacto').value = c.email || c.tel || ''; } catch (e) {}

  function pintaEstrellas() {
    $('#o-estrellas').innerHTML = [1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="${n === nota}" aria-label="${n} ${n === 1 ? 'estrella' : 'estrellas'}" data-n="${n}" class="${n <= nota ? 'on' : ''}">★</button>`).join('');
    $('#o-etiqueta').textContent = ETIQ[nota];
    $('#o-pregunta').innerHTML = nota && nota <= 3 ? '¿Qué ha fallado? Nos ayuda mucho a mejorar <em>(opcional)</em>' : '¿Qué es lo que más te ha gustado? <em>(opcional)</em>';
    $('#o-contacto-ayuda').textContent = nota && nota <= 3 ? '(si nos lo dejas, te llamamos para arreglarlo)' : '(opcional, por si queremos responderte)';
  }
  $('#o-estrellas').onclick = e => { const b = e.target.closest('[data-n]'); if (!b) return; nota = +b.dataset.n; pintaEstrellas(); $('#o-error').hidden = true; };
  $('#o-estrellas').onkeydown = e => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return; e.preventDefault();
    nota = Math.min(5, Math.max(1, (nota || 0) + (['ArrowRight', 'ArrowUp'].includes(e.key) ? 1 : -1))); pintaEstrellas();
    $(`#o-estrellas [data-n="${nota}"]`).focus();
  };
  { const n0 = +q.get('n'); if (n0 >= 1 && n0 <= 5) nota = n0; }
  pintaEstrellas();

  $('#f-op').addEventListener('submit', async e => {
    e.preventDefault();
    const fallo = t => { $('#o-error').textContent = t; $('#o-error').hidden = false; };
    if (!local && !pedido && !ticket) return fallo('Elige el local.');
    if (!nota) return fallo('Elige de 1 a 5 estrellas.');
    $('#o-ok').disabled = true; $('#o-ok').textContent = 'Enviando…';
    try {
      const r = await api.dejarResena({ local, nota, comentario: $('#o-texto').value.trim(), nombre: $('#o-nombre').value.trim(),
        contacto: $('#o-contacto').value.trim(), pedido, ticket, origen });
      gracias(r || {});
    } catch (ex) { fallo(mensajeError(ex)); $('#o-ok').disabled = false; $('#o-ok').textContent = 'Enviar opinión'; }
  });

  function gracias(r) {
    $('#vista-form').hidden = true; $('#vista-gracias').hidden = false; window.scrollTo(0, 0);
    const buena = nota >= 4;
    $('#o-gracias').innerHTML = `<h2>${buena ? '¡Gracias, padre!' : 'Gracias por contárnoslo'}</h2>
      <p>${buena ? 'Nos alegra un montón. Se lo pasamos al equipo.' : 'Lo vamos a revisar con el equipo' + ($('#o-contacto').value.trim() ? ' y te escribimos o llamamos.' : '.')}</p>
      ${r.enlace ? `<p>¿Nos ayudas dejando también tu opinión en Google? A otros clientes les sirve mucho.</p>
        <a class="btn" href="${esc(r.enlace)}" target="_blank" rel="noopener">Opinar en Google</a>` : ''}
      <a class="otro" href="/">Volver a oralepadre.com</a>`;
  }

  /* ══ Factura con datos (desde el QR del ticket) ══ */
  if (ticket && OP.facturas) {
    let fac = null;
    const ver = v => { ['vista-form', 'vista-gracias', 'vista-factura'].forEach(id => { $('#' + id).hidden = id !== v; }); window.scrollTo(0, 0); };
    const muestra = f => {
      ver('vista-factura'); $('#f-fac').hidden = true; $('#fac-doc').hidden = false;
      $('#fac-saludo').textContent = f.ya === false ? '¡Lista! Ya tienes tu factura. Guárdala en PDF o imprímela.' : 'Esta es la factura de tu ticket.';
      $('#fac-doc').innerHTML = OP.facturaHTML(f) + `<div class="fac-botones"><button class="btn" type="button" id="fac-imp">Guardar PDF / imprimir</button>
        <button class="btn btn-sec" type="button" id="fac-opinar">Dejar mi opinión</button></div>`;
      $('#fac-imp').onclick = () => OP.imprimirFactura($('#fac-doc'));
      $('#fac-opinar').onclick = () => ver('vista-form');
    };
    OP.facturas.deTicket(ticket).then(f => {
      if (!f) return; fac = f;
      $('#fac-aviso').hidden = false;
      if (f.numero) { $('#fac-aviso-txt').innerHTML = `Ya tienes factura de este ticket<small>${esc(f.numero)} · ${esc(f.cliente && f.cliente.nombre)}</small>`; $('#fac-abrir').textContent = 'Ver factura'; }
      else if (!f.puede) { $('#fac-aviso-txt').innerHTML = '¿Necesitas factura con tus datos?<small>Este ticket ya no se puede facturar desde aquí: pídela en el local.</small>'; $('#fac-abrir').hidden = true; }
      if (q.get('f') === '1') $('#fac-abrir').click();
    }).catch(() => {});
    $('#fac-abrir').onclick = () => {
      if (fac && fac.numero) return muestra(fac);
      ver('vista-factura'); $('#f-fac').hidden = false; $('#fac-doc').hidden = true;
      if (fac) $('#fac-saludo').textContent = `Ticket ${fac.ticket} · ${OP.euros(fac.total)}. Rellena tus datos fiscales y te la damos al momento.`;
      try { const g = JSON.parse(localStorage.getItem('op-factura-datos')) || {}; ['nif', 'nombre', 'dir', 'cp', 'pob', 'email'].forEach(k => { if (g[k] && !$('#fac-' + k).value) $('#fac-' + k).value = g[k]; }); } catch (e) {}
      $('#fac-nif').focus();
    };
    $('#fac-volver').onclick = () => ver('vista-form');
    $('#fac-nif').addEventListener('blur', () => { const v = $('#fac-nif').value.trim(); if (v && !OP.nifValido(v)) { $('#fac-error').textContent = 'Ese NIF/CIF no parece correcto: revisa letras y números.'; $('#fac-error').hidden = false; } else $('#fac-error').hidden = true; });
    $('#f-fac').addEventListener('submit', async e => {
      e.preventDefault();
      const fallo = t => { $('#fac-error').textContent = t; $('#fac-error').hidden = false; };
      const d = { nif: $('#fac-nif').value.trim(), nombre: $('#fac-nombre').value.trim(), direccion: $('#fac-dir').value.trim(),
        cp: $('#fac-cp').value.trim(), poblacion: $('#fac-pob').value.trim(), email: $('#fac-email').value.trim() };
      if (!OP.nifValido(d.nif)) return fallo('Ese NIF/CIF no parece correcto: revisa letras y números. Si es extranjero, pídela en el local.');
      if (d.nombre.length < 2) return fallo('Falta el nombre o razón social.');
      if (d.direccion.length < 2 || d.cp.length < 4 || d.poblacion.length < 2) return fallo('Falta la dirección completa (calle, C. P. y población).');
      $('#fac-ok').disabled = true; $('#fac-ok').textContent = 'Emitiendo…';
      try {
        const f = await OP.facturas.pedir(ticket, d); fac = f;
        try { localStorage.setItem('op-factura-datos', JSON.stringify({ nif: d.nif, nombre: d.nombre, dir: d.direccion, cp: d.cp, pob: d.poblacion, email: d.email })); } catch (x) {}
        muestra(f);
        $('#fac-aviso-txt').innerHTML = `Ya tienes factura de este ticket<small>${esc(f.numero)}</small>`; $('#fac-abrir').textContent = 'Ver factura';
      } catch (ex) { fallo(mensajeError(ex)); }
      finally { $('#fac-ok').disabled = false; $('#fac-ok').textContent = 'Emitir mi factura'; }
    });
  }
})();
