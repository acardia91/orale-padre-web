/* ═══════════════════════════════════════════════════════════
   ÓRALE PADRE · landing

   ▼▼▼  LO ÚNICO QUE HAY QUE TOCAR ESTÁ AQUÍ ABAJO  ▼▼▼
   Rellena estos enlaces y la web queda operativa.
   Lo que dejes vacío no rompe nada: el botón avisa de qué falta.
   ═══════════════════════════════════════════════════════════ */

const CONFIG = {
  /* ══ 1. PEDIR PARA RECOGER · Last App ══
     Una URL por local. Las saca Last App desde su panel:
     Ajustes → Tienda online → copiar enlace. Suelen ser del tipo
     https://pedir.lastapp.io/orale-padre-san-luis                       */
  recoger: {
    // Tienda de Last App de cada local (comprobadas el 2 de septiembre de
    // 2026: las tres ofrecen "Recoger · lo antes posible" y el pedido entra
    // directo en el local). El general es la portada de la tienda.
    general:     'https://oralepadre.last.shop',
    sanLuis:     'https://oralepadre.last.shop/l/orale-padre-san-luis',
    remedios:    'https://oralepadre.last.shop/l/orale-padre-remedios',
    sevillaEste: 'https://oralepadre.last.shop/l/orale-padre-sevilla-este',
  },

  /* Carrito propio (pedido por WhatsApp sin pago). Está construido y
     probado, pero APAGADO: de momento se pide en Last App, que registra el
     pedido en el local. Para volver a activarlo: pedidoPropio: true.      */
  pedidoPropio: false,

  /* Teléfono de cada local, sin prefijo. Los tres salen en su propia
     tienda de Last App, así que son los buenos.                            */
  telefonos: {
    sanLuis:     '661018380',
    remedios:    '658869341',
    sevillaEste: '672989917',
  },

  /* Reserva online por local (Last App bookings). Solo Sevilla Este la
     tiene publicada en su Linktree; si los otros dos la activan, se pone
     aquí y el formulario de reservar los manda allí.                      */
  reservas: {
    sanLuis:     '',
    remedios:    '',
    sevillaEste: 'https://bookings.last.app/bfe31dc3-678f-4004-8724-bae92b61b674/booking',
  },

  /* ══ 2. A DOMICILIO ══
     Cada local puede tener Uber, Glovo o las dos. Si pones las dos,
     manda la que marques en `preferida`.                               */
  preferida: 'uber',        // 'uber' o 'glovo'

  uber: {
    // Sacados de las fichas públicas de Uber Eats en agosto de 2026.
    // OJO: en vuestro Linktree de San Luis el botón de Uber apunta al de
    // Los Remedios. Parece un error vuestro; aquí va el correcto.
    sanLuis:     'https://www.ubereats.com/es/store/orale-padre-centro/D8oOt9D6UeWK18DmqLy3Jg',
    remedios:    'https://www.ubereats.com/es/store/orale-padre-los-remedios/0qbeyz1cUjqJKKP3VwpeMQ',
    sevillaEste: 'https://www.ubereats.com/es/store/orale-padre-sevilla-este/i6CoHd7FX_ejqPL8m5ExpA',
  },

  /* Glovo queda ACTIVADO porque lo has pedido dos veces.
     Recordatorio, y no insisto más: el contrato de semi-exclusividad
     con Uber (cláusula VII.I) prohíbe usar otras plataformas y exige
     el 95% de pedidos por Uber a cambio del 22% de comisión en vez
     del 30%. Publicar Glovo aquí es incumplirlo por escrito.
     Si prefieres dejarlo listo pero apagado, pon activo: false.        */
  glovo: {
    activo: true,
    // Los tres Linktrees (general, San Luis y Sevilla Este) apuntan a la
    // misma ficha de Glovo, así que en Glovo solo hay una tienda. Si algún
    // día cada local tiene la suya, se cambian aquí.
    sanLuis:     'https://glovoapp.com/es/es/sevilla/orale-padre-sevilla/',
    remedios:    'https://glovoapp.com/es/es/sevilla/orale-padre-sevilla/',
    sevillaEste: 'https://glovoapp.com/es/es/sevilla/orale-padre-sevilla/',
  },

  /* ══ 3. CAJAS ÓRALE EN CASA ══ */
  cajas: {
    pareja: '',
    tribu: '',
    reunion: '',
  },

  /* ══ 4. CONTACTO Y FORMULARIOS ══ */
  whatsapp: '',             // WhatsApp de reservas: '34600112233', sin + ni espacios.
                            // Vacío: el formulario usa la reserva online del local
                            // (si la tiene) o deja el correo redactado + teléfono.
  contactoEmail: 'orale.padre.food@gmail.com',

  /* ══ 4b. PEDIDOS PARA RECOGER · sin pasarela de pago ══
     El cliente arma el pedido en la web, elige local y hora, y le da a
     enviar: eso abre WhatsApp con el pedido ya escrito, al número de ESE
     local. Se paga al recoger, en el TPV físico de siempre.

     Por qué así y no un carrito con cobro online: cobrar y facturar desde
     la web os convertiría en "productor" de un sistema de facturación
     bajo el RD 1007/2023 (Verifactu), con la sanción de 50.000€/ejercicio
     si no está homologado. Esto no cobra ni factura nada: es un aviso,
     como una reserva de mesa pero de comida. Cero riesgo por ese lado.

     CONFIRMADOS (búsqueda pública, agosto 2026):
       Los Remedios   → 658 86 93 41
       Sevilla Este   → 672 98 99 17
       San Luis       → 661 01 83 80 (confirmado en su tienda de Last App,
                         2 sep 2026). Va vacío aquí solo porque no sé si
                         ese número tiene WhatsApp; si lo tiene, poned
                         '34661018380'.
     Solo se usa si pedidoPropio es true.                                 */
  pedidoWhatsapp: {
    sanLuis:     '',
    remedios:    '34658869341',
    sevillaEste: '34672989917',
  },

  /* Copia por email de cada pedido, además del WhatsApp. Mismo Formspree
     que catering vale para esto (hasta 50 envíos/mes gratis); podéis
     usar el mismo endpoint o crear uno nuevo por separado.             */
  pedidoForm: '',
  pedidoEmail: 'orale.padre.food@gmail.com',

  /* Endpoint de Formspree (formspree.io, gratis hasta 50 envíos/mes).
     Si lo dejas vacío, el formulario abre el correo ya redactado.      */
  /* ══ 4c. CLUB · MY ÓRALE PADRE ══

     Los puntos tienen que sumarse EN EL MOMENTO DE PAGAR, y quien cobra
     es Last App. Por eso el club no se lleva en una lista aparte: se
     activa en el panel de Last App (Marketing → fidelización) y los
     clientes se dan de alta con la cuenta de vuestra tienda, la misma
     con la que piden. Así suma solo, sin que nadie apunte nada a mano.

     COMPROBADO el 2 de septiembre de 2026 en vuestra tienda: existe
     "Registrarse", pero NO aparece ninguna sección de puntos. Es decir,
     la fidelización todavía NO está activada en vuestro Last App.

     Cuando la activéis, pegad aquí la URL de la tienda y la web deja de
     pedir el alta por su cuenta: manda a crear la cuenta donde de verdad
     se cuentan los puntos.                                              */
  club: {
    altaLastApp: '',        // p.ej. 'https://oralepadre.last.shop'
  },

  cateringForm: '',
  clubForm: '',             // lista de espera del club, mientras no haya Last App
  cateringEmail: 'orale.padre.food@gmail.com',
  clubEmail: 'orale.padre.food@gmail.com',

  /* ══ 5. VALORACIONES ══
     Solo se muestran las que rellenes. Pon el número tal cual sale en
     cada plataforma; si lo dejas vacío, esa tarjeta no aparece.
     No las inventes: publicar una nota falsa es publicidad engañosa.   */
  notas: {
    // 'sobre5' pinta estrellas; 'porcentaje' pinta el % tal cual, que es
    // como puntúa Glovo. Comprobados en las fichas públicas, agosto 2026.
    uber:   { valor: '4,5', tipo: 'sobre5',     pie: 'Top rated in Seville' },
    glovo:  { valor: '96',  tipo: 'porcentaje', pie: 'Positive rating' },
    google: { valor: '4,5', tipo: 'sobre5',     pie: 'Over 300 reviews' },
  },

  /* ══ 6. VALORES NUTRICIONALES DE LOS BOWLS ══

     CALCULADOS, NO MEDIDOS. Salen de sumar los ingredientes de cada receta
     por su peso, con tablas de composición estándar. La web los muestra
     marcados como ESTIMADOS, que es lo honesto y lo que exige el Reglamento
     (UE) 1169/2011: si declaras un valor, tiene que ser exacto, y esto es
     una estimación hasta que cocina confirme los gramos.

     LOS PESOS QUE HE SUPUESTO (revisadlos, es cosa de una báscula y 10 min):

       Desnudo Juárez · 485 g
         arroz 150 · pulled pork 120 · guacamole 60 · pico de gallo 60
         totopos 25 · lechuga 40 · crema agria 30

       Desnudo Dolores · 545 g
         arroz 150 · carne 110 · frijoles 70 · cheddar 25 · guacamole 55
         pico de gallo 55 · lechuga 40 · salsa verde 25 · chipotle 15

       Desnudo Cochinita · 565 g
         arroz 150 · cochinita 115 · frijoles 70 · piña 40 · guacamole 55
         pico de gallo 50 · lechuga 40 · crema agria 30 · chipotle 15

     Si un peso cambia, cambia el valor. Corregid los gramos, volved a
     sumar y actualizad aquí.

     Poned `estimado: false` SOLO cuando cocina haya confirmado los pesos.  */
  nutricion: {
    estimado:  true,
    juarez:    { kcal: '750', prote: '32', hc: '78', grasa: '33' },
    dolores:   { kcal: '790', prote: '47', hc: '68', grasa: '36' },
    cochinita: { kcal: '750', prote: '37', hc: '75', grasa: '32' },
  },

  negocio: 'Órale Padre',
};

/* ── Los tres locales ──
   OJO con las coordenadas: son aproximadas, a nivel de barrio, porque en los
   documentos no venía el número de la calle. Sirven de sobra para acertar cuál
   es el más cercano de los tres, pero conviene afinarlas: búscalo en Google
   Maps, botón derecho sobre el local, y copia los dos números. */
const LOCALES = [
  {
    clave: 'sanLuis',
    nombre: 'San Luis',
    barrio: 'Macarena',
    dir: 'Calle San Luis 78, 41003 Sevilla',
    lat: 37.4010,
    lng: -5.9895,
  },
  {
    clave: 'remedios',
    nombre: 'Los Remedios',
    barrio: 'Los Remedios',
    dir: 'Calle Virgen de Loreto 16, 41011 Sevilla',
    lat: 37.3775,
    lng: -6.0080,
  },
  {
    clave: 'sevillaEste',
    nombre: 'Sevilla Este',
    barrio: 'Sevilla Este',
    dir: 'Calle Japón 10, 41020 Sevilla',
    lat: 37.4045,
    lng: -5.9210,
  },
];

/* ═══════════════════════════════════════════════════════════
   ▲▲▲  A PARTIR DE AQUÍ NO HACE FALTA TOCAR NADA  ▲▲▲
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* Si estás a más de esto del local más cercano, no eres de Sevilla:
     te ofrecemos la caja a domicilio en vez de mandarte a recoger. */
  const LEJOS_KM = 35;
  const MEMORIA = 'orale_local';

  /* ───────────────────────── Utilidades ───────────────────────── */

  function avisoFalta(que) {
    return (
      'Todavía no está puesto el enlace de ' + que + '.\n\n' +
      'Open script.js and fill it in the CONFIG block at the top.'
    );
  }

  function abrir(url) {
    window.open(url, '_blank', 'noopener');
  }

  /* Enlace de recoger de un local: el suyo, o el general si no tiene propio */
  function urlRecoger(local) {
    return CONFIG.recoger[local.clave] || CONFIG.recoger.general || '';
  }

  /* '661018380' → '661 01 83 80' */
  function formatoTel(t) {
    return t ? t.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4') : '';
  }

  /* Plataforma de reparto que toca. Uber manda; Glovo solo si lo encendéis. */
  function reparto(local) {
    const uber = CONFIG.uber[local.clave];
    const glovo = CONFIG.glovo.activo ? CONFIG.glovo[local.clave] : '';

    // manda la preferida si ese local la tiene; si no, la otra
    if (CONFIG.preferida === 'glovo' && glovo) return { nombre: 'Glovo', url: glovo };
    if (uber) return { nombre: 'Uber Eats', url: uber };
    if (glovo) return { nombre: 'Glovo', url: glovo };

    return { nombre: CONFIG.preferida === 'glovo' ? 'Glovo' : 'Uber Eats', url: '' };
  }

  /* Distancia en km entre dos puntos (fórmula del semiverseno) */
  function distanciaKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const rad = (g) => (g * Math.PI) / 180;
    const dLat = rad(lat2 - lat1);
    const dLng = rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function masCercano(lat, lng) {
    let mejor = 0;
    let min = Infinity;
    LOCALES.forEach((l, i) => {
      const d = distanciaKm(lat, lng, l.lat, l.lng);
      if (d < min) {
        min = d;
        mejor = i;
      }
    });
    return { indice: mejor, km: min };
  }

  function formatoKm(km) {
    if (km == null) return '';
    return km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1).replace('.', ',') + ' km';
  }

  /* ───────────────────── Elegir local y pintarlo ───────────────────── */

  let elegido = null;

  function elegirLocal(indice, km) {
    const local = LOCALES[indice];
    if (!local) return;
    elegido = indice;

    try {
      localStorage.setItem(MEMORIA, String(indice));
    } catch (e) {
      /* navegación privada: seguimos sin recordar, no pasa nada */
    }

    // Paso 2
    const vacio = $('#acc-vacio');
    const listo = $('#acc-listo');
    if (vacio) vacio.hidden = true;
    if (listo) listo.hidden = false;

    $('#acc-nombre').textContent = local.nombre;
    $('#acc-nombre-2').textContent = local.nombre;
    $('#acc-dir').textContent = local.dir + (km != null ? ' · a ' + formatoKm(km) : '');

    // Recoger → tienda de Last App de ese local. El pedido se registra allí,
    // en el local. (Si algún día se enciende pedidoPropio, el módulo del
    // final intercepta este clic y abre el carrito propio en su lugar.)
    enlazar($('#acc-recoger'), urlRecoger(local), 'pedidos para recoger');

    // A domicilio → las dos plataformas, cada una con su enlace
    enlazar($('#acc-uber'), CONFIG.uber[local.clave] || '', 'pedidos a Uber Eats');
    const btnGlovo = $('#acc-glovo');
    if (btnGlovo) {
      btnGlovo.hidden = !CONFIG.glovo.activo;
      enlazar(btnGlovo, CONFIG.glovo.activo ? CONFIG.glovo[local.clave] || '' : '', 'pedidos a Glovo');
    }

    // Teléfono del local, por si prefieren pedirlo de viva voz
    const tel = CONFIG.telefonos[local.clave] || '';
    const telLinea = $('#acc-tel');
    const telEnlace = $('#acc-tel-link');
    if (telLinea && telEnlace) {
      telLinea.hidden = !tel;
      if (tel) {
        telEnlace.href = 'tel:+34' + tel;
        telEnlace.textContent = local.nombre + ' · ' + formatoTel(tel);
      }
    }

    // Chapa de la cabecera
    const chip = $('#chip-local');
    if (chip) {
      chip.hidden = false;
      $('#chip-local-nombre').textContent = local.nombre;
    }

    // Botón activo en el selector manual
    $$('.ubi-manual button').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.local) === indice));
    });

    // Resaltar su ficha abajo
    $$('.loc').forEach((art) => {
      art.classList.toggle('loc-tuyo', Number(art.dataset.local) === indice);
    });
  }

  /* Deja un enlace listo, o lo convierte en aviso si aún no hay URL */
  function enlazar(el, url, que) {
    if (!el) return;
    el.onclick = null;
    if (url) {
      el.href = url;
      if (!url.startsWith('mailto:')) el.target = '_blank';
      else el.removeAttribute('target');
      el.rel = 'noopener';
      el.classList.remove('sin-enlace');
    } else {
      el.href = '#';
      el.removeAttribute('target');
      el.classList.add('sin-enlace');
      el.onclick = (e) => {
        e.preventDefault();
        alert(avisoFalta(que));
      };
    }
  }

  /* ───────────────────────── Geolocalización ───────────────────────── */

  const estado = $('#ubi-estado');

  function decir(texto, tipo) {
    if (!estado) return;
    estado.textContent = texto;
    estado.className = 'ubi-estado' + (tipo ? ' es-' + tipo : '');
  }

  const btnUbi = $('#btn-ubi');

  if (btnUbi) {
    if (!('geolocation' in navigator)) {
      btnUbi.hidden = true;
    }

    btnUbi.addEventListener('click', function () {
      btnUbi.disabled = true;
      const textoOriginal = btnUbi.textContent;
      btnUbi.textContent = 'Buscando…';
      decir('Your browser will ask for location permission.', 'cargando');

      navigator.geolocation.getCurrentPosition(
        function (pos) {
          btnUbi.disabled = false;
          btnUbi.textContent = textoOriginal;

          const { latitude: lat, longitude: lng } = pos.coords;
          const cerca = masCercano(lat, lng);

          if (cerca.km > LEJOS_KM) {
            // No es de Sevilla: la caja a casa le sirve más que recoger
            decir(
              'Estás a ' + Math.round(cerca.km) + ' km de nuestro local más cercano. ' +
                'From there it\'s not worth the trip: we\'ll ship a box to your door.',
              'lejos'
            );
            const enlace = document.createElement('a');
            enlace.href = '#cajas';
            enlace.className = 'ubi-enlace';
            enlace.textContent = 'Ver las cajas Órale en Casa';
            estado.appendChild(document.createElement('br'));
            estado.appendChild(enlace);
            return;
          }

          decir(
            'Tu local más cercano es ' + LOCALES[cerca.indice].nombre +
              ', a ' + formatoKm(cerca.km) + '.',
            'ok'
          );
          elegirLocal(cerca.indice, cerca.km);
        },
        function (err) {
          btnUbi.disabled = false;
          btnUbi.textContent = textoOriginal;

          let msg;
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'No permission given, so choose your location below.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'We couldn\'t work out where you are. Pick it yourself below.';
          } else {
            msg = 'That took too long. Choose your location below.';
          }
          decir(msg, 'error');
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }

  // Selector manual
  $$('.ubi-manual button').forEach(function (b) {
    b.addEventListener('click', function () {
      decir('');
      elegirLocal(Number(b.dataset.local), null);
      const acc = $('#paso-acc');
      if (acc) acc.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });

  // ¿Lo recordábamos de otra visita?
    // ?local=remedios (o sanLuis / sevillaEste / 0-2) preselecciona el local:
  // sirve para enlaces y QR por local (flyers, Instagram de cada tienda).
  const porUrl = new URLSearchParams(location.search).get('local');
  const idxUrl = porUrl == null ? -1 : LOCALES.findIndex((l, i) => l.clave === porUrl || String(i) === porUrl);
  if (idxUrl >= 0) {
    elegirLocal(idxUrl, null);
  } else
try {
    const guardado = localStorage.getItem(MEMORIA);
    if (guardado !== null && LOCALES[Number(guardado)]) {
      elegirLocal(Number(guardado), null);
      decir('We\'ve kept your location from last time. Change it if you like.', 'ok');
    }
  } catch (e) {
    /* sin localStorage: simplemente no recordamos nada */
  }

  /* ─────────────── Botones de pedir de cada ficha de local ─────────────── */

  $$('.loc').forEach(function (art) {
    const local = LOCALES[Number(art.dataset.local)];
    if (!local) return;
    enlazar(art.querySelector('[data-loc-recoger]'), urlRecoger(local), 'pedidos para recoger');

    enlazar(art.querySelector('[data-loc-uber]'), CONFIG.uber[local.clave] || '', 'pedidos a Uber Eats');
    const g = art.querySelector('[data-loc-glovo]');
    if (g) {
      g.hidden = !CONFIG.glovo.activo;
      enlazar(g, CONFIG.glovo.activo ? CONFIG.glovo[local.clave] || '' : '', 'pedidos a Glovo');
    }
  });

  /* ───────────── Enlaces sueltos configurables (cajas, uber, wa) ───────────── */

  // Mientras no exista la tienda de cajas, el botón abre un correo ya
  // redactado: así no hay botones muertos y os llega la demanda real.
  const pedirCajaPorCorreo = (caja) =>
    'mailto:' + CONFIG.contactoEmail +
    '?subject=' + encodeURIComponent('Quiero la ' + caja) +
    '&body=' + encodeURIComponent('Hola, quiero pedir la ' + caja + '.\n\nNombre:\nDirección de entrega:\nFecha en la que la quiero:\nTeléfono:');

  const SUELTOS = {
    caja2: [() => CONFIG.cajas.pareja || pedirCajaPorCorreo('Caja Pareja'), 'la Caja Pareja'],
    caja4: [() => CONFIG.cajas.tribu || pedirCajaPorCorreo('Caja Tribu'), 'la Caja Tribu'],
    caja6: [() => CONFIG.cajas.reunion || pedirCajaPorCorreo('Caja Reunión'), 'la Caja Reunión'],
    uber: [() => CONFIG.uber.remedios || CONFIG.uber.sanLuis || CONFIG.uber.sevillaEste, 'Uber Eats'],
    glovo: [() => (CONFIG.glovo.activo ? CONFIG.glovo.remedios || CONFIG.glovo.sanLuis || CONFIG.glovo.sevillaEste : ''), 'Glovo'],
    wa: [() => (CONFIG.whatsapp ? 'https://wa.me/' + CONFIG.whatsapp : ''), 'WhatsApp'],
  };

  $$('[data-cfg]').forEach(function (el) {
    const par = SUELTOS[el.dataset.cfg];
    if (!par) return;
    enlazar(el, par[0](), par[1]);
  });

  /* ───────────────────── Validación compartida ───────────────────── */

  function validar(form) {
    let primerFallo = null;

    form.querySelectorAll('[required]').forEach(function (input) {
      const campo = input.closest('.field, .check');
      if (!campo) return;

      const mal =
        input.type === 'checkbox'
          ? !input.checked
          : !input.value.trim() ||
            (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));

      campo.classList.toggle('bad', mal);
      if (mal && !primerFallo) primerFallo = input;
    });

    if (primerFallo) primerFallo.focus();
    return !primerFallo;
  }

  // Quitar el error en cuanto el usuario corrige
  document.addEventListener('input', function (e) {
    const campo = e.target.closest('.field, .check');
    if (campo && campo.classList.contains('bad')) campo.classList.remove('bad');
  });
  document.addEventListener('change', function (e) {
    if (e.target.type !== 'checkbox') return;
    const campo = e.target.closest('.check');
    if (campo && e.target.checked) campo.classList.remove('bad');
  });

  /* ───────────────── Reserva de mesa → WhatsApp ───────────────── */

  const formRes = $('#res-form');

  if (formRes) {
    const dia = formRes.querySelector('input[name="dia"]');
    if (dia) {
      const hoy = new Date();
      const iso = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
      dia.min = iso;
      dia.value = iso;
    }

    formRes.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validar(formRes)) return;

      const d = Object.fromEntries(new FormData(formRes).entries());
      const [a, m, day] = d.dia.split('-');
      const localRes = LOCALES.find((l) => String(d.local).indexOf(l.nombre) === 0);
      const clave = localRes ? localRes.clave : '';
      const pieRes = $('#res-foot');

      const lineas = [
        '¡Hola ' + CONFIG.negocio + '! Quiero reservar mesa.',
        '',
        'Nombre: ' + d.nombre,
        'Local: ' + d.local,
        'Día: ' + day + '/' + m + '/' + a,
        'Hora: ' + d.hora,
        'Personas: ' + d.pax,
        'Teléfono: ' + d.tel,
      ];
      if (d.notas && d.notas.trim()) lineas.push('', 'Nota: ' + d.notas.trim());
      const texto = lineas.join('\n');

      if (CONFIG.whatsapp) {
        abrir('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto));
        return;
      }

      const tel = clave ? CONFIG.telefonos[clave] || '' : '';
      const telHtml = tel
        ? ' Para confirmar al momento, llama a ' + localRes.nombre + ': <a href="tel:+34' + tel + '">' + formatoTel(tel) + '</a>.'
        : '';

      // 1) El local tiene reserva online (Last App): se abre y listo
      const online = clave ? CONFIG.reservas[clave] || '' : '';
      if (online) {
        abrir(online);
        if (pieRes) {
          pieRes.innerHTML = 'Se ha abierto la reserva online de ' + localRes.nombre + ' en otra pestaña. Termínala allí.' + telHtml;
          pieRes.className = 'f-foot es-ok';
        }
        return;
      }

      // 2) Si no, correo ya redactado al local + teléfono a la vista
      window.location.href =
        'mailto:' + CONFIG.contactoEmail +
        '?subject=' + encodeURIComponent('Reserva · ' + d.local + ' · ' + day + '/' + m) +
        '&body=' + encodeURIComponent(texto);
      if (pieRes) {
        pieRes.innerHTML = 'We\'ve left the email written for you, just send it.' + telHtml;
        pieRes.className = 'f-foot es-ok';
      }
    });
  }

  /* ───────────────── Catering → email ───────────────── */

  const formCat = $('#cat-form');

  if (formCat) {
    const fecha = formCat.querySelector('input[name="fecha"]');
    if (fecha) {
      // el catering necesita 48-72h: no dejamos pedir para mañana
      const min = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      fecha.min = new Date(min.getTime() - min.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    }

    const pie = $('#cat-foot');
    const botonCat = $('#cat-enviar');

    function resumen(d) {
      return [
        'Nombre: ' + d.nombre,
        d.empresa ? 'Empresa: ' + d.empresa : null,
        'Email: ' + d.email,
        'Teléfono: ' + d.tel,
        '',
        'Tipo de evento: ' + d.tipo,
        'Fecha: ' + d.fecha.split('-').reverse().join('/'),
        'Personas: ' + d.pax,
        'Dónde: ' + d.lugar,
        d.mensaje && d.mensaje.trim() ? '\nCuenta: ' + d.mensaje.trim() : null,
      ]
        .filter(Boolean)
        .join('\n');
    }

    function exito() {
      formCat.innerHTML =
        '<div class="cat-ok">' +
        '<p class="cat-ok-t">Recibido</p>' +
        '<p>Te mandamos el presupuesto en menos de 24 horas, de lunes a viernes. ' +
        'Si corre prisa, escríbenos a <a href="mailto:' + CONFIG.cateringEmail + '">' +
        CONFIG.cateringEmail + '</a>.</p>' +
        '</div>';
      formCat.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    formCat.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validar(formCat)) return;

      const d = Object.fromEntries(new FormData(formCat).entries());

      // Sin endpoint configurado: abrimos el correo con todo escrito,
      // para que la petición no se pierda por no haber acabado el montaje.
      if (!CONFIG.cateringForm) {
        const asunto = 'Presupuesto catering · ' + d.pax + ' personas · ' + d.tipo;
        window.location.href =
          'mailto:' + CONFIG.cateringEmail +
          '?subject=' + encodeURIComponent(asunto) +
          '&body=' + encodeURIComponent(resumen(d));
        if (pie) {
          pie.textContent =
            'Se ha abierto tu correo con el mensaje escrito. Dale a enviar y listo.';
          pie.className = 'f-foot es-ok';
        }
        return;
      }

      botonCat.disabled = true;
      botonCat.textContent = 'Sending…';

      fetch(CONFIG.cateringForm, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(formCat),
      })
        .then(function (r) {
          if (!r.ok) throw new Error('respuesta ' + r.status);
          exito();
        })
        .catch(function () {
          botonCat.disabled = false;
          botonCat.textContent = 'Get a quote';
          if (pie) {
            pie.innerHTML =
              'No hemos podido enviarlo. Escríbenos directamente a ' +
              '<a href="mailto:' + CONFIG.cateringEmail + '">' + CONFIG.cateringEmail + '</a>.';
            pie.className = 'f-foot es-error';
          }
        });
    });
  }

  /* ───────────────────────── Cosas menores ───────────────────────── */

  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  const burger = $('#burger');
  const mobnav = $('#mobnav');

  if (burger && mobnav) {
    burger.addEventListener('click', function () {
      const abierto = mobnav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(abierto));
      burger.setAttribute('aria-label', abierto ? 'Close menu' : 'Open menu');
    });
    mobnav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        mobnav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Aparición al hacer scroll.
     Si el navegador sabe animar ligado al scroll (Chrome, Edge, Safari 26+),
     se lo dejamos a CSS: va más suave y no ocupa el hilo principal.
     Si no, tiramos del observador de siempre. */
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollNativo =
    window.CSS && CSS.supports && CSS.supports('animation-timeline', 'view()');

  const SELECTOR_REVEAL =
    '.sec-head, .paso, .cat, .shots figure, .neon-copy, .plan, .envios, .loc, ' +
    '.cat-form-in > *, .res-in > *, .oficio-in > *, .fresco-copy';

  if (!reducir && scrollNativo) {
    $$(SELECTOR_REVEAL).forEach((el) => el.classList.add('rv-css'));
  } else if (!reducir && 'IntersectionObserver' in window) {
    const objetivos = $$(SELECTOR_REVEAL);
    objetivos.forEach((el) => el.classList.add('rv'));

    const io = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    objetivos.forEach((el) => io.observe(el));
  }
})();

/* ═══════════════════════════════════════════════════════════
   Capa 2030: alto real de la cabecera, navegación de la carta
   y barra de pedido fija en móvil.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  /* ── Alto real de la cabecera ──
     Hay dos barras pegajosas (la cabecera y las categorías de la carta).
     Para que la segunda se pare justo debajo de la primera, y para que al
     saltar a una categoría no quede tapada, medimos el alto de verdad en
     vez de dejarlo a ojo en el CSS. */
  const nav = $('.nav');

  function medirNav() {
    if (!nav) return;
    document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
  }
  medirNav();
  window.addEventListener('resize', medirNav, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medirNav);

  /* ── Categoría activa en la carta ──
     Se marca la que estás leyendo y la chapa se desplaza sola para que
     siempre quede a la vista, aunque la lista se salga por la derecha. */
  /* ── La carta filtra, no salta ──
     Antes se veían las siete categorías seguidas: 24 platos, seis pantallas
     de scroll. Ahora se ve una cada vez, que es como funciona una carta de
     verdad y como lo hacen las cadenas que van bien. */
  const filtros = $$('.carta-nav [data-cat]');
  const categorias = $$('.cat[id]');

  if (filtros.length && categorias.length) {
    const carril = $('.carta-nav-in');

    const mostrar = (id, mover) => {
      categorias.forEach((c) => { c.hidden = c.id !== id; });
      filtros.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === id)));

      const activo = filtros.find((b) => b.dataset.cat === id);
      if (activo && carril) {
        carril.scrollTo({ left: activo.offsetLeft - carril.offsetLeft - 16, behavior: 'smooth' });
      }

      /* Al cambiar de categoría la página se encoge y el visitante se queda
         mirando el pie. Lo devolvemos al principio de la carta. */
      if (mover) {
        const barra = $('.carta-nav');
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
        const y = barra.getBoundingClientRect().top + window.scrollY - navH - 24;
        window.scrollTo({
          top: y,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
      }
    };

    filtros.forEach((b) => b.addEventListener('click', () => mostrar(b.dataset.cat, true)));

    // arranca en burritos, que es el 45% de lo que venden
    mostrar('cat-burritos', false);

    // un enlace directo a una categoría la abre
    const desdeHash = () => {
      const id = location.hash.slice(1);
      if (id && categorias.some((c) => c.id === id)) mostrar(id, true);
    };
    desdeHash();
    window.addEventListener('hashchange', desdeHash);
  }


  /* ── Barra de pedido fija (móvil) ──
     Aparece cuando la portada ya ha pasado: antes molesta, después ahorra
     al cliente tener que volver arriba para pedir. */
  const barra = $('#barra-pedido');
  const hero = $('.masthead');

  if (barra && hero) {
    // por posición y no con un observador: los observadores no reaccionan
    // a los saltos largos (pulsar un ancla, restaurar el scroll)
    const revisar = () => {
      const pasada = window.scrollY > hero.offsetHeight * 0.9;
      barra.classList.toggle('dentro', pasada);
    };

    let pendiente = false;
    const pedirRevision = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        revisar();
      });
    };

    revisar();
    window.addEventListener('scroll', pedirRevision, { passive: true });
    window.addEventListener('resize', pedirRevision, { passive: true });
    window.addEventListener('pageshow', revisar);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) revisar();
    });
  }

  /* La barra refleja el local elegido arriba, sin duplicar la lógica:
     escucha la chapa de la cabecera, que ya la mantiene el otro módulo. */
  const chipNombre = $('#chip-local-nombre');
  const bpLocal = $('#bp-local');

  if (chipNombre && bpLocal) {
    const sincronizar = () => {
      const n = chipNombre.textContent.trim();
      bpLocal.textContent = n ? 'Recoger en ' + n : 'Choose your location';
    };
    sincronizar();
    new MutationObserver(sincronizar).observe(chipNombre, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
})();

/* ═══════════════════════════════════════════════════════════
   Vídeo de portada.

   Es un <video> nuestro, no un embed. Ventajas frente a YouTube:
   no hay barra de título ni logo que tapar, no se le manda un
   visitante a otra web, no hay cookies de terceros y carga antes.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const video = document.getElementById('hero-video');
  const ctrl = document.getElementById('video-ctrl');
  if (!video || !ctrl) return;

  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Si el visitante ha pedido reducir movimiento, o lleva el ahorro de
     datos activado, no arrancamos: se queda el póster, que es la foto
     del burrito. Nadie se gasta 3 MB de su tarifa sin pedirlo. */
  const ahorroDatos =
    navigator.connection && navigator.connection.saveData === true;

  if (reducir || ahorroDatos) {
    video.removeAttribute('autoplay');
    video.preload = 'none';
    return;
  }

  video.play().then(
    function () {
      ctrl.hidden = false;
    },
    function () {
      /* Algún navegador puede bloquear el arranque automático aunque
         esté silenciado. Entonces enseñamos el botón para darle al play
         a mano, en vez de dejar una foto muerta. */
      ctrl.hidden = false;
      ctrl.setAttribute('aria-pressed', 'true');
      ctrl.querySelector('.visually-hidden').textContent = 'Play the video';
    }
  );

  ctrl.addEventListener('click', function () {
    const pausado = video.paused;
    if (pausado) video.play();
    else video.pause();
    ctrl.setAttribute('aria-pressed', String(!pausado));
    ctrl.querySelector('.visually-hidden').textContent = pausado
      ? 'Pause the video'
      : 'Play the video';
  });

  /* Si la pestaña se va a segundo plano, paramos: no tiene sentido
     gastar batería reproduciendo algo que nadie está viendo. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) video.pause();
    else if (ctrl.getAttribute('aria-pressed') === 'false') video.play();
  });
})();

/* ═══════════════════════════════════════════════════════════
   Bowls, botón de subir, valoraciones y alta en el club.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  /* ── Pestañas de los Nudes ── */
  const tabs = $$('.bowls-tabs [role="tab"]');

  if (tabs.length) {
    const mostrar = (elegida) => {
      tabs.forEach((t) => {
        const suya = t === elegida;
        t.setAttribute('aria-selected', String(suya));
        t.tabIndex = suya ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !suya;
      });
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => mostrar(t));
      // flechas para moverse entre pestañas, como manda el patrón
      t.addEventListener('keydown', (e) => {
        const paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!paso) return;
        e.preventDefault();
        const siguiente = tabs[(i + paso + tabs.length) % tabs.length];
        mostrar(siguiente);
        siguiente.focus();
      });
    });
  }

  /* ── Valoraciones ──
     Solo se pinta lo que esté relleno en CONFIG. Glovo no puntúa sobre
     cinco sino en porcentaje, así que cada plataforma trae su formato. */
  const NOTAS = { uber: 'nota-uber', glovo: 'nota-glovo', google: 'nota-google' };

  Object.keys(NOTAS).forEach(function (clave) {
    const el = document.getElementById(NOTAS[clave]);
    if (!el) return;

    const dato = (CONFIG.notas && CONFIG.notas[clave]) || null;
    const fila = el.closest('li');
    const estrellas = fila && fila.querySelector('.notas-est');
    const pie = fila && fila.querySelector('.notas-pie');

    // sin dato no se enseña nada: inventarse una nota es publicidad engañosa
    if (!dato || !dato.valor) {
      if (fila) fila.hidden = true;
      return;
    }

    if (dato.tipo === 'porcentaje') {
      el.textContent = dato.valor + ' %';
      if (estrellas) estrellas.hidden = true;
    } else {
      el.textContent = dato.valor;
      if (estrellas) {
        const n = Math.round(parseFloat(String(dato.valor).replace(',', '.')) || 0);
        estrellas.textContent = '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
      }
    }
    if (pie && dato.pie) pie.textContent = dato.pie;
  });

  const tira = $('.notas');
  if (tira && $$('.notas-lista li:not([hidden])').length === 0) tira.hidden = true;

  /* ── Botón de subir ── */
  const subir = $('#subir');

  if (subir) {
    const revisar = () => {
      subir.hidden = window.scrollY < window.innerHeight;
    };

    let pendiente = false;
    const pedir = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        revisar();
      });
    };

    revisar();
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('pageshow', revisar);

    subir.addEventListener('click', function () {
      const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' });
    });
  }

  /* ── Alta en My Órale Padre ── */
  /* ── El club vive en Last App si lo habéis activado ── */
  const panelLast = $('#club-lastapp');
  const formClub = $('#club-form');

  if (panelLast && CONFIG.club && CONFIG.club.altaLastApp) {
    panelLast.hidden = false;
    const enlace = $('#club-lastapp-btn');
    if (enlace) enlace.href = CONFIG.club.altaLastApp;
    if (formClub) formClub.hidden = true;
  }

  if (formClub) {
    formClub.addEventListener('submit', function (e) {
      e.preventDefault();

      let primerFallo = null;
      formClub.querySelectorAll('[required]').forEach(function (input) {
        const campo = input.closest('.field, .check');
        if (!campo) return;
        const mal =
          input.type === 'checkbox'
            ? !input.checked
            : !input.value.trim() ||
              (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
        campo.classList.toggle('bad', mal);
        if (mal && !primerFallo) primerFallo = input;
      });
      if (primerFallo) {
        primerFallo.focus();
        return;
      }

      const d = Object.fromEntries(new FormData(formClub).entries());
      const pie = $('#club-foot');
      const boton = $('#club-enviar');

      const listo = () => {
        formClub.innerHTML =
          '<div class="cat-ok"><p class="cat-ok-t">Apuntado</p>' +
          '<p>Te escribimos en cuanto abramos el club, con tus dos tacos ' +
          'de bienvenida.</p></div>';
      };

      if (!CONFIG.clubForm) {
        const cuerpo = [
          'Join My Órale Padre',
          '',
          'Nombre: ' + d.nombre,
          'Email: ' + d.email,
          'Teléfono: ' + d.tel,
          d.cumple ? 'Cumpleaños: ' + d.cumple : null,
          'Local: ' + d.local,
        ]
          .filter(Boolean)
          .join('\n');

        window.location.href =
          'mailto:' + CONFIG.clubEmail +
          '?subject=' + encodeURIComponent('Alta My Órale Padre · ' + d.nombre) +
          '&body=' + encodeURIComponent(cuerpo);

        if (pie) {
          pie.textContent = 'Your email app has opened with the sign-up written. Hit send and we\'ll let you know when the club opens.';
          pie.className = 'f-foot mono es-ok';
        }
        return;
      }

      boton.disabled = true;
      boton.textContent = 'Sending…';

      fetch(CONFIG.clubForm, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(formClub),
      })
        .then((r) => {
          if (!r.ok) throw new Error(r.status);
          listo();
        })
        .catch(() => {
          boton.disabled = false;
          boton.textContent = 'I want my points';
          if (pie) {
            pie.innerHTML =
              'No hemos podido enviarlo. Escríbenos a <a href="mailto:' +
              CONFIG.clubEmail + '">' + CONFIG.clubEmail + '</a>.';
            pie.className = 'f-foot mono es-error';
          }
        });
    });
  }
})();

/* ═══════════════════════════════════════════════════════════
   Ficha ampliada.

   Capa propia, no <dialog>. El elemento nativo va bien en mi
   navegador pero se estaba cerrando mal en el del cliente, y no
   conseguí reproducirlo. Con una capa normal el comportamiento
   es el mismo en todas partes y no depende de nada del host.

   Cuatro formas de salir, a propósito: la X, el botón Cerrar,
   la tecla Escape y tocar fuera.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const capa = document.getElementById('ficha');
  const carta = document.querySelector('.carta');
  if (!capa || !carta) return;

  const caja = capa.querySelector('.ficha-caja');
  const media = document.getElementById('ficha-media');
  let ultimoBoton = null;

  function abrir(plato, boton) {
    const foto = plato.querySelector('.plato-foto img');
    const sinFoto = plato.querySelector('.plato-sinfoto span');

    media.innerHTML = '';
    if (foto) {
      const img = document.createElement('img');
      img.src = foto.currentSrc || foto.src;
      img.alt = foto.alt;
      media.appendChild(img);
      media.className = 'ficha-media';
    } else {
      const t = document.createElement('span');
      t.textContent = sinFoto ? sinFoto.textContent : '';
      media.appendChild(t);
      media.className = 'ficha-media ficha-media-sin';
    }

    const nombreEl = plato.querySelector('.plato-nombre');
    const chapa = nombreEl.querySelector('.tag');
    const guindillas = nombreEl.querySelector('.picante');

    const copia = nombreEl.cloneNode(true);
    copia.querySelectorAll('.tag, .picante').forEach((x) => x.remove());

    document.getElementById('ficha-nombre').textContent = copia.textContent.trim();
    document.getElementById('ficha-precio').innerHTML =
      plato.querySelector('.plato-precio').textContent +
      (chapa ? ' <em class="tag ' + chapa.className.replace('tag ', '') + '">' + chapa.textContent + '</em>' : '') +
      (guindillas ? ' ' + guindillas.outerHTML : '');
    document.getElementById('ficha-desc').textContent =
      plato.querySelector('.plato-desc') ? plato.querySelector('.plato-desc').textContent : '';
    document.getElementById('ficha-alergenos').textContent =
      plato.querySelector('.plato-alergenos').textContent;

    ultimoBoton = boton;
    capa.hidden = false;
    document.body.classList.add('sin-scroll');
    caja.scrollTop = 0;
    document.getElementById('ficha-cerrar').focus();
  }

  function cerrar() {
    if (capa.hidden) return;
    capa.hidden = true;
    document.body.classList.remove('sin-scroll');
    if (ultimoBoton) ultimoBoton.focus();
  }

  carta.addEventListener('click', function (e) {
    const boton = e.target.closest('.plato-mas');
    if (!boton) return;
    e.preventDefault();
    abrir(boton.closest('.plato'), boton);
  });

  // 1) la X y el botón Cerrar
  capa.addEventListener('click', function (e) {
    if (e.target.closest('#ficha-cerrar') || e.target.closest('[data-cierra-ficha]')) {
      cerrar();
      return;
    }
    // 2) tocar fuera de la tarjeta
    if (!e.target.closest('.ficha-caja')) cerrar();
  });

  // 3) Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cerrar();
  });

  // al ir a pedir, se cierra sola
  document.getElementById('ficha-pedir').addEventListener('click', cerrar);
})();

/* ═══════════════════════════════════════════════════════════
   Chat "What should I get?"

   Abajo a la derecha, cerrado por defecto. No salta solo al
   entrar: un asistente que se abre sin permiso molesta más de
   lo que ayuda.

   Por dentro no es un chat de verdad: son tres preguntas y un
   emparejamiento con reglas sobre la carta real. Responde al
   instante, no cuesta dinero por consulta y nunca recomienda un
   plato que no existe — que es justo lo que hace un modelo de
   lenguaje suelto sobre una carta.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const lanza = document.getElementById('chat-lanza');
  const panel = document.getElementById('chat');
  const hilo = document.getElementById('chat-hilo');
  const pie = document.getElementById('chat-pie');
  if (!lanza || !panel || !hilo || !pie) return;

  /* proteína · picante (0 nada, 1 medio, 2 mucho) · formato */
  const PLATOS = [
    ['Don Juárez',        'cerdo',   0, 'burrito', '9,95 €', 'Arroz, pulled pork BBQ, frijoles, pico de gallo, guacamole, totopos, lechuga y crema agria.'],
    ['Doña Dolores',      'ternera', 2, 'burrito', '9,95 €', 'Arroz, carne, chipotle, frijoles, cheddar, pico de gallo, guacamole, lechuga y salsa verde.'],
    ['Pollo Pastor',      'pollo',   1, 'burrito', '9,95 €', 'Arroz, pollo al pastor, salsa verde, frijoles, pico de gallo, guacamole, totopos, mix de quesos y crema agria.'],
    ['Lady Cochinita',    'cerdo',   2, 'burrito', '9,95 €', 'Arroz, cochinita pibil, chipotle, frijoles, piña, guacamole, lechuga, crema agria y pico de gallo.'],
    ['Black Chancho',     'cerdo',   0, 'burrito', '9,95 €', 'Arroz, carrillada ibérica, salsa lima, pico de gallo, cebolla encurtida, patatas paja y salsa verde.'],
    ['Don Hampi',         'pollo',   0, 'burrito', '9,95 €', 'Arroz, pollo deshilachado, mayo coco, pico de gallo, guacamole, totopos y lechuga.'],
    ['Don Brasa',         'pollo',   0, 'burrito', '9,95 €', 'Pollo braseado con frijoles, arroz, pico de gallo, lechuga, guacamole y crema agria.'],
    ['Pollo Padre',       'pollo',   0, 'burrito', '9,95 €', 'Arroz, pollo empanado, mayo coco, cheddar, cebolla encurtida, ensalada de maíz risketos, lechuga y salsa agria.'],
    ['Doña Juana',        'vegetal', 0, 'burrito', '9,95 €', 'Arroz, Heura vegetal, lechuga, frijoles, pico de gallo, guacamole y salsa verde.'],
    ['Nachos Guadalupe',  'cerdo',   0, 'picar',   '10,50 €','Totopos con pulled pork BBQ, cheddar, queso gratinado, pico de gallo, guacamole y crema agria.'],
    ['Nachos Cienfuegos', 'ternera', 0, 'picar',   '9,90 €', 'Totopos con queso gratinado, cheddar, frijoles, carne sazonada, guacamole, crema agria y pico de gallo.'],
    ['Bacon Cheese Apachurradas','cerdo',0,'picar','6,95 €', 'Patatas al horno con ranchera, bacon y 4 quesos gratinados.'],
    ['Alitas Padre',      'pollo',   0, 'picar',   '6,90 €', 'Alitas BBQ al horno con mayo-lima y crujiente de totopos.'],
    ['Quesadilla Pulled Pork','cerdo',0,'picar',   '8,95 €', 'Pulled pork BBQ con 4 quesos fundentes, dorada al punto en grill.'],
    ['Quesadilla Butter Chicken','pollo',0,'picar','8,95 €', 'Pollo a la mantequilla con mezcla de 4 quesos cremosos.'],
    ['Baby Cochinita',    'cerdo',   1, 'tacos',   '9,90 €', 'Cochinita pibil a baja temperatura, guacamole casero y 4 quesos.'],
    ['Taco Chancho',      'cerdo',   0, 'tacos',   '9,90 €', 'Carrillada casera, 4 quesos, cebolla encurtida y salsa mayo lima.'],
    ['Don Pastor',        'pollo',   1, 'tacos',   '9,90 €', 'Pollo pastor, cebolla morada, cilantro, 4 quesos y mayo chipotle.'],
    ['Desnudo Juárez',    'cerdo',   0, 'bowl',    '9,90 €', 'Arroz, pulled pork BBQ, pico de gallo, guacamole, totopos, lechuga y crema agria.'],
    ['Desnudo Dolores',   'ternera', 2, 'bowl',    '9,90 €', 'Arroz, carne, chipotle, frijoles, cheddar, pico de gallo, guacamole, lechuga y salsa verde.'],
    ['Desnudo Cochinita', 'cerdo',   1, 'bowl',    '9,90 €', 'Arroz, cochinita, chipotle, frijoles, piña, guacamole, lechuga, crema agria y pico de gallo.'],
  ];

  const PREGUNTAS = [
    { k: 'prote', t: 'What are you in the mood for?', ops: [
      ['cerdo', 'Cerdo a fuego lento'], ['pollo', 'Pollo'],
      ['ternera', 'Ternera'], ['vegetal', 'Sin carne'],
    ]},
    { k: 'picante', t: 'And how about heat?', ops: [
      [0, 'Nada, gracias'], [1, 'Un puntito'], [2, 'The more the better'],
    ]},
    { k: 'formato', t: 'Last one: how do you want it?', ops: [
      ['burrito', 'Envuelto, en burrito'], ['bowl', 'En bowl, sin tortilla'],
      ['tacos', 'De tres en tres, tacos'], ['picar', 'Para picar y compartir'],
    ]},
  ];

  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const respuestas = {};
  let paso = 0;
  let arrancado = false;

  function burbuja(texto, quien, html) {
    const div = document.createElement('div');
    div.className = 'burbuja burbuja-' + quien;
    if (html) div.innerHTML = texto;
    else div.textContent = texto;
    hilo.appendChild(div);
    hilo.scrollTop = hilo.scrollHeight;
    return div;
  }

  /* Un respiro entre mensajes para que se lea como una conversación
     y no como un volcado. Sin él parece un formulario disfrazado. */
  function esperar(ms) {
    return new Promise((r) => setTimeout(r, reducir ? 0 : ms));
  }

  async function escribiendo(ms) {
    if (reducir) return;
    const b = burbuja('<span></span><span></span><span></span>', 'ellos', true);
    b.classList.add('burbuja-puntos');
    await esperar(ms);
    b.remove();
  }

  function opciones(lista) {
    pie.innerHTML = '';
    lista.forEach(function (op) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-op';
      b.textContent = op.texto;
      b.addEventListener('click', op.hacer);
      pie.appendChild(b);
    });
  }

  async function preguntar() {
    const p = PREGUNTAS[paso];
    pie.innerHTML = '';
    await escribiendo(500);
    burbuja(p.t, 'ellos');

    opciones(
      p.ops.map(function (op) {
        return {
          texto: op[1],
          hacer: async function () {
            respuestas[p.k] = op[0];
            burbuja(op[1], 'tu');
            pie.innerHTML = '';
            paso += 1;
            if (paso < PREGUNTAS.length) await preguntar();
            else await resolver();
          },
        };
      })
    );
  }

  async function resolver() {
    await escribiendo(700);

    const puntuados = PLATOS.map(function (pl) {
      const [nombre, prote, pic, form, precio, desc] = pl;
      let p = 0;
      if (form === respuestas.formato) p += 4;
      if (prote === respuestas.prote) p += 4;
      p += 2 - Math.abs(pic - respuestas.picante);
      return { nombre, precio, desc, prote, pic, form, p };
    }).sort((a, b) => b.p - a.p);

    const gana = puntuados[0];
    const otro = puntuados.find((x) => x.nombre !== gana.nombre && x.p >= gana.p - 2);

    const motivos = [];
    if (gana.form === respuestas.formato) motivos.push('the format you wanted');
    if (gana.prote === respuestas.prote) motivos.push('the protein you asked for');
    if (gana.pic === respuestas.picante) motivos.push('el punto de picante justo');

    burbuja('Lo tuyo es esto:', 'ellos');

    burbuja(
      '<b class="chat-plato">' + gana.nombre + '</b>' +
      '<span class="chat-precio mono">' + gana.precio + '</span>' +
      '<span class="chat-desc">' + gana.desc + '</span>' +
      (motivos.length ? '<span class="chat-motivo mono">Lleva ' + motivos.join(', ') + '.</span>' : ''),
      'ellos',
      true
    );

    if (otro) {
      await esperar(400);
      burbuja('Si no te convence, el otro que te pega es ' + otro.nombre + '.', 'ellos');
    }

    opciones([
      { texto: 'Pedirlo', hacer: function () {
          cerrar();
          document.getElementById('pedir').scrollIntoView({ behavior: reducir ? 'auto' : 'smooth' });
        }},
      { texto: 'Probar otra vez', hacer: function () { reiniciar(); } },
    ]);
  }

  async function reiniciar() {
    paso = 0;
    hilo.innerHTML = '';
    pie.innerHTML = '';
    burbuja('Órale! Tell me three things and I\'ll tell you what to order.', 'ellos');
    await esperar(350);
    await preguntar();
  }

  function abrir() {
    panel.hidden = false;
    lanza.setAttribute('aria-expanded', 'true');
    lanza.classList.add('chat-lanza-abierto');
    if (!arrancado) {
      arrancado = true;
      reiniciar();
    }
    const primera = pie.querySelector('button');
    if (primera) primera.focus();
  }

  function cerrar() {
    panel.hidden = true;
    lanza.setAttribute('aria-expanded', 'false');
    lanza.classList.remove('chat-lanza-abierto');
    lanza.focus();
  }

  lanza.addEventListener('click', function () {
    if (panel.hidden) abrir();
    else cerrar();
  });
  document.getElementById('chat-cerrar').addEventListener('click', cerrar);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) cerrar();
  });

  // los botones repartidos por la página también lo abren
  document.querySelectorAll('[data-abre-chat]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (panel.hidden) abrir();
    });
  });
})();

/* ═══════════════════════════════════════════════════════════
   Pestañas de "Big orders".

   Cajas a casa y catering eran dos secciones seguidas de casi
   dos pantallas cada una, contando lo mismo a dos públicos
   distintos. Ahora comparten sitio: el visitante elige cuál le
   toca en vez de scrollear la que no le interesa.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const tabs = Array.from(document.querySelectorAll('.grupos-tabs [role="tab"]'));
  if (!tabs.length) return;

  const mostrar = (elegida, mover) => {
    tabs.forEach((t) => {
      const suya = t === elegida;
      t.setAttribute('aria-selected', String(suya));
      t.tabIndex = suya ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !suya;
    });
    if (mover) {
      const sec = document.getElementById('grupos');
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
      window.scrollTo({
        top: sec.getBoundingClientRect().top + window.scrollY - navH - 20,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => mostrar(t, false));
    t.addEventListener('keydown', (e) => {
      const paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!paso) return;
      e.preventDefault();
      const sig = tabs[(i + paso + tabs.length) % tabs.length];
      mostrar(sig, false);
      sig.focus();
    });
  });

  /* Los enlaces viejos siguen llevando a donde deben: si alguien entra
     con #catering, le abrimos esa pestaña en vez de dejarle en cajas. */
  const porHash = () => {
    if (location.hash === '#catering') mostrar(tabs[1], true);
    else if (location.hash === '#cajas') mostrar(tabs[0], true);
  };
  porHash();
  window.addEventListener('hashchange', porHash);
})();

/* ═══════════════════════════════════════════════════════════
   Ficha nutricional de los bowls.

   Solo se pinta lo que esté relleno en CONFIG.nutricion. Si falta
   un dato, la ficha entera avisa de que está pendiente en vez de
   enseñar guiones sueltos que parezcan un error.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const UNIDAD = { kcal: ' kcal', prote: ' g', hc: ' g', grasa: ' g' };

  document.querySelectorAll('.nutri').forEach(function (ficha) {
    const datos = (CONFIG.nutricion && CONFIG.nutricion[ficha.dataset.bowl]) || {};
    let completos = 0;

    ficha.querySelectorAll('[data-n]').forEach(function (dd) {
      const v = datos[dd.dataset.n];
      if (v) {
        dd.textContent = v + (UNIDAD[dd.dataset.n] || '');
        completos += 1;
      }
    });

    const nota = ficha.querySelector('.nutri-nota');
    if (completos === 0) {
      // nada relleno: mejor decirlo claro que enseñar cuatro rayas
      ficha.classList.add('nutri-pendiente');
      if (nota) nota.textContent = 'We\'re working them out. Ask us in store.';
    } else if (nota) {
      nota.textContent = CONFIG.nutricion.estimado
        ? 'Values estimated from the recipe, not measured in a lab.'
        : 'Average values per serving. They may vary with how it\'s built.';
      if (CONFIG.nutricion.estimado) ficha.classList.add('nutri-estimado');
    }
  });
})();

/* ═══════════════════════════════════════════════════════════
   Pedido para recoger, sin pago en la web.

   El catálogo no se duplica: se lee directo de las fichas reales
   de la carta (nombre, precio, foto), así que si cambiáis un
   precio en el HTML, el pedido lo hereda solo.

   Al enviar: se abre WhatsApp con el pedido ya escrito, al número
   del local elegido, y si hay Formspree configurado se manda
   también una copia por email. No hay cobro ni factura aquí —
   eso sigue pasando en el TPV físico cuando el cliente recoge.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const capa = $('#pedido');
  const abrirBtn = $('#acc-recoger');
  if (!capa || !abrirBtn) return;
  if (!CONFIG.pedidoPropio) return; // apagado: "Pick-up" enlaza a Last App

  const NOMBRES_LOCAL = { sanLuis: 'San Luis', remedios: 'Los Remedios', sevillaEste: 'Sevilla Este' };

  /* ── 1) Leer el catálogo real de la carta ── */

  function precioNum(txt) {
    const m = txt.replace(/\s/g, '').match(/(\d+,\d+)/);
    return m ? parseFloat(m[1].replace(',', '.')) : 0;
  }

  function leerCatalogo() {
    const cats = [];
    $$('.carta .cat[id]').forEach((sec) => {
      const titulo = sec.querySelector('.cat-head h3');
      if (!titulo) return;
      const nombreCat = titulo.textContent.trim();
      const items = [];
      sec.querySelectorAll('.plato').forEach((pl, i) => {
        const nombreEl = pl.querySelector('.plato-nombre');
        const precioEl = pl.querySelector('.plato-precio');
        if (!nombreEl || !precioEl) return;
        const copia = nombreEl.cloneNode(true);
        copia.querySelectorAll('.tag, .picante').forEach((x) => x.remove());
        items.push({
          id: sec.id + '-' + i,
          nombre: copia.textContent.trim(),
          precio: precioNum(precioEl.textContent),
          precioTxt: precioEl.textContent.trim(),
        });
      });
      if (items.length) cats.push({ id: sec.id, nombre: nombreCat, items });
    });
    return cats;
  }

  let CATALOGO = null; // se construye la primera vez que se abre

  /* ── 2) Estado de la cesta ── */

  const cesta = new Map(); // id -> { nombre, precio, precioTxt, cantidad }

  function formatoEuro(n) {
    return n.toFixed(2).replace('.', ',') + ' €';
  }

  function totalCesta() {
    let t = 0;
    cesta.forEach((it) => (t += it.precio * it.cantidad));
    return t;
  }

  function cambiarCantidad(item, delta) {
    const actual = cesta.get(item.id);
    const nueva = (actual ? actual.cantidad : 0) + delta;
    if (nueva <= 0) cesta.delete(item.id);
    else cesta.set(item.id, { ...item, cantidad: nueva });
    pintarCesta();
    actualizarContadores(); // sin reconstruir la lista: ver por qué abajo
  }

  /* Solo toca el número de cada fila, sin volver a crear los botones.
     Si esto reconstruyera todo el catálogo (como hacía antes), el propio
     botón que acabas de pulsar quedaría desconectado del documento a
     mitad de su propio evento de clic. Entonces, cuando ese clic sigue
     burbujeando hasta la capa para comprobar "¿fue fuera de la caja?",
     closest() ya no encuentra ningún padre —porque no tiene— y cierra
     el pedido por error en el primer "+" que se pulsa. Pasó de verdad
     en las pruebas: por eso el contador se actualiza a mano. */
  function actualizarContadores() {
    zonaItems.querySelectorAll('.pedido-item').forEach((fila) => {
      const boton = fila.querySelector('.pedido-mas');
      const id = boton && boton.dataset.id;
      if (!id) return;
      const enCesta = cesta.get(id);
      fila.querySelector('.pedido-cant').textContent = enCesta ? enCesta.cantidad : 0;
    });
  }

  /* ── 3) Pintar catálogo y filtro de categorías ── */

  const zonaNav = $('#pedido-cat-nav');
  const zonaItems = $('#pedido-items');
  let catActiva = null;

  function pintarNav() {
    // se construye una sola vez; cambiar de categoría después solo marca
    // qué botón está activo, nunca reconstruye la barra (mismo motivo que
    // en actualizarContadores: reconstruir el botón que acabas de pulsar
    // lo desconecta a mitad de su propio clic y cierra el pedido solo).
    if (zonaNav.childElementCount === CATALOGO.length) {
      marcarCategoriaActiva();
      return;
    }
    zonaNav.innerHTML = '';
    CATALOGO.forEach((cat) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = cat.nombre;
      b.dataset.cat = cat.id;
      b.setAttribute('role', 'tab');
      b.addEventListener('click', () => {
        catActiva = cat.id;
        marcarCategoriaActiva();
        pintarCatalogo();
      });
      zonaNav.appendChild(b);
    });
    marcarCategoriaActiva();
  }

  function marcarCategoriaActiva() {
    zonaNav.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.cat === catActiva));
    });
  }

  function pintarCatalogo() {
    const cat = CATALOGO.find((c) => c.id === catActiva) || CATALOGO[0];
    zonaItems.innerHTML = '';
    cat.items.forEach((item) => {
      const enCesta = cesta.get(item.id);
      const fila = document.createElement('div');
      fila.className = 'pedido-item';
      fila.innerHTML =
        '<div class="pedido-item-txt"><b>' + item.nombre + '</b><span class="mono">' + item.precioTxt + '</span></div>' +
        '<div class="pedido-item-acc">' +
        '<button type="button" class="pedido-menos" aria-label="Quitar uno de ' + item.nombre + '">&minus;</button>' +
        '<span class="pedido-cant">' + (enCesta ? enCesta.cantidad : 0) + '</span>' +
        '<button type="button" class="pedido-mas" data-id="' + item.id + '" aria-label="Añadir uno de ' + item.nombre + '">&plus;</button>' +
        '</div>';
      fila.querySelector('.pedido-mas').addEventListener('click', () => cambiarCantidad(item, 1));
      fila.querySelector('.pedido-menos').addEventListener('click', () => cambiarCantidad(item, -1));
      zonaItems.appendChild(fila);
    });
  }

  function pintarCesta() {
    const zona = $('#pedido-cesta-lista');
    if (cesta.size === 0) {
      zona.innerHTML = '<p class="pedido-cesta-vacia mono">Todavía no has añadido nada.</p>';
    } else {
      zona.innerHTML = '';
      cesta.forEach((it) => {
        const fila = document.createElement('div');
        fila.className = 'pedido-cesta-fila';
        fila.innerHTML =
          '<span class="pedido-cesta-cant mono">' + it.cantidad + '&times;</span>' +
          '<span class="pedido-cesta-nombre">' + it.nombre + '</span>' +
          '<span class="pedido-cesta-precio mono">' + formatoEuro(it.precio * it.cantidad) + '</span>';
        zona.appendChild(fila);
      });
    }
    $('#pedido-total').textContent = formatoEuro(totalCesta());
  }

  /* ── 4) Abrir / cerrar ── */

  function abrir() {
    if (!CATALOGO) {
      CATALOGO = leerCatalogo();
      catActiva = CATALOGO[0] && CATALOGO[0].id;
    }
    pintarNav();
    pintarCatalogo();
    pintarCesta();

    // si ya se eligió local en el paso 1, lo precargamos aquí
try {
      const guardado = localStorage.getItem('orale_local');
      const claves = ['sanLuis', 'remedios', 'sevillaEste'];
      if (guardado !== null && claves[Number(guardado)]) {
        $('#pedido-local').value = claves[Number(guardado)];
      }
    } catch (e) {
      /* sin localStorage, se elige a mano */
    }

    // hora mínima: quince minutos a partir de ahora, no antes
    const horaInput = $('#pedido-hora');
    const min = new Date(Date.now() + 15 * 60000);
    horaInput.min = min.toTimeString().slice(0, 5);
    if (!horaInput.value) horaInput.value = min.toTimeString().slice(0, 5);

    capa.hidden = false;
    document.body.classList.add('sin-scroll');
  }

  function cerrar() {
    capa.hidden = true;
    document.body.classList.remove('sin-scroll');
  }

  abrirBtn.addEventListener('click', (e) => {
    e.preventDefault(); // con el carrito activo, el enlace a Last App no navega
    abrir();
  });
  $('#pedido-cerrar').addEventListener('click', cerrar);
  capa.addEventListener('click', (e) => {
    if (!e.target.closest('.pedido-caja')) cerrar();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !capa.hidden) cerrar();
  });

  /* ── 5) Enviar ── */

  const form = $('#pedido-form');
  const pie = $('#pedido-foot');
  const botonEnviar = $('#pedido-enviar');

  function componerTexto(d, local) {
    const lineas = [
      '¡Hola ' + NOMBRES_LOCAL[local] + '! Quiero hacer un pedido para recoger.',
      '',
    ];
    cesta.forEach((it) => lineas.push(it.cantidad + '× ' + it.nombre + '  (' + formatoEuro(it.precio * it.cantidad) + ')'));
    lineas.push('', 'Total aprox.: ' + formatoEuro(totalCesta()), '');
    lineas.push('Nombre: ' + d.nombre);
    lineas.push('Teléfono: ' + d.tel);
    lineas.push('Hora de recogida: ' + d.hora);
    if (d.notas && d.notas.trim()) lineas.push('Nota: ' + d.notas.trim());
    return lineas.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (cesta.size === 0) {
      alert('Todavía no has añadido nada a la cesta. Elige al menos un plato.');
      return;
    }

    let primerFallo = null;
    form.querySelectorAll('[required]').forEach((input) => {
      const campo = input.closest('.field');
      if (!campo) return;
      const mal = !input.value.trim();
      campo.classList.toggle('bad', mal);
      if (mal && !primerFallo) primerFallo = input;
    });
    if (primerFallo) {
      primerFallo.focus();
      return;
    }

    const d = Object.fromEntries(new FormData(form).entries());
    const numero = CONFIG.pedidoWhatsapp[d.local];
    const texto = componerTexto(d, d.local);

    // copia por email, si hay Formspree configurado — no bloquea el envío por WhatsApp
    if (CONFIG.pedidoForm) {
      const fd = new FormData();
      fd.set('local', NOMBRES_LOCAL[d.local]);
      fd.set('pedido', texto);
      fetch(CONFIG.pedidoForm, { method: 'POST', headers: { Accept: 'application/json' }, body: fd }).catch(() => {});
    }

    if (numero) {
      window.open('https://wa.me/' + numero + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
      pie.textContent = 'Se ha abierto WhatsApp con tu pedido. Dale a enviar y listo.';
      pie.className = 'mono f-foot es-ok';
    } else {
      // San Luis, mientras no tenga WhatsApp confirmado
      window.location.href =
        'mailto:' + CONFIG.pedidoEmail +
        '?subject=' + encodeURIComponent('Pedido para recoger · ' + NOMBRES_LOCAL[d.local]) +
        '&body=' + encodeURIComponent(texto);
      pie.textContent = 'Este local todavía no tiene WhatsApp de pedidos: se ha abierto tu correo. Si corre prisa, llama directamente al local.';
      pie.className = 'mono f-foot es-error';
    }
  });
})();
