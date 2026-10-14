# Parchaditos (app iOS y Android)

App hecha con Expo (SDK 57), Expo Router, Reanimated 4 y React Native Skia.

## Probar en tu celular

1. Instala **Expo Go** desde App Store o Google Play.
2. En esta carpeta ejecuta:

   ```bash
   npm install
   npx expo start
   ```

3. Escanea el código QR con la cámara (iPhone) o con Expo Go (Android). El celular y el computador deben estar en la misma red Wi-Fi.

## Dónde se edita

- `src/constants/config.ts`: número de WhatsApp, carta de licores, servicios, zonas VIP, horario, sabores de hookah.
- `src/constants/theme.ts`: colores y fuentes.
- `src/app/`: pantallas (Inicio, Carta, Reservar).
- `src/components/`: piezas animadas (hero con círculo, humo, cinta, botón de reserva).

## Publicar en las tiendas

Se compila en la nube con EAS, así que no necesitas Mac para iOS.

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android
npx eas-cli@latest build --platform ios
npx eas-cli@latest submit --platform ios
```

Necesitas una cuenta de Apple Developer (99 USD al año) y una cuenta de Google Play Console (25 USD, pago único).

## Antes de publicar

- Cambiar `WHATSAPP` en `src/constants/config.ts`.
- Reemplazar el ícono y el splash en `assets/images/` (y `assets/expo.icon` para iOS) por el logo del negocio.
- En App Store Connect, marcar la clasificación por edad como 18+ (contenido de alcohol).
- La app no incluye vapes, destilados de THC ni blunt wraps porque Apple y Google prohíben facilitar su venta. Esos productos quedan solo en la web.
