import { useCallback, useState } from 'react'

const STORAGE_KEY = 'ct_theme'

// El tema inicial lo aplica el script de index.html (clase "dark" en <html>); aquí solo se lee y se cambia.
export function useTheme() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleTheme = useCallback(() => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    setIsDark(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      // sin almacenamiento: el cambio dura hasta recargar
    }
  }, [])

  return { isDark, toggleTheme }
}
