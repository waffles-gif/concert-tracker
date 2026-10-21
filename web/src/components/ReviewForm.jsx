import { Star } from 'lucide-react'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { interactionService } from '../services/interactionService'
import { getErrorMessage } from '../utils/apiError'
import TextAreaField from './TextAreaField'

const MAX_COMMENT = 1000
const RATING_LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Increíble']

export default function ReviewForm({ concertId, onSaved, onCancel }) {
  const [serverError, setServerError] = useState(null)
  const [hovered, setHovered] = useState(0)
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { rating: 0, comment: '' } })

  const commentLength = useWatch({ control, name: 'comment' }).length

  const onSubmit = async ({ rating, comment }) => {
    setServerError(null)
    try {
      await interactionService.createReview({ concertId, rating, comment: comment.trim() || null })
      toast.success('¡Gracias por tu reseña!')
      onSaved()
    } catch (error) {
      setServerError(getErrorMessage(error))
      // 409: ya existía una reseña, la pantalla debe reflejarlo
      if (error.apiError?.status === 409) onSaved()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Controller
        name="rating"
        control={control}
        rules={{ min: { value: 1, message: 'Elige una puntuación de 1 a 5 estrellas' } }}
        render={({ field }) => {
          const shown = hovered || field.value
          return (
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-slate-700">Tu puntuación</legend>
              <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    onMouseEnter={() => setHovered(value)}
                    onFocus={() => setHovered(value)}
                    onBlur={() => setHovered(0)}
                    aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
                    aria-pressed={field.value === value}
                    className="rounded p-0.5 outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    <Star
                      size={28}
                      aria-hidden="true"
                      className={value <= shown ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-500">{RATING_LABELS[shown]}</span>
              </div>
              {errors.rating && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.rating.message}
                </p>
              )}
            </fieldset>
          )
        }}
      />

      <TextAreaField
        label="Tu comentario (opcional)"
        hint={`${commentLength}/${MAX_COMMENT}`}
        error={errors.comment?.message}
        placeholder="¿Cómo estuvo el concierto?"
        {...register('comment', {
          maxLength: { value: MAX_COMMENT, message: `El comentario no puede superar los ${MAX_COMMENT} caracteres` },
        })}
      />

      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Publicando…' : 'Publicar reseña'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
          >
            Ahora no
          </button>
        )}
      </div>
    </form>
  )
}

ReviewForm.propTypes = {
  concertId: PropTypes.number.isRequired,
  onSaved: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
}
