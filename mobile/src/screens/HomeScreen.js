import { StyleSheet, Text, View } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../hooks/useAuth'
import { colors, spacing } from '../theme'

// Pantalla temporal tras el login; la reemplazan las tabs con el listado de conciertos.
export default function HomeScreen() {
  const { user, logout } = useAuth()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola, {user?.name}</Text>
      <Text style={styles.text}>Sesión iniciada con {user?.email}</Text>
      <PrimaryButton title="Cerrar sesión" variant="outline" onPress={logout} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  text: { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
})
