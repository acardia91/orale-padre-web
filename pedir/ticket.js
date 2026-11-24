/* ÓRALE PADRE · impresión en térmica de 80 mm (TPV y comandas).
   OP.imprimir(html) pinta en #ticket y lanza la impresión del navegador.
   Con Chrome abierto con --kiosk-printing sale directo, sin diálogo. */
(function () {
  'use strict';
  const { euros } = window.OP;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fecha = d => new Date(d).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const css = document.createElement('style');
  css.textContent = `
    #ticket{display:none}
    @media print{
      @page{size:80mm auto;margin:0}
      html,body{background:#fff!important;color:#000!important;padding:0!important;margin:0!important}
      body > *:not(#ticket){display:none!important}
      #ticket{display:block!important;width:72mm;margin:0 auto;padding:3mm 0 6mm;font:11pt/1.3 Arial,Helvetica,sans-serif;color:#000}
      #ticket .c{text-align:center}
      #ticket .g{font-size:15pt;font-weight:800}
      #ticket .num{font-size:38pt;font-weight:800;line-height:1}
      #ticket hr{border:0;border-top:1px dashed #000;margin:2mm 0}
      #ticket .l{display:flex;justify-content:space-between;gap:2mm}
      #ticket .op{padding-left:5mm;font-size:10pt}
      #ticket .nota{padding-left:5mm;font-weight:800}
      #ticket .tot{font-size:14pt;font-weight:800}
      #ticket .peq{font-size:8pt;word-break:break-all}
    }`;
  document.head.appendChild(css);
  function caja() {
    let el = document.getElementById('ticket');
    if (!el) { el = document.createElement('div'); el.id = 'ticket'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); }
    return el;
  }
  function imprimir(html) { caja().innerHTML = html; window.print(); }

  const lineasHTML = (lineas, precios = true) => lineas.map(l => `
    <div class="l"><span><b>${l.cantidad}×</b> ${esc(l.nombre)}</span>${precios ? `<span>${euros(l.unitario * l.cantidad)}</span>` : ''}</div>
    ${(l.opciones || []).map(o => `<div class="op">+ ${esc(o.nombre)}</div>`).join('')}
    ${l.nota ? `<div class="nota">!! ${esc(l.nota)}</div>` : ''}`).join('');

  /** Comanda para cocina: sin precios, letra grande. */
  function comanda(p, local) {
    return `
      <div class="c"><b>ÓRALE PADRE · ${esc((local || '').replace(/^Órale Padre\s*/, '').toUpperCase())}</b></div>
      <div class="c g">${p.canal === 'sala' ? esc(p.mesa || 'SALA') : 'PARA RECOGER · WEB'}</div>
      <div class="c num">#${p.numero}</div>
      ${p.canal !== 'sala' ? `<div class="c"><b>${esc(p.cliente_nombre)}</b> · ${esc(p.cliente_tel || '')}</div>` : ''}
      <div class="c">${p.canal === 'sala' ? 'Marchada' : 'Recogida'}: <b>${fecha(p.canal === 'sala' ? p.creado : p.recogida).slice(-5)}</b></div>
      <hr>${lineasHTML(p.lineas, false)}
      ${p.notas ? `<hr><div class="nota">NOTA: ${esc(p.notas)}</div>` : ''}
      <hr><div class="c peq">Comanda interna · no es factura</div>`;
  }

  /** Pre-cuenta: lo que se lleva a la mesa antes de cobrar. */
  function precuenta(nombre, lineas, total) {
    return `
      <div class="c g">ÓRALE PADRE</div>
      <div class="c">${esc(nombre)} · ${fecha(new Date())}</div>
      <hr>${lineasHTML(lineas)}
      <hr><div class="l tot"><span>TOTAL</span><span>${euros(total)}</span></div>
      <div class="c peq">IVA incluido · Pre-cuenta, no es factura</div>`;
  }

  /** Factura simplificada. */
  function factura(t) {
    const e = t.emisor || {};
    return `
      <div class="c g">ÓRALE PADRE</div>
      <div class="c">${esc(e.razon_social)} · NIF ${esc(e.cif)}</div>
      <div class="c peq">${esc(e.direccion)}</div>
      ${e.local ? `<div class="c peq">${esc(e.local)}${e.direccion_local ? ' · ' + esc(e.direccion_local) : ''}</div>` : ''}
      <hr>
      <div class="c"><b>FACTURA SIMPLIFICADA ${esc(t.serie)}-${String(t.numero).padStart(6, '0')}</b></div>
      <div class="c">${fecha(t.fecha)}</div>
      <hr>${lineasHTML(t.lineas)}
      ${t.descuento ? `<hr><div class="l"><span>Subtotal</span><span>${euros(t.bruto)}</span></div>
        <div class="l"><span>Dto. ${esc(t.promocion ? t.promocion.nombre : '')}${t.promocion && t.promocion.nota ? ' (' + esc(t.promocion.nota) + ')' : ''}</span><span>−${euros(t.descuento)}</span></div>` : ''}
      <hr><div class="l tot"><span>TOTAL</span><span>${euros(t.total)}</span></div>
      ${t.desglose_iva.map(d => `<div class="l"><span>Base ${d.tipo}%: ${euros(d.base)}</span><span>IVA ${euros(d.cuota)}</span></div>`).join('')}
      <hr>
      <div class="l"><span>${{ efectivo: 'Efectivo', tarjeta: 'Tarjeta', invitacion: 'Invitación' }[t.metodo] || t.metodo}</span><span>${euros(t.metodo === 'efectivo' ? t.entregado : t.total)}</span></div>
      ${t.metodo === 'efectivo' ? `<div class="l"><span>Cambio</span><span>${euros(t.cambio)}</span></div>` : ''}
      <hr><div class="c">¡Gracias, padre! · oralepadre.com</div>
      ${valorar(t)}
      <div class="c peq">Huella: ${esc(t.hash.slice(0, 16))}</div>`;
  }

  // "¿Qué tal?" con QR que lleva a valorar ESTE ticket (si la librería de QR está cargada).
  function valorar(t) {
    const url = 'https://www.oralepadre.com/opinion/?t=' + t.id;
    if (window.qrcode && t.id) {
      try { const q = window.qrcode(0, 'L'); q.addData(url); q.make();
        return `<div class="c peq">¿Qué tal? Valóranos:</div><div class="c">${q.createSvgTag({ cellSize: 3, margin: 0 })}</div>`; } catch (e) {}
    }
    return '<div class="c peq">¿Qué tal? Cuéntanoslo en<br><b>oralepadre.com/opinion</b></div>';
  }

  Object.assign(window.OP, { imprimir, ticketComanda: comanda, ticketPrecuenta: precuenta, ticketFactura: factura });
})();
