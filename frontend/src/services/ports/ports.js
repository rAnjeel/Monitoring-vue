import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
})

export async function getPorts() {
  try {
    console.log('[GetPorts] Début de la récupération des ports...')
    const response = await api.get('/ports')
    console.log('[GetPorts] Succès:', {
      status: response.status,
      count: Array.isArray(response.data) ? response.data.length : (response.data && response.data.data ? response.data.data.length : undefined)
    })
    return response.data
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    console.error('[GetPorts] Erreur lors de la récupération:', message)
    throw new Error(`Impossible de charger les ports: ${message}`)
  }
}

export async function getPort(id) {
  return api.get(`/ports/${id}`)
}

export function createPort(port) {
  return api.post('/ports', port)
}


