# Patrón híbrido Web + WebView nativo

Arquitectura de dos productos separados que se conectan en runtime:

- **Producto A — Web**: SPA (Vite + React, o similar) desplegada en una plataforma de hosting estática.
- **Producto B — Wrapper nativo**: app Expo que monta un WebView apuntando a la URL de A. Build en EAS, distribución como release en GitHub.

La web no sabe (ni necesita saber) que el wrapper existe; el wrapper no sabe (ni necesita saber) qué hace la web. Se acoplan solo en runtime, via dos flags y un bridge de mensajes.

## 1. Web

**Build:** `vite build` → estático en `dist/`.

**Deploy:** la plataforma de hosting (Vercel, Netlify, Cloudflare Pages, etc.) escucha pushes al repo y deploya automáticamente. **No** usa GitHub Actions para el deploy de la web — la plataforma tiene su propio pipeline integrado con GitHub.

**Configuración de rewrites/proxy** (en Vercel: `vercel.json`; equivalentes en otros hosts):

1. Endpoints `/api/<algo>/...` se proxean a APIs externas que no permiten CORS desde el browser. Resuelve el problema de CORS sin necesidad de levantar un backend propio.
2. Catch-all `/:path* → /index.html` para que el router SPA funcione en URLs profundas (refresh, deep links).

## 2. Wrapper nativo

Es un APK que solo abre un WebView apuntando a la URL de la web. No tiene UI propia. Lo nativo se limita a cuatro piezas:

1. **WebView** que carga la URL pública de la web.
2. **Bridge `postMessage` ↔ `injectJavaScript`** para operaciones que requieren el OS (ubicación, share, vibración, etc.).
3. **`BackHandler` de Android** que redirige el back físico al `goBack()` del WebView. Sin esto, el back físico cerraría la app en cualquier pantalla interna.
4. **Inyección de `window.__isNativeApp = true`** antes del primer render (via `injectedJavaScriptBeforeContentLoaded`) para que la web sepa que corre embebida desde el primer paint.

**Build:** servidores de EAS (Expo Application Services). **No** GitHub Actions — buildear Android requiere SDK + Gradle + infra emulator-class que los runners de GH Actions no traen instalados. Por eso se delega.

**Workflow GH Actions:** dispara cuando hay push a `main` que toca el directorio del wrapper (`mobile/**` por convención) o el propio `.yml` del workflow. El workflow:

1. `eas build --platform android --profile preview --non-interactive --wait --json` — encola un build en EAS, espera a que termine, devuelve JSON con la URL del artifact.
2. `curl -L -o app.apk "$URL"` — descarga el APK del CDN de Expo al runner.
3. `gh release create vX.Y.Z app.apk` — sube el APK como release de GitHub.

**Distribución:** la URL `https://github.com/<owner>/<repo>/releases/latest/download/<name>.apk` apunta siempre al último APK publicado. La web puede linkear directamente ahí para que cualquier visitante Android baje la app sin pasar por Play Store.

## 3. Cómo se conectan en runtime

```
Usuario abre la app → APK arranca → wrapper monta el WebView
                                    ↓
                            carga la URL de la web
                                    ↓
                            web funciona normal dentro del WebView
                                    ↓
                            [acción que necesita el OS]
                                    ↓
                web → postMessage({type:'<OP>', requestId})
                                    ↓
                wrapper escucha onMessage, ejecuta la operación nativa
                                    ↓
                OS muestra el prompt nativo (si corresponde)
                                    ↓
                respuesta vuelve a la web vía injectJavaScript +
                CustomEvent('<op>Response', { detail: { requestId, ... } })
```

*El `requestId` correlaciona pedidos con respuestas. El mismo bridge sirve para cualquier operación nativa nueva (share, vibración, notificaciones locales, biometría) sin reescribir nada — solo agregar el `type` y su handler en ambos lados.*

Dos flags en `window` sirven para bifurcar comportamiento en la web:

- **`window.__isNativeApp`** — inyectada por el wrapper antes del primer render. Presencia simple → **detección**. Sirve para ocultar elementos que no tienen sentido dentro del APK (ej. CTA "descargar app").
- **`window.ReactNativeWebView`** — provista por `react-native-webview`. Expone `postMessage(...)` → **comunicación**.

Cualquier código que dependa de estar en la app nativa usa una de las dos.

## 4. Quién dispara qué

| Cambio en              | Quién deploya                          | Qué se publica          |
|------------------------|----------------------------------------|-------------------------|
| Código de la web       | Plataforma host (auto en push)         | Web nueva en URL pública |
| Wrapper nativo         | GitHub Actions → EAS                   | APK nuevo en GitHub Releases |
| Cualquier otra cosa    | nada                                   | nada                    |

> El workflow del APK también se dispara cuando se modifica el propio `.yml` del workflow, no solo el código del wrapper.

**Consecuencia clave:** si cambiás solo la web, los usuarios de la app nativa ven el cambio sin reinstalar nada (porque el APK siempre carga la web online). Solo necesitan reinstalar el APK si tocás el wrapper, permisos, o plugins de Expo.

Esto convierte al wrapper en un *shell estable* que rara vez se actualiza, mientras la iteración rápida ocurre toda en la web.
