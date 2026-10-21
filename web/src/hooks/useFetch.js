import { useEffect, useRef, useState } from 'react'

// Ejecuta `fetcher(signal)` cada vez que cambia `key` y cancela la petición anterior (AbortController).
// `key` identifica la petición (por ejemplo `concert:5`); `fetcher` puede cambiar en cada render.
// Con `keepPrevious` conserva los datos anteriores mientras llegan los nuevos (útil al paginar).
export function useFetch(key, fetcher, { enabled = true, keepPrevious = false } = {}) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ requestId: null, data: null, error: null })
  const fetcherRef = useRef(fetcher)
  const requestId = `${attempt}:${key}`

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    if (!enabled) return undefined
    const controller = new AbortController()

    fetcherRef
      .current(controller.signal)
      .then((data) => setResult({ requestId, data, error: null }))
      .catch((error) => {
        if (error.apiError?.isCanceled) return
        setResult((prev) => ({
          requestId,
          data: prev.data,
          error: error.apiError ?? { status: null, message: 'No pudimos cargar la información.' },
        }))
      })

    return () => controller.abort()
  }, [requestId, enabled])

  const current = result.requestId === requestId
  const loading = enabled && !current

  return {
    data: current || keepPrevious ? result.data : null,
    loading,
    error: current ? result.error : null,
    retry: () => setAttempt((n) => n + 1),
  }
}
