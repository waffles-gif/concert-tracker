import { lazy } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'

const DashboardPage = lazy(() => import('./DashboardPage'))

function Landing() {
  return (
    <section className="py-12 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Todos tus conciertos en un solo lugar</h1>
      <p className="mx-auto mt-4 max-w-xl text-slate-600">
        Descubre próximos shows, registra a cuáles asististe y escribe reseñas de tus artistas favoritos.
      </p>
      <Link
        to="/conciertos"
        className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
      >
        Explorar conciertos
      </Link>
    </section>
  )
}

// Inicio: con sesión es el dashboard personal; sin sesión, la portada
export default function HomePage() {
  const { isAuthenticated, initializing } = useAuth()

  if (initializing) return <Spinner />
  return isAuthenticated ? <DashboardPage /> : <Landing />
}
