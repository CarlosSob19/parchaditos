import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { C, F } from '@/constants/theme';

// Acordeón de preguntas frecuentes: una abierta a la vez.
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <View style={styles.list}>
      {items.map((f, i) => {
        const on = open === i;
        return (
          <Animated.View key={f.q} layout={LinearTransition.duration(250)} style={styles.item}>
            <PressableScale
              haptic="select"
              scaleTo={0.99}
              onPress={() => setOpen(on ? null : i)}
              style={styles.row}
              accessibilityRole="button"
              accessibilityState={{ expanded: on }}>
              <Text style={styles.q}>{f.q}</Text>
              <View style={[styles.icon, on && styles.iconOn]}>
                <Text style={[styles.iconText, on && { color: C.onRed, transform: [{ rotate: '45deg' }] }]}>+</Text>
              </View>
            </PressableScale>
            {on && (
              <Animated.Text entering={FadeIn.duration(250)} style={styles.a}>
                {f.a}
              </Animated.Text>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderTopWidth: 1, borderTopColor: C.line },
  item: { borderBottomWidth: 1, borderBottomColor: C.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18 },
  q: { flex: 1, fontFamily: F.black, fontSize: 18, lineHeight: 23, color: C.text },
  icon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  iconOn: { backgroundColor: C.red, borderColor: C.red },
  iconText: { fontFamily: F.semibold, fontSize: 22, lineHeight: 26, color: C.text },
  a: { fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.muted, paddingBottom: 20, marginTop: -4 },
});
