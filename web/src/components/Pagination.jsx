import { ChevronLeft, ChevronRight } from 'lucide-react'
import PropTypes from 'prop-types'

const PAGE_SIZES = [10, 25, 50, 100]

// Números de página a mostrar: siempre la primera, la última y las vecinas de la actual; el resto como "…"
// Ejemplo (página 6 de 12): 1 … 5 6 7 … 12
function pageItems(page, totalPages) {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1])
  const numbers = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  return numbers.flatMap((n, index) => (index > 0 && n - numbers[index - 1] > 1 ? ['gap', n] : [n]))
}

const navButtonClass =
  'rounded-md border border-slate-300 bg-white p-1.5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

// `page` es 1-based. Muestra "mostrando X-Y de Z", selector de tamaño y navegación con números de página.
export default function Pagination({ page, size, totalElements, totalPages, onPageChange, onSizeChange }) {
  if (totalElements === 0) return null

  const from = (page - 1) * size + 1
  const to = Math.min(page * size, totalElements)
  const lastPage = Math.max(totalPages, 1)
  // Si la pantalla usa un tamaño que no está en la lista (por ejemplo 12), se agrega para que el selector lo muestre
  const sizeOptions = PAGE_SIZES.includes(size) ? PAGE_SIZES : [...PAGE_SIZES, size].sort((a, b) => a - b)

  return (
    <nav
      aria-label="Paginación"
      className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"
    >
      <p>
        Mostrando{' '}
        <strong>
          {from}-{to}
        </strong>{' '}
        de <strong>{totalElements}</strong>
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          Por página
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
          >
            {sizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
            className={navButtonClass}
          >
            <ChevronLeft size={16} />
          </button>

          {pageItems(page, lastPage).map((item, index) =>
            item === 'gap' ? (
              <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={`min-w-8 rounded-md border px-2 py-1 text-sm font-medium transition ${
                  item === page
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= lastPage}
            aria-label="Página siguiente"
            className={navButtonClass}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </nav>
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
