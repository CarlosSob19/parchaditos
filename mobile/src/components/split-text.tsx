import { memo, useEffect } from 'react';
import { type StyleProp, StyleSheet, type TextStyle, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  text: string;
  style: StyleProp<TextStyle>;
  play: boolean;
  delay?: number;
  stagger?: number;
  center?: boolean;
  /** Distancia que sube cada letra (normalmente el tamaño de la fuente). */
  dist: number;
};

const Char = memo(function Char({ ch, style, play, delay, dist }: { ch: string; style: StyleProp<TextStyle>; play: boolean; delay: number; dist: number }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (play && !reduce) p.set(withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.exp) })));
  }, [play, reduce, delay, p]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - p.value) * dist * 1.1 }, { rotate: `${(1 - p.value) * 6}deg` }],
  }));

  return <Animated.Text style={[style, anim]}>{ch === ' ' ? ' ' : ch}</Animated.Text>;
});

// Texto que aparece letra por letra subiendo desde una máscara.
export function SplitText({ text, style, play, delay = 0, stagger = 40, center, dist }: Props) {
  return (
    <View style={[styles.row, center && styles.center]} accessible accessibilityLabel={text} accessibilityRole="header">
      {[...text].map((ch, i) => (
        <Char key={i} ch={ch} style={style} play={play} delay={delay + i * stagger} dist={dist} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', overflow: 'hidden' },
  center: { justifyContent: 'center' },
});
