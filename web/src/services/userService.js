import api from './api'

export const userService = {
  // data: { name, country, city, bio }
  updateProfile: (data) => api.put('/users/me', data).then((res) => res.data),

  // Mis reseñas, paginadas: { content: [{ id, rating, comment, createdAt, concertId, concertTitle, artistName }], ... }
  reviews: (params, signal) => api.get('/users/me/reviews', { params, signal }).then((res) => res.data),

  // Artistas que sigo: [{ artistId, name, country, imageUrl, followedAt }], el más reciente primero
  follows: (signal) => api.get('/users/me/follows', { signal }).then((res) => res.data),

  // Favoritos paginados: { content: [{ addedAt, concert }], page, size, totalElements, totalPages }
  favoriteConcerts: (params, signal) =>
    api.get('/users/me/favorite-concerts', { params, signal }).then((res) => res.data),
}
