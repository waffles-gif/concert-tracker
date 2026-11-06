import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { useNavigation } from '@react-navigation/native'
import PropTypes from 'prop-types'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text } from 'react-native'
import ConcertCard from '../components/ConcertCard'
import LoadingScreen from '../components/LoadingScreen'
import ReviewItem from '../components/ReviewItem'
import StateView from '../components/StateView'
import { usePagedHistory } from '../hooks/usePagedHistory'
import { interactionService } from '../services/interactionService'
import { userService } from '../services/userService'
import { colors, spacing } from '../theme'

const TopTab = createMaterialTopTabNavigator()

// Definidos fuera de los componentes para que usePagedHistory reciba siempre la misma función.
// Lo próximo primero en "Voy a ir" y lo más reciente primero en "Ya fui".
const fetchGoing = (params, signal) =>
  interactionService.myConcerts({ ...params, status: 'VOY_A_IR', sort: 'concert.date,asc' }, signal)
const fetchAttended = (params, signal) =>
  interactionService.myConcerts({ ...params, status: 'YA_FUI', sort: 'concert.date,desc' }, signal)

// Parte común de las tres pestañas: scroll infinito, pull-to-refresh y estados de carga, vacío y error.
function HistoryList({ list, keyExtractor, renderItem, emptyIcon, emptyTitle, emptyMessage }) {
  const { items, loading, loadingMore, refreshing, error, loadMore, refresh, retry } = list

  if (loading && items.length === 0) return <LoadingScreen message="Cargando tu historial…" />

  const renderEmpty = () =>
    error ? (
      <StateView
        icon="cloud-offline-outline"
        title="No pudimos cargar tu historial"
        message={error}
        actionLabel="Reintentar"
        onAction={retry}
      />
    ) : (
      <StateView icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
    )

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
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshing={refreshing}
      onRefresh={refresh}
    />
  )
}

HistoryList.propTypes = {
  list: PropTypes.shape({ items: PropTypes.array.isRequired }).isRequired,
  keyExtractor: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
  emptyIcon: PropTypes.string.isRequired,
  emptyTitle: PropTypes.string.isRequired,
  emptyMessage: PropTypes.string.isRequired,
}

function GoingTab() {
  const navigation = useNavigation()
  const list = usePagedHistory(fetchGoing)

  return (
    <HistoryList
      list={list}
      keyExtractor={(item) => String(item.attendanceId)}
      renderItem={({ item }) => (
        <ConcertCard
          concert={item.concert}
          note={new Date(item.concert.date) < new Date() ? 'Ya pasó: entra y marca "Ya fui"' : undefined}
          onPress={() => navigation.navigate('ConcertDetail', { concert: item.concert })}
        />
      )}
      emptyIcon="calendar-outline"
      emptyTitle="Aún no tienes planes"
      emptyMessage={'Marca "Voy a ir" en un concierto y aparecerá aquí.'}
    />
  )
}

function AttendedTab() {
  const navigation = useNavigation()
  const list = usePagedHistory(fetchAttended)

  return (
    <HistoryList
      list={list}
      keyExtractor={(item) => String(item.attendanceId)}
      renderItem={({ item }) => (
        <ConcertCard
          concert={item.concert}
          note={item.reviewed ? 'Ya dejaste tu reseña' : 'Te falta dejar tu reseña'}
          onPress={() => navigation.navigate('ConcertDetail', { concert: item.concert })}
        />
      )}
      emptyIcon="checkmark-circle-outline"
      emptyTitle="Aún no has marcado conciertos"
      emptyMessage={'Cuando marques "Ya fui" en un concierto aparecerá aquí.'}
    />
  )
}

function ReviewsTab() {
  const navigation = useNavigation()
  const list = usePagedHistory(userService.reviews)

  return (
    <HistoryList
      list={list}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate('ConcertDetail', { concert: { id: item.concertId } })}
          accessibilityRole="button"
        >
          <ReviewItem review={item} showConcert />
        </Pressable>
      )}
      emptyIcon="star-outline"
      emptyTitle="Aún no tienes reseñas"
      emptyMessage={'Marca "Ya fui" en un concierto y cuéntanos qué tal estuvo.'}
    />
  )
}

// Historial personal con pestañas superiores: GET /user-interactions/my-concerts y GET /users/me/reviews.
export default function HistoryScreen() {
  return (
    <TopTab.Navigator
      screenOptions={{
        lazy: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIndicatorStyle: { backgroundColor: colors.primary },
        tabBarLabelStyle: { fontWeight: '600', textTransform: 'none' },
      }}
    >
      <TopTab.Screen name="Going" component={GoingTab} options={{ title: 'Voy a ir' }} />
      <TopTab.Screen name="Attended" component={AttendedTab} options={{ title: 'Ya fui' }} />
      <TopTab.Screen name="Reviews" component={ReviewsTab} options={{ title: 'Reseñas' }} />
    </TopTab.Navigator>
  )
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, flexGrow: 1 },
  footer: { paddingVertical: spacing.lg, alignItems: 'center' },
  footerError: { color: colors.danger, fontSize: 14 },
})
