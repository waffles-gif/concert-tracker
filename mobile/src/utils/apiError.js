const DEFAULT_MESSAGES = {
  400: 'Los datos enviados no son válidos.',
  401: 'Tu sesión expiró. Inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  409: 'Esta acción entra en conflicto con los datos existentes.',
  500: 'Ocurrió un error en el servidor. Inténtalo más tarde.',
}

// Convierte cualquier error de axios en { status, message, isNetworkError, isCanceled }.
// El backend responde con ErrorResponseDTO: { timestamp, status, error, message, path }.
export function normalizeError(error) {
  if (error?.code === 'ERR_CANCELED') {
    return { status: null, message: 'Solicitud cancelada.', isCanceled: true, isNetworkError: false }
  }

  if (error?.code === 'ECONNABORTED') {
    return {
      status: null,
      message: 'El servidor tardó demasiado en responder. Inténtalo otra vez.',
      isNetworkError: true,
      isCanceled: false,
    }
  }

  if (!error?.response) {
    return {
      status: null,
      message: 'No pudimos conectar con el servidor. Revisa tu conexión.',
      isNetworkError: true,
      isCanceled: false,
    }
  }

  const { status, data } = error.response
  const message =
    (typeof data?.message === 'string' && data.message) ||
    DEFAULT_MESSAGES[status] ||
    (status >= 500 ? DEFAULT_MESSAGES[500] : 'Ocurrió un error inesperado.')

  return { status, message, isNetworkError: false, isCanceled: false }
}

export function getErrorMessage(error) {
  return error?.apiError?.message ?? normalizeError(error).message
}
