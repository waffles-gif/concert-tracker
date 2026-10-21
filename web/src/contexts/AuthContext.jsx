import PropTypes from 'prop-types'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { setAuthFailureHandler } from '../services/api'
import { authService } from '../services/authService'
import { tokenStore } from '../services/tokenStore'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true mientras se intenta recuperar la sesión con el refresh token guardado
  const [initializing, setInitializing] = useState(() => Boolean(tokenStore.getRefreshToken()))
  const bootstrapped = useRef(false)

  const startSession = useCallback((session) => {
    tokenStore.setTokens(session)
    setUser(session.user)
    return session.user
  }, [])

  useEffect(() => {
    setAuthFailureHandler(() => setUser(null))
    return () => setAuthFailureHandler(() => {})
  }, [])

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    const refreshToken = tokenStore.getRefreshToken()
    if (!refreshToken) return

    authService
      .refresh(refreshToken)
      .then(startSession)
      .catch(() => tokenStore.clear())
      .finally(() => setInitializing(false))
  }, [startSession])

  const login = useCallback(
    async (credentials) => startSession(await authService.login(credentials)),
    [startSession],
  )

  const register = useCallback(
    async (data) => startSession(await authService.register(data)),
    [startSession],
  )

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // Para refrescar los datos del usuario en pantalla después de editar su perfil
  const updateUser = useCallback((nextUser) => setUser(nextUser), [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      initializing,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, initializing, login, register, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
