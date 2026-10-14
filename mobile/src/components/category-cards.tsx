import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { type ComponentProps } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import type { DrinkCat } from '@/constants/config';
import { lh } from '@/constants/layout';
import { C, F, S } from '@/constants/theme';
import { useCatalog } from '@/lib/catalog';

// Mismo diseño que las tarjetas grandes de categorías de la web: número, palabra gigante de fondo, ícono y enlace.
const CATS: { id: DrinkCat; nombre: string; ghost: string; desc: string; glow: string; icon: ComponentProps<typeof SymbolView>['name'] }[] = [
  { id: 'botellas', nombre: 'Botellas', ghost: 'SHOT', desc: 'Aguardiente, ron, whisky, tequila y más. Media o botella.', glow: 'rgba(227,18,11,0.55)', icon: { ios: 'wineglass', android: 'liquor', web: 'liquor' } },
  { id: 'granizados', nombre: 'Granizados', ghost: 'FRÍO', desc: 'Con o sin licor, bien fríos y del sabor que quieras.', glow: 'rgba(150,70,255,0.55)', icon: { ios: 'snowflake', android: 'ac_unit', web: 'ac_unit' } },
  { id: 'cocteles', nombre: 'Cocteles', ghost: 'MIX', desc: 'Micheladas y el cóctel de la casa. Pregunta el del día.', glow: 'rgba(160,12,40,0.6)', icon: { ios: 'takeoutbag.and.cup.and.straw', android: 'local_bar', web: 'local_bar' } },
];

export function CategoryCards() {
  const { width } = useWindowDimensions();
  const { drinks } = useCatalog();
  const w = Math.min(width * 0.8, 420);

  return (
    <FlatList
      horizontal
      data={CATS}
      keyExtractor={(c) => c.id}
      showsHorizontalScrollIndicator={false}
      snapToInterval={w + 12}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: S.gutter, gap: 12 }}
      renderItem={({ item, index }) => {
        const n = drinks.filter((d) => d.cat === item.id).length;
        return (
          <PressableScale
            onPress={() => router.navigate(`/carta?cat=${item.id}`)}
            scaleTo={0.98}
            style={[styles.card, { width: w }]}
            accessibilityRole="button"
            accessibilityLabel={`${item.nombre}, ${n} bebidas. Ver en la carta`}>
            <View style={styles.media}>
              <LinearGradient colors={[item.glow, 'transparent']} start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 0 }} style={StyleSheet.absoluteFill} />
              <Text style={styles.ghost}>{item.ghost}</Text>
              <SymbolView name={item.icon} size={84} tintColor="rgba(255,228,222,0.55)" />
              <Text style={styles.num}>{String(index + 1).padStart(2, '0')}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.nombre.toUpperCase()}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
              <Text style={styles.link}>Ver {item.nombre.toLowerCase()} ({n}) →</Text>
            </View>
          </PressableScale>
        );
      }}
    />
  );
}

// "VER TODA LA CARTA →" grande, como "Ver todo el catálogo" de la web.
export function MoreLink() {
  return (
    <PressableScale onPress={() => router.navigate('/carta')} scaleTo={0.98} style={styles.more} accessibilityRole="button" accessibilityLabel="Ver toda la carta">
      <Text style={styles.moreText}>
        VER TODA{'\n'}LA <Text style={{ color: C.red }}>CARTA</Text>
      </Text>
      <View style={styles.moreGo}>
        <Text style={styles.moreArrow}>→</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { height: 440, borderRadius: S.radius, overflow: 'hidden', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  media: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ghost: { position: 'absolute', left: -10, width: 1200, fontFamily: F.display, fontSize: 130, lineHeight: lh(130), color: 'rgba(255,228,222,0.08)' },
  num: { position: 'absolute', top: 18, left: 20, fontFamily: F.black, fontSize: 13, color: C.muted, letterSpacing: 1 },
  info: { padding: 20, borderTopWidth: 1, borderTopColor: C.line },
  title: { fontFamily: F.display, fontSize: 32, lineHeight: lh(32), color: C.text },
  desc: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.muted, marginTop: 4, marginBottom: 12 },
  link: { fontFamily: F.bold, fontSize: 14, color: C.redHot },
  more: { marginHorizontal: S.gutter, marginTop: 28, paddingVertical: 26, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moreText: { fontFamily: F.display, fontSize: 40, lineHeight: lh(40) - 6, letterSpacing: -1.2, color: C.text },
  moreGo: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(227,18,11,0.45)' },
  moreArrow: { fontFamily: F.bold, fontSize: 30, lineHeight: 34, color: C.onRed },
});
