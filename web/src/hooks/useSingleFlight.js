import { useCallback, useRef } from 'react'

// Anti doble envío: mientras una acción sigue en curso, las siguientes llamadas se ignoran.
// Usa una ref (no estado) para cubrir también dos clics que ocurren antes de que React vuelva a renderizar.
export function useSingleFlight() {
  const running = useRef(false)

  return useCallback(async (task) => {
    if (running.current) return undefined
    running.current = true
    try {
      return await task()
    } finally {
      running.current = false
    }
  }, [])
}
