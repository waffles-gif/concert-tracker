import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useRef, useState } from 'react'
import { getErrorMessage } from '../utils/apiError'

const PAGE_SIZE = 10

const initialState = {
  items: [],
  page: -1,
  totalPages: 0,
  loading: true,
  loadingMore: false,
  refreshing: false,
  error: null,
}

// Lista paginada del historial con scroll infinito. `fetcher(params, signal)` tiene que ser estable.
// Se recarga al volver a la pantalla: si marcaste "Ya fui" o dejaste una reseña en el detalle,
// el historial aparece actualizado sin tener que deslizar hacia abajo.
export function usePagedHistory(fetcher) {
  const [state, setState] = useState(initialState)
  const controllerRef = useRef(null)
  const loadedRef = useRef(false)

  const fetchPage = useCallback(
    async (page, mode) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setState((prev) => ({
        ...prev,
        loading: mode === 'initial',
        loadingMore: mode === 'more',
        refreshing: mode === 'refresh',
        error: null,
      }))

      try {
        const data = await fetcher({ page, size: PAGE_SIZE }, controller.signal)
        loadedRef.current = true
        setState((prev) => ({
          items: page === 0 ? data.content : [...prev.items, ...data.content],
          page: data.page,
          totalPages: data.totalPages,
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
    [fetcher],
  )

  useFocusEffect(
    useCallback(() => {
      // La primera vez se ve el spinner; al volver se actualiza sin tapar la lista.
      fetchPage(0, loadedRef.current ? 'silent' : 'initial')
      return () => controllerRef.current?.abort()
    }, [fetchPage]),
  )

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

  return { ...state, loadMore, refresh, retry }
}
