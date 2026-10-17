// El access token vive solo en memoria (se pierde al recargar y se recupera con el refresh token).
// El refresh token se guarda en sessionStorage para sobrevivir a recargas de la pestaña.
const REFRESH_KEY = 'ct_refresh_token'

let accessToken = null

export const tokenStore = {
  getAccessToken: () => accessToken,

  getRefreshToken() {
    try {
      return sessionStorage.getItem(REFRESH_KEY)
    } catch {
      return null
    }
  },

  setTokens({ accessToken: access, refreshToken }) {
    accessToken = access ?? null
    try {
      if (refreshToken) sessionStorage.setItem(REFRESH_KEY, refreshToken)
    } catch {
      // sessionStorage no disponible: la sesión durará hasta recargar
    }
  },

  clear() {
    accessToken = null
    try {
      sessionStorage.removeItem(REFRESH_KEY)
    } catch {
      // nada que limpiar
    }
  },
}
