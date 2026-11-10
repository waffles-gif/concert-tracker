import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import PropTypes from 'prop-types'
import { useCallback, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import ConcertCard from '../components/ConcertCard'
import ReviewItem from '../components/ReviewItem'
import { useAuth } from '../hooks/useAuth'
import { concertService } from '../services/concertService'
import { interactionService } from '../services/interactionService'
import { reviewService } from '../services/reviewService'
import { userService } from '../services/userService'
import { colors, radius, spacing } from '../theme'
import { getErrorMessage } from '../utils/apiError'

// Cada sección se carga por separado: si una falla, las demás se siguen mostrando.
const SECTIONS = {
  going: () =>
    interactionService.myConcerts({ status: 'VOY_A_IR', upcoming: true, sort: 'concert.date,asc', size: 3 }),
  attended: () => interactionService.myConcerts({ status: 'YA_FUI', size: 1 }),
  favorites: () => userService.favoriteConcerts({ size: 1 }),
  follows: () => userService.follows(),
  upcoming: () => concertService.search({ upcoming: true, sort: 'date,asc', size: 5 }),
  activity: () => reviewService.recent({ size: 5 }),
}

const emptyData = Object.fromEntries(Object.keys(SECTIONS).map((key) => [key, { data: null, error: null }]))

// Inicio (como el dashboard de la web): resumen personal, tus próximos conciertos,
// próximos de la plataforma y las últimas reseñas de todos.
export default function HomeScreen({ navigation }) {
  const { user } = useAuth()
  const [sections, setSections] = useState(emptyData)
  const [refreshing, setRefreshing] = useState(false)
  const loadedRef = useRef(false)

  const load = useCallback(async () => {
    const keys = Object.keys(SECTIONS)
    const results = await Promise.allSettled(keys.map((key) => SECTIONS[key]()))
    loadedRef.current = true
    setSections((prev) => {
      const next = { ...prev }
      results.forEach((result, i) => {
        next[keys[i]] =
          result.status === 'fulfilled'
            ? { data: result.value, error: null }
            : { data: prev[keys[i]].data, error: getErrorMessage(result.reason) }
      })
      return next
    })
  }, [])

  // Se recarga al volver a la pestaña (por ejemplo después de marcar "Voy a ir" en un concierto).
  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const { going, attended, favorites, follows, upcoming, activity } = sections
  const loading = !loadedRef.current
  const openConcert = (concert) => navigation.navigate('ConcertDetail', { concert })
  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.hello}>Hola, {firstName} 👋</Text>
      <Text style={styles.muted}>Esto es lo que pasa en tu música.</Text>

      <View style={styles.tiles}>
        <StatTile
          icon="calendar-outline"
          label="Voy a ir"
          value={going.data?.totalElements}
          onPress={() => navigation.navigate('History', { screen: 'Going' })}
        />
        <StatTile
          icon="checkmark-circle-outline"
          label="Ya fui"
          value={attended.data?.totalElements}
          onPress={() => navigation.navigate('History', { screen: 'Attended' })}
        />
        <StatTile
          icon="heart-outline"
          label="Favoritos"
          value={favorites.data?.totalElements}
          onPress={() => navigation.navigate('Favorites')}
        />
        <StatTile
          icon="people-outline"
          label="Artistas que sigues"
          value={follows.data?.length}
          onPress={() => navigation.navigate('Artists')}
        />
      </View>

      <SectionTitle title="Tus próximos conciertos" onSeeAll={() => navigation.navigate('History', { screen: 'Going' })} />
      <Section loading={loading} error={going.error} onRetry={onRefresh}>
        {going.data?.content.length === 0 ? (
          <EmptyBox
            text='Aún no marcaste ningún concierto como "Voy a ir".'
            actionLabel="Explorar conciertos"
            onAction={() => navigation.navigate('Concerts')}
          />
        ) : (
          going.data?.content.map((item) => (
            <ConcertCard key={item.attendanceId} concert={item.concert} onPress={() => openConcert(item.concert)} />
          ))
        )}
      </Section>

      <SectionTitle title="Próximos conciertos" onSeeAll={() => navigation.navigate('Concerts')} />
      <Section loading={loading} error={upcoming.error} onRetry={onRefresh}>
        {upcoming.data?.content.length === 0 ? (
          <EmptyBox text="No hay conciertos próximos por ahora." />
        ) : (
          upcoming.data?.content.map((concert) => (
            <ConcertCard key={concert.id} concert={concert} onPress={() => openConcert(concert)} />
          ))
        )}
      </Section>

      <SectionTitle title="Actividad reciente" />
      <Section loading={loading} error={activity.error} onRetry={onRefresh}>
        {activity.data?.content.length === 0 ? (
          <EmptyBox text="Todavía no hay reseñas. ¡Sé el primero en dejar una!" />
        ) : (
          activity.data?.content.map((review) => (
            <Pressable
              key={review.id}
              onPress={() => openConcert({ id: review.concertId, title: review.concertTitle })}
              accessibilityRole="button"
            >
              <Text style={styles.activityTitle}>
                <Text style={styles.bold}>{review.userName}</Text> reseñó:
              </Text>
              <ReviewItem review={review} showConcert />
            </Pressable>
          ))
        )}
      </Section>
    </ScrollView>
  )
}

function StatTile({ icon, label, value, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? 'cargando'}`}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.tileValue}>{value ?? '–'}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  )
}

StatTile.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  onPress: PropTypes.func.isRequired,
}

function SectionTitle({ title, onSeeAll }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="link">
          <Text style={styles.link}>Ver todos</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

SectionTitle.propTypes = { title: PropTypes.string.isRequired, onSeeAll: PropTypes.func }

function Section({ loading, error, onRetry, children }) {
  if (loading) return <ActivityIndicator style={styles.spinner} color={colors.primary} />
  if (error) {
    return (
      <Pressable onPress={onRetry} style={styles.errorBox} accessibilityRole="button">
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorRetry}>Toca para reintentar</Text>
      </Pressable>
    )
  }
  return <View>{children}</View>
}

Section.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
  children: PropTypes.node,
}

function EmptyBox({ text, actionLabel, onAction }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.muted}>{text}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.link, styles.emptyAction]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

EmptyBox.propTypes = { text: PropTypes.string.isRequired, actionLabel: PropTypes.string, onAction: PropTypes.func }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hello: { fontSize: 24, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.primarySoft },
  tileValue: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing.xs },
  tileLabel: { fontSize: 13, color: colors.textMuted },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  link: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  bold: { fontWeight: '700', color: colors.text },
  activityTitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs },
  spinner: { paddingVertical: spacing.lg },
  errorBox: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center' },
  errorText: { color: colors.danger, textAlign: 'center' },
  errorRetry: { color: colors.danger, fontWeight: '600', marginTop: spacing.xs },
  emptyBox: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center' },
  emptyAction: { marginTop: spacing.sm },
})
