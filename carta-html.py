#!/usr/bin/env python3
"""
Genera el bloque de la carta en index.html a partir de datos/carta.json
(que a su vez sale de carta-desde-lastapp.py). Se puede ejecutar mil veces:
sustituye lo que hay entre <!-- CARTA:INICIO --> y <!-- CARTA:FIN -->.

Lo que NO está en Last App y se mantiene aquí a mano: los alérgenos de la
carta impresa (Last App los tiene incompletos: se unen las dos fuentes), el
picante, las etiquetas y las salsas del apartado "Y además".
"""
import json, pathlib, re, html

RAIZ = pathlib.Path(__file__).parent
datos = json.load(open(RAIZ / "datos" / "carta.json", encoding="utf-8"))

# ── Fuente 2 de alérgenos: la carta impresa (CARTA REMEDIOS Y SEV ESTE F.pdf) ──
PDF = {
    "burritos": ["Gluten", "Leche", "Sulfitos"], "combos": ["Gluten", "Leche", "Sulfitos"],
    "botanas": ["Gluten", "Leche", "Sulfitos"], "nudes": ["Gluten", "Leche", "Sulfitos"],
    "tacos": ["Gluten", "Leche", "Sulfitos"], "quesadillas": ["Gluten", "Leche", "Sulfitos"],
    "postres": ["Gluten", "Huevos", "Altramuces", "Cacahuetes", "Frutos de cáscara", "Soja", "Leche"],
    "promos": ["Gluten", "Leche", "Sulfitos"], "bebidas": [],
}
PDF_EXTRA = {"pollo-padre": ["Huevos"], "don-hampi": ["Apio"], "dona-juana": ["Apio"]}
PICANTE = {"dona-dolores": 1, "lady-cochinita": 2, "nude-dolores": 1, "nude-lady-cochinita": 1,
           "tacos-don-pastor": 1, "taco-lady-cochinita": 1, "3x2-tacos-pastor": 1}
ETIQUETAS = {"black-chancho": ("pre", "Premium"), "don-hampi": ("fus", "Fusión"), "dona-juana": ("veg", "Vegetal"),
             "combo-uno": ("top", "El de diario"), "taco-chancho": ("pre", "Premium"), "tacos-chancho": ("pre", "Premium")}
NOMBRES = {"trio-lalala": "Trío Lalala", "taco-lady-cochinita": "Taco Lady Cochinita", "taco-juarez": "Taco Juárez",
           "taco-buffalo": "Taco Búffalo", "botellin-cruzcampo": "Botellín Cruzcampo", "aguila-sin-filtrar": "Águila sin filtrar",
           "neste-maracuya": "Nestea Maracuyá", "agua-botella-pequena": "Agua", "cortada-cruzcampo": "Cortada Cruzcampo",
           "cocktail-orale-padre": "Cóctel Órale Padre"}
ICONOS = {
    "burritos": "M4 17.5 17.5 4a4.5 4.5 0 0 1 2.5 2.5L6.5 20A4.5 4.5 0 0 1 4 17.5Z M7 15l3 3 M11 11l3 3",
    "combos": "M4 8h16v12H4Z M4 8l2-4h12l2 4 M9 13h6", "botanas": "M12 4 21 19H3Z M8.5 13h7",
    "nudes": "M3 10h18a9 9 0 0 1-18 0Z M7 6.5s1-2 2.5-2 M12 6s1-2.5 2.5-2.5",
    "tacos": "M3 17a9 9 0 0 1 18 0Z M8 17v-3 M12 17v-4 M16 17v-3",
    "quesadillas": "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z M12 12 20 9 M12 12l-4 7",
    "postres": "M5 20h14v-7H5Z M6 13c0-4 2.5-6 6-6s6 2 6 6 M12 4v3",
    "promos": "M3 12 12 3h9v9l-9 9Z M16 8h.01", "bebidas": "M6 3h12l-1.5 17h-9Z M4 3h16 M8.5 12h7",
    "ademas": "M9 3h6v3l2 4v11H7V10l2-4Z M7 13h10",
}
NOTAS = {
    "burritos": "Cerdo, pollo y especiales. Todos a 9,95 € salvo la Doña Juana.",
    "combos": "En los combos entran refrescos, cortadas y agua. La Doña Juana no entra en combo.",
    "nudes": "Todo lo de dentro del burrito, sin la tortilla.",
    "tacos": "En Los Remedios y Sevilla Este van sueltos, a 3,50 €. En San Luis, de tres en tres a 9,95 €.",
    "promos": "Cada día de la semana tiene la suya. Solo en el local y para recoger.",
}
CHILI = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.9 6.9c.4-1.9 2-3.3 4-3.4-.7 1-.9 2.2-.5 3.3.9 1.2 1.3 2.7 1.1 4.3-.5 4.6-5.2 8.6-10.3 8.9-3.2.2-5.9-1.1-6.8-2.9-.3-.6.1-1.3.8-1.3 3.4-.1 5.8-1.5 7.2-4 1.2-2.1 2.6-3.8 4.5-4.9Z"/></svg>'

def euro(p): return f"{p:.2f}".replace(".", ",") + " €"
def icono(c): return f'<svg class="cat-icono" viewBox="0 0 24 24" aria-hidden="true"><path d="{ICONOS[c]}"/></svg>'
def esc(s): return html.escape(s or "", quote=True)

def nombre_web(it):
    n = NOMBRES.get(it["slug"], it["nombre"])
    if it["cat"] == "burritos": n = re.sub(r"^Burro ", "", n)
    return n

items = datos["items"]
por_cat = {}
for it in items: por_cat.setdefault(it["cat"], []).append(it)

# Promos: se agrupan a mano (el catálogo trae cada variante del 3x2 como producto)
def promos_agrupadas(lista):
    by = {i["slug"]: i for i in lista}
    menu = by.get("menu-mediodia"); postre = by.get("postre-menu-mediodia")
    lym = by.get("promo-lunes-y-miercoles")
    tres = [i for i in lista if i["slug"].startswith("3x2")]
    out = []
    if lym: out.append({**lym, "nombre": "Lunes y miércoles: dos burritos", "desc": "Dos burritos a elegir por 13,90 €. Los dos días de la semana en que más apetece.", "alergenos": [], "foto": None, "picante": 0})
    if tres:
        sabores = ", ".join(re.sub(r"^3x2 tacos ", "", i["nombre"], flags=re.I).lower() for i in tres)
        out.append({**tres[0], "slug": "martes-3x2-tacos", "nombre": "Martes: 3×2 en tacos", "desc": f"Tres tacos al precio de dos, {euro(tres[0]['precio'])}. A elegir: {sabores}.", "alergenos": [], "foto": None, "locales": tres[0]["locales"]})
    if menu:
        extra = f" Postre por {euro(postre['precio'])} más." if postre else ""
        out.append({**menu, "nombre": "Jueves y viernes: menú de mediodía", "desc": f"Burrito a elegir, chips y bebida por {euro(menu['precio'])}.{extra} Guacamole extra 0,50 €, salsa de cheddar 1 €.", "alergenos": [], "foto": None})
    return out

def tarjeta(it, n):
    nombre = nombre_web(it)
    slug = it["slug"].replace("burro-", "")
    tags = ""
    rank = it.get("popular")
    if rank is not None and rank < 3: tags += f' <em class="tag tag-top">Nº{rank + 1}</em>'
    if it.get("nuevo"): tags += ' <em class="tag tag-fus">Nuevo</em>'
    if slug in ETIQUETAS: tags += f' <em class="tag tag-{ETIQUETAS[slug][0]}">{ETIQUETAS[slug][1]}</em>'
    if it["locales"] == ["san-luis"]: tags += ' <em class="tag tag-solo">Solo en San Luis</em>'
    pic = PICANTE.get(slug, it.get("picante", 0))
    if pic: tags += f'<span class="picante" title="{"Muy picante" if pic > 1 else "Picante"}">{CHILI * pic}<span class="visually-hidden">{"Muy picante" if pic > 1 else "Picante"}</span></span>'
    al = set(it["alergenos"]) | set(PDF.get(it["cat"], [])) | set(PDF_EXTRA.get(slug, []))
    al = ", ".join(sorted(al)) if al else "Pregunta en el local"
    foto = (f'<div class="plato-foto"><img src="{it["foto"]}" alt="{esc(nombre)}" width="900" height="900" loading="lazy" decoding="async"></div>'
            if it.get("foto") else f'<div class="plato-foto plato-sinfoto" aria-hidden="true"><span>{esc(nombre)}</span></div>')
    return f'''        <article class="plato">
          {foto}
          <div class="plato-cuerpo">
            <h4 class="plato-nombre">{esc(nombre)}{tags}</h4>
            <p class="plato-precio">{euro(it["precio"])}</p>
            <p class="plato-desc">{esc(it["desc"])}</p>
          </div>
          <button class="plato-mas" type="button" aria-expanded="false" aria-controls="al-{n}">
            <span class="visually-hidden">Ver alérgenos de {esc(nombre)}</span>
            <span class="plato-signo" aria-hidden="true"></span>
          </button>
          <div class="plato-extra" id="al-{n}" hidden>
            <p class="plato-alergenos">{esc(al)}</p>
          </div>
        </article>
'''

def bebidas(lista):
    grupos = {"Refrescos": [], "Cervezas": [], "Otros": []}
    for i in lista:
        n = nombre_web(i); s = i["slug"]
        g = "Cervezas" if any(k in s for k in ("cruzcampo", "heineken", "amstel", "aguila")) else ("Otros" if s in ("agua-botella-pequena", "cocktail-orale-padre") else "Refrescos")
        grupos[g].append((n, i["precio"]))
    filas = []
    for g, ls in grupos.items():
        if not ls: continue
        precios = sorted({p for _, p in ls})
        if len(precios) == 1:
            filas.append(f"<dt>{g} · {euro(precios[0])}</dt><dd>{esc(' · '.join(n for n, _ in ls))}</dd>")
        else:
            filas.append(f"<dt>{g}</dt><dd>{esc(' · '.join(f'{n} {euro(p)}' for n, p in ls))}</dd>")
    return "\n          ".join(filas)

nav, cuerpo, n = [], [], 0
for c in datos["categorias"]:
    clave, nombre = c["clave"], c["nombre"]
    lista = por_cat.get(clave, [])
    if not lista: continue
    nav.append(f'      <button type="button" data-cat="cat-{clave}" aria-pressed="false">{icono(clave)}{nombre}</button>')
    if clave == "bebidas":
        cuerpo.append(f'''      <section id="cat-bebidas" class="cat cat-min">
        <div class="cat-head">
          <h3>{icono("bebidas")}Bebidas</h3>
        </div>
        <dl class="minis">
          {bebidas(lista)}
        </dl>
      </section>
''')
        continue
    if clave == "promos": lista = promos_agrupadas(lista)
    precios = sorted({i["precio"] for i in lista})
    rango = euro(precios[0]) if len(precios) == 1 else f"{euro(precios[0])} – {euro(precios[-1])}"
    nota = f'\n        <p class="cat-note">{NOTAS[clave]}</p>' if clave in NOTAS else ""
    tarjetas = ""
    for it in lista:
        n += 1; tarjetas += tarjeta(it, n)
    cuerpo.append(f'''      <section id="cat-{clave}" class="cat">
        <div class="cat-head">
          <h3>{icono(clave)}{nombre}</h3>
          <span class="cat-price">{rango}</span>
        </div>{nota}
        <div class="platos">
{tarjetas}        </div>
      </section>
''')

nav.append(f'      <button type="button" data-cat="cat-ademas" aria-pressed="false">{icono("ademas")}Y además</button>')
cuerpo.append(f'''      <section id="cat-ademas" class="cat cat-min">
        <div class="cat-head">
          <h3>{icono("ademas")}Y además</h3>
        </div>
        <dl class="minis">
          <dt>Salsas extra · 0,95 €</dt><dd>Mayo chipotle · Mayo lima · Salsa verde mexicana · Siracha de coco · Valentina</dd>
          <dt>Picante</dt><dd>Algunos burritos llevan un toque bajo de picante. <b>El extra de picante es gratis</b>, solo hay que pedirlo.</dd>
          <dt>Alérgenos</dt><dd>Cocinamos todo en la misma cocina: no podemos garantizar ausencia de trazas. Si tienes alergia, dínoslo antes de pedir.</dd>
        </dl>
      </section>
''')

bloque = f'''<!-- CARTA:INICIO · generado por carta-html.py desde datos/carta.json · no editar a mano -->
  <div class="carta-nav" id="carta-nav" role="group" aria-label="Elige categoría de la carta">
    <div class="carta-nav-in">
{chr(10).join(nav)}
    </div>
  </div>

  <div class="carta-grid">
    <div class="menu">

{"".join(cuerpo)}
    </div>
  </div>
<!-- CARTA:FIN -->'''

p = RAIZ / "index.html"; s = p.read_text(encoding="utf-8")
if "<!-- CARTA:INICIO" in s:
    s = re.sub(r"<!-- CARTA:INICIO.*?<!-- CARTA:FIN -->", lambda m: bloque, s, flags=re.S)
else:
    a = s.index('  <div class="carta-nav" id="carta-nav"')
    b = s.index("</section>\n\n<!-- ══════════ PEDIDOS GRANDES")
    s = s[:a] + bloque + "\n" + s[b:]
p.write_text(s, encoding="utf-8")
print(f"carta regenerada: {n} platos, {len(nav)} categorías")
