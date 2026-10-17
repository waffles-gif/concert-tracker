import api from './api'

export const concertService = {
  // Respuesta: { content, page, size, totalElements, totalPages } (page empieza en 0)
  search: (params, signal) => api.get('/concerts/search', { params, signal }).then((res) => res.data),
}
