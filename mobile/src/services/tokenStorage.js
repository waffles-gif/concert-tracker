import * as SecureStore from 'expo-secure-store'

// Los tokens se guardan cifrados con expo-secure-store (Keychain en iOS, Keystore en Android).
// Nunca en AsyncStorage, que es texto plano.
// Se mantiene una copia en memoria para no leer el almacenamiento seguro en cada request.
const ACCESS_KEY = 'ct_access_token'
const REFRESH_KEY = 'ct_refresh_token'

let cache = { accessToken: null, refreshToken: null, loaded: false }

async function load() {
  if (cache.loaded) return cache
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ])
    cache = { accessToken, refreshToken, loaded: true }
  } catch {
    // Si el almacenamiento seguro falla, se sigue sin sesión guardada.
    cache = { accessToken: null, refreshToken: null, loaded: true }
  }
  return cache
}

export const tokenStorage = {
  async getAccessToken() {
    return (await load()).accessToken
  },

  async getRefreshToken() {
    return (await load()).refreshToken
  },

  async setTokens({ accessToken, refreshToken }) {
    cache = {
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? cache.refreshToken,
      loaded: true,
    }
    await Promise.all([
      accessToken ? SecureStore.setItemAsync(ACCESS_KEY, accessToken) : SecureStore.deleteItemAsync(ACCESS_KEY),
      refreshToken ? SecureStore.setItemAsync(REFRESH_KEY, refreshToken) : Promise.resolve(),
    ])
  },

  async clear() {
    cache = { accessToken: null, refreshToken: null, loaded: true }
    await Promise.all([SecureStore.deleteItemAsync(ACCESS_KEY), SecureStore.deleteItemAsync(REFRESH_KEY)])
  },
}
