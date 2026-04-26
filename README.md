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

### 4. Mapas
- **Leaflet** con OpenStreetMap (actualmente no renderiza correctamente)
- ~~Google Maps~~ (revertido temporalmente)

### 5. Despliegue
- GitHub: https://github.com/alandelleore/magicbus
- Vercel: https://magicbus.vercel.app

---

## Lo que NO funciona ❌

### 1. Mapa en DetalleScreen
- Leaflet no renderiza correctamente (pantalla en blanco)
- La API del gobierno devuelve coordenadas en formato `x`, `y` (no lat/lon estándar)
- Las coordenadas requieren conversión Gauss-Kruger → WGS84

### 2. APK para Android
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

---

## Estructura del proyecto

```
magicbus/
├── src/
│   ├── screens/
│   │   ├── BuscarParadaScreen.tsx    # Búsqueda de paradas
│   │   ├── CuandoLlegaScreen.tsx      # Lista arrivals
│   │   └── DetalleScreen.tsx        # Detalle + mapa
│   ├── services/
│   │   ├── api.ts                # CuandoLlegaRosario API
│   │   └── apiGobierno.ts       # Gobierno Rosario API
│   ├── hooks/
│   │   └── useLineasGobierno.ts # Mapeo líneaID
│   ├── types/
│   │   └── index.ts            # Tipos TypeScript
│   └── App.tsx
├── vite.config.ts               # Proxy Vite (dev)
├── vercel.json                # Proxy Vercel (prod)
└── package.json
```

---

## Próximos pasos (backlog)

1. **Arreglar mapa Leaflet**
   - Verificar conversión de coordenadas `x`,`y` → lat/lon
   - Probar con datos reales

2. **Optimizar rendimiento**
   - Cache de líneas del gobierno (ya implementado)
   - Evitar re-renders infinitos

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

### Fallback: Mapa sin funcionar
Por ahora el mapa en DetalleScreen muestra pantalla en blanco. Los datos del recorrido se cargan correctamente (ver consola `Recorrido cargado:`), pero el renderizado falla.

### Causa probable
- API del gobierno no devuelve `geojsonIda`/`geojsonVuelta`
- Coordenadas `x`,`y` requieren conversión especiales
- Librería Leaflet puede tener conflictos con el entorno