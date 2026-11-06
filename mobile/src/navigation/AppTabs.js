import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Pressable } from 'react-native'
import ConcertsScreen from '../screens/ConcertsScreen'
import HistoryScreen from '../screens/HistoryScreen'
import ProfileScreen from '../screens/ProfileScreen'
import { colors, spacing } from '../theme'

const Tab = createBottomTabNavigator()

const ICONS = {
  Concerts: ['musical-notes', 'musical-notes-outline'],
  History: ['time', 'time-outline'],
  Profile: ['person', 'person-outline'],
}

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Concerts"
        component={ConcertsScreen}
        options={({ navigation }) => ({
          title: 'Conciertos',
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate('ScanQr')}
              hitSlop={8}
              style={{ marginRight: spacing.lg }}
              accessibilityRole="button"
              accessibilityLabel="Escanear código QR"
            >
              <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
            </Pressable>
          ),
        })}
      />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Historial' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi perfil' }} />
    </Tab.Navigator>
  )
}
