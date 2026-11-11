import PropTypes from 'prop-types'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { spacing } from '../theme'
import { useTheme, useThemedStyles } from '../theme/ThemeContext'

export default function LoadingScreen({ message = 'Cargando…' }) {
  const { colors } = useTheme()
  const styles = useThemedStyles(makeStyles)
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

LoadingScreen.propTypes = { message: PropTypes.string }

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  text: { marginTop: spacing.md, color: colors.textMuted, fontSize: 15 },
})
