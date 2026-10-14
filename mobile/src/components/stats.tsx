import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, type SharedValue, useReducedMotion } from 'react-native-reanimated';

import { HOOKAH_FLAVORS, HOURS, ZONES } from '@/constants/config';
import { lh } from '@/constants/layout';
import { C, F } from '@/constants/theme';
import { useCatalog } from '@/lib/catalog';
import { useInView } from '@/lib/use-in-view';

// Las cifras salen de config.ts para que siempre digan la verdad.
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const open = Object.entries(HOURS).filter(([, h]) => h) as [string, { inicio: number; fin: number }][];
const latest = Math.max(...open.map(([, h]) => h.fin));
const lateDays = open.filter(([, h]) => h.fin === latest).map(([d]) => DAYS[Number(d)]);
const lateHour = latest % 24 % 12 || 12;
const lateAmPm = latest % 24 < 12 ? ' a.m.' : ' p.m.';
const zones = ZONES.filter((z) => z.id !== 'any').length;

const itemsFor = (drinks: number) => [
  { to: zones, suffix: '', label: zones === 1 ? 'Zona VIP privada' : 'Zonas VIP privadas', count: true },
  { to: HOOKAH_FLAVORS.filter((f) => !/sorpr/i.test(f)).length, suffix: '', label: 'Sabores de hookah', count: true },
  { to: drinks, suffix: '', label: 'Bebidas en la carta', count: true },
  { to: lateHour, suffix: lateAmPm, label: lateDays.length > 1 ? `${lateDays.slice(0, -1).join(', ')} y ${lateDays[lateDays.length - 1].toLowerCase()}` : lateDays[0] ?? '', count: false },
];

function Counter({ to, play }: { to: number; play: boolean }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!play || reduce) return;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / 1500);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, reduce, to]);

  return <>{n}</>;
}

// Cifras que cuentan desde 0 al aparecer (como en la web).
export function Stats({ scrollY }: { scrollY: SharedValue<number> }) {
  const { inView, onLayout } = useInView(scrollY);
  const ITEMS = itemsFor(useCatalog().drinks.length);

  return (
    <View style={styles.grid} onLayout={onLayout}>
      {ITEMS.map((it, i) => (
        <View key={it.label} style={[styles.cell, i % 2 === 0 ? styles.cellLeft : styles.cellRight, i > 1 && styles.cellBottom]}>
          {inView && (
            <Animated.View entering={FadeInDown.delay(i * 90).duration(700)}>
              <Text style={styles.num}>
                {it.count ? <Counter to={it.to} play={inView} /> : it.to}
                {it.suffix ? <Text style={it.suffix.includes('a.m.') ? styles.small : undefined}>{it.suffix}</Text> : null}
              </Text>
              <Text style={styles.label}>{it.label}</Text>
            </Animated.View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, borderTopWidth: 1, borderTopColor: C.line, minHeight: 260 },
  cell: { width: '50%', paddingVertical: 24, paddingRight: 12, minHeight: 130 },
  cellLeft: { borderRightWidth: 1, borderRightColor: C.line },
  cellRight: { paddingLeft: 16 },
  cellBottom: { borderTopWidth: 1, borderTopColor: C.line },
  num: { fontFamily: F.display, fontSize: 52, lineHeight: lh(52), color: C.red, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  small: { fontSize: 20 },
  label: { fontFamily: F.semibold, fontSize: 13, color: C.muted, marginTop: 4 },
});
