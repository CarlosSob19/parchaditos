import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { Icon3D, type Icon3DKind } from '@/components/icon-3d';
import { PressableScale } from '@/components/pressable-scale';
import { Reveal } from '@/components/reveal';
import { ScreenCurtain } from '@/components/screen-curtain';
import { SplitText } from '@/components/split-text';
import { StatusPill } from '@/components/status-pill';
import { INFO, WHATSAPP } from '@/constants/config';
import { lh, useTabBarSpace, useTopBarSpace } from '@/constants/layout';
import { C, F, S } from '@/constants/theme';
import { useUnlocked } from '@/lib/unlock';
import { openWhatsApp } from '@/lib/whatsapp';

// Instagram siempre aparece ("Muy pronto" mientras INFO.instagram esté vacío). TikTok solo si tiene enlace.
const SOCIALS: { id: Icon3DKind; nombre: string; url: string; texto: string; siempre?: boolean }[] = [
  { id: 'instagram', nombre: 'Instagram', url: INFO.instagram, texto: 'Fotos de la noche, eventos y promos antes que nadie. Etiquétanos y te compartimos.', siempre: true },
  { id: 'tiktok', nombre: 'TikTok', url: INFO.tiktok, texto: 'Los videos del parche: la hookah, los granizados y cómo se pone el fin de semana.' },
];
const SHOWN = SOCIALS.filter((s) => s.url || s.siempre);

const handle = (url: string) => `@${(url.split('?')[0].split('/').filter(Boolean).pop() ?? '').replace(/^@/, '')}`;

// El usuario siempre cabe en una línea: la letra se achica según el largo (tarjeta = ancho - márgenes - relleno).
const handleSize = (text: string, width: number) => {
  const size = Math.max(16, Math.min(40, (width - S.gutter * 2 - 44) / (text.length * 0.74)));
  return { fontSize: size, lineHeight: lh(size) };
};

// 573001234567 → +57 300 123 4567
const n = String(WHATSAPP);
const PHONE = n.length === 12 && n.startsWith('57') ? `+57 ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}` : `+${n}`;

// Contacto: igual que contacto.html de la web (reservas y pedidos por WhatsApp, y redes con logos 3D).
export default function Contacto() {
  const { width } = useWindowDimensions();
  const topSpace = useTopBarSpace();
  const tabSpace = useTabBarSpace();
  const unlocked = useUnlocked();
  const [play, setPlay] = useState(false);
  const titleSize = Math.min(72, (width - 32) / 6.4);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => scrollY.set(e.contentOffset.y));

  useFocusEffect(useCallback(() => {
    if (unlocked) setPlay(true);
  }, [unlocked]));

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.screen}
        contentContainerStyle={{ paddingTop: topSpace + 24, paddingBottom: tabSpace + 32 }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.pad}>
          <Text style={styles.eyebrow}>CONTACTO</Text>
          <SplitText text="HABLEMOS" style={[styles.big, { fontSize: titleSize, lineHeight: lh(titleSize) }]} dist={lh(titleSize)} play={play} stagger={40} />
          <View style={{ marginTop: -titleSize * 0.22 }}>
            <SplitText text="CLARO" style={[styles.big, styles.red, { fontSize: titleSize, lineHeight: lh(titleSize) }]} dist={lh(titleSize)} play={play} delay={200} stagger={40} />
          </View>
          <Text style={styles.lead}>Reservas, pedidos o cualquier duda: te respondemos por WhatsApp. Y para ver cómo va la noche, síguenos en Instagram.</Text>
        </View>

        {/* Reservas y pedidos */}
        <Reveal scrollY={scrollY} style={styles.head}>
          {/* Un solo título gigante en la pantalla ("Hablemos claro"): aquí basta la etiqueta. */}
          <Text style={[styles.eyebrow, { marginBottom: 0 }]} accessibilityRole="header">01 — RESERVAS Y PEDIDOS</Text>
        </Reveal>
        <Reveal scrollY={scrollY} style={styles.pad}>
          <View style={[styles.card, styles.wa]}>
            <Icon3D kind="whatsapp" size={Math.min(200, width * 0.5)} onPress={() => openWhatsApp('Hola Parchaditos')} />
            <Text style={styles.phone} onPress={() => openWhatsApp('Hola Parchaditos')} accessibilityRole="link" accessibilityLabel={`Escribir por WhatsApp al ${PHONE}`}>
              {PHONE}
            </Text>
            <StatusPill />
          </View>
        </Reveal>
        <Reveal scrollY={scrollY} style={styles.pad}>
          <View style={styles.card}>
            <View style={styles.top}>
              <Text style={styles.num}>A</Text>
              <View style={styles.tag}><Text style={styles.tagText}>VIP · HOOKAH · CUMPLEAÑOS</Text></View>
            </View>
            <Text style={styles.cardTitle}>RESERVAS</Text>
            <Text style={styles.desc}>Aparta una zona VIP o la hookah para tu grupo. Hazlo en la app en un minuto o escríbenos y lo cuadramos por chat.</Text>
            <View style={styles.btns}>
              <PressableScale onPress={() => router.navigate('/reservar')} style={[styles.btn, styles.btnRed]} accessibilityRole="button">
                <Text style={[styles.btnText, { color: C.onRed }]}>Reservar en la app</Text>
              </PressableScale>
              <PressableScale onPress={() => openWhatsApp('Hola Parchaditos, quiero hacer una reserva.')} style={styles.btn} accessibilityRole="link">
                <Text style={styles.btnText}>Por WhatsApp</Text>
              </PressableScale>
            </View>
          </View>
        </Reveal>
        <Reveal scrollY={scrollY} style={styles.pad}>
          <View style={[styles.card, styles.cardRed]}>
            <View style={styles.top}>
              <Text style={[styles.num, styles.onRed]}>B</Text>
              <View style={[styles.tag, styles.tagRed]}><Text style={[styles.tagText, styles.onRed]}>LICORES · GRANIZADOS · COCTELES</Text></View>
            </View>
            <Text style={[styles.cardTitle, styles.onRed]}>PEDIDOS</Text>
            <Text style={[styles.desc, styles.onRedSoft]}>Arma el pedido en la carta y te llega completo por WhatsApp. Te confirmamos disponibilidad al momento.</Text>
            <View style={styles.btns}>
              <PressableScale onPress={() => router.navigate('/carta')} style={[styles.btn, styles.btnLight]} accessibilityRole="button">
                <Text style={[styles.btnText, { color: C.bg }]}>Ver la carta</Text>
              </PressableScale>
              <PressableScale onPress={() => openWhatsApp('Hola Parchaditos, quiero hacer un pedido.')} style={[styles.btn, styles.btnOnRed]} accessibilityRole="link">
                <Text style={[styles.btnText, styles.onRed]}>Por WhatsApp</Text>
              </PressableScale>
            </View>
          </View>
        </Reveal>

        {/* Redes */}
        <Reveal scrollY={scrollY} style={styles.head}>
          <Text style={styles.eyebrow}>02 — REDES</Text>
          <Text style={styles.title} accessibilityRole="header">
            SÍGUELE <Text style={styles.red}>EL PARCHE</Text>
          </Text>
        </Reveal>
        {SHOWN.map((s) => (
          <Reveal key={s.id} scrollY={scrollY} style={styles.pad}>
            <View style={[styles.card, styles.social]}>
              <Text style={styles.ghost} numberOfLines={1}>{s.id === 'instagram' ? 'INSTA' : 'TIKTOK'}</Text>
              <View style={styles.socialIcon}>
                <Icon3D kind={s.id} size={Math.min(240, width * 0.58)} onPress={s.url ? () => Linking.openURL(s.url) : undefined} />
              </View>
              <Text style={styles.eyebrow}>{s.nombre.toUpperCase()}</Text>
              <Text style={[styles.handle, handleSize(s.url ? handle(s.url) : 'Muy pronto', width)]} numberOfLines={1}>
                {s.url ? handle(s.url) : 'Muy pronto'}
              </Text>
              <Text style={styles.desc}>{s.texto}</Text>
              {!!s.url && (
                <PressableScale onPress={() => Linking.openURL(s.url)} style={[styles.btn, styles.btnRed, styles.follow]} accessibilityRole="link">
                  <Text style={[styles.btnText, { color: C.onRed }]}>Seguir en {s.nombre}  →</Text>
                </PressableScale>
              )}
            </View>
          </Reveal>
        ))}
      </Animated.ScrollView>
      <ScreenCurtain />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  pad: { paddingHorizontal: S.gutter, marginBottom: 12 },
  head: { paddingHorizontal: S.gutter, paddingTop: 48, paddingBottom: 22 },
  eyebrow: { fontFamily: F.semibold, fontSize: 11, letterSpacing: 2, color: C.muted, marginBottom: 10 },
  big: { fontFamily: F.display, color: C.text, letterSpacing: -1 },
  title: { fontFamily: F.display, fontSize: 32, lineHeight: lh(32), letterSpacing: -0.8, color: C.text },
  red: { color: C.red },
  lead: { fontFamily: F.regular, fontSize: 16, lineHeight: 23, color: C.muted, marginTop: 14, maxWidth: 340 },
  onRed: { color: C.onRed },
  onRedSoft: { color: 'rgba(255,255,255,0.85)' },

  card: { padding: 22, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  cardRed: { backgroundColor: C.red, borderColor: C.red },
  wa: { alignItems: 'center', gap: 14, paddingVertical: 32, backgroundColor: C.bg2 },
  phone: { fontFamily: F.display, fontSize: 26, lineHeight: lh(26), color: C.text },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, gap: 12 },
  num: { fontFamily: F.display, fontSize: 40, lineHeight: lh(40), color: C.text },
  tag: { flexShrink: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: C.line },
  tagRed: { borderColor: 'rgba(255,255,255,0.4)' },
  tagText: { fontFamily: F.bold, fontSize: 11, letterSpacing: 0.8, color: C.text },
  cardTitle: { fontFamily: F.display, fontSize: 38, lineHeight: lh(38), color: C.text, marginBottom: 8 },
  desc: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.muted },
  btns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  btn: { height: 46, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1, borderColor: C.line, justifyContent: 'center' },
  btnRed: { backgroundColor: C.red, borderColor: C.red },
  btnLight: { backgroundColor: C.text, borderColor: C.text },
  btnOnRed: { borderColor: 'rgba(255,255,255,0.5)' },
  btnText: { fontFamily: F.bold, fontSize: 14, color: C.text },

  social: { backgroundColor: C.bg2, paddingTop: 28 },
  socialIcon: { alignItems: 'center', marginBottom: 20 },
  handle: { fontFamily: F.display, fontSize: 40, lineHeight: lh(40), letterSpacing: -1, color: C.text, marginBottom: 10 },
  follow: { alignSelf: 'flex-start', marginTop: 20 },
  ghost: { position: 'absolute', right: -12, bottom: -24, fontFamily: F.display, fontSize: 120, lineHeight: lh(120), color: 'rgba(255,228,222,0.04)' },
});
