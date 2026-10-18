import PropTypes from 'prop-types'
import { forwardRef } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { colors, radius, spacing } from '../theme'

// Campo de texto con etiqueta y mensaje de error accesible.
const FormField = forwardRef(function FormField({ label, error, style, ...inputProps }, ref) {
  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        {...inputProps}
      />
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  )
})

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
}

export default FormField

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.xs },
})
