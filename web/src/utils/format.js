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
  // El espacio de "p. m." no debe partirse en dos líneas en pantallas angostas
  const formatted = dateFormatter.format(new Date(isoDate)).replace(/([ap])\.\s*m\./i, '$1.\u00a0m.')
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

// Sin precio pero con enlace de compra, se invita a verlo en Ticketmaster; sin ninguno de los dos, "por confirmar"
export function formatPriceOrLink(value, ticketUrl) {
  if (value == null && ticketUrl) return 'Ver precio en Ticketmaster'
  return formatPrice(value)
}

// Sin precio (los conciertos importados de Ticketmaster no lo traen) se muestra "Precio por confirmar"
export function formatPrice(value) {
  if (value == null) return 'Precio por confirmar'
  // Espacio sin salto: "S/" y el monto siempre quedan juntos
  return `S/\u00a0${Number(value).toFixed(2)}`
}
