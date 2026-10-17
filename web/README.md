# Concert Tracker — Web

Cliente web (React + Vite + Tailwind CSS) del backend Concert Tracker.

## Requisitos

- Node.js 20+
- Backend corriendo en `http://localhost:8080` (ver README de la raíz)

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # build de producción en dist/
npm run lint       # ESLint
```

## Variables de entorno

| Variable       | Descripción                  | Ejemplo                 |
|----------------|------------------------------|-------------------------|
| `VITE_API_URL` | URL base del backend (sin `/api/v1`) | `http://localhost:8080` |

Copia `.env.example` a `.env.development` para desarrollo local.

## Estructura

```
src/
├── components/   componentes reutilizables
├── pages/        pantallas (una por ruta)
├── hooks/        hooks personalizados
├── services/     cliente axios y llamadas a la API
├── contexts/     contextos (autenticación, etc.)
├── routes/       definición central de rutas
└── utils/        utilidades
```
