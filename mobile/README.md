# Concert Tracker · App mobile (Expo)

App en React Native con Expo que consume el backend de este repositorio.

## Requisitos

- Node.js 20.19 o superior.
- La app **Expo Go** en el celular, con el mismo SDK que este proyecto (SDK 57).
- El backend corriendo (en local o en producción).

## Cómo correrla

```bash
cd mobile
npm install
npx expo install --fix   # alinea las versiones con el SDK de Expo
cp .env.example .env      # en Windows: copy .env.example .env
npx expo start
```

Escanea el QR con Expo Go (Android) o con la cámara (iOS).

## Variables de entorno

| Variable | Para qué sirve |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL del backend sin `/api/v1`. En el celular usa la IP de tu PC, no `localhost`. |

Si cambias el `.env`, reinicia con `npx expo start -c` para limpiar la caché.

## Qué hace hoy

- **Login y registro** con validación antes de llamar a la API. La sesión se recupera sola al abrir la app.
- **Tokens en `expo-secure-store`** (cifrados). Si el access token vence, el cliente pide uno nuevo con el refresh token y repite la petición.
- **Conciertos**: búsqueda por artista con debounce, filtro "Solo próximos", scroll infinito sobre la respuesta paginada (`content`, `page`, `totalPages`), pull-to-refresh y estados de carga, vacío y error con "Reintentar".
- **Mi perfil**: datos de `GET /users/me` y artistas seguidos de `GET /users/me/follows`, con cierre de sesión.

## Endpoints que usa

| Pantalla | Endpoint |
| --- | --- |
| Login / Registro | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh` |
| Conciertos | `GET /concerts/search?artist=&upcoming=&sort=date,asc&page=&size=` |
| Mi perfil | `GET /users/me`, `GET /users/me/follows` |

## Problemas comunes

- **"Network Error" o no carga nada en el celular:** `EXPO_PUBLIC_API_URL` apunta a `localhost`. Usa la IP de tu PC y revisa que el celular esté en la misma red Wi-Fi y que el firewall de Windows deje pasar el puerto 8080.
- **Expo Go dice que el proyecto usa otro SDK:** actualiza Expo Go o, si Expo Go ya pasó a un SDK nuevo, corre `npx expo install expo@latest` y luego `npx expo install --fix`.

## Estructura

```
mobile/
├── App.js            # proveedores (auth, navegación, toasts)
├── index.js          # punto de entrada de Expo
└── src/
    ├── screens/      # pantallas (una por ruta)
    ├── components/   # piezas reutilizables de UI
    ├── navigation/   # stack de auth + tabs de la app
    ├── services/     # axios, tokens y llamadas al backend
    ├── hooks/        # custom hooks (useAuth, useConcerts, ...)
    ├── contexts/     # Context API (AuthContext)
    ├── utils/        # formato, validaciones y errores
    └── theme/        # colores y espaciados
```
