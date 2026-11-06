// Expo solo expone al código las variables que empiezan con EXPO_PUBLIC_.
// Se leen al empaquetar: si cambias .env, reinicia con `npx expo start -c`.
const rawUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080'

export const API_BASE_URL = `${rawUrl.replace(/\/+$/, '')}/api/v1`
// El backend en Render se duerme y puede tardar más de 100 segundos en despertar.
// Sin conexión no se espera todo esto: el error llega al instante.
export const REQUEST_TIMEOUT_MS = 150000
export const SLOW_REQUEST_MS = 8000
