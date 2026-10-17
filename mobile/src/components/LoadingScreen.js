import PropTypes from 'prop-types'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../theme'

export default function LoadingScreen({ message = 'Cargando…' }) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

LoadingScreen.propTypes = { message: PropTypes.string }

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  text: { marginTop: spacing.md, color: colors.textMuted, fontSize: 15 },
})
