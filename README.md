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
| APK Android | ❌ |

## Stack

React 19 + TypeScript 5.6 · Vite · MUI v6 · Google Maps · @tabler/icons-react

## Próximos pasos

- Marker del colectivo en mapa
- Ruta de la línea sobre el mapa
- APK para Android (Expo + EAS Build)
- Mejoras visuales (colores dinámicos, tooltips)

## Desarrollo

```bash
npm install
npm run dev      # localhost:5173
npm run build    # producción
```