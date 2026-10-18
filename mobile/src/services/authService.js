import api from './api'

// Todas devuelven AuthResponse: { accessToken, refreshToken, tokenType, user }
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials).then((res) => res.data),

  register: (data) => api.post('/auth/register', data).then((res) => res.data),

  refresh: (refreshToken) =>
    api.post('/auth/refresh', null, { params: { refreshToken }, skipGlobalError: true }).then((res) => res.data),
}
