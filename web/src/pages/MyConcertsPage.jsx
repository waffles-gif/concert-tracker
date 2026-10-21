import { CalendarCheck, CheckCircle2, MessageSquare } from 'lucide-react'
import PropTypes from 'prop-types'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ConcertCard from '../components/ConcertCard'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { interactionService } from '../services/interactionService'
import { getErrorMessage } from '../utils/apiError'

// Cada pestaña se corresponde con un estado de asistencia del backend.
// "Voy a ir": los más próximos primero. "Ya fui": los más recientes primero.
const TABS = {
  voy: { label: 'Voy a ir', status: 'VOY_A_IR', sort: 'concert.date,asc', Icon: CalendarCheck },
  fui: { label: 'Ya fui', status: 'YA_FUI', sort: 'concert.date,desc', Icon: CheckCircle2 },
}

const EMPTY_MESSAGES = {
  voy: 'Aún no marcaste ningún concierto como "Voy a ir".',
  fui: 'Aún no marcaste ningún concierto como "Ya fui".',
}

const positiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function ReviewStatus({ item }) {
  if (item.reviewed) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <MessageSquare size={14} aria-hidden="true" /> Ya dejaste tu reseña
      </span>
    )
  }
  return (
    <Link to={`/conciertos/${item.concert.id}`} className="font-medium text-indigo-600 hover:underline">
      Deja tu reseña
    </Link>
  )
}

// Un concierto que quedó en "Voy a ir" pero ya pasó: se pregunta si fue y, si sí, se lleva al detalle
// para que pueda dejar su reseña.
function PastConcertPrompt({ item }) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const handleClick = async () => {
    setSaving(true)
    try {
      await interactionService.setAttendance(item.concert.id, 'YA_FUI')
      toast.success('¡Marcado como "Ya fui"! Ya puedes dejar tu reseña.')
      navigate(`/conciertos/${item.concert.id}`)
    } catch (error) {
      toast.error(getErrorMessage(error))
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-slate-500">Este concierto ya pasó. ¿Fuiste?</span>
      <button
        type="button"
        onClick={handleClick}
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? 'Guardando…' : 'Sí, ya fui'}
      </button>
    </div>
  )
}

PastConcertPrompt.propTypes = {
  item: PropTypes.shape({
    concert: PropTypes.shape({ id: PropTypes.number.isRequired }).isRequired,
  }).isRequired,
}

const hasPassed = (item) => new Date(item.concert.date) < new Date()

ReviewStatus.propTypes = {
  item: PropTypes.shape({
    status: PropTypes.string.isRequired,
    reviewed: PropTypes.bool.isRequired,
    concert: PropTypes.shape({ id: PropTypes.number.isRequired }).isRequired,
  }).isRequired,
}

function renderFooter(item) {
  if (item.status === 'YA_FUI') return <ReviewStatus item={item} />
  return hasPassed(item) ? <PastConcertPrompt item={item} /> : null
}

export default function MyConcertsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Pestaña, página y tamaño viven en la URL (se pueden compartir y sobreviven a recargas).
  const tabKey = searchParams.get('estado') === 'fui' ? 'fui' : 'voy'
  const tab = TABS[tabKey]
  const page = positiveInt(searchParams.get('page'), 1)
  const size = positiveInt(searchParams.get('size'), 10)

  const { data, loading, error, retry } = useFetch(
    `my-concerts:${tabKey}:${page}:${size}`,
    (signal) =>
      interactionService.myConcerts({ status: tab.status, sort: tab.sort, page: page - 1, size }, signal),
    { keepPrevious: true },
  )

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value == null) next.delete(key)
      else next.set(key, String(value))
    })
    setSearchParams(next, { replace: true })
  }

  const items = data?.content ?? []

  return (
    <section>
      <h1 className="text-2xl font-bold">Mis conciertos</h1>
      <p className="mt-1 text-sm text-slate-500">Los conciertos a los que irás y a los que ya fuiste.</p>

      <div role="tablist" aria-label="Estado de asistencia" className="mt-5 flex gap-2 border-b border-slate-200">
        {Object.entries(TABS).map(([key, { label, Icon }]) => {
          const active = key === tabKey
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => updateParams({ estado: key === 'voy' ? '' : key, page: '' })}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>

      <div className="mt-6" role="tabpanel" aria-live="polite" aria-busy={loading}>
        {loading && !data && <Spinner label="Cargando tus conciertos…" />}

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

        {!error && data && items.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center ring-1 ring-slate-200">
            <tab.Icon size={36} className="mx-auto text-slate-400" aria-hidden="true" />
            <p className="mt-3 font-medium">{EMPTY_MESSAGES[tabKey]}</p>
            <Link
              to="/conciertos"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Explorar conciertos
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-50' : ''}`}>
            {items.map((item) => (
              <ConcertCard
                key={item.attendanceId}
                concert={item.concert}
                footer={renderFooter(item)}
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
            onPageChange={(next) => updateParams({ page: next === 1 ? '' : next })}
            onSizeChange={(next) => updateParams({ size: next === 10 ? '' : next, page: '' })}
          />
        )}
      </div>
    </section>
  )
}
