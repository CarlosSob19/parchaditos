import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { lh } from '@/constants/layout';
import { C, F } from '@/constants/theme';

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [denied, setDenied] = useState(false);

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut.duration(400)} style={styles.backdrop} accessibilityViewIsModal>
      <Animated.View entering={ZoomIn.springify().damping(16)} style={styles.box}>
        <Text style={styles.eyebrow}>ACCESO RESTRINGIDO</Text>
        <Text style={styles.title} accessibilityRole="header">{'¿ERES MAYOR\nDE 18 AÑOS?'}</Text>
        <Text style={styles.text}>Esta app contiene alcohol y productos para mayores de edad.</Text>
        <View style={styles.actions}>
          <PressableScale onPress={onConfirm} style={[styles.btn, styles.yes]} accessibilityRole="button">
            <Text style={styles.yesText}>Sí, soy mayor</Text>
          </PressableScale>
          <PressableScale onPress={() => setDenied(true)} style={[styles.btn, styles.no]} accessibilityRole="button">
            <Text style={styles.noText}>No</Text>
          </PressableScale>
        </View>
        {denied && <Text style={styles.denied}>Lo sentimos, no puedes usar esta app.</Text>}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, zIndex: 100, backgroundColor: 'rgba(10,6,6,0.97)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  box: { width: '100%', maxWidth: 420, padding: 28, borderRadius: 20, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.line, alignItems: 'center' },
  eyebrow: { fontFamily: F.semibold, fontSize: 11, letterSpacing: 2, color: C.muted, marginBottom: 12 },
  title: { fontFamily: F.display, fontSize: 28, lineHeight: lh(28), color: C.text, textAlign: 'center', marginBottom: 12 },
  text: { fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.muted, textAlign: 'center', marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { height: 52, paddingHorizontal: 24, borderRadius: 999, justifyContent: 'center' },
  yes: { backgroundColor: C.red },
  yesText: { fontFamily: F.bold, fontSize: 15, color: C.onRed },
  no: { borderWidth: 1, borderColor: C.line },
  noText: { fontFamily: F.bold, fontSize: 15, color: C.text },
  denied: { marginTop: 18, fontFamily: F.semibold, color: C.redHot },
});
