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
    $('#r-personas').innerHTML = [...Array(maxP)].map((_, i) => `<label><input type="radio" name="personas" value="${i + 1}" ${i + 1 === Math.min(elegido, maxP) ? 'checked' : ''}><span>${i + 1}</span></label>`).join('');
    if ($('#r-dia').value) horas();
  }
  // Horas cada 15 min dentro del horario del local, a partir de 1 h desde ahora.
  function horas() {
    const dia = $('#r-dia').value; if (!dia || !local) return;
    const previa = (document.querySelector('[name=hora]:checked') || {}).value;
    const lista = []; const limite = Date.now() + 60 * 60000;
    for (let m = 0; m < 24 * 60; m += 15) {
      const d = new Date(`${dia}T${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`);
      if (d.getTime() >= limite && enHorario(local.horario || {}, d)) lista.push(d);
    }
    $('#r-horas').innerHTML = lista.map(d => { const v = d.toISOString(); const t = d.toTimeString().slice(0, 5);
      return `<label><input type="radio" name="hora" value="${v}" ${v === previa ? 'checked' : ''}><span>${t}</span></label>`; }).join('');
    $('#r-horas-ayuda').textContent = lista.length ? '' : 'Ese día no quedan horas disponibles. Prueba otro día.';
  }

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
      <p class="seg-k">${cancelada ? 'Reserva cancelada' : 'Reserva confirmada'}</p>
      <h1 class="seg-estado">${cancelada ? 'Cancelada' : '¡Te esperamos!'}</h1>
      <div class="seg-caja">
        <p style="margin:0 0 6px"><strong>${esc(cuando)}</strong></p>
        <p style="margin:0">${r.personas} ${r.personas === 1 ? 'persona' : 'personas'} · a nombre de ${esc(r.nombre)}</p>
        <p style="margin:6px 0 0">${esc(r.local)}${r.direccion ? ' · ' + esc(r.direccion) : ''}</p>
      </div>
      <p class="ayuda">Guarda esta página: desde aquí puedes cancelar si no podéis venir.</p>
      <div class="seg-acciones">
        ${r.telefono_local ? `<a class="btn btn-sec" href="tel:${esc(r.telefono_local.replace(/\s/g, ''))}">Llamar al local</a>` : ''}
        ${!cancelada && f > new Date() ? '<button class="btn btn-sec" type="button" id="r-cancelar">Cancelar reserva</button>' : ''}
      </div>`;
    const b = $('#r-cancelar');
    if (b) b.onclick = async () => { if (!confirm('¿Cancelar la reserva?')) return; await api.cancelarReserva(tk); verReserva(tk); };
  }
})();
