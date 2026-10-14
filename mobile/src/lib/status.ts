import { HOURS } from '@/constants/config';

const DAY_NAMES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const fmtHour = (h: number) => {
  const hour = Math.floor(h) % 24;
  const min = h % 1 ? '30' : '00';
  return `${hour % 12 || 12}:${min} ${hour < 12 ? 'a.m.' : 'p.m.'}`;
};

// Mismo cálculo que js/fx.js de la web.
export function openStatus(now = new Date()): { open: boolean; text: string } {
  const day = now.getDay();
  const t = now.getHours() + now.getMinutes() / 60;
  const today = HOURS[day];
  const yesterday = HOURS[(day + 6) % 7];

  // Turno de ayer que sigue abierto después de medianoche (fin > 24).
  if (yesterday && yesterday.fin > 24 && t < yesterday.fin - 24) return { open: true, text: `Abierto · cierra ${fmtHour(yesterday.fin)}` };
  if (today && t >= today.inicio && t < today.fin) return { open: true, text: `Abierto · cierra ${fmtHour(today.fin)}` };
  if (today && t < today.inicio) return { open: false, text: `Cerrado · abre hoy ${fmtHour(today.inicio)}` };

  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const h = HOURS[d];
    if (h) return { open: false, text: `Cerrado · abre ${i === 1 ? 'mañana' : DAY_NAMES[d]} ${fmtHour(h.inicio)}` };
  }
  return { open: false, text: 'Cerrado' };
}
