import api from './api'

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials).then((res) => res.data),

  register: (data) => api.post('/auth/register', data).then((res) => res.data),

  refresh: (refreshToken) =>
    api.post('/auth/refresh', null, { params: { refreshToken }, skipGlobalError: true }).then((res) => res.data),
}
