# MagicBus

App web para consultar colectivos en Rosario en tiempo real.

[magicbus91.vercel.app](https://magicbus91.vercel.app) · [GitHub](https://github.com/alandelleore/magicbus)

## Funcionalidades

| Funcionalidad | Estado |
|---|---|
| Búsqueda de paradas por nombre/código | ✅ |
| Llegadas en tiempo real agrupadas por línea | ✅ |
| Mapa con ubicación de parada y colectivo | ✅ |
| Marker del colectivo en el mapa | ❌ |
| Ruta del recorrido en el mapa | ❌ |
| APK Android | ✅ |

## Stack

**Web:** React 19 + TypeScript 5.6 · Vite · MUI v6 · Google Maps · @tabler/icons-react

**Móvil:** Expo SDK 52 · React Native · WebView (wrapper de la web app)

## APK Android

La app web tiene un wrapper nativo que se distribuye como APK.

- **Descargar APK:** [magicbus.apk](https://github.com/alandelleore/magicbus/releases/latest/download/magicbus.apk)
- Al abrir la web desde un navegador móvil aparece un banner para descargar la app.
- El APK se genera automáticamente via **EAS Build** al pushear cambios en `mobile/` (GitHub Actions).
- Android 6+ requerido. Es un APK de debug (sin firma de producción).

## Próximos pasos

- Marker del colectivo en mapa
- Ruta de la línea sobre el mapa
- Firma de producción para el APK (Play Store)
- Mejoras visuales (colores dinámicos, tooltips)

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