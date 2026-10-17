import PropTypes from 'prop-types'
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors, radius, spacing } from '../theme'

// Botón principal. Mientras `loading` está activo queda deshabilitado (evita doble envío).
export default function PrimaryButton({ title, onPress, loading = false, disabled = false, variant = 'solid' }) {
  const isDisabled = disabled || loading
  const outline = variant === 'outline'

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        outline ? styles.outline : styles.solid,
        pressed && !isDisabled && (outline ? styles.outlinePressed : styles.solidPressed),
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.text, outline && styles.outlineText]}>{title}</Text>
      )}
    </Pressable>
  )
}

PrimaryButton.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['solid', 'outline']),
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  solid: { backgroundColor: colors.primary },
  solidPressed: { backgroundColor: colors.primaryDark },
  outline: { borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface },
  outlinePressed: { backgroundColor: colors.primarySoft },
  disabled: { opacity: 0.6 },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
  outlineText: { color: colors.primary },
})
