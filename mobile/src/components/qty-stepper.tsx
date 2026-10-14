import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { C, F } from '@/constants/theme';

// Botones −/+ con la cantidad en el medio (tarjetas de la carta y hoja del pedido).
export function QtyStepper({ n, name, onChange, width }: { n: number; name: string; onChange: (d: number) => void; width?: number }) {
  return (
    <View style={[styles.stepper, width ? { width } : null]} accessibilityLabel={`Cantidad de ${name}: ${n}`}>
      <PressableScale haptic="select" onPress={() => onChange(-1)} style={styles.btn} accessibilityRole="button" accessibilityLabel="Quitar uno">
        <Text style={styles.sign}>−</Text>
      </PressableScale>
      <Text style={styles.n}>{n}</Text>
      <PressableScale haptic="select" onPress={() => onChange(1)} style={styles.btn} accessibilityRole="button" accessibilityLabel="Agregar uno">
        <Text style={styles.sign}>+</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { marginTop: 'auto', height: 44, borderRadius: 999, backgroundColor: C.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sign: { fontFamily: F.bold, fontSize: 20, color: C.onRed },
  n: { fontFamily: F.black, fontSize: 15, color: C.onRed, fontVariant: ['tabular-nums'] },
});
