// Reglas de react-hook-form que copian las validaciones del backend (UserRegisterRequest / LoginRequest),
// así el usuario ve el error antes de llamar a la API.
export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

export const rules = {
  name: {
    required: 'El nombre es obligatorio',
    maxLength: { value: 100, message: 'El nombre no puede superar los 100 caracteres' },
  },
  email: {
    required: 'El email es obligatorio',
    pattern: { value: EMAIL_PATTERN, message: 'El email no tiene un formato válido' },
  },
  loginPassword: {
    required: 'La contraseña es obligatoria',
  },
  newPassword: {
    required: 'La contraseña es obligatoria',
    minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
  },
}
