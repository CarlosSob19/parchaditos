import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/glass';
import { PressableScale } from '@/components/pressable-scale';
import { QtyStepper } from '@/components/qty-stepper';
import { lh } from '@/constants/layout';
import { C, F, S } from '@/constants/theme';
import { price } from '@/lib/booking';
import { useCart } from '@/lib/cart';
import { openWhatsApp } from '@/lib/whatsapp';

// Hoja del pedido. Se abre desde la bolsa de la barra superior o desde "Tu pedido" en la carta.
export function CartSheet() {
  const cart = useCart();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const total = cart.lines.reduce((s, l) => s + (l.drink.precio ?? 0) * l.n, 0);
  const pending = cart.lines.some((l) => !l.drink.precio);

  return (
    <Modal visible={cart.sheet} transparent animationType="slide" onRequestClose={cart.close}>
      <Pressable style={styles.scrim} onPress={cart.close} accessibilityLabel="Cerrar pedido" />
      <Glass radius={28} style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.grab} />
        <View style={styles.head}>
          <Text style={styles.title}>TU PEDIDO</Text>
          <PressableScale onPress={cart.close} style={styles.close} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Text style={styles.closeText}>✕</Text>
          </PressableScale>
        </View>
        <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
          {cart.lines.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Tu pedido está vacío.</Text>
              <PressableScale onPress={() => { cart.close(); router.navigate('/carta'); }} style={styles.ghostBtn} accessibilityRole="button">
                <Text style={styles.ghostText}>Ver la carta →</Text>
              </PressableScale>
            </View>
          )}
          {cart.lines.map(({ drink, n }) => (
            <View key={drink.id} style={styles.line}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{drink.nombre}</Text>
                <Text style={styles.detail}>{drink.detalle} · {drink.precio ? price(drink.precio * n) : 'Consultar'}</Text>
              </View>
              <QtyStepper n={n} name={drink.nombre} onChange={(d) => cart.add(drink.id, d)} width={132} />
            </View>
          ))}
          {cart.lines.length > 0 && (
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Notas (opcional): mesa, hora, algo especial…"
              placeholderTextColor="rgba(176,154,149,0.6)"
              style={styles.note}
              multiline
            />
          )}
        </ScrollView>
        {cart.lines.length > 0 && (
          <>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>{total ? `${price(total)}${pending ? ' + consultar' : ''}` : 'Por consultar'}</Text>
            </View>
            <PressableScale onPress={() => openWhatsApp(cart.message(note.trim()))} style={styles.send} accessibilityRole="button">
              <Text style={styles.sendText}>Enviar pedido por WhatsApp</Text>
            </PressableScale>
            <Text style={styles.small}>Te confirmamos disponibilidad y precio por WhatsApp.</Text>
            <Text style={styles.clear} onPress={() => { cart.clear(); cart.close(); }} accessibilityRole="button">
              Vaciar pedido
            </Text>
          </>
        )}
      </Glass>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(10,6,6,0.65)' },
  sheet: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingHorizontal: S.gutter, paddingTop: 10, backgroundColor: 'rgba(19,9,9,0.92)' },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,228,222,0.25)', marginBottom: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontFamily: F.display, fontSize: 30, lineHeight: lh(30), color: C.text },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: F.bold, fontSize: 16, color: C.text },
  empty: { alignItems: 'center', gap: 16, paddingVertical: 28 },
  emptyText: { fontFamily: F.regular, color: C.muted, fontSize: 15 },
  ghostBtn: { height: 46, paddingHorizontal: 22, borderRadius: 999, borderWidth: 1, borderColor: C.line, justifyContent: 'center' },
  ghostText: { fontFamily: F.bold, fontSize: 14, color: C.text },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.line },
  name: { fontFamily: F.bold, fontSize: 15, color: C.text },
  detail: { fontFamily: F.regular, fontSize: 12, color: C.muted, marginTop: 2 },
  note: { marginTop: 16, minHeight: 60, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: C.line, backgroundColor: 'rgba(26,13,12,0.8)', color: C.text, fontFamily: F.regular, fontSize: 15, textAlignVertical: 'top' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  totalLabel: { fontFamily: F.black, fontSize: 17, color: C.text },
  total: { fontFamily: F.black, fontSize: 17, color: C.text },
  send: { marginTop: 14, height: 58, borderRadius: 999, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(227,18,11,0.45)' },
  sendText: { fontFamily: F.black, fontSize: 16, color: C.onRed },
  small: { fontFamily: F.regular, fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 10 },
  clear: { fontFamily: F.semibold, fontSize: 14, color: C.muted, textAlign: 'center', textDecorationLine: 'underline', paddingVertical: 12 },
});
