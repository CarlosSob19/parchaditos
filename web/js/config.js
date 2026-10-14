// ============================================================
// Configuración del negocio. Todo lo editable está aquí.
// ============================================================

// WhatsApp real: código de país + número, sin espacios ni "+".
const WHATSAPP = "570000000000";

// Datos del local. Los enlaces vacíos ("") no se muestran.
const INFO = {
  nombre: "Parchaditos",
  direccion: "Frente al Monumento • 2.º piso",
  ciudad: "Lorica, Córdoba",
  pais: "CO",
  mapa: "https://maps.app.goo.gl/soNE93EZjAUneMKn6", // Enlace de Google Maps, ej. "https://maps.app.goo.gl/..."
  // Punto exacto del marcador en el mapa de la página ("latitud,longitud"). Sale del enlace de arriba:
  // ábrelo en el navegador y copia los dos números que aparecen en la dirección.
  coordenadas: "9.227873,-75.816995",
  instagram: "https://www.instagram.com/parchaditosbynubex/",
  tiktok: "", // ej. "https://tiktok.com/@parchaditos"
  email: "", // Correo para temas de privacidad y datos personales
  resenas: "", // Enlace para dejar reseña en Google (Perfil de empresa → "Pedir reseñas"). Lo usa el QR /resena.
};

// Portada. Con "video" se reproduce de fondo en el hero (MP4 H.264, sin audio, 8-15 s en bucle, máx. 6 MB).
// "poster" es la foto que se ve mientras carga el video, o sola si no hay video.
// En celulares se usa "videoMovil" (vertical 9:16) si existe; si no, el mismo video.
const HERO = {
  video: "", // ej. "assets/video/hero.mp4"
  videoMovil: "", // ej. "assets/video/hero-movil.mp4"
  poster: "", // ej. "assets/galeria/hero.jpg"
  // Objeto protagonista en el centro de la portada, sobre PARCHADITOS (como el casco de landonorris.com).
  // "modelo": archivo 3D .glb (máx. 5 MB). Gira solo; en computador sigue al mouse.
  // "objeto": PNG sin fondo (~1200 px). Se usa si no hay modelo, o mientras el modelo carga.
  modelo: "assets/3d/logo.glb", // logo de Parchaditos en 3D
  objeto: "assets/3d/logo.png", // el mismo logo en PNG: se ve en celulares y mientras carga el 3D
  giro: "vaiven", // "vaiven": se mece de lado a lado (logos planos). "completo": vuelta entera (objetos como una hookah).
};

// Categorías del catálogo. "activo": false la oculta en toda la web (tarjeta, filtro, cinta y productos).
// "ghost" es la palabra grande de fondo, "img" un PNG sin fondo, ej. "assets/categorias/vapes.png",
// y "desde" el precio más bajo de la categoría (número) para mostrar "Desde $X". null lo oculta.
const CATEGORIES = [
  { id: "licores", nombre: "Licores", corto: "licores", ghost: "SHOT", desc: "Aguardiente, ron, whisky, tequila y vodka. Micheladas y el cóctel de la casa.", activo: true, img: null, desde: null },
  { id: "vapes", nombre: "Vapes", corto: "vapes", ghost: "VAPE", desc: "Desechables y recargables. Muchos sabores, muchos puffs.", activo: true, img: null, desde: null },
  { id: "blunts", nombre: "Blunt Wraps", corto: "blunt wraps", ghost: "WRAP", desc: "Wraps de sabores, hemp y conos listos para armar.", activo: true, img: null, desde: null },
  { id: "granizados", nombre: "Granizados", corto: "granizados", ghost: "FRÍO", desc: "Bien fríos, con o sin licor, del sabor que quieras.", activo: true, img: null, desde: null },
];

// Catálogo. Para agregar un producto, copia una línea y cambia los datos. "id" no se puede repetir.
// "precio" puede ser un número (ej. 45000) o null para mostrar "Consultar".
// "img" es la ruta de la foto, ej. "assets/productos/vape-5000.jpg". Si es null se usa un fondo con ícono.
const PRODUCTS = [
  { id: "aguardiente", cat: "licores", nombre: "Aguardiente", detalle: "Media y botella", precio: null, img: null },
  { id: "ron", cat: "licores", nombre: "Ron", detalle: "Media y botella", precio: null, img: null },
  { id: "whisky", cat: "licores", nombre: "Whisky", detalle: "Botella", precio: null, img: null },
  { id: "tequila", cat: "licores", nombre: "Tequila", detalle: "Botella", precio: null, img: null },
  { id: "vodka", cat: "licores", nombre: "Vodka", detalle: "Botella", precio: null, img: null },
  { id: "michelada", cat: "licores", nombre: "Michelada", detalle: "Cerveza preparada", precio: null, img: null },
  { id: "casa", cat: "licores", nombre: "Cóctel de la casa", detalle: "Pregunta el del día", precio: null, img: null },

  { id: "vape-5000", cat: "vapes", nombre: "Vape desechable 5.000 puffs", detalle: "Varios sabores", precio: null, img: null },
  { id: "vape-10000", cat: "vapes", nombre: "Vape desechable 10.000 puffs", detalle: "Recargable USB-C", precio: null, img: null },
  { id: "pods", cat: "vapes", nombre: "Pods de repuesto", detalle: "Compatibles con kits", precio: null, img: null },

  { id: "blunt-sabores", cat: "blunts", nombre: "Blunt wraps de sabores", detalle: "Paquete x2", precio: null, img: null },
  { id: "hemp-wraps", cat: "blunts", nombre: "Hemp wraps", detalle: "Sin tabaco", precio: null, img: null },
  { id: "conos", cat: "blunts", nombre: "Conos listos", detalle: "Paquete x3", precio: null, img: null },

  { id: "granizado-licor", cat: "granizados", nombre: "Granizado con licor", detalle: "Sabor a elección", precio: null, img: null },
  { id: "gra-maracuya", cat: "granizados", nombre: "Granizado de maracuyá", detalle: "Con o sin licor", precio: null, img: null },
  { id: "gra-mango", cat: "granizados", nombre: "Granizado de mango biche", detalle: "Con o sin licor", precio: null, img: null },
];

// ---------- Pedidos desde la mesa (QR) ----------

// Cada mesa tiene su QR, que abre TU-DOMINIO.com/m/<id>. Los QR se imprimen desde /qr.html.
// "nombre" debe ser igual al ticket predefinido de esa mesa en Loyverse, para que el mesero la encuentre rápido.
// "id" va en el QR impreso: solo minúsculas, números y guiones. NUNCA lo cambies ni borres la mesa:
// "npm run publicar" no publica si una mesa con QR desaparece (ver FINALIZACION-Y-HOSTING.md, sección 3.6).
const TABLES = [
  { id: "vip1", nombre: "VIP 1" },
  { id: "vip2", nombre: "VIP 2" },
  { id: "mesa1", nombre: "Mesa 1" },
  { id: "mesa2", nombre: "Mesa 2" },
  { id: "mesa3", nombre: "Mesa 3" },
  { id: "mesa4", nombre: "Mesa 4" },
  { id: "barra", nombre: "Barra" },
];

// WhatsApp que recibe los pedidos de las mesas (ej. el celular de la barra). Vacío = el mismo WHATSAPP de arriba.
const WHATSAPP_MESAS = "";

// Horas que dura el "modo mesa" después de escanear el QR.
const TABLE_HOURS = 8;

// ---------- Loyverse ----------

// Con "activo": true la web toma productos, precios y agotados de Loyverse (ver README, sección Loyverse).
// Si Loyverse no responde, se usa la lista PRODUCTS de arriba.
// "categorias" conecta cada categoría de Loyverse (nombre exacto) con una categoría de la web (CATEGORIES).
// Las categorías de Loyverse que no estén aquí no se muestran en la web.
const LOYVERSE = {
  activo: false,
  categorias: {
    "Licores": "licores",
    "Cocteles": "licores",
    "Vapes": "vapes",
    "Blunts": "blunts",
    "Granizados": "granizados",
  },
};

// ---------- Reservas ----------

// Servicios reservables. "zona": true pide escoger zona VIP.
const SERVICES = [
  { id: "vip", nombre: "Zona VIP", desc: "Zona privada para tu grupo con atención directa a la mesa.", tag: "Con reserva", zona: true, hookah: false },
  { id: "combo", nombre: "VIP + Hookah", desc: "La zona VIP con hookah incluida. El combo completo.", tag: "El más pedido", zona: true, hookah: true },
  { id: "hookah", nombre: "Hookah", desc: "Mesa en el salón con hookah preparada al momento.", tag: "Salón general", zona: false, hookah: true },
];

const ZONES = [
  // max: cupo de la zona. El paso "Personas" no deja pasar de ahí.
  { id: "vip1", nombre: "VIP 1", detalle: "Hasta 10 personas · Sofás y pantalla", max: 10 },
  { id: "vip2", nombre: "VIP 2", detalle: "Hasta 15 personas · Terraza privada", max: 15 },
  { id: "any", nombre: "Cualquiera", detalle: "La que esté disponible", max: 15 },
];

// Horario por día de la semana (0 = domingo ... 6 = sábado). null = cerrado.
// "fin" puede pasar de 24 para horas después de medianoche (26 = 2:00 a.m.).
const HOURS = {
  0: { inicio: 16, fin: 24 },
  1: { inicio: 16, fin: 24 },
  2: { inicio: 16, fin: 24 },
  3: { inicio: 16, fin: 24 },
  4: { inicio: 16, fin: 24 },
  5: { inicio: 16, fin: 26 },
  6: { inicio: 16, fin: 26 },
};

// Días especiales (formato "AAAA-MM-DD"). En el calendario de reservas salen marcados y no se pueden escoger.
//   cerrado: true          → ese día no se abre (festivo, evento privado).
//   lleno: ["vip1"]        → esas zonas ya no tienen cupo. Usa "vip1", "vip2", "salon" (hookah sin zona) o "todas".
//   horas: { inicio, fin } → horario distinto solo ese día (mismo formato que HOURS).
//   nota: "Halloween"      → se lee al pasar el dedo o el mouse por el día.
const DIAS_ESPECIALES = [
  // { fecha: "2026-12-24", cerrado: true, nota: "Nochebuena" },
  // { fecha: "2026-10-31", lleno: ["vip1"], nota: "Fiesta de Halloween" },
];

const BOOKING_DAYS_AHEAD = 21;
const MAX_PEOPLE = 20;

const HOOKAH_FLAVORS = ["Sorpréndeme", "Menta", "Uva", "Sandía", "Doble manzana", "Frutos rojos", "Mango", "Chicle"];

const OCCASIONS = ["Parche normal", "Cumpleaños", "Despedida", "Aniversario", "Otro"];

// ---------- Secciones de la página de inicio ----------

// Galería "El sitio". "img" es la foto (ej. "assets/galeria/vip-1.jpg"). Solo salen las que tienen foto;
// mientras ninguna tenga, la sección no aparece.
// "forma": "alta" (vertical), "ancha" (horizontal doble) o "" (normal).
const GALLERY = [
  { img: null, alt: "Zona VIP 1 con sofás y pantalla", texto: "VIP 1", forma: "alta" },
  { img: null, alt: "Hookah preparada en la mesa", texto: "HUMO", forma: "" },
  { img: null, alt: "Granizados con licor en la barra", texto: "FRÍO", forma: "" },
  { img: null, alt: "Terraza privada de la zona VIP 2", texto: "VIP 2", forma: "ancha" },
  { img: null, alt: "El salón un sábado en la noche", texto: "NOCHE", forma: "alta" },
  { img: null, alt: "Botellas servidas en la mesa", texto: "SHOT", forma: "" },
];

// Reseñas reales de clientes (copiadas de Google Maps o Instagram, con permiso).
// Mientras la lista esté vacía, la sección no aparece. Ejemplo:
// { nombre: "Laura M.", texto: "El mejor parche para cumpleaños.", estrellas: 5, fuente: "Google" },
const REVIEWS = [];

// Preguntas frecuentes. Edita las respuestas con los datos reales del negocio.
const FAQ = [
  { q: "¿Necesito reservar?", a: "Para la hookah en el salón no. Para las zonas VIP sí, sobre todo de jueves a sábado: se llenan rápido." },
  { q: "¿Qué medios de pago reciben?", a: "Efectivo y Nequi; Proximamente datafono." },
  { q: "¿Hacen domicilios?", a: "Sí, en zonas cercanas. Arma tu pedido en el catálogo y envíalo por WhatsApp; te confirmamos el costo del envío." },
  { q: "¿Puedo llevar torta o decoración?", a: "Claro. Escríbelo en las notas de la reserva y te ayudamos a tenerlo listo." },
  { q: "¿Piden documento?", a: "Sí. Solo mayores de 18 años, con cédula o pasaporte. Sin documento no podemos venderte ni dejarte entrar." },
  { q: "¿Cómo cancelo o cambio una reserva?", a: "Escríbenos al mismo chat de WhatsApp con al menos 3 horas de anticipación." },
];
