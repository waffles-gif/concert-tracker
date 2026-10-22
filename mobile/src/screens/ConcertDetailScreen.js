import { Ionicons } from '@expo/vector-icons'
import PropTypes from 'prop-types'
import { useEffect } from 'react'
import { ActivityIndicator, Image, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import PrimaryButton from '../components/PrimaryButton'
import ReviewItem from '../components/ReviewItem'
import StateView from '../components/StateView'
import { useConcertDetail } from '../hooks/useConcertDetail'
import { colors, radius, spacing } from '../theme'
import { formatDateTime, formatPrice } from '../utils/format'

function InfoRow({ icon, label, children }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.primary} style={styles.infoIcon} />
      <View style={styles.infoText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{children}</Text>
      </View>
    </View>
  )
}

InfoRow.propTypes = { icon: PropTypes.string.isRequired, label: PropTypes.string.isRequired, children: PropTypes.node }

// Abre la página oficial de venta en el navegador del celular.
async function openTicketUrl(url) {
  try {
    await Linking.openURL(url)
  } catch {
    Toast.show({ type: 'error', text1: 'No se pudo abrir la página de compra', text2: 'Inténtalo de nuevo más tarde.' })
  }
}

// Detalle de concierto: GET /concerts/{id} (artista, venue, precio) y GET /concerts/{id}/reviews.
// Llega desde el listado con el concierto en los params, así el título se ve mientras carga.
export default function ConcertDetailScreen({ route, navigation }) {
  const preview = route.params?.concert
  const {
    concert,
    loading,
    refreshing,
    error,
    retry,
    refresh,
    reviews,
    reviewsTotal,
    reviewsLoading,
    reviewsError,
    hasMoreReviews,
    loadMoreReviews,
    retryReviews,
  } = useConcertDetail(preview?.id)

  const title = concert?.title ?? preview?.title
  useEffect(() => {
    if (title) navigation.setOptions({ title })
  }, [title, navigation])

  if (!preview?.id) {
    return <StateView icon="alert-circle-outline" title="No encontramos este concierto" />
  }

  if (loading && !concert) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error && !concert) {
    return (
      <StateView
        icon="cloud-offline-outline"
        title="No pudimos cargar el concierto"
        message={error}
        actionLabel="Reintentar"
        onAction={retry}
      />
    )
  }

  const { artist, venue } = concert
  const place = [venue?.address, venue?.city, venue?.country].filter(Boolean).join(', ')
  const genres = artist?.genres?.map((genre) => genre.name).join(' · ')
  // Las zonas llegan de la más barata a la más cara; ticketPrice es el precio "desde".
  const zones = concert.zones ?? []
  const priceText = zones.length > 0 && concert.ticketPrice != null
    ? `Desde ${formatPrice(concert.ticketPrice)}`
    : formatPrice(concert.ticketPrice)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
    >
      {concert.imageUrl ? (
        <Image source={{ uri: concert.imageUrl }} style={styles.image} accessibilityIgnoresInvertColors />
      ) : null}

      {concert.demo ? (
        <View style={styles.demoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.demoText}>Concierto de ejemplo: sus fechas, precios y zonas son ficticios.</Text>
        </View>
      ) : null}

      <Text style={styles.artistName}>{artist?.name}</Text>
      <Text style={styles.title}>{concert.title}</Text>

      <View style={styles.card}>
        <InfoRow icon="calendar-outline" label="Fecha">
          {formatDateTime(concert.date)}
        </InfoRow>
        <InfoRow icon="location-outline" label="Lugar">
          {venue?.name}
          {place ? `\n${place}` : ''}
        </InfoRow>
        <InfoRow icon="ticket-outline" label="Precio">
          {priceText}
        </InfoRow>
      </View>

      {zones.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Entradas por zona</Text>
          <View style={styles.card}>
            {zones.map((zone) => (
              <View key={zone.id} style={styles.zoneRow}>
                <Text style={styles.zoneName}>{zone.name}</Text>
                <Text style={styles.zonePrice}>{formatPrice(zone.price)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {concert.ticketUrl ? (
        <View style={styles.buy}>
          <PrimaryButton title="Comprar entradas" onPress={() => openTicketUrl(concert.ticketUrl)} />
          <Text style={styles.buyHint}>Se abre la página oficial de venta, con los precios y zonas actualizados.</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Artista</Text>
      <View style={styles.card}>
        <Text style={styles.value}>{artist?.name}</Text>
        {artist?.country ? <Text style={styles.muted}>{artist.country}</Text> : null}
        {genres ? <Text style={styles.muted}>{genres}</Text> : null}
        {artist?.description ? <Text style={styles.description}>{artist.description}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Reseñas{reviewsTotal ? ` (${reviewsTotal})` : ''}</Text>
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}

      {!reviewsLoading && !reviewsError && reviews.length === 0 ? (
        <Text style={styles.muted}>Todavía nadie ha reseñado este concierto.</Text>
      ) : null}

      {reviewsError ? (
        <View style={styles.inlineError}>
          <Text style={styles.errorText}>{reviewsError}</Text>
          <PrimaryButton title="Reintentar" variant="outline" onPress={retryReviews} />
        </View>
      ) : null}

      {hasMoreReviews && !reviewsError ? (
        <View style={styles.more}>
          <PrimaryButton
            title="Ver más reseñas"
            variant="outline"
            onPress={loadMoreReviews}
            loading={reviewsLoading}
          />
        </View>
      ) : null}

      {reviewsLoading && reviews.length === 0 ? <ActivityIndicator color={colors.primary} /> : null}
    </ScrollView>
  )
}

ConcertDetailScreen.propTypes = {
  route: PropTypes.shape({ params: PropTypes.shape({ concert: PropTypes.object }) }).isRequired,
  navigation: PropTypes.shape({ setOptions: PropTypes.func.isRequired }).isRequired,
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.border,
  },
  artistName: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.xs, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  demoText: { flex: 1, fontSize: 13, color: colors.primaryDark },
  zoneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  zoneName: { fontSize: 15, color: colors.text, flexShrink: 1, marginRight: spacing.md },
  zonePrice: { fontSize: 15, fontWeight: '600', color: colors.text },
  buy: { marginTop: spacing.lg, gap: spacing.xs },
  buyHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { marginTop: 2, marginRight: spacing.md },
  infoText: { flex: 1 },
  label: { fontSize: 13, color: colors.textMuted },
  value: { fontSize: 16, color: colors.text, marginTop: 2 },
  muted: { fontSize: 14, color: colors.textMuted },
  description: { fontSize: 14, color: colors.text, marginTop: spacing.xs, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  inlineError: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: 14 },
  more: { marginTop: spacing.sm },
})
