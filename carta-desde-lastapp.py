#!/usr/bin/env python3
"""
Fusiona los catálogos de Last App de los tres locales en datos/carta.json
y baja las fotos de producto a img/carta/.

Los catálogos son los JSON públicos que carga vuestra propia tienda
(api.last.app/storefront/locations/<local>/catalog/<carta>). Para
refrescarlos: abrid la tienda con las herramientas de desarrollo y
guardad esa respuesta en datos/lastapp-<local>.json. Luego:

    python3 carta-desde-lastapp.py
"""
import json, pathlib, re, unicodedata, urllib.request, io, sys
from PIL import Image

RAIZ = pathlib.Path(__file__).parent
DATOS = RAIZ / "datos"
IMG = RAIZ / "img" / "carta"
IMG.mkdir(parents=True, exist_ok=True)

LOCALES = [("remedios", "Los Remedios"), ("sevilla-este", "Sevilla Este"), ("san-luis", "San Luis")]

# Orden y nombre de las categorías en la web (clave = nombre en Last App normalizado)
CATEGORIAS = [
    ("burritos",   "Burritos",    ["burros", "burritos"]),
    ("combos",     "Combos",      ["combo"]),
    ("botanas",    "Botanas",     ["botanas"]),
    ("nudes",      "Bowls",       ["nudes", "desnudos"]),
    ("tacos",      "Tacos",       ["tacos"]),
    ("quesadillas","Quesadillas", ["quesadillas"]),
    ("postres",    "Postres",     ["antojos", "postres"]),
    ("promos",     "Promos",      ["menu mediodia (jueves y viernes)", "promo lunes y miercoles", "promo marte tacos 3x2", "3x2 tacos promo martes"]),
    ("bebidas",    "Bebidas",     ["bebidas"]),
]
ALERGENOS = {"gluten": "Gluten", "eggs": "Huevos", "milk": "Leche", "peanuts": "Cacahuetes",
             "tree-nuts": "Frutos de cáscara", "soy": "Soja", "celery": "Apio", "sulphites": "Sulfitos",
             "mustard": "Mostaza", "sesame": "Sésamo", "fish": "Pescado", "crustaceans": "Crustáceos",
             "molluscs": "Moluscos", "lupin": "Altramuces"}
DESCARTAR = re.compile(r"promo quesadilla 5 enero", re.I)   # promo caducada que sigue en el catálogo

def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", s).strip()

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", norm(s)).strip("-")

def titulo(nombre):
    """PAPI KOREAN BBQ -> Papi Korean BBQ; NUDE JUÁREZ -> Nude Juárez. Respeta siglas."""
    if nombre != nombre.upper():
        nombre = nombre[0].upper() + nombre[1:]
        return re.sub(r"\b(pastor|cochinita|chancho|buffalo|juarez)\b", lambda m: m.group(1).capitalize(), nombre)
    palabras = []
    for p in nombre.split():
        palabras.append(p if p in ("BBQ", "0.0", "3X2", "3x2") else p.capitalize())
    return " ".join(palabras)

def limpia_desc(d):
    d = re.sub(r"#\w+", "", d or "")                 # fuera hashtags
    d = re.sub(r"^\s*¡?nuevo!?\s*", "", d, flags=re.I)  # "Nuevo!" pasa a etiqueta
    d = re.sub(r"\s+,", ",", d); d = re.sub(r"\s{2,}", " ", d).strip()
    return d

def cat_web(nombre_lastapp):
    n = norm(nombre_lastapp)
    for clave, _, alias in CATEGORIAS:
        if n in alias: return clave
    return None

maestro = {}   # slug -> item
orden_cat = {} # slug -> (cat, posición)
populares = [] # nombres normalizados por orden de popularidad (Remedios manda)

for clave_local, nombre_local in LOCALES:
    f = DATOS / f"lastapp-{clave_local}.json"
    if not f.exists(): print("falta", f); continue
    d = json.load(open(f, encoding="utf-8"))
    items = d["items"]
    if clave_local == "remedios":
        populares = [norm(items[i]["name"]) for i in d.get("popularItems", []) if i in items]
    for pos_c, c in enumerate(d["categories"]):
        cw = cat_web(c["name"])
        if not cw: print("categoría sin sitio en la web:", c["name"]); continue
        for pos_i, iid in enumerate(c["items"]):
            it = items.get(iid)
            if not it or DESCARTAR.search(it["name"]): continue
            # "Tacos X" (3 uds, San Luis) y "Taco X" (1 ud, resto) son productos distintos: se quedan los dos
            s = slug(it["name"])
            precio = (it.get("price") or 0) / 100
            entrada = maestro.setdefault(s, {
                "slug": s, "nombre": titulo(it["name"].strip()), "cat": cw,
                "desc": limpia_desc(it.get("description")), "alergenos": set(),
                "imageId": it.get("imageId"), "precios": {}, "locales": [],
                "nuevo": bool(re.match(r"\s*¡?nuevo", it.get("description") or "", re.I)),
            })
            if not entrada["desc"]: entrada["desc"] = limpia_desc(it.get("description"))
            if not entrada["imageId"]: entrada["imageId"] = it.get("imageId")
            entrada["alergenos"].update(ALERGENOS.get(a, a) for a in (it.get("allergens") or []))
            entrada["precios"][clave_local] = precio
            entrada["locales"].append(clave_local)
            orden_cat.setdefault(s, (pos_c, pos_i))

# popularidad
for s, it in maestro.items():
    n = norm(it["nombre"]); n2 = norm(re.sub(r"^burro ", "", it["nombre"]))
    rank = next((i for i, p in enumerate(populares) if p in (n, n2, norm("burro " + it["nombre"]))), None)
    it["popular"] = rank

# precio: el más común; si difiere entre locales, se anota
for it in maestro.values():
    ps = list(it["precios"].values())
    it["precio"] = max(set(ps), key=ps.count) if ps else 0
    it["precio_varia"] = len(set(ps)) > 1
    it["alergenos"] = sorted(it["alergenos"])

# fotos
def baja(image_id, destino):
    if destino.exists(): return True
    for w in (900, 600, 290):
        url = f"https://res.cloudinary.com/lastpos/image/upload/f_jpg,q_auto:good,w_{w},h_{w},c_lfill/{image_id}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            data = urllib.request.urlopen(req, timeout=30).read()
            im = Image.open(io.BytesIO(data)).convert("RGB")
            im.save(destino, "JPEG", quality=82, optimize=True, progressive=True)
            return True
        except Exception as e:
            ultimo = e
    print("  sin foto:", image_id, ultimo); return False

for it in sorted(maestro.values(), key=lambda x: orden_cat[x["slug"]]):
    if it["imageId"]:
        destino = IMG / f"{it['slug']}.jpg"
        if baja(it["imageId"], destino): it["foto"] = f"img/carta/{it['slug']}.jpg"
        else: it["foto"] = None
    else:
        it["foto"] = None

lista = sorted(maestro.values(), key=lambda x: ([c[0] for c in CATEGORIAS].index(x["cat"]), -len(x["locales"]), orden_cat[x["slug"]]))
for it in lista: it.pop("imageId", None); it.pop("precios_raw", None)
json.dump({"categorias": [{"clave": c, "nombre": n} for c, n, _ in CATEGORIAS], "items": lista},
          open(DATOS / "carta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print(f"\n{len(lista)} productos → datos/carta.json · fotos en img/carta/ ({sum(1 for i in lista if i['foto'])} con foto)")
for it in lista:
    marca = ("★%d " % (it["popular"] + 1)) if it["popular"] is not None and it["popular"] < 10 else "   "
    print(f"{marca}[{it['cat']:11}] {it['nombre'][:32]:32} {it['precio']:>5.2f}€{'*' if it['precio_varia'] else ' '} "
          f"{'foto' if it['foto'] else '----'} {'/'.join(l[:3] for l in it['locales']):11} {','.join(it['alergenos'])[:28]}")
print("\n* = el precio no es igual en los tres locales:", {i['nombre']: i['precios'] for i in lista if i['precio_varia']})
