import axios from 'axios'
import Toast from 'react-native-toast-message'
import { isSessionRejected, normalizeError } from '../utils/apiError'
import { API_BASE_URL, REQUEST_TIMEOUT_MS, SLOW_REQUEST_MS } from './config'
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

const NO_REFRESH_TOKEN = new Error('No hay refresh token')

async function refreshSession() {
  const refreshToken = await tokenStorage.getRefreshToken()
  if (!refreshToken) throw NO_REFRESH_TOKEN

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

// El backend está en el plan gratis de Render y se duerme si nadie lo usa: la primera petición
// puede tardar bastante. Si una petición demora, avisamos para que no parezca que la app se colgó.
function startSlowNotice(config) {
  config._slowTimer = setTimeout(() => {
    Toast.show({
      type: 'info',
      text1: 'El servidor está despertando',
      text2: 'La primera carga puede tardar hasta un par de minutos.',
      visibilityTime: 8000,
    })
  }, SLOW_REQUEST_MS)
}

const stopSlowNotice = (config) => clearTimeout(config?._slowTimer)

// Normaliza el error y, sin conexión o con un 5xx, lo avisa con un toast global.
// Se puede desactivar por petición con { skipGlobalError: true }.
function rejectWith(error, config) {
  error.apiError = normalizeError(error)

  const { isNetworkError, isCanceled, status } = error.apiError
  if (!config?.skipGlobalError && !isCanceled && (isNetworkError || status >= 500)) {
    Toast.show({ type: 'error', text1: 'Ups', text2: error.apiError.message })
  }

  return Promise.reject(error)
}

// Request: agrega el Bearer token guardado en SecureStore.
api.interceptors.request.use(async (config) => {
  if (!isAuthEndpoint(config.url)) {
    const token = await tokenStorage.getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  startSlowNotice(config)
  return config
})

// Response: si el token venció, intenta un refresh y repite la petición una vez.
api.interceptors.response.use(
  (response) => {
    stopSlowNotice(response.config)
    return response
  },
  async (error) => {
    const original = error.config
    const status = error.response?.status
    stopSlowNotice(original)

    if (status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      original._retry = true
      try {
        const session = await refreshSession()
        original.headers.Authorization = `Bearer ${session.accessToken}`
        return await api(original)
      } catch (refreshError) {
        // Ya pasó por este interceptor: es el error de repetir la petición, no del refresh.
        if (refreshError.apiError) return Promise.reject(refreshError)

        // Si el refresh falló por conexión o por un 5xx la sesión sigue siendo válida:
        // se avisa del error sin sacar al usuario.
        if (refreshError !== NO_REFRESH_TOKEN && !isSessionRejected(refreshError)) {
          return rejectWith(refreshError, original)
        }
        await tokenStorage.clear()
        onAuthFailure()
      }
    }

    return rejectWith(error, original)
  },
)

export default api
