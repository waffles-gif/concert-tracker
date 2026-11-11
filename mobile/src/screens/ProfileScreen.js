import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import PropTypes from 'prop-types'
import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import ArtistCard from '../components/ArtistCard'
import PrimaryButton from '../components/PrimaryButton'
import StateView from '../components/StateView'
import { useAuth } from '../hooks/useAuth'
import { useFollows } from '../hooks/useFollows'
import { userService } from '../services/userService'
import { radius, spacing } from '../theme'
import { useTheme, useThemedStyles } from '../theme/ThemeContext'
import { MIN_FOLLOWS } from '../utils/onboarding'

// Perfil del usuario logueado, como en la web: datos y bio (con "Editar perfil"),
// acceso a favoritos y artistas que sigue (con dejar de seguir sin bajar del mínimo).
export default function ProfileScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme()
  const styles = useThemedStyles(makeStyles)
  const { user, isAdmin, updateUser, logout } = useAuth()
  const follows = useFollows()
  const [favoritesCount, setFavoritesCount] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Al volver a la pestaña se actualizan los datos y el número de favoritos.
  const load = useCallback(async () => {
    const [me, favorites] = await Promise.allSettled([userService.me(), userService.favoriteConcerts({ size: 1 })])
    if (me.status === 'fulfilled') updateUser(me.value)
    if (favorites.status === 'fulfilled') setFavoritesCount(favorites.value.totalElements)
  }, [updateUser])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([load(), follows.reload()])
    setRefreshing(false)
  }

  const initials = (user?.name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
  const place = [user?.city, user?.country].filter(Boolean).join(', ')
  const atMinimum = !isAdmin && follows.count <= MIN_FOLLOWS

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.muted}>{user?.email}</Text>
            {place ? (
              <View style={styles.place}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={styles.muted}>{place}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.bioTitle}>Sobre mí</Text>
        <Text style={user?.bio ? styles.bio : styles.muted}>
          {user?.bio || 'Aún no escribiste tu bio. Toca "Editar perfil" para contar algo sobre ti.'}
        </Text>

        <View style={styles.editButton}>
          <PrimaryButton title="Editar perfil" variant="outline" onPress={() => navigation.navigate('EditProfile')} />
        </View>
      </View>

      <LinkRow
        icon="heart"
        iconColor="#f43f5e"
        label="Mis conciertos favoritos"
        value={favoritesCount}
        onPress={() => navigation.navigate('Favorites')}
      />

      <View style={styles.linkRow}>
        <Ionicons name={isDark ? 'moon' : 'moon-outline'} size={20} color={colors.primary} />
        <Text style={styles.linkLabel}>Modo oscuro</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#ffffff"
          accessibilityLabel="Modo oscuro"
        />
      </View>

      <Text style={styles.section}>
        Artistas que sigues{follows.loading ? '' : ` (${follows.count})`}
      </Text>
      <Text style={styles.sectionHint}>
        {atMinimum
          ? `Sigue más artistas para poder dejar de seguir a alguno (el mínimo es ${MIN_FOLLOWS}).`
          : 'Los artistas de los que quieres enterarte.'}
      </Text>

      {follows.error && follows.count === 0 ? (
        <StateView
          icon="cloud-offline-outline"
          title="No pudimos cargar tus artistas"
          message={follows.error}
          actionLabel="Reintentar"
          onAction={follows.reload}
        />
      ) : null}

      {!follows.loading && !follows.error && follows.count === 0 ? (
        <StateView
          icon="mic-outline"
          title="Aún no sigues a ningún artista"
          actionLabel="Ver artistas"
          onAction={() => navigation.navigate('Artists')}
        />
      ) : null}

      {(follows.follows ?? []).map((follow) => (
        <ArtistCard
          key={follow.artistId}
          artist={{ id: follow.artistId, name: follow.name, country: follow.country, imageUrl: follow.imageUrl }}
          followed
          busy={follows.busyId === follow.artistId}
          locked={atMinimum}
          onToggle={follows.toggle}
          onPress={() => navigation.navigate('ArtistDetail', { artist: { id: follow.artistId, name: follow.name } })}
        />
      ))}

      <View style={styles.logout}>
        <PrimaryButton title="Cerrar sesión" variant="outline" onPress={logout} />
      </View>
    </ScrollView>
  )
}

function LinkRow({ icon, iconColor, label, value, onPress }) {
  const { colors } = useTheme()
  const styles = useThemedStyles(makeStyles)
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={styles.linkLabel}>{label}</Text>
      {value != null ? <Text style={styles.linkValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  )
}

LinkRow.propTypes = {
  icon: PropTypes.string.isRequired,
  iconColor: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  onPress: PropTypes.func.isRequired,
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardInfo: { flex: 1, minWidth: 0 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bioTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: spacing.lg },
  bio: { fontSize: 15, color: colors.text, marginTop: 2 },
  editButton: { marginTop: spacing.lg },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  pressed: { backgroundColor: colors.primarySoft },
  linkLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
  linkValue: { fontSize: 15, color: colors.textMuted },
  section: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: spacing.xl },
  sectionHint: { fontSize: 13, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  logout: { marginTop: spacing.xl },
})
