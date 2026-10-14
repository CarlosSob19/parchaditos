import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { C, F } from '@/constants/theme';
import { openStatus } from '@/lib/status';

// "Abierto · cierra 2:00 a.m." con punto que late; se actualiza cada minuto.
export function StatusPill({ color = C.text }: { color?: string }) {
  const [s, setS] = useState(() => openStatus());
  const reduce = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => setS(openStatus()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (s.open && !reduce) pulse.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false));
  }, [s.open, reduce, pulse]);

  const ring = useAnimatedStyle(() => ({ opacity: 0.7 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 1.6 }] }));

  return (
    <View style={styles.row} accessibilityLabel={s.text}>
      <View style={styles.dotWrap}>
        {s.open && <Animated.View style={[styles.dot, styles.ring, ring]} />}
        <View style={[styles.dot, { backgroundColor: s.open ? C.redHot : C.muted }]} />
      </View>
      <Text style={[styles.text, { color: s.open ? color : C.muted }]}>{s.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotWrap: { width: 8, height: 8 },
  dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  ring: { backgroundColor: C.redHot },
  text: { fontFamily: F.semibold, fontSize: 12 },
});
