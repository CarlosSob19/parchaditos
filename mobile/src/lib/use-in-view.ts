import { useState } from 'react';
import { type LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { type SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/**
 * Avisa una sola vez cuando el elemento entra en pantalla.
 * El elemento con `onLayout` debe ser hijo directo del contenido del ScrollView (su `y` es relativa a él).
 */
export function useInView(scrollY: SharedValue<number>, threshold = 0.85) {
  const { height } = useWindowDimensions();
  const top = useSharedValue(-1);
  const [inView, setInView] = useState(false);

  useAnimatedReaction(
    () => top.value >= 0 && scrollY.value + height * threshold > top.value,
    (visible, prev) => {
      if (visible && !prev) scheduleOnRN(setInView, true);
    },
  );

  return { inView, top, onLayout: (e: LayoutChangeEvent) => top.set(e.nativeEvent.layout.y) };
}
