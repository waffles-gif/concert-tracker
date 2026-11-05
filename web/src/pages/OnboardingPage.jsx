import { ArrowLeft, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import ArtistCard from '../components/ArtistCard'
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

const ARTISTS_PER_GENRE = 12

// Trae los artistas de cada género elegido y los junta sin repetir
async function fetchArtists(genreIds, signal) {
  const pages = await Promise.all(
    genreIds.map((id) => artistService.byGenre(id, { size: ARTISTS_PER_GENRE }, signal)),
  )
  const unique = new Map()
  pages.flatMap((page) => page.content).forEach((artist) => unique.set(artist.id, artist))
  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export default function OnboardingPage() {
  const { user, updateFollowCount } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedGenres, setSelectedGenres] = useState([])
  const [overrides, setOverrides] = useState({}) // { [artistId]: true | false } cambios hechos en esta pantalla
  const [busyId, setBusyId] = useState(null)

  const genresState = useFetch('genres', (signal) => genreService.list(signal))
  const followsState = useFetch('my-follows', (signal) => userService.follows(signal))
  const artistsState = useFetch(
    `onboarding-artists:${selectedGenres.join(',')}`,
    (signal) => fetchArtists(selectedGenres, signal),
    { enabled: step === 2 && selectedGenres.length > 0 },
  )

  // Artistas seguidos = los que ya seguía + los cambios de esta pantalla
  const followedIds = new Set((followsState.data ?? []).map((follow) => follow.artistId))
  Object.entries(overrides).forEach(([id, value]) => (value ? followedIds.add(Number(id)) : followedIds.delete(Number(id))))
  const followedCount = followedIds.size
  const remaining = Math.max(MIN_FOLLOWS - followedCount, 0)

  const toggleGenre = (id) =>
    setSelectedGenres((current) => (current.includes(id) ? current.filter((g) => g !== id) : [...current, id]))

  const once = useSingleFlight()

  const toggleFollow = (artist) =>
    once(async () => {
      const willFollow = !followedIds.has(artist.id)
      setBusyId(artist.id)
      try {
        if (willFollow) await interactionService.followArtist(artist.id)
        else await interactionService.unfollowArtist(artist.id)
        setOverrides((current) => ({ ...current, [artist.id]: willFollow }))
        updateFollowCount(followedCount + (willFollow ? 1 : -1))
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setBusyId(null)
      }
    })

  const finish = () => {
    toast.success('¡Todo listo! Ya puedes explorar conciertos.', { id: 'onboarding-done' })
    navigate('/', { replace: true })
  }

  if (genresState.loading || followsState.loading) return <Spinner label="Cargando…" />

  const loadError = genresState.error ?? followsState.error
  if (loadError) {
    return (
      <div role="alert" className="mx-auto max-w-md rounded-xl bg-red-50 p-6 text-center text-red-700">
        <p>{loadError.message}</p>
        <button
          type="button"
          onClick={() => {
            genresState.retry()
            followsState.retry()
          }}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold text-indigo-600">Paso {step} de 2</p>
      <h1 className="mt-1 text-3xl font-bold">¡Hola, {user.name.split(' ')[0]}! Armemos tu música</h1>

      {step === 1 && (
        <div className="mt-6">
          <p className="text-slate-600">Elige los géneros que te gustan y te mostramos artistas para seguir.</p>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Géneros">
            {genresState.data.map((genre) => {
              const selected = selectedGenres.includes(genre.id)
              return (
                <li key={genre.id}>
                  <button
                    type="button"
                    onClick={() => toggleGenre(genre.id)}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    {selected && <Check size={14} aria-hidden="true" />}
                    {genre.name}
                  </button>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={selectedGenres.length === 0}
            className="mt-8 rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ver artistas
          </button>
          {selectedGenres.length === 0 && <p className="mt-2 text-xs text-slate-500">Elige al menos un género.</p>}
        </div>
      )}

      {step === 2 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Cambiar géneros
          </button>

          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="font-medium" aria-live="polite">
              {remaining > 0
                ? `Sigue al menos ${MIN_FOLLOWS} artistas: te faltan ${remaining}`
                : `¡Listo! Sigues a ${followedCount} ${followedCount === 1 ? 'artista' : 'artistas'}`}
            </p>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={MIN_FOLLOWS}
              aria-valuenow={Math.min(followedCount, MIN_FOLLOWS)}
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className="h-full bg-indigo-600 transition-all"
                style={{ width: `${(Math.min(followedCount, MIN_FOLLOWS) / MIN_FOLLOWS) * 100}%` }}
              />
            </div>
          </div>

          {artistsState.loading && <Spinner label="Buscando artistas…" />}

          {artistsState.error && (
            <div role="alert" className="mt-4 rounded-xl bg-red-50 p-6 text-center text-red-700">
              <p>{artistsState.error.message}</p>
              <button
                type="button"
                onClick={artistsState.retry}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {artistsState.data && artistsState.data.length === 0 && (
            <p className="mt-6 rounded-xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200">
              Todavía no tenemos artistas de esos géneros. Prueba con otros.
            </p>
          )}

          {artistsState.data && artistsState.data.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {artistsState.data.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  followed={followedIds.has(artist.id)}
                  busy={busyId === artist.id}
                  onToggle={toggleFollow}
                />
              ))}
            </div>
          )}

          <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/90 py-4 backdrop-blur">
            <p className="text-sm text-slate-500">
              {followedCount} de {MIN_FOLLOWS} artistas seguidos
            </p>
            <button
              type="button"
              onClick={finish}
              disabled={remaining > 0}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Terminar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
