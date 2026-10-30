import { useCallback, useEffect, useState } from 'react'
import Toast from 'react-native-toast-message'
import { interactionService } from '../services/interactionService'
import { userService } from '../services/userService'
import { getErrorMessage } from '../utils/apiError'

// Estado del usuario frente a un concierto (asistencia, reseña, favorito) y si sigue al artista.
// Cada acción llama al backend y solo cambia la pantalla si salió bien.
export function useConcertInteractions(concertId, artistId) {
  const [status, setStatus] = useState(null) // { attendanceStatus, reviewed, favorite }
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null) // acción que se está enviando: evita tocar dos veces

  const load = useCallback(
    async (signal) => {
      if (!concertId) return
      setLoading(true)
      setError(null)
      try {
        const [concertStatus, follows] = await Promise.all([
          interactionService.concertStatus(concertId, signal),
          artistId ? userService.follows() : Promise.resolve([]),
        ])
        setStatus(concertStatus)
        setFollowing(follows.some((follow) => follow.artistId === artistId))
      } catch (err) {
        if (err?.apiError?.isCanceled || signal?.aborted) return
        setError(getErrorMessage(err))
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [concertId, artistId],
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const run = useCallback(
    async (name, action, successMessage) => {
      if (busy) return
      setBusy(name)
      try {
        await action()
        Toast.show({ type: 'success', text1: successMessage })
      } catch (err) {
        // Sin conexión y errores 5xx ya los avisa el interceptor global de axios.
        const { isNetworkError, status: code } = err?.apiError ?? {}
        if (!isNetworkError && !(code >= 500)) {
          Toast.show({ type: 'error', text1: 'No se pudo completar', text2: getErrorMessage(err) })
        }
      } finally {
        setBusy(null)
      }
    },
    [busy],
  )

  const markAttendance = (attendanceStatus) =>
    run(
      'attendance',
      async () => {
        await interactionService.setAttendance(concertId, attendanceStatus)
        setStatus((prev) => ({ ...prev, attendanceStatus }))
      },
      attendanceStatus === 'YA_FUI' ? 'Marcaste que ya fuiste' : 'Marcaste que vas a ir',
    )

  const toggleFavorite = () => {
    const isFavorite = status?.favorite
    return run(
      'favorite',
      async () => {
        if (isFavorite) await interactionService.removeFavorite(concertId)
        else await interactionService.addFavorite(concertId)
        setStatus((prev) => ({ ...prev, favorite: !isFavorite }))
      },
      isFavorite ? 'Quitado de favoritos' : 'Guardado en favoritos',
    )
  }

  const toggleFollow = () =>
    run(
      'follow',
      async () => {
        if (following) await interactionService.unfollowArtist(artistId)
        else await interactionService.followArtist(artistId)
        setFollowing(!following)
      },
      following ? 'Dejaste de seguir al artista' : 'Ahora sigues al artista',
    )

  // El formulario de reseña muestra sus propios errores, por eso aquí no se atrapan.
  const submitReview = async ({ rating, comment }) => {
    await interactionService.createReview({ concertId, rating, comment })
    setStatus((prev) => ({ ...prev, reviewed: true }))
    Toast.show({ type: 'success', text1: '¡Gracias por tu reseña!' })
  }

  return {
    status,
    following,
    loading,
    error,
    busy,
    retry: () => load(),
    markAttendance,
    toggleFavorite,
    toggleFollow,
    submitReview,
  }
}
