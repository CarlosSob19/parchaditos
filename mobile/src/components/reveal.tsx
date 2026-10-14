import { type ReactNode } from 'react';
import { type StyleProp, useWindowDimensions, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  scrollY: SharedValue<number>;
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

// Aparece (sube + opacidad) cuando entra en pantalla. Debe ser hijo directo del contenido del ScrollView.
export function Reveal({ scrollY, children, delay = 0, style }: Props) {
  const { height } = useWindowDimensions();
  const reduce = useReducedMotion();
  const top = useSharedValue(-1);
  const p = useSharedValue(reduce ? 1 : 0);

  useAnimatedReaction(
    () => top.value >= 0 && scrollY.value + height * 0.88 > top.value,
    (visible, prev) => {
      if (visible && !prev && p.value === 0) {
        p.set(withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.exp) })));
      }
    },
  );

  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 50 }],
  }));

  return (
    <Animated.View style={[style, anim]} onLayout={(e) => top.set(e.nativeEvent.layout.y)}>
      {children}
    </Animated.View>
  );
}
