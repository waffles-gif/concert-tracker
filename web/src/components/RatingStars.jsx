import { Star } from 'lucide-react'
import PropTypes from 'prop-types'

export default function RatingStars({ rating, size = 16 }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          aria-hidden="true"
          className={value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
    </span>
  )
}

RatingStars.propTypes = {
  rating: PropTypes.number.isRequired,
  size: PropTypes.number,
}
