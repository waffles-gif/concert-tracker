import PropTypes from 'prop-types'
import { useEffect, useId, useRef } from 'react'

// Cuadro de confirmación para acciones que quitan algo (dejar de seguir, quitar un favorito).
// Usa <dialog> nativo: bloquea el resto de la página, atrapa el foco y se cierra con Escape.
// El foco empieza en "Cancelar" para que un Enter distraído no confirme la acción.
export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel = 'Cancelar', onConfirm, onCancel }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const messageId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-white p-6 shadow-xl backdrop:bg-slate-900/50"
    >
      <h2 id={titleId} className="text-lg font-bold">
        {title}
      </h2>
      <p id={messageId} className="mt-2 text-sm text-slate-600">
        {message}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string.isRequired,
  cancelLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}
