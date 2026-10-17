import { Ionicons } from '@expo/vector-icons'
import PropTypes from 'prop-types'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing } from '../theme'
import { formatDateTime, formatPlace, formatPrice } from '../utils/format'

function Row({ icon, children }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={colors.textMuted} style={styles.icon} />
      <Text style={styles.rowText}>{children}</Text>
    </View>
  )
}

Row.propTypes = { icon: PropTypes.string.isRequired, children: PropTypes.node }

export default function ConcertCard({ concert, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${concert.title}, ${concert.artistName}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.artist}>{concert.artistName}</Text>
      <Text style={styles.title}>{concert.title}</Text>
      <View style={styles.rows}>
        <Row icon="calendar-outline">{formatDateTime(concert.date)}</Row>
        <Row icon="location-outline">{formatPlace(concert)}</Row>
        <Row icon="ticket-outline">{formatPrice(concert.ticketPrice)}</Row>
      </View>
    </Pressable>
  )
}

ConcertCard.propTypes = {
  concert: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.string,
    ticketPrice: PropTypes.number,
    artistName: PropTypes.string,
    venueName: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
  }).isRequired,
  onPress: PropTypes.func,
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.primarySoft },
  artist: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
  rows: { marginTop: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { marginTop: 2, marginRight: spacing.sm },
  rowText: { flex: 1, fontSize: 14, color: colors.textMuted },
})
