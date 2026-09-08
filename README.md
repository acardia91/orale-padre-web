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

- [ ] **Datos de empresa en `legal.html`**: lo que está en amarillo (razón social, CIF,
      domicilio social, inscripción registral). Y borrar el aviso amarillo.
- [ ] **Horarios**: los de Los Remedios y Sevilla Este salen de la ficha de Google
      (2 sep 2026). Los de San Luis son una estimación: confirmadlos en `index.html`,
      sección `locales`.
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
