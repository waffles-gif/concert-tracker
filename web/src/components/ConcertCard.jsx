import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { formatDateTime, formatPrice } from '../utils/format'
import DemoBadge from './DemoBadge'

export default function ConcertCard({ concert, footer = null }) {
  const hasPrice = concert.ticketPrice != null

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md focus-within:ring-2 focus-within:ring-indigo-400">
      {concert.imageUrl && (
        <img src={concert.imageUrl} alt="" loading="lazy" className="h-36 w-full bg-slate-100 object-cover" />
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{concert.artistName}</p>
          {concert.demo && <DemoBadge />}
        </div>
        <h2 className="mt-1 text-lg font-semibold leading-snug">
          {/* El enlace cubre toda la tarjeta (after:absolute) para que sea clicable completa */}
          <Link to={`/conciertos/${concert.id}`} className="outline-none after:absolute after:inset-0">
            {concert.title}
          </Link>
        </h2>

        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <CalendarDays size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{formatDateTime(concert.date)}</span>
          </li>
          <li className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              {concert.venueName} · {concert.city}, {concert.country}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Ticket size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{hasPrice ? `Desde ${formatPrice(concert.ticketPrice)}` : formatPrice(concert.ticketPrice)}</span>
          </li>
        </ul>

        {footer && <div className="relative mt-4 border-t border-slate-100 pt-3 text-sm">{footer}</div>}
      </div>
    </article>
  )
}

ConcertCard.propTypes = {
  footer: PropTypes.node,
  concert: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.string,
    ticketPrice: PropTypes.number,
    imageUrl: PropTypes.string,
    demo: PropTypes.bool,
    artistName: PropTypes.string,
    venueName: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
  }).isRequired,
}
