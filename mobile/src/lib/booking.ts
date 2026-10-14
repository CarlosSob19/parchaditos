import { HOURS } from '@/constants/config';

export type Slot = { value: string; label: string };

const fmtLong = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtWd = new Intl.DateTimeFormat('es-CO', { weekday: 'short' });
const fmtMonth = new Intl.DateTimeFormat('es-CO', { month: 'short' });

export const dayLong = (d: Date) => fmtLong.format(d);
export const dayShort = (d: Date) => fmtWd.format(d).replace('.', '');
export const monthShort = (d: Date) => fmtMonth.format(d).replace('.', '');

export function sameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function nextDays(count: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

// Horas de llegada cada 30 min. Hoy solo muestra horas con al menos 1 hora de margen.
export function slotsFor(date: Date): Slot[] {
  const h = HOURS[date.getDay()];
  if (!h) return [];
  const now = new Date();
  const slots: Slot[] = [];
  for (let t = h.inicio; t <= h.fin - 1; t += 0.5) {
    const hour = Math.floor(t) % 24;
    const min = t % 1 ? 30 : 0;
    if (sameDay(date, now)) {
      const slot = new Date(date);
      slot.setHours(Math.floor(t), min, 0, 0);
      if (slot.getTime() - now.getTime() < 60 * 60 * 1000) continue;
    }
    const mm = min ? '30' : '00';
    slots.push({
      value: `${String(hour).padStart(2, '0')}:${mm}`,
      label: `${hour % 12 || 12}:${mm} ${hour < 12 ? 'a.m.' : 'p.m.'}`,
    });
  }
  return slots;
}

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const price = (n: number | null) => (n ? money.format(n) : 'Consultar');
