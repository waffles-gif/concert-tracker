import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoadingScreen from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import HomeScreen from '../screens/HomeScreen'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'

const Stack = createNativeStackNavigator()

// Con sesión se ve la app; sin sesión, solo login y registro.
// Al cambiar `user` en AuthContext, React Navigation cambia de grupo solo (no hace falta navigate).
export default function RootNavigator() {
  const { isAuthenticated, initializing } = useAuth()

  if (initializing) return <LoadingScreen message="Recuperando tu sesión…" />

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Concert Tracker' }} />
      ) : (
        <Stack.Group screenOptions={{ headerShown: false, animationTypeForReplace: 'pop' }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  )
}
