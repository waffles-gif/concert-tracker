import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { useMemo } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import ErrorBoundary from './src/components/ErrorBoundary'
import { AuthProvider } from './src/contexts/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'
import { ThemeProvider, useTheme } from './src/theme/ThemeContext'

// Colores de React Navigation (headers, tabs y fondo) según el tema elegido.
function ThemedApp() {
  const { isDark, colors } = useTheme()

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    }
  }, [isDark, colors])

  return (
    <>
      <ErrorBoundary>
        <AuthProvider>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ErrorBoundary>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Toast va al final para quedar encima de todo */}
      <Toast />
    </>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
