import { Ionicons } from '@expo/vector-icons'
import PropTypes from 'prop-types'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { describeWeather } from '../services/weatherService'
import { colors, radius, spacing } from '../theme'
import PrimaryButton from './PrimaryButton'

const round = (value) => (value == null ? '—' : Math.round(value))

// Tarjeta del clima: pronóstico si el concierto es pronto, lo que hizo si ya pasó,
// o un aviso si todavía falta mucho para tener pronóstico.
export default function WeatherCard({ weather, loading, error, onRetry }) {
  if (loading && !weather) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{error}</Text>
        <PrimaryButton title="Reintentar" variant="outline" onPress={onRetry} />
      </View>
    )
  }

  if (!weather) return null

  if (weather.kind === 'too-far' || weather.kind === 'unknown-city') {
    const message =
      weather.kind === 'too-far'
        ? `Todavía falta para el concierto. El pronóstico aparece cuando queden 15 días o menos (en ${weather.daysLeft} ${weather.daysLeft === 1 ? 'día' : 'días'}).`
        : 'No encontramos el clima para la ciudad de este concierto.'
    return (
      <View style={[styles.card, styles.row]}>
        <Ionicons name="time-outline" size={22} color={colors.textMuted} />
        <Text style={[styles.muted, styles.flex]}>{message}</Text>
      </View>
    )
  }

  const { label, icon } = describeWeather(weather.code)
  let rain = null
  if (weather.rainChance != null) rain = `${weather.rainChance}% de probabilidad de lluvia`
  else if (weather.rainMm != null) rain = weather.rainMm > 0 ? `Llovió ${weather.rainMm} mm` : 'No llovió'

  return (
    <View style={styles.card}>
      <Text style={styles.caption}>{weather.kind === 'past' ? 'Así estuvo el clima ese día' : 'Pronóstico para ese día'}</Text>
      <View style={styles.row}>
        <Ionicons name={icon} size={40} color={colors.primary} />
        <View style={styles.flex}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.temp}>
            {round(weather.max)}° / {round(weather.min)}°
          </Text>
        </View>
      </View>
      {rain ? (
        <View style={styles.row}>
          <Ionicons name="water-outline" size={16} color={colors.textMuted} />
          <Text style={styles.muted}>{rain}</Text>
        </View>
      ) : null}
    </View>
  )
}

WeatherCard.propTypes = {
  weather: PropTypes.shape({
    kind: PropTypes.oneOf(['forecast', 'past', 'too-far', 'unknown-city']).isRequired,
    code: PropTypes.number,
    max: PropTypes.number,
    min: PropTypes.number,
    rainChance: PropTypes.number,
    rainMm: PropTypes.number,
    daysLeft: PropTypes.number,
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  caption: { fontSize: 13, color: colors.textMuted },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  temp: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 2 },
  muted: { fontSize: 14, color: colors.textMuted },
  errorBox: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  errorText: { color: colors.danger, fontSize: 14 },
})
