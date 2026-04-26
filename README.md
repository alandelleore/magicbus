# MagicBus - Estado del Proyecto

## Resumen
App web para consultar colectivos en Rosario, alternativa a cuandoLlegaRosario.com.

## Objetivo
- Web App (React + Vite + MUI)
- Despliegue: Vercel (web) + Firebase/EAS (APK Android)

---

## Lo que funciona ✅

### 1. Búsqueda de paradas
- API: `app.cuandollegarosario.com/api/public/search`
- Pantalla BuscarParada
- Búsqueda por nombre/código

### 2. Lista de arrivals en tiempo real
- API: `app.cuandollegarosario.com/api/public/parada/:id`
- Muestra arrivals con:
  - Hora de llegada calculada
  - Distancia al colectivo
  - Bandera/recorrido
  - GPS timestamp
  - Int. (interno del colectivo)

### 3. Detalle del arrival
- API del gobierno: `ws.rosario.gob.ar/ubicaciones/public/lineas` + `/linea/:empresa/:id`
- Proxy configurado para CORS (Vite dev + Vercel)
- Mapeo de línea: `descripcionLinea` → `id` del gobierno

### 4. Mapa (Google Maps) ✅
- Biblioteca: `@react-google-maps/api`
- API Key: Configurada en `DetalleScreen.tsx`
- Coordenadas de parada: `punto_x` (lat), `punto_y` (lng) - formato correcto
- Muestra marker de la parada

### 5. Despliegue
- GitHub: https://github.com/alandelleore/magicbus
- Vercel: https://magicbus.vercel.app

---

## Lo que NO funciona ❌

### 1. Marker del colectivo en el mapa
- Por ahora solo se muestra la parada
- El colectivo requiere verificar coordenadas

### 2. Ruta del recorrido
- API del gobierno no devuelve geojsonIda/geojsonVuelta
- Solo devuelve las paradas de la línea

### 3. APK para Android
- No configurado aún
- Requiere Expo + EAS Build

---

## APIs involucradas

| API | Endpoint | Uso |
|-----|----------|-----|
| CuandoLlegoRosario | `app.cuandollegarosario.com/api/public/search` | Buscar paradas |
| CuandoLlegaRosario | `app.cuandollegarosario.com/api/public/parada/:id` | arrivals en tiempo real |
| Gobierno (listado) | `ws.rosario.gob.ar/ubicaciones/public/lineas?nombre=all` | Lista de líneas |
| Gobierno (detalle) | `ws.rosario.gob.ar/ubicaciones/public/linea/:empresa/:id` | Detalle + paradas |

### Mapeo de IDs
- `cuandoLlegaRosario`: `descripcionLinea` (ej: "115")
- `gobierno`: `codigoEMR` (ej: "115") → `id` interno (ej: "15")
- El hook `useLineasGobierno` hace este mapeo automáticamente

### Formato de coordenadas
- **CuandoLlegaRosario** (parada):
  - `punto_x` = latitud (-32.95729)
  - `punto_y` = longitud (-60.627777)
- **CuandoLlegaRosario** (colectivo arrival):
  - `latitud` = latitud
  - `longitud` = longitud

---

## Estructura del proyecto

```
magicbus/
├── src/
│   ├── screens/
│   │   ├── BuscarParadaScreen.tsx    # Búsqueda de paradas
│   │   ├── CuandoLlegaScreen.tsx      # Lista arrivals
│   │   └── DetalleScreen.tsx         # Detalle + mapa Google
│   ├── services/
│   │   ├── api.ts                   # CuandoLlegaRosario API
│   │   └── apiGobierno.ts            # Gobierno Rosario API
│   ├── hooks/
│   │   └── useLineasGobierno.ts     # Mapeo líneaID
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript
│   └── App.tsx
├── vite.config.ts                   # Proxy Vite (dev)
├── vercel.json                   # Proxy Vercel (prod)
└── package.json
```

---

## Próximos pasos (backlog)

1. **Agregar marker del colectivo**
   - Verificar coordenadas del arrival

2. **Mostrar ruta de la línea**
   - Necesita otra fuente de datos o mapa estático

3. **Configurar APK**
   - Expo + EAS Build para Android

4. **Mejoras visuales**
   - Colores de línea dinámicos
   - Más info en tooltip del mapa

---

## Comandos útiles

```bash
# Desarrollo local
npm run dev

# Build producción
npm run build

# Desplegar a Vercel
git push origin main
```

---

## Notas técnicas

### Google Maps API Key
La API key está hardcodeada en `DetalleScreen.tsx`:
```typescript
const GOOGLE_MAPS_API_KEY = 'AIzaSyCP4Zo1sJq5nfWsnWNUa9j6aI5lSMWArBk';
```

### Librerías usadas
- `@react-google-maps/api` - Google Maps para React
- `leaflet` + `react-leaflet` - (no usado actualmente por problemas de renderizado)

### Problema resuelto: coordenadas
Las coordenadas de la parada (`punto_x`, `punto_y`) ya están en formato lat/lng, no requieren conversión Gauss-Kruger. El orden es:
- `lat = punto_x` ( latitudes negatives)
- `lng = punto_y` ( longitudes negativas)