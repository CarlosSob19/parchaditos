import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, type SharedValue, useAnimatedStyle, useReducedMotion, useSharedValue } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { lh, useTopBarSpace } from '@/constants/layout';
import { C, F } from '@/constants/theme';

const CARDS = [
  { num: '01', title: 'LLEGAS', text: 'Granizado bien frío o la botella de la casa. Te recibimos en la mesa y arrancamos.', ghost: 'FRÍO', red: false },
  { num: '02', title: 'PRENDES', text: 'Hookah preparada al momento con el sabor que quieras. Cambio de carbón incluido.', ghost: 'HUMO', red: false },
  { num: '03', title: 'TE QUEDAS', text: 'Zona VIP para tu grupo, atención directa y, el fin de semana, la noche hasta las 2 a.m.', ghost: 'VIP', red: true },
];

const GAP = 18;
const PEEK = 14;

type CardProps = {
  i: number;
  card: (typeof CARDS)[number];
  scrollY: SharedValue<number>;
  base: SharedValue<number>;
  cardH: number;
  pinTop: number;
  reduce: boolean;
};

const Card = memo(function Card({ i, card, scrollY, base, cardH, pinTop, reduce }: CardProps) {
  const { height } = useWindowDimensions();
  const last = CARDS.length - 1;

  const style = useAnimatedStyle(() => {
    if (reduce || base.value < 0) return {};
    // Posición de cada tarjeta dentro del contenido del scroll.
    const top = (n: number) => base.value + n * (cardH + GAP);
    const stick = (n: number) => pinTop + n * PEEK;
    // Se queda fija desde que llega a su lugar hasta que la última tarjeta llega al suyo.
    const from = top(i) - stick(i);
    const until = top(last) - stick(last);
    const shift = Math.min(Math.max(scrollY.value - from, 0), Math.max(until - from, 0));
    // Mientras sube la siguiente, esta se encoge y se oscurece.
    let p = 0;
    if (i < last) {
      const nextFrom = top(i + 1) - stick(i + 1);
      p = interpolate(scrollY.value, [nextFrom - height * 0.55, nextFrom], [0, 1], 'clamp');
    }
    return { transform: [{ translateY: shift }, { scale: 1 - p * 0.08 }] };
  });

  const dim = useAnimatedStyle(() => {
    if (reduce || base.value < 0 || i === last) return { opacity: 0 };
    const top = (n: number) => base.value + n * (cardH + GAP);
    const nextFrom = top(i + 1) - (pinTop + (i + 1) * PEEK);
    return { opacity: interpolate(scrollY.value, [nextFrom - height * 0.55, nextFrom], [0, 0.45], 'clamp') };
  });

  return (
    <Animated.View style={[styles.card, { height: cardH, zIndex: i, transformOrigin: 'top' }, card.red && styles.cardRed, style]}>
      <LinearGradient
        colors={card.red ? ['#ff4a3d', C.red] : ['rgba(227,18,11,0.28)', 'transparent']}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.2, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.ghost, card.red && { color: 'rgba(255,255,255,0.16)' }]}>{card.ghost}</Text>
      <Text style={[styles.num, card.red && { color: C.onRed }]}>{card.num}</Text>
      <View>
        <Text style={[styles.title, card.red && { color: C.onRed }]}>{card.title}</Text>
        <Text style={[styles.text, card.red && { color: 'rgba(255,255,255,0.88)' }]}>{card.text}</Text>
        {card.red && (
          <PressableScale onPress={() => router.navigate('/reservar?servicio=vip')} style={styles.btn} accessibilityRole="button">
            <Text style={styles.btnText}>Reservar zona VIP</Text>
          </PressableScale>
        )}
      </View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, dim]} />
    </Animated.View>
  );
});

// "Así va el parche": tarjetas que se quedan fijas y se apilan al hacer scroll (como la web).
export function StackCards({ scrollY }: { scrollY: SharedValue<number> }) {
  const reduce = useReducedMotion();
  const topSpace = useTopBarSpace();
  const { height } = useWindowDimensions();
  const base = useSharedValue(-1);
  const cardH = Math.min(Math.max(height * 0.56, 380), 520);
  const pinTop = topSpace + 6;

  return (
    <View style={styles.stack} onLayout={(e) => base.set(e.nativeEvent.layout.y)}>
      {CARDS.map((c, i) => (
        <Card key={c.num} i={i} card={c} scrollY={scrollY} base={base} cardH={cardH} pinTop={pinTop} reduce={reduce} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { paddingHorizontal: 16, gap: GAP },
  card: {
    borderRadius: 24,
    padding: 24,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
  },
  cardRed: { backgroundColor: C.red, borderColor: C.red },
  ghost: { position: 'absolute', right: -12, top: 34, width: 600, textAlign: 'right', fontFamily: F.display, fontSize: 130, lineHeight: lh(130), color: 'rgba(255,228,222,0.07)' },
  num: { position: 'absolute', top: 22, left: 24, fontFamily: F.black, fontSize: 13, letterSpacing: 1.4, color: C.muted },
  title: { fontFamily: F.display, fontSize: 52, lineHeight: lh(52), letterSpacing: -1.5, color: C.text, marginBottom: 10 },
  text: { fontFamily: F.regular, fontSize: 16, lineHeight: 23, color: C.muted, maxWidth: 320 },
  btn: { alignSelf: 'flex-start', marginTop: 20, height: 50, paddingHorizontal: 22, borderRadius: 999, backgroundColor: C.text, justifyContent: 'center' },
  btnText: { fontFamily: F.bold, fontSize: 15, color: C.bg },
});
