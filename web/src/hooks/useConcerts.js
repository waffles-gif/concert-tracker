import { useEffect, useState } from 'react'
import { concertService } from '../services/concertService'

// Carga conciertos según `params`; cancela la petición anterior si los parámetros cambian.
// `loading` se deriva de comparar la petición actual con la última respuesta recibida.
export function useConcerts(params) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ requestId: null, data: null, error: null })
  const key = JSON.stringify(params)
  const requestId = `${attempt}:${key}`

  useEffect(() => {
    const controller = new AbortController()

    concertService
      .search(JSON.parse(key), controller.signal)
      .then((data) => setResult({ requestId, data, error: null }))
      .catch((error) => {
        if (error.apiError?.isCanceled) return
        setResult((prev) => ({
          requestId,
          data: prev.data,
          error: error.apiError?.message ?? 'No pudimos cargar los conciertos.',
        }))
      })

    return () => controller.abort()
  }, [key, requestId])

  const loading = result.requestId !== requestId
  return {
    data: result.data,
    loading,
    error: loading ? null : result.error,
    retry: () => setAttempt((n) => n + 1),
  }
}
