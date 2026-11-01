import { Ionicons } from '@expo/vector-icons'
import PropTypes from 'prop-types'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing } from '../theme'

// Botón tipo "píldora" que se marca cuando está activo.
function ChoiceButton({ icon, activeIcon, label, active, loading, disabled, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.choice,
        active && styles.choiceActive,
        pressed && !active && styles.choicePressed,
        disabled && !active && styles.choiceDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={active ? '#fff' : colors.primary} />
      ) : (
        <Ionicons name={active ? activeIcon : icon} size={18} color={active ? '#fff' : colors.primary} />
      )}
      <Text style={[styles.choiceText, active && styles.choiceTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}

ChoiceButton.propTypes = {
  icon: PropTypes.string.isRequired,
  activeIcon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
}

// "Voy a ir" para conciertos futuros y "Ya fui" para los que ya pasaron (el backend no deja
// marcar "Ya fui" antes de la fecha). También guarda en favoritos y sigue al artista.
export default function ConcertActions({
  isPast,
  attendanceStatus,
  favorite,
  following,
  artistName,
  busy,
  onAttendance,
  onToggleFavorite,
  onToggleFollow,
}) {
  const attendance = isPast
    ? { status: 'YA_FUI', label: 'Ya fui', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle' }
    : { status: 'VOY_A_IR', label: 'Voy a ir', icon: 'calendar-outline', activeIcon: 'calendar' }
  const marked = attendanceStatus === attendance.status

  let hint = null
  if (!isPast) hint = 'Cuando pase el concierto podrás marcar "Ya fui" y dejar tu reseña.'
  else if (!marked) hint = 'Marca "Ya fui" para poder dejar tu reseña.'

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <ChoiceButton
          {...attendance}
          active={marked}
          disabled={marked || Boolean(busy)}
          loading={busy === 'attendance'}
          onPress={() => onAttendance(attendance.status)}
        />
        <ChoiceButton
          icon="heart-outline"
          activeIcon="heart"
          label={favorite ? 'En favoritos' : 'Favorito'}
          active={favorite}
          disabled={Boolean(busy)}
          loading={busy === 'favorite'}
          onPress={onToggleFavorite}
        />
      </View>
      {artistName ? (
        <ChoiceButton
          icon="person-add-outline"
          activeIcon="person"
          label={following ? `Sigues a ${artistName}` : `Seguir a ${artistName}`}
          active={following}
          disabled={Boolean(busy)}
          loading={busy === 'follow'}
          onPress={onToggleFollow}
        />
      ) : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

ConcertActions.propTypes = {
  isPast: PropTypes.bool.isRequired,
  attendanceStatus: PropTypes.oneOf(['VOY_A_IR', 'YA_FUI']),
  favorite: PropTypes.bool,
  following: PropTypes.bool,
  artistName: PropTypes.string,
  busy: PropTypes.string,
  onAttendance: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  onToggleFollow: PropTypes.func.isRequired,
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  choice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  choiceActive: { backgroundColor: colors.primary },
  choicePressed: { backgroundColor: colors.primarySoft },
  choiceDisabled: { opacity: 0.6 },
  choiceText: { fontSize: 15, fontWeight: '600', color: colors.primary, flexShrink: 1 },
  choiceTextActive: { color: '#fff' },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
})
