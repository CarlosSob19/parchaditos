import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Alto de la barra de vidrio superior (sin contar el área segura). */
export const TOP_BAR_H = 60;

/** Espacio que ocupa la barra superior flotante: el contenido empieza debajo de ella. */
export function useTopBarSpace() {
  const insets = useSafeAreaInsets();
  return insets.top + 8 + TOP_BAR_H + 10;
}

/** Espacio libre abajo: ya no hay barra de pestañas, solo el área segura del teléfono. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return insets.bottom + 12;
}

/** Alto de línea seguro para la fuente display (evita que iOS corte la parte de arriba de las letras). */
export const lh = (size: number) => Math.round(size * 1.12);
