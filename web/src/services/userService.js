import api from './api'

export const userService = {
  // data: { name, country, city, bio }
  updateProfile: (data) => api.put('/users/me', data).then((res) => res.data),

  // Favoritos paginados: { content: [{ addedAt, concert }], page, size, totalElements, totalPages }
  favoriteConcerts: (params, signal) =>
    api.get('/users/me/favorite-concerts', { params, signal }).then((res) => res.data),
}
