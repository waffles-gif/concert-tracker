import api from './api'

export const genreService = {
  // Lista de géneros: [{ id, name }]
  list: (signal) => api.get('/genres', { signal }).then((res) => res.data),
}
