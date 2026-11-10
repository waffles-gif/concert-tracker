import api from './api'

export const userService = {
  // GET /users/me -> { id, name, email, role, country, city, bio, createdAt }
  me: () => api.get('/users/me').then((res) => res.data),

  // PUT /users/me -> data: { name, country, city, bio }; devuelve el usuario actualizado
  updateProfile: (data) => api.put('/users/me', data).then((res) => res.data),

  // GET /users/me/follows -> [{ artistId, name, country, imageUrl, followedAt }]
  follows: () => api.get('/users/me/follows').then((res) => res.data),

  // GET /users/me/reviews -> paginado; cada reseña trae { id, rating, comment, createdAt, concertId, concertTitle, artistName }
  reviews: (params, signal) => api.get('/users/me/reviews', { params, signal }).then((res) => res.data),

  // GET /users/me/favorite-concerts -> paginado; cada ítem trae { addedAt, concert }
  favoriteConcerts: (params, signal) =>
    api.get('/users/me/favorite-concerts', { params, signal }).then((res) => res.data),
}
