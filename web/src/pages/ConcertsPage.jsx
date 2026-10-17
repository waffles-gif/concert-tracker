import { Search, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConcertCard from '../components/ConcertCard'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import { useConcerts } from '../hooks/useConcerts'
import { useDebounce } from '../hooks/useDebounce'

const DEFAULT_SORT = 'date,asc'
const DEFAULT_SIZE = 10

const SORT_OPTIONS = [
  { value: 'date,asc', label: 'Fecha: más próximos primero' },
  { value: 'date,desc', label: 'Fecha: más lejanos primero' },
  { value: 'ticketPrice,asc', label: 'Precio: menor a mayor' },
  { value: 'ticketPrice,desc', label: 'Precio: mayor a menor' },
  { value: 'title,asc', label: 'Título: A-Z' },
]

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

const positiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export default function ConcertsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Los filtros viven en la URL: se pueden compartir y sobreviven a recargas.
  const urlText = {
    artist: searchParams.get('artist') ?? '',
    country: searchParams.get('country') ?? '',
    city: searchParams.get('city') ?? '',
  }
  const upcoming = searchParams.get('upcoming') ?? ''
  const sort = searchParams.get('sort') ?? DEFAULT_SORT
  const page = positiveInt(searchParams.get('page'), 1)
  const size = positiveInt(searchParams.get('size'), DEFAULT_SIZE)

  // Los campos de texto se escriben en estado local y se envían a la URL tras 400 ms sin teclear.
  const [text, setText] = useState(urlText)
  const debouncedText = useDebounce(JSON.stringify(text))

  const updateParams = (changes, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value == null) next.delete(key)
      else next.set(key, String(value))
    })
    if (resetPage) next.delete('page')
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    const typed = JSON.parse(debouncedText)
    const changed = Object.keys(typed).some((key) => typed[key].trim() !== urlText[key])
    if (changed) {
      const trimmed = Object.fromEntries(Object.entries(typed).map(([key, value]) => [key, value.trim()]))
      updateParams(trimmed)
    }
    // Solo reacciona al texto ya "debounced"; updateParams/urlText se recalculan en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText])

  const { data, loading, error, retry } = useConcerts({
    artist: urlText.artist || undefined,
    country: urlText.country || undefined,
    city: urlText.city || undefined,
    upcoming: upcoming || undefined,
    sort,
    page: page - 1,
    size,
  })

  const hasFilters = Boolean(urlText.artist || urlText.country || urlText.city || upcoming)

  const clearFilters = () => {
    setText({ artist: '', country: '', city: '' })
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const concerts = data?.content ?? []

  return (
    <section>
      <h1 className="text-2xl font-bold">Conciertos</h1>

      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="mt-4 grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-6"
      >
        <label className="relative sm:col-span-2 lg:col-span-2">
          <span className="sr-only">Buscar por artista</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar artista…"
            value={text.artist}
            onChange={(e) => setText({ ...text, artist: e.target.value })}
            className={`${inputClass} pl-9`}
          />
        </label>

        <label>
          <span className="sr-only">País</span>
          <input
            type="text"
            placeholder="País (ej. Perú)"
            value={text.country}
            onChange={(e) => setText({ ...text, country: e.target.value })}
            className={inputClass}
          />
        </label>

        <label>
          <span className="sr-only">Ciudad</span>
          <input
            type="text"
            placeholder="Ciudad (ej. Lima)"
            value={text.city}
            onChange={(e) => setText({ ...text, city: e.target.value })}
            className={inputClass}
          />
        </label>

        <label>
          <span className="sr-only">Cuándo</span>
          <select value={upcoming} onChange={(e) => updateParams({ upcoming: e.target.value })} className={inputClass}>
            <option value="">Todos</option>
            <option value="true">Próximos</option>
            <option value="false">Ya pasaron</option>
          </select>
        </label>

        <label>
          <span className="sr-only">Ordenar por</span>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value === DEFAULT_SORT ? '' : e.target.value })}
            className={inputClass}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </form>

      <div className="mt-6" aria-live="polite" aria-busy={loading}>
        {loading && !data && <Spinner label="Cargando conciertos…" />}

        {error && (
          <div role="alert" className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {!error && data && concerts.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center ring-1 ring-slate-200">
            <SearchX size={36} className="mx-auto text-slate-400" aria-hidden="true" />
            <p className="mt-3 font-medium">No encontramos conciertos</p>
            <p className="mt-1 text-sm text-slate-500">
              {hasFilters ? 'Prueba con otros filtros o quita los actuales.' : 'Todavía no hay conciertos registrados.'}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {concerts.length > 0 && (
          <div className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-50' : ''}`}>
            {concerts.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>
        )}

        {data && (
          <Pagination
            page={page}
            size={size}
            totalElements={data.totalElements}
            totalPages={data.totalPages}
            onPageChange={(next) => updateParams({ page: next === 1 ? '' : next }, { resetPage: false })}
            onSizeChange={(next) => updateParams({ size: next === DEFAULT_SIZE ? '' : next })}
          />
        )}
      </div>
    </section>
  )
}
