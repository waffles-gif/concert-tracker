import PropTypes from 'prop-types'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { setAuthFailureHandler } from '../services/api'
import { authService } from '../services/authService'
import { tokenStore } from '../services/tokenStore'
import { userService } from '../services/userService'
import { MIN_FOLLOWS } from '../utils/onboarding'

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

  // El handler vive más que un render: lee el usuario actual desde una ref
  const userRef = useRef(null)
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    // El refresh falló: la sesión no se puede recuperar. PrivateRoute lleva al login las rutas protegidas.
    setAuthFailureHandler(() => {
      if (userRef.current) toast.error('Tu sesión expiró. Inicia sesión nuevamente.', { id: 'session-expired' })
      setUser(null)
    })
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

  // Onboarding: un usuario (que no sea admin) debe seguir al menos MIN_FOLLOWS artistas.
  // `follows.userId` evita usar el conteo de otro usuario si se cambia de sesión.
  const userId = user?.id
  const isAdmin = user?.role === 'ADMIN'
  const [follows, setFollows] = useState({ userId: null, count: null })

  useEffect(() => {
    if (!userId) return undefined
    let cancelled = false
    userService
      .follows()
      .then((list) => !cancelled && setFollows({ userId, count: list.length }))
      // Si no se puede consultar, no se bloquea al usuario
      .catch(() => !cancelled && setFollows({ userId, count: MIN_FOLLOWS }))
    return () => {
      cancelled = true
    }
  }, [userId])

  const followCount = follows.userId === userId ? follows.count : null
  const updateFollowCount = useCallback((count) => setFollows((prev) => ({ ...prev, count })), [])

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
      followCount,
      updateFollowCount,
      // Hay que llevarlo a /onboarding hasta que siga MIN_FOLLOWS artistas
      needsOnboarding: Boolean(user) && !isAdmin && followCount !== null && followCount < MIN_FOLLOWS,
      // Todavía no sabemos cuántos sigue
      checkingOnboarding: Boolean(user) && !isAdmin && followCount === null,
    }),
    [user, isAdmin, initializing, login, register, logout, updateUser, followCount, updateFollowCount],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
