import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text } from 'react-native'
import FormField from '../components/FormField'
import FormScreen from '../components/FormScreen'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../hooks/useAuth'
import { colors, spacing } from '../theme'
import { getErrorMessage } from '../utils/apiError'
import { rules } from '../utils/validators'

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [serverError, setServerError] = useState(null)
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } })

  const onSubmit = async ({ email, password }) => {
    setServerError(null)
    try {
      await login({ email: email.trim(), password })
      // No hace falta navegar: el RootNavigator cambia solo cuando hay usuario.
    } catch (error) {
      setServerError(
        error?.apiError?.status === 401 ? 'Email o contraseña incorrectos.' : getErrorMessage(error),
      )
    }
  }

  return (
    <FormScreen title="Inicia sesión" subtitle="Sigue tus conciertos favoritos." serverError={serverError}>
      <Controller
        control={control}
        name="email"
        rules={rules.email}
        render={({ field: { ref, onChange, onBlur, value } }) => (
          <FormField
            ref={ref}
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => setFocus('password')}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        rules={rules.loginPassword}
        render={({ field: { ref, onChange, onBlur, value } }) => (
          <FormField
            ref={ref}
            label="Contraseña"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />

      <PrimaryButton title="Entrar" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

      <Pressable onPress={() => navigation.navigate('Register')} style={styles.link} accessibilityRole="link">
        <Text style={styles.linkText}>
          ¿No tienes cuenta? <Text style={styles.linkStrong}>Regístrate</Text>
        </Text>
      </Pressable>
    </FormScreen>
  )
}

const styles = StyleSheet.create({
  link: { marginTop: spacing.xl, alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { color: colors.textMuted, fontSize: 15 },
  linkStrong: { color: colors.primary, fontWeight: '600' },
})
