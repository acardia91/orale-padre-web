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
})();
