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
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  const formatted = dateFormatter.format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatPrice(value) {
  if (value == null) return 'Gratis'
  return `S/ ${Number(value).toFixed(2)}`
}

export function formatPlace(concert) {
  return [concert.venueName, [concert.city, concert.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')
}
