# Magic Bus — Contexto para Agentes

## Stack técnico
- **Framework**: Vite + React 19 + TypeScript 5.6
- **UI**: MUI v6.4.8 (Material UI) + Emotion (styling inline via `sx`)
- **Routing**: React Router DOM v7.1.1
- **Mapas**: @react-google-maps/api (Google Maps) con OverlayView para markers custom
- **Iconos**: @tabler/icons-react (reemplaza MUI Icons)
- **Fuentes**: DM Sans (UI general) + DM Mono (números, IDs, tiempos)
- **Despliegue web**: Vercel (auto en cada push a main, sin GitHub Actions)
- **Despliegue APK**: GitHub Actions `.github/workflows/deploy-apk.yml` → EAS Build → GitHub Releases

## APIs externas

| Proxy Vite | API destino |
|---|---|
| `/api/proxy/*` | `https://app.cuandollegarosario.com/api/public/*` |
| `/api/gobierno/*` | `https://ws.rosario.gob.ar/ubicaciones/public/*` |

## Endpoints específicos

| API | Endpoint | Uso |
|---|---|---|
| CuandoLlegaRosario (search) | `app.cuandollegarosario.com/api/public/search` | Buscar paradas |
| CuandoLlegaRosario (parada) | `app.cuandollegarosario.com/api/public/parada/:id` | Arrivals en tiempo real |
| Gobierno (listado) | `ws.rosario.gob.ar/ubicaciones/public/lineas?nombre=all` | Lista de líneas |
| Gobierno (detalle) | `ws.rosario.gob.ar/ubicaciones/public/linea/:empresa/:id` | Detalle + paradas |

### Mapeo de IDs (líneas)

- `cuandoLlegaRosario` → `descripcionLinea` (ej: "115")
- `gobierno` → `codigoEMR` (ej: "115") → `id` interno (ej: "15")
- Hook `useLineasGobierno` en `src/hooks/useLineasGobierno.ts` hace el mapeo automáticamente

### Formato de coordenadas

- **Parada** (CuandoLlegaRosario): `punto_x` = latitud, `punto_y` = longitud (WGS84 directo, sin conversión)
- **Colectivo** (arrival): `latitud` / `longitud` (WGS84)

### Notas técnicas

- Google Maps API key hardcodeada en `DetalleScreen.tsx`
- `leaflet` + `react-leaflet` en package.json pero **no usados** (problemas de renderizado)
- No requiere conversión Gauss-Kruger; las coordenadas llegan en lat/lng nativo

## Arquitectura de pantallas

```
/                          → BuscarParadaScreen  (búsqueda de paradas con caché)
/cuando-llega/:id          → CuandoLlegaScreen   (arribos agrupados por línea)
/detalle/:id/:interno      → DetalleScreen       (detalle + mapa custom markers)
```

## Flujo de navegación

1. **BuscarParadaScreen** → usuario busca por texto o geolocalización → selecciona una parada → navega a `/cuando-llega/:cod_sms`
2. **CuandoLlegaScreen** → muestra los próximos colectivos agrupados por línea en cards expandibles → toca un colectivo → navega a `/detalle/:id/:interno`
3. **DetalleScreen** → mapa con markers custom (OverlayView), polyline toggleable del recorrido, datos detallados
4. **Back navigation**: CuandoLlegaScreen tiene botón volver (AppBar) que hace `navigate(-1)`. Los resultados de búsqueda persisten via `sessionStorage`.

## Estructura del proyecto

```
src/
├── screens/
│   ├── BuscarParadaScreen.tsx   # Búsqueda + geolocalización + caché sessionStorage
│   ├── CuandoLlegaScreen.tsx    # Lista de arribos (polling 30s + countdown 1s)
│   └── DetalleScreen.tsx        # Detalle + Google Maps (polling 30s)
├── components/
│   ├── ArriboCard.tsx           # Card expandible agrupada por línea (rediseñada)
│   ├── StopHeader.tsx           # Header de parada con badge naranja + polling indicator
│   ├── SearchBox.tsx            # Input de búsqueda
│   ├── DownloadCTA.tsx          # Banner descarga APK
│   ├── MagicBusLogo.tsx         # Logo SVG
│   └── PlacaLinea.tsx           # Badge línea + ramal
├── services/
│   ├── api.ts                   # API cuandoLlegaRosario
│   └── apiGobierno.ts           # API gobierno Rosario (líneas, recorridos)
├── hooks/
│   ├── useLineasGobierno.ts     # Hook con cache de líneas + buscarLineaId()
│   └── usePollingCountdown.ts   # Hook reutilizable de polling con countdown
├── context/
│   └── SearchContext.tsx         # Contexto de búsqueda (persiste entre pantallas)
├── types/
│   └── index.ts                 # Interfaces: Parada, Arribo, ParadaInfo, etc.
├── theme/
│   └── index.ts                 # Tema MUI + tokens exportados
└── utils/
    └── coordinateConversion.ts  # Conversión EPSG:22185 → WGS84 (no usado)

mobile/
├── App.tsx                      # WebView + puente postMessage + BackHandler
├── app.json                     # Config Expo (splash, permisos, EAS)
└── assets/
    ├── icon.png                 # Ícono de la app
    └── splash-2732x2732.png     # Splash screen

vercel.json                      # Rewrites de API + SPA fallback
.github/workflows/
└── deploy-apk.yml               # GH Action: EAS Build → GitHub Release
```

## Design Tokens (`src/theme/index.ts`)

```ts
export const tokens = {
  brand:         '#F05510',
  brandDark:     '#C23D00',
  brandLight:    '#FFF0EB',
  bg:            '#F7F6F4',
  surface:       '#FFFFFF',
  surface2:      '#F2F0ED',
  textPrimary:   '#1A1917',
  textSecondary: '#6B6760',
  textMuted:     '#9B9790',
  border:        'rgba(0,0,0,0.08)',
  borderStrong:  'rgba(0,0,0,0.14)',
  green:         '#1A7A4A',
  greenBg:       '#E8F6EE',
  amber:         '#92580A',
  amberBg:       '#FEF3E2',
  red:           '#B22B2B',
  redBg:         '#FCEAEA',
  blue:          '#2A56C6',
  blueBg:        '#E8F0FE',
}

export const radii = { sm: 6, md: 8, lg: 12, xl: 14, card: 16 }
```

## Tipografía

- **DM Sans** (400, 500, 600) — todo texto UI general
- **DM Mono** (400, 500, 600, 700) — números de línea, IDs de parada, internos, tiempos en chips, countdown de polling
- Aplicar DM Mono via `sx={{ fontFamily: '"DM Mono", monospace' }}`

## Tipos principales

### Arribo
```
codigoLinea              # Código interno de la línea
descripcionLinea         # Nombre de línea (ej: "115")
descripcionCortaBandera  # Ramal/bandera corto (ej: "Roja")
descripcionBandera       # Destino completo (ej: "Centro")
tiempoArriboMinutos      # Minutos hasta llegar a la parada (null = sin servicio)
minutosDesdeUltimaGPS    # Minutos desde última actualización GPS
distanciaKm              # Distancia del colectivo a la parada
identificadorCoche       # Número interno del vehículo
latitud / longitud       # Coordenadas actuales del colectivo (WGS84)
esAdaptado               # Bool: colectivo adaptado
```

## Lógicas de color

### TimeChip (tiempoArriboMinutos)
| Condición | bg | color | texto |
|---|---|---|---|
| `=== 0` (Llegando) | `#E8F6EE` | `#1A7A4A` | Llegando |
| `<= 12 min` | `#E8F6EE` | `#1A7A4A` | X min |
| `<= 30 min` | `#FEF3E2` | `#92580A` | X min |
| `> 30 min` | `#F2F0ED` | `#6B6760` | X min |
| `null` | `#E8F6EE` | `#1A7A4A` | Llegando (tratado como 0) |

### GPS Badge (minutosDesdeUltimaGPS)
| Condición | bg | color | texto |
|---|---|---|---|
| `<= 5 min` | `#E8F6EE` | `#1A7A4A` | hace X min |
| `> 5 min` | `#FEF3E2` | `#92580A` | sin señal reciente |

## ArriboCard (componente)

Cada card agrupa arribos por `codigoLinea`, ordenados por `tiempoArriboMinutos`.

### Cabecera (colapsada)
- `border: 1px solid rgba(0,0,0,0.08)` + `borderLeft: 3px solid #F05510`
- BusIconWrap: 34×34px, borderRadius 10px, bg #F2F0ED, icono IconBus 17px #6B6760
- Número línea: DM Mono 600 15px
- Ramal: badge DM Sans 500 11px, bg #F2F0ED, borderRadius 5px
- Times: "Próx." muted + valor primary + " · " + "Sig." + valor, en DM Sans 400 11px
- TimeChip: DM Mono 700 12px, borderRadius 8px (colores según tabla arriba)
- ExpandButton: 22×22px borderRadius 50% bg #F2F0ED, IconChevronDown

### Contenido expandido
- bg #F7F6F4, borderTop 0.5px
- Filas: IconBusStop → Destino | IconIdBadge2 → Interno + badge Adaptado | IconSatellite → GPS | IconRoute → Distancia
- Badge Adaptado: bg #E8F0FE, color #2A56C6, DM Sans 500 10px, IconAccessible
- GpsBadge según tabla arriba

## StopHeader (componente)

Header de parada en CuandoLlegaScreen:
- Badge naranja: bg #FFF0EB, DM Mono 600 11px, IconMapPin → "Parada XXXX"
- Nombre calle: DM Sans 600 15px
- Ochava: DM Sans 400 12px #6B6760
- Polling dot animado (pulso CSS) + texto "actualiza en Xs" en DM Mono 400 10px

## BuscarParadaScreen

- SearchSurface: card blanca borderRadius 16px, border 1px, margin 14px
- Input row: height 48px, IconSearch 18px #F05510 a la izquierda
- ResultItem: círculo 30×30px bg #FFF0EB con IconMapPin + ID (DM Mono 600) + nombre calle + chips de línea (DM Mono 500 10px bg #F2F0ED)
- Caché en `sessionStorage` clave `magicbus_search` para persistir resultados al navegar
- FAB: 44×44px bg brand, IconCurrentLocation

## DetalleScreen

- AppBar con back button (círculo 28×28 rgba(255,255,255,0.18) + IconArrowLeft)
- Card principal: borderRadius 16px, border 1px, padding 14px
  - Header: IconBus 40×40 bg brandLight + nombre línea DM Mono 700 20px + interno
  - Grid 2 cols: "Llega en" (hora HH:MM) | "Distancia" (X.X km) con bg surface2
  - Filas: Recorrido, Parada, GPS con GpsBadge inline
- Google Maps:
  - Parada: OverlayView con círculo negro #1A1917 + IconBusStop + label "Parada XXXX"
  - Colectivo: OverlayView con círculo brand #F05510 + IconBus + label "Int. XXXX"
  - Polyline del recorrido toggleable via pill flotante "Ver recorrido / Ocultar recorrido"
  - fitBounds solo entre parada y colectivo (sin ruta a menos que esté activa)
  - Zoom fallback a 16 si los puntos están a <500m
- Botones: Compartir (outline, flex:1) + Volver (filled brand, flex:2)

## Iconos Tabler usados

| Ícono | Uso |
|---|---|
| `IconBus` | Colectivo en cards y detalle |
| `IconBusStop` | Destino en expandido, marker parada |
| `IconMapPin` | Parada en resultados y header |
| `IconIdBadge2` | Interno en expandido |
| `IconSatellite` | GPS |
| `IconRoute` | Distancia, toggle recorrido |
| `IconSearch` | Búsqueda / FAB búsqueda |
| `IconCurrentLocation` | FAB geolocalización |
| `IconChevronDown` | Toggle expandir card |
| `IconAccessible` | Badge Adaptado |
| `IconShare` | Botón compartir |
| `IconArrowLeft` | Volver |
| `IconFlag` | Recorrido/bandera |

## Patrones comunes

- **Polling**: `setInterval(fetchData, 30000)` + `setInterval(countdown, 1000)` con cleanup en useEffect. Countdown descuenta de 30 a 1 y resetea.
- **Estilos**: todo inline via `sx` prop de MUI (sin CSS modules ni archivos .css)
- **Tema MUI**: primary `#F05510`, background `#F7F6F4`, border radius cards 16
- **Proxy**: Las URLs de API se enrrutan via Vite proxy para evitar CORS
- **Cache de líneas**: `useLineasGobierno` cachea en módulo (`let cacheLineas`) para persistir entre pantallas
- **Cache de búsqueda**: `sessionStorage` con clave `magicbus_search` guarda query + resultados + flag searched
- **Sin boxShadow**: solo borders para elevar elementos

## Assets (favicon / PWA / splash)

| Archivo | Ubicación | Uso |
|---|---|---|
| `favicon.ico` | `public/` | Favicon clásico (browsers) |
| `apple-touch-icon.png` | `public/` | iOS al agregar a pantalla inicio |
| `android-chrome-192.png` | `public/` | PWA manifest (192×192) |
| `android-chrome-512.png` | `public/` | PWA manifest (512×512) |
| `manifest.json` | `public/` | PWA manifest (standalone, theme_color `#F05510`) |
| `app-icon-1024.png` | `src/assets/` | Master 1024×1024 (origen de `mobile/assets/icon.png`) |
| `splash-2732x2732.png` | `src/assets/` | Splash universal (origen de `mobile/assets/splash-2732x2732.png`) |
| `splash-{828,1170,1284}x*` | `src/assets/` | Splash iOS manual (referencia, no usado) |
| `splash-{1080,2160}x*` | `src/assets/` | Splash Android manual (referencia, no usado) |
| `magicbus-logo.svg` | `public/` | Logo SVG, conservado |

### App nativa (Expo + EAS Build)

La app nativa vive en `mobile/`. Es un WebView que carga `https://magicbus91.vercel.app`.

- `mobile/assets/icon.png` — icono de la app (copiado de `src/assets/app-icon-1024.png`)
- `mobile/assets/splash-2732x2732.png` — splash screen (copiado de `src/assets/splash-2732x2732.png`)
- Expo SDK 52, Android only, EAS Build con perfil `preview` (APK sin credenciales)

**Para hacer un build manual:**
```bash
cd mobile
npm run build    # eas build --platform android --profile preview
```

### Conexión runtime Web ↔ Nativa

```
Usuario abre la app → APK arranca → App.tsx monta el WebView
                                    ↓
                            carga magicbus91.vercel.app
                                    ↓
                            web funciona normal dentro del WebView
                                    ↓
                            [si tocás FAB de ubicación]
                                    ↓
                web → postMessage({type:'REQUEST_LOCATION', requestId})
                                    ↓
                App.tsx escucha, llama a expo-location
                                    ↓
                Android muestra el prompt nativo de permisos
                                    ↓
                respuesta vuelve a la web vía injectJavaScript +
                CustomEvent('nativeLocationResponse')
```

- El WebView inyecta `window.__isNativeApp = true` al cargar (`onLoadEnd`). Esto permite que la web sepa si está dentro de la app nativa (usado por `DownloadCTA.tsx` para no mostrar el banner de descarga).
- `window.ReactNativeWebView` existe solo dentro del WebView. Es la única bifurcación de comportamiento.
- El botón back físico de Android se intercepta via `BackHandler` en `App.tsx` → llama a `webViewRef.current.goBack()` en lugar de cerrar la app, replicando el comportamiento del botón back interno.

### Flujo de CI/CD

| Cambio | Quién deploya | Qué se publica |
|---|---|---|
| `src/**` | Vercel (auto en push) | Web nueva en `magicbus91.vercel.app` |
| `mobile/**` | GitHub Actions → EAS Build | APK nuevo en GitHub Releases |
| Cualquier otra cosa | nada | nada |

**Consecuencia clave:** si cambiás solo la web, los usuarios de la app nativa ven el cambio sin reinstalar nada (el APK siempre carga la web online). Solo necesitan reinstalar el APK si tocás `mobile/App.tsx`, permisos, plugins de expo-location, etc.

## Comandos

```bash
npm run dev      # Dev server en puerto 5173
npm run build    # tsc + vite build
npm run preview  # Preview build
```
