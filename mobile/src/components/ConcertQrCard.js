import PropTypes from 'prop-types'
import { StyleSheet, Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { colors, radius, spacing } from '../theme'
import { concertQrValue } from '../utils/concertQr'

// QR del concierto para compartirlo: otra persona lo escanea desde la app y llega a este detalle.
export default function ConcertQrCard({ concertId }) {
  return (
    <View style={styles.card} accessibilityLabel="Código QR de este concierto">
      <QRCode value={concertQrValue(concertId)} size={160} color={colors.text} backgroundColor={colors.surface} />
      <Text style={styles.hint}>Escanéalo desde la app con el botón de QR en la lista de conciertos.</Text>
    </View>
  )
}

ConcertQrCard.propTypes = {
  concertId: PropTypes.number.isRequired,
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
})
