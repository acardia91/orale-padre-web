#!/usr/bin/env python3
"""
Pone un sello de version en los enlaces a styles.css y script.js.

El sello sale del contenido del archivo, asi que cambia solo cuando
cambia el archivo. Sin esto el navegador sirve la version vieja de la
cache y parece que los cambios no se han aplicado.

    python3 sellar.py     ← ejecutar despues de tocar el CSS o el JS
"""
import hashlib, pathlib, re

raiz = pathlib.Path(__file__).parent
css = hashlib.md5((raiz / "styles.css").read_bytes()).hexdigest()[:8]
js = hashlib.md5((raiz / "script.js").read_bytes()).hexdigest()[:8]

for nombre in ("index.html", "club.html", "legal.html"):
    h = raiz / nombre
    if not h.exists():
        continue
    s = h.read_text(encoding="utf-8")
    s = re.sub(r'href="styles\.css(\?v=[a-f0-9]+)?"', f'href="styles.css?v={css}"', s)
    s = re.sub(r'src="script\.js(\?v=[a-f0-9]+)?"', f'src="script.js?v={js}"', s)
    h.write_text(s, encoding="utf-8")
print(f"sellado · styles.css?v={css} · script.js?v={js} · index, club y legal")
