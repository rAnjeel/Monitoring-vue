import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
})

// Liste paginée avec filtres optionnels
export async function getDeviceEvents({ page = 1, pageSize = 20, device_id, status, start_date, end_date } = {}) {
  try {
    const params = { page, pageSize }
    if (device_id !== undefined && device_id !== null && device_id !== '') params.device_id = device_id
    if (status) params.status = status
    if (start_date) params.start_date = start_date
    if (end_date) params.end_date = end_date

    const response = await api.get('/device-events', { params })

    const rows = Array.isArray(response.data.rows) ? response.data.rows : []
    const totalCount = Number(response.data.totalCount ?? 0)

    return { rows, totalCount, page, pageSize }
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    throw new Error(`Impossible de charger les événements: ${message}`)
  }
}

// Derniers événements (pour dashboard)
export async function getRecentDeviceEvents({ limit = 10, status } = {}) {
  try {
    const params = { limit }
    if (status) params.status = status
    const response = await api.get('/device-events/recent', { params })
    const events = Array.isArray(response.data.events) ? response.data.events : []
    const total = Number(response.data.total ?? 0)
    return { events, total }
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    throw new Error(`Impossible de charger les événements récents: ${message}`)
  }
}

// Événement par ID
export async function getDeviceEvent(id) {
  try {
    const response = await api.get(`/device-events/${id}`)
    return response.data
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    throw new Error(`Impossible de charger l'événement: ${message}`)
  }
}

// Événements d'un device spécifique, paginés + filtres
export async function getDeviceEventsByDeviceId(deviceId, { page, pageSize, status, start_date, end_date } = {}) {
  try {
    const params = { page, pageSize }
    if (status) params.status = status
    if (start_date) params.start_date = start_date
    if (end_date) params.end_date = end_date
    const response = await api.get(`/device-events/device/${deviceId}`, { params })
    const rows = Array.isArray(response.data.rows) ? response.data.rows : []
    const totalCount = Number(response.data.totalCount ?? 0)
    return { rows, totalCount, page, pageSize }
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    throw new Error(`Impossible de charger les événements du device: ${message}`)
  }
}

// Statistiques pour un device
export async function getDeviceEventStats(deviceId, { days = 30 } = {}) {
  try {
    const params = { days }
    const response = await api.get(`/device-events/device/${deviceId}/stats`, { params })
    return response.data
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    throw new Error(`Impossible de charger les statistiques d'événements: ${message}`)
  }
}


