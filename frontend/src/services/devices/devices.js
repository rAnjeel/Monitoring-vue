import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
})

export async function getDevices() {
  try {
    console.log('[GetDevices] Début de la récupération des devices...')
    const response = await api.get('/devices')
    return response.data
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    console.error('[GetDevices] Erreur lors de la récupération:', message)
    throw new Error(`Impossible de charger les devices: ${message}`)
  }
}

export async function getDevice(id) {
  return api.get(`/devices/${id}`)
}

export function createDevice(device) {
  return api.post('/devices', device)
}