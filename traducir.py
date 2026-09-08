#!/usr/bin/env python3
"""
Genera la versión en inglés (carpeta en/) a partir de las páginas en
castellano, que son la única fuente. No hay que mantener dos webs.

    python3 traducir.py            → escribe en/index.html, en/club.html, en/legal.html, en/script.js
    python3 traducir.py --faltan   → lista los textos que aún no tienen traducción

El diccionario está en traducciones_en.py: clave = el HTML interior del
elemento en castellano (con sus <b>, <a>… dentro), valor = lo mismo en
inglés. Lo que no esté en el diccionario se queda en castellano y sale
en la lista de --faltan, así nunca se pierde nada por el camino.
"""
import html.parser, pathlib, re, sys, json

RAIZ = pathlib.Path(__file__).parent
EN = RAIZ / "en"
PAGINAS = ["index.html", "club.html", "legal.html"]
VACIOS = {"img","br","meta","link","input","source","path","circle","hr","area","base","col","embed","param","track","wbr"}
BLOQUE = {"html","head","body","div","section","article","header","footer","nav","main","aside","ul","ol","li","dl","dt","dd",
          "table","thead","tbody","tr","td","th","figure","figcaption","form","fieldset","label","select","option","button","details","summary",
          "h1","h2","h3","h4","h5","h6","p","blockquote","pre","address","script","style","noscript","template","svg","video","picture","input","textarea","mark"}
TRADUCIBLES = {"p","h1","h2","h3","h4","h5","h6","li","dt","dd","figcaption","button","a","span","em","b","i","strong","small",
               "summary","option","td","th","label","legend","title","address","blockquote","cite"}
ATRIBUTOS = {"alt","title","placeholder","aria-label","content"}
METAS = {"description","og:title","og:description","og:image:alt","twitter:title","twitter:description"}

class N:
    def __init__(s, tipo, tag=None, attrs=None, dato=""):
        s.tipo=tipo; s.tag=tag; s.attrs=attrs or []; s.hijos=[]; s.dato=dato

class Arbol(html.parser.HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=False); s.raiz=N("raiz"); s.pila=[s.raiz]
    def handle_starttag(s, tag, attrs):
        n=N("el",tag,list(attrs)); s.pila[-1].hijos.append(n)
        if tag not in VACIOS: s.pila.append(n)
    def handle_startendtag(s, tag, attrs): s.pila[-1].hijos.append(N("el",tag,list(attrs)))
    def handle_endtag(s, tag):
        for i in range(len(s.pila)-1,0,-1):
            if s.pila[i].tag==tag: del s.pila[i:]; break
    def handle_data(s, d): s.pila[-1].hijos.append(N("txt",dato=d))
    def handle_entityref(s, n): s.pila[-1].hijos.append(N("txt",dato=f"&{n};"))
    def handle_charref(s, n): s.pila[-1].hijos.append(N("txt",dato=f"&#{n};"))
    def handle_comment(s, d): s.pila[-1].hijos.append(N("com",dato=d))
    def handle_decl(s, d): s.pila[-1].hijos.append(N("decl",dato=d))

def attr_str(attrs):
    out=""
    for k,v in attrs:
        out += f" {k}" if v is None else f' {k}="{v.replace(chr(34),"&quot;")}"'
    return out

def serial(n):
    if n.tipo=="txt": return n.dato
    if n.tipo=="com": return f"<!--{n.dato}-->"
    if n.tipo=="decl": return f"<!{n.dato}>"
    if n.tipo=="raiz": return "".join(serial(h) for h in n.hijos)
    inner="".join(serial(h) for h in n.hijos)
    return f"<{n.tag}{attr_str(n.attrs)}>" + ("" if n.tag in VACIOS else inner + f"</{n.tag}>")

def norm(t): return re.sub(r"\s+"," ",t).strip()
def tiene_bloque(n): return any(h.tipo=="el" and (h.tag in BLOQUE or tiene_bloque(h)) for h in n.hijos)
def tiene_letras(t): return re.search(r"[A-Za-zÁÉÍÓÚáéíóúÑñ]{3,}", re.sub(r"<[^>]+>","",t)) is not None

# Reglas por patrón, para lo repetitivo (41 botones de alérgenos, precios…)
PATRONES=[
    (re.compile(r"^Ver alérgenos de (.+)$"), r"See allergens for \1"),
    (re.compile(r'^<span class="visually-hidden">Ver alérgenos de (.+?)</span> <span class="plato-signo" aria-hidden="true"></span>$'),
     r'<span class="visually-hidden">See allergens for \1</span> <span class="plato-signo" aria-hidden="true"></span>'),
    (re.compile(r"^(\d+),(\d{2}) (?:€|&euro;)$"), r"€\1.\2"),
    (re.compile(r"^(\d+),(\d{2}) (?:€|&euro;) – (\d+),(\d{2}) (?:€|&euro;)$"), r"€\1.\2 – €\3.\4"),
    (re.compile(r"^Nivel (\d)$"), r"Level \1"),
    (re.compile(r"^(\d+) personas$"), r"\1 people"),
    (re.compile(r"^Para (\d+) personas$"), r"For \1 people"),
    (re.compile(r"^(\d+) tacos surtidos$"), r"\1 assorted tacos"),
    (re.compile(r"^(\d+) bandejas de nachos$"), r"\1 trays of nachos"),
    (re.compile(r"^(\d+) salsas premium$"), r"\1 premium salsas"),
    (re.compile(r"^(\d+),(\d{2}) € por persona$"), r"€\1.\2 per person"),
    (re.compile(r"^\+ envío (\d+),?(\d{0,2}) €$"), lambda m: "+ €"+m.group(1)+("."+m.group(2) if m.group(2) else "")+" shipping"),
    (re.compile(r"^Recoges en local o \+(\d+) € de envío$"), r"Collect in store or +€\1 delivery"),
    (re.compile(r"^(.+) <em class=\"tag tag-solo\">Solo en San Luis</em>$"), r'\1 <em class="tag tag-solo">San Luis only</em>'),
    (re.compile(r"^(.+) <em class=\"tag tag-fus\">Nuevo</em>$"), r'\1 <em class="tag tag-fus">New</em>'),
    (re.compile(r"^(.+) <em class=\"tag tag-fus\">Fusión</em>$"), r'\1 <em class="tag tag-fus">Fusion</em>'),
    (re.compile(r"^(.+) <em class=\"tag tag-veg\">Vegetal</em>$"), r'\1 <em class="tag tag-veg">Plant-based</em>'),
    (re.compile(r"^(.+) <em class=\"tag tag-top\">El de diario</em>$"), r'\1 <em class="tag tag-top">The everyday one</em>'),
    (re.compile(r"^(.+) <em class=\"tag tag-pre\">Premium</em>( <em class=\"tag tag-solo\">Solo en San Luis</em>)?$"), lambda m: m.group(1)+' <em class="tag tag-pre">Premium</em>'+(' <em class="tag tag-solo">San Luis only</em>' if m.group(2) else '')),
]
IGUALES=re.compile(r"^(Arroz|Glovo|Google|Uber Eats|Uber&nbsp;Eats|Last App|Sevilla|San Luis|San&nbsp;Luis|Los Remedios|Sevilla Este|Macarena|Calle&nbsp;Japón|Virgen de&nbsp;Loreto|Órale Padre|My Órale Padre|Chilango|Compadre|Padrino|Esencial|Festín|Patrón|Banquete|Premium|Cheddar|Chipotle|Totopos|Heura|localStorage|tu@email.com|@orale_padre|www\.oralepadre\.com|orale\.padre\.food@gmail\.com|Formspree Inc\.|Kinder Bueno|Oreo Blanco|Galleta Lotus|Filipino Blanco|Bomba de Ferrero|Papi Korean BBQ|Don Juárez|Don Brasa|Don Hampi|Doña Dolores|Doña Juana|Lady Cochinita|Black Chancho|Pollo Padre|Pollo Pastor|Burro .+|Nude .+|Nude Ju&aacute;rez|Taco .+|Tacos (Chancho|Baby Cochinita|Don Pastor)|Tr[ií]o Lalala|Combo (Uno|Duo|Taquero)|Nachos (Guadalupe|Cienfuegos|Bacanos Clásicos)|Alitas Padre|Bacon Cheese Apachurradas|Quesadilla (Pulled Pork|Butter Chicken)|Pulled pork BBQ|Cochinita pibil|Pico de gallo|Guacamole|Salsa verde|Crema agria|Frijoles|Lechuga|Caja (Pareja|Tribu|Reunión)|Cajas? .*|Catering|Combo .*|Crazy burritos|Mexican street food .*|Órale Padre ✦.*|CIF:|Andalucía|Madrid y centro|Cataluña y Levante|Norte de España|Extremadura y Galicia|Resto de península|Coca-Cola .*|Botellín Cruzcampo .*|Agua 1,20 € .*|Mayo chipotle .*|Refrescos · 2,00 €|Cervezas|Otros|Gluten, .*|Apio, .*|Cacahuetes, .*|Altramuces, .*|&times;|Filipino blanco con dulce de leche|Email|Cookies|Web|Instagram)$")

def traducir(arbol, dic, faltan, en_script_ld=False):
    def visita(n, padre):
        if n.tipo=="raiz":
            for h in list(n.hijos): visita(h, n)
            return
        if n.tipo!="el":
            return
        if n.tag=="script" and any(k=="type" and v=="application/ld+json" for k,v in n.attrs):
            for h in n.hijos:
                if h.tipo=="txt":
                    for k,v in dic.items():
                        if "<" in k: continue
                        h.dato = h.dato.replace(json.dumps(k, ensure_ascii=False)[1:-1], json.dumps(v, ensure_ascii=False)[1:-1])
            return
        if n.tag in ("script","style"): return
        if any(k=="class" and "brand" in (v or "") for k,v in n.attrs): return
        # atributos
        nuevos=[]
        for k,v in n.attrs:
            if v and k in ATRIBUTOS and (k!="content" or any(kk in ("name","property") and vv in METAS for kk,vv in n.attrs)):
                key=norm(v)
                if key in dic: v=dic[key]
                else:
                    for rx,rp in PATRONES:
                        if rx.search(key): v=rx.sub(rp,key); break
                    else:
                        if tiene_letras(key) and not IGUALES.match(key): faltan.add(key)
            nuevos.append((k,v))
        n.attrs=nuevos
        # texto interior de elementos hoja (sin bloques dentro)
        if n.tag in TRADUCIBLES and not tiene_bloque(n):
            key=norm(serial(N("raiz")) if False else "".join(serial(h) for h in n.hijos))
            if key:
                if key in dic:
                    n.hijos=[N("txt",dato=dic[key])]; return
                for rx,rp in PATRONES:
                    if rx.search(key):
                        n.hijos=[N("txt",dato=rx.sub(rp,key))]; return
                if tiene_letras(key) and not IGUALES.match(key):
                    faltan.add(key)
        for h in list(n.hijos): visita(h, n)
    visita(arbol, None)

def rutas_en(arbol):
    """Los enlaces relativos apuntan un nivel arriba; las páginas, a su versión en inglés."""
    def visita(n):
        if n.tipo=="raiz":
            for h in n.hijos: visita(h)
            return
        if n.tipo!="el": return
        nuevos=[]
        for k,v in n.attrs:
            if k in ("href","src","poster") and v and not re.match(r"^(https?:|mailto:|tel:|#|//|data:)", v):
                if v in ("en/","en/index.html","en/club.html","en/legal.html"):
                    v = v.replace("en/","").replace("index.html","")  # de la EN, vuelta a la ES
                    v = "../"+v if v else "../"
                elif re.match(r"^(index|club|legal)\.html", v):
                    pass   # la misma página en inglés, en la misma carpeta
                else:
                    v="../"+v
            if k=="lang" and v=="es": v="en"
            if k=="hreflang" and v=="en" and n.tag=="a": v="es"
            if k=="href" and v=="../" and n.tag=="a" and any(kk=="class" and "lang" in (vv or "") for kk,vv in n.attrs): v="../"
            nuevos.append((k,v))
        n.attrs=nuevos
        for h in n.hijos: visita(h)
    visita(arbol)

def procesa(pagina, dic, faltan):
    a=Arbol(); a.feed((RAIZ/pagina).read_text(encoding="utf-8"))
    traducir(a.raiz, dic, faltan)
    rutas_en(a.raiz)
    out=serial(a.raiz)
    # cabecera: idioma, canónica, hreflang cruzado, og:locale
    out=out.replace('<html lang="es">','<html lang="en">')
    out=re.sub(r'<link rel="canonical" href="https://www\.oralepadre\.com/([^"]*)">', lambda m: f'<link rel="canonical" href="https://www.oralepadre.com/en/{"" if m.group(1)=="" else m.group(1)}">', out)
    out=out.replace('<meta property="og:locale" content="es_ES">','<meta property="og:locale" content="en_GB">')
    out=re.sub(r'<meta property="og:url" content="https://www\.oralepadre\.com/">','<meta property="og:url" content="https://www.oralepadre.com/en/">',out)
    # el selector de idioma: en la versión inglesa vuelve a la española
    out=out.replace('aria-label="English version">EN</a>','aria-label="Versión en español">ES</a>').replace('>English version</a>','>Versión en español</a>')
    out=re.sub(r'(<a class="(?:nav-lang|mobnav-lang) mono" href=")[^"]*(" hreflang=")en(" lang=")en', lambda m: m.group(1)+("../" if pagina=="index.html" else "../"+pagina)+m.group(2)+"es"+m.group(3)+"es", out)
    return out

def script_en(dic):
    """Las cadenas del JS que estén en el diccionario se traducen tal cual."""
    js=(RAIZ/"script.js").read_text(encoding="utf-8")
    pares=sorted(((k,v) for k,v in dic.items() if "<" not in k), key=lambda kv:-len(kv[0]))
    for k,v in pares:
        for q in ("'",'"'):
            js=js.replace(q+k+q, q+v.replace(q,"\\"+q)+q)
    return js

if __name__=="__main__":
    DIC={}
    for linea in (RAIZ/"datos"/"en.tsv").read_text(encoding="utf-8").splitlines():
        if " ⇒ " in linea and not linea.startswith("#"):
            k,v=linea.split(" ⇒ ",1); DIC[norm(k)]=v.strip()
    faltan=set(); salidas={}
    for pag in PAGINAS: salidas[pag]=procesa(pag, DIC, faltan)
    if "--faltan" in sys.argv:
        for k in sorted(faltan, key=lambda x:(len(x),x)): print(k)
        print(f"\n{len(faltan)} textos sin traducir", file=sys.stderr); sys.exit(0)
    EN.mkdir(exist_ok=True)
    for pag,out in salidas.items(): (EN/pag).write_text(out, encoding="utf-8")
    (EN/"script.js").write_text(script_en(DIC), encoding="utf-8")
    print(f"en/ generado · {len(faltan)} textos siguen en castellano" + (" (ver --faltan)" if faltan else ""))
