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
