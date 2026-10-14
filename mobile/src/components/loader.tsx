import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { lh } from '@/constants/layout';
import { C, F } from '@/constants/theme';

const DURATION = 550;

// Precarga sobria (igual que la web): fondo oscuro, logo, línea roja fina y se desvanece. Menos de 1 s.
export function Loader({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  const logo = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (reduce) {
      onDone();
      return;
    }
    logo.set(withTiming(1, { duration: 450, easing: Easing.out(Easing.exp) }));
    const start = Date.now() + 100;
    let raf = 0;
    const tick = () => {
      const p = Math.max(0, Math.min(1, (Date.now() - start) / DURATION));
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setN(Math.round(e * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      fade.set(withDelay(50, withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) }, (ok) => {
        if (ok) scheduleOnRN(onDone);
      })));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrap = useAnimatedStyle(() => ({ opacity: fade.value }));
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - logo.value) * 40 }], opacity: logo.value }));

  if (reduce) return null;

  return (
    <Animated.View style={[styles.wrap, wrap]}>
      <View style={styles.center}>
        <View style={styles.mask}>
          <Animated.Text style={[styles.logo, logoStyle]}>PARCHADITOS</Animated.Text>
        </View>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${n}%` }]} />
        </View>
        <Text style={styles.count}>{n}%</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, zIndex: 200, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  center: { width: '70%', maxWidth: 300, gap: 16 },
  mask: { overflow: 'hidden', alignItems: 'center' },
  logo: { fontFamily: F.display, fontSize: 28, lineHeight: lh(28), letterSpacing: -0.8, color: C.text },
  bar: { height: 2, backgroundColor: C.line, overflow: 'hidden' },
  fill: { height: 2, backgroundColor: C.red },
  count: { alignSelf: 'flex-end', fontFamily: F.semibold, fontSize: 12, letterSpacing: 1, color: C.muted, fontVariant: ['tabular-nums'] },
});
