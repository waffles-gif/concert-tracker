import { MessageSquareOff } from 'lucide-react'
import PropTypes from 'prop-types'
import { formatDate } from '../utils/format'
import RatingStars from './RatingStars'

export default function ReviewList({ reviews }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center ring-1 ring-slate-200">
        <MessageSquareOff size={32} className="mx-auto text-slate-400" aria-hidden="true" />
        <p className="mt-3 font-medium">Aún no hay reseñas</p>
        <p className="mt-1 text-sm text-slate-500">Cuando alguien que asistió deje su opinión, aparecerá aquí.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{review.userName}</p>
            <RatingStars rating={review.rating} />
          </div>
          {review.comment && <p className="mt-2 text-sm text-slate-700">{review.comment}</p>}
          <p className="mt-2 text-xs text-slate-400">{formatDate(review.createdAt)}</p>
        </li>
      ))}
    </ul>
  )
}

ReviewList.propTypes = {
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      userName: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
      comment: PropTypes.string,
      createdAt: PropTypes.string,
    }),
  ).isRequired,
}
