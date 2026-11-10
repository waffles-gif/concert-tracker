import api from './api'

export const reviewService = {
  // GET /reviews/recent -> paginado; { id, rating, comment, createdAt, userName, concertId, concertTitle, artistName }
  recent: (params, signal) => api.get('/reviews/recent', { params, signal }).then((res) => res.data),
}
