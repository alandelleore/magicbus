# MagicBus

App web para consultar colectivos en Rosario en tiempo real.

[magicbus91.vercel.app](https://magicbus91.vercel.app) · [GitHub](https://github.com/alandelleore/magicbus)

## Funcionalidades

| Funcionalidad | Estado |
|---|---|
| Búsqueda de paradas por nombre/código | ✅ |
| Llegadas en tiempo real agrupadas por línea | ✅ |
| Mapa con ubicación de parada y colectivo | ✅ |
| Marker animado del colectivo en el mapa | ✅ |
| Recorrido de la línea sobre el mapa (toggleable) | ✅ |
| APK Android | ✅ |

## Stack

**Web:** React 19 + TypeScript 5.6 · Vite · MUI v6 · Google Maps · @tabler/icons-react

**Móvil:** Expo SDK 52 · React Native · WebView (wrapper de la web app)

## APK Android

La app tiene un wrapper nativo distribuido como APK. El APK carga la web online, por lo que los cambios en `src/` se reflejan sin necesidad de reinstalar.

- **Descargar APK:** [magicbus.apk](https://github.com/alandelleore/magicbus/releases/latest/download/magicbus.apk)
- Al abrir la web desde un navegador Android aparece un banner para descargar la app (no se muestra si ya estás usando la app nativa).
- El APK se genera automáticamente via **EAS Build** al pushear cambios en `mobile/` (GitHub Actions), y se publica como GitHub Release.
- Android 6+ requerido. APK de debug (sin firma de producción).

## Próximos pasos

- Firma de producción para el APK (Play Store)
- Búsqueda de paradas favoritas
- Soporte multiplataforma (iOS)

## Desarrollo

```bash
# Web (Vite + React)
npm install
npm run dev      # localhost:5173
npm run build    # producción

# APK (Expo)
cd mobile
npm install
npx eas build --platform android --profile preview
```