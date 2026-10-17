import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <section>
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <dl className="mt-4 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="font-medium text-slate-500">Nombre</dt>
        <dd>{user.name}</dd>
        <dt className="font-medium text-slate-500">Email</dt>
        <dd>{user.email}</dd>
        <dt className="font-medium text-slate-500">Ubicación</dt>
        <dd>{[user.city, user.country].filter(Boolean).join(', ') || '—'}</dd>
      </dl>
    </section>
  )
}
