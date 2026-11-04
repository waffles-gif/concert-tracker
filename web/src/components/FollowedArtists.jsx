import { Music2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { useSingleFlight } from '../hooks/useSingleFlight'
import { interactionService } from '../services/interactionService'
import { userService } from '../services/userService'
import { getErrorMessage } from '../utils/apiError'
import { MIN_FOLLOWS } from '../utils/onboarding'
import ArtistCard from './ArtistCard'
import Spinner from './Spinner'

// Artistas que sigue el usuario, con opción de dejar de seguir (sin bajar del mínimo del onboarding)
export default function FollowedArtists() {
  const { isAdmin, updateFollowCount } = useAuth()
  const { data: follows, loading, error, retry } = useFetch('profile-follows', (signal) => userService.follows(signal))
  const [busyId, setBusyId] = useState(null)

  const once = useSingleFlight()

  const handleUnfollow = (artist) =>
    once(async () => {
      setBusyId(artist.id)
      try {
        await interactionService.unfollowArtist(artist.id)
        updateFollowCount(follows.length - 1)
        toast.success(`Dejaste de seguir a ${artist.name}`)
        retry()
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        setBusyId(null)
      }
    })

  // Si dejara de seguir y quedaran menos del mínimo, el onboarding obligatorio lo sacaría de aquí
  const atMinimum = !isAdmin && follows && follows.length <= MIN_FOLLOWS
  const lockedMessage = atMinimum ? `Debes seguir al menos ${MIN_FOLLOWS} artistas` : undefined

  return (
    <section className="mt-10" aria-labelledby="follows-title">
      <h2 id="follows-title" className="mb-1 flex items-center gap-2 text-xl font-bold">
        <Music2 size={20} className="text-indigo-600" aria-hidden="true" /> Artistas que sigues
        {follows && <span className="text-base font-medium text-slate-400">({follows.length})</span>}
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        {atMinimum
          ? `Sigue más artistas para poder dejar de seguir a alguno (el mínimo es ${MIN_FOLLOWS}).`
          : 'Los artistas de los que quieres enterarte.'}
      </p>

      {loading && !follows && <Spinner label="Cargando tus artistas…" />}

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

      {follows && follows.length === 0 && (
        <div className="rounded-xl bg-white p-8 text-center ring-1 ring-slate-200">
          <p className="font-medium">Todavía no sigues a ningún artista</p>
          <Link to="/onboarding" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
            Elegir artistas
          </Link>
        </div>
      )}

      {follows && follows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {follows.map((follow) => (
            <ArtistCard
              key={follow.artistId}
              artist={{ id: follow.artistId, name: follow.name, country: follow.country, imageUrl: follow.imageUrl }}
              followed
              busy={busyId === follow.artistId}
              lockedMessage={lockedMessage}
              onToggle={handleUnfollow}
            />
          ))}
        </div>
      )}
    </section>
  )
}
