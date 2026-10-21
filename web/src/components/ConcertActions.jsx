import { CheckCircle2 } from 'lucide-react'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { interactionService } from '../services/interactionService'
import AttendanceButtons from './AttendanceButtons'
import FavoriteButton from './FavoriteButton'
import ReviewForm from './ReviewForm'

// Lo que el usuario puede hacer con un concierto: marcar asistencia y, si ya fue, dejar su reseña (opcional).
// Se monta con key={concertId} para que su estado no se mezcle entre conciertos.
export default function ConcertActions({ concertId, isPast, onReviewSaved }) {
  const { user, isAuthenticated, initializing } = useAuth()
  const location = useLocation()
  const [attendance, setAttendance] = useState(null)
  const [reviewed, setReviewed] = useState(false)
  const [formDismissed, setFormDismissed] = useState(false)
  const [favoriteOverride, setFavoriteOverride] = useState(null)

  const { data: interaction } = useFetch(
    `interaction:${concertId}:${user?.id}`,
    (signal) => interactionService.concertInteraction(concertId, signal),
    { enabled: isAuthenticated },
  )

  if (initializing) return null

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-slate-600">
        <Link to="/login" state={{ from: location }} className="font-medium text-indigo-600 hover:underline">
          Inicia sesión
        </Link>{' '}
        para marcar tu asistencia, guardar favoritos y dejar tu reseña.
      </p>
    )
  }

  const status = attendance ?? interaction?.attendanceStatus ?? null
  const hasReview = reviewed || Boolean(interaction?.reviewed)
  const favorite = favoriteOverride ?? Boolean(interaction?.favorite)
  const canReview = status === 'YA_FUI' && !hasReview

  const handleReviewSaved = () => {
    setReviewed(true)
    onReviewSaved()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <AttendanceButtons concertId={concertId} isPast={isPast} status={status} onChange={setAttendance} />
        <FavoriteButton concertId={concertId} favorite={favorite} onChange={setFavoriteOverride} />
      </div>

      {canReview && !formDismissed && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <h3 className="font-semibold">¿Quieres dejar tu reseña?</h3>
          <p className="mb-4 text-sm text-slate-500">Es opcional, puedes hacerlo ahora o más tarde.</p>
          <ReviewForm concertId={concertId} onSaved={handleReviewSaved} onCancel={() => setFormDismissed(true)} />
        </div>
      )}

      {canReview && formDismissed && (
        <button
          type="button"
          onClick={() => setFormDismissed(false)}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Dejar mi reseña
        </button>
      )}

      {hasReview && (
        <p className="inline-flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 size={16} aria-hidden="true" /> Ya dejaste tu reseña de este concierto.
        </p>
      )}
    </div>
  )
}

ConcertActions.propTypes = {
  concertId: PropTypes.number.isRequired,
  isPast: PropTypes.bool.isRequired,
  onReviewSaved: PropTypes.func.isRequired,
}
