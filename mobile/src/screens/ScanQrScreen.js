import { CameraView, useCameraPermissions } from 'expo-camera'
import PropTypes from 'prop-types'
import { useRef } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import LoadingScreen from '../components/LoadingScreen'
import StateView from '../components/StateView'
import { colors, radius, spacing } from '../theme'
import { parseConcertQr } from '../utils/concertQr'

const RETRY_DELAY_MS = 2500

// Lee con la cámara el QR de un concierto y abre su detalle.
export default function ScanQrScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions()
  // La cámara dispara el evento muchas veces por segundo: solo atendemos la primera lectura.
  const handledRef = useRef(false)

  if (!permission) return <LoadingScreen message="Preparando la cámara…" />

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <StateView
          icon="camera-outline"
          title="Necesitamos tu cámara"
          message="Con la cámara puedes escanear el código QR de un concierto."
          actionLabel={permission.canAskAgain ? 'Dar permiso' : 'Abrir ajustes'}
          onAction={permission.canAskAgain ? requestPermission : Linking.openSettings}
        />
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
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Apunta al código QR del concierto</Text>
      </View>
    </View>
  )
}

ScanQrScreen.propTypes = {
  navigation: PropTypes.shape({ replace: PropTypes.func.isRequired }).isRequired,
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  frame: { width: 240, height: 240, borderWidth: 3, borderColor: '#fff', borderRadius: radius.md },
  hint: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
})
