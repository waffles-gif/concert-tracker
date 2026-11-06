const QR_PREFIX = 'concerttracker://concert/'

// Lo que va dentro del QR de un concierto.
export function concertQrValue(concertId) {
  return `${QR_PREFIX}${concertId}`
}

// Saca el id de un QR leído con la cámara; devuelve null si el QR no es de un concierto de la app.
export function parseConcertQr(data) {
  if (typeof data !== 'string' || !data.startsWith(QR_PREFIX)) return null
  const id = data.slice(QR_PREFIX.length)
  return /^[1-9]\d*$/.test(id) ? Number(id) : null
}
