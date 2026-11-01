import { MessageSquareText } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { userService } from '../services/userService'
import { formatDate } from '../utils/format'
import Pagination from './Pagination'
import RatingStars from './RatingStars'
import Spinner from './Spinner'

// Reseñas que dejó el usuario, paginadas
export default function MyReviews() {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const { data, loading, error, retry } = useFetch(
    `profile-reviews:${page}:${size}`,
    (signal) => userService.reviews({ page: page - 1, size }, signal),
    { keepPrevious: true },
  )
  const reviews = data?.content ?? []

  return (
    <section className="mt-10" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="mb-1 flex items-center gap-2 text-xl font-bold">
        <MessageSquareText size={20} className="text-indigo-600" aria-hidden="true" /> Mis reseñas
        {data && <span className="text-base font-medium text-slate-400">({data.totalElements})</span>}
      </h2>
      <p className="mb-4 text-sm text-slate-500">Las opiniones que dejaste de los conciertos a los que fuiste.</p>

      {loading && !data && <Spinner label="Cargando tus reseñas…" />}

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

      {data && reviews.length === 0 && (
        <div className="rounded-xl bg-white p-8 text-center ring-1 ring-slate-200">
          <p className="font-medium">Todavía no dejaste ninguna reseña</p>
          <p className="mt-1 text-sm text-slate-500">Marca &ldquo;Ya fui&rdquo; en un concierto y cuéntanos cómo estuvo.</p>
          <Link
            to="/mis-conciertos?estado=fui"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Ver mis conciertos
          </Link>
        </div>
      )}

      {reviews.length > 0 && (
        <ul className={`space-y-3 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/conciertos/${review.concertId}`}
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    {review.concertTitle}
                  </Link>
                  {review.artistName && <p className="text-xs text-slate-500">{review.artistName}</p>}
                </div>
                <RatingStars rating={review.rating} />
              </div>
              {review.comment && <p className="mt-2 text-sm text-slate-700">{review.comment}</p>}
              <p className="mt-2 text-xs text-slate-400">{formatDate(review.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}

      {data && (
        <Pagination
          page={page}
          size={size}
          totalElements={data.totalElements}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onSizeChange={(next) => {
            setSize(next)
            setPage(1)
          }}
        />
      )}
    </section>
  )
}
