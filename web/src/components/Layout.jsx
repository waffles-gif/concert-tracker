import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Breadcrumbs from './Breadcrumbs'
import Navbar from './Navbar'
import Spinner from './Spinner'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Breadcrumbs />
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Concert Tracker · CS2031 Desarrollo Basado en Plataformas
      </footer>
    </div>
  )
}
