import { Archivo_400Regular, Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold } from '@expo-google-fonts/archivo';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AgeGate } from '@/components/age-gate';
import { CartSheet } from '@/components/cart-sheet';
import { Grain } from '@/components/grain';
import { Loader } from '@/components/loader';
import AppTabs from '@/components/app-tabs';
import { C } from '@/constants/theme';
import { CartProvider } from '@/lib/cart';
import { CatalogProvider } from '@/lib/catalog';
import { UnlockContext } from '@/lib/unlock';

SplashScreen.preventAutoHideAsync();

const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, primary: C.red, text: C.text, border: C.line } };
const AGE_KEY = 'age-ok';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ArchivoBlack_400Regular,
    Archivo_400Regular,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });
  const [age, setAge] = useState<'loading' | 'ok' | 'ask'>('loading');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AGE_KEY)
      .then((v) => setAge(v === '1' ? 'ok' : 'ask'))
      .catch(() => setAge('ask'));
  }, []);

  const ready = fontsLoaded && age !== 'loading';
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const confirm = () => {
    setAge('ok');
    AsyncStorage.setItem(AGE_KEY, '1').catch(() => {});
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <UnlockContext.Provider value={age === 'ok' && loaded}>
          <CatalogProvider>
          <CartProvider>
            <AppTabs />
            <CartSheet />
          </CartProvider>
          </CatalogProvider>
          <Grain />
        </UnlockContext.Provider>
        {age === 'ask' && <AgeGate onConfirm={confirm} />}
        {!loaded && <Loader onDone={() => setLoaded(true)} />}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
