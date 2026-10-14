import { Tabs } from 'expo-router';

import { TopBar } from '@/components/top-bar';
import { C } from '@/constants/theme';

// Pestañas con barra propia de vidrio arriba (igual en iOS, Android y web).
export default function AppTabs() {
  return (
    <Tabs
      tabBar={(props) => <TopBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg }, animation: 'fade' }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="carta" options={{ title: 'Carta' }} />
      <Tabs.Screen name="reservar" options={{ title: 'Reservar' }} />
      <Tabs.Screen name="contacto" options={{ title: 'Contacto' }} />
    </Tabs>
  );
}
