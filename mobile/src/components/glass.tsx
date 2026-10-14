import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

// Liquid Glass de iOS 26 cuando existe; si no, desenfoque (iOS y web) o un vidrio oscuro translúcido (Android).
const LIQUID = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

type Props = { style?: StyleProp<ViewStyle>; radius?: number; children?: ReactNode };

export function Glass({ style, radius = 28, children }: Props) {
  if (LIQUID) {
    return (
      <GlassView glassEffectStyle="regular" colorScheme="dark" tintColor="rgba(40,12,10,0.35)" style={[{ borderRadius: radius }, style]}>
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[styles.box, { borderRadius: radius }, style]}>
      {Platform.OS !== 'android' && <BlurView intensity={45} tint={Platform.OS === 'ios' ? 'systemChromeMaterialDark' : 'dark'} style={StyleSheet.absoluteFill} />}
      {/* Brillo en el borde superior, como el vidrio de la web */}
      <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']} style={styles.shine} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,228,222,0.14)',
    backgroundColor: Platform.OS === 'android' ? 'rgba(24,11,10,0.9)' : 'rgba(26,13,12,0.45)',
  },
  shine: { position: 'absolute', left: 0, right: 0, top: 0, height: '55%' },
});
