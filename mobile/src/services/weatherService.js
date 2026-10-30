import axios from 'axios'

// Open-Meteo es gratis y no pide API key. Usamos un cliente aparte de `api` para no mandarle el token.
const http = axios.create({ timeout: 10000 })

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'

// El pronóstico llega hasta 15 días adelante y guarda unos 3 meses hacia atrás;
// para fechas más antiguas usamos el histórico.
const MAX_FORECAST_DAYS = 15
const MAX_FORECAST_PAST_DAYS = 60

const DAY_MS = 24 * 60 * 60 * 1000

// Las coordenadas de una ciudad no cambian, así que las guardamos mientras la app está abierta.
const coordsCache = new Map()

const normalize = (text) =>
  (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

async function findCoords(city, country, signal) {
  const key = `${normalize(city)}|${normalize(country)}`
  if (coordsCache.has(key)) return coordsCache.get(key)

  const { data } = await http.get(GEOCODING_URL, { params: { name: city, count: 5, language: 'es' }, signal })
  const results = data?.results ?? []
  // Hay varias "Lima" en el mundo: preferimos la que coincide con el país del venue.
  const match = results.find((r) => normalize(r.country) === normalize(country)) ?? results[0]
  const coords = match ? { latitude: match.latitude, longitude: match.longitude } : null
  coordsCache.set(key, coords)
  return coords
}

// Días entre hoy y la fecha del concierto (YYYY-MM-DD), contando por fecha local.
function daysFromToday(day) {
  const [y, m, d] = day.split('-').map(Number)
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((Date.UTC(y, m - 1, d) - today) / DAY_MS)
}

export const weatherService = {
  // Devuelve { kind: 'forecast' | 'past', code, max, min, rainChance, rainMm }
  // o { kind: 'too-far', daysLeft } / { kind: 'unknown-city' } cuando no hay datos que mostrar.
  forDay: async ({ city, country, date }, signal) => {
    const day = date?.slice(0, 10)
    if (!city || !day) return { kind: 'unknown-city' }

    const diff = daysFromToday(day)
    if (diff > MAX_FORECAST_DAYS) return { kind: 'too-far', daysLeft: diff - MAX_FORECAST_DAYS }

    const coords = await findCoords(city, country, signal)
    if (!coords) return { kind: 'unknown-city' }

    const isPast = diff < 0
    const useArchive = diff < -MAX_FORECAST_PAST_DAYS
    // Para días que ya pasaron importa cuánto llovió; para los que vienen, la probabilidad.
    const daily = `weather_code,temperature_2m_max,temperature_2m_min,${isPast ? 'precipitation_sum' : 'precipitation_probability_max'}`

    const { data } = await http.get(useArchive ? ARCHIVE_URL : FORECAST_URL, {
      params: { ...coords, daily, timezone: 'auto', start_date: day, end_date: day },
      signal,
    })

    const d = data?.daily
    if (!d?.time?.length || d.weather_code?.[0] == null) return { kind: 'unknown-city' }

    return {
      kind: isPast ? 'past' : 'forecast',
      code: d.weather_code[0],
      max: d.temperature_2m_max?.[0],
      min: d.temperature_2m_min?.[0],
      rainChance: d.precipitation_probability_max?.[0] ?? null,
      rainMm: d.precipitation_sum?.[0] ?? null,
    }
  },
}

// Códigos WMO que usa Open-Meteo -> texto e ícono de Ionicons.
export function describeWeather(code) {
  if (code === 0) return { label: 'Despejado', icon: 'sunny-outline' }
  if (code <= 2) return { label: 'Parcialmente nublado', icon: 'partly-sunny-outline' }
  if (code === 3) return { label: 'Nublado', icon: 'cloudy-outline' }
  if (code <= 48) return { label: 'Neblina', icon: 'cloudy-outline' }
  if (code <= 57) return { label: 'Llovizna', icon: 'rainy-outline' }
  if (code <= 67) return { label: 'Lluvia', icon: 'rainy-outline' }
  if (code <= 77) return { label: 'Nieve', icon: 'snow-outline' }
  if (code <= 82) return { label: 'Chubascos', icon: 'rainy-outline' }
  if (code <= 86) return { label: 'Nevadas', icon: 'snow-outline' }
  return { label: 'Tormenta', icon: 'thunderstorm-outline' }
}
