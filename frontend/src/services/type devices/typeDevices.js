import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
})

export async function getTypeDevices() {
  try {
    console.log('[GetTypeDevices] Début de la récupération des types devices...')
    const response = await api.get('/type-devices')
    return response.data
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    console.error('[GetTypeDevices] Erreur lors de la récupération:', message)
    throw new Error(`Impossible de charger les types devices: ${message}`)
  }
}
