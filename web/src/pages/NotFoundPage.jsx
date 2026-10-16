import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="py-16 text-center">
      <p className="text-6xl font-bold text-indigo-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 text-slate-600">La dirección que buscas no existe o fue movida.</p>
      <Link to="/" className="mt-6 inline-block font-medium text-indigo-600 hover:underline">
        Volver al inicio
      </Link>
    </section>
  )
}
