import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { DrinkMedia } from '@/components/drink-media';
import { Glass } from '@/components/glass';
import { PressableScale } from '@/components/pressable-scale';
import { QtyStepper } from '@/components/qty-stepper';
import { ScreenCurtain } from '@/components/screen-curtain';
import { SplitText } from '@/components/split-text';
import { DRINK_CATS } from '@/constants/config';
import { lh, useTabBarSpace, useTopBarSpace } from '@/constants/layout';
import { C, F, S } from '@/constants/theme';
import { price } from '@/lib/booking';
import { useCart } from '@/lib/cart';
import { useCatalog } from '@/lib/catalog';
import { useUnlocked } from '@/lib/unlock';

type Filter = (typeof DRINK_CATS)[number]['id'];
const SPRING = { damping: 18, stiffness: 220 };
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// La carta: igual que la página de productos de la web (título grande, filtros de vidrio, búsqueda y pedido).
export default function Carta() {
  const { width } = useWindowDimensions();
  const topSpace = useTopBarSpace();
  const tabSpace = useTabBarSpace();
  const unlocked = useUnlocked();
  const cart = useCart();
  const { drinks } = useCatalog();
  const params = useLocalSearchParams<{ cat?: string }>();
  const validCat = (c?: string): c is Filter => !!c && DRINK_CATS.some((x) => x.id === c);
  const [filter, setFilter] = useState<Filter>(validCat(params.cat) ? params.cat : 'todos');
  // Desde el inicio se puede abrir una categoría directo (/carta?cat=granizados), aunque la pestaña ya esté abierta.
  const [seenCat, setSeenCat] = useState(params.cat);
  if (params.cat !== seenCat) {
    setSeenCat(params.cat);
    if (validCat(params.cat)) setFilter(params.cat);
  }
  const [query, setQuery] = useState('');
  const [play, setPlay] = useState(false);
  const [boxes, setBoxes] = useState<Record<string, { x: number; width: number }>>({});
  const titleSize = Math.min(86, (width - 32) / 4.4);

  useFocusEffect(useCallback(() => {
    if (unlocked) setPlay(true);
  }, [unlocked]));

  const data = useMemo(() => {
    const q = norm(query.trim());
    return drinks.filter((d) => filter === 'todos' || d.cat === filter).filter((d) => !q || norm(`${d.nombre} ${d.detalle}`).includes(q));
  }, [filter, query, drinks]);

  // Píldora roja que se desliza bajo el filtro activo.
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const pill = useAnimatedStyle(() => ({ width: pillW.value, transform: [{ translateX: pillX.value }] }));
  useEffect(() => {
    const b = boxes[filter];
    if (!b) return;
    if (!pillW.value) {
      pillX.set(b.x);
      pillW.set(b.width);
    } else {
      pillX.set(withSpring(b.x, SPRING));
      pillW.set(withSpring(b.width, SPRING));
    }
  }, [filter, boxes, pillX, pillW]);

  const header = (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>LA CARTA · LICORES · GRANIZADOS · COCTELES</Text>
      <SplitText text="BIEN" style={[styles.title, { fontSize: titleSize, lineHeight: lh(titleSize) }]} dist={lh(titleSize)} play={play} stagger={45} />
      <View style={{ marginTop: -titleSize * 0.22 }}>
        <SplitText text="FRÍO" style={[styles.title, styles.titleRed, { fontSize: titleSize, lineHeight: lh(titleSize) }]} dist={lh(titleSize)} play={play} delay={200} stagger={45} />
      </View>
      <Text style={styles.lead}>Agrega lo que quieras al pedido y lo envías completo por WhatsApp.</Text>

      <Glass radius={26} style={styles.tools}>
        <View style={styles.search}>
          <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={17} tintColor={C.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar en la carta…"
            placeholderTextColor={C.muted}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Buscar en la carta"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsWrap}>
          <View style={styles.tabs} accessibilityRole="tablist">
            <Animated.View style={[styles.pill, pill]} />
            {DRINK_CATS.map((c) => (
              <PressableScale
                key={c.id}
                haptic="select"
                onPress={() => setFilter(c.id)}
                onLayout={(e) => {
                  const { x, width: w } = e.nativeEvent.layout;
                  setBoxes((prev) => ({ ...prev, [c.id]: { x, width: w } }));
                }}
                style={styles.tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: filter === c.id }}>
                <Text style={[styles.tabText, filter === c.id && styles.tabTextOn]}>{c.nombre}</Text>
              </PressableScale>
            ))}
          </View>
        </ScrollView>
      </Glass>
      <Text style={styles.count}>{data.length} {data.length === 1 ? 'bebida' : 'bebidas'}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <LinearGradient pointerEvents="none" colors={['rgba(227,18,11,0.22)', 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 0.45 }} style={StyleSheet.absoluteFill} />
      <FlatList
        data={data}
        keyExtractor={(d) => `${filter}-${d.id}`}
        extraData={[filter, cart.count]}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ paddingTop: topSpace, paddingHorizontal: S.gutter, gap: 10, paddingBottom: tabSpace + (cart.count ? 96 : 24) }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.empty}>{query.trim() ? `No encontramos “${query.trim()}”. Prueba con otra palabra.` : 'No hay bebidas en esta categoría por ahora.'}</Text>}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).springify().damping(16)} style={styles.cardWrap}>
            <View style={[styles.card, item.agotado && styles.cardOut]}>
              <DrinkMedia drink={item} height={130}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.cat.toUpperCase()}</Text>
                </View>
              </DrinkMedia>
              <View style={styles.body}>
                <Text style={styles.name}>{item.nombre}</Text>
                <Text style={styles.detail}>{item.detalle}</Text>
                <Text style={styles.price}>{price(item.precio)}</Text>
                {item.agotado ? (
                  <View style={[styles.order, styles.soldOut]} accessibilityLabel={`${item.nombre} agotado`}>
                    <Text style={styles.soldOutText}>Agotado</Text>
                  </View>
                ) : cart.qty(item.id) > 0 ? (
                  <QtyStepper n={cart.qty(item.id)} name={item.nombre} onChange={(d) => cart.add(item.id, d)} />
                ) : (
                  <PressableScale onPress={() => cart.add(item.id)} style={styles.order} accessibilityRole="button" accessibilityLabel={`Agregar ${item.nombre} al pedido`}>
                    <Text style={styles.orderText}>+ Agregar</Text>
                  </PressableScale>
                )}
              </View>
            </View>
          </Animated.View>
        )}
      />

      {cart.count > 0 && (
        <Animated.View entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown} style={[styles.bar, { bottom: tabSpace + 4 }]}>
          <PressableScale onPress={cart.open} style={styles.barBtn} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={`Ver tu pedido, ${cart.count} productos`}>
            <Text style={styles.barText}>Ver tu pedido</Text>
            <View style={styles.barCount}>
              <Text style={styles.barCountText}>{cart.count}</Text>
            </View>
          </PressableScale>
        </Animated.View>
      )}
      <ScreenCurtain />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { paddingTop: 12, paddingBottom: 8 },
  eyebrow: { fontFamily: F.semibold, fontSize: 11, letterSpacing: 2, color: C.muted, marginBottom: 12 },
  title: { fontFamily: F.display, letterSpacing: -2, color: C.text },
  titleRed: { color: C.red },
  lead: { fontFamily: F.regular, fontSize: 16, lineHeight: 23, color: C.muted, marginTop: 14, marginBottom: 22, maxWidth: 340 },
  tools: { padding: 6, gap: 6 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(10,6,6,0.45)' },
  searchInput: { flex: 1, height: 46, fontFamily: F.regular, fontSize: 15, color: C.text },
  tabsWrap: { paddingRight: 4 },
  tabs: { flexDirection: 'row' },
  pill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 999, backgroundColor: C.red, boxShadow: '0 6px 18px rgba(227,18,11,0.4)' },
  tab: { height: 42, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 999 },
  tabText: { fontFamily: F.bold, fontSize: 14, color: C.muted },
  tabTextOn: { color: C.onRed },
  count: { fontFamily: F.semibold, fontSize: 12, color: C.muted, marginTop: 14 },
  empty: { fontFamily: F.regular, fontSize: 15, color: C.muted, textAlign: 'center', paddingVertical: 40 },
  cardWrap: { flex: 1 },
  card: { flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  cardOut: { opacity: 0.6 },
  badge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(10,6,6,0.7)' },
  badgeText: { fontFamily: F.bold, fontSize: 9, letterSpacing: 0.8, color: C.text },
  body: { padding: 12, flex: 1 },
  name: { fontFamily: F.bold, fontSize: 15, lineHeight: 19, color: C.text },
  detail: { fontFamily: F.regular, fontSize: 12, color: C.muted, marginTop: 2 },
  price: { fontFamily: F.black, fontSize: 14, color: C.text, marginTop: 10, marginBottom: 10 },
  order: { marginTop: 'auto', height: 44, borderRadius: 999, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  orderText: { fontFamily: F.bold, fontSize: 14, color: C.onRed },
  soldOut: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.line },
  soldOutText: { fontFamily: F.bold, fontSize: 13, color: C.muted },

  bar: { position: 'absolute', left: S.gutter, right: S.gutter },
  barBtn: { height: 60, borderRadius: 999, backgroundColor: C.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 9, boxShadow: '0 12px 34px rgba(227,18,11,0.5)' },
  barText: { fontFamily: F.black, fontSize: 16, color: C.onRed },
  barCount: { minWidth: 42, height: 42, borderRadius: 21, backgroundColor: C.onRed, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  barCountText: { fontFamily: F.black, fontSize: 16, color: C.red },
});
