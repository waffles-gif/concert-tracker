import { CalendarCheck, CheckCircle2 } from 'lucide-react'
import PropTypes from 'prop-types'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { interactionService } from '../services/interactionService'
import { getErrorMessage } from '../utils/apiError'

const OPTIONS = [
  { status: 'VOY_A_IR', label: 'Voy a ir', Icon: CalendarCheck },
  { status: 'YA_FUI', label: 'Ya fui', Icon: CheckCircle2 },
]

// Botones controlados: `status` es la asistencia actual y `onChange` avisa cuando el usuario la cambia.
export default function AttendanceButtons({ concertId, isPast, status: current, onChange }) {
  const [submitting, setSubmitting] = useState(null)

  const handleClick = async (status) => {
    if (submitting || status === current) return
    setSubmitting(status)
    try {
      await interactionService.setAttendance(concertId, status)
      onChange(status)
      toast.success(status === 'YA_FUI' ? '¡Marcado como "Ya fui"!' : '¡Marcado como "Voy a ir"!')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Tu asistencia">
      {OPTIONS.map(({ status, label, Icon }) => {
        const active = current === status
        const blocked = status === 'YA_FUI' && !isPast
        return (
          <button
            key={status}
            type="button"
            onClick={() => handleClick(status)}
            disabled={Boolean(submitting) || blocked}
            aria-pressed={active}
            title={blocked ? 'Disponible cuando el concierto ya haya ocurrido' : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            {submitting === status ? 'Guardando…' : label}
          </button>
        )
      })}
    </div>
  )
}

AttendanceButtons.propTypes = {
  concertId: PropTypes.number.isRequired,
  isPast: PropTypes.bool.isRequired,
  status: PropTypes.oneOf(['VOY_A_IR', 'YA_FUI']),
  onChange: PropTypes.func.isRequired,
}
