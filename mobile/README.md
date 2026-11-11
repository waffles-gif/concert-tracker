# Concert Tracker · App mobile (Expo)

App en React Native con Expo que consume el backend de este repositorio.

## Requisitos

- Node.js 20.19 o superior.
- La app **Expo Go** en el celular, con el mismo SDK que este proyecto (SDK 58).
- El backend corriendo (en local o en producción).

## Cómo correrla

```bash
cd mobile
npm install
npx expo install --fix   # alinea las versiones con el SDK de Expo
cp .env.example .env      # en Windows: copy .env.example .env
npx expo start --tunnel -c
```

Escanea el QR con Expo Go (Android) o con la cámara (iOS).

Usamos el modo `--tunnel` para que el celular se conecte aunque no esté en la misma red que la PC (o si el firewall bloquea la conexión). Si pide instalar `@expo/ngrok`, acepta.

## Variables de entorno

| Variable | Para qué sirve |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL del backend sin `/api/v1`. |

Valores posibles:

- **Producción (Render):** `EXPO_PUBLIC_API_URL=https://concert-tracker-6sbr.onrender.com`
- **Backend local:** la IP de tu PC en la misma red Wi-Fi, por ejemplo `http://192.168.1.50:8080`. En el celular `localhost` es el propio celular, no la PC.

Si cambias el `.env`, reinicia con `npx expo start -c` para limpiar la caché.

> Render está en el plan gratis y se apaga cuando no se usa. La primera petición puede tardar 1 o 2 minutos; la app muestra un aviso de "el servidor está despertando" mientras espera.

## Abrirla sin la laptop (EAS Update)

La app también se publica con **EAS Update**, así se puede abrir en Expo Go sin tener `expo start` corriendo:

```bash
npx eas-cli@latest login                 # una sola vez, con la cuenta de Expo
npx eas-cli@latest update --branch main --environment production --message "descripcion del cambio"
```

Luego, en expo.dev → proyecto → **Updates**, se abre la última actualización y se escanea su QR con Expo Go.

Al publicar con `--environment production`, EAS **no lee el `.env`**: la URL del backend sale de la variable `EXPO_PUBLIC_API_URL` guardada en expo.dev → proyecto → **Environment variables** (entorno Production, apuntando a Render). Si esa variable no existe, la app publicada intenta conectarse a `localhost` y no carga nada. En `app.json`, `runtimeVersion` usa la política `sdkVersion` para que Expo Go pueda abrir la actualización.

## Qué hace la app

Tiene las mismas funciones que la web. Pestañas: **Inicio · Conciertos · Artistas · Historial · Perfil**.

- **Login y registro** con validaciones antes de llamar a la API (email válido, contraseña de 8 a 72 caracteres, campos obligatorios). Si el correo ya está registrado, el error sale en el mismo campo. La sesión se recupera sola al abrir la app.
- **Tokens en `expo-secure-store`** (cifrados). Si el access token vence, el cliente pide uno nuevo con el refresh token y repite la petición; si el refresh ya no sirve, cierra la sesión.
- **Onboarding**: si el usuario sigue menos de 3 artistas, al entrar primero elige géneros y sigue al menos 3 artistas (con barra de progreso). Igual que en la web, después no puede bajar de 3.
- **Inicio**: resumen con cuántos conciertos tiene en "Voy a ir" y "Ya fui", favoritos y artistas que sigue; sus próximos conciertos, los próximos de la plataforma y las últimas reseñas de todos.
- **Conciertos**: búsqueda por artista con debounce, filtros "Solo próximos" y "Cerca de mí", scroll infinito sobre la respuesta paginada, pull-to-refresh y estados de carga, vacío y error con "Reintentar". Si se ven conciertos pasados, tienen la etiqueta "Ya pasó".
- **Artistas**: lista de la A a la Z con filtro por género y botón de seguir / dejar de seguir.
- **Detalle de artista**: al tocar un artista (en Artistas, en tu perfil o en el detalle de un concierto) se ven sus datos y sus conciertos en dos pestañas, "Próximos" y "Ya ocurrieron".
- **Modo oscuro**: sigue el tema del celular y se puede cambiar desde Perfil; la elección queda guardada.
- **Cerca de mí (GPS)**: con `expo-location` se obtiene la ubicación, se saca la ciudad y se filtran los conciertos de esa ciudad. Si el GPS devuelve el distrito, se prueba con la provincia y la región.
- **Detalle del concierto**: datos del concierto, zonas y precios, link para comprar entradas, reseñas de otros usuarios y el clima del día del concierto (Open-Meteo, sin API key).
- **Interacciones**: marcar "Voy a ir" / "Ya fui", dejar una reseña, guardar en favoritos y seguir al artista.
- **QR**: cada concierto tiene un QR para compartirlo; desde la pantalla de conciertos se puede escanear con la cámara (`expo-camera`) y abre el detalle.
- **Historial**: pestañas "Voy a ir", "Ya fui" y "Reseñas" con lo que hizo el usuario.
- **Perfil**: datos y bio, **Editar perfil** (nombre, país, ciudad y bio de hasta 300 caracteres), **Mis favoritos** (con "Quitar") y artistas que sigue, con cierre de sesión.
- **Errores**: mensajes claros cuando no hay conexión o el servidor falla, y un `ErrorBoundary` para que la app no se quede en blanco si algo se rompe. Las peticiones GET que fallan por red, timeout o 502/503/504 se reintentan solas hasta 2 veces (1 s y 2 s de espera).
- **Fallbacks de sensores**: si el GPS no está disponible, "Cerca de mí" usa la ciudad del perfil y lo avisa; si no hay cámara o permiso, el escáner ofrece buscar el concierto en la lista.

## Endpoints que usa

| Pantalla | Endpoint |
| --- | --- |
| Login / Registro | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh` |
| Inicio | `GET /user-interactions/my-concerts`, `GET /users/me/favorite-concerts`, `GET /users/me/follows`, `GET /concerts/search`, `GET /reviews/recent` |
| Conciertos | `GET /concerts/search?artist=&city=&upcoming=&sort=date,asc&page=&size=` |
| Artistas / Onboarding | `GET /artists?genreId=&sort=name,asc&page=&size=`, `GET /genres` |
| Detalle de artista | `GET /artists/{id}`, `GET /artists/{id}/concerts` |
| Detalle | `GET /concerts/{id}`, `GET /concerts/{id}/reviews`, `GET /user-interactions/concerts/{id}` |
| Interacciones | `POST /user-interactions/attendance`, `POST /user-interactions/reviews`, `PUT` y `DELETE /user-interactions/favorites/{id}`, `POST /user-interactions/follow`, `DELETE /user-interactions/follow/{id}` |
| Historial | `GET /user-interactions/my-concerts`, `GET /users/me/reviews` |
| Perfil | `GET /users/me`, `PUT /users/me`, `GET /users/me/follows`, `GET /users/me/favorite-concerts` |

Servicios externos: Open-Meteo (geocoding y pronóstico del clima).

## Problemas comunes

- **"No se puede conectar al servidor":** revisa `EXPO_PUBLIC_API_URL`. Si usas Render, espera a que despierte y vuelve a intentar.
- **El QR de Expo no conecta:** usa `npx expo start --tunnel -c`.
- **Expo Go dice que el proyecto usa otro SDK:** actualiza Expo Go o, si Expo Go ya pasó a un SDK nuevo, corre `npx expo install expo@latest` y luego `npx expo install --fix`.
- **Al entrar me pide elegir artistas:** es el onboarding; pasa cuando la cuenta sigue menos de 3 artistas.
- **"Cerca de mí" no muestra nada:** acepta el permiso de ubicación. Si en tu ciudad no hay conciertos, la app te lo avisa.

## Estructura

```
mobile/
├── App.js            # proveedores (auth, navegación, toasts) y ErrorBoundary
├── index.js          # punto de entrada de Expo
└── src/
    ├── screens/      # pantallas (una por ruta)
    ├── components/   # piezas reutilizables de UI (clima, QR, tarjetas)
    ├── navigation/   # stack de auth, onboarding y tabs de la app
    ├── services/     # axios, tokens, backend y clima
    ├── hooks/        # custom hooks (useAuth, usePagedList, useFollows, useCurrentCity, ...)
    ├── contexts/     # Context API (AuthContext)
    ├── utils/        # formato, validaciones, QR y errores
    └── theme/        # colores claro/oscuro, espaciados y ThemeContext
```
