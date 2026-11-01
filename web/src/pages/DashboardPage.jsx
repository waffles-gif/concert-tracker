import { CalendarCheck, CheckCircle2, Heart, MessageSquareText, Users } from 'lucide-react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import ConcertCard from '../components/ConcertCard'
import RatingStars from '../components/RatingStars'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { concertService } from '../services/concertService'
import { interactionService } from '../services/interactionService'
import { reviewService } from '../services/reviewService'
import { userService } from '../services/userService'
import { formatDate } from '../utils/format'

function StatTile({ icon: Icon, label, value, to, loading }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span>
        <span className="block text-2xl font-bold leading-none">{loading ? '–' : value}</span>
        <span className="text-sm text-slate-500">{label}</span>
      </span>
    </Link>
  )
}

StatTile.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  to: PropTypes.string.isRequired,
  loading: PropTypes.bool,
}

// Encabezado de sección con enlace opcional "Ver todos"
function SectionTitle({ id, title, to, linkLabel = 'Ver todos' }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-lg font-bold">
        {title}
      </h2>
      {to && (
        <Link to={to} className="text-sm font-medium text-indigo-600 hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

SectionTitle.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string.isRequired,
  to: PropTypes.string,
  linkLabel: PropTypes.string,
}

function SectionError({ error, onRetry }) {
  return (
    <div role="alert" className="rounded-xl bg-red-50 p-5 text-center text-sm text-red-700">
      <p>{error.message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
      >
        Reintentar
      </button>
    </div>
  )
}

SectionError.propTypes = {
  error: PropTypes.shape({ message: PropTypes.string }).isRequired,
  onRetry: PropTypes.func.isRequired,
}

export default function DashboardPage() {
  const { user } = useAuth()

  // Mis próximos conciertos ("Voy a ir"), también sirve para el conteo
  const going = useFetch('dash-going', (signal) =>
    interactionService.myConcerts({ status: 'VOY_A_IR', upcoming: true, sort: 'concert.date,asc', size: 3 }, signal),
  )
  const attended = useFetch('dash-attended', (signal) =>
    interactionService.myConcerts({ status: 'YA_FUI', size: 1 }, signal),
  )
  const favorites = useFetch('dash-favorites', (signal) => userService.favoriteConcerts({ size: 1 }, signal))
  const follows = useFetch('dash-follows', (signal) => userService.follows(signal))
  // Próximos conciertos de toda la plataforma
  const upcoming = useFetch('dash-upcoming', (signal) =>
    concertService.search({ upcoming: true, sort: 'date,asc', size: 6 }, signal),
  )
  const activity = useFetch('dash-activity', (signal) => reviewService.recent({ size: 6 }, signal))

  return (
    <div>
      <h1 className="text-3xl font-bold">Hola, {user.name.split(' ')[0]} 👋</h1>
      <p className="mt-1 text-slate-500">Esto es lo que pasa en tu música.</p>

      <section aria-label="Resumen personal" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={CalendarCheck}
          label="Voy a ir"
          value={going.data?.totalElements}
          loading={going.loading}
          to="/mis-conciertos"
        />
        <StatTile
          icon={CheckCircle2}
          label="Ya fui"
          value={attended.data?.totalElements}
          loading={attended.loading}
          to="/mis-conciertos?estado=fui"
        />
        <StatTile
          icon={Heart}
          label="Favoritos"
          value={favorites.data?.totalElements}
          loading={favorites.loading}
          to="/perfil"
        />
        <StatTile
          icon={Users}
          label="Artistas que sigues"
          value={follows.data?.length}
          loading={follows.loading}
          to="/perfil"
        />
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section aria-labelledby="going-title">
            <SectionTitle id="going-title" title="Tus próximos conciertos" to="/mis-conciertos" />
            {going.loading && <Spinner label="Cargando…" />}
            {going.error && <SectionError error={going.error} onRetry={going.retry} />}
            {going.data && going.data.content.length === 0 && (
              <div className="rounded-xl bg-white p-8 text-center ring-1 ring-slate-200">
                <p className="font-medium">Aún no marcaste ningún concierto como &ldquo;Voy a ir&rdquo;</p>
                <p className="mt-1 text-sm text-slate-500">Explora los próximos shows y guarda los que te interesan.</p>
                <Link
                  to="/conciertos"
                  className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Explorar conciertos
                </Link>
              </div>
            )}
            {going.data && going.data.content.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {going.data.content.map((item) => (
                  <ConcertCard key={item.attendanceId} concert={item.concert} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="upcoming-title">
            <SectionTitle id="upcoming-title" title="Próximos en Lima" to="/conciertos" linkLabel="Ver todos los conciertos" />
            {upcoming.loading && <Spinner label="Cargando…" />}
            {upcoming.error && <SectionError error={upcoming.error} onRetry={upcoming.retry} />}
            {upcoming.data && upcoming.data.content.length === 0 && (
              <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
                No hay conciertos próximos por ahora.
              </p>
            )}
            {upcoming.data && upcoming.data.content.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {upcoming.data.content.map((concert) => (
                  <ConcertCard key={concert.id} concert={concert} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside aria-labelledby="activity-title">
          <SectionTitle id="activity-title" title="Actividad reciente" />
          {activity.loading && <Spinner label="Cargando…" />}
          {activity.error && <SectionError error={activity.error} onRetry={activity.retry} />}
          {activity.data && activity.data.content.length === 0 && (
            <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
              Todavía no hay reseñas. ¡Sé el primero en dejar una!
            </p>
          )}
          {activity.data && activity.data.content.length > 0 && (
            <ul className="space-y-3">
              {activity.data.content.map((review) => (
                <li key={review.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-start gap-2">
                    <MessageSquareText size={16} className="mt-0.5 shrink-0 text-indigo-500" aria-hidden="true" />
                    <p className="text-sm">
                      <strong>{review.userName}</strong> reseñó{' '}
                      <Link to={`/conciertos/${review.concertId}`} className="font-medium text-indigo-600 hover:underline">
                        {review.concertTitle}
                      </Link>
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <RatingStars rating={review.rating} size={14} />
                    <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.comment && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{review.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
