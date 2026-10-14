import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { C, F } from '@/constants/theme';

// Botón principal de reserva: claro, con aro rojo que late.
export function ReserveButton({ label = 'Reservar VIP', onPress }: { label?: string; onPress: () => void }) {
  const reduce = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!reduce) pulse.set(withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }), -1, false));
  }, [reduce, pulse]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - pulse.value),
    transform: [{ scaleX: 1 + pulse.value * 0.12 }, { scaleY: 1 + pulse.value * 0.45 }],
  }));

  return (
    <View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ring, ring]} />
      <PressableScale onPress={onPress} style={styles.btn} accessibilityRole="button" accessibilityLabel={label}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.icon}>
          <Text style={styles.arrow}>→</Text>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderRadius: 999, backgroundColor: C.red },
  btn: {
    height: 58,
    paddingLeft: 24,
    paddingRight: 7,
    borderRadius: 999,
    backgroundColor: C.text,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  label: { fontFamily: F.black, fontSize: 16, color: C.bg },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  arrow: { color: C.onRed, fontSize: 20, fontFamily: F.bold, marginTop: -2 },
});
