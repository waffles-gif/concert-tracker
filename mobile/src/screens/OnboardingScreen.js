import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import ArtistCard from '../components/ArtistCard'
import LoadingScreen from '../components/LoadingScreen'
import PrimaryButton from '../components/PrimaryButton'
import StateView from '../components/StateView'
import { useAuth } from '../hooks/useAuth'
import { useFollows } from '../hooks/useFollows'
import { artistService } from '../services/artistService'
import { colors, radius, spacing } from '../theme'
import { getErrorMessage } from '../utils/apiError'
import { MIN_FOLLOWS } from '../utils/onboarding'
import { GenreChip } from './ArtistsScreen'

const ARTISTS_PER_GENRE = 12

// Trae los artistas de cada género elegido y los junta sin repetir (igual que la web).
async function fetchArtists(genreIds, signal) {
  const pages = await Promise.all(
    genreIds.map((genreId) => artistService.list({ genreId, size: ARTISTS_PER_GENRE }, signal)),
  )
  const unique = new Map()
  pages.flatMap((page) => page.content).forEach((artist) => unique.set(artist.id, artist))
  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name))
}

// Onboarding: paso 1 elegir géneros, paso 2 seguir al menos MIN_FOLLOWS artistas.
export default function OnboardingScreen() {
  const { user, finishOnboarding, logout } = useAuth()
  const follows = useFollows({ toast: false })
  const [step, setStep] = useState(1)
  const [genres, setGenres] = useState({ data: null, error: null })
  const [selected, setSelected] = useState([])
  const [artists, setArtists] = useState({ data: null, loading: false, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    artistService
      .genres(controller.signal)
      .then((data) => setGenres({ data, error: null }))
      .catch((error) => !controller.signal.aborted && setGenres({ data: null, error: getErrorMessage(error) }))
    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    if (step !== 2 || selected.length === 0) return undefined
    const controller = new AbortController()
    setArtists({ data: null, loading: true, error: null })
    fetchArtists(selected, controller.signal)
      .then((data) => setArtists({ data, loading: false, error: null }))
      .catch(
        (error) =>
          !controller.signal.aborted && setArtists({ data: null, loading: false, error: getErrorMessage(error) }),
      )
    return () => controller.abort()
  }, [step, selected, reloadKey])

  const toggleGenre = (id) =>
    setSelected((current) => (current.includes(id) ? current.filter((g) => g !== id) : [...current, id]))

  const remaining = Math.max(MIN_FOLLOWS - follows.count, 0)

  const finish = () => {
    Toast.show({ type: 'success', text1: '¡Todo listo!', text2: 'Ya puedes explorar conciertos.' })
    finishOnboarding()
  }

  if (!genres.data && !genres.error) return <LoadingScreen message="Cargando…" />

  if (genres.error) {
    return (
      <SafeAreaView style={styles.safe}>
        <StateView
          icon="cloud-offline-outline"
          title="No pudimos cargar los géneros"
          message={genres.error}
          actionLabel="Reintentar"
          onAction={() => setReloadKey((k) => k + 1)}
        />
      </SafeAreaView>
    )
  }

  const firstName = user?.name?.split(' ')[0] ?? ''

  if (step === 1) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.step}>Paso 1 de 2</Text>
          <Text style={styles.title}>¡Hola, {firstName}! Armemos tu música</Text>
          <Text style={styles.muted}>Elige los géneros que te gustan y te mostramos artistas para seguir.</Text>

          <View style={styles.genres}>
            {genres.data.map((genre) => (
              <GenreChip
                key={genre.id}
                label={genre.name}
                active={selected.includes(genre.id)}
                onPress={() => toggleGenre(genre.id)}
              />
            ))}
          </View>

          <PrimaryButton title="Ver artistas" onPress={() => setStep(2)} disabled={selected.length === 0} />
          {selected.length === 0 ? <Text style={styles.hint}>Elige al menos un género.</Text> : null}

          <Pressable onPress={logout} style={styles.logout} accessibilityRole="button">
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const progress = Math.min(follows.count, MIN_FOLLOWS) / MIN_FOLLOWS

  const header = (
    <View>
      <Pressable onPress={() => setStep(1)} hitSlop={8} accessibilityRole="button">
        <Text style={styles.back}>‹ Cambiar géneros</Text>
      </Pressable>
      <Text style={styles.step}>Paso 2 de 2</Text>
      <View style={styles.progressCard}>
        <Text style={styles.progressText} accessibilityLiveRegion="polite">
          {remaining > 0
            ? `Sigue al menos ${MIN_FOLLOWS} artistas: te faltan ${remaining}`
            : `¡Listo! Sigues a ${follows.count} ${follows.count === 1 ? 'artista' : 'artistas'}`}
        </Text>
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: MIN_FOLLOWS, now: Math.min(follows.count, MIN_FOLLOWS) }}
        >
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    </View>
  )

  const renderEmpty = () => {
    if (artists.loading) return <ActivityIndicator style={styles.spinner} color={colors.primary} />
    if (artists.error) {
      return (
        <StateView
          icon="cloud-offline-outline"
          title="No pudimos cargar los artistas"
          message={artists.error}
          actionLabel="Reintentar"
          onAction={() => setReloadKey((k) => k + 1)}
        />
      )
    }
    return <StateView icon="mic-outline" title="Todavía no tenemos artistas de esos géneros. Prueba con otros." />
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <FlatList
        contentContainerStyle={styles.content}
        data={artists.data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ArtistCard
            artist={item}
            followed={follows.followedIds.has(item.id)}
            busy={follows.loading || follows.busyId === item.id}
            onToggle={follows.toggle}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
      />
      <View style={styles.bottomBar}>
        <Text style={styles.muted}>
          {follows.count} de {MIN_FOLLOWS} artistas seguidos
        </Text>
        <View style={styles.finish}>
          <PrimaryButton title="Terminar" onPress={finish} disabled={remaining > 0} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, flexGrow: 1 },
  step: { fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.xs },
  muted: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.xl },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  logout: { marginTop: spacing.xl, alignItems: 'center', padding: spacing.sm },
  logoutText: { color: colors.textMuted, fontSize: 14 },
  back: { color: colors.textMuted, fontSize: 14 },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  progressText: { fontSize: 15, fontWeight: '600', color: colors.text },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primarySoft,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: colors.primary },
  spinner: { paddingVertical: spacing.xl },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  finish: { minWidth: 140 },
})
