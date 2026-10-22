import { Ionicons } from '@expo/vector-icons'
import PropTypes from 'prop-types'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing } from '../theme'
import { formatDate } from '../utils/format'

const STARS = [1, 2, 3, 4, 5]

export default function ReviewItem({ review }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author}>{review.userName}</Text>
        <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
      </View>
      <View style={styles.stars} accessibilityLabel={`${review.rating} de 5 estrellas`}>
        {STARS.map((n) => (
          <Ionicons key={n} name={n <= review.rating ? 'star' : 'star-outline'} size={16} color="#f59e0b" />
        ))}
      </View>
      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
    </View>
  )
}

ReviewItem.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.number.isRequired,
    userName: PropTypes.string,
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 15, fontWeight: '600', color: colors.text, flexShrink: 1 },
  date: { fontSize: 12, color: colors.textMuted, marginLeft: spacing.sm },
  stars: { flexDirection: 'row', gap: 2, marginTop: spacing.xs },
  comment: { fontSize: 14, color: colors.text, marginTop: spacing.sm, lineHeight: 20 },
})
