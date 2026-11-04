import { TriangleAlert } from 'lucide-react'
import PropTypes from 'prop-types'
import { Component } from 'react'

// Atrapa los errores de render (y los de carga de un módulo lazy) para no dejar la pantalla en blanco.
// `resetKey` limpia el error cuando cambia (por ejemplo la ruta), así el usuario puede seguir navegando.
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Error de interfaz:', error, info.componentStack)
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <section
        role="alert"
        className={`flex flex-col items-center justify-center px-4 py-16 text-center ${this.props.fullScreen ? 'min-h-screen' : ''}`}
      >
        <TriangleAlert className="h-12 w-12 text-amber-500" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold">Algo salió mal</h1>
        <p className="mt-2 max-w-md text-slate-600">
          Ocurrió un problema inesperado al mostrar esta pantalla. Puedes volver a intentarlo o regresar al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Recargar la página
          </button>
          {/* Un enlace normal (no del router) recarga todo y descarta el estado que falló */}
          <a
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-indigo-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Volver al inicio
          </a>
        </div>
      </section>
    )
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  resetKey: PropTypes.string,
  fullScreen: PropTypes.bool,
}
