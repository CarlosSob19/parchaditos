import { memo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, type SharedValue, useAnimatedStyle, useReducedMotion, useSharedValue } from 'react-native-reanimated';

import { lh } from '@/constants/layout';
import { C, F } from '@/constants/theme';

type WordProps = { word: string; i: number; total: number; scrollY: SharedValue<number>; top: SharedValue<number>; span: number; reduce: boolean };

const Word = memo(function Word({ word, i, total, scrollY, top, span, reduce }: WordProps) {
  const { height } = useWindowDimensions();
  const style = useAnimatedStyle(() => {
    if (reduce || top.value < 0) return { opacity: reduce ? 1 : 0.12 };
    // Cada palabra se enciende en su tramo del recorrido del párrafo por la pantalla.
    const start = top.value - height * 0.8;
    const p = interpolate(scrollY.value, [start, start + span], [0, 1], 'clamp');
    const w = interpolate(p, [i / total, (i + 1) / total], [0.12, 1], 'clamp');
    return { opacity: w };
  });
  return <Animated.Text style={[styles.word, style]}>{word} </Animated.Text>;
});

// Párrafo grande cuyas palabras se van encendiendo con el scroll (manifiesto de la web).
export function FillText({ text, scrollY, eyebrow }: { text: string; scrollY: SharedValue<number>; eyebrow?: string }) {
  const reduce = useReducedMotion();
  const top = useSharedValue(-1);
  const words = text.split(/\s+/);

  return (
    <View style={styles.wrap} onLayout={(e) => top.set(e.nativeEvent.layout.y)} accessible accessibilityLabel={text}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <View style={styles.row}>
        {words.map((w, i) => (
          <Word key={i} word={w} i={i} total={words.length} scrollY={scrollY} top={top} span={520} reduce={reduce} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 72, paddingBottom: 40 },
  eyebrow: { fontFamily: F.semibold, fontSize: 11, letterSpacing: 2, color: C.muted, marginBottom: 14, textTransform: 'uppercase' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  word: { fontFamily: F.black, fontSize: 30, lineHeight: lh(30), letterSpacing: -0.8, color: C.text },
});
