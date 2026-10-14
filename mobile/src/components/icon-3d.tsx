import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export type Icon3DKind = 'instagram' | 'whatsapp' | 'tiktok';

type Look = {
  colors: [string, string, ...string[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
  side: string; // color del grosor del dibujo
  glow: string; // brillo debajo del logo
  glyph: number;
};

const LOOK: Record<Icon3DKind, Look> = {
  instagram: {
    colors: ['#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5'],
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0 },
    side: '#f3d6e8',
    glow: 'rgba(214,36,159,0.55)',
    glyph: require('@/assets/images/redes/instagram.svg'),
  },
  whatsapp: {
    colors: ['#5ff08f', '#25d366', '#0f9d4b'],
    start: { x: 0.2, y: 0 },
    end: { x: 0.8, y: 1 },
    side: '#d6f5e1',
    glow: 'rgba(37,211,102,0.45)',
    glyph: require('@/assets/images/redes/whatsapp.svg'),
  },
  tiktok: {
    colors: ['#2a2a2e', '#050505'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    side: '#25f4ee',
    glow: 'rgba(254,44,85,0.5)',
    glyph: require('@/assets/images/redes/tiktok.svg'),
  },
};

const BODY_LAYERS = 12;
const GLYPH_LAYERS = 5;
const rad = (deg: number) => (deg * Math.PI) / 180;

// Capa que se corre según el ángulo: las de atrás hacen el grosor, las de adelante hacen que el dibujo sobresalga.
function Layer({ depth, step, rx, ry, children }: { depth: number; step: number; rx: SharedValue<number>; ry: SharedValue<number>; children: ReactNode }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: depth * step * Math.sin(rad(ry.value)) }, { translateY: -depth * step * Math.sin(rad(rx.value)) }],
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

// Logo de red social en 3D, como el de la web (contacto.html): flota solo, se inclina al arrastrarlo y salta al tocarlo.
export function Icon3D({ kind, size, onPress }: { kind: Icon3DKind; size: number; onPress?: () => void }) {
  const look = LOOK[kind];
  const reduce = useReducedMotion();
  const round = size * 0.27;
  const step = size / 110;
  const glyphSize = size * 0.64;

  const t = useSharedValue(0.3);
  const px = useSharedValue(0);
  const py = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    if (!reduce) t.set(withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [reduce, t]);

  const rx = useDerivedValue(() => interpolate(t.value, [0, 1], [12, 3]) + px.value);
  const ry = useDerivedValue(() => interpolate(t.value, [0, 1], [-18, 16]) + py.value);

  // Arrastre horizontal inclina el logo; el vertical sigue haciendo scroll.
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-14, 14])
    .onChange((e) => {
      py.set(Math.max(-35, Math.min(35, py.value + e.changeX * 0.5)));
      px.set(Math.max(-20, Math.min(20, px.value - e.changeY * 0.3)));
    })
    .onFinalize(() => {
      px.set(withSpring(0, { damping: 8, stiffness: 120 }));
      py.set(withSpring(0, { damping: 8, stiffness: 120 }));
    });
  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      pop.set(withSequence(withTiming(1, { duration: 140 }), withSpring(0, { damping: 5, stiffness: 160 })));
      if (onPress) scheduleOnRN(onPress);
    });

  const obj = useAnimatedStyle(() => ({
    transform: [
      { perspective: size * 4 },
      { translateY: interpolate(t.value, [0, 1], [0, -size * 0.04]) - pop.value * size * 0.08 },
      { rotateX: `${rx.value * 0.6}deg` },
      { rotateY: `${ry.value * 0.6}deg` },
      { scale: 1 + pop.value * 0.06 },
    ],
  }));
  const floor = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [1, 0.65]) - pop.value * 0.3,
    transform: [{ scaleX: interpolate(t.value, [0, 1], [1, 0.85]) }],
  }));
  const gloss = useAnimatedStyle(() => ({
    transform: [{ translateX: ry.value * size * 0.012 }, { translateY: -rx.value * size * 0.012 }],
  }));

  const box = { width: size, height: size, borderRadius: round };
  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View style={{ width: size, height: size * 1.16 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={[styles.floor, { left: size * 0.18, width: size * 0.64, height: size * 0.1, top: size * 1.04, boxShadow: `0 0 ${size * 0.14}px ${size * 0.08}px ${look.glow}`, backgroundColor: look.glow }, floor]} />
        <Animated.View style={[box, obj]}>
          {Array.from({ length: BODY_LAYERS }, (_, i) => {
            const depth = -(BODY_LAYERS - i);
            return (
              <Layer key={depth} depth={depth} step={step} rx={rx} ry={ry}>
                <View style={[box, styles.clip]}>
                  <LinearGradient colors={look.colors} start={look.start} end={look.end} style={StyleSheet.absoluteFill} />
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${0.4 + (BODY_LAYERS - i) * 0.02})` }]} />
                </View>
              </Layer>
            );
          })}
          <View style={[box, styles.clip]}>
            <LinearGradient colors={look.colors} start={look.start} end={look.end} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.28)']} start={{ x: 0, y: 0.45 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
            <Animated.View style={[styles.gloss, { width: size * 1.4, height: size * 1.4, left: -size * 0.2, top: -size * 0.2 }, gloss]}>
              <LinearGradient colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']} start={{ x: 0.3, y: 0.15 }} end={{ x: 0.55, y: 0.55 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <View style={[StyleSheet.absoluteFill, { borderRadius: round, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }]} />
          </View>
          {Array.from({ length: GLYPH_LAYERS }, (_, i) => {
            const top = i === GLYPH_LAYERS - 1;
            return (
              <Layer key={`g${i}`} depth={i + 1} step={step} rx={rx} ry={ry}>
                <View style={styles.center}>
                  <Image source={look.glyph} tintColor={top ? '#ffffff' : look.side} style={{ width: glyphSize, height: glyphSize }} contentFit="contain" />
                </View>
              </Layer>
            );
          })}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gloss: { position: 'absolute' },
  floor: { position: 'absolute', borderRadius: 999 },
});
