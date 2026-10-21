import api from './api'

export const interactionService = {
  // status: "VOY_A_IR" "YA_FUI"
  setAttendance: (concertId, status) =>
    api.post('/user-interactions/attendance', { concertId, status }).then((res) => res.data),

  // Mi estado frente a un concierto: { attendanceStatus: 'VOY_A_IR' | 'YA_FUI' | null, reviewed }
  concertInteraction: (concertId, signal) =>
    api.get(`/user-interactions/concerts/${concertId}`, { signal }).then((res) => res.data),

  // Favoritos (idempotentes: repetir la llamada no da error)
  addFavorite: (concertId) => api.put(`/user-interactions/favorites/${concertId}`).then((res) => res.data),
  removeFavorite: (concertId) => api.delete(`/user-interactions/favorites/${concertId}`).then((res) => res.data),

  // review: { concertId, rating (1-5), comment }
  createReview: (review) => api.post('/user-interactions/reviews', review).then((res) => res.data),

  // Historial con datos del concierto, paginado. params: { status, page, size, sort }
  myConcerts: (params, signal) =>
    api.get('/user-interactions/my-concerts', { params, signal }).then((res) => res.data),
}
