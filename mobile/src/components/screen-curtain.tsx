import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { lh } from '@/constants/layout';
import { C, F } from '@/constants/theme';

// Cortina oscura que se retira hacia arriba al entrar a una pestaña (la transición entre páginas de la web).
export function ScreenCurtain() {
  const { height, width } = useWindowDimensions();
  const reduce = useReducedMotion();
  const y = useSharedValue(1); // 1 = fuera de pantalla (abajo), 0 = cubriendo, -1 = arriba
  const first = useRef(true);

  useFocusEffect(
    useCallback(() => {
      // La primera vez la pantalla ya entra con la precarga; no hace falta cortina.
      if (first.current) {
        first.current = false;
        return;
      }
      if (reduce) return;
      y.set(withSequence(withTiming(0, { duration: 0 }), withTiming(-1, { duration: 520, easing: Easing.inOut(Easing.exp) }), withTiming(1, { duration: 0 })));
    }, [reduce, y]),
  );

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * height }] }));
  const size = Math.min(width * 0.08, 32);

  return (
    <Animated.View pointerEvents="none" style={[styles.curtain, style]}>
      <Text style={[styles.word, { fontSize: size, lineHeight: lh(size) }]}>
        PARCHADITOS<Text style={{ color: C.red }}>.</Text>
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  curtain: { ...StyleSheet.absoluteFill, zIndex: 150, backgroundColor: C.bg2, borderTopWidth: 2, borderTopColor: C.red, alignItems: 'center', justifyContent: 'center' },
  word: { fontFamily: F.display, color: C.text, letterSpacing: -0.8 },
});
