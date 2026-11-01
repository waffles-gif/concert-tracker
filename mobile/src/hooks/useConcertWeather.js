import { useCallback, useEffect, useRef, useState } from 'react'
import { weatherService } from '../services/weatherService'

// Clima del día del concierto en la ciudad del venue (Open-Meteo).
// Si falla no rompe el detalle: solo se muestra el error con su botón de reintentar.
export function useConcertWeather(venue, date) {
  const city = venue?.city
  const country = venue?.country
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const controllerRef = useRef(null)

  const load = useCallback(async () => {
    if (!city || !date) return
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setError(null)
    try {
      setWeather(await weatherService.forDay({ city, country, date }, controller.signal))
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || controller.signal.aborted) return
      setError(err?.response ? 'El servicio del clima no respondió.' : 'No pudimos cargar el clima. Revisa tu conexión.')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [city, country, date])

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [load])

  return { weather, loading, error, retry: load }
}
