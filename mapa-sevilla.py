#!/usr/bin/env python3
"""
Dibuja el mapa de la sección Locales: silueta del término municipal de
Sevilla (OpenStreetMap, vía Nominatim), el Guadalquivir y la dársena
(Overpass), y un pin por local, más Tomares como "próximamente".

    python3 mapa-sevilla.py   → sustituye el bloque <!-- MAPA:INICIO --> … <!-- MAPA:FIN --> de index.html

Los datos están en datos/osm-*.json. Las coordenadas de los locales son
las mismas que usa script.js para calcular el más cercano.
"""
import json, math, pathlib, re, sys
sys.setrecursionlimit(20000)

RAIZ = pathlib.Path(__file__).parent
LOCALES = [  # (clave, etiqueta, lat, lng)
    ("sanLuis", "San Luis · Macarena", 37.4010, -5.9895),
    ("remedios", "Los Remedios", 37.3775, -6.0080),
    ("sevillaEste", "Sevilla Este", 37.4045, -5.9210),
]
TOMARES = ("Tomares · pronto", 37.3730, -6.0460)

# Ventana: la ciudad y Tomares, con aire
LAT0, LAT1, LNG0, LNG1 = 37.325, 37.455, -6.095, -5.865
W, H = 640, 480
kx = math.cos(math.radians((LAT0 + LAT1) / 2))
def xy(lng, lat):
    x = (lng - LNG0) / (LNG1 - LNG0) * W
    y = (LAT1 - lat) / (LAT1 - LAT0) * H
    return x, y
# corrige la proporción para que no se estire (lng se encoge por cos(lat))
anchoReal = (LNG1 - LNG0) * kx; altoReal = LAT1 - LAT0
H = round(W * altoReal / anchoReal)

def simplifica(pts, tol):
    """Douglas-Peucker, para que 15.000 puntos se queden en unos cientos."""
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1; n = math.hypot(dx, dy) or 1e-9
    imax, dmax = 0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / n
        if d > dmax: imax, dmax = i, d
    if dmax > tol:
        return simplifica(pts[:imax + 1], tol)[:-1] + simplifica(pts[imax:], tol)
    return [pts[0], pts[-1]]

def simplifica_anillo(pts, tol):
    """Un anillo cerrado empieza y acaba en el mismo punto: Douglas-Peucker
    lo vería como un segmento de longitud cero. Se parte en dos mitades."""
    if len(pts) > 2 and pts[0] == pts[-1]: pts = pts[:-1]
    mitad = len(pts) // 2
    return simplifica(pts[:mitad + 1], tol)[:-1] + simplifica(pts[mitad:] + [pts[0]], tol)[:-1]

def path(pts, cerrar=False):
    d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    return d + (" Z" if cerrar else "")

# ── término municipal ──
nom = json.load(open(RAIZ / "datos" / "osm-sevilla.json", encoding="utf-8"))
def npuntos(g):
    c = g.get("coordinates") or []
    return sum(len(r) for r in c) if g["type"] == "Polygon" else sum(len(p[0]) for p in c if p)
geo = max((r["geojson"] for r in nom if r.get("geojson", {}).get("type") in ("Polygon", "MultiPolygon")), key=npuntos)
anillos = [geo["coordinates"][0]] if geo["type"] == "Polygon" else [p[0] for p in geo["coordinates"] if p]
silueta = ""
for anillo in anillos:
    pts = [xy(lng, lat) for lng, lat in anillo]
    pts = simplifica_anillo(pts, 1.2)
    silueta += path(pts, True) + " "

# ── silueta urbana: la SE-30, que rodea la ciudad ──
# Son muchos tramos sueltos (dos calzadas). Se convierten en una envolvente
# cerrada: se recorren los puntos ordenados por ángulo alrededor del centro
# y se toma el más lejano por sector. Lee como "la ciudad", que es lo que importa.
se30 = json.load(open(RAIZ / "datos" / "osm-se30.json", encoding="utf-8"))
puntos = [xy(p["lon"], p["lat"]) for w in se30.get("elements", []) for p in w.get("geometry", [])]
anillo_se30 = ""
if puntos:
    cx = sum(x for x, _ in puntos) / len(puntos); cy = sum(y for _, y in puntos) / len(puntos)
    sectores = {}
    for x, y in puntos:
        a = int(math.degrees(math.atan2(y - cy, x - cx)) // 4)   # 90 sectores de 4°
        r = math.hypot(x - cx, y - cy)
        if a not in sectores or r > sectores[a][0]: sectores[a] = (r, x, y)
    borde = [(x, y) for _, x, y in (sectores[k] for k in sorted(sectores))]
    # suavizado ligero: media móvil de 3
    n = len(borde)
    borde = [((borde[i-1][0] + borde[i][0] + borde[(i+1) % n][0]) / 3, (borde[i-1][1] + borde[i][1] + borde[(i+1) % n][1]) / 3) for i in range(n)]
    anillo_se30 = path(borde, True)

# ── río y dársena ──
rio = json.load(open(RAIZ / "datos" / "osm-rio.json", encoding="utf-8"))
tramos = []
for w in rio.get("elements", []):
    nombre = w.get("tags", {}).get("name", "")
    if not re.search(r"Río Guadalquivir|Alfonso XIII", nombre): continue
    pts = [xy(p["lon"], p["lat"]) for p in w.get("geometry", [])]
    if len(pts) > 1: tramos.append(path(simplifica(pts, 1.0)))

pins = ""
for i, (clave, etiqueta, lat, lng) in enumerate(LOCALES):
    x, y = xy(lng, lat)
    # etiqueta a la derecha, salvo que se salga
    lado = -1 if x > W - 150 else 1
    ancla = "end" if lado < 0 else "start"
    pins += f'''
    <a class="pin" data-local="{i}" href="#loc-{i}" aria-label="{etiqueta}">
      <circle class="pin-halo" cx="{x:.1f}" cy="{y:.1f}" r="16"/>
      <circle class="pin-punto" cx="{x:.1f}" cy="{y:.1f}" r="9"/>
      <text class="pin-n" x="{x:.1f}" y="{y + 3.5:.1f}" text-anchor="middle">{i + 1}</text>
      <text class="pin-txt" x="{x + lado * 16:.1f}" y="{y + 4:.1f}" text-anchor="{ancla}">{etiqueta}</text>
    </a>'''
tx, ty = xy(TOMARES[2], TOMARES[1])
pins += f'''
    <g class="pin pin-pronto" aria-label="{TOMARES[0]}">
      <circle class="pin-punto" cx="{tx:.1f}" cy="{ty:.1f}" r="8"/>
      <text class="pin-txt" x="{tx + 14:.1f}" y="{ty + 4:.1f}" text-anchor="start">{TOMARES[0]}</text>
    </g>'''

svg = f'''<!-- MAPA:INICIO · generado por mapa-sevilla.py · no editar a mano -->
  <figure class="mapa tick" aria-label="Mapa de Sevilla con los tres locales">
    <svg class="mapa-svg" viewBox="0 0 {W} {H}" role="img" aria-labelledby="mapa-t">
      <title id="mapa-t">Los tres locales de Órale Padre sobre el mapa de Sevilla, y Tomares próximamente</title>
      <path class="mapa-termino" d="{silueta.strip()}"/>
      <path class="mapa-ciudad" d="{anillo_se30}"/>
      <g class="mapa-rio">{"".join(f'<path d="{t}"/>' for t in tramos)}</g>
      <text class="mapa-rotulo" x="{W - 14}" y="{H - 14}" text-anchor="end">Sevilla · Guadalquivir</text>
      <text class="mapa-norte" x="20" y="28">N</text>{pins}
    </svg>
    <figcaption class="mono">Pulsa un local para ir a su ficha. Tomares, en camino.</figcaption>
  </figure>
<!-- MAPA:FIN -->'''

p = RAIZ / "index.html"; s = p.read_text(encoding="utf-8")
if "<!-- MAPA:INICIO" in s:
    s = re.sub(r"<!-- MAPA:INICIO.*?<!-- MAPA:FIN -->", lambda m: svg, s, flags=re.S)
else:
    viejo = re.search(r'  <figure class="locales-foto">.*?</figure>\n', s, re.S)
    s = s[:viejo.start()] + svg + "\n" + s[viejo.end():]
p.write_text(s, encoding="utf-8")
print(f"mapa: {len(silueta)//60} segmentos de contorno, {len(tramos)} tramos de río, viewBox {W}x{H}")
