import { Suspense } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Breadcrumbs from './Breadcrumbs'
import ErrorBoundary from './ErrorBoundary'
import Navbar from './Navbar'
import Spinner from './Spinner'

export default function Layout() {
  const { needsOnboarding, checkingOnboarding } = useAuth()
  const { pathname } = useLocation()

  // Mientras se averigua cuántos artistas sigue, no se muestra nada para no parpadear la pantalla equivocada
  if (checkingOnboarding) return <Spinner label="Preparando tu cuenta…" />

  // Onboarding obligatorio: sin MIN_FOLLOWS artistas seguidos solo se puede estar en /onboarding
  if (needsOnboarding && pathname !== '/onboarding') return <Navigate to="/onboarding" replace />

  return (
    <div className="flex min-h-screen flex-col">
      {/* Solo se ve al navegar con Tab: permite saltar el menú e ir directo al contenido */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none">
        <Breadcrumbs />
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Concert Tracker
      </footer>
    </div>
  )
}
