// Reglas de react-hook-form que copian las validaciones del backend (UserRegisterRequest / LoginRequest),
// así el usuario ve el error antes de llamar a la API.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// UserUpdateRequest: @Size(max = 300) en la bio.
export const MAX_BIO = 300

// `required` acepta un texto de puros espacios, pero el @NotBlank del backend no.
const notBlank = (message) => (value) => value.trim().length > 0 || message

// El teclado suele agregar un espacio al final del email; al enviar se recorta, así que no es un error.
const validEmail = (value) => EMAIL_PATTERN.test(value.trim()) || 'El email no tiene un formato válido'

export const rules = {
  name: {
    required: 'El nombre es obligatorio',
    maxLength: { value: 100, message: 'El nombre no puede superar los 100 caracteres' },
    validate: notBlank('El nombre es obligatorio'),
  },
  email: {
    required: 'El email es obligatorio',
    maxLength: { value: 255, message: 'El email no puede superar los 255 caracteres' },
    validate: validEmail,
  },
  loginPassword: {
    required: 'La contraseña es obligatoria',
  },
  newPassword: {
    required: 'La contraseña es obligatoria',
    minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
    // BCrypt, con el que el backend guarda la contraseña, no acepta más de 72 bytes.
    maxLength: { value: 72, message: 'La contraseña no puede superar los 72 caracteres' },
    validate: notBlank('La contraseña no puede ser solo espacios'),
  },
  country: {
    maxLength: { value: 100, message: 'Máximo 100 caracteres' },
  },
  city: {
    maxLength: { value: 100, message: 'Máximo 100 caracteres' },
  },
  bio: {
    maxLength: { value: MAX_BIO, message: `La bio no puede superar los ${MAX_BIO} caracteres` },
  },
}
