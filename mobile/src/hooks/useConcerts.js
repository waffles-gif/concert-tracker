import { concertService } from '../services/concertService'
import { usePagedList } from './usePagedList'

// Lista de conciertos con scroll infinito sobre GET /concerts/search (respuesta paginada).
export function useConcerts(filters) {
  return usePagedList(concertService.search, filters)
}
