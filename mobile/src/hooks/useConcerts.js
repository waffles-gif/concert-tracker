import { useCallback, useEffect, useRef, useState } from 'react'
import { concertService } from '../services/concertService'
import { getErrorMessage } from '../utils/apiError'

const PAGE_SIZE = 10

const initialState = {
  items: [],
  page: -1,
  totalPages: 0,
  totalElements: 0,
  loading: true, // primera página
  loadingMore: false, // páginas siguientes (scroll infinito)
  refreshing: false, // pull-to-refresh
  error: null,
}

// Lista de conciertos con scroll infinito sobre GET /concerts/search (respuesta paginada).
// Si cambian los filtros se cancela la petición anterior y se empieza desde la página 0.
export function useConcerts(filters) {
  const [state, setState] = useState(initialState)
  const controllerRef = useRef(null)
  const key = JSON.stringify(filters)

  const fetchPage = useCallback(
    async (page, mode) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setState((prev) => ({
        ...(page === 0 && mode === 'initial' ? initialState : prev),
        loading: mode === 'initial',
        loadingMore: mode === 'more',
        refreshing: mode === 'refresh',
        error: null,
      }))

      try {
        const data = await concertService.search(
          { ...JSON.parse(key), page, size: PAGE_SIZE },
          controller.signal,
        )
        setState((prev) => ({
          items: page === 0 ? data.content : [...prev.items, ...data.content],
          page: data.page,
          totalPages: data.totalPages,
          totalElements: data.totalElements,
          loading: false,
          loadingMore: false,
          refreshing: false,
          error: null,
        }))
      } catch (error) {
        if (error?.apiError?.isCanceled || controller.signal.aborted) return
        setState((prev) => ({
          ...prev,
          loading: false,
          loadingMore: false,
          refreshing: false,
          error: getErrorMessage(error),
        }))
      }
    },
    [key],
  )

  useEffect(() => {
    fetchPage(0, 'initial')
    return () => controllerRef.current?.abort()
  }, [fetchPage])

  const hasMore = state.page + 1 < state.totalPages
  const busy = state.loading || state.loadingMore || state.refreshing

  const loadMore = useCallback(() => {
    if (hasMore && !busy && !state.error) fetchPage(state.page + 1, 'more')
  }, [hasMore, busy, state.error, state.page, fetchPage])

  const refresh = useCallback(() => fetchPage(0, 'refresh'), [fetchPage])

  // Reintenta lo que falló: la primera página o la siguiente.
  const retry = useCallback(() => {
    if (state.items.length === 0) fetchPage(0, 'initial')
    else fetchPage(state.page + 1, 'more')
  }, [state.items.length, state.page, fetchPage])

  return { ...state, hasMore, loadMore, refresh, retry }
}
