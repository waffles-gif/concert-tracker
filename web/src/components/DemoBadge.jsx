// Marca los conciertos de ejemplo (datos demo) para distinguirlos de los reales importados de Ticketmaster
export default function DemoBadge() {
  return (
    <span
      title="Concierto de ejemplo: sus datos son ficticios"
      className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
    >
      Demo
    </span>
  )
}
