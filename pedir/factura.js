/* ÓRALE PADRE · factura completa (con NIF del cliente)
   La usan /opinion (el cliente la pide desde el QR del ticket) y el admin.
   · OP.nifValido(texto): DNI, NIE o CIF español con su control (igual que en la base de datos).
   · OP.facturaHTML(f): la factura lista para ver e imprimir (A4 o PDF desde el móvil).
   · OP.facturas: pedir / consultar (Supabase o, en modo demo, este navegador). */
(function () {
  'use strict';
  const OP = window.OP || (window.OP = {});
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = c => ((c || 0) / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  const fecha = d => new Date(d).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric' });

  function nifValido(t) {
    const n = String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); const L = 'TRWAGMYFPDXBNJZSQVHLCKE';
    if (/^\d{8}[A-Z]$/.test(n)) return L[+n.slice(0, 8) % 23] === n[8];
    if (/^[XYZ]\d{7}[A-Z]$/.test(n)) return L[+('XYZ'.indexOf(n[0]) + n.slice(1, 8)) % 23] === n[8];
    if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(n)) {
      let s = 0; for (let i = 1; i <= 7; i++) { let x = +n[i]; if (i % 2) { x *= 2; s += Math.floor(x / 10) + x % 10; } else s += x; }
      const c = (10 - s % 10) % 10; return n[8] === String(c) || n[8] === 'JABCDEFGHI'[c];
    }
    return false;
  }

  function facturaHTML(f) {
    const e = f.emisor || {}, c = f.cliente || {};
    const lineas = (f.lineas || []).map(l => `<tr><td>${l.cantidad}</td><td>${esc(l.nombre)}${(l.opciones || []).length ? `<small>${l.opciones.map(o => esc(o.nombre)).join(', ')}</small>` : ''}</td>
      <td class="n">${l.iva || 10} %</td><td class="n">${eur(l.unitario)}</td><td class="n">${eur(l.unitario * l.cantidad)}</td></tr>`).join('');
    const iva = (f.desglose_iva || []).map(d => `<tr><td>Base imponible al ${d.tipo} %</td><td class="n">${eur(d.base)}</td></tr><tr><td>IVA ${d.tipo} %</td><td class="n">${eur(d.cuota)}</td></tr>`).join('');
    return `<article class="factura">
      <header><div><b class="fx-marca">ÓRALE PADRE</b><div>${esc(e.razon_social)}</div><div>NIF ${esc(e.cif)}</div><div>${esc(e.direccion)}</div>
          ${e.local ? `<div class="fx-gris">${esc(e.local)}${e.direccion_local ? ' · ' + esc(e.direccion_local) : ''}</div>` : ''}</div>
        <div class="fx-num"><b>FACTURA</b><div>Nº <b>${esc(f.numero)}</b></div><div>Fecha: ${fecha(f.fecha)}</div></div></header>
      <section class="fx-cli"><small>Cliente</small><b>${esc(c.nombre)}</b><div>NIF ${esc(c.nif)}</div><div>${esc(c.direccion)}</div><div>${esc(c.cp)} ${esc(c.poblacion)}</div></section>
      <table class="fx-lineas"><thead><tr><th>Uds.</th><th>Concepto</th><th class="n">IVA</th><th class="n">Precio</th><th class="n">Importe</th></tr></thead><tbody>${lineas}</tbody></table>
      <table class="fx-tot">${f.descuento ? `<tr><td>Descuento</td><td class="n">−${eur(f.descuento)}</td></tr>` : ''}${iva}
        <tr class="fx-total"><td>TOTAL</td><td class="n">${eur(f.total)}</td></tr></table>
      <p class="fx-nota">Factura emitida en sustitución de la factura simplificada ${esc(f.ticket)} del ${fecha(f.ticket_fecha)}. Precios con IVA incluido.</p>
    </article>`;
  }
  const css = document.createElement('style');
  css.textContent = `
    .factura{background:#fff;color:#111;font:14px/1.45 Arial,Helvetica,sans-serif;padding:28px;border:1px solid #ddd;border-radius:10px;max-width:760px;margin:0 auto}
    .factura header{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:2px solid #111;padding-bottom:14px}
    .factura .fx-marca{font-size:20px;letter-spacing:.5px}.factura .fx-gris{color:#666;font-size:12px}
    .factura .fx-num{text-align:right}.factura .fx-num>b{font-size:22px}
    .factura .fx-cli{margin:16px 0;padding:12px 14px;background:#f5f5f5;border-radius:6px}.factura .fx-cli small{display:block;color:#666;text-transform:uppercase;font-size:11px}
    .factura table{width:100%;border-collapse:collapse}.factura .n{text-align:right;white-space:nowrap}
    .factura .fx-lineas th{text-align:left;border-bottom:1px solid #111;padding:6px 4px;font-size:12px}.factura .fx-lineas td{padding:6px 4px;border-bottom:1px solid #eee;vertical-align:top}
    .factura .fx-lineas small{display:block;color:#666}
    .factura .fx-tot{width:min(320px,100%);margin:14px 0 0 auto}.factura .fx-tot td{padding:4px}.factura .fx-total td{font-weight:800;font-size:17px;border-top:2px solid #111;padding-top:8px}
    .factura .fx-nota{color:#555;font-size:12px;margin:18px 0 0}
    @media print{ body.imprimiendo-factura > *:not(.zona-factura){display:none!important} body.imprimiendo-factura .zona-factura{display:block!important}
      body.imprimiendo-factura .zona-factura > *:not(.factura){display:none!important} .factura{border:0;padding:0;max-width:none} @page{size:A4;margin:16mm} }`;
  document.head.appendChild(css);
  function imprimirFactura(el) {   // el: el contenedor que tiene dentro la .factura
    el.classList.add('zona-factura'); document.body.classList.add('imprimiendo-factura');
    const fin = () => { document.body.classList.remove('imprimiendo-factura'); window.removeEventListener('afterprint', fin); };
    window.addEventListener('afterprint', fin); window.print(); setTimeout(fin, 1500);
  }

  // Datos: Supabase con la clave pública (las funciones sólo dejan ver la factura de ESE ticket), o demo.
  const DEMO = !!OP.DEMO;
  let sb = null;
  const cli = () => sb || (sb = window.supabase.createClient(OP.CONFIG.supabaseUrl, OP.CONFIG.supabaseKey));
  const ok = ({ data, error }) => { if (error) throw error; return data; };
  const lee = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const facturas = DEMO ? {
    async deTicket(id) {
      const f = lee('op-demo-facturas', []).find(x => x._ticket === id); if (f) return f;
      const t = lee('op-demo-tickets', []).find(x => x.id === id); if (!t) return null;
      return { ticket: t.serie + '-' + String(t.numero).padStart(6, '0'), fecha: t.fecha, total: t.total, local: t.local, puede: t.total > 0 };
    },
    async pedir(id, d) {
      const ya = lee('op-demo-facturas', []).find(x => x._ticket === id); if (ya) return { ...ya, ya: true };
      const t = lee('op-demo-tickets', []).find(x => x.id === id); if (!t) throw new Error('FACTURA: no encontramos ese ticket');
      if (!nifValido(d.nif)) throw new Error('FACTURA: el NIF/CIF no es válido (revisa letras y números). Si es extranjero, pídela en el local');
      const fs = lee('op-demo-facturas', []);
      const f = { _ticket: id, numero: 'F' + t.serie + '-' + String(fs.length + 1).padStart(6, '0'), fecha: new Date().toISOString(),
        ticket: t.serie + '-' + String(t.numero).padStart(6, '0'), ticket_fecha: t.fecha, emisor: t.emisor,
        cliente: { ...d, nif: String(d.nif).toUpperCase().replace(/[^A-Z0-9]/g, '') }, lineas: t.lineas, bruto: t.bruto, descuento: t.descuento || 0,
        total: t.total, desglose_iva: t.desglose_iva, local: t.local, _creada: new Date().toISOString() };
      fs.push(f); try { localStorage.setItem('op-demo-facturas', JSON.stringify(fs)); } catch (e) {}
      return { ...f, ya: false };
    },
  } : {
    async deTicket(id) { return ok(await cli().rpc('factura_de_ticket', { p_ticket: id })); },
    async pedir(id, d) { return ok(await cli().rpc('solicitar_factura', { p_ticket: id, p_datos: d })); },
  };
  Object.assign(OP, { nifValido, facturaHTML, imprimirFactura, facturas });
})();
