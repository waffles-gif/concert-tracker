import api from './api'

export const concertService = {
  // GET /concerts/search -> { content, page, size, totalElements, totalPages } (page empieza en 0)
  // Filtros: artist, country, city, date (YYYY-MM-DD), upcoming (true/false), sort, page, size
  search: (params, signal) => api.get('/concerts/search', { params, signal }).then((res) => res.data),

  // GET /concerts/{id} -> detalle con artista y venue
  findById: (id, signal) => api.get(`/concerts/${id}`, { signal }).then((res) => res.data),
}
