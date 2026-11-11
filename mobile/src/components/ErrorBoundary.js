import PropTypes from 'prop-types'
import { Component } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import StateView from './StateView'

// Pantalla que se muestra cuando algo falla (es un componente aparte para poder usar el tema).
function ErrorFallback({ onRetry }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StateView
        icon="bug-outline"
        title="Algo salió mal"
        message="Ocurrió un error inesperado en la app."
        actionLabel="Volver a intentar"
        onAction={onRetry}
      />
    </View>
  )
}

ErrorFallback.propTypes = { onRetry: PropTypes.func.isRequired }

// Si una pantalla falla al renderizar, muestra este aviso en vez de cerrar la app.
// Tiene que ser una clase: React no tiene todavía un hook para atrapar estos errores.
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Error de render', error, info?.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
})
