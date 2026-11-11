import { Ionicons } from '@expo/vector-icons'
import PropTypes from 'prop-types'
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { radius, spacing } from '../theme'
import { useTheme, useThemedStyles } from '../theme/ThemeContext'

// Tarjeta de artista con botón de seguir / dejar de seguir (el estado lo maneja la pantalla).
// Si `locked` es true y ya lo sigue, no se puede dejar de seguir (mínimo de artistas seguidos).
// Si se pasa `onPress`, tocar la foto o el nombre abre el detalle del artista.
export default function ArtistCard({ artist, followed, busy, locked, onToggle, onPress }) {
  const { colors } = useTheme()
  const styles = useThemedStyles(makeStyles)
  const details = [artist.country, ...(artist.genres ?? []).map((genre) => genre.name)].filter(Boolean).join(' · ')
  const disabled = busy || (followed && locked)

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={styles.main}
        accessibilityRole={onPress ? 'link' : undefined}
        accessibilityLabel={onPress ? `Ver conciertos de ${artist.name}` : undefined}
      >
        {artist.imageUrl ? (
          <Image source={{ uri: artist.imageUrl }} style={styles.avatar} accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.avatar, styles.avatarEmpty]}>
            <Text style={styles.initial}>{artist.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {artist.name}
          </Text>
          <Text style={styles.details} numberOfLines={1}>
            {details || '—'}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => onToggle(artist)}
        disabled={disabled}
        style={[styles.button, followed && styles.buttonActive, disabled && styles.buttonDisabled]}
        accessibilityRole="button"
        accessibilityState={{ selected: followed, disabled }}
        accessibilityLabel={`${followed ? 'Dejar de seguir a' : 'Seguir a'} ${artist.name}`}
      >
        {busy ? (
          <ActivityIndicator size="small" color={followed ? '#fff' : colors.primary} />
        ) : (
          <>
            <Ionicons name={followed ? 'checkmark' : 'add'} size={16} color={followed ? '#fff' : colors.text} />
            <Text style={[styles.buttonText, followed && styles.buttonTextActive]}>
              {followed ? 'Siguiendo' : 'Seguir'}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  )
}

ArtistCard.propTypes = {
  artist: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    country: PropTypes.string,
    imageUrl: PropTypes.string,
    genres: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })),
  }).isRequired,
  followed: PropTypes.bool.isRequired,
  busy: PropTypes.bool,
  locked: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onPress: PropTypes.func,
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 20, fontWeight: '700', color: colors.primary },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  details: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 104,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  buttonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  buttonTextActive: { color: '#fff' },
})
