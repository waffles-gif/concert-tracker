import api from './api'

export const concertService = {
  // Respuesta:  content, page, size, totalElements, totalPages //(page empieza en 0)
  search: (params, signal) => api.get('/concerts/search', { params, signal }).then((res) => res.data),

  getById: (id, signal) => api.get(`/concerts/${id}`, { signal }).then((res) => res.data),

  // Reseñas públicas del concierto, paginadas (más recientes primero)
  getReviews: (id, params, signal) =>
    api.get(`/concerts/${id}/reviews`, { params, signal }).then((res) => res.data),
}
