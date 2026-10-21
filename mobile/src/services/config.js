// Expo solo expone al código las variables que empiezan con EXPO_PUBLIC_.
// Se leen al empaquetar: si cambias .env, reinicia con `npx expo start -c`.
const rawUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080'

export const API_BASE_URL = `${rawUrl.replace(/\/+$/, '')}/api/v1`
export const REQUEST_TIMEOUT_MS = 15000
