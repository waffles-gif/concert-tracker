import { Ionicons } from '@expo/vector-icons'
import PropTypes from 'prop-types'
import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../theme'
import PrimaryButton from './PrimaryButton'

// Estado vacío o de error con acción opcional (por ejemplo "Reintentar").
export default function StateView({ icon = 'information-circle-outline', title, message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton title={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </View>
  )
}

StateView.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  title: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  message: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  action: { marginTop: spacing.lg, alignSelf: 'stretch' },
})
