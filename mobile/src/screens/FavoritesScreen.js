import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import PropTypes from 'prop-types'
import { useCallback, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import ConcertCard from '../components/ConcertCard'
import LoadingScreen from '../components/LoadingScreen'
import StateView from '../components/StateView'
import { usePagedList } from '../hooks/usePagedList'
import { interactionService } from '../services/interactionService'
import { userService } from '../services/userService'
import { spacing } from '../theme'
import { useTheme, useThemedStyles } from '../theme/ThemeContext'
import { getErrorMessage } from '../utils/apiError'
import { formatDate } from '../utils/format'

// "Mis conciertos favoritos" (GET /users/me/favorite-concerts), como en el perfil de la web.
export default function FavoritesScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = useThemedStyles(makeStyles)
  const { items, loading, loadingMore, refreshing, error, hasMore, loadMore, refresh, retry } = usePagedList(
    userService.favoriteConcerts,
    {},
  )

  // Al volver del detalle se recarga: puede que hayas quitado o agregado un favorito ahí.
  const firstFocus = useRef(true)
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) firstFocus.current = false
      else refresh()
    }, [refresh]),
  )

  const renderEmpty = () => {
    if (loading) return <LoadingScreen message="Cargando tus favoritos…" />
    if (error) {
      return (
        <StateView
          icon="cloud-offline-outline"
          title="No pudimos cargar tus favoritos"
          message={error}
          actionLabel="Reintentar"
          onAction={retry}
        />
      )
    }
    return (
      <StateView
        icon="heart-outline"
        title="Todavía no tienes favoritos"
        message="Entra al detalle de un concierto y toca el corazón para guardarlo aquí."
        actionLabel="Explorar conciertos"
        onAction={() => navigation.navigate('Tabs', { screen: 'Concerts' })}
      />
    )
  }

  const renderFooter = () => {
    if (loadingMore) return <ActivityIndicator style={styles.footer} color={colors.primary} />
    if (error && items.length > 0) {
      return (
        <Pressable onPress={retry} style={styles.footer} accessibilityRole="button">
          <Text style={styles.footerError}>No se pudo cargar más. Toca para reintentar.</Text>
        </Pressable>
      )
    }
    return null
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => String(item.concert.id)}
      renderItem={({ item }) => (
        <View>
          <ConcertCard
            concert={item.concert}
            markPast
            note={item.addedAt ? `Agregado el ${formatDate(item.addedAt)}` : undefined}
            onPress={() => navigation.navigate('ConcertDetail', { concert: item.concert })}
          />
          <RemoveFavoriteButton concertId={item.concert.id} onRemoved={refresh} />
        </View>
      )}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={0.4}
      refreshing={refreshing}
      onRefresh={refresh}
    />
  )
}

function RemoveFavoriteButton({ concertId, onRemoved }) {
  const { colors } = useTheme()
  const styles = useThemedStyles(makeStyles)
  const [removing, setRemoving] = useState(false)

  const remove = async () => {
    if (removing) return
    setRemoving(true)
    try {
      await interactionService.removeFavorite(concertId)
      Toast.show({ type: 'success', text1: 'Quitado de tus favoritos' })
      onRemoved()
    } catch (err) {
      Toast.show({ type: 'error', text1: 'No se pudo quitar', text2: getErrorMessage(err) })
      setRemoving(false)
    }
  }

  return (
    <Pressable
      onPress={remove}
      disabled={removing}
      style={styles.remove}
      accessibilityRole="button"
      accessibilityLabel="Quitar de favoritos"
    >
      <Ionicons name="heart-dislike-outline" size={16} color={colors.textMuted} />
      <Text style={styles.removeText}>{removing ? 'Quitando…' : 'Quitar'}</Text>
    </Pressable>
  )
}

RemoveFavoriteButton.propTypes = {
  concertId: PropTypes.number.isRequired,
  onRemoved: PropTypes.func.isRequired,
}

const makeStyles = (colors) => StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, flexGrow: 1 },
  remove: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  removeText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  footer: { paddingVertical: spacing.lg, alignItems: 'center' },
  footerError: { color: colors.danger, fontSize: 14 },
})
