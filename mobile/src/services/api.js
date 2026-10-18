import axios from 'axios'
import Toast from 'react-native-toast-message'
import { normalizeError } from '../utils/apiError'
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config'
import { tokenStorage } from './tokenStorage'

// Instancia única de axios para toda la app.
const api = axios.create({ baseURL: API_BASE_URL, timeout: REQUEST_TIMEOUT_MS })

// Cliente sin interceptores para pedir el refresh (evita bucles infinitos).
const bareClient = axios.create({ baseURL: API_BASE_URL, timeout: REQUEST_TIMEOUT_MS })

const isAuthEndpoint = (url = '') => url.startsWith('/auth/')

let onAuthFailure = () => {}

// AuthContext registra aquí qué hacer cuando la sesión ya no se puede recuperar.
export function setAuthFailureHandler(handler) {
  onAuthFailure = handler
}

// Si varias peticiones reciben 401 a la vez, se hace un solo refresh y todas lo esperan.
let refreshPromise = null

async function refreshSession() {
  const refreshToken = await tokenStorage.getRefreshToken()
  if (!refreshToken) throw new Error('No hay refresh token')

  refreshPromise ??= bareClient
    .post('/auth/refresh', null, { params: { refreshToken } })
    .then(async ({ data }) => {
      await tokenStorage.setTokens(data)
      return data
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

// Request: agrega el Bearer token guardado en SecureStore.
api.interceptors.request.use(async (config) => {
  if (!isAuthEndpoint(config.url)) {
    const token = await tokenStorage.getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response: si el token venció, intenta un refresh y repite la petición una vez.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      original._retry = true
      try {
        const session = await refreshSession()
        original.headers.Authorization = `Bearer ${session.accessToken}`
        return api(original)
      } catch {
        await tokenStorage.clear()
        onAuthFailure()
      }
    }

    error.apiError = normalizeError(error)

    // Sin conexión o errores 5xx se avisan con un toast global.
    // Se puede desactivar por petición con { skipGlobalError: true }.
    const { isNetworkError, isCanceled } = error.apiError
    if (!original?.skipGlobalError && !isCanceled && (isNetworkError || status >= 500)) {
      Toast.show({ type: 'error', text1: 'Ups', text2: error.apiError.message })
    }

    return Promise.reject(error)
  },
)

export default api
