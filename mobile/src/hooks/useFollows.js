import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useRef, useState } from 'react'
import Toast from 'react-native-toast-message'
import { interactionService } from '../services/interactionService'
import { userService } from '../services/userService'
import { getErrorMessage } from '../utils/apiError'

// Artistas que sigue el usuario + seguir / dejar de seguir.
// Se recarga cada vez que la pantalla vuelve a estar visible (puede que hayas seguido a alguien desde otro lado).
export function useFollows({ toast = true } = {}) {
  const [follows, setFollows] = useState(null) // lista de GET /users/me/follows; null mientras carga
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const busyRef = useRef(false)

  const reload = useCallback(async () => {
    try {
      setFollows(await userService.follows())
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
      setFollows((current) => current ?? [])
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      reload()
    }, [reload]),
  )

  const followedIds = new Set((follows ?? []).map((follow) => follow.artistId))

  // `artist` puede venir de /artists ({ id, name, ... }) o de /users/me/follows ({ artistId, name, ... }).
  const toggle = async (artist) => {
    const id = artist.id ?? artist.artistId
    if (busyRef.current || !follows) return
    busyRef.current = true
    setBusyId(id)
    const willFollow = !followedIds.has(id)
    try {
      if (willFollow) await interactionService.followArtist(id)
      else await interactionService.unfollowArtist(id)
      setFollows((current) =>
        willFollow
          ? [{ artistId: id, name: artist.name, country: artist.country, imageUrl: artist.imageUrl }, ...current]
          : current.filter((follow) => follow.artistId !== id),
      )
      if (toast) {
        Toast.show({
          type: 'success',
          text1: willFollow ? `Ahora sigues a ${artist.name}` : `Dejaste de seguir a ${artist.name}`,
        })
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'No se pudo actualizar', text2: getErrorMessage(err) })
    } finally {
      busyRef.current = false
      setBusyId(null)
    }
  }

  return { follows, followedIds, count: followedIds.size, loading: follows === null, error, busyId, toggle, reload }
}
