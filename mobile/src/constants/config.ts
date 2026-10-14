// ============================================================
// Configuración del negocio. Mantener en sincronía con js/config.js de la web.
// La app solo muestra licores, servicios y reservas (políticas de App Store / Google Play).
// ============================================================

import type { ImageSourcePropType } from 'react-native';

// WhatsApp real: código de país + número, sin espacios ni "+".
export const WHATSAPP = '570000000000';

// Dominio de la web publicada, sin "/" al final. De ahí salen la política de privacidad y el catálogo de Loyverse.
export const DOMINIO = 'https://TU-DOMINIO.com';

export type DrinkCat = 'botellas' | 'granizados' | 'cocteles';

export const DRINK_CATS: { id: DrinkCat | 'todos'; nombre: string }[] = [
  { id: 'todos', nombre: 'Todo' },
  { id: 'botellas', nombre: 'Botellas' },
  { id: 'granizados', nombre: 'Granizados' },
  { id: 'cocteles', nombre: 'Cocteles' },
];

// Lista de respaldo: se usa si Loyverse está apagado o no responde. Mantener igual a los licores de PRODUCTS en la web.
// "precio" en pesos o null para mostrar "Consultar".
// "img": foto opcional, ej. require('@/assets/images/productos/aguardiente.jpg'). null = fondo con ícono.
export type Drink = { id: string; cat: DrinkCat; nombre: string; detalle: string; precio: number | null; img?: ImageSourcePropType | null; agotado?: boolean };
export const DRINKS: Drink[] = [
  { id: 'aguardiente', cat: 'botellas', nombre: 'Aguardiente', detalle: 'Media y botella', precio: null },
  { id: 'ron', cat: 'botellas', nombre: 'Ron', detalle: 'Media y botella', precio: null },
  { id: 'whisky', cat: 'botellas', nombre: 'Whisky', detalle: 'Botella', precio: null },
  { id: 'tequila', cat: 'botellas', nombre: 'Tequila', detalle: 'Botella', precio: null },
  { id: 'vodka', cat: 'botellas', nombre: 'Vodka', detalle: 'Botella', precio: null },
  { id: 'granizado-licor', cat: 'granizados', nombre: 'Granizado con licor', detalle: 'Sabor a elección', precio: null },
  { id: 'gra-maracuya', cat: 'granizados', nombre: 'Granizado de maracuyá', detalle: 'Con o sin licor', precio: null },
  { id: 'gra-mango', cat: 'granizados', nombre: 'Granizado de mango biche', detalle: 'Con o sin licor', precio: null },
  { id: 'michelada', cat: 'cocteles', nombre: 'Michelada', detalle: 'Cerveza preparada', precio: null },
  { id: 'casa', cat: 'cocteles', nombre: 'Cóctel de la casa', detalle: 'Pregunta el del día', precio: null },
];

// Catálogo desde Loyverse: lee la misma función de la web (DOMINIO + /api/catalogo), así la app y la web
// muestran los mismos productos, precios, fotos y agotados. Solo aparecen las categorías de esta lista:
// nunca pongas aquí vapes, THC ni wraps (Apple y Google rechazan la app).
// "Nombre exacto de la categoría en Loyverse": categoría de la app.
export const LOYVERSE: { activo: boolean; categorias: Record<string, DrinkCat> } = {
  activo: false,
  categorias: {
    Licores: 'botellas',
    Granizados: 'granizados',
    Cocteles: 'cocteles',
  },
};

export type Service = { id: 'vip' | 'combo' | 'hookah'; nombre: string; desc: string; tag: string; zona: boolean; hookah: boolean };

export const SERVICES: Service[] = [
  { id: 'vip', nombre: 'Zona VIP', desc: 'Zona privada para tu grupo con atención directa a la mesa.', tag: 'Con reserva', zona: true, hookah: false },
  { id: 'combo', nombre: 'VIP + Hookah', desc: 'La zona VIP con hookah incluida. El combo completo.', tag: 'El más pedido', zona: true, hookah: true },
  { id: 'hookah', nombre: 'Hookah', desc: 'Mesa en el salón con hookah preparada al momento.', tag: 'Salón general', zona: false, hookah: true },
];

export const ZONES = [
  { id: 'vip1', nombre: 'VIP 1', detalle: 'Hasta 10 personas · Sofás y pantalla' },
  { id: 'vip2', nombre: 'VIP 2', detalle: 'Hasta 15 personas · Terraza privada' },
  { id: 'any', nombre: 'Cualquiera', detalle: 'La que esté disponible' },
];

// Horario por día (0 = domingo ... 6 = sábado). null = cerrado. "fin" > 24 = después de medianoche.
export const HOURS: Record<number, { inicio: number; fin: number } | null> = {
  0: { inicio: 16, fin: 24 },
  1: { inicio: 16, fin: 24 },
  2: { inicio: 16, fin: 24 },
  3: { inicio: 16, fin: 24 },
  4: { inicio: 16, fin: 24 },
  5: { inicio: 16, fin: 26 },
  6: { inicio: 16, fin: 26 },
};

export const BOOKING_DAYS_AHEAD = 21;
export const MAX_PEOPLE = 20;
export const HOOKAH_FLAVORS = ['Sorpréndeme', 'Menta', 'Uva', 'Sandía', 'Doble manzana', 'Frutos rojos', 'Mango', 'Chicle'];
export const OCCASIONS = ['Parche normal', 'Cumpleaños', 'Despedida', 'Aniversario', 'Otro'];

// Los enlaces vacíos ('') no se muestran.
export const INFO = {
  direccion: 'Calle 00 # 00-00, Tu ciudad',
  horario: ['Dom – Jue · 4:00 p.m. – 12:00 a.m.', 'Vie – Sáb · 4:00 p.m. – 2:00 a.m.'],
  mapa: '', // Enlace de Google Maps
  instagram: 'https://www.instagram.com/parchaditosbynubex/',
  tiktok: '', // ej. 'https://tiktok.com/@parchaditos'
  // Política de privacidad publicada en la web. Las tiendas la exigen.
  privacidad: `${DOMINIO}/privacidad.html`,
};

// ---------- Secciones del inicio ----------

// Galería "El sitio". "img": require('@/assets/images/galeria/vip-1.jpg'). null = relleno con el texto.
export const GALLERY: { img: ImageSourcePropType | null; alt: string; texto: string }[] = [
  { img: null, alt: 'Zona VIP 1 con sofás y pantalla', texto: 'VIP 1' },
  { img: null, alt: 'Hookah preparada en la mesa', texto: 'HUMO' },
  { img: null, alt: 'Granizados con licor en la barra', texto: 'FRÍO' },
  { img: null, alt: 'Terraza privada de la zona VIP 2', texto: 'VIP 2' },
  { img: null, alt: 'El salón un sábado en la noche', texto: 'NOCHE' },
];

// Reseñas reales (copiadas de Google Maps o Instagram, con permiso). Vacío = la sección no aparece.
// Ejemplo: { nombre: 'Laura M.', texto: 'El mejor parche para cumpleaños.', estrellas: 5, fuente: 'Google' },
export const REVIEWS: { nombre: string; texto: string; estrellas: number; fuente?: string }[] = [];

// Preguntas frecuentes. Mismas respuestas que FAQ en web/js/config.js.
export const FAQ = [
  { q: '¿Necesito reservar?', a: 'Para la hookah en el salón no. Para las zonas VIP sí, sobre todo de jueves a sábado: se llenan rápido.' },
  { q: '¿Qué medios de pago reciben?', a: 'Efectivo, tarjeta débito y crédito, Nequi y Daviplata.' },
  { q: '¿Puedo llevar torta o decoración?', a: 'Claro. Escríbelo en las notas de la reserva y te ayudamos a tenerlo listo.' },
  { q: '¿Piden documento?', a: 'Sí. Solo mayores de 18 años, con cédula o pasaporte. Sin documento no podemos venderte ni dejarte entrar.' },
  { q: '¿Cómo cancelo o cambio una reserva?', a: 'Escríbenos al mismo chat de WhatsApp con al menos 3 horas de anticipación.' },
];
