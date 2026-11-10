import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoadingScreen from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import ConcertDetailScreen from '../screens/ConcertDetailScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import FavoritesScreen from '../screens/FavoritesScreen'
import LoginScreen from '../screens/LoginScreen'
import OnboardingScreen from '../screens/OnboardingScreen'
import RegisterScreen from '../screens/RegisterScreen'
import ScanQrScreen from '../screens/ScanQrScreen'
import { colors } from '../theme'
import AppTabs from './AppTabs'

const Stack = createNativeStackNavigator()

// Stack principal:
// - Sin sesión: Login y Register.
// - Con sesión: las tabs (Conciertos, Historial, Perfil) y encima el detalle y el escáner de QR.
// Al cambiar `user` en AuthContext, React Navigation cambia de grupo solo (no hace falta navigate).
// - Con sesión pero siguiendo menos de 3 artistas: primero el onboarding (como en la web).
export default function RootNavigator() {
  const { isAuthenticated, initializing, checkingOnboarding, needsOnboarding } = useAuth()

  if (initializing) return <LoadingScreen message="Recuperando tu sesión…" />
  if (checkingOnboarding) return <LoadingScreen message="Preparando tu cuenta…" />

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary, headerBackTitle: 'Atrás' }}>
      {isAuthenticated && needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      ) : isAuthenticated ? (
        <>
          <Stack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ConcertDetail" component={ConcertDetailScreen} options={{ title: 'Concierto' }} />
          <Stack.Screen name="ScanQr" component={ScanQrScreen} options={{ title: 'Escanear QR' }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar perfil' }} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Mis favoritos' }} />
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
