import { Check, Plus } from 'lucide-react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

// Tarjeta de artista con botón de seguir / dejar de seguir (controlado desde afuera)
// `lockedMessage`: si se pasa y el artista está seguido, no se puede dejar de seguir (se muestra como ayuda)
export default function ArtistCard({ artist, followed, busy, lockedMessage, onToggle, linkTo = undefined }) {
  const initial = artist.name.charAt(0).toUpperCase()

  return (
    <article className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      {artist.imageUrl ? (
        <img src={artist.imageUrl} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-full bg-slate-100 object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600"
        >
          {initial}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">
          {linkTo ? (
            <Link to={linkTo} className="rounded hover:text-indigo-600 hover:underline">
              {artist.name}
            </Link>
          ) : (
            artist.name
          )}
        </h3>
        <p className="truncate text-xs text-slate-500">
          {[artist.country, ...(artist.genres ?? []).map((genre) => genre.name)].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onToggle(artist)}
        disabled={busy || (followed && Boolean(lockedMessage))}
        title={followed ? lockedMessage : undefined}
        aria-pressed={followed}
        aria-label={`${followed ? 'Dejar de seguir a' : 'Seguir a'} ${artist.name}`}
        className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          followed
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        {followed ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
        {followed ? 'Siguiendo' : 'Seguir'}
      </button>
    </article>
  )
}

ArtistCard.propTypes = {
  artist: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    country: PropTypes.string,
    imageUrl: PropTypes.string,
    genres: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })),
  }).isRequired,
  followed: PropTypes.bool.isRequired,
  busy: PropTypes.bool,
  lockedMessage: PropTypes.string,
  onToggle: PropTypes.func.isRequired,
  linkTo: PropTypes.string,
}
