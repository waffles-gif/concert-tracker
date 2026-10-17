import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import FormField from '../components/FormField'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/apiError'

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState(null)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', country: '', city: '' },
  })

  const onSubmit = async (values) => {
    setServerError(null)
    try {
      await registerUser({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        country: values.country.trim() || null,
        city: values.city.trim() || null,
      })
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error))
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <p className="mt-1 text-sm text-slate-500">Es gratis y toma menos de un minuto.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <FormField
          label="Nombre"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name', {
            required: 'El nombre es obligatorio',
            maxLength: { value: 100, message: 'El nombre no puede superar los 100 caracteres' },
          })}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'El email es obligatorio',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'El email no tiene un formato válido' },
          })}
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'La contraseña es obligatoria',
            minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
          })}
        />
        <FormField
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Confirma tu contraseña',
            validate: (value) => value === getValues('password') || 'Las contraseñas no coinciden',
          })}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="País (opcional)" autoComplete="country-name" {...register('country')} />
          <FormField label="Ciudad (opcional)" autoComplete="address-level2" {...register('city')} />
        </div>

        {serverError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creando cuenta…' : 'Registrarme'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
