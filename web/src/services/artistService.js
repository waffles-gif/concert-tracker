import api from './api'

export const artistService = {
  // Artistas paginados, de la A a la Z: { content: [{ id, name, country, imageUrl, genres }], page, size, ... }
  // params: { genreId?, page, size }
  list: (params, signal) => api.get('/artists', { params: { sort: 'name,asc', ...params }, signal }).then((res) => res.data),

  // Un artista con sus géneros: { id, name, country, description, imageUrl, genres }
  getById: (id, signal) => api.get(`/artists/${id}`, { signal }).then((res) => res.data),

  // Todos los conciertos del artista (próximos y pasados), sin paginar
  concerts: (id, signal) => api.get(`/artists/${id}/concerts`, { signal }).then((res) => res.data),

  // Artistas de un género, paginados
  byGenre: (genreId, params, signal) =>
    api.get('/artists', { params: { genreId, sort: 'name,asc', ...params }, signal }).then((res) => res.data),
}
