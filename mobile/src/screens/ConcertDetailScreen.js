import { useEffect } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import StateView from '../components/StateView'
import { colors, radius, spacing } from '../theme'
import { formatDateTime, formatPlace, formatPrice } from '../utils/format'

// Versión inicial: muestra los datos que ya trae el listado.
// La siguiente tarea (detalle + reseñas) la completa con GET /concerts/{id} y GET /concerts/{id}/reviews.
export default function ConcertDetailScreen({ route, navigation }) {
  const concert = route.params?.concert

  useEffect(() => {
    if (concert?.title) navigation.setOptions({ title: concert.title })
  }, [concert?.title, navigation])

  if (!concert) {
    return <StateView icon="alert-circle-outline" title="No encontramos este concierto" />
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.artist}>{concert.artistName}</Text>
      <Text style={styles.title}>{concert.title}</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Fecha</Text>
        <Text style={styles.value}>{formatDateTime(concert.date)}</Text>
        <Text style={styles.label}>Lugar</Text>
        <Text style={styles.value}>{formatPlace(concert)}</Text>
        <Text style={styles.label}>Precio</Text>
        <Text style={styles.value}>{formatPrice(concert.ticketPrice)}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  artist: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.xs, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg },
  label: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
  value: { fontSize: 16, color: colors.text, marginTop: 2 },
})
