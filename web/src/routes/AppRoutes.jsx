import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import PrivateRoute from '../components/PrivateRoute'

// Cada página se descarga solo cuando se visita (code splitting).
const HomePage = lazy(() => import('../pages/HomePage'))
const ConcertsPage = lazy(() => import('../pages/ConcertsPage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const RegisterPage = lazy(() => import('../pages/RegisterPage'))
const ProfilePage = lazy(() => import('../pages/ProfilePage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="conciertos" element={<ConcertsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="perfil" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
