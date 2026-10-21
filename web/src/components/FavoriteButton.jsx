import { Heart } from 'lucide-react'
import PropTypes from 'prop-types'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { interactionService } from '../services/interactionService'
import { getErrorMessage } from '../utils/apiError'

// Botón de corazón controlado: `favorite` es el estado actual y `onChange` avisa del nuevo valor.
export default function FavoriteButton({ concertId, favorite, onChange }) {
  const [saving, setSaving] = useState(false)

  const handleClick = async () => {
    if (saving) return
    setSaving(true)
    try {
      if (favorite) {
        await interactionService.removeFavorite(concertId)
        toast.success('Quitado de tus favoritos')
      } else {
        await interactionService.addFavorite(concertId)
        toast.success('¡Agregado a tus favoritos!')
      }
      onChange(!favorite)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      aria-pressed={favorite}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        favorite
          ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Heart size={16} aria-hidden="true" className={favorite ? 'fill-rose-500 text-rose-500' : ''} />
      {favorite ? 'En favoritos' : 'Agregar a favoritos'}
    </button>
  )
}

FavoriteButton.propTypes = {
  concertId: PropTypes.number.isRequired,
  favorite: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
}
