import { Link, useLocation } from 'react-router-dom'

const LABELS = {
  conciertos: 'Conciertos',
  artistas: 'Artistas',
  perfil: 'Mi perfil',
  login: 'Iniciar sesión',
  register: 'Registro',
}

export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const crumbs = segments.map((segment, index) => ({
    label: LABELS[segment] ?? `#${decodeURIComponent(segment)}`,
    to: `/${segments.slice(0, index + 1).join('/')}`,
  }))

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link to="/" className="hover:text-indigo-600 hover:underline">
            Inicio
          </Link>
        </li>
        {crumbs.map((crumb, index) => (
          <li key={crumb.to} className="flex items-center gap-1">
            <span aria-hidden="true">/</span>
            {index === crumbs.length - 1 ? (
              <span aria-current="page" className="font-medium text-slate-800">
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.to} className="hover:text-indigo-600 hover:underline">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
