import PropTypes from 'prop-types'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { setAuthFailureHandler } from '../services/api'
import { authService } from '../services/authService'
import { tokenStorage } from '../services/tokenStorage'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true mientras se intenta recuperar la sesión guardada en SecureStore al abrir la app
  const [initializing, setInitializing] = useState(true)

  const startSession = useCallback(async (session) => {
    await tokenStorage.setTokens(session)
    setUser(session.user)
    return session.user
  }, [])

  // Si el refresh falla en cualquier request, la app vuelve al login.
  useEffect(() => {
    setAuthFailureHandler(() => setUser(null))
    return () => setAuthFailureHandler(() => {})
  }, [])

  // Al abrir la app: si hay refresh token guardado, se pide una sesión nueva.
  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const refreshToken = await tokenStorage.getRefreshToken()
        if (!refreshToken) return
        const session = await authService.refresh(refreshToken)
        if (active) await startSession(session)
      } catch (error) {
        // Solo se borran los tokens si el backend los rechazó; sin conexión se conservan
        // para intentarlo de nuevo la próxima vez.
        if (!error?.apiError?.isNetworkError) await tokenStorage.clear()
      } finally {
        if (active) setInitializing(false)
      }
    }

    restoreSession()
    return () => {
      active = false
    }
  }, [startSession])

  const login = useCallback(async (credentials) => startSession(await authService.login(credentials)), [startSession])

  const register = useCallback(async (data) => startSession(await authService.register(data)), [startSession])

  const logout = useCallback(async () => {
    await tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      initializing,
      login,
      register,
      logout,
    }),
    [user, initializing, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
