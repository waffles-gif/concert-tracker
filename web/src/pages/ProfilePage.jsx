import { Heart, HeartOff, MapPin, Pencil } from 'lucide-react'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import ConcertCard from '../components/ConcertCard'
import FormField from '../components/FormField'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import TextAreaField from '../components/TextAreaField'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { interactionService } from '../services/interactionService'
import { userService } from '../services/userService'
import { getErrorMessage } from '../utils/apiError'
import { formatDate } from '../utils/format'

const MAX_BIO = 300

function EditProfileForm({ user, onSaved, onCancel }) {
  const [serverError, setServerError] = useState(null)
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user.name ?? '',
      country: user.country ?? '',
      city: user.city ?? '',
      bio: user.bio ?? '',
    },
  })
  const bioLength = useWatch({ control, name: 'bio' }).length

  const onSubmit = async (values) => {
    setServerError(null)
    try {
      onSaved(await userService.updateProfile(values))
    } catch (error) {
      setServerError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
      <FormField
        label="Nombre"
        error={errors.name?.message}
        {...register('name', {
          required: 'El nombre es obligatorio',
          maxLength: { value: 100, message: 'El nombre no puede superar los 100 caracteres' },
        })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="País" error={errors.country?.message} {...register('country')} />
        <FormField label="Ciudad" error={errors.city?.message} {...register('city')} />
      </div>
      <TextAreaField
        label="Bio"
        hint={`${bioLength}/${MAX_BIO}`}
        error={errors.bio?.message}
        placeholder="Cuéntanos qué música te mueve, cuál fue tu primer concierto…"
        {...register('bio', { maxLength: { value: MAX_BIO, message: `La bio no puede superar los ${MAX_BIO} caracteres` } })}
      />

      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

EditProfileForm.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    country: PropTypes.string,
    city: PropTypes.string,
    bio: PropTypes.string,
  }).isRequired,
  onSaved: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}

function RemoveFavoriteButton({ concertId, onRemoved }) {
  const [removing, setRemoving] = useState(false)

  const handleClick = async () => {
    setRemoving(true)
    try {
      await interactionService.removeFavorite(concertId)
      toast.success('Quitado de tus favoritos')
      onRemoved()
    } catch (error) {
      toast.error(getErrorMessage(error))
      setRemoving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={removing}
      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 disabled:opacity-60"
    >
      <HeartOff size={14} aria-hidden="true" /> {removing ? 'Quitando…' : 'Quitar'}
    </button>
  )
}

RemoveFavoriteButton.propTypes = {
  concertId: PropTypes.number.isRequired,
  onRemoved: PropTypes.func.isRequired,
}

function FavoriteConcerts() {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(12)
  const { data, loading, error, retry } = useFetch(
    `favorite-concerts:${page}:${size}`,
    (signal) => userService.favoriteConcerts({ page: page - 1, size }, signal),
    { keepPrevious: true },
  )
  const favorites = data?.content ?? []

  // Si se quitó el último de una página, vuelve a la anterior
  const handleRemoved = () => {
    if (favorites.length === 1 && page > 1) setPage(page - 1)
    else retry()
  }

  return (
    <section className="mt-10" aria-labelledby="favorites-title">
      <h2 id="favorites-title" className="mb-1 flex items-center gap-2 text-xl font-bold">
        <Heart size={20} className="fill-rose-500 text-rose-500" aria-hidden="true" /> Mis conciertos favoritos
      </h2>
      <p className="mb-4 text-sm text-slate-500">Los conciertos que guardaste con el corazón.</p>

      {loading && !data && <Spinner label="Cargando tus favoritos…" />}

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 p-6 text-center text-red-700">
          <p>{error.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {data && favorites.length === 0 && (
        <div className="rounded-xl bg-white p-8 text-center ring-1 ring-slate-200">
          <Heart size={32} className="mx-auto text-slate-300" aria-hidden="true" />
          <p className="mt-3 font-medium">Todavía no tienes favoritos</p>
          <p className="mt-1 text-sm text-slate-500">
            Entra al detalle de un concierto y pulsa &ldquo;Agregar a favoritos&rdquo; para guardarlo aquí.
          </p>
          <Link
            to="/conciertos"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Explorar conciertos
          </Link>
        </div>
      )}

      {favorites.length > 0 && (
        <div className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-50' : ''}`}>
          {favorites.map((favorite) => (
            <ConcertCard
              key={favorite.concert.id}
              concert={favorite.concert}
              footer={
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">Agregado el {formatDate(favorite.addedAt)}</span>
                  <RemoveFavoriteButton concertId={favorite.concert.id} onRemoved={handleRemoved} />
                </div>
              }
            />
          ))}
        </div>
      )}

      {data && (
        <Pagination
          page={page}
          size={size}
          totalElements={data.totalElements}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onSizeChange={(next) => {
            setSize(next)
            setPage(1)
          }}
        />
      )}
    </section>
  )
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
  const location = [user.city, user.country].filter(Boolean).join(', ')

  const handleSaved = (updated) => {
    updateUser(updated)
    setEditing(false)
    toast.success('Perfil actualizado')
  }

  return (
    <div>
      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-start gap-4">
          <div
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white"
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
            {location && (
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                <MapPin size={14} aria-hidden="true" /> {location}
              </p>
            )}
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              <Pencil size={14} aria-hidden="true" /> Editar perfil
            </button>
          )}
        </div>

        {editing ? (
          <EditProfileForm user={user} onSaved={handleSaved} onCancel={() => setEditing(false)} />
        ) : (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h2 className="text-sm font-semibold text-slate-500">Sobre mí</h2>
            {user.bio ? (
              <p className="mt-1 whitespace-pre-line text-slate-700">{user.bio}</p>
            ) : (
              <p className="mt-1 text-sm text-slate-400">
                Aún no escribiste tu bio. Pulsa &ldquo;Editar perfil&rdquo; para contar algo sobre ti.
              </p>
            )}
          </div>
        )}
      </section>

      <FavoriteConcerts />
    </div>
  )
}
