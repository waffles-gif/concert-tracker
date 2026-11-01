import { useCallback, useEffect, useRef, useState } from 'react'
import { concertService } from '../services/concertService'
import { getErrorMessage } from '../utils/apiError'

const REVIEWS_PAGE_SIZE = 5

// Detalle de un concierto (GET /concerts/{id}) y sus reseñas paginadas (GET /concerts/{id}/reviews).
// Si fallan las reseñas el detalle se sigue mostrando: cada parte tiene su propio error y reintento.
export function useConcertDetail(concertId) {
  const [concert, setConcert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const [reviews, setReviews] = useState({ items: [], page: -1, totalPages: 0, totalElements: 0 })
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState(null)

  const controllerRef = useRef(null)

  const fetchReviews = useCallback(
    async (page, signal) => {
      setReviewsLoading(true)
      setReviewsError(null)
      try {
        const data = await concertService.reviews(concertId, { page, size: REVIEWS_PAGE_SIZE }, signal)
        setReviews((prev) => ({
          items: page === 0 ? data.content : [...prev.items, ...data.content],
          page: data.page,
          totalPages: data.totalPages,
          totalElements: data.totalElements,
        }))
      } catch (err) {
        if (err?.apiError?.isCanceled || signal?.aborted) return
        setReviewsError(getErrorMessage(err))
      } finally {
        if (!signal?.aborted) setReviewsLoading(false)
      }
    },
    [concertId],
  )

  const load = useCallback(
    async (mode) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      if (mode === 'refresh') setRefreshing(true)
      else setLoading(true)
      setError(null)

      try {
        const [detail] = await Promise.all([
          concertService.findById(concertId, controller.signal),
          fetchReviews(0, controller.signal),
        ])
        setConcert(detail)
      } catch (err) {
        if (err?.apiError?.isCanceled || controller.signal.aborted) return
        setError(getErrorMessage(err))
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [concertId, fetchReviews],
  )

  useEffect(() => {
    load('initial')
    return () => controllerRef.current?.abort()
  }, [load])

  const hasMoreReviews = reviews.page + 1 < reviews.totalPages

  const loadMoreReviews = useCallback(() => {
    if (hasMoreReviews && !reviewsLoading) fetchReviews(reviews.page + 1)
  }, [hasMoreReviews, reviewsLoading, reviews.page, fetchReviews])

  // Reintenta la página de reseñas que falló (la primera o la siguiente).
  const retryReviews = useCallback(() => fetchReviews(reviews.page + 1), [reviews.page, fetchReviews])

  return {
    concert,
    loading,
    refreshing,
    error,
    retry: () => load('initial'),
    refresh: () => load('refresh'),
    reviews: reviews.items,
    reviewsTotal: reviews.totalElements,
    reviewsLoading,
    reviewsError,
    hasMoreReviews,
    loadMoreReviews,
    retryReviews,
    // Vuelve a la primera página de reseñas (por ejemplo, después de publicar una).
    reloadReviews: () => fetchReviews(0),
  }
}
