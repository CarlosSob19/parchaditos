import { Alert, Linking } from 'react-native';

import { WHATSAPP } from '@/constants/config';

export const waUrl = (text?: string) => `https://wa.me/${WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export async function openWhatsApp(text?: string) {
  try {
    await Linking.openURL(waUrl(text));
  } catch {
    Alert.alert('No se pudo abrir WhatsApp', 'Revisa que tengas WhatsApp instalado e inténtalo otra vez.');
  }
}
