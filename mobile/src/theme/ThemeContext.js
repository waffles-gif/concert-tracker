import * as SecureStore from 'expo-secure-store'
import PropTypes from 'prop-types'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { darkColors, lightColors } from './index'

const STORAGE_KEY = 'ct_theme'

const ThemeContext = createContext(null)

// Modo claro / oscuro. Si el usuario no eligió nada, se sigue el tema del celular
// (igual que la web, que parte del tema del sistema). La elección se guarda en el celular.
export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme()
  const [choice, setChoice] = useState(null) // 'light' | 'dark' | null (sistema)

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') setChoice(saved)
      })
      .catch(() => {})
  }, [])

  const isDark = (choice ?? systemScheme) === 'dark'

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark'
    setChoice(next)
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {})
  }, [isDark])

  const value = useMemo(
    () => ({ isDark, colors: isDark ? darkColors : lightColors, toggleTheme }),
    [isDark, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return context
}

// Los estilos dependen de los colores: se arman con `makeStyles(colors)` y se recalculan
// solo cuando cambia el tema.
export function useThemedStyles(makeStyles) {
  const { colors } = useTheme()
  return useMemo(() => makeStyles(colors), [makeStyles, colors])
}
