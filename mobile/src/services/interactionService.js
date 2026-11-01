import api from './api'

// Lo que hace el usuario logueado con un concierto o un artista. Todas las rutas requieren token.
export const interactionService = {
  // GET /user-interactions/concerts/{id} -> { attendanceStatus, reviewed, favorite }
  concertStatus: (concertId, signal) =>
    api.get(`/user-interactions/concerts/${concertId}`, { signal }).then((res) => res.data),

  // POST /user-interactions/attendance -> crea o cambia el estado (VOY_A_IR o YA_FUI)
  setAttendance: (concertId, status) =>
    api.post('/user-interactions/attendance', { concertId, status }).then((res) => res.data),

  // POST /user-interactions/reviews -> solo se puede si la asistencia es YA_FUI
  createReview: ({ concertId, rating, comment }) =>
    api.post('/user-interactions/reviews', { concertId, rating, comment }).then((res) => res.data),

  // PUT y DELETE /user-interactions/favorites/{concertId}
  addFavorite: (concertId) => api.put(`/user-interactions/favorites/${concertId}`),
  removeFavorite: (concertId) => api.delete(`/user-interactions/favorites/${concertId}`),

  // POST /user-interactions/follow y DELETE /user-interactions/follow/{artistId}
  followArtist: (artistId) => api.post('/user-interactions/follow', { artistId }).then((res) => res.data),
  unfollowArtist: (artistId) => api.delete(`/user-interactions/follow/${artistId}`),
}
