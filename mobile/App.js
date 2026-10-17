import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { AuthProvider } from './src/contexts/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="dark" />
      {/* Toast va al final para quedar encima de todo */}
      <Toast />
    </SafeAreaProvider>
  )
}
