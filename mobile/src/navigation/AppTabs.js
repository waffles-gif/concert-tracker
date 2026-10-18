import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import ConcertsScreen from '../screens/ConcertsScreen'
import ProfileScreen from '../screens/ProfileScreen'
import { colors } from '../theme'

const Tab = createBottomTabNavigator()

const ICONS = {
  Concerts: ['musical-notes', 'musical-notes-outline'],
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
      <Tab.Screen name="Concerts" component={ConcertsScreen} options={{ title: 'Conciertos' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi perfil' }} />
    </Tab.Navigator>
  )
}
