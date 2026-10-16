import axios from 'axios'
import toast from 'react-hot-toast'
import { normalizeError } from '../utils/apiError'
import { tokenStore } from './tokenStore'

const API_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/v1`

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

// Cliente sin interceptores para pedir el refresh (evita bucles infinitos).
const bareClient = axios.create({ baseURL: API_URL, timeout: 15000 })

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

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken()
  if (token && !isAuthEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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
        tokenStore.clear()
        onAuthFailure()
      }
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
