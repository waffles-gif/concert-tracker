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
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Breadcrumbs />
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Concert Tracker
      </footer>
    </div>
  )
}
