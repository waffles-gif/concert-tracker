import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import ConcertCard from '../components/ConcertCard'
import LoadingScreen from '../components/LoadingScreen'
import StateView from '../components/StateView'
import { useConcerts } from '../hooks/useConcerts'
import { useDebounce } from '../hooks/useDebounce'
import { colors, radius, spacing } from '../theme'

export default function ConcertsScreen({ navigation }) {
  const [search, setSearch] = useState('')
  const [onlyUpcoming, setOnlyUpcoming] = useState(true)
  const artist = useDebounce(search.trim())

  const { items, totalElements, loading, loadingMore, refreshing, error, hasMore, loadMore, refresh, retry } =
    useConcerts({
      artist: artist || undefined,
      upcoming: onlyUpcoming || undefined,
      sort: 'date,asc',
    })

  const hasFilters = Boolean(artist) || onlyUpcoming

  const header = (
    <View style={styles.header}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por artista"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar por artista"
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.chips}>
        <Pressable
          onPress={() => setOnlyUpcoming((value) => !value)}
          style={[styles.chip, onlyUpcoming && styles.chipActive]}
          accessibilityRole="switch"
          accessibilityState={{ checked: onlyUpcoming }}
        >
          <Text style={[styles.chipText, onlyUpcoming && styles.chipTextActive]}>Solo próximos</Text>
        </Pressable>
        {!loading && !error ? (
          <Text style={styles.count}>
            {totalElements} {totalElements === 1 ? 'concierto' : 'conciertos'}
          </Text>
        ) : null}
      </View>
    </View>
  )

  const renderEmpty = () => {
    if (loading) return <LoadingScreen message="Buscando conciertos…" />
    if (error) {
      return (
        <StateView
          icon="cloud-offline-outline"
          title="No pudimos cargar los conciertos"
          message={error}
          actionLabel="Reintentar"
          onAction={retry}
        />
      )
    }
    return (
      <StateView
        icon="musical-notes-outline"
        title="No hay conciertos"
        message={hasFilters ? 'Prueba con otro artista o quita el filtro de próximos.' : 'Aún no hay conciertos.'}
        actionLabel={hasFilters ? 'Quitar filtros' : undefined}
        onAction={
          hasFilters
            ? () => {
                setSearch('')
                setOnlyUpcoming(false)
              }
            : undefined
        }
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
    if (!hasMore && items.length > 0) return <Text style={styles.footerEnd}>No hay más conciertos</Text>
    return null
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <ConcertCard concert={item} onPress={() => navigation.navigate('ConcertDetail', { concert: item })} />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshing={refreshing}
      onRefresh={refresh}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, flexGrow: 1 },
  header: { marginBottom: spacing.lg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: spacing.md, paddingLeft: spacing.sm, fontSize: 16, color: colors.text },
  chips: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
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
  count: { color: colors.textMuted, fontSize: 14 },
  footer: { paddingVertical: spacing.lg, alignItems: 'center' },
  footerError: { color: colors.danger, fontSize: 14 },
  footerEnd: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.lg, fontSize: 13 },
})
