import { useEffect, useState } from 'react'

// Devuelve `value` solo cuando deja de cambiar durante `delay` ms (para no llamar a la API en cada tecla).
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
