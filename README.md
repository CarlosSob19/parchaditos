# Parchaditos

- `web/`: sitio web estático (HTML, CSS y JS sin build). Es lo que se sube al hosting.
- `mobile/`: app de Expo (iOS y Android). Solo muestra licores, servicios y reservas, por las políticas de App Store y Google Play.
- `functions/`: función de Cloudflare que lee el catálogo de Loyverse.

Pedidos y reservas llegan por WhatsApp. Hosting, QR de las mesas y Loyverse están en [FINALIZACION-Y-HOSTING.md](FINALIZACION-Y-HOSTING.md).

---

## 1. Páginas de la web

| Página | Qué tiene |
|---|---|
| `index.html` | Inicio visual: portada (con video si lo pones), cifras, categorías, "La noche", galería del sitio, servicios, reseñas y cómo llegar. |
| `productos.html` | Catálogo completo: filtros por categoría, búsqueda, carrito y preguntas frecuentes. `productos.html?cat=licores` abre una categoría. |
| `reservas.html` | Reserva en 5 pasos que termina en WhatsApp. |
| `privacidad.html`, `404.html` | Legal y página no encontrada. |

Arriba está el **header** con el menú. Al bajar y pasar el título grande de cada página (el que tiene `data-hub-after` en el HTML), el header se va y aparece el **dock** abajo (Inicio, Productos, Reservar, WhatsApp, Pedido). Al volver arriba se cambian otra vez. El **pedido** junta varios productos y los manda en un solo mensaje de WhatsApp; se guarda en el navegador del cliente. En modo mesa (QR) se usa la barra de la mesa en su lugar.

## 2. Datos del negocio (antes de publicar)

| Qué | Web (`web/js/config.js`) | App (`mobile/src/constants/config.ts`) |
|---|---|---|
| WhatsApp, dirección, ciudad, mapa, redes, correo | `WHATSAPP`, `INFO` | `WHATSAPP`, `INFO` |
| Horario (también arma el pie de página, las cifras y los datos de Google) | `HOURS` | `HOURS` + `INFO.horario` |
| Productos y precios | `PRODUCTS` (o Loyverse) | `DRINKS` (o Loyverse, el mismo catálogo de la web) |
| "Desde $X" en cada categoría del inicio | `CATEGORIES` → `desde` | — |
| Ocultar una categoría completa | `CATEGORIES` → `activo: false` | — |
| Servicios, zonas VIP, sabores | `SERVICES`, `ZONES`, `HOOKAH_FLAVORS` | los mismos nombres |
| Video o foto de portada | `HERO` | — |
| Objeto 3D de la portada (en el centro, sobre PARCHADITOS) | `HERO.modelo` (archivo `.glb`, máx. 5 MB) o `HERO.objeto` (PNG sin fondo) | — |
| Galería "Así se ve" | `GALLERY` | `GALLERY` |
| Reseñas (la sección aparece cuando hay al menos una) | `REVIEWS` | `REVIEWS` |
| Preguntas frecuentes | `FAQ` | `FAQ` |
| Dominio | `robots.txt`, `sitemap.xml` y la línea `og:image` de cada HTML (`TU-DOMINIO.com`) | `DOMINIO` |
| Loyverse | `LOYVERSE` | `LOYVERSE` (solo categorías permitidas en las tiendas) |

Las cifras del inicio (zonas VIP, sabores, productos, hora de cierre) se calculan solas con estos datos. No hay que editarlas a mano.

## 3. Fotos y video

**Cómo tomar las fotos paso a paso** (ajustes del iPhone, luz, edición, errores comunes y qué app usar para el 3D): [GUIA-FOTOS-Y-3D.md](GUIA-FOTOS-Y-3D.md). Para pasarlas a la web y a la app sin tocar código: `python tools/preparar-fotos.py`.

**Archivos de diseño:** `diseno/` guarda los originales del logo (el SVG de CorelDRAW y la imagen con la que se trazó el actual). No se publican; la web usa `web/assets/logo.svg`.

**Logo como signo de pregunta:** todos los "?" y "¿" del sitio se dibujan con el logo (`web/assets/logo.svg`) gracias a una mini fuente (`web/assets/fonts/signo.woff2`). Si cambias el logo: `python tools/trazar-logo.py logo.png` (si es PNG), luego `python tools/fuente-signo.py`, y sube el número `?v=` del archivo de fuente en `css/styles.css` y en el preload de cada página.

Los íconos (`favicon`, `icon-*`, `apple-touch-icon`) y `og.jpg` ya existen con un diseño provisional (la "P" roja). Si mandas el logo en vector, se regeneran con él.

El estilo que buscamos es el de las webs de marcas de lujo y deportes de motor: **fotos de noche, oscuras y con mucho contraste, luz roja o cálida, poco ruido en el fondo y el producto como protagonista.** Todo con el mismo tipo de luz y encuadre, para que se vea como una sola sesión.

### Web (`web/assets/`)

| Archivo | Formato | Qué foto | Dónde se usa |
|---|---|---|---|
| `video/hero.mp4` | Horizontal 1920×1080, 8 a 15 s en bucle, sin audio, máx. 6 MB | Humo de hookah a contraluz rojo en cámara lenta, una botella sirviéndose, siluetas del ambiente | Portada (`HERO.video`) |
| `video/hero-movil.mp4` | Vertical 1080×1920, igual que el anterior | La misma toma, encuadrada en vertical | Portada en celular (`HERO.videoMovil`) |
| `galeria/hero.jpg` | 1920×1080 | Un fotograma del video, o la mejor foto del local | Mientras carga el video (`HERO.poster`) |
| `categorias/licores.png`, `vapes.png`, `blunts.png`, `granizados.png` | PNG **sin fondo**, ~1000 px | Bodegón del producto: una botella con un vaso con hielo; 2 o 3 vapes; wraps en abanico; un granizado con gotas de frío. Fondo liso para recortarlo fácil | Tarjetas grandes de categorías (`CATEGORIES[].img`) |
| `productos/<id>.jpg` | 800×600, **fondo oscuro igual en todas** | Cada producto solo, en ángulo 3/4, misma luz lateral. El nombre del archivo es el `id` del producto (ej. `vape-5000.jpg`, `aguardiente.jpg`) | Catálogo (`PRODUCTS[].img`) |
| `galeria/vip-1.jpg` | Vertical 1200×1600 | Zona VIP 1 con sus luces encendidas, sin gente o con gente de espaldas | Galería |
| `galeria/hookah.jpg` | 1200×1200 | Primer plano de la hookah con humo | Galería |
| `galeria/granizados.jpg` | 1200×1200 | Granizados en la barra, con gotas de frío | Galería |
| `galeria/vip-2.jpg` | Horizontal 2000×1000 | La terraza VIP 2 completa | Galería (ancha) |
| `galeria/noche.jpg` | Vertical 1200×1600 | El salón lleno un sábado, con movimiento o luces | Galería |
| `galeria/botellas.jpg` | 1200×1200 | Botellas servidas en la mesa | Galería |
| `logo.svg` | Vector | Logo | Header (ver comentario en `index.html`) y para regenerar los íconos |

Después de copiar cada foto, pon su ruta en `config.js` (ej. `img: "assets/galeria/vip-1.jpg"`).

### App (`mobile/assets/images/`)

| Archivo | Qué |
|---|---|
| `galeria/*.jpg` | Las mismas fotos de la galería de la web (sin vapes ni wraps: políticas de las tiendas) |
| `productos/<id>.jpg` | Fotos de las bebidas de `DRINKS`, mismo estilo que en la web |
| `icon.png` (1024×1024), `splash-icon.png`, `android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`, `favicon.png` | Íconos de la app, con el mismo nombre |

En la app las fotos se conectan con `require`, ej. `img: require('@/assets/images/galeria/vip-1.jpg')`.
El ícono de iOS sale de `mobile/assets/expo.icon` (formato Icon Composer). Si no lo vas a usar, en `app.json` cambia `"ios": { "icon": ... }` por `"./assets/images/icon.png"`.

**Tips para la sesión:** de noche y con las luces del local; celular en modo foto (no retrato) y apoyado para que no salga movido. No incluyas caras de clientes sin permiso, ni a nadie que parezca menor de edad.

### La galería "Así se ve" (sección "03 — El sitio")

Es la galería de fotos del local, en la web y en la app, para que la gente vea cómo es el sitio antes de ir.

**Mientras no hay fotos**, cada espacio muestra un fondo oscuro con rojo y una palabra grande con borde. Esa palabra es de relleno y solo indica qué foto va en ese lugar:

| Palabra | Foto que va ahí | Archivo |
|---|---|---|
| VIP 1 | La zona VIP 1 con sus luces | `galeria/vip-1.jpg` |
| HUMO | La hookah de cerca, con humo | `galeria/hookah.jpg` |
| FRÍO | Los granizados en la barra | `galeria/granizados.jpg` |
| VIP 2 | La terraza de la zona VIP 2 | `galeria/vip-2.jpg` |
| NOCHE | El salón lleno un sábado | `galeria/noche.jpg` |
| SHOT | Botellas servidas en la mesa (solo en la web) | `galeria/botellas.jpg` |

**Cómo se ve:**
- **Web:** un mosaico tipo collage, con fotos altas, anchas y cuadradas encajadas. Al bajar, las fotos se mueven un poco (efecto de profundidad) y al pasar el mouse hacen zoom y muestran una etiqueta con la descripción.
- **App:** un carrusel de tarjetas altas que se pasan con el dedo hacia los lados.

**Para poner las fotos:** cópialas con los nombres de la tabla y conéctalas en la lista `GALLERY`:
- Web, en `web/js/config.js`: `img: "assets/galeria/vip-1.jpg"`. Ahí también se elige la forma de cada foto con `forma`: `"alta"` (vertical), `"ancha"` (ocupa dos espacios) o `""` (normal).
- App, en `mobile/src/constants/config.ts`: `img: require('@/assets/images/galeria/vip-1.jpg')`.

Al poner la foto, la palabra de relleno desaparece sola. El texto `alt` de cada foto lo leen los lectores de pantalla y Google, así que conviene que describa la foto de verdad.

## 4. Probar en local

```bash
python -m http.server 5173 --directory web
```

Abre http://localhost:5173

## 5. Publicar la web en Cloudflare Pages (gratis)

Desde la terminal, parado en la carpeta `PARCHADITOS` (necesita Node.js):

```bash
npm run publicar
```

Antes de subir, revisa que ningún QR impreso se rompa, y si alguno falla, no publica. Después de subir, prueba cada QR en la web real (detalles en [FINALIZACION-Y-HOSTING.md](FINALIZACION-Y-HOSTING.md), sección 3.6). Para revisar sin publicar: `npm run verificar-qr`.

Sin terminal: en dash.cloudflare.com → Workers & Pages → Create → Pages → **Upload assets**, y arrastra la carpeta `web`. Así no se revisan los QR ni se sube la función de Loyverse.

La primera vez abre el navegador para iniciar sesión. Queda en `https://parchaditos.pages.dev`. Para usar dominio propio: en el proyecto → Custom domains.

`_headers` (seguridad y caché), `_redirects` (rutas de los QR) y `404.html` (que también es el plan B de los QR) funcionan solos en Cloudflare Pages y Netlify.

**Al cambiar CSS o JS:** cambia el número `?v=` de los `<script>` y `<link>` de las páginas por la fecha y hora (ej. `?v=202610051530`), para que nunca se repita. Además el navegador siempre revisa si el CSS y el JS cambiaron (`_headers`), así que nadie se queda con archivos viejos.

## 6. Publicar la app

```bash
cd mobile
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest submit --platform android
```

Para probar en un Android sin pasar por la tienda: `--profile preview` genera un APK instalable.
iOS: lo mismo con `--platform ios` (requiere cuenta de Apple Developer).
