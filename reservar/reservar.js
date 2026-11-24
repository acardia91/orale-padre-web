/* ÓRALE PADRE · reservar mesa (cliente) */
(function () {
  'use strict';
  const { api, DEMO, enHorario, mensajeError } = window.OP;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const q = new URLSearchParams(location.search);
  let LOCAL = q.get('local'), local = null, maxP = 10;
  if (DEMO) $('#aviso-demo').hidden = false;

  const token = q.get('reserva');
  if (token) verReserva(token); else arrancar();

  async function arrancar() {
    // Sin ?local, o un local que aún no reserva por aquí: pantalla "elige tu local".
    // Sevilla Este sigue con la reserva de Last App; los demás enseñan el teléfono.
    let propios = [];
    try { propios = await api.localesConPedidos(); } catch (e) {}
    if (!propios.some(l => l.id === LOCAL && l.acepta_reservas)) {
      const d = LOCAL ? window.OPL.destino(LOCAL, 'reservar', propios) : null;
      if (d && d.tipo === 'fuera') { location.replace(d.url); return; }
      $('#f-reserva').hidden = true; $('#vista-elegir').hidden = false; $('#cambiar-local').hidden = true;
      window.OPL.pintarElegir($('#elegir'), 'reservar', propios);
      return;
    }
    try { localStorage.setItem('op-local', LOCAL); } catch (e) {}
    await cargaLocal();
    const hoy = new Date(); const max = new Date(); max.setDate(max.getDate() + 60);
    const f = d => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
    $('#r-dia').min = f(hoy); $('#r-dia').max = f(max); $('#r-dia').value = f(hoy);
    $('#r-dia').onchange = horas;
    try { const c = JSON.parse(localStorage.getItem('op-cliente')) || {}; $('#r-nombre').value = c.nombre || ''; $('#r-tel').value = c.tel || ''; $('#r-email').value = c.email || ''; } catch (e) {}
    horas();
  }
  async function cargaLocal() {
    local = await api.local(LOCAL);
    $('#nombre-local').textContent = local.nombre.replace(/^Órale Padre\s*/, '');
    maxP = local.reservas_max_personas || 10;
    const elegido = +((document.querySelector('[name=personas]:checked') || {}).value || 2);
    // Si el local acepta "solicitudes" de grupo, se puede pedir hasta 20 (el local la confirma).
    const tope = (local.reservas_config || {}).grupos === 'solicitud' ? Math.max(20, maxP) : maxP;
    $('#r-personas').innerHTML = [...Array(tope)].map((_, i) => `<label title="${i + 1 > maxP ? 'Grupo: el local te la confirma' : ''}"><input type="radio" name="personas" value="${i + 1}" ${i + 1 === Math.min(elegido, tope) ? 'checked' : ''}><span>${i + 1}</span></label>`).join('');
    if ($('#r-dia').value) horas();
  }
  // Horas que el local ofrece ese día (turnos, días especiales, antelación) con hueco para ese nº de personas.
  let pideHoras = 0;
  async function horas() {
    const dia = $('#r-dia').value; if (!dia || !local) return;
    const previa = (document.querySelector('[name=hora]:checked') || {}).value;
    const personas = +((document.querySelector('[name=personas]:checked') || {}).value || 2);
    const yo = ++pideHoras; $('#r-horas-ayuda').textContent = 'Buscando horas…';
    let lista = [];
    try { lista = await api.horasReserva(LOCAL, dia, Math.min(personas, maxP)); } catch (e) { $('#r-horas-ayuda').textContent = 'No hemos podido cargar las horas. Prueba otra vez.'; return; }
    if (yo !== pideHoras) return;
    const ordenar = x => new Date(x.fecha).getTime();
    lista.sort((a, b) => ordenar(a) - ordenar(b));
    $('#r-horas').innerHTML = lista.map(x => { const v = new Date(x.fecha).toISOString();
      return `<label class="${x.libre ? '' : 'lleno'}"><input type="radio" name="hora" value="${v}" ${v === previa && x.libre ? 'checked' : ''} ${x.libre ? '' : 'disabled'}><span>${x.hora}</span></label>`; }).join('');
    const libres = lista.filter(x => x.libre).length;
    $('#r-horas-ayuda').textContent = !lista.length ? 'Ese día no hay reservas online. Prueba otro día o llámanos.'
      : !libres ? 'Ese día estamos completos. Prueba otro día o llámanos.' : lista.length > libres ? 'Las horas tachadas están completas.' : '';
  }
  document.addEventListener('change', e => { if (e.target.name === 'personas') horas(); });

  $('#f-reserva').addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#r-error'); err.hidden = true;
    const fallo = (t, foco) => { err.textContent = t; err.hidden = false; if (foco) $(foco).focus(); };
    const hora = document.querySelector('[name=hora]:checked'); const personas = document.querySelector('[name=personas]:checked');
    const nombre = $('#r-nombre').value.trim(), tel = $('#r-tel').value.trim(), email = $('#r-email').value.trim();
    if (!personas) return fallo('¿Cuántos sois?');
    if (!hora) return fallo('Elige una hora.');
    if (nombre.length < 2) return fallo('Dinos tu nombre.', '#r-nombre');
    if (tel.replace(/[^0-9]/g, '').length < 9) return fallo('Revisa el teléfono.', '#r-tel');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fallo('Escribe tu email: te mandamos ahí la confirmación.', '#r-email');
    const btn = $('#r-ok'); btn.disabled = true; btn.textContent = 'Reservando…';
    try {
      const r = await api.crearReserva({ local: LOCAL, fecha: hora.value, personas: personas.value, nombre, tel, email, notas: $('#r-notas').value.trim() });
      try { localStorage.setItem('op-cliente', JSON.stringify({ nombre, tel, email })); } catch (ex) {}
      location.href = location.pathname + '?reserva=' + r.token + (DEMO && location.search.includes('demo') ? '&demo' : '');
    } catch (ex) { fallo(mensajeError(ex)); btn.disabled = false; btn.textContent = 'Reservar'; }
  });

  async function verReserva(tk) {
    $('#vista-form').hidden = true; $('#vista-reserva').hidden = false;
    let r = null; try { r = await api.verReserva(tk); } catch (e) {}
    if (!r) { $('#r-confirmada').innerHTML = '<p class="error">No encontramos esa reserva.</p><p><a href="./">Hacer una reserva</a></p>'; return; }
    const f = new Date(r.fecha);
    const cuando = f.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    const cancelada = r.estado === 'cancelada';
    $('#r-confirmada').innerHTML = `
      <p class="seg-k">${cancelada ? 'Reserva cancelada' : r.estado === 'pendiente' ? 'Solicitud recibida' : 'Reserva confirmada'}</p>
      <h1 class="seg-estado">${cancelada ? 'Cancelada' : r.estado === 'pendiente' ? 'Te confirmamos enseguida' : '¡Te esperamos!'}</h1>
      ${r.estado === 'pendiente' ? '<p>Para grupos grandes el local revisa la reserva y te la confirma. Te avisaremos.</p>' : ''}
      <div class="seg-caja">
        <p style="margin:0 0 6px"><strong>${esc(cuando)}</strong></p>
        <p style="margin:0">${r.personas} ${r.personas === 1 ? 'persona' : 'personas'} · a nombre de ${esc(r.nombre)}</p>
        <p style="margin:6px 0 0">${esc(r.local)}${r.direccion ? ' · ' + esc(r.direccion) : ''}</p>
      </div>
      <p class="ayuda">Guarda esta página: desde aquí puedes cancelar hasta ${r.cancelar_hasta >= 60 ? (r.cancelar_hasta / 60) + (r.cancelar_hasta === 60 ? ' hora' : ' horas') : r.cancelar_hasta + ' minutos'} antes. Después, llámanos.</p>
      <div class="seg-acciones">
        ${r.telefono_local ? `<a class="btn btn-sec" href="tel:${esc(r.telefono_local.replace(/\s/g, ''))}">Llamar al local</a>` : ''}
        ${!cancelada && f > new Date() ? '<button class="btn btn-sec" type="button" id="r-cancelar">Cancelar reserva</button>' : ''}
      </div>`;
    const b = $('#r-cancelar');
    if (b) b.onclick = async () => { if (!confirm('¿Cancelar la reserva?')) return; try { await api.cancelarReserva(tk); } catch (ex) { alert(mensajeError(ex)); } verReserva(tk); };
  }
})();
