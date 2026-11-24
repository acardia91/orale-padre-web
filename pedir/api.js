/* ═══════════════════════════════════════════════════════════
   ÓRALE PADRE · capa de datos de pedidos
   Compartida por /pedir (clientes) y /comandas (cocina).

   Dos modos:
   · Supabase (real): pedidos en la base de datos, tiempo real.
   · Demo (?demo en la URL o sin Supabase configurado): todo vive en
     localStorage de este navegador y las pestañas se avisan entre sí.
     Sirve para probar el flujo completo sin tocar la base de datos.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const CONFIG = {
    supabaseUrl: 'https://pnpmigcbqgcggtkfkqeh.supabase.co',
    supabaseKey: 'sb_publishable_O52yBoiZ7mtqR4Y1E6JsjQ_L8pK_mUZ',
    // Ponedlo a true cuando hayáis pegado supabase/01-pedidos.sql y subido la carta.
    supabaseListo: true,
  };

  const DEMO = !CONFIG.supabaseListo || new URLSearchParams(location.search).has('demo');

  const ERRORES = {
    CERRADO: 'Ahora mismo no estamos aceptando pedidos online.',
    HORA: 'Esa hora de recogida ya no está disponible. Elige otra.',
    AGOTADO: 'Algo de tu pedido se ha agotado.',
    LIMITE: 'Ya tienes pedidos en marcha. Llámanos si necesitas más.',
  };
  function mensajeError(e) {
    const txt = String((e && (e.message || e.msg)) || e || '');
    const m = txt.match(/^([A-Z]+): (.*)$/);
    return m ? m[2] : (ERRORES[txt] || 'No se ha podido enviar el pedido. Inténtalo de nuevo o llámanos.');
  }

  /* ── Utilidades de horario (hora de Madrid) ───────────────── */
  const TZ = 'Europe/Madrid';
  function partesMadrid(d) {
    const f = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' }).formatToParts(d);
    const o = {}; f.forEach(p => { o[p.type] = p.value; });
    const dias = { lun: 1, mar: 2, mié: 3, jue: 4, vie: 5, sáb: 6, dom: 7 };
    return { y: +o.year, m: +o.month, d: +o.day, hh: +o.hour, mm: +o.minute,
             dow: dias[o.weekday.replace('.', '')] || 0, fecha: `${o.year}-${o.month}-${o.day}` };
  }
  function hhmm(d) { const p = partesMadrid(d); return String(p.hh).padStart(2, '0') + ':' + String(p.mm).padStart(2, '0'); }
  function enHorario(horario, d) {
    const p = partesMadrid(d);
    const t = String(p.hh).padStart(2, '0') + ':' + String(p.mm).padStart(2, '0');
    return (horario[String(p.dow)] || []).some(([a, b]) => t >= a && t <= b);
  }
  /** Franjas de recogida de hoy, cada 10 minutos, desde ahora + minutos de preparación. */
  function franjas(local, ahora = new Date()) {
    const out = []; const min = new Date(ahora.getTime() + local.minutos_prep * 60000);
    const t = new Date(min); t.setSeconds(0, 0);
    t.setMinutes(Math.ceil(t.getMinutes() / 10) * 10);
    const hoy = partesMadrid(ahora).fecha;
    for (let i = 0; i < 144 && partesMadrid(t).fecha === hoy; i++, t.setMinutes(t.getMinutes() + 10)) {
      if (enHorario(local.horario, t)) out.push(new Date(t));
    }
    return out;
  }

  /* ── Cálculo de precios (igual que en el servidor) ─────────── */
  function indexar(carta) {
    const prod = new Map(carta.productos.map(p => [p.id, p]));
    const grupos = new Map(carta.grupos.map(g => [g.id, g]));
    const catDe = new Map();
    carta.categorias.forEach(c => c.productos.forEach(id => catDe.set(id, c)));
    return { prod, grupos, catDe };
  }
  // enLocal = consumo en sala: usa "precio_local" si el producto lo tiene (precio distinto por canal).
  function precioLinea(idx, linea, enLocal = false) {
    const p = idx.prod.get(linea.producto);
    let u = enLocal && Number.isInteger(p.precio_local) ? p.precio_local : p.precio;
    (linea.opciones || []).forEach(oid => {
      p.grupos.forEach(gid => { const o = idx.grupos.get(gid).opciones.find(x => x.id === oid); if (o) u += o.precio; });
    });
    return u;
  }
  /** Lo que el servidor guarda como foto fija de cada línea. */
  function fotoLineas(carta, lineas, agotados = new Set(), dow, paraLlevar = true) {
    const idx = indexar(carta);
    return lineas.map(l => {
      const p = idx.prod.get(l.producto);
      if (!p) throw new Error('PRODUCTO: un producto ya no está en la carta');
      if (p.agotado || agotados.has(p.id)) throw new Error(`AGOTADO: ${p.nombre} se ha agotado`);
      const cat = idx.catDe.get(p.id);
      if (dow && cat && cat.dias && !cat.dias.includes(dow)) throw new Error(`DIA: ${p.nombre} no está disponible hoy`);
      const opciones = [];
      (l.opciones || []).forEach(oid => {
        let hit = null;
        p.grupos.forEach(gid => { const o = idx.grupos.get(gid).opciones.find(x => x.id === oid); if (o) hit = { id: o.id, grupo: gid, nombre: o.nombre, precio: o.precio }; });
        if (!hit) throw new Error(`EXTRA: un extra no es válido para ${p.nombre}`);
        opciones.push(hit);
      });
      p.grupos.forEach(gid => {
        const g = idx.grupos.get(gid); const n = opciones.filter(o => o.grupo === gid).length;
        if (n < g.min || n > g.max) throw new Error(`EXTRA: revisa "${g.nombre}" en ${p.nombre}`);
      });
      return { producto: p.id, nombre: p.nombre, cantidad: l.cantidad, unitario: precioLinea(idx, l, !paraLlevar), opciones,
               iva: p.alcohol && paraLlevar ? 21 : 10, nota: l.nota || null };
    });
  }

  /* ── Ticket: total y desglose de IVA (igual que cobrar() en el servidor) ── */
  /** Descuento de una promoción sobre unas líneas (igual que descuento_promo() en el servidor). */
  function descuentoPromo(promo, lineas) {
    const bruto = lineas.reduce((s, l) => s + l.unitario * l.cantidad, 0);
    if (!promo) return 0;
    let d = 0;
    if (promo.tipo === 'porcentaje') d = Math.round(bruto * promo.valor / 100);
    else if (promo.tipo === 'importe') d = Math.min(promo.valor, bruto);
    else {
      let quedan = promo.unidades;
      lineas.filter(l => (promo.productos || []).includes(l.producto)).sort((a, b) => a.unitario - b.unitario).forEach(l => {
        if (quedan <= 0) return; const u = Math.min(l.cantidad, quedan); d += l.unitario * u; quedan -= u;
      });
    }
    return Math.max(0, Math.min(d, bruto));
  }
  /* ── Ticket: total y desglose de IVA (igual que cobrar() en el servidor) ── */
  function calculaTicket(lineas, promo) {
    const porTipo = {};
    lineas.forEach(l => { const t = l.iva || 10; porTipo[t] = (porTipo[t] || 0) + l.unitario * l.cantidad; });
    const bruto = Object.values(porTipo).reduce((a, b) => a + b, 0);
    const descuento = descuentoPromo(promo, lineas);
    // El descuento se reparte entre tipos de IVA en proporción; el resto va al tipo con más importe.
    const tipos = Object.keys(porTipo).map(Number);
    const reparto = Object.fromEntries(tipos.map(t => [t, bruto ? Math.round(descuento * porTipo[t] / bruto) : 0]));
    const mayor = tipos.slice().sort((a, b) => porTipo[b] - porTipo[a])[0];
    if (mayor != null) reparto[mayor] += descuento - Object.values(reparto).reduce((a, b) => a + b, 0);
    const desglose = tipos.sort((a, b) => a - b).map(tipo => {
      const neto = porTipo[tipo] - reparto[tipo]; const base = Math.round(neto / (1 + tipo / 100));
      return { tipo, base, cuota: neto - base };
    });
    return { bruto, descuento, total: bruto - descuento, desglose };
  }
  async function sha256(txt) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  /* ══ Modo demo ════════════════════════════════════════════ */
  const K = { pedidos: 'op-demo-pedidos', locales: 'op-demo-locales', agotados: 'op-demo-agotados',
              cuentas: 'op-demo-cuentas', tickets: 'op-demo-tickets', mesas: 'op-demo-mesas', cartas: 'op-demo-cartas',
              promos: 'op-demo-promos' };
  const LOCAL_DEMO = {
    id: 'tomares', nombre: 'Órale Padre Tomares', telefono: null, direccion: 'Tomares (Sevilla)',
    acepta_pedidos: true, minutos_prep: 20, serie: 'TOM', pago_local: true, pago_online: true, acepta_reservas: true,
    razon_social: 'La Baba Hasta El Suelo S.L.', cif: 'B56488323', direccion_fiscal: 'Calle Japón 10, 41020 Sevilla',
    // En demo abrimos todo el día para poder probar a cualquier hora.
    horario: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(d => [String(d), [['00:00', '23:59']]])),
  };
  const lee = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch (e) { return def; } };
  const guarda = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ } };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());

  const oyentes = new Set();
  function avisa() { oyentes.forEach(f => f()); }
  window.addEventListener('storage', e => { if (Object.values(K).includes(e.key)) avisa(); });

  const demo = {
    modo: 'demo',
    async carta(local) {
      const propia = lee(K.cartas, {})[local]; if (propia) return propia;
      const r = await fetch(`/pedir/carta-${local}.json`, { cache: 'no-cache' }); return r.json();
    },
    async guardarCarta(local, datos) { const c = lee(K.cartas, {}); c[local] = datos; guarda(K.cartas, c); avisa(); return new Date().toISOString(); },
    async subirFoto(local, archivo) {
      // En demo la foto se guarda dentro de la carta como dataURL (pequeña).
      return await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(archivo); });
    },
    async guardarLocal(id, datos) { const l = lee(K.locales, {}); l[id] = { ...(l[id] || {}), ...datos }; guarda(K.locales, l); avisa(); },
    async staffDelLocal() { return [{ email: 'demo@oralepadre.com', rol: 'encargado', ultimo_acceso: new Date().toISOString(), alta: new Date().toISOString() }]; },
    async usuariosEquipo() { return [{ email: 'demo@oralepadre.com', ultimo_acceso: new Date().toISOString(), accesos: { tomares: 'encargado', 'san-luis': 'encargado' }, app_interna: false },
      { email: 'camarero@oralepadre.com', ultimo_acceso: null, accesos: { tomares: 'sala' }, app_interna: false },
      { email: 'cocinero@oralepadre.com', ultimo_acceso: null, accesos: {}, app_interna: true }]; },
    async anadirStaff() { throw new Error('USUARIO: en modo demo no se pueden añadir usuarios'); },
    async cambiarRol() { throw new Error('USUARIO: en modo demo no se pueden cambiar roles'); },
    async quitarStaff() { throw new Error('USUARIO: en modo demo no se pueden quitar usuarios'); },
    async promociones(local) {
      const g = lee(K.promos, {}); if (g[local]) return g[local];
      const carta = await this.carta(local);
      const tacos = carta.productos.filter(p => /^taco /i.test(p.nombre)).map(p => p.id);
      return [
        { id: 'p-emp', codigo: 'EMPLEADOS', nombre: 'Oferta para empleados', tipo: 'porcentaje', valor: 50, productos: [], unidades: 1, requiere_nota: true, activa: true },
        { id: 'p-soc', codigo: 'SOCIOS', nombre: 'Oferta para socios', tipo: 'porcentaje', valor: 100, productos: [], unidades: 1, requiere_nota: true, activa: true },
        { id: 'p-pit', codigo: 'LOSMASPITUFOS', nombre: 'Patrocinio Futsal', tipo: 'porcentaje', valor: 20, productos: [], unidades: 1, requiere_nota: false, activa: true },
        { id: 'p-tac', codigo: 'TUSTACOS', nombre: '2 tacos órale por venir a vernos', tipo: 'producto', valor: 0, productos: tacos, unidades: 2, requiere_nota: false, activa: true },
      ];
    },
    async guardarPromocion(local, promo) {
      const lista = await this.promociones(local);
      if (lista.some(x => x.codigo === promo.codigo.toUpperCase() && x.id !== promo.id)) throw new Error('PROMO: ya existe una promoción con ese código');
      const p = { ...promo, codigo: promo.codigo.toUpperCase(), id: promo.id || uuid() };
      const nueva = promo.id ? lista.map(x => x.id === promo.id ? p : x) : lista.concat(p);
      const g = lee(K.promos, {}); g[local] = nueva; guarda(K.promos, g); avisa(); return p.id;
    },
    async borrarPromocion(local, id) {
      const g = lee(K.promos, {}); g[local] = (await this.promociones(local)).filter(x => x.id !== id); guarda(K.promos, g); avisa();
    },
    async ticketsEntre(local, desde, hasta) { return lee(K.tickets, []).filter(t => t.local === local && t.fecha >= desde && t.fecha < hasta); },
    async deliveryEntre(desde, hasta) { return lee('op-demo-delivery', []).filter(r => r.fecha >= desde && r.fecha <= hasta); },
    async resumenesDelivery(desde, hasta) { return lee('op-demo-delivery-res', []).filter(r => r.fecha >= desde && r.fecha <= hasta).sort((a, b) => b.fecha.localeCompare(a.fecha)); },
    async guardarDelivery(filas, resumenes) {
      const c = v => v == null || v === '' ? null : Math.round(+v * 100);
      const ds = lee('op-demo-delivery', []); (filas || []).forEach(f => {
        const r = { local: f.local, fecha: f.fecha, plataforma: f.plataforma, pedidos: +f.pedidos || 0, ventas: c(f.ventas_eur) || 0, comision: c(f.comision_eur),
          anuncios: c(f.anuncios_eur), promociones: c(f.promociones_eur), neto: c(f.neto_eur), cancelados: f.cancelados ?? null, errores: f.errores ?? null,
          valoracion: f.valoracion ?? null, valoracion_tipo: f.valoracion_tipo || null, resenas: f.resenas ?? null, tiempo_prep: f.tiempo_prep ?? null, minutos_cerrado: f.minutos_cerrado ?? null, detalle: f.detalle || null };
        const i = ds.findIndex(x => x.local === r.local && x.fecha === r.fecha && x.plataforma === r.plataforma); if (i >= 0) ds[i] = r; else ds.push(r); });
      guarda('op-demo-delivery', ds);
      const rs = lee('op-demo-delivery-res', []); (resumenes || []).forEach(x => { const i = rs.findIndex(y => y.fecha === x.fecha && y.local === (x.local || 'general'));
        const r = { fecha: x.fecha, local: x.local || 'general', texto: x.texto, alertas: x.alertas || null }; if (i >= 0) rs[i] = r; else rs.push(r); });
      guarda('op-demo-delivery-res', rs); return { filas: (filas || []).length, resumenes: (resumenes || []).length };
    },
    async costes(local) { return lee('op-demo-costes', {})[local] || {}; },
    async guardarCostes(local, costes) { const t = lee('op-demo-costes', {}); t[local] = t[local] || {};
      costes.forEach(c => { if (c.coste == null) delete t[local][c.producto]; else t[local][c.producto] = { producto: c.producto, coste: c.coste, fuente: c.fuente }; });
      guarda('op-demo-costes', t); return costes.length; },
    async costesEscandallo() { return [{ nombre: 'Don Brasa', coste: 308 }, { nombre: 'Black Chancho', coste: 169 }, { nombre: 'Dona Dolores', coste: 191 }, { nombre: 'Pollo Padre', coste: 198 }]; },
    async pedidosEntre(local, desde, hasta) { return lee(K.pedidos, []).filter(p => p.local === local && p.creado >= desde && p.creado < hasta); },
    async ventasImportadasEntre() { return []; },
    async productosImportados() { return []; },
    async cuentasEntre(local, desde, hasta) { return lee(K.cuentas, []).filter(c => c.local === local && c.abierta >= desde && c.abierta < hasta); },
    async local(id) { return { ...LOCAL_DEMO, id, nombre: id === 'san-luis' ? 'Órale Padre San Luis' : LOCAL_DEMO.nombre, serie: id === 'san-luis' ? 'SLU' : 'TOM', ...(lee(K.locales, {})[id] || {}) }; },
    async agotados(local) { return new Set(lee(K.agotados, {})[local] || []); },
    async crearPedido({ local, nombre, tel, recogida, pago, notas, lineas, email }) {
      const loc = await this.local(local);
      if (!loc.acepta_pedidos) throw new Error('CERRADO: ahora mismo no estamos aceptando pedidos online');
      const carta = await this.carta(local);
      const snap = fotoLineas(carta, lineas, await this.agotados(local), partesMadrid(new Date(recogida)).dow);
      const todos = lee(K.pedidos, []);
      const dia = partesMadrid(new Date()).fecha;
      const numero = todos.filter(p => p.local === local && p.dia === dia).reduce((m, p) => Math.max(m, p.numero), 0) + 1;
      const ped = { id: uuid(), token: uuid(), local, numero, dia, canal: 'web', estado: pago === 'stripe' ? 'pendiente_pago' : 'nuevo',
        cliente_nombre: nombre, cliente_tel: tel, recogida: new Date(recogida).toISOString(), pago_metodo: pago,
        pagado: false, total: snap.reduce((s, l) => s + l.unitario * l.cantidad, 0), lineas: snap,
        notas: notas || null, creado: new Date().toISOString() };
      todos.push(ped); guarda(K.pedidos, todos); avisa();
      return { token: ped.token, numero, total: ped.total };
    },
    // En demo el "pago online" se da por hecho al momento.
    async iniciarPago(token) {
      const ps = lee(K.pedidos, []); const p = ps.find(x => x.token === token);
      if (p) { p.pagado = true; p.pago_metodo = 'stripe'; p.estado = 'nuevo'; guarda(K.pedidos, ps); avisa(); }
      return location.pathname + '?pedido=' + token + '&pago=ok&demo';
    },
    async localesConPedidos() { return [{ id: 'tomares', nombre: 'Órale Padre Tomares', acepta_pedidos: true, pago_online: true, pago_local: true, acepta_reservas: true }]; },
    async crearReserva(r) { const rs = lee('op-demo-reservas', []); const x = { ...r, id: uuid(), token: uuid(), telefono: r.tel, estado: 'confirmada', origen: r.origen || 'web', creado: new Date().toISOString(), fecha: new Date(r.fecha).toISOString(), personas: +r.personas }; rs.push(x); guarda('op-demo-reservas', rs); avisa(); return { token: x.token, id: x.id }; },
    async verReserva(token) { const r = lee('op-demo-reservas', []).find(x => x.token === token); return r ? { ...r, local: 'Órale Padre Tomares', cancelar_hasta: 60 } : null; },
    async horasReserva(local, dia, personas) {
      const L = await this.local(local); const c = L.reservas_config || {}; const esp = (lee('op-demo-especiales', {})[local] || {})[dia];
      if (esp && esp.cerrado) return [];
      const dow = ((new Date(dia + 'T12:00').getDay() + 6) % 7) + 1; const t = (esp && esp.turnos) || (c.turnos || {})[dow] || (L.horario || {})[dow] || [];
      const out = []; const rs = lee('op-demo-reservas', []).filter(r => r.local === local && r.estado !== 'cancelada');
      t.forEach(([a, b]) => { let [h, m] = a.split(':').map(Number); const [hf, mf] = b.split(':').map(Number);
        while (h * 60 + m <= hf * 60 + mf - ((c.turnos || {})[dow] ? 0 : 60)) { const f = new Date(`${dia}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
          if (f.getTime() > Date.now() + (c.antelacion || 60) * 60000) { const oc = rs.filter(r => Math.abs(new Date(r.fecha) - f) < (c.duracion || 90) * 60000).reduce((s, r) => s + r.personas, 0);
            out.push({ hora: f.toTimeString().slice(0, 5), fecha: f.toISOString(), libre: oc + (+personas || 2) <= (L.reservas_aforo || 40) }); }
          m += c.intervalo || 15; if (m >= 60) { h += Math.floor(m / 60); m %= 60; } } });
      return out;
    },
    async guardarConfigReservas(local, config, aforo, maxPersonas) { await this.guardarLocal(local, { reservas_config: config, reservas_aforo: aforo, reservas_max_personas: maxPersonas }); },
    async diasEspeciales(local) { return Object.entries(lee('op-demo-especiales', {})[local] || {}).map(([fecha, d]) => ({ fecha, ...d })).sort((a, b) => a.fecha.localeCompare(b.fecha)); },
    async guardarDiaEspecial(local, d) { const e = lee('op-demo-especiales', {}); e[local] = e[local] || {}; if (d.borrar) delete e[local][d.fecha]; else e[local][d.fecha] = { cerrado: !!d.cerrado, turnos: d.turnos || null, aforo: d.aforo || null, nota: d.nota || null }; guarda('op-demo-especiales', e); },
    async cancelarReserva(token) { const rs = lee('op-demo-reservas', []); const r = rs.find(x => x.token === token); if (r) r.estado = 'cancelada'; guarda('op-demo-reservas', rs); avisa(); },
    async reservasEntre(local, desde, hasta) { return lee('op-demo-reservas', []).filter(r => r.local === local && r.fecha >= desde && r.fecha < hasta); },
    async actualizarReserva(id, cambios) { const rs = lee('op-demo-reservas', []); Object.assign(rs.find(x => x.id === id) || {}, cambios); guarda('op-demo-reservas', rs); avisa(); },
    async listarClientes() {
      const ps = lee(K.pedidos, []).filter(p => p.canal === 'web'); const m = new Map();
      ps.forEach(p => { const c = m.get(p.cliente_tel) || { telefono: p.cliente_tel, nombre: p.cliente_nombre, email: null, notas: null, pedidos: 0, gastado: 0, ultimo: p.creado, locales: [p.local], reservas: 0, no_shows: 0 }; c.pedidos++; c.gastado += p.total; m.set(p.cliente_tel, c); });
      lee('op-demo-reservas', []).forEach(r => { const c = m.get(r.telefono) || { telefono: r.telefono, nombre: r.nombre, email: r.email, notas: null, pedidos: 0, gastado: 0, ultimo: r.fecha, locales: [r.local], reservas: 0, no_shows: 0 }; c.reservas++; m.set(r.telefono, c); });
      return [...m.values()];
    },
    async historialCliente(tel) { return { pedidos: lee(K.pedidos, []).filter(p => p.cliente_tel === tel), reservas: lee('op-demo-reservas', []).filter(r => r.telefono === tel) }; },
    async actualizarCliente() {},
    async estadoPedido(token) {
      const p = lee(K.pedidos, []).find(x => x.token === token); if (!p) return null;
      const r = lee('op-demo-resenas', []).find(x => x.pedido_id === p.id);
      return { ...p, nombre: p.cliente_nombre, local: LOCAL_DEMO.nombre, local_id: p.local, mi_nota: r ? r.nota : null, telefono: LOCAL_DEMO.telefono, direccion: LOCAL_DEMO.direccion };
    },
    seguirPedido(token, cb) { const f = async () => cb(await this.estadoPedido(token)); oyentes.add(f); return () => oyentes.delete(f); },
    // ── cocina ──
    async sesion() { return { email: 'demo@oralepadre.com', locales: ['tomares', 'san-luis'], roles: { tomares: 'encargado', 'san-luis': 'encargado' } }; },
    async entrar() { return this.sesion(); },
    async enlaceEmail() { throw new Error('DEMO: en modo demo no hace falta entrar'); },
    async cambiarPassword() { throw new Error('DEMO: en modo demo no hay contraseñas'); },
    async salir() {},
    async pedidosDelDia(local) {
      const dia = partesMadrid(new Date()).fecha;
      return lee(K.pedidos, []).filter(p => p.local === local && p.dia === dia);
    },
    async actualizarPedido(id, cambios) {
      const todos = lee(K.pedidos, []); const p = todos.find(x => x.id === id); Object.assign(p, cambios);
      guarda(K.pedidos, todos); avisa();
    },
    async actualizarLocal(id, cambios) { const l = lee(K.locales, {}); l[id] = { ...(l[id] || {}), ...cambios }; guarda(K.locales, l); avisa(); },
    async marcarAgotado(local, productoId, agotado) {
      const a = lee(K.agotados, {}); const s = new Set(a[local] || []);
      agotado ? s.add(productoId) : s.delete(productoId); a[local] = [...s]; guarda(K.agotados, a); avisa();
    },
    escuchar(local, cb) { oyentes.add(cb); return () => oyentes.delete(cb); },
    // ── sala ──
    async mesas(local) {
      const guardadas = lee(K.mesas, {})[local];
      if (guardadas) return guardadas;
      // Mismo plano de partida que 04-plano.sql
      const m = (o) => ({ local, tipo: 'mesa', rotacion: 0, ...o });
      return [...Array(10)].map((_, i) => m({ id: 'm' + (i + 1), nombre: 'Mesa ' + (i + 1), zona: 'Sala', orden: i + 1, forma: 'cuadrada',
          x: 80 + (i % 5) * 170, y: 90 + Math.floor(i / 5) * 200, ancho: 100, alto: 100, plazas: 4 }))
        .concat([...Array(6)].map((_, i) => m({ id: 't' + (i + 1), nombre: 'Terraza ' + (i + 1), zona: 'Terraza', orden: 101 + i, forma: 'redonda',
          x: 90 + (i % 3) * 280, y: 120 + Math.floor(i / 3) * 240, ancho: 100, alto: 100, plazas: 4 })))
        .concat([m({ id: 'barra', nombre: 'Barra', zona: 'Barra', orden: 200, tipo: 'deco', forma: 'barra', x: 150, y: 120, ancho: 700, alto: 70 })])
        .concat([...Array(6)].map((_, i) => m({ id: 'b' + (i + 1), nombre: 'Taburete ' + (i + 1), zona: 'Barra', orden: 201 + i, forma: 'taburete',
          x: 105 + (i + 1) * 105, y: 240, ancho: 60, alto: 60, plazas: 1 })));
    },
    async guardarPlano(local, elementos) {
      const abiertas = (await this.cuentasAbiertas(local)).filter(c => c.mesa_id);
      if (abiertas.some(c => !elementos.some(e => e.id === c.mesa_id))) throw new Error('PLANO: no puedes quitar una mesa con la cuenta abierta');
      const t = lee(K.mesas, {}); t[local] = elementos.map(e => ({ ...e, local })); guarda(K.mesas, t);
      const cs = lee(K.cuentas, []); cs.forEach(c => { const e = elementos.find(x => x.id === c.mesa_id); if (c.estado === 'abierta' && e) c.nombre = e.nombre; });
      guarda(K.cuentas, cs); avisa(); return elementos.length;
    },
    async cuentasAbiertas(local) { return lee(K.cuentas, []).filter(c => c.local === local && c.estado === 'abierta'); },
    async abrirCuenta({ local, mesa_id, nombre, para_llevar, comensales }) {
      const cs = lee(K.cuentas, []);
      if (mesa_id && cs.some(c => c.local === local && c.mesa_id === mesa_id && c.estado === 'abierta')) throw new Error('MESA: esa mesa ya tiene una cuenta abierta');
      const mesa = mesa_id && (await this.mesas(local)).find(m => m.id === mesa_id);
      const n = cs.filter(c => c.local === local && !c.mesa_id && partesMadrid(new Date(c.abierta)).fecha === partesMadrid(new Date()).fecha).length + 1;
      const c = { id: uuid(), local, mesa_id: mesa_id || null, nombre: (nombre || '').trim() || (mesa ? mesa.nombre : (para_llevar ? 'Llevar ' : 'Barra ') + n),
        para_llevar: !!para_llevar, comensales: comensales || null, estado: 'abierta', abierta: new Date().toISOString() };
      cs.push(c); guarda(K.cuentas, cs); avisa(); return c;
    },
    async enviarComanda(cuentaId, lineas, notas) {
      const c = lee(K.cuentas, []).find(x => x.id === cuentaId);
      if (!c || c.estado !== 'abierta') throw new Error('CUENTA: la cuenta ya está cerrada');
      const snap = fotoLineas(await this.carta(c.local), lineas, await this.agotados(c.local), partesMadrid(new Date()).dow, c.para_llevar);
      const todos = lee(K.pedidos, []); const dia = partesMadrid(new Date()).fecha;
      const numero = todos.filter(p => p.local === c.local && p.dia === dia).reduce((m, p) => Math.max(m, p.numero), 0) + 1;
      const ped = { id: uuid(), token: uuid(), local: c.local, numero, dia, canal: 'sala', cuenta_id: c.id, mesa: c.nombre,
        estado: 'nuevo', cliente_nombre: c.nombre, recogida: new Date().toISOString(), pago_metodo: 'local', pagado: false,
        total: snap.reduce((s, l) => s + l.unitario * l.cantidad, 0), lineas: snap, notas: notas || null, creado: new Date().toISOString() };
      todos.push(ped); guarda(K.pedidos, todos); avisa();
      return { pedido: ped.id, numero, total: ped.total };
    },
    async pedidosDeCuenta(cuentaId) { return lee(K.pedidos, []).filter(p => p.cuenta_id === cuentaId); },
    async moverCuenta(cuentaId, mesaId) {
      const cs = lee(K.cuentas, []); const c = cs.find(x => x.id === cuentaId);
      if (cs.some(x => x.local === c.local && x.mesa_id === mesaId && x.estado === 'abierta')) throw new Error('MESA: esa mesa ya está ocupada');
      const m = (await this.mesas(c.local)).find(x => x.id === mesaId);
      c.mesa_id = mesaId; c.nombre = m.nombre; guarda(K.cuentas, cs);
      const ps = lee(K.pedidos, []); ps.filter(p => p.cuenta_id === cuentaId).forEach(p => { p.mesa = m.nombre; p.cliente_nombre = m.nombre; });
      guarda(K.pedidos, ps); avisa();
    },
    async anularLinea(pedidoId, indice, cantidad, motivo) {
      const ps = lee(K.pedidos, []); const p = ps.find(x => x.id === pedidoId); const l = p.lineas[indice];
      const q = Math.min(cantidad || 1, l.cantidad); p.anuladas = [...(p.anuladas || []), { ...l, cantidad: q, motivo }];
      if (q === l.cantidad) p.lineas.splice(indice, 1); else l.cantidad -= q;
      p.total = p.lineas.reduce((s2, x) => s2 + x.unitario * x.cantidad, 0); if (!p.lineas.length) p.estado = 'cancelado';
      guarda(K.pedidos, ps); avisa(); return { total: p.total };
    },
    async apuntarPinFallido() {}, async fijarPin() {}, async registrarPrecuenta() {},
    async resumenCaja(local) {
      const ts = lee(K.tickets, []).filter(t => t.local === local); const s = m => ts.filter(t => t.metodo === m).reduce((a, t) => a + t.total, 0);
      return { desde: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(), fondo_inicial: 0, efectivo: s('efectivo'), tarjeta: s('tarjeta'), online: s('stripe'),
        invitaciones: ts.filter(t => t.metodo === 'invitacion').length, descuentos: ts.reduce((a, t) => a + (t.descuento || 0), 0), tickets: ts.length,
        anulaciones: 0, importe_anulado: 0, cuentas_abiertas: lee(K.cuentas, []).filter(c => c.local === local && c.estado === 'abierta').length };
    },
    async cerrarCaja(local, contado, retirado, notas) { const r = await this.resumenCaja(local); return { ...r, efectivo_contado: contado, retirado, notas, hasta: new Date().toISOString(), descuadre: contado - r.fondo_inicial - r.efectivo, fondo_siguiente: contado - retirado }; },
    async auditoria() { return []; }, async cierres() { return []; },
    // Reseñas e informes (demo: en este navegador)
    async ticketParaValorar(id) { const t = lee(K.tickets, []).find(x => x.id === id); if (!t) return null;
      const r = lee('op-demo-resenas', []).find(x => x.ticket_id === id);
      return { local: t.local, ticket: t.serie + '-' + String(t.numero).padStart(6, '0'), fecha: t.fecha, total: t.total, mi_nota: r ? r.nota : null }; },
    async googleFichas() { return lee('op-demo-gfichas', {}); },
    // Equipo con PIN (demo: PIN en claro en este navegador)
    async turnoActual(local) { const eq = lee('op-demo-equipo', []).filter(e => e.activo !== false && e.locales.includes(local) && e.pin);
      if (!eq.length) return { sin_equipo: true }; const t = lee('op-demo-turno', {})[local]; const e = t && eq.find(x => x.id === t); return e ? { id: e.id, nombre: e.nombre, rol: e.rol } : null; },
    async entrarPin(local, pin) { const e = lee('op-demo-equipo', []).find(x => x.activo !== false && x.locales.includes(local) && x.pin === pin); if (!e) return null;
      const t = lee('op-demo-turno', {}); t[local] = e.id; guarda('op-demo-turno', t); return { id: e.id, nombre: e.nombre, rol: e.rol }; },
    async salirTurno(local) { const t = lee('op-demo-turno', {}); delete t[local]; guarda('op-demo-turno', t); },
    async equipo() { return lee('op-demo-equipo', []).map(e => ({ ...e, pin: undefined, tiene_pin: !!e.pin, activo: e.activo !== false, con_usuario: false })); },
    async guardarEquipo(filas) { const eq = lee('op-demo-equipo', []);
      filas.forEach(f => { const i = eq.findIndex(e => e.id === f.id); const n = { ...(eq[i] || {}), ...f, pin: f.pin || (eq[i] || {}).pin }; if (i >= 0) eq[i] = n; else eq.push(n); });
      guarda('op-demo-equipo', eq); return { guardados: filas.length }; },
    async googleResenas(local) { return lee('op-demo-gresenas', []).filter(r => !local || r.local === local); },
    async guardarGoogle(fichas, resenas) {
      const f = lee('op-demo-gfichas', {}); (fichas || []).forEach(x => { f[x.local] = { ...x, actualizado: new Date().toISOString(), historial: [] }; }); guarda('op-demo-gfichas', f);
      const rs = lee('op-demo-gresenas', []).filter(r => !(resenas || []).some(n => n.id === r.id)); guarda('op-demo-gresenas', rs.concat(resenas || []));
      return { fichas: (fichas || []).length, resenas: (resenas || []).length };
    },
    async dejarResena({ local, nota, comentario, nombre, contacto, pedido, ticket, origen }) {
      if (!(nota >= 1 && nota <= 5)) throw new Error('DATOS: elige de 1 a 5 estrellas');
      let ped = null, tk = null; if (pedido) { ped = lee(K.pedidos, []).find(p => p.token === pedido); if (!ped) throw new Error('DATOS: no encontramos ese pedido'); local = ped.local; }
      if (ticket) { tk = lee(K.tickets, []).find(t => t.id === ticket); if (!tk) throw new Error('DATOS: no encontramos ese ticket'); local = tk.local; }
      if (!local) throw new Error('DATOS: elige el local');
      const rs = lee('op-demo-resenas', []).filter(r => !(ped && r.pedido_id === ped.id) && !(tk && r.ticket_id === tk.id));
      rs.push({ id: uuid(), local, creada: new Date().toISOString(), nota, comentario: comentario || null, nombre: nombre || (ped && ped.cliente_nombre) || null,
        contacto: contacto || null, pedido_id: ped ? ped.id : null, pedido_numero: ped ? ped.numero : null, ticket_id: tk ? tk.id : null, ticket: tk,
        importe: tk ? tk.total : ped ? ped.total : null, origen: origen || 'web', estado: 'nueva' });
      guarda('op-demo-resenas', rs); avisa();
      return { ok: true, local, enlace: lee('op-demo-enlaces', {})[local] || null };
    },
    async resenas(local, desde, hasta) { return lee('op-demo-resenas', []).filter(r => (!local || r.local === local) && r.creada >= desde && r.creada < hasta).sort((a, b) => b.creada.localeCompare(a.creada)); },
    async gestionarResena(id, estado, nota) { const rs = lee('op-demo-resenas', []); const r = rs.find(x => x.id === id); Object.assign(r, { estado, nota_interna: nota || r.nota_interna, gestionada: new Date().toISOString(), gestionada_email: 'demo@oralepadre.com' }); guarda('op-demo-resenas', rs); },
    async enlacesResenas() { return lee('op-demo-enlaces', {}); },
    async guardarEnlaceResenas(local, url) { const e = lee('op-demo-enlaces', {}); if (url) e[local] = url; else delete e[local]; guarda('op-demo-enlaces', e); },
    async informeEmpleados(local, desde, hasta) {
      const m = {}; lee(K.tickets, []).filter(t => (!local || t.local === local) && t.fecha >= desde && t.fecha < hasta).forEach(t => {
        const k = t.local + '|' + (t.pedido_id && t.metodo === 'stripe' ? 'web (pago online)' : 'demo@oralepadre.com');
        const x = m[k] = m[k] || { local: t.local, email: k.split('|')[1], tickets: 0, total: 0, efectivo: 0, tarjeta: 0, descuentos: 0 };
        x.tickets++; x.total += t.total; if (t.metodo === 'efectivo') x.efectivo += t.total; if (t.metodo === 'tarjeta' || t.metodo === 'stripe') x.tarjeta += t.total; x.descuentos += t.descuento || 0;
      });
      return Object.values(m).sort((a, b) => b.total - a.total);
    },
    async clienteActual() { return null; }, async pedirCodigo() { throw new Error('DEMO: en modo demo no hay cuentas'); },
    async anularCuenta(cuentaId, motivo) {
      const cs = lee(K.cuentas, []); const c = cs.find(x => x.id === cuentaId);
      Object.assign(c, { estado: 'anulada', cerrada: new Date().toISOString(), motivo_anulacion: motivo }); guarda(K.cuentas, cs);
      const ps = lee(K.pedidos, []); ps.filter(p => p.cuenta_id === cuentaId && p.estado !== 'cancelado')
        .forEach(p => { p.estado = 'cancelado'; p.motivo_cancel = 'Cuenta anulada: ' + motivo; });
      guarda(K.pedidos, ps); avisa();
    },
    async cobrar({ cuenta, pedido, metodo, entregado, promocion, nota, items }) {
      const ps = lee(K.pedidos, []); const cs = lee(K.cuentas, []);
      let lineas, localId;
      const vivos = () => ps.filter(p => p.cuenta_id === cuenta && p.estado !== 'cancelado').sort((a, b) => a.numero - b.numero);
      if (cuenta) {
        const c = cs.find(x => x.id === cuenta); if (!c || c.estado !== 'abierta') throw new Error('COBRO: la cuenta no está abierta');
        localId = c.local;
        if (items) {
          lineas = items.map(it => { const p = ps.find(x => x.id === it.pedido); const l = p.lineas[it.indice];
            if (it.cantidad > l.cantidad - (l.pagadas || 0)) throw new Error('COBRO: de "' + l.nombre + '" ya no quedan tantos por cobrar');
            l.pagadas = (l.pagadas || 0) + it.cantidad; const { pagadas, ...resto } = l; return { ...resto, cantidad: it.cantidad }; });
        } else {
          lineas = vivos().flatMap(p => p.lineas).filter(l => l.cantidad > (l.pagadas || 0)).map(({ pagadas, ...l }) => ({ ...l, cantidad: l.cantidad - (pagadas || 0) }));
          vivos().forEach(p => p.lineas.forEach(l => { l.pagadas = l.cantidad; }));
        }
      } else {
        const p = ps.find(x => x.id === pedido); if (!p || p.pagado) throw new Error('COBRO: el pedido ya está cobrado');
        localId = p.local; lineas = p.lineas;
      }
      if (!lineas.length) throw new Error('COBRO: no hay nada que cobrar');
      let promo = null;
      if (promocion) {
        promo = (await this.promociones(localId)).find(x => x.id === promocion && x.activa);
        if (!promo) throw new Error('PROMO: la promoción no existe o no está activa');
        if (promo.requiere_nota && (nota || '').trim().length < 2) throw new Error(`PROMO: "${promo.nombre}" necesita una nota (por ejemplo, el nombre)`);
        if (!descuentoPromo(promo, lineas)) throw new Error(`PROMO: "${promo.nombre}" no se aplica a esta cuenta`);
      }
      const r = calculaTicket(lineas, promo);
      if (r.total === 0) metodo = 'invitacion';
      if (metodo === 'efectivo' && (entregado ?? r.total) < r.total) throw new Error('COBRO: el efectivo entregado no llega al total');
      const loc = await this.local(localId); const fecha = new Date();
      const serie = loc.serie + String(partesMadrid(fecha).y).slice(2);
      const ts = lee(K.tickets, []); const prev = ts.filter(t => t.serie === serie).sort((a, b) => b.numero - a.numero)[0];
      const numero = (prev ? prev.numero : 0) + 1;
      const hash = await sha256([loc.cif, serie + '-' + numero, fecha.toISOString().slice(0, 19) + 'Z', r.total, prev ? prev.hash : ''].join('|'));
      const t = { id: uuid(), local: localId, serie, numero, fecha: fecha.toISOString(), cuenta_id: cuenta || null, pedido_id: pedido || null,
        emisor: { razon_social: loc.razon_social, cif: loc.cif, direccion: loc.direccion_fiscal, local: loc.nombre, direccion_local: loc.direccion },
        lineas, bruto: r.bruto, descuento: r.descuento,
        promocion: promo ? { id: promo.id, codigo: promo.codigo, nombre: promo.nombre, tipo: promo.tipo, valor: promo.valor, nota: (nota || '').trim() || null } : null,
        total: r.total, desglose_iva: r.desglose, metodo,
        entregado: metodo === 'efectivo' ? (entregado ?? r.total) : null, cambio: metodo === 'efectivo' ? (entregado ?? r.total) - r.total : null,
        hash_anterior: prev ? prev.hash : null, hash, verifactu_estado: 'pendiente' };
      ts.push(t); guarda(K.tickets, ts);
      if (cuenta && vivos().some(p => p.lineas.some(l => l.cantidad > (l.pagadas || 0)))) { /* cobro parcial: la mesa sigue abierta */ }
      else if (cuenta) {
        const c = cs.find(x => x.id === cuenta); c.estado = 'cobrada'; c.cerrada = fecha.toISOString(); guarda(K.cuentas, cs);
        ps.filter(p => p.cuenta_id === cuenta && p.estado !== 'cancelado').forEach(p => { p.pagado = true; p.pago_metodo = metodo; });
      } else { const p = ps.find(x => x.id === pedido); p.pagado = true; p.pago_metodo = metodo; }
      guarda(K.pedidos, ps); avisa(); return t;
    },
    async ticketsDelDia(local) {
      const hoy = partesMadrid(new Date()).fecha;
      return lee(K.tickets, []).filter(t => t.local === local && partesMadrid(new Date(t.fecha)).fecha === hoy);
    },
    borrarDemo() { Object.values(K).forEach(k => localStorage.removeItem(k)); avisa(); },
  };

  /* ══ Modo Supabase ════════════════════════════════════════ */
  let sb = null;
  function cliente() {
    if (!sb) {
      if (!window.supabase) throw new Error('Falta supabase-js');
      sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
    }
    return sb;
  }
  const ok = ({ data, error }) => { if (error) throw error; return data; };

  const real = {
    modo: 'supabase',
    async carta(local) { return ok(await cliente().from('cartas').select('datos').eq('local', local).single()).datos; },
    async local(id) { return ok(await cliente().from('locales').select('*').eq('id', id).single()); },
    async agotados(local) { return new Set(ok(await cliente().from('agotados').select('producto_id').eq('local', local)).map(r => r.producto_id)); },
    async crearPedido({ local, nombre, tel, recogida, pago, notas, lineas, email, marketing }) {
      return ok(await cliente().rpc('crear_pedido', { p_local: local, p_nombre: nombre, p_tel: tel,
        p_recogida: new Date(recogida).toISOString(), p_pago: pago, p_notas: notas || '', p_lineas: lineas, p_email: email || null,
        p_marketing: !!marketing }));
    },
    // ── Cuenta de cliente (opcional): se entra con un código que llega al email ──
    async clienteActual() { const { data } = await cliente().auth.getSession(); return data.session ? { email: data.session.user.email } : null; },
    async pedirCodigo(email) { ok(await cliente().auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: location.href.split('#')[0] } })); },
    async verificarCodigo(email, codigo) { ok(await cliente().auth.verifyOtp({ email, token: codigo, type: 'email' })); },
    async miCuenta() { return ok(await cliente().rpc('mi_cuenta')); },
    async guardarMiCuenta({ nombre, tel, marketing }) { ok(await cliente().rpc('guardar_mi_cuenta', { p_nombre: nombre || null, p_tel: tel || null, p_marketing: marketing ?? null })); },
    async salirCliente() { await cliente().auth.signOut(); },
    // Pago online: la función del servidor crea el pago en Stripe y devuelve la página de pago.
    async iniciarPago(token, volver) {
      const r = await fetch(`${CONFIG.supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CONFIG.supabaseKey },
        body: JSON.stringify({ token, volver }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error('PAGO: ' + (d.error || 'no se ha podido iniciar el pago'));
      return d.url;
    },
    async localesConPedidos() { return ok(await cliente().from('locales').select('id,nombre,acepta_pedidos,pago_online,pago_local,acepta_reservas').order('nombre')); },
    // ── reservas (público) ──
    async crearReserva(r) {
      return ok(await cliente().rpc('crear_reserva', { p_local: r.local, p_fecha: new Date(r.fecha).toISOString(), p_personas: +r.personas,
        p_nombre: r.nombre, p_tel: r.tel, p_email: r.email || null, p_notas: r.notas || '', p_origen: r.origen || 'web' }));
    },
    async verReserva(token) { return ok(await cliente().rpc('ver_reserva', { p_token: token })); },
    async horasReserva(local, dia, personas) { return ok(await cliente().rpc('horas_reserva', { p_local: local, p_dia: dia, p_personas: +personas || 2 })); },
    async guardarConfigReservas(local, config, aforo, maxPersonas) { ok(await cliente().rpc('guardar_config_reservas', { p_local: local, p_config: config, p_aforo: aforo, p_max_personas: maxPersonas })); },
    async diasEspeciales(local) { return ok(await cliente().from('reservas_especiales').select('*').eq('local', local).gte('fecha', new Date().toISOString().slice(0, 10)).order('fecha')); },
    async guardarDiaEspecial(local, d) { ok(await cliente().rpc('guardar_dia_especial', { p_local: local, p_fecha: d.fecha, p_cerrado: !!d.cerrado, p_turnos: d.turnos || null, p_aforo: d.aforo || null, p_nota: d.nota || null, p_borrar: !!d.borrar })); },
    async cancelarReserva(token) { ok(await cliente().rpc('cancelar_reserva', { p_token: token })); },
    // ── reservas y clientes (personal) ──
    async reservasEntre(local, desde, hasta) { return ok(await cliente().from('reservas').select('*').eq('local', local).gte('fecha', desde).lt('fecha', hasta).order('fecha')); },
    async actualizarReserva(id, cambios) { ok(await cliente().from('reservas').update(cambios).eq('id', id)); },
    async listarClientes(buscar) { return ok(await cliente().rpc('listar_clientes', { p_buscar: buscar || null })); },
    async historialCliente(tel) { return ok(await cliente().rpc('historial_cliente', { p_tel: tel })); },
    async actualizarCliente(tel, cambios) { ok(await cliente().from('clientes').update({ ...cambios, actualizado: new Date().toISOString() }).eq('telefono', tel)); },
    async estadoPedido(token) { return ok(await cliente().rpc('estado_pedido', { p_token: token })); },
    seguirPedido(token, cb) {
      // El cliente no puede leer la tabla (RLS), así que pregunta cada 15 s.
      const t = setInterval(async () => { try { cb(await this.estadoPedido(token)); } catch (e) { /* sin red */ } }, 15000);
      return () => clearInterval(t);
    },
    async sesion() {
      const { data } = await cliente().auth.getSession(); if (!data.session) return null;
      const filas = ok(await cliente().from('staff').select('local, rol'));
      return { email: data.session.user.email, locales: filas.map(r => r.local), roles: Object.fromEntries(filas.map(r => [r.local, r.rol])) };
    },
    async entrar(email, pass) { ok(await cliente().auth.signInWithPassword({ email, password: pass })); return this.sesion(); },
    async salir() { await cliente().auth.signOut(); },
    // Entrar sin contraseña: Supabase manda un enlace al email (sólo a usuarios que ya existen).
    async enlaceEmail(email) {
      ok(await cliente().auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } }));
    },
    async cambiarPassword(nueva) { ok(await cliente().auth.updateUser({ password: nueva })); },
    async pedidosDelDia(local) {
      const dia = partesMadrid(new Date()).fecha;
      return ok(await cliente().from('pedidos').select('*').eq('local', local).eq('dia', dia).order('numero'));
    },
    async actualizarPedido(id, cambios) { ok(await cliente().from('pedidos').update(cambios).eq('id', id)); },
    async actualizarLocal(id, cambios) { ok(await cliente().from('locales').update(cambios).eq('id', id)); },
    async marcarAgotado(local, productoId, agotado) {
      if (agotado) ok(await cliente().from('agotados').upsert({ local, producto_id: productoId }));
      else ok(await cliente().from('agotados').delete().eq('local', local).eq('producto_id', productoId));
    },
    escuchar(local, cb) {
      const ch = cliente().channel('cocina-' + local)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos', filter: `local=eq.${local}` }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'locales', filter: `id=eq.${local}` }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agotados', filter: `local=eq.${local}` }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cuentas', filter: `local=eq.${local}` }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas', filter: `local=eq.${local}` }, cb)
        .subscribe();
      return () => cliente().removeChannel(ch);
    },
    // ── sala ──
    async mesas(local) { return ok(await cliente().from('mesas').select('*').eq('local', local).eq('activa', true).order('orden')); },
    async guardarPlano(local, elementos) { return ok(await cliente().rpc('guardar_plano', { p_local: local, p_elementos: elementos })); },
    // ── admin ──
    async guardarCarta(local, datos) { return ok(await cliente().rpc('guardar_carta', { p_local: local, p_datos: datos })); },
    async subirFoto(local, archivo) {
      const ext = (archivo.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const ruta = `${local}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      ok(await cliente().storage.from('carta').upload(ruta, archivo, { cacheControl: '31536000', contentType: archivo.type }));
      return cliente().storage.from('carta').getPublicUrl(ruta).data.publicUrl;
    },
    async guardarLocal(id, datos) { ok(await cliente().rpc('guardar_local', { p_local: id, p_datos: datos })); },
    async staffDelLocal(local) { return ok(await cliente().rpc('listar_staff', { p_local: local })); },
    // Todo el equipo (también quien aún no tiene acceso a ningún local), con sus accesos {local: rol}.
    async usuariosEquipo() { return ok(await cliente().rpc('listar_usuarios_equipo')); },
    // Alta completa: crea el usuario de acceso (si no existe) y le da el rol en el local.
    async anadirStaff(local, email, rol, password) {
      const { data } = await cliente().auth.getSession(); if (!data.session) throw new Error('PERMISO: entra de nuevo en el admin');
      const r = await fetch(`${CONFIG.supabaseUrl}/functions/v1/alta-usuario`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: CONFIG.supabaseKey, Authorization: 'Bearer ' + data.session.access_token },
        body: JSON.stringify({ local, email, rol, password: password || '' }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error('USUARIO: ' + (j.error || 'no se ha podido dar de alta'));
      return j;
    },
    async cambiarRol(local, email, rol) { ok(await cliente().rpc('cambiar_rol', { p_local: local, p_email: email, p_rol: rol })); },
    async quitarStaff(local, email) { ok(await cliente().rpc('quitar_staff', { p_local: local, p_email: email })); },
    async ticketsEntre(local, desde, hasta) { return ok(await cliente().from('tickets').select('*').eq('local', local).gte('fecha', desde).lt('fecha', hasta).order('numero')); },
    // ── Delivery (Uber/Glovo) y costes de escandallo (sólo encargados) ──
    async deliveryEntre(desde, hasta) { return ok(await cliente().from('delivery_diario').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha')); },
    async resumenesDelivery(desde, hasta) { return ok(await cliente().from('delivery_resumen').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha', { ascending: false })); },
    async guardarDelivery(filas, resumenes, fuente) { return ok(await cliente().rpc('guardar_delivery', { p_filas: filas || [], p_resumenes: resumenes || [], p_fuente: fuente || 'manual' })); },
    async costes(local) { return Object.fromEntries(ok(await cliente().from('costes_producto').select('producto,coste,fuente').eq('local', local)).map(r => [r.producto, r])); },
    async guardarCostes(local, costes) { return ok(await cliente().rpc('guardar_costes', { p_local: local, p_costes: costes })); },
    async costesEscandallo() { return ok(await cliente().rpc('costes_escandallo')); },
    async pedidosEntre(local, desde, hasta) { return ok(await cliente().from('pedidos').select('*').eq('local', local).gte('creado', desde).lt('creado', hasta).order('creado')); },
    async cuentasEntre(local, desde, hasta) { return ok(await cliente().from('cuentas').select('*').eq('local', local).gte('abierta', desde).lt('abierta', hasta).order('abierta')); },
    async ventasImportadasEntre(local, desde, hasta) { return ok(await cliente().from('ventas_importadas').select('*').eq('local', local).gte('fecha', desde).lt('fecha', hasta).order('fecha')); },
    // Productos de periodos importados que se solapan con [desde, hasta).
    async productosImportados(local, desde, hasta) {
      return ok(await cliente().from('productos_importados').select('*').eq('local', local).lt('desde', hasta.slice(0, 10)).gt('hasta', desde.slice(0, 10)));
    },
    async cuentasAbiertas(local) { return ok(await cliente().from('cuentas').select('*').eq('local', local).eq('estado', 'abierta')); },
    async abrirCuenta({ local, mesa_id, nombre, para_llevar, comensales }) {
      return ok(await cliente().rpc('abrir_cuenta', { p_local: local, p_mesa_id: mesa_id || null, p_nombre: nombre || null,
        p_para_llevar: !!para_llevar, p_comensales: comensales || null }));
    },
    async enviarComanda(cuenta, lineas, notas) { return ok(await cliente().rpc('enviar_comanda', { p_cuenta: cuenta, p_lineas: lineas, p_notas: notas || '' })); },
    async pedidosDeCuenta(cuenta) { return ok(await cliente().from('pedidos').select('*').eq('cuenta_id', cuenta).order('numero')); },
    async moverCuenta(cuenta, mesa) { ok(await cliente().rpc('mover_cuenta', { p_cuenta: cuenta, p_mesa_id: mesa })); },
    async anularCuenta(cuenta, motivo, pin) { ok(await cliente().rpc('anular_cuenta', { p_cuenta: cuenta, p_motivo: motivo, p_pin: pin || null })); },
    // ── Control: productos quitados, clave de encargado, pre-cuentas, cierre de caja ──
    async anularLinea(pedido, indice, cantidad, motivo, pin) {
      return ok(await cliente().rpc('anular_linea', { p_pedido: pedido, p_indice: indice, p_cantidad: cantidad, p_motivo: motivo, p_pin: pin || null }));
    },
    async apuntarPinFallido(local, accion) { try { await cliente().rpc('apuntar_pin_fallido', { p_local: local, p_accion: accion }); } catch (e) {} },
    async fijarPin(pin) { ok(await cliente().rpc('fijar_mi_pin', { p_pin: pin })); },
    async registrarPrecuenta(cuenta, total) { try { await cliente().rpc('registrar_precuenta', { p_cuenta: cuenta, p_total: total }); } catch (e) {} },
    async resumenCaja(local) { return ok(await cliente().rpc('resumen_caja', { p_local: local })); },
    async cerrarCaja(local, contado, retirado, notas) { return ok(await cliente().rpc('cerrar_caja', { p_local: local, p_contado: contado, p_retirado: retirado, p_notas: notas || '' })); },
    async auditoria(local, desde, hasta) { return ok(await cliente().rpc('listar_auditoria', { p_local: local, p_desde: desde, p_hasta: hasta })); },
    async cierres(local, desde, hasta) { return ok(await cliente().rpc('listar_cierres', { p_local: local, p_desde: desde, p_hasta: hasta })).map(r => r.c); },
    async dejarResena({ local, nota, comentario, nombre, contacto, pedido, ticket, origen }) {
      return ok(await cliente().rpc('dejar_resena', { p_local: local || null, p_nota: nota, p_comentario: comentario || null, p_nombre: nombre || null,
        p_contacto: contacto || null, p_pedido: pedido || null, p_origen: origen || 'web', p_ticket: ticket || null }));
    },
    async ticketParaValorar(id) { return ok(await cliente().rpc('ticket_para_valorar', { p_ticket: id })); },
    // Equipo con PIN
    async turnoActual(local) { return ok(await cliente().rpc('turno_actual', { p_local: local })); },
    async entrarPin(local, pin) { return ok(await cliente().rpc('entrar_pin', { p_local: local, p_pin: pin })); },
    async salirTurno(local) { ok(await cliente().rpc('salir_turno', { p_local: local })); },
    async equipo() { return ok(await cliente().rpc('listar_equipo')); },
    async guardarEquipo(filas) { return ok(await cliente().rpc('guardar_equipo', { p_filas: filas })); },
    async googleFichas() { return Object.fromEntries(ok(await cliente().from('google_fichas').select('*')).map(r => [r.local, r])); },
    async googleResenas(local) { let q = cliente().from('google_resenas').select('*').order('fecha', { ascending: false, nullsFirst: false }).limit(500); if (local) q = q.eq('local', local); return ok(await q); },
    async guardarGoogle(fichas, resenas) { return ok(await cliente().rpc('guardar_google', { p_fichas: fichas || [], p_resenas: resenas || [] })); },
    async resenas(local, desde, hasta) { return ok(await cliente().rpc('listar_resenas', { p_local: local, p_desde: desde, p_hasta: hasta })).map(r => r.r); },
    async gestionarResena(id, estado, nota) { ok(await cliente().rpc('gestionar_resena', { p_id: id, p_estado: estado, p_nota_interna: nota || null })); },
    async enlacesResenas() { return Object.fromEntries(ok(await cliente().from('resenas_enlaces').select('local,url')).map(r => [r.local, r.url])); },
    async guardarEnlaceResenas(local, url) { ok(await cliente().rpc('guardar_enlace_resenas', { p_local: local, p_url: url || '' })); },
    async informeEmpleados(local, desde, hasta) { return ok(await cliente().rpc('informe_empleados', { p_local: local, p_desde: desde, p_hasta: hasta })); },
    // items = [{pedido, indice, cantidad}] → cobra sólo esos productos (dividir la cuenta).
    async cobrar({ cuenta, pedido, metodo, entregado, promocion, nota, items }) {
      if (items) return ok(await cliente().rpc('cobrar_parte', { p_cuenta: cuenta, p_items: items, p_metodo: metodo,
        p_entregado: entregado ?? null, p_promocion: promocion || null, p_nota: nota || null }));
      return ok(await cliente().rpc('cobrar', { p_cuenta: cuenta || null, p_pedido: pedido || null, p_metodo: metodo,
        p_entregado: entregado ?? null, p_promocion: promocion || null, p_nota: nota || null }));
    },
    async promociones(local) { return ok(await cliente().from('promociones').select('*').eq('local', local).order('codigo')); },
    async guardarPromocion(local, promo) { return ok(await cliente().rpc('guardar_promocion', { p_local: local, p_promo: promo })); },
    async borrarPromocion(local, id) { ok(await cliente().rpc('borrar_promocion', { p_local: local, p_id: id })); },
    async ticketsDelDia(local) {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      return ok(await cliente().from('tickets').select('*').eq('local', local).gte('fecha', d.toISOString()).order('numero'));
    },
  };

  const euros = c => (c / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

  /* ── Pantallas de entrada: añadir "recibir enlace por email" ── */
  document.addEventListener('DOMContentLoaded', () => {
    const f = document.getElementById('form-entrar'); if (!f || DEMO) return;
    const err = document.getElementById('e-error'), em = document.getElementById('e-email');
    const sep = document.createElement('p'); sep.className = 'e-o'; sep.textContent = 'o, sin contraseña';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'b'; b.textContent = 'Enviarme un enlace para entrar';
    const ayuda = document.createElement('p'); ayuda.className = 'e-ayuda';
    ayuda.textContent = 'Escribe tu email arriba y pulsa el botón: te llega un correo con un enlace que te deja dentro.';
    f.append(sep, b, ayuda);
    b.onclick = async () => {
      err.hidden = true; const email = em.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Escribe primero tu email.'; err.hidden = false; em.focus(); return; }
      b.disabled = true; b.textContent = 'Enviando…';
      try {
        await (DEMO ? demo : real).enlaceEmail(email);
        ayuda.innerHTML = '<b>Correo enviado.</b> Abre el email de “Supabase Auth” en el Gmail del negocio y pulsa el enlace desde este mismo dispositivo. Si no llega en 2 minutos, mira en Spam.';
        b.textContent = 'Reenviar enlace';
      } catch (ex) {
        const t = String(ex.message || ex);
        err.textContent = /rate|seconds|limit/i.test(t) ? 'Has pedido demasiados enlaces seguidos. Espera un minuto y vuelve a probar.'
          : /signups not allowed|not found|Invalid/i.test(t) ? 'Ese email no tiene usuario en el sistema.' : 'No se ha podido enviar el enlace: ' + t;
        err.hidden = false; b.textContent = 'Enviarme un enlace para entrar';
      } finally { b.disabled = false; }
    };
  });

  /** Si el usuario trabaja en varios locales, cambia el nombre del local de la barra por un selector. */
  async function selectorLocal(contenedor, locales, actual, alCambiar) {
    if (!contenedor || !locales || locales.length < 2) return;
    const api = DEMO ? demo : real;
    const nombres = await Promise.all(locales.map(async id => { try { return [id, (await api.local(id)).nombre.replace(/^Órale Padre\s*/, '')]; } catch (e) { return [id, id]; } }));
    const sel = document.createElement('select'); sel.className = 'sel-local'; sel.setAttribute('aria-label', 'Local');
    sel.innerHTML = nombres.map(([id, n]) => `<option value="${id}">${n}</option>`).join(''); sel.value = actual;
    sel.onchange = () => alCambiar(sel.value);
    contenedor.replaceWith(sel);
  }

  window.OP = { api: DEMO ? demo : real, selectorLocal, DEMO, CONFIG, franjas, enHorario, hhmm, partesMadrid,
                indexar, precioLinea, fotoLineas, calculaTicket, descuentoPromo, mensajeError, euros };
})();
