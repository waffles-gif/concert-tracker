import { Music } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-indigo-600'
  }`

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-indigo-600">
          <Music size={22} aria-hidden="true" />
          Concert Tracker
        </Link>

        <nav aria-label="Principal" className="flex flex-wrap items-center gap-1">
          <NavLink to="/conciertos" className={linkClass}>
            Conciertos
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/perfil" className={linkClass}>
                {user.name}
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:text-red-600"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Iniciar sesión
              </NavLink>
              <Link
                to="/register"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Registrarme
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
