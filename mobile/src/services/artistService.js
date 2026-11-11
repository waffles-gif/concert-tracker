import api from './api'

// Catálogo público de artistas y géneros (no necesita token, pero el cliente lo manda igual).
export const artistService = {
  // GET /artists -> paginado; cada artista trae { id, name, country, description, imageUrl, genres: [{ id, name }] }
  // params: { genreId?, page, size }
  list: (params, signal) =>
    api.get('/artists', { params: { sort: 'name,asc', ...params }, signal }).then((res) => res.data),

  // GET /artists/{id} -> { id, name, country, description, imageUrl, genres }
  getById: (id, signal) => api.get(`/artists/${id}`, { signal }).then((res) => res.data),

  // GET /artists/{id}/concerts -> lista (sin paginar) con todos los conciertos del artista
  concerts: (id, signal) => api.get(`/artists/${id}/concerts`, { signal }).then((res) => res.data),

  // GET /genres -> [{ id, name }]
  genres: (signal) => api.get('/genres', { signal }).then((res) => res.data),
}
