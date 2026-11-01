import api from './api'

export const reviewService = {
  // Feed público de reseñas recientes: { content: [{ id, rating, comment, createdAt, userName, concertId, concertTitle, artistName }], ... }
  recent: (params, signal) => api.get('/reviews/recent', { params, signal }).then((res) => res.data),
}
