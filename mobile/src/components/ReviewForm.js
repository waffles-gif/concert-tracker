import { Ionicons } from '@expo/vector-icons'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing } from '../theme'
import { getErrorMessage } from '../utils/apiError'
import FormField from './FormField'
import PrimaryButton from './PrimaryButton'

const STARS = [1, 2, 3, 4, 5]
const MAX_COMMENT = 1000

// Formulario de reseña: estrellas del 1 al 5 (obligatorio) y comentario opcional.
// Valida antes de llamar a la API y muestra el error del servidor dentro del formulario (por ejemplo 409).
export default function ReviewForm({ onSubmit }) {
  const [serverError, setServerError] = useState(null)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { rating: 0, comment: '' } })

  const submit = async ({ rating, comment }) => {
    setServerError(null)
    try {
      await onSubmit({ rating, comment: comment.trim() || null })
    } catch (error) {
      setServerError(getErrorMessage(error))
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Deja tu reseña</Text>

      <Controller
        control={control}
        name="rating"
        rules={{ validate: (value) => (value >= 1 && value <= 5) || 'Elige de 1 a 5 estrellas.' }}
        render={({ field: { value, onChange } }) => (
          <View style={styles.stars}>
            {STARS.map((n) => (
              <Pressable
                key={n}
                onPress={() => onChange(n)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`${n} de 5 estrellas`}
                accessibilityState={{ selected: n === value }}
              >
                <Ionicons name={n <= value ? 'star' : 'star-outline'} size={32} color="#f59e0b" />
              </Pressable>
            ))}
          </View>
        )}
      />
      {errors.rating ? (
        <Text style={styles.error} accessibilityRole="alert">
          {errors.rating.message}
        </Text>
      ) : null}

      <Controller
        control={control}
        name="comment"
        rules={{ maxLength: { value: MAX_COMMENT, message: `Máximo ${MAX_COMMENT} caracteres.` } }}
        render={({ field: { ref, value, onChange, onBlur } }) => (
          <FormField
            ref={ref}
            label="Comentario (opcional)"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.comment?.message}
            placeholder="¿Qué tal estuvo?"
            multiline
            maxLength={MAX_COMMENT}
            textAlignVertical="top"
            style={styles.field}
          />
        )}
      />

      {serverError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {serverError}
        </Text>
      ) : null}

      <PrimaryButton title="Publicar reseña" onPress={handleSubmit(submit)} loading={isSubmitting} />
    </View>
  )
}

ReviewForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  stars: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  field: { marginTop: spacing.md, marginBottom: spacing.md },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm },
})
