import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FillText } from '@/components/fill-text';
import { Hero } from '@/components/hero';
import { Marquee } from '@/components/marquee';
import { PressableScale } from '@/components/pressable-scale';
import { Reveal } from '@/components/reveal';
import { ScreenCurtain } from '@/components/screen-curtain';
import { SplitText } from '@/components/split-text';
import { StackCards } from '@/components/stack-cards';
import { Stats } from '@/components/stats';
import { StatusPill } from '@/components/status-pill';
import { CategoryCards, MoreLink } from '@/components/category-cards';
import { Gallery } from '@/components/gallery';
import { Faq } from '@/components/faq';
import { FAQ, GALLERY, HOOKAH_FLAVORS, INFO, REVIEWS, SERVICES, type Service } from '@/constants/config';
import { lh, useTabBarSpace } from '@/constants/layout';
import { C, F, S } from '@/constants/theme';
import { useInView } from '@/lib/use-in-view';
import { useUnlocked } from '@/lib/unlock';
import { openWhatsApp } from '@/lib/whatsapp';

const FEATS: Record<Service['id'], string[]> = {
  hookah: [`${HOOKAH_FLAVORS.filter((f) => !/sorpr/i.test(f)).length} sabores para escoger`, 'Cambio de carbón incluido', 'Boquillas individuales'],
  vip: ['2 zonas disponibles', 'Atención preferencial', 'Ideal para cumpleaños'],
  combo: ['Zona privada reservada', 'Hookah incluida', 'Mejor precio que por separado'],
};

const SOCIAL = [
  { label: 'Instagram', url: INFO.instagram },
  { label: 'TikTok', url: INFO.tiktok },
].filter((s) => s.url);

const MAPS = INFO.mapa || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(INFO.direccion)}`;

const goReserve = (servicio?: Service['id']) => router.navigate(servicio ? `/reservar?servicio=${servicio}` : '/reservar');

export default function Home() {
  const unlocked = useUnlocked();
  const tabSpace = useTabBarSpace();
  const { width, height: winH } = useWindowDimensions();
  // Alto real del área visible (en Android no incluye la barra de pestañas).
  const [viewH, setViewH] = useState(winH);
  const scrollY = useSharedValue(0);
  const maxScroll = useSharedValue(1);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
    maxScroll.set(Math.max(1, e.contentSize.height - e.layoutMeasurement.height));
  });
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const footer = useInView(scrollY, 0.9);
  const footSize = (width - 32) / 8.4;

  // Barra roja de progreso arriba (como la web).
  const progress = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.min(1, Math.max(0, scrollY.value / maxScroll.value)) }] }));

  const order: Service['id'][] = ['combo', 'vip', 'hookah'];

  return (
    <View style={styles.screen}>
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={styles.screen}
      contentInsetAdjustmentBehavior="never"
      onLayout={(e) => setViewH(Math.round(e.nativeEvent.layout.height))}
      contentContainerStyle={{ paddingBottom: tabSpace + 24 }}
      showsVerticalScrollIndicator={false}>
      <Hero height={Math.max(viewH, 560)} scrollY={scrollY} play={unlocked} onReserve={() => goReserve()} onCarta={() => router.navigate('/carta')} />

      <Marquee scrollY={scrollY} />

      <FillText
        scrollY={scrollY}
        eyebrow="El parche"
        text="No es solo un bar. Es el sitio donde la noche se alarga, el humo se comparte, el granizado llega bien frío y la música no para hasta que tú digas."
      />
      <Stats scrollY={scrollY} />

      {/* Carta destacada */}
      <Reveal scrollY={scrollY} style={styles.head}>
        <Text style={styles.eyebrow}>01 — LA CARTA</Text>
        <Text style={styles.title}>
          BIEN <Text style={styles.red}>FRÍO</Text>
        </Text>
      </Reveal>
      <Reveal scrollY={scrollY}>
        <CategoryCards />
      </Reveal>
      <Reveal scrollY={scrollY}>
        <MoreLink />
      </Reveal>

      {/* La noche: tarjetas apiladas */}
      <Reveal scrollY={scrollY} style={styles.head}>
        <Text style={styles.eyebrow}>02 — LA NOCHE</Text>
        <Text style={styles.title}>
          ASÍ VA <Text style={styles.red}>EL PARCHE</Text>
        </Text>
      </Reveal>
      <StackCards scrollY={scrollY} />

      {/* El sitio: galería */}
      {GALLERY.length > 0 && (
        <>
          <Reveal scrollY={scrollY} style={styles.head}>
            <Text style={styles.eyebrow}>03 — EL SITIO</Text>
            <Text style={styles.title}>
              ASÍ SE <Text style={styles.red}>VE</Text>
            </Text>
          </Reveal>
          <Reveal scrollY={scrollY}>
            <Gallery items={GALLERY} />
          </Reveal>
        </>
      )}

      {/* Servicios */}
      <Reveal scrollY={scrollY} style={styles.head}>
        <Text style={styles.eyebrow}>04 — SERVICIOS</Text>
        <Text style={styles.title}>
          ARMA TU <Text style={styles.red}>PARCHE</Text>
        </Text>
      </Reveal>
      {order.map((id, i) => {
        const s = SERVICES.find((x) => x.id === id)!;
        const featured = id === 'combo';
        return (
          <Reveal key={id} scrollY={scrollY} delay={i * 80} style={styles.pad}>
            <PressableScale onPress={() => goReserve(id)} scaleTo={0.98} style={[styles.service, featured && styles.serviceRed]} accessibilityRole="button" accessibilityLabel={`Reservar ${s.nombre}`}>
              <View style={styles.serviceTop}>
                <Text style={[styles.serviceNum, featured && styles.onRed]}>{String.fromCharCode(65 + i)}</Text>
                <View style={[styles.tag, featured && styles.tagRed]}>
                  <Text style={[styles.tagText, featured && styles.onRed]}>{s.tag.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={[styles.serviceTitle, featured && styles.onRed]}>{s.nombre.toUpperCase()}</Text>
              <Text style={[styles.serviceDesc, featured && styles.onRedSoft]}>{s.desc}</Text>
              {FEATS[id].map((f) => (
                <View key={f} style={styles.feat}>
                  <View style={[styles.dot, featured && { backgroundColor: C.onRed }]} />
                  <Text style={[styles.featText, featured && styles.onRedSoft]}>{f}</Text>
                </View>
              ))}
              <View style={[styles.serviceBtn, featured && styles.serviceBtnLight]}>
                <Text style={[styles.serviceBtnText, featured && { color: C.bg }]}>{id === 'hookah' ? 'Pedir hookah' : 'Reservar'} →</Text>
              </View>
            </PressableScale>
          </Reveal>
        );
      })}

      {/* CTA reservas */}
      <Reveal scrollY={scrollY} style={[styles.pad, { marginTop: 48 }]}>
        <PressableScale onPress={() => goReserve()} scaleTo={0.98} style={styles.cta} accessibilityRole="button" accessibilityLabel="Reservar zona VIP">
          <LinearGradient colors={[C.surface, C.redDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Text style={styles.eyebrow}>05 — RESERVAS</Text>
          <Text style={styles.ctaTitle}>
            APARTA TU <Text style={styles.red}>ZONA VIP</Text>
          </Text>
          <View style={styles.ctaGo}>
            <Text style={styles.ctaArrow}>→</Text>
          </View>
        </PressableScale>
      </Reveal>

      {/* Reseñas (solo si hay en config.ts) */}
      {REVIEWS.length > 0 && (
        <>
          <Reveal scrollY={scrollY} style={styles.head}>
            <Text style={styles.eyebrow}>LO QUE DICEN</Text>
            <Text style={styles.title}>
              EL <Text style={styles.red}>PARCHE</Text> HABLA
            </Text>
          </Reveal>
          {REVIEWS.map((r) => (
            <Reveal key={r.nombre + r.texto} scrollY={scrollY} style={styles.pad}>
              <View style={styles.review}>
                <Text style={styles.stars} accessibilityLabel={`${r.estrellas} de 5 estrellas`}>{'★'.repeat(r.estrellas)}{'☆'.repeat(5 - r.estrellas)}</Text>
                <Text style={styles.reviewText}>“{r.texto}”</Text>
                <Text style={styles.reviewBy}>{r.nombre}{r.fuente ? ` · ${r.fuente}` : ''}</Text>
              </View>
            </Reveal>
          ))}
        </>
      )}

      {/* Preguntas frecuentes */}
      <Reveal scrollY={scrollY} style={styles.head}>
        <Text style={styles.eyebrow}>06 — PREGUNTAS</Text>
        <Text style={styles.title}>
          ANTES DE <Text style={styles.red}>VENIR</Text>
        </Text>
      </Reveal>
      <Reveal scrollY={scrollY} style={styles.pad}>
        <Faq items={FAQ} />
      </Reveal>

      {/* Cómo llegar */}
      <Reveal scrollY={scrollY} style={[styles.pad, { marginTop: 40 }]}>
        <View style={styles.visit}>
          <Text style={styles.eyebrow}>07 — CÓMO LLEGAR</Text>
          <Text style={styles.visitAddr}>{INFO.direccion.toUpperCase()}</Text>
          {INFO.horario.map((h) => (
            <Text key={h} style={styles.infoText}>{h}</Text>
          ))}
          <View style={styles.visitBtns}>
            <PressableScale onPress={() => Linking.openURL(MAPS)} style={styles.visitBtn} accessibilityRole="link">
              <Text style={styles.visitBtnText}>Cómo llegar</Text>
            </PressableScale>
            <PressableScale onPress={() => openWhatsApp()} style={styles.chip} accessibilityRole="link">
              <Text style={styles.chipText}>Escríbenos</Text>
            </PressableScale>
          </View>
        </View>
      </Reveal>

      {/* Footer: letras que suben al aparecer */}
      <View style={[styles.pad, styles.info]} onLayout={footer.onLayout}>
        <SplitText text="PARCHADITOS" style={[styles.footBig, { fontSize: footSize, lineHeight: lh(footSize) }]} dist={lh(footSize)} play={footer.inView} stagger={40} />
      </View>
      <Reveal scrollY={scrollY} style={styles.pad}>
        <View style={styles.statusRow}>
          <StatusPill />
          <PressableScale onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} style={styles.toTop} accessibilityRole="button" accessibilityLabel="Volver arriba">
            <Text style={styles.toTopText}>↑</Text>
          </PressableScale>
        </View>
        <Text style={styles.eyebrow}>DIRECCIÓN</Text>
        <Text style={styles.infoText} onPress={INFO.mapa ? () => Linking.openURL(INFO.mapa) : undefined} accessibilityRole={INFO.mapa ? 'link' : undefined}>
          {INFO.direccion}
        </Text>
        <Text style={[styles.eyebrow, { marginTop: 18 }]}>HORARIO</Text>
        {INFO.horario.map((h) => (
          <Text key={h} style={styles.infoText}>{h}</Text>
        ))}
        <View style={styles.infoLinks}>
          {SOCIAL.map((s) => (
            <PressableScale key={s.label} onPress={() => Linking.openURL(s.url)} style={styles.chip} accessibilityRole="link">
              <Text style={styles.chipText}>{s.label}</Text>
            </PressableScale>
          ))}
          <PressableScale onPress={() => openWhatsApp()} style={styles.chip} accessibilityRole="link">
            <Text style={styles.chipText}>WhatsApp</Text>
          </PressableScale>
        </View>
        <Text style={styles.legal}>Venta prohibida a menores de 18 años. El exceso de alcohol es perjudicial para la salud. Consume con responsabilidad.</Text>
        <Text style={[styles.legal, styles.privacy]} onPress={() => Linking.openURL(INFO.privacidad)} accessibilityRole="link">
          Política de privacidad
        </Text>
      </Reveal>
    </Animated.ScrollView>
    <View pointerEvents="none" style={[styles.progressTrack, { top: insets.top }]}>
      <Animated.View style={[styles.progressFill, progress]} />
    </View>
    <ScreenCurtain />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  pad: { paddingHorizontal: S.gutter, marginBottom: 12 },
  head: { paddingHorizontal: S.gutter, paddingTop: 56, paddingBottom: 24 },
  eyebrow: { fontFamily: F.semibold, fontSize: 11, letterSpacing: 2, color: C.muted, marginBottom: 10 },
  title: { fontFamily: F.display, fontSize: 46, lineHeight: lh(46), letterSpacing: -1.2, color: C.text },
  red: { color: C.red },
  onRed: { color: C.onRed },
  onRedSoft: { color: 'rgba(255,255,255,0.85)' },

  service: { padding: 22, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  serviceRed: { backgroundColor: C.red, borderColor: C.red },
  serviceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  serviceNum: { fontFamily: F.display, fontSize: 40, lineHeight: lh(40), color: C.text },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: C.line },
  tagRed: { borderColor: 'rgba(255,255,255,0.4)' },
  tagText: { fontFamily: F.bold, fontSize: 11, letterSpacing: 0.8, color: C.text },
  serviceTitle: { fontFamily: F.display, fontSize: 34, lineHeight: lh(34), color: C.text, marginBottom: 8 },
  serviceDesc: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.muted, marginBottom: 16 },
  feat: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  featText: { fontFamily: F.regular, fontSize: 15, color: C.muted },
  serviceBtn: { alignSelf: 'flex-start', marginTop: 16, height: 46, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1, borderColor: C.line, justifyContent: 'center' },
  serviceBtnLight: { backgroundColor: C.text, borderColor: C.text },
  serviceBtnText: { fontFamily: F.bold, fontSize: 14, color: C.text },

  drink: { borderRadius: 16, overflow: 'hidden', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  review: { padding: 22, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, gap: 12 },
  stars: { color: C.redHot, letterSpacing: 2, fontSize: 16 },
  reviewText: { fontFamily: F.semibold, fontSize: 18, lineHeight: 25, color: C.text },
  reviewBy: { fontFamily: F.regular, fontSize: 13, color: C.muted },
  visit: { padding: 24, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  visitAddr: { fontFamily: F.display, fontSize: 30, lineHeight: lh(30), color: C.text, marginBottom: 12 },
  visitBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  visitBtn: { height: 46, paddingHorizontal: 22, borderRadius: 999, backgroundColor: C.red, justifyContent: 'center' },
  visitBtnText: { fontFamily: F.bold, fontSize: 14, color: C.onRed },
  drinkBody: { padding: 14 },
  drinkName: { fontFamily: F.bold, fontSize: 16, color: C.text },
  drinkDetail: { fontFamily: F.regular, fontSize: 13, color: C.muted, marginTop: 2 },

  cta: { minHeight: 260, padding: 26, borderRadius: S.radius, overflow: 'hidden', borderWidth: 1, borderColor: C.line },
  ctaTitle: { fontFamily: F.display, fontSize: 42, lineHeight: lh(42), letterSpacing: -1.2, color: C.text, maxWidth: 250 },
  ctaGo: { position: 'absolute', right: 22, bottom: 22, width: 72, height: 72, borderRadius: 36, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  ctaArrow: { fontFamily: F.bold, fontSize: 30, lineHeight: 34, color: C.onRed },

  info: { marginTop: 48 },
  footBig: { fontFamily: F.display, color: C.red, letterSpacing: -1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 28 },
  toTop: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  toTopText: { fontFamily: F.bold, fontSize: 20, color: C.text },
  progressTrack: { position: 'absolute', left: 0, right: 0, height: 2 },
  progressFill: { height: 2, backgroundColor: C.red, transformOrigin: 'left' },
  infoText: { fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.text },
  infoLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 },
  chip: { height: 42, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: C.line, justifyContent: 'center' },
  chipText: { fontFamily: F.bold, fontSize: 14, color: C.text },
  legal: { fontFamily: F.regular, fontSize: 12, lineHeight: 18, color: C.muted, marginTop: 28 },
  privacy: { marginTop: 10, color: C.text, textDecorationLine: 'underline' },
});
