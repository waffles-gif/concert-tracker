import * as Location from 'expo-location'
import { useCallback, useState } from 'react'
import { concertService } from '../services/concertService'
import { useAuth } from './useAuth'

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
// Devuelve la ciudad o lanza un LocationError con un mensaje listo para mostrar.
async function locateWithGps() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      throw new LocationError('No diste permiso de ubicación.')
    }
    if (!(await Location.hasServicesEnabledAsync())) {
      throw new LocationError('La ubicación (GPS) de tu celular está apagada.')
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
    throw new LocationError('No pudimos obtener tu ubicación.')
  }
}

// "Cerca de mí". Fallback: si el GPS no está disponible (sin permiso, apagado o sin señal),
// se usa la ciudad que el usuario puso en su perfil.
export function useCurrentCity() {
  const { user } = useAuth()
  const [locating, setLocating] = useState(false)

  // Devuelve { city, fromProfile, reason } o lanza un Error si tampoco hay ciudad en el perfil.
  const locate = useCallback(async () => {
    setLocating(true)
    try {
      return { city: await locateWithGps(), fromProfile: false }
    } catch (error) {
      const profileCity = cleanName(user?.city)
      if (!profileCity) {
        throw new LocationError(`${error.message} Activa la ubicación o agrega tu ciudad en tu perfil.`)
      }
      return { city: profileCity, fromProfile: true, reason: error.message }
    } finally {
      setLocating(false)
    }
  }, [user?.city])

  return { locating, locate }
}
