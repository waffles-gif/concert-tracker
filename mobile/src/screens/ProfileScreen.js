import { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import LoadingScreen from '../components/LoadingScreen'
import PrimaryButton from '../components/PrimaryButton'
import StateView from '../components/StateView'
import { useAuth } from '../hooks/useAuth'
import { userService } from '../services/userService'
import { colors, radius, spacing } from '../theme'
import { getErrorMessage } from '../utils/apiError'

// Perfil del usuario logueado: GET /users/me y GET /users/me/follows.
export default function ProfileScreen() {
  const { user: sessionUser, logout } = useAuth()
  const [state, setState] = useState({ profile: null, follows: [], loading: true, refreshing: false, error: null })

  const load = useCallback(async (mode = 'initial') => {
    setState((prev) => ({ ...prev, loading: mode === 'initial', refreshing: mode === 'refresh', error: null }))
    try {
      const [profile, follows] = await Promise.all([userService.me(), userService.follows()])
      setState({ profile, follows, loading: false, refreshing: false, error: null })
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, refreshing: false, error: getErrorMessage(error) }))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (state.loading) return <LoadingScreen message="Cargando tu perfil…" />

  // Si /users/me falla, se muestra lo que ya trae la sesión.
  const profile = state.profile ?? sessionUser
  const place = [profile?.city, profile?.country].filter(Boolean).join(', ')

  const header = (
    <View>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.muted}>{profile?.email}</Text>
        {place ? <Text style={styles.muted}>{place}</Text> : null}
      </View>
      {state.error ? (
        <StateView
          icon="cloud-offline-outline"
          title="No pudimos actualizar tu perfil"
          message={state.error}
          actionLabel="Reintentar"
          onAction={() => load()}
        />
      ) : (
        <Text style={styles.section}>Artistas que sigues ({state.follows.length})</Text>
      )}
    </View>
  )

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={state.error ? [] : state.follows}
      keyExtractor={(item) => String(item.artistId)}
      renderItem={({ item }) => (
        <View style={styles.artistRow}>
          <Text style={styles.artistName}>{item.name}</Text>
          {item.country ? <Text style={styles.muted}>{item.country}</Text> : null}
        </View>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        state.error ? null : (
          <StateView
            icon="heart-outline"
            title="Aún no sigues a ningún artista"
            message="Cuando sigas artistas aparecerán aquí."
          />
        )
      }
      ListFooterComponent={
        <View style={styles.logout}>
          <PrimaryButton title="Cerrar sesión" variant="outline" onPress={logout} />
        </View>
      }
      refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={() => load('refresh')} />}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xl, alignItems: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: colors.primary },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  artistRow: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm },
  artistName: { fontSize: 16, fontWeight: '500', color: colors.text },
  logout: { marginTop: spacing.xl },
})
