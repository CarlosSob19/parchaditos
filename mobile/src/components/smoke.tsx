import { BlurMask, Canvas, Circle, Group, useClock } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { type SharedValue, useDerivedValue, useReducedMotion } from 'react-native-reanimated';

type Props = { width: number; height: number; count?: number };

// Pseudoaleatorio estable (mismo resultado en cada render).
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Seed = { x: number; speed: number; size: number; phase: number; drift: number; red: boolean };

// Una partícula: su posición sale solo del reloj, así todo corre en el hilo de UI sin estado en JS.
const Puff = memo(function Puff({ clock, seed, w, h }: { clock: SharedValue<number>; seed: Seed; w: number; h: number }) {
  const travel = h + seed.size * 2;
  const duration = (travel / seed.speed) * 1000;

  const t = useDerivedValue(() => ((clock.value + seed.phase * duration) % duration) / duration);
  const cy = useDerivedValue(() => h + seed.size - t.value * travel);
  const cx = useDerivedValue(() => seed.x * w + Math.sin(t.value * Math.PI * 2 + seed.phase * 6) * seed.drift);
  const r = useDerivedValue(() => seed.size * (0.6 + t.value * 0.9));
  const opacity = useDerivedValue(() => Math.sin(t.value * Math.PI) * 0.16);

  return (
    <Circle cx={cx} cy={cy} r={r} opacity={opacity} color={seed.red ? '#ff4632' : '#ffe6e1'}>
      <BlurMask blur={seed.size * 0.6} style="normal" />
    </Circle>
  );
});

// Humo suave que sube desde abajo.
export function Smoke({ width, height, count = 14 }: Props) {
  const reduce = useReducedMotion();
  const clock = useClock();

  const seeds = useMemo<Seed[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (i + rand(i)) / count,
        speed: 22 + rand(i + 1.1) * 28,
        size: 50 + rand(i + 2.2) * 70,
        phase: rand(i + 3.3),
        drift: 20 + rand(i + 4.4) * 40,
        red: rand(i + 5.5) < 0.4,
      })),
    [count],
  );

  if (reduce || !width || !height) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group blendMode="screen">
          {seeds.map((s, i) => (
            <Puff key={i} clock={clock} seed={s} w={width} h={height} />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}
