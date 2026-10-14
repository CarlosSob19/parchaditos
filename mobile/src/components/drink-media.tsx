import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native';

import type { Drink } from '@/constants/config';
import { lh } from '@/constants/layout';
import { C, F } from '@/constants/theme';

const TINTS: Record<Drink['cat'], [string, string]> = {
  botellas: [C.redDeep, C.surface],
  granizados: ['#4b1a99', C.surface],
  cocteles: ['#5c0a22', C.surface],
};

const ICONS = {
  botellas: { ios: 'wineglass', android: 'liquor', web: 'liquor' },
  granizados: { ios: 'snowflake', android: 'ac_unit', web: 'ac_unit' },
  cocteles: { ios: 'takeoutbag.and.cup.and.straw', android: 'local_bar', web: 'local_bar' },
} as const;

// Foto de la bebida, o un fondo con ícono y nombre mientras no haya foto.
export function DrinkMedia({ drink, height, ghostSize = 30, style, children }: { drink: Drink; height: number; ghostSize?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  if (drink.img) {
    return (
      <LinearGradient colors={TINTS[drink.cat]} style={[styles.box, { height }, style]}>
        <Image source={drink.img} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityLabel={drink.nombre} />
        {children}
      </LinearGradient>
    );
  }
  return (
    <LinearGradient colors={TINTS[drink.cat]} style={[styles.box, { height }, style]}>
      <Text style={[styles.ghost, { fontSize: ghostSize, lineHeight: lh(ghostSize) }]}>
        {drink.nombre.split(' ')[0].toUpperCase()}
      </Text>
      <SymbolView name={ICONS[drink.cat]} size={height * 0.36} tintColor="rgba(255,228,222,0.45)" style={styles.icon} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  box: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  ghost: { position: 'absolute', left: 10, width: 1200, fontFamily: F.display, color: 'rgba(255,228,222,0.1)' },
  icon: { opacity: 0.9 },
});
