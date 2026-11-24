/* ÓRALE PADRE · todos los locales y la pantalla "elige tu local" (pedir y reservar)

   Un local que ya está en nuestro sistema (admin → Local → "Acepta pedidos" /
   "Acepta reservas") se pide y se reserva aquí. Los que siguen en Last App
   mandan a su tienda o a su reserva de Last App, o enseñan el teléfono.
   Para pasar un local a nuestro sistema basta con darlo de alta y activarlo
   en el admin: esta lista no hace falta tocarla, salvo para quitar el enlace
   de Last App cuando se dé de baja allí.

   Coordenadas aproximadas (nivel de barrio): sólo sirven para ordenar por
   cercanía. */
(function () {
  'use strict';
  const LOCALES = [
    { id: 'tomares', nombre: 'Tomares', barrio: 'Aljarafe', dir: 'Tomares (Sevilla)', lat: 37.3727, lng: -6.0456, tel: '' },
    { id: 'san-luis', nombre: 'San Luis', barrio: 'Macarena', dir: 'Calle San Luis 78, Sevilla', lat: 37.4010, lng: -5.9895, tel: '672964907',
      pedir: 'https://oralepadre.last.shop/l/orale-padre-san-luis', sinMesas: true },
    { id: 'remedios', nombre: 'Los Remedios', barrio: 'Los Remedios', dir: 'Calle Virgen de Loreto 16, Sevilla', lat: 37.3775, lng: -6.0080, tel: '658869341',
      pedir: 'https://oralepadre.last.shop/l/orale-padre-remedios' },
    { id: 'sevilla-este', nombre: 'Sevilla Este', barrio: 'Sevilla Este', dir: 'Calle Japón 10, Sevilla', lat: 37.4045, lng: -5.9210, tel: '672989917',
      pedir: 'https://oralepadre.last.shop/l/orale-padre-sevilla-este',
      reservar: 'https://bookings.last.app/bfe31dc3-678f-4004-8724-bae92b61b674/booking' },
  ];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const telTxt = t => t.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  const demo = () => /[?&]demo\b/.test(location.search) ? '&demo' : '';

  /* Adónde lleva cada local. `propios` = filas de la tabla locales. */
  function destino(id, modo, propios) {
    const l = LOCALES.find(x => x.id === id) || { id, nombre: id };
    const p = (propios || []).find(x => x.id === id);
    if (modo === 'pedir') {
      if (p && p.acepta_pedidos) return { tipo: 'aqui', url: `/pedir/?local=${id}${demo()}` };
      if (l.pedir) return { tipo: 'fuera', url: l.pedir };
    } else {
      if (p && p.acepta_reservas) return { tipo: 'aqui', url: `/reservar/?local=${id}${demo()}` };
      if (l.sinMesas) return { tipo: 'sinmesas', url: destino(id, 'pedir', propios).url };
      if (l.reservar) return { tipo: 'fuera', url: l.reservar };
    }
    if (l.tel) return { tipo: 'llamar', url: 'tel:+34' + l.tel };
    return { tipo: 'no' };
  }

  function km(a, b, c, d) {
    const r = g => g * Math.PI / 180;
    const x = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(x));
  }

  /* Pinta las tarjetas de locales en `caja`. modo: 'pedir' | 'reservar'. */
  function pintarElegir(caja, modo, propios) {
    let dist = null;
    const memo = (() => { try { return localStorage.getItem('op-local'); } catch (e) { return null; } })();
    function pinta() {
      let ls = LOCALES.map(l => ({ ...l, d: destino(l.id, modo, propios), km: dist ? km(dist[0], dist[1], l.lat, l.lng) : null }));
      if (dist) ls.sort((a, b) => a.km - b.km);
      else if (memo) ls.sort((a, b) => (b.id === memo) - (a.id === memo));
      const cta = d => modo === 'pedir'
        ? (d.tipo === 'llamar' ? 'Llamar' : d.tipo === 'no' ? 'Pronto' : 'Pedir')
        : (d.tipo === 'llamar' ? 'Llamar' : d.tipo === 'sinmesas' ? 'Sin mesas' : d.tipo === 'no' ? 'Pronto' : 'Reservar');
      caja.innerHTML = `
        <button class="el-ubi" type="button" id="el-ubi">📍 Buscar el más cercano</button>
        <p class="el-estado" id="el-estado" role="status" aria-live="polite"></p>
        ${ls.map((l, i) => {
          const marca = dist && i === 0 ? '<span class="el-marca">El más cercano</span>' : !dist && l.id === memo ? '<span class="el-marca">Tu último local</span>' : '';
          const extra = l.d.tipo === 'llamar' ? `Reserva por teléfono · ${telTxt(l.tel)}` : l.d.tipo === 'sinmesas' ? 'Sólo para recoger y llevar: sin mesas' : esc(l.dir) + (l.km != null ? ` · a ${l.km < 1 ? Math.round(l.km * 1000) + ' m' : l.km.toFixed(1).replace('.', ',') + ' km'}` : '');
          const off = l.d.tipo === 'no' || l.d.tipo === 'sinmesas';
          return `<a class="el-card${off ? ' apagado' : ''}${marca ? ' marcado' : ''}" ${off ? 'aria-disabled="true"' : `href="${esc(l.d.url)}"`} data-id="${l.id}">
            <span class="el-txt">${marca}<b>${esc(l.nombre)}</b><small>${extra}</small></span>
            <span class="el-cta">${cta(l.d)}</span></a>`;
        }).join('')}`;
      caja.querySelector('#el-ubi').onclick = buscar;
      caja.querySelectorAll('.el-card[href]').forEach(a => a.addEventListener('click', () => { try { localStorage.setItem('op-local', a.dataset.id); } catch (e) {} }));
    }
    function buscar() {
      const est = caja.querySelector('#el-estado');
      if (!('geolocation' in navigator)) { est.textContent = 'Tu navegador no deja usar la ubicación. Elige el local tú.'; return; }
      est.textContent = 'Buscando…';
      navigator.geolocation.getCurrentPosition(
        p => { dist = [p.coords.latitude, p.coords.longitude]; pinta(); },
        () => { est.textContent = 'No hemos podido saber dónde estás. Elige el local tú.'; },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
    }
    pinta();
  }

  window.OPL = { LOCALES, destino, pintarElegir };
})();
