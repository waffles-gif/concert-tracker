import api from './api'

export const userService = {
  // GET /users/me -> { id, name, email, role, country, city, createdAt }
  me: () => api.get('/users/me').then((res) => res.data),

  // GET /users/me/follows -> [{ artistId, name, country, imageUrl, followedAt }]
  follows: () => api.get('/users/me/follows').then((res) => res.data),
}
