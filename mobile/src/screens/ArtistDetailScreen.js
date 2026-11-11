import { useCallback, useEffect, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import ConcertCard from '../components/ConcertCard'
import LoadingScreen from '../components/LoadingScreen'
import StateView from '../components/StateView'
import { artistService } from '../services/artistService'
import { radius, spacing } from '../theme'
import { useThemedStyles } from '../theme/ThemeContext'
import { getErrorMessage } from '../utils/apiError'

const TABS = [
  { id: 'proximos', label: 'Próximos', empty: 'Este artista no tiene conciertos próximos por ahora.' },
  { id: 'pasados', label: 'Ya ocurrieron', empty: 'Todavía no hay conciertos pasados de este artista.' },
]

const byDateAsc = (a, b) => new Date(a.date) - new Date(b.date)
const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date)

// Detalle de artista (como /artistas/:id en la web): datos del artista y sus conciertos
// en dos pestañas, Próximos y Ya ocurrieron.
export default function ArtistDetailScreen({ route, navigation }) {
  const styles = useThemedStyles(makeStyles)
  const { id, name } = route.params.artist
  const [artist, setArtist] = useState({ data: null, error: null, notFound: false })
  const [concerts, setConcerts] = useState({ data: null, error: null })
  const [selectedTab, setSelectedTab] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (name) navigation.setOptions({ title: name })
  }, [name, navigation])

  useEffect(() => {
    const controller = new AbortController()
    setArtist({ data: null, error: null, notFound: false })
    setConcerts({ data: null, error: null })

    artistService
      .getById(id, controller.signal)
      .then((data) => {
        setArtist({ data, error: null, notFound: false })
        navigation.setOptions({ title: data.name })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setArtist({ data: null, error: getErrorMessage(error), notFound: error?.apiError?.status === 404 })
      })

    artistService
      .concerts(id, controller.signal)
      .then((data) => setConcerts({ data, error: null }))
      .catch((error) => !controller.signal.aborted && setConcerts({ data: null, error: getErrorMessage(error) }))

    return () => controller.abort()
  }, [id, reloadKey, navigation])

  const retry = useCallback(() => setReloadKey((k) => k + 1), [])

  if (!artist.data && !artist.error) return <LoadingScreen message="Cargando artista…" />

  if (artist.error) {
    return (
      <View style={styles.container}>
        <StateView
          icon={artist.notFound ? 'search-outline' : 'cloud-offline-outline'}
          title={artist.notFound ? 'No encontramos a este artista' : 'No pudimos cargar el artista'}
          message={artist.notFound ? undefined : artist.error}
          actionLabel={artist.notFound ? 'Ver todos los artistas' : 'Reintentar'}
          onAction={artist.notFound ? () => navigation.navigate('Tabs', { screen: 'Artists' }) : retry}
        />
      </View>
    )
  }

  const data = artist.data
  const genres = data.genres ?? []

  // Próximos: el más cercano primero. Pasados: el más reciente primero.
  const now = new Date()
  const all = concerts.data ?? []
  const lists = {
    proximos: all.filter((c) => new Date(c.date) >= now).sort(byDateAsc),
    pasados: all.filter((c) => new Date(c.date) < now).sort(byDateDesc),
  }
  // Si no eligió pestaña, se abre Próximos; si no hay ninguno, Ya ocurrieron.
  const activeTab = selectedTab ?? (lists.proximos.length === 0 && lists.pasados.length > 0 ? 'pasados' : 'proximos')
  const tab = TABS.find((t) => t.id === activeTab)

  const header = (
    <View>
      <View style={styles.header}>
        {data.imageUrl ? (
          <Image source={{ uri: data.imageUrl }} style={styles.avatar} accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.avatar, styles.avatarEmpty]}>
            <Text style={styles.initial}>{data.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{data.name}</Text>
          {data.country ? <Text style={styles.muted}>{data.country}</Text> : null}
          {genres.length > 0 ? (
            <View style={styles.genres}>
              {genres.map((genre) => (
                <View key={genre.id} style={styles.genre}>
                  <Text style={styles.genreText}>{genre.name}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {data.description ? <Text style={styles.description}>{data.description}</Text> : null}

      <Text style={styles.section}>Conciertos</Text>

      {all.length > 0 ? (
        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((t) => {
            const selected = t.id === activeTab
            return (
              <Pressable
                key={t.id}
                onPress={() => setSelectedTab(t.id)}
                style={[styles.tab, selected && styles.tabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                  {t.label} ({lists[t.id].length})
                </Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}
    </View>
  )

  const renderEmpty = () => {
    if (!concerts.data && !concerts.error) return <LoadingScreen message="Cargando conciertos…" />
    if (concerts.error) {
      return (
        <StateView
          icon="cloud-offline-outline"
          title="No pudimos cargar los conciertos"
          message={concerts.error}
          actionLabel="Reintentar"
          onAction={retry}
        />
      )
    }
    if (all.length === 0) {
      return (
        <StateView
          icon="musical-notes-outline"
          title={`Todavía no hay conciertos registrados de ${data.name}`}
          message="Cuando haya alguno, aparecerá aquí."
        />
      )
    }
    return <StateView icon="calendar-outline" title={tab.empty} />
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={lists[activeTab]}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <ConcertCard
          concert={item}
          markPast
          onPress={() => navigation.navigate('ConcertDetail', { concert: item })}
        />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={renderEmpty}
    />
  )
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, flexGrow: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    headerInfo: { flex: 1, minWidth: 0 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft },
    avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
    initial: { fontSize: 32, fontWeight: '700', color: colors.primary },
    name: { fontSize: 24, fontWeight: '700', color: colors.text },
    muted: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
    genres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
    genre: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 2 },
    genreText: { fontSize: 12, fontWeight: '600', color: colors.primary },
    description: { fontSize: 15, color: colors.textMuted, marginTop: spacing.lg, lineHeight: 21 },
    section: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
    tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    tab: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { fontSize: 14, fontWeight: '600', color: colors.text },
    tabTextActive: { color: '#fff' },
  })
