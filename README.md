# Órale Padre · web pública

Landing de los tres restaurantes de Sevilla: carta, pedir para recoger (Last App),
a domicilio (Uber Eats y Glovo), reservar mesa, pedidos grandes y el club.

HTML, CSS y JS a pelo. Sin frameworks, sin build, sin dependencias.
Se abre haciendo doble clic en `index.html`.

> Ojo: esto **no** es la plataforma interna (`orale-padre-app`).
> Son dos proyectos separados a propósito.

---

## Publicar

Sube **toda la carpeta tal cual** (menos `dist/`, `img/orig/` y los `.py`) a la raíz
de `www.oralepadre.com`. Vale cualquier hosting estático: Netlify, Vercel, Cloudflare
Pages, o el FTP del hosting que tengáis. No hace falta servidor ni base de datos.

Archivos que tienen que quedar en la raíz: `index.html`, `club.html`, `legal.html`,
`styles.css`, `script.js`, `robots.txt`, `sitemap.xml`, `site.webmanifest`,
y las carpetas `img/` y `video/`.

Después de tocar el CSS o el JS, ejecutad `python3 sellar.py` para que el navegador
no sirva la versión antigua de la caché.

## Checklist antes de anunciarla

- [x] **Datos de empresa en `legal.html`**: La Baba Hasta El Suelo S.L., CIF B56488323,
      Calle Japón 10. Faltan tomo/folio/hoja del Registro Mercantil, si queréis ponerlos.
- [x] **Horarios**: los tres salen de la ficha de Google (2 sep 2026).
- [ ] **Teléfono de San Luis en Last App**: vuestra tienda tiene 661 01 83 80; el de Google
      (y el de la web) es 672 96 49 07. Corregidlo en el panel de Last App.
- [ ] **Formspree** (gratis, formspree.io): crear un formulario y pegar su URL en
      `CONFIG.cateringForm` y `CONFIG.clubForm`. Sin él, los formularios abren el correo
      ya redactado, que funciona pero es peor en móvil.
- [ ] **WhatsApp de reservas** (`CONFIG.whatsapp`), si queréis recibir las reservas por
      WhatsApp. Sin él, Sevilla Este manda a su reserva online de Last App y los otros
      dos dejan el correo redactado y el teléfono a la vista.
- [ ] **Correo**: ahora todo va a `orale.padre.food@gmail.com`, que es el que figura en
      vuestras tiendas de Last App. Cuando tengáis `@oralepadre.com`, cambiadlo en
      `CONFIG` (tres valores) y en `index.html` / `club.html` / `legal.html`.
- [ ] **Foto del Papi Korean BBQ** y del resto de platos sin foto (los que salen como
      "ticket" crema en la carta).
- [ ] **Cajas Órale en Casa**: los tres botones (`CONFIG.cajas`) avisan de que falta el
      enlace hasta que exista la tienda. Si no vais a venderlas aún, quitad la pestaña.

## Lo que ya está resuelto (y de dónde sale)

| Cosa | Valor | Fuente |
|---|---|---|
| Recoger | Tienda Last App de cada local | `oralepadre.last.shop/es/orale-padre-{san-luis,remedios,sevilla-este}` |
| Uber Eats | Una ficha por local | Fichas públicas de Uber Eats |
| Glovo | Una sola ficha para los tres | Vuestros tres Linktrees apuntan a la misma |
| Teléfonos | 661 01 83 80 · 658 86 93 41 · 672 98 99 17 | Vuestras tiendas de Last App |
| Reserva online | Solo Sevilla Este (Last App bookings) | Linktree de Sevilla Este |
| Valoraciones | Uber 4,5 · Glovo 96 % · Google 4,5 | Fichas públicas, agosto 2026 |
| Nutrición bowls | Estimada por receta, marcada como tal | Ver `CONFIG.nutricion` |

## Ponerla en www.oralepadre.com

El dominio está en DonDominio (los DNS son ns1/ns2.dondominio.com) y ahora mismo
apunta a un servidor que devuelve 404. Hay que cambiar a dónde apunta. Dos caminos:

**A) GitHub Pages (recomendado: gratis, con HTTPS, y cada cambio es un `git push`).**
La carpeta ya es un repositorio git con `CNAME` y `.nojekyll`.

1. Crea un repositorio vacío en github.com (por ejemplo `orale-padre-web`, público).
2. En esta carpeta: `git remote add origin https://github.com/TU_USUARIO/orale-padre-web.git`
   y `git push -u origin main`.
3. En el repositorio: Settings → Pages → Source: "Deploy from a branch", rama `main`, carpeta `/ (root)`.
   Custom domain: `www.oralepadre.com`. Marca "Enforce HTTPS" cuando lo permita.
4. En DonDominio → tu dominio → DNS, deja estos registros (y borra las A actuales):
   - `A    @    185.199.108.153`  ·  `A @ 185.199.109.153`  ·  `A @ 185.199.110.153`  ·  `A @ 185.199.111.153`
   - `CNAME  www   TU_USUARIO.github.io`
5. Espera de 10 minutos a unas horas. `oralepadre.com` redirige solo a `www`.

**B) Netlify (sin git: se arrastra la carpeta).**
1. app.netlify.com/drop → arrastra el contenido descomprimido de `dist/oralepadre-web.zip`.
2. Site settings → Domain management → Add custom domain → `www.oralepadre.com`.
3. En DonDominio: `CNAME www → TU-SITIO.netlify.app` y `A @ → 75.2.60.5`. HTTPS se activa solo.
Para actualizar, se vuelve a arrastrar la carpeta.

En cualquiera de los dos, después de publicar: en Google Search Console dad de alta
`www.oralepadre.com` y enviad `https://www.oralepadre.com/sitemap.xml`.

## Versión en inglés

`en/` se genera desde el castellano con `python3 traducir.py` (diccionario en
`datos/en.tsv`). Tras cualquier cambio de texto: `python3 traducir.py --faltan` dice
qué falta por traducir, se añade al TSV y se vuelve a generar. No editéis `en/` a mano.

## La carta sale de Last App

La carta de la web se genera a partir de vuestros catálogos de Last App, así
que no hay que mantener los precios en dos sitios:

1. `datos/lastapp-<local>.json` son los catálogos que carga vuestra propia tienda
   (`api.last.app/storefront/locations/<local>/catalog/<carta>`). Para refrescarlos,
   abrid la tienda con las herramientas de desarrollo del navegador (pestaña Red),
   buscad esa petición y guardad la respuesta.
2. `python3 carta-desde-lastapp.py` fusiona los tres locales, baja las fotos a
   `img/carta/` y escribe `datos/carta.json`.
3. `python3 carta-html.py` regenera el bloque de la carta en `index.html` (entre
   los marcadores `CARTA:INICIO` y `CARTA:FIN`) y la banda "Los más pedidos".
4. `python3 sellar.py`.

Lo que Last App no tiene y se mantiene a mano en `carta-html.py`: los alérgenos
de la carta impresa (se unen a los de Last App), el picante, las etiquetas y las
salsas del apartado "Y además".

## El carrito propio (apagado)

Hay un compositor de pedido propio, sin pago, que manda el pedido por WhatsApp al
local. Está construido y probado pero **apagado** (`CONFIG.pedidoPropio: false`):
de momento se pide en Last App, que registra el pedido en el local. Para encenderlo,
poned `true` y rellenad `CONFIG.pedidoWhatsapp`.

## El sistema visual

La página está montada como un **cartel de imprenta**: cajas con filete, marcas de
registro en las esquinas (`.tick`), el marco de página (`body::after`), el zigzag del
logo como separador (`.zig`), y las fichas de carta con pestaña de dossier (`.cat`).
Colores y tipos están como variables al principio de `styles.css`.
