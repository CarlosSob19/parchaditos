import type { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { type ComponentProps, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/glass';
import { PressableScale } from '@/components/pressable-scale';
import { TOP_BAR_H } from '@/constants/layout';
import { C, F } from '@/constants/theme';
import { useCart } from '@/lib/cart';

type BarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ITEMS: Record<string, { label: string; icon: ComponentProps<typeof SymbolView>['name'] }> = {
  index: { label: 'Inicio', icon: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' } },
  carta: { label: 'Carta', icon: { ios: 'wineglass.fill', android: 'local_bar', web: 'local_bar' } },
  reservar: { label: 'Reservar', icon: { ios: 'calendar', android: 'event', web: 'event' } },
  contacto: { label: 'Contacto', icon: { ios: 'bubble.left.and.bubble.right.fill', android: 'forum', web: 'forum' } },
};

const SPRING = { damping: 18, stiffness: 220 };

// Barra de navegación de vidrio, flotando arriba: logo, pestañas con píldora roja que se desliza y la bolsa del pedido.
export function TopBar({ state, navigation }: BarProps) {
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const [boxes, setBoxes] = useState<Record<number, { x: number; width: number }>>({});
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);

  useEffect(() => {
    const b = boxes[state.index];
    if (!b) return;
    if (!pillW.value) {
      pillX.set(b.x);
      pillW.set(b.width);
    } else {
      pillX.set(withSpring(b.x, SPRING));
      pillW.set(withSpring(b.width, SPRING));
    }
  }, [state.index, boxes, pillX, pillW]);

  const pill = useAnimatedStyle(() => ({ width: pillW.value, transform: [{ translateX: pillX.value }] }));

  const go = (i: number) => {
    const route = state.routes[i];
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (state.index !== i && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8 }]}>
      <Glass radius={TOP_BAR_H / 2} style={styles.bar}>
        <PressableScale onPress={() => go(0)} style={styles.logo} accessibilityRole="button" accessibilityLabel="Parchaditos, inicio">
          <Text style={styles.logoText}>P</Text>
        </PressableScale>

        <View style={styles.tabs} accessibilityRole="tablist">
          <Animated.View style={[styles.pill, pill]} />
          {state.routes.map((route, i) => {
            const item = ITEMS[route.name];
            if (!item) return null;
            const on = state.index === i;
            return (
              <PressableScale
                key={route.key}
                haptic="select"
                scaleTo={0.92}
                onPress={() => go(i)}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  setBoxes((prev) => ({ ...prev, [i]: { x, width } }));
                }}
                style={[styles.tab, on && styles.tabOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={item.label}>
                <SymbolView name={item.icon} size={on ? 15 : 18} tintColor={on ? C.onRed : C.muted} />
                {/* Con cuatro pestañas no caben todos los nombres: solo la activa lo muestra. */}
                {on && <Text style={[styles.label, styles.labelOn]} numberOfLines={1}>{item.label}</Text>}
              </PressableScale>
            );
          })}
        </View>

        <PressableScale onPress={cart.open} style={styles.bag} accessibilityRole="button" accessibilityLabel={`Tu pedido, ${cart.count} productos`}>
          <SymbolView name={{ ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' }} size={19} tintColor={C.text} />
          {cart.count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cart.count}</Text>
            </View>
          )}
        </PressableScale>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 50 },
  bar: { height: TOP_BAR_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 6, boxShadow: '0 14px 40px rgba(0,0,0,0.55)' },
  logo: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: F.display, fontSize: 24, lineHeight: 30, color: C.bg },
  tabs: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 44 },
  pill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 22, backgroundColor: C.red, boxShadow: '0 6px 18px rgba(227,18,11,0.45)' },
  tab: { flex: 1, height: 44, paddingHorizontal: 4, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  tabOn: { flex: 2.4 },
  label: { fontFamily: F.bold, fontSize: 13, color: C.muted },
  labelOn: { color: C.onRed },
  bag: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,228,222,0.08)', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg2 },
  badgeText: { fontFamily: F.black, fontSize: 11, color: C.onRed },
});
