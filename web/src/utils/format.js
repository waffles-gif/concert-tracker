const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(isoDate) {
  if (!isoDate) return '—'
  const formatted = dateFormatter.format(new Date(isoDate))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const shortDateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(isoDate) {
  if (!isoDate) return '—'
  return shortDateFormatter.format(new Date(isoDate))
}

// Sin precio (los conciertos importados de Ticketmaster no lo traen) se muestra "Precio por confirmar"
export function formatPrice(value) {
  if (value == null) return 'Precio por confirmar'
  return `S/ ${Number(value).toFixed(2)}`
}
