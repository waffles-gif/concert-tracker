import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

// Botón para alternar entre modo claro y oscuro
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  )
}
