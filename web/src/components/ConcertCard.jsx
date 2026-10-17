import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import PropTypes from 'prop-types'
import { formatDateTime, formatPrice } from '../utils/format'

export default function ConcertCard({ concert }) {
  return (
    <article className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{concert.artistName}</p>
      <h2 className="mt-1 text-lg font-semibold leading-snug">{concert.title}</h2>

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
          <span>{formatPrice(concert.ticketPrice)}</span>
        </li>
      </ul>
    </article>
  )
}

ConcertCard.propTypes = {
  concert: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.string,
    ticketPrice: PropTypes.number,
    artistName: PropTypes.string,
    venueName: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
  }).isRequired,
}
