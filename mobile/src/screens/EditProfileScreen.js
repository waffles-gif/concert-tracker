import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import FormField from '../components/FormField'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../hooks/useAuth'
import { userService } from '../services/userService'
import { radius, spacing } from '../theme'
import { useThemedStyles } from '../theme/ThemeContext'
import { getErrorMessage } from '../utils/apiError'
import { MAX_BIO, rules } from '../utils/validators'

// Editar nombre, país, ciudad y bio (PUT /users/me), igual que el formulario del perfil de la web.
export default function EditProfileScreen({ navigation }) {
  const styles = useThemedStyles(makeStyles)
  const { user, updateUser } = useAuth()
  const [serverError, setServerError] = useState(null)
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      name: user?.name ?? '',
      country: user?.country ?? '',
      city: user?.city ?? '',
      bio: user?.bio ?? '',
    },
  })
  const bioLength = useWatch({ control, name: 'bio' }).length

  const onSubmit = async (values) => {
    setServerError(null)
    try {
      const updated = await userService.updateProfile({
        name: values.name.trim(),
        country: values.country.trim() || null,
        city: values.city.trim() || null,
        bio: values.bio.trim() || null,
      })
      updateUser(updated)
      Toast.show({ type: 'success', text1: 'Perfil actualizado' })
      navigation.goBack()
    } catch (error) {
      setServerError(getErrorMessage(error))
    }
  }

  const field = (name, label, fieldRules, props = {}) => (
    <Controller
      control={control}
      name={name}
      rules={fieldRules}
      render={({ field: { ref, onChange, onBlur, value } }) => (
        <FormField
          ref={ref}
          label={label}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={errors[name]?.message}
          {...props}
        />
      )}
    />
  )

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {field('name', 'Nombre', rules.name, {
          autoComplete: 'name',
          returnKeyType: 'next',
          onSubmitEditing: () => setFocus('country'),
        })}
        <View style={styles.row}>
          {field('country', 'País', rules.country, {
            style: styles.half,
            returnKeyType: 'next',
            onSubmitEditing: () => setFocus('city'),
          })}
          {field('city', 'Ciudad', rules.city, {
            style: styles.half,
            returnKeyType: 'next',
            onSubmitEditing: () => setFocus('bio'),
          })}
        </View>
        {field('bio', 'Bio', rules.bio, {
          multiline: true,
          placeholder: 'Cuéntanos qué música te mueve, cuál fue tu primer concierto…',
          style: styles.bio,
          inputStyle: styles.bioInput,
          textAlignVertical: 'top',
        })}
        <Text style={[styles.counter, bioLength > MAX_BIO && styles.counterError]}>
          {bioLength}/{MAX_BIO}
        </Text>

        {serverError ? (
          <Text style={styles.serverError} accessibilityRole="alert">
            {serverError}
          </Text>
        ) : null}

        <PrimaryButton title="Guardar cambios" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
        <View style={styles.cancel}>
          <PrimaryButton title="Cancelar" variant="outline" onPress={() => navigation.goBack()} disabled={isSubmitting} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  bio: { marginBottom: 0 },
  bioInput: { minHeight: 110 },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: colors.textMuted, marginBottom: spacing.lg },
  counterError: { color: colors.danger },
  serverError: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cancel: { marginTop: spacing.md },
})
