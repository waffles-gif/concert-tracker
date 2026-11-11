import { SearchX } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import ArtistCard from '../components/ArtistCard'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { useSingleFlight } from '../hooks/useSingleFlight'
import { artistService } from '../services/artistService'
import { genreService } from '../services/genreService'
import { interactionService } from '../services/interactionService'
import { userService } from '../services/userService'
import { getErrorMessage } from '../utils/apiError'
import { MIN_FOLLOWS } from '../utils/onboarding'

const DEFAULT_SIZE = 10

const positiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export default function ArtistsPage() {
  const { isAuthenticated, isAdmin, updateFollowCount } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [overrides, setOverrides] = useState({}) // { [artistId]: true | false } cambios hechos en esta pantalla
  const [busyId, setBusyId] = useState(null)
  const [pendingUnfollow, setPendingUnfollow] = useState(null)

  // Género, página y tamaño viven en la URL (se pueden compartir y sobreviven a recargas)
  const genreId = searchParams.get('genero') ?? ''
  const page = positiveInt(searchParams.get('page'), 1)
  const size = positiveInt(searchParams.get('size'), DEFAULT_SIZE)

  const genres = useFetch('genres', (signal) => genreService.list(signal))
  const artists = useFetch(
    `artists:${genreId}:${page}:${size}`,
    (signal) => artistService.list({ genreId: genreId || undefined, page: page - 1, size }, signal),
    { keepPrevious: true },
  )
  const follows = useFetch('artists-follows', (signal) => userService.follows(signal), { enabled: isAuthenticated })

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value == null) next.delete(key)
      else next.set(key, String(value))
    })
    setSearchParams(next, { replace: true })
  }

  // Artistas seguidos = los que ya seguía + los cambios hechos en esta pantalla
  const followedIds = new Set((follows.data ?? []).map((follow) => follow.artistId))
  Object.entries(overrides).forEach(([id, value]) => (value ? followedIds.add(Number(id)) : followedIds.delete(Number(id))))
  const followedCount = followedIds.size
  // Mismo mínimo que el onboarding: no se puede bajar de MIN_FOLLOWS artistas seguidos
  const lockedMessage = !isAdmin && followedCount <= MIN_FOLLOWS ? `Debes seguir al menos ${MIN_FOLLOWS} artistas` : undefined

  const once = useSingleFlight()

  const toggleFollow = (artist) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return undefined
    }
    return once(async () => {
      const willFollow = !followedIds.has(artist.id)
      setBusyId(artist.id)
      try {
        if (willFollow) await interactionService.followArtist(artist.id)
        else await interactionService.unfollowArtist(artist.id)
        setOverrides((current) => ({ ...current, [artist.id]: willFollow }))
        updateFollowCount(followedCount + (willFollow ? 1 : -1))
        toast.success(willFollow ? `Ahora sigues a ${artist.name}` : `Dejaste de seguir a ${artist.name}`)
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setBusyId(null)
      }
    })
  }

  // Seguir es inmediato; dejar de seguir pide confirmación
  const handleToggle = (artist) => {
    if (isAuthenticated && followedIds.has(artist.id)) setPendingUnfollow(artist)
    else toggleFollow(artist)
  }

  const items = artists.data?.content ?? []
  const waitingFollows = isAuthenticated && follows.loading

  return (
    <section>
      <h1 className="text-2xl font-bold">Artistas</h1>
      <p className="mt-1 text-sm text-slate-500">Sigue a tus artistas favoritos para enterarte de sus conciertos.</p>

      <div className="mt-4 max-w-xs">
        <label className="block text-sm font-medium text-slate-700" htmlFor="genre-filter">
          Género
        </label>
        <select
          id="genre-filter"
          value={genreId}
          onChange={(e) => updateParams({ genero: e.target.value, page: '' })}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">Todos los géneros</option>
          {(genres.data ?? []).map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6" aria-live="polite" aria-busy={artists.loading}>
        {artists.loading && !artists.data && <Spinner label="Cargando artistas…" />}

        {artists.error && (
          <div role="alert" className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            <p>{artists.error.message}</p>
            <button
              type="button"
              onClick={artists.retry}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {!artists.error && artists.data && items.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center ring-1 ring-slate-200">
            <SearchX size={36} className="mx-auto text-slate-400" aria-hidden="true" />
            <p className="mt-3 font-medium">No hay artistas de ese género todavía</p>
            <button
              type="button"
              onClick={() => updateParams({ genero: '', page: '' })}
              className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Ver todos los géneros
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className={`grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${artists.loading ? 'opacity-50' : ''}`}>
            {items.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                followed={isAuthenticated && followedIds.has(artist.id)}
                busy={waitingFollows || busyId === artist.id}
                lockedMessage={isAuthenticated ? lockedMessage : undefined}
                onToggle={handleToggle}
                linkTo={`/artistas/${artist.id}`}
              />
            ))}
          </div>
        )}

        {artists.data && (
          <Pagination
            page={page}
            size={size}
            totalElements={artists.data.totalElements}
            totalPages={artists.data.totalPages}
            onPageChange={(next) => updateParams({ page: next === 1 ? '' : next })}
            onSizeChange={(next) => updateParams({ size: next === DEFAULT_SIZE ? '' : next, page: '' })}
          />
        )}
      </div>

      <ConfirmDialog
        open={pendingUnfollow !== null}
        title={`¿Dejar de seguir a ${pendingUnfollow?.name ?? ''}?`}
        message="Ya no lo verás entre los artistas que sigues. Puedes volver a seguirlo cuando quieras."
        confirmLabel="Dejar de seguir"
        onCancel={() => setPendingUnfollow(null)}
        onConfirm={() => {
          const artist = pendingUnfollow
          setPendingUnfollow(null)
          toggleFollow(artist)
        }}
      />
    </section>
  )
}
