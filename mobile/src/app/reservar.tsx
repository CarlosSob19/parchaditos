import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  useAnimatedStyle,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView as ScreensSafeArea } from 'react-native-screens/experimental';

import { PressableScale } from '@/components/pressable-scale';
import { ScreenCurtain } from '@/components/screen-curtain';
import { SplitText } from '@/components/split-text';
import { BOOKING_DAYS_AHEAD, HOOKAH_FLAVORS, MAX_PEOPLE, OCCASIONS, type Service, SERVICES, ZONES } from '@/constants/config';
import { lh, useTabBarSpace, useTopBarSpace } from '@/constants/layout';
import { C, F, S } from '@/constants/theme';
import { dayLong, dayShort, monthShort, nextDays, sameDay, type Slot, slotsFor } from '@/lib/booking';
import { useUnlocked } from '@/lib/unlock';
import { openWhatsApp } from '@/lib/whatsapp';

type Step = 'servicio' | 'zona' | 'fecha' | 'personas' | 'datos';
const STEP_NAMES: Record<Step, string> = { servicio: 'Servicio', zona: 'Zona', fecha: 'Fecha', personas: 'Personas', datos: 'Datos' };
const GHOST: Record<Service['id'], string> = { vip: 'VIP', combo: 'V+H', hookah: 'H' };

/* ---------- Piezas pequeñas ---------- */

function Segment({ state }: { state: 'todo' | 'done' | 'current' }) {
  const fill = useAnimatedStyle(() => ({
    transform: [{ scaleX: withTiming(state === 'todo' ? 0 : 1, { duration: 500, easing: Easing.out(Easing.exp) }) }],
    backgroundColor: state === 'current' ? C.red : C.redDeep,
  }));
  return (
    <View style={styles.seg}>
      <Animated.View style={[styles.segFill, fill]} />
    </View>
  );
}

function Option({ selected, onPress, title, desc, tag, ghost, label }: { selected: boolean; onPress: () => void; title: string; desc: string; tag?: string; ghost: string; label: string }) {
  const bg = useAnimatedStyle(() => ({
    backgroundColor: withTiming(selected ? C.red : C.bg2, { duration: 250 }),
    borderColor: withTiming(selected ? C.red : C.line, { duration: 250 }),
  }));
  return (
    <PressableScale haptic="select" onPress={onPress} scaleTo={0.98} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={label}>
      <Animated.View style={[styles.opt, bg]}>
        <Text style={[styles.optGhost, selected && { color: 'rgba(255,255,255,0.16)' }]}>{ghost}</Text>
        <View style={styles.optTop}>
          {tag ? (
            <View style={[styles.optTag, selected && { borderColor: 'rgba(255,255,255,0.45)' }]}>
              <Text style={styles.optTagText}>{tag.toUpperCase()}</Text>
            </View>
          ) : <View />}
          <View style={[styles.check, selected && styles.checkOn]}>
            {selected && <Animated.Text entering={ZoomIn.springify()} style={styles.checkMark}>✓</Animated.Text>}
          </View>
        </View>
        <Text style={styles.optTitle}>{title.toUpperCase()}</Text>
        <Text style={[styles.optDesc, selected && { color: 'rgba(255,255,255,0.88)' }]}>{desc}</Text>
      </Animated.View>
    </PressableScale>
  );
}

function Chip({ label, selected, onPress, disabled }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <PressableScale haptic="select" onPress={onPress} disabled={disabled} style={[styles.chip, selected && styles.chipOn, disabled && { opacity: 0.3 }]} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }}>
      <Text style={[styles.chipText, selected && { color: C.onRed }]}>{label}</Text>
    </PressableScale>
  );
}

/* ---------- Pantalla ---------- */

export default function Reservar() {
  const tabSpace = useTabBarSpace();
  const topSpace = useTopBarSpace();
  const { width } = useWindowDimensions();
  const titleSize = Math.min(52, (width - 32) / 6.6);
  const unlocked = useUnlocked();
  const params = useLocalSearchParams<{ servicio?: string }>();
  const scroll = useRef<ScrollView>(null);

  const [play, setPlay] = useState(false);
  const [service, setService] = useState<Service | null>(null);
  const [zone, setZone] = useState<(typeof ZONES)[number] | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Slot | null>(null);
  const [people, setPeople] = useState(4);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [flavor, setFlavor] = useState(HOOKAH_FLAVORS[0]);
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);

  useFocusEffect(useCallback(() => {
    if (unlocked) setPlay(true);
  }, [unlocked]));

  // Servicio elegido desde Inicio: se preselecciona y salta a la zona.
  useEffect(() => {
    const s = SERVICES.find((x) => x.id === params.servicio);
    // Sincroniza el parámetro de navegación con el estado del formulario.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!s) return;
    setService(s);
    setDone(false);
    setDir(1);
    setCurrent(1);
    /* eslint-enable react-hooks/set-state-in-effect */
    router.setParams({ servicio: undefined });
  }, [params.servicio]);

  const steps = useMemo<Step[]>(() => ['servicio', ...(service && !service.zona ? [] : (['zona'] as Step[])), 'fecha', 'personas', 'datos'], [service]);
  const step = steps[current];
  const days = useMemo(() => nextDays(BOOKING_DAYS_AHEAD), []);
  const slots = useMemo(() => (date ? slotsFor(date) : []), [date]);

  const valid = (() => {
    switch (step) {
      case 'servicio': return !!service;
      case 'zona': return !!zone;
      case 'fecha': return !!date && !!time;
      case 'personas': return people >= 1;
      case 'datos': return name.trim().length > 1 && phone.replace(/\D/g, '').length >= 7;
    }
  })();
  const last = current === steps.length - 1;

  const go = (i: number) => {
    setDir(i > current ? 1 : -1);
    setCurrent(i);
    scroll.current?.scrollTo({ y: 0, animated: true });
  };

  const submit = () => {
    if (!service || !date || !time) return;
    const lines = [
      'Hola Parchaditos, quiero hacer una reserva:',
      '',
      `• Servicio: ${service.nombre}`,
      `• Zona: ${service.zona ? zone?.nombre : 'Salón general'}`,
      `• Fecha: ${dayLong(date)}`,
      `• Hora: ${time.label}`,
      `• Personas: ${people}`,
      `• Ocasión: ${occasion}`,
      ...(service.hookah ? [`• Sabor hookah: ${flavor}`] : []),
      '',
      `A nombre de: ${name.trim()}`,
      `Celular: ${phone.trim()}`,
    ];
    openWhatsApp(lines.join('\n'));
    setDone(true);
  };

  const reset = () => {
    setService(null); setZone(null); setDate(null); setTime(null); setPeople(4);
    setName(''); setPhone(''); setCurrent(0); setDone(false);
  };

  const mini = [
    service?.nombre,
    zone?.nombre,
    date && `${dayShort(date)} ${date.getDate()}`,
    time?.label,
    current >= steps.indexOf('personas') ? `${people} pers.` : null,
  ].filter(Boolean).join(' · ') || 'Escoge un servicio para empezar';

  const entering = (dir > 0 ? FadeInRight : FadeInLeft).duration(380).easing(Easing.out(Easing.exp));

  if (done) {
    return (
      <View style={[styles.screen, styles.done, { paddingTop: topSpace + 24, paddingBottom: tabSpace + 20 }]}>
        <Animated.Text entering={FadeInDown.delay(50)} style={styles.eyebrow}>RESERVA ENVIADA</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(150).springify()} style={styles.doneTitle}>
          ¡NOS VEMOS{'\n'}EN EL <Text style={{ color: C.red }}>PARCHE</Text>!
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(250)} style={styles.doneText}>Abrimos WhatsApp con tu reserva. Envía el mensaje y te confirmamos en minutos.</Animated.Text>
        <Animated.View entering={FadeInDown.delay(350)} style={{ gap: 10, width: '100%' }}>
          <PressableScale onPress={submit} style={[styles.btn, styles.btnRed]}><Text style={styles.btnRedText}>Abrir WhatsApp otra vez</Text></PressableScale>
          <PressableScale onPress={reset} style={[styles.btn, styles.btnGhost]}><Text style={styles.btnGhostText}>Hacer otra reserva</Text></PressableScale>
        </Animated.View>
      </View>
    );
  }

  return (
    <Root>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingTop: topSpace + 4, paddingHorizontal: S.gutter, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>RESERVAS</Text>
        {current === 0 ? (
          <>
            <SplitText text="RESERVA" style={[styles.title, { color: C.text, fontSize: titleSize, lineHeight: lh(titleSize) }]} dist={lh(titleSize)} play={play} stagger={35} />
            <View style={{ marginTop: -titleSize * 0.2 }}>
              <SplitText text="TU PARCHE" style={[styles.title, { color: C.red, fontSize: titleSize, lineHeight: lh(titleSize) }]} dist={lh(titleSize)} play={play} delay={250} stagger={35} />
            </View>
          </>
        ) : (
          // Desde el paso 2 el título se achica para dejar más espacio al formulario.
          <Animated.Text entering={FadeIn.duration(300)} style={styles.titleSmall}>
            RESERVA <Text style={{ color: C.red }}>TU PARCHE</Text>
          </Animated.Text>
        )}

        {/* Progreso */}
        <View style={styles.steps}>
          {steps.map((s, i) => (
            <PressableScale key={s} haptic="none" disabled={i >= current} onPress={() => go(i)} style={styles.stepItem} accessibilityLabel={`Paso ${i + 1}: ${STEP_NAMES[s]}`}>
              <Segment state={i === current ? 'current' : i < current ? 'done' : 'todo'} />
              <Text style={[styles.stepLabel, i <= current && { color: C.text }]} numberOfLines={1}>
                <Text style={{ color: C.redHot }}>{i + 1} </Text>
                {i === current ? STEP_NAMES[s] : ''}
              </Text>
            </PressableScale>
          ))}
        </View>

        <Animated.View key={step} entering={entering} exiting={FadeOut.duration(120)} style={styles.panel}>
          {step === 'servicio' && (
            <>
              <Text style={styles.stepTitle}>¿QUÉ QUIERES?</Text>
              <View style={styles.list}>
                {SERVICES.map((s) => (
                  <Option key={s.id} selected={service?.id === s.id} onPress={() => { setService(s); if (!s.zona) setZone(null); }} title={s.nombre} desc={s.desc} tag={s.tag} ghost={GHOST[s.id]} label={s.nombre} />
                ))}
              </View>
            </>
          )}

          {step === 'zona' && (
            <>
              <Text style={styles.stepTitle}>ESCOGE TU ZONA</Text>
              <View style={styles.list}>
                {ZONES.map((z) => (
                  <Option key={z.id} selected={zone?.id === z.id} onPress={() => setZone(z)} title={z.nombre} desc={z.detalle} ghost={z.id === 'any' ? '?' : z.nombre.split(' ')[1]} label={z.nombre} />
                ))}
              </View>
            </>
          )}

          {step === 'fecha' && (
            <>
              <Text style={styles.stepTitle}>¿CUÁNDO VIENES?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }} style={{ marginHorizontal: -4 }}>
                {days.map((d, i) => {
                  const open = slotsFor(d).length > 0;
                  const on = sameDay(date, d);
                  return (
                    <PressableScale key={i} haptic="select" disabled={!open} onPress={() => { setDate(d); setTime(null); }} style={[styles.date, on && styles.chipOn, !open && { opacity: 0.3 }]} accessibilityRole="radio" accessibilityState={{ checked: on, disabled: !open }} accessibilityLabel={`${dayLong(d)}${open ? '' : ', cerrado'}`}>
                      <Text style={[styles.dateWd, on && { color: C.onRed }]}>{i === 0 ? 'HOY' : dayShort(d).toUpperCase()}</Text>
                      <Text style={[styles.dateD, on && { color: C.onRed }]}>{d.getDate()}</Text>
                      <Text style={[styles.dateM, on && { color: 'rgba(255,255,255,0.85)' }]}>{open ? monthShort(d) : 'Cerrado'}</Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>
              <Text style={styles.sub}>HORA DE LLEGADA</Text>
              {!date ? (
                <Text style={styles.muted}>Escoge un día primero.</Text>
              ) : (
                <Animated.View key={date.toDateString()} entering={FadeIn.duration(300)} style={styles.wrap}>
                  {slots.map((s) => (
                    <Chip key={s.value} label={s.label} selected={time?.value === s.value} onPress={() => setTime(s)} />
                  ))}
                </Animated.View>
              )}
            </>
          )}

          {step === 'personas' && (
            <>
              <Text style={styles.stepTitle}>¿CUÁNTOS VIENEN?</Text>
              <View style={styles.stepper}>
                <PressableScale onPress={() => setPeople((p) => Math.max(1, p - 1))} disabled={people <= 1} style={[styles.stepBtn, people <= 1 && { opacity: 0.3 }]} accessibilityLabel="Quitar una persona">
                  <Text style={styles.stepBtnText}>−</Text>
                </PressableScale>
                <Animated.Text key={people} entering={ZoomIn.springify().damping(14)} style={styles.peopleValue} accessibilityLiveRegion="polite">{people}</Animated.Text>
                <PressableScale onPress={() => setPeople((p) => Math.min(MAX_PEOPLE, p + 1))} disabled={people >= MAX_PEOPLE} style={[styles.stepBtn, people >= MAX_PEOPLE && { opacity: 0.3 }]} accessibilityLabel="Agregar una persona">
                  <Text style={styles.stepBtnText}>+</Text>
                </PressableScale>
              </View>
              <Text style={[styles.muted, { textAlign: 'center', marginBottom: 22 }]}>{people === 1 ? 'persona' : 'personas'}</Text>
              <View style={[styles.wrap, { justifyContent: 'center' }]}>
                {[2, 4, 6, 8, 10, 15].map((n) => (
                  <Chip key={n} label={String(n)} selected={people === n} onPress={() => setPeople(n)} />
                ))}
              </View>
            </>
          )}

          {step === 'datos' && (
            <>
              <Text style={styles.stepTitle}>TUS DATOS</Text>
              <Text style={styles.label}>Nombre</Text>
              <TextInput value={name} onChangeText={setName} placeholder="¿A nombre de quién?" placeholderTextColor="rgba(176,154,149,0.6)" style={styles.input} autoComplete="name" textContentType="name" returnKeyType="next" />
              <Text style={styles.label}>Celular</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="300 000 0000" placeholderTextColor="rgba(176,154,149,0.6)" style={styles.input} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
              <Text style={styles.label}>¿Qué celebran?</Text>
              <View style={styles.wrap}>
                {OCCASIONS.map((o) => <Chip key={o} label={o} selected={occasion === o} onPress={() => setOccasion(o)} />)}
              </View>
              {service?.hookah && (
                <>
                  <Text style={[styles.label, { marginTop: 18 }]}>Sabor de hookah</Text>
                  <View style={styles.wrap}>
                    {HOOKAH_FLAVORS.map((f) => <Chip key={f} label={f} selected={flavor === f} onPress={() => setFlavor(f)} />)}
                  </View>
                </>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Barra fija */}
      <View style={[styles.bar, { paddingBottom: 12 }]}>
        <Text style={styles.mini} numberOfLines={1}>{mini}</Text>
        <View style={styles.barBtns}>
          {current > 0 && (
            <PressableScale onPress={() => go(current - 1)} style={[styles.btn, styles.btnGhost, { flex: 1 }]}>
              <Text style={styles.btnGhostText}>Atrás</Text>
            </PressableScale>
          )}
          <PressableScale
            disabled={!valid}
            haptic={last ? 'light' : 'select'}
            onPress={() => (last ? submit() : go(current + 1))}
            style={[styles.btn, styles.btnRed, { flex: 2 }, !valid && { opacity: 0.35 }]}
            accessibilityState={{ disabled: !valid }}>
            <Text style={styles.btnRedText}>{last ? 'Reservar por WhatsApp' : 'Continuar'}</Text>
          </PressableScale>
        </View>
      </View>
    </KeyboardAvoidingView>
    <ScreenCurtain />
    </Root>
  );
}

// En iOS el contenido queda detrás de la barra de pestañas; este contenedor nativo deja justo su espacio.
// En Android las pestañas ya reservan ese espacio.
function Root({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'ios') return <View style={{ flex: 1, backgroundColor: C.bg }}>{children}</View>;
  return (
    <ScreensSafeArea edges={{ bottom: true }} style={{ flex: 1, backgroundColor: C.bg }}>
      {children}
    </ScreensSafeArea>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  eyebrow: { fontFamily: F.semibold, fontSize: 11, letterSpacing: 2, color: C.muted, marginBottom: 12 },
  title: { fontFamily: F.display, letterSpacing: -1.5 },
  titleSmall: { fontFamily: F.display, fontSize: 24, lineHeight: lh(24), color: C.text, letterSpacing: -0.5 },
  steps: { flexDirection: 'row', gap: 6, marginTop: 22, marginBottom: 18 },
  stepItem: { flex: 1, gap: 8 },
  seg: { height: 4, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden' },
  segFill: { ...StyleSheet.absoluteFill, transformOrigin: 'left' },
  stepLabel: { fontFamily: F.bold, fontSize: 12, color: C.muted },
  panel: { padding: 18, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  stepTitle: { fontFamily: F.display, fontSize: 28, lineHeight: lh(28), color: C.text, marginBottom: 16 },
  list: { gap: 10 },
  opt: { padding: 18, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', minHeight: 150 },
  optGhost: { position: 'absolute', right: -4, bottom: -22, fontFamily: F.display, fontSize: 84, lineHeight: lh(84), color: 'rgba(255,228,222,0.05)' },
  optTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: C.line },
  optTagText: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.8, color: C.text },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: C.onRed, borderColor: C.onRed },
  checkMark: { fontFamily: F.black, fontSize: 14, color: C.red },
  optTitle: { fontFamily: F.display, fontSize: 24, lineHeight: lh(24), color: C.text, marginTop: 28 },
  optDesc: { fontFamily: F.regular, fontSize: 14, lineHeight: 19, color: C.muted, marginTop: 6, paddingRight: 40 },
  chip: { height: 42, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.bg2, justifyContent: 'center' },
  chipOn: { backgroundColor: C.red, borderColor: C.red },
  chipText: { fontFamily: F.bold, fontSize: 14, color: C.text },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  date: { width: 72, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.bg2, alignItems: 'center', gap: 2 },
  dateWd: { fontFamily: F.bold, fontSize: 11, letterSpacing: 0.6, color: C.text },
  dateD: { fontFamily: F.display, fontSize: 24, lineHeight: lh(24), color: C.text },
  dateM: { fontFamily: F.regular, fontSize: 11, color: C.muted },
  sub: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1.4, color: C.muted, marginTop: 26, marginBottom: 12 },
  muted: { fontFamily: F.regular, fontSize: 14, color: C.muted },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 6 },
  stepBtn: { width: 58, height: 58, borderRadius: 29, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontFamily: F.bold, fontSize: 28, color: C.text, marginTop: -2 },
  peopleValue: { minWidth: 120, textAlign: 'center', fontFamily: F.display, fontSize: 96, lineHeight: lh(96), color: C.red, fontVariant: ['tabular-nums'] },
  label: { fontFamily: F.semibold, fontSize: 13, color: C.muted, marginBottom: 8 },
  input: { height: 52, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.bg2, color: C.text, fontFamily: F.regular, fontSize: 16, marginBottom: 16 },
  bar: { paddingHorizontal: S.gutter, paddingTop: 12, backgroundColor: 'rgba(19,9,9,0.97)', borderTopWidth: 1, borderTopColor: C.line, gap: 10 },
  mini: { fontFamily: F.regular, fontSize: 13, color: C.muted, textAlign: 'center' },
  barBtns: { flexDirection: 'row', gap: 10 },
  btn: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnRed: { backgroundColor: C.red },
  btnRedText: { fontFamily: F.bold, fontSize: 15, color: C.onRed },
  btnGhost: { borderWidth: 1, borderColor: C.line },
  btnGhostText: { fontFamily: F.bold, fontSize: 15, color: C.text },
  done: { paddingHorizontal: S.gutter, alignItems: 'center', justifyContent: 'center', gap: 18 },
  doneTitle: { fontFamily: F.display, fontSize: 40, lineHeight: lh(40), color: C.text, textAlign: 'center', letterSpacing: -1 },
  doneText: { fontFamily: F.regular, fontSize: 16, lineHeight: 23, color: C.muted, textAlign: 'center', maxWidth: 320, marginBottom: 10 },
});
