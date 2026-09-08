#!/usr/bin/env python3
"""
Empaqueta la web en UN SOLO archivo, con el CSS, el JS y las imagenes
metidos dentro. Sirve para publicarla como Artifact o para mandarla por
correo y que se abra sin nada alrededor.

    python3 build-artifact.py

Genera dist/artifact.html

La web de verdad (la que va a Vercel) sigue siendo index.html + styles.css
+ script.js + img/. Esto es solo un empaquetado para previsualizar.

ORDEN IMPORTANTE: primero se toca el HTML, y las imagenes se incrustan al
final. Al reves, cualquier busqueda tendria que recorrer megas de base64.
"""

import base64
import pathlib
import re

RAIZ = pathlib.Path(__file__).parent
DEST = RAIZ / "dist"
DEST.mkdir(exist_ok=True)

MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4"}
VIDEO_URL = "https://www.youtube.com/shorts/qlm46ZV3hUk"

import sys
PAGINA = sys.argv[1] if len(sys.argv) > 1 else "index.html"
SALIDA = sys.argv[2] if len(sys.argv) > 2 else "artifact.html"
ENLACE_CLUB = sys.argv[3] if len(sys.argv) > 3 else ""

html = (RAIZ / PAGINA).read_text(encoding="utf-8")
css = (RAIZ / "styles.css").read_text(encoding="utf-8")
js = (RAIZ / "script.js").read_text(encoding="utf-8")


def a_data_uri(ruta_rel: str) -> str:
    f = RAIZ / ruta_rel
    datos = base64.b64encode(f.read_bytes()).decode("ascii")
    return f"data:{MIME[f.suffix.lower()]};base64,{datos}"


# ── 1) Trocear el HTML ──
titulo = "My Órale Padre" if PAGINA == "club.html" else "Órale Padre"
fuentes = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis[^>]+>', html).group(0)
cuerpo = re.search(r"<body>(.*)</body>", html, re.S).group(1)
cuerpo = cuerpo.replace('<script src="script.js"></script>', "")

# ── 2) El video ──
# El visor de Artifacts bloquea todo recurso externo, asi que el iframe de
# YouTube saldria en blanco. Aqui lo cambiamos por una portada con foto
# nuestra y un enlace. En la web de verdad el iframe se queda y reproduce.
# Buscamos por posicion, no con regex: es una sola etiqueta y asi no hay
# que barrer todo el documento.
ini = cuerpo.find("<iframe")
if ini != -1:
    fin = cuerpo.find("</iframe>", ini) + len("</iframe>")
    cuerpo = (
        cuerpo[:ini]
        + f'<a class="video-fuera" href="{VIDEO_URL}" target="_blank" rel="noopener">'
        + '<img src="__PORTADA__" alt="Nachos Guadalupe">'
        + '<span class="video-play" aria-hidden="true"></span>'
        + "<span class=\"video-txt\">Ver el vídeo en YouTube</span>"
        + "</a>"
        + cuerpo[fin:]
    )
    css += """
/* solo en el paquete: portada del video, porque el iframe no carga aqui */
.video-fuera{ position:relative; display:block; width:100%; height:100%; }
.video-fuera img{ width:100%; height:100%; object-fit:cover; }
.video-fuera::after{
  content:""; position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(36,26,28,.15), rgba(36,26,28,.78));
}
.video-play{
  position:absolute; left:50%; top:50%; z-index:1;
  width:0; height:0; margin:-19px 0 0 -12px;
  border-left:32px solid #F5EEE6;
  border-top:19px solid transparent;
  border-bottom:19px solid transparent;
}
.video-txt{
  position:absolute; left:0; right:0; bottom:18px; z-index:1;
  text-align:center; color:#F5EEE6;
  font-size:12px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
}
"""
    print("video -> portada con enlace")

# ── 2b) El vídeo de portada ──
# Lo inyecta el JS al cargar. Aquí no puede cargar (mismo bloqueo), así que
# le quitamos el identificador: el script sale antes de crear nada y la
# portada se queda con la foto, que es justo el respaldo previsto.
# el video de portada es nuestro y va incrustado: aqui no hay que quitar nada

# el paquete es un solo archivo: el enlace a club.html no existiria dentro,
# asi que apunta al artefacto de esa pagina si nos lo han pasado
if ENLACE_CLUB:
    cuerpo = cuerpo.replace('href="club.html"', f'href="{ENLACE_CLUB}" target="_blank" rel="noopener"')
    cuerpo = cuerpo.replace('href="index.html', f'href="#')
else:
    cuerpo = cuerpo.replace('href="club.html"', 'href="#club"')

# ── 3) Todo a ASCII puro ──
# Al quitar el <meta charset>, las tildes dependian de que quien abriera el
# archivo acertara con la codificacion. Escapadas, se ve igual en cualquier
# sitio. En el HTML van como entidades; en el JS como escapes, porque dentro
# de <script> las entidades no se interpretan.
titulo = titulo.encode("ascii", "xmlcharrefreplace").decode("ascii")
cuerpo = cuerpo.encode("ascii", "xmlcharrefreplace").decode("ascii")
js = js.encode("ascii", "backslashreplace").decode("ascii")

# en el CSS lo unico con tildes son comentarios, que el navegador ignora
css = css.translate(str.maketrans("áéíóúÁÉÍÓÚñÑüÜ¡¿·—→", "aeiouAEIOUnNuU!?-->"))
css = css.encode("ascii", "replace").decode("ascii")

# ── 4) Ahora si, las imagenes ──
usadas = sorted(set(re.findall(r'(?:src|href)="((?:img|video)/[^"]+)"', cuerpo)))
for rel in usadas:
    cuerpo = cuerpo.replace(f'"{rel}"', f'"{a_data_uri(rel)}"')
cuerpo = cuerpo.replace("__PORTADA__", a_data_uri("img/nachos-cienfuegos.jpg"))
print(f"imagenes incrustadas: {len(usadas)}")

salida = (
    f"<title>{titulo}</title>\n"
    f"{fuentes}\n"
    f"<style>\n{css}\n</style>\n"
    f"{cuerpo}\n"
    f"<script>\n{js}\n</script>\n"
)

assert salida.isascii(), "queda algo fuera de ASCII"
# el JS menciona youtube-nocookie para la portada, pero sin data-video no
# llega a ejecutarse. Lo que hay que garantizar es que no quede ninguna
# etiqueta <iframe> en el marcado, que es lo que el visor bloquearia.
assert "<iframe" not in cuerpo, "queda un iframe en el marcado"
assert "youtube" not in cuerpo, "queda una referencia a YouTube en el marcado"

destino = DEST / SALIDA
destino.write_text(salida, encoding="utf-8")
print(f"{destino}  ->  {len(salida.encode('utf-8')) / 1024 / 1024:.2f} MB")
