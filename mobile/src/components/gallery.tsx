import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { GALLERY } from '@/constants/config';
import { lh } from '@/constants/layout';
import { C, F, S } from '@/constants/theme';

// Fotos del local en carrusel horizontal. Sin foto se ve un fondo con la palabra grande.
export function Gallery({ items }: { items: typeof GALLERY }) {
  const { width } = useWindowDimensions();
  const w = width * 0.72;
  const h = w * 1.25;

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(g) => g.alt}
      showsHorizontalScrollIndicator={false}
      snapToInterval={w + 12}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: S.gutter, gap: 12 }}
      renderItem={({ item }) => (
        <View style={[styles.shot, { width: w, height: h }]} accessible accessibilityRole="image" accessibilityLabel={item.alt}>
          <LinearGradient colors={[C.surface, C.redDeep]} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={StyleSheet.absoluteFill} />
          {item.img ? (
            <Image source={item.img} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          ) : (
            <Text style={styles.ghost}>{item.texto}</Text>
          )}
          {item.img && (
            <View style={styles.caption}>
              <Text style={styles.captionText}>{item.alt}</Text>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  shot: { borderRadius: S.radius, overflow: 'hidden', borderWidth: 1, borderColor: C.line, justifyContent: 'flex-end' },
  ghost: { width: 1200, fontFamily: F.display, fontSize: 72, lineHeight: lh(72), color: 'rgba(255,228,222,0.12)', paddingHorizontal: 16, paddingBottom: 8 },
  caption: { position: 'absolute', left: 14, bottom: 14, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(10,6,6,0.7)' },
  captionText: { fontFamily: F.bold, fontSize: 12, color: C.text },
});
