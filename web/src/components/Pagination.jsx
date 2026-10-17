import { ChevronLeft, ChevronRight } from 'lucide-react'
import PropTypes from 'prop-types'

const PAGE_SIZES = [10, 20, 50]

// `page` es 1-based. Muestra "mostrando X-Y de Z", selector de tamaño y navegación.
export default function Pagination({ page, size, totalElements, totalPages, onPageChange, onSizeChange }) {
  if (totalElements === 0) return null

  const from = (page - 1) * size + 1
  const to = Math.min(page * size, totalElements)

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <p>
        Mostrando <strong>{from}-{to}</strong> de <strong>{totalElements}</strong>
      </p>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          Por página
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
          >
            {PAGE_SIZES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
            className="rounded-md border border-slate-300 bg-white p-1.5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Página {page} de {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
            className="rounded-md border border-slate-300 bg-white p-1.5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  size: PropTypes.number.isRequired,
  totalElements: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onSizeChange: PropTypes.func.isRequired,
}
