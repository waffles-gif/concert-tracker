import PropTypes from 'prop-types'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { setAuthFailureHandler } from '../services/api'
import { authService } from '../services/authService'
import { tokenStorage } from '../services/tokenStorage'
import { userService } from '../services/userService'
import { isSessionRejected } from '../utils/apiError'
import { MIN_FOLLOWS } from '../utils/onboarding'

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
        // Solo se borran los tokens si el backend los rechazó; sin conexión o con un 5xx
        // se conservan para intentarlo de nuevo la próxima vez.
        if (isSessionRejected(error)) await tokenStorage.clear()
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

  // Para que el perfil editado se vea en toda la app sin volver a iniciar sesión.
  const updateUser = useCallback((nextUser) => setUser(nextUser), [])

  // Onboarding (igual que en la web): al entrar, si un usuario que no es admin sigue menos de
  // MIN_FOLLOWS artistas, primero tiene que elegir géneros y seguir artistas.
  // `onboarding.userId` evita usar el dato de otro usuario si se cambia de sesión.
  const userId = user?.id
  const isAdmin = user?.role === 'ADMIN'
  const [onboarding, setOnboarding] = useState({ userId: null, needed: null })

  useEffect(() => {
    if (!userId) return undefined
    if (isAdmin) {
      setOnboarding({ userId, needed: false })
      return undefined
    }
    let cancelled = false
    userService
      .follows()
      .then((list) => !cancelled && setOnboarding({ userId, needed: list.length < MIN_FOLLOWS }))
      // Si no se puede consultar, no se bloquea al usuario.
      .catch(() => !cancelled && setOnboarding({ userId, needed: false }))
    return () => {
      cancelled = true
    }
  }, [userId, isAdmin])

  const needed = onboarding.userId === userId ? onboarding.needed : null
  const finishOnboarding = useCallback(() => setOnboarding((prev) => ({ ...prev, needed: false })), [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin,
      initializing,
      login,
      register,
      logout,
      updateUser,
      // Todavía no sabemos cuántos artistas sigue
      checkingOnboarding: Boolean(user) && needed === null,
      needsOnboarding: Boolean(user) && needed === true,
      finishOnboarding,
    }),
    [user, isAdmin, initializing, login, register, logout, updateUser, needed, finishOnboarding],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
