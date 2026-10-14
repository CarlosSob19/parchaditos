import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { C, F } from '@/constants/theme';

const WORDS = ['Licores', 'Granizados', 'Hookah', 'Zonas VIP', 'Cocteles'];

// Cinta roja que se mueve sola y acelera con la velocidad del scroll.
export function Marquee({ scrollY }: { scrollY: SharedValue<number> }) {
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  const boost = useSharedValue(0);
  const lastY = useSharedValue(0);
  const wv = useSharedValue(0);

  useAnimatedReaction(
    () => scrollY.value,
    (y) => {
      const v = y - lastY.value;
      lastY.set(y);
      boost.set(Math.max(-6, Math.min(6, v * 0.25)));
    },
  );

  const frame = useFrameCallback((f) => {
    const w = wv.value;
    if (!w) return;
    const dt = (f.timeSincePreviousFrame ?? 16) / 16;
    boost.set(boost.value * (0.92));
    x.set(x.value - ((1 + boost.value) * dt));
    if (x.value <= -w) x.set(x.value + (w));
    if (x.value > 0) x.set(x.value - (w));
  }, false);

  useEffect(() => {
    frame.setActive(!reduce && w > 0);
    return () => frame.setActive(false);
  }, [reduce, w, frame]);

  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const row = (
    <View style={styles.row} onLayout={(e) => {
      if (w) return;
      wv.set(e.nativeEvent.layout.width);
      setW(e.nativeEvent.layout.width);
    }}>
      {WORDS.map((t) => (
        <View key={t} style={styles.item}>
          <Text style={styles.word}>{t.toUpperCase()}</Text>
          <Text style={styles.star}>✦</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.track, anim]}>
        {row}
        {row}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: C.red, paddingVertical: 16, overflow: 'hidden', transform: [{ rotate: '-2deg' }, { scale: 1.06 }], marginVertical: 32 },
  track: { flexDirection: 'row' },
  row: { flexDirection: 'row' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingRight: 16 },
  word: { fontFamily: F.display, fontSize: 32, color: C.onRed, letterSpacing: -0.5 },
  star: { fontSize: 18, color: C.bg },
});
