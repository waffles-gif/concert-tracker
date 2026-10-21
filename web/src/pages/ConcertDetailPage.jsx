import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Ticket, Users } from 'lucide-react'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConcertActions from '../components/ConcertActions'
import DemoBadge from '../components/DemoBadge'
import Pagination from '../components/Pagination'
import ReviewList from '../components/ReviewList'
import Spinner from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { concertService } from '../services/concertService'
import { formatDateTime, formatPrice } from '../utils/format'

function InfoRow({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}

InfoRow.propTypes = {
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired,
}

export default function ConcertDetailPage() {
  const { id } = useParams()
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewSize, setReviewSize] = useState(10)

  const concertState = useFetch(`concert:${id}`, (signal) => concertService.getById(id, signal))
  const reviewsState = useFetch(
    `reviews:${id}:${reviewPage}:${reviewSize}`,
    (signal) => concertService.getReviews(id, { page: reviewPage - 1, size: reviewSize }, signal),
    { keepPrevious: true },
  )

  if (concertState.loading) return <Spinner label="Cargando concierto…" />

  if (concertState.error) {
    const notFound = concertState.error.status === 404
    return (
      <div role="alert" className="rounded-xl bg-white p-10 text-center ring-1 ring-slate-200">
        <p className="font-medium">{notFound ? 'No encontramos este concierto' : concertState.error.message}</p>
        <div className="mt-4 flex justify-center gap-3">
          {!notFound && (
            <button
              type="button"
              onClick={concertState.retry}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Reintentar
            </button>
          )}
          <Link to="/conciertos" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
            Ver todos los conciertos
          </Link>
        </div>
      </div>
    )
  }

  const concert = concertState.data
  const { artist, venue } = concert
  const zones = concert.zones ?? []
  const isPast = new Date(concert.date) < new Date()
  const reviews = reviewsState.data

  return (
    <article>
      <Link to="/conciertos" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={16} aria-hidden="true" /> Volver a conciertos
      </Link>

      <header className="mt-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{artist.name}</p>
        <h1 className="mt-1 text-3xl font-bold">{concert.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {isPast && (
            <span className="inline-block rounded-full bg-slate-200 px-3 py-0.5 text-xs font-medium text-slate-600">
              Ya ocurrió
            </span>
          )}
          {concert.demo && <DemoBadge />}
        </div>
        {concert.demo && (
          <p className="mt-2 text-sm text-amber-700">
            Este es un concierto de ejemplo: sus fechas, precios y zonas son ficticios.
          </p>
        )}
      </header>

      {concert.imageUrl && (
        <img
          src={concert.imageUrl}
          alt={`Imagen de ${concert.title}`}
          className="mt-4 h-56 w-full rounded-xl bg-slate-100 object-cover sm:h-72"
        />
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <ul className="space-y-3 text-slate-700">
            <InfoRow icon={CalendarDays}>{formatDateTime(concert.date)}</InfoRow>
            <InfoRow icon={MapPin}>
              <strong>{venue.name}</strong>
              <br />
              <span className="text-sm text-slate-500">
                {[venue.address, venue.city, venue.country].filter(Boolean).join(', ')}
              </span>
            </InfoRow>
            {venue.capacity != null && (
              <InfoRow icon={Users}>Capacidad: {venue.capacity.toLocaleString('es-PE')} personas</InfoRow>
            )}
            <InfoRow icon={Ticket}>
              {zones.length > 0 ? <>Desde {formatPrice(concert.ticketPrice)}</> : formatPrice(concert.ticketPrice)}
            </InfoRow>
          </ul>

          {zones.length > 0 && (
            <div className="border-t border-slate-100 pt-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-500">Entradas por zona</h2>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg ring-1 ring-slate-200">
                {zones.map((zone, index) => (
                  <li key={zone.id} className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 text-sm">
                    <span className="font-medium">
                      {zone.name}
                      {index === 0 && (
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Más económica
                        </span>
                      )}
                    </span>
                    <span className="font-semibold tabular-nums">{formatPrice(zone.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {concert.ticketUrl && (
            <div className="border-t border-slate-100 pt-5">
              <a
                href={concert.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Comprar entradas <ExternalLink size={16} aria-hidden="true" />
              </a>
              <p className="mt-2 text-xs text-slate-400">
                Se abre la página oficial de venta, donde ves los precios y zonas actualizados.
              </p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-500">Tu asistencia</h2>
            <ConcertActions
              key={concert.id}
              concertId={concert.id}
              isPast={isPast}
              onReviewSaved={() => {
                setReviewPage(1)
                reviewsState.retry()
              }}
            />
          </div>
        </section>

        <aside className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-sm font-semibold text-slate-500">Sobre el artista</h2>
          <p className="mt-2 text-lg font-semibold">{artist.name}</p>
          {artist.country && <p className="text-sm text-slate-500">{artist.country}</p>}
          {artist.genres.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {artist.genres.map((genre) => (
                <li key={genre.id} className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-700">
                  {genre.name}
                </li>
              ))}
            </ul>
          )}
          {artist.description && <p className="mt-3 text-sm text-slate-600">{artist.description}</p>}
        </aside>
      </div>

      <section className="mt-10" aria-labelledby="reviews-title">
        <h2 id="reviews-title" className="mb-4 text-xl font-bold">
          Reseñas{reviews ? ` (${reviews.totalElements})` : ''}
        </h2>

        {reviewsState.error && (
          <div role="alert" className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            <p>{reviewsState.error.message}</p>
            <button
              type="button"
              onClick={reviewsState.retry}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {!reviews && !reviewsState.error && <Spinner label="Cargando reseñas…" />}

        {reviews && (
          <div className={reviewsState.loading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
            <ReviewList reviews={reviews.content} />
            <Pagination
              page={reviewPage}
              size={reviewSize}
              totalElements={reviews.totalElements}
              totalPages={reviews.totalPages}
              onPageChange={setReviewPage}
              onSizeChange={(next) => {
                setReviewSize(next)
                setReviewPage(1)
              }}
            />
          </div>
        )}
      </section>
    </article>
  )
}
