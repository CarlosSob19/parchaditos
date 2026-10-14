import { Image, StyleSheet } from 'react-native';

// Textura de grano sobre toda la app, como en la web. No recibe toques.
export function Grain() {
  return (
    <Image
      source={require('@/assets/images/grain.png')}
      resizeMode="repeat"
      style={styles.grain}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  grain: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', opacity: 0.05, pointerEvents: 'none' },
});
