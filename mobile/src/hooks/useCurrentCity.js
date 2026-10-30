import * as Location from 'expo-location'
import { useCallback, useState } from 'react'
import { concertService } from '../services/concertService'

// Error con un mensaje pensado para mostrarse tal cual al usuario.
class LocationError extends Error {}

// "Provincia de Lima" -> "Lima", "Departamento de Arequipa" -> "Arequipa".
const ADMIN_PREFIX = /^(provincia( constitucional)?|departamento|regi[oó]n|distrito|municipalidad metropolitana|estado|comuna)\s+(de(l)?\s+)?/i

const cleanName = (name) => name?.replace(ADMIN_PREFIX, '').replace(/\s+metropolitana$/i, '').trim() || null

// Nombres del lugar, del más chico al más grande. En Lima el GPS devuelve el distrito como
// "city" (San Isidro, Miraflores...), pero en el backend los venues están en "Lima".
function placeCandidates(place) {
  const names = [place?.city, place?.subregion, place?.region].map(cleanName).filter(Boolean)
  return [...new Set(names)]
}

// Pide permiso de ubicación, toma la posición del GPS y busca el nombre de ciudad que use el
// filtro `city` de GET /concerts/search: el primero de los candidatos que tenga conciertos.
export function useCurrentCity() {
  const [locating, setLocating] = useState(false)

  // Devuelve la ciudad o lanza un Error con un mensaje listo para mostrar.
  const locate = useCallback(async () => {
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        throw new LocationError('Necesitamos permiso de ubicación para buscar conciertos cerca de ti.')
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        throw new LocationError('Activa la ubicación (GPS) de tu celular e inténtalo otra vez.')
      }

      // La última posición conocida sale al instante; si no hay, pedimos una nueva.
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }))

      const [place] = await Location.reverseGeocodeAsync(position.coords)
      const candidates = placeCandidates(place)
      if (candidates.length === 0) throw new LocationError('No pudimos saber en qué ciudad estás.')

      for (const name of candidates) {
        const page = await concertService.search({ city: name, size: 1 })
        if (page.totalElements > 0) return name
      }
      // Ninguno tiene conciertos: devolvemos el más general para el mensaje de "no hay".
      return candidates[candidates.length - 1]
    } catch (error) {
      if (error instanceof LocationError) throw error
      throw new LocationError('No pudimos obtener tu ubicación. Inténtalo otra vez.')
    } finally {
      setLocating(false)
    }
  }, [])

  return { locating, locate }
}
