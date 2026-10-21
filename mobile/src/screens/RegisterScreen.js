import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import FormField from '../components/FormField'
import FormScreen from '../components/FormScreen'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../hooks/useAuth'
import { colors, spacing } from '../theme'
import { getErrorMessage } from '../utils/apiError'
import { rules } from '../utils/validators'

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth()
  const [serverError, setServerError] = useState(null)
  const {
    control,
    handleSubmit,
    getValues,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', country: '', city: '' },
  })

  const onSubmit = async ({ confirmPassword: _confirm, ...data }) => {
    setServerError(null)
    try {
      await register({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        country: data.country.trim() || null,
        city: data.city.trim() || null,
      })
    } catch (error) {
      setServerError(getErrorMessage(error))
    }
  }

  // Helper para no repetir el mismo Controller en cada campo.
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
    <FormScreen title="Crea tu cuenta" subtitle="Te toma menos de un minuto." serverError={serverError}>
      {field('name', 'Nombre', rules.name, {
        autoComplete: 'name',
        returnKeyType: 'next',
        onSubmitEditing: () => setFocus('email'),
      })}
      {field('email', 'Email', rules.email, {
        keyboardType: 'email-address',
        autoCapitalize: 'none',
        autoComplete: 'email',
        returnKeyType: 'next',
        onSubmitEditing: () => setFocus('password'),
      })}
      {field('password', 'Contraseña', rules.newPassword, {
        secureTextEntry: true,
        autoComplete: 'new-password',
        textContentType: 'newPassword',
        returnKeyType: 'next',
        onSubmitEditing: () => setFocus('confirmPassword'),
      })}
      {field(
        'confirmPassword',
        'Confirmar contraseña',
        {
          required: 'Confirma tu contraseña',
          validate: (value) => value === getValues('password') || 'Las contraseñas no coinciden',
        },
        { secureTextEntry: true, returnKeyType: 'next', onSubmitEditing: () => setFocus('country') },
      )}
      <View style={styles.row}>
        {field('country', 'País (opcional)', undefined, {
          style: styles.half,
          returnKeyType: 'next',
          onSubmitEditing: () => setFocus('city'),
        })}
        {field('city', 'Ciudad (opcional)', undefined, {
          style: styles.half,
          returnKeyType: 'go',
          onSubmitEditing: handleSubmit(onSubmit),
        })}
      </View>

      <PrimaryButton title="Crear cuenta" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

      <Pressable onPress={() => navigation.navigate('Login')} style={styles.link} accessibilityRole="link">
        <Text style={styles.linkText}>
          ¿Ya tienes cuenta? <Text style={styles.linkStrong}>Inicia sesión</Text>
        </Text>
      </Pressable>
    </FormScreen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  link: { marginTop: spacing.xl, alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { color: colors.textMuted, fontSize: 15 },
  linkStrong: { color: colors.primary, fontWeight: '600' },
})
