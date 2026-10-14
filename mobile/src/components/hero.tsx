import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ReserveButton } from '@/components/reserve-button';
import { Smoke } from '@/components/smoke';
import { StatusPill } from '@/components/status-pill';
import { SplitText } from '@/components/split-text';
import { lh, useTabBarSpace, useTopBarSpace } from '@/constants/layout';
import { C, F } from '@/constants/theme';

type Props = {
  /** Alto visible del área de contenido (sin la barra de pestañas en Android). */
  height: number;
  scrollY: SharedValue<number>;
  play: boolean;
  onReserve: () => void;
  onCarta: () => void;
};

// "PARCHA" es la línea más ancha: 6 letras de Archivo Black ≈ 4.9 em.
const WIDEST_EM = 4.9;

function BigText({ color, size, play }: { color: string; size: number; play: boolean }) {
  const style = { fontFamily: F.display, fontSize: size, lineHeight: lh(size), color, letterSpacing: -size * 0.02 };
  return (
    <View>
      <SplitText text="PARCHA" style={style} dist={lh(size)} play={play} delay={150} center />
      <View style={{ marginTop: -size * 0.24 }}>
        <SplitText text="DITOS" style={style} dist={lh(size)} play={play} delay={400} center />
      </View>
    </View>
  );
}

// Inicio: texto gigante + círculo rojo que sigue el dedo y deja ver otra capa (como landonorris.com).
export function Hero({ height: H, scrollY, play, onReserve, onCarta }: Props) {
  const { width: W } = useWindowDimensions();
  const topSpace = useTopBarSpace();
  const tabSpace = useTabBarSpace();
  const reduce = useReducedMotion();

  const size = Math.min((W - 24) / WIDEST_EM, 140);
  const R = Math.min(W * 0.3, 150);
  const blockH = lh(size) * 2 - size * 0.24;
  const textTop = H * 0.42 - blockH / 2;

  const cx = useSharedValue(W * 0.3);
  const cy = useSharedValue(H * 0.42);
  const r = useSharedValue(0);
  const ui = useSharedValue(reduce ? 1 : 0);

  // Recorrido automático del círculo mientras nadie toca.
  const wander = (delay = 0) => {
    'worklet';
    const ease = Easing.inOut(Easing.sin);
    cx.set(withDelay(delay, withRepeat(withSequence(
      withTiming(W * 0.72, { duration: 3200, easing: ease }),
      withTiming(W * 0.55, { duration: 2600, easing: ease }),
      withTiming(W * 0.28, { duration: 3200, easing: ease }),
    ), -1)));
    cy.set(withDelay(delay, withRepeat(withSequence(
      withTiming(H * 0.36, { duration: 3200, easing: ease }),
      withTiming(H * 0.5, { duration: 2600, easing: ease }),
      withTiming(H * 0.42, { duration: 3200, easing: ease }),
    ), -1)));
  };

  useEffect(() => {
    if (!play) return;
    ui.set(withDelay(reduce ? 0 : 900, withTiming(1, { duration: 900, easing: Easing.out(Easing.exp) })));
    r.set(withDelay(reduce ? 0 : 1400, withTiming(R * 0.85, { duration: 900, easing: Easing.out(Easing.exp) })));
    if (!reduce) wander(1400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  const grab = (x: number, y: number) => {
    'worklet';
    cancelAnimation(cx);
    cancelAnimation(cy);
    cx.set(withSpring(x, { damping: 18, stiffness: 180 }));
    cy.set(withSpring(y, { damping: 18, stiffness: 180 }));
    r.set(withTiming(R, { duration: 400 }));
  };

  // Arrastre horizontal mueve el círculo; el arrastre vertical sigue haciendo scroll.
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-14, 14])
    .onStart((e) => grab(e.x, e.y))
    .onUpdate((e) => {
      cx.set(withTiming(e.x, { duration: 70 }));
      cy.set(withTiming(e.y, { duration: 70 }));
    })
    .onFinalize(() => {
      r.set(withTiming(R * 0.85, { duration: 500 }));
      if (!reduce) wander(1800);
    });
  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      grab(e.x, e.y);
      if (!reduce) wander(2500);
    });
  const gesture = Gesture.Race(pan, tap);

  const circle = useAnimatedStyle(() => ({
    width: r.value * 2,
    height: r.value * 2,
    borderRadius: r.value,
    transform: [{ translateX: cx.value - r.value }, { translateY: cy.value - r.value }],
  }));
  const inner = useAnimatedStyle(() => ({
    transform: [{ translateX: -(cx.value - r.value) }, { translateY: -(cy.value - r.value) }],
  }));

  // Al hacer scroll el texto crece y la interfaz se desvanece.
  const parallax = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-200, 0, H], [-60, 0, H * 0.45], 'clamp') },
      { scale: interpolate(scrollY.value, [-200, 0, H], [0.94, 1, 1.3], 'clamp') },
    ],
  }));
  const uiStyle = useAnimatedStyle(() => ({
    opacity: ui.value * interpolate(scrollY.value, [0, H * 0.35], [1, 0], 'clamp'),
    transform: [{ translateY: (1 - ui.value) * 24 + interpolate(scrollY.value, [0, H * 0.35], [0, -30], 'clamp') }],
  }));
  const fade = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [H * 0.2, H * 0.9], [0, 0.85], 'clamp') }));

  return (
    <View style={{ width: W, height: H, overflow: 'hidden', backgroundColor: C.bg }}>
      <LinearGradient colors={[C.bg, C.bg, C.redDark]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', 'rgba(227,18,11,0.16)', 'transparent']} locations={[0.15, 0.45, 0.8]} style={StyleSheet.absoluteFill} />

      <Animated.View style={[styles.big, { top: textTop }, parallax]}>
        <BigText color={C.red} size={size} play={play} />
      </Animated.View>

      <Smoke width={W} height={H} />

      {/* Capa revelada dentro del círculo */}
      <Animated.View pointerEvents="none" style={[styles.circle, circle]}>
        <Animated.View style={[{ width: W, height: H, backgroundColor: C.red }, inner]}>
          <Animated.View style={[styles.big, { top: textTop }, parallax]}>
            <BigText color={C.bg} size={size} play={play} />
          </Animated.View>
          <Text style={[styles.tag, { top: textTop - 30 }]}>EL PARCHE NO PARA</Text>
        </Animated.View>
      </Animated.View>

      <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(10,6,6,0.92)']} style={[styles.bottomFade, { height: H * 0.42 }]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }, fade]} />

      {/* Zona táctil del círculo: debajo de la interfaz para no bloquear los botones */}
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false} />
      </GestureDetector>

      <Animated.View pointerEvents="box-none" style={[styles.ui, { paddingTop: topSpace + 6, paddingBottom: tabSpace + 22 }, uiStyle]}>
        <View pointerEvents="none" style={styles.top}>
          <Text style={styles.eyebrow}>LOUNGE · LICORES · HUMO</Text>
          <StatusPill />
        </View>
        <View pointerEvents="box-none">
          <Text pointerEvents="none" style={styles.lead}>Licores, granizados, hookah y dos zonas VIP para que el parche no pare.</Text>
          <View style={styles.actions} pointerEvents="box-none">
            <ReserveButton onPress={onReserve} />
            <PressableScale onPress={onCarta} style={styles.ghost} accessibilityRole="button">
              <Text style={styles.ghostText}>Ver carta</Text>
            </PressableScale>
          </View>
          <Text pointerEvents="none" style={styles.hint}>Desliza o toca para mover el círculo</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  big: { position: 'absolute', left: 0, right: 0 },
  circle: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
  tag: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: F.black, fontSize: 12, letterSpacing: 3, color: C.bg },
  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  ui: { ...StyleSheet.absoluteFill, justifyContent: 'space-between', paddingHorizontal: 20 },
  top: { gap: 12 },
  eyebrow: { fontFamily: F.semibold, fontSize: 11, letterSpacing: 2, color: C.text },
  lead: { fontFamily: F.regular, fontSize: 16, lineHeight: 23, color: C.text, maxWidth: 340, marginBottom: 18 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  ghost: { height: 58, paddingHorizontal: 22, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,228,222,0.25)', justifyContent: 'center', backgroundColor: 'rgba(10,6,6,0.55)' },
  ghostText: { fontFamily: F.bold, fontSize: 15, color: C.text },
  hint: { marginTop: 14, fontFamily: F.semibold, fontSize: 10, letterSpacing: 1.6, color: C.muted, textTransform: 'uppercase' },
});
