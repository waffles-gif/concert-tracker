import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import ArtistCard from '../components/ArtistCard'
import LoadingScreen from '../components/LoadingScreen'
import StateView from '../components/StateView'
import { useAuth } from '../hooks/useAuth'
import { useFollows } from '../hooks/useFollows'
import { usePagedList } from '../hooks/usePagedList'
import { artistService } from '../services/artistService'
import { colors, spacing } from '../theme'
import { MIN_FOLLOWS } from '../utils/onboarding'

// Artistas de la A a la Z con filtro por género y botón de seguir (como la página "Artistas" de la web).
export default function ArtistsScreen() {
  const { isAdmin } = useAuth()
  const [genreId, setGenreId] = useState(null)
  const [genres, setGenres] = useState([])
  const follows = useFollows()

  const { items, loading, loadingMore, refreshing, error, hasMore, loadMore, refresh, retry } = usePagedList(
    artistService.list,
    { genreId: genreId ?? undefined },
  )

  // Los géneros casi no cambian: se cargan una vez. Si fallan, la lista sigue funcionando sin filtro.
  useEffect(() => {
    const controller = new AbortController()
    artistService
      .genres(controller.signal)
      .then(setGenres)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  // Como en la web: no se puede bajar de MIN_FOLLOWS artistas seguidos.
  const locked = !isAdmin && follows.count <= MIN_FOLLOWS

  const header = (
    <View style={styles.header}>
      <Text style={styles.subtitle}>Sigue a tus artistas favoritos para enterarte de sus conciertos.</Text>
      {genres.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <GenreChip label="Todos" active={genreId === null} onPress={() => setGenreId(null)} />
          {genres.map((genre) => (
            <GenreChip
              key={genre.id}
              label={genre.name}
              active={genreId === genre.id}
              onPress={() => setGenreId(genre.id)}
            />
          ))}
        </ScrollView>
      ) : null}
      {!follows.loading ? (
        <Text style={styles.count}>
          Sigues a {follows.count} {follows.count === 1 ? 'artista' : 'artistas'}
          {locked ? ` · mínimo ${MIN_FOLLOWS}` : ''}
        </Text>
      ) : null}
    </View>
  )

  const renderEmpty = () => {
    if (loading) return <LoadingScreen message="Cargando artistas…" />
    if (error) {
      return (
        <StateView
          icon="cloud-offline-outline"
          title="No pudimos cargar los artistas"
          message={error}
          actionLabel="Reintentar"
          onAction={retry}
        />
      )
    }
    return (
      <StateView
        icon="mic-outline"
        title="No hay artistas de ese género todavía"
        actionLabel={genreId !== null ? 'Ver todos los géneros' : undefined}
        onAction={genreId !== null ? () => setGenreId(null) : undefined}
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
    if (!hasMore && items.length > 0) return <Text style={styles.footerEnd}>No hay más artistas</Text>
    return null
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <ArtistCard
          artist={item}
          followed={follows.followedIds.has(item.id)}
          busy={follows.loading || follows.busyId === item.id}
          locked={locked}
          onToggle={follows.toggle}
        />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshing={refreshing}
      onRefresh={() => {
        refresh()
        follows.reload()
      }}
    />
  )
}

export function GenreChip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

GenreChip.propTypes = {
  label: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  onPress: PropTypes.func.isRequired,
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, flexGrow: 1 },
  header: { marginBottom: spacing.md },
  subtitle: { fontSize: 14, color: colors.textMuted },
  chips: { gap: spacing.sm, paddingVertical: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  count: { fontSize: 13, color: colors.textMuted },
  footer: { paddingVertical: spacing.lg, alignItems: 'center' },
  footerError: { color: colors.danger, fontSize: 14 },
  footerEnd: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.lg, fontSize: 13 },
})
