import { CameraView, useCameraPermissions } from 'expo-camera'
import PropTypes from 'prop-types'
import { useRef, useState } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import LoadingScreen from '../components/LoadingScreen'
import PrimaryButton from '../components/PrimaryButton'
import StateView from '../components/StateView'
import { radius, spacing } from '../theme'
import { useThemedStyles } from '../theme/ThemeContext'
import { parseConcertQr } from '../utils/concertQr'

const RETRY_DELAY_MS = 2500

// Lee con la cámara el QR de un concierto y abre su detalle.
// Fallback: si no hay permiso o la cámara no funciona, se puede buscar el concierto en la lista.
export default function ScanQrScreen({ navigation }) {
  const styles = useThemedStyles(makeStyles)
  const [permission, requestPermission] = useCameraPermissions()
  const [cameraError, setCameraError] = useState(false)
  // La cámara dispara el evento muchas veces por segundo: solo atendemos la primera lectura.
  const handledRef = useRef(false)

  const goToList = () => navigation.navigate('Tabs', { screen: 'Concerts' })

  if (!permission) return <LoadingScreen message="Preparando la cámara…" />

  if (!permission.granted || cameraError) {
    let action = null
    if (!cameraError) {
      action = permission.canAskAgain
        ? { label: 'Dar permiso', onPress: requestPermission }
        : { label: 'Abrir ajustes', onPress: Linking.openSettings }
    }

    return (
      <View style={styles.centered}>
        <StateView
          icon={cameraError ? 'videocam-off-outline' : 'camera-outline'}
          title={cameraError ? 'No pudimos abrir la cámara' : 'Necesitamos tu cámara'}
          message={
            cameraError
              ? 'Tu celular no dejó usar la cámara. Puedes buscar el concierto en la lista.'
              : 'Con la cámara puedes escanear el código QR de un concierto. Si prefieres, búscalo en la lista.'
          }
          actionLabel={action?.label}
          onAction={action?.onPress}
        />
        <View style={styles.fallback}>
          <PrimaryButton title="Buscar el concierto en la lista" variant="outline" onPress={goToList} />
        </View>
      </View>
    )
  }

  const handleScan = ({ data }) => {
    if (handledRef.current) return
    handledRef.current = true

    const concertId = parseConcertQr(data)
    if (concertId) {
      navigation.replace('ConcertDetail', { concert: { id: concertId } })
      return
    }

    Toast.show({ type: 'error', text1: 'QR no válido', text2: 'Ese código no es de un concierto de la app.' })
    setTimeout(() => {
      handledRef.current = false
    }, RETRY_DELAY_MS)
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScan}
        onMountError={() => setCameraError(true)}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Apunta al código QR del concierto</Text>
      </View>
    </View>
  )
}

ScanQrScreen.propTypes = {
  navigation: PropTypes.shape({ replace: PropTypes.func.isRequired, navigate: PropTypes.func.isRequired })
    .isRequired,
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centered: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
    fallback: { paddingHorizontal: spacing.xl, marginTop: spacing.md },
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
    frame: { width: 240, height: 240, borderWidth: 3, borderColor: '#fff', borderRadius: radius.md },
    hint: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  })
