import axios from 'axios'
import toast from 'react-hot-toast'
import { normalizeError } from '../utils/apiError'
import { tokenStore } from './tokenStore'

const API_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/v1`

// El backend gratuito (Render) se duerme y puede tardar más de 100 s en despertar: el timeout debe ser largo.
// Si una petición pasa de WAKE_NOTICE_MS sin responder, se avisa al usuario que el servidor está despertando.
const REQUEST_TIMEOUT_MS = 150000
const WAKE_NOTICE_MS = 8000

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
})

// Cliente sin interceptores para pedir el refresh (evita bucles infinitos).
const bareClient = axios.create({ baseURL: API_URL, timeout: REQUEST_TIMEOUT_MS })

// Cuántas peticiones lentas hay a la vez: el aviso se quita cuando ya no queda ninguna.
let slowRequests = 0

function watchSlow(config) {
  config._wakeTimer = setTimeout(() => {
    config._slow = true
    slowRequests += 1
    toast.loading('El servidor está despertando, puede tardar hasta un minuto…', { id: 'server-waking' })
  }, WAKE_NOTICE_MS)
}

// La petición terminó (bien, mal o cancelada): se apaga su temporizador y, si ya no hay lentas, el aviso.
function settle(config) {
  if (!config) return
  clearTimeout(config._wakeTimer)
  if (config._slow) {
    config._slow = false
    slowRequests = Math.max(slowRequests - 1, 0)
    if (slowRequests === 0) toast.dismiss('server-waking')
  }
}

const isAuthEndpoint = (url = '') => url.startsWith('/auth/')

let onAuthFailure = () => {}

// AuthContext registra aquí qué hacer cuando la sesión ya no se puede recuperar.
export function setAuthFailureHandler(handler) {
  onAuthFailure = handler
}

// Si varias peticiones reciben 401 a la vez, solo se hace un refresh y todas lo esperan.
let refreshPromise = null

function refreshSession() {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) return Promise.reject(new Error('No hay refresh token'))

  refreshPromise ??= bareClient
    .post('/auth/refresh', null, { params: { refreshToken } })
    .then(({ data }) => {
      tokenStore.setTokens(data)
      return data
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

// Reintentos automáticos: solo para GET (repetir un POST podría duplicar una reseña o una asistencia)
// y solo en fallos pasajeros: sin conexión, o 502/503/504. Un 500 casi siempre es un bug y un timeout
// dejaría la pantalla colgada, así que esos no se reintentan.
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 500
const RETRYABLE_STATUSES = [502, 503, 504]

function isRecoverable(error) {
  const method = error.config?.method?.toLowerCase()
  if (method !== 'get' || error.code === 'ERR_CANCELED' || error.code === 'ECONNABORTED') return false
  return !error.response || RETRYABLE_STATUSES.includes(error.response.status)
}

// Espera `ms`, pero se despierta antes si la petición se cancela (el usuario cambió de pantalla).
function wait(ms, signal) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken()
  if (token && !isAuthEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  watchSlow(config)
  return config
})

api.interceptors.response.use(
  (response) => {
    settle(response.config)
    return response
  },
  async (error) => {
    const original = error.config
    const status = error.response?.status
    settle(original)

    if (status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      original._retry = true
      try {
        const session = await refreshSession()
        original.headers.Authorization = `Bearer ${session.accessToken}`
        return api(original)
      } catch {
        tokenStore.clear()
        onAuthFailure()
      }
    }

    const attempts = original?._retryCount ?? 0
    if (original && isRecoverable(error) && attempts < MAX_RETRIES) {
      original._retryCount = attempts + 1
      await wait(RETRY_DELAY_MS * original._retryCount, original.signal)
      if (!original.signal?.aborted) return api(original)
      // Se canceló mientras esperaba: se trata como cualquier cancelación (sin toast ni error en pantalla)
      const canceled = new axios.CanceledError()
      canceled.apiError = normalizeError(canceled)
      return Promise.reject(canceled)
    }

    error.apiError = normalizeError(error)

    // Errores que ningún formulario sabe interpretar se avisan globalmente.
    // Se puede desactivar por petición con { skipGlobalError: true }.
    const { isNetworkError, isCanceled } = error.apiError
    if (!original?.skipGlobalError && !isCanceled && (isNetworkError || status >= 500)) {
      toast.error(error.apiError.message, { id: 'global-api-error' })
    }

    return Promise.reject(error)
  },
)

export default api
