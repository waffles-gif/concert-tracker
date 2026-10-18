import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoadingScreen from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import ConcertDetailScreen from '../screens/ConcertDetailScreen'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import { colors } from '../theme'
import AppTabs from './AppTabs'

const Stack = createNativeStackNavigator()

// Stack principal:
// - Sin sesión: Login y Register.
// - Con sesión: las tabs (Conciertos, Perfil) y encima las pantallas de detalle.
// Al cambiar `user` en AuthContext, React Navigation cambia de grupo solo (no hace falta navigate).
export default function RootNavigator() {
  const { isAuthenticated, initializing } = useAuth()

  if (initializing) return <LoadingScreen message="Recuperando tu sesión…" />

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary, headerBackTitle: 'Atrás' }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ConcertDetail" component={ConcertDetailScreen} options={{ title: 'Concierto' }} />
        </>
      ) : (
        <Stack.Group screenOptions={{ headerShown: false, animationTypeForReplace: 'pop' }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  )
}
