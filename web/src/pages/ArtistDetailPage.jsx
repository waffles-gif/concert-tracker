import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConcertCard from '../components/ConcertCard'
import Spinner from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { artistService } from '../services/artistService'

const TABS = [
  { id: 'proximos', label: 'Próximos', empty: 'Este artista no tiene conciertos próximos por ahora.' },
  { id: 'pasados', label: 'Ya ocurrieron', empty: 'Todavía no hay conciertos pasados de este artista.' },
]

const byDateAsc = (a, b) => new Date(a.date) - new Date(b.date)
const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date)

export default function ArtistDetailPage() {
  const { id } = useParams()
  const [selectedTab, setSelectedTab] = useState(null)

  const artistState = useFetch(`artist:${id}`, (signal) => artistService.getById(id, signal))
  const concertsState = useFetch(`artist-concerts:${id}`, (signal) => artistService.concerts(id, signal))

  if (artistState.loading) return <Spinner label="Cargando artista…" />

  if (artistState.error) {
    const notFound = artistState.error.status === 404
    return (
      <div role="alert" className="rounded-xl bg-white p-10 text-center ring-1 ring-slate-200">
        <p className="font-medium">{notFound ? 'No encontramos a este artista' : artistState.error.message}</p>
        <div className="mt-4 flex justify-center gap-3">
          {!notFound && (
            <button
              type="button"
              onClick={artistState.retry}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Reintentar
            </button>
          )}
          <Link to="/artistas" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
            Ver todos los artistas
          </Link>
        </div>
      </div>
    )
  }

  const artist = artistState.data
  const genres = artist.genres ?? []

  // Próximos: el más cercano primero. Pasados: el más reciente primero.
  const now = new Date()
  const concerts = concertsState.data ?? []
  const lists = {
    proximos: concerts.filter((concert) => new Date(concert.date) >= now).sort(byDateAsc),
    pasados: concerts.filter((concert) => new Date(concert.date) < now).sort(byDateDesc),
  }
  // Si no eligió pestaña, se abre la de próximos; si no hay ninguno, la de pasados
  const activeTab = selectedTab ?? (lists.proximos.length === 0 && lists.pasados.length > 0 ? 'pasados' : 'proximos')
  const activeList = lists[activeTab]
  // Ya cargó y no hay ningún concierto (ni próximo ni pasado): se muestra un solo mensaje, sin pestañas
  const hasNoConcerts = Boolean(concertsState.data) && concerts.length === 0

  return (
    <article>
      <Link to="/artistas" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={16} aria-hidden="true" /> Volver a artistas
      </Link>

      <header className="mt-3 flex items-center gap-4">
        {artist.imageUrl ? (
          <img src={artist.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-full bg-slate-100 object-cover" />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-600"
          >
            {artist.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">{artist.name}</h1>
          {artist.country && <p className="text-sm text-slate-500">{artist.country}</p>}
          {genres.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {genres.map((genre) => (
                <li key={genre.id} className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-700">
                  {genre.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {artist.description && <p className="mt-4 max-w-3xl text-sm text-slate-600">{artist.description}</p>}

      <section className="mt-8" aria-labelledby="artist-concerts-title">
        <h2 id="artist-concerts-title" className="mb-3 text-xl font-bold">
          Conciertos
        </h2>

        {concertsState.loading && !concertsState.data && <Spinner label="Cargando conciertos…" />}

        {concertsState.error && !concertsState.data && (
          <div role="alert" className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            <p>{concertsState.error.message}</p>
            <button
              type="button"
              onClick={concertsState.retry}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {hasNoConcerts && (
          <div className="rounded-xl bg-white p-8 text-center ring-1 ring-slate-200">
            <p className="font-medium">Todavía no hay conciertos registrados de {artist.name}</p>
            <p className="mt-1 text-sm text-slate-500">Cuando haya alguno, aparecerá aquí.</p>
            <Link to="/conciertos" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
              Ver todos los conciertos
            </Link>
          </div>
        )}

        {concerts.length > 0 && (
          <>
            <div role="tablist" aria-label="Conciertos del artista" className="mb-4 flex gap-2">
              {TABS.map((tab) => {
                const selected = tab.id === activeTab
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls="artist-concerts-panel"
                    onClick={() => setSelectedTab(tab.id)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      selected
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1.5 opacity-80">({lists[tab.id].length})</span>
                  </button>
                )
              })}
            </div>

            <div id="artist-concerts-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
              {activeList.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center ring-1 ring-slate-200">
                  <p className="font-medium">{TABS.find((tab) => tab.id === activeTab).empty}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeList.map((concert) => (
                    <ConcertCard key={concert.id} concert={concert} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </article>
  )
}
